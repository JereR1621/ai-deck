# Genera build\icon.ico, build\splash.bmp y build\logo.png dibujando el logotipo con System.Drawing.
# Se versiona el script en vez de un .ico opaco, para poder retocar el icono.
# Uso: npm run icon   (o: powershell -ExecutionPolicy Bypass -File build\make-icon.ps1)
#
# Concepto: un "deck" de hardware retro en tinta sobre papel. Un marco redondeado con
# sombra solida desplazada contiene cuatro paneles: el prompt >_ pixelado, un panel de
# controles (leds, perilla, interruptor), uno vacio y uno con trama de puntos.
param([string]$Preview)   # ruta opcional de un PNG con todos los tamanos, para revisarlo

Add-Type -AssemblyName System.Drawing

$out   = Join-Path $PSScriptRoot 'icon.ico'
# De mayor a menor: Windows elige el tamano segun donde lo muestre.
$sizes = 256, 128, 64, 48, 32, 24, 16

function C([string]$hex, [int]$a = 255) { [Drawing.Color]::FromArgb($a, [Drawing.ColorTranslator]::FromHtml($hex)) }

$paper = C '#F5EBDA'
$ink   = C '#121212'

function New-RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

# Ojo: en New-Object la coma pesa mas que el '-', y ($a - 1, $b) se parsea como
# $a - (1, $b). Con parametros tipados no hay ambiguedad.
function P([float]$x, [float]$y) { New-Object Drawing.PointF($x, $y) }

function New-RoundPen($color, [float]$width) {
    $pen = New-Object Drawing.Pen($color, $width)
    $pen.StartCap = 'Round'; $pen.EndCap = 'Round'; $pen.LineJoin = 'Round'
    return $pen
}

# Todo se dibuja en un lienzo logico de 256 x 256 y se escala. Lo que cambia por
# tamano es el nivel de detalle: a 16 px un trazo fino, los leds o la trama son ruido,
# asi que ahi queda solo la silueta con sombra y los cuatro paneles.
function Draw-Logo([Drawing.Graphics]$g, [int]$s) {
    $hi  = $s -ge 128
    $mid = $s -ge 48
    $g.ScaleTransform($s / 256.0, $s / 256.0)

    $inkB   = New-Object Drawing.SolidBrush($ink)
    $paperB = New-Object Drawing.SolidBrush($paper)

    # Marco exterior y su sombra solida hacia abajo a la derecha.
    $sh   = if ($hi) { 16 } elseif ($mid) { 18 } else { 22 }
    $tw   = 256 - 10 - $sh - 4
    $tx = 8; $ty = 8
    $tr   = if ($mid) { 54 } else { 50 }
    $shadow = New-RoundRect ($tx + $sh) ($ty + $sh) $tw $tw $tr
    $g.FillPath($inkB, $shadow); $shadow.Dispose()
    $tile = New-RoundRect $tx $ty $tw $tw $tr
    $g.FillPath($paperB, $tile)
    $g.DrawPath((New-Object Drawing.Pen($ink, $(if ($hi) { 9 } elseif ($mid) { 13 } else { 20 }))), $tile)
    $tile.Dispose()

    # Panel interior: borde abierto arriba a la derecha (ahi viven los controles).
    $m  = if ($hi) { 27 } elseif ($mid) { 30 } else { 40 }
    $L = $tx + $m; $T = $ty + $m; $R = $tx + $tw - $m + 2; $B = $tx + $tw - $m + 2
    $X = $L + ($R - $L) * 0.47      # divisor vertical
    $Y = $T + ($B - $T) * 0.54      # divisor horizontal
    $lw = if ($hi) { 6.5 } elseif ($mid) { 10 } else { 18 }
    # $cr y no $r: PowerShell no distingue mayusculas y $r pisaria a $R.
    $cr  = if ($hi) { 20 } elseif ($mid) { 18 } else { 12 }

    # Panel inferior derecho: trama de puntos en grande, gris solido en medio,
    # tinta llena en chico (es el ancla visual que sobrevive a 16 px).
    $q = New-Object Drawing.Drawing2D.GraphicsPath
    $q.AddLine($X, $Y, $R, $Y)
    $q.AddArc($R - 2 * $cr, $B - 2 * $cr, 2 * $cr, 2 * $cr, 0, 90)
    $q.AddLine($R - $cr, $B, $X, $B)
    $q.CloseFigure()
    if ($hi) {
        $g.SetClip($q)
        for ($yy = $Y + 4; $yy -lt $B; $yy += 5.2) {
            $odd = [int](($yy - $Y) / 5.2) % 2
            for ($xx = $X + 3 + $odd * 2.6; $xx -lt $R; $xx += 5.2) { $g.FillEllipse($inkB, $xx - 1, $yy - 1, 2, 2) }
        }
        $g.ResetClip()
    } elseif ($mid) {
        $g.FillPath((New-Object Drawing.SolidBrush((C '#121212' 110))), $q)
    } else {
        $g.FillPath($inkB, $q)
    }
    $q.Dispose()

    $pen = New-RoundPen $ink $lw
    if ($mid) {
        # Contorno: desde el final de la linea superior, por la izquierda, abajo y
        # subiendo por la derecha hasta el divisor horizontal, que cruza todo el ancho.
        $topEnd = $L + ($R - $L) * 0.76
        $o = New-Object Drawing.Drawing2D.GraphicsPath
        $o.AddLine($topEnd, $T, $L + $cr, $T)
        $o.AddArc($L, $T, 2 * $cr, 2 * $cr, 270, -90)
        $o.AddLine($L, $T + $cr, $L, $B - $cr)
        $o.AddArc($L, $B - 2 * $cr, 2 * $cr, 2 * $cr, 180, -90)
        $o.AddLine($L + $cr, $B, $R - $cr, $B)
        $o.AddArc($R - 2 * $cr, $B - 2 * $cr, 2 * $cr, 2 * $cr, 90, -90)
        $o.AddLine($R, $B - $cr, $R, $Y + 4)
        $o.AddArc($R - 8, $Y, 8, 8, 0, -90)
        $o.AddLine($R - 4, $Y, $L, $Y)
        $g.DrawPath($pen, $o); $o.Dispose()
        $g.DrawLine($pen, $X, $T, $X, $B)
        # Guion suelto al final de la linea superior.
        $g.DrawLine($pen, $L + ($R - $L) * 0.86, $T, $L + ($R - $L) * 0.94, $T)
    } else {
        # En chico basta la cruz que separa los cuatro paneles.
        $g.DrawLine($pen, $X, $T, $X, $B)
        $g.DrawLine($pen, $L, $Y, $R, $Y)
    }

    # Prompt >_ en el panel superior izquierdo.
    if ($hi) {
        # Chevron hecho de pixeles cuadrados, como en una pantalla de bajos recursos.
        $px = 5.4; $ox = $L + 9; $oy = $T + 30
        $cols = 0, 1, 2, 3, 2, 1, 0
        for ($i = 0; $i -lt 7; $i++) { $g.FillRectangle($inkB, $ox + $cols[$i] * $px, $oy + $i * $px, $px, $px) }
        $g.FillRectangle($inkB, $ox + 5 * $px, $oy + 6 * $px, 4 * $px, $px)
    } elseif ($mid) {
        $pp = New-Object Drawing.Pen($ink, 9); $pp.LineJoin = 'Miter'
        $ox = $L + 14; $oy = $T + 26
        $g.DrawLines($pp, [Drawing.PointF[]]@((P $ox $oy), (P ($ox + 16) ($oy + 16)), (P $ox ($oy + 32))))
        $g.FillRectangle($inkB, $ox + 22, $oy + 28, 20, 9)
        $pp.Dispose()
    }

    # Controles del panel superior derecho.
    if ($mid) {
        $kx = $R - 14; $ky = $T + 33; $kr = if ($hi) { 15 } else { 17 }
        $kp = New-Object Drawing.Pen($ink, $(if ($hi) { 5.5 } else { 8 }))
        $g.DrawEllipse($kp, $kx - $kr, $ky - $kr, 2 * $kr, 2 * $kr)
        $np = New-RoundPen $ink $(if ($hi) { 5.5 } else { 8 })
        $g.DrawLine($np, $kx - 2, $ky + 2, $kx + $kr * 0.5, $ky - $kr * 0.5)
        $np.Dispose(); $kp.Dispose()
        if ($hi) {
            foreach ($dy in -12, 0, 12) { $g.FillEllipse($inkB, $kx - 33, $ky + $dy - 3.5, 7, 7) }
        }
        # Interruptor: pastilla en tinta con la perilla en papel, a la izquierda.
        $sw = if ($hi) { 36 } else { 40 }; $sh2 = if ($hi) { 19 } else { 22 }
        $sx = $R - $sw + 3; $sy = $Y - $sh2 - $(if ($hi) { 14 } else { 10 })
        $pill = New-RoundRect $sx $sy $sw $sh2 ($sh2 / 2)
        $g.FillPath($inkB, $pill); $pill.Dispose()
        $kn = $sh2 - $(if ($hi) { 8 } else { 9 })
        $g.FillEllipse($paperB, $sx + 4, $sy + ($sh2 - $kn) / 2, $kn, $kn)
    }

    $pen.Dispose(); $inkB.Dispose(); $paperB.Dispose()
}

function New-LogoBitmap([int]$s) {
    $bmp = New-Object Drawing.Bitmap($s, $s, [Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.PixelOffsetMode = 'HighQuality'
    $g.Clear([Drawing.Color]::Transparent)
    Draw-Logo $g $s
    $g.Dispose()
    return $bmp
}

# Cada entrada del .ico es un PNG (soportado desde Vista): conserva el alfa de
# las esquinas sin tener que armar BMP con mascara AND.
$pngs = @()
foreach ($s in $sizes) {
    $bmp = New-LogoBitmap $s
    $ms = New-Object IO.MemoryStream
    $bmp.Save($ms, [Drawing.Imaging.ImageFormat]::Png)
    $pngs += , $ms.ToArray()
    $ms.Dispose(); $bmp.Dispose()
}

# Contenedor ICO: ICONDIR (6 bytes) + un ICONDIRENTRY de 16 bytes por imagen + los PNG.
$fs = [IO.File]::Create($out)
$w = New-Object IO.BinaryWriter($fs)
$w.Write([uint16]0)              # reservado
$w.Write([uint16]1)              # tipo 1 = icono
$w.Write([uint16]$sizes.Count)
$offset = 6 + (16 * $sizes.Count)
for ($i = 0; $i -lt $sizes.Count; $i++) {
    # 256 se escribe como 0: el campo es de un solo byte.
    $dim = if ($sizes[$i] -ge 256) { 0 } else { $sizes[$i] }
    $w.Write([byte]$dim); $w.Write([byte]$dim)
    $w.Write([byte]0); $w.Write([byte]0)             # sin paleta, reservado
    $w.Write([uint16]1); $w.Write([uint16]32)        # planos, bits por pixel
    $w.Write([uint32]$pngs[$i].Length)
    $w.Write([uint32]$offset)
    $offset += $pngs[$i].Length
}
foreach ($p in $pngs) { $w.Write($p) }
$w.Flush(); $w.Dispose(); $fs.Dispose()
Write-Host "icon.ico generado: $out ($([int]((Get-Item $out).Length / 1KB)) KB, $($sizes -join '/') px)"

# Logo grande para el README.
$logoOut = Join-Path $PSScriptRoot 'logo.png'
$lg = New-LogoBitmap 256
$lg.Save($logoOut, [Drawing.Imaging.ImageFormat]::Png); $lg.Dispose()
Write-Host "logo.png generado: $logoOut"

# Pantalla de carga del .exe portable: se ve mientras se descomprime, que es justo
# cuando la app todavia no puede mostrar nada. NSIS solo acepta BMP sin alfa.
$splashOut = Join-Path $PSScriptRoot 'splash.bmp'
$sw = 520; $sh = 300
$sp = New-Object Drawing.Bitmap($sw, $sh, [Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [Drawing.Graphics]::FromImage($sp)
$g.SmoothingMode = 'AntiAlias'
$g.TextRenderingHint = 'AntiAliasGridFit'
$g.Clear($paper)
$inkB = New-Object Drawing.SolidBrush($ink)
$muted = New-Object Drawing.SolidBrush((C '#6B6257'))
# Doble filete redondeado, como el marco del logo original.
$f1 = New-RoundRect 8 8 ($sw - 17) ($sh - 17) 18
$f2 = New-RoundRect 14 14 ($sw - 29) ($sh - 29) 13
$g.DrawPath((New-Object Drawing.Pen($ink, 2)), $f1); $g.DrawPath((New-Object Drawing.Pen($ink, 1.5)), $f2)
$f1.Dispose(); $f2.Dispose()
$logo = New-LogoBitmap 160
$g.DrawImage($logo, 40, 70, 160, 160); $logo.Dispose()
$fTitle = New-Object Drawing.Font('Consolas', 40, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
$fTag   = New-Object Drawing.Font('Consolas', 15, [Drawing.FontStyle]::Regular, [Drawing.GraphicsUnit]::Pixel)
$fLoad  = New-Object Drawing.Font('Consolas', 14, [Drawing.FontStyle]::Bold, [Drawing.GraphicsUnit]::Pixel)
$g.DrawString('AI DECK', $fTitle, $inkB, 228, 88)
$g.DrawString('> one window. many minds_', $fTag, $muted, 232, 140)
# Barra de "carga" a bloques. Es una imagen fija: los bloques adornan, el texto informa.
$blkDim = New-Object Drawing.SolidBrush((C '#CFC3AE'))
for ($i = 0; $i -lt 12; $i++) { $g.FillRectangle($(if ($i -lt 8) { $inkB } else { $blkDim }), 232 + $i * 20, 184, 15, 12) }
$g.DrawString('INICIANDO...', $fLoad, $inkB, 230, 208)
$g.DrawString('puede tardar unos segundos', $fTag, $muted, 232, 230)
$blkDim.Dispose(); $inkB.Dispose(); $muted.Dispose(); $fTitle.Dispose(); $fTag.Dispose(); $fLoad.Dispose(); $g.Dispose()
$sp.Save($splashOut, [Drawing.Imaging.ImageFormat]::Bmp); $sp.Dispose()
Write-Host "splash.bmp generado: $splashOut"

# Hoja de revision: el de 256 y cada tamano chico ampliado sin suavizar, que es
# como se notan los pixeles reales que vera la barra de tareas. Mitad clara y mitad
# oscura, para ver el icono sobre los dos fondos de la barra de tareas.
if ($Preview) {
    $sheet = New-Object Drawing.Bitmap(784, 600)
    $g = [Drawing.Graphics]::FromImage($sheet)
    $g.Clear((C '#F3F3F3'))
    $g.FillRectangle((New-Object Drawing.SolidBrush((C '#1C1C1C'))), 0, 300, 784, 300)
    foreach ($band in 0, 300) {
        $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'
        $big = New-LogoBitmap 256
        $g.DrawImage($big, 22, $band + 22, 256, 256); $big.Dispose()
        $g.InterpolationMode = 'NearestNeighbor'
        $g.PixelOffsetMode = 'Half'
        $x = 300
        foreach ($s in 48, 32, 16) {
            $z = [int](144 / $s) * $s
            $small = New-LogoBitmap $s
            $g.DrawImage($small, $x, $band + 22, $z, $z)
            $g.DrawImage($small, $x, $band + 22 + $z + 20, $s, $s)   # tamano real debajo
            $small.Dispose()
            $x += $z + 16
        }
    }
    $sheet.Save($Preview, [Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $sheet.Dispose()
    Write-Host "vista previa: $Preview"
}
