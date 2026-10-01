import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { candidates, validDate, excludeBusy, dateBounds } from '../server/calendar.js';
const zone='Europe/Skopje', now=DateTime.fromISO('2026-10-01T12:00:00Z');
test('validates real dates and rolling horizon in the business timezone',()=>{
  assert.equal(validDate('2026-10-02',zone,now),true);
  for(const date of ['2026-02-30','2026-09-30','2026-11-01','not-a-date'])assert.equal(validDate(date,zone,now),false);
  assert.equal(dateBounds(zone,DateTime.fromISO('2026-10-01T23:30:00Z')).today,'2026-10-02');
});
test('slots respect duration, opening hours, lead time and unavailable day',()=>{
  const hours={opens:'09:00:00',closes:'18:00:00'};
  const slots=candidates('2026-10-02',zone,hours,60,now);
  assert.equal(slots[0].label,'09:00');assert.equal(slots.at(-1).label,'17:00');
  assert.equal(slots[0].startsAt,'2026-10-02T07:00:00.000Z');
  assert.equal(candidates('2026-10-02',zone,null,60,now).length,0);
  const sameDay=candidates('2026-10-01',zone,hours,30,now);
  assert.equal(sameDay[0].label,'14:30');
});
test('winter offset changes UTC instant while keeping local opening time',()=>{
  const hours={opens:'09:00',closes:'10:00'};
  const winter=candidates('2026-10-26',zone,hours,30,now);
  assert.equal(winter[0].startsAt,'2026-10-26T08:00:00.000Z');
});
test('nonexistent and ambiguous DST times are skipped',()=>{
  const springNow=DateTime.fromISO('2026-03-01T00:00:00Z');
  const spring=candidates('2026-03-29',zone,{opens:'01:00',closes:'04:00'},30,springNow);
  assert.ok(spring.every(s=>!s.label.startsWith('02:')));
  const autumn=candidates('2026-10-25',zone,{opens:'01:00',closes:'04:00'},30,now);
  assert.ok(autumn.every(s=>!s.label.startsWith('02:')));
});
test('adjacent ranges allowed, overlapping durations removed',()=>{
  const slots=candidates('2026-10-02',zone,{opens:'09:00',closes:'11:00'},60,now);
  const result=excludeBusy(slots,[{starts_at:'2026-10-02T08:00:00Z',ends_at:'2026-10-02T08:30:00Z'}]);
  assert.deepEqual(result.map(s=>s.label),['09:00']);
});
