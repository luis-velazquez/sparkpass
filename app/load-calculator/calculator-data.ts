// Residential Load Calculator Data
// Based on NEC Article 220 - Branch Circuit, Feeder, and Service Load Calculations

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
export const FIXED_APPLIANCE_IDS = ["dishwasher", "disposal", "microwave", "wine-cooler", "pool-pump"];

// Helper to get fixed appliances from a scenario
export function getFixedAppliances(scenario: HouseScenario) {
  return scenario.appliances.filter(a => FIXED_APPLIANCE_IDS.includes(a.id));
}

// Mapping of step IDs to the appliance IDs that are accounted for when that step is completed
export const STEP_APPLIANCE_MAP: Record<string, string[]> = {
  "general-lighting": ["square-footage"],
  "small-appliance": ["small-appliance-1", "small-appliance-2"],
  "laundry": ["laundry"],
  "subtotal-before-demand": [],
  "demand-first-10k": [],
  "demand-remainder": [],
  "net-general-load": [],
  "fixed-appliances": ["dishwasher", "disposal", "microwave", "wine-cooler", "pool-pump"],
  "dryer": ["dryer"],
  "range": ["range", "cooktop"],
  "water-heater": ["water-heater"],
  "hvac": ["ac", "heat"],
  "other-loads": ["hot-tub", "ev-charger"],
  "total-va": [],
  "service-amps": [],
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
  "net-general-load",
  "fixed-appliances",
  "dryer",
  "range",
  "water-heater",
  "hvac",
  "other-loads",
];

// Quick Reference items and when they're covered (step ID that completes coverage)
export const QUICK_REFERENCE_ITEMS = [
  { id: "general-lighting", label: "General Lighting", value: "3 VA/sq ft (Table 220.12)", coveredAfterStep: "general-lighting" },
  { id: "small-appliance", label: "Small Appliance", value: "2 circuits @ 1,500 VA each", coveredAfterStep: "small-appliance" },
  { id: "laundry", label: "Laundry Circuit", value: "1 circuit @ 1,500 VA", coveredAfterStep: "laundry" },
  { id: "demand-factors", label: "Demand Factors", value: "First 10kVA: 100% | Remainder: 35%", coveredAfterStep: "net-general-load" },
  { id: "fixed-appliances", label: "Fixed Appliances", value: "75% demand if 4+ appliances (220.53)", coveredAfterStep: "fixed-appliances" },
  { id: "dryer", label: "Dryer", value: "5,000 VA minimum (220.54)", coveredAfterStep: "dryer" },
  { id: "range", label: "Range/Cooking", value: "Table 220.55: 8 kW for ≤12 kW range", coveredAfterStep: "range" },
  { id: "water-heater", label: "Water Heater", value: "100% of nameplate (220.51)", coveredAfterStep: "water-heater" },
  { id: "hvac", label: "HVAC", value: "Larger of heating OR cooling (220.60)", coveredAfterStep: "hvac" },
  { id: "other-loads", label: "Other Loads", value: "100% of nameplate rating", coveredAfterStep: "other-loads" },
  { id: "standard-sizes", label: "Standard Sizes", value: "100A, 125A, 150A, 200A, 225A, 400A", coveredAfterStep: "service-amps" },
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

// House scenarios based on size
export const HOUSE_SCENARIOS: HouseScenario[] = [
  {
    id: "small",
    name: "Small Home",
    squareFootage: 1200,
    voltage: 240,
    description: "A modest 1,200 sq ft home with basic appliances",
    appliances: [
      ...STANDARD_APPLIANCES,
      { id: "range", name: "Electric Range", watts: 8000, necReference: "220.55" },
      { id: "dryer", name: "Electric Dryer", watts: 5000, necReference: "220.54" },
      { id: "water-heater", name: "Water Heater", watts: 4500, necReference: "220.51" },
      { id: "dishwasher", name: "Dishwasher", watts: 1200, necReference: "220.53" },
      { id: "ac", name: "Air Conditioning", watts: 5000, necReference: "220.60" },
      { id: "heat", name: "Electric Heat", watts: 10000, necReference: "220.60" },
    ],
  },
  {
    id: "medium",
    name: "Medium Home",
    squareFootage: 2000,
    voltage: 240,
    description: "A comfortable 2,000 sq ft home with modern appliances",
    appliances: [
      ...STANDARD_APPLIANCES,
      { id: "range", name: "Electric Range", watts: 12000, necReference: "220.55" },
      { id: "dryer", name: "Electric Dryer", watts: 5500, necReference: "220.54" },
      { id: "water-heater", name: "Water Heater", watts: 5500, necReference: "220.51" },
      { id: "dishwasher", name: "Dishwasher", watts: 1500, necReference: "220.53" },
      { id: "disposal", name: "Garbage Disposal", watts: 1000, necReference: "220.53" },
      { id: "microwave", name: "Microwave (built-in)", watts: 1500, necReference: "220.53" },
      { id: "ac", name: "Air Conditioning (3 ton)", watts: 7200, necReference: "220.60" },
      { id: "heat", name: "Electric Heat", watts: 15000, necReference: "220.60" },
      { id: "pool-pump", name: "Pool Pump", watts: 1500, necReference: "220.50" },
    ],
  },
  {
    id: "large",
    name: "Large Home",
    squareFootage: 3500,
    voltage: 240,
    description: "A spacious 3,500 sq ft home with premium appliances",
    appliances: [
      ...STANDARD_APPLIANCES,
      { id: "range", name: "Electric Range (double oven)", watts: 16000, necReference: "220.55" },
      { id: "cooktop", name: "Separate Cooktop", watts: 6000, necReference: "220.55" },
      { id: "dryer", name: "Electric Dryer", watts: 6000, necReference: "220.54" },
      { id: "water-heater", name: "Water Heater (large)", watts: 6000, necReference: "220.51" },
      { id: "dishwasher", name: "Dishwasher", watts: 1800, necReference: "220.53" },
      { id: "disposal", name: "Garbage Disposal", watts: 1000, necReference: "220.53" },
      { id: "microwave", name: "Microwave (built-in)", watts: 1800, necReference: "220.53" },
      { id: "wine-cooler", name: "Wine Cooler", watts: 500, necReference: "220.53" },
      { id: "ac", name: "Air Conditioning (5 ton)", watts: 12000, necReference: "220.60" },
      { id: "heat", name: "Electric Heat (zoned)", watts: 25000, necReference: "220.60" },
      { id: "pool-pump", name: "Pool Pump", watts: 2000, necReference: "220.50" },
      { id: "hot-tub", name: "Hot Tub/Spa", watts: 6000, necReference: "680.44" },
      { id: "ev-charger", name: "EV Charger", watts: 7200, necReference: "625.41" },
    ],
  },
];

// Calculation steps following NEC Article 220 standard method
export const CALCULATION_STEPS: CalculationStep[] = [
  {
    id: "general-lighting",
    title: "General Lighting Load",
    sparkyPrompt: "First, let's calculate the general lighting load. For a dwelling, we use 3 VA per square foot. What's the general lighting load in VA?",
    hint: "Multiply the square footage by 3 VA per sq ft (NEC Table 220.12)",
    necReference: "NEC Table 220.12",
    inputType: "calculation",
    formula: "Square Footage × 3 VA/sq ft",
    expectedAnswer: (scenario) => scenario.squareFootage * 3,
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 10,
  },
  {
    id: "small-appliance",
    title: "Small Appliance Circuits",
    sparkyPrompt: "Now let's add the small appliance circuits. NEC requires at least two 20A circuits at 1,500 VA each. What's the total small appliance load?",
    hint: "2 circuits × 1,500 VA each = 3,000 VA (NEC 220.52(A))",
    necReference: "NEC 220.52(A)",
    inputType: "calculation",
    formula: "2 circuits × 1,500 VA",
    expectedAnswer: () => 3000,
    validateAnswer: (user, expected) => user === expected,
  },
  {
    id: "laundry",
    title: "Laundry Circuit",
    sparkyPrompt: "Every dwelling needs at least one laundry circuit. What's the required laundry circuit load?",
    hint: "NEC requires 1,500 VA for the laundry circuit (NEC 220.52(B))",
    necReference: "NEC 220.52(B)",
    inputType: "calculation",
    formula: "1 circuit × 1,500 VA",
    expectedAnswer: () => 1500,
    validateAnswer: (user, expected) => user === expected,
  },
  {
    id: "subtotal-before-demand",
    title: "Subtotal Before Demand",
    sparkyPrompt: "Now add up the general lighting, small appliance, and laundry loads. What's the subtotal before applying demand factors?",
    hint: "Add: General Lighting + Small Appliance (3,000 VA) + Laundry (1,500 VA)",
    necReference: "NEC 220.42",
    inputType: "calculation",
    formula: "General Lighting + Small Appliance + Laundry",
    expectedAnswer: (scenario, prev) => (prev["general-lighting"] || scenario.squareFootage * 3) + 3000 + 1500,
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 10,
  },
  {
    id: "demand-first-10k",
    title: "Demand Factor - First 10,000 VA",
    sparkyPrompt: "Now we apply demand factors from Table 220.42. The first 10,000 VA is calculated at 100%. What's 100% of 10,000 VA?",
    hint: "The first 10,000 VA has a demand factor of 100%, so it stays at 10,000 VA",
    necReference: "NEC Table 220.42",
    inputType: "calculation",
    formula: "10,000 VA × 100%",
    expectedAnswer: () => 10000,
    validateAnswer: (user, expected) => user === expected,
  },
  {
    id: "demand-remainder",
    title: "Demand Factor - Remainder",
    sparkyPrompt: "Everything over 10,000 VA gets a 35% demand factor. Calculate 35% of the remaining load.",
    hint: "Take (Subtotal - 10,000) × 0.35",
    necReference: "NEC Table 220.42",
    inputType: "calculation",
    formula: "(Subtotal - 10,000) × 35%",
    expectedAnswer: (scenario, prev) => {
      const subtotal = prev["subtotal-before-demand"] || ((scenario.squareFootage * 3) + 4500);
      const remainder = Math.max(0, subtotal - 10000);
      return Math.round(remainder * 0.35);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  {
    id: "net-general-load",
    title: "Net General Lighting Load",
    sparkyPrompt: "Add the demand-factored amounts together. What's the net general lighting load after demand factors?",
    hint: "Add: First 10,000 VA (at 100%) + Remainder (at 35%)",
    necReference: "NEC Table 220.42",
    inputType: "calculation",
    formula: "10,000 + (Remainder × 35%)",
    expectedAnswer: (scenario, prev) => {
      const subtotal = prev["subtotal-before-demand"] || ((scenario.squareFootage * 3) + 4500);
      const remainder = Math.max(0, subtotal - 10000);
      return 10000 + Math.round(remainder * 0.35);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  {
    id: "fixed-appliances",
    title: "Fixed Appliances (Fastened in Place)",
    sparkyPrompt: "Now let's calculate fixed appliances (fastened in place). Add up the VA for: dishwasher, disposal, and any other fastened appliances. If you have 4 or more, we'll apply the 75% demand factor.",
    hint: (scenario) => {
      const fixedAppliances = getFixedAppliances(scenario);
      const applianceList = fixedAppliances
        .map(a => `• ${a.name}: ${a.watts.toLocaleString()}W`)
        .join("\n");
      const total = fixedAppliances.reduce((sum, a) => sum + a.watts, 0);
      const hasDemandFactor = fixedAppliances.length >= 4;

      let hint = `Your fixed appliances are:\n${applianceList}\n\nTotal: ${total.toLocaleString()}W`;
      if (hasDemandFactor) {
        hint += `\n\nWith ${fixedAppliances.length} appliances, apply 75% demand factor:\n${total.toLocaleString()} × 0.75 = ${Math.round(total * 0.75).toLocaleString()} VA`;
      }
      return hint;
    },
    necReference: "NEC 220.53",
    inputType: "calculation",
    formula: "Sum of fixed appliances (× 75% if 4 or more)",
    expectedAnswer: (scenario) => {
      const fixedAppliances = getFixedAppliances(scenario);
      const total = fixedAppliances.reduce((sum, a) => sum + a.watts, 0);
      // 75% demand if 4 or more
      return fixedAppliances.length >= 4 ? Math.round(total * 0.75) : total;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  {
    id: "dryer",
    title: "Electric Dryer",
    sparkyPrompt: "What's the electric dryer load? Use the nameplate rating or 5,000 VA minimum per NEC 220.54.",
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
  {
    id: "range",
    title: "Electric Range/Cooking Equipment",
    sparkyPrompt: "Now for the cooking equipment. Use Table 220.55 Column C for ranges 8.75 kW or less. For larger ranges, use the table to find the demand load.",
    hint: "For a single range ≤12kW: use 8,000 VA. For larger ranges, add 5% for each kW over 12kW to the Column C value",
    necReference: "NEC Table 220.55",
    inputType: "calculation",
    formula: "Table 220.55 Column C (8 kW for ranges ≤12 kW)",
    expectedAnswer: (scenario) => {
      const range = scenario.appliances.find(a => a.id === "range");
      const cooktop = scenario.appliances.find(a => a.id === "cooktop");
      let rangeWatts = range?.watts || 0;

      // If there's a separate cooktop, combine with range
      if (cooktop) {
        rangeWatts += cooktop.watts;
      }

      // Column C calculation
      if (rangeWatts <= 12000) {
        return 8000;
      } else {
        // Add 5% for each kW over 12kW
        const overKW = Math.ceil((rangeWatts - 12000) / 1000);
        return Math.round(8000 * (1 + (overKW * 0.05)));
      }
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 200,
  },
  {
    id: "water-heater",
    title: "Water Heater",
    sparkyPrompt: "What's the water heater load? This is taken at 100% of nameplate.",
    hint: "Use the water heater watts from the equipment list at 100%",
    necReference: "NEC 220.51",
    inputType: "calculation",
    formula: "Nameplate rating × 100%",
    expectedAnswer: (scenario) => {
      const waterHeater = scenario.appliances.find(a => a.id === "water-heater");
      return waterHeater?.watts || 0;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  {
    id: "hvac",
    title: "HVAC (Heating or Cooling)",
    sparkyPrompt: "For HVAC, we use the larger of heating or cooling loads (they're not simultaneous). Compare your heating and cooling loads - which is larger?",
    hint: "Use the LARGER of heating or cooling - per NEC 220.60, omit the smaller",
    necReference: "NEC 220.60",
    inputType: "calculation",
    formula: "Larger of: Heating OR Cooling",
    expectedAnswer: (scenario) => {
      const ac = scenario.appliances.find(a => a.id === "ac");
      const heat = scenario.appliances.find(a => a.id === "heat");
      return Math.max(ac?.watts || 0, heat?.watts || 0);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  {
    id: "other-loads",
    title: "Other Loads",
    sparkyPrompt: "Add any remaining loads: hot tub, EV charger, or other equipment. These are typically at 100%.",
    hint: "Sum any remaining equipment from the list (hot tub, EV charger, etc.) at 100%",
    necReference: "NEC 220.50",
    inputType: "calculation",
    formula: "Sum of other equipment × 100%",
    expectedAnswer: (scenario) => {
      const otherLoads = scenario.appliances.filter(a =>
        ["hot-tub", "ev-charger"].includes(a.id)
      );
      return otherLoads.reduce((sum, a) => sum + a.watts, 0);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  {
    id: "total-va",
    title: "Total Calculated Load",
    sparkyPrompt: "Now add up ALL the loads: net general lighting, fixed appliances, dryer, range, water heater, HVAC, and other loads. What's the total VA?",
    hint: "Add all your calculated loads from the previous steps",
    necReference: "NEC 220.40",
    inputType: "calculation",
    formula: "Sum of all calculated loads",
    expectedAnswer: (scenario, prev) => {
      const netGeneral = prev["net-general-load"] || 0;
      const fixed = prev["fixed-appliances"] || 0;
      const dryer = prev["dryer"] || 0;
      const range = prev["range"] || 0;
      const waterHeater = prev["water-heater"] || 0;
      const hvac = prev["hvac"] || 0;
      const other = prev["other-loads"] || 0;
      return netGeneral + fixed + dryer + range + waterHeater + hvac + other;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 500,
  },
  {
    id: "service-amps",
    title: "Service Size in Amps",
    sparkyPrompt: "Final step! Divide the total VA by 240V to get the minimum service amperage. Then round up to the next standard size (100A, 125A, 150A, 200A, 225A, 400A).",
    hint: "Amps = Total VA ÷ 240V. Standard sizes: 100A, 125A, 150A, 200A, 225A, 400A",
    necReference: "NEC 220.40",
    inputType: "calculation",
    formula: "Total VA ÷ 240V, rounded to next standard size",
    expectedAnswer: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = totalVA / 240;
      // Round to next standard size
      const standardSizes = [100, 125, 150, 200, 225, 400];
      return standardSizes.find(size => size >= amps) || 400;
    },
    validateAnswer: (user, expected) => {
      // Accept the exact standard size or the calculated amps
      const standardSizes = [100, 125, 150, 200, 225, 400];
      return standardSizes.includes(user) && user >= expected - 25;
    },
  },
];

// Sparky messages for different situations
export const SPARKY_MESSAGES = {
  welcome: "Hey there! Ready to learn residential load calculations? This is one of the most important skills for the Master Electrician exam. Let's work through a real-world scenario step by step!",
  selectScenario: "First, pick a house size. Bigger homes have more equipment, making the calculation more complex. I recommend starting with a smaller home if this is your first time!",
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
