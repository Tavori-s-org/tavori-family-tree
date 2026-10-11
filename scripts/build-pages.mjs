import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),template=await readFile(new URL('templates/family.html',root),'utf8');
const pages=[
  {key:'tavori',name:'משפחת תבורי',caption:'הענף של עומר ומשפחתו',color:'green'},
  {key:'gorsht',name:'משפחת גורשט',caption:'הענף של מיה ומשפחתה',color:'clay'}
];
for(const page of pages){
  const tokens={FAMILY_KEY:page.key,FAMILY_LABEL:page.name,FAMILY_CAPTION:page.caption,FAMILY_COLOR:page.color,TAVORI_ACTIVE:page.key==='tavori'?'active':'',GORSHT_ACTIVE:page.key==='gorsht'?'active':'',TAVORI_CURRENT:page.key==='tavori'?'aria-current="page"':'',GORSHT_CURRENT:page.key==='gorsht'?'aria-current="page"':''};
  const html=template.replace(/__([A-Z_]+)__/g,(_,key)=>{if(!(key in tokens))throw new Error(`Unknown template token: ${key}`);return tokens[key];});
  await writeFile(new URL(`${page.key}.html`,root),html);
}
console.log('Created tavori.html and gorsht.html');
