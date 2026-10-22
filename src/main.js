import '@fontsource-variable/jost';
import '@fontsource-variable/inter';
import './style.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { renderAll } from './render.js';
import manifest from './manifest.json';
import { gallery as galleryData } from './data.js';

gsap.registerPlugin(ScrollTrigger);
const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

renderAll();
let refreshT;
const refreshSoon = () => { clearTimeout(refreshT); refreshT = setTimeout(() => ScrollTrigger.refresh(), 250); };
document.querySelectorAll('img.img-fade').forEach((im) => {
  const done = () => { im.classList.add('is-loaded'); refreshSoon(); };
  im.complete ? done() : im.addEventListener('load', done, { once: true });
  im.addEventListener('error', done, { once: true });
});

/* ───────── intro: a ruled line is drawn, the sheet opens from it to reveal the render, the name sets on it ───────── */
const bar = document.getElementById('bar');
const skipBtn = document.getElementById('skipIntro');
const sheet = document.getElementById('heroSheet');
const heroImg = document.getElementById('heroImg');
const heroStage = document.getElementById('heroStage');
const rollT = document.getElementById('rollT');
const rollB = document.getElementById('rollB');
const strap = document.getElementById('rollStrap');
const sweep = document.getElementById('heroSweep');
const hline = document.getElementById('heroHline');
const under = document.getElementById('heroUnder');
const nameWrap = document.querySelector('.name-wrap');
const nameLetters = gsap.utils.toArray('#name b');
const reveals = gsap.utils.toArray('.hero [data-h]');
const eyebrow = reveals[0];
const rest = reveals.slice(1);
const badge = document.getElementById('heroBadge');
const strip = document.querySelector('.hero__strip');

function finishIntro() {
  root.classList.remove('is-intro');
  skipBtn.hidden = true;
  bar.classList.add('is-in');
  ScrollTrigger.refresh();
}
function setFinal() {
  gsap.set([nameLetters, reveals, badge, strip], { opacity: 1, yPercent: 0, y: 0, scale: 1, rotate: 0, clearProps: 'transform' });
  gsap.set(sheet, { clipPath: 'inset(0% 0% 0% 0%)' });
  gsap.set([rollT, rollB, sweep], { autoAlpha: 0 });
  gsap.set(nameWrap, { clearProps: 'clipPath' });
  gsap.set(hline, { scaleX: 1 });
  gsap.set(under, { overflow: 'visible' });
  gsap.set(heroImg, { scale: 1 });
}

let introTl = null;
if (reduced) {
  setFinal(); finishIntro();
} else {
  root.classList.add('is-intro');
  window.scrollTo(0, 0);
  gsap.set(heroImg, { scale: 1.18, transformOrigin: '70% 50%' });
  gsap.set([rollT, rollB], { scaleX: 0, opacity: 1 });
  // one progress value u drives both rolls and the sheet edges, so the paper always starts exactly at a roll
  const H = heroStage.clientHeight, travel = H / 2 + 16;
  const open = { u: 0 };
  const applyOpen = () => {
    const d = open.u * travel;
    const edge = Math.max(0, H / 2 - d);
    const pct = (edge / H) * 100;
    gsap.set(sheet, { clipPath: `inset(${pct}% 0% ${pct}% 0%)` });
    gsap.set(rollT, { y: -d });
    gsap.set(rollB, { y: d });
  };
  applyOpen();
  const stageLeft = heroStage.getBoundingClientRect().left;
  const wr = nameWrap.getBoundingClientRect();
  const wrL = wr.left - stageLeft, wrR = wr.right - stageLeft;
  const sweepStep = () => {
    const x = gsap.getProperty(sweep, 'x');
    const r = Math.min(wr.width, Math.max(0, wrR - Math.max(x, wrL)));
    nameWrap.style.clipPath = `inset(-8% ${r}px -8% -2%)`;
  };
  nameWrap.style.clipPath = 'inset(-8% 100% -8% -2%)';
  gsap.set(hline, { scaleX: 0 });
  introTl = gsap.timeline({ onComplete: finishIntro });
  introTl
    // 1 · the rolled drawing appears at centre, its strap lets go
    .to([rollT, rollB], { scaleX: 1, duration: 0.5, ease: 'power3.out' }, 0.1)
    .to(strap, { y: -80, opacity: 0, duration: 0.3, ease: 'power2.in' })
    // 2 · both ends unroll apart and leave; the sheet is exactly what lies between them
    .to(open, { u: 1, duration: 1.3, ease: 'power2.inOut', onUpdate: applyOpen })
    .to(heroImg, { scale: 1, duration: 1.3, ease: 'power2.inOut' }, '<')
    // 3 · a vertical line sweeps the page and uncovers the name behind it
    .set(sweep, { opacity: 1, x: 0, skewX: -14 })
    .to(sweep, { x: heroStage.clientWidth, skewX: 0, duration: 0.7, ease: 'power3.inOut', onUpdate: sweepStep })
    .to(sweep, { opacity: 0, duration: 0.12 })
    .fromTo(eyebrow, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: 'power3.out' })
    // 4 · a horizontal line draws under it; the lines of text come out of that line
    .to(hline, { scaleX: 1, duration: 0.4, ease: 'power3.inOut' })
    .fromTo(rest, { yPercent: -110, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.08 })
    .set(under, { overflow: 'visible' })
    .to([badge, strip], { opacity: 1, duration: 0.4 })
    .add(() => bar.classList.add('is-in'));
  skipBtn.addEventListener('click', () => { introTl.progress(1); setFinal(); });
  // scrolling or pressing a navigation key also skips straight to the finished page
  const bail = () => { if (introTl.progress() < 1) { introTl.progress(1); setFinal(); } ['wheel', 'touchmove', 'keydown'].forEach((e) => window.removeEventListener(e, bail)); };
  ['wheel', 'touchmove', 'keydown'].forEach((e) => window.addEventListener(e, bail, { passive: true }));  // the render drifts slowly as the page leaves
  gsap.to('#heroRender', { yPercent: 8, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } });
}
/* ───────── top bar ───────── */
const onScroll = () => bar.classList.toggle('is-scrolled', window.scrollY > 10);
window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

/* ───────── index overlay ───────── */
const indexEl = document.getElementById('index');
const indexBtn = document.getElementById('indexBtn');
const indexClose = document.getElementById('indexClose');
function setIndex(open) {
  indexEl.hidden = !open;
  indexBtn.setAttribute('aria-expanded', String(open));
  root.style.overflow = open ? 'hidden' : '';
  if (open) indexEl.querySelector('a')?.focus(); else indexBtn.focus({ preventScroll: true });
}
indexBtn.addEventListener('click', () => setIndex(indexEl.hidden));
indexClose.addEventListener('click', () => setIndex(false));
indexEl.addEventListener('click', (e) => { if (e.target.closest('a')) { indexEl.hidden = true; indexBtn.setAttribute('aria-expanded', 'false'); root.style.overflow = ''; } });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !indexEl.hidden) setIndex(false); });

/* ───────── lightbox for plates ───────── */
const lb = document.createElement('dialog');
lb.className = 'lightbox'; lb.setAttribute('aria-label', 'Enlarged image');
lb.innerHTML = '<button class="lightbox__close" type="button">Close</button><div class="lightbox__scroll"><div class="lightbox__inner"></div></div>';
document.body.appendChild(lb);
const lbInner = lb.querySelector('.lightbox__inner');
lb.querySelector('.lightbox__close').addEventListener('click', () => lb.close());
lb.addEventListener('click', (e) => { if (e.target === lb || e.target.classList.contains('lightbox__scroll')) lb.close(); });
lb.addEventListener('close', () => { lbInner.innerHTML = ''; root.style.overflow = ''; });
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-zoom]');
  if (!btn) return;
  const imgs = [...btn.querySelectorAll('img')];
  const stack = btn.dataset.kind === 'stack';
  lbInner.className = 'lightbox__inner' + (stack ? ' is-stack' : '');
  lbInner.innerHTML = '';
  let aspect = 0;
  imgs.forEach((im) => {
    const c = im.cloneNode(); c.removeAttribute('loading'); c.classList.remove('img-fade'); c.style.opacity = '1';
    lbInner.appendChild(c);
    const w = +im.getAttribute('width'), h = +im.getAttribute('height');
    aspect += stack ? h / w : w / h;
  });
  if (stack) aspect = 1 / aspect;
  const small = window.innerWidth < 700;
  lbInner.style.setProperty('--lbw', small ? `${aspect > 1 ? 230 : 150}vw` : `min(100%, calc((100svh - 80px) * ${aspect.toFixed(3)}))`);
  root.style.overflow = 'hidden';
  lb.showModal();
});


/* ───────── fine-art gallery: scroll walks a 3D room ───────── */
const galleryEl = document.getElementById('gallery');
const canGL = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
const gStatic = () => galleryEl.classList.add('gallery--static');
if (reduced || !canGL) {
  gStatic();
} else {
  const works = galleryData.works.map((w) => ({ ...w, ...manifest[w.id] }));
  const capEl = galleryEl.querySelector('.gallery__cap');
  const gTitle = document.getElementById('gTitle'), gMeta = document.getElementById('gMeta'), gProg = document.getElementById('gProg');
  const state = { p: 0 };
  let api = null, visible = false, swapT;
  const onIndex = (i) => {
    clearTimeout(swapT); capEl.classList.add('is-swap');
    swapT = setTimeout(() => {
      gTitle.textContent = works[i].title; gMeta.textContent = works[i].meta || '';
      capEl.classList.remove('is-swap');
    }, 220);
  };
  gsap.to(state, {
    p: 1, ease: 'none',
    onUpdate: () => {
      api?.setProgress(state.p);
      const eff = Math.min(1, Math.max(0, (state.p - 0.05) / 0.9));          // same buffer the room uses
      gProg.style.transform = `scaleX(${eff.toFixed(4)})`;
      galleryEl.classList.toggle('is-walking', eff > 0.02);
    },
    scrollTrigger: {
      trigger: galleryEl, start: 'top top', end: `+=${works.length * 90}%`, scrub: true, pin: document.getElementById('galleryStage'), anticipatePin: 1, invalidateOnRefresh: true,
      // the gallery takes the whole screen: the top bar steps aside while you are inside it
      onToggle: (self) => root.classList.toggle('in-gallery', self.isActive),
      // coming back up from the footer always starts the walk again from the first painting
      onEnterBack: (self) => { api?.reset(); window.scrollTo({ top: self.start, behavior: 'instant' }); },
    },
  });
  ScrollTrigger.create({
    trigger: galleryEl, start: 'top bottom', end: 'bottom top',
    onToggle: (self) => { visible = self.isActive; api?.setRunning(visible); if (!visible) api?.reset(); },
  });
  // build the room only when the section is about to arrive
  const io = new IntersectionObserver(async (entries) => {
    if (!entries.some((e) => e.isIntersecting)) return;
    io.disconnect();
    try {
      const mod = await import('./gallery.js');
      api = mod.createGallery(document.getElementById('galleryCanvas'), works, { onIndex, reduced });
    } catch (e) { api = null; console.error('gallery failed to start', e); }
    if (!api) { gStatic(); ScrollTrigger.refresh(); return; }
    if (import.meta.env.DEV) window.__gallery = api;
    api.setProgress(state.p); api.setRunning(visible);
  }, { rootMargin: '120% 0px' });
  io.observe(galleryEl);
}
/* ───────── plotter footer ───────── */
const stage = document.getElementById('plotStage');
const paper = document.getElementById('paper');
const gantry = document.getElementById('gantry');
const carriage = document.getElementById('carriage');
if (reduced) {
  gantry.hidden = true; paper.style.setProperty('--cut', '0%');
} else {
  const GH = 78, MOTOR = 54, CAR = 62, PASSES = 6;
  const state = { p: 0 };
  const draw = () => {
    const H = stage.clientHeight, W = stage.clientWidth;
    const p = state.p;
    const top = -GH + p * (H + GH + 6);                 // starts flush under the gallery, prints downward
    gantry.style.transform = `translate3d(0, ${top.toFixed(1)}px, 0)`;
    const u = p * PASSES;
    const x = MOTOR + (0.5 - 0.5 * Math.cos(u * Math.PI)) * (W - 2 * MOTOR - CAR);
    carriage.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    const nozzle = top + GH;                               // paper shows above the nozzle line
    paper.style.setProperty('--cut', `${Math.min(100, Math.max(0, 100 - (nozzle / H) * 100)).toFixed(2)}%`);
  };
  paper.style.setProperty('--cut', '100%'); draw();
  // the plotter runs on its own clock as soon as the footer comes into view (not tied to scrolling), and resets if you leave it below
  const run = gsap.to(state, { p: 1, duration: 3.75, delay: 0.1, ease: 'sine.inOut', onUpdate: draw, paused: true });
  ScrollTrigger.create({
    trigger: '#contact', start: 'top 72%',
    onEnter: () => run.restart(),
    onLeaveBack: () => { run.pause(0); state.p = 0; draw(); },
  });
  window.addEventListener('resize', draw);
}

window.addEventListener('load', () => {
  if (root.classList.contains('is-intro')) window.scrollTo(0, 0); // never start the intro mid-page
  ScrollTrigger.refresh();
});


