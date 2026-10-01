import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { createPool, migrate } from '../server/db.js';
import { createApp } from '../server/app.js';

test('real PostgreSQL booking API: persistence, concurrency, retries, protection and cleanup',async t=>{
  const pool=createPool();await migrate(pool);
  const app=createApp({pool,tokenSecret:process.env.BOOKING_TOKEN_SECRET,rateLimit:10000});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.on('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}`, created=[];
  const call=async(path,options={})=>{const r=await fetch(base+path,{...options,headers:{'Content-Type':'application/json',...options.headers}});return {status:r.status,body:await r.json(),headers:r.headers};};
  const post=(payload,key=randomUUID())=>call('/api/bookings',{method:'POST',headers:{'Idempotency-Key':key},body:JSON.stringify(payload)});
  const remember=result=>{if(result.body.booking && !created.some(x=>x.id===result.body.booking.id))created.push({id:result.body.booking.id,token:result.body.accessToken});return result;};
  try {
    const services=await call('/api/services');assert.equal(services.status,200);assert.equal(services.body.services.length,3);
    assert.equal(services.headers.get('cache-control'),'no-store');
    let available,date;
    for(let i=15;i<30;i++) {
      date=DateTime.fromISO(services.body.business.today).plus({days:i}).toISODate();
      available=(await call(`/api/slots?serviceId=reset&date=${date}`)).body.slots;
      if(available?.length>10)break;
    }
    assert.ok(available?.length>10);
    const payload={serviceId:'reset',startsAt:available[0].startsAt,name:'API Test',email:'api@example.com',note:'Invented integration test'};
    let first,key=randomUUID();
    await t.test('simultaneous identical retries produce one booking and stable access token',async()=>{
      const results=await Promise.all([post(payload,key),post(payload,key)]);results.forEach(remember);
      assert.deepEqual(results.map(r=>r.status).sort(),[200,201]);
      assert.equal(results[0].body.booking.id,results[1].body.booking.id);
      assert.equal(results[0].body.accessToken,results[1].body.accessToken);first=results[0];
      const count=await pool.query('SELECT count(*)::int AS n FROM bookings WHERE idempotency_key=$1',[key]);assert.equal(count.rows[0].n,1);
    });
    await t.test('key reuse with changed payload rejected',async()=>assert.equal((await post({...payload,name:'Changed'},key)).status,409));
    await t.test('booking survives new application instance; unauthorized lookup denied',async()=>{
      assert.equal((await call(`/api/bookings/${first.body.booking.id}`)).status,404);
      assert.equal((await call(`/api/bookings/${first.body.booking.id}`,{headers:{Authorization:'Bearer invalid'}})).status,404);
      const second=createApp({pool,tokenSecret:process.env.BOOKING_TOKEN_SECRET});const listener=second.listen(0,'127.0.0.1');await new Promise(r=>listener.on('listening',r));
      try {const r=await fetch(`http://127.0.0.1:${listener.address().port}/api/bookings/${first.body.booking.id}`,{headers:{Authorization:`Bearer ${first.body.accessToken}`}});assert.equal(r.status,200);assert.equal((await r.json()).booking.reference,first.body.booking.reference);}
      finally {second.locals.stopRateLimiter();await new Promise(r=>listener.close(r));}
    });
    await t.test('separate overlapping requests cannot both book',async()=>{
      const requests=[{...payload,startsAt:available[8].startsAt},{...payload,serviceId:'glow',startsAt:available[9].startsAt}];
      const results=await Promise.all(requests.map(p=>post(p)));results.forEach(remember);
      assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
    });
    await t.test('database exclusion constraint also protects direct inserts',async()=>{
      const id=randomUUID();
      await assert.rejects(pool.query(`INSERT INTO bookings(id,reference,service_id,resource_id,starts_at,ends_at,price_cents,currency,name,email,idempotency_key,request_hash,access_token_hash)
        SELECT $1::uuid,$1::text,service_id,resource_id,starts_at,ends_at,price_cents,currency,name,email,$2,'test','test' FROM bookings WHERE id=$3`,[id,randomUUID(),first.body.booking.id]),{code:'23P01'});
    });
    await t.test('server rejects invalid dates, past/off-grid times, data, real email and external browser origin',async()=>{
      assert.equal((await call('/api/slots?serviceId=reset&date=2026-02-30')).status,400);
      assert.equal((await call('/api/slots?serviceId=missing&date='+date)).status,400);
      for(const changed of [{name:''},{email:'invalid'},{email:'person@gmail.com'},{note:'x'.repeat(1001)},{startsAt:'2000-01-01T09:00:00Z'}])assert.ok((await post({...payload,...changed})).status>=400);
      const offGrid=DateTime.fromISO(available[16].startsAt).plus({minutes:1}).toUTC().toISO();assert.equal((await post({...payload,startsAt:offGrid})).status,409);
      assert.equal((await call('/api/bookings',{method:'POST',headers:{Origin:'https://other.example'},body:'{}'})).status,403);
    });
    await t.test('cancellation is authorized, repeatable and releases capacity',async()=>{
      const id=first.body.booking.id;
      assert.equal((await call(`/api/bookings/${id}/cancel`,{method:'POST',body:'{}'})).status,404);
      for(let i=0;i<2;i++){const r=await call(`/api/bookings/${id}/cancel`,{method:'POST',headers:{Authorization:`Bearer ${first.body.accessToken}`},body:'{}'});assert.equal(r.status,200);assert.equal(r.body.booking.status,'cancelled');}
      const slots=(await call(`/api/slots?serviceId=reset&date=${date}`)).body.slots;assert.ok(slots.some(s=>s.startsAt===available[0].startsAt));
      const replay=await post(payload,key);assert.equal(replay.status,200);assert.equal(replay.body.booking.status,'cancelled');
    });
    await t.test('rate limiter rejects repeated requests',async()=>{
      const limited=createApp({pool,tokenSecret:process.env.BOOKING_TOKEN_SECRET,rateLimit:2});const listener=limited.listen(0,'127.0.0.1');await new Promise(r=>listener.on('listening',r));
      try {for(let i=0;i<3;i++){const r=await fetch(`http://127.0.0.1:${listener.address().port}/api/services`);assert.equal(r.status,i===2?429:200);}}
      finally {limited.locals.stopRateLimiter();await new Promise(r=>listener.close(r));}
    });
  } finally {
    // Only IDs created by this test are removed; other staged bookings are untouched.
    for(const record of created)await pool.query('DELETE FROM bookings WHERE id=$1',[record.id]);
    app.locals.stopRateLimiter();await new Promise(r=>server.close(r));await pool.end();
  }
});
