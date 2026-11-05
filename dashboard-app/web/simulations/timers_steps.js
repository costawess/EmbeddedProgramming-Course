(() => {
  if (new URLSearchParams(location.search).get('topic') !== 'timers') return;
  const overview = document.querySelector('.layout');
  const tabs = document.createElement('div');
  tabs.className = 'timer-view-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Timers views');
  tabs.innerHTML = '<button type="button" role="tab" id="timerOverviewTab" aria-selected="true" aria-controls="timerOverview">Overview</button><button type="button" role="tab" id="timerStepsTab" aria-selected="false" aria-controls="timerStepPanel">Step by step</button>';
  overview.id = 'timerOverview';
  overview.before(tabs);
  const root = document.createElement('section');
  root.id = 'timerStepPanel'; root.hidden = true;
  root.setAttribute('role', 'tabpanel'); root.setAttribute('aria-labelledby', 'timerStepsTab');
  overview.after(root);
  const shadow = root.attachShadow({mode:'open'});
  const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = 'timers_steps.css'; shadow.append(link);
  const content = document.createElement('div'); content.className = 'steps-app';
  content.innerHTML = `<div class="modes" role="tablist" aria-label="Timing strategies">
    <button type="button" role="tab" data-mode="delay" aria-selected="true">delay()</button>
    <button type="button" role="tab" data-mode="millis" aria-selected="false">millis()</button>
    <button type="button" role="tab" data-mode="hardware" aria-selected="false">ESP32 timer ISR</button></div>
    <div class="grid"><section class="panel"><div class="heading"><h2 id="modeTitle">delay()</h2><button type="button" id="copy">Copy code</button></div><p class="hint">Highlighted line = instruction just executed.</p><div id="code" class="code"></div></section>
    <section class="panel monitor"><h2 id="monitorTitle">Live clock &amp; variables</h2>
      <div class="clock-row"><div><strong id="clockValue">0 ms</strong><span id="clockCaption">millis() · simulated clock</span></div><div class="led-box"><div class="led" id="led" role="img" aria-label="LED off"></div><strong id="ledLabel">LED OFF</strong></div></div>
      <div id="alarmSignal" class="alarm-signal" role="status" hidden></div>
      <div class="clock-controls"><button type="button" id="clockToggle">Pause clock</button><label><span id="speedLabel">Clock speed</span> <select id="clockSpeed"><option value="0.1" selected>0.1×</option><option value="0.25">0.25×</option><option value="1">1×</option></select></label></div>
      <p class="hint" id="strategyNote"></p>
      <div class="progress-label"><span id="progressName">Waiting time</span><strong id="progressValue">Idle</strong></div><progress id="progress" max="400" value="0"></progress>
      <div class="flow"><strong id="context">setup()</strong><span id="resumePoint"></span></div>
      <table><thead><tr><th>Variable</th><th>Value</th></tr></thead><tbody>
      <tr><td>ledState</td><td id="stateValue">false</td></tr><tr><td>LED output</td><td id="output">LOW</td></tr>
      <tr data-millis><td>now (last read)</td><td id="nowValue">0 ms</td></tr><tr data-millis><td>previousBlinkMs</td><td id="previousValue">0 ms</td></tr><tr data-millis><td>now − previousBlinkMs</td><td id="elapsedValue">0 ms</td></tr>
      <tr data-hardware><td>Timer counter (1 MHz)</td><td id="counterValue">Not started</td></tr><tr data-hardware><td>Alarm events</td><td id="alarmCount">0</td></tr><tr data-hardware><td>Completed ISRs</td><td id="isrCount">0</td></tr>
      </tbody></table><div id="explanation" class="explanation" role="status"></div>
    </section></div>
    <div class="controls"><button type="button" id="previous">Previous line</button><button type="button" id="next">Next line</button><button type="button" id="play">Play code</button><button type="button" id="reset">Reset</button><label>Code speed <select id="codeSpeed"><option value="1200">Slow</option><option value="700" selected>Normal</option><option value="250">Fast</option></select></label></div>`;
  const clockControls=content.querySelector('.clock-controls');
  content.querySelector('.controls').append(...clockControls.children);
  clockControls.remove();
  shadow.append(content);
  const parentStyle = document.createElement('style');
  parentStyle.textContent = '.timer-view-tabs{display:flex;gap:12px;flex-wrap:wrap}.timer-view-tabs button{padding:12px 18px;border:2px solid var(--line);border-radius:14px;background:var(--panel);color:var(--text);font:inherit;cursor:pointer}.timer-view-tabs [aria-selected="true"]{border-color:var(--accent);background:var(--accent-soft)}#timerStepPanel[hidden],#timerOverview[hidden]{display:none!important}';
  document.head.append(parentStyle);
  const el = id => shadow.getElementById(id);
  const alarmIntervalMs = 2000;
  let visible = false, mode = 'delay', clockRunning = true, autoTimer = null, history = [], source = [], lineOf = {};
  const fresh = () => ({clock:0, key:'setup', active:null, led:false, output:false, now:0, previous:0, loops:0, wait:null, timerOrigin:null, alarmEnabled:false, nextAlarm:0, pending:false, alarms:0, lastAlarm:null, coalesced:0, isrCount:0, resume:null,lastToggle:null,interval:null,text:mode==='hardware'?'Press Next line or Play code. The hardware counter starts when timerBegin() executes.':mode==='delay'?'Press Next line or Play code. The countdown starts when delay(400) executes.':'Press Next line or Play code to start setup(). The clock runs independently.'});
  let state = fresh(), lastTick = performance.now();
  function buildSource() {
    source=[]; lineOf={};
    const add=(text,key)=>{if(key)lineOf[key]=source.length;source.push(text);};
    add('const int LED_PIN = 23;'); if(mode!=='hardware')add('const unsigned long INTERVAL = 400;'); add('bool ledState = false;');
    if(mode==='millis') {add('unsigned long previousBlinkMs = 0;'); add('unsigned long now = 0;');}
    if(mode==='hardware') {add('hw_timer_t *blinkTimer = nullptr;');add('');add('void IRAM_ATTR onTimer() {','isrEnter');add('  ledState = !ledState;','isrToggle');add('}','isrReturn');}
    add('');add('void setup() {','setup');add('  pinMode(LED_PIN, OUTPUT);','pinMode');add('  digitalWrite(LED_PIN, LOW);','initialOutput');
    if(mode==='hardware'){add('  blinkTimer = timerBegin(1000000);','timerBegin');add('  timerAttachInterrupt(blinkTimer, &onTimer);','timerAttach');add(`  timerAlarm(blinkTimer, ${alarmIntervalMs*1000}, true, 0);`,'timerAlarm');}
    add('}','setupReturn');add('');add('void loop() {','loop');
    if(mode==='millis'){add('  now = millis();','readNow');add('  if (now - previousBlinkMs >= INTERVAL) {','checkElapsed');add('    previousBlinkMs = now;','updatePrevious');}
    {
      const indent=mode==='millis'?'    ':'  ';
      if(mode!=='hardware')add(indent+'ledState = !ledState;','toggle');
      add(indent+'if (ledState) {','condition');add(indent+'  digitalWrite(LED_PIN, HIGH);','high');add(indent+'} else {','else');add(indent+'  digitalWrite(LED_PIN, LOW);','low');add(indent+'}','endIf');
      if(mode==='millis')add('  }','endElapsed');
      if(mode==='delay')add('  delay(INTERVAL);','blinkDelay');
    }
    add('}','loopReturn');
    el('code').replaceChildren();source.forEach((text,index)=>{const row=document.createElement('div');row.className='code-line';row.id=`line-${index}`;const number=document.createElement('span');number.className='number';number.textContent=index+1;row.append(number,renderArduinoCodeLine(text));el('code').append(row);});
    el('modeTitle').textContent={delay:'delay() — blocking',millis:'millis() — elapsed-time check',hardware:'ESP32 hardware timer ISR'}[mode];
    el('strategyNote').textContent={delay:'delay(400) holds the program on this line until the 400 ms countdown finishes.',millis:'millis() keeps counting while code is paused. now is a snapshot and changes only when its assignment executes.',hardware:''}[mode];
    el('strategyNote').hidden=mode==='hardware';
    shadow.querySelectorAll('[data-millis]').forEach(row=>row.hidden=mode!=='millis');
    shadow.querySelectorAll('[data-hardware]').forEach(row=>row.hidden=mode!=='hardware');
  }
  function render(follow=false) {
    const index=lineOf[state.active];
    shadow.querySelectorAll('.code-line').forEach((row,i)=>{row.classList.toggle('active',i===index);if(i===index)row.setAttribute('aria-current','step');else row.removeAttribute('aria-current');});
    if(follow && index!==undefined){const panel=el('code'),line=el(`line-${index}`);panel.scrollTop+=line.getBoundingClientRect().top-panel.getBoundingClientRect().top-panel.clientTop-(panel.clientHeight-line.getBoundingClientRect().height)/2;}
    el('stateValue').textContent=String(state.led);el('output').textContent=state.output?'HIGH':'LOW';
    el('led').classList.toggle('on',state.output);el('led').setAttribute('aria-label',state.output?'LED on':'LED off');el('ledLabel').textContent=state.output?'LED ON':'LED OFF';
    el('nowValue').textContent=`${state.now} ms`;el('previousValue').textContent=`${state.previous} ms`;el('elapsedValue').textContent=`${state.now-state.previous} ms`;
    const counter=state.timerOrigin===null?0:Math.max(0,state.clock-state.timerOrigin);
    const timerCounter=state.alarmEnabled?Math.max(0,state.clock-(state.alarms?state.nextAlarm-alarmIntervalMs:state.timerOrigin)):counter;
    const timerValue=`${Math.floor(timerCounter*1000)} µs`;
    const remaining=state.wait?Math.max(0,state.wait.until-state.clock):0;
    el('monitorTitle').textContent={hardware:'Hardware timer & variables',delay:'Delay countdown & variables',millis:'Live clock & variables'}[mode];
    el('clockValue').textContent=mode==='hardware'?timerValue:mode==='delay'?`${Math.ceil(remaining)} ms`:`${Math.floor(state.clock)} ms`;
    el('clockCaption').textContent=mode==='hardware'?(state.timerOrigin===null?'Waiting for timerBegin()':'Timer counter · 1 MHz (1 tick = 1 µs)'):mode==='delay'?(state.wait?(remaining>0?'delay(400) · time remaining':'delay(400) complete'):'Waiting for delay(400)'):'millis() · simulated clock';
    el('speedLabel').textContent={hardware:'Timer speed',delay:'Countdown speed',millis:'Clock speed'}[mode];
    el('counterValue').textContent=state.timerOrigin===null?'Not started':timerValue;
    el('alarmSignal').hidden=mode!=='hardware';
    el('alarmSignal').classList.toggle('fired',state.lastAlarm!==null&&state.clock-state.lastAlarm<100);
    el('alarmSignal').textContent=state.timerOrigin===null?'Timer not started':!state.alarmEnabled?'Timer counting · waiting for timerAlarm()':state.pending?`Alarm #${state.alarms} triggered · onTimer() pending`:state.key.startsWith('isr')?`Alarm #${state.alarms} · executing onTimer()`:`Alarm armed · triggers at ${alarmIntervalMs*1000} µs · ${state.alarms} events`;
    el('alarmCount').textContent=state.alarms;el('isrCount').textContent=state.isrCount;
    const isIsr=state.key.startsWith('isr');
    el('context').textContent=isIsr?'ISR: onTimer()':state.key==='setup'||['pinMode','initialOutput','timerBegin','timerAttach','timerAlarm','setupReturn'].includes(state.key)?'setup()':'loop()';
    el('resumePoint').textContent=state.resume?`Return to line ${lineOf[state.resume.key]+1}`:'';
    el('explanation').textContent=state.text;
    let progress=0, max=400, name='Waiting time', value='Idle';
    if(mode==='hardware'){name='Hardware timer';max=alarmIntervalMs*1000;progress=timerCounter*1000;value=state.timerOrigin===null?'Not started':state.alarmEnabled?`${Math.floor(progress)} / ${max} µs`:'Counting · alarm not armed';}
    else if(state.wait){max=state.wait.duration;progress=max-remaining;value=`${Math.ceil(remaining)} ms remaining`;}
    else if(mode==='millis'){name='Time since previousBlinkMs';progress=Math.max(0,state.clock-state.previous);value=`${Math.floor(progress)} / 400 ms`;}
    el('progressName').textContent=name;el('progressValue').textContent=value;el('progress').max=max;el('progress').value=Math.min(progress,max);
    el('previous').disabled=!history.length;el('clockToggle').textContent=mode==='hardware'?(clockRunning?'Pause timer':'Resume timer'):mode==='delay'?(clockRunning?'Pause countdown':'Resume countdown'):(clockRunning?'Pause clock':'Resume clock');
    el('next').disabled=remaining>0&&!state.pending&&!isIsr;
  }
  function save(){history.push(JSON.parse(JSON.stringify(state)));if(history.length>500)history.shift();}
  function output(value){if(state.output===value)return;state.output=value;if(state.lastToggle!==null)state.interval=state.clock-state.lastToggle;state.lastToggle=state.clock;}
  function wait(duration,next){state.wait={until:state.clock+duration,duration,next};state.key=next;}
  function step() {
    const inIsr=state.key.startsWith('isr');
    if(state.wait&&state.clock<state.wait.until&&!state.pending&&!inIsr)return;
    save();
    if(state.pending&&!inIsr){state.resume={key:state.key,wait:state.wait};state.wait=null;state.pending=false;state.key='isrEnter';}
    if(state.wait){state.key=state.wait.next;state.wait=null;}
    const key=state.key;state.active=key;
    switch(key){
      case 'setup':state.text='Enter setup(); run initialization once.';state.key='pinMode';break;
      case 'pinMode':state.text='Configure GPIO 23 as an output.';state.key='initialOutput';break;
      case 'initialOutput':state.output=false;state.text='Initialize the LED to LOW.';state.key=mode==='hardware'?'timerBegin':'setupReturn';break;
      case 'timerBegin':state.timerOrigin=state.clock;state.text='timerBegin(1000000) starts a counter at 1 MHz: one tick per microsecond.';state.key='timerAttach';break;
      case 'timerAttach':state.text='Attach onTimer() to the hardware timer.';state.key='timerAlarm';break;
      case 'timerAlarm':state.alarmEnabled=true;state.nextAlarm=Math.max(state.clock,state.timerOrigin+alarmIntervalMs);state.text=`Arm an auto-reloading alarm at ${alarmIntervalMs*1000} ticks (${(alarmIntervalMs/1000).toFixed(1)} s). The timer runs independently and reloads after each trigger.`;state.key='setupReturn';break;
      case 'setupReturn':state.text='setup() is finished. Start the repeated loop().';state.key='loop';break;
      case 'loop':state.text=mode==='hardware'?'Enter loop(). Read ledState in if/else and apply the output.':'Enter loop().';state.key=mode==='hardware'?'condition':mode==='millis'?'readNow':'toggle';break;
      case 'readNow':state.now=Math.floor(state.clock);state.text=`Read millis(): now = ${state.now} ms. This saved value stays unchanged as the clock advances.`;state.key='checkElapsed';break;
      case 'checkElapsed':{const elapsed=state.now-state.previous, passed=elapsed>=400;state.text=`${state.now} − ${state.previous} = ${elapsed} ms; >= 400 is ${passed}. ${passed?'Enter the blinking block.':'Skip the blinking block.'}`;state.key=passed?'updatePrevious':'loopReturn';break;}
      case 'updatePrevious':state.previous=state.now;state.text=`previousBlinkMs = now (${state.now} ms).`;state.key='toggle';break;
      case 'toggle':case 'isrToggle':state.led=!state.led;state.text=`ledState flips to ${state.led}; the output is still ${state.output?'HIGH':'LOW'} until loop() executes digitalWrite().`;state.key=key==='toggle'?'condition':'isrReturn';break;
      case 'condition':state.text=`if (ledState) is ${state.led}. Select the ${state.led?'HIGH':'LOW'} branch.`;state.key=state.led?'high':'else';break;
      case 'high':output(true);state.text='digitalWrite(LED_PIN, HIGH): LED ON. Skip else.';state.key='endIf';break;
      case 'else':state.text='Enter else because ledState is false.';state.key='low';break;
      case 'low':output(false);state.text='digitalWrite(LED_PIN, LOW): LED OFF.';state.key='endIf';break;
      case 'endIf':state.text='The output branch is complete.';state.key=mode==='millis'?'endElapsed':mode==='delay'?'blinkDelay':'loopReturn';break;
      case 'endElapsed':state.text='Finish the elapsed-time condition.';state.key='loopReturn';break;
      case 'blinkDelay':state.text='delay(400): execution waits here until the 400 ms countdown finishes.';wait(400,'loopReturn');break;
      case 'loopReturn':state.loops++;state.text=`Loop ${state.loops} finished. Start another loop.`;state.key='loop';break;
      case 'isrEnter':state.text='Hardware alarm: pause the main program and enter onTimer().';state.key='isrToggle';break;
      case 'isrReturn':state.isrCount++;state.text=`Return from onTimer() to line ${lineOf[state.resume.key]+1}. The hardware counter kept running.`;state.key=state.resume.key;state.wait=state.resume.wait;state.resume=null;break;
    }
    render(true);
  }
  function advanceClock(delta){
    state.clock+=delta;
    if(state.alarmEnabled&&state.clock>=state.nextAlarm){const count=Math.floor((state.clock-state.nextAlarm)/alarmIntervalMs)+1;state.lastAlarm=state.nextAlarm+(count-1)*alarmIntervalMs;state.alarms+=count;state.coalesced+=count-(state.pending?0:1);state.pending=true;state.nextAlarm+=count*alarmIntervalMs;}
  }
  function pauseCode(){clearInterval(autoTimer);autoTimer=null;el('play').textContent='Play code';}
  function playCode(){pauseCode();autoTimer=setInterval(()=>{if(visible)step();},Number(el('codeSpeed').value));el('play').textContent='Pause code';}
  function reset(){pauseCode();state=fresh();history=[];clockRunning=true;lastTick=performance.now();buildSource();render();}
  el('next').onclick=()=>{pauseCode();step();};
  el('previous').onclick=()=>{pauseCode();clockRunning=false;if(history.length)state=history.pop();lastTick=performance.now();state.text+=mode==='hardware'?' Timer paused for rewind; use Resume timer.':mode==='delay'?' Countdown paused for rewind; use Resume countdown.':' Clock paused for rewind; use Resume clock to continue time.';render(true);};
  el('play').onclick=()=>autoTimer===null?playCode():pauseCode();el('reset').onclick=reset;
  el('clockToggle').onclick=()=>{clockRunning=!clockRunning;lastTick=performance.now();render();};
  el('codeSpeed').onchange=()=>{if(autoTimer!==null)playCode();};el('clockSpeed').onchange=()=>{lastTick=performance.now();};
  shadow.querySelectorAll('[data-mode]').forEach(button=>button.onclick=()=>{mode=button.dataset.mode;shadow.querySelectorAll('[data-mode]').forEach(tab=>tab.setAttribute('aria-selected',String(tab===button)));el('clockSpeed').value=mode==='hardware'?'0.25':'0.1';el('codeSpeed').value='700';reset();});
  el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(source.join('\n'));el('copy').textContent='Copied!';}catch(e){const selection=window.getSelection(),range=document.createRange();range.selectNodeContents(el('code'));selection.removeAllRanges();selection.addRange(range);el('copy').textContent='Press Ctrl+C';}};
  function selectView(steps){visible=steps;overview.hidden=steps;root.hidden=!steps;document.getElementById('timerStepsTab').setAttribute('aria-selected',String(steps));document.getElementById('timerOverviewTab').setAttribute('aria-selected',String(!steps));lastTick=performance.now();if(!steps)pauseCode();}
  document.getElementById('timerStepsTab').onclick=()=>selectView(true);document.getElementById('timerOverviewTab').onclick=()=>selectView(false);
  tabs.onkeydown=event=>{if(event.key==='ArrowLeft'||event.key==='ArrowRight'){selectView(!visible);document.getElementById(visible?'timerStepsTab':'timerOverviewTab').focus();event.preventDefault();}};
  const controls=el('next').parentElement;
  new ResizeObserver(()=>root.style.setProperty('--controls-height',`${controls.getBoundingClientRect().height}px`)).observe(controls);
  const syncTheme=()=>root.classList.toggle('dark',document.documentElement.classList.contains('theme-dark'));
  new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['class']});syncTheme();
  setInterval(()=>{const now=performance.now(),delta=now-lastTick;lastTick=now;if(visible&&clockRunning&&!document.hidden)advanceClock(delta*Number(el('clockSpeed').value));if(visible)render();},40);
  document.addEventListener('visibilitychange',()=>{lastTick=performance.now();});
  reset();
})();
