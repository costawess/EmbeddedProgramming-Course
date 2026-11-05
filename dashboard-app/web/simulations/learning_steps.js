(() => {
  const topic = location.pathname.endsWith('hysteresis_lab.html') ? 'hysteresis' : new URLSearchParams(location.search).get('topic');
  if (!['functions', 'variables', 'hysteresis', 'i2c'].includes(topic)) return;
  const overview = document.querySelector('.layout');
  const root = document.createElement('section'); root.id = 'learningSteps'; overview.after(root);
  const shadow = root.attachShadow({mode: 'open'});
  for (const href of ['interrupts.css', '../shared/arduino_code.css', 'learning_steps.css']) {
    const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = href; shadow.append(link);
  }
  const app = document.createElement('div'); app.className = 'steps-app'; shadow.append(app);
  app.innerHTML = `<div class="grid"><section class="panel"><div class="heading"><h2 id="title"></h2><button id="copy">Copy code</button></div><div id="code" class="code"></div></section><section class="panel monitor"><h2>Hardware & variables</h2><div id="hardware"></div><table><thead><tr><th>Variable / field</th><th>Value</th></tr></thead><tbody id="values"></tbody></table><div id="explanation" class="explanation" role="status"></div></section></div><div class="controls"><button id="previous">Previous line</button><button id="next">Next line</button><button id="play">Play</button><button id="reset">Reset</button><label>Speed <select id="speed"><option value="1200">Slow</option><option value="700" selected>Normal</option></select></label><div id="inputs" class="step-inputs"></div></div>`;
  const el = id => shadow.getElementById(id);
  let visible = topic === 'functions', auto = null, state, history = [], graph = {}, lines = [], active = -1;
  const config = {example: 'latch', a: false, b: false, sensor: 510, times: 3, delay: 500, sample: 54, low: 48, high: 62};
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
  const input = (label, id, type, value, attrs = '') => `<label>${label} <input id="${id}" type="${type}" value="${value}" ${attrs}></label>`;
  const row = (name, value) => `<tr><td>${escape(name)}</td><td>${escape(value)}</td></tr>`;
  function pause() { clearInterval(auto); auto = null; el('play').textContent = 'Play'; }
  function play() { pause(); auto = setInterval(step, Number(el('speed').value)); el('play').textContent = 'Pause'; }
  function add(key, text, next, action = () => '') { const line = lines.length; lines.push(text); graph[key] = {line, next, action}; }
  function text(value) { lines.push(value); }
  function jump(key) { return () => key; }
  function build() {
    graph = {}; lines = []; active = -1;
    state = {key:'setup', led:false, ledState:false, count:0, lastButtonState:false, b1:false, b2:false, buttonPressed:false, sensorValue:0, pwmValue:0, sample:0, i:0, times:0, delayMs:0, elapsed:0, context:'setup()', message:'Press Next line to execute setup().'};
    if (topic === 'functions') {
      text('const int LED_PIN = 23;'); text('');
      add('function', 'void blinkLed(int times, int delayMs) {', 'init', () => { state.context='blinkLed()'; return 'Enter the function with the argument values copied into its parameters.'; });
      add('init', '  for (int i = 0; i < times; i++) {', () => state.i < state.times ? 'on' : 'functionReturn', () => {state.i=0;return `i = 0; 0 < ${state.times}: ${state.i < state.times}.`;});
      add('on', '    digitalWrite(LED_PIN, HIGH);', 'waitOn', () => {state.led=true;return 'Set the LED output HIGH.';});
      add('waitOn', '    delay(delayMs);', 'off', () => {state.elapsed+=state.delayMs;return `Wait ${state.delayMs} simulated ms; other instructions in this function are blocked.`;});
      add('off', '    digitalWrite(LED_PIN, LOW);', 'waitOff', () => {state.led=false;return 'Set the LED output LOW.';});
      add('waitOff', '    delay(delayMs);', 'increment', () => {state.elapsed+=state.delayMs;return `Wait another ${state.delayMs} simulated ms.`;});
      add('increment', '  }', () => state.i < state.times ? 'on' : 'functionReturn', () => {state.i++;return `for update: i = ${state.i}; i < times is ${state.i < state.times}.`;});
      add('functionReturn', '}', 'loopReturn', () => {state.context='loop()';return 'Return to the caller, immediately after blinkLed().';});text('');
      add('setup', 'void setup() {', 'pin', () => 'setup() runs once.');
      add('pin', '  pinMode(LED_PIN, OUTPUT);', 'setupEnd', () => 'Configure GPIO 23 as OUTPUT.');
      add('setupEnd', '}', 'loop');text('');
      add('loop', 'void loop() {', 'call', () => {state.context='loop()';return 'Start a new loop iteration.';});
      add('call', `  blinkLed(${config.times}, ${config.delay});`, 'function', () => {state.times=config.times;state.delayMs=config.delay;return `Call blinkLed: times = ${state.times}, delayMs = ${state.delayMs}.`;});
      add('loopReturn', '}', 'loop', () => 'The next loop will call the function again.');
    } else {
      text('const int LED_PIN = 23;');
      if (topic === 'variables' && config.example !== 'sensor_pwm') {
        text('const int BUTTON_A = 34;');text('const int BUTTON_B = 35;');
        if(config.example==='latch')text('bool ledState = false;');
        else {text('int count = 0;');text('bool lastButtonState = false;');}
      } else {text('const int SENSOR_PIN = 34;');if(topic==='hysteresis'){text('bool ledState = false;');text(`const int LOWER = ${config.low};`);text(`const int UPPER = ${config.high};`);}}
      text('');add('setup','void setup() {','output',()=> 'Initialize the pins once.');add('output','  pinMode(LED_PIN, OUTPUT);','input',()=> 'LED pin is an output.');
      add('input',`  pinMode(${topic==='variables'&&config.example!=='sensor_pwm'?'BUTTON_A':'SENSOR_PIN'}, INPUT);`,topic==='variables'&&config.example==='latch'?'inputB':'setupEnd',()=> 'Configure the input. Buttons use external pull-down resistors.');
      if(topic==='variables'&&config.example==='latch')add('inputB','  pinMode(BUTTON_B, INPUT);','setupEnd',()=> 'Configure the second input.');
      add('setupEnd','}','loop');text('');add('loop','void loop() {','read',()=> {state.context='loop()';return 'Begin the next loop; stored variables keep their values.';});
      if(topic==='hysteresis'){
        add('read','  int sample = map(analogRead(SENSOR_PIN), 0, 4095, 0, 100);','upper',()=> {state.sample=config.sample;return `Read the signal: ${state.sample}%.`;});
        add('upper','  if (sample >= UPPER) {',()=> state.sample>=config.high?'setOn':'lower',()=> `${state.sample} >= ${config.high}: ${state.sample>=config.high}.`);
        add('setOn','    ledState = true;','write',()=> {state.ledState=true;return 'Above the upper threshold: turn on.';});text('  }');
        add('lower','  else if (sample <= LOWER) {',()=> state.sample<=config.low?'setOff':'write',()=> `${state.sample} <= ${config.low}: ${state.sample<=config.low}. Between thresholds the previous state is retained.`);
        add('setOff','    ledState = false;','write',()=> {state.ledState=false;return 'Below the lower threshold: turn off.';});text('  }');
        add('write','  digitalWrite(LED_PIN, ledState);','end',()=> {state.led=state.ledState;return 'Apply the stored state to the LED.';});
      } else if(config.example==='latch'){
        add('read','  bool b1 = digitalRead(BUTTON_A);','readB',()=> {state.b1=config.a;return `Store input A: ${state.b1}.`;});
        add('readB','  bool b2 = digitalRead(BUTTON_B);','checkA',()=> {state.b2=config.b;return `Store input B: ${state.b2}.`;});
        add('checkA','  if (b1) {',()=> state.b1?'setOn':'checkB',()=> `b1 is ${state.b1}.`);
        add('setOn','    ledState = true;','checkB',()=> {state.ledState=true;return 'Latch the stored state ON.';});text('  }');
        add('checkB','  if (b2) {',()=> state.b2?'setOff':'write',()=> `b2 is ${state.b2}.`);
        add('setOff','    ledState = false;','write',()=> {state.ledState=false;return 'Reset the stored state OFF; B wins if both inputs are pressed.';});text('  }');
        add('write','  digitalWrite(LED_PIN, ledState);','end',()=> {state.led=state.ledState;return 'Write the stored variable to the output.';});
      } else if(config.example==='counter'){
        add('read','  bool buttonPressed = digitalRead(BUTTON_A);','edge',()=> {state.buttonPressed=config.a;return `Read current input: ${state.buttonPressed}.`;});
        add('edge','  if (buttonPressed && !lastButtonState) {',()=> state.buttonPressed&&!state.lastButtonState?'count':'remember',()=> `Rising edge: ${state.buttonPressed&&!state.lastButtonState}. Holding the button does not count again.`);
        add('count','    count++;','remember',()=> {state.count++;return `Increment count to ${state.count}.`;});text('  }');
        add('remember','  lastButtonState = buttonPressed;','end',()=> {state.lastButtonState=state.buttonPressed;return 'Remember the sampled level for the next loop.';});
      } else {
        add('read','  int sensorValue = analogRead(SENSOR_PIN);','map',()=> {state.sensorValue=config.sensor;return `Capture ${state.sensorValue}; changing the slider afterward does not change this stored sample.`;});
        add('map','  int pwmValue = map(sensorValue, 0, 4095, 0, 255);','write',()=> {state.pwmValue=Math.floor(state.sensorValue*255/4095);return `Integer mapping produces ${state.pwmValue}.`;});
        add('write','  analogWrite(LED_PIN, pwmValue);','end',()=> {state.led=state.pwmValue>0;return `Set PWM duty cycle to ${state.pwmValue}/255.`;});
      }
      add('end','}','loop',()=> 'Return to the next loop iteration.');
    }
    el('code').replaceChildren();lines.forEach((line,index)=>{const div=document.createElement('div');div.className='code-line';div.id=`line-${index}`;const number=document.createElement('span');number.className='number';number.textContent=index+1;div.append(number,renderArduinoCodeLine(line));el('code').append(div);});
    history=[]; render();
  }
  function render(follow=false){
    if(topic==='i2c'){renderBus();return;}
    shadow.querySelectorAll('.code-line').forEach((line,i)=>line.classList.toggle('active',i===active));
    if(follow&&active>=0){const panel=el('code'),line=el(`line-${active}`);panel.scrollTop+=line.getBoundingClientRect().top-panel.getBoundingClientRect().top-panel.clientTop-(panel.clientHeight-line.getBoundingClientRect().height)/2;}
    const names=topic==='functions'?['times','delayMs','i','elapsed']:topic==='hysteresis'?['sample','ledState']:config.example==='latch'?['b1','b2','ledState']:config.example==='counter'?['buttonPressed','lastButtonState','count']:['sensorValue','pwmValue'];
    el('values').innerHTML=names.map(name=>row(name,state[name])).join('')+row('LED output',state.led?'HIGH':'LOW')+row('Executing',state.context);
    el('hardware').innerHTML=`<div class="led-box"><div class="led ${state.led?'on':''}" style="${config.example==='sensor_pwm'&&topic==='variables'?`opacity:${0.25+state.pwmValue/340}`:''}"></div><strong>LED ${state.led?'ON':'OFF'}</strong></div>`;
    el('explanation').textContent=state.message;el('previous').disabled=!history.length;
  }
  function step(){if(!visible)return;if(topic==='i2c'){busStep();return;}history.push({state:structuredClone(state),active});if(history.length>500)history.shift();const node=graph[state.key];active=node.line;state.message=node.action()||'Continue execution.';state.key=typeof node.next==='function'?node.next():node.next;render(true);}
  el('next').onclick=()=>{pause();step();};el('play').onclick=()=>auto===null?play():pause();el('speed').onchange=()=>{if(auto!==null)play();};
  el('previous').onclick=()=>{pause();if(history.length){const saved=history.pop();state=saved.state;active=saved.active;if(topic==='i2c')devices=saved.devices;}render();};
  el('reset').onclick=()=>{pause();topic==='i2c'?resetBus():build();};
  el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(lines.join('\n'));el('copy').textContent='Copied!';}catch{const range=document.createRange();range.selectNodeContents(el('code'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);el('copy').textContent='Press Ctrl+C';}};
  if(topic==='functions'){
    overview.hidden=true;el('title').textContent='Functions — Step by step';
    el('inputs').innerHTML=input('times','times','number',3,'min="1" max="10"')+input('delayMs','delay','number',500,'min="0" max="5000"');
    for(const id of ['times','delay'])el(id).onchange=()=>{config[id]=Math.max(id==='times'?1:0,Math.min(id==='times'?10:5000,Number(el(id).value)||0));pause();build();};
    build();
  } else {
    root.hidden=true;root.setAttribute('role','tabpanel');
    overview.id='learningOverview';root.setAttribute('aria-labelledby','learningStepsTab');
    const tabs=document.createElement('div');tabs.className='learning-tabs';tabs.setAttribute('role','tablist');tabs.innerHTML='<button role="tab" aria-selected="true" aria-controls="learningOverview" id="learningOverviewTab">Overview</button><button role="tab" aria-selected="false" aria-controls="learningSteps" id="learningStepsTab">Step by step</button>';overview.before(tabs);
    const select=steps=>{visible=steps;overview.hidden=steps;root.hidden=!steps;tabs.children[0].setAttribute('aria-selected',String(!steps));tabs.children[1].setAttribute('aria-selected',String(steps));if(!steps)pause();};
    tabs.children[0].onclick=()=>select(false);tabs.children[1].onclick=()=>select(true);tabs.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){select(!visible);tabs.children[visible?1:0].focus();e.preventDefault();}};
    el('title').textContent=topic==='i2c'?'I²C — Bus step by step':`${topic==='variables'?'Variables':'Hysteresis'} — Step by step`;
    if(topic==='variables'){
      el('inputs').innerHTML='<label>Example <select id="example"><option value="latch">Latch</option><option value="counter">Button counter</option><option value="sensor_pwm">Sensor → PWM</option></select></label><button id="inputA">A: released</button><button id="inputB">B: released</button>'+input('Sensor','sensor','range',510,'min="0" max="4095"');
      el('example').onchange=()=>{pause();config.example=el('example').value;el('inputA').hidden=config.example==='sensor_pwm';el('inputB').hidden=config.example!=='latch';el('sensor').parentElement.hidden=config.example!=='sensor_pwm';build();};
      for(const [id,key] of [['inputA','a'],['inputB','b']])el(id).onclick=()=>{config[key]=!config[key];el(id).textContent=`${key.toUpperCase()}: ${config[key]?'pressed':'released'}`;};
      el('sensor').oninput=()=>config.sensor=Number(el('sensor').value);el('sensor').parentElement.hidden=true;build();
    } else if(topic==='hysteresis'){
      el('inputs').innerHTML=input('Signal %','sample','number',54,'min="0" max="100"')+input('Lower','low','number',48,'min="0" max="99"')+input('Upper','high','number',62,'min="1" max="100"');
      el('sample').oninput=()=>config.sample=Math.max(0,Math.min(100,Number(el('sample').value)||0));
      for(const id of ['low','high'])el(id).onchange=()=>{const value=Number(el(id).value);if(!Number.isFinite(value)||value<0||value>100||(id==='low'?value>=config.high:value<=config.low)){el(id).value=config[id];return;}config[id]=value;pause();build();};build();
    }
  }
  // The bus engine shows physical START/STOP edges and both halves of every clock.
  let devices=[{name:'Temperature',address:0x48,value:25},{name:'Display',address:0x3c,value:0},{name:'Memory',address:0x50,value:0xA5}],events=[];
  function resetBus(){history=[];events=[];state={cursor:0,sda:1,scl:1,field:'Idle',detail:'Choose an address and Read or Write. SDA and SCL are pulled HIGH when released.',selected:[],busy:false,direction:'write',address:0,data:0,readValue:null};renderBus();}
  function transaction(direction){pause();if(state.busy)return;
    const address=Number(el('address').value),data=Number(el('data').value);
    if(!Number.isInteger(address)||address<8||address>119||!Number.isInteger(data)||data<0||data>255){el('explanation').textContent='Use a 7-bit address from 8 to 119 and a byte from 0 to 255 (decimal or 0x hex).';return;}
    history=[];const selected=devices.map((d,i)=>d.address===address?i:-1).filter(i=>i>=0);state={...state,cursor:0,selected,busy:true,direction,address,data,readValue:null};events=[];
    const push=(sda,scl,field,detail,action)=>events.push({sda,scl,field,detail,action});
    push(1,1,'Idle','Both lines are released HIGH.');push(0,1,'START','The controller pulls SDA LOW while SCL stays HIGH.');
    const bits=(byte,field,owner)=>{for(let bit=7;bit>=0;bit--){const value=(byte>>bit)&1;push(value,0,`${field} · bit ${bit}`,`${owner} sets SDA = ${value} while SCL is LOW.`);push(value,1,`${field} · bit ${bit}`,`SCL HIGH: receiver samples ${value}. Byte 0x${byte.toString(16).padStart(2,'0').toUpperCase()}, MSB first.`);}};
    bits((address<<1)|(direction==='read'?1:0),'Address + R/W','Controller');
    push(selected.length?0:1,0,'Address ACK',`Clock 9: controller releases SDA. ${selected.length?'Matching device pulls SDA LOW (ACK).':'No device answers: SDA remains HIGH (NACK).'}`);
    push(selected.length?0:1,1,'Address ACK',selected.length>1?'Address collision: multiple devices respond. Give each device a unique address.':selected.length?`${devices[selected[0]].name} selected; R/W = ${direction==='read'?1:0} (${direction}).`:'No ACK; abort the transaction.');
    if(selected.length===1){const byte=direction==='read'?devices[selected[0]].value:data;bits(byte,'Data',direction==='read'?'Device':'Controller');
      push(direction==='read'?1:0,0,direction==='read'?'Controller NACK':'Data ACK',direction==='read'?'Controller leaves SDA HIGH: NACK ends this one-byte read.':'Device pulls SDA LOW to acknowledge the received byte.');
      push(direction==='read'?1:0,1,direction==='read'?'Controller NACK':'Data ACK','Ninth clock after the data byte.',direction==='read'?{read:byte}:{write:byte,index:selected[0]});}
    push(0,0,'STOP preparation','SCL LOW; controller pulls SDA LOW.');push(0,1,'STOP preparation','Release SCL HIGH while keeping SDA LOW.');push(1,1,'STOP','Release SDA HIGH while SCL is HIGH. Bus returns to idle.',{done:true});
    lines=direction==='write'?['#include <Wire.h>','','void setup() {','  Wire.begin(21, 22);','}','','void loop() {',`  Wire.beginTransmission(0x${address.toString(16)});`,`  Wire.write(0x${data.toString(16)});`,'  byte status = Wire.endTransmission();','}']:['#include <Wire.h>','','void setup() {','  Wire.begin(21, 22);','}','','void loop() {',`  int count = Wire.requestFrom(0x${address.toString(16)}, 1);`,'  if (Wire.available()) {','    byte value = Wire.read();','  }','}'];
    renderBus();
  }
  function busStep(){if(!state.busy){pause();return;}history.push({state:structuredClone(state),devices:structuredClone(devices),active});const event=events[state.cursor++];Object.assign(state,{sda:event.sda,scl:event.scl,field:event.field,detail:event.detail});if(event.action?.write!==undefined)devices[event.action.index].value=event.action.write;if(event.action?.read!==undefined)state.readValue=event.action.read;if(event.action?.done){state.busy=false;pause();}renderBus();}
  function renderBus(){
    el('next').textContent='Next bus edge';el('previous').disabled=!history.length;el('copy').hidden=!lines.length;
    el('code').replaceChildren();
    const busLine=state.cursor===0?-1:state.direction==='read'?(state.busy?7:9):state.field==='Idle'?7:9;
    lines.forEach((line,i)=>{const div=document.createElement('div');div.className='code-line'+(i===busLine?' active':'');const number=document.createElement('span');number.className='number';number.textContent=i+1;div.append(number,renderArduinoCodeLine(line));el('code').append(div);});
    el('hardware').innerHTML=`<svg class="bus" viewBox="0 0 600 220" role="img" aria-label="I2C controller connected to three devices, SDA ${state.sda}, SCL ${state.scl}"><text x="20" y="25">ESP32 controller · SDA 21 / SCL 22</text><path d="M35 55 H560 M35 90 H560"/><text x="10" y="50">SDA ${state.sda}</text><text x="10" y="85">SCL ${state.scl}</text><text x="390" y="25">↑ pull-ups to 3.3 V</text>${devices.map((d,i)=>`<path d="M${150+i*180} 55 V135 M${170+i*180} 90 V135"/><rect class="${state.selected.includes(i)?'selected':''}" x="${95+i*180}" y="135" width="155" height="65" rx="10"/><text x="${172+i*180}" y="160" text-anchor="middle">${d.name}</text><text x="${172+i*180}" y="185" text-anchor="middle">0x${d.address.toString(16).toUpperCase()} · ${d.value}</text>`).join('')}</svg><div class="bus-devices">${devices.map((d,i)=>`<label>${d.name} address <input aria-label="${d.name} address" data-device="${i}" value="0x${d.address.toString(16)}" ${state.busy?'disabled':''}></label>`).join('')}</div>`;
    shadow.querySelectorAll('[data-device]').forEach(input=>input.onchange=()=>{const value=Number(input.value);if(Number.isInteger(value)&&value>=8&&value<=119){devices[Number(input.dataset.device)].address=value;state.selected=[];}renderBus();});
    el('values').innerHTML=row('SDA',state.sda)+row('SCL',state.scl)+row('Field',state.field)+row('Bus edge',`${state.cursor} / ${events.length}`)+row('R/W',state.direction==='read'?'1 (read)':'0 (write)')+row('Read byte',state.readValue===null?'—':state.readValue);
    el('explanation').textContent=state.detail;
    el('address').disabled=state.busy;el('data').disabled=state.busy;el('write').disabled=state.busy;el('read').disabled=state.busy;
    const recent=events.slice(0,state.cursor).slice(-36);if(recent.length){el('code').insertAdjacentHTML('beforeend',`<svg class="waveform" viewBox="0 0 600 110" aria-label="SDA and SCL waveform"><text x="0" y="25">SDA</text><text x="0" y="80">SCL</text>${['sda','scl'].map((signal,j)=>`<path d="${recent.map((e,i)=>`${i?'H':'M'}${55+i*15}${i?' V':' '}${j*50+(e[signal]?15:40)}`).join(' ')}"/>`).join('')}</svg>`);}
  }
  if(topic==='i2c'){
    el('inputs').innerHTML=input('7-bit address','address','text','0x48')+input('Byte','data','text','0xA5')+'<button id="write">Write</button><button id="read">Read</button>';
    el('write').onclick=()=>transaction('write');el('read').onclick=()=>transaction('read');resetBus();
  }
  const style=document.createElement('style');style.textContent='.learning-tabs{display:flex;gap:12px;margin:16px 0}.learning-tabs button{font:inherit;padding:12px 18px;border:2px solid var(--line);border-radius:12px;background:var(--panel);color:var(--text);cursor:pointer}.learning-tabs [aria-selected=true]{border-color:var(--accent)}[hidden]{display:none!important}';document.head.append(style);
  new ResizeObserver(()=>root.style.setProperty('--execution-controls-height',`${el('next').parentElement.getBoundingClientRect().height}px`)).observe(el('next').parentElement);
  const sync=()=>root.classList.toggle('dark',document.documentElement.classList.contains('theme-dark'));new MutationObserver(sync).observe(document.documentElement,{attributes:true,attributeFilter:['class']});sync();
  document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
})();
