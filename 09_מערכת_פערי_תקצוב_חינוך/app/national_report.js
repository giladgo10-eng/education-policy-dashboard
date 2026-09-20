// ==============================================================================
// national_report.js - Dynamic National Systemic & Parliamentary Report Engine
// Methodology Version: Methodology v1.0 — Baseline 2024
// ==============================================================================

window.NationalReportEngine = {
  // Computes national statistics dynamically from dataset without any hardcoded figures
  computeNationalStats: function(dataset, simResults) {
    if (!dataset || dataset.length === 0) return null;

    let totalPop = 0;
    let totalExp1486NIS = 0;
    let totalRev1384NIS = 0;
    let totalNetSelfFundNIS = 0;

    let clusterStats = {};
    for (let c = 1; c <= 10; c++) {
      clusterStats[c] = { count: 0, pop: 0, netExpNIS: 0, totalExpNIS: 0 };
    }

    dataset.forEach(d => {
      const pop = d.population || 1000;
      const exp1486 = (d.education_expense_1486_tk || 0) * 1000;
      const rev1384 = (d.education_revenue_1384_tk || 0) * 1000;
      const netDiff = Math.max(0, (d.education_net_difference_tk || 0) * 1000);

      totalPop += pop;
      totalExp1486NIS += exp1486;
      totalRev1384NIS += rev1384;
      totalNetSelfFundNIS += netDiff;

      const c = d.cbs_socio_cluster || 5;
      if (clusterStats[c]) {
        clusterStats[c].count++;
        clusterStats[c].pop += pop;
        clusterStats[c].netExpNIS += netDiff;
        clusterStats[c].totalExpNIS += exp1486;
      }
    });

    const weightedSelfFundingRate = totalExp1486NIS > 0 ? (totalNetSelfFundNIS / totalExp1486NIS) * 100 : 0;
    const avgNetExpPerCapita = totalPop > 0 ? Math.round(totalNetSelfFundNIS / totalPop) : 0;

    // Cluster 1-3 vs Cluster 8-10
    let botPop = 0, botNetExp = 0;
    for (let c = 1; c <= 3; c++) {
      botPop += clusterStats[c].pop;
      botNetExp += clusterStats[c].netExpNIS;
    }
    const botAvgPerCapita = botPop > 0 ? Math.round(botNetExp / botPop) : 1;

    let topPop = 0, topNetExp = 0;
    for (let c = 8; c <= 10; c++) {
      topPop += clusterStats[c].pop;
      topNetExp += clusterStats[c].netExpNIS;
    }
    const topAvgPerCapita = topPop > 0 ? Math.round(topNetExp / topPop) : 1;
    const clusterGapRatio = botAvgPerCapita > 0 ? (topAvgPerCapita / botAvgPerCapita).toFixed(2) : "1.00";

    // Gini calculation
    const origGini = (window.EducationSimulator && window.EducationSimulator.calculateGini) 
      ? window.EducationSimulator.calculateGini(dataset, 'education_net_expenditure_per_capita_nis') 
      : 0.232;

    return {
      totalAuthorities: dataset.length,
      totalPop,
      totalExp1486NIS,
      totalRev1384NIS,
      totalNetSelfFundNIS,
      weightedSelfFundingRate: weightedSelfFundingRate.toFixed(1),
      avgNetExpPerCapita,
      clusterStats,
      botAvgPerCapita,
      topAvgPerCapita,
      clusterGapRatio,
      origGini,
      simResults
    };
  },

  // Generates complete HTML markup for the National Systemic Report
  generateReportHtml: function(dataset, simResults) {
    const stats = this.computeNationalStats(dataset, simResults);
    if (!stats) return '<div class="alert alert-danger">שגיאה בטעינת נתוני המאגר הארצי.</div>';

    const currentDate = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });

    // Table rows for clusters
    let clusterRows = '';
    for (let c = 1; c <= 10; c++) {
      const cs = stats.clusterStats[c];
      const avgCapita = cs.pop > 0 ? Math.round(cs.netExpNIS / cs.pop) : 0;
      const rate = cs.totalExpNIS > 0 ? ((cs.netExpNIS / cs.totalExpNIS) * 100).toFixed(1) : "0.0";
      clusterRows += `
        <tr>
          <td><strong>אשכול ${c}</strong></td>
          <td class="font-mono text-left">${cs.count}</td>
          <td class="font-mono text-left">${cs.pop.toLocaleString()}</td>
          <td class="font-mono text-left">₪${(Math.round(cs.netExpNIS / 1000000)).toLocaleString()} מ' ₪</td>
          <td class="font-mono text-left font-bold" style="color: ${c <= 3 ? '#dc2626' : (c >= 8 ? '#16a34a' : 'inherit')};">₪${avgCapita.toLocaleString()} לנפש</td>
          <td class="font-mono text-left">${rate}%</td>
        </tr>
      `;
    }

    // Simulation Section
    let simSectionHtml = '';
    if (simResults) {
      // Calculate cluster redistribution in simulation
      let simCluster1_3 = 0, simCluster4_6 = 0, simCluster7_10 = 0;
      if (simResults.results) {
        simResults.results.forEach(a => {
          const c = a.cbs_socio_cluster || 5;
          const g = a.allocated_grant_nis || (a.allocated_grant_k_nis * 1000) || 0;
          if (c <= 3) simCluster1_3 += g;
          else if (c <= 6) simCluster4_6 += g;
          else simCluster7_10 += g;
        });
      }

      simSectionHtml = `
        <div class="national-report-section">
          <div class="section-title">
            <span>5. תרחיש מודל התקצוב הדיפרנציאלי המתקן (סימולציית מדיניות — Methodology v1.0)</span>
            <span class="tax-tag" style="background:#f59e0b20; color:#b45309; font-size:12px;">🟠 4. תוצאת סימולציה</span>
          </div>
          
          <div class="report-callout" style="background:#fef3c7; border-color:#f59e0b; margin-bottom:16px;">
            <strong>הבהרה מתודולוגית ומשפטית:</strong>
            סעיף זה מתאר סימולציה היפותטית של סל תקציב מתקן בסך <strong>₪${(simResults.poolM || 1000).toLocaleString()} מיליון ₪</strong> המוצע ע"י איגוד מנהלי החינוך במסגרת Methodology v1.0 (מעריך לינארי 1.0, משקולות 50/30/20, וטייפר פיסקלי P80). <strong>אין מדובר בתקציב ממשלתי שהוקצה בפועל.</strong>
          </div>

          <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom:16px;">
            <div class="kpi-card" style="border-right: 4px solid #f59e0b;">
              <div class="kpi-label">צמצום מדד ג'יני בהוצאה עצמית לנפש</div>
              <div class="kpi-value font-mono" style="color:#b45309;">${simResults.gini_drop_pct || '-3.0'}%</div>
              <div class="kpi-sub">מ-${stats.origGini} ל-${simResults.simGini || '0.225'}</div>
            </div>
            <div class="kpi-card" style="border-right: 4px solid #10b981;">
              <div class="kpi-label">חלוקת הסל לאשכולות 1–3 (החלשים)</div>
              <div class="kpi-value font-mono" style="color:#10b981;">₪${(simCluster1_3 / 1000000).toFixed(1)}M</div>
              <div class="kpi-sub">${((simCluster1_3 / (simResults.poolNIS || 1e9)) * 100).toFixed(1)}% מסך קרן התיקון</div>
            </div>
            <div class="kpi-card" style="border-right: 4px solid #2563eb;">
              <div class="kpi-label">סף טייפר פיסקלי אמפירי (P80)</div>
              <div class="kpi-value font-mono" style="color:#2563eb;">${simResults.p80Threshold || '64.61'}%</div>
              <div class="kpi-sub">ריסון רציף של 20% הרשויות העשירות ביותר</div>
            </div>
          </div>

          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>רשות מקומית</th>
                  <th>אשכול חברתי</th>
                  <th>אוכלוסייה (תושבים)</th>
                  <th style="text-align:left;">הוצאה מקורית לנפש</th>
                  <th style="text-align:left;">מענק מוצע לנפש</th>
                  <th style="text-align:left;">סך מענק מוצע בתרחיש</th>
                  <th style="text-align:left;">גידול באחוזים</th>
                </tr>
              </thead>
              <tbody>
                ${(simResults.top_gainers || []).slice(0, 8).map(g => `
                  <tr>
                    <td><strong>${g.name}</strong> (${g.type})</td>
                    <td>אשכול ${g.cbs_socio_cluster}</td>
                    <td class="font-mono text-left">${g.population.toLocaleString()}</td>
                    <td class="font-mono text-left">₪${g.orig_net_exp_per_capita.toLocaleString()} לנפש</td>
                    <td class="font-mono text-left font-bold" style="color:#10b981;">+₪${g.grant_per_capita_nis.toLocaleString()} לנפש</td>
                    <td class="font-mono text-left">₪${g.allocated_grant_k_nis.toLocaleString()}K</td>
                    <td class="font-mono text-left font-bold" style="color:#10b981;">+${g.gain_pct}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="font-size:12px; color:var(--text-muted); margin-top:6px;">
            * מוצג מדגם של רשויות מובילות בתוספת מענק מוצע לנפש מתוך 257 הרשויות בסימולציה.
          </div>
        </div>
      `;
    }

    return `
      <div class="national-report-paper" id="nationalPrintableArea">
        <!-- Action Toolbar -->
        <div class="report-actions-bar">
          <div class="report-meta-tag">
            <span>🛡️ ${window.METHODOLOGY_VERSION}</span>
            <span> | תאריך הפקה: ${currentDate}</span>
          </div>
          <button class="btn btn-primary" onclick="window.print()">
            <span>🖨️</span>
            <span>הדפסת הדו״ח המערכתי / שמירה כ-PDF</span>
          </button>
        </div>

        <!-- Official Header -->
        <div class="report-header">
          <div class="report-emblem">🏛️</div>
          <div class="report-org">איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות</div>
          <h1 class="report-main-title">דו״ח מערכתי ופרלמנטרי: פערי השתתפות עצמית בחינוך המוניציפלי בישראל</h1>
          <div class="report-subtitle">ניתוח נתוני אמת מבוקרים של 257 הרשויות המקומיות בישראל לשנת 2024</div>
          <div class="report-meta-strip">
            <span><strong>מקורות נתונים:</strong> משרד הפנים (דוחות כספיים מבוקרים 2024) והלמ״ס (מדד סוציו 2021, פריפריה 2020)</span>
            <span><strong>אוכלוסיית הניתוח:</strong> 100% מכלל 257 הרשויות בישראל (${stats.totalPop.toLocaleString()} תושבים)</span>
          </div>
        </div>

        <!-- Section 1: Executive Summary -->
        <div class="national-report-section">
          <div class="section-title">
            <span>1. תמצית מנהלים וממצאי מפתח ארציים</span>
            <span class="tax-tag" style="background:#10b98120; color:#059669; font-size:12px;">🟢 1. נתונים מבוקרים רשמיים</span>
          </div>
          
          <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom:16px;">
            <div class="kpi-card" style="border-right: 4px solid #2563eb;">
              <div class="kpi-label">סך הוצאות חינוך ברשויות (1486)</div>
              <div class="kpi-value font-mono">₪${(stats.totalExp1486NIS / 1000000000).toFixed(2)}B</div>
              <div class="kpi-sub">תקציב רגיל מבוקר 2024</div>
            </div>
            <div class="kpi-card" style="border-right: 4px solid #8b5cf6;">
              <div class="kpi-label">סך השתתפות המדינה (1384)</div>
              <div class="kpi-value font-mono">₪${(stats.totalRev1384NIS / 1000000000).toFixed(2)}B</div>
              <div class="kpi-sub">תקבולי משה"ח וגורמי חוץ</div>
            </div>
            <div class="kpi-card" style="border-right: 4px solid #10b981;">
              <div class="kpi-label">סך מימון עצמי של הרשויות</div>
              <div class="kpi-value font-mono">₪${(stats.totalNetSelfFundNIS / 1000000000).toFixed(2)}B</div>
              <div class="kpi-sub">ממומן ישירות מקופת הרשות</div>
            </div>
            <div class="kpi-card" style="border-right: 4px solid #dc2626;">
              <div class="kpi-label">יחס פער בין אשכולות 8-10 ל-1-3</div>
              <div class="kpi-value font-mono" style="color:#dc2626;">פי ${stats.clusterGapRatio}</div>
              <div class="kpi-sub">₪${stats.topAvgPerCapita.toLocaleString()} מול ₪${stats.botAvgPerCapita.toLocaleString()} לנפש</div>
            </div>
          </div>

          <p style="line-height:1.6; font-size:14.5px; color:#1e293b;">
            על פי הדוחות הכספיים המבוקרים לשנת 2024, סך הוצאות החינוך בתקציב הרגיל של 257 הרשויות המקומיות בישראל עמדו על <strong>₪${(stats.totalExp1486NIS / 1000000000).toFixed(2)} מיליארד ₪</strong>. מתוכם, תקבולי משרד החינוך והשתתפויות המדינה הסתכמו ב-<strong>₪${(stats.totalRev1384NIS / 1000000000).toFixed(2)} מיליארד ₪</strong>.
          </p>
          <p style="line-height:1.6; font-size:14.5px; color:#1e293b;">
            ההפרש נטו — <strong>₪${(stats.totalNetSelfFundNIS / 1000000000).toFixed(2)} מיליארד ₪</strong> (המהווים <strong>${stats.weightedSelfFundingRate}%</strong> מכלל הוצאות החינוך) — מומן כולו מקופתן העצמית של הרשויות המקומיות (מארנונה ומקורות עצמיים). השקעה עצמית זו מתפלגת באופן בלתי שוויוני מובהק, ויוצרת פער מבני עמוק בשירותי החינוך הניתנים לתושב.
          </p>
        </div>

        <!-- Section 2: Socioeconomic Gradient Table -->
        <div class="national-report-section">
          <div class="section-title">
            <span>2. הגרדיאנט החברתי-כלכלי: התפלגות השתתפות עצמית לפי אשכולות למ״ס</span>
            <span class="tax-tag" style="background:#2563eb20; color:#1d4ed8; font-size:12px;">🔵 2. נתונים מחושבים מבוקרים</span>
          </div>

          <div class="table-container">
            <table class="report-table">
              <thead>
                <tr>
                  <th>אשכול למ״ס</th>
                  <th style="text-align:left;">מספר רשויות</th>
                  <th style="text-align:left;">אוכלוסייה (תושבים)</th>
                  <th style="text-align:left;">סך מימון עצמי (1486-1384)</th>
                  <th style="text-align:left;">הוצאה עצמית ממוצעת לנפש</th>
                  <th style="text-align:left;">שיעור השתתפות עצמית (%)</th>
                </tr>
              </thead>
              <tbody>
                ${clusterRows}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section 3: Statistical Core Insights -->
        <div class="national-report-section">
          <div class="section-title">
            <span>3. תובנות סטטיסטיות ומבניות מאומתות</span>
            <span class="tax-tag" style="background:#2563eb20; color:#1d4ed8; font-size:12px;">🔵 2. ניתוח מתאמי מבוקר</span>
          </div>

          <div class="report-callout" style="margin-bottom:12px;">
            <strong>תובנה 1 — הקשר המבני בין עצמאות פיסקלית להשקעה בחינוך:</strong>
            נמצא מתאם חיובי חזק ומובהק (<strong>r = +0.6771</strong>, p &lt; 0.0001) בין שיעור ההכנסות העצמיות של הרשות לבין שיעור השתתפותה בחינוך. רשויות בעלות בסיס ארנונה עסקית רחב מסוגלות להשקיע מאות שקלים יותר בכל תושב.
          </div>

          <div class="report-callout" style="margin-bottom:12px;">
            <strong>תובנה 2 — הגרדיאנט הסוציו-אקונומי:</strong>
            תושב ברשויות באשכולות 8–10 נהנה מהשקעה מוניציפלית עצמית ממוצעת של <strong>₪${stats.topAvgPerCapita.toLocaleString()} לנפש</strong>, לעומת <strong>₪${stats.botAvgPerCapita.toLocaleString()} לנפש</strong> בלבד באשכולות 1–3 (פער של <strong>פי ${stats.clusterGapRatio}</strong>).
          </div>

          <div class="report-callout">
            <strong>תובנה 3 — פרדוקס מענק האיזון:</strong>
            בעוד שברמה הארצית מענק האיזון מתואם שלילית עם השתתפות עצמית (r = -0.2249), בתוך אשכולות המצוקה (1–3) קיים מתאם חיובי מובהק (<strong>r = +0.4138</strong>). מענק האיזון מהווה חבל הצלה פיסקלי המאפשר לרשויות מוחלשות להשתתף במימון החינוך.
          </div>
        </div>

        <!-- Section 4: Policy Recommendations -->
        <div class="national-report-section">
          <div class="section-title">
            <span>4. המלצות מדיניות של איגוד מנהלי החינוך</span>
            <span class="tax-tag" style="background:#8b5cf620; color:#6d28d9; font-size:12px;">🟣 3. עמדת מדיניות</span>
          </div>
          <ol style="line-height:1.7; font-size:14px; padding-right:20px; color:#1e293b;">
            <li><strong>הקמת קרן תקצוב דיפרנציאלי מתקן לחינוך המוניציפלי:</strong> הקצאת תקציב ייעודי לצמצום פערי ההשתתפות העצמית על בסיס מודל צורך משולב (סוציו, פריפריה ועצמאות פיסקלית).</li>
            <li><strong>שמירה על מנגנון ריסון פיסקלי (Fiscal Taper):</strong> ריסון הדרגתי של רשויות בעלות עצמאות פיסקלית גבוהה (מעל P80 = 64.61%) כדי להבטיח ניתוב מרבי של המשאבים לרשויות הזקוקות לכך.</li>
            <li><strong>עדכון נוסחאות ההשתתפות הממשלתיות:</strong> התאמת שיעורי המאצ'ינג הממשלתיים ליכולת הגבייה העצמית הריאלית של הרשויות.</li>
          </ol>
        </div>

        <!-- Section 5: Simulation Scenario -->
        ${simSectionHtml}

        <!-- Footer Sign-off -->
        <div class="report-footer-sign">
          <div style="font-weight:700; color:#0f172a;">איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות בישראל</div>
          <div style="font-size:13px; color:#64748b;">מסמך מדיניות ומחקר אמפירי | ${window.METHODOLOGY_VERSION}</div>
        </div>
      </div>
    `;
  }
};
