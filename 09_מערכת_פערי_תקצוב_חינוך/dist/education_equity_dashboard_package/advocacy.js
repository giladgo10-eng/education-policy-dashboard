// ==============================================================================
// advocacy.js - Enriched Policy Paper and Parliamentary Brief Generator
// ==============================================================================

window.EducationAdvocacy = {
  // Generates complete HTML report for the selected authority
  generateReport: function(authority, nationalAvg, simData) {
    if (!authority) return '<div class="alert">נא לבחור רשות להפקת נייר עמדה.</div>';

    const diffPct = authority.national_avg_diff_pct;
    const isBelowAvg = diffPct < 0;
    const diffClass = isBelowAvg ? 'text-negative' : 'text-positive';
    const diffSign = isBelowAvg ? '' : '+';

    const currentDate = new Date().toLocaleDateString('he-IL', { year: 'numeric', month: 'long', day: 'numeric' });

    let simulationSection = '';
    if (simData && simData.gain_nis_per_pupil) {
      simulationSection = `
        <div class="paper-section">
          <div class="paper-section-title">השפעת מודל התקצוב המתקן המוצע ע"י האיגוד</div>
          <p>על פי סימולציית מודל התקצוב הדיפרנציאלי המשולב:</p>
          <div class="paper-box" style="background: #ecfdf5; border-color: #a7f3d0;">
            <div style="font-weight: 700; color: #065f46; font-size: 15px; margin-bottom: 6px;">
              תוספת שנתית לרשות: ₪${(simData.allocated_grant_k_nis).toLocaleString()} אלפי ש"ח (+₪${simData.gain_nis_per_pupil.toLocaleString()} לתלמיד, עלייה של ${simData.gain_pct}%)
            </div>
            <p style="font-size: 13px; color: #047857;">
              המודל המתקן מעלה את סל ההשקעה לתלמיד ב${authority.name} מ-₪${authority.total_spending_per_pupil_nis.toLocaleString()} ל-<strong>₪${simData.simulated_spending_per_pupil.toLocaleString()}</strong>, ומצמצם את הפער מול הממוצע הארצי באופן ניכר.
            </p>
          </div>
        </div>
      `;
    }

    return `
      <div class="advocacy-paper">
        <div class="paper-header">
          <div>
            <div class="paper-title">איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות</div>
            <div class="paper-subtitle">נייר עמדה וממצאים לקראת דיוני תקציב החינוך, נטל החנ"מ וצדק חלוקתי</div>
          </div>
          <div style="text-align: left; font-size: 13px; color: var(--text-muted);">
            <div><strong>תאריך:</strong> ${currentDate}</div>
            <div><strong>רשות נבדקת:</strong> ${authority.name} (${authority.type})</div>
          </div>
        </div>

        <div class="paper-section">
          <div class="paper-section-title">1. תקציר מנהלים ופרופיל הרשות</div>
          <p>
            ברשות המקומית <strong>${authority.name}</strong> (${authority.district}) לומדים <strong>${authority.total_pupils.toLocaleString()} תלמידים</strong>.
            הרשות מסווגת באשכול חברתי-כלכלי <strong>${authority.cbs_socio_cluster}</strong> ומדד פריפריאליות <strong>${authority.cbs_periphery_cluster}</strong>.
            סיווג המערכת לרשות זו הינו: <span class="badge badge-trap">${authority.equity_category}</span>.
          </p>
          
          <div class="paper-box">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; font-size: 14px;">
              <div><strong>סל השקעה כולל לתלמיד:</strong> ₪${authority.total_spending_per_pupil_nis.toLocaleString()}</div>
              <div><strong>ממוצע ארצי משוקלל:</strong> ₪${nationalAvg.toLocaleString()}</div>
              <div><strong>פער מול הממוצע:</strong> <span class="${diffClass}">${diffSign}${diffPct}%</span></div>
              <div><strong>ארנונה עסקית לתלמיד:</strong> ₪${authority.arnona_per_pupil_nis.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div class="paper-section">
          <div class="paper-section-title">2. נטל החינוך המיוחד, גירעונות הסעות ומחסור בתשתיות</div>
          <p>
            מעבר לפערי התקצוב הכלליים, הרשות מתמודדת עם הוצאות קשיחות כבדות שאינן מכוסות כראוי על ידי המדינה:
          </p>
          <ul style="margin: 12px 24px; font-size: 14px; line-height: 1.8;">
            <li><strong>חינוך מיוחד:</strong> ברשות לומדים <strong>${(authority.pupils_special_ed || 0).toLocaleString()} תלמידי חנ"מ</strong> (${authority.special_ed_pct || 8}%). ההוצאה העירונית העודפת נאמדת ב-<strong>₪${(authority.special_ed_muni_burden_nis || 0).toLocaleString()}</strong> לתלמיד חנ"מ.</li>
            <li><strong>גירעון הסעות תלמידים:</strong> הרשות סופגת גירעון הסעות בסך <strong>₪${(authority.transport_deficit_per_pupil_nis || 0).toLocaleString()}</strong> לתלמיד בשנה מתוך תקציב הסעות כולל של ₪${(authority.transport_expense_k_nis || 0).toLocaleString()} אלף.</li>
            <li><strong>מחסור בכיתות לימוד:</strong> מחסור של כ-<strong>${authority.classroom_shortage_units || 0} כיתות קבועות</strong>, הגורר עלויות שכירות ומבנים יבילים.</li>
          </ul>
        </div>

        <div class="paper-section">
          <div class="paper-section-title">3. ניתוח פערי המימון והעיוות המוניציפלי</div>
          <p>
            בעוד שמשרד החינוך מעניק תקצוב בסיסי ודיפרנציאלי בסך <strong>₪${authority.gov_total_per_pupil_nis.toLocaleString()}</strong> לתלמיד, 
            הפער המכריע בין הרשויות נובע מיכולתה של הרשות להשקיע מקורות עצמיים הנגזרים מבסיס הארנונה העסקית שלה.
          </p>
          <ul style="margin: 12px 24px; font-size: 14px; line-height: 1.8;">
            <li><strong>השקעה עצמית של הרשות:</strong> ₪${authority.muni_self_spend_per_pupil_nis.toLocaleString()} לתלמיד (לעומת מעל ₪12,000 ברשויות חזקות).</li>
            <li><strong>תשלומי הורים ותרומות:</strong> ₪${authority.parents_co_pay_per_pupil_nis.toLocaleString()} לתלמיד.</li>
            <li><strong>תקציבי מאצ'ינג שאבדו / בסיכון:</strong> ₪${authority.lost_matching_per_pupil_nis.toLocaleString()} לתלמיד עקב מגבלת השתתפות עצמית.</li>
          </ul>
        </div>

        ${simulationSection}

        <div class="paper-section">
          <div class="paper-section-title">4. המלצות ודרישות איגוד מנהלי החינוך לוועדת החינוך והאוצר</div>
          <ol style="margin: 12px 24px; font-size: 14px; line-height: 1.8;">
            <li><strong>שילוב כושר הכנסה מוניציפלי (ארנונה עסקית לתלמיד) בנוסחת התקצוב הדיפרנציאלי:</strong> תיקון העיוות שבו רשויות עשירות בארנונה מקבלות תקציבי העדפה רק על בסיס מדד התושבים.</li>
            <li><strong>כיסוי מלא של הוצאות החינוך המיוחד וההסעות:</strong> הקמת 'קרן שיפוי ממשלתית' שתמנע גריעת תקציבי חינוך רגיל לטובת מימון סייעות והסעות.</li>
            <li><strong>ביטול מלא של חובת ההשתתפות העצמית (Matching) ברשויות ללא הכנסות מסחריות:</strong> מניעת מצב שבו תקציבי חינוך מותנים של מיליארדי ש"ח אינם מגיעים לתלמידים הזקוקים להם ביותר.</li>
            <li><strong>הקמת 'קרן איזון חינוכית מוניציפלית':</strong> הבטחת רצפת השקעה מינימלית של לפחות ₪28,000 לכל תלמיד בישראל, ללא תלות במקום מגוריו.</li>
          </ol>
        </div>

        <div style="margin-top: 30px; padding-top: 16px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
          <div>הופק באמצעות המערכת הלאומית לניתוח פערי תקצוב וצדק חלוקתי בחינוך</div>
          <div>איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות ©</div>
        </div>
      </div>
    `;
  }
};
