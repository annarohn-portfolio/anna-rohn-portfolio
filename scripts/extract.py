"""Extract portfolio imagery from the PDF into raw/ (run with: python -I scripts/extract.py)."""
import pymupdf, os, sys
PDF = r"C:\Users\Anna\OneDrive\harddrive\portfolio\portfolio 10-8-2026.pdf"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "raw")
PUB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public")
doc = pymupdf.open(PDF)

# Embedded images pulled out at native resolution (clean, no page furniture)
RAW = [7,9,13,17,19,92,110,115,118,124,131,135,158,162,179,183,186,191,194,207,208,211,238,241,
       244,247,250,253,258,260,264,267,268,280,315,318,339,343,350,392,396,401,366,142,146,150,154]
for x in RAW:
    info = doc.extract_image(x)
    if info.get("smask"):
        # soft-masked drawings: keep the alpha so they sit on white instead of black
        pix = pymupdf.Pixmap(doc, x)
        if pix.alpha: pix = pymupdf.Pixmap(pix, 0)
        pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, info["smask"]))
        pix.save(os.path.join(OUT, f"x{x}.png"))
        print("masked", x)
    else:
        with open(os.path.join(OUT, f"x{x}.{info['ext']}"), "wb") as f:
            f.write(info["image"])

# Composite / vector pages rendered whole (page numbers trimmed off the bottom)
PAGES = [6,7,10,11,16,17,18,19,20,21,23,28,29,30,31,32,33,41,42,43,44,45,48,49,52,53,54,55]
for n in PAGES:
    p = doc[n-1]
    # whole page height so facing pages sit flush as a spread; paint out the folio number
    for w in p.get_text("words"):
        if w[4].strip().isdigit() and len(w[4].strip()) <= 2 and w[1] > 690:
            r = pymupdf.Rect(w[0] - 2, w[1] - 2, w[2] + 2, w[3] + 2)
            probe = p.get_pixmap(clip=pymupdf.Rect(r.x0 - 4, r.y0 - 4, r.x1 + 4, r.y1 + 4), dpi=72, alpha=False)
            c = probe.pixel(0, 0)
            col = tuple(v / 255 for v in c[:3])
            p.draw_rect(r, color=col, fill=col)
    if n == 44:   # keep the brief as live HTML text: paint the text block out of the drawing
        for b in p.get_text("blocks"):
            if b[6] == 0 and b[1] < 200:
                p.draw_rect(pymupdf.Rect(b[0] - 2, b[1] - 2, b[2] + 2, b[3] + 2), color=(1, 1, 1), fill=(1, 1, 1))
    zoom = 2000 / 576
    pix = p.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    pix.save(os.path.join(OUT, f"p{n}.png"))

# Downloadable resume = page 58 of the portfolio
r = pymupdf.open(); r.insert_pdf(doc, from_page=57, to_page=57)
rp = r[0]
for w in rp.get_text("words"):                       # take the folio (page number) off the downloadable resume
    if w[4].strip() == "58" and w[0] < 60 and w[1] > 660:
        rp.add_redact_annot(pymupdf.Rect(w[0] - 1, w[1] - 1, w[2] + 1, w[3] + 1), fill=(1, 1, 1))
rp.apply_redactions()
r.save(os.path.join(PUB, "Anna-Rohn-Resume.pdf"), garbage=3, deflate=True)
print("done", len(os.listdir(OUT)))

