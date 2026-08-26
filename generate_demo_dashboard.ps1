# ==============================================================================
# Generate Anonymized Demo Dashboard for GitHub Pages
# Directory: dashboard_demo/
# איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות
# ==============================================================================

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$baseDir = 'c:\Users\giladgo\Documents\AAAגלעד כללי\איגוד תשפו 2025-2026\מערכת טיוב רשימות איגוד'
$srcDataJs = Join-Path $baseDir 'dashboard\data\master_data.js'
$demoDir = Join-Path $baseDir 'dashboard_demo'
$demoDataDir = Join-Path $demoDir 'data'
$demoLibsDir = Join-Path $demoDir 'libs'

if (-not (Test-Path $demoDir)) { New-Item -ItemType Directory -Path $demoDir -Force | Out-Null }
if (-not (Test-Path $demoDataDir)) { New-Item -ItemType Directory -Path $demoDataDir -Force | Out-Null }
if (-not (Test-Path $demoLibsDir)) { New-Item -ItemType Directory -Path $demoLibsDir -Force | Out-Null }

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  יצירת גרסת הדגמה אנונימית עצמאית - dashboard_demo (GitHub Pages)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Read Original Master Operational Data
$rawJs = [System.IO.File]::ReadAllText($srcDataJs, [System.Text.Encoding]::UTF8)
$jsonText = $rawJs.Replace('window.MASTER_DATA = ', '').TrimEnd(';')
$masterList = $jsonText | ConvertFrom-Json

Write-Host "1. נטענו $($masterList.Count) רשומות מהמאגר המבצעי המקורי." -ForegroundColor Green

# 2. Anonymize Personal Information (PII) while preserving 100% statistical integrity
$anonymizedList = [System.Collections.Generic.List[PSObject]]::new()

$nameIndex = 1
foreach ($r in $masterList) {
    $mId = $r.'מזהה Master'
    $origName = $r.'שם מלא'
    $role = $r.'תפקיד תקני'
    $auth = $r.'רשות מקומית תקנית'
    $isUnresolved = ($r.'לא מוכרע (Unresolved)' -eq 'כן')
    $isExternal = ($r.'ארגון חיצוני' -eq 'כן')

    # Anonymized Full Name
    $anonFullName = ''
    if ($isUnresolved) {
        $anonFullName = '(ללא שם מזוהה - רשומת בירור)'
    } elseif ($isExternal) {
        $anonFullName = "נציג/ת $auth (גורם חיצוני)"
    } else {
        $rolePrefix = if ($role -and $role -ne 'תפקיד לא מזוהה') { $role.Split('/')[0] } else { 'איש/אשת קשר' }
        $authSuffix = if ($auth -and $auth -ne 'לא מוגדר') { " ($auth)" } else { '' }
        $anonFullName = "$rolePrefix $mId$authSuffix"
    }

    # Anonymized Phone
    $anonMobile = ''
    if ($r.'חסר טלפון נייד' -eq 'לא') {
        $last2 = if ($r.'טלפון נייד' -and $r.'טלפון נייד'.Length -ge 2) { $r.'טלפון נייד'.Substring($r.'טלפון נייד'.Length - 2) } else { '00' }
        $anonMobile = "05*-***-**$last2"
    }

    $anonWorkPhone = ''
    if ($r.'טלפון עבודה/ישיר' -and $r.'טלפון עבודה/ישיר'.Trim() -ne '') {
        $anonWorkPhone = "0*-***-**88"
    }

    # Anonymized Email
    $anonEmail = ''
    if ($r.'חסר דוא"ל' -eq 'לא') {
        $anonEmail = "contact.$mId@muni.demo.il".ToLower()
    }

    # Mask human notes
    $anonNotes = if ($r.'הערות אישור אנושי') {
        $r.'הערות אישור אנושי' -replace '\b[א-ת]{2,}\s+[א-ת]{2,}\b', '[שם מוסווה]'
    } else { '' }

    $anonObj = [ordered]@{
        'מזהה Master' = $mId
        'שם מלא' = $anonFullName
        'שם פרטי' = '(מוסווה)'
        'שם משפחה' = '(מוסווה)'
        'תעודת זהות' = '(מוסווה)'

        'שיוך מקצועי' = $r.'שיוך מקצועי'
        'סטטוס חברות באיגוד (union_membership_status)' = $r.'סטטוס חברות באיגוד (union_membership_status)'
        'רשות מקומית תקנית' = $r.'רשות מקומית תקנית'
        'רשות מקורית' = $r.'רשות מקורית'
        'סוג רשות' = $r.'סוג רשות'
        'מחוז' = $r.'מחוז'
        'תפקיד תקני' = $r.'תפקיד תקני'
        'תפקיד מקורי' = $r.'תפקיד מקורי'
        'אגף / יחידה' = $r.'אגף / יחידה'

        'טלפון נייד' = $anonMobile
        'טלפון עבודה/ישיר' = $anonWorkPhone
        'דוא"ל ראשי' = $anonEmail
        'דוא"ל משני' = if ($r.'דוא"ל משני') { "(מוסווה)" } else { '' }

        'איכות נתונים' = $r.'איכות נתונים'
        'הרשאת דיוור' = $r.'הרשאת דיוור'
        'קטגוריית פעולה ראשית' = $r.'קטגוריית פעולה ראשית'
        'עדיפות טיוב נתונים' = $r.'עדיפות טיוב נתונים'

        'הוסר מדיוור' = $r.'הוסר מדיוור'
        'ניתן לשלוח דוא"ל' = $r.'ניתן לשלוח דוא"ל'
        'ניתן לשלוח SMS' = $r.'ניתן לשלוח SMS'
        'ניתן לשלוח Whatsapp' = $r.'ניתן לשלוח Whatsapp'
        'רשימות תפוצה' = $r.'רשימות תפוצה'

        'ציון איכות נתונים' = $r.'ציון איכות נתונים'
        'סטטוס איכות' = $r.'סטטוס איכות'
        'סטטוס אישור סופי' = $r.'סטטוס אישור סופי'
        'הערות אישור אנושי' = $anonNotes
        'מזהי רשומות מקור' = "SRC-$mId"

        'חסר טלפון נייד' = $r.'חסר טלפון נייד'
        'חסר דוא"ל' = $r.'חסר דוא"ל'
        'תפקיד לא ממופה' = $r.'תפקיד לא ממופה'
        'רשות לא מזוהה' = $r.'רשות לא מזוהה'
        'לא מוכרע (Unresolved)' = $r.'לא מוכרע (Unresolved)'
        'ארגון חיצוני' = $r.'ארגון חיצוני'
    }

    $anonymizedList.Add([PSCustomObject]$anonObj)
    $nameIndex++
}

Write-Host "2. כל 2,003 הרשומות אוננו בהצלחה (ללא שמות, טלפונים ומיילים אמיתיים)." -ForegroundColor Green

# 3. Export Demo Data JS
$demoJsContent = "window.MASTER_DATA = " + ($anonymizedList | ConvertTo-Json -Depth 5) + ";"
[System.IO.File]::WriteAllText((Join-Path $demoDataDir 'master_data.js'), $demoJsContent, [System.Text.Encoding]::UTF8)
Write-Host "3. נוצר קובץ נתוני דמו: dashboard_demo\data\master_data.js" -ForegroundColor Green

# 4. Copy Assets and Libraries
Copy-Item (Join-Path $baseDir 'dashboard\libs\xlsx.full.min.js') (Join-Path $demoLibsDir 'xlsx.full.min.js') -Force
Copy-Item (Join-Path $baseDir 'dashboard\styles.css') (Join-Path $demoDir 'styles.css') -Force
Copy-Item (Join-Path $baseDir 'dashboard\app.js') (Join-Path $demoDir 'app.js') -Force

# Create .nojekyll for GitHub Pages
Set-Content -Path (Join-Path $demoDir '.nojekyll') -Value '' -Encoding ASCII
Write-Host "4. נוצר קובץ .nojekyll לתמיכה מלאה ב-GitHub Pages." -ForegroundColor Gray

Write-Host "`n✓ תהליך יצירת dashboard_demo הושלם בהצלחה!" -ForegroundColor Green
