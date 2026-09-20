// ==============================================================================
// advocacy.js - Enriched Policy Paper and Parliamentary Brief Generator
// ==============================================================================

window.EducationAdvocacy = {
  // Generates complete HTML report for the selected authority based on 2024 audited data
  generateReport: function(authority, nationalAvg, simData) {
    if (!authority) return '<div class="alert">נא לבחור רשות להפקת נייר עמדה.</div>';

    const selfFundingRate = authority.municipal_education_self_funding_rate || 0;
    const isBelowAvg = selfFundingRate < (nationalAvg || 24.1);
    const diffFromAvg = (selfFundingRate - (nationalAvg || 24.1)).toFixed(1);
    const diffSign = selfFundingRate >= (nationalAvg || 24.1) ? '+' : '';

    const currentDate = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });

    let simulationSection = '';
    if (simData && simData.grant_per_capita_nis) {
      simulationSection = `
        <div class="paper-section">
          <div class="paper-section-title">השפעת מודל התקצוב המתקן המוצע ע"י האיגוד</div>
          <p>על פי סימולציית מודל התקצוב הדיפרנציאלי המשולב:</p>
          <div class="paper-box" style="background: #ecfdf5; border-color: #a7f3d0;">
            <div style="font-weight: 700; color: #065f46; font-size: 15px; margin-bottom: 6px;">
              תוספת שנתית מוערכת לרשות: ₪${(simData.allocated_grant_k_nis).toLocaleString()} אלפי ש"ח (+₪${simData.grant_per_capita_nis.toLocaleString()} לנפש, עלייה של ${simData.gain_pct}%)
            </div>
            <p style="font-size: 13px; color: #047857; margin: 0;">
              המודל המתקן מעלה את ההשקעה העצמית המוניציפלית ב${authority.name} מ-₪${(simData.orig_net_exp_per_capita || 0).toLocaleString()} ל-<strong>₪${(simData.simulated_net_exp_per_capita || 0).toLocaleString()} לנפש</strong>, ומסייע בצמצום הפער מול רשויות איתנות.
            </p>
          </div>
        </div>
      `;
    }

    let anomalyNotice = '';
    if (authority.is_war_evacuated_2024) {
      anomalyNotice = `
        <div class="paper-box" style="background: #fef2f2; border-color: #fca5a5; margin-bottom: 16px;">
          <strong style="color: #991b1b;">הערת שקיפות — שנת מלחמה ופינוי (2024):</strong>
          <span style="font-size: 13px; color: #7f1d1d;"> הרשות נכללת ברשימת יישובי קו העימות שפונו בשנת 2024. הנתונים הכספיים משקפים את המציאות החשבונאית המיוחדת של שנת המלחמה (כולל מקדמות והתאמות).</span>
        </div>
      `;
    } else if (authority.is_tamar_outlier) {
      anomalyNotice = `
        <div class="paper-box" style="background: #faf5ff; border-color: #d8b4fe; margin-bottom: 16px;">
          <strong style="color: #6b21a8;">הערת שקיפות — חריג מבני קיצוני (מועצה אזורית תמר):</strong>
          <span style="font-size: 13px; color: #581c87;"> הרשות מתאפיינת בבסיס ארנונה עסקית חריג ביותר לנפש (מלונות ים המלח ומפעלי ים המלח) לצד אוכלוסייה קטנה (2,138 תושבים).</span>
        </div>
      `;
    }

    return `
      <div class="paper-header">
        <div class="paper-emblem">🛡️</div>
        <div class="paper-org">איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות</div>
        <div class="paper-title">נייר עמדה ומסמך מדיניות: פערי מימון והשתתפות עצמית בחינוך</div>
        <div class="paper-sub">רשות מקומית: <strong>${authority.name}</strong> (${authority.type}) | סמל למ"ס: <strong>${authority.code}</strong> | מחוז: <strong>${authority.district}</strong></div>
        <div class="paper-meta">תאריך הפקה: ${currentDate} | בסיס נתונים: דוחות כספיים מבוקרים 2024 (משרד הפנים והלמ"ס)</div>
      </div>

      ${anomalyNotice}

      <div class="paper-section">
        <div class="paper-section-title">1. תמצית מנהלים וממצאי מפתח</div>
        <p>
          על פי הדוחות הכספיים המבוקרים לשנת 2024, סך הוצאות החינוך בתקציב הרגיל של <strong>${authority.name}</strong> עמדו על <strong>₪${(authority.education_expense_1486_tk || 0).toLocaleString()} אלפי ש"ח</strong> (קוד 1486), בעוד שתקבולי החינוך והשתתפויות המדינה (קוד 1384) הסתכמו ב-<strong>₪${(authority.education_revenue_1384_tk || 0).toLocaleString()} אלפי ש"ח</strong>.
        </p>
        <p>
          ההפרש נטו שמומן מקופתה העצמית של הרשות עומד על <strong>₪${(authority.education_net_difference_tk || 0).toLocaleString()} אלפי ש"ח</strong> (₪${Math.round(((authority.education_net_difference_tk || 0) * 1000) / (authority.population || 1)).toLocaleString()} לנפש), המהווה <strong>שיעור השתתפות עצמית של ${selfFundingRate}%</strong> מכלל תקציב החינוך המקומי.
        </p>
        <div class="paper-box">
          שיעור זה ${isBelowAvg ? 'נמוך ב-' + Math.abs(diffFromAvg) + '%' : 'גבוה ב-' + diffFromAvg + '%'} מהממוצע הארצי של הרשויות המקומיות (24.1%).
          הרשות מדורגת באשכול חברתי-כלכלי <strong>${authority.cbs_socio_cluster}</strong> של הלמ"ס, ושיעור הכנסותיה העצמיות עומד על <strong>${authority.own_revenue_share_pct}%</strong> מסך תקציבה הרגיל.
        </div>
      </div>

      <div class="paper-section">
        <div class="paper-section-title">2. פירוט פיסקלי והשוואת תקציב חינוך 2024</div>
        <table class="paper-table">
          <thead>
            <tr>
              <th>סעיף תקציבי מבוקר (קוד משרד הפנים)</th>
              <th style="text-align: left;">סכום באלפי ₪</th>
              <th style="text-align: left;">סכום לנפש (₪)</th>
              <th style="text-align: left;">הערות ומשמעות</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>סך הוצאות חינוך (קוד 1486)</strong></td>
              <td style="text-align: left;">₪${(authority.education_expense_1486_tk || 0).toLocaleString()}</td>
              <td style="text-align: left;">₪${Math.round(((authority.education_expense_1486_tk || 0) * 1000) / (authority.population || 1)).toLocaleString()}</td>
              <td style="text-align: left;">כלל ההוראה, מנהלה, אחזקה ופעולות בחינוך</td>
            </tr>
            <tr>
              <td><strong>סך תקבולי חינוך ומשה"ח (קוד 1384)</strong></td>
              <td style="text-align: left;">₪${(authority.education_revenue_1384_tk || 0).toLocaleString()}</td>
              <td style="text-align: left;">₪${Math.round(((authority.education_revenue_1384_tk || 0) * 1000) / (authority.population || 1)).toLocaleString()}</td>
              <td style="text-align: left;">השתתפות ייעודית של משרד החינוך וצד ג'</td>
            </tr>
            <tr style="background: #f8fafc; font-weight: 700;">
              <td><strong>הפרש נטו למימון עצמי (1486 - 1384)</strong></td>
              <td style="text-align: left; color: #2563eb;">₪${(authority.education_net_difference_tk || 0).toLocaleString()}</td>
              <td style="text-align: left; color: #2563eb;">₪${Math.round(((authority.education_net_difference_tk || 0) * 1000) / (authority.population || 1)).toLocaleString()}</td>
              <td style="text-align: left;">מימון בפועל מקופת הרשות המקומית</td>
            </tr>
            <tr>
              <td><strong>סך הכנסות עצמיות (קוד 1805)</strong></td>
              <td style="text-align: left;">₪${(authority.own_revenue_1805_tk || 0).toLocaleString()}</td>
              <td style="text-align: left;">₪${(authority.own_revenues_per_capita_nis || 0).toLocaleString()}</td>
              <td style="text-align: left;">ארנונה, אגרות, היטלים והכנסות נכסים</td>
            </tr>
            <tr>
              <td><strong>ארנונה אחרת (עסקית/מסחרית) (קוד 4146)</strong></td>
              <td style="text-align: left;">₪${(authority.arnona_other_4146_tk || 0).toLocaleString()}</td>
              <td style="text-align: left;">₪${(authority.arnona_other_per_capita_nis || 0).toLocaleString()}</td>
              <td style="text-align: left;">מקור הכנסה קריטי למימון שירותים מוניציפליים</td>
            </tr>
            <tr>
              <td><strong>מענק איזון (קוד 1819)</strong></td>
              <td style="text-align: left;">₪${(authority.balancing_grant_1819_tk || 0).toLocaleString()}</td>
              <td style="text-align: left;">₪${(authority.balancing_grant_per_capita_nis || 0).toLocaleString()}</td>
              <td style="text-align: left;">${authority.balancing_grant_1819_tk > 0 ? 'זכאית למענק איזון ממשרד הפנים' : 'אין זכאות למענק איזון'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${simulationSection}

      <div class="paper-section">
        <div class="paper-section-title">3. המלצות מדיניות ודרישות לוועדות הכנסת</div>
        <ol style="padding-right: 20px; line-height: 1.7; font-size: 13.5px; color: #334155;">
          <li><strong>ביסוס תקצוב דיפרנציאלי מובנה בסעיפי ההשתתפות:</strong> עדכון מנגנוני התקצוב של משרד החינוך כך שיפצו באופן ישיר על היעדר יכולת פיסקלית עצמית (הכנסות מארנונה עסקית) ברשויות באשכולות 1–6.</li>
          <li><strong>הגמשת השימוש במענק האיזון:</strong> הכרה רשמית בהוצאות ההשתתפות העצמית בחינוך כמרכיב קשיח בנוסחת מענק האיזון של משרד הפנים.</li>
          <li><strong>יצירת קרן צדק חלוקתי מוניציפלי לחינוך:</strong> הקמת קרן ייעודית בהיקף של 1 מיליארד ₪ שתופנה ישירות לצמצום פערי סל התלמיד המוניציפלי בין הפריפריה למרכז.</li>
        </ol>
      </div>

      <div class="paper-signature">
        <div>
          <div style="font-weight: 700; color: #0f172a;">איגוד מנהלי אגפי ומחלקות החינוך</div>
          <div style="font-size: 12px; color: #64748b;">הנהלת האיגוד וצוות המחקר הכלכלי</div>
        </div>
        <div style="border-top: 1px dashed #cbd5e1; width: 160px; text-align: center; padding-top: 6px; font-size: 12px; color: #94a3b8;">
          חתימה וחותמת רשמית
        </div>
      </div>
    `;
  }
};