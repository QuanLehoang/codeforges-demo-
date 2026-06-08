Add-Type -AssemblyName System.Drawing

$outDir = Join-Path (Split-Path -Parent $PSScriptRoot) 'output\brand'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function DrawGlow($g, [float]$cx, [float]$cy, [float]$r, [System.Drawing.Color]$color) {
  for ($i = 16; $i -ge 1; $i--) {
    $radius = $r * $i / 16
    $alpha = [Math]::Max(3, [int](36 * (1 - $i / 20)))
    $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb($alpha, $color.R, $color.G, $color.B))
    $g.FillEllipse($brush, $cx - $radius, $cy - $radius, $radius * 2, $radius * 2)
    $brush.Dispose()
  }
}

function RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function DrawBadge($g, [float]$x, [float]$y, [float]$s) {
  $path = RoundedPath $x $y $s $s ($s * 0.22)
  $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.RectangleF]::new($x, $y, $s, $s),
    [System.Drawing.Color]::FromArgb(255, 20, 25, 39),
    [System.Drawing.Color]::FromArgb(255, 2, 4, 10),
    45
  )
  $g.FillPath($bg, $path)
  $bg.Dispose()

  $g.SetClip($path)
  DrawGlow $g ($x + $s * 0.70) ($y + $s * 0.70) ($s * 0.72) ([System.Drawing.Color]::FromArgb(39, 215, 255))
  DrawGlow $g ($x + $s * 0.40) ($y + $s * 0.45) ($s * 0.50) ([System.Drawing.Color]::FromArgb(125, 90, 246))

  $wave = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $wave.AddBezier($x + $s * 0.08, $y + $s * 0.72, $x + $s * 0.32, $y + $s * 0.50, $x + $s * 0.62, $y + $s * 0.55, $x + $s * 0.92, $y + $s * 0.48)
  $wave.AddLine($x + $s * 0.92, $y + $s * 0.48, $x + $s * 0.92, $y + $s * 0.82)
  $wave.AddBezier($x + $s * 0.70, $y + $s * 0.88, $x + $s * 0.32, $y + $s * 0.88, $x + $s * 0.08, $y + $s * 0.72, $x + $s * 0.08, $y + $s * 0.72)
  $wave.CloseFigure()
  $waveBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(78, 14, 165, 233))
  $g.FillPath($waveBrush, $wave)
  $waveBrush.Dispose()
  $wave.Dispose()

  $shine = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(34, 255, 255, 255), [Math]::Max(2, $s * 0.025))
  $g.DrawArc($shine, $x + $s * 0.10, $y + $s * 0.09, $s * 0.78, $s * 0.42, 192, 130)
  $shine.Dispose()
  $g.ResetClip()

  $border = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(70, 83, 222, 255), [Math]::Max(2, $s * 0.012))
  $g.DrawPath($border, $path)
  $border.Dispose()
  $path.Dispose()
}

function DrawText3D($g, [string]$text, [System.Drawing.Font]$font, [float]$x, [float]$y, [System.Drawing.Brush]$front, [bool]$center = $false) {
  $fmt = [System.Drawing.StringFormat]::new()
  if ($center) { $fmt.Alignment = [System.Drawing.StringAlignment]::Center }
  $dark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 2, 7, 18))
  $blue = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 18, 104, 172))
  $g.DrawString($text, $font, $dark, $x + 6, $y + 7, $fmt)
  $g.DrawString($text, $font, $blue, $x + 3, $y + 4, $fmt)
  $g.DrawString($text, $font, $front, $x, $y, $fmt)
  $dark.Dispose()
  $blue.Dispose()
  $fmt.Dispose()
}

$white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
$cyan = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 64, 225, 255))
$muted = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(230, 206, 232, 255))

$iconPath = Join-Path $outDir 'codeforges-discord-icon-1024.png'
$icon = [System.Drawing.Bitmap]::new(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($icon)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear([System.Drawing.Color]::FromArgb(255, 13, 16, 25))
DrawGlow $g 620 690 560 ([System.Drawing.Color]::FromArgb(39, 215, 255))
DrawBadge $g 112 112 800
$fontCf = [System.Drawing.Font]::new('Arial Black', 300, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontName = [System.Drawing.Font]::new('Arial Black', 92, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
DrawText3D $g 'C' $fontCf 375 305 $white $true
DrawText3D $g 'F' $fontCf 565 305 $cyan $true
$fmt = [System.Drawing.StringFormat]::new()
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('CodeForges', $fontName, $muted, 512, 650, $fmt)
$fmt.Dispose()
$fontCf.Dispose()
$fontName.Dispose()
$g.Dispose()
$icon.Save($iconPath, [System.Drawing.Imaging.ImageFormat]::Png)
$icon.Dispose()

$bannerPath = Join-Path $outDir 'codeforges-discord-banner-680x240.png'
$banner = [System.Drawing.Bitmap]::new(680, 240)
$g = [System.Drawing.Graphics]::FromImage($banner)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
  [System.Drawing.RectangleF]::new(0, 0, 680, 240),
  [System.Drawing.Color]::FromArgb(255, 5, 8, 15),
  [System.Drawing.Color]::FromArgb(255, 13, 24, 42),
  18
)
$g.FillRectangle($bg, 0, 0, 680, 240)
$bg.Dispose()
DrawGlow $g 430 145 230 ([System.Drawing.Color]::FromArgb(39, 215, 255))
DrawGlow $g 250 105 210 ([System.Drawing.Color]::FromArgb(130, 90, 246))
DrawBadge $g 34 42 156
$fontBadge = [System.Drawing.Font]::new('Arial Black', 34, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontBadgeName = [System.Drawing.Font]::new('Arial Black', 18, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
DrawText3D $g 'CF' $fontBadge 112 77 $cyan $true
$fmt = [System.Drawing.StringFormat]::new()
$fmt.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('CodeForges', $fontBadgeName, $white, 112, 122, $fmt)
$fmt.Dispose()
$fontBadge.Dispose()
$fontBadgeName.Dispose()

$fontTitle = [System.Drawing.Font]::new('Arial Black', 52, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontTag = [System.Drawing.Font]::new('Consolas', 14, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$start = 224
$top = 70
$codeSize = $g.MeasureString('Code', $fontTitle)
DrawText3D $g 'Code' $fontTitle $start $top $white
DrawText3D $g 'Forges' $fontTitle ($start + $codeSize.Width - 28) $top $cyan
$g.DrawString('DIGITAL MARKETPLACE  -  FRONT-END COMPONENTS', $fontTag, $muted, $start, 144)
$line = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(96, 56, 232, 255), 2)
$g.DrawLine($line, 224, 178, 606, 178)
$line.Dispose()
$fontTitle.Dispose()
$fontTag.Dispose()
$g.Dispose()
$banner.Save($bannerPath, [System.Drawing.Imaging.ImageFormat]::Png)
$banner.Dispose()

$white.Dispose()
$cyan.Dispose()
$muted.Dispose()
Get-Item $iconPath, $bannerPath | Select-Object FullName, Length
