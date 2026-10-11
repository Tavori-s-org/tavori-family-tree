import {normalizeFamily,projectFamily,layoutTree} from './model.js?v=20261011-3';
try{
  const response=await fetch('./data/family.json',{cache:'no-cache'});
  if(!response.ok)throw new Error('Family data unavailable');
  const family=normalizeFamily(await response.json());
  for(const branch of ['tavori','gorsht']){
    const page=projectFamily(family,branch),count=page.people.length,generations=layoutTree(page.people).rows.filter(Boolean).length;
    document.querySelector(`#${branch}-summary`).textContent=`${count} בני משפחה · ${generations} דורות`;
  }
}catch{
  for(const branch of ['tavori','gorsht'])document.querySelector(`#${branch}-summary`).textContent='לאילן המשפחה';
}
