// Commercial Service Load Calculator Data
// Based on NEC Article 220 for Non-Dwelling (Commercial) Occupancies
// Key references: Table 220.42(A) (lighting unit loads by occupancy, 125% already included),
// Table 220.45 (lighting demand factors), Table 220.44 (receptacle demand),
// Table 220.56 (kitchen equipment), Table 310.15(B)(16) (conductor ampacity),
// Table 250.66 (GEC sizing)

// Re-export shared types and utilities from residential calculator
export {
  DIFFICULTY_LEVELS,
  MOTOR_FLC_TABLE,
  getMotorAmps,
  hpToWatts,
  getRandomMessage,
} from "./calculator-data";
export type { DifficultyLevel, DifficultyOption } from "./calculator-data";

// Import for local use (re-export doesn't create local bindings)
import { hpToWatts, getMotorAmps } from "./calculator-data";

// ─── NEC Table 430.250: Three-Phase Motor Full-Load Currents ─────────────
// Induction-Type Squirrel Cage and Wound Rotor (208V and 230V columns)
export const MOTOR_FLC_TABLE_3PHASE: Record<number, { v208: number; v230: number }> = {
  0.5:  { v208: 2.4,   v230: 2.2 },
  0.75: { v208: 3.5,   v230: 3.2 },
  1:    { v208: 4.6,   v230: 4.2 },
  1.5:  { v208: 6.6,   v230: 6 },
  2:    { v208: 7.5,   v230: 6.8 },
  3:    { v208: 10.6,  v230: 9.6 },
  5:    { v208: 16.7,  v230: 15.2 },
  7.5:  { v208: 24.2,  v230: 22 },
  10:   { v208: 30.8,  v230: 28 },
  15:   { v208: 46.2,  v230: 42 },
  20:   { v208: 59.4,  v230: 54 },
  25:   { v208: 74.8,  v230: 68 },
  30:   { v208: 88,    v230: 80 },
  40:   { v208: 114,   v230: 104 },
  50:   { v208: 143,   v230: 130 },
};

// Get 3-phase motor FLC from Table 430.250
export function getMotorAmps3Phase(hp: number, voltage: number): number {
  const entry = MOTOR_FLC_TABLE_3PHASE[hp];
  if (!entry) return 0;
  return voltage <= 208 ? entry.v208 : entry.v230;
}

// Get FLC for any motor (dispatches by phase)
export function getMotorFLC(motor: { horsepower: number; voltage: number; phase: 1 | 3 }): number {
  if (motor.phase === 3) {
    return getMotorAmps3Phase(motor.horsepower, motor.voltage);
  }
  // Single-phase: 120→115V column, 208/240→230V column (Table 430.248)
  const lookupVoltage: 120 | 240 = motor.voltage <= 120 ? 120 : 240;
  return getMotorAmps(motor.horsepower, lookupVoltage);
}

// Convert motor to VA (handles single-phase and three-phase)
export function motorToVA(motor: { horsepower: number; voltage: number; phase: 1 | 3 }): number {
  const flc = getMotorFLC(motor);
  if (motor.phase === 3) {
    return Math.round(flc * motor.voltage * Math.sqrt(3));
  }
  return Math.round(flc * motor.voltage);
}

// Get motor table reference info for display
export function getMotorTableInfo(motor: { voltage: number; phase: 1 | 3 }): { tableNum: string; tableCol: string } {
  if (motor.phase === 3) {
    return { tableNum: "430.250", tableCol: motor.voltage <= 208 ? "208V" : "230V" };
  }
  return { tableNum: "430.248", tableCol: motor.voltage <= 120 ? "115V" : "230V" };
}

// Get service amps based on scenario voltage/phases
export function getServiceAmps(totalVA: number, voltage: number, phases: 1 | 3): number {
  if (phases === 3) {
    return totalVA / (voltage * Math.sqrt(3));
  }
  return totalVA / voltage;
}

// ─── NEC Table 220.42(A): Minimum Lighting Load by Occupancy ───────────────
// VA per square foot — the 125% continuous load multiplier per 210.20(A) is
// already included in these values, so NO additional multiplier is needed.
export const LIGHTING_LOAD_TABLE: Record<string, { vaPerSqFt: number; label: string }> = {
  automotive:            { vaPerSqFt: 1.5,  label: "Automotive Facility" },
  convention_center:     { vaPerSqFt: 1.4,  label: "Convention Center" },
  courthouse:            { vaPerSqFt: 1.4,  label: "Courthouse" },
  dormitory:             { vaPerSqFt: 1.5,  label: "Dormitory" },
  exercise_center:       { vaPerSqFt: 1.4,  label: "Exercise Center" },
  fire_station:          { vaPerSqFt: 1.3,  label: "Fire Station" },
  gymnasium:             { vaPerSqFt: 1.7,  label: "Gymnasium" },
  health_care_clinic:    { vaPerSqFt: 1.6,  label: "Health Care Clinic" },
  hospital:              { vaPerSqFt: 1.6,  label: "Hospital" },
  hotel:                 { vaPerSqFt: 1.7,  label: "Hotel/Motel" },
  library:               { vaPerSqFt: 1.5,  label: "Library" },
  manufacturing:         { vaPerSqFt: 2.2,  label: "Manufacturing Facility" },
  motion_picture_theater: { vaPerSqFt: 1.6, label: "Motion Picture Theater" },
  museum:                { vaPerSqFt: 1.6,  label: "Museum" },
  office:                { vaPerSqFt: 1.3,  label: "Office" },
  parking_garage:        { vaPerSqFt: 0.3,  label: "Parking Garage" },
  penitentiary:          { vaPerSqFt: 1.2,  label: "Penitentiary" },
  performing_arts_theater: { vaPerSqFt: 1.3, label: "Performing Arts Theater" },
  police_station:        { vaPerSqFt: 1.3,  label: "Police Station" },
  post_office:           { vaPerSqFt: 1.6,  label: "Post Office" },
  religious:             { vaPerSqFt: 2.2,  label: "Religious Facility" },
  restaurant:            { vaPerSqFt: 1.5,  label: "Restaurant" },
  retail:                { vaPerSqFt: 1.9,  label: "Retail Store" },
  school:                { vaPerSqFt: 1.5,  label: "School/University" },
  sports_arena:          { vaPerSqFt: 1.5,  label: "Sports Arena" },
  town_hall:             { vaPerSqFt: 1.4,  label: "Town Hall" },
  transportation:        { vaPerSqFt: 1.2,  label: "Transportation Facility" },
  warehouse:             { vaPerSqFt: 1.2,  label: "Warehouse" },
  workshop:              { vaPerSqFt: 1.7,  label: "Workshop" },
};

// Table 220.42(A) Notes:
// 1. Armories and auditoriums → gymnasium
// 2. Lodge rooms → hotel/motel
// 3. Industrial commercial loft buildings → manufacturing
// 4. Banks → office
// 5. Commercial (storage) garages → parking garage
// 6. Clubs → restaurant
// 7. Barbershops and beauty parlors → retail
// 8. Stores → retail

// ─── NEC Table 220.45: Lighting Demand Factors (Non-Dwelling) ───────────
// Different building types have different demand factor tiers
export interface DemandTier {
  upToVA: number;       // Apply this rate up to this VA value
  factor: number;       // Demand factor (e.g., 1.0 = 100%, 0.5 = 50%)
}

export const LIGHTING_DEMAND_TABLE: Record<string, { tiers: DemandTier[]; label: string }> = {
  hotel: {
    label: "Hotels/Motels",
    tiers: [
      { upToVA: 20000, factor: 0.5 },
      { upToVA: Infinity, factor: 0.4 },
    ],
  },
  hospital: {
    label: "Hospitals",
    tiers: [
      { upToVA: 50000, factor: 0.4 },
      { upToVA: Infinity, factor: 0.2 },
    ],
  },
  warehouse: {
    label: "Storage/Warehouse",
    tiers: [
      { upToVA: 12500, factor: 1.0 },
      { upToVA: Infinity, factor: 0.5 },
    ],
  },
  // All other building types: 100% (no reduction)
  default: {
    label: "All Others (Office, Restaurant, Retail, School, etc.)",
    tiers: [
      { upToVA: Infinity, factor: 1.0 },
    ],
  },
};

// Apply lighting demand factors from Table 220.45
export function applyLightingDemand(totalLightingVA: number, buildingType: string): number {
  const entry = LIGHTING_DEMAND_TABLE[buildingType] || LIGHTING_DEMAND_TABLE["default"];
  let remaining = totalLightingVA;
  let demandVA = 0;
  let previousCap = 0;

  for (const tier of entry.tiers) {
    const tierCapacity = tier.upToVA === Infinity ? remaining : tier.upToVA - previousCap;
    const vaInTier = Math.min(remaining, tierCapacity);
    demandVA += Math.round(vaInTier * tier.factor);
    remaining -= vaInTier;
    previousCap = tier.upToVA;
    if (remaining <= 0) break;
  }

  return demandVA;
}

// ─── NEC Table 220.44: Receptacle Load Demand Factors ──────────────────────
// First 10 kVA at 100%, remainder at 50%
export function applyReceptacleDemand(totalOutletVA: number): number {
  if (totalOutletVA <= 10000) return totalOutletVA;
  return 10000 + Math.round((totalOutletVA - 10000) * 0.5);
}

// ─── NEC Table 220.56: Kitchen Equipment Demand Factors ────────────────────
export const KITCHEN_DEMAND_FACTORS: Record<number, number> = {
  1: 1.0,
  2: 1.0,
  3: 0.9,
  4: 0.8,
  5: 0.7,
  6: 0.65,
};

export function getKitchenDemandFactor(count: number): number {
  if (count <= 2) return 1.0;
  if (count === 3) return 0.9;
  if (count === 4) return 0.8;
  if (count === 5) return 0.7;
  return 0.65; // 6 or more
}

// ─── NEC Table 310.15(B)(16): Conductor Ampacity (75°C Cu) ────────────────
export interface ConductorEntry {
  size: string;       // AWG or kcmil label (e.g., "14", "1/0", "300")
  ampacity: number;   // Ampacity at 75°C
}

export const CONDUCTOR_TABLE: ConductorEntry[] = [
  { size: "14",    ampacity: 20 },
  { size: "12",    ampacity: 25 },
  { size: "10",    ampacity: 35 },
  { size: "8",     ampacity: 50 },
  { size: "6",     ampacity: 65 },
  { size: "4",     ampacity: 85 },
  { size: "3",     ampacity: 100 },
  { size: "2",     ampacity: 115 },
  { size: "1",     ampacity: 130 },
  { size: "1/0",   ampacity: 150 },
  { size: "2/0",   ampacity: 175 },
  { size: "3/0",   ampacity: 200 },
  { size: "4/0",   ampacity: 230 },
  { size: "250",   ampacity: 255 },
  { size: "300",   ampacity: 285 },
  { size: "350",   ampacity: 310 },
  { size: "400",   ampacity: 335 },
  { size: "500",   ampacity: 380 },
  { size: "600",   ampacity: 420 },
  { size: "700",   ampacity: 460 },
  { size: "750",   ampacity: 475 },
];

// Get minimum conductor size for a given ampacity
export function getConductorSize(amps: number): ConductorEntry {
  for (const entry of CONDUCTOR_TABLE) {
    if (entry.ampacity >= amps) return entry;
  }
  return CONDUCTOR_TABLE[CONDUCTOR_TABLE.length - 1];
}

// ─── NEC Table 250.66: Grounding Electrode Conductor (GEC) Sizing ──────────
// Maps service conductor size to GEC size
interface GECEntry {
  maxConductorSize: string;  // Service conductor up to this size
  maxConductorArea: number;  // For comparison (AWG uses negative, kcmil uses positive)
  gecSize: string;           // Required GEC size
}

// Numeric sort value for conductor sizes (smaller number = smaller conductor)
function conductorSortValue(size: string): number {
  const awgMap: Record<string, number> = {
    "14": -14, "12": -12, "10": -10, "8": -8, "6": -6,
    "4": -4, "3": -3, "2": -2, "1": -1,
    "1/0": 0, "2/0": 1, "3/0": 2, "4/0": 3,
  };
  if (awgMap[size] !== undefined) return awgMap[size];
  return parseFloat(size); // kcmil values
}

const GEC_TABLE: GECEntry[] = [
  { maxConductorSize: "2",   maxConductorArea: -2,  gecSize: "8" },
  { maxConductorSize: "1",   maxConductorArea: -1,  gecSize: "6" },
  { maxConductorSize: "1/0", maxConductorArea: 0,   gecSize: "6" },
  { maxConductorSize: "2/0", maxConductorArea: 1,   gecSize: "4" },
  { maxConductorSize: "3/0", maxConductorArea: 2,   gecSize: "4" },
  { maxConductorSize: "4/0", maxConductorArea: 3,   gecSize: "2" },
  { maxConductorSize: "250", maxConductorArea: 250,  gecSize: "2" },
  { maxConductorSize: "300", maxConductorArea: 300,  gecSize: "2" },
  { maxConductorSize: "350", maxConductorArea: 350,  gecSize: "2" },
  { maxConductorSize: "500", maxConductorArea: 500,  gecSize: "1/0" },
  { maxConductorSize: "600", maxConductorArea: 600,  gecSize: "1/0" },
  { maxConductorSize: "750", maxConductorArea: 750,  gecSize: "2/0" },
  { maxConductorSize: "1000", maxConductorArea: 1000, gecSize: "3/0" },
];

// Get GEC size based on service conductor size
export function getGECSize(conductorSize: string): string {
  const sortVal = conductorSortValue(conductorSize);
  for (const entry of GEC_TABLE) {
    if (sortVal <= entry.maxConductorArea) return entry.gecSize;
  }
  return "3/0"; // Largest GEC
}

// ─── Interfaces ────────────────────────────────────────────────────────────

export interface KitchenEquipmentItem {
  name: string;
  watts: number;
}

export interface Motor {
  name: string;
  horsepower: number;
  voltage: 120 | 208 | 240;
  phase: 1 | 3;
}

export interface CommercialScenario {
  id: string;
  name: string;
  buildingType: string;
  squareFootage: number;
  voltage: 208 | 240;
  phases: 1 | 3;
  description: string;
  // Outlet counts
  lampholders: number;
  receptacles: number;
  multioutletAssemblyFeet: number;
  showWindowFeet: number;
  hasSignOutlet: boolean;
  // Kitchen equipment
  kitchenEquipment: KitchenEquipmentItem[];
  // HVAC
  acMotor: Motor | null;
  heatWatts: number;
  // Other motors (non-HVAC)
  otherMotors: Motor[];
}

export interface CommercialCalculationStep {
  id: string;
  title: string;
  sparkyPrompt: string;
  hint: string | ((scenario: CommercialScenario, previousAnswers: Record<string, number>) => string);
  necReference: string;
  inputType: "number" | "calculation" | "selection";
  formula?: string;
  expectedAnswer?: (scenario: CommercialScenario, previousAnswers: Record<string, number>) => number;
  validateAnswer?: (userAnswer: number, expected: number) => boolean;
}

// Equipment display item for the sidebar
export interface EquipmentDisplayItem {
  id: string;
  name: string;
  value: string;
  category: "building" | "outlets" | "kitchen" | "hvac" | "motors";
}

// Get flattened equipment list for display
export function getEquipmentDisplayItems(scenario: CommercialScenario): EquipmentDisplayItem[] {
  const items: EquipmentDisplayItem[] = [];

  // Building info
  items.push({
    id: "square-footage",
    name: "Square Footage",
    value: `${scenario.squareFootage.toLocaleString()} sq ft`,
    category: "building",
  });
  items.push({
    id: "building-type",
    name: "Building Type",
    value: LIGHTING_LOAD_TABLE[scenario.buildingType]?.label || scenario.buildingType,
    category: "building",
  });
  items.push({
    id: "va-per-sqft",
    name: "VA per sq ft (Table 220.42(A))",
    value: `${LIGHTING_LOAD_TABLE[scenario.buildingType]?.vaPerSqFt} VA/sq ft`,
    category: "building",
  });
  items.push({
    id: "service-type",
    name: "Service",
    value: scenario.phases === 3 ? `${scenario.voltage}V 3Ø` : `${scenario.voltage}V 1Ø`,
    category: "building",
  });

  // Outlets
  if (scenario.lampholders > 0) {
    items.push({
      id: "lampholders",
      name: "Heavy-Duty Lampholders",
      value: `${scenario.lampholders} × 600 VA`,
      category: "outlets",
    });
  }
  items.push({
    id: "receptacles",
    name: "Receptacle Outlets",
    value: `${scenario.receptacles} × 180 VA`,
    category: "outlets",
  });
  if (scenario.multioutletAssemblyFeet > 0) {
    items.push({
      id: "multioutlet",
      name: "Multioutlet Assembly",
      value: `${scenario.multioutletAssemblyFeet} ft × 180 VA/ft`,
      category: "outlets",
    });
  }
  if (scenario.showWindowFeet > 0) {
    items.push({
      id: "show-window",
      name: "Show Window Lighting",
      value: `${scenario.showWindowFeet} ft × 200 VA/ft`,
      category: "outlets",
    });
  }
  if (scenario.hasSignOutlet) {
    items.push({
      id: "sign-outlet",
      name: "Sign Outlet (600.5(A))",
      value: "1,200 VA",
      category: "outlets",
    });
  }

  // Kitchen equipment
  scenario.kitchenEquipment.forEach((item, i) => {
    items.push({
      id: `kitchen-${i}`,
      name: item.name,
      value: `${item.watts.toLocaleString()} W`,
      category: "kitchen",
    });
  });

  // HVAC
  if (scenario.acMotor) {
    const phaseLabel = scenario.acMotor.phase === 1 ? "1Ø" : "3Ø";
    items.push({
      id: "ac-motor",
      name: `A/C (${scenario.acMotor.horsepower} HP, ${phaseLabel} @ ${scenario.acMotor.voltage}V)`,
      value: `${scenario.acMotor.horsepower} HP`,
      category: "hvac",
    });
  }
  if (scenario.heatWatts > 0) {
    items.push({
      id: "heat",
      name: "Electric Heat",
      value: `${scenario.heatWatts.toLocaleString()} W`,
      category: "hvac",
    });
  }

  // Other motors
  scenario.otherMotors.forEach((motor, i) => {
    const phaseLabel = motor.phase === 1 ? "1Ø" : "3Ø";
    items.push({
      id: `motor-${i}`,
      name: `${motor.name} (${motor.horsepower} HP, ${phaseLabel} @ ${motor.voltage}V)`,
      value: `${motor.horsepower} HP`,
      category: "motors",
    });
  });

  return items;
}

// ─── Scenarios ─────────────────────────────────────────────────────────────

export const COMMERCIAL_SCENARIOS: CommercialScenario[] = [
  // Scenario 1: Retail Store
  // Expected: Total ~31,020 VA → 129.2A → 1 AWG (130A) → 6 AWG GEC
  {
    id: "retail",
    name: "Retail Store",
    buildingType: "retail",
    squareFootage: 3000,
    voltage: 240,
    phases: 1,
    description: "A 3,000 sq ft retail store with show window displays and a single HVAC unit",
    lampholders: 0,
    receptacles: 56,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 30,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 5, voltage: 240, phase: 1 },
    heatWatts: 10000,
    otherMotors: [],
  },
  // Scenario 2: Restaurant (120/208V 3-Phase)
  // A/C: 7.5HP 3Ø@208V → Table 430.250: 24.2A → 24.2×208×√3 = 8,718 VA
  // Walk-in: 2HP 1Ø@208V → Table 430.248 (230V col): 12A → 12×208 = 2,496 VA
  // Exhaust: 1HP 1Ø@120V → Table 430.248 (115V col): 16A → 16×120 = 1,920 VA
  // HVAC: max(8,718, 22,000) = 22,000 | Outlets: 14,400 → demand 12,200
  // Kitchen: 30,000×65% = 19,500 | Motor 25%: 8,718×25% = 2,180
  // Total: 6,000+22,000+12,200+19,500+2,180 = 61,880 VA
  // Service: 61,880 ÷ (208×√3) = 171.7A → 2/0 AWG (175A) → 4 AWG GEC
  {
    id: "restaurant",
    name: "Restaurant",
    buildingType: "restaurant",
    squareFootage: 4000,
    voltage: 208,
    phases: 3,
    description: "A 4,000 sq ft restaurant with 120/208V 3Ø service, full commercial kitchen, and multiple motors",
    lampholders: 10,
    receptacles: 40,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [
      { name: "Commercial Range", watts: 8000 },
      { name: "Deep Fryer", watts: 6000 },
      { name: "Convection Oven", watts: 5500 },
      { name: "Dishwasher", watts: 4500 },
      { name: "Steam Table", watts: 3500 },
      { name: "Reach-in Freezer", watts: 2500 },
    ],
    acMotor: { name: "A/C Compressor", horsepower: 7.5, voltage: 208, phase: 3 },
    heatWatts: 22000,
    otherMotors: [
      { name: "Walk-in Compressor", horsepower: 2, voltage: 208, phase: 1 },
      { name: "Exhaust Fan", horsepower: 1, voltage: 120, phase: 1 },
    ],
  },
  // Scenario 3: Office Building
  // Expected: Total ~96,000 VA → 400.0A → 600 kcmil (420A) → 1/0 AWG GEC
  {
    id: "office",
    name: "Office Building",
    buildingType: "office",
    squareFootage: 15000,
    voltage: 240,
    phases: 1,
    description: "A 15,000 sq ft office building with multioutlet assemblies and large HVAC system",
    lampholders: 0,
    receptacles: 250,
    multioutletAssemblyFeet: 60,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 10, voltage: 240, phase: 1 },
    heatWatts: 40000,
    otherMotors: [
      { name: "Elevator Motor", horsepower: 7.5, voltage: 240, phase: 1 },
    ],
  },
  // Scenario 4: Warehouse
  // Expected: Total ~38,250 VA → 159.4A → 2/0 AWG (175A) → 4 AWG GEC
  {
    id: "warehouse",
    name: "Warehouse",
    buildingType: "warehouse",
    squareFootage: 15000,
    voltage: 240,
    phases: 1,
    description: "A 15,000 sq ft warehouse with heavy-duty lampholders and multiple dock motors",
    lampholders: 24,
    receptacles: 20,
    multioutletAssemblyFeet: 0,
    showWindowFeet: 0,
    hasSignOutlet: true,
    kitchenEquipment: [],
    acMotor: { name: "A/C Compressor", horsepower: 5, voltage: 240, phase: 1 },
    heatWatts: 0,
    otherMotors: [
      { name: "Conveyor Motor", horsepower: 3, voltage: 240, phase: 1 },
      { name: "Dock Door Motor", horsepower: 1.5, voltage: 240, phase: 1 },
    ],
  },
];

// ─── Helper: Get all motors from a scenario ────────────────────────────────

function getAllMotorLoads(scenario: CommercialScenario): { name: string; va: number; phase: 1 | 3; hp: number; voltage: number }[] {
  const motors: { name: string; va: number; phase: 1 | 3; hp: number; voltage: number }[] = [];
  if (scenario.acMotor) {
    motors.push({
      name: scenario.acMotor.name,
      va: motorToVA(scenario.acMotor),
      phase: scenario.acMotor.phase,
      hp: scenario.acMotor.horsepower,
      voltage: scenario.acMotor.voltage,
    });
  }
  for (const m of scenario.otherMotors) {
    motors.push({
      name: m.name,
      va: motorToVA(m),
      phase: m.phase,
      hp: m.horsepower,
      voltage: m.voltage,
    });
  }
  return motors;
}

// ─── Step-to-equipment mapping for scratch-off ─────────────────────────────

export const COMMERCIAL_STEP_EQUIPMENT_MAP: Record<string, string[]> = {
  "lighting-load": ["square-footage", "building-type", "va-per-sqft"],
  "lighting-demand": [],
  "hvac": ["ac-motor", "heat"],
  "outlet-loads": ["lampholders", "receptacles", "multioutlet", "show-window", "sign-outlet"],
  "receptacle-demand": [],
  "kitchen-demand": [], // kitchen items scratched off here dynamically
  "largest-motor-25": [],
  "total-va": [],
  "service-conductor": [],
  "gec-size": [],
};

// Get kitchen equipment IDs for a scenario
export function getKitchenEquipmentIds(scenario: CommercialScenario): string[] {
  return scenario.kitchenEquipment.map((_, i) => `kitchen-${i}`);
}

// Get motor IDs for a scenario
export function getMotorIds(scenario: CommercialScenario): string[] {
  const ids: string[] = [];
  scenario.otherMotors.forEach((_, i) => ids.push(`motor-${i}`));
  return ids;
}

// Get all equipment IDs accounted for up to a step index
export function getAccountedEquipmentIds(
  stepIndex: number,
  scenario: CommercialScenario
): Set<string> {
  const accountedIds = new Set<string>();

  for (let i = 0; i <= stepIndex; i++) {
    const stepId = COMMERCIAL_CALCULATION_STEPS[i]?.id;
    if (!stepId) continue;

    const staticIds = COMMERCIAL_STEP_EQUIPMENT_MAP[stepId] || [];
    staticIds.forEach(id => accountedIds.add(id));

    // Kitchen step accounts for all kitchen items
    if (stepId === "kitchen-demand") {
      getKitchenEquipmentIds(scenario).forEach(id => accountedIds.add(id));
    }
    // Motor 25% step accounts for all motors
    if (stepId === "largest-motor-25") {
      getMotorIds(scenario).forEach(id => accountedIds.add(id));
    }
  }

  return accountedIds;
}

// Steps that sum into total-va
export const COMMERCIAL_TOTAL_VA_STEPS = [
  "lighting-demand",
  "hvac",
  "receptacle-demand",
  "kitchen-demand",
  "largest-motor-25",
];

// ─── Quick Reference ───────────────────────────────────────────────────────

export const COMMERCIAL_QUICK_REFERENCE = [
  { id: "lighting-load", label: "General Lighting", value: "Table 220.42(A): VA/sq ft × sq ft (125% already included)", coveredAfterStep: "lighting-load" },
  { id: "lighting-demand", label: "Lighting Demand", value: "Table 220.45: Warehouse 100%/50%, others 100%", coveredAfterStep: "lighting-demand" },
  { id: "hvac", label: "HVAC", value: "220.60: Larger of heating OR cooling (1Ø→430.248, 3Ø→430.250)", coveredAfterStep: "hvac" },
  { id: "outlet-loads", label: "Outlet Loads", value: "220.14: Lampholders 600 VA, Recepts 180 VA, Show Window 200 VA/ft, Sign 1,200 VA", coveredAfterStep: "outlet-loads" },
  { id: "receptacle-demand", label: "Receptacle Demand", value: "Table 220.44: First 10 kVA @ 100%, remainder @ 50%", coveredAfterStep: "receptacle-demand" },
  { id: "kitchen-demand", label: "Kitchen Equipment", value: "Table 220.56: 1-2 units 100%, 3=90%, 4=80%, 5=70%, 6+=65%", coveredAfterStep: "kitchen-demand" },
  { id: "largest-motor", label: "Largest Motor", value: "220.50: Add 25% of largest motor load", coveredAfterStep: "largest-motor-25" },
  { id: "conductor", label: "Conductor Sizing", value: "Table 310.15(B)(16): 75°C copper ampacity", coveredAfterStep: "service-conductor" },
  { id: "gec", label: "GEC Sizing", value: "Table 250.66: Based on service conductor size", coveredAfterStep: "gec-size" },
];

export function isCommercialQuickRefCovered(itemId: string, currentStepIndex: number): boolean {
  const item = COMMERCIAL_QUICK_REFERENCE.find(i => i.id === itemId);
  if (!item) return false;
  const coveredStepIndex = COMMERCIAL_CALCULATION_STEPS.findIndex(s => s.id === item.coveredAfterStep);
  return coveredStepIndex !== -1 && currentStepIndex > coveredStepIndex;
}

// ─── Sparky Messages ───────────────────────────────────────────────────────

export const COMMERCIAL_SPARKY_MESSAGES = {
  welcome: "Welcome to the Commercial Service Load Calculator! We'll work through NEC Article 220 for non-dwelling occupancies, including lighting demand, receptacle loads, kitchen equipment, and motor calculations. We'll also size the service conductor and grounding electrode conductor. Let's get started!",
  selectScenario: "Pick a commercial building type. Each has different equipment and NEC rules. Restaurants test kitchen demand factors, warehouses have special lighting demand, and offices have large receptacle loads.",
  correct: [
    "Excellent work! That's exactly right!",
    "Perfect! You're getting the hang of commercial calcs!",
    "That's correct! Great job with the math!",
    "Right on the money! You really know your stuff!",
    "Correct! Commercial load calcs are your specialty!",
  ],
  incorrect: [
    "Not quite, but don't worry - commercial calcs have a lot of tables!",
    "Close, but let's look at this again.",
    "That's not right, but you're learning! Check the hint.",
    "Almost there! Let me help you with this one.",
  ],
  encouragement: [
    "You're doing great! Keep going!",
    "Nice progress! Just a few more steps!",
    "You've got this! Commercial calcs are great exam practice!",
  ],
  complete: "Outstanding work! You've completed the entire commercial service load calculation, including conductor and GEC sizing! This covers several key NEC articles that appear on the Master Electrician exam.",
};

// ─── Calculation Steps ─────────────────────────────────────────────────────

export const COMMERCIAL_CALCULATION_STEPS: CommercialCalculationStep[] = [
  // Step 1: General Lighting Load (Table 220.42(A))
  {
    id: "lighting-load",
    title: "General Lighting Load (Table 220.42(A))",
    sparkyPrompt: "Let's start by calculating the general lighting load. Look up the VA per square foot for this building type in Table 220.42(A) and multiply by the square footage. Note: the 125% continuous load multiplier is already included in the table values per 210.20(A), so no additional multiplier is needed!",
    hint: (scenario) => {
      const rate = LIGHTING_LOAD_TABLE[scenario.buildingType]?.vaPerSqFt || 0;
      const total = Math.round(scenario.squareFootage * rate);
      return `Building type: ${LIGHTING_LOAD_TABLE[scenario.buildingType]?.label}\nTable 220.42(A): ${rate} VA/sq ft (125% already included)\n\n${scenario.squareFootage.toLocaleString()} sq ft × ${rate} VA/sq ft = ${total.toLocaleString()} VA`;
    },
    necReference: "NEC Table 220.42(A)",
    inputType: "calculation",
    formula: "Sq ft × VA/sq ft (from Table 220.42(A))",
    expectedAnswer: (scenario) => {
      const rate = LIGHTING_LOAD_TABLE[scenario.buildingType]?.vaPerSqFt || 0;
      return Math.round(scenario.squareFootage * rate);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 2: Lighting Demand Factor (Table 220.45)
  {
    id: "lighting-demand",
    title: "Lighting Demand Factor (Table 220.45)",
    sparkyPrompt: "Now apply the demand factors from Table 220.45 for this building type. Different occupancies have different demand factors. Most commercial buildings use 100%, but warehouses and hotels have tiered reductions.",
    hint: (scenario, prev) => {
      const lightingVA = prev["lighting-load"] || 0;
      const entry = LIGHTING_DEMAND_TABLE[scenario.buildingType] || LIGHTING_DEMAND_TABLE["default"];

      if (scenario.buildingType === "warehouse") {
        if (lightingVA <= 12500) {
          return `Table 220.45 (Warehouse):\nFirst 12,500 VA @ 100%\n\n${lightingVA.toLocaleString()} VA is under 12,500 → 100%\nDemand: ${lightingVA.toLocaleString()} VA`;
        }
        const first = 12500;
        const remainder = lightingVA - 12500;
        const demandRemainder = Math.round(remainder * 0.5);
        const total = first + demandRemainder;
        return `Table 220.45 (Warehouse):\nFirst 12,500 VA @ 100% = 12,500 VA\nRemainder: ${remainder.toLocaleString()} VA @ 50% = ${demandRemainder.toLocaleString()} VA\n\nDemand: 12,500 + ${demandRemainder.toLocaleString()} = ${total.toLocaleString()} VA`;
      }

      return `Table 220.45 (${entry.label}):\nDemand factor: 100%\n\n${lightingVA.toLocaleString()} VA × 100% = ${lightingVA.toLocaleString()} VA`;
    },
    necReference: "NEC Table 220.45",
    inputType: "calculation",
    formula: "Lighting VA × demand factor(s)",
    expectedAnswer: (scenario, prev) => {
      const lightingVA = prev["lighting-load"] || 0;
      return applyLightingDemand(lightingVA, scenario.buildingType);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 3: HVAC Load (220.60)
  {
    id: "hvac",
    title: "HVAC Load (220.60)",
    sparkyPrompt: "Per 220.60, heating and cooling are non-coincident loads — use the LARGER of the two. For the A/C motor, check whether it's single-phase or three-phase, then convert HP to watts using the correct FLC table (Table 430.248 for single-phase, Table 430.250 for three-phase). Find the amps and multiply by voltage. Compare to the heating load.",
    hint: (scenario) => {
      if (scenario.acMotor) {
        const flc = getMotorFLC(scenario.acMotor);
        const acVA = motorToVA(scenario.acMotor);
        const { tableNum, tableCol } = getMotorTableInfo(scenario.acMotor);
        const phaseLabel = scenario.acMotor.phase === 1 ? "single-phase" : "three-phase";

        let formula: string;
        if (scenario.acMotor.phase === 3) {
          formula = `${flc} × ${scenario.acMotor.voltage}V × √3 = ${acVA.toLocaleString()} W`;
        } else {
          formula = `${flc} × ${scenario.acMotor.voltage}V = ${acVA.toLocaleString()} W`;
        }

        let hint = `A/C Motor: ${scenario.acMotor.horsepower} HP, ${phaseLabel} @ ${scenario.acMotor.voltage}V\nTable ${tableNum} (${tableCol}): ${flc} Amps\n${formula}\n\n`;
        hint += `Heating: ${scenario.heatWatts.toLocaleString()} W\n\n`;

        const larger = Math.max(acVA, scenario.heatWatts);
        const largerName = scenario.heatWatts >= acVA ? "Heating" : "A/C";
        hint += `${largerName} is larger: ${larger.toLocaleString()} VA`;
        return hint;
      }
      if (scenario.heatWatts > 0) {
        return `No A/C motor\nHeating: ${scenario.heatWatts.toLocaleString()} W\nUse heating: ${scenario.heatWatts.toLocaleString()} VA`;
      }
      return "No A/C or heating — enter 0.";
    },
    necReference: "NEC 220.60, Table 430.248/430.250",
    inputType: "calculation",
    formula: "Larger of: A/C (HP→W via FLC table) OR Heat",
    expectedAnswer: (scenario) => {
      let acVA = 0;
      if (scenario.acMotor) {
        acVA = motorToVA(scenario.acMotor);
      }
      return Math.max(acVA, scenario.heatWatts);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 4: Outlet Loads (220.14)
  {
    id: "outlet-loads",
    title: "Outlet Loads (220.14)",
    sparkyPrompt: "Calculate the total outlet loads. Per 220.14: Heavy-duty lampholders are 600 VA each, receptacle outlets are 180 VA each, multioutlet assemblies are 180 VA per foot, show window lighting is 200 VA per linear foot, and each required sign outlet is 1,200 VA per 600.5(A).",
    hint: (scenario) => {
      const parts: string[] = [];
      let total = 0;

      if (scenario.lampholders > 0) {
        const val = scenario.lampholders * 600;
        parts.push(`Lampholders: ${scenario.lampholders} × 600 VA = ${val.toLocaleString()} VA`);
        total += val;
      }
      const recept = scenario.receptacles * 180;
      parts.push(`Receptacles: ${scenario.receptacles} × 180 VA = ${recept.toLocaleString()} VA`);
      total += recept;

      if (scenario.multioutletAssemblyFeet > 0) {
        const val = scenario.multioutletAssemblyFeet * 180;
        parts.push(`Multioutlet Assembly: ${scenario.multioutletAssemblyFeet} ft × 180 VA = ${val.toLocaleString()} VA`);
        total += val;
      }
      if (scenario.showWindowFeet > 0) {
        const val = scenario.showWindowFeet * 200;
        parts.push(`Show Window: ${scenario.showWindowFeet} ft × 200 VA = ${val.toLocaleString()} VA`);
        total += val;
      }
      if (scenario.hasSignOutlet) {
        parts.push(`Sign Outlet: 1,200 VA`);
        total += 1200;
      }

      return parts.join("\n") + `\n\nTotal: ${total.toLocaleString()} VA`;
    },
    necReference: "NEC 220.14, 600.5(A)",
    inputType: "calculation",
    formula: "Lampholders×600 + Recepts×180 + Multioutlet ft×180 + Show Window ft×200 + Sign 1,200",
    expectedAnswer: (scenario) => {
      let total = 0;
      total += scenario.lampholders * 600;
      total += scenario.receptacles * 180;
      total += scenario.multioutletAssemblyFeet * 180;
      total += scenario.showWindowFeet * 200;
      if (scenario.hasSignOutlet) total += 1200;
      return total;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 5: Receptacle Demand Factor (Table 220.44)
  {
    id: "receptacle-demand",
    title: "Receptacle Demand Factor (Table 220.44)",
    sparkyPrompt: "Apply the demand factors from Table 220.44 to the total outlet load. The first 10 kVA is at 100%, and the remainder is at 50%. If the total is under 10 kVA, use 100%.",
    hint: (scenario, prev) => {
      const outletTotal = prev["outlet-loads"] || 0;

      if (outletTotal <= 10000) {
        return `Total outlet load: ${outletTotal.toLocaleString()} VA\n\nUnder 10 kVA → 100%\nDemand: ${outletTotal.toLocaleString()} VA`;
      }

      const remainder = outletTotal - 10000;
      const demandRemainder = Math.round(remainder * 0.5);
      const total = 10000 + demandRemainder;
      return `Total outlet load: ${outletTotal.toLocaleString()} VA\n\nFirst 10,000 VA @ 100% = 10,000 VA\nRemainder: ${remainder.toLocaleString()} VA @ 50% = ${demandRemainder.toLocaleString()} VA\n\nDemand: 10,000 + ${demandRemainder.toLocaleString()} = ${total.toLocaleString()} VA`;
    },
    necReference: "NEC Table 220.44",
    inputType: "calculation",
    formula: "First 10 kVA @ 100% + remainder @ 50%",
    expectedAnswer: (scenario, prev) => {
      const outletTotal = prev["outlet-loads"] || 0;
      return applyReceptacleDemand(outletTotal);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 6: Kitchen Equipment (Table 220.56)
  {
    id: "kitchen-demand",
    title: "Kitchen Equipment (Table 220.56)",
    sparkyPrompt: "If this building has commercial kitchen equipment, calculate the demand load using Table 220.56. Sum all equipment ratings, then apply the demand factor based on the number of pieces. If there's no kitchen equipment, enter 0.",
    hint: (scenario) => {
      if (scenario.kitchenEquipment.length === 0) {
        return "No commercial kitchen equipment — enter 0.";
      }

      const count = scenario.kitchenEquipment.length;
      const sum = scenario.kitchenEquipment.reduce((s, item) => s + item.watts, 0);
      const factor = getKitchenDemandFactor(count);

      let hint = `Kitchen equipment (${count} items):\n`;
      scenario.kitchenEquipment.forEach(item => {
        hint += `• ${item.name}: ${item.watts.toLocaleString()} W\n`;
      });
      hint += `\nTotal: ${sum.toLocaleString()} W\n`;
      hint += `Table 220.56: ${count} units → ${Math.round(factor * 100)}% demand factor\n`;
      hint += `${sum.toLocaleString()} × ${Math.round(factor * 100)}% = ${Math.round(sum * factor).toLocaleString()} VA`;

      return hint;
    },
    necReference: "NEC Table 220.56",
    inputType: "calculation",
    formula: "Sum of equipment × demand factor (Table 220.56)",
    expectedAnswer: (scenario) => {
      if (scenario.kitchenEquipment.length === 0) return 0;
      const sum = scenario.kitchenEquipment.reduce((s, item) => s + item.watts, 0);
      const factor = getKitchenDemandFactor(scenario.kitchenEquipment.length);
      return Math.round(sum * factor);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 100,
  },
  // Step 7: Largest Motor +25% (220.50)
  {
    id: "largest-motor-25",
    title: "Largest Motor +25% (220.50)",
    sparkyPrompt: "Per 220.50, add 25% of the largest motor load. Consider ALL motors — the A/C compressor and any other motors. Convert each HP to watts using the correct FLC table based on phase (Table 430.248 for single-phase, Table 430.250 for three-phase). Find the largest, then calculate 25% of that value.",
    hint: (scenario) => {
      const motors = getAllMotorLoads(scenario);
      if (motors.length === 0) return "No motors — enter 0.";

      let hint = "All motors:\n";
      motors.forEach(m => {
        const phaseLabel = m.phase === 1 ? "single-phase" : "three-phase";
        const { tableNum } = getMotorTableInfo(m);
        hint += `• ${m.name}: ${m.hp} HP, ${phaseLabel} @ ${m.voltage}V → ${m.va.toLocaleString()} W (Table ${tableNum})\n`;
      });

      const largest = motors.reduce((max, m) => m.va > max.va ? m : max);
      const addition = Math.round(largest.va * 0.25);
      hint += `\nLargest: ${largest.name} at ${largest.va.toLocaleString()} W\n25% of ${largest.va.toLocaleString()} = ${addition.toLocaleString()} VA`;

      return hint;
    },
    necReference: "NEC 220.50, Table 430.248/430.250",
    inputType: "calculation",
    formula: "Largest motor W × 25%",
    expectedAnswer: (scenario) => {
      const motors = getAllMotorLoads(scenario);
      if (motors.length === 0) return 0;
      const largest = Math.max(...motors.map(m => m.va));
      return Math.round(largest * 0.25);
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 50,
  },
  // Step 8: Total Calculated Load
  {
    id: "total-va",
    title: "Total Calculated Load",
    sparkyPrompt: "Now add up all the demand loads: lighting demand, HVAC, receptacle demand, kitchen equipment demand, and the 25% motor addition. What's the total VA?",
    hint: (scenario, prev) => {
      const lightingDemand = prev["lighting-demand"] || 0;
      const hvac = prev["hvac"] || 0;
      const receptDemand = prev["receptacle-demand"] || 0;
      const kitchen = prev["kitchen-demand"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;

      let hint = `Lighting Demand: ${lightingDemand.toLocaleString()} VA\n`;
      hint += `HVAC: ${hvac.toLocaleString()} VA\n`;
      hint += `Receptacle Demand: ${receptDemand.toLocaleString()} VA\n`;
      hint += `Kitchen Equipment: ${kitchen.toLocaleString()} VA\n`;
      hint += `Largest Motor 25%: ${motor25.toLocaleString()} VA\n`;

      const total = lightingDemand + hvac + receptDemand + kitchen + motor25;
      hint += `\nTotal: ${total.toLocaleString()} VA`;

      return hint;
    },
    necReference: "NEC 220.40",
    inputType: "calculation",
    formula: "Sum of all demand loads",
    expectedAnswer: (scenario, prev) => {
      const lightingDemand = prev["lighting-demand"] || 0;
      const hvac = prev["hvac"] || 0;
      const receptDemand = prev["receptacle-demand"] || 0;
      const kitchen = prev["kitchen-demand"] || 0;
      const motor25 = prev["largest-motor-25"] || 0;
      return lightingDemand + hvac + receptDemand + kitchen + motor25;
    },
    validateAnswer: (user, expected) => Math.abs(user - expected) <= 500,
  },
  // Step 9: Service Conductor Sizing (Table 310.15(B)(16))
  {
    id: "service-conductor",
    title: "Service Conductor (Table 310.15(B)(16))",
    sparkyPrompt: "Divide the total VA by the service voltage to get the minimum ampacity. For single-phase: Total VA ÷ voltage. For three-phase: Total VA ÷ (voltage × √3). Then look up the conductor size in Table 310.15(B)(16) (75°C copper column). Enter the ampacity rating from the table.",
    hint: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = getServiceAmps(totalVA, scenario.voltage, scenario.phases);
      const conductor = getConductorSize(amps);

      let formula: string;
      if (scenario.phases === 3) {
        const divisor = Math.round(scenario.voltage * Math.sqrt(3) * 10) / 10;
        formula = `${totalVA.toLocaleString()} VA ÷ (${scenario.voltage}V × √3) = ${totalVA.toLocaleString()} ÷ ${divisor} = ${amps.toFixed(1)} Amps`;
      } else {
        formula = `${totalVA.toLocaleString()} VA ÷ ${scenario.voltage}V = ${amps.toFixed(1)} Amps`;
      }

      return `${formula}\n\nTable 310.15(B)(16) — 75°C Cu:\nMinimum conductor: ${conductor.size} AWG/kcmil\nAmpacity: ${conductor.ampacity}A\n\nEnter the ampacity: ${conductor.ampacity}`;
    },
    necReference: "NEC Table 310.15(B)(16)",
    inputType: "calculation",
    formula: "Total VA ÷ service voltage → Table 310.15(B)(16) ampacity",
    expectedAnswer: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = getServiceAmps(totalVA, scenario.voltage, scenario.phases);
      return getConductorSize(amps).ampacity;
    },
    validateAnswer: (user, expected) => {
      // Accept the exact ampacity from the table
      const validAmpacities = CONDUCTOR_TABLE.map(c => c.ampacity);
      return validAmpacities.includes(user) && user >= expected;
    },
  },
  // Step 10: GEC Sizing (Table 250.66)
  {
    id: "gec-size",
    title: "GEC Sizing (Table 250.66)",
    sparkyPrompt: "Finally, size the Grounding Electrode Conductor (GEC) using Table 250.66. Look up the service conductor size from the previous step and find the required GEC size. Enter the GEC AWG number (use 10 for 1/0, 20 for 2/0, 30 for 3/0).",
    hint: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = getServiceAmps(totalVA, scenario.voltage, scenario.phases);
      const conductor = getConductorSize(amps);
      const gecSize = getGECSize(conductor.size);

      let gecDisplay = gecSize;
      let gecEntry = gecSize;
      if (gecSize === "1/0") { gecEntry = "10"; gecDisplay = "1/0 (enter 10)"; }
      else if (gecSize === "2/0") { gecEntry = "20"; gecDisplay = "2/0 (enter 20)"; }
      else if (gecSize === "3/0") { gecEntry = "30"; gecDisplay = "3/0 (enter 30)"; }

      return `Service conductor: ${conductor.size} AWG/kcmil (${conductor.ampacity}A)\n\nTable 250.66:\n${conductor.size} conductor → ${gecSize} AWG GEC\n\nEnter: ${gecEntry}`;
    },
    necReference: "NEC Table 250.66",
    inputType: "calculation",
    formula: "Service conductor size → Table 250.66 → GEC AWG",
    expectedAnswer: (scenario, prev) => {
      const totalVA = prev["total-va"] || 0;
      const amps = getServiceAmps(totalVA, scenario.voltage, scenario.phases);
      const conductor = getConductorSize(amps);
      const gecSize = getGECSize(conductor.size);
      // Convert to numeric: 1/0→10, 2/0→20, 3/0→30, else parse
      if (gecSize === "1/0") return 10;
      if (gecSize === "2/0") return 20;
      if (gecSize === "3/0") return 30;
      return parseInt(gecSize);
    },
    validateAnswer: (user, expected) => user === expected,
  },
];
