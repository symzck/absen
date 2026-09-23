#!/bin/bash
set -e

# Output directory
mkdir -p public

# Colors
PURPLE="#360f58"
PURPLE_DARK="#220738"
WHITE="#ffffff"
BLACK="#000000"

# 1. Base image: 600x600 pure black
convert -size 600x600 xc:"$BLACK" /tmp/base.png

# 2. Outer White Underlay for entire crest and ribbon wings
# Draw outer white circle (center 300, 260, radius 195)
# and outer white polygon for the ribbon banner
convert -size 600x600 xc:none \
  -fill "$WHITE" -draw "circle 300,260 300,65" \
  -fill "$WHITE" -draw "polygon 70,395 105,330 160,340 440,340 495,330 530,395 485,385 450,445 300,470 150,445 115,385" \
  /tmp/outer_white.png

# 3. Main Purple Circle Base (center 300, 260, radius 183)
convert -size 600x600 xc:none \
  -fill "$PURPLE" -draw "circle 300,260 300,77" \
  -fill none -stroke "$WHITE" -strokewidth 5 -draw "circle 300,260 300,85" \
  -fill none -stroke "$WHITE" -strokewidth 3.5 -draw "circle 300,260 300,97" \
  /tmp/purple_circle.png

# 4. Upper Dome: White semi-circle for building backdrop (radius 160)
convert -size 600x600 xc:none \
  -fill "$WHITE" -draw "ellipse 300,260 160,160 180,360" \
  /tmp/white_dome.png

# 5. Building Silhouette (Purple with white window slits)
# Center tower:
# Cap: 278 to 322, y=125 to 134
# Tower: 280 to 320, y=134 to 200
# Center base: 265 to 335, y=200 to 260
# Left wing: 175 to 265, y=190 to 260
# Right wing: 335 to 425, y=190 to 260
convert -size 600x600 xc:none \
  -fill "$PURPLE" -stroke none \
  -draw "rectangle 276,124 324,132" \
  -draw "rectangle 282,132 318,138" \
  -draw "rectangle 280,138 320,200" \
  -draw "rectangle 266,200 334,260" \
  -draw "polygon 170,230 170,210 185,210 185,198 266,198 266,260 170,260" \
  -draw "polygon 430,230 430,210 415,210 415,198 334,198 334,260 430,260" \
  -draw "rectangle 155,260 445,268" \
  -fill "$WHITE" \
  -draw "roundrectangle 284,148 288,188 2,2" \
  -draw "roundrectangle 292,148 296,188 2,2" \
  -draw "roundrectangle 304,148 308,188 2,2" \
  -draw "roundrectangle 312,148 316,188 2,2" \
  -draw "rectangle 274,210 277,248" \
  -draw "rectangle 283,210 286,248" \
  -draw "rectangle 296,210 299,248" \
  -draw "rectangle 302,210 305,248" \
  -draw "rectangle 314,210 317,248" \
  -draw "rectangle 323,210 326,248" \
  -draw "roundrectangle 212,204 217,222 1,1" \
  -draw "roundrectangle 228,204 233,222 1,1" \
  -draw "roundrectangle 244,204 249,222 1,1" \
  -draw "roundrectangle 351,204 356,222 1,1" \
  -draw "roundrectangle 367,204 372,222 1,1" \
  -draw "roundrectangle 383,204 388,222 1,1" \
  -draw "rectangle 180,236 184,258" \
  -draw "rectangle 192,236 196,258" \
  -draw "rectangle 204,236 208,258" \
  -draw "rectangle 216,236 220,258" \
  -draw "rectangle 228,236 232,258" \
  -draw "rectangle 240,236 244,258" \
  -draw "rectangle 252,236 256,258" \
  -draw "rectangle 344,236 348,258" \
  -draw "rectangle 356,236 360,258" \
  -draw "rectangle 368,236 372,258" \
  -draw "rectangle 380,236 384,258" \
  -draw "rectangle 392,236 396,258" \
  -draw "rectangle 404,236 408,258" \
  -draw "rectangle 416,236 420,258" \
  /tmp/building.png

# 6. Ribbon Banner Structure
# Tails (behind front banner)
convert -size 600x600 xc:none \
  -stroke "$WHITE" -strokewidth 4 \
  -fill "$PURPLE_DARK" \
  -draw "polygon 80,390 115,340 160,345 155,395 120,388" \
  -draw "polygon 520,390 485,340 440,345 445,395 480,388" \
  -fill "$PURPLE" \
  -draw "polygon 80,390 120,388 68,435 98,390" \
  -draw "polygon 520,390 480,388 532,435 502,390" \
  /tmp/ribbon_tails.png

# Front Curved Ribbon Body
# Draw curved polygon across bottom
convert -size 600x600 xc:none \
  -stroke "$WHITE" -strokewidth 7 -fill "$PURPLE" \
  -draw "path 'M 108,348 Q 300,412 492,348 L 484,394 Q 300,462 116,394 Z'" \
  /tmp/ribbon_front.png

# Inner accent lines on ribbon
convert -size 600x600 xc:none \
  -stroke "$WHITE" -strokewidth 2 -fill none \
  -draw "path 'M 120,356 Q 300,418 480,356'" \
  -draw "path 'M 124,386 Q 300,452 476,386'" \
  /tmp/ribbon_accents.png

# 7. Text: PGT MU'ALLIMIN (Arc 38 degrees)
convert -size 560x90 xc:none \
  -font Helvetica-Bold -pointsize 38 -fill "$WHITE" -gravity center \
  -annotate +0+0 "PGT MU'ALLIMIN" \
  -virtual-pixel transparent -distort Arc "34 0" \
  /tmp/text_top.png

# 8. Text: MUHAMMADIYAH YOGYAKARTA (Arc 40 degrees)
convert -size 560x60 xc:none \
  -font Helvetica-Bold -pointsize 18 -fill "$WHITE" -gravity center \
  -annotate +0+0 "MUHAMMADIYAH YOGYAKARTA" \
  -virtual-pixel transparent -distort Arc "38 0" \
  /tmp/text_bottom.png

# 9. Composite everything into final 600x600 PNG
convert /tmp/base.png \
  /tmp/outer_white.png -composite \
  /tmp/purple_circle.png -composite \
  /tmp/white_dome.png -composite \
  /tmp/building.png -composite \
  /tmp/ribbon_tails.png -composite \
  /tmp/ribbon_front.png -composite \
  /tmp/ribbon_accents.png -composite \
  /tmp/text_top.png -geometry +20+332 -composite \
  /tmp/text_bottom.png -geometry +20+378 -composite \
  public/logo.png

# Create a copy as public/logo.jpg and public/image.png
convert public/logo.png -quality 95 public/logo.jpg
cp public/logo.png public/image.png
cp public/logo.png src/assets/logo.png

echo "Logo generated successfully at public/logo.png, public/logo.jpg, and public/image.png"
