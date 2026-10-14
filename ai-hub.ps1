# AI Hub: elige una carpeta y abre las consolas de Claude, Antigravity, DeepSeek y OpenCode
# dentro de UNA sola ventana de Windows Terminal (pestanas o paneles).
# Uso: .\ai-hub.ps1            (GUI)
#      .\ai-hub.ps1 -Folder C:\ruta -Tools claude,agy -Layout panes   (sin GUI)
# Log: %USERPROFILE%\.config\ai-hub\ai-hub.log
param(
    [string]$Folder,
    [string[]]$Tools,
    [ValidateSet('tabs', 'panes')][string]$Layout = 'tabs'
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()

$ConfigDir  = Join-Path $env:USERPROFILE '.config\ai-hub'
$ConfigFile = Join-Path $ConfigDir 'config.json'
$LogFile    = Join-Path $ConfigDir 'ai-hub.log'
New-Item -ItemType Directory -Force $ConfigDir | Out-Null

function Write-Log([string]$msg, [string]$level = 'INFO') {
    try {
        $line = '{0} [{1}] {2}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss.fff'), $level, $msg
        if ((Test-Path $LogFile) -and (Get-Item $LogFile).Length -gt 1MB) { Move-Item $LogFile "$LogFile.old" -Force }
        Add-Content -Path $LogFile -Value $line -Encoding utf8
    } catch {}
}

# Cada consola se abre tal cual; el login/API key lo maneja cada CLI en su propia terminal.
$Catalog = [ordered]@{
    claude   = @{ Title = 'Claude';      Exe = 'claude';   Tag = 'Anthropic' }
    agy      = @{ Title = 'Antigravity'; Exe = 'agy';      Tag = 'Google' }
    deepseek = @{ Title = 'DeepSeek';    Exe = 'deepseek'; Tag = 'DeepSeek' }
    opencode = @{ Title = 'OpenCode';    Exe = 'opencode'; Tag = 'Open source' }
}

function Get-Config {
    if (Test-Path $ConfigFile) {
        try { return Get-Content $ConfigFile -Raw | ConvertFrom-Json } catch { Write-Log "config.json ilegible: $($_.Exception.Message)" 'WARN' }
    }
    [pscustomobject]@{ lastFolder = [Environment]::GetFolderPath('UserProfile') }
}
function Save-Config($cfg) {
    try { $cfg | ConvertTo-Json -Depth 5 | Set-Content $ConfigFile -Encoding utf8 }
    catch { Write-Log "No se pudo guardar config: $($_.Exception.Message)" 'ERROR' }
}
function Get-ToolPath($id) {
    $exe = $Catalog[$id].Exe
    if (-not $exe) { Write-Log "id desconocido: '$id'" 'WARN'; return $null }
    $c = Get-Command $exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($c) { $c.Source } else { $null }
}

function Start-Hub($cfg, $folder, $ids, $layout) {
    # `powershell -File` entrega "-Tools a,b" como UN solo texto: separar y validar.
    $ids = @($ids | ForEach-Object { $_ -split ',' } | ForEach-Object { $_.Trim() } | Where-Object { $_ })
    Write-Log "Start-Hub folder='$folder' tools=[$($ids -join '|')] layout=$layout"
    if (-not $folder -or -not (Test-Path -LiteralPath $folder -PathType Container)) { throw "La carpeta no existe: $folder" }
    if (-not $ids) { throw 'Selecciona al menos una consola.' }
    $bad = @($ids | Where-Object { -not $Catalog.Contains($_) })
    if ($bad) { throw "Agente desconocido: $($bad -join ', '). Validos: $(@($Catalog.Keys) -join ', ')" }
    $wt = Get-Command wt -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $wt) { throw 'Windows Terminal (wt) no esta instalado.' }

    # Una barra final dentro de "..." escapa la comilla de cierre en wt (C:\ -> C:").
    $dir = (Resolve-Path -LiteralPath $folder).ProviderPath.TrimEnd('\')
    if ($dir -match '^[A-Za-z]:$') { $dir += '\\' }

    $parts = @()
    $i = 0
    foreach ($id in $ids) {
        $t = $Catalog[$id]
        $path = Get-ToolPath $id
        if (-not $path) { Write-Log "'$($t.Exe)' no esta en PATH, se omite" 'WARN'; continue }
        Write-Log "  $id -> $path"
        $verb = if ($i -eq 0) { '' } elseif ($layout -eq 'panes') { 'split-pane' } else { 'new-tab' }
        $parts += "$verb -d `"$dir`" --title `"$($t.Title)`" powershell.exe -NoExit -Command $($t.Exe)".Trim()
        $i++
    }
    if (-not $parts) { throw 'Ninguna de las consolas elegidas esta instalada.' }

    $argLine = '-w new ' + ($parts -join ' ; ')
    Write-Log "wt $argLine"
    $p = Start-Process -FilePath $wt.Source -ArgumentList $argLine -PassThru
    Write-Log "wt lanzado pid=$($p.Id)"
    Start-Sleep -Milliseconds 800
    if ($p.HasExited) { Write-Log "wt salio con codigo $($p.ExitCode) (puede ser normal: wt delega en la ventana existente)" 'WARN' }

    $cfg.lastFolder = $dir
    Save-Config $cfg
}

Write-Log "=== inicio ai-hub (PS $($PSVersionTable.PSVersion), $([Environment]::OSVersion.VersionString)) ==="
$cfg = Get-Config

# --- Modo sin GUI ---
if ($Folder -and $Tools) {
    try { Start-Hub $cfg $Folder $Tools $Layout }
    catch { Write-Log "FALLO: $($_.Exception.Message)`n$($_.ScriptStackTrace)" 'ERROR'; throw }
    return
}

# --- GUI: retro-moderna, blanco y celeste ---
function C($hex) { [Drawing.ColorTranslator]::FromHtml($hex) }
$sky     = C '#8FD3FF'; $skyDark = C '#2E9BE6'; $skyPale = C '#EAF6FF'
$ink     = C '#14324D'; $white = C '#FFFFFF'; $muted = C '#6C8CA6'; $bad = C '#D9534F'
$mono    = 'Consolas'

$form = New-Object Windows.Forms.Form -Property @{
    Text = 'AI HUB'; ClientSize = New-Object Drawing.Size(560, 560); StartPosition = 'CenterScreen'
    FormBorderStyle = 'FixedSingle'; MaximizeBox = $false; BackColor = $white; Font = New-Object Drawing.Font($mono, 10)
}

# Cabecera tipo ventana retro
$head = New-Object Windows.Forms.Panel -Property @{ Dock = 'Top'; Height = 92; BackColor = $sky }
$title = New-Object Windows.Forms.Label -Property @{
    Text = '[ AI HUB ]'; Font = New-Object Drawing.Font($mono, 26, [Drawing.FontStyle]::Bold)
    ForeColor = $ink; AutoSize = $true; Location = New-Object Drawing.Point(20, 10); BackColor = [Drawing.Color]::Transparent }
$sub = New-Object Windows.Forms.Label -Property @{
    Text = '> one window. many minds_'; ForeColor = $ink; AutoSize = $true
    Location = New-Object Drawing.Point(24, 62); BackColor = [Drawing.Color]::Transparent }
$head.Controls.AddRange(@($title, $sub))
$stripe = New-Object Windows.Forms.Panel -Property @{ Dock = 'Top'; Height = 4; BackColor = $skyDark }

function New-Section($text, $y) {
    New-Object Windows.Forms.Label -Property @{ Text = $text; ForeColor = $skyDark; AutoSize = $true
        Font = New-Object Drawing.Font($mono, 9, [Drawing.FontStyle]::Bold); Location = New-Object Drawing.Point(24, $y) }
}
function New-FlatButton($text, $x, $y, $w, $h, $filled) {
    $b = New-Object Windows.Forms.Button -Property @{ Text = $text; Location = New-Object Drawing.Point($x, $y)
        Size = New-Object Drawing.Size($w, $h); FlatStyle = 'Flat'; Cursor = 'Hand'
        Font = New-Object Drawing.Font($mono, 10, [Drawing.FontStyle]::Bold); ForeColor = $ink
        BackColor = $(if ($filled) { $sky } else { $white }) }
    $b.FlatAppearance.BorderColor = $skyDark; $b.FlatAppearance.BorderSize = 2
    $b.FlatAppearance.MouseOverBackColor = $skyPale
    $b
}

# Carpeta
$secFolder = New-Section '01 // CARPETA DE TRABAJO' 112
$txtBox = New-Object Windows.Forms.Panel -Property @{ Location = New-Object Drawing.Point(24, 136); Size = New-Object Drawing.Size(380, 34); BackColor = $skyDark }
$txt = New-Object Windows.Forms.TextBox -Property @{ Location = New-Object Drawing.Point(2, 2); Size = New-Object Drawing.Size(376, 30)
    BorderStyle = 'None'; Text = $cfg.lastFolder; BackColor = $skyPale; ForeColor = $ink; Font = New-Object Drawing.Font($mono, 11) }
$txtBox.Controls.Add($txt)
# TextBox sin borde queda pegado arriba: centrar con padding vertical
$txt.Multiline = $true; $txt.Height = 30
$btnBrowse = New-FlatButton 'EXAMINAR' 414 136 122 34 $false
$btnBrowse.Add_Click({
    try {
        $d = New-Object Windows.Forms.FolderBrowserDialog
        if (Test-Path -LiteralPath $txt.Text) { $d.SelectedPath = $txt.Text }
        if ($d.ShowDialog() -eq 'OK') { $txt.Text = $d.SelectedPath; Write-Log "carpeta elegida: $($d.SelectedPath)" }
    } catch { Write-Log "Examinar fallo: $($_.Exception.Message)" 'ERROR' }
})

# Tarjetas de consola
$secTools = New-Section '02 // AGENTES' 190
$checks = @{}
$y = 214
foreach ($id in $Catalog.Keys) {
    $path = Get-ToolPath $id
    $ok = [bool]$path
    $card = New-Object Windows.Forms.Panel -Property @{ Location = New-Object Drawing.Point(24, $y); Size = New-Object Drawing.Size(512, 44)
        BackColor = $(if ($ok) { $skyPale } else { $white }) }
    $line = New-Object Windows.Forms.Panel -Property @{ Dock = 'Left'; Width = 5; BackColor = $(if ($ok) { $skyDark } else { $muted }) }
    $cb = New-Object Windows.Forms.CheckBox -Property @{ Location = New-Object Drawing.Point(16, 11); AutoSize = $true
        Checked = $ok; Enabled = $ok; Text = $Catalog[$id].Title.ToUpper(); ForeColor = $(if ($ok) { $ink } else { $muted })
        Font = New-Object Drawing.Font($mono, 10, [Drawing.FontStyle]::Bold); BackColor = [Drawing.Color]::Transparent; FlatStyle = 'Flat' }
    $st = New-Object Windows.Forms.Label -Property @{ AutoSize = $false; TextAlign = 'MiddleRight'; Dock = 'Right'; Width = 230
        Padding = (New-Object Windows.Forms.Padding(0, 0, 14, 0))
        Text = $(if ($ok) { "$($Catalog[$id].Tag)  " + [char]0x25CF + ' listo' } else { [char]0x25CB + ' no instalado' })
        ForeColor = $(if ($ok) { $skyDark } else { $muted }); BackColor = [Drawing.Color]::Transparent }
    $card.Controls.AddRange(@($st, $cb, $line))
    $form.Controls.Add($card)
    $checks[$id] = $cb
    Write-Log "detectado $id => $(if ($ok) { $path } else { 'NO INSTALADO' })"
    $y += 52
}

# Disposicion
$secLay = New-Section '03 // DISPOSICION' ($y + 6)
$rbTabs  = New-Object Windows.Forms.RadioButton -Property @{ Text = 'PESTANAS'; Location = New-Object Drawing.Point(24, ($y + 32)); AutoSize = $true; Checked = $true; ForeColor = $ink }
$rbPanes = New-Object Windows.Forms.RadioButton -Property @{ Text = 'PANELES'; Location = New-Object Drawing.Point(160, ($y + 32)); AutoSize = $true; ForeColor = $ink }

# Estado + acciones
$status = New-Object Windows.Forms.Label -Property @{ Location = New-Object Drawing.Point(24, 500); Size = New-Object Drawing.Size(300, 40)
    ForeColor = $bad; Text = '' }
$btnLog = New-FlatButton 'VER LOG' 340 506 90 34 $false
$btnLog.Add_Click({ try { Start-Process notepad.exe $LogFile } catch { $status.Text = "Log: $LogFile" } })
$btnGo = New-FlatButton ([string][char]0x25B6 + ' LANZAR') 438 506 98 34 $true
$btnGo.Add_Click({
    try {
        $status.ForeColor = $ink; $status.Text = 'lanzando...'
        $ids = @($checks.Keys | Where-Object { $checks[$_].Checked } | Sort-Object { @($Catalog.Keys).IndexOf($_) })
        $l = if ($rbPanes.Checked) { 'panes' } else { 'tabs' }
        Start-Hub $cfg $txt.Text.Trim() $ids $l
        $form.Close()
    } catch {
        Write-Log "FALLO: $($_.Exception.Message)`n$($_.ScriptStackTrace)" 'ERROR'
        $status.ForeColor = $bad; $status.Text = $_.Exception.Message
    }
})

$form.Controls.AddRange(@($secFolder, $txtBox, $btnBrowse, $secTools, $secLay, $rbTabs, $rbPanes, $status, $btnLog, $btnGo, $stripe, $head))
$form.AcceptButton = $btnGo
try { [void]$form.ShowDialog() }
catch { Write-Log "GUI fallo: $($_.Exception.Message)`n$($_.ScriptStackTrace)" 'ERROR'; throw }
Write-Log '=== fin ai-hub ==='

