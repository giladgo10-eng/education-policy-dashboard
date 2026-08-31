# מילון נתונים (Data Dictionary)
## פרויקט education-policy-dashboard

מסמך זה מגדיר את מבנה הנתונים, שמות השדות, הטיפוסים (Data Types), הערכים המותרים והכללים המתודולוגיים המחייבים בכל קובצי הנתונים שבתיקיית `data/`.

---

## 1. עקרונות יסוד מחייבים בכל קובץ (Core Epistemic Rules)

1. **חובת עיגון מקור (Source Grounding)**:
   כל רשומת נתון (פוליטי, תקציבי, עובדתי או הצהרתי) חייבת להכיל:
   * `sourceId` – מזהה חד-ערכי של מקור תקף המופיע ב-`sources.json`.
   * `sourceType` – סוג המקור (מסמך רשמי, מצע, ספר תקציב וכו').
   * `date` – תאריך פרסום או תאריך האירוע בפורמט תקני `YYYY-MM-DD`.
   * `verificationLevel` – רמת האימות של המקור (`verified_official`, `secondary_academic`, `investigative_media`, `unverified_claim`).
   * `confidenceLevel` – רמת הביטחון בנתון (`high`, `medium`, `low`).

2. **הפרדה אפיסטמית משולשת (Epistemic Separation)**:
   אין לערבב בין עובדה לפרשנות. כל פריט מידע מסווג מפורשות:
   * **`fact` (עובדה)**: מה שנאמר, נחתם, תוקצב או נמדד בפועל במסמך המקור (טקסט מקורי מצוטט, מספר תקציב, חוק).
   * **`analysis` (ניתוח)**: הסבר קונטקסטואלי מקצועי, השוואה היסטורית או ניתוח מבני של המשמעות.
   * **`assessment` (הערכה)**: הערכת השלכות עתידיות, סיכויי יישום פוליטיים או השפעה על השטח לקראת תשפ״ז.

3. **איסור מוחלט על הסקה או המצאת מידע (No Hallucination / No Imputation)**:
   * אם מפלגה לא פרסמה מצע או התייחסות רשמית לסוגיה מסוימת – **אין להסיק את עמדתה**. השדה יישאר `null` או שייקבע סטטוס `not_stated`.
   * אין לייחס לשר או למפלגה כוונה שאינה מגובה בציטוט ישיר או במסמך מחייב.

---

## 2. מפרט הקבצים והשדות

### 2.1. `sources.json` – אינדקס המקורות
| שם שדה | טיפוס | ערכים מותרים / דוגמה | תיאור |
| :--- | :--- | :--- | :--- |
| `id` | String | `SRC-GOV-2022-COAL-LIKUD-RZ` | מזהה חד-ערכי (Primary Key) |
| `title` | String | שם המסמך המלא | כותרת המקור הרשמית |
| `sourceType` | Enum | `official_law`, `government_decision`, `coalition_agreement`, `official_budget`, `cbs_stat`, `knesset_research`, `party_platform`, `state_comptroller`, `court_ruling`, `press_release`, `secondary_research_source` | סוג המקור המהימן (כולל מחקרים פנימיים ומשניים) |
| `publisher` | String | משרד החינוך, הכנסת, הלמ\"ס | הגוף המפרסם |
| `publicationDate` | String | `2022-12-28` (`YYYY-MM-DD`) | תאריך פרסום המקור |
| `url` | String / Null | URL ציבורי ישיר | קישור מקוון למסמך (אם זמין) |
| `localFilePath` | String / Null | `research/raw/budgets/...` | נתיב לקובץ הגולמי השמור בארכיון |
| `archiveHash` | String | `sha256-...` | גיבוב קובץ לצורכי ביקורת ומניעת זיוף |
| `verificationLevel` | Enum | `verified_official`, `cross_referenced`, `single_source`, `unverified` | רמת אמינות ואימות המקור |
| `confidenceLevel` | Enum | `high`, `medium`, `low` | מידת הביטחון באי-תלות ובשלמות המקור |
| `accessDate` | String | `2026-08-31` | תאריך אחזור המקור |
| `language` | String | `he`, `en`, `ar` | שפת המקור |
| `notes` | String | הערות חופשיות | דגשים על תוקף המסמך |

---

### 2.2. `parties.json` – מפלגות וסיעות
| שם שדה | טיפוס | ערכים מותרים / דוגמה | תיאור |
| :--- | :--- | :--- | :--- |
| `id` | String | `PARTY-LIKUD`, `PARTY-YESH-ATID` | מזהה מפלגה ייחודי |
| `nameHe` | String | הליכוד, יש עתיד | שם המפלגה בעברית |
| `nameEn` | String | Likud, Yesh Atid | שם המפלגה באנגלית |
| `knessetFaction25` | String | שם הסיעה הרשמי בכנסת | שם הסיעה כפי שרשום בכנסת ה-25 |
| `statusInKnesset25` | Enum | `coalition_lead`, `coalition_partner`, `opposition`, `extra_parliamentary` | מעמד פוליטי בממשלה/כנסת |
| `currentMinistersInEducation` | Array | `[{ role, name, termStart, sourceId }]` | שרים או סגני שרים מטעמה במשרד החינוך |
| `officialWebsite` | String | כתובת אתר | אתר רשמי של המפלגה |
| `platformDocumentSourceId` | String / Null | מזהה מתוך `sources.json` או `null` | מזהה מסמך המצע הרשמי |
| `confidenceLevel` | Enum | `high`, `medium`, `low` | רמת הביטחון בשיוך |
| `notes` | String | טקסט חופשי | הערות רקע |

---

### 2.3. `issues.json` – סוגיות המדיניות
| שם שדה | טיפוס | ערכים מותרים / דוגמה | תיאור |
| :--- | :--- | :--- | :--- |
| `id` | String | `ISSUE-CORE-CURRICULUM` | מזהה נושא ייחודי |
| `category` | String | תקצוב וצדק חלוקתי, תוכניות לימודים, כוח אדם, גיל הרך | קטגוריית-על של מדיניות החינוך |
| `subCategory` | String | חוק החינוך המיוחד, הסעות | תת-תחום ממוקד |
| `title` | String | עומס תקציבי החינוך המיוחד | כותרת הסוגיה |
| `description` | String | תיאור האתגר והדילמה | תיאור מפורט של הסוגיה המקצועית |
| `significanceRating` | Enum | `high`, `medium`, `low` | מידת הקריטיות למערכת לקראת תשפ״ז |
| `relatedGovAgencies` | Array | משרד החינוך, משרד האוצר, שלטון מקומי | גופים ממשלתיים וציבוריים מעורבים |
| `tags` | Array | תגיות מפתח | תגיות לחיפוש וסינון |

---

### 2.4. `positions.json` – עמדות ומצעי מפלגות (כולל שכבת ניתוח מוניציפלית)
| שם שדה | טיפוס | ערכים מותרים / דוגמה | תיאור |
| :--- | :--- | :--- | :--- |
| `id` | String | `POS-YA-CORE-001` | מזהה עמדה ייחודי |
| `partyId` | String | מזהה מ-`parties.json` | המפלגה המביעה את העמדה |
| `issueId` | String | מזהה מ-`issues.json` | הסוגיה אליה העמדה מתייחסת |
| `topic` | String | התניית תקצוב בלימודי ליבה | נושא ממוקד של העמדה |
| `epistemicType` | Enum | `fact` (תמיד `fact` ברמת הבסיס) | סיווג הנתון הבסיסי כעובדה |
| `verbatimQuote` | String | ציטוט מילה במילה מהמצע | הציטוט המדויק מהמסמך הרשמי |
| `summary` | String | תמצית העמדה בלשון אובייקטיבית | סיכום עובדתי של עיקרי העמדה |
| `stance` | Enum | `pro_enforcement`, `pro_autonomy`, `neutral`, `status_quo`, `undecided`, `not_stated` | כיוון המדיניות המוצעת (אם לא צוינה עמדה במצע ייקבע `not_stated`) |
| `sourceId` | String / Null | מזהה מ-`sources.json` (או `null` עבור `not_stated`) | קישור למקור הרשמי של עמדת המפלגה |
| `sourceType` | Enum | `party_platform`, `official_interview`, `signed_manifesto`, `secondary_research_source` | סוג המקור של עמדת המפלגה |
| `sourceCitation` | String | פרק החינוך, עמ' 18 | מיקום מדויק בתוך המסמך |
| `date` | String | `YYYY-MM-DD` | תאריך פרסום העמדה |
| `verificationLevel` | Enum | `verified_official`, `secondary_academic`, `unverified` | רמת אימות המקור |
| `confidenceLevel` | Enum | `high`, `medium`, `low` | רמת הביטחון בתקפות העמדה |
| `analysis` | Object | `{ epistemicType: "analysis", author, date, text }` | ניתוח הקשרי מופרד |
| `assessment` | Object | `{ epistemicType: "assessment", author, date, text }` | הערכת היתכנות והשלכות מופרדת |
| `municipalImpactAnalysis` | Object / Null | ראו פירוט טבלה 2.4.1 להלן | שכבת ניתוח והשוואה לשלטון המקומי |

#### 2.4.1. מבנה שדה `municipalImpactAnalysis` (שכבת השלטון המקומי)
| שם שדה משנה | טיפוס | ערכים מותרים / דוגמה | תיאור מתודולוגי |
| :--- | :--- | :--- | :--- |
| `currentState` | String | תיאור עובדתי של מדיניות הממשלה ומשרד החינוך כיום | **חובה לבסס על מקור מאומת**. אם אין מקור מספיק: "לא קיים בסיס מספק להשוואה" |
| `currentStateSourceId` | String / Null | מזהה מ-`sources.json` (למשל: `SRC-MOE-GEFEN-DIRECTIVE-2024`) | **חובה לקשר למקור מאומת** המגבה את תיאור המצב הקיים |
| `currentStateCitation` | String / Null | חוזר מנכ"ל, סעיף ד' | מראה מקום מדויק למקור המצב הקיים |
| `changeFromCurrentState` | String | תיאור הניתוח של מה שונה או חדש בהצעת המפלגה | **רובד ניתוח (Analysis)**: מה חדש ביחס למצב הקיים |
| `changeMagnitude` | Enum | `continuation`, `moderate_change`, `significant_change`, `structural_change`, `undetermined` | סיווג היקף ועוצמת השינוי המבני |
| `localAuthorityImpact` | String | תיאור המשמעות המעשית לרשות המקומית | **רובד הערכה (Assessment)**: השלכות על תקציב, סמכויות ותפעול |
| `openImplementationQuestion` | String | שאלה ממוקדת לגבי היתכנות ויישום בשטח | צווארי בקבוק, שיפוי כוח אדם, פערים מוניציפליים |

---

### 2.5. `commitments.json` – התחייבויות שלטוניות (Budget Model V2)
| שם שדה | טיפוס | ערכים מותרים / דוגמה | תיאור |
| :--- | :--- | :--- | :--- |
| `id` | String | `COM-37-OFN-001` | מזהה התחייבות |
| `partyIds` | Array | `["PARTY-LIKUD", "PARTY-SHAS"]` | מפלגות החתומות על ההתחייבות |
| `issueId` | String | מזהה מ-`issues.json` | הסוגיה הרלוונטית |
| `title` | String | החלת 'אופק חדש' ברשתות החרדיות | כותרת ההתחייבות |
| `commitmentType` | Enum | `coalition_agreement`, `government_decision`, `campaign_pledge_and_gov_guidelines`, `budget_law` | סוג ההתחייבות המשפטית/פוליטית |
| `epistemicType` | Enum | `fact` | סיווג הנתון כעובדה חתומה |
| `verbatimText` | String | לשון הסעיף החתום | הציטוט המדויק של סעיף ההסכם |
| `sourceId` | String | מזהה מ-`sources.json` | מסמך המקור |
| `sourceType` | Enum | `coalition_agreement`, `government_decision`, `secondary_research_source` | סוג המקור |
| `sectionRef` | String | סעיף 95 בהסכם | מראה מקום מדויק |
| `date` | String | `YYYY-MM-DD` | תאריך החתימה |
| `targetYear` | String | `2023-2024` | שנת היעד ליישום |
| `budgetYear` | Number / Null | `2023`, `2024` | שנת תקציב רלוונטית |
| `budgetEntity` | String | למשל: `רשת מעיין החינוך התורני (בני יוסף)` | הגוף/התוכנית התקציבית המוגדרת |
| `budgetType` | Enum | `promised`, `baseline_comparison`, `allocated`, `actual` | סיווג מהות הנתון התקציבי |
| `baselineBudgetNIS` | Number / Null | שקלים חדשים (למשל `980100000`) | תקציב בסיס היסטורי טרם ההתחייבות |
| `promisedBudgetNIS` | Number / Null | שקלים חדשים (למשל `1200000000`) | סכום תוספת שהובטח בהסכם/החלטה |
| `allocatedBudgetEstimatedNIS` | Number / Null | שקלים חדשים | תאימות לאחור ל-`promisedBudgetNIS` |
| `comparabilityStatus` | Enum | `comparable`, `partially_comparable`, `not_comparable` | האם ניתן להשוואה ישירה |
| `comparabilityReason` | String | תיאור קצר בעברית | נימוק מתודולוגי ליכולת ההשוואה |
| `verificationLevel` | Enum | `verified_official`, `cross_referenced`, `secondary_academic` | רמת אימות |
| `confidenceLevel` | Enum | `high`, `medium`, `low` | רמת ביטחון |
| `analysis` | Object | שדות ניתוח מופרדים | ניתוח הרקע והמשמעות |
| `assessment` | Object | שדות הערכה מופרדים | הערכת השלכות וחסמים |

---

### 2.6. `execution.json` – מבחן ביצוע מדיניות
| שם שדה | טיפוס | ערכים מותרים / דוגמה | תיאור |
| :--- | :--- | :--- | :--- |
| `id` | String | `EXEC-OFN-2023-2024` | מזהה רשומת ביצוע |
| `commitmentId` | String | מזהה מ-`commitments.json` | קישור להתחייבות שנבחנת |
| `issueId` | String | מזהה מ-`issues.json` | סוגיית המדיניות |
| `title` | String | כותרת מעקב הביצוע | שם הסטטוס |
| `budgetYear` | Number / Null | `2024` | שנת תקציב הביצוע |
| `epistemicType` | Enum | `fact` | סיווג הנתון העובדתי |
| `status` | Enum | `fully_executed`, `partially_executed`, `partially_executed_frozen`, `alternative_execution`, `not_executed_delayed`, `cancelled` | סטטוס הביצוע בפועל |
| `completionPercentage` | Number | `0` עד `100` (למשל `35`) | אחוז ביצוע מוערך או רשמי |
| `allocatedBudgetNIS` | Number / Null | שקלים חדשים (למשל `1200000000`) | סכום שהוקצה/תוקצב בפועל |
| `reportedBudgetNIS` | Number / Null | שקלים חדשים (תאימות לאחור ל-`allocatedBudgetNIS`) | סכום שהוקצה כפי שדווח |
| `actualSpendingNIS` | Number / Null | שקלים חדשים (למשל `550000000`) | ביצוע בפועל (הוצאה בפועל לפי חשכ\"ל) |
| `factualSummary` | String | תיאור עובדתי של מה שקרה | תיאור המציאות בשטח ובקופה |
| `legalStatus` | Enum | `fully_approved`, `pending_hcj_ruling`, `frozen_by_legal_adviser`, `legislation_enacted`, `none` | סטטוס משפטי/רגולטורי |
| `sourceId` | String | מזהה מ-`sources.json` | דוח הביצוע המאמת |
| `sourceType` | Enum | `official_budget`, `state_comptroller`, `government_decision` | סוג המקור |
| `date` | String | `YYYY-MM-DD` | תאריך בדיקת הסטטוס |
| `verificationLevel` | Enum | `verified_official`, `cross_referenced` | רמת אימות הנתון |
| `confidenceLevel` | Enum | `high`, `medium`, `low` | רמת ביטחון |
| `analysis` | Object | שדות ניתוח מופרדים | ניתוח הפערים בין תכנון לביצוע |
| `assessment` | Object | שדות הערכה מופרדים | הערכת ההשלכות לשנת תשפ״ז |

---

### 2.7. `budgets.json` – תקציבי חינוך
| שם שדה | טיפוס | ערכים מותרים / דוגמה | תיאור |
| :--- | :--- | :--- | :--- |
| `id` | String | `BUD-MOE-TOTAL-2024` | מזהה שורת תקציב |
| `year` | Number | `2024`, `2025` | שנת הכספים |
| `budgetCode` | String | `20`, `20.45.02` | תקנת תקציב משרד האוצר/חינוך |
| `title` | String | שם התקנה/סעיף | כותרת שורת התקציב |
| `category` | Enum | `בסיס התקציב`, `כספים קואליציוניים`, `תקציב פיתוח ובינוי`, `תוכניות לאומיות` | סיווג תקציבי |
| `plannedNetBudgetNIS` | Number | שקלים חדשים | תקציב מאושר במקור (חוק התקציב) |
| `updatedNetBudgetNIS` | Number | שקלים חדשים | תקציב על שינוייו (לאחר ועדת כספים) |
| `actualExecutedNIS` | Number | שקלים חדשים | ביצוע נטו בפועל (סגירת שנה) |
| `executionRatePercent` | Number | `98.4` (%) | אחוז ביצוע (ביצוע חלקי מעודכן) |
| `isCoalitionFund` | Boolean | `true` / `false` | האם מקורו בכספים קואליציוניים |
| `beneficiarySector` | String | כללי, חרדי, ממ\"ד, ערבי, מוניציפלי | המגזר הנהנה העיקרי |
| `epistemicType` | Enum | `fact` | סיווג עובדתי |
| `sourceId` | String | מזהה מ-`sources.json` | דוח החשכ\"ל / נתוני האוצר |
| `sourceType` | Enum | `official_budget` | סוג המקור |
| `date` | String | `YYYY-MM-DD` | תאריך פרסום הנתון |
| `verificationLevel` | Enum | `verified_official` | רמת אימות |
| `confidenceLevel` | Enum | `high`, `medium`, `low` | רמת ביטחון |
| `analysis` | Object | שדות ניתוח מופרדים | ניתוח הסטות והשלכות |
| `assessment` | Object | שדות הערכה מופרדים | הערכה לקראת שנות התקציב הבאות |

---

### 2.8. `education-system.json` – תמונת מצב מערכת החינוך
| שם שדה | טיפוס | ערכים מותרים / דוגמה | תיאור |
| :--- | :--- | :--- | :--- |
| `id` | String | `IND-STUDENT-POPULATION-5786` | מזהה מדד ייחודי |
| `category` | Enum | `דמוגרפיה ואוכלוסיות`, `חינוך מיוחד`, `כוח אדם והוראה`, `הישגים לימודיים`, `בינוי ותשתיות`, `שלטון מקומי ופערים` | תחום המדד |
| `indicatorName` | String | סך כל התלמידים במערכת | שם המדד העובדתי |
| `schoolYear` | String | `תשפ״ו`, `תשפ״ז` | שנת הלימודים |
| `calendarYear` | Number | `2025`, `2026` | שנה אזרחית מקבילה |
| `epistemicType` | Enum | `fact` | סיווג עובדתי |
| `value` | Number | `2550000` | ערך המדד |
| `unit` | String | `students`, `teachers`, `NIS`, `percent` | יחידת מידה |
| `breakdownBySector` | Object / Null | `{ hebrewStateGeneral, hebrewStateReligious, harediUltraOrthodox, arabAndDruze }` | פילוח לפי זרמי חינוך |
| `sourceId` | String | מזהה מ-`sources.json` | שנתון למ\"ס / דוח משרד החינוך |
| `sourceType` | Enum | `cbs_stat`, `official_law`, `state_comptroller` | סוג המקור |
| `date` | String | `YYYY-MM-DD` | תאריך איסוף/פרסום הנתון |
| `verificationLevel` | Enum | `verified_official` | רמת אימות |
| `confidenceLevel` | Enum | `high`, `medium`, `low` | רמת ביטחון |
| `analysis` | Object | שדות ניתוח מופרדים | ניתוח המגמה הסטטיסטית |
| `assessment` | Object | שדות הערכה מופרדים | הערכת השפעה על פתיחת שנת הלימודים |

---

## 3. כללי אימות ושלמות (Validation Rules)

1. **Foreign Key Integrity**:
   כל `sourceId` המופיע בקובצי `positions.json`, `commitments.json`, `execution.json`, `budgets.json`, `education-system.json` **חייב להתקיים** ב-`sources.json`.
2. **Strict Enum Values**:
   לא תותר חריגה מערכי ה-Enums המוגדרים בסעיף זה (כגון `verificationLevel`, `confidenceLevel`, `epistemicType`, `stance`).
3. **No Unsourced Assertions & The not_stated Exception**:
   * שדה `sourceId` אינו יכול להיות ריק (`null` או מחרוזת ריקה) באף שורת נתון עובדתית, עמדה פעילה או התחייבות.
   * **חריג מפורש**: כאשר הרשומה מסומנת באופן מפורש כ-`stance: "not_stated"` או `status: "not_available"`, ואין בה טענה עובדתית פוזיטיבית, מותר להשאיר `sourceId: null` או שדה ריק, כדי לא ליצור מקור מלאכותי פיקטיבי רק לשם מעבר ולידציה.
4. **עקביות נתונים כספיים (Financial Traceability)**:
   * `promisedBudgetNIS`: סכום שהובטח במסמך ההסכם/החלטה.
   * `allocatedBudgetNIS`: סכום שהוקצה/תוקצב בפועל לפי חוקי ותקנות התקציב.
   * `actualSpendingNIS`: ביצוע בפועל לפי נתוני סגירת שנה של החשכ\"ל.
   * `budgetYear`: שנת התקציב הרלוונטית.
