(() => {
  'use strict';
  const allLifts = ['a', 'b'].map(id => ({ id, position: 0, target: null, queue: [], state: 'idle', until: 0, passengers: [], boardingAt: null }));
  let lifts = allLifts;
  const hallCalls = new Map();
  let mode = 'manual';
  let nextArrival = null;
  let personId = 0;
  let randomState = 101;
  let runEndsAt = null;
  let runStartedAt = null;
  let runFinished = false;
  const totalTimeScore = document.getElementById('totalTimeScore');
  const seedSelect = document.getElementById('seedSelect');
  const durationSelect = document.getElementById('durationSelect');
  const scores = new Map();
  let lastScoreRender = -Infinity;
  const totalWaitingScore = document.getElementById('totalWaitingScore');
  const totalCabinScore = document.getElementById('totalCabinScore');
  const scoreCount = document.getElementById('scoreCount');
  const personScores = document.getElementById('personScores');
  const randomSettings = document.getElementById('randomSettings');
  const startRandomButton = document.getElementById('startRandomRun');
  function renderScores(now) {
    let total = 0;
    let cabinTotal = 0;
    let boarded = 0;
    personScores.replaceChildren();
    for (const [id, person] of scores) {
      const wait = Math.max(0, (person.boardedAt ?? now) - person.arrivedAt) / 1000;
      const cabin = person.boardedAt === null ? 0 : Math.max(0, (person.exitedAt ?? now) - person.boardedAt) / 1000;
      total += wait;
      cabinTotal += cabin;
      if (person.boardedAt !== null) boarded++;
      const item = document.createElement('li');
      item.textContent = `P${id}: Wait ${wait.toFixed(1)} s | Cabin ${cabin.toFixed(1)} s | ${person.boardedAt === null ? 'Waiting' : person.exitedAt === null ? 'Inside' : 'Completed'}`;
      item.style.setProperty('--shirt-color', person.clothingColor);
      personScores.append(item);
    }
    totalWaitingScore.textContent = `${total.toFixed(1)} s`;
    totalCabinScore.textContent = `${cabinTotal.toFixed(1)} s`;
    totalTimeScore.textContent = `${(total + cabinTotal).toFixed(1)} s`;
    scoreCount.textContent = `${boarded}/${scores.size} boarded`;
  }
  const runStatus = document.getElementById('runStatus');
  function random() {
    randomState = (randomState + 0x6D2B79F5) >>> 0;
    let value = randomState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  const skinColors = ['#70462f', '#f3d9c5', '#e5bd64'];
  const personStyles = ['trousers', 'dress', 'neutral'];
  let appearanceState = 101;
  function appearanceRandom() {
    appearanceState = (appearanceState + 0x6D2B79F5) >>> 0;
    let value = appearanceState;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }
  function applyAppearance(svg, person) {
    svg.style.setProperty('--shirt-color', person.clothingColor);
    svg.querySelector('circle').setAttribute('fill', person.skinColor);
    const paths = svg.querySelectorAll('path');
    paths[0].setAttribute('fill', '#403c49');
    paths[0].removeAttribute('fill-rule');
    paths[2].removeAttribute('stroke');
    paths[2].removeAttribute('stroke-width');
    const wearsDress = person.personStyle === 'dress' || person.personStyle === 'headscarf';
    paths[0].setAttribute('d', wearsDress
      ? 'M15 10a9 9 0 0 1 18 0l2 14-7-3V8l-13 3-2 13Z'
      : 'M15 10a9 9 0 0 1 18 0l-5-3-13 3');
    paths[1].setAttribute('d', wearsDress
      ? 'M16 26Q24 21 32 26L38 48 32 50 29 35 36 65H12L19 35 16 50 10 48Z'
      : person.personStyle === 'neutral'
        ? 'M15 26Q24 22 33 26L38 49 32 51 29 35 31 59H17L19 35 16 51 10 49Z'
        : 'M15 26Q24 21 33 26L38 49 32 51 28 34V54H20V34L16 51 10 49Z');
    paths[2].setAttribute('d', wearsDress
      ? 'M17 65h6v15h-7Zm8 0h6l1 15h-7Z'
      : 'M20 52h8l5 28h-8l-1-19-1 19h-8Z');
    paths[2].setAttribute('fill', wearsDress ? person.skinColor : '#29465c');
    if (person.personStyle === 'headscarf') {
      // Wrap around the head and neck, leaving the face visible.
      paths[0].setAttribute('d', 'M12 13Q12 0 24 0Q36 0 36 13L39 30Q24 35 9 30ZM17 12Q17 7 24 7Q31 7 31 12V18Q24 26 17 18Z');
      paths[0].setAttribute('fill', person.clothingColor);
      paths[0].setAttribute('fill-rule', 'evenodd');
    } else {
      paths[0].removeAttribute('fill-rule');
    }
  }
  const clothingColors = ['#df6b53', '#6478c7', '#399b80', '#d49b32', '#ba62a2', '#428db5', '#9c8059', '#84a343'];
  const hallButtons = [];
  let lastTelemetry = 0;
  const serialButton = document.getElementById('serialToggleBtn');
  const baudRate = 115200;
  const serialStatus = document.getElementById('serialStatus');
  const feedback = document.getElementById('uartFeedback');
  const serial = new WebSerialLineBridge({
    onLine: handleSerialLine,
    onStatus: status => {
      serialButton.textContent = `${status === 'connected' ? 'Connected' : 'Connect'} (${baudRate} baud)`;
      serialButton.title = `${status === 'connected' ? 'Disconnect' : 'Connect'} (Key C)`;
      serialStatus.textContent = status === 'connected' ? `Connected at ${baudRate} baud` : 'Not connected';
      serialStatus.hidden = true;
      serialButton.classList.toggle('serial-connected', status === 'connected');
      serialButton.classList.toggle('serial-disconnected', status !== 'connected');
    },
    onError: error => { feedback.textContent = `UART error: ${error.message || error}`; }
  });
  function sendEvent(line) {
    if (serial.connected) serial.sendLine(line).catch(error => { feedback.textContent = `UART error: ${error.message || error}`; });
  }
  async function toggleSerial() {
    serialButton.disabled = true;
    try {
      if (serial.connected) await serial.disconnect();
      else await serial.connect(baudRate);
    } catch (error) {
      await serial.disconnect();
      feedback.textContent = error.name === 'NotFoundError' ? 'Connection cancelled' : `Connection failed: ${error.message || error}`;
    } finally { serialButton.disabled = !serial.supported; }
  }
  serialButton.onclick = toggleSerial;
  if (!serial.supported) {
    serialButton.disabled = true;
    serialStatus.textContent = 'Web Serial unavailable';
    feedback.textContent = 'Web Serial unavailable: use Chrome or Edge on localhost or HTTPS.';
  }
  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() === 'c' && !event.repeat && !event.ctrlKey && !event.altKey && !event.metaKey &&
        !event.target.closest('input, select, textarea, button, [contenteditable], dialog') && serial.supported) toggleSerial();
  });
  function handleSerialLine(raw) {
    const line = raw.trim().toUpperCase();
    let match;
    if ((match = /^CALL:([1-4]):(UP|DOWN)$/.exec(line))) {
      const entry = hallButtons.find(item => item.floor === Number(match[1]) - 1 && item.direction === match[2].toLowerCase());
      if (!entry || hallCalls.size >= (mode === 'random' ? 4 : 16)) { feedback.textContent = 'Call unavailable'; return; }
      call(entry.floor, entry.direction, entry.button);
    } else if ((match = /^DEST:([AB]):([1-4])$/.exec(line))) {
      const lift = lifts.find(item => item.id === match[1].toLowerCase());
      if (!lift) { feedback.textContent = 'Elevator unavailable in this tab'; return; }
      if (!lift.passengers.some(person => person.destination === null)) { feedback.textContent = 'No passenger awaiting a destination'; return; }
      chooseDestination(lift, Number(match[2]) - 1);
    } else if (line === 'MODE:MANUAL') setMode('manual');
    else if (line === 'MODE:RANDOM') startRandomRun();
    else if (line === 'RESET') resetSimulation();
    else { feedback.textContent = `Unknown UART command: ${raw}`; return; }
    feedback.textContent = `Applied: ${line}`;
  }
  document.getElementById('uartTestInput').addEventListener('keydown', event => {
    if (event.key === 'Enter') { handleSerialLine(event.target.value); event.target.value = ''; }
  });
  function chooseDestination(lift, destination) {
    if (runFinished) return;
    const passenger = lift.passengers.find(person => person.destination === null);
    if (!passenger) return;
    passenger.destination = destination;
    enqueue(lift, destination);
  }

  function setMode(value) {
    nextArrival = null;
    runEndsAt = null;
    runStartedAt = null;
    runFinished = false;
    hallButtons.forEach(entry => { entry.button.disabled = false; });
    mode = value;
    randomSettings.hidden = value !== 'random';
    startRandomButton.hidden = value !== 'random';
    seedSelect.disabled = false;
    durationSelect.disabled = false;
    runStatus.textContent = value === 'random' ? 'Ready to start' : 'Ready';
    startRandomButton.textContent = 'Start run';
    document.getElementById('manualMode').setAttribute('aria-pressed', String(value === 'manual'));
    document.getElementById('randomMode').setAttribute('aria-pressed', String(value === 'random'));

  }
  function startRandomRun() {
    resetSimulation();
    setMode('random');
    randomState = Number(seedSelect.value);
    appearanceState = Number(seedSelect.value);
    const startedAt = performance.now();
    startRandomButton.textContent = 'Restart';
    runStartedAt = startedAt;
    nextArrival = startedAt;
    runEndsAt = durationSelect.value === 'unlimited' ? Infinity : startedAt + Number(durationSelect.value) * 1000;
    seedSelect.disabled = true;
    durationSelect.disabled = true;
    lastScoreRender = -Infinity;
  }
  startRandomButton.onclick = startRandomRun;
  document.getElementById('manualMode').onclick = () => setMode('manual');
  document.getElementById('randomMode').onclick = () => setMode('random');
  const names = ['Lobby', 'Studio', 'Garden', 'Sky lounge'];
  const floors = document.getElementById('floors');
  for (let floor = 3; floor >= 0; floor--) {
    const row = document.createElement('div');
    row.className = 'floor';
    row.innerHTML = `<div class="wait-times" aria-label="Waiting times at floor ${floor + 1}"></div><div class="floor-label">F${floor + 1}<small>${names[floor]}</small></div><div class="hall-buttons"></div><div class="decoration" aria-hidden="true"></div>`;
    for (const direction of ['up', 'down']) {
      if ((floor === 0 && direction === 'down') || (floor === 3 && direction === 'up')) continue;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = direction === 'up' ? '↑' : '↓';
      button.setAttribute('aria-label', `Call elevator ${direction} at floor ${floor + 1}`);
      button.setAttribute('aria-pressed', 'false');
      hallButtons.push({ floor, direction, button });
      button.onclick = () => call(floor, direction, button);
      row.querySelector('.hall-buttons').append(button);
    }
    floors.append(row);
  }
  function enqueue(lift, floor) {
    if (!lift.queue.includes(floor)) lift.queue.push(floor);
  }
  function call(floor, direction, button) {
    if (runFinished) return;
    if (hallCalls.size >= (mode === 'random' ? 4 : 16)) return;
    const key = ++personId;
    const clothingColor = clothingColors[(key - 1) % clothingColors.length];
    const skinColor = skinColors[Math.floor(appearanceRandom() * skinColors.length)];
    let personStyle = personStyles[Math.floor(appearanceRandom() * personStyles.length)];
    if (personStyle === 'dress') {
      const variant = appearanceRandom();
      if (variant < 1 / 5) personStyle = 'headscarf';
    }
    const waiting = document.querySelector('.passenger').cloneNode(true);
    applyAppearance(waiting, { clothingColor, skinColor, personStyle });
    waiting.classList.add('waiting-passenger');
    waiting.classList.remove('passenger');
    waiting.setAttribute('aria-label', `Person waiting at F${floor + 1}`);
    waiting.setAttribute('aria-hidden', 'false');
    waiting.style.left = `${5 + [...hallCalls.values()].filter(request => request.floor === floor).length * 4}%`;
    const row = button.closest('.floor');
    row.append(waiting);
    waiting.setAttribute('aria-label', `Person P${key} waiting at F${floor + 1}`);
    const timer = document.createElement('div');
    timer.className = 'wait-time';
    timer.textContent = `P${key}: 0s`;
    row.querySelector('.wait-times').append(timer);
    const arrivedAt = performance.now();
    scores.set(key, { arrivedAt, boardedAt: null, exitedAt: null, clothingColor });
    hallCalls.set(key, { floor, direction, clothingColor, skinColor, personStyle, lift: null, button, waiting, timer, arrivedAt });
    sendEvent(`CALL:${key}:${floor + 1}:${direction.toUpperCase()}`);
    button.classList.add('queued');
    button.setAttribute('aria-pressed', 'true');

  }
  for (const lift of allLifts) {
    const control = document.createElement('div');
    lift.control = control;
    control.className = 'control';
    control.innerHTML = `<div class="control-heading"><strong>Elevator ${lift.id.toUpperCase()}</strong><span class="status" id="status-${lift.id}" role="status"></span></div><div class="destinations"></div>`;
    for (let floor = 0; floor < 4; floor++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = `F${floor + 1}`;
      button.setAttribute('aria-label', `Elevator ${lift.id.toUpperCase()} to floor ${floor + 1}`);
      button.disabled = true;
      button.onclick = () => {
        chooseDestination(lift, floor);
      };
      control.querySelector('.destinations').append(button);
    }
    document.getElementById('controls').append(control);
    lift.buttons = [...control.querySelectorAll('button')];
    lift.cabin = document.getElementById(`cabin-${lift.id}`);
    lift.status = document.getElementById(`status-${lift.id}`);
    const template = lift.cabin.querySelector('.passenger');
    lift.slots = [template, template.cloneNode(true), template.cloneNode(true)];
    const doors = lift.cabin.querySelector('.doors');
    lift.cabinTimers = [];
    lift.slots.forEach((slot, index) => {
      slot.style.left = `${index * 32 + 2}%`;
      slot.classList.add('slot-hidden');
      slot.setAttribute('aria-hidden', 'true');
      if (index) doors.append(slot);
      const timer = document.createElement('span');
      timer.className = 'cabin-person-time';
      timer.style.left = `${index * 32 + 2}%`;
      timer.hidden = true;
      doors.append(timer);
      lift.cabinTimers.push(timer);
    });
    lift.cabin.classList.remove('passenger-hidden');
    lift.landingDoors = [];
    for (let floor = 0; floor < 4; floor++) {
      const landing = document.createElement('div');
      landing.className = 'landing-door';
      landing.style.bottom = `${floor * 25}%`;
      landing.setAttribute('aria-label', `Elevator ${lift.id.toUpperCase()} door at F${floor + 1}`);
      landing.innerHTML = `<span>${lift.id.toUpperCase()}</span><div class="landing-panels"><i></i><i></i></div>`;
      lift.cabin.parentElement.append(landing);
      lift.landingDoors.push(landing);
    }
  }
  function arrive(lift, now) {
    lift.position = lift.target;
    lift.queue = lift.queue.filter(floor => floor !== lift.target);
    lift.state = 'open';
    sendEvent(`ARRIVED:${lift.id.toUpperCase()}:${lift.target + 1}`);
    let exiting = false;
    for (const passenger of lift.passengers) {
      if (passenger.destination !== lift.target) continue;
      passenger.fadeAt = now + 1350;
      passenger.exitAt = now + 1850;
      exiting = true;
    }
    lift.boardingAt = now + (exiting ? 1900 : 350);
    lift.until = now + (exiting ? 2900 : 2200);

  }
  function updateWaitingTimes(now) {
    for (const [id, request] of hallCalls) {
      const seconds = Math.max(0, Math.floor((now - request.arrivedAt) / 1000));
      const time = seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
      const label = `P${id}: ${time}`;
      if (request.timer.textContent !== label) request.timer.textContent = label;
    }
  }
  let previous;
  function updateCabinTimers(now) {
    for (const lift of lifts) {
      lift.cabinTimers.forEach((timer, index) => {
        const person = lift.passengers.find(passenger => passenger.slot === index);
        timer.hidden = !person;
        if (!person) return;
        const score = scores.get(person.id);
        const seconds = Math.max(0, (score.exitedAt ?? now) - score.boardedAt) / 1000;
        const label = `${seconds.toFixed(1)}s`;
        if (timer.textContent !== label) timer.textContent = label;
        timer.title = `P${person.id}: ${label} inside elevator`;
      });
    }
  }
  function frame(now) {
    if (runEndsAt !== null && now >= runEndsAt) {
      if (!runFinished) {
        runFinished = true;
        renderScores(runEndsAt);
        updateCabinTimers(runEndsAt);
        updateWaitingTimes(runEndsAt);
        runStatus.textContent = 'Finished';
        seedSelect.disabled = false;
        durationSelect.disabled = false;
        hallButtons.forEach(entry => { entry.button.disabled = true; });
        lifts.forEach(lift => lift.buttons.forEach(button => { button.disabled = true; }));
        sendEvent(`FINISHED:${((runEndsAt - runStartedAt) / 1000).toFixed(1)}:${totalWaitingScore.textContent.replace(' s', '')}`);
      }
      requestAnimationFrame(frame);
      return;
    }
    const delta = previous === undefined ? 0 : Math.min((now - previous) / 1000, .1);
    previous = now;
    if (mode === 'random' && runEndsAt !== null && now < runEndsAt && now >= nextArrival) {
      const groupSize = Math.min(Math.max(0, 4 - hallCalls.size), 1 + Math.floor(random() * 3));
      for (let person = 0; person < groupSize; person++) {
        const entry = hallButtons[Math.floor(random() * hallButtons.length)];
        call(entry.floor, entry.direction, entry.button);
      }
      nextArrival = now + 2500 + random() * 2500;
    }
    if (mode === 'random' && runEndsAt !== null) {
      const remaining = Math.max(0, Math.ceil((runEndsAt - now) / 1000));
      const label = !Number.isFinite(runEndsAt) ? 'Indefinite'
        : remaining > 0 ? `Remaining ${remaining}s` : 'Arrivals finished';
      if (runStatus.textContent !== label) runStatus.textContent = label;
      seedSelect.disabled = remaining > 0;
      durationSelect.disabled = remaining > 0;
    }
    updateWaitingTimes(now);
    // Dispatch cabins to the shared hall queue; either cabin can board waiting people.
    for (const request of hallCalls.values()) {
      if (request.lift !== null) continue;
      const available = lifts.filter(lift => {
        const reserved = [...hallCalls.values()].filter(other => other.lift === lift.id);
        return lift.passengers.length === 0 && reserved.length < 3 &&
          reserved.every(other => other.floor === request.floor && other.direction === request.direction);
      });
      available.sort((a, b) => Math.abs(a.position - request.floor) - Math.abs(b.position - request.floor));
      if (available.length) {
        request.lift = available[0].id;
        enqueue(available[0], request.floor);
      }
    }
    for (const lift of lifts) {
      const departing = lift.passengers.filter(person => person.exitAt !== null && now >= person.exitAt);
      departing.forEach(person => { scores.get(person.id).exitedAt = person.exitAt; });
      departing.forEach(person => sendEvent(`EXITED:${lift.id.toUpperCase()}:${person.id}:${Math.round(lift.position) + 1}`));
      lift.passengers = lift.passengers.filter(person => !departing.includes(person));

      if (lift.boardingAt !== null && now >= lift.boardingAt) {
        lift.boardingAt = null;
        for (const [key, request] of hallCalls) {
          if (request.floor !== lift.position || lift.passengers.length >= 3) continue;
          sendEvent(`BOARDED:${lift.id.toUpperCase()}:${key}:${request.floor + 1}`);
          const slot = [0, 1, 2].find(index => !lift.passengers.some(person => person.slot === index));
          request.waiting.remove();
          request.timer.remove();
          scores.get(key).boardedAt = now;
          hallCalls.delete(key);
          const stillWaiting = [...hallCalls.values()].some(other => other.button === request.button);
          request.button.classList.toggle('queued', stillWaiting);
          request.button.setAttribute('aria-pressed', String(stillWaiting));
          // Spread the remaining waiting people along the floor.
          [...hallCalls.values()].filter(other => other.floor === request.floor)
            .forEach((other, index) => { other.waiting.style.left = `${5 + index * 4}%`; });
          const destinations = [0, 1, 2, 3].filter(floor => request.direction === 'up'
            ? floor > request.floor : floor < request.floor);
          lift.passengers.push({ id: key, slot, clothingColor: request.clothingColor, skinColor: request.skinColor, personStyle: request.personStyle, destination: null,
            suggestedDestination: destinations[Math.floor(random() * destinations.length)], fadeAt: null, exitAt: null });

        }
      }
      if (mode === 'random') {
        for (const person of lift.passengers) {
          if (person.destination !== null) continue;
          person.destination = person.suggestedDestination;
          enqueue(lift, person.destination);
        }
      }
      if (lift.state === 'open' && now >= lift.until) {
        lift.state = 'closing';
        lift.until = now + 450;
      } else if (lift.state === 'closing' && now >= lift.until) {
        lift.state = 'idle';
        lift.target = null;
      }
      if (lift.state === 'idle' && lift.queue.length) {
        lift.target = lift.queue[0];
        lift.state = 'moving';
      }
      if (lift.state === 'moving') {
        const distance = lift.target - lift.position;
        const step = delta * .65;
        if (Math.abs(distance) <= step) arrive(lift, now);
        else lift.position += Math.sign(distance) * step;
      }
      lift.cabin.style.bottom = `${lift.position * 25}%`;
      lift.cabin.classList.toggle('open', lift.state === 'open');
      lift.landingDoors.forEach((door, floor) => {
        const open = lift.state === 'open' && lift.position === floor;
        door.classList.toggle('open', open);
        door.setAttribute('aria-label', `Elevator ${lift.id.toUpperCase()} door at F${floor + 1}, ${open ? 'open' : 'closed'}`);
      });
      lift.slots.forEach((slot, index) => {
        const person = lift.passengers.find(passenger => passenger.slot === index);
        const hidden = !person || (person.fadeAt !== null && now >= person.fadeAt);
        slot.classList.toggle('slot-hidden', hidden);
        slot.setAttribute('aria-hidden', String(hidden));
        if (person) {
          applyAppearance(slot, person);
          slot.setAttribute('aria-label', `Passenger P${person.id} inside elevator ${lift.id.toUpperCase()}`);
        }
      });
      const text = lift.state === 'moving' ? `${lift.target > lift.position ? '↑' : '↓'} To F${lift.target + 1}` : `F${Math.round(lift.position) + 1} · ${lift.state === 'open' ? 'Doors open' : lift.state === 'closing' ? 'Doors closing' : 'Ready'}`;
      const status = `${text} | ${lift.passengers.length}/3 passengers`;
      if (lift.status.textContent !== status) lift.status.textContent = status;
      lift.buttons.forEach((button, floor) => {
        button.disabled = !lift.passengers.some(person => person.destination === null);
        button.classList.toggle('queued', lift.passengers.some(person => person.destination === floor));
        button.setAttribute('aria-pressed', String(lift.passengers.some(person => person.destination === floor)));
      });
    }
    updateCabinTimers(now);
    if (now - lastScoreRender >= 250) {
      lastScoreRender = now;
      renderScores(now);
    }
    if (serial.connected && now - lastTelemetry >= 1000) {
      lastTelemetry = now;
      lifts.forEach(lift => sendEvent(`STATE:${lift.id.toUpperCase()}:${(lift.position + 1).toFixed(2)}:${lift.state.toUpperCase()}:${lift.passengers.length}`));
    }
    requestAnimationFrame(frame);
  }
  function resetSimulation() {
    setMode('manual');
    hallCalls.forEach(request => {
      request.waiting.remove();
      request.timer.remove();
      request.button.classList.remove('queued');
      request.button.setAttribute('aria-pressed', 'false');
    });
    hallCalls.clear();
    scores.clear();
    lastScoreRender = -Infinity;
    renderScores(performance.now());
    personId = 0;
    randomState = Number(seedSelect.value);
    appearanceState = Number(seedSelect.value);
    previous = undefined;
    allLifts.forEach(lift => {
      Object.assign(lift, { position: 0, target: null, queue: [], state: 'idle', until: 0, passengers: [], boardingAt: null });
      lift.cabinTimers.forEach(timer => { timer.hidden = true; });
    });

  }
  const singleTab = document.getElementById('singleElevatorTab');
  const dualTab = document.getElementById('dualElevatorTab');
  function selectElevatorTab(count) {
    resetSimulation();
    lifts = allLifts.slice(0, count);
    const single = count === 1;
    document.querySelector('.scene').classList.toggle('single-elevator', single);
    document.querySelector('.scene').setAttribute('aria-label', `Interactive four-floor building with ${single ? 'one elevator' : 'two elevators'}`);
    document.querySelector('.roof small').textContent = single ? 'A' : 'A / B';
    allLifts[1].cabin.parentElement.hidden = single;
    allLifts[1].control.hidden = single;
    for (const [tab, selected] of [[singleTab, single], [dualTab, !single]]) {
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    }
    document.getElementById('elevatorExperiment').setAttribute('aria-labelledby', single ? singleTab.id : dualTab.id);
    sendEvent(`CONFIG:LIFTS:${count}`);
  }
  singleTab.onclick = () => selectElevatorTab(1);
  dualTab.onclick = () => selectElevatorTab(2);
  [singleTab, dualTab].forEach(tab => tab.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const target = event.key === 'Home' ? singleTab : event.key === 'End' ? dualTab : tab === singleTab ? dualTab : singleTab;
    target.click();
    target.focus();
  }));
  selectElevatorTab(1);

  requestAnimationFrame(frame);
})();
