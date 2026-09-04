# PowerShell Data Validation Script for education-policy-dashboard (Budget Model V2 + Municipal Lens)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$dataDir = Join-Path $projectDir "data"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Running Data Validation for education-policy-dashboard   " -ForegroundColor Cyan
Write-Host " (Budget Model V2 + Municipal Lens Enabled)               " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$filesToCheck = @(
    "sources.json",
    "parties.json",
    "issues.json",
    "positions.json",
    "commitments.json",
    "execution.json",
    "budgets.json",
    "education-system.json",
    "professional-entities.json",
    "union-positions.json"
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
    Write-Host ""
    Write-Host "Critical load errors:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    exit 1
}

# 2. Extract valid IDs for Foreign Key checks
$validSourceIds = [System.Collections.Generic.HashSet[string]]::new()
if ($dataStore["sources.json"].sources) {
    foreach ($src in $dataStore["sources.json"].sources) {
        if ($src.id) { [void]$validSourceIds.Add($src.id) }
    }
}
Write-Host ""
Write-Host "Indexed $($validSourceIds.Count) valid sources from sources.json" -ForegroundColor DarkCyan

$validPartyIds = [System.Collections.Generic.HashSet[string]]::new()
if ($dataStore["parties.json"].parties) {
    foreach ($pty in $dataStore["parties.json"].parties) {
        if ($pty.id) { [void]$validPartyIds.Add($pty.id) }
    }
}
Write-Host "Indexed $($validPartyIds.Count) valid parties from parties.json" -ForegroundColor DarkCyan

$validIssueIds = [System.Collections.Generic.HashSet[string]]::new()
if ($dataStore["issues.json"].issues) {
    foreach ($iss in $dataStore["issues.json"].issues) {
        if ($iss.id) { [void]$validIssueIds.Add($iss.id) }
    }
}
Write-Host "Indexed $($validIssueIds.Count) valid issues from issues.json" -ForegroundColor DarkCyan

$validCommitmentIds = [System.Collections.Generic.HashSet[string]]::new()
if ($dataStore["commitments.json"].commitments) {
    foreach ($com in $dataStore["commitments.json"].commitments) {
        if ($com.id) { [void]$validCommitmentIds.Add($com.id) }
    }
}
Write-Host "Indexed $($validCommitmentIds.Count) valid commitments from commitments.json" -ForegroundColor DarkCyan

$validEntityIds = [System.Collections.Generic.HashSet[string]]::new()
if ($dataStore["professional-entities.json"].entities) {
    foreach ($ent in $dataStore["professional-entities.json"].entities) {
        if ($ent.id) { [void]$validEntityIds.Add($ent.id) }
    }
}
Write-Host "Indexed $($validEntityIds.Count) valid professional entities from professional-entities.json" -ForegroundColor DarkCyan

# 3. Check records
$groups = @(
    @{ file = "positions.json"; items = $dataStore["positions.json"].positions; label = "Positions" },
    @{ file = "commitments.json"; items = $dataStore["commitments.json"].commitments; label = "Commitments" },
    @{ file = "execution.json"; items = $dataStore["execution.json"].executionRecords; label = "Execution Records" },
    @{ file = "budgets.json"; items = $dataStore["budgets.json"].budgetLines; label = "Budget Lines" },
    @{ file = "education-system.json"; items = $dataStore["education-system.json"].systemIndicators; label = "System Indicators" },
    @{ file = "union-positions.json"; items = $dataStore["union-positions.json"].positions; label = "Union Positions (Professional Entities)" }
)

foreach ($g in $groups) {
    $fName = $g.file
    $items = $g.items
    $lbl = $g.label

    Write-Host ""
    Write-Host "Validating $lbl ($fName)..." -ForegroundColor Yellow

    foreach ($item in $items) {
        $id = $item.id

        $isNotStated = ($item.stance -eq "not_stated") -or ($item.status -eq "not_available")

        # Source ID check
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

        # PartyId check
        if ($item.partyId) {
            if (-not $validPartyIds.Contains($item.partyId)) {
                $errors.Add("[$fName | $id] Foreign key error: partyId '$($item.partyId)' does not exist in parties.json")
            }
        }
        if ($item.partyIds) {
            foreach ($partyRef in $item.partyIds) {
                if (-not $validPartyIds.Contains($partyRef)) {
                    $errors.Add("[$fName | $id] Foreign key error: partyId '$partyRef' does not exist in parties.json")
                }
            }
        }

        # EntityId check (for professional entities)
        if ($item.entityId) {
            if (-not $validEntityIds.Contains($item.entityId)) {
                $errors.Add("[$fName | $id] Foreign key error: entityId '$($item.entityId)' does not exist in professional-entities.json")
            }
        }

        # IssueId check
        if ($item.issueId) {
            if (-not $validIssueIds.Contains($item.issueId)) {
                $errors.Add("[$fName | $id] Foreign key error: issueId '$($item.issueId)' does not exist in issues.json")
            }
        }

        # CommitmentId check
        if ($item.commitmentId) {
            if (-not $validCommitmentIds.Contains($item.commitmentId)) {
                $errors.Add("[$fName | $id] Foreign key error: commitmentId '$($item.commitmentId)' does not exist in commitments.json")
            }
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

        # Policy Comparison tier check (for union positions / policy evaluations)
        if ($item.policyComparison) {
            $allowedTiers = @("precedence", "alignment", "documented_influence", "divergence", "not_applicable")
            if ($item.policyComparison.comparisonTier -notin $allowedTiers) {
                $errors.Add("[$fName | $id] Invalid comparisonTier '$($item.policyComparison.comparisonTier)'")
            }
            if ($item.policyComparison.comparisonTier -eq "documented_influence" -and [string]::IsNullOrWhiteSpace($item.policyComparison.evidenceDetails)) {
                $errors.Add("[$fName | $id] Epistemic violation: 'documented_influence' requires non-empty evidenceDetails")
            }
        }

        # Municipal Impact Analysis Check (when present in positions or commitments)
        if ($item.municipalImpactAnalysis) {
            $mia = $item.municipalImpactAnalysis
            $hasCurrentState = -not [string]::IsNullOrWhiteSpace($mia.currentState)
            
            if ($hasCurrentState) {
                if ([string]::IsNullOrWhiteSpace($mia.currentStateSourceId)) {
                    # Explicitly allowed: marked as unverified / pending source verification
                    $warnings.Add("[$fName | $id] Municipal Lens: currentStateSourceId is null (SOURCE VERIFICATION REQUIRED)")
                } elseif (-not $validSourceIds.Contains($mia.currentStateSourceId)) {
                    $errors.Add("[$fName | $id] Municipal Lens Foreign key error: currentStateSourceId '$($mia.currentStateSourceId)' does not exist in sources.json")
                }
            }

            # Check changeMagnitude enum
            $allowedMagnitudes = @("continuation", "moderate_change", "significant_change", "structural_change", "undetermined")
            if ($mia.changeMagnitude -and ($mia.changeMagnitude -notin $allowedMagnitudes)) {
                $errors.Add("[$fName | $id] Invalid changeMagnitude '$($mia.changeMagnitude)'")
            }
        }

        # Budget Model V2 Assertions
        if ($fName -in @("commitments.json", "execution.json", "budgets.json")) {
            if ([string]::IsNullOrWhiteSpace($item.budgetEntity)) {
                $errors.Add("[$fName | $id] Budget Model V2 violation: Missing required 'budgetEntity'")
            }

            if ([string]::IsNullOrWhiteSpace($item.budgetType)) {
                $errors.Add("[$fName | $id] Budget Model V2 violation: Missing required 'budgetType'")
            }

            $hasYear = ($null -ne $item.budgetYear) -or ($null -ne $item.year)
            if (-not $hasYear) {
                $errors.Add("[$fName | $id] Budget Model V2 violation: Missing budgetYear/year for financial record")
            }

            $allowedStatus = @("comparable", "partially_comparable", "not_comparable")
            if ($item.comparabilityStatus -and ($item.comparabilityStatus -notin $allowedStatus)) {
                $errors.Add("[$fName | $id] Invalid comparabilityStatus '$($item.comparabilityStatus)'")
            }

            if ($item.comparabilityStatus -eq "not_comparable" -and $null -ne $item.completionPercentage) {
                $errors.Add("[$fName | $id] Rule violation: completionPercentage must be null when comparabilityStatus is 'not_comparable'")
            }

            if ($item.budgetType -eq "baseline" -and ($null -ne $item.allocatedBudgetNIS -or $null -ne $item.actualSpendingNIS)) {
                $errors.Add("[$fName | $id] Rule violation: baseline record cannot have allocatedBudgetNIS or actualSpendingNIS set")
            }
        }
    }
}

# 4. Validate Staging Files (Dual-Notebook Staging Architecture)
$stagingDir = Join-Path $projectDir "staging"
if (Test-Path $stagingDir) {
    Write-Host ""
    Write-Host "Validating Staging Layer (Dual-Notebook Architecture)..." -ForegroundColor Yellow

    $stagingFiles = Get-ChildItem -Path $stagingDir -Recurse -Filter "*.json"
    Write-Host "Found $($stagingFiles.Count) staging batch files" -ForegroundColor DarkCyan

    foreach ($sFile in $stagingFiles) {
        $relPath = $sFile.FullName.Substring($projectDir.Length + 1)
        try {
            $sRaw = Get-Content -Path $sFile.FullName -Raw -Encoding UTF8
            $sJson = ConvertFrom-Json -InputObject $sRaw

            $nbScope = $sJson.stagingMetadata.researchNotebook
            $isPlatformsDir = $sFile.FullName -like "*party-platforms*"
            $isGovExecDir = $sFile.FullName -like "*government-policy-execution*"

            if ($isPlatformsDir -and $nbScope -ne "party_platforms") {
                $errors.Add("[$relPath] Directory mismatch: file in 'party-platforms' must have researchNotebook='party_platforms'")
            }
            if ($isGovExecDir -and $nbScope -ne "government_policy_execution") {
                $errors.Add("[$relPath] Directory mismatch: file in 'government-policy-execution' must have researchNotebook='government_policy_execution'")
            }

            if ($sJson.records) {
                foreach ($rec in $sJson.records) {
                    $rId = $rec.recordId
                    $cType = $rec.claimType

                    # Rule: party_position belongs to party_platforms
                    if ($nbScope -eq "government_policy_execution" -and $cType -eq "party_position") {
                        $errors.Add("[$relPath | $rId] Classification error: 'party_position' cannot originate from government_policy_execution notebook")
                    }

                    # Rule: actual_execution / budget_allocation belongs to government_policy_execution
                    if ($nbScope -eq "party_platforms" -and ($cType -in @("actual_execution", "budget_allocation", "coalition_commitment", "government_policy", "current_state"))) {
                        $errors.Add("[$relPath | $rId] Classification error: '$cType' cannot originate from party_platforms notebook")
                    }

                    # Rule: Promotion without source backing or with claimVerified=false
                    if ($rec.eligibleForPromotion -eq $true) {
                        if ($rec.claimVerified -ne $true) {
                            $errors.Add("[$relPath | $rId] Promotion violation: cannot be marked eligibleForPromotion when claimVerified is not true")
                        }
                        if ([string]::IsNullOrWhiteSpace($rec.sourceTitle) -and [string]::IsNullOrWhiteSpace($rec.sourceId)) {
                            $errors.Add("[$relPath | $rId] Promotion violation: missing source backing (sourceTitle or sourceId required)")
                        }
                    }
                }
            }
            Write-Host " [PASS] $relPath passed staging integrity checks" -ForegroundColor Green
        }
        catch {
            $errors.Add("[$relPath] Staging JSON syntax/parse error: $($_.Exception.Message)")
        }
    }
}

Write-Host ""
Write-Host "----------------------------------------------------------"
if ($errors.Count -eq 0) {
    Write-Host "All validation tests PASSED successfully! (0 errors)" -ForegroundColor Green
    if ($warnings.Count -gt 0) {
        Write-Host "Notice: $($warnings.Count) informational items / unverified sources flagged:" -ForegroundColor Yellow
        $warnings | ForEach-Object { Write-Host " [NOTICE] $_" -ForegroundColor Yellow }
    }
    exit 0
} else {
    Write-Host "Found $($errors.Count) validation errors:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host " [FAIL] $_" -ForegroundColor Red }
    exit 1
}
