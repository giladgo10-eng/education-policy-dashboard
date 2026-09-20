// ==============================================================================
// advocacy.js - 257 Municipal 360° Report Engine & Policy Brief Generator
// Methodology Version: Methodology v0.9 — Draft / Baseline 2024
// ==============================================================================

window.EducationAdvocacy = {
  // Generates complete, rigorous HTML 360° report for any of the 257 authorities
  generateReport: function(authority, nationalAvg, simData, options) {
    if (!authority) {
      return '<div class="alert alert-warning">נא לבחור רשות מקומית להפקת הדו״ח היישובי.</div>';
    }

    const pop = authority.population || 1000;
    const exp1486 = authority.education_expense_1486_tk || 0;
    const rev1384 = authority.education_revenue_1384_tk || 0;
    const netDiff = authority.education_net_difference_tk || 0;
    const selfFundingRate = authority.municipal_education_self_funding_rate || 0;
    const expPerCapita = authority.education_net_expenditure_per_capita_nis || Math.round((netDiff * 1000) / pop);

    const nationalBenchmark = nationalAvg || 24.1;
    const isBelowAvg = selfFundingRate < nationalBenchmark;
    const diffFromAvg = (selfFundingRate - nationalBenchmark).toFixed(1);

    const currentDate = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });

    // 1. Simulation Detailed Breakdown ("מדוע התקבלה תוצאת הסימולציה הזאת?")
    let simDetailedBreakdownHtml = '';
    if (simData && simData.grant_per_capita_nis !== undefined) {
      const wSocio = (options && options.wSocio) ? options.wSocio : 50;
      const wPeri = (options && options.wPeri) ? options.wPeri : 30;
      const wFiscal = (options && options.wFiscal) ? options.wFiscal : 20;

      const socioScore = (11 - (authority.cbs_socio_cluster || 5)) / 10;
      const periScore = (11 - (authority.cbs_periphery_cluster || 5)) / 10;
      const fiscalDeficit = Math.max(0, 100 - (authority.own_revenue_share_pct || 30)) / 100;

      const contribSocio = (wSocio / 100) * socioScore;
      const contribPeri = (wPeri / 100) * periScore;
      const contribFiscal = (wFiscal / 100) * fiscalDeficit;
      const compositeNeed = contribSocio + contribPeri + contribFiscal;

      simDetailedBreakdownHtml = `
        <div class="paper-section">
          <div class="paper-section-title">
            <span>3. תרחיש מודל התקצוב הדיפרנציאלי המתקן (סימולציה)</span>
            <span class="tax-tag" style="background:#f59e0b20; color:#b45309; font-size:12px;">🟠 תוצאת סימולציה</span>
          </div>

          <div class="paper-box" style="background: #ecfdf5; border-color: #a7f3d0; margin-bottom: 16px;">
            <div style="font-weight: 700; color: #065f46; font-size: 16px; margin-bottom: 6px;">
              תוספת שנתית מוצעת לרשות: ₪${(simData.allocated_grant_k_nis).toLocaleString()} אלפי ₪ (+₪${simData.grant_per_capita_nis.toLocaleString()} לנפש, גידול של +${simData.gain_pct}%)
            </div>
            <p style="font-size: 13px; color: #047857; margin: 0; line-height: 1.5;">
              על פי מודל התקצוב הדיפרנציאלי המוצע ע"י האיגוד, ההשקעה העצמית של <strong>${authority.name}</strong> תעלה מ-₪${(simData.orig_net_exp_per_capita || expPerCapita).toLocaleString()} ל-<strong>₪${(simData.simulated_net_exp_per_capita || (expPerCapita + simData.grant_per_capita_nis)).toLocaleString()} לנפש</strong>.
            </p>
          </div>

          <!-- Why this grant was allocated -->
          <div class="paper-box" style="background: #f8fafc; border-color: #cbd5e1;">
            <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 8px;">
              🔍 מדוע התקבלה תוצאת הסימולציה הזאת? (פירוק תרומת רכיבי המודל)
            </div>
            <p style="font-size: 13px; color: #475569; margin: 0 0 10px 0;">
              ציון הצורך המשוקלל של הרשות נקבע ל-<strong>${compositeNeed.toFixed(3)}</strong> (בסולם 0.0 עד 1.0) על בסיס שקלול שלושת הממדים:
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px;">
              <div style="background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px;">1. רכיב סוציו-אקונומי (${wSocio}%)</div>
                <div style="font-weight: 700; color: #0f172a; font-size: 14px;">אשכול ${authority.cbs_socio_cluster} (${socioScore.toFixed(2)})</div>
                <div style="color: #2563eb; font-size: 12px; font-family: monospace;">תרומה: +${contribSocio.toFixed(3)}</div>
              </div>
              <div style="background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px;">2. רכיב פריפריאליות (${wPeri}%)</div>
                <div style="font-weight: 700; color: #0f172a; font-size: 14px;">אשכול ${authority.cbs_periphery_cluster} (${periScore.toFixed(2)})</div>
                <div style="color: #2563eb; font-size: 12px; font-family: monospace;">תרומה: +${contribPeri.toFixed(3)}</div>
              </div>
              <div style="background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px;">3. גירעון פיסקלי (${wFiscal}%)</div>
                <div style="font-weight: 700; color: #0f172a; font-size: 14px;">הכנסות עצמיות ${authority.own_revenue_share_pct}%</div>
                <div style="color: #2563eb; font-size: 12px; font-family: monospace;">תרומה: +${contribFiscal.toFixed(3)}</div>
              </div>
            </div>

            <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
              נוסחת ההקצאה: <code class="font-mono" style="color: #0f172a;">ציון הרשות = אוכלוסייה (${pop.toLocaleString()}) × (${compositeNeed.toFixed(3)})^1.4</code>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Anomaly Notice
    let anomalyNotice = '';
    if (authority.is_war_evacuated_2024) {
      anomalyNotice = `
        <div class="paper-box" style="background: #fef2f2; border-color: #fca5a5; margin-bottom: 16px;">
          <strong style="color: #991b1b;">⚠️ הערת שקיפות — שנת מלחמה ופינוי (2024):</strong>
          <span style="font-size: 13px; color: #7f1d1d;"> הרשות נכללת ברשימת יישובי קו העימות שפונו בשנת 2024. הנתונים הכספיים משקפים את המציאות החשבונאית המיוחדת של שנת המלחמה (כולל מקדמות והתאמות).</span>
        </div>
      `;
    } else if (authority.is_tamar_outlier) {
      anomalyNotice = `
        <div class="paper-box" style="background: #faf5ff; border-color: #d8b4fe; margin-bottom: 16px;">
          <strong style="color: #6b21a8;">🔍 הערת שקיפות — חריג מבני קיצוני (מועצה אזורית תמר):</strong>
          <span style="font-size: 13px; color: #581c87;"> הרשות מתאפיינת בבסיס ארנונה עסקית חריג ביותר לנפש (מלונות ומפעלי ים המלח) לצד אוכלוסייה קטנה (2,138 תושבים).</span>
        </div>
      `;
    }

    return `
      <div class="paper-wrapper" id="municipalPrintableArea">
        <!-- Print Toolbar -->
        <div class="report-actions-bar">
          <div class="report-meta-tag">
            <span>🛡️ ${window.METHODOLOGY_VERSION}</span>
            <span> | תאריך הפקה: ${currentDate}</span>
          </div>
          <button class="btn btn-primary" onclick="window.print()">
            <span>🖨️</span>
            <span>הדפסת כרטיס רשות / שמירה כ-PDF</span>
          </button>
        </div>

        <!-- Official Header -->
        <div class="paper-header">
          <div class="paper-emblem">🛡️</div>
          <div class="paper-org">איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות</div>
          <div class="paper-title">דו״ח יישובי 360°: פערי השתתפות עצמית ותקציב חינוך</div>
          <div class="paper-sub">רשות מקומית: <strong>${authority.name}</strong> (${authority.type}) | סמל למ"ס: <strong>${authority.code}</strong> | מחוז: <strong>${authority.district}</strong></div>
          <div class="paper-meta">בסיס נתונים: דוחות כספיים מבוקרים 2024 (משרד הפנים) + למ"ס (מדד סוציו 2021, פריפריה 2020)</div>
        </div>

        ${anomalyNotice}

        <!-- Section 1: Executive Summary -->
        <div class="paper-section">
          <div class="paper-section-title">
            <span>1. תמצית מנהלים ונתוני מפתח מבוקרים</span>
            <span class="tax-tag" style="background:#10b98120; color:#059669; font-size:12px;">🟢 נתונים רשמיים מבוקרים</span>
          </div>
          <p>
            על פי הדוחות הכספיים המבוקרים לשנת 2024, סך הוצאות החינוך בתקציב הרגיל של <strong>${authority.name}</strong> עמדו על <strong>₪${exp1486.toLocaleString()} אלפי ₪</strong> (קוד סעיף 1486), בעוד שתקבולי החינוך והשתתפויות המדינה (קוד 1384) הסתכמו ב-<strong>₪${rev1384.toLocaleString()} אלפי ₪</strong>.
          </p>
          <p>
            ההפרש נטו שמומן מקופתה העצמית של הרשות עומד על <strong>₪${netDiff.toLocaleString()} אלפי ₪</strong> (<strong>₪${expPerCapita.toLocaleString()} לנפש</strong>), המהווה <strong>שיעור השתתפות עצמית של ${selfFundingRate}%</strong> מכלל תקציב החינוך המקומי.
          </p>
          <div class="paper-box">
            שיעור זה <strong>${isBelowAvg ? 'נמוך ב-' + Math.abs(diffFromAvg) + '%' : 'גבוה ב-' + diffFromAvg + '%'}</strong> מהממוצע הארצי של הרשויות המקומיות (${nationalBenchmark}%).
            הרשות מדורגת באשכול חברתי-כלכלי <strong>${authority.cbs_socio_cluster}</strong> של הלמ"ס ובאשכול פריפריאליות <strong>${authority.cbs_periphery_cluster}</strong>, ושיעור הכנסותיה העצמיות עומד על <strong>${authority.own_revenue_share_pct}%</strong> מסך תקציבה הרגיל.
          </div>
        </div>

        <!-- Section 2: Detailed Financial Table -->
        <div class="paper-section">
          <div class="paper-section-title">
            <span>2. פירוט תקציבי מבוקר (משרד הפנים 2024)</span>
            <span class="tax-tag" style="background:#2563eb20; color:#1d4ed8; font-size:12px;">🔵 מחושב מתוך נתונים מבוקרים</span>
          </div>
          <table class="paper-table">
            <thead>
              <tr>
                <th>סעיף תקציבי מבוקר (קוד משרד הפנים)</th>
                <th style="text-align: left;">סכום באלפי ₪</th>
                <th style="text-align: left;">סכום לנפש (₪)</th>
                <th style="text-align: left;">סיווג מקור</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>סך הוצאות חינוך (קוד 1486)</strong></td>
                <td style="text-align: left;">₪${exp1486.toLocaleString()}</td>
                <td style="text-align: left;">₪${Math.round((exp1486 * 1000) / pop).toLocaleString()}</td>
                <td style="text-align: left;"><span class="tax-tag" style="background:#10b98120; color:#059669;">🟢 רשמי</span></td>
              </tr>
              <tr>
                <td><strong>סך תקבולי חינוך ומשה"ח (קוד 1384)</strong></td>
                <td style="text-align: left;">₪${rev1384.toLocaleString()}</td>
                <td style="text-align: left;">₪${Math.round((rev1384 * 1000) / pop).toLocaleString()}</td>
                <td style="text-align: left;"><span class="tax-tag" style="background:#10b98120; color:#059669;">🟢 רשמי</span></td>
              </tr>
              <tr style="background:#f1f5f9; font-weight:700;">
                <td><strong>השתתפות עצמית נטו של הרשות בחינוך</strong></td>
                <td style="text-align: left; color:var(--primary);">₪${netDiff.toLocaleString()}</td>
                <td style="text-align: left; color:var(--primary);">₪${expPerCapita.toLocaleString()}</td>
                <td style="text-align: left;"><span class="tax-tag" style="background:#2563eb20; color:#1d4ed8;">🔵 מחושב</span></td>
              </tr>
              <tr>
                <td>סך הכנסות עצמיות מארנונה ואגרות (קוד 1805)</td>
                <td style="text-align: left;">₪${(authority.own_revenue_1805_tk || 0).toLocaleString()}</td>
                <td style="text-align: left;">₪${(authority.own_revenues_per_capita_nis || 0).toLocaleString()}</td>
                <td style="text-align: left;"><span class="tax-tag" style="background:#10b98120; color:#059669;">🟢 רשמי</span></td>
              </tr>
              <tr>
                <td>ארנונה שאינה למגורים - עסקים ותעשייה (קוד 4146)</td>
                <td style="text-align: left;">₪${(authority.arnona_other_4146_tk || 0).toLocaleString()}</td>
                <td style="text-align: left;">₪${(authority.arnona_other_per_capita_nis || 0).toLocaleString()}</td>
                <td style="text-align: left;"><span class="tax-tag" style="background:#10b98120; color:#059669;">🟢 רשמי</span></td>
              </tr>
              <tr>
                <td>מענק איזון כללי ממשרד הפנים (קוד 1819)</td>
                <td style="text-align: left;">₪${(authority.balancing_grant_1819_tk || 0).toLocaleString()}</td>
                <td style="text-align: left;">₪${(authority.balancing_grant_per_capita_nis || 0).toLocaleString()}</td>
                <td style="text-align: left;"><span class="tax-tag" style="background:#10b98120; color:#059669;">🟢 רשמי</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 3: Simulation Breakdown -->
        ${simDetailedBreakdownHtml}

        <!-- Footer -->
        <div class="paper-footer">
          <div>הופק מתוך מאגר 257 הרשויות המאומת | ${window.METHODOLOGY_VERSION}</div>
          <div>מקורות מבוקרים: משרד הפנים (דוחות 2024) והלשכה המרכזית לסטטיסטיקה</div>
        </div>
      </div>
    `;
  }
};