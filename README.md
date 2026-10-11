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

האתר והמאגר ציבוריים לפי בקשת עומר. מידע ותמונות שפורסמו זמינים לכל אדם, גם בקובץ JSON ובהיסטוריית Git. הסרה בתצוגה לא מוחקת עותקים או היסטוריה. פרסמו רק פרטים שבני המשפחה מסכימים לשתף. הצפייה פתוחה, והעריכה המשותפת דורשת התחברות עם ChatGPT. אין כלי מעקב או analytics; GitHub מארח את האתר, וגופנים נטענים מ־Google Fonts. טיוטות אינן מועברות לשרת.

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

## מרכוז תמונה וכרטיס אישי

העורך המשותף פותח תצוגה מקדימה לפני העלאת תמונת פרופיל. אפשר לגרור, להגדיל, להזיז עם החצים או המחוונים ולאפס למרכז. אחרי “שימוש בתמונה” יש לשמור את פרטי האדם. אפשר לחזור ל“שינוי מרכוז התמונה” גם לאחר השמירה; נשמרים צילום מלא עד 1600 פיקסלים, חיתוך ריבועי 640 פיקסלים ונתוני המיקום. האילן, האלבום והכרטיס האישי משתמשים באותו חיתוך. ביטול בחלון המרכוז שומר על התמונה הקודמת.

כרטיס האדם הציבורי כולל לשוניות לפרטים אישיים, למשפחה ולסיפור וזיכרונות. תאריכים ומקומות מוצגים יחד בתחנות החיים, לצד קבוצות של שם וזהות, חיי היומיום ופרטים נוספים. קשרי משפחה כוללים הורים, בני זוג, ילדים ואחים ואחיות שנרשמו באילן. העורך מחלק את השדות לקבוצות תואמות, מאפשר בחירת קשרים ללא Ctrl/⌘ ומציג מצב של שינויים שטרם נשמרו.

## תאריך ומקום לידה

העורך המשותף כולל לוח שנה עם בחירה ישירה של חודש ושנה, ותאריך מוצג כ־DD.MM.YYYY. אפשר לציין שנה בלבד ולסמן מידע משוער. תאריכים מלאים נשמרים כ־YYYY-MM-DD; צורות מוכרות של תאריכים קיימים נקראות בלי לשנות את מידת הדיוק. שנים בשתי ספרות ותאריכים היסטוריים שאינם חד־משמעיים נשמרים להשלמה ידנית; אין בחירה אוטומטית של המאה.

מקום לידה יכול להיות בית חולים בישראל, מדינה / אזור בחו״ל עם עיר ובית חולים להזנה, או מקום אחר / היסטורי. 29 בתי חולים זמינים לחיפוש לפי שם ועיר. רשימת המדינות כוללת 248 קודי מדינה / אזור של האו״ם ושמותיהם בעברית. birthLocation שומר את הבחירה המובנית; birthPlace נשאר תיאור תואם עבור הכרטיס והגיבויים. מקום קיים ללא בחירה מובנית נשמר כמו שנמסר, בלי להסיק מדינה לפי גבולות של ימינו.

מקורות לרשימה, נבדקו ב־11.10.2026: [שמות בתי חולים ברשימה הממשלתית](https://www.gov.il/BlobFolder/generalpage/names_destinations_training_signage/he/TRAFFIC_PLANNING_%D7%9E%D7%A1%D7%9E%D7%9A_%D7%A9%D7%9E%D7%95%D7%AA_%D7%99%D7%A2%D7%93%D7%99%D7%9D_%D7%91%D7%A9%D7%99%D7%9C%D7%95%D7%98_%D7%94%D7%93%D7%A8%D7%9B%D7%94-1902.pdf), [מרכזים רפואיים ממשלתיים](https://www.gov.il/he/departments/dynamiccollectors/health-centers-list-db?skip=0), [מוסדות ציבוריים שאינם ממשלתיים](https://www.gov.il/BlobFolder/reports/list-general-public-medical-institutions-non-governmental/he/units_construction_list-general-public-medical-institutions-non-governmental.pdf), [קודי מדינות ואזורים UN M49](https://unstats.un.org/unsd/methodology/m49/overview/). הרשימה מאפשרת לתעד מקום לידה ואינה קביעה שבית חולים מסוים מציע כיום שירותי לידה.

## חקר המשפחה וקישורים לשיתוף

הכפתור “איך אנחנו קשורים?” מעל האילן ובפרופיל פותח מסלול בין שני אנשים. אפשר לבחור אדם מכל אחד משני הענפים. המסלול מחושב לפי המזהים וקשרי ההורים / הילדים / הזוגיות הקיימים, ומציג את האנשים ואת סוג הקשר בכל שלב; אין הסקת קשר ביולוגי או מיזוג לפי שמות. מובא מסלול קצר אחד גם כאשר קיימים כמה מסלולים. קישור לקרוב מהמשפחה השנייה פותח את הפרופיל בדף שלה.

לשונית “ציר זמן אישי” בכרטיס האדם מאחדת לידה, פטירה, לידות ילדים שידוע תאריכם וזיכרונות / אירועים הקשורים לאדם ושייכים לדף המשפחה. אירועים עם תאריך מוכר מסודרים כרונולוגית; מידע ללא תאריך מוכר מופיע בסוף. גיל מחושב רק משני תאריכים מלאים ומדויקים. קישור לפרופיל מועתק באמצעות “העתקת קישור לפרופיל” ונפתח ישירות בכרטיס באמצעות `?person=<id>&profile=<id>`; פרמטר `person` לבדו ממשיך למרכז את האילן.

“ימי הולדת” מציג את המועד הבא של כל יום הולדת עם תאריך מלא ומדויק, אפשר לסנן לפי חודש ולחפש אדם. אדם עם מצב “לזכרם” או תאריך פטירה אינו מופיע; מצב חיים לא ידוע מסומן, ללא חישוב גיל. 29 בפברואר נשמר במועד המקורי ומוצג בשנה המעוברת הבאה. “היום” מחושב לפי אזור הזמן Asia/Jerusalem. לא נשלחים מסרונים, דוא״ל או תזכורות.

רשימת בני המשפחה מאפשרת סינון לפי מצב חיים ותמונת פרופיל ומיון לפי שם או תאריך לידה, עם תאריכים חסרים בסוף. החיפוש כולל גם שם נעורים, כינויים, עיסוק ומקומות; הוא מתעלם מניקוד ואינו מבחין בין אותיות גדולות וקטנות. הסינון מוגבל למשפחה של הדף. תצוגות הרשימה מקצרות את הפתיח כדי להציג את התוכן מיד.

השראה תפקודית: [מסלולי קרבה ב־MyHeritage](https://blog.myheritage.com/2021/09/new-relationship-diagram-on-myheritage/), [ציר הזמן של MyHeritage](https://www.myheritage.com/help/en/articles/12889322-what-is-the-family-tree-timeline-and-how-do-i-use-it), [זיכרונות המשויכים לאדם ב־FamilySearch](https://www.familysearch.org/en/help/helpcenter/article/how-do-i-view-my-ancestors-memories-photos-stories-documents-and-audio-files). השיפורים קוראים את הנתונים הקיימים בלבד ואינם מוסיפים מידע משפחתי או משנים את הרשאות העריכה.
