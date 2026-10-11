import {BRANCH_NAMES,escapeHtml as esc,safePhoto,normalizeFamily,updatePerson,projectFamily,layoutTree,generationWindow,generationLabel,treeConnections,parseGedcom} from './model.js?v=20261011-4';
import {loadFamily,editorUrl} from './service.js?v=20261011-4';
const $=selector=>document.querySelector(selector),DRAFT_KEY='tavori-family-draft-v1';
const pageBranch=document.body.dataset.family,requestedFocus=new URLSearchParams(location.search).get('person');
let published,family,pageFamily,editing=false,view='tree',query='',zoom=1,focusId=requestedFocus||'',generationLimit='3',fullLayout,scope,treePeople=[],layout,toastTimer,pendingPhoto='';
const form=$('#person-form');
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function showError(selector,error){const el=$(selector);el.textContent=error.message||String(error);el.hidden=false;}
function byId(id){return family.people.find(p=>p.id===id);}
function avatar(person){const photo=safePhoto(person.photo);return `<span class="avatar ${esc(person.branch)}">${photo?`<img src="${photo}" alt="" loading="lazy">`:esc(person.name.split(/\s+/).slice(0,2).map(n=>Array.from(n)[0]).join(''))}</span>`;}
function dateLabel(person){return [person.birthDate,person.deathDate].filter(Boolean).join(' – ')||(person.lifeStatus==='deceased'?'לזכרם':'');}
function relationship(person){const root=byId(focusId);if(!root)return BRANCH_NAMES[person.branch];if(person.id===root.id)return 'האדם הנבחר';if(root.partnerIds.includes(person.id))return 'בן / בת זוג · אותו דור';if(root.parentIds.includes(person.id))return `הורה של ${root.name.split(' ')[0]}`;if(person.parentIds.includes(root.id))return 'הדור הבא';return BRANCH_NAMES[person.branch];}
function optionLabel(person){const duplicates=family.people.filter(p=>p.name===person.name).length>1;if(!duplicates)return person.name;const detail=person.birthDate||person.parentIds.map(id=>byId(id)?.name).filter(Boolean).join(' ו־')||BRANCH_NAMES[person.branch];return `${person.name} · ${detail}`;}
function isVisible(person){return !query||[person.name,person.maidenName].filter(Boolean).join(' ').includes(query);}
function empty(icon,title,description){return `<div class="empty-state"><span class="empty-icon" aria-hidden="true">${icon}</span><h3>${esc(title)}</h3><p>${esc(description)}</p>${editing?'<button class="button primary" data-add>הוספת מידע לבני המשפחה</button>':''}</div>`;}
function render(){
  pageFamily=projectFamily(family,pageBranch);
  $('#people-count').textContent=pageFamily.people.length;$('#photo-count').textContent=pageFamily.people.filter(p=>safePhoto(p.photo)).length;
  if(!pageFamily.people.some(p=>p.id===focusId))focusId=pageFamily.rootId;
  fullLayout=layoutTree(pageFamily.people);$('#generation-count').textContent=fullLayout.rows.filter(Boolean).length;
  scope=generationWindow(fullLayout,focusId,generationLimit);
  treePeople=pageFamily.people.filter(p=>{const level=fullLayout.positions.get(p.id).level;return level>=scope.min&&level<=scope.max;});
  layout={...fullLayout,rows:fullLayout.rows.slice(scope.min,scope.max+1),height:Math.max(250,(scope.max-scope.min+1)*fullLayout.rowHeight+30),positions:new Map(treePeople.map(p=>[p.id,{...fullLayout.positions.get(p.id),y:fullLayout.positions.get(p.id).y-scope.min*fullLayout.rowHeight}]))};
  $('#focus-person').innerHTML=pageFamily.people.map(p=>`<option value="${esc(p.id)}">${esc(optionLabel(p))}</option>`).join('');$('#focus-person').value=focusId;$('#generations').value=generationLimit;
  $('#manage-person').innerHTML='<option value="">בחירת אדם לעריכה…</option>'+family.people.map(p=>`<option value="${esc(p.id)}">${esc(optionLabel(p))}</option>`).join('');$('#edit-managed-person').disabled=!editing;
  $('#fit').setAttribute('aria-label',`מרכוז האילן סביב ${byId(focusId)?.name||'האדם הנבחר'}`);
  $('#draft-banner').hidden=!editing;$('#add-person').hidden=!editing;
  const config={tree:['אילן היוחסין','הקשרים שמחברים אותנו'],people:['בני המשפחה','לכל אדם יש מקום בסיפור'],album:['אלבום תמונות','רגעים שנשארים איתנו'],stories:['סיפורים וזיכרונות','המילים שעוברות בין הדורות']}[view];
  $('#view-title').textContent=config[0];$('#view-kicker').textContent=config[1];
  for(const key of ['tree','people','album','stories'])$(`#${key}-view`).hidden=view!==key;
  for(const button of document.querySelectorAll('[data-view]')){button.classList.toggle('active',button.dataset.view===view);if(button.dataset.view===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
  renderTree();const visible=pageFamily.people.filter(isVisible);
  $('#people-grid').innerHTML=visible.map(p=>`<button class="person-tile" data-person="${esc(p.id)}">${avatar(p)}<span><strong>${esc(p.name)}</strong><small>${esc(BRANCH_NAMES[p.branch])}</small>${dateLabel(p)?`<small>${esc(dateLabel(p))}</small>`:''}</span></button>`).join('')||empty('⌕','לא נמצאו בני משפחה','נסו לחפש שם אחר באילן הזה, או לעבור לדף המשפחה השנייה.');
  const photos=visible.filter(p=>safePhoto(p.photo));$('#album-grid').innerHTML=photos.map(p=>`<button class="photo-tile" data-person="${esc(p.id)}"><img src="${p.photo}" alt="תמונה של ${esc(p.name)}" loading="lazy"><span>${esc(p.name)}</span></button>`).join('')||empty('▧','התמונות עוד יגיעו','כאן יופיעו התמונות של בני המשפחה. לכל תמונה יהיה שם וקישור לסיפור של האדם שבתוכה.');
  const stories=visible.filter(p=>p.bio);$('#stories-grid').innerHTML=stories.map(p=>`<button class="story-card" data-person="${esc(p.id)}"><h3>${esc(p.name)}</h3><p>${esc(p.bio)}</p><small>לסיפור המלא ←</small></button>`).join('')||empty('❧','יש סיפורים שרק אנחנו מכירים','זיכרון מבית ילדות, מסורת משפחתית או רגע משותף. כאן יהיה המקום שלהם, כשנוסיף אותם.');
}
function renderTree(){
  const {positions,width,height}=layout,connections=treeConnections(treePeople,layout);
  const edges=connections.partners.map(link=>`<path d="${link.path}" stroke="#bf9a82" stroke-width="1.8" stroke-dasharray="4 4" fill="none"/>`).join('')+connections.parentLinks.map(link=>`<path d="${link.path}" stroke="#859b78" stroke-width="1.6" fill="none"/>`).join('');
  let html=`<svg class="tree-svg" aria-hidden="true" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${edges}</svg>`;
  const root=byId(focusId),labelX=positions.get(focusId)?.x||width/2;
  layout.rows.forEach((row,level)=>{if(row)html+=`<span class="generation-label" style="top:${12+level*layout.rowHeight}px;left:${labelX}px">${esc(generationLabel(level+scope.min-scope.focusLevel,root?.name||'האדם הנבחר'))}</span>`;});
  for(const p of treePeople){const point=positions.get(p.id);html+=`<button class="tree-card ${esc(p.branch)} ${p.id===focusId||root?.partnerIds.includes(p.id)?'focus-person':''} ${isVisible(p)?'':'dimmed'}" data-person="${esc(p.id)}" data-generation="${point.level-scope.focusLevel}" style="left:${point.x}px;top:${point.y}px" aria-label="${esc(p.name)}, ${esc(relationship(p))}${dateLabel(p)?', '+esc(dateLabel(p)):''}">${avatar(p)}<strong title="${esc(p.name)}">${esc(p.name)}</strong><span class="card-dates">${[p.birthDate?`לידה: ${p.birthDate}`:'',p.deathDate?`פטירה: ${p.deathDate}`:''].filter(Boolean).map(d=>`<span>${esc(d)}</span>`).join('')||'&nbsp;'}</span><span class="card-role">${esc(relationship(p))}</span></button>`;}
  if(!pageFamily.people.length)html=empty('♧','כאן מתחיל האילן שלנו','הוסיפו אדם לענף הזה או שייכו אליו אנשים דרך ניהול האילן.');
  $('#tree-canvas').style.setProperty('--card-width',`${layout.cardWidth}px`);$('#tree-canvas').style.setProperty('--card-height',`${layout.cardHeight}px`);$('#tree-canvas').innerHTML=html;$('#tree-canvas').style.width=`${width}px`;$('#tree-canvas').style.height=`${height}px`;
  const count=treePeople.filter(isVisible).length;$('#tree-status').textContent=`${count} מתוך ${pageFamily.people.length} אנשים · ${pageFamily.people.length?scope.max-scope.min+1:0} דורות${query?' · התאמות מודגשות':''}`;applyZoom();
}
function applyZoom(){if(!layout)return;$('#tree-canvas').style.transform=`scale(${zoom})`;$('#tree-space').style.width=`${layout.width*zoom}px`;$('#tree-space').style.height=`${layout.height*zoom}px`;$('#zoom-label').textContent=`${Math.round(zoom*100)}%`;$('#zoom-out').disabled=zoom<=.3;$('#zoom-in').disabled=zoom>=1.6;}
function centerOn(id){const box=$('#tree-viewport'),point=layout.positions.get(id);if(!point)return;box.scrollLeft=Math.max(0,(point.x+layout.cardWidth/2)*zoom-box.clientWidth/2);box.scrollTop=Math.max(0,(point.y+layout.cardHeight/2)*zoom-box.clientHeight/2);}
function fitTree(){zoom=.9;applyZoom();centerOn(focusId);}
function profileLink(person,label=person.name){if(pageFamily.people.some(p=>p.id===person.id))return `<button class="relative-link" data-person="${esc(person.id)}">${esc(label)} ←</button>`;if(['tavori','gorsht'].includes(person.branch))return `<a class="relative-link cross-family" href="${person.branch}.html?person=${encodeURIComponent(person.id)}">${esc(label)} · ${esc(BRANCH_NAMES[person.branch])} ↗</a>`;return `<span class="relative-link">${esc(label)} · טרם שויך לאילן</span>`;}
function relatives(ids){return ids.map(id=>byId(id)).filter(Boolean).map(p=>profileLink(p)).join('');}
function openProfile(id){const person=byId(id);if(!person)return;
  const children=family.people.filter(p=>p.parentIds.includes(id)).map(p=>p.id);
  const facts=[['שם נעורים',person.maidenName],['תאריך לידה',person.birthDate],['מקום לידה',person.birthPlace],['תאריך פטירה',person.deathDate],['מקום מגורים',person.residence],['עיסוק',person.occupation]].filter(([,value])=>value);
  $('#profile-content').innerHTML=`<div class="profile-hero">${avatar(person)}<h2>${esc(person.name)}</h2>${dateLabel(person)?`<p>${esc(dateLabel(person))}</p>`:''}<span class="profile-branch">${esc(BRANCH_NAMES[person.branch])}</span></div>${facts.length?`<dl class="profile-facts">${facts.map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>`:'<p class="muted">הפרטים האישיים יתווספו כשיימסרו על ידי המשפחה.</p>'}${[['הורים',person.parentIds],['בני / בנות זוג',person.partnerIds],['ילדים',children]].filter(([,ids])=>ids.length).map(([label,ids])=>`<section class="profile-section"><h3>${label}</h3>${relatives(ids)}</section>`).join('')}${person.bio?`<section class="profile-section"><h3>הסיפור של ${esc(person.name.split(' ')[0])}</h3><p class="bio">${esc(person.bio)}</p></section>`:''}${person.sourceNote||person.source?`<p class="source-note">${esc(person.sourceNote||'')}${person.source?` <a href="${esc(person.source)}" target="_blank" rel="noopener">המקור ב־MyHeritage ↗</a>`:''}</p>`:''}<div class="profile-actions"><a class="button primary" href="${esc(editorUrl(id,pageBranch))}" target="_blank" rel="noopener">עדכון פרטים ותמונה ↗</a><button class="button subtle" data-focus="${esc(id)}">הצגה במרכז האילן</button></div>${editing?`<div class="profile-actions"><button class="button primary" data-edit="${esc(id)}">עריכת הפרטים</button><button class="button subtle" data-child="${esc(id)}">הוספת ילד/ה</button></div>`:''}`;
  if(!$('#profile-dialog').open)$('#profile-dialog').showModal();else $('#profile-dialog').scrollTop=0;
}
function openEditor(id='',parentId=''){
  if(!editing)return;$('#profile-dialog').close();form.reset();$('#form-error').hidden=true;const person=id?byId(id):null;pendingPhoto=person?.photo||'';
  $('#edit-title').textContent=person?'עריכת בן משפחה':'הוספת בן משפחה';form.elements.id.value=id;
  for(const field of ['name','maidenName','birthDate','birthPlace','deathDate','residence','occupation','bio'])form.elements[field].value=person?.[field]||'';
  form.elements.branch.value=person?.branch||(parentId?byId(parentId)?.branch:pageBranch)||pageBranch;form.elements.lifeStatus.value=person?.lifeStatus||'unknown';
  for(const field of ['parentIds','partnerIds']){const selected=person?.[field]||(field==='parentIds'&&parentId?[parentId]:[]);form.elements[field].innerHTML=family.people.filter(p=>p.id!==id).map(p=>`<option value="${esc(p.id)}" ${selected.includes(p.id)?'selected':''}>${esc(p.name)} · ${esc(BRANCH_NAMES[p.branch])}</option>`).join('');}
  $('#photo-preview').hidden=!pendingPhoto;if(pendingPhoto)$('#photo-preview').src=pendingPhoto;$('#edit-dialog').showModal();
}
function saveDraft(next){
  family=normalizeFamily(next);let stored=true;
  try{localStorage.setItem(DRAFT_KEY,JSON.stringify(family));}catch{stored=false;toast('אין מספיק מקום בדפדפן. הטיוטה בזיכרון בלבד; ייצאו אותה לפני סגירת האתר.');}
  render();return stored;
}
function enterEditing(){
  if(!published)return;editing=true;family=structuredClone(published);
  try{const saved=localStorage.getItem(DRAFT_KEY);if(saved)family=normalizeFamily(JSON.parse(saved));}catch{toast('הטיוטה המקומית אינה זמינה. מוצגת הגרסה הציבורית.');}
  $('#manage-dialog').close();render();fitTree();
}
function exportFamily(){
  let value=family;
  if(!editing){try{const saved=localStorage.getItem(DRAFT_KEY);if(saved)value=normalizeFamily(JSON.parse(saved));}catch{toast('לא ניתן לקרוא את הטיוטה. מיוצאת הגרסה הציבורית.');}}
  const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='family.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('קובץ family.json הורד. לפרסום יש להעלות אותו לתיקיית data ב־GitHub.');
}
async function readPhoto(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('בחרו תמונת JPEG, PNG או WebP.');if(file.size>10*1024*1024)throw new Error('התמונה גדולה מ־10MB.');
  const image=await createImageBitmap(file);const ratio=Math.min(1,640/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*ratio));canvas.height=Math.max(1,Math.round(image.height*ratio));const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,canvas.width,canvas.height);image.close();return canvas.toDataURL('image/jpeg',.84);
}
document.addEventListener('click',event=>{
  const person=event.target.closest('[data-person]');if(person){openProfile(person.dataset.person);return;}
  const focus=event.target.closest('[data-focus]');if(focus){if(!pageFamily.people.some(p=>p.id===focus.dataset.focus)){toast('האדם נמצא בענף אחר. ניתן לערוך אותו כאן, או לעבור לדף המשפחה שלו.');return;}focusId=focus.dataset.focus;view='tree';query='';$('#search').value='';$('#profile-dialog').close();render();fitTree();return;}
  const nav=event.target.closest('[data-view]');if(nav){view=nav.dataset.view;render();if(view==='tree')fitTree();return;}
  const edit=event.target.closest('[data-edit]');if(edit){openEditor(edit.dataset.edit);return;}
  const child=event.target.closest('[data-child]');if(child){openEditor('',child.dataset.child);return;}
  if(event.target.closest('[data-add]')){view='people';render();toast('בחרו בן משפחה כדי לערוך את הפרטים, התמונות והסיפור שלו.');}
  if(event.target.closest('[data-close]'))event.target.closest('dialog')?.close();
});
$('#search').addEventListener('input',event=>{query=event.target.value.trim();if(query){const match=pageFamily.people.find(isVisible);if(match){const level=fullLayout.positions.get(match.id)?.level;if(level<scope.min||level>scope.max)focusId=match.id;}}render();if(query)centerOn(treePeople.find(isVisible)?.id);else centerOn(focusId);});
$('#focus-person').addEventListener('change',event=>{focusId=event.target.value;render();fitTree();});
$('#generations').addEventListener('change',event=>{generationLimit=event.target.value;render();fitTree();});
$('#zoom-in').addEventListener('click',()=>{zoom=Math.min(1.6,Math.round((zoom+.1)*100)/100);applyZoom();});
$('#zoom-out').addEventListener('click',()=>{zoom=Math.max(.3,Math.round((zoom-.1)*100)/100);applyZoom();});$('#fit').addEventListener('click',fitTree);
$('#manage').addEventListener('click',()=>$('#manage-dialog').showModal());$('#about').addEventListener('click',()=>$('#about-dialog').showModal());
$('#edit-managed-person').addEventListener('click',()=>{const id=$('#manage-person').value;if(!editing||!id)return;$('#manage-dialog').close();openEditor(id);});
$('#enter-editor').addEventListener('click',enterEditing);$('#add-person').addEventListener('click',()=>openEditor());
$('#leave-editor').addEventListener('click',()=>{editing=false;family=structuredClone(published);render();fitTree();});
$('#export').addEventListener('click',exportFamily);$('#export-from-manager').addEventListener('click',exportFamily);
$('#discard-draft').addEventListener('click',()=>{if(!confirm('למחוק את הטיוטה בדפדפן הזה? מומלץ להוריד גיבוי קודם. הגרסה הציבורית לא תשתנה.'))return;try{localStorage.removeItem(DRAFT_KEY);}catch{toast('לא ניתן למחוק את הטיוטה מאחסון הדפדפן.');return;}family=structuredClone(published);editing=false;$('#manage-dialog').close();render();fitTree();toast('הטיוטה המקומית נמחקה. מוצגת הגרסה הציבורית.');});
form.elements.photo.addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;form.querySelector('[type=submit]').disabled=true;$('#form-error').hidden=true;try{pendingPhoto=await readPhoto(file);$('#photo-preview').src=pendingPhoto;$('#photo-preview').hidden=false;form.elements.removePhoto.checked=false;}catch(error){showError('#form-error',error);event.target.value='';}finally{form.querySelector('[type=submit]').disabled=false;}});
form.addEventListener('submit',event=>{
  event.preventDefault();$('#form-error').hidden=true;try{
    const old=byId(form.elements.id.value),person={...old,id:form.elements.id.value||crypto.randomUUID()};
    for(const field of ['name','maidenName','branch','birthDate','birthPlace','deathDate','residence','occupation','bio','lifeStatus'])person[field]=form.elements[field].value.trim();
    if(person.deathDate&&person.lifeStatus==='living')throw new Error('צוין תאריך פטירה אך המצב הוא ״בחיים״. יש לתקן אחד מהשדות.');
    for(const field of ['parentIds','partnerIds'])person[field]=Array.from(form.elements[field].selectedOptions).map(option=>option.value);
    person.photo=form.elements.removePhoto.checked?'':pendingPhoto;const next=updatePerson(family,person);const stored=saveDraft(next);$('#edit-dialog').close();if(stored)toast('השינוי נשמר בטיוטה המקומית.');
  }catch(error){showError('#form-error',error);}
});
$('#import').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;const status=$('#import-result');status.textContent='קורא את הקובץ…';try{
    if(file.size>50*1024*1024)throw new Error('הקובץ גדול מ־50MB.');
    const buffer=await file.arrayBuffer(),bytes=new Uint8Array(buffer);const encoding=bytes[0]===255&&bytes[1]===254?'utf-16le':bytes[0]===254&&bytes[1]===255?'utf-16be':'utf-8';const text=new TextDecoder(encoding,{fatal:true}).decode(buffer);let next,warning='';
    if(/\.json$/i.test(file.name))next=normalizeFamily(JSON.parse(text));else{const result=parseGedcom(text);next=result.family;warning=result.warning;}
    if(!confirm(`נמצאו ${next.people.length} אנשים. הייבוא יחליף את הטיוטה המקומית, ולא ישנה את האתר הציבורי. להמשיך?${warning?'\n\n'+warning:''}`)){status.textContent='הייבוא בוטל.';return;}
    editing=true;const stored=saveDraft(next);$('#manage-dialog').close();fitTree();toast(stored?`יובאו ${next.people.length} אנשים לטיוטה המקומית.`:'הייבוא בזיכרון בלבד. ייצאו גיבוי לפני סגירת האתר.');if(warning){status.textContent=warning;$('#manage-dialog').showModal();}
  }catch(error){status.textContent=error.message||'הייבוא נכשל. הטיוטה הקודמת נשמרה.';}finally{event.target.value='';}
});
window.addEventListener('resize',()=>{if(view==='tree')fitTree();});
async function load(){try{const result=await loadFamily();published=normalizeFamily(result.family);if(result.offline)toast('השמירה המשותפת אינה זמינה כרגע. מוצג עותק הגיבוי.');$('#shared-editor').href=editorUrl('',pageBranch);$('#shared-new').href=editorUrl('new',pageBranch);family=structuredClone(published);render();fitTree();}catch(error){showError('#load-error',error);$('#tree-status').textContent='טעינת האילן נכשלה';$('#manage').disabled=true;}}
load();
