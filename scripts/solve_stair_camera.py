"""
Solve the camera that took the stairwell photo, from landmarks on the staircase model.
Pure Python (no numpy): random-restart Nelder-Mead on a pinhole camera.

Model space (metres): back wall z = 0 (faces +z), stair side plane x = 0 (faces +x), floor y = 0.
  T0 = (0, HC, 0)   top of the corner edge, where stair underside / landing meets the back wall
  B0 = (0, 0, 0)    bottom of the corner edge
The lower flight rises away from the viewer along x = 0 with slope S, so its underside meets the floor at z = HC / S.
The upper flight's soffit runs from the back wall line y = HC and rises toward the viewer with the same slope.

Photo landmarks are pixels in the 1100 x 1139 preview of "mural photo edited.jpg".
Run: python -I scripts/solve_stair_camera.py
"""
import math, random

PW, PH = 1100.0, 1139.0
HC, S = 2.15, 0.607
ZL = HC / S

OBS = {
    'T0': (570, 545), 'B0': (557, 972),
    'floorL': (140, 1133),        # where the stair underside meets the floor (white wall's lower-left tip)
    'floorR': (1095, 1082),       # back-wall floor line leaves the photo
    'soffitL': (180, 0),          # soffit's left edge leaves the top of the photo
    'soffitR': (978, 0),          # soffit's right edge leaves the top of the photo
    'landR': (1087, 468),         # soffit meets the back wall at its right edge
}

def norm(v):
    l = math.sqrt(sum(a * a for a in v)) or 1e-9
    return [a / l for a in v]
def cross(a, b): return [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
def dot(a, b): return sum(x * y for x, y in zip(a, b))

def make_cam(p):
    cx, cy, cz, yaw, pitch, roll, fov = p
    f = norm([math.sin(yaw) * math.cos(pitch), math.sin(pitch), -math.cos(yaw) * math.cos(pitch)])
    r = norm(cross(f, [0, 1, 0])); u = cross(r, f)
    cr, sr = math.cos(roll), math.sin(roll)
    r, u = [cr * a + sr * b for a, b in zip(r, u)], [-sr * a + cr * b for a, b in zip(r, u)]
    F = (PH / 2) / math.tan(fov / 2)
    return (cx, cy, cz), f, r, u, F

def project(cam, P):
    C, f, r, u, F = cam
    d = [P[i] - C[i] for i in range(3)]
    z = dot(d, f)
    if z < 0.05: return None
    return (PW / 2 + F * dot(d, r) / z, PH / 2 - F * dot(d, u) / z)

def line_dist(pt, a, b):
    ax, ay = a; bx, by = b; px, py = pt
    dx, dy = bx - ax, by - ay; l = math.hypot(dx, dy) or 1e-9
    return abs(dy * (px - ax) - dx * (py - ay)) / l

def cost(p, wu, S):
    if not (0.3 < p[6] < 1.6) or not (0.3 < S < 1.1): return 1e9
    ZL = HC / S
    cam = make_cam(p)
    pts = {'T0': (0, HC, 0), 'B0': (0, 0, 0), 'floorL': (0, 0, ZL), 'landR': (wu, HC, 0)}
    pr = {k: project(cam, v) for k, v in pts.items()}
    if any(v is None for v in pr.values()): return 1e9
    e = 0.0
    for k in pts:
        e += (pr[k][0] - OBS[k][0]) ** 2 + (pr[k][1] - OBS[k][1]) ** 2
    far = project(cam, (6, 0, 0)); sl = project(cam, (0, HC + S * 4, 4)); sr = project(cam, (wu, HC + S * 4, 4))
    wr = project(cam, (wu, HC, 0))
    if far is None or sl is None or sr is None: return 1e9
    e += 3 * line_dist(OBS['floorR'], pr['B0'], far) ** 2
    e += 3 * line_dist(OBS['soffitL'], pr['T0'], sl) ** 2
    e += 3 * line_dist(OBS['soffitR'], wr, sr) ** 2
    return e

def nelder(f, x0, step, iters=1800):
    n = len(x0); sim = [x0[:]]
    for i in range(n):
        y = x0[:]; y[i] += step[i]; sim.append(y)
    vals = [f(s) for s in sim]
    for _ in range(iters):
        order = sorted(range(n + 1), key=lambda i: vals[i]); sim = [sim[i] for i in order]; vals = [vals[i] for i in order]
        cen = [sum(sim[i][j] for i in range(n)) / n for j in range(n)]
        xr = [cen[j] + (cen[j] - sim[-1][j]) for j in range(n)]; fr = f(xr)
        if fr < vals[0]:
            xe = [cen[j] + 2 * (cen[j] - sim[-1][j]) for j in range(n)]; fe = f(xe)
            if fe < fr: sim[-1], vals[-1] = xe, fe
            else: sim[-1], vals[-1] = xr, fr
        elif fr < vals[-2]: sim[-1], vals[-1] = xr, fr
        else:
            xc = [cen[j] + 0.5 * (sim[-1][j] - cen[j]) for j in range(n)]; fc = f(xc)
            if fc < vals[-1]: sim[-1], vals[-1] = xc, fc
            else:
                for i in range(1, n + 1):
                    sim[i] = [sim[0][j] + 0.5 * (sim[i][j] - sim[0][j]) for j in range(n)]; vals[i] = f(sim[i])
    i = min(range(n + 1), key=lambda i: vals[i]); return sim[i], vals[i]

random.seed(7)
best = (None, 1e18)
for trial in range(240):
    wu = random.uniform(0.9, 3.2)
    x0 = [random.uniform(0.5, 4), random.uniform(1.3, 2.2), random.uniform(2.5, 8), random.uniform(-0.9, 0.5), random.uniform(-0.5, 0.1), random.uniform(-0.1, 0.1), random.uniform(0.7, 1.3), wu, random.uniform(0.4, 0.9)]
    f = lambda p: cost(p[:7], p[7], p[8]) + (0 if 0.5 < p[7] < 4.5 else 1e9)
    sol, c = nelder(f, x0, [0.5, 0.2, 0.5, 0.2, 0.1, 0.03, 0.1, 0.3, 0.1], 1800)
    if c < best[1]: best = (sol, c); print(trial, round(c, 2), [round(v, 3) for v in sol], flush=True)
sol, c = best
print('FINAL', round(c, 3), 'rms px', round(math.sqrt(c / 12), 2))
print('cam', [round(v, 4) for v in sol[:7]], 'wu', round(sol[7], 3), 'slope', round(sol[8], 3), 'fov deg', round(math.degrees(sol[6]), 2))
ZL = HC / sol[8]
cam = make_cam(sol[:7])
for k, v in {'T0': (0, HC, 0), 'B0': (0, 0, 0), 'floorL': (0, 0, ZL), 'landR': (sol[7], HC, 0)}.items():
    print(k, [round(a) for a in project(cam, v)], 'obs', OBS[k])
