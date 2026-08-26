/**
 * UI Controller - Master Data Reconciliation & Cleansing System
 * Coordinates file ingestion, UI tab transitions, pipelines, interactive conflicts, filters and exports.
 */
class AppController {
  constructor() {
    this.runId = `RUN_${new Date().toISOString().replace(/[-:T.]/g, '_').slice(0, 19)}`;
    this.sources = {
      A: null,
      B: null,
      C: null
    };
    this.dictionaries = {
      authorities: null,
      roles: null,
      field_aliases: null,
      cleansing_rules: null,
      matching_rules: null,
      source_priority: null,
      quality_score_rules: null
    };

    this.userMappings = {
      A: {},
      B: {},
      C: {}
    };

    this.userOverrides = {};

    this.cleansedRecords = [];
    this.clusters = [];
    this.matchPairs = [];
    this.conflictsList = [];
    this.masterRecords = [];
    this.metrics = null;

    this.logger = new AuditLogger(this.runId);
    this.parser = new DataParser();
    this.cleaner = new Cleaner(null, this.logger);
    this.normalizer = new Normalizer(null, null, this.logger);
    this.matcher = new RecordMatcher();
    this.resolver = new ConflictResolver(null, this.logger);
    this.merger = new RecordMerger(null, this.logger);
    this.qualityEngine = new QualityEngine();
    this.exporter = new DataExporter();
  }

  async init() {
    document.getElementById('app-run-id').textContent = this.runId;
    this._setupTabNavigation();
    this._setupFileUploaders();
    await this._loadDictionaries();
  }

  _setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');
        this.goToTab(targetId);
      });
    });
  }

  goToTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

    const btn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
    const pane = document.getElementById(tabId);

    if (btn) btn.classList.add('active');
    if (pane) pane.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async _loadDictionaries() {
    try {
      const [authorities, roles, field_aliases, cleansing_rules, matching_rules, source_priority, quality_score_rules] = await Promise.all([
        this._fetchJson('../03_dictionaries/dictionary_authorities.json'),
        this._fetchJson('../03_dictionaries/dictionary_roles.json'),
        this._fetchJson('../03_dictionaries/field_aliases.json'),
        this._fetchJson('../03_dictionaries/cleansing_rules.json'),
        this._fetchJson('../03_dictionaries/matching_rules.json'),
        this._fetchJson('../03_dictionaries/source_priority.json'),
        this._fetchJson('../03_dictionaries/quality_score_rules.json')
      ]);

      this.dictionaries = {
        authorities,
        roles,
        field_aliases,
        cleansing_rules,
        matching_rules,
        source_priority,
        quality_score_rules
      };

      this.parser.setFieldAliases(field_aliases);
      this.cleaner = new Cleaner(cleansing_rules, this.logger);
      this.normalizer = new Normalizer(authorities, roles, this.logger);
      this.matcher.setRules(matching_rules);
      this.resolver = new ConflictResolver(source_priority, this.logger);
      this.merger = new RecordMerger(source_priority, this.logger);
      this.qualityEngine.setRules(quality_score_rules);

      console.log('Dictionaries and rules loaded successfully.');
    } catch (err) {
      console.warn('Could not load JSON dictionaries via fetch (running without local server). Using bundled defaults.', err);
    }
  }

  async _fetchJson(url) {
    const res = await fetch(url);
    return await res.json();
  }

  _setupFileUploaders() {
    ['A', 'B', 'C'].forEach(srcId => {
      const fileInput = document.getElementById(`file-input-${srcId}`);
      const dropzone = document.getElementById(`dropzone-${srcId}`);

      if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
          if (e.target.files && e.target.files[0]) {
            await this.handleFile(srcId, e.target.files[0]);
          }
        });
      }

      if (dropzone) {
        dropzone.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });
        dropzone.addEventListener('dragleave', () => {
          dropzone.classList.remove('dragover');
        });
        dropzone.addEventListener('drop', async (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await this.handleFile(srcId, e.dataTransfer.files[0]);
          }
        });
      }
    });
  }

  async handleFile(sourceId, file) {
    const sourceName = document.getElementById(`name-source-${sourceId}`).value || `מקור ${sourceId}`;
    try {
      let bufferOrText;
      if (file.name.endsWith('.csv')) {
        bufferOrText = await file.text();
      } else {
        bufferOrText = await file.arrayBuffer();
      }

      const parsed = await this.parser.parseFile(bufferOrText, file.name, sourceId, sourceName);
      this.sources[sourceId] = parsed;
      this.userMappings[sourceId] = parsed.suggestedMapping;

      // Update UI for this source
      const statusBadge = document.getElementById(`status-source-${sourceId}`);
      statusBadge.textContent = 'נטען בהצלחה ✓';
      statusBadge.className = 'badge badge-success';

      const statsEl = document.getElementById(`stats-source-${sourceId}`);
      statsEl.style.display = 'flex';
      document.getElementById(`rows-cnt-${sourceId}`).textContent = parsed.rows.length;
      document.getElementById(`cols-cnt-${sourceId}`).textContent = parsed.headers.length;
      document.getElementById(`qc-score-${sourceId}`).textContent = `${parsed.qcReport.initialHealthScore}%`;

      this.renderQcSummaryTable();
    } catch (err) {
      console.error(`Error parsing source ${sourceId}:`, err);
      alert(`שגיאה בטעינת קובץ ${sourceId}: ${err.message}`);
    }
  }

  async loadSampleSmooveFile() {
    try {
      const response = await fetch('../01_source_files/רשימת כל חברים מהסמוב 18-8-2026.csv');
      const text = await response.text();
      const parsed = await this.parser.parseFile(text, 'רשימת כל חברים מהסמוב 18-8-2026.csv', 'A', 'רשימת סמוב מלאה');
      this.sources['A'] = parsed;
      this.userMappings['A'] = parsed.suggestedMapping;

      document.getElementById('name-source-A').value = 'רשימת סמוב מלאה';
      const statusBadge = document.getElementById('status-source-A');
      statusBadge.textContent = 'נטען (2,038 חברים) ✓';
      statusBadge.className = 'badge badge-success';

      const statsEl = document.getElementById('stats-source-A');
      statsEl.style.display = 'flex';
      document.getElementById('rows-cnt-A').textContent = parsed.rows.length;
      document.getElementById('cols-cnt-A').textContent = parsed.headers.length;
      document.getElementById('qc-score-A').textContent = `${parsed.qcReport.initialHealthScore}%`;

      this.renderQcSummaryTable();
    } catch (err) {
      console.error('Error loading sample file:', err);
      alert('נא לבחור את הקובץ ישירות באמצעות כפתור הבחירה');
    }
  }

  renderQcSummaryTable() {
    const tbody = document.getElementById('qc-table-body');
    tbody.innerHTML = '';

    const loadedSources = Object.values(this.sources).filter(s => s !== null);
    if (loadedSources.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">טרם נטענו קבצים.</td></tr>`;
      return;
    }

    loadedSources.forEach(s => {
      const qc = s.qcReport;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${s.sourceName} (${s.sourceId})</strong></td>
        <td style="font-family: var(--font-mono); font-size: 0.85rem;">${s.fileName}</td>
        <td><strong>${qc.totalRows.toLocaleString()}</strong></td>
        <td>${qc.totalCols}</td>
        <td>${qc.duplicateHeadersCount > 0 ? `<span class="badge badge-warning">${qc.duplicateHeadersCount} טופלו</span>` : '0'}</td>
        <td>${qc.emptyContactCount > 0 ? `<span class="badge badge-danger">${qc.emptyContactCount}</span>` : '0'}</td>
        <td>${qc.missingAuthorityCount > 0 ? `<span class="badge badge-warning">${qc.missingAuthorityCount}</span>` : '0'}</td>
        <td><span class="badge ${qc.initialHealthScore >= 80 ? 'badge-success' : 'badge-warning'}">${qc.initialHealthScore}%</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  renderMappingTable() {
    const tbody = document.getElementById('mapping-table-body');
    tbody.innerHTML = '';

    const schemaFields = [
      { key: 'full_name', label: 'שם מלא', desc: 'שם איש קשר מלא או הרכבה של פרטי+משפחה' },
      { key: 'first_name', label: 'שם פרטי', desc: 'שם פרטי של חבר האיגוד' },
      { key: 'last_name', label: 'שם משפחה', desc: 'שם משפחה של חבר האיגוד' },
      { key: 'authority', label: 'רשות מקומית', desc: 'עירייה, מועצה מקומית או מועצה אזורית' },
      { key: 'role', label: 'תפקיד', desc: 'הגדרת תפקיד ברשות' },
      { key: 'department', label: 'אגף / יחידה', desc: 'אגף חינוך / יסודי / גיל רך וכו\'' },
      { key: 'phone_mobile', label: 'טלפון נייד', desc: 'מספר סלולרי ראשי (פורמט 05XXXXXXXX)' },
      { key: 'phone_work', label: 'טלפון עבודה / קווי', desc: 'טלפון קווי או ישיר ברשות' },
      { key: 'email', label: 'דוא"ל ראשי', desc: 'כתובת מייל פעילה' },
      { key: 'email_secondary', label: 'דוא"ל משני', desc: 'כתובת דוא"ל אישית או נוספת' },
      { key: 'id_number', label: 'תעודת זהות', desc: 'מספר ת"ז בן 9 ספרות' },
      { key: 'member_status', label: 'סטטוס חבר', desc: 'פעיל / גמלאי' },
      { key: 'notes', label: 'הערות', desc: 'הערות נוספות' }
    ];

    schemaFields.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${f.label}</strong></td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">${f.desc}</td>
        <td>${this._renderColumnSelect('A', f.key)}</td>
        <td>${this._renderColumnSelect('B', f.key)}</td>
        <td>${this._renderColumnSelect('C', f.key)}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  _renderColumnSelect(sourceId, schemaKey) {
    const src = this.sources[sourceId];
    if (!src) return '<span style="color: var(--text-light); font-size: 0.8rem;">(לא נטען)</span>';

    const selectedCol = this.userMappings[sourceId]?.[schemaKey] || '';
    let options = `<option value="">-- בחר עמודה --</option>`;

    src.headers.forEach(h => {
      const isSel = h === selectedCol ? 'selected' : '';
      options += `<option value="${h}" ${isSel}>${h}</option>`;
    });

    return `
      <select class="select-filter" style="width: 100%; font-size: 0.85rem;" onchange="app.updateFieldMapping('${sourceId}', '${schemaKey}', this.value)">
        ${options}
      </select>
    `;
  }

  updateFieldMapping(sourceId, schemaKey, value) {
    if (!this.userMappings[sourceId]) this.userMappings[sourceId] = {};
    this.userMappings[sourceId][schemaKey] = value;
  }

  runPipelineFromTab1() {
    const loadedCount = Object.values(this.sources).filter(s => s !== null).length;
    if (loadedCount === 0) {
      alert('נא לטעון לפחות קובץ מקור אחד לפני המשך.');
      return;
    }
    this.renderMappingTable();
    this.goToTab('tab-2');
  }

  runPipelineFromTab2() {
    this.executeCleansingAndNormalization();
    this.goToTab('tab-3');
  }

  runPipelineFromTab3() {
    this.executeMatching();
    this.goToTab('tab-4');
  }

  runPipelineFromTab5() {
    this.executeFinalMerge();
    this.goToTab('tab-6');
  }

  /**
   * Pipeline Step 3: Cleansing & Normalization
   */
  executeCleansingAndNormalization() {
    this.cleansedRecords = [];
    this.logger.clear();

    let phonesFixedCount = 0;
    let emailsFixedCount = 0;
    let authFixedCount = 0;
    let rolesFixedCount = 0;

    Object.entries(this.sources).forEach(([srcId, srcData]) => {
      if (!srcData) return;
      const mapping = this.userMappings[srcId] || {};

      srcData.rows.forEach(rawRow => {
        const rawId = rawRow._raw_row_id;
        const sourceName = srcData.sourceName;

        // Raw values extraction
        const rawName = mapping.full_name ? rawRow[mapping.full_name] : '';
        const rawFirstName = mapping.first_name ? rawRow[mapping.first_name] : '';
        const rawLastName = mapping.last_name ? rawRow[mapping.last_name] : '';
        const rawAuthority = mapping.authority ? rawRow[mapping.authority] : '';
        const rawRole = mapping.role ? rawRow[mapping.role] : '';
        const rawMobile = mapping.phone_mobile ? rawRow[mapping.phone_mobile] : '';
        const rawWorkPhone = mapping.phone_work ? rawRow[mapping.phone_work] : '';
        const rawEmail = mapping.email ? rawRow[mapping.email] : '';
        const rawEmailSec = mapping.email_secondary ? rawRow[mapping.email_secondary] : '';
        const rawIdNum = mapping.id_number ? rawRow[mapping.id_number] : '';
        const rawNotes = mapping.notes ? rawRow[mapping.notes] : '';

        // 1. Cleaner
        const cleanFullName = this.cleaner.cleanText(rawName || `${rawFirstName} ${rawLastName}`, 'שם מלא', rawId, srcId);
        const cleanFirst = this.cleaner.cleanText(rawFirstName, 'שם פרטי', rawId, srcId);
        const cleanLast = this.cleaner.cleanText(rawLastName, 'שם משפחה', rawId, srcId);

        const phoneRes = this.cleaner.cleanMobilePhone(rawMobile, rawId, srcId);
        if (phoneRes.isFixed) phonesFixedCount++;

        const workPhoneRes = this.cleaner.cleanWorkPhone(rawWorkPhone, rawId, srcId);

        const emailRes = this.cleaner.cleanEmail(rawEmail, rawId, srcId);
        if (emailRes.isFixed) emailsFixedCount++;

        const emailSecRes = this.cleaner.cleanEmail(rawEmailSec, rawId, srcId);
        const idRes = this.cleaner.cleanIdNumber(rawIdNum, rawId, srcId);

        // 2. Normalizer
        const authRes = this.normalizer.normalizeAuthority(rawAuthority, rawId, srcId);
        if (authRes.isMatched) authFixedCount++;

        const roleRes = this.normalizer.normalizeRole(rawRole, rawId, srcId);
        if (roleRes.isMatched) rolesFixedCount++;

        const record = {
          _source_id: srcId,
          _source_name: sourceName,
          _raw_row_id: rawId,
          first_name: cleanFirst,
          last_name: cleanLast,
          full_name: cleanFullName,
          authority: rawAuthority,
          authority_name_standard: authRes.standardName,
          authority_type: authRes.type,
          district: authRes.district,
          role: rawRole,
          role_standard: roleRes.standardRole,
          role_original: roleRes.originalRole,
          department: roleRes.department,
          phone_mobile: phoneRes.cleaned,
          phone_mobile_raw: rawMobile,
          phone_mobile_valid: phoneRes.isValid,
          phone_work: workPhoneRes.cleaned,
          email: emailRes.cleaned,
          email_valid: emailRes.isValid,
          email_secondary: emailSecRes.cleaned,
          id_number: idRes.cleaned,
          notes: rawNotes,
          _rawRowRef: rawRow
        };

        // Transfer any extra columns (e.g. distribution lists)
        Object.keys(rawRow).forEach(k => {
          if (k.startsWith('רשימה:') || k.startsWith('מורשה')) {
            record[k] = rawRow[k];
          }
        });

        this.cleansedRecords.push(record);
      });
    });

    // Update KPI values
    document.getElementById('kpi-phones-fixed').textContent = phonesFixedCount.toLocaleString();
    document.getElementById('kpi-emails-fixed').textContent = emailsFixedCount.toLocaleString();
    document.getElementById('kpi-auth-fixed').textContent = authFixedCount.toLocaleString();
    document.getElementById('kpi-roles-fixed').textContent = rolesFixedCount.toLocaleString();

    this.renderCleanseTable();
  }

  renderCleanseTable() {
    const tbody = document.getElementById('cleanse-table-body');
    tbody.innerHTML = '';

    const query = (document.getElementById('cleanse-search').value || '').trim().toLowerCase();
    const filter = document.getElementById('cleanse-filter').value;

    let filtered = this.cleansedRecords.filter(r => {
      if (query) {
        const text = `${r.full_name} ${r.authority_name_standard} ${r.role_standard} ${r.phone_mobile} ${r.email}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      if (filter === 'FIXED_PHONE') return r.phone_mobile && r.phone_mobile !== r.phone_mobile_raw;
      if (filter === 'FIXED_EMAIL') return r.email && r.email_valid;
      if (filter === 'UNRECOGNIZED_ROLE') return r.role_standard === 'תפקיד לא מזוהה';
      if (filter === 'MISSING_CONTACT') return !r.phone_mobile && !r.email;

      return true;
    });

    // Display first 100 rows for performance
    filtered.slice(0, 100).forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 0.8rem;">${r._raw_row_id}</td>
        <td><strong>${r.full_name || '<span style="color:red">חסר</span>'}</strong></td>
        <td>${r.authority_name_standard || '<span style="color:var(--text-light)">לא מוגדר</span>'}</td>
        <td>${r.district || '-'}</td>
        <td>${r.role_standard}</td>
        <td style="font-family: var(--font-mono);">${r.phone_mobile ? (r.phone_mobile_valid ? `<span style="color: var(--success-dark); font-weight:700;">${r.phone_mobile}</span>` : `<span style="color: var(--danger);">${r.phone_mobile}</span>`) : '-'}</td>
        <td style="font-family: var(--font-mono); font-size: 0.85rem;">${r.email || '-'}</td>
        <td>
          <span class="badge ${r.phone_mobile_valid && r.email_valid ? 'badge-success' : 'badge-warning'}">
            ${r.phone_mobile_valid && r.email_valid ? 'תקין' : 'חלקי'}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  /**
   * Pipeline Step 4: Record Linkage / Matching
   */
  executeMatching() {
    const result = this.matcher.clusterRecords(this.cleansedRecords);
    this.clusters = result.clusters;
    this.matchPairs = result.matchPairs;

    let highCount = 0;
    let medCount = 0;
    let singleCount = 0;

    this.clusters.forEach(c => {
      if (c.memberCount === 1) singleCount++;
      else if (c.highestTier === 'HIGH') highCount++;
      else medCount++;
    });

    document.getElementById('kpi-unique-people').textContent = this.clusters.length.toLocaleString();
    document.getElementById('kpi-high-matches').textContent = highCount.toLocaleString();
    document.getElementById('kpi-med-matches').textContent = medCount.toLocaleString();
    document.getElementById('kpi-single-matches').textContent = singleCount.toLocaleString();

    this.renderMatchingTable();
    this.prepareConflictsTab();
  }

  renderMatchingTable() {
    const tbody = document.getElementById('matching-table-body');
    tbody.innerHTML = '';

    const query = (document.getElementById('match-search').value || '').trim().toLowerCase();
    const filter = document.getElementById('match-filter').value;

    let filtered = this.clusters.filter(c => {
      const primary = c.members[0];
      if (query) {
        const text = `${primary.full_name} ${primary.authority_name_standard} ${primary.role_standard} ${primary.phone_mobile} ${primary.email}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      if (filter === 'MULTI') return c.memberCount > 1;
      if (filter === 'HIGH') return c.highestTier === 'HIGH';
      if (filter === 'MEDIUM') return c.highestTier === 'MEDIUM';
      if (filter === 'CONFLICTS') return c.hasConflicts;

      return true;
    });

    filtered.slice(0, 100).forEach(c => {
      const primary = c.members[0];
      const sources = Array.from(new Set(c.members.map(m => m._source_name || m._source_id))).join(', ');
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-size: 0.8rem;">${c.clusterId}</td>
        <td><strong>${primary.full_name}</strong></td>
        <td>${primary.authority_name_standard || primary.authority || '-'}</td>
        <td>${sources}</td>
        <td><span class="badge ${c.memberCount > 1 ? 'badge-info' : 'badge-warning'}">${c.memberCount} רשומות</span></td>
        <td><strong>${c.avgScore}</strong></td>
        <td>
          <span class="badge ${c.highestTier === 'HIGH' ? 'badge-success' : c.highestTier === 'MEDIUM' ? 'badge-warning' : 'badge-info'}">
            ${c.highestTier === 'HIGH' ? 'ודאי (90-100)' : c.highestTier === 'MEDIUM' ? 'לבדיקה (65-89)' : 'בודד'}
          </span>
        </td>
        <td>${c.hasConflicts ? '<span class="badge badge-danger">אותרו סתירות</span>' : '<span style="color:var(--text-muted);">אין</span>'}</td>
        <td style="font-size: 0.8rem; color: var(--text-muted); max-width: 250px;">
          ${c.matchEvidence.length > 0 ? c.matchEvidence.map(e => e.reasons.join(', ')).join(' | ') : 'רשומה ייחודית במקור בודד'}
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  /**
   * Pipeline Step 5: Conflict Resolution Preparation
   */
  prepareConflictsTab() {
    const container = document.getElementById('conflicts-container');
    container.innerHTML = '';
    this.conflictsList = [];

    this.clusters.forEach(cluster => {
      if (cluster.memberCount > 1) {
        const { hasConflicts, conflicts } = this.resolver.detectConflicts(cluster);
        if (hasConflicts) {
          cluster.hasConflicts = true;
          conflicts.forEach(c => this.conflictsList.push(c));
          this._renderConflictCard(cluster, conflicts, container);
        }
      }
    });

    const badge = document.getElementById('badge-conflicts');
    if (this.conflictsList.length > 0) {
      badge.textContent = this.conflictsList.length;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 3rem;">
          <div style="font-size: 2.5rem; color: var(--success); margin-bottom: 0.5rem;">✓</div>
          <h3 style="font-size: 1.3rem;">לא אותרו סתירות פתוחות!</h3>
          <p style="color: var(--text-muted); margin-top: 0.25rem;">כל ההתאמות בין המקורות חופפות ותקינות. ניתן להמשיך להפקת Master Preview.</p>
        </div>
      `;
    }
  }

  _renderConflictCard(cluster, conflicts, container) {
    const primary = cluster.members[0];
    const card = document.createElement('div');
    card.className = 'conflict-card';

    let conflictsHtml = '';
    conflicts.forEach(c => {
      let optionsHtml = '';
      c.distinctValues.forEach(opt => {
        const isRecommended = opt.value === c.recommendedValue;
        optionsHtml += `
          <div class="conflict-option-btn ${isRecommended ? 'selected' : ''}" 
               id="opt-${c.clusterId}-${c.field}-${opt.value}" 
               onclick="app.selectConflictOption('${c.clusterId}', '${c.field}', '${opt.value}')">
            <div class="option-source">${opt.sources.join(', ')} ${isRecommended ? '★ (מומלץ)' : ''}</div>
            <div class="option-val">${opt.value}</div>
          </div>
        `;
      });

      conflictsHtml += `
        <div style="margin-top: 0.5rem;">
          <div class="conflict-field-name">${c.fieldLabel}</div>
          <div class="conflict-options" style="margin-top: 0.4rem;">
            ${optionsHtml}
          </div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="conflict-header">
        <div class="conflict-person-name">${primary.full_name} (${cluster.clusterId})</div>
        <span class="badge badge-warning">${conflicts.length} שדות בסתירה</span>
      </div>
      ${conflictsHtml}
    `;

    container.appendChild(card);
  }

  selectConflictOption(clusterId, field, value) {
    this.userOverrides[`${clusterId}_${field}`] = value;
    // Update visual selection
    document.querySelectorAll(`[id^="opt-${clusterId}-${field}"]`).forEach(el => el.classList.remove('selected'));
    const target = document.getElementById(`opt-${clusterId}-${field}-${value}`);
    if (target) target.classList.add('selected');
  }

  /**
   * Pipeline Step 6: Final Merge into Master Records
   */
  executeFinalMerge() {
    this.masterRecords = [];

    this.clusters.forEach((cluster, idx) => {
      const master = this.merger.mergeCluster(cluster, idx + 1, this.userOverrides, this.qualityEngine);
      this.masterRecords.push(master);
    });

    this.metrics = this.qualityEngine.generateDashboardMetrics(
      this.masterRecords,
      this.sources,
      this.matchPairs,
      this.conflictsList,
      this.logger
    );

    // Update Header Score & Executive Dashboard KPIs
    document.getElementById('header-health-val').textContent = `${this.metrics.averageHealthScore}%`;
    document.getElementById('kpi-master-total').textContent = this.masterRecords.length.toLocaleString();
    document.getElementById('kpi-master-complete').textContent = this.metrics.qualityDistribution.full.toLocaleString();
    document.getElementById('kpi-master-review').textContent = this.metrics.matchingStats.reviewRequiredCount.toLocaleString();
    document.getElementById('kpi-master-score').textContent = `${this.metrics.averageHealthScore}%`;

    this.renderMasterTable();
  }

  renderMasterTable() {
    const tbody = document.getElementById('master-table-body');
    tbody.innerHTML = '';

    const query = (document.getElementById('master-search').value || '').trim().toLowerCase();
    const filter = document.getElementById('master-status-filter').value;

    let filtered = this.masterRecords.filter(m => {
      if (query) {
        const text = `${m.master_id} ${m.full_name} ${m.authority_name_standard} ${m.district} ${m.role_standard} ${m.phone_mobile} ${m.email}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      if (filter === 'REVIEW_ONLY') return m.requires_review;
      if (filter !== 'ALL') return m.quality_status === filter;

      return true;
    });

    filtered.slice(0, 100).forEach(m => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); font-weight:700; color: var(--primary);">${m.master_id}</td>
        <td><strong>${m.full_name}</strong></td>
        <td>${m.authority_name_standard || '<span style="color:var(--text-light)">-</span>'}</td>
        <td>${m.district || '-'}</td>
        <td>${m.role_standard}</td>
        <td style="font-family: var(--font-mono);">${m.phone_mobile || '-'}</td>
        <td style="font-family: var(--font-mono); font-size: 0.85rem;">${m.email || '-'}</td>
        <td><span class="badge badge-info">${m.source_count} מקורות</span></td>
        <td><strong>${m.data_quality_score}%</strong></td>
        <td>
          <span class="badge ${m.quality_status === 'מלאה' ? 'badge-success' : m.quality_status === 'כמעט מלאה' ? 'badge-info' : 'badge-warning'}">
            ${m.quality_status}
          </span>
        </td>
        <td>${m.requires_review ? '<span class="badge badge-danger">כן</span>' : '<span style="color:var(--text-muted);">לא</span>'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  /**
   * Export Handlers (Tab 7)
   */
  exportMasterExcel() {
    const rows = this.exporter.prepareMasterExportRows(this.masterRecords);
    this.exporter.downloadExcel(rows, `MASTER_FINAL_${this.runId}.xlsx`, 'Master');
  }

  exportMasterCsv() {
    const rows = this.exporter.prepareMasterExportRows(this.masterRecords);
    this.exporter.downloadCsv(rows, `MASTER_FINAL_${this.runId}.csv`);
  }

  exportReviewExcel() {
    const rows = this.exporter.prepareReviewExportRows(this.masterRecords);
    this.exporter.downloadExcel(rows, `REVIEW_REQUIRED_${this.runId}.xlsx`, 'ReviewRequired');
  }

  exportDuplicatesExcel() {
    const rows = this.exporter.prepareMatchedDuplicatesRows(this.matchPairs, this.clusters);
    this.exporter.downloadExcel(rows, `MATCHED_DUPLICATES_${this.runId}.xlsx`, 'MatchedDuplicates');
  }

  exportAuditExcel() {
    const rows = this.logger.toExportRows();
    this.exporter.downloadExcel(rows, `AUDIT_LOG_${this.runId}.xlsx`, 'AuditTrail');
  }
}

// Instantiate global app controller
const app = new AppController();
window.addEventListener('DOMContentLoaded', () => app.init());
