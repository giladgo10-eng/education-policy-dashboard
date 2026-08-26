# ==============================================================================
# build_distribution_package.ps1
# Builds a standalone portable distribution package (Folder & ZIP) in pure ASCII
# ==============================================================================

[CmdletBinding()]
param(
    [string]$DistDir = ""
)

$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if ([string]::IsNullOrWhiteSpace($Root)) { $Root = ".\09_מערכת_פערי_תקצוב_חינוך" }

if ([string]::IsNullOrWhiteSpace($DistDir)) {
    $DistDir = Join-Path $Root "dist\education_equity_dashboard_package"
}

Write-Host "Building distribution package at: $DistDir" -ForegroundColor Cyan

$AppSource = Join-Path $Root "app"
$DataSource = Join-Path $Root "data"

if (Test-Path $DistDir) {
    Remove-Item -Path $DistDir -Recurse -Force | Out-Null
}
New-Item -ItemType Directory -Path $DistDir -Force | Out-Null

# Copy App files
Copy-Item -Path "$AppSource\*" -Destination $DistDir -Recurse -Force

# Create Double-Click Windows Launcher (.bat)
$batLines = @(
    "@echo off",
    "chcp 65001 > nul",
    "title Education Equity Dashboard",
    "echo Opening Education Equity Dashboard...",
    "start `"`" `"%~dp0index.html`""
)
$batPath = Join-Path $DistDir "Run_Dashboard.bat"
$batLines | Set-Content -Path $batPath -Encoding ASCII

# Copy CSV Master Data
Copy-Item -Path (Join-Path $DataSource "education_equity_master.csv") -Destination (Join-Path $DistDir "education_equity_master_data.csv") -Force

# Create ZIP archive
$DistParent = Split-Path -Parent $DistDir
$ZipFile = Join-Path $DistParent "education_equity_dashboard_package.zip"
if (Test-Path $ZipFile) { Remove-Item $ZipFile -Force }

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($DistDir, $ZipFile)

Write-Host "`nDistribution package created successfully:" -ForegroundColor Green
Write-Host "1. Folder: $DistDir" -ForegroundColor White
Write-Host "2. ZIP file: $ZipFile" -ForegroundColor White
Write-Host "All files ready for distribution!" -ForegroundColor Cyan
