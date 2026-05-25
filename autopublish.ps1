# monitor_wifi.ps1
# Script para conectar y desconectar el Wi-Fi automáticamente

$WifiName = "md1" # <-- CAMBIA ESTO POR EL NOMBRE EXACTO DE TU RED WI-FI (Sensible a mayúsculas y minúsculas)
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   MONITOR DE WI-FI PARA CANALES YOUTUBE  " -ForegroundColor White
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "Por favor, asegúrate de haber cambiado `$WifiName por el nombre de tu red." -ForegroundColor Yellow
Write-Host "Presiona Ctrl+C en cualquier momento para detener el script.`n"

while ($true) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Conectando a la red Wi-Fi '$WifiName'..." -ForegroundColor Cyan
    netsh wlan connect name="$WifiName" | Out-Null
    
    Write-Host "Esperando 15 segundos..."
    Start-Sleep -Seconds 15
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Abriendo Google Chrome en pantalla completa..." -ForegroundColor Cyan
    Start-Process "chrome.exe" "--start-fullscreen https://mdchi2.github.io/autopublish/"
    
    Write-Host "Esperando 30 segundos..."
    Start-Sleep -Seconds 30
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Desconectando Wi-Fi..." -ForegroundColor Red
    netsh wlan disconnect | Out-Null
    
    Write-Host "Esperando 9000 segundos (2.5 hora)..."
    Start-Sleep -Seconds 9000
    
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Cerrando Google Chrome..." -ForegroundColor Red
    Stop-Process -Name "chrome" -Force -ErrorAction SilentlyContinue
}
