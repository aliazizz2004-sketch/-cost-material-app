$filePath = "C:\Users\Lenovo\Desktop\cost material\cost-material-app\data\materials.js"

# Read file bytes as Latin-1 (treating each byte as a character)
$latin1Bytes = [System.IO.File]::ReadAllBytes($filePath)
$latin1Text = [System.Text.Encoding]::Latin1.GetString($latin1Bytes)

# Now re-encode the Latin-1 characters back to raw bytes, then decode as UTF-8
# This undoes the double-encoding: latin1_encode(utf8_bytes) -> utf8_bytes -> unicode
$rawBytes = [System.Text.Encoding]::Latin1.GetBytes($latin1Text)
$fixedText = [System.Text.Encoding]::UTF8.GetString($rawBytes)

# Verify it worked - Kurdish text should use Arabic Unicode range (U+0600-U+06FF)
$nameKuRegex = [regex]'nameKU:\s*"([^"]+)"'
$match = $nameKuRegex.Match($fixedText)
if ($match.Success) {
    $val = $match.Groups[1].Value
    Write-Host "Fixed nameKU value: $val"
    $codes = @()
    foreach ($c in $val.ToCharArray()) { $codes += [int]$c }
    Write-Host "Char codes: $($codes[0..5] -join ',')"
    
    # Check if chars are in Arabic Unicode range (0x0600-0x06FF)
    if ($codes[0] -ge 0x0600 -and $codes[0] -le 0x06FF) {
        Write-Host "SUCCESS! Kurdish text is now correct."
        # Write the fixed file back as UTF-8 without BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($filePath, $fixedText, $utf8NoBom)
        Write-Host "File saved successfully."
    } else {
        Write-Host "Fix didn't work. Char codes still wrong."
    }
}
