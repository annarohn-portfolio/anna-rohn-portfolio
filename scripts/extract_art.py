"""Extract the fine-art pieces from the March 2025 portfolio (run with: python -I scripts/extract_art.py)."""
import pymupdf, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "raw")
doc = pymupdf.open(r"C:\Users\Anna\OneDrive\harddrive\portfolio\portfolio 3-25-2025.pdf")
for x in (537, 538, 539, 544, 545, 183):
    info = doc.extract_image(x)
    name = os.path.join(OUT, f"art-{x}.{info['ext']}")
    if info.get("smask"):
        pix = pymupdf.Pixmap(doc, x)
        if pix.alpha: pix = pymupdf.Pixmap(pix, 0)
        pix = pymupdf.Pixmap(pix, pymupdf.Pixmap(doc, info["smask"])); name = os.path.join(OUT, f"art-{x}.png"); pix.save(name)
    else:
        open(name, "wb").write(info["image"])
    print(x, info["width"], info["height"], info["ext"], bool(info.get("smask")))
