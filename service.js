const HOSTED_SERVICE_URL = 'https://tavori-family-editor.blush-guppy-7385.chatgpt.site';
export const SERVICE_URL = location.hostname==='127.0.0.1'?'http://127.0.0.1:5173':HOSTED_SERVICE_URL;
export function editorUrl(person='',family='tavori'){const url=new URL('/edit',SERVICE_URL);url.searchParams.set('family',family);if(person)url.searchParams.set('person',person);return url.href;}
export async function loadFamily(){try{const response=await fetch(SERVICE_URL+'/api/family',{cache:'no-store',signal:AbortSignal.timeout(8000)});if(!response.ok)throw new Error('Shared data unavailable');return {family:await response.json(),offline:false};}catch{const response=await fetch('./data/family.json',{cache:'no-cache'});if(!response.ok)throw new Error('לא ניתן לטעון את נתוני המשפחה.');return {family:await response.json(),offline:true};}}

export function entryEditorUrl(kind='memory',family='tavori',entry=''){const url=new URL('/edit/entries',SERVICE_URL);url.searchParams.set('kind',kind);url.searchParams.set('family',family);if(entry)url.searchParams.set('entry',entry);return url.href;}
