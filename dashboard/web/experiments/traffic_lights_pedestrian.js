(() => {
  const style = document.createElement('style');
  style.textContent = `.traffic-tabs{display:flex;gap:12px;flex-wrap:wrap}.traffic-tabs [aria-selected=true]{background:var(--accent);color:var(--bg)}.ped-signals{display:grid;grid-template-columns:1fr 1fr;gap:20px}.ped-signal{text-align:center}.ped-housing{background:var(--housing-edge);border-radius:24px;padding:16px;width:112px;margin:16px auto;display:grid;gap:12px}.ped-lamp{width:80px;height:80px;border-radius:50%;background:var(--off);border:3px solid var(--line)}.ped-lamp.on{background:var(--signal-color);box-shadow:0 0 24px var(--signal-color)}.ped-alert{padding:16px;border:2px solid var(--line);border-radius:16px;margin:16px 0}.ped-alert.danger{border-color:var(--danger);color:var(--danger);font-weight:800}.ped-time{font:700 28px Consolas,monospace}.ped-history{max-height:280px;overflow:auto}.ped-history li{margin:10px 0}.ped-panel pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--log-bg);padding:16px;border-radius:16px}.ped-panel[hidden],.layout>[hidden]{display:none!important}.ped-panel{grid-column:span 2}@media(max-width:1180px){.ped-panel{grid-column:auto}}`;
  document.head.append(style);
  const columnStyle = document.createElement('style');
  columnStyle.textContent = `.ped-panel{grid-column:auto}.ped-measurements{min-width:0;overflow-wrap:anywhere}.ped-measurements .timer-card{width:100%;max-width:none}.ped-measurements #pedClear{width:100%}.ped-measurements .ped-history{padding-left:22px}.layout.pedestrian-layout{grid-template-columns:minmax(300px,1fr) minmax(320px,1.1fr) minmax(300px,0.95fr);align-items:start}@media(max-width:1180px){.layout.pedestrian-layout{grid-template-columns:1fr}}`;
  document.head.append(columnStyle);
  const layout = document.querySelector('.layout');
  const originalPanels = [...layout.querySelectorAll(':scope > .panel')];
  const tabs = document.createElement('div');
  tabs.className = 'traffic-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Traffic light experiments');
  tabs.innerHTML = '<button type="button" role="tab" id="singleTab" aria-selected="true" aria-controls="singleTrafficPanel">Single traffic light</button><button type="button" role="tab" id="pedestrianTab" aria-selected="false" aria-controls="pedestrianPanel">Cars &amp; pedestrians</button>';
  originalPanels[0].id = 'singleTrafficPanel';
  layout.before(tabs);
  const panel = document.createElement('section');
  panel.className = 'panel ped-panel';
  panel.id = 'pedestrianPanel';
  panel.hidden = true;
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', 'pedestrianTab');
  panel.innerHTML = `<h2>Cars &amp; pedestrians</h2>
    <div class="ped-alert" id="pedSafety" role="alert" hidden></div>
    <div class="ped-signal" id="pedSimulation"><button type="button" id="pedDemo">Pedestrian button</button><p class="muted">Simulate a pedestrian crossing request.</p></div>
    <div class="ped-signals">${['Car','Pedestrian'].map((name,i)=>`<div class="ped-signal"><h3>${name}</h3><div class="ped-housing">${(i?['RED','GREEN']:['RED','YELLOW','GREEN']).map(color=>`<div class="ped-lamp" id="ped${name}${color}" style="--signal-color:var(--${color.toLowerCase()})" role="img" aria-label="${name} ${color.toLowerCase()} off"></div>`).join('')}</div><strong id="ped${name}Label">Waiting</strong></div>`).join('')}</div>
    <div id="pedMeasurementsContent"><div class="timer-card"><span>Time in current state</span><strong class="ped-time" id="pedBrowserTime">0.000 s</strong><span id="pedFreshness">No telemetry received.</span></div>
    <p id="pedButtonState">Pedestrian button: waiting</p><p id="pedSequence" role="status">Sequence: waiting for transitions.</p>
    <p id="pedViolations">Simultaneous green incidents: 0</p>
    <button type="button" id="pedClear">Clear measurements</button><ol class="ped-history" id="pedIntervals"></ol>
    </div>
    <pre id="pedPrintExample">Serial.printf("Car:%c Pedestrian:%c Button:%d\\n", CarColor, PedColor, isButtonPressed);</pre>
    <button type="button" id="pedCopyPrint">Copy code</button>
    <p class="muted">CarColor: 'r', 'y', or 'g'. PedColor: 'r' or 'g'. isButtonPressed: 0 or 1.</p>
    <p class="muted">Example received by the dashboard (one complete line):</p>
    <pre>Car:g Pedestrian:r Button:0</pre>
    <p class="muted">r = red, y = yellow, g = green.</p>
    `;
  layout.prepend(panel);
  const measurements = document.createElement('section');
  measurements.className = 'panel ped-measurements';
  measurements.hidden = true;
  measurements.setAttribute('aria-label', 'Pedestrian crossing measurements');
  measurements.append(document.getElementById('pedMeasurementsContent'));
  panel.after(measurements);
  let activeTab = false, snapshot = null, started = 0, received = 0, incidents = 0, unsafe = false;
  let demoTimers = [], demoRunning = false;
  const el = id => document.getElementById(id);
  el('pedCopyPrint').onclick = async () => {
    const code = el('pedPrintExample').textContent;
    try {
      await navigator.clipboard.writeText(code);
      el('pedCopyPrint').textContent = 'Copied!';
    } catch (error) {
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el('pedPrintExample'));
      selection.removeAllRanges();
      selection.addRange(range);
      el('pedCopyPrint').textContent = 'Press Ctrl+C to copy';
    }
  };
  function stopDemo() { demoTimers.forEach(clearTimeout); demoTimers = []; demoRunning = false; }
  function selectTab(ped) {
    activeTab = ped;
    panel.hidden = !ped;
    measurements.hidden = !ped;
    layout.classList.toggle('pedestrian-layout', ped);
    originalPanels.forEach(p => p.hidden = ped);
    el('singleTab').setAttribute('aria-selected', String(!ped));
    el('pedestrianTab').setAttribute('aria-selected', String(ped));
    uartTestInput.placeholder = ped ? 'Car:g Pedestrian:r Button:0' : 'Type r, y, or g and press Enter';
    serialHint.textContent = ped ? 'Accepted UART: Car:g Pedestrian:r Button:0' : 'Accepted UART lines: r (red), y (yellow), g (green).';
  }
  el('singleTab').onclick = () => selectTab(false);
  el('pedestrianTab').onclick = () => selectTab(true);
  tabs.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { selectTab(!activeTab); el(activeTab ? 'pedestrianTab' : 'singleTab').focus(); event.preventDefault(); }
  });
  function accept(data) {
    if (!data || !['RED','YELLOW','GREEN'].includes(data.car) || !['RED','GREEN'].includes(data.pedestrian) || typeof data.button !== 'boolean') throw new Error('Use Car:r/y/g Pedestrian:r/g Button:0/1.');
    const now = performance.now();
    const changed = snapshot && (snapshot.car !== data.car || snapshot.pedestrian !== data.pedestrian);
    if (changed) {
      const expected = {'GREEN/RED':'YELLOW/RED','YELLOW/RED':'RED/GREEN','RED/GREEN':'RED/RED','RED/RED':'GREEN/RED'};
      const before = `${snapshot.car}/${snapshot.pedestrian}`;
      const after = `${data.car}/${data.pedestrian}`;
      el('pedSequence').textContent = expected[before] === after ? `Sequence OK: ${before} → ${after}` : `CHECK SEQUENCE: ${before} → ${after}; expected ${expected[before] || 'a valid assignment state'}.`;
      const duration = now - started;
      const target = snapshot.car === 'YELLOW' ? 500 : snapshot.pedestrian === 'GREEN' ? 4000 : null;
      const item = document.createElement('li');
      item.textContent = `${snapshot.car} / ${snapshot.pedestrian}: ${duration.toFixed(0)} ms${target === null ? '' : `; target ${target} ms — ${Math.abs(duration-target)<=100 ? 'within tolerance' : 'CHECK TIMING'}`}`;
      el('pedIntervals').prepend(item);
      while (el('pedIntervals').children.length > 100) el('pedIntervals').lastChild.remove();
    }
    if (!snapshot || changed) started = now;
    snapshot = data; received = now;
    const bothGreen = data.car === 'GREEN' && data.pedestrian === 'GREEN';
    if (bothGreen && !unsafe) incidents++;
    unsafe = bothGreen;
    el('pedSafety').hidden = !unsafe && !(data.pedestrian === 'GREEN' && data.car !== 'RED');
    el('pedSafety').classList.toggle('danger', unsafe);
    el('pedSafety').textContent = unsafe ? 'DANGER: cars and pedestrians are GREEN at the same time!' : data.pedestrian === 'GREEN' && data.car !== 'RED' ? 'CHECK: pedestrians GREEN requires cars RED.' : 'Current snapshot: no simultaneous green.';
    el('pedViolations').textContent = `Simultaneous green incidents: ${incidents}`;
    ['Car','Pedestrian'].forEach(name => {
      const color = data[name.toLowerCase()];
      el(`ped${name}Label`).textContent = color;
      ['RED','YELLOW','GREEN'].forEach(c => { const lamp = el(`ped${name}${c}`); if(lamp) { lamp.classList.toggle('on', c===color); lamp.setAttribute('aria-label', `${name} ${c.toLowerCase()} ${c===color?'on':'off'}`); } });
    });
    el('pedButtonState').textContent = `Pedestrian button: ${data.button ? 'pressed' : 'released'}`;
  }
  const originalHandler = handleSerialLine;
  handleSerialLine = line => {
    if (!activeTab && !/\b(?:Car|Pedestrian|Button)\s*:/i.test(line)) { originalHandler(line); return; }
    try {
      const fields = {};
      const tokens = line.trim().split(/\s+/);
      for (const token of tokens) {
        const match = /^(Car|Pedestrian|Button):([^:\s]+)$/i.exec(token);
        if (!match || Object.hasOwn(fields, match[1].toLowerCase())) throw new Error('Use Car:g Pedestrian:r Button:0.');
        fields[match[1].toLowerCase()] = match[2].toUpperCase();
      }
      if (tokens.length !== 3 || !['0','1'].includes(fields.button)) throw new Error('Send Car, Pedestrian and Button:0/1 together on one line.');
      const colors = {R:'RED', Y:'YELLOW', G:'GREEN'};
      const data = {car: colors[fields.car], pedestrian: colors[fields.pedestrian], button: fields.button === '1'};
      accept(data); stopDemo();
    }
    catch(error) { el('pedSafety').hidden = false; el('pedSafety').textContent = `Invalid UART snapshot: ${error.message}`; el('pedSafety').classList.add('danger'); }
  };
  // The bridge captured the original function before this extension loaded.
  serialBridge.onLine = handleSerialLine;
  const originalStatusHandler = serialBridge.onStatus;
  function updateSimulationVisibility() {
    el('pedSimulation').hidden = state.serialConnected;
    if (state.serialConnected) stopDemo();
  }
  serialBridge.onStatus = status => {
    originalStatusHandler(status);
    selectTab(activeTab);
    updateSimulationVisibility();
  };
  updateSimulationVisibility();
  el('pedClear').onclick = () => { el('pedIntervals').replaceChildren(); incidents = unsafe ? 1 : 0; el('pedViolations').textContent = `Simultaneous green incidents: ${incidents}`; };
  el('pedDemo').onclick = () => {
    if (state.serialConnected) return;
    stopDemo(); demoRunning = true;
    const send = (car,pedestrian,button=false) => accept({car,pedestrian,button});
    send('GREEN','RED');
    [[800,'YELLOW','RED',true],[1300,'RED','GREEN',false],[5300,'RED','RED',false],[5500,'GREEN','RED',false]].forEach(([ms,c,p,b]) => demoTimers.push(setTimeout(()=>send(c,p,b),ms)));
    demoTimers.push(setTimeout(()=>{demoRunning=false;},5501));
  };
  function tickPedestrian() {
    if(snapshot) {
      el('pedBrowserTime').textContent = `${((performance.now()-started)/1000).toFixed(3)} s`;
      const age = performance.now()-received;
      el('pedFreshness').textContent = demoRunning ? 'Example cycle — simulated data' : age > 1000 ? `Telemetry stale (${(age/1000).toFixed(1)} s since last snapshot). Display shows last reported lamps.` : 'Telemetry received recently.';
    }
    requestAnimationFrame(tickPedestrian);
  }
  requestAnimationFrame(tickPedestrian);
})();
