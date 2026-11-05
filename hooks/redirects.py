"""Preserve published tutorial URLs after renaming the course pages."""

from html import escape
import posixpath
from urllib.parse import urlsplit

from mkdocs.structure.files import File


def on_files(files, config, **kwargs):
    redirects = {
        "tutorials/tutorial1/ReadMe/index.html": "tutorials/arduino-setup-gpio/",
        "tutorials/tutorial2/ReadMe/index.html": "tutorials/conditionals-loops/",
        "tutorials/tutorial3/ReadMe/index.html": "tutorials/variables-types/",
        "tutorials/tutorial4/ReadMe/index.html": "tutorials/serial-input/",
        "tutorials/tutorial5/ReadMe/index.html": "tutorials/hardware-timers/",
        "tutorials/tutorial6/ReadMe/index.html": "https://costawess.github.io/Programming-Dashboard/web/experiments/kitchen_timer.html",
        "tutorials/tutorial7/ReadMe/index.html": "lectures/i2c/",
        "workshops/index.html": "tutorials/",
    }
    for old, target in redirects.items():
        url = target if urlsplit(target).scheme else posixpath.relpath(target, posixpath.dirname(old)) + "/"
        url = escape(url, quote=True)
        icon = posixpath.relpath("assets/images/favicon.png", posixpath.dirname(old))
        html = f'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Page moved</title><link rel="icon" href="{icon}"><link rel="canonical" href="{url}"><meta http-equiv="refresh" content="0;url={url}"></head><body><p>This page has moved. <a href="{url}">Continue to the course page.</a></p></body></html>'
        files.append(File.generated(config, old, content=html))
    return files
