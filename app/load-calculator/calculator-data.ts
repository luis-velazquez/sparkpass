// Dwelling Unit Load Calculator Data
// Based on NEC Article 220 - Standard Method for Dwelling Units
// Key references: Table 220.42 (lighting demand), Table 430.248 (motor FLC), 220.50 (largest motor +25%)

export type DifficultyLevel = "beginner" | "intermediate";

export interface DifficultyOption {
  id: DifficultyLevel;
  name: string;
  description: string;
  features: string[];
}

export const DIFFICULTY_LEVELS: DifficultyOption[] = [
  {
    id: "beginner",
    name: "Beginner",
    description: "Learn with full guidance",
    features: [
      "Equipment highlighting",
      "Progress tracking (scratch-off)",
      "Quick reference tracking",
      "Step-by-step hints",
    ],
  },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Practice without visual aids",
    features: [
      "No equipment highlighting",
      "No progress tracking",
      "Reference available but not tracked",
      "Hints available on request",
    ],
  },
];

export interface Appliance {
  id: string;
  name: string;
  watts: number;
  isRequired?: boolean; // Part of standard calculation
  necReference: string;
  // Motor-specific fields
  horsepower?: number;
  motorVoltage?: 120 | 240; // User sees 120/240, we lookup 115/230 in table
  isMotor?: boolean;
}

// Table 430.248 - Single-Phase Motor Full-Load Currents
// Maps HP to Amps at 115V and 230V (table columns)
// User inputs 120V or 240V, we use 115V or 230V column for lookup
export const MOTOR_FLC_TABLE: Record<number, { v115: number; v230: number }> = {
  0.167: { v115: 4.4, v230: 2.2 },   // 1/6 HP
  0.25: { v115: 5.8, v230: 2.9 },    // 1/4 HP
  0.333: { v115: 7.2, v230: 3.6 },   // 1/3 HP
  0.5: { v115: 9.8, v230: 4.9 },     // 1/2 HP
  0.75: { v115: 13.8, v230: 6.9 },   // 3/4 HP
  1: { v115: 16, v230: 8 },          // 1 HP
  1.5: { v115: 20, v230: 10 },       // 1.5 HP
  2: { v115: 24, v230: 12 },         // 2 HP
  3: { v115: 34, v230: 17 },         // 3 HP
  5: { v115: 56, v230: 28 },         // 5 HP
  7.5: { v115: 80, v230: 40 },       // 7.5 HP
  10: { v115: 100, v230: 50 },       // 10 HP
};

// Helper to get FLC amps from HP and voltage
// User voltage is 120 or 240, we use 115 or 230 column
export function getMotorAmps(hp: number, userVoltage: 120 | 240): number {
  const tableColumn = userVoltage === 120 ? "v115" : "v230";
  const entry = MOTOR_FLC_TABLE[hp];
  if (!entry) {
    // Interpolate or use closest value
    const hpValues = Object.keys(MOTOR_FLC_TABLE).map(Number).sort((a, b) => a - b);
    const closest = hpValues.reduce((prev, curr) =>
      Math.abs(curr - hp) < Math.abs(prev - hp) ? curr : prev
    );
    const closestEntry = MOTOR_FLC_TABLE[closest];
    return closestEntry[tableColumn];
  }
  return entry[tableColumn];
}

// Helper to convert HP to Watts via Table 430.248
// Lookup uses 115/230 column, but multiply by actual voltage (120/240)
export function hpToWatts(hp: number, userVoltage: 120 | 240): number {
  const amps = getMotorAmps(hp, userVoltage);
  return Math.round(amps * userVoltage);
}

// Get all motor appliances from a scenario
export function getMotorAppliances(scenario: HouseScenario): Appliance[] {
  return scenario.appliances.filter(a => a.isMotor);
}

// Get the largest motor load in watts
export function getLargestMotorWatts(scenario: HouseScenario): number {
  const motors = getMotorAppliances(scenario);
  if (motors.length === 0) return 0;

  return Math.max(...motors.map(m => {
    if (m.horsepower && m.motorVoltage) {
      return hpToWatts(m.horsepower, m.motorVoltage);
    }
    return m.watts;
  }));
}

export interface HouseScenario {
  id: string;
  name: string;
  squareFootage: number;
  voltage: 120 | 240;
  appliances: Appliance[];
  description: string;
}

export interface CalculationStep {
  id: string;
  title: string;
  sparkyPrompt: string;
  hint: string | ((scenario: HouseScenario, previousAnswers: Record<string, number>) => string);
  necReference: string;
  inputType: "number" | "calculation" | "selection";
  formula?: string;
  expectedAnswer?: (scenario: HouseScenario, previousAnswers: Record<string, number>) => number;
  validateAnswer?: (userAnswer: number, expected: number) => boolean;
}

// IDs of appliances considered "fixed" (fastened in place) per NEC 220.53
// Includes water heater, disposal, pool pump, dishwasher, microwave, wine cooler
export const FIXED_APPLIANCE_IDS = ["water-heater", "dishwasher", "disposal", "microwave", "wine-cooler", "pool-pump"];

// Helper to get fixed appliances from a scenario
export function getFixedAppliances(scenario: HouseScenario) {
  return scenario.appliances.filter(a => FIXED_APPLIANCE_IDS.includes(a.id));
}

// Calculate total watts for fixed appliances (converting HP motors to watts)
export function getFixedAppliancesWatts(scenario: HouseScenario): number {
  const fixedAppliances = getFixedAppliances(scenario);
  return fixedAppliances.reduce((sum, a) => {
    if (a.isMotor && a.horsepower && a.motorVoltage) {
      return sum + hpToWatts(a.horsepower, a.motorVoltage);
    }
    return sum + a.watts;
  }, 0);
}

// Mapping of step IDs to the appliance IDs that are accounted for when that step is completed
export const STEP_APPLIANCE_MAP: Record<string, string[]> = {
  "convert-ac": [],  // Don't scratch off - we add the watts value instead
  "convert-disposal": [],
  "convert-pool-pump": [],
  "general-lighting": ["square-footage"],
  "small-appliance-laundry": ["small-appliance-1", "small-appliance-2", "laundry"],
  "lighting-demand": [],
  "hvac": ["ac", "heat"],  // Motors scratched off when used in HVAC comparison
  "fixed-appliances": ["water-heater", "dishwasher", "disposal", "microwave", "wine-cooler", "pool-pump"],
  "dryer": ["dryer"],
  "range": ["range", "cooktop"],
  "largest-motor-25": [],
  "total-va": [],
  "service-amps": [],
};

// Mapping of motor conversion step IDs to their appliance IDs
export const MOTOR_CONVERSION_STEPS: Record<string, string> = {
  "convert-ac": "ac",
  "convert-disposal": "disposal",
  "convert-pool-pump": "pool-pump",
};

// Get all appliance IDs that have been accounted for up to and including a given step index
export function getAccountedApplianceIds(stepIndex: number): Set<string> {
  const accountedIds = new Set<string>();

  for (let i = 0; i <= stepIndex; i++) {
    const stepId = CALCULATION_STEPS[i]?.id;
    if (stepId && STEP_APPLIANCE_MAP[stepId]) {
      STEP_APPLIANCE_MAP[stepId].forEach(id => accountedIds.add(id));
    }
  }

  return accountedIds;
}

// Step IDs that need to be summed for the total-va calculation
export const TOTAL_VA_COMPONENT_STEPS = [
  "lighting-demand",
  "hvac",
  "fixed-appliances",
  "dryer",
  "range",
  "largest-motor-25",
];

// Quick Reference items and when they're covered (step ID that completes coverage)
export const QUICK_REFERENCE_ITEMS = [
  { id: "motor-flc", label: "Motor FLC", value: "Table 430.248: HP → Amps (115V or 230V column)", coveredAfterStep: "convert-pool-pump" },
  { id: "general-lighting", label: "General Lighting", value: "3 VA/sq ft (220.12(J))", coveredAfterStep: "general-lighting" },
  { id: "small-appliance", label: "Small Appliance + Laundry", value: "2 circuits @ 1,500 VA + 1 laundry @ 1,500 VA (220.52)", coveredAfterStep: "small-appliance-laundry" },
  { id: "lighting-demand", label: "Lighting Demand", value: "First 3kVA: 100% | Remainder: 35% (Table 220.42)", coveredAfterStep: "lighting-demand" },
  { id: "hvac", label: "HVAC", value: "Larger of heating OR cooling (220.60)", coveredAfterStep: "hvac" },
  { id: "fixed-appliances", label: "Fixed Appliances", value: "75% demand if 4+ appliances (220.53)", coveredAfterStep: "fixed-appliances" },
  { id: "dryer", label: "Dryer", value: "5,000 VA minimum (220.54)", coveredAfterStep: "dryer" },
  { id: "range", label: "Range/Cooking", value: "Table 220.55: 8 kW for ≤12 kW range", coveredAfterStep: "range" },
  { id: "largest-motor", label: "Largest Motor", value: "Add 25% to largest motor (220.50)", coveredAfterStep: "largest-motor-25" },
  { id: "service-sizing", label: "Service Sizing", value: "Total VA ÷ Voltage (Table 310.12)", coveredAfterStep: "service-amps" },
];

// Check if a quick reference item has been covered based on current step
export function isQuickRefCovered(itemId: string, currentStepIndex: number): boolean {
  const item = QUICK_REFERENCE_ITEMS.find(i => i.id === itemId);
  if (!item) return false;

  const coveredStepIndex = CALCULATION_STEPS.findIndex(s => s.id === item.coveredAfterStep);
  return coveredStepIndex !== -1 && currentStepIndex > coveredStepIndex;
}

// Standard appliances that appear in all scenarios
const STANDARD_APPLIANCES: Appliance[] = [
  { id: "small-appliance-1", name: "Small Appliance Circuit 1", watts: 1500, isRequired: true, necReference: "220.52(A)" },
  { id: "small-appliance-2", name: "Small Appliance Circuit 2", watts: 1500, isRequired: true, necReference: "220.52(A)" },
  { id: "laundry", name: "Laundry Circuit", watts: 1500, isRequired: true, necReference: "220.52(B)" },
];

// Dwelling unit scenarios based on size
export const HOUSE_SCENARIOS: HouseScenario[] = [
  {
    id: "small",
    name: "Small Dwelling",
    squareFootage: 1200,
    voltage: 240,
    description: "A modest 1,200 sq ft dwelling unit with basic appliances",
    appliances: [
      ...STANDARD_APPLIANCES,
      { id: "range", name: "Electric Range", watts: 8000, necReference: "Table 220.55" },
      { id: "dryer", name: "Electric Dryer", watts: 5000, necReference: "220.54" },
      { id: "water-heater", name: "Water Heater", watts: 4500, necReference: "220.53" },
      { id: "dishwasher", name: "Dishwasher", watts: 1200, necReference: "220.53" },
      { id: "ac", name: "A/C (2 HP @ 240V)", watts: 0, horsepower: 2, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
      { id: "heat", name: "Electric Heat", watts: 10000, necReference: "220.60" },
    ],
  },
  {
    id: "medium",
    name: "Medium Dwelling",
    squareFootage: 2000,
    voltage: 240,
    description: "A comfortable 2,000 sq ft dwelling unit with modern appliances",
    appliances: [
      ...STANDARD_APPLIANCES,
      { id: "range", name: "Electric Range", watts: 12000, necReference: "Table 220.55" },
      { id: "dryer", name: "Electric Dryer", watts: 5500, necReference: "220.54" },
      { id: "water-heater", name: "Water Heater", watts: 5500, necReference: "220.53" },
      { id: "dishwasher", name: "Dishwasher", watts: 1500, necReference: "220.53" },
      { id: "disposal", name: "Disposal (1/2 HP @ 120V)", watts: 0, horsepower: 0.5, motorVoltage: 120, isMotor: true, necReference: "Table 430.248" },
      { id: "microwave", name: "Microwave (built-in)", watts: 1500, necReference: "220.53" },
      { id: "ac", name: "A/C (3 HP @ 240V)", watts: 0, horsepower: 3, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
      { id: "heat", name: "Electric Heat", watts: 15000, necReference: "220.60" },
      { id: "pool-pump", name: "Pool Pump (1 HP @ 240V)", watts: 0, horsepower: 1, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
    ],
  },
  {
    id: "large",
    name: "Large Dwelling",
    squareFootage: 3500,
    voltage: 240,
    description: "A spacious 3,500 sq ft dwelling unit with premium appliances",
    appliances: [
      ...STANDARD_APPLIANCES,
      { id: "range", name: "Electric Range (double oven)", watts: 16000, necReference: "Table 220.55" },
      { id: "cooktop", name: "Separate Cooktop", watts: 6000, necReference: "Table 220.55" },
      { id: "dryer", name: "Electric Dryer", watts: 6000, necReference: "220.54" },
      { id: "water-heater", name: "Water Heater (large)", watts: 6000, necReference: "220.53" },
      { id: "dishwasher", name: "Dishwasher", watts: 1800, necReference: "220.53" },
      { id: "disposal", name: "Disposal (3/4 HP @ 120V)", watts: 0, horsepower: 0.75, motorVoltage: 120, isMotor: true, necReference: "Table 430.248" },
      { id: "microwave", name: "Microwave (built-in)", watts: 1800, necReference: "220.53" },
      { id: "wine-cooler", name: "Wine Cooler", watts: 500, necReference: "220.53" },
      { id: "ac", name: "A/C (5 HP @ 240V)", watts: 0, horsepower: 5, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
      { id: "heat", name: "Electric Heat (zoned)", watts: 25000, necReference: "220.60" },
      { id: "pool-pump", name: "Pool Pump (1.5 HP @ 240V)", watts: 0, horsepower: 1.5, motorVoltage: 240, isMotor: true, necReference: "Table 430.248" },
      { id: "hot-tub", name: "Hot Tub/Spa", watts: 6000, necReference: "680.44" },
      { id: "ev-charger", name: "EV Charger", watts: 7200, necReference: "625.41" },
    ],
  },
];

// Calculation steps following NEC Article 220 standard method
export const CALCULATION_STEPS: CalculationStep[] = [
  // Step 1: Convert A/C Motor
  {
    id: "convert-ac",
    title: "Convert A/C Motor (HP to Watts)",
    sparkyPrompt: "Before we calculate the service load, we need to convert all motors from horsepower (HP) to watts. We'll use Table 430.248 to find the full-load amps, then multiply by the voltage. Let's start with the A/C unit. Find the HP and voltage on the equipment card, look up the amps in Table 430.248, and calculate the watts.",
    hint: (scenario) => {
      const ac = scenario.appliances.find(a => a.id === "ac");
      if (!ac?.horsepower || !ac?.motorVoltage) return "No A/C motor in this dwelling - enter 0.";

      const tableColumn = ac.motorVoltage === 120 ? "115V" : "230V";
      const amps = getMotorAmps(ac.horsepower, ac.motorVoltage);
      const watts = hpToWatts(ac.horsepower, ac.motorVoltage);

      return `A/C: ${ac.horsepower} HP @ ${ac.motorVoltage}V\n\nStep 1: Find amps in Table 430.248 (${tableColumn} column)\n${ac.horsepower} HP = ${amps} Amps\n\nStep 2: Calculate watts\n${amps} Amps × ${ac.motorVoltage}V = ${watts.toLocaleString()} Watts`;
    },
    necReference: "NEC Table 430.248",
    inputType: "calculation",
    formula: "Table 430.248 Amps × Voltage",
    expectedAnswer: (scenario) => {
      const ac = scenario.appliances.find(a => a.id === "ac");
      if (!ac?.horsepower || !ac?.motorVoltage) return 0;
      return hpToWatts(ac.horsepower, ac.motorVoltage);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 2: Convert Disposal Motor
  {
    id: "convert-disposal",
    title: "Convert Disposal Motor (HP to Watts)",
    sparkyPrompt: "Now let's convert the disposal motor. If this dwelling has a disposal, find its HP and voltage, look up the amps in Table 430.248, and calculate the watts. If there's no disposal, enter 0.",
    hint: (scenario) => {
      const disposal = scenario.appliances.find(a => a.id === "disposal");
      if (!disposal?.horsepower || !disposal?.motorVoltage) return "No disposal motor in this dwelling - enter 0.";

      const tableColumn = disposal.motorVoltage === 120 ? "115V" : "230V";
      const amps = getMotorAmps(disposal.horsepower, disposal.motorVoltage);
      const watts = hpToWatts(disposal.horsepower, disposal.motorVoltage);

      return `Disposal: ${disposal.horsepower} HP @ ${disposal.motorVoltage}V\n\nStep 1: Find amps in Table 430.248 (${tableColumn} column)\n${disposal.horsepower} HP = ${amps} Amps\n\nStep 2: Calculate watts\n${amps} Amps × ${disposal.motorVoltage}V = ${watts.toLocaleString()} Watts`;
    },
    necReference: "NEC Table 430.248",
    inputType: "calculation",
    formula: "Table 430.248 Amps × Voltage (or 0 if none)",
    expectedAnswer: (scenario) => {
      const disposal = scenario.appliances.find(a => a.id === "disposal");
      if (!disposal?.horsepower || !disposal?.motorVoltage) return 0;
      return hpToWatts(disposal.horsepower, disposal.motorVoltage);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 3: Convert Pool Pump Motor
  {
    id: "convert-pool-pump",
    title: "Convert Pool Pump Motor (HP to Watts)",
    sparkyPrompt: "If this dwelling has a pool pump, convert it the same way. Find the HP and voltage, look up the amps in Table 430.248, and calculate the watts. If there's no pool pump, enter 0.",
    hint: (scenario) => {
      const pump = scenario.appliances.find(a => a.id === "pool-pump");
      if (!pump?.horsepower || !pump?.motorVoltage) return "No pool pump motor in this dwelling - enter 0.";

      const tableColumn = pump.motorVoltage === 120 ? "115V" : "230V";
      const amps = getMotorAmps(pump.horsepower, pump.motorVoltage);
      const watts = hpToWatts(pump.horsepower, pump.motorVoltage);

      return `Pool Pump: ${pump.horsepower} HP @ ${pump.motorVoltage}V\n\nStep 1: Find amps in Table 430.248 (${tableColumn} column)\n${pump.horsepower} HP = ${amps} Amps\n\nStep 2: Calculate watts\n${amps} Amps × ${pump.motorVoltage}V = ${watts.toLocaleString()} Watts`;
    },
    necReference: "NEC Table 430.248",
    inputType: "calculation",
    formula: "Table 430.248 Amps × Voltage (or 0 if none)",
    expectedAnswer: (scenario) => {
      const pump = scenario.appliances.find(a => a.id === "pool-pump");
      if (!pump?.horsepower || !pump?.motorVoltage) return 0;
      return hpToWatts(pump.horsepower, pump.motorVoltage);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 4: General Lighting (220.12)
  {
    id: "general-lighting",
    title: "General Lighting Load",
    sparkyPrompt: "Great! Now that we've converted all the motors, let's calculate the service load. Per 220.12(J), we use 3 VA per square foot for dwelling units. What's the general lighting load?",
    hint: "Multiply the square footage by 3 VA/sq ft",
    necReference: "NEC 220.12(J)",
    inputType: "calculation",
    formula: "Square Footage × 3 VA/sq ft",
    expectedAnswer: (scenario) => scenario.squareFootage * 3,
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 10,
  },
  // Step 5: Small Appliance + Laundry (220.52)
  {
    id: "small-appliance-laundry",
    title: "Small Appliance & Laundry Circuits",
    sparkyPrompt: "Now add the small appliance and laundry circuits. Per 220.52, we need 2 small appliance circuits at 1,500 VA each, plus 1 laundry circuit at 1,500 VA. What's the total?",
    hint: "Small appliance: 2 × 1,500 VA = 3,000 VA\nLaundry: 1 × 1,500 VA\nTotal: 3,000 + 1,500 = 4,500 VA",
    necReference: "NEC 220.52",
    inputType: "calculation",
    formula: "(2 × 1,500 VA) + 1,500 VA",
    expectedAnswer: () => 4500,
    validateAnswer: (user, expected) => user === expected,
  },
  // Step 6: Apply Lighting Demand (Table 220.42)
  {
    id: "lighting-demand",
    title: "Apply Lighting Demand Factor",
    sparkyPrompt: "Now apply the demand factors from Table 220.42 to the general lighting, small appliance, and laundry loads combined. First 3,000 VA at 100%, remainder at 35%. What's the demand load?",
    hint: (scenario, prev) => {
      const lighting = prev["general-lighting"] || scenario.squareFootage * 3;
      const smallAppLaundry = 4500;
      const subtotal = lighting + smallAppLaundry;
      const remainder = subtotal - 3000;
      const demandRemainder = Math.round(remainder * 0.35);
      const total = 3000 + demandRemainder;
      return `Subtotal: ${lighting.toLocaleString()} + 4,500 = ${subtotal.toLocaleString()} VA\n\nFirst 3,000 VA @ 100% = 3,000 VA\nRemainder: ${subtotal.toLocaleString()} - 3,000 = ${remainder.toLocaleString()} VA\n${remainder.toLocaleString()} × 35% = ${demandRemainder.toLocaleString()} VA\n\nDemand Load: 3,000 + ${demandRemainder.toLocaleString()} = ${total.toLocaleString()} VA`;
    },
    necReference: "NEC Table 220.42",
    inputType: "calculation",
    formula: "3,000 + ((Subtotal - 3,000) × 35%)",
    expectedAnswer: (scenario, prev) => {
      const lighting = prev["general-lighting"] || scenario.squareFootage * 3;
      const subtotal = lighting + 4500;
      const remainder = Math.max(0, subtotal - 3000);
      return 3000 + Math.round(remainder * 0.35);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 7: HVAC - Larger of Heat or A/C (220.60)
  {
    id: "hvac",
    title: "HVAC Load (220.60)",
    sparkyPrompt: "Per 220.60, heating and cooling are non-coincident loads - we use the LARGER of the two. You already converted the A/C motor to watts. Compare it to the heating load and enter the larger value.",
    hint: (scenario, prev) => {
      const heat = scenario.appliances.find(a => a.id === "heat");
      const heatWatts = heat?.watts || 0;
      const acWatts = prev["convert-ac"] || 0;

      const larger = Math.max(heatWatts, acWatts);
      const largerName = heatWatts >= acWatts ? "Heating" : "A/C";

      return `Heating: ${heatWatts.toLocaleString()} VA\nA/C (from Step 1): ${acWatts.toLocaleString()} VA\n\n${largerName} is larger: ${larger.toLocaleString()} VA`;
    },
    necReference: "NEC 220.60",
    inputType: "calculation",
    formula: "Larger of: Heat OR A/C",
    expectedAnswer: (scenario, prev) => {
      const heat = scenario.appliances.find(a => a.id === "heat");
      const heatWatts = heat?.watts || 0;
      const acWatts = prev["convert-ac"] || 0;

      return Math.max(heatWatts, acWatts);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 8: Fixed Appliances (220.53)
  {
    id: "fixed-appliances",
    title: "Fixed Appliances (220.53)",
    sparkyPrompt: "Now calculate the fixed appliances load. This includes water heater, dishwasher, disposal, microwave, wine cooler, pool pump, etc. Use the motor values you already converted. If you have 4 or more fixed appliances, apply a 75% demand factor.",
    hint: (scenario, prev) => {
      const fixedAppliances = getFixedAppliances(scenario);
      if (fixedAppliances.length === 0) return "No fixed appliances - enter 0.";

      let applianceList = "";
      let total = 0;

      fixedAppliances.forEach(a => {
        if (a.id === "disposal") {
          const watts = prev["convert-disposal"] || 0;
          applianceList += `• ${a.name}: ${watts.toLocaleString()} VA (from Step 2)\n`;
          total += watts;
        } else if (a.id === "pool-pump") {
          const watts = prev["convert-pool-pump"] || 0;
          applianceList += `• ${a.name}: ${watts.toLocaleString()} VA (from Step 3)\n`;
          total += watts;
        } else {
          applianceList += `• ${a.name}: ${a.watts.toLocaleString()} VA\n`;
          total += a.watts;
        }
      });

      const hasDemandFactor = fixedAppliances.length >= 4;
      let hint = `Fixed appliances (${fixedAppliances.length}):\n${applianceList}\nTotal: ${total.toLocaleString()} VA`;

      if (hasDemandFactor) {
        const demandTotal = Math.round(total * 0.75);
        hint += `\n\nWith ${fixedAppliances.length} appliances, apply 75% demand:\n${total.toLocaleString()} × 75% = ${demandTotal.toLocaleString()} VA`;
      }

      return hint;
    },
    necReference: "NEC 220.53",
    inputType: "calculation",
    formula: "Sum of fixed appliances (× 75% if 4 or more)",
    expectedAnswer: (scenario, prev) => {
      const fixedAppliances = getFixedAppliances(scenario);
      let total = 0;

      fixedAppliances.forEach(a => {
        if (a.id === "disposal") {
          total += prev["convert-disposal"] || 0;
        } else if (a.id === "pool-pump") {
          total += prev["convert-pool-pump"] || 0;
        } else {
          total += a.watts;
        }
      });

      return fixedAppliances.length >= 4 ? Math.round(total * 0.75) : total;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 9: Dryer (220.54)
  {
    id: "dryer",
    title: "Electric Dryer (220.54)",
    sparkyPrompt: "What's the electric dryer load? Per 220.54, use the nameplate rating or 5,000 VA minimum, whichever is larger.",
    hint: "Use the dryer watts from equipment list, or 5,000 VA minimum if less",
    necReference: "NEC 220.54",
    inputType: "calculation",
    formula: "Nameplate rating or 5,000 VA minimum",
    expectedAnswer: (scenario) => {
      const dryer = scenario.appliances.find(a => a.id === "dryer");
      return Math.max(dryer?.watts || 0, 5000);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 10: Range/Cooking (Table 220.55)
  {
    id: "range",
    title: "Range/Cooking Equipment (Table 220.55)",
    sparkyPrompt: "Now for cooking equipment. Use Table 220.55 Column C. For a single range 12 kW or less, use 8 kW. For larger ranges, add 5% for each kW over 12 kW.",
    hint: (scenario) => {
      const range = scenario.appliances.find(a => a.id === "range");
      const cooktop = scenario.appliances.find(a => a.id === "cooktop");
      let totalWatts = (range?.watts || 0) + (cooktop?.watts || 0);

      if (totalWatts === 0) return "No cooking equipment - enter 0.";

      let hint = "";
      if (range && cooktop) {
        hint = `Range: ${range.watts.toLocaleString()} W\nCooktop: ${cooktop.watts.toLocaleString()} W\nCombined: ${totalWatts.toLocaleString()} W\n\n`;
      } else if (range) {
        hint = `Range: ${range.watts.toLocaleString()} W\n\n`;
      }

      if (totalWatts <= 12000) {
        hint += `Table 220.55 Column C: 8,000 VA for ranges ≤12 kW`;
      } else {
        const overKW = Math.ceil((totalWatts - 12000) / 1000);
        const demand = Math.round(8000 * (1 + (overKW * 0.05)));
        hint += `Range exceeds 12 kW by ${overKW} kW\n8,000 + (${overKW} × 5%) = 8,000 × ${(1 + overKW * 0.05).toFixed(2)} = ${demand.toLocaleString()} VA`;
      }

      return hint;
    },
    necReference: "NEC Table 220.55",
    inputType: "calculation",
    formula: "Table 220.55 Column C (8 kW for ranges ≤12 kW)",
    expectedAnswer: (scenario) => {
      const range = scenario.appliances.find(a => a.id === "range");
      const cooktop = scenario.appliances.find(a => a.id === "cooktop");
      let rangeWatts = (range?.watts || 0) + (cooktop?.watts || 0);

      if (rangeWatts === 0) return 0;
      if (rangeWatts <= 12000) return 8000;

      const overKW = Math.ceil((rangeWatts - 12000) / 1000);
      return Math.round(8000 * (1 + (overKW * 0.05)));
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 200,
  },
  // Step 11: Largest Motor +25% (220.50)
  {
    id: "largest-motor-25",
    title: "Largest Motor +25% (220.50)",
    sparkyPrompt: "Per 220.50, we must add 25% of the largest motor to the calculation. Look at the motor values you converted earlier, find the largest one, and calculate 25% of its load.",
    hint: (scenario, prev) => {
      const motorLoads: { name: string; watts: number }[] = [];

      const acWatts = prev["convert-ac"] || 0;
      const disposalWatts = prev["convert-disposal"] || 0;
      const poolPumpWatts = prev["convert-pool-pump"] || 0;

      if (acWatts > 0) motorLoads.push({ name: "A/C", watts: acWatts });
      if (disposalWatts > 0) motorLoads.push({ name: "Disposal", watts: disposalWatts });
      if (poolPumpWatts > 0) motorLoads.push({ name: "Pool Pump", watts: poolPumpWatts });

      if (motorLoads.length === 0) return "No motors - enter 0.";

      let motorList = motorLoads.map(m => `• ${m.name}: ${m.watts.toLocaleString()} VA`).join("\n");

      const largest = motorLoads.reduce((max, m) => m.watts > max.watts ? m : max);
      const addition = Math.round(largest.watts * 0.25);

      return `Your converted motors:\n${motorList}\n\nLargest: ${largest.name} at ${largest.watts.toLocaleString()} VA\n25% of ${largest.watts.toLocaleString()} = ${addition.toLocaleString()} VA`;
    },
    necReference: "NEC 220.50",
    inputType: "calculation",
    formula: "Largest motor VA × 25%",
    expectedAnswer: (scenario, prev) => {
      const acWatts = prev["convert-ac"] || 0;
      const disposalWatts = prev["convert-disposal"] || 0;
      const poolPumpWatts = prev["convert-pool-pump"] || 0;

      const largest = Math.max(acWatts, disposalWatts, poolPumpWatts);
      return Math.round(largest * 0.25);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 12: Total VA
  {
    id: "total-va",
    title: "Total Calculated Load",
    sparkyPrompt: "Now add up ALL the loads: lighting demand, HVAC, fixed appliances, dryer, range, and the 25% motor addition. What's the total VA?",
    hint: (scenario, prev) => {
      const lightingDemand = prev["lighting-demand"] || 0;
      const hvac = prev["hvac"] || 0;
      const fixed = prev["fixed-appliances"] || 0;
      const dryer = prev["dryer"] || 0;
      const range = prev["range"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;

      // Check for other loads (hot tub, EV charger)
      const otherLoads = scenario.appliances.filter(a =>
        ["hot-tub", "ev-charger"].includes(a.id)
      );
      const otherTotal = otherLoads.reduce((sum, a) => sum + a.watts, 0);

      let hint = `Lighting Demand: ${lightingDemand.toLocaleString()} VA\n`;
      hint += `HVAC: ${hvac.toLocaleString()} VA\n`;
      hint += `Fixed Appliances: ${fixed.toLocaleString()} VA\n`;
      hint += `Dryer: ${dryer.toLocaleString()} VA\n`;
      hint += `Range: ${range.toLocaleString()} VA\n`;
      hint += `Largest Motor 25%: ${motor25.toLocaleString()} VA\n`;

      if (otherTotal > 0) {
        hint += `Other Loads: ${otherTotal.toLocaleString()} VA\n`;
        otherLoads.forEach(a => {
          hint += `  • ${a.name}: ${a.watts.toLocaleString()} VA\n`;
        });
      }

      const total = lightingDemand + hvac + fixed + dryer + range + motor25 + otherTotal;
      hint += `\nTotal: ${total.toLocaleString()} VA`;

      return hint;
    },
    necReference: "NEC 220.40",
    inputType: "calculation",
    formula: "Sum of all calculated loads",
    expectedAnswer: (scenario, prev) => {
      const lightingDemand = prev["lighting-demand"] || 0;
      const hvac = prev["hvac"] || 0;
      const fixed = prev["fixed-appliances"] || 0;
      const dryer = prev["dryer"] || 0;
      const range = prev["range"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;

      // Add other loads (hot tub, EV charger)
      const otherLoads = scenario.appliances.filter(a =>
        ["hot-tub", "ev-charger"].includes(a.id)
      );
      const otherTotal = otherLoads.reduce((sum, a) => sum + a.watts, 0);

      return lightingDemand + hvac + fixed + dryer + range + motor25 + otherTotal;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 500,
  },
  // Step 13: Service Amps
  {
    id: "service-amps",
    title: "Service Size (Table 310.12)",
    sparkyPrompt: "Final step! Divide the total VA by 240V to get the minimum amperage. Then round up to the next standard service size (100A, 125A, 150A, 200A, 225A, 400A).",
    hint: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = totalVA / 240;
      const standardSizes = [100, 125, 150, 200, 225, 400];
      const serviceSize = standardSizes.find(size => size >= amps) || 400;

      return `${totalVA.toLocaleString()} VA ÷ 240V = ${amps.toFixed(1)} Amps\n\nRound up to next standard size: ${serviceSize}A`;
    },
    necReference: "NEC Table 310.12",
    inputType: "calculation",
    formula: "Total VA ÷ 240V → next standard size",
    expectedAnswer: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = totalVA / 240;
      const standardSizes = [100, 125, 150, 200, 225, 400];
      return standardSizes.find(size => size >= amps) || 400;
    },
    validateAnswer: (user, expected) => {
      const standardSizes = [100, 125, 150, 200, 225, 400];
      return standardSizes.includes(user) && user >= expected - 25;
    },
  },
];

// Sparky messages for different situations
export const SPARKY_MESSAGES = {
  welcome: "Hey there! Ready to learn dwelling unit load calculations? These rules from NEC Article 220 are essential for the Master Electrician exam. We'll use Table 220.42 for demand factors, Table 430.248 for motor conversions, and 220.50 for the largest motor rule. Let's go!",
  selectScenario: "Pick a dwelling unit size. Bigger homes have more equipment and motors, making the calculation more complex. I recommend starting with a smaller home if this is your first time!",
  correct: [
    "Excellent work! That's exactly right!",
    "Perfect! You're getting the hang of this!",
    "That's correct! Great job with the math!",
    "Right on the money! You really know your stuff!",
    "Correct! The exam will have questions just like this!",
  ],
  incorrect: [
    "Not quite, but don't worry - this is a learning moment!",
    "Close, but let's look at this again.",
    "That's not right, but you're learning! Check the hint.",
    "Almost there! Let me help you understand.",
  ],
  encouragement: [
    "You're doing great! Keep going!",
    "Nice progress! Just a few more steps!",
    "You've got this! Remember, practice makes perfect!",
  ],
  complete: "Outstanding work! You've completed the entire load calculation! This is exactly how you'll approach these problems on the exam. The key is understanding each step and knowing which NEC reference to use.",
};

export function getRandomMessage(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}
