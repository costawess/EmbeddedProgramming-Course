"""Browser smoke test for the built course, including a GitHub Pages URL prefix.

Run after `python -m mkdocs build --strict`, using Python with Playwright installed.
Uses an installed Chrome browser (or CHROME_PATH).
"""

import os
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import expect, sync_playwright


ROOT = Path(__file__).resolve().parents[1]
PREFIX = "/EmbeddedProgramming-Course"


class SiteHandler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        return super().translate_path(path.removeprefix(PREFIX))

    def log_message(self, *args):
        pass


def main():
    assert (ROOT / "site/index.html").is_file(), "Build the site first."
    artifacts = ROOT / "artifacts"
    artifacts.mkdir(exist_ok=True)
    server = ThreadingHTTPServer(
        ("127.0.0.1", 0), partial(SiteHandler, directory=str(ROOT / "site"))
    )
    threading.Thread(target=server.serve_forever, daemon=True).start()
    origin = f"http://127.0.0.1:{server.server_port}"
    base = origin + PREFIX
    errors, missing = [], []
    try:
        with sync_playwright() as playwright:
            options = {"headless": True}
            if os.environ.get("CHROME_PATH"):
                options["executable_path"] = os.environ["CHROME_PATH"]
            else:
                options["channel"] = "chrome"
            browser = playwright.chromium.launch(**options)
            page = browser.new_page(viewport={"width": 1440, "height": 1000})
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.on("response", lambda response: missing.append(response.url)
                    if response.url.startswith(origin) and response.status >= 400 else None)
            page.goto(base + "/", wait_until="networkidle")
            expect(page.locator("body")).to_have_attribute("data-md-color-scheme", "slate")
            expect(page.locator(".md-tabs__link")).to_have_text(["Home", "Lectures", "Tutorials", "Dashboard"])
            expect(page.locator(".grid.cards > ul > li")).to_have_count(3)
            assert page.evaluate("getComputedStyle(document.body).backgroundColor") == "rgb(30, 33, 41)"
            page.screenshot(path=str(artifacts / "home-desktop.png"), full_page=True)

            # Follow the Material instant-navigation path, rather than only direct URLs.
            page.locator(".md-tabs__link", has_text="Tutorials").click()
            expect(page.locator(".md-content h1")).to_contain_text("Practical tutorials")
            expect(page.locator(".grid.cards > ul > li")).to_have_count(5)
            group = page.locator(".md-sidebar--primary label.md-nav__link", has_text="Programming fundamentals")
            checkbox = page.locator("#" + group.get_attribute("for"))
            expect(checkbox).not_to_be_checked()
            group.click()
            expect(checkbox).to_be_checked()
            expect(page.locator(".md-sidebar--primary a", has_text="Variables & data types")).to_be_visible()
            group.click()
            expect(checkbox).not_to_be_checked()
            page.screenshot(path=str(artifacts / "tutorials-desktop.png"), full_page=True)

            # Dashboard is a normal external link; the course has no embedded app.
            external = "https://costawess.github.io/Programming-Dashboard/web/index.html"
            expect(page.locator(".md-tabs__link", has_text="Dashboard")).to_have_attribute("href", external)
            expect(page.locator("iframe")).to_have_count(0)
            page.locator('label[for="__palette_1"]').click()
            expect(page.locator("body")).to_have_attribute("data-md-color-scheme", "default")
            page.locator('label[for="__palette_0"]').click()
            expect(page.locator("body")).to_have_attribute("data-md-color-scheme", "slate")

            # Course layouts must fit phone, tablet, and desktop widths.
            for width in (390, 768, 1440):
                page.set_viewport_size({"width": width, "height": 900})
                for route in ("/", "/lectures/", "/tutorials/", "/lectures/analog-pwm/"):
                    page.goto(base + route, wait_until="networkidle")
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (width, route)
                if width == 390:
                    page.screenshot(path=str(artifacts / "course-mobile.png"))
                    page.locator('.md-header label[for="__drawer"]').click()
                    expect(page.locator("#__drawer")).to_be_checked()
                    expect(page.locator(".md-sidebar--primary label.md-nav__link", has_text="Tutorials")).to_be_visible()

            page.goto(base + "/", wait_until="networkidle")

            # A lecture keeps its diagrams, copyable examples, tables, and quiz answers.
            page.locator(".md-tabs__link", has_text="Lectures").click()
            expect(page.locator(".md-content h1")).to_contain_text("Lectures")
            page.locator('.md-content a[href$="analog-pwm/"]').first.click()
            expect(page.locator(".md-content h1")).to_contain_text("Analog Input, PWM and DAC")
            expect(page.locator(".lecture-figure").first).to_be_visible()
            assert page.locator(".lecture-figure").first.evaluate("el => el.complete && el.naturalWidth > 100")
            expect(page.locator(".md-typeset table").first).to_be_attached()
            expect(page.locator(".highlight").first).to_be_attached()
            expect(page.locator("mjx-container").first).to_be_attached(timeout=20000)
            expect(page.locator("mjx-merror")).to_have_count(0)
            answer = page.locator("details.lecture-answer").first
            expect(answer).not_to_have_attribute("open", "")
            answer.locator("summary").click()
            expect(answer).to_have_attribute("open", "")
            expect(answer.locator("p")).to_be_visible()
            page.screenshot(path=str(artifacts / "lecture-desktop.png"))

            # Each lecture activity points directly to its externally hosted simulation.
            expect(page.locator(".lecture-simulation").first).to_have_attribute(
                "href", "https://costawess.github.io/Programming-Dashboard/web/simulations/course_topics_lab.html?topic=adc"
            )
            expect(page.locator("iframe")).to_have_count(0)

            # Previously published tutorial URLs remain usable after renaming folders.
            page.goto(base + "/tutorials/tutorial1/ReadMe/", wait_until="networkidle")
            expect(page).to_have_url(base + "/tutorials/arduino-setup-gpio/")
            expect(page.locator(".md-content h1")).to_contain_text("Arduino IDE setup and digital GPIO")

            # Verify the menu click without coupling this test to the external app.
            page.route("https://costawess.github.io/Programming-Dashboard/**", lambda route: route.fulfill(
                status=200, content_type="text/html", body="<h1>External dashboard</h1>"
            ))
            page.locator(".md-tabs__link", has_text="Dashboard").click()
            expect(page).to_have_url(external)
            expect(page.locator("h1")).to_have_text("External dashboard")

            assert not missing, missing
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("PASS: course tabs, sidebar expansion, lecture diagrams/tables/code/math/quizzes, external simulation links, renamed tutorial redirects, palettes, responsive layouts; no browser errors or missing local assets.")


if __name__ == "__main__":
    main()
