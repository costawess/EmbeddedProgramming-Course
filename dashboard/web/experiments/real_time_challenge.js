/* One animation loop owns all timing; no sensor/emergency timeout survives reset. */
class RealTimeRound {
  constructor(mode, config, random = Math.random) {
    this.mode = mode;
    this.config = config;
    this.random = random;
    this.state = 'IDLE';
    this.elapsed = 0;
    this.sum = 0;
    this.readings = 0;
    this.value = null;
    this.papers = 0;
    this.answer = null;
    this.events = [];
    this.trace = [];
    this.isrUntil = 0;
    this.sensorFlashUntil = 0;
    this.alertUntil = 0;
    this.lastPoll = null;
    this.randomEnabled = config.random;
  }
  gap() { return this.config.min + this.random() * (this.config.max - this.config.min); }
  log(label) { this.trace.push(label); this.trace = this.trace.slice(-9); }
  start(now) {
    this.started = now;
    this.state = this.mode === 'delay' ? 'BLOCKED' : 'RUNNING';
    this.nextSensor = this.config.sensor;
    this.nextEmergency = this.randomEnabled ? this.gap() : Infinity;
    this.nextMain = 1000;
    this.readSensor(); // Same initial sample and workload in all three modes.
  }
  readSensor() {
    this.value = 1 + Math.floor(this.random() * 6);
    this.sum += this.value;
    this.readings++;
    this.sensorFlashUntil = this.elapsed + 400;
    this.log('Sensor ' + this.value);
    if (this.mode === 'delay') this.log('BLOCKED');
  }
  handle(event, time) {
    event.handled = time;
    this.alertUntil = time + 1800;
  }
  emergency() {
    if (!this.running) return;
    const event = { occurred: this.elapsed, handled: null };
    this.events.push(event);
    if (this.mode === 'interrupt') {
      this.handle(event, this.elapsed);
      this.isrUntil = this.elapsed + 400;
      this.state = 'ISR';
      this.log('Event → ISR: flag');
    } else if (this.mode === 'delay') {
      this.state = 'EVENT_PENDING';
    }
    // Polling deliberately exposes no pending state, sound, or timeline entry.
  }
  poll() {
    if (!this.running || this.mode !== 'millis') return;
    const pending = this.events.filter(event => event.handled === null);
    pending.forEach(event => this.handle(event, this.elapsed));
    this.lastPoll = { high: pending.length > 0, time: this.elapsed };
    this.log(pending.length ? 'Check: HIGH → handle' : 'Check: LOW');
  }
  setRandom(enabled) {
    this.randomEnabled = enabled;
    this.nextEmergency = enabled ? this.elapsed + this.gap() : Infinity;
  }
  get running() { return !['IDLE', 'FINISHED'].includes(this.state); }
  advance(now) {
    if (!this.running) return;
    this.elapsed = Math.min(now - this.started, this.config.duration);
    if (this.state === 'ISR' && this.elapsed >= this.isrUntil) {
      this.state = 'RUNNING';
      this.log('Return → loop(): handle flag');
    }
    // Finish before generating a new sample/event at the end boundary.
    if (this.elapsed >= this.config.duration) {
      if (this.mode === 'delay' && this.nextSensor <= this.elapsed) {
        this.events.filter(event => event.handled === null).forEach(event => this.handle(event, this.elapsed));
      }
      this.state = 'FINISHED';
      this.log('Round complete');
      return;
    }
    if (this.elapsed >= this.nextEmergency) {
      this.emergency();
      this.nextEmergency = this.elapsed + this.gap();
    }
    if (this.elapsed >= this.nextSensor && this.state !== 'ISR') {
      if (this.mode === 'delay') {
        this.events.filter(event => event.handled === null).forEach(event => this.handle(event, this.elapsed));
        this.state = 'BLOCKED';
      }
      this.readSensor();
      this.nextSensor += this.config.sensor;
    }
    if (this.mode !== 'delay' && this.state !== 'ISR' && this.elapsed >= this.nextMain) {
      this.log('loop() · fold');
      this.nextMain = this.elapsed + 1000;
    }
  }
}

(() => {
  const $ = id => document.getElementById(id);
  const modes = ['delay', 'millis', 'interrupt'];
  const names = { delay: 'delay()', millis: 'millis()', interrupt: 'Interrupt' };
  const descriptions = {
    delay: 'Blocking: stop folding during every delay. A pending emergency is handled only when the delay ends.',
    millis: 'Non-blocking + polling: keep folding, add sensor values, and press Poll input to check for emergencies.',
    interrupt: 'Event-driven: keep folding. An emergency runs a short ISR, then returns to the main task. millis() still times the sensor.'
  };
  const snippets = {
    delay: `void loop() {
    readSensor();
    delay(3000);
    if (digitalRead(buttonPin) == HIGH) {
        handleEvent();
    }
}`,
    millis: `void loop() {
    if (millis() - previousMillis >= 3000) {
        previousMillis = millis();
        readSensor();
    }
    if (digitalRead(buttonPin) == HIGH) {
        handleEvent(); // Only detected when polled
    }
    foldPaper(); // Main task
}`,
    interrupt: `volatile bool emergency = false;

void IRAM_ATTR emergencyISR() {
    emergency = true; // Keep the ISR short
}

// In setup(), for an active-high input:
// attachInterrupt(digitalPinToInterrupt(buttonPin),
//                 emergencyISR, RISING);

void loop() {
    if (millis() - previousMillis >= 3000) {
        previousMillis = millis();
        readSensor();
    }
    if (emergency) {
        emergency = false;
        handleEvent(); // Work happens in the main loop
    }
    foldPaper();
}`
  };
  let mode = 'delay';
  let round;
  let frame = null;
  const history = {};
  const seconds = n => (n / 1000).toFixed(3) + ' s';
  const latency = n => n === null ? '—' : n < 1000 ? Math.round(n) + ' ms' : (n / 1000).toFixed(2) + ' s';
  const sound = kind => window.uiSound?.play(kind);

  function config() {
    return { duration: Number($('duration').value) * 1000, sensor: Number($('sensorInterval').value) * 1000,
      min: Number($('emergencyMin').value) * 1000, max: Number($('emergencyMax').value) * 1000, random: $('random').checked };
  }
  function stopFrame() { if (frame !== null) cancelAnimationFrame(frame); frame = null; }
  function reset() {
    stopFrame();
    round = new RealTimeRound(mode, config());
    $('results').hidden = true;
    $('answerForm').reset();
    $('answerFeedback').textContent = '';
    $('notice').textContent = '';
    render();
  }
  function selectMode(value) {
    mode = value;
    reset();
  }
  function start() {
    for (const id of ['sensorInterval', 'emergencyMin', 'emergencyMax']) {
      if (!$(id).reportValidity()) return;
    }
    if (Number($('emergencyMax').value) < Number($('emergencyMin').value)) {
      $('notice').textContent = 'Emergency maximum must be at least the minimum.';
      return;
    }
    reset();
    $('comparison').hidden = true;
    round.start(performance.now());
    sound('tick');
    render();
    frame = requestAnimationFrame(tick);
  }
  function update(now) {
    const readings = round.readings;
    const handled = round.events.filter(event => event.handled !== null).length;
    const wasRunning = round.running;
    round.advance(now);
    if (round.readings > readings) sound('tick');
    if (round.events.filter(event => event.handled !== null).length > handled) sound('error');
    if (wasRunning && !round.running) finish();
  }
  function tick(now) {
    frame = null;
    update(now);
    render();
    if (round.running) frame = requestAnimationFrame(tick);
  }
  function interact(action) {
    update(performance.now());
    if (!round.running) { render(); return; }
    action();
    render();
  }
  function render() {
    const running = round.running;
    const finished = round.state === 'FINISHED';
    const blocked = running && mode === 'delay';
    const isr = running && round.state === 'ISR';
    document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
    $('modeDescription').textContent = descriptions[mode];
    $('code').textContent = snippets[mode];
    const secondsLeft = Math.ceil(((running || finished ? round.config.duration : config().duration) - round.elapsed) / 1000);
    $('clock').textContent = String(Math.floor(secondsLeft / 60)).padStart(2, '0') + ':' + String(secondsLeft % 60).padStart(2, '0');
    $('start').disabled = running;
    $('duration').disabled = running;
    $('timingSettings').disabled = running;
    $('force').disabled = !running;
    $('poll').hidden = mode !== 'millis';
    $('poll').disabled = !running;
    $('instructions').hidden = running || finished;
    $('taskCard').className = 'panel task ' + (blocked ? 'blocked' : isr ? 'isr' : running ? 'available' : '');
    $('taskState').textContent = blocked ? 'STOP FOLDING' : isr ? 'STOP · ISR' : running ? 'KEEP FOLDING!' : finished ? 'ROUND COMPLETE' : 'READY?';
    $('cpuState').textContent = blocked ? 'CPU BLOCKED · delay()' : isr ? 'Setting emergency flag → returning' : running ? 'CPU AVAILABLE · loop()' : finished ? 'Enter your sensor total below.' : 'CPU idle';
    $('blocking').hidden = !blocked;
    const remaining = Math.max(0, round.nextSensor - round.elapsed);
    $('blockingLabel').textContent = blocked ? 'delay(' + round.config.sensor + ') · ' + (remaining / 1000).toFixed(1) + ' s remaining' : '';
    $('blockProgress').value = blocked ? remaining / round.config.sensor : 0;
    $('papers').textContent = round.papers;
    $('paperMinus').disabled = !running || round.papers === 0;
    $('paperPlus').disabled = !running || blocked || isr;
    $('sensorValue').textContent = round.value ?? '—';
    $('sensorCard').classList.toggle('pulse', running && round.elapsed < round.sensorFlashUntil);
    $('sensorCountdown').textContent = running ? 'Next reading: ' + (remaining / 1000).toFixed(1) + ' s' : finished ? 'Sensor stopped' : 'Every ' + Number($('sensorInterval').value) + ' seconds · first reading at START';
    $('sum').textContent = $('showSum').checked || finished ? 'Correct accumulated sum: ' + round.sum : 'Your calculated sum: ?';
    $('readings').textContent = round.readings + ' readings';
    const pending = round.events.filter(event => event.handled === null);
    const last = round.events.filter(event => event.handled !== null).at(-1);
    const alert = running && round.elapsed < round.alertUntil;
    $('eventCard').classList.toggle('alert', isr || alert || (blocked && pending.length > 0));
    $('eventState').textContent = isr ? 'INTERRUPT' : blocked && pending.length ? 'EVENT PENDING' : alert ? 'EMERGENCY DETECTED' : 'NORMAL';
    $('eventDetail').textContent = finished ? 'Round ended. See detected and missed events below.' : !running ? 'Waiting to start.' : blocked && pending.length ? 'Input changed at ' + seconds(pending[0].occurred) + '. CPU cannot handle it until delay ends.' : isr ? 'ISR sets a flag. Main execution temporarily paused.' : mode === 'millis' ? (round.lastPoll ? 'Last check: Input ' + (round.lastPoll.high ? 'HIGH · emergency detected' : 'LOW · no event') + ' at ' + seconds(round.lastPoll.time) : 'Input not checked yet. Press Poll input.') : alert ? 'Event handled. Return to the main task.' : mode === 'interrupt' ? 'Listening for an interrupt; no polling required.' : 'Waiting for an asynchronous input.';
    $('latency').textContent = last ? 'Occurred ' + seconds(last.occurred) + ' · ' + (mode === 'millis' ? 'Checked ' : 'Handled ') + seconds(last.handled) + ' · Latency ' + latency(last.handled - last.occurred) + (mode === 'interrupt' ? ' (immediate / event-driven in this simulation)' : '') : '';
    const trace = round.trace.length ? round.trace : ['Ready → start round'];
    $('timeline').replaceChildren(...trace.map(label => { const span = document.createElement('span'); span.textContent = label; return span; }));
    $('timeline').scrollLeft = $('timeline').scrollWidth;
    $('isrNote').textContent = mode === 'interrupt' ? 'The 400 ms ISR animation is slowed down for teaching, not a real ISR duration. The ISR only sets a flag; the main loop handles it. Sensor timing still uses millis().' : 'The student represents the CPU. Browser animation does not block the browser itself.';
  }
  function metrics(result) {
    const handled = result.events.filter(event => event.handled !== null);
    const times = handled.map(event => event.handled - event.occurred);
    return {
      'Mode': names[result.mode], 'Round duration': result.config.duration / 1000 + ' s',
      'Sensor interval': result.config.sensor / 1000 + ' s', 'Sensor readings': result.readings,
      'Correct sensor sum': result.sum, 'Student sum': result.answer ?? 'Not entered',
      'Student sum correct': result.answer === null ? 'Not checked' : result.answer === result.sum ? 'Yes' : 'No (difference ' + (result.answer - result.sum) + ')',
      'Papers completed': result.papers, 'Emergency events': result.events.length,
      'Events detected / handled': handled.length, 'Missed / pending at end': result.events.length - handled.length,
      'Average response latency': latency(times.length ? times.reduce((a, b) => a + b, 0) / times.length : null),
      'Maximum response latency': latency(times.length ? Math.max(...times) : null)
    };
  }
  function showSummary() {
    $('summary').replaceChildren(...Object.entries(metrics(round)).map(([label, value]) => {
      const div = document.createElement('div'); div.className = 'metric';
      const span = document.createElement('span'); span.textContent = label;
      const strong = document.createElement('strong'); strong.textContent = value;
      div.append(span, strong); return div;
    }));
    $('eventLog').replaceChildren(...round.events.map((event, index) => {
      const tr = document.createElement('tr');
      [index + 1, seconds(event.occurred), event.handled === null ? 'Missed / pending' : seconds(event.handled), event.handled === null ? '—' : latency(event.handled - event.occurred)].forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.append(td); });
      return tr;
    }));
  }
  function finish() {
    stopFrame();
    history[mode] = round;
    $('results').hidden = false;
    $('next').textContent = mode === 'interrupt' ? 'View comparison' : 'Next mode → ' + names[modes[modes.indexOf(mode) + 1]];
    showSummary();
    buildComparison();
    sound('success');
    $('results').focus({ preventScroll: true });
  }
  function buildComparison() {
    const table = document.createElement('table');
    const head = table.createTHead().insertRow();
    ['Metric', ...modes.map(value => names[value])].forEach(value => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = value; head.append(th); });
    const body = table.createTBody();
    const labels = Object.keys(metrics(round)).filter(label => label !== 'Mode');
    const results = modes.map(value => history[value] ? metrics(history[value]) : null);
    labels.forEach(label => {
      const tr = body.insertRow(); const th = document.createElement('th'); th.scope = 'row'; th.textContent = label; tr.append(th);
      results.forEach(result => { const td = tr.insertCell(); td.textContent = result ? result[label] : 'Not completed'; });
    });
    const tr = body.insertRow();
    ['Response model', 'After blocking finishes', 'At the next input check', 'Immediate / event-driven in this simulation'].forEach(value => { tr.insertCell().textContent = value; });
    $('comparisonTable').replaceChildren(table);
  }
  function showComparison() { buildComparison(); $('comparison').hidden = false; $('comparison').focus(); }
  $('start').addEventListener('click', start);
  $('retry').addEventListener('click', start);
  $('reset').addEventListener('click', reset);
  $('resetAll').addEventListener('click', () => { Object.keys(history).forEach(key => delete history[key]); reset(); $('comparison').hidden = true; });
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => selectMode(button.dataset.mode)));
  $('duration').addEventListener('change', reset);
  $('sensorInterval').addEventListener('change', render);
  $('showSum').addEventListener('change', render);
  $('sound').addEventListener('click', () => window.uiSound?.toggleMuted());
  $('random').addEventListener('change', () => { if (round.running) interact(() => round.setRandom($('random').checked)); });
  $('poll').addEventListener('click', () => interact(() => { round.poll(); if (round.lastPoll?.high) sound('error'); }));
  $('force').addEventListener('click', () => interact(() => { round.emergency(); if (mode === 'interrupt') sound('error'); }));
  $('paperPlus').addEventListener('click', () => interact(() => { if (mode !== 'delay' && round.state !== 'ISR') round.papers++; }));
  $('paperMinus').addEventListener('click', () => interact(() => { round.papers = Math.max(0, round.papers - 1); }));
  $('answerForm').addEventListener('submit', event => {
    event.preventDefault();
    if (round.state !== 'FINISHED' || !$('answer').reportValidity()) return;
    const answer = Number($('answer').value);
    if (!Number.isSafeInteger(answer) || answer < 0) return;
    round.answer = answer;
    $('answerFeedback').textContent = 'Your answer: ' + answer + ' · Correct value: ' + round.sum + ' · ' + (answer === round.sum ? 'Correct ✓' : 'Difference: ' + (answer - round.sum));
    showSummary(); buildComparison();
  });
  $('next').addEventListener('click', () => { if (mode === 'interrupt') showComparison(); else { selectMode(modes[modes.indexOf(mode) + 1]); $('start').focus(); } });
  $('comparisonButton').addEventListener('click', showComparison);
  // A background tab cannot coordinate physical work fairly. Discard its unfinished round.
  function leave() { if (round.running) { reset(); $('notice').textContent = 'Round reset because the page was hidden. Keep this page visible during the activity.'; } else stopFrame(); }
  document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
  window.addEventListener('pagehide', leave);
  reset();
})();
