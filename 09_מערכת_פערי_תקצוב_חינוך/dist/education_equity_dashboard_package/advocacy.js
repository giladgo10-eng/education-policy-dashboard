// ==============================================================================
// advocacy.js - 257 Municipal 360° Report Engine & Policy Brief Generator
// Methodology Version: Methodology v1.0 — Baseline 2024
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
      const wSocio = (options && options.wSocio !== undefined) ? options.wSocio : 50;
      const wPeri = (options && options.wPeri !== undefined) ? options.wPeri : 30;
      const wFiscal = (options && options.wFiscal !== undefined) ? options.wFiscal : 20;

      const socioCluster = (authority.cbs_socio_cluster !== undefined && authority.cbs_socio_cluster !== null) ? authority.cbs_socio_cluster : (authority.socio_cluster_2021 || 5);
      const periCluster = (authority.cbs_periphery_cluster !== undefined && authority.cbs_periphery_cluster !== null) ? authority.cbs_periphery_cluster : (authority.periphery_cluster_2020 || 5);
      const ownRevPct = typeof authority.own_revenue_share_pct === 'number' ? authority.own_revenue_share_pct : 30;

      const socioScore = Math.max(0, Math.min(1, (10 - socioCluster) / 9));
      const periScore = Math.max(0, Math.min(1, (10 - periCluster) / 9));
      const fiscalDep = Math.max(0, Math.min(1, (100 - ownRevPct) / 100));

      const contribSocio = (wSocio / 100) * socioScore;
      const contribPeri = (wPeri / 100) * periScore;
      const contribFiscal = (wFiscal / 100) * fiscalDep;
      const compositeNeed = contribSocio + contribPeri + contribFiscal;

      const p80 = simData.p80_threshold || 64.61;
      const taperFactor = simData.taper_factor !== undefined ? simData.taper_factor : (ownRevPct > p80 ? (1.0 - 0.90 * ((ownRevPct - p80) / (100 - p80))) : 1.0);

      let taperStatusText = '';
      if (ownRevPct <= p80) {
        taperStatusText = `<span style="color:#059669; font-weight:700;">ללא ריסון (100% מענק)</span> — הכנסות עצמיות (${ownRevPct}%) מתחת לסף P80 (${p80}%).`;
      } else {
        taperStatusText = `<span style="color:#b45309; font-weight:700;">מופעל טייפר פיסקלי (${(taperFactor * 100).toFixed(1)}%)</span> — הכנסות עצמיות (${ownRevPct}%) מעל סף P80 (${p80}%).`;
      }

      simDetailedBreakdownHtml = `
        <div class="paper-section">
          <div class="paper-section-title">
            <span>3. תרחיש מודל התקצוב הדיפרנציאלי המתקן (סימולציית מדיניות — Methodology v1.0)</span>
            <span class="tax-tag" style="background:#f59e0b20; color:#b45309; font-size:12px;">🟠 4. תוצאת סימולציה</span>
          </div>

          <div class="paper-box" style="background: #ecfdf5; border-color: #a7f3d0; margin-bottom: 16px;">
            <div style="font-weight: 700; color: #065f46; font-size: 16px; margin-bottom: 6px;">
              תוספת שנתית מוצעת בתרחיש לרשות: ₪${(simData.allocated_grant_k_nis).toLocaleString()} אלפי ₪ (+₪${simData.grant_per_capita_nis.toLocaleString()} לנפש, גידול של +${simData.gain_pct}%)
            </div>
            <p style="font-size: 13px; color: #047857; margin: 0; line-height: 1.5;">
              על פי מודל התקצוב הדיפרנציאלי המוצע ע"י האיגוד (בסל סימולציה של 1 מיליארד ₪), ההשקעה העצמית של <strong>${authority.name}</strong> תעלה מ-₪${(simData.orig_net_exp_per_capita || expPerCapita).toLocaleString()} ל-<strong>₪${(simData.simulated_net_exp_per_capita || (expPerCapita + simData.grant_per_capita_nis)).toLocaleString()} לנפש</strong>.
            </p>
          </div>

          <!-- Why this grant was allocated -->
          <div class="paper-box" style="background: #f8fafc; border-color: #cbd5e1;">
            <div style="font-weight: 700; color: #1e293b; font-size: 14px; margin-bottom: 8px;">
              🔍 מדוע התקבלה תוצאת הסימולציה הזאת? (פירוק תרומת רכיבי המודל וטייפר P80)
            </div>
            <p style="font-size: 13px; color: #475569; margin: 0 0 10px 0;">
              ציון הצורך המשולב של הרשות נקבע ל-<strong>${compositeNeed.toFixed(3)}</strong> (בסולם 0.0 עד 1.0) על בסיס שקלול שלושת הממדים:
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; font-size: 13px;">
              <div style="background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px;">1. צורך סוציו-אקונומי (${wSocio}%)</div>
                <div style="font-weight: 700; color: #0f172a; font-size: 14px;">אשכול ${socioCluster} (${socioScore.toFixed(2)})</div>
                <div style="color: #2563eb; font-size: 12px; font-family: monospace;">תרומה: +${contribSocio.toFixed(3)}</div>
              </div>
              <div style="background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px;">2. צורך פריפריאלי (${wPeri}%)</div>
                <div style="font-weight: 700; color: #0f172a; font-size: 14px;">אשכול ${periCluster} (${periScore.toFixed(2)})</div>
                <div style="color: #2563eb; font-size: 12px; font-family: monospace;">תרומה: +${contribPeri.toFixed(3)}</div>
              </div>
              <div style="background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <div style="color: #64748b; font-size: 11px;">3. תלות פיסקלית (${wFiscal}%)</div>
                <div style="font-weight: 700; color: #0f172a; font-size: 14px;">הכנסות עצמיות ${ownRevPct}%</div>
                <div style="color: #2563eb; font-size: 12px; font-family: monospace;">תרומה: +${contribFiscal.toFixed(3)}</div>
              </div>
            </div>

            <div style="margin-top: 10px; padding: 8px 10px; background: #ffffff; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 12.5px;">
              <strong>🛡️ סטטוס ריסון פיסקלי (P80 Fiscal Taper):</strong> ${taperStatusText}
            </div>

            <div style="margin-top: 10px; font-size: 12px; color: #64748b;">
              נוסחת ההקצאה (Methodology v1.0 לינארי): <code class="font-mono" style="color: #0f172a;">ציון משוקלל = ${pop.toLocaleString()} תושבים × (${compositeNeed.toFixed(3)} צורך × ${taperFactor.toFixed(3)} טייפר)</code>
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
          <span style="font-size: 13px; color: #581c87;"> הרשות מתאפיינת בבסיס ארנונה עסקית חריג ביותר לנפש (שיעור הכנסות עצמיות של 95.1%) לצד אוכלוסייה קטנה (2,138 תושבים). במתודולוגיה v1.0 מופעל טייפר פיסקלי המרסן את המענק המוצע ל-₪23 לנפש בלבד.</span>
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
          <div class="paper-emblem">📊</div>
          <div class="paper-org">פיילוט מחקרי — מערכת ניסיונית לניתוח פערי תקצוב וצדק חלוקתי</div>
          <div class="paper-title">דו״ח יישובי 360°: פערי השתתפות עצמית ותקציב חינוך</div>
          <div class="paper-sub">רשות מקומית: <strong>${authority.name}</strong> (${authority.type}) | סמל למ"ס: <strong>${authority.code}</strong> | מחוז: <strong>${authority.district}</strong></div>
          <div class="paper-meta">בסיס נתונים: דוחות כספיים מבוקרים 2024 (משרד הפנים) + למ"ס (מדד סוציו 2021, פריפריה 2020)</div>
        </div>

        ${anomalyNotice}

        <!-- Section 1: Executive Summary -->
        <div class="paper-section">
          <div class="paper-section-title">
            <span>1. תמצית מנהלים ונתוני מפתח מבוקרים</span>
            <span class="tax-tag" style="background:#10b98120; color:#059669; font-size:12px;">🟢 1. נתונים רשמיים מבוקרים</span>
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
            <span class="tax-tag" style="background:#2563eb20; color:#1d4ed8; font-size:12px;">🔵 2. נתונים מחושבים מבוקרים</span>
          </div>
          <table class="paper-table">
            <thead>
              <tr>
                <th>סעיף תקציבי מבוקר</th>
                <th>קוד סעיף</th>
                <th style="text-align: left;">סכום באלפי ₪</th>
                <th style="text-align: left;">סכום לנפש (₪/תושב)</th>
                <th>הערות מקור והגדרה</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>סך הוצאות חינוך בתקציב הרגיל</strong></td>
                <td class="font-mono">1486</td>
                <td class="font-mono text-left font-bold">₪${exp1486.toLocaleString()}K</td>
                <td class="font-mono text-left">₪${Math.round((exp1486 * 1000) / pop).toLocaleString()} לנפש</td>
                <td>דוח ביצוע תקציב רגיל (פרק 6)</td>
              </tr>
              <tr>
                <td><strong>סך תקבולי חינוך והשתתפות משה"ח</strong></td>
                <td class="font-mono">1384</td>
                <td class="font-mono text-left">₪${rev1384.toLocaleString()}K</td>
                <td class="font-mono text-left">₪${Math.round((rev1384 * 1000) / pop).toLocaleString()} לנפש</td>
                <td>השתתפויות ייעודיות שכר ופעילות</td>
              </tr>
              <tr style="background: #f1f5f9;">
                <td><strong>השתתפות עצמית נטו של הרשות בחינוך</strong></td>
                <td class="font-mono">1486-1384</td>
                <td class="font-mono text-left font-bold" style="color: #2563eb;">₪${netDiff.toLocaleString()}K</td>
                <td class="font-mono text-left font-bold" style="color: #2563eb;">₪${expPerCapita.toLocaleString()} לנפש</td>
                <td>מימון ישיר מקופת הרשות</td>
              </tr>
              <tr>
                <td><strong>סך הכנסות עצמיות (ארנונה, אגרות והיטלים)</strong></td>
                <td class="font-mono">1805</td>
                <td class="font-mono text-left">₪${(authority.own_revenue_1805_tk || 0).toLocaleString()}K</td>
                <td class="font-mono text-left">₪${(authority.own_revenues_per_capita_nis || 0).toLocaleString()} לנפש</td>
                <td>שיעור עצמאות פיסקלית: <strong>${authority.own_revenue_share_pct}%</strong></td>
              </tr>
              <tr>
                <td><strong>הכנסות מארנונה עסקית ומסחרית</strong></td>
                <td class="font-mono">4146</td>
                <td class="font-mono text-left">₪${(authority.arnona_other_4146_tk || 0).toLocaleString()}K</td>
                <td class="font-mono text-left">₪${(authority.arnona_other_per_capita_nis || 0).toLocaleString()} לנפש</td>
                <td>בסיס מס שאינו ממגורים</td>
              </tr>
              <tr>
                <td><strong>מענק איזון כללי ממשרד הפנים</strong></td>
                <td class="font-mono">1819</td>
                <td class="font-mono text-left">${authority.balancing_grant_1819_tk > 0 ? '₪' + authority.balancing_grant_1819_tk.toLocaleString() + 'K' : '₪0'}</td>
                <td class="font-mono text-left">${authority.balancing_grant_per_capita_nis > 0 ? '₪' + authority.balancing_grant_per_capita_nis.toLocaleString() + ' לנפש' : 'אין זכאות'}</td>
                <td>מענק סיוע כללי לגישור פער פיסקלי</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Section 3: Simulation Breakdown -->
        ${simDetailedBreakdownHtml}

        <!-- Footer Sign-off -->
        <div class="report-footer-sign">
          <div style="font-weight:700; color:#0f172a;">פיילוט — מערכת ניסיונית לניתוח פערי תקצוב וצדק חלוקתי בחינוך המוניציפלי</div>
          <div style="font-size:13px; color:#64748b;">פיתוח וניהול הפיילוט: גלעד גולדמן | giladgo10@gmail.com | ${window.METHODOLOGY_VERSION}</div>
        </div>
      </div>
    `;
  }
};