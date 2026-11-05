"""Publish the imported static dashboard alongside MkDocs, from one source tree."""

from pathlib import Path
from html import escape
import posixpath
from mkdocs.structure.files import File


def on_files(files, config, **kwargs):
    root = Path(config.config_file_path).parent
    source = root / "dashboard"
    # Keep source tests, repository metadata and authoring notes out of the site.
    assets = [source / "index.html"]
    for name in ("assets", "js", "web"):
        assets.extend((source / name).rglob("*"))
    for path in sorted(assets):
        relative = path.relative_to(source)
        if not path.is_file() or path.suffix in (".md", ".pyc"):
            continue
        if any(part.startswith(".") or part == "__pycache__" for part in relative.parts):
            continue
        files.append(File.generated(config, f"dashboard-app/{relative.as_posix()}", abs_src_path=str(path)))
    # Preserve published course links after replacing numbered tutorial folders.
    redirects = {
        "tutorials/tutorial1/ReadMe/index.html": "tutorials/arduino-setup-gpio/",
        "tutorials/tutorial2/ReadMe/index.html": "tutorials/conditionals-loops/",
        "tutorials/tutorial3/ReadMe/index.html": "tutorials/variables-types/",
        "tutorials/tutorial4/ReadMe/index.html": "tutorials/serial-input/",
        "tutorials/tutorial5/ReadMe/index.html": "tutorials/hardware-timers/",
        "tutorials/tutorial6/ReadMe/index.html": "dashboard/?lab=experiments/kitchen_timer.html",
        "tutorials/tutorial7/ReadMe/index.html": "lectures/i2c/",
        "workshops/index.html": "tutorials/",
    }
    for old, target in redirects.items():
        relative = escape(posixpath.relpath(target.split("?", 1)[0], posixpath.dirname(old)) + "/" + ("?" + target.split("?", 1)[1] if "?" in target else ""), quote=True)
        icon = posixpath.relpath("assets/images/favicon.png", posixpath.dirname(old))
        html = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page moved</title><link rel="icon" href="{icon}"><link rel="canonical" href="{relative}"><meta http-equiv="refresh" content="0;url={relative}"></head><body><p>This page has moved. <a href="{relative}">Continue to the course page.</a></p></body></html>'
        files.append(File.generated(config, old, content=html))
    return files
