import manifest from './manifest.json';
import { projects, gallery, resume } from './data.js';
import { toolIcon, toolName } from './icons.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const dim = (id) => manifest[id] || { w: 1000, h: 1000 };

function img(id, alt, { lazy = true } = {}) {
  const { w, h } = dim(id);
  return `<img class="img-fade" src="./img/${id}.webp" width="${w}" height="${h}" style="--w:${w};--h:${h}" alt="${esc(alt)}" ${lazy ? 'loading="lazy"' : ''} decoding="async">`;
}

function openBtn(kind, inner, label) {
  return `<button class="plate__open" type="button" data-zoom data-kind="${kind}" aria-label="Enlarge: ${esc(label)}">${inner}</button>`;
}

function spreadInner(pl) {
  const part = (it) => Array.isArray(it)
    ? `<span class="col" style="--w:${dim(it[0]).w};--h:${it.reduce((s, id) => s + dim(id).h * (dim(it[0]).w / dim(id).w), 0)}">${it.map((id) => img(id, pl.alt)).join('')}</span>`
    : img(it, pl.alt);
  return `<span class="spread">${pl.ids.map(part).join('')}</span>`;
}

function plate(pl, proj) {
  switch (pl.k) {
    case 'one': {
      const { w, h } = dim(pl.id);
      const wide = w / h > 1.3 ? ' plate--wide' : '';
      return `<div class="plate plate--one${wide}">${openBtn('one', img(pl.id, pl.alt), pl.alt)}</div>`;
    }
    case 'spread':
      return `<div class="plate">${openBtn('spread', spreadInner(pl), pl.alt)}</div>`;
    case 'stack':
      return `<div class="plate">${openBtn('stack', `<span class="stack">${pl.ids.map((id) => img(id, pl.alt)).join('')}</span>`, pl.alt)}</div>`;
    case 'pair':
      return `<div class="plate"><div class="pair">${pl.ids.map((id) => openBtn('one', img(id, pl.alt), pl.alt)).join('')}</div></div>`;
    case 'chapter':
      return `<div class="chapter"><p class="chapter__kicker">${proj ? `${esc(proj.no)} · ${esc(proj.title)} · ` : ''}Part two</p><h3 class="chapter__title">${esc(pl.title)}</h3><p>${esc(pl.text)}</p>${pl.note ? `<p class="note">${esc(pl.note)}</p>` : ''}</div>`;
    case 'overlay':
      return `<div class="plate"><div class="overlay">${openBtn('spread', spreadInner(pl), pl.alt)}<p class="overlay__text">${esc(pl.text)}</p></div></div>`;
    default:
      return '';
  }
}

function tools(list) {
  if (!list || !list.length) return '';
  const row = (ids) => `<ul class="tools">${ids.map((id) => `<li class="tool" tabindex="0" data-name="${esc(toolName(id))}">${toolIcon(id)}</li>`).join('')}</ul>`;
  const body = typeof list[0] === 'string'
    ? row(list)
    : list.map((g) => `<div class="tools__group"><p class="tools__label">${esc(g.label)}</p>${row(g.ids)}</div>`).join('');
  return `<section class="toolbox" aria-label="Software and methods"><p class="toolbox__h">Software &amp; methods</p>${body}</section>`;
}

function chapter(p, idx) {
  return `
  <article class="project" id="${p.slug}" aria-labelledby="${p.slug}-h">
    <div class="opener">
      <div class="opener__col">
        <span class="opener__no" aria-hidden="true">${p.no}</span>
        <h2 class="opener__title" id="${p.slug}-h">${esc(p.title)}</h2>
        ${p.kicker ? `<p class="opener__kicker">${esc(p.kicker)}</p>` : ''}
        <ul class="opener__meta">${(p.lines || [p.meta]).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
        <div class="opener__text">${p.text.map((t) => `<p>${esc(t)}</p>`).join('')}</div>
        ${p.badge ? `<div class="badge"><img src="./img/${p.badge.id}.webp" alt="${esc(p.badge.alt)}" width="64" height="64" loading="lazy"><span>${esc(p.badge.note)}</span></div>` : ''}
        <dl class="fundamental"><dt>Fundamental</dt><dd><b>${esc(p.fundamental.name)}</b><span>${esc(p.fundamental.note)}</span></dd></dl>
        ${tools(p.tools)}
        ${p.lead ? `<div class="lead">${img(p.lead.id, p.lead.alt)}</div>` : ''}
      </div>
      <div class="opener__art">${plate(p.plates[0], p)}</div>
    </div>
    <div class="plates" aria-label="${esc(p.title)} drawings and images">${p.plates.slice(1).map((pl) => plate(pl, p)).join('')}</div>
  </article>`;
}

function entry(e) {
  return `<div class="entry"><p class="entry__role">${esc(e.role)}</p><p class="entry__org">${esc(e.org)}${e.place ? ` · ${esc(e.place)}` : ''} · <time>${esc(e.dates)}</time></p><ul>${e.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>`;
}

export function renderAll() {
  document.getElementById('work').innerHTML = projects.map(chapter).join('');

  const caption = (w) => `<span class="gcap__t">${esc(w.title)}</span>${w.meta ? `<span class="gcap__m">${esc(w.meta)}</span>` : ''}`;
  document.getElementById('gallery').innerHTML = `
    <div class="gallery__stage" id="galleryStage">
      <canvas id="galleryCanvas" aria-hidden="true"></canvas>
      <div class="gallery__ui">
        <div class="gallery__head">
          <span class="opener__no" aria-hidden="true">${gallery.no}</span>
          <h2 class="gallery__title" id="gallery-h">${esc(gallery.title)}</h2>
          <p class="gallery__intro">${esc(gallery.intro)}</p>
        </div>
        <div class="gallery__cap" aria-live="polite">
          <h3 class="gallery__work" id="gTitle">${esc(gallery.works[0].title)}</h3>
          <p class="gallery__meta" id="gMeta">${esc(gallery.works[0].meta)}</p>
        </div>
        <div class="gallery__bar" aria-hidden="true"><span id="gProg"></span></div>
        <p class="gallery__hint" id="gHint">Scroll to walk the gallery</p>
      </div>
    </div>
    <ul class="gallery__list" id="galleryList" aria-label="Paintings and drawings">
      ${gallery.works.map((w) => `<li><figure><img class="img-fade" src="./img/${w.id}.webp" width="${dim(w.id).w}" height="${dim(w.id).h}" style="--w:${dim(w.id).w};--h:${dim(w.id).h}" alt="${esc(w.alt)}" loading="lazy" decoding="async"><figcaption>${caption(w)}</figcaption></figure></li>`).join('')}
    </ul>`;

  document.getElementById('resume').innerHTML = `
    <div class="resume__head"><h2 class="resume__title" id="resume-h">Resume</h2><a class="btn btn--solid" href="./Anna-Rohn-Resume.pdf" download>Download resume PDF</a></div>
    <div class="resume__grid">
      <div class="resume__col"><section aria-labelledby="r-exp"><h3 id="r-exp">Experience</h3>${resume.experience.map(entry).join('')}</section></div>
      <div class="resume__col">
        <section aria-labelledby="r-edu"><h3 id="r-edu">Education</h3>
          <div class="entry"><p class="entry__role">${esc(resume.education.school)}</p><p class="entry__org"><time>${esc(resume.education.dates)}</time></p><ul><li>${esc(resume.education.line)}</li></ul></div></section>
        <section aria-labelledby="r-aw"><h3 id="r-aw">Awards &amp; Exhibitions</h3>
          ${resume.awards.map((a) => `<div class="entry"><p class="entry__role">${esc(a.title)}</p><p class="entry__org"><time>${esc(a.dates)}</time></p><ul><li>${esc(a.text)}</li></ul></div>`).join('')}</section>
        <section aria-labelledby="r-lead"><h3 id="r-lead">Leadership</h3>
          ${resume.leadership.map((a) => `<div class="entry"><p class="entry__role">${esc(a.title)}</p><p class="entry__org"><time>${esc(a.dates)}</time></p><ul>${a.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul></div>`).join('')}</section>
        <section aria-labelledby="r-sk"><h3 id="r-sk">Skills</h3>
          <dl class="skills">${resume.skills.map((s) => `<dt>${esc(s.group)}</dt><dd>${esc(s.items)}</dd>`).join('')}</dl></section>
      </div>
    </div>`;

  document.getElementById('indexList').innerHTML =
    projects.map((p) => `<li><a href="#${p.slug}"><span class="n">${p.no}</span><span class="t">${esc(p.title)}</span><span class="f"><i>${esc(p.fundamental.name)}</i></span></a></li>`).join('') +
    `<li><a href="#resume"><span class="n">—</span><span class="t">Resume</span><span class="f"></span></a></li>` +
    `<li><a href="#gallery"><span class="n">${gallery.no}</span><span class="t">Fine Art</span><span class="f"></span></a></li>` +
    `<li><a href="#contact"><span class="n">—</span><span class="t">Contact</span><span class="f"></span></a></li>`;
}
