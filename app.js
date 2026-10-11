import {displayFamilyDate} from './genealogy-dates.js?v=20261011-7';
import {BRANCH_NAMES,PHOTO_ORIGIN,escapeHtml as esc,safePhoto,normalizeFamily,updatePerson,projectFamily,layoutTree,generationWindow,generationLabel,treeConnections,parseGedcom,sortEntries,safeSourceUrl} from './model.js?v=20261011-7';
import {loadFamily,editorUrl,entryEditorUrl} from './service.js?v=20261011-7';
const $=selector=>document.querySelector(selector),$$=selector=>document.querySelectorAll(selector),DRAFT_KEY='tavori-family-draft-v1';
const pageBranch=document.body.dataset.family,requestedFocus=new URLSearchParams(location.search).get('person');
let published,family,pageFamily,editing=false,view='tree',query='',zoom=1,focusId=requestedFocus||'',generationLimit='3',fullLayout,scope,treePeople=[],layout,toastTimer,pendingPhoto='';
const form=$('#person-form');
function toast(message){clearTimeout(toastTimer);$('#toast').textContent=message;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function showError(selector,error){const el=$(selector);el.textContent=error.message||String(error);el.hidden=false;}
function byId(id){return family.people.find(p=>p.id===id);}
function photoSrc(photo){return location.hostname==='127.0.0.1'&&photo.startsWith(PHOTO_ORIGIN+'/api/photos/')?'http://127.0.0.1:5173'+new URL(photo).pathname:photo;}
function avatar(person){const photo=safePhoto(person.photo);return `<span class="avatar ${esc(person.branch)}">${photo?`<img src="${esc(photoSrc(photo))}" alt="" loading="lazy">`:esc(person.name.split(/\s+/).slice(0,2).map(n=>Array.from(n)[0]).join(''))}</span>`;}
function maidenLabel(person){return person.maidenName?`לבית ${person.maidenName}`:'';}
function entryCard(e){return `<button class="story-card entry-card" data-entry="${esc(e.id)}">${e.photo?`<img src="${esc(e.photo)}" alt="" loading="lazy">`:''}<span class="eyebrow">${esc([e.date,e.location].filter(Boolean).join(' · '))||'תאריך לא צוין'}</span><h3>${esc(e.title)}</h3><p>${esc(e.text)}</p><small>${e.kind==='history'?'לפרטי האירוע':'לזיכרון המלא'} ←</small></button>`;}
function visibleEntries(kind){return sortEntries(pageFamily.entries.filter(e=>e.kind===kind&&(!query||[e.title,e.text,e.date,e.location,...e.personIds.map(id=>byId(id)?.name||'')].join(' ').includes(query))));}
function openEntry(id){const e=family.entries.find(e=>e.id===id);if(!e)return;$('#entry-content').innerHTML=`<span class="eyebrow">${e.kind==='history'?'היסטוריה משפחתית וכללית':'זיכרון משפחתי'}</span><h2>${esc(e.title)}</h2><p class="muted">${esc([e.date,e.location].filter(Boolean).join(' · '))}</p>${e.photo?`<img class="entry-photo" src="${esc(e.photo)}" alt="תמונה מצורפת לזיכרון או לאירוע">`:''}<p class="bio">${esc(e.text)}</p>${e.personIds.length?`<section class="profile-section"><h3>בני משפחה הקשורים לסיפור</h3>${relatives(e.personIds)}</section>`:''}${e.sourceTitle||e.sourceUrl?`<p class="source-note">מקור: ${e.sourceUrl?`<a href="${esc(safeSourceUrl(e.sourceUrl))}" target="_blank" rel="noopener noreferrer">${esc(e.sourceTitle||'פתיחת המקור')} ↗</a>`:esc(e.sourceTitle)}</p>`:''}<a class="button primary" href="${esc(entryEditorUrl(e.kind,e.branch,e.id))}" target="_blank" rel="noopener">עריכת הזיכרון או האירוע ↗</a>`;$('#entry-dialog').showModal();}
function dateLabel(person){return [person.birthDate,person.deathDate].filter(Boolean).map(displayFamilyDate).join(' – ')||(person.lifeStatus==='deceased'?'לזכרם':'');}
function relationship(person){const root=byId(focusId);if(!root)return BRANCH_NAMES[person.branch];if(person.id===root.id)return 'האדם הנבחר';if(root.partnerIds.includes(person.id))return 'בן / בת זוג · אותו דור';if(root.parentIds.includes(person.id))return `הורה של ${root.name.split(' ')[0]}`;if(person.parentIds.includes(root.id))return 'הדור הבא';return BRANCH_NAMES[person.branch];}
function optionLabel(person){const duplicates=family.people.filter(p=>p.name===person.name).length>1;if(!duplicates)return person.name;const detail=displayFamilyDate(person.birthDate)||person.parentIds.map(id=>byId(id)?.name).filter(Boolean).join(' ו־')||BRANCH_NAMES[person.branch];return `${person.name} · ${detail}`;}
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
  const config={tree:['אילן היוחסין','הקשרים שמחברים אותנו'],people:['בני המשפחה','לכל אדם יש מקום בסיפור'],album:['אלבום תמונות','רגעים שנשארים איתנו'],stories:['סיפורים וזיכרונות','המילים שעוברות בין הדורות'],history:['ציר זמן היסטורי','הסיפור שלנו בתוך הסיפור הגדול']}[view];
  $('#view-title').textContent=config[0];$('#view-kicker').textContent=config[1];
  for(const key of ['tree','people','album','stories','history'])$(`#${key}-view`).hidden=view!==key;
  for(const button of document.querySelectorAll('[data-view]')){button.classList.toggle('active',button.dataset.view===view);if(button.dataset.view===view)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');}
  renderTree();const visible=pageFamily.people.filter(isVisible);
  $('#people-grid').innerHTML=visible.map(p=>`<button class="person-tile" data-person="${esc(p.id)}">${avatar(p)}<span><strong>${esc(p.name)}</strong>${p.maidenName?`<small>${esc(maidenLabel(p))}</small>`:''}<small>${esc(BRANCH_NAMES[p.branch])}</small>${dateLabel(p)?`<small>${esc(dateLabel(p))}</small>`:''}</span></button>`).join('')||empty('⌕','לא נמצאו בני משפחה','נסו לחפש שם אחר באילן הזה, או לעבור לדף המשפחה השנייה.');
  const photos=visible.filter(p=>safePhoto(p.photo));$('#album-grid').innerHTML=photos.map(p=>`<button class="photo-tile" data-person="${esc(p.id)}"><img src="${esc(photoSrc(p.photo))}" alt="תמונה של ${esc(p.name)}" loading="lazy"><span>${esc(p.name)}</span></button>`).join('')||empty('▧','התמונות עוד יגיעו','כאן יופיעו התמונות של בני המשפחה. לכל תמונה יהיה שם וקישור לסיפור של האדם שבתוכה.');
  const stories=visible.filter(p=>p.bio),memories=visibleEntries('memory');
  $('#stories-grid').innerHTML=memories.map(entryCard).join('')+stories.map(p=>`<button class="story-card" data-person="${esc(p.id)}"><span class="eyebrow">סיפור אישי</span><h3>${esc(p.name)}</h3><p>${esc(p.bio)}</p><small>לסיפור המלא ←</small></button>`).join('')||empty('❧','כאן שומרים זיכרונות משפחתיים','הוסיפו סיפור, מסורת, מפגש או זיכרון וחברו אותו לבני המשפחה.');
  $('#history-grid').innerHTML=visibleEntries('history').map(entryCard).join('')||empty('◷','כאן נבנה ציר הזמן שלנו','הוסיפו תחנות בחיי המשפחה ואירועים היסטוריים כלליים. אפשר לציין תאריך, מקום ומקור מידע.');
  $('#add-memory').href=entryEditorUrl('memory',pageBranch);$('#add-history').href=entryEditorUrl('history',pageBranch);
  $('#shared-new').hidden=['stories','history'].includes(view);$('#search').placeholder=['stories','history'].includes(view)?'חיפוש בסיפורים ובאירועים…':'חיפוש בן משפחה…';

}
function renderTree(){
  const {positions,width,height}=layout,connections=treeConnections(treePeople,layout);
  const edges=connections.partners.map(link=>`<path d="${link.path}" stroke="#bf9a82" stroke-width="1.8" stroke-dasharray="4 4" fill="none"/>`).join('')+connections.parentLinks.map(link=>`<path d="${link.path}" stroke="#859b78" stroke-width="1.6" fill="none"/>`).join('');
  let html=`<svg class="tree-svg" aria-hidden="true" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${edges}</svg>`;
  const root=byId(focusId),labelX=positions.get(focusId)?.x||width/2;
  layout.rows.forEach((row,level)=>{if(row)html+=`<span class="generation-label" style="top:${12+level*layout.rowHeight}px;left:${labelX}px">${esc(generationLabel(level+scope.min-scope.focusLevel,root?.name||'האדם הנבחר'))}</span>`;});
  for(const p of treePeople){const point=positions.get(p.id);html+=`<button class="tree-card ${esc(p.branch)} ${p.id===focusId||root?.partnerIds.includes(p.id)?'focus-person':''} ${isVisible(p)?'':'dimmed'}" data-person="${esc(p.id)}" data-generation="${point.level-scope.focusLevel}" style="left:${point.x}px;top:${point.y}px" aria-label="${esc(p.name)}${p.maidenName?', '+esc(maidenLabel(p)):''}, ${esc(relationship(p))}${dateLabel(p)?', '+esc(dateLabel(p)):''}">${avatar(p)}<strong title="${esc(p.name)}">${esc(p.name)}</strong><span class="card-maiden" title="${esc(maidenLabel(p))}">${esc(maidenLabel(p))||'&nbsp;'}</span><span class="card-dates">${[p.birthDate?`לידה: ${displayFamilyDate(p.birthDate)}`:'',p.deathDate?`פטירה: ${displayFamilyDate(p.deathDate)}`:''].filter(Boolean).map(d=>`<span>${esc(d)}</span>`).join('')||'&nbsp;'}</span><span class="card-role">${esc(relationship(p))}</span></button>`;}
  if(!pageFamily.people.length)html=empty('♧','כאן מתחיל האילן שלנו','הוסיפו אדם לענף הזה או שייכו אליו אנשים דרך ניהול האילן.');
  $('#tree-canvas').style.setProperty('--card-width',`${layout.cardWidth}px`);$('#tree-canvas').style.setProperty('--card-height',`${layout.cardHeight}px`);$('#tree-canvas').innerHTML=html;$('#tree-canvas').style.width=`${width}px`;$('#tree-canvas').style.height=`${height}px`;
  const count=treePeople.filter(isVisible).length;$('#tree-status').textContent=`${count} מתוך ${pageFamily.people.length} אנשים · ${pageFamily.people.length?scope.max-scope.min+1:0} דורות${query?' · התאמות מודגשות':''}`;applyZoom();
}
function applyZoom(){if(!layout)return;$('#tree-canvas').style.transform=`scale(${zoom})`;$('#tree-space').style.width=`${layout.width*zoom}px`;$('#tree-space').style.height=`${layout.height*zoom}px`;$('#zoom-label').textContent=`${Math.round(zoom*100)}%`;$('#zoom-out').disabled=zoom<=.3;$('#zoom-in').disabled=zoom>=1.6;}
function centerOn(id){const box=$('#tree-viewport'),point=layout.positions.get(id);if(!point)return;box.scrollLeft=Math.max(0,(point.x+layout.cardWidth/2)*zoom-box.clientWidth/2);box.scrollTop=Math.max(0,(point.y+layout.cardHeight/2)*zoom-box.clientHeight/2);}
function fitTree(){zoom=.9;applyZoom();centerOn(focusId);}
function profileLink(person,label=person.name){if(pageFamily.people.some(p=>p.id===person.id))return `<button class="relative-link" data-person="${esc(person.id)}">${esc(label)} ←</button>`;if(['tavori','gorsht'].includes(person.branch))return `<a class="relative-link cross-family" href="${person.branch}.html?person=${encodeURIComponent(person.id)}">${esc(label)} · ${esc(BRANCH_NAMES[person.branch])} ↗</a>`;return `<span class="relative-link">${esc(label)} · טרם שויך לאילן</span>`;}
function relatives(ids){return ids.map(id=>byId(id)).filter(Boolean).map(p=>profileLink(p)).join('');}
function factSection(title,rows){const facts=rows.filter(([,value])=>value);return facts.length?`<section class="profile-block"><h3>${esc(title)}</h3><dl class="profile-facts">${facts.map(([label,value])=>`<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl></section>`:'';}
function openProfile(id){const person=byId(id);if(!person)return;
  const children=family.people.filter(p=>p.parentIds.includes(id)).map(p=>p.id),siblings=family.people.filter(p=>p.id!==id&&p.parentIds.some(parent=>person.parentIds.includes(parent))).map(p=>p.id);
  const groups=[['הורים',person.parentIds],['בני / בנות זוג',person.partnerIds],['ילדים',children],['אחים ואחיות',siblings]].filter(([,ids])=>ids.length);
  const entries=sortEntries(pageFamily.entries.filter(e=>e.personIds.includes(id)));
  const events=[['לידה',displayFamilyDate(person.birthDate),person.birthPlace],['פטירה',displayFamilyDate(person.deathDate),person.deathPlace],['קבורה','',person.burialPlace]].filter(([,date,place])=>date||place);
  const details=events.length?`<section class="profile-block"><h3>תחנות בחיים</h3><ol class="vital-events">${events.map(([label,date,place])=>`<li><span class="event-dot" aria-hidden="true"></span><div><h4>${label}</h4>${date?`<p>${esc(date)}</p>`:''}${place?`<small>${esc(place)}</small>`:''}</div></li>`).join('')}</ol></section>`:'';
  $('#profile-content').innerHTML=`<div class="profile-hero"><div>${avatar(person)}</div><div class="profile-identity"><span class="eyebrow">הסיפור המשפחתי</span><h2>${esc(person.name)}</h2>${person.maidenName?`<p class="maiden-name">${esc(maidenLabel(person))}</p>`:''}${dateLabel(person)?`<p class="profile-lifespan">${esc(dateLabel(person))}</p>`:''}<span class="profile-branch">${esc(BRANCH_NAMES[person.branch])}</span>${person.lifeStatus==='deceased'?'<span class="profile-state">לזכרם</span>':person.lifeStatus==='living'?'<span class="profile-state">בחיים</span>':''}</div></div><div class="profile-tabs" role="tablist" aria-label="פרטי האדם">${[['details','פרטים אישיים'],['family','משפחה'],['story','סיפור וזיכרונות']].map(([key,label])=>`<button role="tab" id="profile-tab-${key}" aria-controls="profile-panel-${key}" aria-selected="${key==='details'}" data-profile-tab="${key}">${label}${key==='story'&&entries.length?` <span>${entries.length}</span>`:''}</button>`).join('')}</div><div role="tabpanel" id="profile-panel-details" aria-labelledby="profile-tab-details">${details}${factSection('שם וזהות',[['שם משפחת נעורים',person.maidenName],['שמות נוספים וכינויים',person.alternateNames],['מגדר',({male:'זכר',female:'נקבה',other:'אחר'})[person.gender]],['לאום / ארץ מוצא',person.nationality]])}${factSection('חיי היומיום',[['מקום מגורים',person.residence],['עיסוק',person.occupation],['השכלה',person.education],['שפות',person.languages],['שירות צבאי / לאומי',person.militaryService],['עלייה / הגירה',person.migration]])}${factSection('עוד על האדם',person.facts.map(f=>[f.label,f.value]))}${!events.length&&!['maidenName','alternateNames','nationality','residence','occupation','education','languages','militaryService','migration'].some(k=>person[k])&&!person.facts.length&&!['male','female','other'].includes(person.gender)?'<div class="profile-empty"><span aria-hidden="true">✎</span><h3>הסיפור עוד נכתב</h3><p>הוסיפו תאריכים, מקומות ופרטים כדי להכיר את האדם שמאחורי השם.</p></div>':''}</div><div role="tabpanel" id="profile-panel-family" aria-labelledby="profile-tab-family" hidden>${groups.length?groups.map(([label,ids])=>`<section class="profile-block"><h3>${label} <small>(${ids.length})</small></h3><div class="profile-relatives">${ids.map(id=>byId(id)).filter(Boolean).map(p=>`<div class="family-person">${avatar(p)}<div>${profileLink(p)}${p.maidenName?`<small>${esc(maidenLabel(p))}</small>`:''}${p.birthDate?`<small>לידה: ${esc(displayFamilyDate(p.birthDate))}</small>`:''}</div></div>`).join('')}</div></section>`).join(''):'<p class="profile-empty">הקשרים המשפחתיים יופיעו כאן אחרי שיוספו לאילן.</p>'}</div><div role="tabpanel" id="profile-panel-story" aria-labelledby="profile-tab-story" hidden>${person.bio?`<section class="profile-block"><h3>סיפור החיים</h3><p class="bio">${esc(person.bio)}</p></section>`:''}${entries.length?`<section class="profile-block"><h3>זיכרונות ואירועים קשורים</h3><div class="profile-memories">${entries.map(entryCard).join('')}</div></section>`:''}${!person.bio&&!entries.length?'<div class="profile-empty"><span aria-hidden="true">❧</span><h3>יש לכם זיכרון לשתף?</h3><p>סיפור קטן, תמונה או מסורת משפחתית יכולים לעבור כאן לדורות הבאים.</p></div>':''}<a class="text-button" href="${esc(entryEditorUrl('memory',pageBranch))}" target="_blank" rel="noopener">הוספת זיכרון משפחתי ↗</a></div>${person.sourceNote||person.source?`<p class="source-note"><strong>מקורות והערות</strong><br>${esc(person.sourceNote||'')}${person.source?` <a href="${esc(person.source)}" target="_blank" rel="noopener">המקור ב־MyHeritage ↗</a>`:''}</p>`:''}<div class="profile-actions"><a class="button primary" href="${esc(editorUrl(id,pageBranch))}" target="_blank" rel="noopener">עדכון פרטים ותמונה ↗</a><button class="button subtle" data-focus="${esc(id)}">הצגה במרכז האילן</button></div>${editing?`<div class="profile-actions"><button class="button primary" data-edit="${esc(id)}">עריכת הפרטים</button><button class="button subtle" data-child="${esc(id)}">הוספת ילד/ה</button></div>`:''}`;
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
  const profileTab=event.target.closest('[data-profile-tab]');if(profileTab){for(const button of $$('#profile-content [role=tab]'))button.setAttribute('aria-selected',String(button===profileTab));for(const panel of $$('#profile-content [role=tabpanel]'))panel.hidden=panel.id!=='profile-panel-'+profileTab.dataset.profileTab;return;}

  const entry=event.target.closest('[data-entry]');if(entry){$('#profile-dialog').close();openEntry(entry.dataset.entry);return;}
  const person=event.target.closest('[data-person]');if(person){$('#entry-dialog').close();openProfile(person.dataset.person);return;}
  const focus=event.target.closest('[data-focus]');if(focus){if(!pageFamily.people.some(p=>p.id===focus.dataset.focus)){toast('האדם נמצא בענף אחר. ניתן לערוך אותו כאן, או לעבור לדף המשפחה שלו.');return;}focusId=focus.dataset.focus;view='tree';query='';$('#search').value='';$('#profile-dialog').close();render();fitTree();return;}
  const nav=event.target.closest('[data-view]');if(nav){view=nav.dataset.view;render();if(view==='tree')fitTree();return;}
  const edit=event.target.closest('[data-edit]');if(edit){openEditor(edit.dataset.edit);return;}
  const child=event.target.closest('[data-child]');if(child){openEditor('',child.dataset.child);return;}
  if(event.target.closest('[data-add]')){view='people';render();toast('בחרו בן משפחה כדי לערוך את הפרטים, התמונות והסיפור שלו.');}
  if(event.target.closest('[data-close]'))event.target.closest('dialog')?.close();
});
document.addEventListener('keydown',event=>{const tab=event.target.closest('[data-profile-tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const buttons=[...$$('#profile-content [role=tab]')],index=buttons.indexOf(tab),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowLeft'?1:-1)+buttons.length)%buttons.length;buttons[next].click();buttons[next].focus();});
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
    if(person.birthPlace!==byId(person.id)?.birthPlace)person.birthLocation=null;person.photo=form.elements.removePhoto.checked?'':pendingPhoto;if(person.photo!==byId(person.id)?.photo){person.photoOriginal='';person.photoCrop=null;}const next=updatePerson(family,person);const stored=saveDraft(next);$('#edit-dialog').close();if(stored)toast('השינוי נשמר בטיוטה המקומית.');
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
