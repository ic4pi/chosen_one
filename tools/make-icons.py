#!/usr/bin/env python3
"""
make-icons.py — draws the Kundala mark and writes the app icons.

Pure standard library: zlib and struct only. The mark is a three-and-a-half
turn coil (the classical description of kundalini at the base of the spine)
with a crescent riding above it, rendered from signed distance fields so the
edges stay clean at every size.

    python3 tools/make-icons.py
"""

import math, struct, zlib, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'web', 'icons')

INK       = (0x0b, 0x0a, 0x12)
INK_EDGE  = (0x04, 0x04, 0x07)
HALO      = (0x1c, 0x18, 0x2e)
BRASS_LIT = (0xe5, 0xc3, 0x56)
BRASS     = (0xc9, 0xa2, 0x27)
BRASS_DIM = (0x8a, 0x6f, 0x1c)
MOON      = (0xcf, 0xd8, 0xe8)


def mix(a, b, t):
    t = max(0.0, min(1.0, t))
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def over(dst, src, alpha):
    return tuple(round(dst[i] + (src[i] - dst[i]) * alpha) for i in range(3))


def coverage(d, aa):
    """Signed distance -> antialiased coverage."""
    return max(0.0, min(1.0, 0.5 - d / aa))


def spiral_distance(x, y, a, b, turns, width):
    """
    Distance to an Archimedean spiral r = a + b*phi, phi in [0, turns*2pi].

    Solved rather than sampled: for a point's polar angle we only need the
    winding number that puts the curve nearest, which is a rounding away.
    """
    r = math.hypot(x, y)
    if r < 1e-6:
        return a - width / 2
    theta = math.atan2(y, x) % (2 * math.pi)
    phi_max = turns * 2 * math.pi

    best = 1e9
    k0 = (r - a - b * theta) / (2 * math.pi * b)
    for k in (math.floor(k0), math.ceil(k0)):
        phi = theta + 2 * math.pi * k
        if phi < 0 or phi > phi_max:
            # Clamp to the endpoints so the coil terminates rather than fading.
            phi_c = 0.0 if phi < 0 else phi_max
            ex = (a + b * phi_c) * math.cos(phi_c)
            ey = (a + b * phi_c) * math.sin(phi_c)
            best = min(best, math.hypot(x - ex, y - ey))
            continue
        best = min(best, abs(r - (a + b * phi)))
    return best - width / 2


def crescent_distance(x, y, cx, cy, r_out, ox, oy, r_in):
    d_out = math.hypot(x - cx, y - cy) - r_out
    d_in = math.hypot(x - ox, y - oy) - r_in
    return max(d_out, -d_in)


def render(size, *, maskable=False, mono=False):
    px = [[(0, 0, 0, 0)] * size for _ in range(size)]
    c = size / 2.0
    # Maskable icons must survive a circular crop taking ~20% off each edge.
    s = size / 512.0 * (0.78 if maskable else 1.0)
    aa = max(1.0, size / 256.0)

    # The coil sits inside a crescent rim: a moon holding a coiled serpent.
    coil_a = 9 * s
    coil_b = 5.0 * s
    coil_w = 13 * s
    turns = 3.5
    coil_cx, coil_cy = c, c + 6 * s

    cres_r = 202 * s
    cres_cx, cres_cy = c, c
    cres_ox, cres_oy = c + 34 * s, c - 30 * s
    cres_ri = 186 * s

    for j in range(size):
        for i in range(size):
            x, y = i + 0.5, j + 0.5
            rad = math.hypot(x - c, y - c) / (size / 2)

            if mono:
                base = (0, 0, 0)
                alpha_bg = 0.0
            else:
                base = mix(mix(HALO, INK, min(1.0, rad * 1.35)), INK_EDGE, max(0.0, rad - 0.62) / 0.38)
                alpha_bg = 1.0

            col = base
            alpha = alpha_bg

            dc = crescent_distance(x, y, cres_cx, cres_cy, cres_r, cres_ox, cres_oy, cres_ri)
            cov = coverage(dc, aa)
            if cov > 0:
                col = over(col, (255, 255, 255) if mono else MOON, cov * (1.0 if mono else 0.92))
                alpha = max(alpha, cov)

            ds = spiral_distance(x - coil_cx, y - coil_cy, coil_a, coil_b, turns, coil_w)
            cov = coverage(ds, aa)
            if cov > 0:
                if mono:
                    shade = (255, 255, 255)
                else:
                    t = min(1.0, math.hypot(x - coil_cx, y - coil_cy) / (150 * s))
                    shade = mix(BRASS_LIT, BRASS_DIM, t) if t > 0.35 else mix(BRASS_LIT, BRASS, t / 0.35)
                col = over(col, shade, cov)
                alpha = max(alpha, cov)

            px[j][i] = (col[0], col[1], col[2], round(alpha * 255))
    return px


def write_png(path, px):
    size = len(px)
    raw = bytearray()
    for row in px:
        raw.append(0)
        for r, g, b, a in row:
            raw += bytes((r, g, b, a))

    def chunk(tag, data):
        return (struct.pack('>I', len(data)) + tag + data
                + struct.pack('>I', zlib.crc32(tag + data) & 0xffffffff))

    png = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(raw), 9))
           + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
    return len(png)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    # Android status-bar icons must be a white silhouette on transparency; the
    # system tints them. These drop into android/app/src/main/res/drawable-*.
    android = [('mdpi', 24), ('hdpi', 36), ('xhdpi', 48), ('xxhdpi', 72), ('xxxhdpi', 96)]
    os.makedirs(os.path.join(OUT, 'android'), exist_ok=True)
    for bucket, size in android:
        n = write_png(os.path.join(OUT, 'android', f'ic_stat_kundala-{bucket}.png'),
                      render(size, mono=True))
        print(f'{"ic_stat_kundala-" + bucket:22} {size}x{size}  {n:>7,} bytes')

    jobs = [
        ('icon-512.png', 512, {}),
        ('icon-192.png', 192, {}),
        ('maskable-512.png', 512, {'maskable': True}),
        ('badge-72.png', 72, {'mono': True}),
        ('playstore-512.png', 512, {}),
    ]
    for name, size, kw in jobs:
        n = write_png(os.path.join(OUT, name), render(size, **kw))
        print(f'{name:22} {size}x{size}  {n:>7,} bytes')
