$bytes = [System.IO.File]::ReadAllBytes("C:\Users\Lenovo\Desktop\cost material\cost-material-app\data\materials.js")
$text = [System.Text.Encoding]::UTF8.GetString($bytes)
$nameKuRegex = [regex]'nameKU:\s*"([^"]+)"'
$match = $nameKuRegex.Match($text)
if ($match.Success) {
    $val = $match.Groups[1].Value
    Write-Host "First nameKU value: $val"
    # Get char codes of first few chars
    $codes = @()
    foreach ($c in $val.ToCharArray()) {
        $codes += [int]$c
    }
    Write-Host "Char codes: $($codes[0..9] -join ',')"
}
