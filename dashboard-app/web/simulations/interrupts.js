(() => {
  const code = [
    'const int ON_PIN = 34;', 'const int OFF_PIN = 35;', 'const int LED_PIN = 23;',
    'bool ledRequested = false;', 'bool nextLed = false;', '',
    'void IRAM_ATTR turnOn() {', '  ledRequested = true;', '}', '',
    'void IRAM_ATTR turnOff() {', '  ledRequested = false;', '}', '',
    'void setup() {', '  pinMode(LED_PIN, OUTPUT);', '  digitalWrite(LED_PIN, LOW);',
    '  pinMode(ON_PIN, INPUT);', '  pinMode(OFF_PIN, INPUT);',
    '  attachInterrupt(ON_PIN, turnOn, RISING);', '  attachInterrupt(OFF_PIN, turnOff, RISING);', '}', '',
    'void loop() {', '  nextLed = ledRequested;', '  if (nextLed) {',
    '    digitalWrite(LED_PIN, HIGH);', '  } else {', '    digitalWrite(LED_PIN, LOW);', '  }', '}'
  ];
  const setupLines = [14,15,16,17,18,19,20,21];
  const loopLines = [23,24,25,26,27,28,29,30];
  const el = id => document.getElementById(id);
  const controls = document.querySelector('.controls');
  controls.append(el('onButton'), el('offButton'));
  document.querySelector('.buttons').remove();
  const updateControlsHeight = () => document.documentElement.style.setProperty('--execution-controls-height', `${controls.getBoundingClientRect().height}px`);
  new ResizeObserver(updateControlsHeight).observe(controls);
  updateControlsHeight();
  let history = [], timer = null;
  const initial = () => ({phase:'setup',pc:0,isr:null,isrStep:0,requested:false,nextLed:false,output:false,loops:0,onAttached:false,offAttached:false,pending:[],active:-1,text:'Press Next line or Play to execute setup().',trace:[]});
  let state = initial();
  code.forEach((text, index) => {
    const row = document.createElement('div'); row.className = 'code-line' + (index>=6 && index<=12 ? ' isr' : ''); row.id = `line-${index}`;
    const number = document.createElement('span'); number.className='number'; number.textContent=index+1;
    row.append(number, renderArduinoCodeLine(text)); el('code').append(row);
  });
  function save() { history.push(JSON.parse(JSON.stringify(state))); if(history.length>500) history.shift(); }
  function record(text) { state.text=text; state.trace.push(text); if(state.trace.length>60) state.trace.shift(); }
  function render() {
    document.querySelectorAll('.code-line').forEach((row,index) => { row.classList.toggle('active',index===state.active); if(index===state.active) row.setAttribute('aria-current','step'); else row.removeAttribute('aria-current'); });
    if (state.active >= 0) {
      const codePanel = el('code');
      const activeLine = el(`line-${state.active}`);
      const panelBounds = codePanel.getBoundingClientRect();
      const lineBounds = activeLine.getBoundingClientRect();
      codePanel.scrollTop += lineBounds.top - panelBounds.top - codePanel.clientTop - (codePanel.clientHeight - lineBounds.height) / 2;

    }
    el('requested').textContent=String(state.requested); el('nextLed').textContent=String(state.nextLed); el('output').textContent=state.output?'HIGH':'LOW';
    el('loops').textContent=state.loops; el('pending').textContent=state.pending.join(' → ') || 'None';
    el('led').classList.toggle('on',state.output); el('led').setAttribute('aria-label',state.output?'LED on':'LED off'); el('ledLabel').textContent=state.output?'LED ON':'LED OFF';
    el('context').textContent=state.isr ? `ISR: ${state.isr==='ON'?'turnOn()':'turnOff()'}` : `${state.phase}()`;
    el('returnPoint').textContent=state.isr ? `Return to ${state.phase}(), line ${(state.phase==='setup'?setupLines:loopLines)[state.pc]+1}` : 'No interrupted instruction';
    el('explanation').textContent=state.text; el('previous').disabled=!history.length;
    el('onButton').disabled=!state.onAttached; el('offButton').disabled=!state.offAttached;
  }
  function step() {
    save();
    if(!state.isr && state.pending.length) { state.isr=state.pending.shift();state.isrStep=0; }
    if(state.isr) {
      const on = state.isr==='ON'; const start=on?6:10;
      state.active=start+state.isrStep;
      if(state.isrStep===0) record(`RISING edge: enter ${on?'turnOn':'turnOff'}(). Save the ${state.phase}() position; its variables remain unchanged.`);
      else if(state.isrStep===1) {state.requested=on;record(`ISR writes ledRequested = ${on}. The LED output is still ${state.output?'HIGH':'LOW'} until loop() writes it.`);}
      else {record(`ISR returns. Resume ${state.phase}() at line ${(state.phase==='setup'?setupLines:loopLines)[state.pc]+1}.`);state.isr=null;}
      state.isrStep++;
    } else if(state.phase==='setup') {
      state.active=setupLines[state.pc];
      const notes=['Enter setup(); initialization runs once.','Configure GPIO 23 as an output.','Set the LED output LOW (off).','ON button uses an external pull-down: idle LOW, pressed HIGH.','OFF button uses an external pull-down: idle LOW, pressed HIGH.','Register turnOn() for a RISING edge on GPIO 34. The ON button is ready.','Register turnOff() for a RISING edge on GPIO 35. The OFF button is ready.','setup() returns; loop() will run repeatedly.'];
      if(state.pc===5)state.onAttached=true;if(state.pc===6)state.offAttached=true;
      record(notes[state.pc]);state.pc++;
      if(state.pc===setupLines.length){state.phase='loop';state.pc=0;}
    } else {
      state.active=loopLines[state.pc];
      switch(state.pc) {
        case 0: record('Enter loop(). Button ISRs may interrupt between its instructions.'); state.pc=1; break;
        case 1: state.nextLed=state.requested; record(`Read ledRequested (${state.requested}) into nextLed. Later ISR changes do not change this saved value.`); state.pc=2; break;
        case 2: record(`if (nextLed) is ${state.nextLed}: ${state.nextLed?'execute the HIGH branch':'skip the HIGH branch and enter else'}.`); state.pc=state.nextLed?3:4; break;
        case 3: state.output=true; record('digitalWrite(LED_PIN, HIGH) turns the LED ON. Skip the else branch.'); state.pc=6; break;
        case 4: record('Enter else because nextLed is false.'); state.pc=5; break;
        case 5: state.output=false; record('digitalWrite(LED_PIN, LOW) turns the LED OFF.'); state.pc=6; break;
        case 6: record('The if/else block is finished.'); state.pc=7; break;
        case 7: state.loops++; record(`Loop ${state.loops} completed. Return to the start of loop().`); state.pc=0; break;
      }
    }
    render();
  }
  function pause(){if(timer!==null)clearInterval(timer);timer=null;el('play').textContent='Play';}
  function run(){pause();timer=setInterval(step,Number(el('speed').value));el('play').textContent='Pause';}
  el('next').onclick=()=>{pause();step();};
  el('previous').onclick=()=>{pause();if(history.length)state=history.pop();render();};
  el('play').onclick=()=>timer===null?run():pause();
  el('speed').onchange=()=>{if(timer!==null)run();};
  el('reset').onclick=()=>{pause();state=initial();history=[];render();};
  function press(name){save();state.pending.push(name);record(`${name} button: LOW → HIGH edge queued. ${state.isr?'It waits for the current ISR to return.':'The next step enters its ISR.'}`);render();}
  el('onButton').onclick=()=>press('ON');el('offButton').onclick=()=>press('OFF');
  el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(code.join('\n'));el('copy').textContent='Copied!';}catch(e){const range=document.createRange();range.selectNodeContents(el('code'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);el('copy').textContent='Press Ctrl+C';}};
  render();
})();
