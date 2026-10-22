/*
  Hand-built 2D silhouette animation. Every frame is drawn separately from a posed skeleton and
  played "on twos" like cel animation. The extra craft is in the drawing, not the frame rate:
  a curved, breathing spine that hunches and straightens, a head that looks down at the book and
  up at the painting with anticipation and overshoot, hair strands and cloth that drag and settle
  behind the motion (follow-through), crossed legs with the sketchbook resting on the knee, and
  two-bone IK so hands really hold the book and the pencil really touches the page.
*/

export const FW = 192, FH = 256, PXM = 130, GROUND = FH - 9;      // frame px, px per metre, baseline
const L1 = 0.46, L2 = 0.45, LU = 0.29, LF = 0.26;                  // thigh, shin, upper arm, forearm (m)
const INK = '#232221', INK_BACK = '#403f3d';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const win = (f, a, b) => smooth((f - a) / (b - a));
const TAU = Math.PI * 2;

/* damped spring that chases a target curve: gives anticipation, overshoot and settle */
function spring(target, f, { k = 520, c = 26, periodic = true } = {}) {
  const steps = 360, dt = 1 / steps;
  const start = periodic ? f - 1 : 0;
  let x = target(((start % 1) + 1) % 1), v = 0;
  for (let t = start; t < f; t += dt) {
    const tt = periodic ? ((t % 1) + 1) % 1 : t;
    const a = k * (target(tt) - x) - c * v; v += a * dt; x += v * dt;
  }
  return x;
}

/* ───────── primitives (metres, y down, figure faces +x) ───────── */
function capsule(g, x0, y0, x1, y1, r0, r1) {
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1e-6;
  const nx = -dy / d, ny = dx / d;
  g.beginPath();
  g.moveTo(x0 + nx * r0, y0 + ny * r0); g.lineTo(x1 + nx * r1, y1 + ny * r1);
  g.arc(x1, y1, r1, Math.atan2(ny, nx), Math.atan2(ny, nx) + Math.PI, true);
  g.lineTo(x0 - nx * r0, y0 - ny * r0);
  g.arc(x0, y0, r0, Math.atan2(-ny, -nx), Math.atan2(-ny, -nx) + Math.PI, true);
  g.closePath(); g.fill();
}
const pt = (x, y, ang, len) => [x + Math.sin(ang) * len, y + Math.cos(ang) * len];
function smoothShape(g, pts, col) {
  g.fillStyle = col; g.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[pts.length - 1], pts[0]); g.moveTo(m0[0], m0[1]);
  for (let i = 0; i < pts.length; i++) { const p = pts[i], m = mid(p, pts[(i + 1) % pts.length]); g.quadraticCurveTo(p[0], p[1], m[0], m[1]); }
  g.closePath(); g.fill();
}
/* a tapered, curved hair strand / cloth tail: root -> tip along a quadratic with a drag offset */
function strand(g, rx, ry, ang, len, w0, bend, dragX, dragY) {
  const dx = Math.sin(ang), dy = Math.cos(ang);
  const tx = rx + dx * len + dragX, ty = ry + dy * len + dragY;
  const cx = rx + dx * len * 0.5 - dy * bend * len + dragX * 0.35, cy = ry + dy * len * 0.5 + dx * bend * len + dragY * 0.35;
  const L = [], R = [], N = 9;
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * rx + 2 * u * t * cx + t * t * tx, y = u * u * ry + 2 * u * t * cy + t * t * ty;
    const ex = 2 * u * (cx - rx) + 2 * t * (tx - cx), ey = 2 * u * (cy - ry) + 2 * t * (ty - cy), d = Math.hypot(ex, ey) || 1;
    const w = w0 * (1 - t * 0.68) * (1 + 0.3 * Math.sin(t * Math.PI));
    L.push([x - (ey / d) * w, y + (ex / d) * w]); R.push([x + (ey / d) * w, y - (ex / d) * w]);
  }
  g.beginPath(); g.moveTo(L[0][0], L[0][1]);
  for (const p of L) g.lineTo(p[0], p[1]);
  for (let i = R.length - 1; i >= 0; i--) g.lineTo(R[i][0], R[i][1]);
  g.closePath(); g.fill();
  g.beginPath(); g.arc(tx, ty, w0 * 0.32, 0, TAU); g.fill();            // soft, rounded tip
}
function ik(sx, sy, tx, ty, upper, fore) {          // two-bone IK, elbow on the lower side
  let dx = tx - sx, dy = ty - sy, d = Math.hypot(dx, dy) || 1e-6;
  const reach = Math.min(d, upper + fore - 0.002); dx = (dx / d) * reach; dy = (dy / d) * reach; d = reach;
  const a = (upper * upper - fore * fore + d * d) / (2 * d), h = Math.sqrt(Math.max(0, upper * upper - a * a));
  const ux = dx / d, uy = dy / d;
  const e1 = [sx + ux * a - uy * h, sy + uy * a + ux * h], e2 = [sx + ux * a + uy * h, sy + uy * a - ux * h];
  const e = e1[1] > e2[1] ? e1 : e2;
  return { ex: e[0], ey: e[1], wx: sx + dx, wy: sy + dy };
}

/* ───────── costumes ───────── */
export const COSTUMES = {
  coat:  { height: 1.0,  hair: 'long',  top: 'coat' },
  pack:  { height: 1.04, hair: 'cap',   top: 'jacket', pack: true },
  skirt: { height: 0.97, hair: 'bob',   top: 'skirt', bag: true },
  scarf: { height: 1.08, hair: 'short', top: 'jacket', scarf: true, bag: true },
};

/* ───────── drawing one frame from a pose ───────── */
function drawFigure(g, P, c) {
  const lg = (th, kn, ft) => ({ th, kn, ft });
  const legs = [lg(...P.leg[0]), lg(...P.leg[1])];
  const bot = (l) => L1 * Math.cos(l.th) + L2 * Math.cos(l.th - l.kn) + 0.065;
  const hipY = P.hipY != null ? P.hipY : Math.max(bot(legs[0]), bot(legs[1]));
  const hx = P.hipX, hy = -hipY;
  const a1 = P.lean, a2 = P.lean + P.hunch;
  const Mx = hx + Math.sin(a1) * 0.27, My = hy - Math.cos(a1) * 0.27 - P.breath * 0.003;
  const Sx = Mx + Math.sin(a2) * 0.27, Sy = My - Math.cos(a2) * 0.27 - P.breath * 0.004;
  const na = a2 + P.head * 0.45, Nx = Sx + Math.sin(na) * 0.075, Ny = Sy - Math.cos(na) * 0.075;
  const ha = a2 + P.head, Hx = Nx + Math.sin(ha) * 0.13, Hy = Ny - Math.cos(ha) * 0.13;

  const leg = (l) => {
    const [kx, ky] = pt(hx, hy, l.th, L1), [ax, ay] = pt(kx, ky, l.th - l.kn, L2);
    return { kx, ky, ax, ay, tx: ax + Math.cos(l.ft) * 0.2, ty: ay + Math.sin(l.ft) * 0.2 + 0.03 };
  };
  const JF = leg(legs[0]), JB = leg(legs[1]);
  const drawLeg = (J, col, skirtSeat) => {
    g.fillStyle = col;
    capsule(g, hx, hy, J.kx, J.ky, 0.08, 0.056);
    capsule(g, J.kx, J.ky, J.ax, J.ay, 0.054, 0.034);
    capsule(g, J.ax, J.ay, J.tx, J.ty - 0.03, 0.036, 0.03);                               // shoe
    capsule(g, J.ax - 0.03, J.ay + 0.015, J.ax + 0.01, J.ay + 0.03, 0.03, 0.026);         // heel
  };

  // book on the crossed knee, hands via IK
  let armF, armB, book = null;
  const angArm = (a) => { const [ex, ey] = pt(Sx, Sy, a.a1, LU); const [wx, wy] = pt(ex, ey, a.a2, LF); return { ex, ey, wx, wy }; };
  if (P.book > 0.01 && P.bookMode === 'knee') {
    // the book rests on the raised thigh and leans away from her, so its page faces her face (a long, steady ~50 degree tilt)
    const phi = 0.85, dx = Math.cos(phi), dy = -Math.sin(phi), len = 0.3;
    const Bx = hx + 0.2, By = hy - 0.075 - Math.max(0, P.hunch - 0.2) * 0.03;
    const nx = dy, ny = -dx;                                                      // page normal: up and back toward her face
    book = { Bx, By, dx, dy, nx, ny, len };
    const along = 0.12 + P.stroke * 0.05 * Math.sin(P.strokePh), off = 0.02 + P.lift * 0.075;
    const tipX = Bx + dx * along + nx * off, tipY = By + dy * along + ny * off + P.stroke * 0.01 * Math.sin(P.strokePh * 2.3);
    armF = ik(Sx, Sy, tipX, tipY, LU, LF);
    armB = ik(Sx, Sy, Bx + dx * 0.06 + nx * 0.03, By + dy * 0.06 + ny * 0.03, LU, LF);  } else {
    armF = P.arm[0].ik ? ik(Sx, Sy, hx + P.arm[0].ik[0], hy + P.arm[0].ik[1], LU, LF) : angArm(P.arm[0]);
    armB = P.arm[1].ik ? ik(Sx, Sy, hx + P.arm[1].ik[0], hy + P.arm[1].ik[1], LU, LF) : angArm(P.arm[1]);
  }
  const drawArm = (A, col) => {
    g.fillStyle = col;
    capsule(g, Sx, Sy, A.ex, A.ey, 0.046, 0.036);
    capsule(g, A.ex, A.ey, A.wx, A.wy, 0.035, 0.027);
    g.beginPath(); g.ellipse(A.wx + 0.008, A.wy + 0.014, 0.034, 0.04, 0.2, 0, TAU); g.fill();
  };

  // satchel on the floor the sketchbook comes out of
  if (c.bag) {
    const bx = hx + 0.5, by = -0.015;
    smoothShape(g, [[bx - 0.13, by], [bx - 0.14, by - 0.1], [bx - 0.07, by - 0.19], [bx + 0.08, by - 0.19], [bx + 0.15, by - 0.09], [bx + 0.13, by]], '#2d2c2a');
    g.fillStyle = '#2d2c2a'; g.beginPath(); g.moveTo(bx - 0.06, by - 0.18); g.quadraticCurveTo(bx - 0.02, by - 0.3, bx + 0.05, by - 0.18); g.lineWidth = 0.02; g.strokeStyle = '#2d2c2a'; g.stroke();
  }
  if (c.pack) smoothShape(g, [[hx - 0.17, hy - 0.2], [hx - 0.27, hy - 0.3], [hx - 0.27, hy - 0.5], [hx - 0.18, hy - 0.6], [hx - 0.1, hy - 0.5], [hx - 0.1, hy - 0.28]], '#2b2a28');

  drawArm(armB, INK_BACK); drawLeg(JB, INK_BACK);

  // curved torso: sample the spine (pelvis -> waist -> shoulders) and give it a back / chest width
  const spine = (t) => {                                         // t 0..1
    const u = 1 - t;
    const x = u * u * hx + 2 * u * t * (Mx + (Mx - hx) * 0.1) + t * t * Sx, y = u * u * hy + 2 * u * t * (My + (My - hy) * 0.1) + t * t * Sy;
    const dx = 2 * u * (Mx - hx) + 2 * t * (Sx - Mx), dy = 2 * u * (My - hy) + 2 * t * (Sy - My), d = Math.hypot(dx, dy) || 1;
    return { x, y, nx: dy / d, ny: -dx / d };                    // normal points forward (+x for an upright spine)
  };
  const prof = (arr, t) => { const x = t * (arr.length - 1), i = Math.min(arr.length - 2, Math.floor(x)); return lerp(arr[i], arr[i + 1], smooth(x - i)); };
  const bw = (t) => prof([0.128, 0.122, 0.108, 0.104, 0.118, 0.14 + P.hunch * 0.09, 0.128 + P.hunch * 0.05, 0.075], t);     // back: lumbar curve, shoulder-blade bulge that grows with the hunch
  const fw = (t) => prof([0.14, 0.15, 0.122, 0.118, 0.15, 0.145, 0.105, 0.07], t) - (c.top === 'skirt' ? 0.01 : 0);        // front: belly, waist, chest, collar
  const outline = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14, s = spine(t); outline.push([s.x - s.nx * bw(t), s.y - s.ny * bw(t)]); }
  for (let i = 14; i >= 0; i--) { const t = i / 14, s = spine(t); outline.push([s.x + s.nx * fw(t), s.y + s.ny * fw(t)]); }
  smoothShape(g, outline, INK);

  // cloth that drapes the seated legs and swings with the body
  const drag = P.drag;
  if (c.top === 'skirt') {
    smoothShape(g, [[hx - 0.14, hy - 0.04], [hx + 0.12, hy - 0.07], [JF.kx + 0.02, JF.ky - 0.075], [JF.kx + 0.085, JF.ky + 0.02], [JF.kx + 0.04, JF.ky + 0.095], [JF.kx - 0.1, JF.ky + 0.1], [hx - 0.04, hy + 0.1], [hx - 0.19, hy + 0.1]], INK);
  } else if (c.top === 'coat') {
    smoothShape(g, [[hx - 0.16, hy - 0.1], [hx + 0.12, hy - 0.07], [JF.kx - 0.02, JF.ky - 0.07], [JF.kx + 0.07, JF.ky + 0.03], [JF.kx - 0.08, JF.ky + 0.12], [hx - 0.1, hy + 0.12 + drag * 0.03], [hx - 0.19 + drag * 0.05, hy + 0.27], [hx - 0.21, hy + 0.04]], INK);
  } else {
    capsule(g, hx, hy, JF.kx, JF.ky, 0.084, 0.062);                              // trouser fullness over the thigh
  }
  g.fillStyle = INK;
  if (c.hair !== 'none') { capsule(g, Sx, Sy, Hx, Hy + 0.055, 0.04, 0.038); }   // neck

  // head: a proper profile (slightly large, as in hand-drawn figures), then hair that trails the motion
  const HS = 1.14;
  g.save(); g.translate(Hx, Hy); g.rotate(ha); g.scale(HS, HS);
  smoothShape(g, [[0.03, -0.112], [0.078, -0.07], [0.087, -0.03], [0.092, -0.002], [0.12, 0.028], [0.093, 0.04], [0.099, 0.053], [0.09, 0.063], [0.095, 0.072], [0.083, 0.098], [0.05, 0.115], [0.0, 0.098], [-0.058, 0.062], [-0.093, -0.02], [-0.07, -0.09], [0.0, -0.116]], INK);
  g.restore();
  const hist = P.histHead;                                       // absolute head angle a few frames ago
  const lagAvg = hist[0] * 0.5 + hist[1] * 0.3 + hist[2] * 0.2;
  const dh = clamp(ha - lagAvg, -0.28, 0.28);                    // how far the head has swung since: drives follow-through
  // hair is always worn down: the hairline stays on the head while the ends hang under gravity and trail the motion
  const hairAt = (x, y, w) => {                                  // w = 1 follows the head, w = 0 mostly hangs and lags behind it
    const th = ha * w + lagAvg * 0.4 * (1 - w), s = Math.sin(th), co = Math.cos(th);
    return [Hx + (x * co - y * s) * HS, Hy + (x * s + y * co) * HS];
  };
  const wob = P.breeze;
  const hairShape = (pts) => smoothShape(g, pts.map(([x, y, w]) => hairAt(x, y, w)), INK);
  if (c.hair === 'long' || c.hair === 'bob') {
    const L = c.hair === 'long' ? 1 : 0;
    const sway = -dh * 0.42 + wob * 0.4;                         // ends swing back as she looks up, fall forward as she looks down
    const fall = Math.max(0, ha) * 0.1;                          // hair slides forward past the cheek when the head dips
    hairShape([
      [0.078, -0.104, 1], [0.02, -0.132, 1], [-0.07, -0.12, 1], [-0.127, -0.045, 1],
      [-0.138 + sway * 0.4, 0.07, 0.6], [-0.128 + sway, 0.15 + L * 0.1, 0.12], [-0.07 + sway * 0.9 + fall, 0.17 + L * 0.12, 0.05],
      [-0.012 + fall * 1.5, 0.12 + L * 0.06, 0.2], [0.018, 0.04, 0.7], [0.05, -0.035, 1], [0.083, -0.088, 1],
    ]);
    hairShape([[0.092, -0.1, 1], [0.1, -0.052, 1], [0.072, -0.02, 1], [0.052, -0.07, 1]]);          // side-swept fringe
  } else if (c.hair === 'cap') {
    hairShape([[-0.09, -0.01, 1], [-0.1, -0.07, 1], [-0.04, -0.125, 1], [0.05, -0.115, 1], [0.085, -0.06, 1], [0.02, -0.075, 1], [-0.05, -0.04, 1]]);
    hairShape([[-0.1, 0.0, 1], [-0.1 + wob * 0.3, 0.07, 0.3], [-0.06, 0.07, 0.4], [-0.05, 0.0, 1]]);
    g.save(); g.translate(Hx, Hy); g.rotate(ha); g.scale(HS, HS); g.fillStyle = INK;
    g.beginPath(); g.moveTo(0.05, -0.098); g.lineTo(0.19, -0.058); g.quadraticCurveTo(0.2, -0.032, 0.17, -0.034); g.lineTo(0.04, -0.06); g.closePath(); g.fill(); g.restore();
  } else if (c.hair === 'short') {
    hairShape([[-0.1, 0.0, 1], [-0.105, -0.075, 1], [-0.04, -0.13, 1], [0.05, -0.122, 1], [0.095, -0.07, 1], [0.03, -0.085, 1], [-0.03, -0.075, 1]]);
    hairShape([[0.03, -0.122, 1], [0.07 + dh * 0.1, -0.15, 0.7], [0.09, -0.11, 1]]);
  }  if (c.scarf) {
    smoothShape(g, [[Nx - 0.1, Ny - 0.01], [Nx + 0.1, Ny - 0.02], [Nx + 0.12, Ny + 0.07], [Nx - 0.08, Ny + 0.1]], INK);
    g.fillStyle = INK;
    const sw = drag * 0.12 + dh * 0.8;
    strand(g, Nx - 0.06, Ny + 0.05, -0.55 - sw, 0.3, 0.05, 0.1 + sw * 0.4, -dh * 0.15, 0.02);
    strand(g, Nx - 0.04, Ny + 0.07, -0.25 - sw * 1.3, 0.24, 0.042, -0.08, -dh * 0.1, 0.03);
  }

  drawLeg(JF, INK);
  if (c.top === 'skirt') smoothShape(g, [[JF.kx - 0.1, JF.ky + 0.06], [JF.kx + 0.06, JF.ky + 0.0], [JF.kx + 0.095, JF.ky + 0.05], [JF.kx + 0.02, JF.ky + 0.13]], INK);
  drawArm(armF, INK);

  if (book) {
    g.save(); g.translate(book.Bx, book.By); g.rotate(Math.atan2(book.dy, book.dx));
    g.fillStyle = '#f2efe6'; g.beginPath(); g.roundRect(0, 0, book.len * P.book, 0.04, 0.007); g.fill();
    g.fillStyle = '#cdc7b5'; g.fillRect(0, 0.03, book.len * P.book, 0.008);
    g.restore();
    g.fillStyle = INK; g.beginPath(); g.ellipse(armB.wx + 0.006, armB.wy + 0.012, 0.03, 0.034, 0.2, 0, TAU); g.fill();
    if (P.pencil > 0.01) { g.fillStyle = '#d8431f'; capsule(g, armF.wx, armF.wy, armF.wx + 0.075 * P.pencil, armF.wy + 0.115 * P.pencil, 0.0075, 0.0045); }
  } else if (P.heldBook > 0.01) {                  // book carried up out of the satchel
    const A = armB; const ang = P.heldAng;
    g.save(); g.translate(A.wx, A.wy); g.rotate(ang); g.scale(P.heldBook, P.heldBook);
    g.fillStyle = '#f2efe6'; g.fillRect(-0.015, -0.2, 0.034, 0.27); g.fillStyle = '#cdc7b5'; g.fillRect(-0.015, -0.2, 0.009, 0.27);
    g.restore();
    g.fillStyle = INK; g.beginPath(); g.ellipse(A.wx + 0.006, A.wy + 0.012, 0.03, 0.034, 0.2, 0, TAU); g.fill();
  }
}

/* ───────── pose building blocks ───────── */
const UNCROSSED = [[1.52, 1.5, 0.05], [1.47, 1.32, 0.05]];
const CROSSED = [[1.7, 2.0, 0.75], [1.5, 1.42, 0.05]];
const legMix = (x) => [0, 1].map((i) => UNCROSSED[i].map((v, k) => lerp(v, CROSSED[i][k], x)));

function sitBase(f, n) {
  const P = {
    hipY: 0.52, hipX: -0.07, lean: 0.06, hunch: 0.1, head: -0.25, breath: Math.sin(f * TAU), drag: 0, breeze: 0.05 * Math.sin(f * TAU * 2),
    leg: legMix(0), arm: [{ a1: 0.2, a2: 0.7 }, { a1: 0.14, a2: 0.5 }],
    book: 0, bookMode: 'knee', pencil: 0, stroke: 0, strokePh: 0, lift: 0, heldBook: 0, heldAng: 0.3, histHead: [0, 0, 0],
  };
  P.arm = [{ ik: [0.34, -0.03] }, { ik: [0.28, -0.015] }];                   // hands resting on the lap
  return P;
}
/* the shared sketching beat, slow and unhurried: eyes on the page, a long look up at the painting, back to the page */
const lookW = (f) => win(f, 0.24, 0.38) - win(f, 0.52, 0.68) + 0.55 * (win(f, 0.8, 0.86) - win(f, 0.9, 0.96));
const headBeat = (f) => 0.42 + (-0.3 - 0.42) * lookW(f);
const hunchBeat = (f) => 0.4 - 0.27 * lookW(f);
function sketchPose(f, n) {
  const P = sitBase(f, n);
  P.leg = legMix(1); P.hipX = -0.08;
  P.head = spring(headBeat, f, { k: 230, c: 24 });
  P.hunch = spring(hunchBeat, f, { k: 110, c: 16 }) + 0.012 * Math.sin(f * TAU * 3);
  P.lean = 0.1 + 0.05 * Math.max(0, P.hunch - 0.2);
  P.book = 1; P.bookMode = 'knee'; P.pencil = 1;
  const looking = smooth((0.3 - Math.abs(P.head)) / 0.3);                    // pencil lifts while she looks up
  const lookUp = clamp(-P.head / 0.2);
  P.lift = spring((t) => clamp(lookW(t) * 1.4), f, { k: 160, c: 20 });
  P.stroke = (1 - P.lift) * 1;
  P.strokePh = f * TAU * 9 + 0.5 * Math.sin(f * TAU);
  P.breath = Math.sin(f * TAU * 1) * 1; P.breeze = 0.04 * Math.sin(f * TAU * 2);
  P.drag = Math.sin(f * TAU) * 0.3; void looking; void lookUp;
  return P;
}
function bookOutPose(f, n) {            // look at painting -> lean to the satchel -> bring the book up -> cross legs -> settle
  const e = sketchPose(0, 24);
  const P = sitBase(f, n);
  const reach = win(f, 0.08, 0.3) * (1 - win(f, 0.3, 0.5));                     // down to the bag, then up
  const rise = win(f, 0.3, 0.52);
  const cross = win(f, 0.5, 0.74);
  const settle = win(f, 0.74, 1.0);
  P.leg = legMix(cross);
  P.hipX = lerp(-0.07, -0.08, cross) + 0.02 * Math.sin(cross * Math.PI);        // weight shifts as the leg lifts
  const antic = -0.05 * win(f, 0.04, 0.1) * (1 - win(f, 0.1, 0.16));            // tiny breath in before moving
  P.lean = 0.06 + 0.2 * reach + 0.04 * cross + antic;
  P.hunch = 0.1 + 0.2 * reach + 0.1 * settle;
  P.head = lerp(-0.25, 0.25, win(f, 0.05, 0.22)) * (1 - settle) + (e.head) * settle - 0.1 * rise * (1 - settle);
  // near hand fishes in the satchel, far hand brings the book up; then both move to the page
  const bagTarget = [0.46, 0.34];
  const nearBag = ik0(bagTarget);
  P.arm = [
    { ik: [lerp(0.34, bagTarget[0], reach), lerp(-0.03, bagTarget[1] - 0.05, reach) - 0.12 * rise] },
    { ik: [lerp(0.28, bagTarget[0] - 0.04, reach) + 0.04 * rise, lerp(-0.015, bagTarget[1] - 0.05, reach) - 0.28 * rise] },
  ];
  P.heldBook = smooth((f - 0.2) / 0.1) * (1 - win(f, 0.72, 0.8)); P.heldAng = lerp(0.3, 0.9, rise);
  if (f > 0.72) { P.arm = [{ ik: [0.34, -0.03] }, { ik: [0.28, -0.015] }]; }
  P.bookMode = f > 0.74 ? 'knee' : 'none'; P.book = win(f, 0.74, 0.82); P.pencil = win(f, 0.62, 0.8);
  P.stroke = 0; P.strokePh = 0; P.lift = 1 - settle;
  void nearBag;
  // blend the last stretch into the first frame of the sketching loop so the cut is invisible
  if (f > 0.86) { const b = win(f, 0.86, 1); const s0 = sketchPose(0, 24); P.head = lerp(P.head, s0.head, b); P.hunch = lerp(P.hunch, s0.hunch, b); P.lean = lerp(P.lean, s0.lean, b); P.lift = lerp(P.lift, s0.lift, b); P.stroke = lerp(0, s0.stroke, b); P.hipX = lerp(P.hipX, s0.hipX, b); }
  P.drag = 0.5 * Math.sin(f * TAU * 1.5) * (1 - settle);
  return P;
}
function ik0(t) { return t; }

function lookPose(f, n) {               // seated, watching the painting, with small shifts
  const P = sitBase(f, n);
  P.head = spring((t) => -0.26 + 0.07 * Math.sin(t * TAU) + (t > 0.6 && t < 0.78 ? 0.18 : 0), f, { k: 300, c: 20 });
  P.hunch = 0.1 + 0.025 * Math.sin(f * TAU + 1); P.lean = 0.05 + 0.012 * Math.sin(f * TAU);
  P.drag = Math.sin(f * TAU) * 0.2;
  return P;
}
function nodPose(f, n) {
  const P = lookPose(f, n);
  P.head = spring((t) => -0.12 + (t < 0.2 ? 0.26 * Math.sin(t / 0.2 * Math.PI) : t < 0.5 && t > 0.3 ? 0.22 * Math.sin((t - 0.3) / 0.2 * Math.PI) : 0), f, { k: 520, c: 22 });
  P.hunch = 0.12 + 0.05 * Math.max(0, P.head); P.lean = 0.06;
  return P;
}
function talkPose(f, n) {               // speaking with the near hand drawing shapes in the air
  const P = sitBase(f, n), g = Math.sin(f * TAU);
  P.head = spring((t) => -0.08 + 0.1 * Math.sin(t * TAU * 2 + 1), f, { k: 280, c: 18 });
  P.lean = 0.07 + 0.035 * Math.max(0, g); P.hunch = 0.1 + 0.03 * g;
  P.arm = [{ ik: [0.38 + 0.12 * Math.sin(f * TAU * 2), -0.5 + 0.15 * Math.sin(f * TAU * 2 + 1) - 0.05 * g] }, { ik: [0.28, -0.015] }];
  P.drag = g * 0.4;
  return P;
}
function pointPose(f, n) {              // anticipation, lift past the target, settle, hold, ease down
  const P = sitBase(f, n);
  const target = (t) => (t < 0.08 ? -0.1 * smooth(t / 0.08) : t < 0.36 ? lerp(-0.1, 1, smooth((t - 0.08) / 0.28)) : t < 0.74 ? 1 : 1 - smooth((t - 0.74) / 0.26));
  const up = spring(target, f, { k: 380, c: 20, periodic: true });
  const hold = f > 0.4 && f < 0.74 ? 0.025 * Math.sin((f - 0.4) / 0.34 * Math.PI * 3) : 0;
  P.arm = [{ a1: lerp(0.2, 1.72, up) + hold, a2: lerp(0.7, 1.84, up) + hold * 0.6 }, { ik: [0.28, -0.015] }];
  P.lean = lerp(0.05, 0.16, up); P.hunch = lerp(0.1, 0.03, up); P.head = lerp(-0.25, -0.36, up) + 0.04 * Math.sin(f * TAU * 2) * (1 - up);
  P.drag = up * 0.5;
  return P;
}

/* ───────── standing and strolling ───────── */
function legCycle(q, amp) {            // q in [0,1): stance first, swing second (contact / down / passing / up)
  if (q < 0.5) { const s = q / 0.5; return [amp - 2 * amp * s * 0.98, 0.06 + 0.2 * Math.sin(Math.PI * s), lerp(0.0, 0.55, smooth((s - 0.78) / 0.22)) + (s < 0.12 ? -0.25 * (1 - s / 0.12) : 0)]; }
  const s = (q - 0.5) / 0.5, e = smooth(s);
  return [-amp + 2 * amp * e, 0.1 + 1.0 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 1.05)), 1.15), lerp(0.65, -0.1, smooth(s * 1.3))];
}
function standBase(f) {
  return {
    hipY: null, hipX: 0, lean: 0.03, hunch: 0.05, head: -0.1, breath: Math.sin(f * TAU), drag: 0, breeze: 0.05 * Math.sin(f * TAU * 2),
    leg: [[0.06, 0.03, 0.14], [-0.04, 0.1, 0.1]], arm: [{ a1: 0.1, a2: 0.2 }, { a1: -0.08, a2: 0.05 }],
    book: 0, bookMode: 'none', pencil: 0, stroke: 0, strokePh: 0, lift: 0, heldBook: 0, heldAng: 0, histHead: [0, 0, 0],
  };
}
function walkPose(f) {
  const P = standBase(f), sw = Math.sin(f * TAU);
  P.leg = [legCycle(f, 0.4), legCycle((f + 0.5) % 1, 0.4)];
  P.arm = [{ a1: -0.5 * sw + 0.04, a2: -0.5 * sw + 0.28 + 0.2 * Math.max(0, -sw) }, { a1: 0.5 * sw - 0.04, a2: 0.5 * sw + 0.28 + 0.2 * Math.max(0, sw) }];
  P.lean = 0.07 + 0.012 * Math.cos(f * TAU * 2); P.hunch = 0.04; P.head = -0.05 + 0.02 * Math.sin(f * TAU * 2 + 0.6);
  P.hipX = 0.012 * Math.sin(f * TAU); P.drag = Math.sin(f * TAU * 2 - 1.1) * 0.6; P.breeze = 0.1 * Math.sin(f * TAU * 2 - 0.8);
  return P;
}
function standPose(f) {                 // taking in a painting: weight shifts, head tilts, hands clasped behind
  const P = standBase(f);
  P.head = spring((t) => -0.16 + 0.07 * Math.sin(t * TAU) + (t > 0.55 && t < 0.75 ? 0.16 : 0), f, { k: 180, c: 20 });
  P.lean = 0.02 + 0.012 * Math.sin(f * TAU + 1); P.hipX = 0.008 * Math.sin(f * TAU);
  P.arm = [{ a1: -0.3, a2: -0.12 }, { a1: -0.36, a2: -0.12 }];
  P.leg = [[0.08, 0.03, 0.14], [-0.05, 0.12, 0.1]]; P.drag = 0.3 * Math.sin(f * TAU);
  return P;
}
const rev = (fn, n) => (i, nn) => fn((nn - 1 - i) / (nn - 1) * 0.999 + 0.0005, nn);
export const CLIP_DEFS = {
  walk:     { n: 16, fps: 12, fn: (i, n) => walkPose(i / n), periodic: true },
  stand:    { n: 8,  fps: 6,  fn: (i, n) => standPose(i / n), periodic: true },
  sitLook:  { n: 8,  fps: 6,  fn: (i, n) => lookPose(i / n, n),   periodic: true },
  sitNod:   { n: 10, fps: 9,  fn: (i, n) => nodPose(i / n, n),    periodic: true },
  sitTalk:  { n: 16, fps: 8,  fn: (i, n) => talkPose(i / n, n),   periodic: true },
  sitPoint: { n: 14, fps: 9,  fn: (i, n) => pointPose(i / n, n),  periodic: true },
  bookOut:  { n: 28, fps: 9,  fn: (i, n) => bookOutPose(i / (n - 1), n), periodic: false },
  sketch:   { n: 40, fps: 10, fn: (i, n) => sketchPose(i / n, n), periodic: true },
  bookAway: { n: 20, fps: 9,  fn: (i, n) => bookOutPose(1 - i / (n - 1), n), periodic: false },
};
export const COSTUME_CLIPS = {
  coat:  ['walk', 'stand', 'sitLook', 'sitTalk', 'sitNod', 'sitPoint'],
  pack:  ['walk', 'stand', 'sitLook', 'sitTalk', 'sitNod', 'sitPoint'],
  skirt: ['sitLook', 'bookOut', 'sketch', 'bookAway'],
  scarf: ['sitLook', 'bookOut', 'sketch', 'bookAway'],
};

/* one atlas per costume: every frame of every clip, each drawn on its own */
export function buildAtlas(costume) {
  const c = COSTUMES[costume];
  const names = COSTUME_CLIPS[costume];
  const total = names.reduce((s, k) => s + CLIP_DEFS[k].n, 0);
  const cols = Math.ceil(Math.sqrt(total * (FH / FW)) * 0.95), rows = Math.ceil(total / cols);
  const canvas = document.createElement('canvas'); canvas.width = cols * FW; canvas.height = rows * FH;
  const g = canvas.getContext('2d');
  const clips = {}; let k = 0;
  const headAbs = (P) => P.lean + P.hunch + P.head;
  for (const name of names) {
    const d = CLIP_DEFS[name]; clips[name] = { start: k, n: d.n, fps: d.fps };
    const poses = []; for (let i = 0; i < d.n; i++) poses.push(d.fn(i, d.n));
    for (let i = 0; i < d.n; i++, k++) {
      const P = poses[i];
      const at = (j) => poses[d.periodic ? ((i - j) % d.n + d.n) % d.n : Math.max(0, i - j)];
      P.histHead = [headAbs(at(1)), headAbs(at(2)), headAbs(at(3))];
      const col = k % cols, row = Math.floor(k / cols);
      g.save(); g.beginPath(); g.rect(col * FW, row * FH, FW, FH); g.clip();
      g.translate(col * FW + FW / 2 - 0.05 * PXM, row * FH + GROUND); g.scale(PXM, PXM);
      drawFigure(g, P, c);
      g.restore();
    }
  }
  return { canvas, cols, rows, clips, height: c.height };
}

/* a flat gallery bench, drawn once */
export function benchCanvas() {
  const c = document.createElement('canvas'); c.width = 320; c.height = 100; const g = c.getContext('2d');
  g.scale(200, 200);
  g.fillStyle = '#7d5f3d'; g.beginPath(); g.roundRect(0.02, 0.03, 1.56, 0.075, 0.025); g.fill();
  g.fillStyle = '#5d4529'; g.fillRect(0.04, 0.095, 1.52, 0.012);
  g.fillStyle = '#2b2a28'; g.fillRect(0.16, 0.105, 0.05, 0.37); g.fillRect(1.39, 0.105, 0.05, 0.37);
  g.fillRect(0.11, 0.465, 0.15, 0.03); g.fillRect(1.34, 0.465, 0.15, 0.03);
  return c;
}
