"""Publish the imported static dashboard alongside MkDocs, from one source tree."""

from pathlib import Path
from mkdocs.structure.files import File


def on_files(files, config, **kwargs):
    root = Path(config.config_file_path).parent
    source = root / "dashboard"
    # Firmware, Python utilities, tests and repository metadata are source-only.
    assets = [source / name for name in ("index.html", "about.html", "contact.html")]
    for name in ("assets", "css", "images", "js", "web"):
        assets.extend((source / name).rglob("*"))
    for path in sorted(assets):
        relative = path.relative_to(source)
        if not path.is_file() or path.suffix in (".md", ".pyc"):
            continue
        if any(part.startswith(".") or part == "__pycache__" for part in relative.parts):
            continue
        files.append(File.generated(config, f"dashboard-app/{relative.as_posix()}", abs_src_path=str(path)))
    return files
