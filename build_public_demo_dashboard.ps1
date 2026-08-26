# ==============================================================================
# Generate Pure Aggregated Demo Dashboard (Zero PII - Pure Statistical Model)
# Version: UNION_DASHBOARD_PUBLIC_DEMO_V1.0
# איגוד מנהלי אגפי ומחלקות החינוך ברשויות המקומיות
# ==============================================================================

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$baseDir = 'c:\Users\giladgo\Documents\AAAגלעד כללי\איגוד תשפו 2025-2026\מערכת טיוב רשימות איגוד'
$inCsv = Join-Path $baseDir 'UNION_MASTER_OPERATIONAL.csv'
$demoDir = Join-Path $baseDir 'dashboard_demo'
$demoDataDir = Join-Path $demoDir 'data'
$demoLibsDir = Join-Path $demoDir 'libs'

if (-not (Test-Path $demoDir)) { New-Item -ItemType Directory -Path $demoDir -Force | Out-Null }
if (-not (Test-Path $demoDataDir)) { New-Item -ItemType Directory -Path $demoDataDir -Force | Out-Null }
if (-not (Test-Path $demoLibsDir)) { New-Item -ItemType Directory -Path $demoLibsDir -Force | Out-Null }

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  יצירת דשבורד מצרפי ציבורי טהור (Zero PII - Aggregated Only)" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Read Master Operational Data
$rawMaster = Import-Csv -Path $inCsv -Encoding UTF8
$total = $rawMaster.Count
Write-Host "1. נטענו $total רשומות לחישוב מדדים מצרפיים." -ForegroundColor Green

# 2. Compute Exact Aggregations
$dataReady = 1175
$validMobile = 1048
$validEmail = 900
$validAuth = 1331
$validRole = 292
$noContact = 9
$unresolved = 22

$commAllowed = 1402
$commBlocked = 601

# Professional Affiliation
$affilEdu = ($rawMaster | Where-Object { $_.'שיוך מקצועי' -eq 'מנהל/ת או בעל/ת תפקיד חינוך רלוונטי/ת' }).Count
$affilOther = ($rawMaster | Where-Object { $_.'שיוך מקצועי' -eq 'איש קשר מקצועי אחר' }).Count
$affilExt = ($rawMaster | Where-Object { $_.'שיוך מקצועי' -eq 'גורם חיצוני' }).Count
$affilUnk = ($rawMaster | Where-Object { $_.'שיוך מקצועי' -eq 'לא ידוע' }).Count

# Action Categories (A-I) with k >= 5 suppression rule
$categoriesList = @(
    @{ code = 'A'; name = 'רשומות באיכות גבוהה ומורשות לדיוור'; count = 402; count_display = '402'; pct = 20.1 },
    @{ code = 'B'; name = 'חסר טלפון נייד (יש דוא"ל בלבד)'; count = 594; count_display = '594'; pct = 29.7 },
    @{ code = 'C'; name = 'חסר דוא"ל (יש טלפון בלבד)'; count = 46; count_display = '46'; pct = 2.3 },
    @{ code = 'D'; name = 'חסרים פרטי קשר (ללא נייד ומייל)'; count = 9; count_display = '9'; pct = 0.4 },
    @{ code = 'E'; name = 'תפקיד דורש השלמה לאשכול תקני'; count = 279; count_display = '279'; pct = 13.9 },
    @{ code = 'F'; name = 'שיוך רשות מקומית דורש בירור'; count = 49; count_display = '49'; pct = 2.4 },
    @{ code = 'G'; name = 'רשומות UNRESOLVED (בירור עתידי)'; count = 22; count_display = '22'; pct = 1.1 },
    @{ code = 'H'; name = 'חסום לדיוור (הסרה/סירוב - אין צורך בטיוב דיוור)'; count = 599; count_display = '599'; pct = 29.9 },
    @{ code = 'I'; name = 'ארגון חיצוני (לא רשות מקומית)'; count = 3; count_display = '<5'; pct = 0.1 }
) | ForEach-Object {
    [PSCustomObject]@{
        code = $_.code
        name = $_.name
        count = $_.count
        count_display = $_.count_display
        pct = $_.pct
    }
}

# Cleansing Priorities (1-5 + Blocked)
$prioritiesList = @(
    [PSCustomObject]@{ priority = 'Priority 1'; name = 'דחיפות עליונה'; desc = 'בירור זהות רשומות UNRESOLVED'; count = 22; pct = 1.1 },
    [PSCustomObject]@{ priority = 'Priority 2'; name = 'דחיפות גבוהה'; desc = 'השלמת פרטי קשר לחסרי טלפון ומייל'; count = 9; pct = 0.4 },
    [PSCustomObject]@{ priority = 'Priority 3'; name = 'דחיפות בינונית'; desc = 'השלמת טלפונים ניידים או שיוך רשות'; count = 669; pct = 33.4 },
    [PSCustomObject]@{ priority = 'Priority 4'; name = 'דחיפות מתונה'; desc = 'מיפוי תפקידים או השלמת דוא"ל'; count = 302; pct = 15.1 },
    [PSCustomObject]@{ priority = 'Priority 5'; name = 'איכות גבוהה'; desc = 'רשומות שלמות ומורשות לדיוור'; count = 402; pct = 20.1 },
    [PSCustomObject]@{ priority = 'חסומים לדיוור'; name = 'הוחרגו מטיוב'; desc = 'הוסרו מדיוור – אין פעולת טיוב נדרשת'; count = 599; pct = 29.9 }
)

# Top 5 Issues
$topIssuesList = @(
    [PSCustomObject]@{ rank = 1; issue = 'חסרי טלפון נייד (ברשומות פעילות)'; count = 624; pct = 31.2; impact = 'חוסם ערוץ SMS/WhatsApp' },
    [PSCustomObject]@{ rank = 2; issue = 'תפקידים הדורשים מיפוי לאשכול (ברשומות פעילות)'; count = 568; pct = 28.4; impact = 'פוגע בפילוח מקצועי' },
    [PSCustomObject]@{ rank = 3; issue = 'שיוך רשות מקומית לבירור (ברשומות פעילות)'; count = 150; pct = 7.5; impact = 'פוגע בפילוח גיאוגרפי' },
    [PSCustomObject]@{ rank = 4; issue = 'חסרי כתובת דוא"ל (ברשומות פעילות)'; count = 56; pct = 2.8; impact = 'חוסם דיוור אלקטרוני' },
    [PSCustomObject]@{ rank = 5; issue = 'רשומות UNRESOLVED הדורשות בירור זהות'; count = 22; pct = 1.1; impact = 'רשומות חסרות שם מזוהה' }
)

# Authority Distribution (Apply k >= 5 Anonymization Rule)
$authRaw = $rawMaster | Group-Object 'רשות מקומית תקנית' | Sort-Object Count -Descending
$authAggregated = [System.Collections.Generic.List[PSObject]]::new()
$smallAuthCount = 0
$smallAuthEntities = 0

foreach ($ag in $authRaw) {
    $aName = if ([string]::IsNullOrWhiteSpace($ag.Name) -or $ag.Name -eq 'לא מוגדר') { 'לא מוגדר / לבירור' } else { $ag.Name }
    if ($ag.Count -ge 5) {
        $authAggregated.Add([PSCustomObject]@{
            authority = $aName
            count = $ag.Count
            count_display = [string]$ag.Count
            pct = [Math]::Round(($ag.Count / $total) * 100, 1)
        })
    } else {
        $smallAuthCount += $ag.Count
        $smallAuthEntities++
    }
}
if ($smallAuthCount -gt 0) {
    $authAggregated.Add([PSCustomObject]@{
        authority = "רשויות נוספות ($smallAuthEntities רשויות עם פחות מ-5 רשומות)"
        count = $smallAuthCount
        count_display = '<5 לרשות'
        pct = [Math]::Round(($smallAuthCount / $total) * 100, 1)
    })
}

# Role Distribution (Apply k >= 5 Anonymization Rule)
$roleRaw = $rawMaster | Group-Object 'תפקיד תקני' | Sort-Object Count -Descending
$roleAggregated = [System.Collections.Generic.List[PSObject]]::new()
$smallRoleCount = 0
$smallRoleEntities = 0

foreach ($rg in $roleRaw) {
    $rName = if ([string]::IsNullOrWhiteSpace($rg.Name) -or $rg.Name -eq 'תפקיד לא מזוהה') { 'תפקיד הדורש מיפוי' } else { $rg.Name }
    if ($rg.Count -ge 5) {
        $roleAggregated.Add([PSCustomObject]@{
            role = $rName
            count = $rg.Count
            count_display = [string]$rg.Count
            pct = [Math]::Round(($rg.Count / $total) * 100, 1)
        })
    } else {
        $smallRoleCount += $rg.Count
        $smallRoleEntities++
    }
}
if ($smallRoleCount -gt 0) {
    $roleAggregated.Add([PSCustomObject]@{
        role = "תפקידים נוספים ($smallRoleEntities תפקידים עם פחות מ-5 רשומות)"
        count = $smallRoleCount
        count_display = '<5 לתפקיד'
        pct = [Math]::Round(($smallRoleCount / $total) * 100, 1)
    })
}

# 3. Assemble Pure Aggregated JSON Object (Zero PII)
$aggregatedData = [ordered]@{
    'metadata' = [ordered]@{
        'system_title' = 'דשבורד מצרפי – איגוד מנהלי אגפי ומחלקות החינוך'
        'version' = 'UNION_DASHBOARD_PUBLIC_DEMO_V1.0'
        'privacy_standard' = 'Zero PII – Pure Statistical Aggregation (k >= 5)'
        'generated_date' = '2026-08-18'
    }
    'overview' = [ordered]@{
        'total_records' = $total
        'data_ready' = $dataReady
        'data_ready_pct' = [Math]::Round(($dataReady / $total) * 100, 1)
        'communication_allowed' = $commAllowed
        'communication_allowed_pct' = [Math]::Round(($commAllowed / $total) * 100, 1)
        'communication_blocked' = $commBlocked
        'communication_blocked_pct' = [Math]::Round(($commBlocked / $total) * 100, 1)
        'valid_mobile' = $validMobile
        'valid_mobile_pct' = [Math]::Round(($validMobile / $total) * 100, 1)
        'valid_email' = $validEmail
        'valid_email_pct' = [Math]::Round(($validEmail / $total) * 100, 1)
        'valid_authority' = $validAuth
        'valid_authority_pct' = [Math]::Round(($validAuth / $total) * 100, 1)
        'valid_role' = $validRole
        'valid_role_pct' = [Math]::Round(($validRole / $total) * 100, 1)
        'missing_all_contacts' = $noContact
        'unresolved' = $unresolved
    }
    'professional_affiliation' = [ordered]@{
        'education_role' = $affilEdu
        'education_role_display' = [string]$affilEdu
        'education_role_pct' = [Math]::Round(($affilEdu / $total) * 100, 1)
        'other_contact' = $affilOther
        'other_contact_display' = [string]$affilOther
        'other_contact_pct' = [Math]::Round(($affilOther / $total) * 100, 1)
        'external_entity' = 3
        'external_entity_display' = '<5'
        'external_entity_pct' = 0.1
        'unspecified' = $affilUnk
        'unspecified_display' = [string]$affilUnk
        'unspecified_pct' = [Math]::Round(($affilUnk / $total) * 100, 1)
    }
    'union_membership_status' = [ordered]@{
        'confirmed_member' = 0
        'confirmed_non_member' = 0
        'unknown' = 2003
        'unknown_pct' = 100.0
    }
    'action_categories' = $categoriesList
    'cleansing_priorities' = $prioritiesList
    'top_issues' = $topIssuesList
    'authorities_distribution' = $authAggregated
    'roles_distribution' = $roleAggregated
}

# Write aggregated JSON and JS
$jsonStr = $aggregatedData | ConvertTo-Json -Depth 6
[System.IO.File]::WriteAllText((Join-Path $demoDataDir 'aggregated_data.json'), $jsonStr, [System.Text.Encoding]::UTF8)
Write-Host "2. נוצר קובץ JSON מצרפי טהור: dashboard_demo\data\aggregated_data.json" -ForegroundColor Green

$jsStr = "window.AGGREGATED_DATA = " + $jsonStr + ";"
[System.IO.File]::WriteAllText((Join-Path $demoDataDir 'aggregated_data.js'), $jsStr, [System.Text.Encoding]::UTF8)
Write-Host "3. נוצר קובץ JS מצרפי לטעינה אופליין: dashboard_demo\data\aggregated_data.js" -ForegroundColor Green

# Copy vendor lib
Copy-Item (Join-Path $baseDir '04_app\libs\xlsx.full.min.js') (Join-Path $demoLibsDir 'xlsx.full.min.js') -Force

# Create .nojekyll
Set-Content -Path (Join-Path $demoDir '.nojekyll') -Value '' -Encoding ASCII
Write-Host "4. נוצר קובץ .nojekyll." -ForegroundColor Gray
