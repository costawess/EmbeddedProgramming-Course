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

            page.locator(".md-tabs__link", has_text="Dashboard").click()
            expect(page.locator(".md-content h1")).to_contain_text("EP Dashboard")
            dashboard = page.frame_locator("#ep-dashboard-frame")
            search = dashboard.locator("#menuSearchInput")
            expect(search).to_be_visible()
            expect(dashboard.locator("html")).to_have_class("theme-dark")
            # Real dashboard filtering, with feature flags kept as imported.
            search.fill("UART")
            expect(dashboard.locator(".menu-card:visible")).not_to_have_count(0)
            search.fill("")
            page.wait_for_function("document.querySelector('#ep-dashboard-frame').offsetHeight > 1000")
            page.screenshot(path=str(artifacts / "dashboard-desktop.png"))

            # The parent palette also updates the embedded application.
            page.locator('label[for="__palette_1"]').click()
            expect(page.locator("body")).to_have_attribute("data-md-color-scheme", "default")
            expect(dashboard.locator("html")).not_to_have_class("theme-dark")
            expect(dashboard.locator("[data-lights-toggle]").first).to_have_text("Lights ON")
            page.locator('label[for="__palette_0"]').click()
            expect(dashboard.locator("html")).to_have_class("theme-dark")
            expect(dashboard.locator("[data-lights-toggle]").first).to_have_text("Lights OFF")
            dashboard.locator("[data-lights-toggle]").first.click()
            expect(page.locator("body")).to_have_attribute("data-md-color-scheme", "default")
            dashboard.locator("[data-lights-toggle]").first.click()
            expect(page.locator("body")).to_have_attribute("data-md-color-scheme", "slate")

            # Navigate inside the frame and fetch example sketches from the new paths.
            dashboard.locator('a[href="./experiments/kitchen_timer.html"]').click()
            expect(dashboard.locator("h1")).to_contain_text("Kitchen")
            expect(page.locator(".md-tabs__link", has_text="Dashboard")).to_be_visible()
            expect(dashboard.get_by_text("Example code", exact=True)).to_be_visible()
            response = page.request.get(base + "/dashboard-app/web/experiments/responses/kitchen_timer/esp32_kitchen_timer_uart.ino")
            assert response.status == 200 and "void setup" in response.text()
            assert not (ROOT / "site/dashboard-app/esp32").exists()
            assert not (ROOT / "site/dashboard-app/tests").exists()
            assert not (ROOT / "dashboard/.git").exists()
            assert dashboard.locator("html").evaluate("() => document.featurePolicy.allowsFeature('serial')")

            # Course and app layouts must fit phone, tablet, and desktop widths.
            for width in (390, 768, 1440):
                page.set_viewport_size({"width": width, "height": 900})
                for route in ("/", "/lectures/", "/tutorials/", "/lectures/analog-pwm/", "/dashboard/"):
                    page.goto(base + route, wait_until="networkidle")
                    assert page.evaluate("document.documentElement.scrollWidth <= innerWidth"), (width, route)
                    if route == "/dashboard/":
                        expect(page.frame_locator("#ep-dashboard-frame").locator("#menuSearchInput")).to_be_visible()
                        assert page.frame_locator("#ep-dashboard-frame").locator("html").evaluate(
                            "el => el.scrollWidth <= innerWidth"
                        ), (width, "dashboard frame")
                if width == 390:
                    page.screenshot(path=str(artifacts / "dashboard-mobile.png"))
                    page.locator('.md-header label[for="__drawer"]').click()
                    expect(page.locator("#__drawer")).to_be_checked()
                    expect(page.locator(".md-sidebar--primary label.md-nav__link", has_text="Tutorials")).to_be_visible()

            # Leaving and returning to the Dashboard exercises iframe cleanup.
            page.goto(base + "/", wait_until="networkidle")
            for _ in range(2):
                page.locator(".md-tabs__link", has_text="Dashboard").click()
                expect(page.frame_locator("#ep-dashboard-frame").locator("#menuSearchInput")).to_be_visible()
                page.locator(".md-tabs__link", has_text="Home").click()
                expect(page.locator(".md-content h1")).to_contain_text("Embedded Programming")

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

            # Lecture simulation buttons open the selected local lab in the same shell.
            page.locator(".lecture-simulation").first.click()
            expect(page.locator("#ep-dashboard-frame")).to_have_attribute("src", base + "/dashboard-app/web/simulations/course_topics_lab.html?topic=adc")
            lab = page.frame_locator("#ep-dashboard-frame")
            expect(lab.locator("h1")).to_be_visible()
            expect(page.locator(".md-tabs__link", has_text="Lectures")).to_be_visible()

            # Previously published tutorial URLs remain usable after renaming folders.
            page.goto(base + "/tutorials/tutorial1/ReadMe/", wait_until="networkidle")
            expect(page).to_have_url(base + "/tutorials/arduino-setup-gpio/")
            expect(page.locator(".md-content h1")).to_contain_text("Arduino IDE setup and digital GPIO")

            assert not missing, missing
            assert not errors, errors
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print("PASS: course tabs, sidebar expansion, lecture diagrams/tables/code/math/quizzes, deep-linked simulations, renamed tutorial redirects, palettes, dashboard, responsive layouts; no browser errors or missing local assets.")


if __name__ == "__main__":
    main()
