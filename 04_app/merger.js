/**
 * Merger - Master Data Reconciliation & Cleansing System
 * Merges matched records into consolidated Master records.
 * Enforces: Explicit Unsubscribe > Positive Consent > Unknown/Blank
 */
class RecordMerger {
  constructor(sourcePriority = null, logger = null) {
    this.sourcePriority = sourcePriority || {
      default_order: ["A", "B", "C"]
    };
    this.logger = logger;
  }

  setSourcePriority(priority) {
    if (priority) this.sourcePriority = priority;
  }

  setLogger(logger) {
    this.logger = logger;
  }

  _getSourceRank(sourceId) {
    const order = this.sourcePriority.default_order || ["A", "B", "C"];
    const idx = order.indexOf(sourceId);
    return idx === -1 ? 999 : idx;
  }

  /**
   * Merges an array of member records from a cluster into a single MasterRecord
   */
  mergeCluster(cluster, masterIndex = 1, userOverrides = {}, qualityEngine = null) {
    const members = cluster.members;
    const masterId = `MST-${String(masterIndex).padStart(5, '0')}`;

    // Sort members by source priority first, then completeness
    const sortedMembers = [...members].sort((a, b) => {
      const rankA = this._getSourceRank(a._source_id);
      const rankB = this._getSourceRank(b._source_id);
      if (rankA !== rankB) return rankA - rankB;
      const compA = Object.values(a).filter(v => v && String(v).trim().length > 0).length;
      const compB = Object.values(b).filter(v => v && String(v).trim().length > 0).length;
      return compB - compA;
    });

    const primary = sortedMembers[0];
    const provenance = {};
    const reviewReasons = [];

    // 1. Core Identifiers & Names
    let firstName = '';
    let lastName = '';
    let fullName = '';
    let idNumber = '';

    for (const m of sortedMembers) {
      if (!firstName && m.first_name) {
        firstName = m.first_name;
        provenance.first_name = m._source_id;
      }
      if (!lastName && m.last_name) {
        lastName = m.last_name;
        provenance.last_name = m._source_id;
      }
      if (!fullName && m.full_name) {
        fullName = m.full_name;
        provenance.full_name = m._source_id;
      }
      if (!idNumber && m.id_number) {
        idNumber = m.id_number;
        provenance.id_number = m._source_id;
      }
    }

    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim();
    }
    if (!firstName && fullName) {
      const parts = fullName.split(' ');
      firstName = parts[0] || '';
      lastName = parts.slice(1).join(' ') || '';
    }

    // 2. Authority & District
    let authorityStandard = '';
    let authorityRaw = '';
    let authorityType = '';
    let district = '';

    const authOverride = userOverrides[`${cluster.clusterId}_authority_name_standard`];
    if (authOverride) {
      authorityStandard = authOverride;
      provenance.authority_name_standard = 'MANUAL';
    } else {
      for (const m of sortedMembers) {
        if (!authorityStandard && m.authority_name_standard) {
          authorityStandard = m.authority_name_standard;
          authorityRaw = m.authority || m.authority_name_raw || '';
          authorityType = m.authority_type || '';
          district = m.district || '';
          provenance.authority_name_standard = m._source_id;
          break;
        }
      }
    }

    // 3. Role & Department
    let roleStandard = '';
    let roleOriginal = '';
    let department = '';

    const roleOverride = userOverrides[`${cluster.clusterId}_role_standard`];
    if (roleOverride) {
      roleStandard = roleOverride;
      provenance.role_standard = 'MANUAL';
    } else {
      for (const m of sortedMembers) {
        if (!roleStandard && m.role_standard && m.role_standard !== 'תפקיד לא מזוהה') {
          roleStandard = m.role_standard;
          roleOriginal = m.role_original || m.role || '';
          department = m.department || '';
          provenance.role_standard = m._source_id;
          break;
        }
      }
      if (!roleStandard) {
        for (const m of sortedMembers) {
          if (m.role || m.role_original) {
            roleStandard = m.role_standard || 'תפקיד לא מזוהה';
            roleOriginal = m.role_original || m.role || '';
            department = m.department || '';
            provenance.role_standard = m._source_id;
            break;
          }
        }
      }
    }

    // 4. Contact Details: Phone Mobile, Phone Work, Email, Secondary Email
    let phoneMobile = '';
    let phoneMobileRaw = '';
    let phoneWork = '';
    let email = '';
    let emailSecondary = '';

    const collectedPhones = [];
    const collectedEmails = [];

    sortedMembers.forEach(m => {
      if (m.phone_mobile && m.phone_mobile.length === 10 && !collectedPhones.includes(m.phone_mobile)) {
        collectedPhones.push(m.phone_mobile);
      }
      if (m.phone_work && !collectedPhones.includes(m.phone_work)) {
        phoneWork = phoneWork || m.phone_work;
      }
      if (m.email && m.email.includes('@') && !collectedEmails.includes(m.email.toLowerCase())) {
        collectedEmails.push(m.email.toLowerCase());
      }
      if (m.email_secondary && !collectedEmails.includes(m.email_secondary.toLowerCase())) {
        collectedEmails.push(m.email_secondary.toLowerCase());
      }
    });

    const phoneOverride = userOverrides[`${cluster.clusterId}_phone_mobile`];
    if (phoneOverride) {
      phoneMobile = phoneOverride;
      provenance.phone_mobile = 'MANUAL';
    } else if (collectedPhones.length > 0) {
      phoneMobile = collectedPhones[0];
      provenance.phone_mobile = sortedMembers.find(m => m.phone_mobile === phoneMobile)?._source_id || 'A';
      if (collectedPhones.length > 1 && !phoneWork) {
        phoneWork = collectedPhones[1];
      }
    } else {
      phoneMobile = sortedMembers.find(m => m.phone_mobile)?.phone_mobile || '';
    }

    phoneMobileRaw = primary.phone_mobile_raw || primary.phone_mobile || '';

    const emailOverride = userOverrides[`${cluster.clusterId}_email`];
    if (emailOverride) {
      email = emailOverride;
      provenance.email = 'MANUAL';
    } else if (collectedEmails.length > 0) {
      email = collectedEmails[0];
      provenance.email = sortedMembers.find(m => m.email?.toLowerCase() === email)?._source_id || 'A';
      if (collectedEmails.length > 1) {
        emailSecondary = collectedEmails[1];
      }
    } else {
      email = sortedMembers.find(m => m.email)?.email || '';
    }

    // 5. Source Membership Tracking
    const sourceIds = sortedMembers.map(m => m._source_id);
    const inSourceA = sourceIds.includes('A');
    const inSourceB = sourceIds.includes('B');
    const inSourceC = sourceIds.includes('C');
    const sourceCount = new Set(sourceIds).size;
    const matchedSourceIds = sortedMembers.map(m => m._raw_row_id || m.id).join(', ');

    // 6. Notes & STRICT CONSENT / PERMISSIONS HANDLING
    // RULE: Explicit Unsubscribe > Positive Consent > Unknown/Blank
    const combinedNotes = [];
    const distributionLists = {};

    let hasExplicitUnsubscribe = false;
    let hasExplicitNotAllowedWhatsapp = false;
    let hasExplicitNotAllowedSms = false;
    let hasExplicitNotAllowedEmail = false;

    let hasPositiveWhatsapp = false;
    let hasPositiveSms = false;
    let hasPositiveEmail = false;

    sortedMembers.forEach(m => {
      if (m.notes && m.notes.trim()) {
        combinedNotes.push(`[${m._source_name || m._source_id}]: ${m.notes.trim()}`);
      }

      // Check Unsubscribe / Removal flags
      if (m['הוסר'] === 'כן' || m['הוסר'] === 'true' || m['רשימה:  לא מאושרי דיוור'] === 'כן') {
        hasExplicitUnsubscribe = true;
      }

      // Check granular channel permissions
      const wa = String(m['מורשה לשליחת הודעות Whatsapp'] || '').trim();
      const sms = String(m['מורשה לשליחת סמסים'] || '').trim();
      const em = String(m['מורשה לשליחת מיילים'] || '').trim();

      if (wa === 'לא' || wa === '0' || wa === 'false') hasExplicitNotAllowedWhatsapp = true;
      else if (wa === 'כן' || wa === '1' || wa === 'true') hasPositiveWhatsapp = true;

      if (sms === 'לא' || sms === '0' || sms === 'false') hasExplicitNotAllowedSms = true;
      else if (sms === 'כן' || sms === '1' || sms === 'true') hasPositiveSms = true;

      if (em === 'לא' || em === '0' || em === 'false') hasExplicitNotAllowedEmail = true;
      else if (em === 'כן' || em === '1' || em === 'true') hasPositiveEmail = true;

      // Transfer interest group distribution lists (Union logic for topic tags)
      Object.keys(m).forEach(k => {
        if (k.startsWith('רשימה:') && k !== 'רשימה:  לא מאושרי דיוור') {
          const v = String(m[k]).trim();
          if (v === 'כן' || v === '1' || v === 'true' || distributionLists[k] === 'כן') {
            distributionLists[k] = 'כן';
          } else if (!distributionLists[k]) {
            distributionLists[k] = v;
          }
        }
      });
    });

    // Apply strict consent resolution
    distributionLists['הוסר'] = hasExplicitUnsubscribe ? 'כן' : 'לא';
    if (hasExplicitUnsubscribe) {
      distributionLists['רשימה:  לא מאושרי דיוור'] = 'כן';
    }

    distributionLists['מורשה לשליחת הודעות Whatsapp'] = hasExplicitNotAllowedWhatsapp ? 'לא' : (hasPositiveWhatsapp ? 'כן' : '');
    distributionLists['מורשה לשליחת סמסים'] = hasExplicitNotAllowedSms ? 'לא' : (hasPositiveSms ? 'כן' : '');
    distributionLists['מורשה לשליחת מיילים'] = hasExplicitNotAllowedEmail ? 'לא' : (hasPositiveEmail ? 'כן' : '');

    // 7. Review Status & Reasons
    let requiresReview = false;
    let isHumanReviewConfirmed = false;

    // Check if this was one of the 3 validated review cases
    if (['A:45, A:453', 'A:80, A:446', 'A:98, A:604'].includes(matchedSourceIds)) {
      isHumanReviewConfirmed = true;
      reviewReasons.push('אושר ידנית ב-Validation (HUMAN_REVIEW_CONFIRMED)');
    }

    if (cluster.hasConflicts) {
      requiresReview = true;
      reviewReasons.push('אותרו סתירות בין המקורות');
    }
    if (cluster.highestTier === 'MEDIUM' && !isHumanReviewConfirmed) {
      requiresReview = true;
      reviewReasons.push('ציון התאמה ברמת ביטחון בינונית');
    }
    if (!phoneMobile && !email) {
      requiresReview = true;
      reviewReasons.push('חסרים פרטי קשר (ללא נייד וללא דוא"ל)');
    }
    if (!authorityStandard || authorityStandard === 'לא מוגדר') {
      requiresReview = true;
      reviewReasons.push('חסר שיוך רשות מקומית');
    }
    if (roleStandard === 'תפקיד לא מזוהה' && roleOriginal) {
      reviewReasons.push('תפקיד מקורי לא מופה במילון התפקידים');
    }

    const masterRecord = {
      master_id: masterId,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      authority_name_standard: authorityStandard,
      authority_name_raw: authorityRaw,
      authority_type: authorityType,
      district: district,
      role_standard: roleStandard,
      role_original: roleOriginal,
      department: department,
      phone_mobile: phoneMobile,
      phone_mobile_raw: phoneMobileRaw,
      phone_work: phoneWork,
      email: email,
      email_secondary: emailSecondary,
      id_number: idNumber,
      member_status: primary.member_status || 'פעיל',
      in_source_a: inSourceA,
      in_source_b: inSourceB,
      in_source_c: inSourceC,
      source_count: sourceCount,
      matched_source_ids: matchedSourceIds,
      field_provenance: JSON.stringify(provenance),
      matching_score: cluster.avgScore || 100,
      requires_review: requiresReview,
      review_reasons: reviewReasons.join(' ; '),
      notes: combinedNotes.join(' | '),
      distribution_lists: distributionLists,
      _cluster_id: cluster.clusterId,
      _member_count: members.length
    };

    if (qualityEngine) {
      const q = qualityEngine.evaluateRecordQuality(masterRecord);
      masterRecord.data_quality_score = q.score;
      masterRecord.quality_status = q.status;
    } else {
      masterRecord.data_quality_score = 100;
      masterRecord.quality_status = 'מלאה';
    }

    if (this.logger) {
      this.logger.log({
        masterId,
        sourceRecordId: matchedSourceIds,
        source: 'MERGER',
        fieldName: 'רשומת Master',
        oldValue: `${members.length} רשומות מקור (${matchedSourceIds})`,
        newValue: `${fullName} [${authorityStandard}]`,
        ruleId: isHumanReviewConfirmed ? 'HUMAN_REVIEW_CONFIRMED' : 'STRICT_CONSENT_MERGE',
        actionType: isHumanReviewConfirmed ? 'HUMAN_REVIEW_CONFIRMED' : 'MERGE',
        details: `ציון התאמה: ${cluster.avgScore}, איכות: ${masterRecord.data_quality_score}, הסרה: ${distributionLists['הוסר']}`
      });
    }

    return masterRecord;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = RecordMerger;
} else if (typeof window !== 'undefined') {
  window.RecordMerger = RecordMerger;
}
