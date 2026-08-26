# ==============================================================================
# build_education_equity_master.ps1
# Pure ASCII PowerShell Data Assembly and Enriched Educational Equity Analytics Engine
# ==============================================================================

[CmdletBinding()]
param(
    [string]$DataDir = ""
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($DataDir)) {
    $DataDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    if ([string]::IsNullOrWhiteSpace($DataDir)) {
        $DataDir = "$PSScriptRoot"
    }
    if ([string]::IsNullOrWhiteSpace($DataDir)) {
        $DataDir = ".\09_מערכת_פערי_תקצוב_חינוך\data"
    }
}

Write-Host "Data directory is: $DataDir" -ForegroundColor Cyan
Write-Host "Loading data sources..." -ForegroundColor Cyan

$specialProfilesFile = Join-Path $DataDir "special_profiles.json"
$configRulesFile = Join-Path $DataDir "config_rules.json"
$dictFile = Join-Path $DataDir "..\..\03_dictionaries\dictionary_authorities.json"

if (!(Test-Path $specialProfilesFile)) {
    throw "Missing special profiles file: $specialProfilesFile"
}

$specialData = Get-Content $specialProfilesFile -Raw -Encoding UTF8 | ConvertFrom-Json
$configData = Get-Content $configRulesFile -Raw -Encoding UTF8 | ConvertFrom-Json

$authoritiesList = @()
$explicitNames = @{}

foreach ($item in $specialData.profiles) {
    $authoritiesList += $item
    $explicitNames[$item.Name] = $true
}

$skipList = @{}
foreach ($s in $configData.skip_names) {
    $skipList[$s] = $true
}

if (Test-Path $dictFile) {
    $dictData = Get-Content $dictFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $autoCode = 2000

    foreach ($item in $dictData.authorities) {
        $name = $item.standard_name
        if ($explicitNames.ContainsKey($name)) { continue }
        if ($skipList.ContainsKey($name)) { continue }

        $autoCode++
        $type = $item.type
        $district = $item.district

        $socio = 5
        $peri = 5
        $pop = 15000
        $nonResFactor = 1.2

        foreach ($dRule in $configData.district_rules) {
            if ($district -match $dRule.match) {
                $socio = [int]$dRule.socio
                $peri = [int]$dRule.peri
                $pop = [int]$dRule.pop
                $nonResFactor = [double]$dRule.factor
                break
            }
        }

        if ($type -match $configData.regional_rule.match) {
            $socio = [Math]::Min(10, $socio + [int]$configData.regional_rule.socio_boost)
            $pop = [int]$configData.regional_rule.pop
            $nonResFactor = [Math]::Max($nonResFactor, [double]$configData.regional_rule.min_factor)
        }

        $pupilsRatio = 0.23
        if ($socio -le 3) { $pupilsRatio = 0.36 }
        elseif ($socio -le 5) { $pupilsRatio = 0.28 }
        $pupils = [int]($pop * $pupilsRatio)

        $nonResArnona = [int]($pop * $nonResFactor)
        $muniSpend = [int](1500 + ($socio * 900) + (($nonResArnona * 1000 / [Math]::Max(1, $pupils)) * 0.35))
        if ($muniSpend -gt 15000) { $muniSpend = 15000 }

        $parentsCoPay = [int](800 + ($socio * 430))
        $govStd = 13800
        $govDiff = [int](1200 + ((11 - $socio) * 750))
        $lostMatching = [int]([Math]::Max(0, (11 - $socio) * 350 - ($muniSpend * 0.15)))

        # Enriched domain metrics
        $specialEdCount = [int]($pupils * (0.07 + ((11 - $socio) * 0.003)))
        $specialEdMuniBurden = [int](5000 + ($socio * 1800) + (($muniSpend / 1000) * 800))
        
        $transportFactor = 1.0
        if ($type -match "אזורית") { $transportFactor = 3.8 }
        elseif ($peri -le 3) { $transportFactor = 2.2 }
        $transportDeficitPupil = [int]((400 + ((11 - $peri) * 120)) * $transportFactor)
        $transportExpenseK = [int](($pupils * ($transportDeficitPupil + 1200)) / 1000)

        $informalEdu = [int](400 + ($socio * 320) + (($muniSpend / 1000) * 110))
        $classroomShortage = [int]([Math]::Max(0, ($pupils / 280) * ((11 - $socio) * 0.6) - ($muniSpend / 800)))
        $gafenBasket = [int](1300 + ((11 - $socio) * 160))

        $authoritiesList += [PSCustomObject]@{
            Code = "$autoCode"
            Name = $name
            Type = $type
            District = $district
            Pop = $pop
            Socio = $socio
            Peri = $peri
            Pupils = $pupils
            NonResArnona = $nonResArnona
            MuniSelfSpendPupil = $muniSpend
            ParentsCoPay = $parentsCoPay
            GovStdPupil = $govStd
            GovDiffPupil = $govDiff
            LostMatching = $lostMatching
            SpecialEdPupils = $specialEdCount
            SpecialEdMuniBurdenPupil = $specialEdMuniBurden
            TransportExpenseK = $transportExpenseK
            TransportDeficitPupil = $transportDeficitPupil
            InformalEduPupil = $informalEdu
            ClassroomShortage = $classroomShortage
            GafenBasketPupil = $gafenBasket
        }
    }
}

Write-Host "Processing metrics for $($authoritiesList.Count) authorities..." -ForegroundColor Green

$MasterList = @()
$TotalAllPupils = 0
$TotalAllSpending = 0

foreach ($item in $authoritiesList) {
    $pupils = [int]$item.Pupils
    $nonResArnonaK = [double]$item.NonResArnona
    $arnonaPerPupil = [math]::Round(($nonResArnonaK * 1000) / [math]::Max(1, $pupils), 0)

    $muniSpend = [double]$item.MuniSelfSpendPupil
    $govStd = [double]$item.GovStdPupil
    $govDiff = [double]$item.GovDiffPupil
    $govTotal = $govStd + $govDiff
    $parentsCoPay = [double]$item.ParentsCoPay
    $lostMatching = [double]$item.LostMatching

    # Enriched fields
    $specialEdPupils = [int]$item.SpecialEdPupils
    if ($specialEdPupils -le 0) { $specialEdPupils = [int]($pupils * 0.08) }
    $specialEdPct = [math]::Round(($specialEdPupils / [math]::Max(1, $pupils)) * 100, 1)

    $specialEdBurden = [double]$item.SpecialEdMuniBurdenPupil
    $transportExpenseK = [double]$item.TransportExpenseK
    $transportDeficitPupil = [double]$item.TransportDeficitPupil
    $informalEduPupil = [double]$item.InformalEduPupil
    $classroomShortage = [int]$item.ClassroomShortage
    $gafenBasketPupil = [double]$item.GafenBasketPupil

    $pupilsPreK = [int]($pupils * 0.18)
    $pupilsPrimary = [int]($pupils * 0.44)
    $pupilsSecondary = [int]($pupils * 0.30)

    $nurtureIndex = [math]::Min(10, [math]::Max(1, 11 - [int]$item.Socio))
    $totalSpendPerPupil = $govTotal + $muniSpend + $parentsCoPay
    $matchingCapacity = [math]::Min(100, [math]::Max(5, [math]::Round(($muniSpend / 120) + ($arnonaPerPupil / 250), 0)))

    $socio = [int]$item.Socio
    $categoryCode = ""

    if ($socio -ge 8 -or ($socio -ge 7 -and $arnonaPerPupil -ge 6500)) {
        $categoryCode = "AFFLUENT_HIGH"
    } elseif ($socio -le 4 -and $arnonaPerPupil -ge 3800) {
        $categoryCode = "PARADOX_LOW_SOCIO_HIGH_ARNONA"
    } elseif ($socio -ge 5 -and $socio -le 7 -and $arnonaPerPupil -lt 5500) {
        $categoryCode = "MIDDLE_TRAP"
    } else {
        $categoryCode = "VULNERABLE_LOCKED"
    }

    $categoryName = $configData.categories.$categoryCode

    $row = [PSCustomObject]@{
        code = [string]$item.Code
        name = [string]$item.Name
        type = [string]$item.Type
        district = [string]$item.District
        population = [int]$item.Pop
        cbs_socio_cluster = $socio
        cbs_periphery_cluster = [int]$item.Peri
        nurture_decile = $nurtureIndex
        total_pupils = $pupils
        pupils_pre_k = $pupilsPreK
        pupils_primary = $pupilsPrimary
        pupils_secondary = $pupilsSecondary
        pupils_special_ed = $specialEdPupils
        special_ed_pct = $specialEdPct
        special_ed_muni_burden_nis = $specialEdBurden
        transport_expense_k_nis = $transportExpenseK
        transport_deficit_per_pupil_nis = $transportDeficitPupil
        informal_edu_per_pupil_nis = $informalEduPupil
        classroom_shortage_units = $classroomShortage
        gafen_basket_per_pupil_nis = $gafenBasketPupil
        non_res_arnona_k_nis = $nonResArnonaK
        arnona_per_pupil_nis = $arnonaPerPupil
        muni_self_spend_per_pupil_nis = $muniSpend
        gov_standard_per_pupil_nis = $govStd
        gov_differential_per_pupil_nis = $govDiff
        gov_total_per_pupil_nis = $govTotal
        parents_co_pay_per_pupil_nis = $parentsCoPay
        lost_matching_per_pupil_nis = $lostMatching
        total_spending_per_pupil_nis = $totalSpendPerPupil
        matching_capacity_score = $matchingCapacity
        equity_category = $categoryName
        equity_category_code = $categoryCode
    }

    $MasterList += $row
    $TotalAllPupils += $pupils
    $TotalAllSpending += ($totalSpendPerPupil * $pupils)
}

$NationalWeightedAvg = [math]::Round($TotalAllSpending / [math]::Max(1, $TotalAllPupils), 0)

Write-Host "National Weighted Average per Pupil: NIS $NationalWeightedAvg" -ForegroundColor Yellow

foreach ($row in $MasterList) {
    $diffPct = [math]::Round((($row.total_spending_per_pupil_nis - $NationalWeightedAvg) / $NationalWeightedAvg) * 100, 1)
    $row | Add-Member -NotePropertyName "national_avg_diff_pct" -NotePropertyValue $diffPct
}

$JsonPath = Join-Path $DataDir "education_equity_master.json"
$MasterList | ConvertTo-Json -Depth 5 | Set-Content -Path $JsonPath -Encoding UTF8
Write-Host "Created JSON: $JsonPath" -ForegroundColor Green

$CsvPath = Join-Path $DataDir "education_equity_master.csv"
$MasterList | Export-Csv -Path $CsvPath -NoTypeInformation -Encoding UTF8
Write-Host "Created CSV: $CsvPath" -ForegroundColor Green

$categoryCounts = $MasterList | Group-Object equity_category
Write-Host "`nBreakdown by Equity Category:" -ForegroundColor Cyan
foreach ($group in $categoryCounts) {
    Write-Host "$($group.Name): $($group.Count) authorities" -ForegroundColor White
}

Write-Host "`nData Pipeline execution completed successfully!" -ForegroundColor Green
