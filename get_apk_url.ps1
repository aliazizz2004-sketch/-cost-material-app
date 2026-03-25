$output = npx eas build:list --platform android --limit 1 --non-interactive --json 2>&1 | Out-String
$json = $output -replace '(?s).*?(\[.*)', '$1'
$data = $json | ConvertFrom-Json
Write-Host "=== APK DOWNLOAD URLS ==="
Write-Host "Build URL: $($data[0].buildUrl)"
Write-Host "APK Direct: $($data[0].applicationArchiveUrl)"
