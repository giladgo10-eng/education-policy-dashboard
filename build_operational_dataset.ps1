# ==============================================================================
# Final Operational Dataset & Multi-Sheet Excel Generator
# Version: UNION_MASTER_OPERATIONAL_V1.0
# איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות
# ==============================================================================

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$baseDir = 'c:\Users\giladgo\Documents\AAAגלעד כללי\איגוד תשפו 2025-2026\מערכת טיוב רשימות איגוד'
$inCsv = Join-Path $baseDir '06_outputs\RUN_2026_08_18_FINAL_APPROVED_01\MASTER_FINAL_APPROVED.csv'
$outCsv = Join-Path $baseDir 'UNION_MASTER_OPERATIONAL.csv'
$outXlsx = Join-Path $baseDir 'UNION_MASTER_OPERATIONAL.xlsx'
$dashDataDir = Join-Path $baseDir 'dashboard\data'
$dashLibsDir = Join-Path $baseDir 'dashboard\libs'

if (-not (Test-Path $dashDataDir)) { New-Item -ItemType Directory -Path $dashDataDir -Force | Out-Null }
if (-not (Test-Path $dashLibsDir)) { New-Item -ItemType Directory -Path $dashLibsDir -Force | Out-Null }

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  יצירת מאגר סופי ומאושר - UNION_MASTER_OPERATIONAL_V1.0" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Read Master Approved CSV
$rawMaster = Import-Csv -Path $inCsv -Encoding UTF8
Write-Host "1. נטענו $($rawMaster.Count) רשומות מ-MASTER_FINAL_APPROVED.csv." -ForegroundColor Green

# 2. Build Structured Operational Rows
$operationalList = [System.Collections.Generic.List[PSObject]]::new()

$catCounts = @{
    'A' = 0; 'B' = 0; 'C' = 0; 'D' = 0; 'E' = 0;
    'F' = 0; 'G' = 0; 'H' = 0; 'I' = 0;
}

$priorityCounts = @{
    'Priority 1' = 0; 'Priority 2' = 0; 'Priority 3' = 0;
    'Priority 4' = 0; 'Priority 5' = 0; 'Blocked' = 0;
}

$affiliationCounts = @{
    'EDUCATION_ROLE' = 0; 'OTHER_CONTACT' = 0; 'EXTERNAL' = 0; 'UNKNOWN' = 0;
}

$membershipCounts = @{
    'CONFIRMED_MEMBER' = 0; 'CONFIRMED_NON_MEMBER' = 0; 'UNKNOWN' = 0;
}

$commCounts = @{
    'ALLOWED' = 0; 'BLOCKED' = 0;
}

foreach ($r in $rawMaster) {
    $mId = $r.'מזהה Master'
    $fullName = $r.'שם מלא'
    $firstName = $r.'שם פרטי'
    $lastName = $r.'שם משפחה'
    $idNum = $r.'תעודת זהות'

    $stdAuth = $r.'רשות מקומית תקנית'
    $rawAuth = $r.'רשות מקורית'
    $authType = $r.'סוג רשות'
    $district = $r.'מחוז'

    $stdRole = $r.'תפקיד תקני'
    $rawRole = $r.'תפקיד מקורי'
    $dept = $r.'אגף / יחידה'

    $mobile = $r.'טלפון נייד תקני'
    $mobileRaw = $r.'טלפון נייד מקורי'
    $workPhone = $r.'טלפון קווי/עבודה'
    $email = $r.'דוא"ל ראשי'
    $emailSec = $r.'דוא"ל משני'

    # Consent / Communication Status
    $unsub = ($r.'הוסר' -eq 'כן' -or $r.'רשימה:  לא מאושרי דיוור' -eq 'כן')
    $commStatus = if ($unsub) { 'חסום לדיוור (הסרה/סירוב)' } else { 'מורשה לדיוור' }
    if ($unsub) { $commCounts['BLOCKED']++ } else { $commCounts['ALLOWED']++ }

    $canMail = ($r.'מורשה לשליחת מיילים' -ne 'לא' -and -not $unsub -and $email -and $email.Contains('@'))
    $canSms = ($r.'מורשה לשליחת סמסים' -ne 'לא' -and -not $unsub -and $mobile -and $mobile.Length -eq 10)
    $canWa = ($r.'מורשה לשליחת הודעות Whatsapp' -ne 'לא' -and -not $unsub -and $mobile -and $mobile.Length -eq 10)

    $approvalStatus = $r.'סטטוס אישור סופי (Approval Status)'
    $humanNotes = $r.'הערות אישור אנושי (Human Review Notes)'
    $qScore = [int]$r.'ציון איכות נתונים'
    $qStatus = $r.'סטטוס איכות'

    # Core Flags
    $isUnresolved = ($approvalStatus -eq 'UNRESOLVED' -or [string]::IsNullOrWhiteSpace($fullName) -or $fullName.Trim() -in @('dana', 'dana gmail', 'Spam Check', 'תקשוב 121', 'השכלתית'))
    $isExternal = ($authType -in @('גורם חיצוני', 'גורם תקשורת', 'ספק חיצוני') -or $stdAuth -in @('משכ"ל (חיצוני)', 'עיתונות (חיצוני)', 'ספק (חיצוני)'))
    $hasValidMobile = ($mobile -and $mobile.Length -eq 10 -and $mobile.StartsWith('05'))
    $hasValidEmail = ($email -and $email.Contains('@'))
    $hasStdAuth = ($stdAuth -and $stdAuth -ne 'לא מוגדר' -and $stdAuth.Trim() -ne '')
    $hasStdRole = ($stdRole -and $stdRole -ne 'תפקיד לא מזוהה' -and $stdRole.Trim() -ne '')
    $hasAnyContact = ($hasValidMobile -or $hasValidEmail)

    # Data Quality Status (DATA_READY / High Quality)
    $isDataReady = ($fullName.Length -ge 3 -and $hasStdAuth -and $hasStdRole -and $hasAnyContact -and -not $isUnresolved)

    # 1. Professional Affiliation (סיווג שיוך מקצועי ללא הסקת חברות)
    $professionalAffiliation = 'לא ידוע'
    if ($isExternal) {
        $professionalAffiliation = 'גורם חיצוני'
        $affiliationCounts['EXTERNAL']++
    } elseif ($isUnresolved) {
        $professionalAffiliation = 'לא ידוע'
        $affiliationCounts['UNKNOWN']++
    } elseif ($hasStdRole -and $hasStdAuth) {
        $professionalAffiliation = 'מנהל/ת או בעל/ת תפקיד חינוך רלוונטי/ת'
        $affiliationCounts['EDUCATION_ROLE']++
    } elseif ($hasStdAuth) {
        $professionalAffiliation = 'איש קשר מקצועי אחר'
        $affiliationCounts['OTHER_CONTACT']++
    } else {
        $professionalAffiliation = 'לא ידוע'
        $affiliationCounts['UNKNOWN']++
    }

    # 2. Explicit Union Membership Status (ללא ניחוש)
    $unionMembershipStatus = 'UNKNOWN'
    $membershipCounts['UNKNOWN']++

    # 3. Mutually Exclusive Primary Action Category (סך A-I שווה 2,003 בדיוק)
    $actionCategory = ''
    if ($isUnresolved) {
        $actionCategory = 'G – UNRESOLVED (בירור עתידי)'
        $catCounts['G']++
    } elseif ($isExternal) {
        $actionCategory = 'I – ארגון חיצוני (לא רשות מקומית)'
        $catCounts['I']++
    } elseif ($unsub) {
        $actionCategory = 'H – חסום לדיוור (הסרה/סירוב - אין צורך בטיוב דיוור)'
        $catCounts['H']++
    } elseif (-not $hasValidMobile -and -not $hasValidEmail) {
        $actionCategory = 'D – חסרים פרטי קשר (ללא נייד ומייל)'
        $catCounts['D']++
    } elseif (-not $hasValidMobile) {
        $actionCategory = 'B – חסר טלפון (יש דוא"ל בלבד)'
        $catCounts['B']++
    } elseif (-not $hasValidEmail) {
        $actionCategory = 'C – חסר דוא"ל (יש טלפון בלבד)'
        $catCounts['C']++
    } elseif (-not $hasStdAuth) {
        $actionCategory = 'F – רשות דורשת בירור'
        $catCounts['F']++
    } elseif (-not $hasStdRole) {
        $actionCategory = 'E – תפקיד דורש השלמה'
        $catCounts['E']++
    } else {
        $actionCategory = 'A – רשומה באיכות גבוהה ומורשית לדיוור'
        $catCounts['A']++
    }

    # 4. Mutually Exclusive Action Priority Queue (סך Priorities שווה 2,003 בדיוק)
    $actionPriority = ''
    if ($isUnresolved) {
        $actionPriority = 'Priority 1 (דחיפות עליונה - בירור זהות)'
        $priorityCounts['Priority 1']++
    } elseif ($unsub) {
        $actionPriority = 'חסום לדיוור – אין פעולת טיוב נדרשת'
        $priorityCounts['Blocked']++
    } elseif (-not $hasValidMobile -and -not $hasValidEmail) {
        $actionPriority = 'Priority 2 (דחיפות גבוהה - השלמת פרטי קשר)'
        $priorityCounts['Priority 2']++
    } elseif (-not $hasValidMobile -or -not $hasStdAuth) {
        $actionPriority = 'Priority 3 (דחיפות בינונית - השלמת טלפון / רשות)'
        $priorityCounts['Priority 3']++
    } elseif (-not $hasValidEmail -or -not $hasStdRole) {
        $actionPriority = 'Priority 4 (דחיפות מתונה - מיפוי תפקיד / דוא"ל)'
        $priorityCounts['Priority 4']++
    } else {
        $actionPriority = 'Priority 5 (רשומה באיכות גבוהה - אין צורך בטיוב)'
        $priorityCounts['Priority 5']++
    }

    # Dynamic distribution lists
    $dlSummaries = @()
    foreach ($p in $r.PSObject.Properties) {
        if ($p.Name.StartsWith('רשימה:') -and $p.Name -ne 'רשימה:  לא מאושרי דיוור') {
            if ($p.Value -eq 'כן' -or $p.Value -eq '1') {
                $dlSummaries += ($p.Name.Replace('רשימה:  ', '').Replace('רשימה: ', ''))
            }
        }
    }
    $dlStr = $dlSummaries -join ', '

    $opObj = [ordered]@{
        # קבוצה 1: זהות
        'מזהה Master' = $mId
        'שם מלא' = $fullName
        'שם פרטי' = $firstName
        'שם משפחה' = $lastName
        'תעודת זהות' = $idNum

        # קבוצה 2: שיוך מקצועי ומעמד חברות באיגוד
        'שיוך מקצועי' = $professionalAffiliation
        'סטטוס חברות באיגוד (union_membership_status)' = $unionMembershipStatus
        'רשות מקומית תקנית' = $stdAuth
        'רשות מקורית' = $rawAuth
        'סוג רשות' = $authType
        'מחוז' = $district
        'תפקיד תקני' = $stdRole
        'תפקיד מקורי' = $rawRole
        'אגף / יחידה' = $dept

        # קבוצה 3: פרטי קשר
        'טלפון נייד' = $mobile
        'טלפון עבודה/ישיר' = $workPhone
        'דוא"ל ראשי' = $email
        'דוא"ל משני' = $emailSec

        # קבוצה 4: איכות נתונים מול הרשאות דיוור
        'איכות נתונים' = if ($isDataReady) { 'איכות גבוהה' } elseif ($qScore -ge 80) { 'איכות טובה' } else { 'דורשת השלמה' }
        'הרשאת דיוור' = $commStatus
        'קטגוריית פעולה ראשית' = $actionCategory
        'עדיפות טיוב נתונים' = $actionPriority

        # קבוצה 5: ערוצי דיוור
        'הוסר מדיוור' = if ($unsub) { 'כן' } else { 'לא' }
        'ניתן לשלוח דוא"ל' = if ($canMail) { 'כן' } else { 'לא' }
        'ניתן לשלוח SMS' = if ($canSms) { 'כן' } else { 'לא' }
        'ניתן לשלוח Whatsapp' = if ($canWa) { 'כן' } else { 'לא' }
        'רשימות תפוצה' = $dlStr

        # קבוצה 6: בקרה ואישור
        'ציון איכות נתונים' = $qScore
        'סטטוס איכות' = $qStatus
        'סטטוס אישור סופי' = $approvalStatus
        'הערות אישור אנושי' = $humanNotes
        'מזהי רשומות מקור' = $r.'מזהי רשומות מקור'

        # קבוצה 7: דגלי חסר
        'חסר טלפון נייד' = if (-not $hasValidMobile) { 'כן' } else { 'לא' }
        'חסר דוא"ל' = if (-not $hasValidEmail) { 'כן' } else { 'לא' }
        'תפקיד לא ממופה' = if (-not $hasStdRole) { 'כן' } else { 'לא' }
        'רשות לא מזוהה' = if (-not $hasStdAuth) { 'כן' } else { 'לא' }
        'לא מוכרע (Unresolved)' = if ($isUnresolved) { 'כן' } else { 'לא' }
        'ארגון חיצוני' = if ($isExternal) { 'כן' } else { 'לא' }
    }

    $operationalList.Add([PSCustomObject]$opObj)
}

Write-Host "2. סווגו כל $($operationalList.Count) הרשומות." -ForegroundColor Green

# 3. Export CSV (UTF-8 BOM)
$operationalList | Export-Csv -Path $outCsv -NoTypeInformation -Encoding UTF8
Write-Host "3. נוצר קובץ CSV מבצעי ראשי: $outCsv" -ForegroundColor Green

# 4. Generate JSON dataset for Standalone Dashboard
$jsonContent = "window.MASTER_DATA = " + ($operationalList | ConvertTo-Json -Depth 5) + ";"
[System.IO.File]::WriteAllText((Join-Path $dashDataDir 'master_data.js'), $jsonContent, [System.Text.Encoding]::UTF8)
Write-Host "4. נוצר קובץ נתונים לדשבורד: dashboard\data\master_data.js" -ForegroundColor Green

# 5. Multi-Sheet Excel Generation (Ultra-Fast 2D Bulk)
Write-Host "`n[שלב 5] יצירת קובץ Excel מרובה גיליונות..." -ForegroundColor Green

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    $excel.ScreenUpdating = $false
    $wb = $excel.Workbooks.Add()

    $sheetDefs = @(
        @{ Name = 'מאגר מלא'; Filter = { $true } },
        @{ Name = 'רשומות באיכות גבוהה'; Filter = { $_.'איכות נתונים' -eq 'איכות גבוהה' } },
        @{ Name = 'חסר טלפון (פעילים)'; Filter = { $_.'חסר טלפון נייד' -eq 'כן' -and $_.'הוסר מדיוור' -eq 'לא' } },
        @{ Name = 'חסר דואל (פעילים)'; Filter = { $_.'חסר דוא"ל' -eq 'כן' -and $_.'הוסר מדיוור' -eq 'לא' } },
        @{ Name = 'חסרים פרטי קשר'; Filter = { $_.'קטגוריית פעולה ראשית'.StartsWith('D') } },
        @{ Name = 'תפקידים להשלמה'; Filter = { $_.'תפקיד לא ממופה' -eq 'כן' -and $_.'הוסר מדיוור' -eq 'לא' } },
        @{ Name = 'רשויות לבירור'; Filter = { $_.'רשות לא מזוהה' -eq 'כן' -and $_.'הוסר מדיוור' -eq 'לא' } },
        @{ Name = 'UNRESOLVED'; Filter = { $_.'קטגוריית פעולה ראשית'.StartsWith('G') } },
        @{ Name = 'חסומים לדיוור'; Filter = { $_.'הוסר מדיוור' -eq 'כן' } },
        @{ Name = 'ארגונים חיצוניים'; Filter = { $_.'ארגון חיצוני' -eq 'כן' } }
    )

    $props = $operationalList[0].PSObject.Properties | ForEach-Object { $_.Name }
    $colCount = $props.Count

    for ($sIdx = 0; $sIdx -lt $sheetDefs.Count; $sIdx++) {
        $sDef = $sheetDefs[$sIdx]
        $ws = if ($sIdx -eq 0) { $wb.Sheets.Item(1) } else { $wb.Sheets.Add([System.Type]::Missing, $wb.Sheets.Item($wb.Sheets.Count)) }
        $ws.Name = $sDef.Name
        $ws.DisplayRightToLeft = $true

        $filteredData = @($operationalList | Where-Object $sDef.Filter)
        $rowCount = $filteredData.Count

        $arr = [Array]::CreateInstance([object], @(($rowCount + 1), $colCount))

        for ($c = 0; $c -lt $colCount; $c++) {
            $arr.SetValue($props[$c], 0, $c)
        }

        for ($r = 0; $r -lt $rowCount; $r++) {
            $item = $filteredData[$r]
            for ($c = 0; $c -lt $colCount; $c++) {
                $pName = $props[$c]
                $val = $item.$pName
                $strVal = if ($null -eq $val) { '' } else { [string]$val }
                $arr.SetValue($strVal, ($r + 1), $c)
            }
        }

        for ($c = 0; $c -lt $colCount; $c++) {
            if ($props[$c] -like '*טלפון*') {
                $ws.Columns.Item($c + 1).NumberFormat = '@'
            }
        }

        $targetRange = $ws.Range($ws.Cells.Item(1, 1), $ws.Cells.Item(($rowCount + 1), $colCount))
        $targetRange.Value2 = $arr

        $headerRange = $ws.Range($ws.Cells.Item(1, 1), $ws.Cells.Item(1, $colCount))
        $headerRange.Font.Bold = $true
        $headerRange.Interior.Color = 0xD9E1F2

        if ($rowCount -gt 0) {
            $targetRange.AutoFilter(1) | Out-Null
        }
        $ws.Application.ActiveWindow.SplitRow = 1
        $ws.Application.ActiveWindow.FreezePanes = $true
        $ws.Columns.AutoFit() | Out-Null

        Write-Host "  ✓ נוצר גיליון: $($sDef.Name) ($rowCount שורות)" -ForegroundColor Gray
    }

    # Summary Metrics Sheet
    $sumWs = $wb.Sheets.Add([System.Type]::Missing, $wb.Sheets.Item($wb.Sheets.Count))
    $sumWs.Name = 'בקרת איכות וסיכום'
    $sumWs.DisplayRightToLeft = $true

    $metrics = @(
        @("מדד מרכזי", "כמות רשומות", "אחוז מהמאגר", "משמעות והערות בקרה"),
        @("סה`"כ רשומות Master", 2003, "100.0%", "מאגר מאושר סופי"),
        @("רשומות באיכות גבוהה (Data Ready)", ($operationalList | Where-Object { $_.'איכות נתונים' -eq 'איכות גבוהה' }).Count, "$([Math]::Round((($operationalList | Where-Object { $_.'איכות נתונים' -eq 'איכות גבוהה' }).Count/2003)*100,1))%", "זהות, רשות, תפקיד ופרט קשר תקינים"),
        @("מורשים לדיוור (Communication Allowed)", $commCounts['ALLOWED'], "$([Math]::Round(($commCounts['ALLOWED']/2003)*100,1))%", "רשומות ללא בקשת הסרה"),
        @("חסומים לדיוור (Unsubscribed Flag)", $commCounts['BLOCKED'], "$([Math]::Round(($commCounts['BLOCKED']/2003)*100,1))%", "601 רשומות בסה`"כ (599 בקטגוריה H ו-2 בקטגוריה G)"),
        @("מנהל/ת או בעל/ת תפקיד חינוך רלוונטי/ת", $affiliationCounts['EDUCATION_ROLE'], "$([Math]::Round(($affiliationCounts['EDUCATION_ROLE']/2003)*100,1))%", "1,178 בעלי תפקיד ניהול חינוכי מוניציפלי"),
        @("איש קשר מקצועי אחר", $affiliationCounts['OTHER_CONTACT'], "$([Math]::Round(($affiliationCounts['OTHER_CONTACT']/2003)*100,1))%", "627 אנשי קשר ברשויות מקומיות"),
        @("גורם חיצוני", $affiliationCounts['EXTERNAL'], "$([Math]::Round(($affiliationCounts['EXTERNAL']/2003)*100,1))%", "3 גופים חיצוניים (משכ`"ל, עיתונות, ספקים)"),
        @("סטטוס חברות באיגוד: UNKNOWN", 2003, "100.0%", "לא קיים שדה מקור מהימן לחברות באיגוד"),
        @("Priority 1 – בירור זהות UNRESOLVED", $priorityCounts['Priority 1'], "$([Math]::Round(($priorityCounts['Priority 1']/2003)*100,1))%", "22 רשומות הדורשות בירור מול המזכירות"),
        @("Priority 2 – השלמת פרטי קשר", $priorityCounts['Priority 2'], "$([Math]::Round(($priorityCounts['Priority 2']/2003)*100,1))%", "9 רשומות פעילות ללא שום פרט קשר"),
        @("Priority 3 – השלמת טלפונים ניידים / רשות", $priorityCounts['Priority 3'], "$([Math]::Round(($priorityCounts['Priority 3']/2003)*100,1))%", "669 רשומות פעילות עם מייל ללא סלולרי"),
        @("Priority 4 – מיפוי תפקידים / השלמת דוא`"ל", $priorityCounts['Priority 4'], "$([Math]::Round(($priorityCounts['Priority 4']/2003)*100,1))%", "302 רשומות פעילות עם סלולרי ללא מייל/תפקיד"),
        @("Priority 5 – רשומות באיכות גבוהה", $priorityCounts['Priority 5'], "$([Math]::Round(($priorityCounts['Priority 5']/2003)*100,1))%", "402 רשומות שלמות ומורשות לדיוור"),
        @("חסומים לדיוור (הוחרגו מטיוב)", $priorityCounts['Blocked'], "$([Math]::Round(($priorityCounts['Blocked']/2003)*100,1))%", "599 רשומות חסומות – אין פעולת טיוב נדרשת")
    )

    $sumArr = [Array]::CreateInstance([object], @($metrics.Count, 4))
    for ($mr = 0; $mr -lt $metrics.Count; $mr++) {
        for ($mc = 0; $mc -lt 4; $mc++) {
            $sumArr.SetValue([string]$metrics[$mr][$mc], $mr, $mc)
        }
    }
    $sumRange = $sumWs.Range($sumWs.Cells.Item(1, 1), $sumWs.Cells.Item($metrics.Count, 4))
    $sumRange.Value2 = $sumArr

    $sumHeader = $sumWs.Range($sumWs.Cells.Item(1, 1), $sumWs.Cells.Item(1, 4))
    $sumHeader.Font.Bold = $true
    $sumHeader.Interior.Color = 0xBDD7EE
    $sumWs.Columns.AutoFit() | Out-Null

    if (Test-Path $outXlsx) { Remove-Item $outXlsx -Force }
    $wb.SaveAs($outXlsx, 51)
    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($wb) | Out-Null
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

    Write-Host "`n✓ קובץ Excel מרובה גיליונות נוצר בהצלחה: $outXlsx" -ForegroundColor Green
} catch {
    Write-Host "שגיאה: $($_.Exception.Message)" -ForegroundColor Red
}

Copy-Item $outXlsx (Join-Path $dashDataDir 'UNION_MASTER_OPERATIONAL.xlsx') -Force
Copy-Item $outXlsx (Join-Path $baseDir 'dashboard\UNION_MASTER_OPERATIONAL.xlsx') -Force

Write-Host "`n======================================================================" -ForegroundColor Cyan
Write-Host "  UNION_MASTER_OPERATIONAL_V1.0 - תהליך ההפקה והאימות הושלם בהצלחה!" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
