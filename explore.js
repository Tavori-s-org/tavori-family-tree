import {parseFamilyDate,isoDate} from './genealogy-dates.js?v=20261016-10';

export function relationshipPath(people,fromId,toId){
  const byId=new Map(people.map(p=>[p.id,p]));
  if(!byId.has(fromId)||!byId.has(toId))return null;
  const edges=new Map(people.map(p=>[p.id,[]]));
  const add=(a,b,kind)=>{if(edges.has(a)&&edges.has(b))edges.get(a).push({id:b,kind});};
  for(const p of people){for(const id of p.parentIds){add(p.id,id,'parent');add(id,p.id,'child');}}
  for(const p of people)for(const id of p.partnerIds){add(p.id,id,'partner');add(id,p.id,'partner');}
  const queue=[fromId],seen=new Map([[fromId,null]]);
  for(let i=0;i<queue.length&&!seen.has(toId);i++)for(const edge of edges.get(queue[i])){
    if(seen.has(edge.id))continue;seen.set(edge.id,{from:queue[i],kind:edge.kind});queue.push(edge.id);
  }
  if(!seen.has(toId))return null;
  const ids=[toId],steps=[];let current=toId;
  while(current!==fromId){const previous=seen.get(current);steps.unshift({from:previous.from,to:current,kind:previous.kind});ids.unshift(previous.from);current=previous.from;}
  return {ids,steps};
}
export function relationshipSummary(path){
  if(!path)return 'לא נמצא מסלול בקשרים שנרשמו';
  const kinds=path.steps.map(s=>s.kind);
  if(!kinds.length)return 'אותו אדם';
  if(kinds.length===1)return {parent:'הורה',child:'ילד / ילדה',partner:'בן / בת זוג'}[kinds[0]];
  if(kinds.every(k=>k==='parent'))return kinds.length===2?'סבא / סבתא':`קרבה דרך ${kinds.length} דורות של הורים`;
  if(kinds.every(k=>k==='child'))return kinds.length===2?'נכד / נכדה':`קרבה דרך ${kinds.length} דורות של ילדים`;
  if(kinds.join(',')==='parent,child')return 'אחים / אחיות דרך הורה משותף';
  return kinds.includes('partner')?'קשר משפחתי דרך זוגיות':'קשר דרך הורים וילדים';
}
export function dateOrder(raw){
  const d=parseFamilyDate(raw);return d.precision==='date'?d.value:d.precision==='year'?`${d.value}-00-00`:null;
}
export function ageAt(birth,event){
  const b=parseFamilyDate(birth),e=parseFamilyDate(event);
  if(b.precision!=='date'||e.precision!=='date'||b.approximate||e.approximate||e.value<b.value)return null;
  const [by,bm,bd]=b.value.split('-').map(Number),[ey,em,ed]=e.value.split('-').map(Number);
  return ey-by-(em<bm||(em===bm&&ed<bd)?1:0);
}
export function personTimeline(person,people,entries=[]){
  const events=[];
  if(person.birthDate||person.birthPlace)events.push({id:'birth',type:'birth',title:'לידה',date:person.birthDate,location:person.birthPlace});
  for(const child of people.filter(p=>p.parentIds.includes(person.id)&&p.birthDate))events.push({id:`child-${child.id}`,type:'child',title:`לידת ${child.name}`,date:child.birthDate,location:child.birthPlace,personId:child.id});
  if(person.deathDate||person.deathPlace)events.push({id:'death',type:'death',title:'פטירה',date:person.deathDate,location:person.deathPlace});
  for(const entry of entries.filter(e=>e.personIds.includes(person.id)))events.push({id:`entry-${entry.id}`,type:entry.kind,title:entry.title,date:entry.date,location:entry.location,entryId:entry.id});
  return events.map((e,index)=>({...e,index,age:e.type==='birth'?null:ageAt(person.birthDate,e.date),order:dateOrder(e.date)}))
    .sort((a,b)=>a.order===b.order?a.index-b.index:a.order===null?1:b.order===null?-1:a.order.localeCompare(b.order));
}
export function todayInIsrael(now=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const value=type=>parts.find(p=>p.type===type).value;return `${value('year')}-${value('month')}-${value('day')}`;
}
const utcDay=iso=>{const [y,m,d]=iso.split('-').map(Number),date=new Date(0);date.setUTCFullYear(y,m-1,d);date.setUTCHours(0,0,0,0);return date.getTime();};
export function upcomingBirthdays(people,today=todayInIsrael()){
  const current=parseFamilyDate(today);if(current.precision!=='date'||current.approximate)return [];
  const year=Number(current.value.slice(0,4)),result=[];
  for(const person of people){
    const birth=parseFamilyDate(person.birthDate);
    if(person.lifeStatus==='deceased'||person.deathDate||birth.precision!=='date'||birth.approximate||birth.value>current.value)continue;
    const [,month,day]=birth.value.split('-').map(Number);let date='';
    // A 29 February birthday remains on its recorded date; do not choose another day for the family.
    for(let y=year;y<=Math.min(year+8,9999);y++){const candidate=isoDate(y,month,day);if(candidate&&candidate>=current.value){date=candidate;break;}}
    if(!date)continue;result.push({person,date,month,days:Math.round((utcDay(date)-utcDay(current.value))/86400000),age:person.lifeStatus==='living'?ageAt(birth.value,date):null});
  }
  return result.sort((a,b)=>a.days-b.days||a.person.name.localeCompare(b.person.name,'he'));
}
export function matchesQuery(person,query){
  const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0591-\u05c7]/g,'').toLocaleLowerCase('he').replace(/\s+/g,' ').trim();
  const text=normalize([person.name,person.maidenName,person.alternateNames,person.birthPlace,person.residence,person.occupation].filter(Boolean).join(' '));
  return normalize(query).split(' ').every(part=>text.includes(part));
}
export function filterPeople(people,{query='',status='all',photo='all',sort='name'}={}){
  const result=people.filter(p=>matchesQuery(p,query)&&(status==='all'||p.lifeStatus===status)&&(photo==='all'||(photo==='with'?Boolean(p.photo):!p.photo)));
  return result.sort((a,b)=>{
    if(sort==='birth'){const da=dateOrder(a.birthDate),db=dateOrder(b.birthDate);if(da!==db)return da===null?1:db===null?-1:da.localeCompare(db);}
    return a.name.localeCompare(b.name,'he');
  });
}
