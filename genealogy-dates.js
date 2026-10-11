const MONTHS=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const EN_MONTHS=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
const pad=n=>String(n).padStart(2,'0');
export function isoDate(year,month,day){
 if(![year,month,day].every(Number.isInteger)||year<1||year>9999||month<1||month>12||day<1)return '';
 const leap=year%4===0&&(year%100!==0||year%400===0),days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 return day<=days[month-1]?`${String(year).padStart(4,'0')}-${pad(month)}-${pad(day)}`:'';
}
export function parseFamilyDate(raw=''){
 const text=String(raw).trim();if(!text)return {precision:'unknown',value:'',approximate:false};
 let value=text,approximate=false;
 if(/^(?:בערך\s+|בקירוב\s+|ABT\s+|ABOUT\s+|~\s*)/i.test(value)){approximate=true;value=value.replace(/^(?:בערך\s+|בקירוב\s+|ABT\s+|ABOUT\s+|~\s*)/i,'');}
 if(value.endsWith('?')){approximate=true;value=value.slice(0,-1).trim();}
 if(/^\d{4}$/.test(value)&&Number(value)>0)return {precision:'year',value,approximate};
 let m=value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/),year,month,day;
 if(m){year=+m[1];month=+m[2];day=+m[3];}
 else if((m=value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/))){day=+m[1];month=+m[2];year=+m[3];}
 else if((m=value.match(/^(\d{1,2})\s+(ב?[א-ת]+)\s+(\d{4})$/))){day=+m[1];month=MONTHS.indexOf(m[2].replace(/^ב/,''))+1;year=+m[3];if(!month)return {precision:'legacy',value:text,approximate:false};}
 else if((m=value.match(/^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$/i))){day=+m[1];month=EN_MONTHS.indexOf(m[2].toUpperCase())+1;year=+m[3];if(!month)return {precision:'legacy',value:text,approximate:false};}
 if(m){const iso=isoDate(year,month,day);return {precision:iso?'date':'invalid',value:iso||text,approximate};}
 return {precision:'legacy',value:text,approximate:false};
}
export function normalizeFamilyDate(raw=''){
 const parsed=parseFamilyDate(raw);if(parsed.precision==='invalid')throw new Error('תאריך הלידה אינו תקין. בדקו את היום, החודש והשנה.');
 return parsed.precision==='unknown'?'':parsed.precision==='legacy'?parsed.value:(parsed.approximate?'בערך ':'')+parsed.value;
}
export function displayFamilyDate(raw=''){
 const d=parseFamilyDate(raw);if(d.precision==='date'){const [y,m,day]=d.value.split('-');return (d.approximate?'בערך ':'')+`${day}.${m}.${y}`;}
 return d.precision==='year'?(d.approximate?'בערך ':'')+d.value:String(raw||'');
}
export function calendarDays(year,month){
 const first=new Date(0);first.setUTCFullYear(year,month-1,1);first.setUTCHours(0,0,0,0);
 const days=[];for(let i=0;i<first.getUTCDay();i++)days.push(null);for(let day=1;day<=31;day++){const iso=isoDate(year,month,day);if(!iso)break;days.push(iso);}return days;
}
export const MONTH_NAMES=MONTHS;
