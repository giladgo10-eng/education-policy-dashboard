# ==============================================================================
# export_app_bundle.ps1
# Prepares data and libs for standalone local browser execution
# ==============================================================================

[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = ".\09_מערכת_פערי_תקצוב_חינוך" }

$DataFile = Join-Path $Root "data\education_equity_master.json"
$AppDir = Join-Path $Root "app"
$AppLibsDir = Join-Path $AppDir "libs"
$AppDataDir = Join-Path $AppDir "data"

if (!(Test-Path $AppLibsDir)) { New-Item -ItemType Directory -Path $AppLibsDir -Force | Out-Null }
if (!(Test-Path $AppDataDir)) { New-Item -ItemType Directory -Path $AppDataDir -Force | Out-Null }

# Copy XLSX lib from existing 04_app
$sourceLib = Join-Path $Root "..\04_app\libs\xlsx.full.min.js"
if (Test-Path $sourceLib) {
    Copy-Item $sourceLib -Destination (Join-Path $AppLibsDir "xlsx.full.min.js") -Force
    Write-Host "Copied xlsx.full.min.js" -ForegroundColor Green
}

# Convert JSON to window.EDUCATION_EQUITY_DATA JS file for direct file:// loading
if (Test-Path $DataFile) {
    $jsonContent = Get-Content $DataFile -Raw -Encoding UTF8
    $jsContent = "window.EDUCATION_EQUITY_DATA = " + $jsonContent + ";"
    $targetJs = Join-Path $AppDataDir "master_data.js"
    Set-Content -Path $targetJs -Value $jsContent -Encoding UTF8
    Write-Host "Generated data\master_data.js successfully!" -ForegroundColor Green
}

Write-Host "App bundle preparation complete." -ForegroundColor Green
