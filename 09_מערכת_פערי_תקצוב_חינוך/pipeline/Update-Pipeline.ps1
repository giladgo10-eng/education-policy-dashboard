# ==============================================================================
# Update-Pipeline.ps1
# Production Automated Update & Rebuild Pipeline Orchestrator
# Methodology v1.0 — Baseline 2024
# ==============================================================================

[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet("DryRun", "Snapshot", "Validate", "Diff", "Rebuild", "Rollback", "Help")]
    [string]$Action = "DryRun",

    [Parameter(Position = 1)]
    [string]$TargetFile = "",

    [Parameter(Position = 2)]
    [string]$Tag = ""
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
if ([string]::IsNullOrWhiteSpace($ProjectRoot)) { $ProjectRoot = "." }

$CscPath = "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
$PipelineCs = Join-Path $ScriptDir "PipelineEngine.cs"
$PipelineExe = Join-Path $ScriptDir "PipelineEngine.exe"

Write-Host "=========================================================================================================" -ForegroundColor Cyan
Write-Host "EDUCATION EQUITY DATA UPDATE PIPELINE" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot" -ForegroundColor DarkCyan
Write-Host "Action:       $Action" -ForegroundColor DarkCyan
Write-Host "=========================================================================================================`n" -ForegroundColor Cyan

# 1. Compile Pipeline Engine if needed
if (!(Test-Path $PipelineExe) -or ((Get-Item $PipelineCs).LastWriteTime -gt (Get-Item $PipelineExe).LastWriteTime)) {
    Write-Host "Compiling PipelineEngine.cs..." -ForegroundColor Yellow
    & $CscPath /nologo /codepage:65001 /r:System.Web.Extensions.dll /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /out:"$PipelineExe" "$PipelineCs"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to compile PipelineEngine.cs"
    }
    Write-Host "Compiled PipelineEngine.exe successfully.`n" -ForegroundColor Green
}

# 2. Execute Action
switch ($Action) {
    "DryRun" {
        Write-Host "Running Pipeline Dry-Run Simulation..." -ForegroundColor Yellow
        & $PipelineExe dryrun
    }
    "Snapshot" {
        $snapTag = if ([string]::IsNullOrWhiteSpace($Tag)) { "USER_MANUAL" } else { $Tag }
        & $PipelineExe snapshot $snapTag
    }
    "Validate" {
        $fileToVal = if ([string]::IsNullOrWhiteSpace($TargetFile)) { Join-Path $ProjectRoot "data\education_equity_master.json" } else { $TargetFile }
        & $PipelineExe validate "$fileToVal"
    }
    "Diff" {
        $fileToDiff = if ([string]::IsNullOrWhiteSpace($TargetFile)) { Join-Path $ProjectRoot "data\education_equity_master.json" } else { $TargetFile }
        & $PipelineExe diff "$fileToDiff"
    }
    "Rebuild" {
        & $PipelineExe rebuild
    }
    "Rollback" {
        & $PipelineExe rollback "$TargetFile"
    }
    "Help" {
        & $PipelineExe help
    }
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Pipeline action '$Action' returned exit code $LASTEXITCODE." -ForegroundColor Red
    exit $LASTEXITCODE
} else {
    Write-Host "`n[SUCCESS] Pipeline action '$Action' completed successfully." -ForegroundColor Green
}
