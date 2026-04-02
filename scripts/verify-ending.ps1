<#
Verify the ending block format returned by /api/write/mock.

Usage:
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/verify-ending.ps1
#>

$ErrorActionPreference = 'Stop'

# Use mock endpoint so it does not require OPENAI_API_KEY
$uri = 'http://127.0.0.1:3000/api/write/mock'

$payloadObj = @{
  direction = 'Test: keep a strong suspense at the end'
  extra     = 'Follow the strict ending format'
}

$payload = $payloadObj | ConvertTo-Json -Compress

Write-Host "POST $uri" -ForegroundColor Cyan

$res = Invoke-WebRequest -Method Post -Uri $uri -ContentType 'application/json' -Body $payload -TimeoutSec 180

# Read full response (non-streaming). Enough to validate the final tail format.
$out = $res.Content -replace "`r", ""

# New spec:
#   【下集预告】
#   <hook line, 1-120 chars>
#
#   <cta line, 1-120 chars, must NOT be wrapped by Chinese parentheses>
$regex = '【下集预告】\n[^\n]{1,120}\n\n(?!（)[^\n]{1,120}(?<!）)\s*$'
$ok = $out -match $regex

Write-Host ("strictEndingMatch " + $ok) -ForegroundColor Yellow

$idx = $out.LastIndexOf('【下集预告】')
if ($idx -ge 0) {
  $tail = $out.Substring($idx)
} else {
  $start = [Math]::Max(0, $out.Length - 1000)
  $tail = $out.Substring($start)
}

Write-Host '---TAIL_START---' -ForegroundColor DarkGray
Write-Output $tail
Write-Host '---TAIL_END---' -ForegroundColor DarkGray
