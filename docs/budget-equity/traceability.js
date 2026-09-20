// ==============================================================================
// traceability.js - Data Provenance, Traceability & Methodology Engine
// Methodology Version: Methodology v0.9 — Draft / Baseline 2024
// ==============================================================================

window.METHODOLOGY_VERSION = "Methodology v0.9 — Draft / Baseline 2024";

// 1. Official Sources Catalog
window.OfficialSourcesCatalog = [
  {
    id: "moin_audited_2024",
    name: "דוחות כספיים מבוקרים של הרשויות המקומיות בישראל (טופס 2 ופרק 6 - חינוך)",
    publisher: "משרד הפנים — מינהל השלטון המקומי, אגף בכיר לתקצוב ופיתוח",
    dataYear: "2024 (מבוקר)",
    officialUrl: "https://www.gov.il/he/departments/ministry_of_interior",
    projectFile: "data/raw/moin/moin_audited_local_authorities_2024.xlsx",
    variables: [
      "סך הוצאות חינוך בתקציב הרגיל (קוד 1486)",
      "סך תקבולי חינוך והשתתפות משה\"ח בתקציב הרגיל (קוד 1384)",
      "סך הכנסות עצמיות (קוד 1805)",
      "סך הכנסות התקציב הרגיל (קוד 4162)",
      "הכנסות מארנונה שאינה למגורים - מסחר, תעשייה ומשרדים (קוד 4146)",
      "מענק איזון כללי ממשרד הפנים (קוד 1819)"
    ],
    status: "VERIFIED_PROJECT_SOURCE",
    notes: "דוחות מבוקרים ע\"י רואי חשבון מטעם משרד הפנים לכל 257 הרשויות המקומיות."
  },
  {
    id: "cbs_socio_2021",
    name: "מדד חברתי-כלכלי של הרשויות המקומיות (פרסום רשמי 1904)",
    publisher: "הלשכה המרכזית לסטטיסטיקה (למ\"ס)",
    dataYear: "2021 (עדכון אחרון תקף)",
    officialUrl: "https://www.cbs.gov.il/he/publications/Pages/2023/socio-economic-index-2021.aspx",
    projectFile: "data/raw/cbs/table_01.xlsx",
    variables: [
      "אשכול חברתי-כלכלי רשמי (1–10)",
      "דירוג סוציו-אקונומי ארצי (1–257)",
      "ציון מדד חברתי-כלכלי רציף (Z-Score)"
    ],
    status: "VERIFIED_PROJECT_SOURCE",
    notes: "מדד רב-משתני הכולל 14 אינדיקטורים של רמת חיים, תעסוקה, השכלה והכנסה."
  },
  {
    id: "cbs_periphery_2020",
    name: "מדד פריפריאליות של הרשויות המקומיות (מיפוי מרחק ונגישות פוטנציאלית)",
    publisher: "הלשכה המרכזית לסטטיסטיקה (למ\"ס)",
    dataYear: "2020 (עדכון אחרון תקף)",
    officialUrl: "https://www.cbs.gov.il/he/publications/Pages/2022/periphery-index-2020.aspx",
    projectFile: "data/raw/cbs/p_libud_24.xlsx",
    variables: [
      "אשכול פריפריאליות (1–10)",
      "ציון מדד פריפריאליות רציף (1 = פריפריאלי ביותר, 10 = מרכזי ביותר)"
    ],
    status: "VERIFIED_PROJECT_SOURCE",
    notes: "מודד נגישות תחבורתית ומרחק גיאוגרפי משוקלל למוקדי תעסוקה ומרכז הארץ."
  },
  {
    id: "cbs_population_2024",
    name: "מפקד ואומדני אוכלוסייה רשמיים ברשויות המקומיות",
    publisher: "הלשכה המרכזית לסטטיסטיקה ומשרד הפנים",
    dataYear: "2024",
    officialUrl: "https://www.cbs.gov.il/he/settlements/Pages/default.aspx",
    projectFile: "משולב בדוחות המבוקרים ובנתוני הלמ\"ס",
    variables: [
      "מספר תושבים רשמי ברשות מקומית",
      "סיווג מוניציפלי (עירייה / מועצה מקומית / מועצה אזורית)",
      "שיוך מחוזי מנהלי"
    ],
    status: "VERIFIED_PROJECT_SOURCE",
    notes: "משמש כמכנה משותף לכלל חישובי ההוצאה והמענקים לנפש."
  }
];

// 2. Data Traceability Dictionary ("איך חושב?")
window.DataTraceabilityDictionary = {
  "cbs_socio_cluster": {
    label: "אשכול חברתי-כלכלי (למ\"ס)",
    category: "OFFICIAL_DATA",
    categoryLabel: "נתון רשמי",
    categoryColor: "#10b981",
    sourceBody: "הלשכה המרכזית לסטטיסטיקה (למ\"ס)",
    sourceDoc: "מדד חברתי-כלכלי של הרשויות המקומיות 2021 (פרסום 1904)",
    sourceField: "עמודת 'אשכול' בלוח 1 של פרסום הלמ\"ס",
    calculation: "סיווג רשמי של הלמ\"ס מ-1 (החלש ביותר) עד 10 (האיתן ביותר). ללא עיבוד נוסף.",
    formula: "ללא נוסחה — ערך מקור גולמי מהלמ\"ס",
    limitations: "מתעדכן אחת למספר שנים; נתוני המדד הרשמי העדכני ביותר מתייחסים לשנת 2021."
  },
  "cbs_periphery_cluster": {
    label: "אשכול פריפריאליות (למ\"ס)",
    category: "OFFICIAL_DATA",
    categoryLabel: "נתון רשמי",
    categoryColor: "#10b981",
    sourceBody: "הלשכה המרכזית לסטטיסטיקה (למ\"ס)",
    sourceDoc: "מדד פריפריאליות של הרשויות המקומיות 2020",
    sourceField: "עמודת 'אשכול פריפריאליות' בקובץ p_libud_24",
    calculation: "סיווג רשמי של הלמ\"ס מ-1 (פריפריאלי ביותר) עד 10 (מרכזי ביותר).",
    formula: "ללא נוסחה — ערך מקור גולמי מהלמ\"ס",
    limitations: "מתמקד במרחק גיאוגרפי ונגישות תחבורתית, אינו מודד מצב כלכלי של התושבים."
  },
  "population": {
    label: "אוכלוסיית הרשות",
    category: "OFFICIAL_DATA",
    categoryLabel: "נתון רשמי",
    categoryColor: "#10b981",
    sourceBody: "הלשכה המרכזית לסטטיסטיקה ומשרד הפנים",
    sourceDoc: "דוחות כספיים מבוקרים 2024 וקובץ יישובים רשמי",
    sourceField: "אוכלוסייה רשמית לסוף שנת 2024",
    calculation: "מספר התושבים הרשומים ברשות.",
    formula: "ללא נוסחה — ערך מקור גולמי",
    limitations: "מבוסס מרשם אוכלוסין רשמי (אינו כולל שוהים זמניים או אוכלוסייה לא רשומה)."
  },
  "education_expense_1486_tk": {
    label: "סך הוצאות חינוך בתקציב הרגיל (קוד 1486)",
    category: "OFFICIAL_DATA",
    categoryLabel: "נתון רשמי",
    categoryColor: "#10b981",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "פרק 6 (דוח ביצוע תקציב רגיל - הוצאות חינוך)",
    sourceField: "קוד סעיף תקציבי 1486 — 'סך הוצאות חינוך'",
    calculation: "סך כל ההוצאות הרשמיות של הרשות המקומית על שירותי חינוך (הוראה, מנהלה, אחזקה, הסעות ושירותים תומכים).",
    formula: "ללא נוסחה — ערך מבוקר גולמי (באלפי ש\"ח)",
    limitations: "משקף תקציב רגיל בלבד; אינו כולל השקעות בינוי ופיתוח מתוך תקציב בלתי רגיל (תב\"ר)."
  },
  "education_revenue_1384_tk": {
    label: "סך תקבולי חינוך והשתתפות המדינה (קוד 1384)",
    category: "OFFICIAL_DATA",
    categoryLabel: "נתון רשמי",
    categoryColor: "#10b981",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "פרק 6 (דוח ביצוע תקציב רגיל - הכנסות חינוך)",
    sourceField: "קוד סעיף תקציבי 1384 — 'סך הכנסות חינוך והשתתפויות'",
    calculation: "סך כל התקבולים הייעודיים שהועברו לרשות ממשרד החינוך, משרדי ממשלה אחרים וגורמי חוץ עבור סעיפי חינוך.",
    formula: "ללא נוסחה — ערך מבוקר גולמי (באלפי ש\"ח)",
    limitations: "מבטא החזרי שכר והשתתפויות בפועל המדווחות בדוח הכספי של הרשות."
  },
  "education_net_difference_tk": {
    label: "השתתפות עצמית נטו של הרשות בחינוך",
    category: "CALCULATED_METRIC",
    categoryLabel: "נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "נגזר מדוחות כספיים מבוקרים 2024 (משרד הפנים)",
    sourceDoc: "פרק 6 — הפרש סעיפים מבוקרים",
    sourceField: "הפרש בין סעיף 1486 לסעיף 1384",
    calculation: "הפחתת תקבולי משרד החינוך (1384) מסך הוצאות החינוך הכוללות (1486). זהו הסכום המדויק שמומן מקופתה העצמית של הרשות (מארנונה ומקורות עצמיים).",
    formula: "השתתפות עצמית נטו (אלפי ₪) = הוצאות חינוך (1486) - תקבולי חינוך (1384)",
    limitations: "ערך זה מייצג השקעה מוניציפלית נטו מתוך תקציב הרשות בלבד."
  },
  "municipal_education_self_funding_rate": {
    label: "שיעור השתתפות עצמית בחינוך (%)",
    category: "CALCULATED_METRIC",
    categoryLabel: "נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "נגזר מדוחות כספיים מבוקרים 2024 (משרד הפנים)",
    sourceDoc: "פרק 6 — יחס תקציבי",
    sourceField: "חישוב מנה: (השתתפות עצמית נטו / הוצאות חינוך 1486) * 100",
    calculation: "אחוז ההוצאה שמומן ממקורותיה העצמיים של הרשות מתוך כלל תקציב החינוך המקומי שלה.",
    formula: "שיעור השתתפות עצמית (%) = [(1486 - 1384) / 1486] × 100",
    limitations: "ברשויות שבהן ההוצאה נמוכה מאוד, אחוז נמוך משקף תלות מוחלטת בהשתתפות ממשלתית."
  },
  "education_net_expenditure_per_capita_nis": {
    label: "הוצאה עצמית נטו לנפש בחינוך (₪/נפש)",
    category: "CALCULATED_METRIC",
    categoryLabel: "נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "שקלול דוחות מבוקרים 2024 עם מפקד אוכלוסין",
    sourceDoc: "פרק 6 + למ\"ס אוכלוסייה",
    sourceField: "השתתפות עצמית נטו כפול 1,000 מחולק באוכלוסייה",
    calculation: "סך ההשתתפות העצמית נטו של הרשות בשקלים מחולק במספר תושבי הרשות.",
    formula: "הוצאה לנפש (₪) = [השתתפות עצמית נטו (אלפי ₪) × 1,000] / אוכלוסייה",
    limitations: "מחושב לכלל תושבי הרשות (לנפש). ניתן לבחון בהמשך גם מדד לנפש תלמיד."
  },
  "own_revenue_share_pct": {
    label: "שיעור הכנסות עצמיות מתוך התקציב הרגיל (%)",
    category: "CALCULATED_METRIC",
    categoryLabel: "נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "משרד הפנים (דוחות כספיים מבוקרים 2024)",
    sourceDoc: "דוח ביצוע תקציב רגיל — הכנסות",
    sourceField: "יחס בין סעיף 1805 (הכנסות עצמיות) לסעיף 4162 (סך הכנסות)",
    calculation: "מדד העצמאות והאיתנות הפיסקלית של הרשות: אחוז ההכנסות מארנונה, אגרות והיטלים מתוך סך התקציב.",
    formula: "שיעור הכנסות עצמיות (%) = [סך הכנסות עצמיות (1805) / סך כל הכנסות הרשות (4162)] × 100",
    limitations: "רשויות עם אזורי תעשייה ומסחר גדולים נהנות משיעור גבוה במיוחד."
  },
  "composite_need_score": {
    label: "ציון צורך משולב של הרשות (Composite Need)",
    category: "POLICY_CHOICE",
    categoryLabel: "הנחת מדיניות מוצעת",
    categoryColor: "#8b5cf6",
    sourceBody: "איגוד מנהלי אגפי ומחלקות החינוך — מודל מדיניות מוצע",
    sourceDoc: "מתודולוגיה מוצעת לתקצוב דיפרנציאלי מתקן",
    sourceField: "שקלול שלושת רכיבי המודל: סוציו (50%), פריפריה (30%), גירעון פיסקלי (20%)",
    calculation: "ציון מנורמל בטווח 0.0 עד 1.0 המבטא את מידת הצורך היחסי של הרשות במשאבי חינוך מתקנים.",
    formula: "ציון צורך = (0.50 × ציון סוציו) + (0.30 × ציון פריפריה) + (0.20 × גירעון פיסקלי)\nכאשר:\n• ציון סוציו = (11 - אשכול למ\"ס) / 10\n• ציון פריפריה = (11 - אשכול פריפריה) / 10\n• גירעון פיסקלי = max(0, 100 - שיעור הכנסות עצמיות) / 100",
    limitations: "משקולות 50/30/20 הן בחירת מדיניות נורמטיבית של האיגוד לצורך סימולציה, ולא נוסחה מחייבת בחוק."
  },
  "simulated_grant_per_capita": {
    label: "מענק מוצע בסימולציה לנפש (₪/נפש)",
    category: "SIMULATION_OUTPUT",
    categoryLabel: "תוצאת סימולציה",
    categoryColor: "#f59e0b",
    sourceBody: "מנוע סימולציית הקצאה מתקנת (EducationSimulator)",
    sourceDoc: "תרחיש סל תקציב מתקן מוצע",
    sourceField: "הקצאה יחסית מתוך סל התקציב (ברירת מחדל: 1 מיליארד ₪)",
    calculation: "סכום המענק שהרשות הייתה מקבלת אילו הופעל מודל ההקצאה המוצע ע\"י האיגוד.",
    formula: "מענק לרשות = סל התקציב × [אוכלוסייה × (ציון צורך)^1.4] / סך כל הציונים המשוקללים בארץ\nמענק לנפש = מענק לרשות / אוכלוסייה",
    limitations: "זוהי סימולציה היפותטית של הצעת מדיניות! אין מדובר בתקציב שהוקצה בפועל ע\"י הממשלה."
  },
  "gini_coefficient": {
    label: "מדד ג'יני לאי-שוויון בהוצאה העצמית בחינוך",
    category: "CALCULATED_METRIC",
    categoryLabel: "נתון מחושב",
    categoryColor: "#2563eb",
    sourceBody: "חישוב סטטיסטי משוקלל אוכלוסייה",
    sourceDoc: "עקומת לורנץ של התפלגות ההוצאה העצמית נטו לנפש",
    sourceField: "אינטגרציית עקומת לורנץ לפי אוכלוסיית 257 הרשויות",
    calculation: "מדד סטטיסטי תקני (0 עד 1) המודד את רמת הריכוזיות ואי-השוויון בהוצאה העצמית נטו של הרשויות המקומיות בישראל.",
    formula: "G = 1 - 2 × שטח מתחת לעקומת לורנץ המשוקללת באוכלוסייה",
    limitations: "מודד אך ורק אי-שוויון בהוצאה העצמית של הרשויות (מתקציבן המקומי); אינו מודד את כלל אי-השוויון במערכת החינוך."
  }
};

window.DataTraceabilityEngine = {
  // Shows modal dialog explaining "איך חושב?"
  showTraceabilityModal: function(varKey) {
    const info = window.DataTraceabilityDictionary[varKey];
    if (!info) {
      console.warn("Traceability key not found:", varKey);
      return;
    }

    let modal = document.getElementById("traceabilityModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "traceabilityModal";
      modal.className = "trace-modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="trace-modal-dialog">
        <div class="trace-modal-header">
          <div>
            <span class="trace-tag" style="background:${info.categoryColor}20; color:${info.categoryColor}; border: 1px solid ${info.categoryColor}40;">
              ${info.categoryLabel}
            </span>
            <h3 class="trace-modal-title">${info.label}</h3>
          </div>
          <button class="trace-modal-close" onclick="document.getElementById('traceabilityModal').style.display='none'">&times;</button>
        </div>
        
        <div class="trace-modal-body">
          <div class="trace-row">
            <span class="trace-label">🏛️ גוף מקור רשמי:</span>
            <span class="trace-val font-bold">${info.sourceBody}</span>
          </div>
          <div class="trace-row">
            <span class="trace-label">📄 מסמך / קובץ מקור:</span>
            <span class="trace-val">${info.sourceDoc}</span>
          </div>
          <div class="trace-row">
            <span class="trace-label">🔍 שדה / קוד סעיף:</span>
            <span class="trace-val font-mono">${info.sourceField}</span>
          </div>
          
          <div class="trace-box" style="margin-top:14px;">
            <div class="trace-box-title">📐 שיטת החישוב והגזירה:</div>
            <p style="margin:0 0 8px 0; font-size:14px; line-height:1.5;">${info.calculation}</p>
            <div class="trace-formula font-mono">${info.formula.replace(/\n/g, '<br>')}</div>
          </div>

          <div class="trace-box trace-box-alert" style="margin-top:12px;">
            <div class="trace-box-title">⚠️ מגבלות ודגשי מתודולוגיה:</div>
            <p style="margin:0; font-size:13px; color:#991b1b; line-height:1.4;">${info.limitations}</p>
          </div>
        </div>

        <div class="trace-modal-footer">
          <span style="font-size:12px; color:var(--text-muted);">${window.METHODOLOGY_VERSION}</span>
          <button class="btn btn-secondary" onclick="document.getElementById('traceabilityModal').style.display='none'">סגור חלונית</button>
        </div>
      </div>
    `;

    modal.style.display = "flex";
  },

  // Renders the full Methodology & Sources Tab
  renderMethodologyTab: function(containerEl) {
    if (typeof containerEl === 'string') {
      containerEl = document.getElementById(containerEl);
    }
    if (!containerEl) return;

    let sourcesHtml = window.OfficialSourcesCatalog.map(s => `
      <div class="source-card">
        <div class="source-header">
          <div class="source-title">${s.name}</div>
          <span class="source-badge">מאומת 100%</span>
        </div>
        <div class="source-meta">
          <div><strong>גוף מפרסם:</strong> ${s.publisher}</div>
          <div><strong>שנת נתונים:</strong> ${s.dataYear}</div>
          <div><strong>קובץ בפרויקט:</strong> <code class="font-mono">${s.projectFile}</code></div>
          ${s.officialUrl ? `<div><strong>קישור למאגר הרשמי:</strong> <a href="${s.officialUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--primary); text-decoration:underline;">פתיחת מקור ממשלתי רשמי ↗</a></div>` : ''}
        </div>
        <div class="source-vars">
          <strong>משתנים שנלקחו מהמקור:</strong>
          <ul>
            ${s.variables.map(v => `<li>${v}</li>`).join('')}
          </ul>
        </div>
        <div class="source-notes">📌 ${s.notes}</div>
      </div>
    `).join('');

    containerEl.innerHTML = `
      <div class="methodology-container">
        <!-- Banner -->
        <div class="card methodology-banner">
          <div class="methodology-badge">🛡️ שקיפות מלאה ועקיבות נתונים (Data Provenance)</div>
          <h2 style="margin: 8px 0; font-size: 24px; color: var(--text-main);">מתודולוגיה, מקורות ושיטת החישוב</h2>
          <div style="font-size: 14px; color: var(--text-muted);">
            גרסה פעילה: <strong>${window.METHODOLOGY_VERSION}</strong> | בסיס נתונים: דוחות כספיים מבוקרים 2024 (משרד הפנים והלמ"ס)
          </div>
          <p style="margin: 12px 0 0 0; font-size: 14px; line-height: 1.6; color: var(--text-main);">
            מערכת זו פועלת על פי סטנדרט מדעי קפדני של שקיפות מלאה. כל נתון מוצג משויך למקור רשמי מאומת, וכל נוסחה או הנחת מדיניות מפורטת בשפה גלויה וברורה.
          </p>
        </div>

        <!-- 4-Tier Taxonomy Guide -->
        <div class="card" style="margin-top: 16px;">
          <h3 class="card-title">1. סיווג 4 השכבות של המערכת (Taxonomy)</h3>
          <p class="card-subtitle">הבחנה חזותית ומושגית קשיחה למניעת הטעיה:</p>
          
          <div class="taxonomy-grid">
            <div class="taxonomy-card" style="border-top: 4px solid #10b981;">
              <div class="taxonomy-header">
                <span class="tax-tag" style="background:#10b98120; color:#059669;">🟢 נתון רשמי (Official)</span>
              </div>
              <p>נתון גולמי שנלקח ישירות ממקור ממשלתי/סטטיסטי מוסמך (משרד הפנים או הלמ"ס) ללא כל שינוי.</p>
              <div class="tax-example">למשל: סעיף הוצאות 1486, סעיף תקבולים 1384, אשכול למ"ס 2021.</div>
            </div>

            <div class="taxonomy-card" style="border-top: 4px solid #2563eb;">
              <div class="taxonomy-header">
                <span class="tax-tag" style="background:#2563eb20; color:#1d4ed8;">🔵 נתון מחושב (Calculated)</span>
              </div>
              <p>אינדיקטור שנגזר מתמטית מנתוני המקור המבוקרים על פי הגדרה חשבונאית או סטטיסטית מקובלת.</p>
              <div class="tax-example">למשל: השתתפות עצמית נטו (1486-1384), שיעור השתתפות עצמית (%), מדד ג'יני.</div>
            </div>

            <div class="taxonomy-card" style="border-top: 4px solid #8b5cf6;">
              <div class="taxonomy-header">
                <span class="tax-tag" style="background:#8b5cf620; color:#6d28d9;">🟣 הנחת מדיניות (Policy Choice)</span>
              </div>
              <p>פרמטר שנקבע כבחירת מדיניות נורמטיבית או כיול מודליסטי של האיגוד, ולא כנוסחה מחייבת בחוק.</p>
              <div class="tax-example">למשל: משקולות 50% סוציו / 30% פריפריה / 20% גירעון, מעריך פרוגרסיביות 1.4.</div>
            </div>

            <div class="taxonomy-card" style="border-top: 4px solid #f59e0b;">
              <div class="taxonomy-header">
                <span class="tax-tag" style="background:#f59e0b20; color:#b45309;">🟠 תוצאת סימולציה (Simulation)</span>
              </div>
              <p>תוצאה היפותטית המייצגת מה היה מתרחש אילו הופעל מודל ההקצאה המתקן המוצע ע"י האיגוד.</p>
              <div class="tax-example">למשל: מענק מוצע לרשות, מענק מוצע לנפש, הוצאה מדומה לאחר מענק.</div>
            </div>
          </div>
        </div>

        <!-- End-to-End Pipeline -->
        <div class="card" style="margin-top: 16px;">
          <h3 class="card-title">2. שרשרת עיבוד הנתונים מקצה לקצה (Data Pipeline)</h3>
          <div class="pipeline-steps">
            <div class="pipeline-step">
              <div class="step-num">1</div>
              <div class="step-title">איסוף מקורות גלם</div>
              <div class="step-desc">דוחות כספיים מבוקרים 2024 (משרד הפנים) + קובצי למ"ס רשמיים (חברתי-כלכלי ופריפריאליות).</div>
            </div>
            <div class="pipeline-step">
              <div class="step-num">2</div>
              <div class="step-title">טיוב ואימות נתונים</div>
              <div class="step-desc">מיפוי שמות רשויות, הצלבת סמלי למ"ס ומשרד הפנים, טיפול ברשויות מלחמה ופינוי (2024).</div>
            </div>
            <div class="pipeline-step">
              <div class="step-num">3</div>
              <div class="step-title">מאגר 257 הרשויות המאומת</div>
              <div class="step-desc">קובץ אב אחיד (<code class="font-mono">education_equity_master.json</code>) ללא נתון סינתטי בודד.</div>
            </div>
            <div class="pipeline-step">
              <div class="step-num">4</div>
              <div class="step-title">חישוב מדדי אי-שוויון</div>
              <div class="step-desc">מדד ג'יני משוקלל אוכלוסייה, יחסי עשירונים (90/10, פאלמה) ויחס פער בין אשכולות 8–10 ל-1–3.</div>
            </div>
            <div class="pipeline-step">
              <div class="step-num">5</div>
              <div class="step-title">מנוע הסימולציה המתקן</div>
              <div class="step-desc">חישוב ציון צורך משולב והקצאה דיפרנציאלית של סל תקציב מתקן (סימולציית מדיניות).</div>
            </div>
          </div>
        </div>

        <!-- Open Formulas Section -->
        <div class="card" style="margin-top: 16px;">
          <h3 class="card-title">3. נוסחאות גלויות והסבר פרמטרים</h3>
          <div class="formula-block">
            <div class="formula-header">
              <span class="font-bold">נוסחה 1: שיעור ההשתתפות העצמית של הרשות בחינוך</span>
              <span class="tax-tag" style="background:#2563eb20; color:#1d4ed8;">🔵 מחושב</span>
            </div>
            <div class="formula-code font-mono">
              שיעור השתתפות עצמית (%) = [(הוצאות חינוך 1486 - תקבולי חינוך 1384) / הוצאות חינוך 1486] × 100
            </div>
            <p class="formula-expl">
              מבטא איזה חלק מתקציב החינוך השנתי של הרשות ממומן ישירות מקופתה (מארנונה ומקורות עצמיים), מעבר להשתתפות משרד החינוך.
            </p>
          </div>

          <div class="formula-block" style="margin-top:12px;">
            <div class="formula-header">
              <span class="font-bold">נוסחה 2: ציון הצורך המשולב של הרשות (Composite Need Score)</span>
              <span class="tax-tag" style="background:#8b5cf620; color:#6d28d9;">🟣 הנחת מדיניות מוצעת</span>
            </div>
            <div class="formula-code font-mono">
              CompositeNeed = (0.50 × SocioScore) + (0.30 × PeriScore) + (0.20 × FiscalDeficit)
            </div>
            <div class="formula-expl">
              רכיבי המודל:
              <ul>
                <li><strong>SocioScore:</strong> <code class="font-mono">(11 - אשכול למ"ס) / 10</code> — נע בין 0.1 (אשכול 10) ל-1.0 (אשכול 1).</li>
                <li><strong>PeriScore:</strong> <code class="font-mono">(11 - אשכול פריפריה) / 10</code> — נע בין 0.1 (מרכז) ל-1.0 (פריפריה עמוקה).</li>
                <li><strong>FiscalDeficit:</strong> <code class="font-mono">max(0, 100 - שיעור הכנסות עצמיות) / 100</code> — נע בין 0.0 (עצמאות מלאה) ל-1.0 (תלות מוחלטת).</li>
              </ul>
              <em>הערת שקיפות: משקולות 50/30/20 הן הצעת מדיניות של האיגוד וניתנות לכוונון בסימולטור.</em>
            </div>
          </div>

          <div class="formula-block" style="margin-top:12px;">
            <div class="formula-header">
              <span class="font-bold">נוסחה 3: מענק מוצע לרשות מתוך סל התקציב (Corrective Grant Allocation)</span>
              <span class="tax-tag" style="background:#f59e0b20; color:#b45309;">🟠 תוצאת סימולציה</span>
            </div>
            <div class="formula-code font-mono">
              ציון הרשות = אוכלוסייה × (CompositeNeed)^1.4<br>
              מענק לרשות (₪) = סל התקציב (₪) × [ציון הרשות / סך כל ציוני הרשויות בארץ]
            </div>
            <p class="formula-expl">
              <em>הערת שקיפות: מעריך הפרוגרסיביות (1.4) הוא פרמטר כיול פנימי להעמקת הפרוגרסיביות לרשויות הקצה. בגרסה הבאה ייבחן מעבר למעריך 1.0 או סליידר מתכוונן.</em>
            </p>
          </div>
        </div>

        <!-- Official Sources Catalog -->
        <div class="card" style="margin-top: 16px;">
          <h3 class="card-title">4. קטלוג מקורות רשמיים וקובצי נתונים (Verified Source Catalog)</h3>
          <p class="card-subtitle">כל המקורות עברו אימות ובידוד מוחלט בתוך גבולות הפרויקט:</p>
          <div class="sources-list" style="margin-top: 12px;">
            ${sourcesHtml}
          </div>
        </div>
      </div>
    `;
  }
};
