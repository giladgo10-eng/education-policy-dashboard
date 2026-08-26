// ==============================================================================
// charts.js - Lightweight, standalone canvas charting engine for Education Equity
// ==============================================================================

window.EducationCharts = {
  // Category colors
  categoryColors: {
    'AFFLUENT_HIGH': '#2563eb', // Blue
    'PARADOX_LOW_SOCIO_HIGH_ARNONA': '#d97706', // Amber
    'MIDDLE_TRAP': '#ea580c', // Orange
    'VULNERABLE_LOCKED': '#dc2626' // Red
  },

  // Renders the 4-Quadrant Scatter Matrix
  renderScatterMatrix: function(canvas, data, selectedCode, onSelectCallback) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth;
    const height = 480;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    const padding = { top: 40, right: 60, bottom: 60, left: 80 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    // Coordinate mappings
    // X axis: Socio cluster (1 to 10)
    // Y axis: Arnona per pupil (0 to 36000)
    const minX = 0.5, maxX = 10.5;
    const minY = 0, maxY = 36000;

    function getX(val) {
      return padding.left + ((val - minX) / (maxX - minX)) * chartW;
    }
    function getY(val) {
      return padding.top + chartH - ((val - minY) / (maxY - minY)) * chartH;
    }

    // Draw Quadrant Backgrounds & Dividing Lines
    const splitX = getX(5.5);
    const splitY = getY(5000);

    // Top-Left: Paradox (Low Socio, High Arnona)
    ctx.fillStyle = 'rgba(254, 243, 199, 0.35)';
    ctx.fillRect(padding.left, padding.top, splitX - padding.left, splitY - padding.top);

    // Top-Right: Affluent (High Socio, High Arnona)
    ctx.fillStyle = 'rgba(219, 234, 254, 0.35)';
    ctx.fillRect(splitX, padding.top, width - padding.right - splitX, splitY - padding.top);

    // Bottom-Left: Vulnerable Locked (Low Socio, Low Arnona)
    ctx.fillStyle = 'rgba(254, 226, 226, 0.35)';
    ctx.fillRect(padding.left, splitY, splitX - padding.left, height - padding.bottom - splitY);

    // Bottom-Right: Middle Trap (Mid/High Socio, Low Arnona)
    ctx.fillStyle = 'rgba(255, 237, 213, 0.35)';
    ctx.fillRect(splitX, splitY, width - padding.right - splitX, height - padding.bottom - splitY);

    // Draw Quadrant Reference Labels
    ctx.font = 'bold 12px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillStyle = '#92400e';
    ctx.fillText('רשויות פרדוקסליות (סוציו נמוך + ארנונה עסקית)', padding.left + 15, padding.top + 25);

    ctx.fillStyle = '#1e40af';
    ctx.fillText('רשויות איתנות (סוציו גבוה + ארנונה עסקית)', splitX + 15, padding.top + 25);

    ctx.fillStyle = '#991b1b';
    ctx.fillText('רשויות מוחלשות כלואות (פגיעה כפולה)', padding.left + 15, height - padding.bottom - 15);

    ctx.fillStyle = '#c2410c';
    ctx.fillText('מלכודת הביניים (ללא טיפוח וללא ארנונה)', splitX + 15, height - padding.bottom - 15);

    // Draw Grid Lines & Axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // X grid lines
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    for (let s = 1; s <= 10; s++) {
      const x = getX(s);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      ctx.fillText('אשכול ' + s, x, height - padding.bottom + 20);
    }

    // Y grid lines
    ctx.textAlign = 'right';
    for (let a = 0; a <= 35000; a += 5000) {
      const y = getY(a);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.fillText('₪' + a.toLocaleString(), padding.left - 10, y + 4);
    }
    ctx.setLineDash([]);

    // Axis Labels
    ctx.font = 'bold 13px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.fillText('אשכול חברתי-כלכלי למ"ס (מדד מצב התושבים) ◄', padding.left + chartW / 2, height - 15);

    ctx.save();
    ctx.translate(20, padding.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('ארנונה עסקית לתלמיד (₪) - עושר מוניציפלי ◄', 0, 0);
    ctx.restore();

    // Plot Authorities
    const hitZones = [];
    data.forEach(item => {
      const cx = getX(item.cbs_socio_cluster);
      const cy = getY(Math.min(35000, item.arnona_per_pupil_nis));
      const radius = Math.max(5, Math.min(22, Math.sqrt(item.total_pupils) / 12));
      const isSelected = (item.code === selectedCode);

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#10b981' : (EducationCharts.categoryColors[item.equity_category_code] || '#3b82f6');
      ctx.globalAlpha = isSelected ? 1 : 0.75;
      ctx.fill();
      ctx.lineWidth = isSelected ? 3 : 1;
      ctx.strokeStyle = isSelected ? '#ffffff' : 'rgba(0,0,0,0.2)';
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Draw label for selected or prominent authorities
      if (isSelected || ['5000', '6100', '1063', '2640', '3000', '507', '6400', '1200'].includes(item.code)) {
        ctx.fillStyle = '#0f172a';
        ctx.font = (isSelected ? 'bold 13px ' : '11px ') + getComputedStyle(document.body).fontFamily;
        ctx.textAlign = 'center';
        ctx.fillText(item.name, cx, cy - radius - 4);
      }

      hitZones.push({ item, cx, cy, radius });
    });

    // Store hit zones on canvas for interactivity
    canvas._hitZones = hitZones;

    // Attach click listener once
    if (!canvas._hasClickListener) {
      canvas.addEventListener('click', function(evt) {
        const rect = canvas.getBoundingClientRect();
        const clickX = evt.clientX - rect.left;
        const clickY = evt.clientY - rect.top;

        if (canvas._hitZones) {
          for (let i = canvas._hitZones.length - 1; i >= 0; i--) {
            const h = canvas._hitZones[i];
            const dist = Math.hypot(clickX - h.cx, clickY - h.cy);
            if (dist <= h.radius + 4) {
              if (onSelectCallback) onSelectCallback(h.item);
              break;
            }
          }
        }
      });
      canvas._hasClickListener = true;
    }
  },

  // Renders 4-layer per-pupil investment donut chart
  renderPerPupilDonut: function(canvas, authority) {
    if (!canvas || !authority) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(canvas.parentElement.clientWidth, 280);

    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.42;
    const innerRadius = size * 0.26;

    const layers = [
      { name: 'תקצוב משה"ח בסיס', val: authority.gov_standard_per_pupil_nis, color: '#3b82f6' },
      { name: 'תוספת טיפוח דיפרנציאלי', val: authority.gov_differential_per_pupil_nis, color: '#8b5cf6' },
      { name: 'השקעת הרשות (עצמי)', val: authority.muni_self_spend_per_pupil_nis, color: '#10b981' },
      { name: 'תשלומי הורים', val: authority.parents_co_pay_per_pupil_nis, color: '#f59e0b' }
    ];

    const total = authority.total_spending_per_pupil_nis || 1;
    let currentAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, size, size);

    layers.forEach(layer => {
      const sliceAngle = (layer.val / total) * (Math.PI * 2);
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fillStyle = layer.color;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      currentAngle += sliceAngle;
    });

    // Center Total Text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('₪' + total.toLocaleString(), centerX, centerY - 6);

    ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillStyle = '#64748b';
    ctx.fillText('סל תלמיד כולל', centerX, centerY + 14);
  },

  // Renders peer comparison bar chart
  renderPeerComparison: function(canvas, currentAuth, peers, nationalAvg) {
    if (!canvas || !currentAuth) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.parentElement.clientWidth;
    const height = 260;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const items = [
      { name: currentAuth.name + ' (נוכחי)', val: currentAuth.total_spending_per_pupil_nis, color: '#1e3a8a', isCurrent: true },
      ...peers.map(p => ({ name: p.name, val: p.total_spending_per_pupil_nis, color: '#64748b' })),
      { name: 'ממוצע ארצי', val: nationalAvg, color: '#f59e0b' }
    ];

    const padding = { top: 20, right: 30, bottom: 40, left: 140 };
    const chartW = width - padding.left - padding.right;
    const rowHeight = (height - padding.top - padding.bottom) / items.length;
    const maxVal = 40000;

    items.forEach((it, idx) => {
      const y = padding.top + idx * rowHeight;
      const barW = (it.val / maxVal) * chartW;

      // Label
      ctx.fillStyle = it.isCurrent ? '#1e3a8a' : '#0f172a';
      ctx.font = (it.isCurrent ? 'bold 13px ' : '12px ') + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(it.name, padding.left - 12, y + rowHeight / 2);

      // Bar Background
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(padding.left, y + 6, chartW, rowHeight - 12);

      // Value Bar
      ctx.fillStyle = it.color;
      ctx.fillRect(padding.left, y + 6, barW, rowHeight - 12);

      // Value text inside / next to bar
      ctx.fillStyle = barW > 80 ? '#ffffff' : '#0f172a';
      ctx.font = 'bold 12px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = barW > 80 ? 'right' : 'left';
      ctx.fillText('₪' + it.val.toLocaleString(), padding.left + (barW > 80 ? barW - 8 : barW + 8), y + rowHeight / 2);
    });
  }
};
