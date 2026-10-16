import {normalizeFamily,projectFamily,layoutTree} from './model.js?v=20261016-9';
import {loadFamily} from './service.js?v=20261016-9';
try{
  const family=normalizeFamily((await loadFamily()).family);
  for(const branch of ['tavori','gorsht']){
    const page=projectFamily(family,branch),count=page.people.length,generations=layoutTree(page.people).rows.filter(Boolean).length;
    document.querySelector(`#${branch}-summary`).textContent=`${count} בני משפחה · ${generations} דורות`;
  }
}catch{
  for(const branch of ['tavori','gorsht'])document.querySelector(`#${branch}-summary`).textContent='לאילן המשפחה';
}
