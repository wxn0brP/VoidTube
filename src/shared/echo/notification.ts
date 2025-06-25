import { exec } from 'child_process';
import os from 'os';

const platform = os.platform();
export function showNotification(title: string, message: string): void {
    if (platform === 'linux') {
        // Linux: notify-send
        exec(`notify-send "${title}" "${message}"`);
    } else if (platform === 'win32') {
        // Windows: PowerShell + .NET
        const cmd = `
[reflection.assembly]::LoadWithPartialName("System.Windows.Forms")
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.Visible = $true
$notify.ShowBalloonTip(10000, "${title}", "${message}", [System.Windows.Forms.ToolTipIcon]::Info)
`;
        exec(`powershell -Command "${cmd}"`);
    }
}