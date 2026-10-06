# Cascadia 99 — Dithered Retro Hardware

Live boards, rival previews, and the homepage demo share `visuals.mjs`. Cached pixel surfaces use nearest-neighbor drawing, solid colors, and no smooth gradients or alpha surface blending.

| Tile | Highlight | 50% interleave | Shadow lip | Glyph |
| --- | --- | --- | --- | --- |
| Skull | #FF6B97 | #A80045 | #520021 | White skull, dithered 1px offset shadow |
| Cyber-Eye | #38FFFF | #008299 | #003D47 | White iris, dithered pupil surround |
| Radiation | #66FF1A | #1F8A00 | #0D4200 | Black/dark green blocky blades |
| Twin Bolts | #FFB81C | #B36B00 | #593300 | Staggered white bolts, hard black outline, ordered offset shadow |

A standard 4×4 Bayer matrix gives exact 25%, 50%, and 75% densities in one-pixel increments. Approximately the upper-left 40% is solid highlight. Narrow 75% and 25% shoulders frame the unmistakable 50% diagonal checker band, approximately three perpendicular pixels wide. Lower/right interior lips are solid shadow inside a hard 2px black frame. Pixel-stepped corners retain the 14% silhouette.

Cast-iron slabs span 3–6 columns and 1–3 rows. The first three interior pixels are #94A3B8; horizontal bands alternate #64748B/#334155 in two-pixel checker steps. The bottom six interior pixels transition densely to #0F172A. Four-pixel diagonal red #FF3B30 stripes alternate with black/purple checker hatches. Recessed column notches preserve alignment. A centered 12×12 CPU unit has pins and a two-frame 25%/50% crosshatch halo. Breaking lights the core white and sends an opaque dither sweep across the slab before bottom-to-top panel release. Miniatures clamp the core to fit very short slabs.

Empty cells use exactly 25% #141824 stipple against #090B10. The selection frame stays unfilled and crisp. Upper-board warnings blink in two hard states; reduced motion freezes warnings and CPU halos. Match brightness and existing gameplay animations remain.

The homepage has one pixel wordmark and an updated 50 FPS GIF; reduced motion uses the matching still.

The website shell extends the retro treatment with locally bundled VT323 pixel typography, cyan/magenta accents, square cabinet frames, hard offset shadows, and a static grid background. Small gameplay labels retain monospace type for readability. Light mode uses cream/purple tones. See `fonts/OFL.txt` for font attribution and redistribution terms.
