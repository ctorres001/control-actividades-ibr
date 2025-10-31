# Test login through Vite proxy
$body = @{ 
    username = 'asesor1'
    password = 'Asesor1@2024' 
} | ConvertTo-Json

Write-Host "Testing login at http://localhost:3000/api/auth/login"
Write-Host "Body: $body"
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 10 -ErrorAction Stop
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 4)
} catch {
    Write-Host "FAILED!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}
