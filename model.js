export const BRANCH_NAMES = {tavori:'משפחת תבורי',gorsht:'משפחת גורשט',shared:'ענף משותף',other:'ענף נוסף'};
export const SOURCE_URL = 'https://www.myheritage.co.il/family-trees/tavorifamily/OYYV7WMCSUUHNRKZSIVMAJKW4PATMJI';
const TEXT_FIELDS = ['name','maidenName','birthDate','birthPlace','deathDate','residence','occupation','bio','sourceNote'];
export function escapeHtml(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function safePhoto(value){return typeof value==='string' && /^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) ? value : '';}
export function normalizeFamily(input){
  if(!input || input.version!==1 || !Array.isArray(input.people) || input.people.length>5000) throw new Error('קובץ האילן אינו תקין או מכיל יותר מ־5,000 אנשים.');
  const ids=new Set();
  const people=input.people.map(raw=>{
    if(!raw || typeof raw.id!=='string' || !/^[\w-]{1,100}$/.test(raw.id) || ids.has(raw.id))throw new Error('מזהה חסר, כפול או לא תקין.');
    ids.add(raw.id);
    const person={id:raw.id,branch:raw.branch in BRANCH_NAMES ? raw.branch : 'other',parentIds:[],partnerIds:[],lifeStatus:['unknown','living','deceased'].includes(raw.lifeStatus)?raw.lifeStatus:'unknown'};
    for(const field of TEXT_FIELDS){if(raw[field]!==undefined && typeof raw[field]!=='string')throw new Error('שדה טקסט לא תקין.');person[field]=(raw[field]||'').trim();if(person[field].length>(field==='bio'?20000:field==='sourceNote'?2000:200))throw new Error('אחד משדות הטקסט ארוך מדי.');}
    if(!person.name)throw new Error('יש לתת שם לכל אדם.');
    for(const field of ['parentIds','partnerIds']){
      if(raw[field]!==undefined && (!Array.isArray(raw[field]) || raw[field].some(id=>typeof id!=='string')))throw new Error('רשימת קשרים אינה תקינה.');
      person[field]=[...new Set(raw[field]||[])];
      if(person[field].includes(person.id))throw new Error('אדם לא יכול להיות הורה או בן זוג של עצמו.');
    }
    if(raw.photo && !safePhoto(raw.photo))throw new Error('פורמט תמונה לא נתמך. יש להשתמש בתמונה שהועלתה דרך האתר.');
    person.photo=safePhoto(raw.photo);person.source=raw.source===SOURCE_URL?SOURCE_URL:'';
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
  return {version:1,title:typeof input.title==='string'?input.title.slice(0,200):'הסיפור המשפחתי שלנו',subtitle:typeof input.subtitle==='string'?input.subtitle.slice(0,200):'משפחות תבורי וגורשט',rootId:ids.has(input.rootId)?input.rootId:(people[0]?.id||''),people};
}
export function updatePerson(family,person){
  const copy=structuredClone(family);const old=copy.people.find(p=>p.id===person.id);
  for(const other of copy.people){other.partnerIds=other.partnerIds.filter(id=>id!==person.id);}
  const index=copy.people.findIndex(p=>p.id===person.id);
  if(index>=0)copy.people[index]=person;else copy.people.push(person);
  for(const partnerId of person.partnerIds){const other=copy.people.find(p=>p.id===partnerId);if(other&&!other.partnerIds.includes(person.id))other.partnerIds.push(person.id);}
  if(!old&&!copy.rootId)copy.rootId=person.id;
  return normalizeFamily(copy);
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
  const cardWidth=164,cardHeight=146,gap=34,rowHeight=218,padding=68;
  const width=Math.max(650,...rows.filter(Boolean).map(row=>row.length*(cardWidth+gap)-gap+padding*2));
  const height=Math.max(380,rows.length*rowHeight+30),positions=new Map();
  rows.forEach((row,level)=>{if(!row)return;const rowWidth=row.length*(cardWidth+gap)-gap;row.forEach((p,index)=>positions.set(p.id,{x:(width-rowWidth)/2+(row.length-index-1)*(cardWidth+gap),y:42+level*rowHeight,level}));});
  return {width,height,positions,rows,cardWidth,cardHeight};
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
