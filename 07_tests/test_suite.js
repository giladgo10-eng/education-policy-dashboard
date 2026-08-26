/**
 * TestSuite - Master Data Reconciliation & Cleansing System
 * Automated test suite covering all modules, assertions, edge cases and fixtures.
 */
class TestSuite {
  constructor() {
    this.results = [];
    this.passedCount = 0;
    this.failedCount = 0;
  }

  assert(testName, condition, actualValue = null, expectedValue = null) {
    if (condition) {
      this.passedCount++;
      this.results.push({ name: testName, status: 'PASS', actual: actualValue, expected: expectedValue });
      console.log(`%c[PASS] ${testName}`, 'color: green');
    } else {
      this.failedCount++;
      this.results.push({ name: testName, status: 'FAIL', actual: actualValue, expected: expectedValue });
      console.error(`[FAIL] ${testName} | Expected: ${JSON.stringify(expectedValue)}, Got: ${JSON.stringify(actualValue)}`);
    }
  }

  async runAllTests(dictionaries, fixtures) {
    this.results = [];
    this.passedCount = 0;
    this.failedCount = 0;

    const logger = new AuditLogger('TEST_RUN');
    const cleaner = new Cleaner(dictionaries.cleansing_rules, logger);
    const normalizer = new Normalizer(dictionaries.authorities, dictionaries.roles, logger);
    const matcher = new RecordMatcher(dictionaries.matching_rules);
    const resolver = new ConflictResolver(dictionaries.source_priority, logger);
    const merger = new RecordMerger(dictionaries.source_priority, logger);
    const qualityEngine = new QualityEngine(dictionaries.quality_score_rules);

    console.log('--- STARTING AUTOMATED TEST SUITE ---');

    // 1. CLEANER TESTS
    // 1.1 Phone Cleaning
    const phoneRes1 = cleaner.cleanMobilePhone('547728415');
    this.assert('Cleaner: Restores leading zero for 9-digit mobile (547728415 -> 0547728415)', phoneRes1.isValid && phoneRes1.cleaned === '0547728415', phoneRes1.cleaned, '0547728415');

    const phoneRes2 = cleaner.cleanMobilePhone('052-756 9230');
    this.assert('Cleaner: Removes dashes and spaces from mobile (052-756 9230 -> 0527569230)', phoneRes2.isValid && phoneRes2.cleaned === '0527569230', phoneRes2.cleaned, '0527569230');

    const phoneRes3 = cleaner.cleanMobilePhone('+972502040865');
    this.assert('Cleaner: Converts +972 to 0 ( +972502040865 -> 0502040865 )', phoneRes3.isValid && phoneRes3.cleaned === '0502040865', phoneRes3.cleaned, '0502040865');

    const phoneRes4 = cleaner.cleanMobilePhone('12345');
    this.assert('Cleaner: Marks invalid short phone as invalid', !phoneRes4.isValid && phoneRes4.error !== null, phoneRes4.isValid, false);

    // 1.2 Landline Cleaning
    const landlineRes1 = cleaner.cleanWorkPhone('49568865');
    this.assert('Cleaner: Restores leading zero for 8-digit landline (49568865 -> 04-9568865)', landlineRes1.isValid && landlineRes1.cleaned === '04-9568865', landlineRes1.cleaned, '04-9568865');

    // 1.3 Email Cleaning
    const emailRes1 = cleaner.cleanEmail('  User.Name@Domain.COM  ');
    this.assert('Cleaner: Lowercases and trims email', emailRes1.isValid && emailRes1.cleaned === 'user.name@domain.com', emailRes1.cleaned, 'user.name@domain.com');

    const emailRes2 = cleaner.cleanEmail('test@gmai.com');
    this.assert('Cleaner: Fixes known typo @gmai.com -> @gmail.com', emailRes2.isValid && emailRes2.cleaned === 'test@gmail.com', emailRes2.cleaned, 'test@gmail.com');

    const emailRes3 = cleaner.cleanEmail('invalid-email-no-at');
    this.assert('Cleaner: Flags email without @ as invalid', !emailRes3.isValid, emailRes3.isValid, false);

    // 1.4 Text & Mojibake Cleaning
    const textRes1 = cleaner.cleanText('משנה למנכ`ל וראש מנהל שח`ק');
    this.assert('Cleaner: Converts backticks to quotes', textRes1 === 'משנה למנכ"ל וראש מנהל שח"ק', textRes1, 'משנה למנכ"ל וראש מנהל שח"ק');

    const textRes2 = cleaner.cleanText('יוסי כהן');
    this.assert('Cleaner: Removes mojibake corrupted characters', textRes2 === 'יוסי כהן', textRes2, 'יוסי כהן');

    // 2. NORMALIZER TESTS
    // 2.1 Authorities
    const authRes1 = normalizer.normalizeAuthority('ת"א');
    this.assert('Normalizer: Maps "ת\"א" -> "תל אביב-יפו" (מחוז תל אביב)', authRes1.standardName === 'תל אביב-יפו' && authRes1.district === 'תל אביב', authRes1.standardName, 'תל אביב-יפו');

    const authRes2 = normalizer.normalizeAuthority('מוא"ז אלבטוף');
    this.assert('Normalizer: Maps "מוא\"ז אלבטוף" -> "אל בטוף" (מועצה אזורית)', authRes2.standardName === 'אל בטוף' && authRes2.type === 'מועצה אזורית', authRes2.standardName, 'אל בטוף');

    // 2.2 Roles
    const roleRes1 = normalizer.normalizeRole('מנהלת מח\' חינוך');
    this.assert('Normalizer: Maps "מנהלת מח\' חינוך" -> "מנהל/ת מחלקת חינוך"', roleRes1.standardRole === 'מנהל/ת מחלקת חינוך', roleRes1.standardRole, 'מנהל/ת מחלקת חינוך');

    const roleRes2 = normalizer.normalizeRole('מנהלת מדור גני ילדים');
    this.assert('Normalizer: Maps "מנהלת מדור גני ילדים" -> "מנהל/ת מחלקת גני ילדים / גיל רך"', roleRes2.standardRole === 'מנהל/ת מחלקת גני ילדים / גיל רך', roleRes2.standardRole, 'מנהל/ת מחלקת גני ילדים / גיל רך');

    // 3. MATCHER & RECORD LINKAGE TESTS (From Fixtures)
    const case1 = fixtures.test_cases.find(c => c.id === 'CASE_1_TRIPLICATE_SAME_PERSON');
    const normCase1 = case1.records.map((r, i) => {
      const p = cleaner.cleanMobilePhone(r.phone_mobile, r._raw_row_id, r._source_id);
      const e = cleaner.cleanEmail(r.email, r._raw_row_id, r._source_id);
      const a = normalizer.normalizeAuthority(r.authority, r._raw_row_id, r._source_id);
      const ro = normalizer.normalizeRole(r.role, r._raw_row_id, r._source_id);
      return {
        ...r,
        phone_mobile: p.cleaned,
        email: e.cleaned,
        authority_name_standard: a.standardName,
        authority_type: a.type,
        district: a.district,
        role_standard: ro.standardRole,
        department: ro.department
      };
    });

    const clusterRes1 = matcher.clusterRecords(normCase1);
    this.assert('Matcher: Triplicate record of same person clusters into 1 Master entity', clusterRes1.uniqueEntities === 1 && clusterRes1.clusters[0].memberCount === 3, clusterRes1.clusters[0].memberCount, 3);

    // 3.2 Negative Match Test (Different cities, same common name)
    const case2 = fixtures.test_cases.find(c => c.id === 'CASE_2_SAME_NAME_DIFFERENT_CITIES');
    const normCase2 = case2.records.map(r => {
      const p = cleaner.cleanMobilePhone(r.phone_mobile);
      const e = cleaner.cleanEmail(r.email);
      const a = normalizer.normalizeAuthority(r.authority);
      const ro = normalizer.normalizeRole(r.role);
      return {
        ...r,
        phone_mobile: p.cleaned,
        email: e.cleaned,
        authority_name_standard: a.standardName,
        role_standard: ro.standardRole
      };
    });
    const pairComp2 = matcher.comparePair(normCase2[0], normCase2[1]);
    this.assert('Matcher Safety Guard: "יוסי כהן" in different cities with different phones does NOT match', pairComp2.score < 65 && !pairComp2.isMatch, pairComp2.score, '< 65');

    // 4. CONFLICT RESOLVER TESTS
    const case3 = fixtures.test_cases.find(c => c.id === 'CASE_3_CONFLICTING_AUTHORITY_SAME_PHONE');
    const normCase3 = case3.records.map(r => {
      const p = cleaner.cleanMobilePhone(r.phone_mobile);
      const e = cleaner.cleanEmail(r.email);
      const a = normalizer.normalizeAuthority(r.authority);
      const ro = normalizer.normalizeRole(r.role);
      return {
        ...r,
        phone_mobile: p.cleaned,
        email: e.cleaned,
        authority_name_standard: a.standardName,
        role_standard: ro.standardRole
      };
    });
    const cluster3 = {
      clusterId: 'TEST_CLUST_3',
      members: normCase3,
      avgScore: 75,
      highestTier: 'MEDIUM'
    };
    const conflictRes = resolver.detectConflicts(cluster3);
    this.assert('Conflict Resolver: Accurately identifies conflicting authority (הרצליה vs רעננה)', conflictRes.hasConflicts && conflictRes.conflicts.some(c => c.field === 'authority_name_standard'), conflictRes.conflicts.length, 1);

    // 5. MERGER TESTS
    const mergedMaster1 = merger.mergeCluster(clusterRes1.clusters[0], 1, {}, qualityEngine);
    this.assert('Merger: Master record full name is preserved', mergedMaster1.full_name === 'אבי כהן', mergedMaster1.full_name, 'אבי כהן');
    this.assert('Merger: Master record authority is standardized to "תל אביב-יפו"', mergedMaster1.authority_name_standard === 'תל אביב-יפו', mergedMaster1.authority_name_standard, 'תל אביב-יפו');
    this.assert('Merger: Unions distribution lists (גני ילדים = כן, חינוך יסודי = כן)', mergedMaster1.distribution_lists['רשימה:  גני ילדים'] === 'כן' && mergedMaster1.distribution_lists['רשימה:  חינוך יסודי'] === 'כן', true, true);
    this.assert('Merger: Null never overwrites value (preserved work phone from source B)', mergedMaster1.phone_work === '03-5218888', mergedMaster1.phone_work, '03-5218888');

    // 6. QUALITY ENGINE TESTS
    const q1 = qualityEngine.evaluateRecordQuality(mergedMaster1);
    this.assert('Quality Engine: Complete Master record achieves 100% Quality Score', q1.score === 100 && q1.status === 'מלאה', q1.score, 100);

    console.log(`--- TEST SUITE COMPLETE: ${this.passedCount} PASSED, ${this.failedCount} FAILED ---`);

    return {
      passed: this.passedCount,
      failed: this.failedCount,
      total: this.passedCount + this.failedCount,
      isSuccess: this.failedCount === 0,
      results: this.results
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestSuite;
} else if (typeof window !== 'undefined') {
  window.TestSuite = TestSuite;
}
