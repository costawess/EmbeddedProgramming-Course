# Embedded Programming

Lecture chapters, practical tutorials and the EP Dashboard are maintained here and published together with MkDocs Material on GitHub Pages.

## Preview locally

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m mkdocs serve
```

Open the local URL printed by MkDocs. The site starts in dark mode and includes a light-mode toggle.

## Project layout

- `docs/lectures/`: 25 lecture chapters, references, diagrams, quizzes, exercises and downloadable examples.
- `docs/tutorials/`: practical tutorials named after their actual subjects, with sketches and images alongside each page.
- `docs/stylesheets/` and `docs/javascripts/`: course styling, mathematical typesetting and dashboard integration.
- `mkdocs.yml`: top tabs, expandable topic groups and theme configuration.
- `dashboard/`: the simulation and experiment application, its shared assets and tests.
- `hooks/dashboard.py`: publishes dashboard assets under `dashboard-app/` and keeps old tutorial URLs working through redirects.
- `tools/import_lectures.py`: optional importer for the external Beamer course material.
- `tools/lecture-import-manifest.json`: chapter and content counts from the last import.
- `tests/`: built-site link checks and browser integration tests.

The Dashboard tab embeds the local dashboard while retaining course navigation. Lecture links can open a particular simulation directly in that tab. **Open full screen** provides the standalone version. Both use the same source files. Web Serial requires a supported browser such as Chrome or Edge and HTTPS (or localhost).

## Build and publication

```powershell
.\.venv\Scripts\python -m mkdocs build --strict
```

The existing `.github/workflows/gh-pages.yml` builds the complete site after a push to `main` and publishes `site/` to GitHub Pages. The integration does not need another repository or hosting service.

## Updating the lecture import

The normal build uses the Markdown pages and images already in this repository. Pandoc and LaTeX are only needed when importing an updated external deck:

```powershell
.\.venv\Scripts\python -m pip install -r requirements-import.txt
.\.venv\Scripts\python tools/import_lectures.py "<path-to-latex>"
```

The importer reads `esp32-arduino.tex`, expands its content chapters and supplements, exports code, and renders TikZ/circuit drawings using `pdflatex` on PATH. It reads the external source without editing it. Generated diagnostics go to the ignored `artifacts/lecture-import/` directory. Re-importing regenerates lecture pages; make content corrections in the external source first when that remains the authoring source.

The imported content contains 353 sections, 107 rendered diagrams, 134 displayed code examples and 7 complete project sketches. Repeated title, agenda and closing slides and LaTeX build/template files are omitted from the website.

## Validation

After building:

```powershell
.\.venv\Scripts\python tests/test_content.py
python -m pip install playwright
python tests/test_site.py
```

The browser test uses an installed Chrome or the executable specified by `CHROME_PATH`. It serves the site under the GitHub Pages URL prefix and checks navigation, lecture content, diagrams, quiz answers, mathematical rendering, simulation links, redirects, themes and mobile layouts.

## Cleanup and original material

The original external LaTeX and `EP Dashboard` directories remain intact. The integrated dashboard is maintained here. Unrelated firmware, old landing-page templates, empty tutorial drafts and authoring shortcuts were removed from the tracked/published tree. For this cleanup, their full contents were preserved locally in `artifacts/cleanup-backup/`, ignored by Git. Editor settings, environments, generated builds and caches are also ignored.
