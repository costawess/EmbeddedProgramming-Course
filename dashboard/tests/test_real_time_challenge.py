from playwright.sync_api import sync_playwright
from pathlib import Path
import threading
import os
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args): pass

root = Path(__file__).resolve().parents[1]
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root)))
threading.Thread(target=server.serve_forever, daemon=True).start()
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROME_PATH'), headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(f'http://127.0.0.1:{server.server_port}/web/experiments/real_time_challenge.html')
    page.evaluate('''() => {
      const assert = (condition, message) => { if (!condition) throw Error(message); };
      const config = {duration:30000,sensor:3000,min:5000,max:10000,random:false};
      for (const mode of ['delay','millis','interrupt']) {
        const r = new RealTimeRound(mode, config, () => 0.5);
        r.start(0); r.advance(1200); r.emergency();
        if (mode === 'delay') {
          assert(r.events[0].handled === null, 'delay prematurely handled');
          r.advance(3000); assert(r.events[0].handled === 3000, 'delay boundary');
        } else if (mode === 'millis') {
          assert(r.state === 'RUNNING' && !r.trace.some(t => t.includes('HIGH')), 'poll leaks pending');
          r.advance(1900); r.poll(); assert(r.events[0].handled === 1900, 'poll latency');
        } else {
          assert(r.state === 'ISR' && r.events[0].handled === 1200, 'interrupt immediate');
          r.advance(1600); assert(r.state === 'RUNNING', 'ISR return');
        }
        for (let t=3000;t<=30000;t+=3000) r.advance(t);
        assert(r.state === 'FINISHED' && r.readings === 10 && r.sum === 40, 'sample count/sum '+mode);
      }
      const r = new RealTimeRound('millis', config, () => 0);
      r.start(0); r.advance(8000); r.emergency(); r.emergency(); r.advance(30000);
      assert(r.events.length === 2 && r.events.every(e => e.handled === null), 'pending accounting');
      const d = new RealTimeRound('delay', config, () => 0);
      d.start(0); for(let t=3000;t<30000;t+=3000) d.advance(t);
      d.advance(29500); d.emergency(); d.advance(30000);
      assert(d.events[0].handled === 30000, 'final delay boundary handling');
      const a = new RealTimeRound('interrupt', {...config,random:true}, () => .4);
      a.start(0); a.advance(4999); assert(a.events.length === 0, 'early random event');
      a.advance(7000); assert(a.events.length === 1, 'random event');
      a.setRandom(false); a.advance(14000); assert(a.events.length === 1, 'disable random');
    }''')
    page.clock.install()
    page.locator('#teacher summary').click()
    page.locator('#random').uncheck()
    page.locator('#start').click()
    page.clock.run_for(1200)
    page.locator('#force').click()
    assert page.locator('#eventState').inner_text() == 'EVENT PENDING'
    assert page.locator('#paperPlus').is_disabled()
    page.clock.run_for(1900)
    assert 'EMERGENCY DETECTED' in page.locator('#eventState').inner_text()
    page.locator('#reset').click()
    page.clock.run_for(4000)
    assert page.locator('#readings').inner_text() == '0 readings'
    page.locator('[data-mode=millis]').click()
    page.locator('#start').click()
    page.clock.run_for(1200)
    page.locator('#force').click()
    assert page.locator('#eventState').inner_text() == 'NORMAL'
    assert page.locator('#latency').inner_text() == ''
    page.locator('#paperPlus').click()
    page.clock.run_for(500)
    page.locator('#poll').click()
    assert 'HIGH' in page.locator('#eventDetail').inner_text()
    page.clock.run_for(28500)
    assert page.locator('#results').is_visible()
    assert page.locator('#readings').inner_text() == '10 readings'
    correct = page.locator('#sum').inner_text().split(': ')[-1]
    page.locator('#answer').fill(correct)
    page.locator('#answerForm button').click()
    assert 'Correct ✓' in page.locator('#answerFeedback').inner_text()
    page.locator('#next').click()
    assert page.locator('[data-mode=interrupt]').get_attribute('aria-pressed') == 'true'
    page.locator('#start').click()
    page.clock.run_for(1200)
    page.locator('#force').click()
    assert page.locator('#taskState').inner_text() == 'STOP · ISR'
    assert page.locator('#poll').is_hidden()
    page.clock.run_for(500)
    assert page.locator('#taskState').inner_text() == 'KEEP FOLDING!'
    page.clock.run_for(28500)
    page.locator('#next').click()
    assert page.locator('#comparison').is_visible()
    assert 'millis()' in page.locator('#comparisonTable').inner_text()
    for width in [390, 768, 1440]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'overflow at {width}'
    page.locator('#resetAll').click()
    page.locator('#comparisonButton').click()
    assert 'Not completed' in page.locator('#comparisonTable').inner_text()
    page.goto(f'http://127.0.0.1:{server.server_port}/web/index.html')
    assert page.locator('[data-feature-key=realTimeChallenge]').is_visible()
    page.locator('a[href="./experiments/real_time_challenge.html"]').click()
    assert page.locator('h1').inner_text() == 'Real-Time Challenge'
    page.locator('#sound').click()
    assert page.locator('#sound').inner_text() == 'Sound OFF'
    page.locator('#sound').click()
    assert page.locator('#sound').inner_text() == 'Sound ON'
    page.locator('#duration').select_option('60')
    assert page.locator('#clock').inner_text() == '01:00'
    page.locator('#start').click()
    page.locator('[data-mode=millis]').click()
    assert page.locator('#readings').inner_text() == '0 readings'
    assert page.locator('#start').is_enabled()
    page.locator('#start').click()
    page.evaluate("Object.defineProperty(document, 'hidden', {configurable:true, value:true}); document.dispatchEvent(new Event('visibilitychange'));")
    assert page.locator('#start').is_enabled()
    assert 'page was hidden' in page.locator('#notice').inner_text()
    page.evaluate("Object.defineProperty(document, 'hidden', {configurable:true, value:false}); localStorage.setItem('embedded-dashboard-lights-on', 'true');")
    page.reload()
    assert not page.locator('html').evaluate("el => el.classList.contains('theme-dark')")
    assert not errors, errors
    browser.close()
server.shutdown()
print('PASS: engine timing, three modes, polling secrecy, results, comparison, reset, responsive layout, dashboard navigation; no browser errors.')
