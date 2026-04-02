# 启动 Next.js dev server（清理 lock、释放 3000 端口），并做一次健康检查。
# 使用方式：
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-dev.ps1

$ErrorActionPreference = 'Continue'

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
Set-Location $projectRoot

$lock = Join-Path $projectRoot '.next/dev/lock'
if (Test-Path $lock) {
  Remove-Item -Force $lock -ErrorAction SilentlyContinue
}

# 释放端口 3000
try {
  $conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -ne $conn) {
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
  }
} catch {
  # ignore
}

Write-Host "Starting dev server on http://localhost:3000 ..." -ForegroundColor Cyan

# Windows 下 npm 实际是 npm.cmd；直接用 cmd.exe 启动更稳。
$p = Start-Process -WorkingDirectory $projectRoot -FilePath 'cmd.exe' -ArgumentList @('/c', 'npm run dev -- -p 3000') -WindowStyle Minimized -PassThru

# 轮询首页直到可用（最多 30 秒）
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    $r = Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 'http://localhost:3000/'
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 500) {
      $ok = $true
      break
    }
  } catch {
    Start-Sleep -Seconds 1
  }
}

if ($ok) {
  Write-Host "dev server ready (pid=$($p.Id))" -ForegroundColor Green
  exit 0
} else {
  Write-Host "dev server not ready yet (pid=$($p.Id))" -ForegroundColor Yellow
  exit 1
}
