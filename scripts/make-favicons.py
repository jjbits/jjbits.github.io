#!/usr/bin/env python3
"""Generate the site's favicons from the tetrahedron mark into static/.

The icons are derived assets -- regenerate them rather than editing the PNGs.

    python3 scripts/make-favicons.py      (needs Pillow)

Two families, because they have different jobs:

  * Tab icons (favicon.svg/.ico, 16px, 32px) are transparent, so they sit on an
    unknown tab-bar colour. Their vertex nodes are a deep amber: the mark's own
    near-black nodes score 16:1 against white but 1.1:1 against a dark tab bar,
    where they vanish and read as notches cut out of the edges, while brand
    orange nodes are invisible against the orange edges. #8A5200 clears both --
    3.2:1 against the edges, 6.4:1 on white, 2.8:1 on a dark bar.
  * Touch/install icons (apple-touch-icon, android-chrome) must be opaque, so
    they use the dark brand tile and keep the mark's light-on-dark nodes.

The pose matches the static fallback in assets/img/tetra-logo.svg, which is
the original Ultimate Machine logo's orientation.
"""
from PIL import Image, ImageDraw
import json
import os

OUT = "static"
ORANGE = (245, 166, 35, 255)
DARK = (31, 33, 37, 255)
LIGHT = (229, 231, 235, 255)
# Vertex node colour for the transparent tab icons; see the module docstring.
NODE = (138, 82, 0, 255)
# Nodes are proportionally larger than the logo's (which are 1.7x its stroke,
# vs 3x here) because at 16-32px the logo's ratio is not resolvable.
NODE_R = 0.085

# Projected vertices in a 100x100 box, and the 6 edges; the last flag marks the
# edge hidden behind the solid, which the logo draws dashed.
V = {0: (42.42, 7.36), 1: (25.44, 92.64), 2: (10.11, 72.71), 3: (89.89, 81.08)}
EDGES = [(2, 3, True), (0, 1, False), (0, 2, False),
         (0, 3, False), (1, 2, False), (1, 3, False)]


def draw(size, tile, ss=8):
    """Render at ss× and downsample, for antialiasing PIL won't do itself."""
    w = size * ss
    img = Image.new("RGBA", (w, w), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    dot = LIGHT if tile else NODE
    if tile:
        d.rounded_rectangle([0, 0, w - 1, w - 1], radius=int(w * 0.18), fill=DARK)

    pad, span = 0.10, 0.80
    P = lambda v: (pad * w + V[v][0] / 100 * span * w,
                   pad * w + V[v][1] / 100 * span * w)
    # Proportional to size, but floored: the logo's own ratio is invisible <32px.
    sw = int(max(1.5 * ss, size * 0.055 * ss))

    for a, b, hidden in EDGES:
        pa, pb = P(a), P(b)
        if hidden:
            if size < 48:
                continue  # dashes turn to mud at tab-icon sizes
            n = 14
            for i in range(0, n, 2):
                t0, t1 = i / n, (i + 0.55) / n
                d.line([(pa[0] + (pb[0] - pa[0]) * t0, pa[1] + (pb[1] - pa[1]) * t0),
                        (pa[0] + (pb[0] - pa[0]) * t1, pa[1] + (pb[1] - pa[1]) * t1)],
                       fill=ORANGE, width=sw)
        else:
            d.line([pa, pb], fill=ORANGE, width=sw)

    for v in range(4):
        p = P(v)
        r = max(1.15 * ss, size * NODE_R * ss)  # floor keeps them on at 16px
        d.ellipse([p[0] - r, p[1] - r, p[0] + r, p[1] + r], fill=dot)

    return img.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)

    draw(16, False).save(f"{OUT}/favicon-16x16.png")
    draw(32, False).save(f"{OUT}/favicon-32x32.png")
    ico = [draw(s, False) for s in (16, 32, 48)]
    ico[0].save(f"{OUT}/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)],
                append_images=ico[1:])

    draw(180, True).save(f"{OUT}/apple-touch-icon.png")
    draw(192, True).save(f"{OUT}/android-chrome-192x192.png")
    draw(512, True).save(f"{OUT}/android-chrome-512x512.png")

    lines = "".join(
        '<line x1="{}" y1="{}" x2="{}" y2="{}"{}/>'.format(
            V[a][0], V[a][1], V[b][0], V[b][1],
            ' stroke-dasharray="1.2 4.9"' if hidden else "")
        for a, b, hidden in EDGES)
    # The mark spans ~80 of the 100 viewBox units, matching the PNGs' 10% pad,
    # so NODE_R and the stroke carry over as the same fractions.
    r_svg = round(NODE_R * 100, 1)
    dots = "".join('<circle cx="{}" cy="{}" r="{}"/>'.format(*V[v], r_svg)
                   for v in range(4))
    open(f"{OUT}/favicon.svg", "w").write(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
        '<g stroke="#F5A623" stroke-width="5.5" stroke-linecap="round" fill="none">'
        + lines + '</g><g fill="#8A5200">' + dots + "</g></svg>")

    json.dump({"name": "jjbits", "short_name": "jjbits",
               "icons": [{"src": "/android-chrome-192x192.png", "sizes": "192x192",
                          "type": "image/png"},
                         {"src": "/android-chrome-512x512.png", "sizes": "512x512",
                          "type": "image/png"}],
               "theme_color": "#1F2125", "background_color": "#1F2125",
               "display": "standalone"},
              open(f"{OUT}/site.webmanifest", "w"))

    for f in sorted(os.listdir(OUT)):
        print(f"  {f:32s} {os.path.getsize(os.path.join(OUT, f)):>7} bytes")


if __name__ == "__main__":
    main()
