// Dwelling Unit Load Calculator Data
// Based on NEC Article 220 - Standard Method for Dwelling Units
// Key references: Table 220.45 (lighting demand), Table 430.248 (motor FLC), 220.50 (largest motor +25%)

// Import conductor/GEC sizing from commercial calculator data
import {
  getConductorSize,
  getGECSize,
  CONDUCTOR_TABLE,
} from "./commercial-calculator-data";
export { getConductorSize, getGECSize, CONDUCTOR_TABLE };

// ─── NEC Table 310.12: Single-Phase Dwelling Services and Feeders (120/240V) ──
// Maps service rating amps directly to conductor size (83% already factored in)
interface DwellingConductorEntry {
  serviceRatingAmps: number;
  copper: string;
  aluminum: string;
}

export const DWELLING_CONDUCTOR_TABLE: DwellingConductorEntry[] = [
  { serviceRatingAmps: 100, copper: "4",   aluminum: "2" },
  { serviceRatingAmps: 110, copper: "3",   aluminum: "1" },
  { serviceRatingAmps: 125, copper: "2",   aluminum: "1/0" },
  { serviceRatingAmps: 150, copper: "1",   aluminum: "2/0" },
  { serviceRatingAmps: 175, copper: "1/0", aluminum: "3/0" },
  { serviceRatingAmps: 200, copper: "2/0", aluminum: "4/0" },
  { serviceRatingAmps: 225, copper: "3/0", aluminum: "250" },
  { serviceRatingAmps: 250, copper: "4/0", aluminum: "300" },
  { serviceRatingAmps: 300, copper: "250", aluminum: "350" },
  { serviceRatingAmps: 350, copper: "350", aluminum: "500" },
  { serviceRatingAmps: 400, copper: "400", aluminum: "600" },
];

// Look up copper conductor size for a dwelling unit service rating
export function getDwellingConductorSize(serviceAmps: number): string {
  const entry = DWELLING_CONDUCTOR_TABLE.find(e => e.serviceRatingAmps >= serviceAmps);
  return entry ? entry.copper : DWELLING_CONDUCTOR_TABLE[DWELLING_CONDUCTOR_TABLE.length - 1].copper;
}

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
  storedAnswer?: (scenario: HouseScenario, previousAnswers: Record<string, number>, userAnswer: number) => number;
  parseInput?: (input: string) => number;
  shouldShow?: (scenario: HouseScenario) => boolean;
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
  "service-conductor": [],
  "gec-size": [],
};

// Mapping of motor conversion step IDs to their appliance IDs
export const MOTOR_CONVERSION_STEPS: Record<string, string> = {
  "convert-ac": "ac",
  "convert-disposal": "disposal",
  "convert-pool-pump": "pool-pump",
};

// Get all appliance IDs that have been accounted for up to and including a given step index
export function getAccountedApplianceIds(stepIndex: number, steps: CalculationStep[] = CALCULATION_STEPS): Set<string> {
  const accountedIds = new Set<string>();

  for (let i = 0; i <= stepIndex; i++) {
    const stepId = steps[i]?.id;
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
  { id: "general-lighting", label: "General Lighting", value: "3 VA/sq ft (220.41)", coveredAfterStep: "general-lighting" },
  { id: "small-appliance", label: "Small Appliance + Laundry", value: "2 circuits @ 1,500 VA + 1 laundry @ 1,500 VA (220.52)", coveredAfterStep: "small-appliance-laundry" },
  { id: "lighting-demand", label: "Lighting Demand", value: "First 3kVA: 100% | 3,001–120kVA: 35% | Over 120kVA: 25% (Table 220.45)", coveredAfterStep: "lighting-demand" },
  { id: "hvac", label: "HVAC", value: "Larger of heating OR cooling (220.60)", coveredAfterStep: "hvac" },
  { id: "fixed-appliances", label: "Fixed Appliances", value: "75% demand if 4+ appliances (220.53)", coveredAfterStep: "fixed-appliances" },
  { id: "dryer", label: "Dryer", value: "5,000 VA minimum (220.54)", coveredAfterStep: "dryer" },
  { id: "range", label: "Range/Cooking", value: "Table 220.55: Col A/B (<8¾ kW) = 80%, Col C (≥8¾ kW) = 8 kW", coveredAfterStep: "range" },
  { id: "largest-motor", label: "Largest Motor", value: "Add 25% to largest motor (220.50)", coveredAfterStep: "largest-motor-25" },
  { id: "service-sizing", label: "Service Sizing", value: "Total VA ÷ Voltage (Table 310.12)", coveredAfterStep: "service-amps" },
  { id: "conductor", label: "Conductor Sizing", value: "Table 310.12(A): Copper conductor ampacity", coveredAfterStep: "service-conductor" },
  { id: "gec", label: "GEC Sizing", value: "Table 250.66: Based on service conductor size", coveredAfterStep: "gec-size" },
];

// Check if a quick reference item has been covered based on current step
export function isQuickRefCovered(itemId: string, currentStepIndex: number, steps: CalculationStep[] = CALCULATION_STEPS): boolean {
  const item = QUICK_REFERENCE_ITEMS.find(i => i.id === itemId);
  if (!item) return false;

  const coveredStepIndex = steps.findIndex(s => s.id === item.coveredAfterStep);
  if (coveredStepIndex !== -1) {
    return currentStepIndex > coveredStepIndex;
  }

  // Step was filtered out — find the next step in the original order that exists in filtered steps
  const originalIndex = CALCULATION_STEPS.findIndex(s => s.id === item.coveredAfterStep);
  if (originalIndex === -1) return false;

  for (let i = originalIndex + 1; i < CALCULATION_STEPS.length; i++) {
    const filteredIndex = steps.findIndex(s => s.id === CALCULATION_STEPS[i].id);
    if (filteredIndex !== -1) {
      return currentStepIndex >= filteredIndex;
    }
  }

  return false;
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
      { id: "range", name: "Electric Range", watts: 9600, necReference: "Table 220.55" },
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
    shouldShow: (scenario) => !!scenario.appliances.find(a => a.id === "disposal"),
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
    shouldShow: (scenario) => !!scenario.appliances.find(a => a.id === "pool-pump"),
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
  // Step 4: General Lighting (220.41)
  {
    id: "general-lighting",
    title: "General Lighting Load",
    sparkyPrompt: "Great! Now that we've converted all the motors, let's calculate the service load. Per 220.41, we use 3 VA per square foot for dwelling units. What's the general lighting load?",
    hint: "Multiply the square footage by 3 VA/sq ft",
    necReference: "NEC 220.41",
    inputType: "calculation",
    formula: "Square Footage × 3 VA/sq ft",
    expectedAnswer: (scenario) => scenario.squareFootage * 3,
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 10,
  },
  // Step 5: Small Appliance + Laundry (220.52)
  {
    id: "small-appliance-laundry",
    title: "Small Appliance & Laundry Circuits",
    sparkyPrompt: "Now add the small appliance and laundry circuits. Per 220.52, we need 2 small appliance circuits at 1,500 VA each, plus 1 laundry circuit at 1,500 VA. Note — 220.52 permits these loads to be included with the general lighting load, which is why we'll combine them all when applying demand factors in the next step. What's the total?",
    hint: "Small appliance: 2 × 1,500 VA = 3,000 VA\nLaundry: 1 × 1,500 VA\nTotal: 3,000 + 1,500 = 4,500 VA",
    necReference: "NEC 220.52",
    inputType: "calculation",
    formula: "(2 × 1,500 VA) + 1,500 VA",
    expectedAnswer: () => 4500,
    validateAnswer: (user, expected) => user === expected,
  },
  // Step 6: Apply Lighting Demand (Table 220.45)
  {
    id: "lighting-demand",
    title: "Apply Lighting Demand Factor",
    sparkyPrompt: "Now apply the demand factors from Table 220.45 to the general lighting, small appliance, and laundry loads combined. First 3,000 VA at 100%, from 3,001 to 120,000 VA at 35%, and any remainder over 120,000 VA at 25%. What's the demand load?",
    hint: (scenario, prev) => {
      const lighting = prev["general-lighting"] || scenario.squareFootage * 3;
      const smallAppLaundry = 4500;
      const subtotal = lighting + smallAppLaundry;

      let demand = 0;
      let hint = `Subtotal: ${lighting.toLocaleString()} + 4,500 = ${subtotal.toLocaleString()} VA\n\n`;
      hint += `Table 220.45 Demand Factors:\n`;

      // Tier 1: First 3,000 VA @ 100%
      const tier1 = Math.min(subtotal, 3000);
      const tier1Demand = tier1;
      hint += `First 3,000 VA @ 100% = ${tier1Demand.toLocaleString()} VA\n`;
      demand += tier1Demand;

      if (subtotal > 3000) {
        // Tier 2: 3,001 to 120,000 VA @ 35%
        const tier2 = Math.min(subtotal - 3000, 117000);
        const tier2Demand = Math.round(tier2 * 0.35);
        hint += `Next ${tier2.toLocaleString()} VA @ 35% = ${tier2Demand.toLocaleString()} VA\n`;
        demand += tier2Demand;
      }

      if (subtotal > 120000) {
        // Tier 3: Over 120,000 VA @ 25%
        const tier3 = subtotal - 120000;
        const tier3Demand = Math.round(tier3 * 0.25);
        hint += `Remainder ${tier3.toLocaleString()} VA @ 25% = ${tier3Demand.toLocaleString()} VA\n`;
        demand += tier3Demand;
      }

      hint += `\nDemand Load: ${demand.toLocaleString()} VA`;
      return hint;
    },
    necReference: "NEC Table 220.45",
    inputType: "calculation",
    formula: "3,000 + (next 117,000 × 35%) + (over 120,000 × 25%)",
    expectedAnswer: (scenario, prev) => {
      const lighting = prev["general-lighting"] || scenario.squareFootage * 3;
      const subtotal = lighting + 4500;

      let demand = Math.min(subtotal, 3000); // First 3,000 @ 100%
      if (subtotal > 3000) {
        demand += Math.round(Math.min(subtotal - 3000, 117000) * 0.35); // 3,001–120,000 @ 35%
      }
      if (subtotal > 120000) {
        demand += Math.round((subtotal - 120000) * 0.25); // Over 120,000 @ 25%
      }
      return demand;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 7: HVAC - Larger of Heat or A/C (220.60)
  {
    id: "hvac",
    title: "HVAC Load (220.60)",
    sparkyPrompt: "Per 220.60, heating and cooling are non-coincident loads — we use the LARGER of the two. But there's a catch: since the A/C is a motor load, 220.60 requires us to use 125% of the A/C load for this comparison. Multiply your A/C watts by 1.25, then compare to the heating load and enter the larger value.",
    hint: (scenario, prev) => {
      const heat = scenario.appliances.find(a => a.id === "heat");
      const heatWatts = heat?.watts || 0;
      const acWatts = prev["convert-ac"] || 0;
      const acAdjusted = Math.round(acWatts * 1.25);

      const larger = Math.max(heatWatts, acAdjusted);
      const largerName = heatWatts >= acAdjusted ? "Heating" : "A/C (125%)";

      return `A/C (from Step 1): ${acWatts.toLocaleString()} VA × 125% = ${acAdjusted.toLocaleString()} VA\nHeating: ${heatWatts.toLocaleString()} VA\n\n${largerName} is larger: ${larger.toLocaleString()} VA`;
    },
    necReference: "NEC 220.60",
    inputType: "calculation",
    formula: "Larger of: Heat OR (A/C × 125%)",
    expectedAnswer: (scenario, prev) => {
      const heat = scenario.appliances.find(a => a.id === "heat");
      const heatWatts = heat?.watts || 0;
      const acWatts = prev["convert-ac"] || 0;
      const acAdjusted = Math.round(acWatts * 1.25);

      return Math.max(heatWatts, acAdjusted);
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
    sparkyPrompt: "Now for cooking equipment using Table 220.55. First, determine which column applies based on the appliance rating: Column A (<3½ kW) or Column B (3½–8¾ kW) use 80% of nameplate. Column C (≥8¾ kW) uses 8 kW max demand for a single range ≤12 kW, with a 5% increase per kW over 12 kW. If there's a separate cooktop and oven, combine them and use Column C per Note 3.",
    hint: (scenario) => {
      const range = scenario.appliances.find(a => a.id === "range");
      const cooktop = scenario.appliances.find(a => a.id === "cooktop");

      if (!range && !cooktop) return "No cooking equipment — enter 0.";

      let hint = "";

      // Note 3: Separate cooktop + range → combine and use Column C
      if (range && cooktop) {
        const totalWatts = range.watts + cooktop.watts;
        hint = `Note 3: Combine separate units\nRange: ${range.watts.toLocaleString()} W\nCooktop: ${cooktop.watts.toLocaleString()} W\nCombined: ${totalWatts.toLocaleString()} W\n\n`;

        if (totalWatts <= 12000) {
          hint += `Column C: 8,000 VA for ≤12 kW`;
        } else {
          const overKW = Math.ceil((totalWatts - 12000) / 1000);
          const demand = Math.round(8000 * (1 + (overKW * 0.05)));
          hint += `Exceeds 12 kW by ${overKW} kW\n8,000 × ${(1 + overKW * 0.05).toFixed(2)} = ${demand.toLocaleString()} VA`;
        }
        return hint;
      }

      // Single appliance
      const appliance = range || cooktop;
      const watts = appliance!.watts;
      hint = `${appliance!.name}: ${watts.toLocaleString()} W\n\n`;

      if (watts < 3500) {
        hint += `Column A (<3½ kW): 80% of nameplate\n${watts.toLocaleString()} × 0.80 = ${Math.round(watts * 0.80).toLocaleString()} VA`;
      } else if (watts < 8750) {
        hint += `Column B (3½–8¾ kW): 80% of nameplate\n${watts.toLocaleString()} × 0.80 = ${Math.round(watts * 0.80).toLocaleString()} VA`;
      } else if (watts <= 12000) {
        hint += `Column C (≥8¾ kW): 8,000 VA for ≤12 kW`;
      } else {
        const overKW = Math.ceil((watts - 12000) / 1000);
        const demand = Math.round(8000 * (1 + (overKW * 0.05)));
        hint += `Column C: Exceeds 12 kW by ${overKW} kW\n8,000 × ${(1 + overKW * 0.05).toFixed(2)} = ${demand.toLocaleString()} VA`;
      }

      return hint;
    },
    necReference: "NEC Table 220.55",
    inputType: "calculation",
    formula: "Table 220.55 (Col A/B: 80% | Col C: 8 kW for ≤12 kW)",
    expectedAnswer: (scenario) => {
      const range = scenario.appliances.find(a => a.id === "range");
      const cooktop = scenario.appliances.find(a => a.id === "cooktop");

      if (!range && !cooktop) return 0;

      // Note 3: Separate cooktop + range → combine and use Column C
      if (range && cooktop) {
        const totalWatts = range.watts + cooktop.watts;
        if (totalWatts <= 12000) return 8000;
        const overKW = Math.ceil((totalWatts - 12000) / 1000);
        return Math.round(8000 * (1 + (overKW * 0.05)));
      }

      // Single appliance
      const watts = (range || cooktop)!.watts;
      if (watts < 8750) return Math.round(watts * 0.80);
      if (watts <= 12000) return 8000;
      const overKW = Math.ceil((watts - 12000) / 1000);
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
    sparkyPrompt: "Divide the total VA by 240V to get the minimum amperage. Just enter the result of the division — I'll round it up to the next standard service size for you.",
    hint: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = totalVA / 240;
      const standardSizes = [100, 125, 150, 200, 225, 400];
      const serviceSize = standardSizes.find(size => size >= amps) || 400;

      return `${totalVA.toLocaleString()} VA ÷ 240V = ${amps.toFixed(1)} Amps\n\nStandard sizes: 100A, 125A, 150A, 200A, 225A, 400A\nRounds up to: ${serviceSize}A`;
    },
    necReference: "NEC Table 310.12",
    inputType: "calculation",
    formula: "Total VA ÷ 240V",
    expectedAnswer: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      return Math.round(totalVA / 240 * 10) / 10;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 5,
    storedAnswer: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = totalVA / 240;
      const standardSizes = [100, 125, 150, 200, 225, 400];
      return standardSizes.find(size => size >= amps) || 400;
    },
  },
  // Step 14: Service Conductor Sizing (Table 310.12(A))
  {
    id: "service-conductor",
    title: "Service Conductor (Table 310.12(A))",
    sparkyPrompt: "Now let's size the service conductor. Using Table 310.12, find the copper conductor size for your service rating. Enter the wire size (e.g., 4, 2, 1/0, 3/0, 250).",
    hint: (scenario, prev) => {
      const serviceAmps = prev["service-amps"] || 0;
      const copperSize = getDwellingConductorSize(serviceAmps);

      return `Service rating: ${serviceAmps}A\n\nTable 310.12 — Copper column:\n${serviceAmps}A → ${copperSize} AWG/kcmil\n\nEnter: ${copperSize}`;
    },
    necReference: "NEC Table 310.12",
    inputType: "calculation",
    formula: "Service rating → Table 310.12 → copper conductor",
    parseInput: parseConductorInput,
    expectedAnswer: (scenario, prev) => {
      const serviceAmps = prev["service-amps"] || 0;
      return conductorSizeToCode(getDwellingConductorSize(serviceAmps));
    },
    validateAnswer: (user, expected) => user === expected,
  },
  // Step 15: GEC Sizing (Table 250.66)
  {
    id: "gec-size",
    title: "GEC Sizing (Table 250.66)",
    sparkyPrompt: "Finally, size the Grounding Electrode Conductor (GEC) using Table 250.66. Look up the service conductor size from the previous step and find the required GEC size. Enter the GEC AWG number (use 10 for 1/0, 20 for 2/0, 30 for 3/0).",
    hint: (scenario, prev) => {
      const serviceAmps = prev["service-amps"] || 0;
      const copperSize = getDwellingConductorSize(serviceAmps);
      const gecSize = getGECSize(copperSize);

      let gecEntry = gecSize;
      if (gecSize === "1/0") { gecEntry = "10"; }
      else if (gecSize === "2/0") { gecEntry = "20"; }
      else if (gecSize === "3/0") { gecEntry = "30"; }

      return `Service conductor: ${copperSize} AWG/kcmil\n\nTable 250.66:\n${copperSize} conductor → ${gecSize} AWG GEC\n\nEnter: ${gecEntry}`;
    },
    necReference: "NEC Table 250.66",
    inputType: "calculation",
    formula: "Service conductor size → Table 250.66 → GEC AWG",
    expectedAnswer: (scenario, prev) => {
      const serviceAmps = prev["service-amps"] || 0;
      const copperSize = getDwellingConductorSize(serviceAmps);
      const gecSize = getGECSize(copperSize);
      if (gecSize === "1/0") return 10;
      if (gecSize === "2/0") return 20;
      if (gecSize === "3/0") return 30;
      return parseInt(gecSize);
    },
    validateAnswer: (user, expected) => user === expected,
  },
];

// Parse conductor size string to numeric code
// AWG sizes (1–14) stay as-is, /0 sizes use negative numbers, kcmil stays as-is
export function parseConductorInput(input: string): number {
  const trimmed = input.trim();
  if (trimmed === "1/0") return -1;
  if (trimmed === "2/0") return -2;
  if (trimmed === "3/0") return -3;
  if (trimmed === "4/0") return -4;
  const num = parseFloat(trimmed.replace(/,/g, ""));
  return isNaN(num) ? NaN : num;
}

// Convert conductor size string to numeric code (for expectedAnswer)
export function conductorSizeToCode(size: string): number {
  if (size === "1/0") return -1;
  if (size === "2/0") return -2;
  if (size === "3/0") return -3;
  if (size === "4/0") return -4;
  return parseFloat(size);
}

// Convert numeric code back to display string
export function conductorCodeToLabel(code: number): string {
  if (code === -1) return "1/0";
  if (code === -2) return "2/0";
  if (code === -3) return "3/0";
  if (code === -4) return "4/0";
  return `${code}`;
}

// Filter steps based on scenario equipment — skips steps whose shouldShow returns false
export function getFilteredSteps(scenario: HouseScenario): CalculationStep[] {
  return CALCULATION_STEPS.filter(step => !step.shouldShow || step.shouldShow(scenario));
}

// Sparky messages for different situations
export const SPARKY_MESSAGES = {
  welcome: "Hey there! Ready to learn dwelling unit load calculations? These rules from NEC Article 220 are essential for the Master Electrician exam. We'll use Table 220.45 for demand factors, Table 430.248 for motor conversions, and 220.50 for the largest motor rule. Let's go!",
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
