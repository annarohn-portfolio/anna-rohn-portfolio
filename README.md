# Anna Rohn - Architecture Portfolio

A static site (Vite + Three.js + GSAP) built for GitHub Pages. The content is curated 1:1 from the portfolio PDF.

## Run locally
    npm install
    npm run dev       # http://localhost:5173
    npm run build     # production build in dist/

## Publish on GitHub Pages
1. Create a repository on github.com (for example `anna-rohn-portfolio`).
2. Upload this folder to it (GitHub Desktop: Add local repository, then Publish). `node_modules`, `dist` and `raw` are ignored on purpose.
3. On GitHub: Settings > Pages > Build and deployment > Source: **GitHub Actions**.
4. `.github/workflows/deploy.yml` builds and deploys on every push to `main`. The site appears at `https://<username>.github.io/<repository>/`.
5. Optional: set `og:image` in `index.html` to the full site URL so link previews show the hero render.

## Where things live
- `src/data.js` - all project text, credits, software lists, image order, gallery captions and the resume.
- `src/render.js` - builds the project pages from that data.
- `src/icons.js` - the software and method icons.
- `src/main.js` - intro, index overlay, lightbox, gallery trigger and plotter footer.
- `src/gallery.js` + `src/figures2d.js` - the Fine Art walk-through (3D room, framed paintings, scale figures, staircase mural).
- `public/img` - WebP images. `public/Anna-Rohn-Portfolio-2026-Lite.pdf` (about 6 MB, linked first), `Anna-Rohn-Portfolio-2026.pdf` (full resolution) and `Anna-Rohn-Resume.pdf` are the download buttons.
- `scripts/` - image extraction and optimisation helpers (need Python with PyMuPDF and Node with sharp); not used at build time.