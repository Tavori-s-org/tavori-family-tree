# שורשים — משפחות תבורי וגורשט

אתר אילן יוחסין בעברית, מימין לשמאל, המתארח ב־GitHub Pages. אין צורך בשרת, בבנייה או בחבילות npm.

דף הבית: https://tavori-s-org.github.io/tavori-family-tree/

## שני דפי משפחה

- `tavori.html` — אילן משפחת תבורי, נפתח סביב עומר.
- `gorsht.html` — אילן משפחת גורשט, נפתח סביב מיה.
- דף הבית מציג שתי כניסות נפרדות. החיפוש, רשימת האנשים, האלבום, הסיפורים ובחירת אדם מרכזי מוגבלים למשפחה של הדף.
- עומר, מיה ושלושת ילדיהם מופיעים בשני האילנות. בני זוג ישירים נשמרים בגבול האילן, אך הענף המורחב שלהם אינו מצורף. כרטיס אישי יכול להפנות לקרוב מהאילן האחר באמצעות קישור לדף שלו.
- הנתונים נשארים בקובץ משותף אחד: `data/family.json`. התצוגה בכל דף מסירה הפניות לאנשים שמחוץ לו, בלי לשנות או למחוק את קשרי המקור. הטיוטה והגיבוי כוללים תמיד את שני האילנות.
- במסך הניהול אפשר לבחור אדם מכל המאגר לעריכה ולשייך אנשים מיובאים לענף, לאחר פתיחת הטיוטה המקומית.

## צפייה ועריכה

- כל מבקר רואה את `data/family.json` שפורסם במאגר.
- לחצו **ניהול האילן → פתיחת הטיוטה המקומית** כדי להוסיף ולערוך אנשים, הורים, בני זוג, תמונת פרופיל וסיפור אישי.
- טיוטה נשמרת באחסון המקומי של הדפדפן באותו מכשיר. היא אינה מתפרסמת אוטומטית ואינה מסתנכרנת בין בני משפחה.
- כדי לפרסם: **ייצוא הטיוטה**, ואז העלאת `family.json` לתיקיית `data` במאגר במקום הקובץ הקיים. שמרו commit לענף `main`. GitHub Pages יפרוס את השינוי.
- הרשאות GitHub מגינות על פרסום השינויים; מצב הטיוטה אינו התחברות או מנגנון הרשאות. כל מבקר יכול ליצור טיוטה פרטית בדפדפן שלו, אך לא לשנות את האתר בלי הרשאות למאגר.
- בשלב הראשון רק מנהל האתר מפרסם. לעריכה משותפת דרך האתר בעתיד צריך שירות נתונים והתחברות; GitHub Pages עצמו מארח קבצים סטטיים בלבד.

## נתוני המשפחה

פרטים שהמשפחה לא מסרה נשארים ריקים. שמות זהים נשמרים ברשומות שונות לפי מזהה וקשרים, בלי למזג אנשים אוטומטית. אין להסיק שם נעורים מתואר ההורים או שם משפחה של אדם שלא נמסר.

מידע גלוי שנקרא מ־MyHeritage מסומן בכרטיס האדם באמצעות `source` ו־`sourceNote`. סימן שאלה בתאריך נשמר. קשר בין שמחה ולאה תבורי לבין עמיחי אושר על ידי עומר. אין ייבוא של אנשים ששמם מוסתר במקור.

## תמונות

אפשר להעלות תמונת JPEG, PNG או WebP לכל אדם. האתר מכווץ אותה לגודל מרבי של 640 פיקסלים ושומר אותה בתוך JSON; אין שירות אחסון חיצוני. אלבום התמונות מציג את תמונות הפרופיל שנוספו. תמונות מרובות ומסמכים לכל אדם הם הרחבה עתידית. תמיד שמרו בנפרד את התמונות המקוריות.

## ייבוא

ייבוא JSON מחליף את הטיוטה המקומית לאחר אישור. גיבוי JSON שומר את כל השדות והתמונות של האתר.

ייבוא GEDCOM הוא **חלקי**: שמות, הורים, בני זוג, לידה, פטירה, עיסוק והערות. UTF-8 ו־UTF-16 עם BOM נתמכים; ANSEL ו־ANSI אינם נתמכים. תמונות, מסמכים, מקורות, אירועי נישואין והבחנה בין סוגי הורות אינם נשמרים. אל תשתמשו בייבוא כתחליף לגיבוי המקורי. שמרו את קובץ GEDCOM המקורי כדי להשלים מידע בהמשך. הייבוא בודק הפניות ומונע מעגלי הורות.

## הרצה מקומית

```sh
npm start
# http://127.0.0.1:4173
npm test
```

או הריצו `python3 -m http.server 4173 --bind 127.0.0.1` בתיקיית האתר. פתיחת HTML ישירות מהדיסק אינה מספיקה לטעינת JSON.

לשינוי מבנה דפי המשפחה, ערכו את `templates/family.html` והריצו `npm run build`. הסקריפט מייצר את שני קובצי HTML שמפורסמים במאגר, ללא חבילות חיצוניות. עדכון אנשים או תמונות ב־JSON אינו דורש בנייה.

## GitHub Pages

ב־Settings → Pages: בחרו **Deploy from a branch**, ענף **main**, תיקיית **/(root)**. הקובץ `.nojekyll` מאפשר להגיש את הקבצים כמו שהם. נתיבי האתר יחסיים ולכן עובדים גם בתיקיית פרויקט של Pages.

## ציבוריות ופרטיות

האתר והמאגר ציבוריים לפי בקשת עומר. מידע ותמונות שפורסמו זמינים לכל אדם, גם בקובץ JSON ובהיסטוריית Git. הסרה בתצוגה לא מוחקת עותקים או היסטוריה. פרסמו רק פרטים שבני המשפחה מסכימים לשתף. אין חשבונות משתמשים, כלי מעקב או analytics; GitHub מארח את האתר, וגופנים נטענים מ־Google Fonts. טיוטות אינן מועברות לשרת.

## תצוגת דורות

מעל האילן אפשר לבחור אדם מרכזי ו־3, 4, 5 או את כל הדורות. ברירת המחדל מציגה את דור ההורים של המשפחה הנבחרת, הדור של עומר ומיה ודור הילדים. המספר מונה שורות של דורות; כשנבחר אדם בקצה האילן, הטווח זז כדי לכלול אותו ואת הדורות הקיימים. אין קשר בין מספר הדור לשנת הלידה.

אפשר גם לפתוח כרטיס אישי וללחוץ **הצגה במרכז האילן**. פעולה זו משנה את התצוגה בלבד ואינה עורכת את הנתונים. בחירת דורות מסתירה כרטיסים וקשרים שמחוץ לטווח; הקשרים עצמם נשארים בנתונים. החיפוש יכול לעבור לאדם הנמצא מחוץ לטווח הנוכחי. בני זוג מוצגים באותה שורה, והקשר לילדיהם יוצא מחיבור משותף. לקבצי התצוגה יש סימון גרסה בכתובת כדי להימנע מערבוב גרסאות של JavaScript ו־CSS לאחר פרסום.

## Shared editing

The public pages read current family data from https://tavori-family-editor.blush-guppy-7385.chatgpt.site/api/family. `service.js` contains the service origin and editor links. If the service is unavailable, the pages show the original GitHub JSON backup and a status message. A refresh after editing loads the latest shared records.

“כניסה ועריכה” opens the authenticated family editor in a separate tab. Signed-in guests can update details, relationships and photos directly. D1 persists records and change history; R2 persists compressed images. The editor rejects stale concurrent edits and ancestry cycles. The local draft editor remains a separate manual backup workflow; GitHub changes do not overwrite shared person overlays. When changing the base dataset, update `lib/family.json` in the service too.

The backend checkout is `../family-tree-service`; its source is published through Sites. No authentication tokens are included in the GitHub Pages code.

## Birth surnames, profile details and timeline

The family model preserves optional personal details and custom facts. Birth surnames appear beneath the person's name in the tree and in their profile. Profile photos use the same stored image as the family album. The authenticated editor controls both.

The “סיפורים וזיכרונות” view shows stored memories alongside personal biographies; “ציר זמן” shows historical events ordered by year (undated entries come last). Entries can include a date, location, source link, photo and linked people. Shared entries appear on both family pages; family-specific entries retain the separation between branches. Entry links in a person's profile open their full story. Add/edit actions open the authenticated shared editor.

Local previews on `127.0.0.1` read the backend on port 5173; the public website uses the hosted service. Preview records are separate from production data.
