// Preview-only adapter. Never import this file into the staging application.
const query=new URLSearchParams(location.search);
const themes=['calm-spa','clean-clinic','modern-boutique'];
document.documentElement.dataset.design=themes.includes(query.get('design'))?query.get('design'):'calm-spa';
const scenario=query.get('scenario')||'normal';
const realFetch=globalThis.fetch.bind(globalThis);
const service={id:'demo-relaxation',name:'Demo Relaxation',category:'REST & RESTORE',minutes:60,price:1400,currency:'MKD',icon:'◌',description:'A fictional relaxation treatment in a quiet studio. A little space to unwind, with a brief consultation before we begin.'};
const today=new Date().toISOString().slice(0,10);
const plus=(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
const business={timezone:'Europe/Skopje',today,lastDate:plus(today,30),profile:'simulated',leadMinutes:1440,bufferBefore:15,bufferAfter:15,horizonDays:30,intervalMinutes:15,syntheticOnly:true};
let records=JSON.parse(localStorage.getItem('kindred-preview-records')||'{}');let attempts=0;
const respond=(d,status=200)=>Promise.resolve(new Response(JSON.stringify(d),{status,headers:{'Content-Type':'application/json'}}));
const save=()=>localStorage.setItem('kindred-preview-records',JSON.stringify(records));
function slots(date){
 if(scenario==='empty'||[0,6].includes(new Date(date+'T12:00Z').getUTCDay())||date<plus(today,2))return [];
 // Illustrative future weekdays, EU UTC offset computed from the chosen date.
 const offset=new Intl.DateTimeFormat('en',{timeZone:'Europe/Skopje',timeZoneName:'shortOffset'}).formatToParts(new Date(date+'T12:00Z')).find(x=>x.type==='timeZoneName').value.includes('+2')?2:1;
 return ['10:15','10:30','11:00','11:30','14:15','15:00','15:45','16:45'].map(label=>({label,startsAt:new Date(date+'T'+label+':00+'+String(offset).padStart(2,'0')+':00').toISOString()}));
}
globalThis.fetch=async(input,options={})=>{
 const url=new URL(String(input),location.origin);if(!url.pathname.startsWith('/api/'))return realFetch(input,options);
 if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
 if(scenario==='loading')await new Promise(r=>setTimeout(r,2500));
 if(url.pathname==='/api/services')return respond({services:scenario==='no-services'?[]:[service],business});
 if(url.pathname==='/api/slots')return scenario==='availability-error'?respond({error:'Preview availability failed. Retry the request.'},503):respond({date:url.searchParams.get('date'),timezone:business.timezone,slots:slots(url.searchParams.get('date'))});
 if(url.pathname==='/api/bookings'&&options.method==='POST'){
  if(scenario==='conflict')return respond({code:'slot_unavailable',error:'This time was just reserved. Choose another time; your details are kept.'},409);
  const payload=JSON.parse(options.body);const key=options.headers['Idempotency-Key'];let entry=Object.values(records).find(x=>x.key===key);
  if(!entry){const id=crypto.randomUUID();entry={key,accessToken:'a'.repeat(64),booking:{id,reference:'PREVIEW-'+id.slice(0,6),status:'confirmed',startsAt:payload.startsAt,endsAt:new Date(Date.parse(payload.startsAt)+3600000).toISOString(),name:payload.name,email:payload.email,timezone:business.timezone,service,price:1400,currency:'MKD'}};records[id]=entry;save();}
  if(scenario==='unresolved'&&!entry.interrupted){entry.interrupted=true;save();throw Error('Simulated interrupted response after preview persistence');}
  return respond({booking:entry.booking,accessToken:entry.accessToken});
 }
 const match=url.pathname.match(/^\/api\/bookings\/([^/]+)(\/cancel)?$/);
 if(match){const entry=records[match[1]];if(!entry)return respond({error:'No preview booking found'},404);if(options.headers?.Authorization!=='Bearer '+entry.accessToken)return respond({error:'Preview authorization failed'},403);
 if(match[2]){if(scenario==='late-cancellation')return respond({booking:entry.booking,ownerRequest:true,message:'Late cancellation request recorded. Your appointment remains reserved until the fictional owner handles it.'},202);entry.booking.status='cancelled';save();}return respond({booking:entry.booking});}
 return respond({error:'Unsupported preview endpoint'},404);
};
