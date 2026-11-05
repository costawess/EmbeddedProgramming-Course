window.DASHBOARD_FLAGS = Object.freeze({

  // ----------------------------------------
  // Simulations
  // ----------------------------------------
  functionsLab: true, // pensar numa nova forma de apresentar funcoes, talvez com um flowchart
  pullResistorsLab: true,
  uartLab: true,
  foundationsLab: true,
  conditionalsLab: true,
  adcLab: true,
  variablesLab: true,
  variableTypesLab: true,
  loopsLab: true,
  hysteresisLab: true,
  stateMachinesLab: true,
  timersLab: true,
  coffeeMachineSteps: true,
  i2cLab: true,

  // ----------------------------------------
  // not checked yet
  // ----------------------------------------
  interruptsLab: true,
  robotSortingLogicLab: false,
  buttonDebouncingLab: false,
  memoryLayoutLab: false,
  asciiCharLab: false,
  arduinoToFlowchart: false, // precisa de melhoras na conversao
  numberRepresentationLab: false, // precisa de melhoras na conversao

  // ----------------------------------------
  // Experiments
  // ----------------------------------------
  ticTacToe: true,
  maze: true,
  dualSevenSegment: true,
  dualElevator: true,
  trafficLights: true,

  // ----------------------------------------
  // not checked yet
  // ----------------------------------------
  gasWaterHeater: false,
  realTimeChallenge: false,
  kitchenTimer: true,
  intersectionController: false,
  coffeeMachine: true,
  heatingCoolingLab: false
});

// Under Construction badges: true shows the badge; false hides it.
// Uses the same feature keys as DASHBOARD_FLAGS, independently of visibility.
window.DASHBOARD_CONSTRUCTION_FLAGS = Object.freeze({
  functionsLab: false,
  pullResistorsLab: false,
  uartLab: false,
  foundationsLab: false,
  conditionalsLab: false,
  adcLab: false,
  variablesLab: false,
  variableTypesLab: false,
  loopsLab: false,
  hysteresisLab: false,
  stateMachinesLab: false,
  timersLab: false,
  coffeeMachineSteps: false,
  i2cLab: false,
  interruptsLab: false,
  robotSortingLogicLab: false,
  buttonDebouncingLab: false,
  memoryLayoutLab: false,
  asciiCharLab: false,
  arduinoToFlowchart: false,
  numberRepresentationLab: false,
  ticTacToe: false,
  maze: false,
  dualSevenSegment: false,
  dualElevator: true,
  trafficLights: false,
  gasWaterHeater: false,
  realTimeChallenge: false,
  kitchenTimer: false,
  intersectionController: false,
  coffeeMachine: false,
  heatingCoolingLab: false
});
