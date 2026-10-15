Add-Type -AssemblyName System.Drawing

$sourcePath = 'C:\Users\Newdawn\.gemini\antigravity\brain\4a75a10f-e082-473f-a458-f3503c28a368\.user_uploaded\media_1792050589092_bb1f188b.png'
$masterBmp = [System.Drawing.Bitmap]::FromFile($sourcePath)

$outputDir = 'c:\Users\Newdawn\Documents\Yankee\public\assets\portraits'
[System.IO.Directory]::CreateDirectory($outputDir) | Out-Null

# 7 Classes specification
# (X1, X2, Y1, Y2)
$classes = @(
    @{ Name = "class_vanguard";     Title = "The Vanguard";     X1 = 15;  X2 = 195; Y1 = 70; Y2 = 490 },
    @{ Name = "class_brawler";      Title = "The Brawler";      X1 = 192; X2 = 318; Y1 = 70; Y2 = 490 },
    @{ Name = "class_striker";      Title = "The Striker";      X1 = 315; X2 = 445; Y1 = 70; Y2 = 490 },
    @{ Name = "class_sharpshooter"; Title = "The Sharpshooter"; X1 = 445; X2 = 582; Y1 = 70; Y2 = 490 },
    @{ Name = "class_supplier";     Title = "The Supplier";     X1 = 582; X2 = 720; Y1 = 70; Y2 = 490 },
    @{ Name = "class_instigator";   Title = "The Instigator";   X1 = 720; X2 = 860; Y1 = 70; Y2 = 490 },
    @{ Name = "class_saboteur";     Title = "The Saboteur";     X1 = 840; X2 = 995; Y1 = 70; Y2 = 490 }
)

function IsBackgroundPixel($c) {
    # Wall background
    if ($c.R -ge 15 -and $c.R -le 28 -and $c.G -ge 18 -and $c.G -le 31 -and $c.B -ge 26 -and $c.B -le 40) {
        return $true
    }
    # Floor background
    if ($c.R -ge 58 -and $c.R -le 82 -and $c.G -ge 63 -and $c.G -le 87 -and $c.B -ge 68 -and $c.B -le 93) {
        return $true
    }
    # Floor lines & tile joints
    if ($c.R -ge 45 -and $c.R -le 58 -and $c.G -ge 49 -and $c.G -le 63 -and $c.B -ge 54 -and $c.B -le 69) {
        return $true
    }
    return $false
}

foreach ($cls in $classes) {
    $w = $cls.X2 - $cls.X1 + 1
    $h = $cls.Y2 - $cls.Y1 + 1

    $cropBmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($cropBmp)
    $srcRect = New-Object System.Drawing.Rectangle($cls.X1, $cls.Y1, $w, $h)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $g.DrawImage($masterBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    # 2D visited array for background flood fill
    $isBg = New-Object "bool[,]" $w, $h
    $queue = New-Object System.Collections.Generic.Queue[System.Drawing.Point]

    # Seed top edge and bottom edge (skipping bottom label if any)
    for ($x = 0; $x -lt $w; $x++) {
        if (IsBackgroundPixel($cropBmp.GetPixel($x, 0))) {
            $isBg[$x, 0] = $true
            $queue.Enqueue((New-Object System.Drawing.Point($x, 0)))
        }
        if (IsBackgroundPixel($cropBmp.GetPixel($x, $h - 1))) {
            $isBg[$x, $h - 1] = $true
            $queue.Enqueue((New-Object System.Drawing.Point($x, $h - 1)))
        }
    }
    # Seed left and right edges
    for ($y = 0; $y -lt $h; $y++) {
        if ((-not $isBg[0, $y]) -and (IsBackgroundPixel($cropBmp.GetPixel(0, $y)))) {
            $isBg[0, $y] = $true
            $queue.Enqueue((New-Object System.Drawing.Point(0, $y)))
        }
        if ((-not $isBg[$w - 1, $y]) -and (IsBackgroundPixel($cropBmp.GetPixel($w - 1, $y)))) {
            $isBg[$w - 1, $y] = $true
            $queue.Enqueue((New-Object System.Drawing.Point($w - 1, $y)))
        }
    }

    # BFS flood fill
    while ($queue.Count -gt 0) {
        $pt = $queue.Dequeue()
        $px = $pt.X
        $py = $pt.Y

        $neighbors = @(
            (New-Object System.Drawing.Point($px + 1, $py)),
            (New-Object System.Drawing.Point($px - 1, $py)),
            (New-Object System.Drawing.Point($px, $py + 1)),
            (New-Object System.Drawing.Point($px, $py - 1))
        )

        foreach ($n in $neighbors) {
            $nx = $n.X
            $ny = $n.Y
            if ($nx -ge 0 -and $nx -lt $w -and $ny -ge 0 -and $ny -lt $h) {
                if (-not $isBg[$nx, $ny]) {
                    $nc = $cropBmp.GetPixel($nx, $ny)
                    if (IsBackgroundPixel($nc)) {
                        $isBg[$nx, $ny] = $true
                        $queue.Enqueue($n)
                    }
                }
            }
        }
    }

    # Find tight bounding box of foreground
    $minX = $w; $maxX = -1
    $minY = $h; $maxY = -1
    for ($y = 0; $y -lt $h; $y++) {
        for ($x = 0; $x -lt $w; $x++) {
            if (-not $isBg[$x, $y]) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -gt $minX -and $maxY -gt $minY) {
        $tightW = $maxX - $minX + 1
        $tightH = $maxY - $minY + 1
        $resultBmp = New-Object System.Drawing.Bitmap($tightW, $tightH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

        for ($y = 0; $y -lt $tightH; $y++) {
            for ($x = 0; $x -lt $tightW; $x++) {
                $srcX = $minX + $x
                $srcY = $minY + $y
                if ($isBg[$srcX, $srcY]) {
                    $resultBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                } else {
                    $c = $cropBmp.GetPixel($srcX, $srcY)
                    $resultBmp.SetPixel($x, $y, $c)
                }
            }
        }

        $outFile = Join-Path $outputDir "$($cls.Name).png"
        $resultBmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Host "Extracted $($cls.Title) -> $outFile ($tightW x $tightH)"
        $resultBmp.Dispose()
    }

    $cropBmp.Dispose()
}

$masterBmp.Dispose()
Write-Host "Done extracting all 7 classes!"

