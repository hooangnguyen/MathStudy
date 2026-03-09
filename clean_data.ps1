$inputPath = "QuestionData 1 .json"
$outputPath = "src/data/curriculumData.json"

if (Test-Path $inputPath) {
    $content = Get-Content -Path $inputPath -Raw
    # Remove comments
    $content = $content -replace '//.*', ''
    $content = $content.Trim()
    
    # Remove trailing dot if present
    if ($content.EndsWith('.')) {
        $content = $content.Substring(0, $content.Length - 1)
    }
    
    # Merge arrays and fix missing commas between objects
    $content = '[' + ($content -replace '\]\s*\[', ',' -replace '}\s*{', '},{' -replace '^\s*\[', '' -replace '\]\s*$', '') + ']'
    
    # Ensure output directory exists
    $dir = Split-Path $outputPath
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir
    }
    
    $content | Set-Content -Path $outputPath -Encoding UTF8
    Write-Output "Successfully cleaned data."
} else {
    Write-Error "Input file not found."
    exit 1
}
