import test from 'node:test';import assert from 'node:assert/strict';
import {parseFamilyDate,normalizeFamilyDate,displayFamilyDate,isoDate,calendarDays} from '../genealogy-dates.js';
import {HOSPITALS,COUNTRIES,normalizeBirthLocation,formatBirthLocation} from '../birth-places.js';
import {normalizeFamily,updatePerson,projectFamily} from '../model.js';
const family=person=>normalizeFamily({version:1,people:[{id:'p',name:'שם',branch:'shared',...person}]});
test('full dates normalize across existing Hebrew, ISO, GEDCOM and day-first numeric formats',()=>{
 for(const input of ['3.2.1984','03/02/1984','1984-02-03','3 בפברואר 1984','3 FEB 1984'])assert.equal(normalizeFamilyDate(input),'1984-02-03');
 assert.equal(displayFamilyDate('1984-02-03'),'03.02.1984');assert.equal(displayFamilyDate('13 במרץ 1907'),'13.03.1907');
});
test('year-only, approximate and ambiguous-century dates retain their information',()=>{
 assert.equal(normalizeFamilyDate('1915?'),'בערך 1915');assert.equal(normalizeFamilyDate('ABT 1915'),'בערך 1915');assert.equal(normalizeFamilyDate('1882'),'1882');assert.equal(normalizeFamilyDate('בערך 3.2.1984'),'בערך 1984-02-03');assert.equal(displayFamilyDate('בערך 1984-02-03'),'בערך 03.02.1984');
 assert.equal(parseFamilyDate('15.5.82').precision,'legacy');assert.equal(normalizeFamilyDate('15.5.82'),'15.5.82');assert.equal(normalizeFamilyDate('BEF 1900'),'BEF 1900');
 const old=family({birthDate:'15.5.82'});assert.equal(updatePerson(old,{...old.people[0],bio:'סיפור'}).people[0].birthDate,'15.5.82');assert.throws(()=>updatePerson(old,{...old.people[0],birthDate:'1.2.83'}),/ארבע ספרות/);
});
test('invalid dates and Gregorian leap-year edge cases cannot silently roll into another month',()=>{
 for(const date of ['31.02.1984','29.02.1900','1984-13-01','0.2.1984'])assert.throws(()=>normalizeFamilyDate(date));
 assert.equal(isoDate(2000,2,29),'2000-02-29');assert.equal(isoDate(1900,2,29),'');assert.equal(isoDate(1,1,1),'0001-01-01');assert.equal(calendarDays(2024,2).filter(Boolean).length,29);assert.equal(calendarDays(1900,2).filter(Boolean).length,28);assert.equal(calendarDays(2024,9)[0],'2024-09-01');
});
test('hospital choice stores stable identifiers and derives its city and country consistently',()=>{
 const location=normalizeBirthLocation({kind:'hospital',hospitalId:'sheba'});assert.equal(location.countryCode,'IL');assert.equal(location.city,'רמת גן');assert.equal(formatBirthLocation(location),'שיבא (תל השומר), רמת גן, ישראל');
 const f=family({birthLocation:location,birthDate:'15.05.1982'});assert.equal(f.people[0].birthDate,'1982-05-15');assert.equal(f.people[0].birthPlace,formatBirthLocation(location));for(const branch of ['tavori','gorsht'])assert.deepEqual(projectFamily(f,branch).people[0].birthLocation,location);
 assert.throws(()=>normalizeBirthLocation({kind:'hospital',hospitalId:'fake'}));assert.equal(new Set(HOSPITALS.map(h=>h.id)).size,HOSPITALS.length);
});
test('international and historic places preserve names without inferring changing borders',()=>{
 const location=normalizeBirthLocation({kind:'abroad',countryCode:'RO',city:"קלוז'",hospitalName:'בית חולים שנמסר'});assert.match(formatBirthLocation(location),/רומניה$/);
 assert.equal(family({birthPlace:"קלוז'"}).people[0].birthPlace,"קלוז'");assert.equal(family({birthPlace:"קלוז'"}).people[0].birthLocation,null);
 assert.equal(formatBirthLocation(normalizeBirthLocation({kind:'other',text:'עיר, מדינה היסטורית'})),'עיר, מדינה היסטורית');assert.throws(()=>normalizeBirthLocation({kind:'abroad',countryCode:'ZZ'}));assert.throws(()=>normalizeBirthLocation({kind:'abroad',countryCode:'RO',city:15}));assert.ok(COUNTRIES.length>240);
});
