# Embedded Programming

Workshops and the EP Dashboard are maintained in this repository and published together with MkDocs Material on GitHub Pages.

## Preview locally

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements.txt
.\.venv\Scripts\python -m mkdocs serve
```

Open the local URL printed by MkDocs. The site starts in dark mode and includes a light-mode toggle.

## Project layout

- `docs/`: course pages, workshops, styles, and the Dashboard page.
- `mkdocs.yml`: top tabs, collapsible workshop groups, and theme configuration.
- `dashboard/`: imported EP Dashboard source, simulations, experiments, ESP32 examples, and its existing tests. Edit this copy for future dashboard work.
- `hooks/dashboard.py`: copies the dashboard web assets to `site/dashboard-app/` during every build. Firmware utilities, tests, and repository metadata are not published.

The Dashboard tab embeds the local dashboard while retaining the course navigation. **Open full screen** provides the standalone version. Both use the same source files. Web Serial requires a supported browser such as Chrome or Edge and HTTPS (or localhost).

## Build and publication

```powershell
.\.venv\Scripts\python -m mkdocs build --strict
```

The existing `.github/workflows/gh-pages.yml` builds the complete site after a push to `main` and publishes `site/` to GitHub Pages. The integration does not need another repository or hosting service.

The original sibling `EP Dashboard` directory is preserved as it was at import; this repository is now the working copy for the integrated dashboard.
