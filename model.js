import {parseFamilyDate,normalizeFamilyDate} from './genealogy-dates.js?v=20261016-9';
import {normalizeBirthLocation,formatBirthLocation} from './birth-places.js?v=20261016-9';
export const BRANCH_NAMES = {tavori:'משפחת תבורי',gorsht:'משפחת גורשט',shared:'ענף משותף',other:'ענף נוסף'};
export const SOURCE_URL = 'https://www.myheritage.co.il/family-trees/tavorifamily/OYYV7WMCSUUHNRKZSIVMAJKW4PATMJI';
const TEXT_FIELDS = ['name','maidenName','birthDate','birthPlace','deathDate','residence','occupation','bio','sourceNote','alternateNames','deathPlace','burialPlace','nationality','education','languages','militaryService','migration'];
export function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export const PHOTO_ORIGIN = 'https://tavori-family-editor.blush-guppy-7385.chatgpt.site';
export function safePhoto(value){if(typeof value==='string' && value.startsWith(PHOTO_ORIGIN+'/api/photos/') && /^[a-f0-9-]{36}$/.test(value.slice((PHOTO_ORIGIN+'/api/photos/').length)))return value;return typeof value==='string' && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '';}
export function normalizeFamily(input){
  if(!input || input.version!==1 || !Array.isArray(input.people) || input.people.length>5000) throw new Error('קובץ האילן אינו תקין או מכיל יותר מ־5,000 אנשים.');
  const ids=new Set();
  const people=input.people.map(raw=>{
    if(!raw || typeof raw.id!=='string' || !/^[\w-]{1,100}$/.test(raw.id) || ids.has(raw.id))throw new Error('מזהה חסר, כפול או לא תקין.');
    ids.add(raw.id);
    const person={id:raw.id,branch:raw.branch in BRANCH_NAMES ? raw.branch : 'other',parentIds:[],partnerIds:[],lifeStatus:['unknown','living','deceased'].includes(raw.lifeStatus)?raw.lifeStatus:'unknown'};
    for(const field of TEXT_FIELDS){if(raw[field]!==undefined && typeof raw[field]!=='string')throw new Error('שדה טקסט לא תקין.');person[field]=(raw[field]||'').trim();if(person[field].length>(field==='bio'?20000:field==='sourceNote'?2000:200))throw new Error('אחד משדות הטקסט ארוך מדי.');}
    if(!person.name)throw new Error('יש לתת שם לכל אדם.');
    person.birthDate=normalizeFamilyDate(person.birthDate);person.birthLocation=normalizeBirthLocation(raw.birthLocation);
    if(person.birthLocation){person.birthPlace=formatBirthLocation(person.birthLocation);if(person.birthPlace.length>200)throw new Error('מקום הלידה ארוך מדי.');}
    for(const field of ['parentIds','partnerIds']){
      if(raw[field]!==undefined && (!Array.isArray(raw[field]) || raw[field].some(id=>typeof id!=='string')))throw new Error('רשימת קשרים אינה תקינה.');
      person[field]=[...new Set(raw[field]||[])];
      if(person[field].includes(person.id))throw new Error('אדם לא יכול להיות הורה או בן זוג של עצמו.');
    }
    if(raw.photo && !safePhoto(raw.photo))throw new Error('פורמט תמונה לא נתמך. יש להשתמש בתמונה שהועלתה דרך האתר.');
    person.gender=['unknown','male','female','other'].includes(raw.gender)?raw.gender:'unknown';
    if(raw.facts!==undefined&&(!Array.isArray(raw.facts)||raw.facts.length>40))throw new Error('רשימת הפרטים הנוספים אינה תקינה.');
    person.facts=(raw.facts||[]).map(f=>{if(!f||typeof f.label!=='string'||typeof f.value!=='string'||f.label.length>100||f.value.length>1000)throw new Error('פרט נוסף אינו תקין.');return {label:f.label.trim(),value:f.value.trim()};}).filter(f=>f.label&&f.value);
    person.photo=safePhoto(raw.photo);
    if(raw.photoOriginal&&!safePhoto(raw.photoOriginal))throw new Error('תמונת המקור אינה תקינה.');
    if(raw.photoCrop!==undefined&&raw.photoCrop!==null){const c=raw.photoCrop;if(!c||typeof c!=='object'||![c.x,c.y,c.zoom].every(Number.isFinite)||c.x<0||c.x>1||c.y<0||c.y>1||c.zoom<1||c.zoom>4)throw new Error('נתוני מרכוז התמונה אינם תקינים.');}
    person.photoOriginal=person.photo?safePhoto(raw.photoOriginal):'';
    person.photoCrop=person.photo&&raw.photoCrop?{x:raw.photoCrop.x,y:raw.photoCrop.y,zoom:raw.photoCrop.zoom}:null;
    person.source=raw.source===SOURCE_URL?SOURCE_URL:'';
    return person;
  });
  const byId=new Map(people.map(p=>[p.id,p]));
  for(const person of people){
    for(const id of [...person.parentIds,...person.partnerIds])if(!ids.has(id))throw new Error('קשר משפחתי מפנה לאדם שאינו קיים.');
    for(const id of person.partnerIds){const other=byId.get(id);if(!other.partnerIds.includes(person.id))other.partnerIds.push(person.id);}
  }
  // Kahn's algorithm rejects ancestry cycles without recursive stack limits.
  const indegree=new Map(people.map(p=>[p.id,p.parentIds.length])),children=new Map(people.map(p=>[p.id,[]]));
  for(const p of people)for(const id of p.parentIds)children.get(id).push(p.id);
  const ready=people.filter(p=>!p.parentIds.length).map(p=>p.id);let count=0;
  for(let i=0;i<ready.length;i++){count++;for(const child of children.get(ready[i])){indegree.set(child,indegree.get(child)-1);if(!indegree.get(child))ready.push(child);}}
  if(count!==people.length)throw new Error('קשר ההורים יוצר מעגל באילן. בדקו את ההורים שנבחרו.');
  if(input.entries!==undefined&&(!Array.isArray(input.entries)||input.entries.length>5000))throw new Error('רשימת הזיכרונות והאירועים אינה תקינה.');
  const entryIds=new Set();const entries=(input.entries||[]).map(raw=>{const entry=normalizeEntry(raw,people);if(entryIds.has(entry.id))throw new Error('מזהה אירוע כפול.');entryIds.add(entry.id);return entry;});
  return {version:1,entries,title:typeof input.title==='string'?input.title.slice(0,200):'הסיפור המשפחתי שלנו',subtitle:typeof input.subtitle==='string'?input.subtitle.slice(0,200):'משפחות תבורי וגורשט',rootId:ids.has(input.rootId)?input.rootId:(people[0]?.id||''),people};
}
export function updatePerson(family,person){
  const copy=structuredClone(family);const old=copy.people.find(p=>p.id===person.id);
  if(parseFamilyDate(person.birthDate||'').precision==='legacy'&&(person.birthDate||'')!==(old?.birthDate||''))throw new Error('יש להזין תאריך לידה מלא עם שנה בארבע ספרות, או שנה בלבד.');
  for(const other of copy.people){other.partnerIds=other.partnerIds.filter(id=>id!==person.id);}
  const index=copy.people.findIndex(p=>p.id===person.id);
  if(index>=0)copy.people[index]=person;else copy.people.push(person);
  for(const partnerId of person.partnerIds){const other=copy.people.find(p=>p.id===partnerId);if(other&&!other.partnerIds.includes(person.id))other.partnerIds.push(person.id);}
  if(!old&&!copy.rootId)copy.rootId=person.id;
  return normalizeFamily(copy);
}
export function projectFamily(family,branch){
  if(!['tavori','gorsht'].includes(branch))throw new Error('ענף משפחתי לא נתמך.');
  const members=family.people.filter(p=>p.branch===branch||p.branch==='shared');
  const ids=new Set(members.map(p=>p.id));
  // Keep direct spouses at the family boundary, without bringing their other branch.
  for(const person of members)for(const id of person.partnerIds)ids.add(id);
  const people=family.people.filter(p=>ids.has(p.id)).map(p=>({...p,parentIds:p.parentIds.filter(id=>ids.has(id)),partnerIds:p.partnerIds.filter(id=>ids.has(id))}));
  const preferredRoot=branch==='tavori'?'omer':'maya';
  const rootId=people.find(p=>p.id===preferredRoot&&p.branch===branch)?.id||people.find(p=>p.branch===branch)?.id||people[0]?.id||'';
  return {...family,rootId,people,entries:(family.entries||[]).filter(e=>e.branch===branch||e.branch==='shared')};
}
export function layoutTree(people){
  const byId=new Map(people.map(p=>[p.id,p])),children=new Map(people.map(p=>[p.id,[]]));
  const pending=new Map(people.map(p=>[p.id,p.parentIds.filter(id=>byId.has(id)).length]));
  for(const p of people)for(const id of p.parentIds)if(children.has(id))children.get(id).push(p.id);
  const levels=new Map(people.map(p=>[p.id,0]));const queue=people.filter(p=>!pending.get(p.id)).map(p=>p.id);
  for(let i=0;i<queue.length;i++)for(const id of children.get(queue[i])){levels.set(id,Math.max(levels.get(id),levels.get(queue[i])+1));pending.set(id,pending.get(id)-1);if(!pending.get(id))queue.push(id);}
  // Couples share a row even when their recorded ancestry has unequal depth.
  const groups=new Map(people.map(p=>[p.id,p.id]));
  const find=id=>{let current=id;while(groups.get(current)!==current)current=groups.get(current);return current;};
  for(const p of people)for(const id of p.partnerIds)if(byId.has(id))groups.set(find(id),find(p.id));
  for(const siblings of children.values())if(siblings.length>1)for(const id of siblings.slice(1))groups.set(find(id),find(siblings[0]));
  const groupIds=[...new Set(people.map(p=>find(p.id)))],parents=new Map(groupIds.map(id=>[id,new Set()])),groupChildren=new Map(groupIds.map(id=>[id,new Set()]));
  for(const p of people)for(const id of p.parentIds)if(byId.has(id)){parents.get(find(p.id)).add(find(id));groupChildren.get(find(id)).add(find(p.id));}
  const degrees=new Map(groupIds.map(id=>[id,parents.get(id).size])),groupLevels=new Map(groupIds.map(id=>[id,0]));const order=groupIds.filter(id=>!degrees.get(id));
  for(let i=0;i<order.length;i++)for(const id of groupChildren.get(order[i])){groupLevels.set(id,Math.max(groupLevels.get(id),groupLevels.get(order[i])+1));degrees.set(id,degrees.get(id)-1);if(!degrees.get(id))order.push(id);}
  // Unusual cross-generation unions may prevent equal rows; preserve parent order.
  if(order.length===groupIds.length){
    for(const id of [...order].reverse()){const descendants=[...groupChildren.get(id)];if(descendants.length)groupLevels.set(id,Math.min(...descendants.map(child=>groupLevels.get(child)))-1);}
    for(const p of people)levels.set(p.id,groupLevels.get(find(p.id)));
  }
  const rows=[];for(const p of people){const level=levels.get(p.id);(rows[level] ||= []).push(p);}
  // Keep partners and siblings together; parent-group order stays stable across generations.
  for(const row of rows.filter(Boolean)){
    row.sort((a,b)=>{const aKey=a.parentIds[0]||a.id,bKey=b.parentIds[0]||b.id;return aKey.localeCompare(bKey);});
    const ordered=[],used=new Set();for(const p of row)if(!used.has(p.id)){ordered.push(p);used.add(p.id);for(const id of p.partnerIds){const spouse=row.find(s=>s.id===id);if(spouse&&!used.has(id)){ordered.push(spouse);used.add(id);}}}row.splice(0,row.length,...ordered);
  }
  const cardWidth=196,cardHeight=264,gap=34,rowHeight=336,padding=68;
  const width=Math.max(650,...rows.filter(Boolean).map(row=>row.length*(cardWidth+gap)-gap+padding*2));
  const height=Math.max(380,rows.length*rowHeight+30),positions=new Map();
  rows.forEach((row,level)=>{if(!row)return;const rowWidth=row.length*(cardWidth+gap)-gap;row.forEach((p,index)=>positions.set(p.id,{x:(width-rowWidth)/2+(row.length-index-1)*(cardWidth+gap),y:42+level*rowHeight,level}));});
  return {width,height,positions,rows,cardWidth,cardHeight,rowHeight};
}
export function generationWindow(layout,focusId,limit='all'){
  const total=layout.rows.length,focusLevel=layout.positions.get(focusId)?.level||0;
  if(limit==='all'||!total)return {min:0,max:Math.max(0,total-1),focusLevel};
  const count=Math.min(total,Math.max(1,Number(limit)||3));
  // Include the person's children and spend the remaining rows on ancestors.
  const min=Math.max(0,Math.min(total-count,focusLevel-(count-2)));
  return {min,max:min+count-1,focusLevel};
}
export function generationLabel(offset,name){
  if(offset===0)return `הדור של ${name}`;
  return ({'-1':'דור ההורים','-2':'דור הסבים והסבתות','1':'דור הילדים','2':'דור הנכדים והנכדות'})[String(offset)]||(offset<0?`${-offset} דורות קודם`:`${offset} דורות אחר כך`);
}
export function treeConnections(people,layout){
  const {positions,cardWidth:w,cardHeight:h}=layout,partners=[],parentLinks=[],families=new Map(),seen=new Set(),byId=new Map(people.map(p=>[p.id,p]));
  for(const person of people){const point=positions.get(person.id);if(!point)continue;
    for(const id of person.partnerIds){const other=positions.get(id),key=[person.id,id].sort().join('|');if(!other||seen.has(key))continue;seen.add(key);
      const left=point.x<other.x?point:other,right=point.x<other.x?other:point;
      const adjacent=left.y===right.y&&right.x-left.x<w*1.3;
      partners.push({ids:[person.id,id],path:adjacent?`M${left.x+w},${left.y+h/2} H${right.x}`:`M${left.x+w/2},${left.y} V${Math.min(left.y,right.y)-14} H${right.x+w/2} V${right.y}`});
    }
    const ids=person.parentIds.filter(id=>positions.has(id)).sort();if(!ids.length)continue;
    const key=ids.join('|');if(!families.has(key))families.set(key,{ids,children:[]});families.get(key).children.push(person.id);
  }
  for(const group of families.values()){
    const parents=group.ids.map(id=>positions.get(id)),children=group.children.map(id=>positions.get(id)),rows=new Map();
    for(const child of children){if(!rows.has(child.y))rows.set(child.y,[]);rows.get(child.y).push(child);}
    const ordered=[...parents].sort((a,b)=>a.x-b.x),couple=parents.length===2&&parents[0].y===parents[1].y&&ordered[1].x-ordered[0].x<w*1.3&&byId.get(group.ids[0]).partnerIds.includes(group.ids[1]);
    for(const [y,row] of rows){const bus=y-28,minX=Math.min(...row.map(p=>p.x+w/2)),maxX=Math.max(...row.map(p=>p.x+w/2));let path='';
      if(couple){const joint=(ordered[0].x+w+ordered[1].x)/2;path+=`M${joint},${parents[0].y+h/2} V${bus} M${Math.min(joint,minX)},${bus} H${Math.max(joint,maxX)} `;}
      else for(const parent of parents){const x=parent.x+w/2;path+=`M${x},${parent.y+h} V${bus} M${Math.min(x,minX)},${bus} H${Math.max(x,maxX)} `;}
      for(const child of row)path+=`M${child.x+w/2},${bus} V${child.y} `;
      parentLinks.push({parentIds:group.ids,childIds:group.children.filter(id=>positions.get(id).y===y),path});
    }
  }
  return {partners,parentLinks};
}
export function parseGedcom(text){
  if(/\n1 CHAR (?:ANSEL|ANSI)/i.test(text))throw new Error('יש לייצא מחדש בקידוד UTF-8 כדי לשמור על השמות בעברית.');
  const root={tag:'ROOT',children:[]},stack=[root];let invalid=0;
  for(const line of text.replace(/^\uFEFF/,'').split(/\r\n|\n|\r/)){
    if(!line.trim())continue;
    const match=line.match(/^(\d+)\s+(?:(@[^@]+@)\s+)?(\S+)(?:\s+(.*))?$/);
    if(!match){invalid++;continue;}
    const level=Number(match[1]);if(level>100||level+1>stack.length)throw new Error('מבנה GEDCOM אינו תקין.');
    const node={xref:match[2]||'',tag:match[3].toUpperCase(),value:match[4]||'',children:[]};
    stack.length=level+1;stack[level].children.push(node);stack.push(node);
  }
  if(invalid)throw new Error('חלק משורות GEDCOM אינן תקינות. הייבוא לא בוצע.');
  const records=root.children,individuals=records.filter(n=>n.tag==='INDI'&&n.xref);
  if(!individuals.length)throw new Error('לא נמצאו אנשים בקובץ GEDCOM.');
  const field=(node,tag)=>node.children.find(c=>c.tag===tag);
  const fullText=node=>{if(!node)return '';let result=node.value;for(const child of node.children){if(child.tag==='CONT')result+='\n'+fullText(child);else if(child.tag==='CONC')result+=fullText(child);}return result;};
  const notes=new Map(records.filter(n=>n.tag==='NOTE'&&n.xref).map(n=>[n.xref,fullText(n)]));
  const refs=new Map(individuals.map((node,index)=>[node.xref,`ged-${index+1}`]));
  const people=individuals.map(node=>{
    const birth=field(node,'BIRT'),death=field(node,'DEAT'),name=field(node,'NAME');
    return {id:refs.get(node.xref),name:fullText(name).replaceAll('/','').trim()||'שם לא צוין',maidenName:'',branch:'other',parentIds:[],partnerIds:[],birthDate:fullText(birth&&field(birth,'DATE')),birthPlace:fullText(birth&&field(birth,'PLAC')),deathDate:fullText(death&&field(death,'DATE')),lifeStatus:death&&death.value!=='N'?'deceased':'unknown',occupation:fullText(field(node,'OCCU')),bio:node.children.filter(n=>n.tag==='NOTE').map(n=>notes.get(n.value)||fullText(n)).join('\n\n'),sourceNote:'ייבוא GEDCOM: מידע חלקי. יש לבדוק את הפרטים מול קובץ המקור.'};
  });
  const byId=new Map(people.map(p=>[p.id,p]));let missingRefs=0;
  for(const family of records.filter(n=>n.tag==='FAM')){
    const partners=family.children.filter(n=>['HUSB','WIFE'].includes(n.tag)).map(n=>refs.get(n.value));
    missingRefs+=partners.filter(id=>!id).length;const existing=partners.filter(Boolean);
    for(const id of existing)byId.get(id).partnerIds.push(...existing.filter(other=>other!==id));
    for(const child of family.children.filter(n=>n.tag==='CHIL')){const id=refs.get(child.value);if(id)byId.get(id).parentIds.push(...existing);else missingRefs++;}
  }
  const warning='הייבוא בסיסי: תמונות, מסמכים, מקורות, אירועי נישואין והבחנה בין קשרי הורות ביולוגיים ומאמצים לא יובאו. שמרו את קובץ המקור.'+(missingRefs?` ${missingRefs} הפניות לאנשים שאינם בקובץ לא יובאו.`:'');
  return {family:normalizeFamily({version:1,rootId:people[0].id,people}),warning};
}

export function safeSourceUrl(value){try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'';}catch{return '';}}
export function normalizeEntry(raw,people){
  if(!raw||typeof raw.id!=='string'||!/^[\w-]{1,100}$/.test(raw.id)||!['memory','history'].includes(raw.kind))throw new Error('זיכרון או אירוע אינם תקינים.');
  const entry={id:raw.id,kind:raw.kind,branch:raw.branch in BRANCH_NAMES?raw.branch:'shared'};
  for(const field of ['title','date','location','text','sourceTitle']){if(raw[field]!==undefined&&typeof raw[field]!=='string')throw new Error('שדה אירוע לא תקין.');entry[field]=(raw[field]||'').trim();if(entry[field].length>(field==='text'?20000:200))throw new Error('אחד משדות האירוע ארוך מדי.');}
  if(!entry.title||!entry.text)throw new Error('יש למלא כותרת ותוכן לזיכרון או לאירוע.');
  if(raw.personIds!==undefined&&(!Array.isArray(raw.personIds)||raw.personIds.some(id=>typeof id!=='string'||!people.some(p=>p.id===id))))throw new Error('אירוע מפנה לאדם שאינו קיים.');
  entry.personIds=[...new Set(raw.personIds||[])];entry.photo=safePhoto(raw.photo);if(raw.photo&&!entry.photo)throw new Error('תמונת האירוע אינה תקינה.');
  if(raw.sourceUrl!==undefined&&(typeof raw.sourceUrl!=='string'||raw.sourceUrl.length>2000))throw new Error('קישור המקור אינו תקין.');entry.sourceUrl=safeSourceUrl(raw.sourceUrl);if(raw.sourceUrl&&!entry.sourceUrl)throw new Error('יש להשתמש בקישור מקור HTTP או HTTPS.');return entry;
}
export function updateEntry(family,raw){const copy=structuredClone(family),entry=normalizeEntry(raw,copy.people);copy.entries ||= [];const index=copy.entries.findIndex(e=>e.id===entry.id);if(index>=0)copy.entries[index]=entry;else copy.entries.push(entry);return normalizeFamily(copy);}
export function sortEntries(entries){return [...entries].sort((a,b)=>{const year=e=>Number(e.date.match(/(?:^|\D)(\d{4})(?:\D|$)/)?.[1])||Infinity;return year(a)-year(b)||a.title.localeCompare(b.title,'he');});}
