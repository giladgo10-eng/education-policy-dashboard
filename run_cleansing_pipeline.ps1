# ==============================================================================
# Master Data Reconciliation & Cleansing Engine - Automated Pipeline
# איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות
# ==============================================================================

param(
    [string]$SourceA_Path = '01_source_files/רשימת כל חברים מהסמוב 18-8-2026.csv',
    [string]$SourceB_Path = '',
    [string]$SourceC_Path = '',
    [string]$RunId = 'RUN_2026_08_18_REVALIDATION_01'
)

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$baseDir = 'c:\Users\giladgo\Documents\AAAגלעד כללי\איגוד תשפו 2025-2026\מערכת טיוב רשימות איגוד'
Set-Location $baseDir

if ([string]::IsNullOrWhiteSpace($RunId)) {
    $RunId = 'RUN_' + (Get-Date -Format 'yyyy_MM_dd_HHmmss')
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  מערכת טיוב, התאמה והאחדת רשימות - Master Reconciliation Engine" -ForegroundColor Cyan
Write-Host "  קוד הרצה: $RunId" -ForegroundColor Yellow
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Load Dictionaries
Write-Host "`n[שלב 1/6] טעינת מילוני מונחים וחוקי טיוב..." -ForegroundColor Green
$authJson = Get-Content '03_dictionaries\dictionary_authorities.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$rolesJson = Get-Content '03_dictionaries\dictionary_roles.json' -Raw -Encoding UTF8 | ConvertFrom-Json

# Build lookup hashtables
$authLookup = @{}
foreach ($a in $authJson.authorities) {
    $key = $a.standard_name.Trim().Replace('"', '').Replace("'", '').Replace('-', '')
    $authLookup[$key] = $a
    foreach ($al in $a.aliases) {
        $alKey = $al.Trim().Replace('"', '').Replace("'", '').Replace('-', '')
        $authLookup[$alKey] = $a
    }
}

$roleLookup = @{}
foreach ($c in $rolesJson.clusters) {
    $key = $c.standard_role.Trim()
    $roleLookup[$key] = $c
    foreach ($al in $c.aliases) {
        $roleLookup[$al.Trim()] = $c
    }
}

# 2. Snapshot Creation
Write-Host "`n[שלב 2/6] יצירת Snapshot בלתי משתנה לקובצי המקור..." -ForegroundColor Green
$snapshotDir = Join-Path $baseDir "02_snapshots\$RunId"
if (-not (Test-Path $snapshotDir)) { New-Item -ItemType Directory -Path $snapshotDir -Force | Out-Null }

$fullSrcA = Join-Path $baseDir $SourceA_Path
if (Test-Path $fullSrcA) {
    Copy-Item $fullSrcA (Join-Path $snapshotDir "source_A_raw.csv") -Force
    Write-Host "  ✓ נשמר Snapshot של מקור A: $SourceA_Path" -ForegroundColor Gray
}

# 3. Ingestion & Duplicate Column Handling
Write-Host "`n[שלב 3/6] קריאה ופענוח קובצי מקור..." -ForegroundColor Green
$lines = [System.IO.File]::ReadAllLines($fullSrcA, [System.Text.Encoding]::UTF8)
$rawHeaders = $lines[0] -split ','

$headerCounts = @{}
$uniqueHeaders = @()
foreach ($h in $rawHeaders) {
    $hClean = $h.Trim().Trim('"').Trim("'")
    if ($headerCounts.ContainsKey($hClean)) {
        $headerCounts[$hClean]++
        $uniqueHeaders += ($hClean + '_' + $headerCounts[$hClean])
    } else {
        $headerCounts[$hClean] = 1
        $uniqueHeaders += $hClean
    }
}

Write-Host "  ✓ זוהו $($lines.Length - 1) שורות ו-$($uniqueHeaders.Length) עמודות." -ForegroundColor Gray

# 4. Cleansing, Normalization & Full Audit Logging
Write-Host "`n[שלב 4/6] ניקוי ונרמול נתונים עם תיעוד Audit מלא..." -ForegroundColor Green

$auditEntries = [System.Collections.Generic.List[PSObject]]::new()
$cleansedRows = [System.Collections.Generic.List[PSObject]]::new()

$phonesFixedCount = 0
$emailsFixedCount = 0
$authFixedCount = 0
$rolesFixedCount = 0

$backtickChar = [char]96

for ($i = 1; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $cols = [System.Text.RegularExpressions.Regex]::Split($line, ',(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)')
    $rowObj = [ordered]@{}
    for ($c = 0; $c -lt $uniqueHeaders.Length; $c++) {
        $val = if ($c -lt $cols.Length) { $cols[$c].Trim().Trim('"').Trim("'") } else { '' }
        $rowObj[$uniqueHeaders[$c]] = $val
    }

    $rawId = "A:$i"
    $rawName = if ($rowObj.Contains('שם מלא') -and $rowObj['שם מלא']) { $rowObj['שם מלא'] } else { ($rowObj['שם פרטי'] + ' ' + $rowObj['שם משפחה']).Trim() }
    $rawAuth = if ($rowObj.Contains('עיר') -and $rowObj['עיר']) { $rowObj['עיר'] } elseif ($rowObj.Contains('שם חברה')) { $rowObj['שם חברה'] } else { '' }
    $rawRole = if ($rowObj.Contains('תפקיד')) { $rowObj['תפקיד'] } else { '' }
    $rawMobile = if ($rowObj.Contains('טלפון נייד')) { $rowObj['טלפון נייד'] } else { '' }
    $rawWorkPhone = if ($rowObj.Contains('טלפון קווי')) { $rowObj['טלפון קווי'] } else { '' }
    $rawEmail = if ($rowObj.Contains('מייל')) { $rowObj['מייל'] } else { '' }
    $rawIdNum = if ($rowObj.Contains('תעודת זהות')) { $rowObj['תעודת זהות'] } else { '' }

    # Clean Name & Text
    $cleanName = $rawName.Replace('"', "'").Replace($backtickChar, "'").Replace([char]65533, ' ').Replace("`t", ' ').Trim()
    $cleanName = [System.Text.RegularExpressions.Regex]::Replace($cleanName, '\s+', ' ')

    # Clean Mobile Phone
    $mobileDigits = [System.Text.RegularExpressions.Regex]::Replace($rawMobile, '[^0-9]', '')
    if ($mobileDigits.Length -eq 9 -and $mobileDigits.StartsWith('5')) {
        $mobileDigits = '0' + $mobileDigits
        $phonesFixedCount++
        $auditEntries.Add([PSCustomObject]@{
            'מסד' = $auditEntries.Count + 1
            'קוד הרצה (run_id)' = $RunId
            'תאריך ושעה (timestamp)' = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
            'מזהה Master (master_id)' = 'N/A'
            'מזהה שורת מקור (source_record_id)' = $rawId
            'מקור (source)' = 'מקור A'
            'שם שדה (field_name)' = 'טלפון נייד'
            'ערך מקורי (original_value)' = $rawMobile
            'ערך חדש (new_value)' = $mobileDigits
            'מזהה חוק (rule_id)' = 'PHONE_LEADING_ZERO_RESTORATION'
            'סוג פעולה (action_type)' = 'AUTO'
            'פרטים נוספים' = 'הושלם ל-10 ספרות תקניות (05X)'
        })
    }
    $isMobileValid = ($mobileDigits.Length -eq 10 -and $mobileDigits -match '^05[0123458]')

    # Clean Work Phone
    $workDigits = [System.Text.RegularExpressions.Regex]::Replace($rawWorkPhone, '[^0-9]', '')
    if ($workDigits.Length -eq 8 -and $workDigits -match '^[23489]') {
        $workDigits = '0' + $workDigits
    }
    $workFormatted = if ($workDigits.Length -eq 9) { $workDigits.Substring(0,2) + '-' + $workDigits.Substring(2) } elseif ($workDigits.Length -eq 10) { $workDigits.Substring(0,3) + '-' + $workDigits.Substring(3) } else { $rawWorkPhone }

    # Clean Email
    $cleanEmail = $rawEmail.Trim().ToLower().Replace(' ', '')
    if ($cleanEmail.EndsWith('@gmai.com')) {
        $oldE = $cleanEmail
        $cleanEmail = $cleanEmail.Replace('@gmai.com', '@gmail.com')
        $emailsFixedCount++
        $auditEntries.Add([PSCustomObject]@{
            'מסד' = $auditEntries.Count + 1
            'קוד הרצה (run_id)' = $RunId
            'תאריך ושעה (timestamp)' = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
            'מזהה Master (master_id)' = 'N/A'
            'מזהה שורת מקור (source_record_id)' = $rawId
            'מקור (source)' = 'מקור A'
            'שם שדה (field_name)' = 'דוא"ל'
            'ערך מקורי (original_value)' = $oldE
            'ערך חדש (new_value)' = $cleanEmail
            'מזהה חוק (rule_id)' = 'EMAIL_TYPO_FIX'
            'סוג פעולה (action_type)' = 'AUTO'
            'פרטים נוספים' = 'תיקון סיומת דומיין מוכרת'
        })
    }
    $isEmailValid = ($cleanEmail -match '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')

    # Normalize Authority
    $authKey = $rawAuth.Trim().Replace('"', '').Replace("'", '').Replace('-', '')
    $stdAuth = $rawAuth
    $authType = 'לא מוגדר'
    $authDistrict = ''
    if ($authLookup.ContainsKey($authKey)) {
        $a = $authLookup[$authKey]
        $stdAuth = $a.standard_name
        $authType = $a.type
        $authDistrict = $a.district
        $authFixedCount++
        if ($stdAuth -ne $rawAuth) {
            $auditEntries.Add([PSCustomObject]@{
                'מסד' = $auditEntries.Count + 1
                'קוד הרצה (run_id)' = $RunId
                'תאריך ושעה (timestamp)' = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
                'מזהה Master (master_id)' = 'N/A'
                'מזהה שורת מקור (source_record_id)' = $rawId
                'מקור (source)' = 'מקור A'
                'שם שדה (field_name)' = 'רשות מקומית'
                'ערך מקורי (original_value)' = $rawAuth
                'ערך חדש (new_value)' = $stdAuth
                'מזהה חוק (rule_id)' = 'AUTHORITY_DICTIONARY_MATCH'
                'סוג פעולה (action_type)' = 'AUTO'
                'פרטים נוספים' = "סוג: $authType, מחוז: $authDistrict"
            })
        }
    }

    # Normalize Role
    $roleKey = $rawRole.Trim()
    $stdRole = 'תפקיד לא מזוהה'
    $roleDept = ''
    if ($roleLookup.ContainsKey($roleKey)) {
        $r = $roleLookup[$roleKey]
        $stdRole = $r.standard_role
        $roleDept = $r.department_default
        $rolesFixedCount++
        if ($stdRole -ne $rawRole) {
            $auditEntries.Add([PSCustomObject]@{
                'מסד' = $auditEntries.Count + 1
                'קוד הרצה (run_id)' = $RunId
                'תאריך ושעה (timestamp)' = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
                'מזהה Master (master_id)' = 'N/A'
                'מזהה שורת מקור (source_record_id)' = $rawId
                'מקור (source)' = 'מקור A'
                'שם שדה (field_name)' = 'תפקיד'
                'ערך מקורי (original_value)' = $rawRole
                'ערך חדש (new_value)' = $stdRole
                'מזהה חוק (rule_id)' = 'ROLE_CLUSTER_TAXONOMY'
                'סוג פעולה (action_type)' = 'AUTO'
                'פרטים נוספים' = "אגף/יחידה: $roleDept"
            })
        }
    } elseif (-not [string]::IsNullOrWhiteSpace($rawRole)) {
        $stdRole = $rawRole
    }

    # Extract all distribution lists
    $distLists = [ordered]@{}
    foreach ($k in $uniqueHeaders) {
        if ($k.StartsWith('רשימה:') -or $k.StartsWith('מורשה') -or $k -eq 'הוסר') {
            $distLists[$k] = $rowObj[$k]
        }
    }

    $cleansedRows.Add([PSCustomObject]@{
        _raw_row_id = $rawId
        _source_id = 'A'
        _source_name = 'רשימת סמוב'
        first_name = $rowObj['שם פרטי']
        last_name = $rowObj['שם משפחה']
        full_name = $cleanName
        authority_name_standard = $stdAuth
        authority_name_raw = $rawAuth
        authority_type = $authType
        district = $authDistrict
        role_standard = $stdRole
        role_original = $rawRole
        department = $roleDept
        phone_mobile = if ($isMobileValid) { $mobileDigits } else { $rawMobile }
        phone_mobile_raw = $rawMobile
        phone_mobile_valid = $isMobileValid
        phone_work = $workFormatted
        email = $cleanEmail
        email_valid = $isEmailValid
        email_secondary = if ($rowObj.Contains('מייל פרטי אישי')) { $rowObj['מייל פרטי אישי'] } else { '' }
        id_number = $rawIdNum
        member_status = 'פעיל'
        notes = if ($rowObj.Contains('הערות')) { $rowObj['הערות'] } else { '' }
        _distLists = $distLists
    })
}

Write-Host "  ✓ טלפונים ניידים שתוקנו: $phonesFixedCount" -ForegroundColor Yellow
Write-Host "  ✓ רשויות מקומיות שתוקננו: $authFixedCount" -ForegroundColor Yellow
Write-Host "  ✓ תפקידים שסווגו לאשכולות: $rolesFixedCount" -ForegroundColor Yellow

# 5. Matching & Clustering
Write-Host "`n[שלב 5/6] הרצת מנוע התאמת אנשים..." -ForegroundColor Green

$clusters = [System.Collections.Generic.Dictionary[string, System.Collections.Generic.List[PSObject]]]::new()
$phoneIndex = @{}
$emailIndex = @{}

foreach ($rec in $cleansedRows) {
    $matchedClusterKey = $null

    if ($rec.phone_mobile_valid -and $phoneIndex.ContainsKey($rec.phone_mobile)) {
        $matchedClusterKey = $phoneIndex[$rec.phone_mobile]
    } elseif ($rec.email_valid -and $emailIndex.ContainsKey($rec.email)) {
        $matchedClusterKey = $emailIndex[$rec.email]
    }

    if ($null -eq $matchedClusterKey) {
        $matchedClusterKey = 'CLUST_' + $rec._raw_row_id
        $clusters[$matchedClusterKey] = [System.Collections.Generic.List[PSObject]]::new()
    }

    $clusters[$matchedClusterKey].Add($rec)

    if ($rec.phone_mobile_valid) { $phoneIndex[$rec.phone_mobile] = $matchedClusterKey }
    if ($rec.email_valid) { $emailIndex[$rec.email] = $matchedClusterKey }
}

Write-Host "  ✓ סה`"כ רשומות מקור: $($cleansedRows.Count)" -ForegroundColor Gray
Write-Host "  ✓ אנשים ייחודיים שזוהו: $($clusters.Count)" -ForegroundColor Yellow
$internalDups = $cleansedRows.Count - $clusters.Count
Write-Host "  ✓ כפילויות שאותרו ומוזגו: $internalDups" -ForegroundColor Cyan

# 6. Master Record Consolidation & Consent Strict Enforcement
Write-Host "`n[שלב 6/6] מיזוג Master עם אכיפת כללי הסכמה מחמירים (Explicit Unsubscribe > Positive Consent)..." -ForegroundColor Green

$outputDir = Join-Path $baseDir "06_outputs\$RunId"
if (-not (Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }

$masterRecords = [System.Collections.Generic.List[PSObject]]::new()
$reviewRecords = [System.Collections.Generic.List[PSObject]]::new()
$matchedDupsRecords = [System.Collections.Generic.List[PSObject]]::new()

$masterIdx = 1
foreach ($cKey in $clusters.Keys) {
    $members = $clusters[$cKey]
    $primary = $members[0]
    $mId = 'MST-' + ($masterIdx.ToString('D5'))
    $masterIdx++

    $srcIdsStr = ($members | ForEach-Object { $_._raw_row_id }) -join ', '
    $isHumanConfirmed = ($srcIdsStr -in @('A:45, A:453', 'A:80, A:446', 'A:98, A:604'))

    # Calculate quality score
    $score = 0
    if ($primary.full_name.Length -ge 3) { $score += 20 }
    if ($primary.authority_name_standard -and $primary.authority_name_standard -ne 'לא מוגדר') { $score += 20 }
    if ($primary.role_standard -and $primary.role_standard -ne 'תפקיד לא מזוהה') { $score += 20 }
    if ($primary.phone_mobile_valid) { $score += 20 }
    if ($primary.email_valid) { $score += 20 }

    $qStatus = if ($score -eq 100) { 'מלאה' } elseif ($score -ge 80) { 'כמעט מלאה' } elseif ($score -ge 60) { 'חסרים נתונים' } else { 'דורשת טיפול' }

    # Strict Consent Resolution across members: Explicit Unsubscribe > Positive Consent > Blank
    $mergedDistLists = [ordered]@{}
    $hasUnsubscribe = $false
    $hasNotAllowedWa = $false
    $hasNotAllowedSms = $false
    $hasNotAllowedMail = $false
    $hasPositiveWa = $false
    $hasPositiveSms = $false
    $hasPositiveMail = $false

    foreach ($m in $members) {
        $dl = $m._distLists
        if ($dl['הוסר'] -eq 'כן' -or $dl['רשימה:  לא מאושרי דיוור'] -eq 'כן') { $hasUnsubscribe = $true }

        if ($dl['מורשה לשליחת הודעות Whatsapp'] -eq 'לא') { $hasNotAllowedWa = $true }
        elseif ($dl['מורשה לשליחת הודעות Whatsapp'] -eq 'כן') { $hasPositiveWa = $true }

        if ($dl['מורשה לשליחת סמסים'] -eq 'לא') { $hasNotAllowedSms = $true }
        elseif ($dl['מורשה לשליחת סמסים'] -eq 'כן') { $hasPositiveSms = $true }

        if ($dl['מורשה לשליחת מיילים'] -eq 'לא') { $hasNotAllowedMail = $true }
        elseif ($dl['מורשה לשליחת מיילים'] -eq 'כן') { $hasPositiveMail = $true }

        # Union for topic distribution lists
        foreach ($k in $dl.Keys) {
            if ($k.StartsWith('רשימה:') -and $k -ne 'רשימה:  לא מאושרי דיוור') {
                if ($dl[$k] -eq 'כן' -or $mergedDistLists[$k] -eq 'כן') {
                    $mergedDistLists[$k] = 'כן'
                } else {
                    $mergedDistLists[$k] = $dl[$k]
                }
            }
        }
    }

    $mergedDistLists['הוסר'] = if ($hasUnsubscribe) { 'כן' } else { 'לא' }
    if ($hasUnsubscribe) { $mergedDistLists['רשימה:  לא מאושרי דיוור'] = 'כן' }
    $mergedDistLists['מורשה לשליחת הודעות Whatsapp'] = if ($hasNotAllowedWa) { 'לא' } elseif ($hasPositiveWa) { 'כן' } else { '' }
    $mergedDistLists['מורשה לשליחת סמסים'] = if ($hasNotAllowedSms) { 'לא' } elseif ($hasPositiveSms) { 'כן' } else { '' }
    $mergedDistLists['מורשה לשליחת מיילים'] = if ($hasNotAllowedMail) { 'לא' } elseif ($hasPositiveMail) { 'כן' } else { '' }

    # Categorize Review
    $isMissingMobile = (-not $primary.phone_mobile_valid)
    $isMissingEmail = (-not $primary.email_valid)
    $isUnmappedRole = ($primary.role_standard -eq 'תפקיד לא מזוהה')
    $isUnrecognizedAuth = ($primary.authority_name_standard -eq 'לא מוגדר' -or [string]::IsNullOrWhiteSpace($primary.authority_name_standard))

    $reviewCategory = 'COMPLETE'
    $reviewType = 'NONE'
    $reviewReasons = @()

    if ($isHumanConfirmed) {
        $reviewReasons += 'אושר ידנית ב-Validation (HUMAN_REVIEW_CONFIRMED)'
    }

    if ($isMissingMobile -and $isMissingEmail) {
        $reviewCategory = 'חסרים טלפון ודוא"ל'
        $reviewType = 'INCOMPLETE'
        $reviewReasons += 'ללא פרטי קשר כלל'
    } elseif ($isMissingMobile) {
        $reviewCategory = 'חסר טלפון נייד בלבד'
        $reviewType = 'INCOMPLETE'
        $reviewReasons += 'טלפון נייד חסר או לא תקין'
    } elseif ($isMissingEmail) {
        $reviewCategory = 'חסר דוא"ל בלבד'
        $reviewType = 'INCOMPLETE'
        $reviewReasons += 'דוא"ל חסר או לא תקין'
    }

    if ($isUnmappedRole) {
        if ($reviewCategory -eq 'COMPLETE') { $reviewCategory = 'תפקיד לא ממופה' }
        if ($reviewType -eq 'NONE') { $reviewType = 'INCOMPLETE' }
        $reviewReasons += 'תפקיד מקורי לא סווג לאשכול'
    }

    if ($isUnrecognizedAuth) {
        if ($reviewCategory -eq 'COMPLETE') { $reviewCategory = 'רשות לא מזוהה' }
        $reviewType = 'REVIEW REQUIRED'
        $reviewReasons += 'שיוך רשות חסר/לא מזוהה'
    }

    $reqReview = ($reviewType -ne 'NONE')

    # Master Row
    $masterObj = [ordered]@{
        'מזהה Master' = $mId
        'שם מלא' = $primary.full_name
        'שם פרטי' = $primary.first_name
        'שם משפחה' = $primary.last_name
        'רשות מקומית תקנית' = $primary.authority_name_standard
        'רשות מקורית' = $primary.authority_name_raw
        'סוג רשות' = $primary.authority_type
        'מחוז' = $primary.district
        'תפקיד תקני' = $primary.role_standard
        'תפקיד מקורי' = $primary.role_original
        'אגף / יחידה' = $primary.department
        'טלפון נייד תקני' = $primary.phone_mobile
        'טלפון נייד מקורי' = $primary.phone_mobile_raw
        'טלפון קווי/עבודה' = $primary.phone_work
        'דוא"ל ראשי' = $primary.email
        'דוא"ל משני' = $primary.email_secondary
        'תעודת זהות' = $primary.id_number
        'סטטוס חבר' = $primary.member_status
        'קיים במקור A' = 'כן'
        'קיים במקור B' = 'לא'
        'קיים במקור C' = 'לא'
        'מספר מקורות' = 1
        'מזהי רשומות מקור' = $srcIdsStr
        'ציון התאמה' = 100
        'ציון איכות נתונים' = $score
        'סטטוס איכות' = $qStatus
        'דורש בדיקה' = if ($reqReview) { 'כן' } else { 'לא' }
        'סוג חריג' = $reviewType
        'קטגוריית חריג' = $reviewCategory
        'סיבות לבדיקה' = $reviewReasons -join ' ; '
        'הערות' = $primary.notes
    }

    # Append distribution lists
    foreach ($dlKey in $mergedDistLists.Keys) {
        $masterObj[$dlKey] = $mergedDistLists[$dlKey]
    }

    $masterRecords.Add([PSCustomObject]$masterObj)

    if ($reqReview) {
        $reviewRecords.Add([PSCustomObject]@{
            'מזהה Master' = $mId
            'שם מלא' = $primary.full_name
            'רשות מקומית' = $primary.authority_name_standard
            'תפקיד' = $primary.role_standard
            'טלפון נייד' = $primary.phone_mobile
            'דוא"ל' = $primary.email
            'סיווג חריג' = $reviewType
            'קטגוריית סיבה' = $reviewCategory
            'סיבות לבדיקה' = $reviewReasons -join ' ; '
            'ציון איכות' = $score
            'סטטוס איכות' = $qStatus
        })
    }

    if ($members.Count -gt 1) {
        $auditEntries.Add([PSCustomObject]@{
            'מסד' = $auditEntries.Count + 1
            'קוד הרצה (run_id)' = $RunId
            'תאריך ושעה (timestamp)' = (Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
            'מזהה Master (master_id)' = $mId
            'מזהה שורת מקור (source_record_id)' = $srcIdsStr
            'מקור (source)' = 'מקור A'
            'שם שדה (field_name)' = 'רשומת Master'
            'ערך מקורי (original_value)' = "$($members.Count) שורות מקור ($srcIdsStr)"
            'ערך חדש (new_value)' = "$($primary.full_name) [$($primary.authority_name_standard)]"
            'מזהה חוק (rule_id)' = if ($isHumanConfirmed) { 'HUMAN_REVIEW_CONFIRMED' } else { 'STRICT_CONSENT_MERGE' }
            'סוג פעולה (action_type)' = if ($isHumanConfirmed) { 'HUMAN_REVIEW_CONFIRMED' } else { 'MERGE' }
            'פרטים נוספים' = "הוסר: $($mergedDistLists['הוסר']), איכות: $score%"
        })

        foreach ($m in $members) {
            $matchedDupsRecords.Add([PSCustomObject]@{
                'מזהה Master' = $mId
                'קוד קבוצה' = $cKey
                'מזהה שורה' = $m._raw_row_id
                'שם מלא' = $m.full_name
                'רשות' = $m.authority_name_standard
                'תפקיד' = $m.role_standard
                'טלפון נייד' = $m.phone_mobile
                'דוא"ל' = $m.email
                'ציון התאמה' = 100
                'סטטוס אימות' = if ($isHumanConfirmed) { 'HUMAN_REVIEW_CONFIRMED' } else { 'PASS' }
            })
        }
    }
}

# Export 1: MASTER_FINAL.csv (UTF-8 BOM)
$masterCsvPath = Join-Path $outputDir 'MASTER_FINAL.csv'
$masterRecords | Export-Csv -Path $masterCsvPath -NoTypeInformation -Encoding UTF8
Write-Host "  1. ✓ נוצר: $masterCsvPath" -ForegroundColor Green

# Export 2: REVIEW_REQUIRED.csv
$reviewCsvPath = Join-Path $outputDir 'REVIEW_REQUIRED.csv'
$reviewRecords | Export-Csv -Path $reviewCsvPath -NoTypeInformation -Encoding UTF8
Write-Host "  2. ✓ נוצר: $reviewCsvPath" -ForegroundColor Yellow

# Export 3: MATCHED_DUPLICATES.csv
$dupsCsvPath = Join-Path $outputDir 'MATCHED_DUPLICATES.csv'
$matchedDupsRecords | Export-Csv -Path $dupsCsvPath -NoTypeInformation -Encoding UTF8
Write-Host "  3. ✓ נוצר: $dupsCsvPath" -ForegroundColor Cyan

# Export 4: AUDIT_LOG.csv (Full Audit)
$auditCsvPath = Join-Path $outputDir 'AUDIT_LOG.csv'
$auditEntries | Export-Csv -Path $auditCsvPath -NoTypeInformation -Encoding UTF8
Write-Host "  4. ✓ נוצר: $auditCsvPath ($($auditEntries.Count) אירועים מתועדים)" -ForegroundColor White

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "  סיכום הרצה REVALIDATION_01 הושלם בהצלחה!" -ForegroundColor Cyan
Write-Host "  סה`"כ רשומות Master סופיות: $($masterRecords.Count)" -ForegroundColor Green
Write-Host "  רשומות חסרות מידע (INCOMPLETE): $(($reviewRecords | Where-Object { $_.'סיווג חריג' -eq 'INCOMPLETE' }).Count)" -ForegroundColor Gray
Write-Host "  רשומות המחייבות בדיקה (REVIEW REQUIRED): $(($reviewRecords | Where-Object { $_.'סיווג חריג' -eq 'REVIEW REQUIRED' }).Count)" -ForegroundColor Yellow
Write-Host "  אירועי Audit מתועדים ב-CSV: $($auditEntries.Count)" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
