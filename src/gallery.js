import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildAtlas, benchCanvas, FW, FH, PXM, GROUND, CLIP_DEFS } from './figures2d.js';

/*
  Fine-art gallery: a staged room (beige walls, dark coffered ceiling, oak floor, arched doorways,
  pedestals, plaques) seen in perspective. Scrolling walks the camera along the back wall past the
  paintings. People are frame-by-frame 2D silhouette animations that stroll, sit and sketch, and
  talk about the work; they cast real shadows. The artwork itself is never lit or tinted.
*/

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

const SPACING = 4.7, X0 = 3.6, EYE = 1.55;
const SRGB = THREE.SRGBColorSpace;

/* ───────── procedural textures ───────── */
function canvasTex(w, h, draw, { repeat, srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = SRGB; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
const plank = (rx, ry) => canvasTex(512, 512, (g) => {
  g.fillStyle = '#c9ab80'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 8; i++) {
    const y = i * 64, k = ((i * 53) % 17) - 8;
    g.fillStyle = `rgb(${204 + k},${174 + k},${134 + k})`; g.fillRect(0, y, 512, 62);
    for (let n = 0; n < 40; n++) { g.fillStyle = `rgba(90,55,25,${0.025 + (n % 4) * 0.012})`; g.fillRect((n * 97 + i * 31) % 512, y + 3 + (n * 13) % 56, 40 + (n * 29) % 150, 1); }
    g.fillStyle = 'rgba(60,35,15,.34)'; g.fillRect(0, y + 62, 512, 2);
    const cut = (i * 211) % 420 + 40; g.fillStyle = 'rgba(60,35,15,.3)'; g.fillRect(cut, y, 2, 62);
  }
}, { repeat: [rx, ry] });
const plaster = (rx, ry) => canvasTex(256, 256, (g) => {
  g.fillStyle = '#e6dac5'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 5200; i++) { const v = (Math.random() - 0.5) * 16; g.fillStyle = `rgba(${v > 0 ? 255 : 90},${v > 0 ? 250 : 70},${v > 0 ? 235 : 50},${Math.abs(v) / 420})`; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2); }
}, { repeat: [rx, ry] });
const blobTex = () => canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 4, 64, 64, 62); r.addColorStop(0, 'rgba(0,0,0,.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
const rectShadowTex = () => canvasTex(256, 256, (g) => { g.shadowColor = 'rgba(0,0,0,.9)'; g.shadowBlur = 38; g.fillStyle = '#000'; g.fillRect(58, 58, 140, 140); });
const plaqueTex = (title, meta) => canvasTex(320, 160, (g) => {
  g.fillStyle = '#f6f2e9'; g.fillRect(0, 0, 320, 160); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; g.strokeRect(5, 5, 310, 150);
  g.fillStyle = '#1b1b1b'; g.font = '500 25px "Jost Variable", Jost, sans-serif'; g.textBaseline = 'top';
  g.fillText(title.toUpperCase().slice(0, 22), 22, 30);
  g.fillStyle = '#6b6b6b'; g.font = '400 18px "Inter Variable", Inter, sans-serif'; g.fillText((meta || '').slice(0, 30), 22, 78);
  g.fillStyle = '#6b6b6b'; g.fillText('Anna Rohn', 22, 112);
});
const doorTex = () => canvasTex(128, 256, (g) => { const r = g.createLinearGradient(0, 0, 0, 256); r.addColorStop(0, '#4a3f33'); r.addColorStop(0.55, '#b9a283'); r.addColorStop(1, '#f1e4c8'); g.fillStyle = r; g.fillRect(0, 0, 128, 256); const s = g.createLinearGradient(0, 0, 128, 0); s.addColorStop(0, 'rgba(0,0,0,.35)'); s.addColorStop(0.5, 'rgba(255,255,255,.12)'); s.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = s; g.fillRect(0, 0, 128, 256); });

/* ───────── 2D sprites that cast shadows ───────── */
function atlasTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas); t.colorSpace = SRGB; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; return t;
}
function makeSprite(atlas, baseTex, { scale = 1 } = {}) {
  const s = scale * atlas.height;
  const w = (FW / PXM) * s, h = (FH / PXM) * s;
  const tex = baseTex.clone(); tex.repeat.set(1 / atlas.cols, 1 / atlas.rows);
  const mat = new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.42, side: THREE.DoubleSide, toneMapped: false, transparent: true, opacity: 0.76 });   // a tad translucent, like an architectural scale figure
  mat.shadowSide = THREE.DoubleSide;
  const geo = new THREE.PlaneGeometry(w, h);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = h / 2 - ((FH - GROUND) / PXM) * s;
  mesh.castShadow = true;
  mesh.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: tex, alphaTest: 0.42 });
  const group = new THREE.Group(); group.add(mesh);
  const api = {
    group, atlas, face: 1,
    set(name, idx) {
      const c = atlas.clips[name]; const k = c.start + (idx % c.n);
      tex.offset.set((k % atlas.cols) / atlas.cols, 1 - (Math.floor(k / atlas.cols) + 1) / atlas.rows);
    },
    place(x, z, face = this.face) { this.face = face; group.position.set(x, 0, z); mesh.scale.x = face; },
  };
  api.set(Object.keys(atlas.clips)[0], 0);
  return api;
}
const frameAt = (clip, t) => Math.floor(t * CLIP_DEFS[clip].fps);

/* ───────── behaviours ───────── */
/* strollers drift along the wall, pause between paintings, and never block the painting being viewed:
   after more than a second in front of it they walk on out of the way */
function stroller(sp, arts, state, { z = 3.9, speed = 0.95, stops, start = 0, dir = 1 } = {}) {
  let i = start, x = stops[i], face = dir, wait = 0, tw = 0, inFront = 0, flee = null;
  return (dt, t) => {
    const focusArt = arts.reduce((best, a) => (Math.abs(a.x - state.focus) < Math.abs(best.x - state.focus) ? a : best), arts[0]);
    const half = focusArt.ow / 2 + 0.5;
    inFront = focusArt.a > 0.3 && Math.abs(x - focusArt.x) < half ? inFront + dt : 0;
    if (inFront > 1 && !flee) {
      const side = dir !== 0 && wait <= 0 ? dir : (x >= focusArt.x ? 1 : -1);
      flee = { target: focusArt.x + side * (half + 0.8), side };
      wait = 0;
    }
    const go = (target, v) => { const dx = target - x; const step = Math.sign(dx) * Math.min(Math.abs(dx), v * dt); x += step; face = Math.sign(dx) || face; tw += dt; sp.set('walk', frameAt('walk', tw)); return Math.abs(dx) < 0.05; };
    if (flee) {
      if (go(flee.target, speed * 1.5)) {
        dir = flee.side; const nearest = stops.reduce((bi, s, k) => (dir * (s - x) > 0.3 && (bi < 0 || Math.abs(s - x) < Math.abs(stops[bi] - x)) ? k : bi), -1);
        i = nearest >= 0 ? nearest : clamp(i, 0, stops.length - 1); flee = null;
      }
    } else if (wait > 0) {
      wait -= dt; sp.set('stand', frameAt('stand', t));
      const art = arts.reduce((best, a) => (Math.abs(a.x - x) < Math.abs(best.x - x) ? a : best), arts[0]); face = Math.sign(art.x - x) || face;
      if (wait <= 0) { if (i + dir < 0 || i + dir >= stops.length) dir *= -1; i = clamp(i + dir, 0, stops.length - 1); }
    } else if (go(stops[i], speed)) { wait = 2.5 + Math.random() * 2.5; }
    sp.place(x, z, face);
  };
}
function sequence(sp, x, z, steps, offset = 0) {
  const total = steps.reduce((s, st) => s + st.d, 0);
  return (dt, t) => {
    let c = (t + offset) % total, st = steps[0];
    for (const s of steps) { if (c < s.d) { st = s; break; } c -= s.d; }
    const d = CLIP_DEFS[st.clip], span = (st.to ?? d.n) - (st.from ?? 0);
    let k = Math.floor(c * d.fps);
    if (st.once) k = Math.min(k, span - 1);
    sp.set(st.clip, (st.from ?? 0) + (k % span)); sp.place(x, z, st.face ?? 1);
  };
}
const sketchSteps = () => [
  { clip: 'sitLook', d: 3.2, face: -1 }, { clip: 'bookOut', d: 3.1, once: true, face: -1 }, { clip: 'sketch', d: 12, face: -1 }, { clip: 'bookAway', d: 2.2, once: true, face: -1 }, { clip: 'sitLook', d: 2.4, face: -1 },
];

/* ───────── the room ───────── */
const IN = 0.0254 * 3;                       // paintings are shown at 3x scale: 1 inch of canvas = 7.6 cm of wall

export function createGallery(canvas, works, { onIndex, reduced = false } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1.25 : 1.75));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;           // crisp silhouette shadows
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.98;
  renderer.outputColorSpace = SRGB;

  const hung = works.filter((w) => !w.finale), finale = works.find((w) => w.finale);
  const n = hung.length;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const L = X0 + (n - 1) * SPACING + 12;
  const XH = X0 + (n - 1) * SPACING + 3.7;
  const XE = XH - 1.45;                                                        // the end wall: perpendicular to the painting walls, hiding the stairwell until you round it                                   // the stairwell hall opens just past the last painting
  const mobile0 = (canvas.clientWidth || 1) / (canvas.clientHeight || 1) < 0.9;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2b2825);
  scene.fog = new THREE.Fog(0x2a2724, 20, 56);
  scene.environment = envTex; scene.environmentIntensity = 0.16;
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 90);

  scene.add(new THREE.HemisphereLight(0xffe9d2, 0x7d6448, 1.05));
  const key = new THREE.DirectionalLight(0xfff0dc, 0.3);                      // low key light: shadows read as a very light grey
  key.castShadow = true; key.shadow.mapSize.set(4096, 4096);
  Object.assign(key.shadow.camera, { left: -10, right: 10, top: 7, bottom: -5, near: 1, far: 32 });
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015; key.shadow.radius = 1;
  scene.add(key, key.target);

  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...extra });
  const LEN = L + 60, CX = L / 2;

  // oak floor and warm brown ceiling run on past where the wall used to be: the space opens up behind the paintings
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 64), new THREE.MeshStandardMaterial({ color: 0xffffff, map: plank(LEN / 4, 64 / 4), roughness: 0.42, metalness: 0.0 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(CX, 0, 14); floor.receiveShadow = true; scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(LEN, 64), std(0x3a2d24, { roughness: 0.9, emissive: 0x3a2d24, emissiveIntensity: 0.7 }));   // same warm brown as the rails
  ceil.rotation.x = Math.PI / 2; ceil.position.set(CX, 4.6, 14); scene.add(ceil);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.05, 0.07), std(0x1a1410, { roughness: 0.5 })); rail.position.set(CX, 4.34, 0.13); scene.add(rail);
  [1.4, 6.5, 11.5].forEach((z) => { const s = new THREE.Mesh(new THREE.BoxGeometry(LEN, 0.02, 0.1), new THREE.MeshBasicMaterial({ color: 0xfff1d6 })); s.position.set(CX, 4.42, z); scene.add(s); });

  // ───── funky architectural backdrop: layered arches, discs, pipes and stairs receding behind the paintings
  const PAL = [0xc8654a, 0xe3b04b, 0x3a9a95, 0x9b86c9, 0xefe3cf, 0x3c6b53, 0xd9825b];
  const tone = (c, k = 0.2) => std(c, { roughness: 0.78, emissive: c, emissiveIntensity: k, side: THREE.DoubleSide });
  const archShape = (w, h) => { const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(-w / 2, h - w / 2); s.absarc(0, h - w / 2, w / 2, Math.PI, 0, true); s.lineTo(w / 2, 0); s.closePath(); return s; };
  const farTex = canvasTex(4, 256, (g) => { const r = g.createLinearGradient(0, 0, 0, 256); r.addColorStop(0, '#3a2a22'); r.addColorStop(0.5, '#a8704f'); r.addColorStop(0.82, '#f0c08c'); r.addColorStop(1, '#fbe3bd'); g.fillStyle = r; g.fillRect(0, 0, 4, 256); });
  const far = new THREE.Mesh(new THREE.PlaneGeometry(LEN + 80, 16), new THREE.MeshBasicMaterial({ map: farTex, toneMapped: false })); far.position.set(CX, 5.5, -17); scene.add(far);
  // single, well-spaced pieces in two staggered layers: none is taller than 4.2 m (the ceiling is 4.6) and none shares space with another
  const KINDS = ['arch', 'disc', 'pipes', 'stairs', 'slab'];
  const SLOT = 3.1;
  let k = 0;
  for (let x = -7; x < L + 14; x += SLOT, k++) {
    if (x > XE - 2.2 && x < XE + 15) continue;                                // the stairwell sits behind its corner wall
    const c = PAL[k % PAL.length], kind = KINDS[k % KINDS.length];
    if (kind === 'arch') {
      const w = 1.7 + (k % 3) * 0.2, h = 3.1 + (k % 4) * 0.25;
      const outer = archShape(w + 0.55, h + 0.28); outer.holes.push(new THREE.Path(archShape(w, h).getPoints(28)));
      const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.5, bevelEnabled: false }), tone(c, 0.26)); arch.position.set(x, 0, -3.8 - (k % 2) * 0.5); scene.add(arch);
    } else if (kind === 'disc') {
      const r = 1.15 + (k % 3) * 0.1, disc = new THREE.Mesh(new THREE.CircleGeometry(r, 48), tone(c, 0.3)); disc.position.set(x, r + 0.9, -4.6); scene.add(disc);
    } else if (kind === 'pipes') {
      [0, 1, 2].forEach((j) => { const hh = 2.3 + j * 0.8 + (k % 2) * 0.3; const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, hh, 28), tone(PAL[(k + j + 1) % PAL.length], 0.24)); cyl.position.set(x - 0.65 + j * 0.65, hh / 2, -4.4); scene.add(cyl); });
    } else if (kind === 'stairs') {
      for (let s = 0; s < 7; s++) { const st = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.3, 0.55), tone(PAL[(k + s) % PAL.length], 0.18)); st.position.set(x, 0.15 + s * 0.3, -4.6 - s * 0.55); scene.add(st); }
    } else {
      const sl = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.18, 1.2), tone(c, 0.25)); sl.position.set(x, 3.1, -4.8); sl.rotation.set(0.08, 0.45, -0.14); scene.add(sl);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 3.0, 12), tone(PAL[(k + 3) % PAL.length], 0.2)); post.position.set(x, 1.5, -4.8); scene.add(post);
    }
    if (k % 2 === 0) {                                                        // far layer, between the near pieces
      const fx = x + SLOT / 2, fk = k + 1;
      if (!(fx > XE - 2.2 && fx < XE + 15)) {
        if (fk % 4 === 1) { const d = new THREE.Mesh(new THREE.CircleGeometry(1.45, 48), tone(PAL[(k + 4) % PAL.length], 0.3)); d.position.set(fx, 2.6, -10.2); scene.add(d); }
        else { const ow2 = archShape(2.9, 4.0); ow2.holes.push(new THREE.Path(archShape(2.3, 3.7).getPoints(28))); const a2 = new THREE.Mesh(new THREE.ExtrudeGeometry(ow2, { depth: 0.6, bevelEnabled: false }), tone(PAL[(k + 2) % PAL.length], 0.22)); a2.position.set(fx, 0, -10.2); scene.add(a2); }
      }
    }
  }

  // ───── paintings hang straight on their walls
  const rectShadow = rectShadowTex();
  const loader = new THREE.TextureLoader();
  const FRAME_STYLE = { gold: { t: 41, ft: 0.17 }, bronze: { t: 26, ft: 0.105 }, black: { t: 76, ft: 0.165 } };
  const frameImgs = {};
  const frameImage = (key) => (frameImgs[key] ||= new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `./img/frame-${key}.webp`; }));
  /* nine-slice the photographed frame onto a canvas of exactly the size this painting needs */
  function frameTexture(key, ow, oh) {
    const st = FRAME_STYLE[key], PPM = 230;
    const W = Math.round(ow * PPM), H = Math.round(oh * PPM), T = Math.round(st.ft * PPM);
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = SRGB; tex.anisotropy = 8;
    frameImage(key).then((im) => {
      if (!im) return;
      const g = c.getContext('2d'), t = st.t, sw = im.naturalWidth, sh = im.naturalHeight, kk = T / t;
      g.clearRect(0, 0, W, H);
      const tile = (sx, sy, sW, sH, dx, dy, dW, dH, horizontal) => {            // repeat a chunk of the real moulding along an edge
        const chunk = Math.min(horizontal ? sW : sH, (horizontal ? sH : sW) * 6);
        const cx = horizontal ? sx + (sW - chunk) / 2 : sx, cy = horizontal ? sy : sy + (sH - chunk) / 2;
        g.save(); g.beginPath(); g.rect(dx, dy, dW, dH); g.clip();
        if (horizontal) { const w = chunk * kk; for (let x = dx; x < dx + dW; x += w) g.drawImage(im, cx, cy, chunk, sH, x, dy, w, dH); }
        else { const h = chunk * kk; for (let y = dy; y < dy + dH; y += h) g.drawImage(im, cx, cy, sW, chunk, dx, y, dW, h); }
        g.restore();
      };
      tile(t, 0, sw - 2 * t, t, T, 0, W - 2 * T, T, true);
      tile(t, sh - t, sw - 2 * t, t, T, H - T, W - 2 * T, T, true);
      tile(0, t, t, sh - 2 * t, 0, T, T, H - 2 * T, false);
      tile(sw - t, t, t, sh - 2 * t, W - T, T, T, H - 2 * T, false);
      g.drawImage(im, 0, 0, t, t, 0, 0, T, T); g.drawImage(im, sw - t, 0, t, t, W - T, 0, T, T);
      g.drawImage(im, 0, sh - t, t, t, 0, H - T, T, T); g.drawImage(im, sw - t, sh - t, t, t, W - T, H - T, T, T);
      tex.needsUpdate = true;
    });
    return tex;
  }
  const edges = [];                                                          // left/right edge of every painting wall: the roof joists line up with these
  const arts = hung.map((w, i) => {
    const x = X0 + i * SPACING;
    // the wall shape follows the real (or estimated) canvas proportions; the image is cropped to fit, never stretched
    const ia = w.w / w.h, sa = w.size ? w.size[0] / w.size[1] : ia;
    const a = Math.abs(sa - ia) / sa < 0.12 ? sa : ia;
    const ah = (w.size ? w.size[1] * IN : (a >= 1 ? 2.5 / a : 1.9)), aw = ah * a;
    const mat = w.mat ?? (w.matted ? 0.16 : 0), key_ = w.frame || ['black', 'gold', 'bronze'][i % 3], ft = FRAME_STYLE[key_].ft;
    const ow = aw + 2 * (mat + ft), oh = ah + 2 * (mat + ft), cy = Math.max(1.55 + oh * 0.1, 1.75 - 0.0);
    const g = new THREE.Group(); g.position.set(x, cy, 0.05);         // flush against the wall
    const fmap = frameTexture(key_, ow, oh);
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), new THREE.MeshStandardMaterial({ map: fmap, transparent: true, alphaTest: 0.5, roughness: 0.55, metalness: 0.15, emissive: 0xffffff, emissiveMap: fmap, emissiveIntensity: 0.45 }));
    g.add(frame);
    const depth = new THREE.Mesh(new THREE.BoxGeometry(ow - 0.02, oh - 0.02, 0.07), std(0x1d1610, { roughness: 0.7 }));
    depth.position.z = -0.04; g.add(depth);
    const iw = ow - 2 * ft, ih = oh - 2 * ft;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(iw, ih), new THREE.MeshBasicMaterial({ color: mat ? 0xf7f4ec : 0x111111, toneMapped: false }));
    back.position.z = -0.0045; g.add(back);
    const tex = loader.load(`./img/${w.id}.webp`); tex.colorSpace = SRGB; tex.anisotropy = 8;
    if (a < ia) { tex.repeat.set(a / ia, 1); tex.offset.set((1 - a / ia) / 2, 0); } else if (a > ia) { tex.repeat.set(1, ia / a); tex.offset.set(0, (1 - ia / a) / 2); }
    const art = new THREE.Mesh(new THREE.PlaneGeometry(aw, ah), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    art.position.z = -0.0025; g.add(art);                                          // unlit: the image is never washed out or tinted
    const back2 = new THREE.Mesh(new THREE.PlaneGeometry(ow, oh), new THREE.MeshStandardMaterial({ color: 0x1d1610, roughness: 0.8, side: THREE.BackSide }));
    back2.position.z = -0.076; back2.rotation.y = Math.PI; g.add(back2);           // the painting has a back: see it from the side
    scene.add(g);
    const spot = new THREE.SpotLight(0xfff0d8, 0, 16, 0.5, 0.85, 1.4);
    spot.position.set(x - 0.2, 4.2, 3.2); spot.target.position.set(x, cy, 0); scene.add(spot, spot.target);
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.085, 0.17, 16), std(0x151515, { roughness: 0.45 })); head.position.set(x - 0.2, 4.22, 3.2); scene.add(head);
    // a floor-to-ceiling wall panel behind the painting; the gaps between panels open onto the backdrop
    const pw = Math.min(ow + 1.0, SPACING - 1.15); edges.push(x - pw / 2, x + pw / 2);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(pw, 4.6, 0.22), std([0xe3d7c1, 0xd9ccb3, 0xe8dcc6][i % 3], { map: plaster(pw / 3, 1.6), roughness: 0.95 }));
    panel.position.set(x, 2.3, -0.11); scene.add(panel);
    const pBase = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.04, 0.2, 0.26), std(0x3a2d24, { roughness: 0.55 })); pBase.position.set(x, 0.1, -0.1); scene.add(pBase);
    const pCap = new THREE.Mesh(new THREE.BoxGeometry(pw + 0.04, 0.12, 0.26), std(0x3a2d24, { roughness: 0.55 })); pCap.position.set(x, 4.54, -0.1); scene.add(pCap);
    return { g, sh: { material: { opacity: 0 } }, spot, x, ow, oh, a: 0 };
  });

  // ───── the end wall: perpendicular to every painting wall. The stairwell is behind it, hidden until you round the corner.
  const brown = std(0x3a2d24, { roughness: 0.55 });
  const endWall = new THREE.Mesh(new THREE.BoxGeometry(0.25, 4.6, 12.5), std(0xe3d7c1, { map: plaster(4, 1.6), roughness: 0.95 })); endWall.position.set(XH - 1.305, 2.3, -6.25); scene.add(endWall);
  const endBase = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.2, 12.5), brown); endBase.position.set(XH - 1.34, 0.1, -6.25); scene.add(endBase);
  const endCap = new THREE.Mesh(new THREE.BoxGeometry(0.31, 0.12, 12.5), brown); endCap.position.set(XH - 1.34, 4.54, -6.25); scene.add(endCap);
  { const last = arts[n - 1], gx0 = edges[edges.length - 1], gx1 = XE + 0.27;       // the last painting wall runs straight into the end wall
    if (gx1 > gx0) { const f = new THREE.Mesh(new THREE.BoxGeometry(gx1 - gx0, 4.6, 0.22), std(0xe3d7c1, { map: plaster(2, 1.6), roughness: 0.95 })); f.position.set((gx0 + gx1) / 2, 2.3, -0.11); scene.add(f); const fb = new THREE.Mesh(new THREE.BoxGeometry(gx1 - gx0, 0.2, 0.26), brown); fb.position.set((gx0 + gx1) / 2, 0.1, -0.1); scene.add(fb); const fc = new THREE.Mesh(new THREE.BoxGeometry(gx1 - gx0, 0.12, 0.26), brown); fc.position.set((gx0 + gx1) / 2, 4.54, -0.1); scene.add(fc); } void last; }
  // ───── roof joists: one on each edge of every painting wall, and one on the end wall, so the ceiling lines up with the walls
  const joistX = [...edges, XH - 1.305];
  for (let x = XE + 3.4; x < L + 40; x += 3.4) joistX.push(x);
  for (let x = edges[0] - 3.4; x > -14; x -= 3.4) joistX.push(x);
  joistX.forEach((x) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.34, 64), std(0x2e231b, { roughness: 0.7 })); b.position.set(x, 4.43, 14); scene.add(b); });

  const state = { p: 0, ps: 0, running: false, mx: 0, my: 0, idx: -1, t: 0, reveal: 0, camX: 0, focus: 0, fin: 0 };

  // ───── coloured light pooling on the floor between the paintings (the paintings themselves stay unlit)
  const gap = (i) => X0 + i * SPACING + SPACING / 2;                      // midpoint between painting i and i + 1
  const glowTex = canvasTex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 2, 64, 64, 62); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.45, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
  const MOOD = [0x2fd0c4, 0xe0408f, 0xffa03a, 0x7a5cff, 0xff6a4d];
  const pools = [];
  const addPool = (cx, cz, i, w = 3.8, h = 2.6) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: glowTex, color: MOOD[i % MOOD.length], transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
    m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.012, cz); scene.add(m); pools.push({ m, base: 0.5, ph: i * 1.3 });
  };
  for (let i = -1; i <= n - 1; i++) addPool(i < 0 ? X0 - 2.6 : gap(i), 2.4, i + 1);
  for (let j = 0; j < 14; j++) addPool(-4 + j * 6.4, -5.2, j + 2, 5.4, 3.4);          // wash on the floor behind the paintings, where the backdrop stands

  // ───── the stairwell: a built model of the staircase in the photo, placed past the last painting.
  // Its dimensions and the photo's camera were recovered from the picture (scripts/solve_stair_camera.py), and the
  // three mural surfaces are the photo projected from that same camera, so from the final view it lines up with the photo.
  const fin = finale || works[works.length - 1];
  const ST = { HC: 2.15, S: 0.961, WU: 2.62, ZL: 2.15 / 0.961 };
  const PC = { pos: [3.1694, 1.483, 3.7377], yaw: -0.7048, pitch: 0.1161, roll: -0.0362, fov: 1.1284 };     // the photo's camera, in stair-model space
  const PHOTO_ASPECT = 1100 / 1139;
  const OX = XH, OZ = -11;
  const stair = new THREE.Group(); stair.position.set(OX, 0, OZ); scene.add(stair);
  const photoBasis = (() => {
    const f = new THREE.Vector3(Math.sin(PC.yaw) * Math.cos(PC.pitch), Math.sin(PC.pitch), -Math.cos(PC.yaw) * Math.cos(PC.pitch)).normalize();
    let r = new THREE.Vector3().crossVectors(f, new THREE.Vector3(0, 1, 0)).normalize(), u = new THREE.Vector3().crossVectors(r, f);
    const cr = Math.cos(PC.roll), sr = Math.sin(PC.roll);
    const r2 = r.clone().multiplyScalar(cr).addScaledVector(u, sr), u2 = u.clone().multiplyScalar(cr).addScaledVector(r, -sr);
    return new THREE.Matrix4().makeBasis(r2, u2, f.clone().negate());
  })();
  const photoCam = new THREE.PerspectiveCamera(THREE.MathUtils.radToDeg(PC.fov), PHOTO_ASPECT, 0.1, 100);
  photoCam.position.set(...PC.pos); photoCam.quaternion.setFromRotationMatrix(photoBasis); photoCam.updateMatrixWorld(); photoCam.updateProjectionMatrix();
  const uProj = new THREE.Matrix4().multiplyMatrices(photoCam.projectionMatrix, photoCam.matrixWorldInverse);
  const mtex = loader.load(`./img/${fin.id}.webp`); mtex.colorSpace = SRGB; mtex.anisotropy = 8;
  const muralMat = new THREE.ShaderMaterial({
    uniforms: { map: { value: mtex }, proj: { value: uProj }, tint: { value: new THREE.Color(0xf2ede3) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D map; uniform mat4 proj; uniform vec3 tint; varying vec3 vP;',
      'void main() {',
      '  vec4 q = proj * vec4(vP, 1.0); vec2 uv = q.xy / q.w * 0.5 + 0.5; vec3 c = tint;',
      '  if (q.w > 0.0 && uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) c = texture2D(map, uv).rgb;',
      '  gl_FragColor = vec4(c, 1.0);',
      '  #include <colorspace_fragment>',
      '}',
    ].join('\n'),
    side: THREE.DoubleSide,
  });
  const poly = (pts, mat) => {                                          // a flat polygon in stair-model space (fan-triangulated)
    const g = new THREE.BufferGeometry(), v = [], idx = [];
    pts.forEach((p) => v.push(...p)); for (let i = 1; i < pts.length - 1; i++) idx.push(0, i, i + 1);
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat); stair.add(m); return m;
  };
  const { HC, S, WU, ZL } = ST, ZS = (4.6 - HC) / S;
  // the three mural surfaces: the wall under the flight, the back wall, and the soffit of the flight above
  poly([[0, 0, 0], [0, HC, 0], [0, 0, ZL]], muralMat);
  poly([[0, 0, 0], [9, 0, 0], [9, HC, 0], [0, HC, 0]], muralMat);
  poly([[0, HC, 0], [WU, HC, 0], [WU, 4.6, ZS], [0, 4.6, ZS]], muralMat);
  // plain surfaces of the stairwell
  const cream = std(0xe9e3d6, { roughness: 0.92 }), taupe = std(0xa79f8f, { roughness: 0.95 }), steel = std(0x555659, { roughness: 0.45, metalness: 0.6, emissive: 0x1d1d1f, emissiveIntensity: 0.5 }), handrail = std(0xcfd2d6, { roughness: 0.3, metalness: 0.75, emissive: 0x303236, emissiveIntensity: 0.6 }), dark = std(0x2b2a29, { roughness: 0.9 });
  const tileTex = canvasTex(256, 256, (g) => { g.fillStyle = '#3b3b3e'; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 400; i++) { g.fillStyle = `rgba(${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},${i % 2 ? 255 : 0},.03)`; g.fillRect((i * 37) % 256, (i * 91) % 256, 18, 11); } g.strokeStyle = '#17171a'; g.lineWidth = 3; g.strokeRect(0, 0, 256, 256); g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke(); }, { repeat: [11, 11] });
  const sfloor = new THREE.Mesh(new THREE.PlaneGeometry(11, 7.5), std(0xffffff, { map: tileTex, roughness: 0.35 })); sfloor.rotation.x = -Math.PI / 2; sfloor.position.set(3.6, 0.006, 3.6); sfloor.receiveShadow = true; stair.add(sfloor);
  poly([[WU, HC, 0], [WU, 4.6, 0], [WU, 4.6, ZS]], cream);                                   // the side of the flight above
  const farWall = new THREE.Mesh(new THREE.PlaneGeometry(14, 4.6), taupe); farWall.rotation.y = Math.PI / 2; farWall.position.set(-1.175, 2.3, 3); stair.add(farWall);
  const backL = new THREE.Mesh(new THREE.PlaneGeometry(1.175, 4.6), cream); backL.position.set(-0.5875, 2.3, 0); stair.add(backL);   // the landing's wall, behind the flight
  const skirt = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0); const b = new THREE.Mesh(new THREE.BoxGeometry(L, 0.14, 0.03), std(0x39393b, { roughness: 0.6 })); b.position.set((x0 + x1) / 2, 0.07, (z0 + z1) / 2); b.rotation.y = -Math.atan2(z1 - z0, x1 - x0); stair.add(b); };
  skirt(0, 0.015, 9, 0.015); skirt(0.015, 0, 0.015, ZL);
  // the lower flight: steel stringer, treads, balusters and handrail on the open side (the plane x = 0)
  const NST = 12, run = ZL / NST;
  for (let k = 0; k < NST; k++) {
    const z = ZL - (k + 0.5) * run, top = (k + 1) * (HC / NST) + 0.3;
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.15, top, run * 0.98), dark); b.position.set(-0.6, top / 2, z); stair.add(b);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.025, 0.04), std(0x6c6b69, { roughness: 0.7 })); nose.position.set(-0.6, top + 0.002, z + run * 0.46); stair.add(nose);
  }
  const yU = (z) => HC * (1 - z / ZL);
  const stringer = poly([[0.001, yU(0), 0], [0.001, yU(0) + 0.36, 0], [0.001, yU(ZL) + 0.36, ZL], [0.001, 0, ZL]], steel); stringer.geometry.computeVertexNormals();
  const beam = (a, b, r, mat) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), mat); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); stair.add(m); return m; };
  const hr = (z) => new THREE.Vector3(-0.02, yU(z) + 0.36 + 0.92, z);
  beam(hr(ZL - 0.05), hr(0.25), 0.024, handrail);
  for (let z = ZL - 0.12; z > 0.3; z -= 0.118) beam(new THREE.Vector3(-0.02, yU(z) + 0.36, z), hr(z), 0.008, handrail);
  [ZL - 0.05, 0.25].forEach((z) => beam(new THREE.Vector3(-0.02, yU(z) + 0.36, z), hr(z), 0.03, handrail));
  beam(new THREE.Vector3(-1.15, yU(ZL) + 1.55, ZL - 0.2), new THREE.Vector3(-1.15, yU(0.4) + 1.55, 0.4), 0.014, handrail);       // the wall rail on the far side
  stair.traverse((m) => { if (m.isMesh && m.material !== muralMat) m.castShadow = false; });
  const hallLight = new THREE.PointLight(0xffe2bd, 0, 16, 1.5); hallLight.position.set(OX + 2.2, 3.7, OZ + 3.6); scene.add(hallLight);
  addPool(OX + 3.4, OZ + 3.6, 3, 5.6, 4.6);

  // ───── dust in the air: soft motes that wander on slow, random currents and flutter in and out of the light
  const dustMat = (size, alpha) => new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uSize: { value: size }, uAlpha: { value: alpha }, uScale: { value: 600 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: [
      'attribute vec4 aSeed; uniform float uT, uSize, uScale; varying float vA;',
      'void main() {',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  float fl = 0.5 + 0.5 * sin(uT * aSeed.y + aSeed.x) * sin(uT * aSeed.y * 0.37 + aSeed.x * 2.1);',     // two slow sines multiplied: irregular fluttering
      '  vA = 0.12 + 0.88 * pow(clamp(fl * 1.35, 0.0, 1.0), 2.0);',
      '  gl_PointSize = uSize * aSeed.z * uScale / -mv.z * (0.75 + 0.25 * vA);',
      '  gl_Position = projectionMatrix * mv;',
      '}',
    ].join('\n'),
    fragmentShader: [
      'uniform float uAlpha; varying float vA;',
      'void main() {',
      '  float d = length(gl_PointCoord - 0.5) * 2.0; if (d > 1.0) discard;',
      '  float soft = pow(1.0 - d, 1.6);',
      '  gl_FragColor = vec4(vec3(1.0, 0.94, 0.82), soft * vA * uAlpha);',
      '}',
    ].join('\n'),
  });
  const dustSets = [{ count: 150, size: 0.075, alpha: 0.55 }, { count: 34, size: 0.34, alpha: 0.12 }].map((cfg) => {
    const N = cfg.count, pos = new Float32Array(N * 3), seed = new Float32Array(N * 4), vel = new Float32Array(N * 3), ph = [];
    for (let i = 0; i < N; i++) {
      seed[i * 4] = Math.random() * 6.28; seed[i * 4 + 1] = 0.6 + Math.random() * 2.4; seed[i * 4 + 2] = 0.6 + Math.random() * 0.8; seed[i * 4 + 3] = Math.random();
      ph.push({ a: Math.random() * 6.28, b: Math.random() * 6.28, c: Math.random() * 6.28, k: 0.5 + Math.random() });
      pos[i * 3] = (Math.random() - 0.5) * 24; pos[i * 3 + 1] = 0.3 + Math.random() * 4; pos[i * 3 + 2] = -4 + Math.random() * 15;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const mat = dustMat(cfg.size, cfg.alpha);
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);
    return { pts, mat, pos, vel, ph, N, placed: false };
  });

  // ───── a few seated people, always beside a painting and never in front of it
  const atlases = {}, baseTex = {};
  const sprite = (costume, scale = 1) => {
    if (!atlases[costume]) { atlases[costume] = buildAtlas(costume); baseTex[costume] = atlasTexture(atlases[costume].canvas); }
    const sp = makeSprite(atlases[costume], baseTex[costume], { scale }); scene.add(sp.group); return sp;
  };
  const actors = [];
  const benchTex = (() => { const t = new THREE.CanvasTexture(benchCanvas()); t.colorSpace = SRGB; return t; })();
  const bench = (x, z) => {
    const bm = new THREE.MeshBasicMaterial({ map: benchTex, alphaTest: 0.4, side: THREE.DoubleSide, toneMapped: false });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.5), bm); b.position.set(x, 0.21, z - 0.03); b.castShadow = true;
    b.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: benchTex, alphaTest: 0.4 }); scene.add(b);
  };
  const sketcherAt = (x, z, costume, offset) => { bench(x, z); actors.push(sequence(sprite(costume), x - 0.2, z, sketchSteps(), offset)); };
  const pairAt = (x, z, ca, cb, offset) => {
    bench(x, z);
    const A = sprite(ca, 1.0), B = sprite(cb, 0.97);
    actors.push(sequence(A, x - 0.5, z, [
      { clip: 'sitLook', d: 3.5, face: -1 }, { clip: 'sitNod', d: 4, face: -1 }, { clip: 'sitLook', d: 1, face: 1 }, { clip: 'sitTalk', d: 4, face: 1 }, { clip: 'sitNod', d: 4, face: 1 }, { clip: 'sitLook', d: 2, face: -1 }, { clip: 'sitLook', d: 3, face: -1 },
    ], offset));
    actors.push(sequence(B, x + 0.3, z + 0.04, [
      { clip: 'sitLook', d: 3.5, face: -1 }, { clip: 'sitPoint', d: 3.1, once: true, face: -1 }, { clip: 'sitLook', d: 1.9, face: -1 }, { clip: 'sitNod', d: 4, face: -1 }, { clip: 'sitTalk', d: 4, face: -1 }, { clip: 'sitNod', d: 2, face: -1 }, { clip: 'sitLook', d: 3, face: -1 },
    ], offset));
  };
  sketcherAt(gap(0), 2.6, 'skirt', 1.5);          // sketches the painting on her left
  pairAt(gap(2), 2.6, 'coat', 'pack', 3);
  sketcherAt(gap(4), 2.6, 'scarf', 7);

  // two strollers pass through, pausing between paintings and stepping aside from whichever painting is being viewed
  const stops = [X0 - 2.6, gap(1), gap(3), gap(5), X0 + (n - 1) * SPACING + 1.6];
  const s1 = sprite('coat', 1.02), s2 = sprite('pack', 1.0);
  actors.push(stroller(s1, arts, state, { z: 3.9, speed: 0.95, stops, start: 0, dir: 1 }));
  actors.push(stroller(s2, arts, state, { z: 4.6, speed: 0.88, stops, start: stops.length - 1, dir: -1 }));

  // a scale figure walks down the staircase, steps off the bottom tread and out of sight, then comes down again
  {
    const sd = sprite('coat', 1.0); sd.group.rotation.y = Math.PI / 2;                 // the sprite faces the camera that looks across the stairs (+x)
    const mat = sd.group.children[0].material;
    const rise = HC / NST, topAt = (z) => (clamp(Math.floor((ZL - z) / run), 0, NST - 1) + 1) * rise + 0.3;
    const T_STAIR = 4.4, T_OUT = 2.4, T_WAIT = 3.2, CYC = T_STAIR + T_OUT + T_WAIT;
    let tw = 0, cyc = 0;
    actors.push((dt) => {
      cyc = (cyc + dt) % CYC;
      let zz, y;
      if (cyc < T_STAIR) { zz = (cyc / T_STAIR) * ZL; y = topAt(Math.min(zz, ZL - 0.001)); }
      else if (cyc < T_STAIR + T_OUT) { const u = (cyc - T_STAIR) / T_OUT; zz = ZL + u * 2.2; y = Math.max(0, topAt(ZL - 0.001) - (zz - ZL) * 2.6); }
      else { zz = 0; y = topAt(0); }
      const waiting = cyc >= T_STAIR + T_OUT;
      tw += dt; sd.set('walk', frameAt('walk', tw));
      sd.place(OX - 0.6, OZ + zz, -1); sd.group.position.y = y;
      const fadeIn = clamp(cyc / 0.5);
      mat.opacity = waiting ? 0 : 0.76 * Math.min(fadeIn, cyc > T_STAIR + 1.4 ? clamp((T_STAIR + T_OUT - cyc) / 1.0) : 1);
    });
  }

  let W = 1, H = 1, mobile = false, baseFov = 34;
  function resize() {
    W = canvas.clientWidth || 1; H = canvas.clientHeight || 1;
    renderer.setSize(W, H, false); camera.aspect = W / H; mobile = W / H < 0.9;
    baseFov = mobile ? 44 : 34; camera.fov = baseFov; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);
  window.addEventListener('pointermove', (e) => { state.mx = (e.clientX / window.innerWidth) * 2 - 1; state.my = (e.clientY / window.innerHeight) * 2 - 1; }, { passive: true });

  const AHEAD = 3.1, AHEAD_M = 1.2, FIN0 = 0.84;
  const xStart = X0 - AHEAD - 0.6, xEnd = X0 + (n - 1) * SPACING - AHEAD;
  const camA = new THREE.Vector3(), tgtA = new THREE.Vector3(), camB = new THREE.Vector3();
  const corner = new THREE.Vector3(XE + 2.6, 1.62, 9.6), qMid = new THREE.Quaternion();
  { const tc = new THREE.PerspectiveCamera(); tc.position.copy(corner); tc.lookAt(XE + 3.5, 1.5, 0.5); qMid.copy(tc.quaternion); }
  const finalPos = new THREE.Vector3(OX + PC.pos[0], PC.pos[1], OZ + PC.pos[2]), qB = new THREE.Quaternion().setFromRotationMatrix(photoBasis), qA = new THREE.Quaternion(), tmpCam = new THREE.PerspectiveCamera();
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    if (!state.running || document.hidden) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now; state.t += dt; const t = state.t;
    state.reveal = clamp(state.reveal + dt / 1.8);
    state.ps = damp(state.ps, state.p, reduced ? 20 : 4.2, dt);

    // phase 1: walk the wall; phase 2: break off the path, turn, and walk down the hall until the photograph fills the view
    const walkT = clamp(state.ps / FIN0), fz = smooth(0, 1, (state.ps - FIN0) / (1 - FIN0));
    state.fin = fz;
    const sh = mobile ? AHEAD - AHEAD_M : 0;
    const camX = lerp(xStart + sh, xEnd + sh, walkT);
    state.camX = camX;
    const cz = mobile ? 9.2 : 9.6, ahead = mobile ? AHEAD_M : AHEAD;
    camA.set(camX + state.mx * 0.35, EYE - state.my * 0.08, cz + Math.sin(t * 0.4) * 0.05);
    tgtA.set(camX + ahead, 1.42, 0);
    tmpCam.position.copy(camA); tmpCam.lookAt(tgtA); qA.copy(tmpCam.quaternion);
    camB.set(finalPos.x + state.mx * 0.12, finalPos.y - state.my * 0.04, finalPos.z);
    // the path: keep walking past the end of the painting walls, round the corner of the end wall, then turn into the stairwell and walk in
    const seg1 = smooth(0, 1, fz / 0.42), seg2 = smooth(0, 1, (fz - 0.42) / 0.58), pq = smooth(0.05, 0.95, fz);
    if (fz < 0.42) { camera.position.lerpVectors(camA, corner, seg1); camera.quaternion.slerpQuaternions(qA, qMid, seg1); }
    else { camera.position.set(lerp(corner.x, camB.x, smooth(0, 0.85, seg2)), lerp(corner.y, camB.y, seg2), lerp(corner.z, camB.z, seg2)); camera.quaternion.slerpQuaternions(qMid, qB, seg2); }
    // at the end the camera is the photo's own camera: same position, orientation and field of view (widened on tall screens so the whole photo fits)
    const photoTan = Math.tan(PC.fov / 2), needTan = camera.aspect < PHOTO_ASPECT ? photoTan * PHOTO_ASPECT / camera.aspect : photoTan;
    camera.fov = lerp(baseFov, THREE.MathUtils.radToDeg(2 * Math.atan(needTan)), pq); camera.updateProjectionMatrix();
    key.position.set(camera.position.x + 5.5, 8.5, camera.position.z * 0.3 + 7.5); key.target.position.set(camera.position.x + 1.5, 0.5, 1.5);
    hallLight.intensity = 38 * smooth(0.1, 0.8, fz);

    const focus = camX + ahead; state.focus = focus;
    let best = 0, bd = 1e9; arts.forEach((a, i) => { const d = Math.abs(a.x - focus); if (d < bd) { bd = d; best = i; } });
    if (fz > 0.45 && finale) best = n;
    if (best !== state.idx) { state.idx = best; onIndex && onIndex(best); }

    arts.forEach((a, i) => {
      const near = smooth(4.2, 1.2, Math.abs(a.x - focus)) * smooth(0, 1, state.reveal * 1.4 - i * 0.05) * (1 - fz);
      a.a = damp(a.a, near, 3, dt);
      a.spot.intensity = 5 + a.a * 60;                                  // washes the wall behind and the frame, never the picture
    });

    // dust: each mote is pushed around by a slowly changing, swirling current plus its own random wobble (no straight lines)
    dustSets.forEach((d) => {
      d.mat.uniforms.uT.value = t; d.mat.uniforms.uScale.value = H * 0.55;
      const cx = camera.position.x + 3, cz0 = camera.position.z - 4;
      for (let i = 0; i < d.N; i++) {
        const o = i * 3, p = d.ph[i];
        if (!d.placed || Math.abs(d.pos[o] - cx) > 14 || d.pos[o + 1] < 0.1 || d.pos[o + 1] > 4.5 || Math.abs(d.pos[o + 2] - cz0) > 9) {       // (re)seed around the camera
          d.pos[o] = cx + (Math.random() - 0.5) * 24; d.pos[o + 1] = 0.4 + Math.random() * 3.8; d.pos[o + 2] = cz0 + (Math.random() - 0.5) * 16;
          d.vel[o] = d.vel[o + 1] = d.vel[o + 2] = 0;
        }
        const x = d.pos[o], y = d.pos[o + 1], z = d.pos[o + 2];
        // a swirling flow field (sum of drifting sines) + a per-mote wander that changes direction at its own pace
        const fx = Math.sin(y * 0.9 + t * 0.35 + p.a) + Math.sin(z * 0.6 - t * 0.27 + p.b) * 0.8 + Math.sin(t * 0.9 * p.k + p.c) * 0.6;
        const fy = Math.cos(x * 0.7 + t * 0.31 + p.b) * 0.7 + Math.sin(z * 0.8 + t * 0.22 + p.c) * 0.5 + Math.sin(t * 1.3 * p.k + p.a) * 0.5 + 0.05;
        const fz = Math.sin(x * 0.55 - t * 0.29 + p.c) + Math.cos(y * 0.8 + t * 0.2 + p.a) * 0.7 + Math.cos(t * 1.1 * p.k + p.b) * 0.6;
        const k = 1 - Math.exp(-dt * 0.9), amp = 0.17;
        d.vel[o] += (fx * amp - d.vel[o]) * k; d.vel[o + 1] += (fy * amp * 0.7 - d.vel[o + 1]) * k; d.vel[o + 2] += (fz * amp - d.vel[o + 2]) * k;
        d.pos[o] += d.vel[o] * dt; d.pos[o + 1] += d.vel[o + 1] * dt; d.pos[o + 2] += d.vel[o + 2] * dt;
      }
      d.placed = true; d.pts.geometry.attributes.position.needsUpdate = true;
    });

    pools.forEach((q) => { q.m.material.opacity = q.base * (0.78 + 0.22 * Math.sin(t * 0.7 + q.ph)); });     // the coloured light breathes slowly
    actors.forEach((run) => run(dt, t));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    // a buffer of stillness at each end so the walk never starts or stops abruptly under your thumb
    setProgress(p) { state.p = clamp((p - 0.05) / 0.9); },
    reset() { state.ps = 0; state.p = 0; state.reveal = 0; arts.forEach((a) => { a.a = 0; }); },
    setRunning(v) { state.running = v; },
    resize, state, strollers: [s1, s2], debug: { uProj, muralMat, camera, photoCam, mtex, scene },
    get length() { return L; },
  };
}
