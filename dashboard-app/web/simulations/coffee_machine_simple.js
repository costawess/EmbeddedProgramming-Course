window.mountCoffeeMachineSimple = function mountCoffeeMachineSimple(scope) {
  const el=id=>scope.getElementById(id), source=window.COFFEE_STEP_CODE.split(/\r?\n/), program={};
  const find=(text,start=0)=>{const index=source.findIndex((line,i)=>i>=start&&line.trim().startsWith(text));if(index<0)throw Error('Missing code line: '+text);return index;};
  const functionEnd=start=>source.findIndex((line,i)=>i>start&&line==='}');
  const at={start:find('void IRAM_ATTR brewStart'),remove:find('void IRAM_ATTR removeCup'),timer:find('void IRAM_ATTR onTimer'),light:find('void lightLEDs'),setup:find('void setup'),loop:find('void loop')};
  at.idle=find('if(state == 0)',at.loop);at.brewing=find('} else if(state ==1)',at.loop);at.finished=find('} else if(state == 2)',at.loop);
  const fresh=()=>({key:'setup',active:-1,clock:0,machine:0,counter:0,requested:false,cupRemoved:false,running:false,red:false,green:false,startAttached:false,endAttached:false,timerOrigin:null,alarmEnabled:false,nextAlarm:0,timerPending:false,buttons:[],isr:null,resume:null,lightReturn:null,greenArg:false,redArg:false,lastAlarm:null,serial:'',text:'Initialize the two buttons, LEDs and hardware timer.'});
  let s=fresh(),history=[],auto=null,clockRunning=true,lastTick=performance.now(),visible=false,resumeAuto=true;
  // Keep timer time proportional to instruction speed, using a 20 ms baseline.
  let timeScale=20/Number(el('speed').value);
  const def=(key,line,next,action)=>program[key]={line,next,action};
  const set=(name,value,text)=>()=>{s[name]=value;return text;};
  function call(key,line,green,red,next){def(key,line,'light.enter',()=>{s.greenArg=green;s.redArg=red;s.lightReturn=next;return `Call lightLEDs(${green?'HIGH':'LOW'}, ${red?'HIGH':'LOW'}).`;});}
  ['start','remove'].forEach(type=>{
    const name=type==='start'?'brewStart':'removeCup',base=at[type];
    def(type+'.enter',base,type+'.check',()=>`RISING button edge: enter ${name}().`);
    def(type+'.check',find('if (!running)',base),()=>s.running?type+'.return':type+'.request',()=>`if (!running) is ${!s.running}. ${s.running?'Ignore this press.':'Accept this press.'}`);
    def(type+'.request',find(type==='start'?'brewRequested = true':'cupRemoved = true',base),type+'.end',set(type==='start'?'requested':'cupRemoved',true,type==='start'?'brewRequested = true.':'cupRemoved = true.'));
    def(type+'.end',find('}',base+1),type+'.return',()=> 'Finish the interrupt condition.');
    def(type+'.return',functionEnd(base),()=>s.resume,()=>{s.isr=null;return `Return to line ${program[s.resume].line+1}.`;});
  });
  def('timer.enter',at.timer,'timer.increment',()=> 'Hardware timer alarm: enter onTimer().');
  def('timer.increment',find('counter++',at.timer),'timer.return',()=>{s.counter++;return `counter++: counter = ${s.counter}.`;});
  def('timer.return',functionEnd(at.timer),()=>s.resume,()=>{s.isr=null;return `Return to line ${program[s.resume].line+1}.`;});
  def('light.enter',at.light,'light.green',()=>`lightLEDs: green_state = ${s.greenArg}, red_state = ${s.redArg}.`);
  def('light.green',find('digitalWrite(GREEN_PIN',at.light),'light.red',()=>{s.green=s.greenArg;return `Write ${s.green?'HIGH':'LOW'} to GREEN_PIN (22).`;});
  def('light.red',find('digitalWrite(RED_PIN',at.light),'light.return',()=>{s.red=s.redArg;return `Write ${s.red?'HIGH':'LOW'} to RED_PIN (21).`;});
  def('light.return',functionEnd(at.light),()=>s.lightReturn,()=> 'Return from lightLEDs().');
  const setupRows=[['setup','void setup',()=> 'Enter setup().'],['serialBegin','Serial.begin',()=> 'Start Serial at 115200 baud.'],['redMode','pinMode(RED_PIN',()=> 'Configure red LED output on GPIO 21.'],['greenMode','pinMode(GREEN_PIN',()=> 'Configure green LED output on GPIO 22.'],['startMode','pinMode(BUTTON_START_PIN',()=> 'Configure START input on GPIO 34.'],['endMode','pinMode(BUTTON_END_PIN',()=> 'Configure REMOVE CUP input on GPIO 35.'],['attachStart','attachInterrupt(digitalPinToInterrupt(BUTTON_START_PIN)',set('startAttached',true,'Attach brewStart() on RISING.')],['attachEnd','attachInterrupt(digitalPinToInterrupt(BUTTON_END_PIN)',set('endAttached',true,'Attach removeCup() on RISING.')],['timerBegin','timer = timerBegin',()=>{s.timerOrigin=s.clock;return 'Start hardware timer at 1 MHz: one tick per microsecond.';}],['timerAttach','timerAttachInterrupt',()=> 'Attach onTimer() to the timer.'],['timerAlarm','timerAlarm',()=>{s.alarmEnabled=true;s.nextAlarm=Math.max(s.clock,s.timerOrigin+500);return 'Enable an auto-reloading alarm every 500000 ticks (500 ms).';}],['initialState','state = 0;',set('machine',0,'state = 0: idle.')]];
  setupRows.forEach(([key,text,action],i)=>def(key,find(text,at.setup),i+1<setupRows.length?setupRows[i+1][0]:'initialLights',action));
  call('initialLights',find('lightLEDs(LOW, HIGH)',at.setup),false,true,'setupReturn');
  def('setupReturn',functionEnd(at.setup),'loop',()=> 'setup() finished.');
  def('loop',at.loop,'serialPrint',()=> 'Enter loop().');
  def('serialPrint',find('Serial.printf',at.loop),'checkIdle',()=>{s.serial=`State = ${s.machine}`;return `Serial prints: ${s.serial}`;});
  def('checkIdle',at.idle,()=>s.machine===0?'checkRequest':'checkBrewing',()=>`state == 0 is ${s.machine===0}.`);
  def('checkRequest',find('if(brewRequested)',at.idle),()=>s.requested?'startLights':'idleEnd',()=>`brewRequested is ${s.requested}.`);
  call('startLights',find('lightLEDs(HIGH, LOW)',at.idle),true,false,'startRunning');
  def('startRunning',find('running = true',at.idle),'stateBrewing',set('running',true,'running = true: brewing is active.'));
  def('stateBrewing',find('state = 1',at.idle),'clearRequest',set('machine',1,'state = 1: brewing.'));
  def('clearRequest',find('brewRequested = false',at.idle),'resetStartCounter',set('requested',false,'Clear brewRequested.'));
  def('resetStartCounter',find('counter = 0',at.idle),'idleEnd',set('counter',0,'Reset counter to zero. The hardware timer keeps its own phase.'));
  def('idleEnd',find('}',find('counter = 0',at.idle)+1),'stateEnd',()=> 'Finish the idle branch.');
  def('checkBrewing',at.brewing,()=>s.machine===1?'checkCounter':'checkFinished',()=>`state == 1 is ${s.machine===1}.`);
  def('checkCounter',find('if (counter<6)',at.brewing),()=>s.counter<6?'checkEven':'brewElse',()=>`${s.counter} < 6 is ${s.counter<6}.`);
  def('checkEven',find('if (counter % 2',at.brewing),()=>s.counter%2===0?'evenLights':'oddElse',()=>`${s.counter} % 2 == 0 is ${s.counter%2===0}.`);
  call('evenLights',find('lightLEDs(LOW, LOW)',at.brewing),false,false,'parityEnd');
  const oddElse=find('} else {',find('lightLEDs(LOW, LOW)',at.brewing));
  def('oddElse',oddElse,'oddLights',()=> 'Odd counter: take the else branch.');
  call('oddLights',find('lightLEDs(HIGH, LOW)',oddElse),true,false,'parityEnd');
  def('parityEnd',find('}',find('lightLEDs(HIGH, LOW)',oddElse)+1),'stateEnd',()=> 'Finish the green LED parity branch.');
  const brewElse=find('} else {',oddElse+1);
  def('brewElse',brewElse,'finishLights',()=> 'counter reached six: finish brewing.');
  call('finishLights',find('lightLEDs(HIGH, LOW)',brewElse),true,false,'finishRunning');
  def('finishRunning',find('running = false',brewElse),'stateFinished',set('running',false,'running = false.'));
  def('stateFinished',find('state = 2',brewElse),'resetFinishCounter',set('machine',2,'state = 2: finished. Wait for cup removal.'));
  def('resetFinishCounter',find('counter = 0',brewElse),'brewEnd',set('counter',0,'Reset counter. Timer interrupts continue in the finished state.'));
  def('brewEnd',find('}',find('counter = 0',brewElse)+1),'stateEnd',()=> 'Finish the brewing branch.');
  def('checkFinished',at.finished,()=>s.machine===2?'checkCup':'stateEnd',()=>`state == 2 is ${s.machine===2}.`);
  def('checkCup',find('if(cupRemoved)',at.finished),()=>s.cupRemoved?'stateIdle':'cupEnd',()=>`cupRemoved is ${s.cupRemoved}.`);
  def('stateIdle',find('state = 0',at.finished),'resetLights',set('machine',0,'Return to state = 0: idle.'));
  call('resetLights',find('lightLEDs(LOW, HIGH)',at.finished),false,true,'clearBrew');
  def('clearBrew',find('brewRequested = false',at.finished),'clearCup',set('requested',false,'Clear brewRequested.'));
  def('clearCup',find('cupRemoved = false',at.finished),'resetCupCounter',set('cupRemoved',false,'Clear cupRemoved.'));
  def('resetCupCounter',find('counter = 0',at.finished),'cupEnd',set('counter',0,'Reset counter to zero.'));
  def('cupEnd',find('}',find('counter = 0',at.finished)+1),'stateEnd',()=> 'Finish the cup removal condition.');
  def('stateEnd',source.length-2,'loopReturn',()=> 'Finish the state selection.');
  def('loopReturn',source.length-1,'loop',()=> 'Start the next loop().');
  source.forEach((text,index)=>{const row=document.createElement('div');row.className='code-line';row.id=`line-${index}`;const number=document.createElement('span');number.className='number';number.textContent=index+1;row.append(number,renderArduinoCodeLine(text));el('code').append(row);});
  function render(follow=false){
    scope.querySelectorAll('.code-line').forEach((row,index)=>{row.classList.toggle('active',index===s.active);if(index===s.active)row.setAttribute('aria-current','step');else row.removeAttribute('aria-current');});
    if(follow&&s.active>=0){const panel=el('code'),line=el(`line-${s.active}`);panel.scrollTop+=line.getBoundingClientRect().top-panel.getBoundingClientRect().top-panel.clientTop-(panel.clientHeight-line.getBoundingClientRect().height)/2;}
    el('requested').textContent=String(s.requested);el('cupRemoved').textContent=String(s.cupRemoved);el('running').textContent=String(s.running);el('stateValue').textContent=s.machine;el('counterValue').textContent=s.counter;
    el('redOutput').textContent=s.red?'HIGH':'LOW';el('greenOutput').textContent=s.green?'HIGH':'LOW';
    ['red','green'].forEach(color=>{el(color+'Led').classList.toggle('on',s[color]);el(color+'Led').setAttribute('aria-label',color+' LED '+(s[color]?'on':'off'));});
    const stage=['IDLE','BREWING','FINISHED'][s.machine];el('machineState').textContent=s.machine+' · '+stage;el('brewButton').disabled=!s.startAttached;el('removeButton').disabled=!s.endAttached;
    el('countdown').textContent=String(s.counter);el('brewProgress').value=s.machine===2?6:s.machine===1?Math.min(s.counter,6):0;
    const timerCounter=s.timerOrigin===null?0:Math.max(0,s.clock-(s.alarmEnabled?s.nextAlarm-500:s.timerOrigin));
    el('timerValue').textContent=s.timerOrigin===null?'Timer not started':Math.floor(timerCounter*1000)+' / 500000 µs';
    el('alarmStatus').textContent=!s.alarmEnabled?'Waiting for timerAlarm()':s.timerPending?'Timer alarm · onTimer() pending':s.isr==='timer'?'Executing onTimer()':'Alarm every 500 ms';
    el('alarmStatus').classList.toggle('fired',s.lastAlarm!==null&&s.clock-s.lastAlarm<100);
    const fill=s.machine===2?1:s.machine===1?Math.min(s.counter/6,1):0;
    el('coffeeFill').setAttribute('height',String(fill*28));el('coffeeFill').setAttribute('y',String(218-fill*28));
    el('coffeeAnimation').classList.toggle('brewing',s.machine===1&&s.counter<6);el('coffeeAnimation').classList.toggle('finished',s.machine===2);el('coffeeAnimation').classList.toggle('time-paused',!clockRunning||!visible);
    el('coffeeAnimation').setAttribute('aria-label','Coffee machine '+stage.toLowerCase()+', cup '+Math.round(fill*100)+' percent full');el('coffeeDisplay').textContent=stage;
    el('clockToggle').textContent=clockRunning?'Pause timer':'Resume timer';el('serialValue').textContent=s.serial||'—';
    el('context').textContent=s.isr?({start:'ISR: brewStart()',remove:'ISR: removeCup()',timer:'ISR: onTimer()'}[s.isr]):s.key.startsWith('light.')?'lightLEDs()':setupRows.some(row=>row[0]===s.key)||['initialLights','setupReturn'].includes(s.key)?'setup()':'loop()';
    el('resumePoint').textContent=s.isr?'Return to line '+(program[s.resume].line+1):'';el('explanation').textContent=s.text;el('previous').disabled=!history.length;
  }
  function save(){history.push(JSON.parse(JSON.stringify(s)));if(history.length>500)history.shift();}
  function step(){
    save();if(!s.isr&&(s.buttons.length||s.timerPending)){s.resume=s.key;s.isr=s.buttons.length?s.buttons.shift():'timer';if(s.isr==='timer')s.timerPending=false;s.key=s.isr+'.enter';}
    const instruction=program[s.key];s.active=instruction.line;s.text=instruction.action();s.key=typeof instruction.next==='function'?instruction.next():instruction.next;render(true);
  }
  function pause(){clearInterval(auto);auto=null;el('play').textContent='Play code';}
  function play(){pause();auto=setInterval(()=>{if(visible)step()},Number(el('speed').value));el('play').textContent='Pause code';}
  el('next').onclick=()=>{pause();step()};el('previous').onclick=()=>{pause();clockRunning=false;if(history.length)s=history.pop();lastTick=performance.now();s.text+=' Timer paused for rewind.';render(true)};
  el('play').onclick=()=>auto===null?play():pause();el('speed').onchange=()=>{timeScale=20/Number(el('speed').value);lastTick=performance.now();if(auto!==null)play()};
  el('reset').onclick=()=>{pause();s=fresh();history=[];clockRunning=true;lastTick=performance.now();render();play()};el('clockToggle').onclick=()=>{clockRunning=!clockRunning;lastTick=performance.now();render()};
  const press=type=>{save();s.buttons.push(type);s.text=(type==='start'?'START':'REMOVE CUP')+' button: LOW → HIGH.';render()};el('brewButton').onclick=()=>press('start');el('removeButton').onclick=()=>press('remove');
  el('copy').onclick=async()=>{try{await navigator.clipboard.writeText(window.COFFEE_STEP_CODE);el('copy').textContent='Copied!'}catch(e){const range=document.createRange();range.selectNodeContents(el('code'));const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);el('copy').textContent='Press Ctrl+C'}};
  const controls=scope.querySelector('.controls');new ResizeObserver(()=>scope.host.style.setProperty('--execution-controls-height',controls.getBoundingClientRect().height+'px')).observe(controls);
  setInterval(()=>{const now=performance.now();if(visible&&clockRunning&&!document.hidden){s.clock+=(now-lastTick)*timeScale;if(s.alarmEnabled&&s.clock>=s.nextAlarm){const count=Math.floor((s.clock-s.nextAlarm)/500)+1;s.lastAlarm=s.nextAlarm+(count-1)*500;s.nextAlarm+=count*500;s.timerPending=true}}lastTick=now;if(visible)render()},40);
  document.addEventListener('visibilitychange',()=>{lastTick=performance.now()});render();
  return {setVisible(value){if(!value){resumeAuto=auto!==null;pause()}visible=value;lastTick=performance.now();if(value&&resumeAuto)play();render()}};
};
