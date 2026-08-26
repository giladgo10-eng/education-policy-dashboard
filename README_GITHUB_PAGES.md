# מדריך פרסום דשבורד מצרפי ב־GitHub Pages (Zero PII)
### מערכת טיוב והאחדת רשימות – איגוד מנהלי אגפי ומחלקות החינוך
**גרסת מוצר ציבורית:** `UNION_DASHBOARD_PUBLIC_DEMO_V1.0`

תיקיית [dashboard_demo/](file:///c:/Users/giladgo/Documents/AAA%D7%92%D7%9C%D7%A2%D7%93%20%D7%9B%D7%9C%D7%9C%D7%99/%D7%90%D7%99%D7%92%D7%95%D7%93%20%D7%AA%D7%A9%D7%A4%D7%95%202025-2026/%D7%9E%D7%A2%D7%A8%D7%9B%D7%AA%20%D7%98%D7%99%D7%95%D7%91%20%D7%A8%D7%A9%D7%99%D7%9E%D7%95%D7%AA%20%D7%90%D7%99%D7%92%D7%95%D7%93/dashboard_demo/) היא אתר סטטי עצמאי מלא (Static Website) המבוסס על **נתונים מצרפיים בלבד (Zero PII / Pure Statistical Model)**.

---

## 🔒 אישור אבטחה ופרטיות מחמיר (Zero PII Audit Passed)

* **0 נתונים ברמת אדם:** אין שמות, אין טלפונים, אין מיילים, אין תעודות זהות ואין רשומות פרטניות.
* **0 מזהים פסאודונימיים:** אין מזהי Master (`MST-`), אין מזהי מקור ואין שמות מוסווים.
* **כלל פרטיות $k \ge 5$:** כל פילוח מוניציפלי או מקצועי שבו פחות מ-5 רשומות קובץ תחת קטגוריית "אחר / רשויות נוספות (<5)".
* **0 נתיבי מחשב מקומיים:** אין נתיבי `C:\` או הפניות מחוץ לתיקיית הדמו.

---

## 🚀 הוראות פרסום ב־GitHub Pages

### שלב 1: יצירת מאגר ב־GitHub
1. פתח את GitHub וצור מאגר ציבורי חדש (New Repository), לדוגמה: `education-union-dashboard-demo`.

### שלב 2: העלאת הקבצים
העלה את כל הקבצים מתוך התיקייה **`dashboard_demo/`** לשורש המאגר (Root):
* `.nojekyll`
* `index.html`
* `styles.css`
* `app.js`
* `data/aggregated_data.json`
* `data/aggregated_data.js`
* `libs/xlsx.full.min.js`
* `PRIVACY_SCAN_REPORT.md`

### שלב 3: הפעלת GitHub Pages
1. בהגדרות המאגר ב-GitHub: **Settings** -> **Pages**.
2. תחת **Build and deployment**:
   * **Source:** בחר `Deploy from a branch`.
   * **Branch:** בחר `main` (או `master`), ובתיקייה בחר `/ (root)`.
3. לחץ **Save**.
4. בתוך כדקה האתר יפורסם בכתובת:
   `https://<your-username>.github.io/education-union-dashboard-demo/`

---

## 📋 רשימת הקבצים בתיקיית `dashboard_demo/`

| שם הקובץ | תפקיד |
| :--- | :--- |
| **`.nojekyll`** | מניעת סינון קבצים ב-GitHub Pages |
| **`index.html`** | עמוד הדשבורד הראשי (ממשק מצרפי מלא RTL) |
| **`styles.css`** | עיצוב וטיפוגרפיה |
| **`app.js`** | לוגיקת תצוגה מצרפית וייצוא דוחות |
| **`data/aggregated_data.json`** | מאגר נתונים מצרפי טהור (Zero PII) |
| **`data/aggregated_data.js`** | טעינה אופליין ללא CORS |
| **`libs/xlsx.full.min.js`** | ספריית SheetJS מקומית לייצוא דוחות מצרפיים |
| **`PRIVACY_SCAN_REPORT.md`** | דוח סריקת אבטחה ופרטיות רשמי |
