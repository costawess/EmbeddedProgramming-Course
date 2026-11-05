(() => {
  const root=document.getElementById('coffeeStepPanel');
  const shadow=root.attachShadow({mode:'open'});
  ['../simulations/interrupts.css','../shared/arduino_code.css','../simulations/coffee_machine_simple.css'].forEach(href=>{const link=document.createElement('link');link.rel='stylesheet';link.href=href;shadow.append(link);});
  const content=document.createElement('div');content.className='coffee-step-app';
  content.innerHTML=`
  
  <div class="controls" aria-label="Execution controls"><button id="previous" type="button">Previous line</button><button id="next" type="button">Next line</button><button id="play" type="button">Pause code</button><button id="reset" type="button">Reset</button><label>Simulation speed <select id="speed"><option value="700">Slow</option><option value="250" selected>Normal</option></select></label></div>
  <div class="grid">
    <section class="panel"><div class="heading"><h2>Coffee Machine - Step by Step</h2><button id="copy" type="button">Copy code</button></div><p class="hint">The highlighted line is the instruction just executed.</p><div id="code" class="code" aria-label="Coffee machine ESP32 program"></div></section>
    <section class="panel monitor">
      <div class="heading"><h2>Machine</h2><strong id="machineState" class="machine-state">OFF</strong></div>
      <div class="coffee-hardware"><button id="brewButton" type="button" disabled>Start brewing · GPIO 34</button><button id="removeButton" type="button" disabled>Remove cup · GPIO 35</button><svg id="coffeeAnimation" class="coffee-animation" viewBox="0 0 260 245" role="img" aria-label="Coffee machine off, cup empty">
<defs><linearGradient id="machineMetal" x2="1" y2="1"><stop stop-color="#76858e"/><stop offset="1" stop-color="#263c49"/></linearGradient><clipPath id="cupMask"><rect x="88" y="184" width="76" height="35" rx="9"/></clipPath></defs>
<rect x="44" y="15" width="174" height="163" rx="22" fill="url(#machineMetal)" stroke="#152936" stroke-width="4"/>
<rect x="56" y="29" width="150" height="56" rx="12" fill="#182b35"/><rect x="65" y="38" width="111" height="36" rx="6" fill="#bdd6b4"/>
<text id="coffeeDisplay" x="120" y="61" text-anchor="middle" fill="#233b29" font-family="Consolas,monospace" font-size="14" font-weight="bold">READY</text><circle cx="192" cy="55" r="8" fill="#f0ad62"/>
<rect x="89" y="98" width="75" height="17" rx="5" fill="#172934"/><rect x="111" y="110" width="30" height="14" rx="4" fill="#9eafb8"/>
<rect x="44" y="147" width="28" height="73" rx="7" fill="#344a58"/><rect x="44" y="216" width="174" height="15" rx="5" fill="#273e4c"/>
<path class="coffee-stream" d="M120 125 V183 M132 125 V183" stroke="#794124" stroke-width="5" stroke-dasharray="9 5"/>
<path d="M165 188 H177 Q192 189 189 203 Q185 216 164 214" fill="none" stroke="#e4e9e8" stroke-width="8"/><rect x="84" y="180" width="84" height="43" rx="12" fill="#f5f2e8" stroke="#bbc8cb" stroke-width="3"/>
<rect id="coffeeFill" x="88" y="218" width="76" height="0" fill="#8a4c2e" clip-path="url(#cupMask)"/>
<path class="coffee-steam" d="M106 175 Q99 164 108 155 M125 175 Q118 162 128 152 M143 175 Q136 164 145 155" fill="none" stroke="#c4d2d8" stroke-width="3" stroke-linecap="round"/>
</svg><div class="coffee-leds"><div class="led-box"><div id="redLed" class="led red" role="img" aria-label="Red LED off"></div><strong>OFF</strong><span>GPIO 21</span></div><div class="led-box"><div id="greenLed" class="led green" role="img" aria-label="Green LED off"></div><strong>BREWING</strong><span>GPIO 22</span></div></div></div>
      <div class="coffee-countdown"><span>counter</span><strong id="countdown">0</strong><progress id="brewProgress" max="6" value="0"></progress><span id="timerValue">Timer not started</span><span id="alarmStatus">Waiting for timerAlarm()</span></div>
      <div class="coffee-clock"><button id="clockToggle" type="button">Pause time</button></div>
      <table><thead><tr><th>Variable</th><th>Value</th></tr></thead><tbody><tr><td>state</td><td id="stateValue">0</td></tr><tr><td>counter</td><td id="counterValue">0</td></tr><tr><td>brewRequested</td><td id="requested">false</td></tr><tr><td>cupRemoved</td><td id="cupRemoved">false</td></tr><tr><td>running</td><td id="running">false</td></tr><tr><td>Red LED</td><td id="redOutput">LOW</td></tr><tr><td>Green LED</td><td id="greenOutput">LOW</td></tr><tr><td>Serial</td><td id="serialValue">—</td></tr></tbody></table>
      <div class="flow"><strong id="context">setup()</strong><span id="resumePoint"></span></div><div id="explanation" class="explanation" role="status">Initializing the machine.</div>
      <p class="hint">GPIO 34/35: INPUT with external pull-downs to GND, buttons to 3.3 V (RISING). Each LED needs a series resistor.</p>
    </section>
  </div>
`;
  const controls=content.querySelector('.controls');
  controls.append(content.querySelector('#brewButton'),content.querySelector('#removeButton'),content.querySelector('#clockToggle'));
  content.querySelector('.coffee-clock').remove();
  shadow.append(content);
  const simulation=window.mountCoffeeMachineSimple(shadow);
  const syncTheme=()=>root.classList.toggle('dark',document.documentElement.classList.contains('theme-dark'));
  new MutationObserver(syncTheme).observe(document.documentElement,{attributes:true,attributeFilter:['class']});syncTheme();
  simulation.setVisible(true);
})();
