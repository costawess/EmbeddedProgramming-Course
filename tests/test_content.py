"""Check imported content coverage and all built local HTML links/assets."""

import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"


class PageLinks(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get("id"):
            self.ids.add(attrs["id"])
        for name in ("href", "src"):
            if attrs.get(name):
                self.links.append(attrs[name])


def main():
    manifest = json.loads((ROOT / "tools/lecture-import-manifest.json").read_text(encoding="utf-8"))
    lectures = ROOT / "docs/lectures"
    assert manifest["total_sections"] == 353
    assert manifest["unconverted_latex_count"] == 0
    assert len(manifest["chapters"]) == 25
    for chapter in manifest["chapters"]:
        text = (lectures / (chapter["slug"] + ".md")).read_text(encoding="utf-8")
        count = len(re.findall(r"^## (?!Complete project sketches)", text, re.M))
        assert count == chapter["sections"], (chapter["slug"], count, chapter["sections"])
        assert "EPPLACEHOLDER" not in text
        assert "EPBOX" not in text
        assert "$`" not in text
        assert "dashboard.md" not in text
        assert "dashboard-app/" not in text
    assert len(list((lectures / "assets/diagrams").glob("*.png"))) == manifest["diagram_count"]
    assert len(list((lectures / "examples/projects").rglob("*.ino"))) == 7
    assert not (ROOT / "dashboard").exists()
    assert not (ROOT / "docs/dashboard.md").exists()
    assert not (ROOT / "docs/javascripts/dashboard.js").exists()
    assert not (ROOT / "docs/tutorials/tutorial7/ReadMe.md").exists()
    assert SITE.is_dir(), "Build the site first."
    assert not (SITE / "dashboard-app").exists()
    assert not (SITE / "dashboard").exists()
    pages = {}
    for path in SITE.rglob("*.html"):
        parser = PageLinks()
        parser.feed(path.read_text(encoding="utf-8"))
        pages[path.resolve()] = parser
    missing, broken_anchors = [], []
    links = 0
    for path, page in pages.items():
        for value in page.links:
            url = urlsplit(value)
            if url.scheme or url.netloc:
                continue
            links += 1
            if url.path.startswith("/EmbeddedProgramming-Course/"):
                target = SITE / unquote(url.path.removeprefix("/EmbeddedProgramming-Course/"))
            elif url.path.startswith("/"):
                missing.append((str(path.relative_to(SITE)), value, "root-relative URL"))
                continue
            elif url.path:
                target = path.parent / unquote(url.path)
            else:
                target = path
            target = target.resolve()
            if target.is_dir():
                target = target / "index.html"
            if not target.is_file():
                missing.append((str(path.relative_to(SITE)), value))
                continue
            if url.fragment and target in pages and not url.fragment.startswith(("__", ":")):
                anchor = unquote(url.fragment)
                if anchor not in pages[target].ids:
                    broken_anchors.append((str(path.relative_to(SITE)), value))
    assert not missing, json.dumps(missing, indent=2)
    assert not broken_anchors, json.dumps(broken_anchors, indent=2)
    print(f"PASS: 25 chapters, 353 sections, 107 diagrams, 7 complete sketches; {links} local links/assets across {len(pages)} built HTML pages, including anchors and redirects.")


if __name__ == "__main__":
    main()
