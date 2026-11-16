# Renders every page of a PDF to a JPEG (p-0001.jpg ...) in the output folder. Usage: render_pages.py in.pdf outdir
import sys, os, pymupdf
doc = pymupdf.open(sys.argv[1]); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
for i, page in enumerate(doc, 1):
    zoom = 1300 / page.rect.width
    page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False).save(os.path.join(out, f"p-{i:04d}.jpg"), jpg_quality=80)
print(len(doc))
