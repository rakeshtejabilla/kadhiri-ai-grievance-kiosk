Add-Type -AssemblyName Microsoft.VisualBasic
Add-Type -AssemblyName System.Windows.Forms
$Process = Get-Process electron -ErrorAction SilentlyContinue | Where-Object {$_.MainWindowTitle -match 'Kadhiri AI Public Grievance Kiosk'}
if ($Process) {
    [Microsoft.VisualBasic.Interaction]::AppActivate($Process.Id)
    Start-Sleep -Milliseconds 500
    [System.Windows.Forms.SendKeys]::SendWait('{F9}')
} else {
    Write-Host 'Window not found'
}
