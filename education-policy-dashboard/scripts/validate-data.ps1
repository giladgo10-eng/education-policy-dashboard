# PowerShell Data Validation Script for education-policy-dashboard

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$dataDir = Join-Path $projectDir "data"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Running Data Validation for education-policy-dashboard   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$filesToCheck = @(
    "sources.json",
    "parties.json",
    "issues.json",
    "positions.json",
    "commitments.json",
    "execution.json",
    "budgets.json",
    "education-system.json"
)

$errors = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()
$dataStore = @{}

# 1. Parse JSON files
foreach ($file in $filesToCheck) {
    $filePath = Join-Path $dataDir $file
    if (-not (Test-Path $filePath)) {
        $errors.Add("Missing file: $file")
        continue
    }
    try {
        $raw = Get-Content -Path $filePath -Raw -Encoding UTF8
        $json = ConvertFrom-Json -InputObject $raw
        $dataStore[$file] = $json
        Write-Host " [PASS] $file loaded successfully" -ForegroundColor Green
    }
    catch {
        $errors.Add("JSON syntax error in $file : $($_.Exception.Message)")
    }
}

if ($errors.Count -gt 0) {
    Write-Host "`nCritical load errors:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

# 2. Extract valid source IDs
$validSourceIds = [System.Collections.Generic.HashSet[string]]::new()
if ($dataStore["sources.json"].sources) {
    foreach ($src in $dataStore["sources.json"].sources) {
        if ($src.id) {
            [void]$validSourceIds.Add($src.id)
        }
    }
}
Write-Host "`nIndexed $($validSourceIds.Count) valid sources from sources.json" -ForegroundColor DarkCyan

# 3. Check records for source grounding, verificationLevel, confidenceLevel, and epistemic separation
$groups = @(
    @{ file = "positions.json"; items = $dataStore["positions.json"].positions; label = "Positions" },
    @{ file = "commitments.json"; items = $dataStore["commitments.json"].commitments; label = "Commitments" },
    @{ file = "execution.json"; items = $dataStore["execution.json"].executionRecords; label = "Execution Records" },
    @{ file = "budgets.json"; items = $dataStore["budgets.json"].budgetLines; label = "Budget Lines" },
    @{ file = "education-system.json"; items = $dataStore["education-system.json"].systemIndicators; label = "System Indicators" }
)

foreach ($g in $groups) {
    $fName = $g.file
    $items = $g.items
    $lbl = $g.label

    Write-Host "`nValidating $lbl ($fName)..." -ForegroundColor Yellow

    foreach ($item in $items) {
        $id = $item.id

        # Determine if this record explicitly states absence of stance or claim (not_stated / not_available)
        $isNotStated = ($item.stance -eq "not_stated") -or ($item.status -eq "not_available")

        # Source ID check: All factual claims/positions/commitments require a valid sourceId.
        # Exception: when explicitly marked as not_stated / not_available with no factual assertion.
        if ([string]::IsNullOrWhiteSpace($item.sourceId)) {
            if (-not $isNotStated) {
                $errors.Add("[$fName | $id] Missing required sourceId for factual assertion/position")
            } else {
                $tagVal = if ($item.stance) { $item.stance } else { $item.status }
                $warnings.Add("[$fName | $id] Record is marked '$tagVal' with no sourceId (allowed by epistemic rules)")
            }
        } elseif (-not $validSourceIds.Contains($item.sourceId)) {
            $errors.Add("[$fName | $id] Foreign key error: sourceId '$($item.sourceId)' does not exist in sources.json")
        }

        # Verification level check
        if ([string]::IsNullOrWhiteSpace($item.verificationLevel)) {
            if (-not $isNotStated) {
                $errors.Add("[$fName | $id] Missing verificationLevel")
            }
        }

        # Confidence level check
        if ([string]::IsNullOrWhiteSpace($item.confidenceLevel)) {
            if (-not $isNotStated) {
                $errors.Add("[$fName | $id] Missing confidenceLevel")
            }
        }

        # Epistemic separation checks
        if ($item.analysis) {
            if ($item.analysis.epistemicType -ne "analysis") {
                $errors.Add("[$fName | $id] analysis block must have epistemicType='analysis'")
            }
        }
        if ($item.assessment) {
            if ($item.assessment.epistemicType -ne "assessment") {
                $errors.Add("[$fName | $id] assessment block must have epistemicType='assessment'")
            }
        }
    }
}

Write-Host "`n----------------------------------------------------------"
if ($errors.Count -eq 0) {
    Write-Host "All validation tests PASSED successfully! (0 errors)" -ForegroundColor Green
    exit 0
} else {
    Write-Host "Found $($errors.Count) validation errors:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host " [FAIL] $_" -ForegroundColor Red }
    exit 1
}
