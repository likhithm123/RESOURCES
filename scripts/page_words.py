# Prints JSON: one entry per PDF page with the page's words joined by spaces and each word's box
# in 0-1000 page coordinates (used for in-document search and highlights). Usage: page_words.py file.pdf
import sys, json, pymupdf
out = []
for page in pymupdf.open(sys.argv[1]):
    W, H = page.rect.width, page.rect.height
    words = [w for w in page.get_text("words", sort=True) if w[4].strip()]
    out.append({"text": " ".join(w[4] for w in words),
                "boxes": [[round(w[0] / W * 1000), round(w[1] / H * 1000), round(w[2] / W * 1000), round(w[3] / H * 1000)] for w in words]})
print(json.dumps(out))
