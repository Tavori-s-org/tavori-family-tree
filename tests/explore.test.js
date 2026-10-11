import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {normalizeFamily} from '../model.js';
import {relationshipPath,relationshipSummary,ageAt,personTimeline,upcomingBirthdays,todayInIsrael,filterPeople} from '../explore.js';
const family=()=>normalizeFamily(JSON.parse(fs.readFileSync(new URL('../data/family.json',import.meta.url))));
const person=(id,extra={})=>({id,name:id,parentIds:[],partnerIds:[],lifeStatus:'living',...extra});
test('relationship paths traverse actual parent and partner links across both branches',()=>{
  const people=family().people,copy=JSON.stringify(people),path=relationshipPath(people,'omer','leon');
  assert.deepEqual(path.ids,['omer','maya','leon']);assert.deepEqual(path.steps.map(s=>s.kind),['partner','parent']);
  assert.equal(relationshipSummary(path),'קשר משפחתי דרך זוגיות');assert.equal(JSON.stringify(people),copy);
  assert.equal(relationshipSummary(relationshipPath(people,'omer','simcha')),'סבא / סבתא');
  assert.equal(relationshipSummary(relationshipPath(people,'omer','shachar-tavori')),'אחים / אחיות דרך הורה משותף');
  assert.equal(relationshipSummary(relationshipPath(people,'amichai','yonatan')),'נכד / נכדה');
});
test('paths use IDs for duplicate names and handle disconnected people, empty graphs and cycles',()=>{
  const people=family().people;
  assert.notDeepEqual(relationshipPath(people,'omer','ron-shachar-revital').ids,relationshipPath(people,'omer','ron-tal-shachar').ids);
  assert.equal(relationshipPath(people,'omer','missing'),null);assert.equal(relationshipPath([], 'x','y'),null);
  assert.equal(relationshipPath([person('a'),person('b')],'a','b'),null);
  assert.deepEqual(relationshipPath([person('a',{partnerIds:['b']}),person('b',{partnerIds:['a','c']}),person('c',{partnerIds:['a']})],'a','c').ids,['a','c']);
  assert.equal(relationshipSummary(relationshipPath(people,'omer','omer')),'אותו אדם');
});
test('age calculations honor the day of birth and preserve uncertainty instead of guessing',()=>{
  assert.equal(ageAt('1982-05-15','2026-05-14'),43);assert.equal(ageAt('1982-05-15','2026-05-15'),44);
  for(const birth of ['1982','בערך 1982-05-15','15.5.82',''])assert.equal(ageAt(birth,'2026-05-15'),null);
  assert.equal(ageAt('1982-05-15','בערך 2026-05-15'),null);assert.equal(ageAt('1982-05-15','1980-01-01'),null);
});
test('personal timeline combines life events, child births and linked memories in date order',()=>{
  const parent=person('parent',{birthDate:'1982-05-15'}),child=person('child',{parentIds:['parent'],birthDate:'2010-04-02'});
  const entries=[{id:'unrelated',title:'unrelated',kind:'memory',date:'1900',personIds:[]},{id:'known',title:'זיכרון',kind:'memory',date:'2000',personIds:['parent']},{id:'undated',title:'בלי תאריך',kind:'memory',date:'',personIds:['parent']}];
  const events=personTimeline(parent,[parent,child],entries);assert.deepEqual(events.map(e=>e.id),['birth','entry-known','child-child','entry-undated']);
  assert.equal(events[2].age,27);assert.equal(events[1].age,null);assert.equal(events[3].order,null);
});
test('upcoming birthdays cross the year boundary and exclude incomplete, approximate and deceased records',()=>{
  const people=[person('today',{birthDate:'2000-12-31'}),person('next',{birthDate:'2000-01-01'}),person('year',{birthDate:'2000'}),person('approx',{birthDate:'בערך 2000-01-01'}),person('dead',{birthDate:'2000-01-01',lifeStatus:'deceased'}),person('death',{birthDate:'2000-01-01',deathDate:'2020'}),person('future',{birthDate:'2030-01-01'})];
  const result=upcomingBirthdays(people,'2026-12-31');assert.deepEqual(result.map(b=>b.person.id),['today','next']);
  assert.equal(result[0].days,0);assert.equal(result[0].age,26);assert.equal(result[1].date,'2027-01-01');assert.equal(result[1].days,1);
});
test('29 February birthdays remain on a valid leap day and unknown life status does not imply an age',()=>{
  const result=upcomingBirthdays([person('leap',{birthDate:'2000-02-29'}),person('unknown',{birthDate:'2000-03-01',lifeStatus:'unknown'})],'2026-02-28');
  assert.equal(result[0].person.id,'unknown');assert.equal(result[0].days,1);assert.equal(result[0].age,null);
  assert.equal(result[1].date,'2028-02-29');assert.equal(result[1].age,28);
});
test('calendar today follows Israel time around UTC midnight, independently of the host timezone',()=>{
  assert.equal(todayInIsrael(new Date('2026-10-11T22:30:00Z')),'2026-10-12');
  assert.equal(todayInIsrael(new Date('2026-01-11T21:30:00Z')),'2026-01-11');
});
test('directory filters combine Hebrew search, status and photos while keeping unknown birth dates last',()=>{
  const people=[person('a',{name:'עוֹמר תבורי',birthDate:'1982-05-15',photo:'image'}),person('b',{name:'לאה',maidenName:'רזניק',birthDate:'1915?',lifeStatus:'deceased'}),person('c',{name:'עידן',birthDate:''})],copy=JSON.stringify(people);
  assert.deepEqual(filterPeople(people,{query:'עומר',photo:'with',status:'living'}).map(p=>p.id),['a']);
  assert.deepEqual(filterPeople(people,{query:'רזניק'}).map(p=>p.id),['b']);
  assert.deepEqual(filterPeople(people,{sort:'birth'}).map(p=>p.id),['b','a','c']);assert.equal(JSON.stringify(people),copy);
});
