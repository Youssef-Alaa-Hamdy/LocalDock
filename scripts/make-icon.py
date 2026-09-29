#!/usr/bin/env python3
"""LocalDock — generates the 1024px app icon (source for `tauri icon`).

Geometry mirrors the in-app LogoMark: teal rounded tile, white L monogram
plus the small docked bar top-right. Brand teal = oklch(0.6 0.11 184).
"""
from PIL import Image, ImageDraw
import numpy as np

SIZE = 1024
TILE = 64          # LogoMark viewBox
SCALE = SIZE / TILE  # 16

# oklch(0.6 0.11 184) ≈ #189A93; gradient endpoints from the loading screen
C_LIGHT = (45, 212, 191)    # #2DD4BF (teal-400)
C_DEEP = (15, 118, 110)     # #0F766E (teal-700)

def gradient_tile(size: int, light, deep) -> Image.Image:
    """145° linear gradient (light top-left -> deep bottom-right)."""
    x = np.linspace(0, 1, size)
    y = np.linspace(0, 1, size)
    xx, yy = np.meshgrid(x, y)
    t = (xx * 0.55 + yy * 0.45)  # diagonal blend ≈ 145deg
    r = light[0] + (deep[0] - light[0]) * t
    g = light[1] + (deep[1] - light[1]) * t
    b = light[2] + (deep[2] - light[2]) * t
    rgb = np.dstack([r, g, b]).astype(np.uint8)
    return Image.fromarray(rgb, "RGB")

img = gradient_tile(SIZE, C_LIGHT, C_DEEP).convert("RGBA")

# Rounded-rect mask (rx=16 tiles -> 256px)
mask = Image.new("L", (SIZE, SIZE), 0)
mdraw = ImageDraw.Draw(mask)
mdraw.rounded_rectangle([0, 0, SIZE - 1, SIZE - 1], radius=256, fill=255)
out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
out.paste(img, (0, 0), mask)

draw = ImageDraw.Draw(out)

def tile_rect(x, y, w, h, rx_tile=0):
    """Convert LogoMark tile coords -> pixel rect with optional rounded corners."""
    box = [x * SCALE, y * SCALE, (x + w) * SCALE, (y + h) * SCALE]
    return box, rx_tile * SCALE

WHITE = (255, 255, 255, 255)

# L monogram: M20 40 V26 h6 v14 h10 v6 H20 Z
# -> vertical bar (20..26, 26..40), bottom bar (20..36, 40..46)
vbox, rx = tile_rect(20, 26, 6, 14, rx_tile=0)
draw.rectangle(vbox, fill=WHITE)
bbox, rx = tile_rect(26, 40, 10, 6, rx_tile=0)
draw.rectangle(bbox, fill=WHITE)
# right end cap of the bottom bar, rounded
cap, rx = tile_rect(34, 40, 2, 6, rx_tile=0)
draw.rounded_rectangle(cap, radius=SCALE, fill=WHITE)  # soft cap

# small docked bar: rect 38,18 6x14 rx2
bar, rx = tile_rect(38, 18, 6, 14, rx_tile=2)
draw.rounded_rectangle(bar, radius=rx, fill=(255, 255, 255, 217))

# subtle inner highlight (top edge gloss)
gloss = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(gloss)
gdraw.rounded_rectangle([16, 16, SIZE - 17, SIZE - 17], radius=244, outline=(255, 255, 255, 26), width=14)
out = Image.alpha_composite(out, gloss)

out.save("/home/z/my-project/scripts/icon-source.png")
print("icon source written:", out.size)
