$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse

foreach ($file in $files) {
    $lines = Get-Content -Path $file.FullName
    $newLines = @()
    $modified = $false
    
    $tags = @("p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "span")
    
    foreach ($line in $lines) {
        $newLine = $line
        
        foreach ($openTag in $tags) {
            foreach ($closeTag in $tags) {
                if ($openTag -eq $closeTag) { continue }
                
                # Pattern: <openTag ...> ... </closeTag> (single line only)
                $pattern = "<$openTag([^>]*)>(.*?)</$closeTag>"
                $replacement = "<$openTag`$1>`$2</$openTag>"
                
                if ($newLine -match $pattern) {
                    $newLine = [regex]::Replace($newLine, $pattern, $replacement)
                    $modified = $true
                }
            }
        }
        $newLines += $newLine
    }

    if ($modified) {
        Write-Host "Fixed tags (line-by-line) in $($file.FullName)"
        $newLines | Set-Content -Path $file.FullName -Encoding UTF8
    }
}
