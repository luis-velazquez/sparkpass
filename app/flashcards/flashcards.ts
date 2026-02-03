export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  necReference: string;
}

export interface FlashcardSet {
  id: string;
  name: string;
  description: string;
  cards: Flashcard[];
}

export const RESIDENTIAL_STEP_CARDS: Flashcard[] = [
  {
    id: "lc-step-001",
    front: "Step 1: What is the first decision before starting a dwelling load calculation?",
    back: "Choose the calculation method: standard method (Article 220) or optional method (220.82).",
    category: "load-calculations",
    necReference: "NEC Article 220; 220.82",
  },
  {
    id: "lc-step-002",
    front: "Step 2: What base load is calculated from floor area?",
    back: "General lighting load using 3 VA per sq ft for dwelling units.",
    category: "load-calculations",
    necReference: "NEC Table 220.41",
  },
  {
    id: "lc-step-003",
    front: "Step 3: What required circuits must be added to the general load?",
    back: "Small-appliance circuits at 1,500 VA each and one laundry circuit at 1,500 VA.",
    category: "load-calculations",
    necReference: "NEC 220.52(A), 220.52(B)",
  },
  {
    id: "lc-step-004",
    front: "Step 4: After adding lighting, small-appliance, and laundry loads, what comes next (standard method)?",
    back: "Apply demand factors: 100% of first 10 kVA and 35% of the remainder.",
    category: "load-calculations",
    necReference: "NEC Table 220.42",
  },
  {
    id: "lc-step-005",
    front: "Step 5: What dryer load must be included if the nameplate is unknown?",
    back: "Use 5,000 VA minimum per dryer (or nameplate if larger).",
    category: "load-calculations",
    necReference: "NEC 220.54",
  },
  {
    id: "lc-step-006",
    front: "Step 6: Where do you find demand factors for household ranges?",
    back: "Use Table 220.55 for ranges and cooking appliances.",
    category: "load-calculations",
    necReference: "NEC Table 220.55",
  },
  {
    id: "lc-step-007",
    front: "Step 7: How do you handle four or more fastened-in-place appliances?",
    back: "Apply a 75% demand factor to those appliances (excluding ranges, dryers, HVAC).",
    category: "load-calculations",
    necReference: "NEC 220.53",
  },
  {
    id: "lc-step-008",
    front: "Step 8: When both heating and cooling are present, which load is used?",
    back: "Use the larger of the noncoincident loads (heating or A/C).",
    category: "load-calculations",
    necReference: "NEC 220.60",
  },
  {
    id: "lc-step-009",
    front: "Step 9: What is the general load demand formula in the optional method?",
    back: "100% of first 10 kVA, plus 40% of the remainder of general loads.",
    category: "load-calculations",
    necReference: "NEC 220.82(B)",
  },
  {
    id: "lc-step-010",
    front: "Step 10: What is the correct order for the standard method general load calculation?",
    back: "Lighting + small-appliance + laundry, then apply Table 220.42 demand factors.",
    category: "load-calculations",
    necReference: "NEC Table 220.12; 220.52; Table 220.42",
  },
  {
    id: "lc-step-011",
    front: "Step 11: What unit should you keep all loads in before converting to amperes?",
    back: "Keep loads in VA or kVA until the final step, then convert to amperes using voltage.",
    category: "load-calculations",
    necReference: "NEC 220.40",
  },
  {
    id: "lc-step-012",
    front: "Step 12: If you convert VA to amperes for a 240 V service, what formula do you use?",
    back: "I = VA / V (single-phase).",
    category: "load-calculations",
    necReference: "NEC 220.40",
  },
  {
    id: "lc-step-013",
    front: "Step 13: What does 220.40 remind you about in service calculations?",
    back: "The calculated load must include all applicable loads before sizing the service or feeder.",
    category: "load-calculations",
    necReference: "NEC 220.40",
  },
  {
    id: "lc-step-014",
    front: "Step 14: After calculating total demand, where do you verify service conductor ampacity?",
    back: "Service conductors must have ampacity not less than the calculated load.",
    category: "load-calculations",
    necReference: "NEC 230.42",
  },
  {
    id: "lc-step-015",
    front: "Step 15: What is the minimum VA you must include for each small-appliance circuit?",
    back: "1,500 VA per small-appliance circuit.",
    category: "load-calculations",
    necReference: "NEC 220.52(A)",
  },
  {
    id: "lc-step-016",
    front: "Step 16: What is the minimum VA for the laundry circuit in a dwelling unit?",
    back: "1,500 VA for the laundry circuit.",
    category: "load-calculations",
    necReference: "NEC 220.52(B)",
  },
  {
    id: "lc-step-017",
    front: "Step 17: Why is the 10 kVA break point important in dwelling calculations?",
    back: "It sets the split for demand factors: full demand first, reduced demand after.",
    category: "load-calculations",
    necReference: "NEC Table 220.42; 220.82(B)",
  },
  {
    id: "lc-step-018",
    front: "Step 18: What is a quick check before finalizing a residential load calc?",
    back: "Verify that all required loads are counted once and demand factors are applied only where allowed.",
    category: "load-calculations",
    necReference: "NEC Article 220",
  },
];

export const RESIDENTIAL_SCENARIO_CARDS: Flashcard[] = [
  {
    id: "lc-scn-001",
    front:
      "A 2,000 sq ft dwelling has two small-appliance circuits and one laundry circuit. What is the total general load before demand factors?",
    back: "Lighting 6,000 VA + small-appliance 3,000 VA + laundry 1,500 VA = 10,500 VA.",
    category: "load-calculations",
    necReference: "NEC Table 220.12; 220.52",
  },
  {
    id: "lc-scn-002",
    front:
      "Using standard method demand factors, what is the general load demand for 12,000 VA of general load?",
    back: "10,000 VA at 100% + 2,000 VA at 35% = 10,700 VA.",
    category: "load-calculations",
    necReference: "NEC Table 220.42",
  },
  {
    id: "lc-scn-003",
    front:
      "Using optional method (220.82), what is the demand for 18,000 VA of general load?",
    back: "10,000 VA at 100% + 8,000 VA at 40% = 13,200 VA.",
    category: "load-calculations",
    necReference: "NEC 220.82(B)",
  },
  {
    id: "lc-scn-004",
    front:
      "A dryer has no nameplate rating available. What load must be included in the calc?",
    back: "5,000 VA minimum per dryer.",
    category: "load-calculations",
    necReference: "NEC 220.54",
  },
  {
    id: "lc-scn-005",
    front:
      "Four fixed appliances total 8,000 VA (excluding range/dryer/HVAC). What demand load is used?",
    back: "Apply 75% demand: 8,000 VA x 0.75 = 6,000 VA.",
    category: "load-calculations",
    necReference: "NEC 220.53",
  },
  {
    id: "lc-scn-006",
    front:
      "A dwelling has 12 kW electric heat and 5 kW A/C. Which load is used?",
    back: "Use the larger noncoincident load: 12 kW heating.",
    category: "load-calculations",
    necReference: "NEC 220.60",
  },
  {
    id: "lc-scn-007",
    front:
      "A 2,400 sq ft dwelling uses the standard method. What is the lighting load?",
    back: "2,400 x 3 VA = 7,200 VA.",
    category: "load-calculations",
    necReference: "NEC Table 220.12",
  },
  {
    id: "lc-scn-008",
    front:
      "You have two small-appliance circuits and one laundry circuit. How much VA must be added?",
    back: "2 x 1,500 VA + 1,500 VA = 4,500 VA.",
    category: "load-calculations",
    necReference: "NEC 220.52(A), 220.52(B)",
  },
  {
    id: "lc-scn-009",
    front:
      "Total calculated load is 28,800 VA on a 240 V service. What is the calculated current?",
    back: "I = VA / V = 28,800 / 240 = 120 A.",
    category: "load-calculations",
    necReference: "NEC 220.40",
  },
  {
    id: "lc-scn-010",
    front:
      "General load total is 9,600 VA. What is the demand load using Table 220.42?",
    back: "All at 100% since it is under 10 kVA: 9,600 VA.",
    category: "load-calculations",
    necReference: "NEC Table 220.42",
  },
  {
    id: "lc-scn-011",
    front:
      "A dwelling has 14,500 VA general load. What is the demand load using Table 220.42?",
    back: "10,000 VA + (4,500 x 0.35) = 11,575 VA.",
    category: "load-calculations",
    necReference: "NEC Table 220.42",
  },
  {
    id: "lc-scn-012",
    front:
      "Optional method general load is 22,000 VA. What is the demand load?",
    back: "10,000 VA + (12,000 x 0.40) = 14,800 VA.",
    category: "load-calculations",
    necReference: "NEC 220.82(B)",
  },
  {
    id: "lc-scn-013",
    front:
      "A range demand is required. Where do you look to determine it?",
    back: "Use Table 220.55 (ranges and cooking appliances).",
    category: "load-calculations",
    necReference: "NEC Table 220.55",
  },
  {
    id: "lc-scn-014",
    front:
      "Why do you keep all loads in VA/kVA until the end?",
    back: "It avoids compounding rounding errors before converting to amperes.",
    category: "load-calculations",
    necReference: "NEC 220.40",
  },
  {
    id: "lc-scn-015",
    front:
      "After calculating total demand, what NEC section ties the service size to the calculated load?",
    back: "Service conductors must be sized to the calculated load.",
    category: "load-calculations",
    necReference: "NEC 230.42",
  },
];

export const FLASHCARD_SETS: FlashcardSet[] = [
  {
    id: "residential-steps",
    name: "Residential Load Calc - Steps",
    description: "Memorize the sequence and key NEC references for dwelling load calculations.",
    cards: RESIDENTIAL_STEP_CARDS,
  },
  {
    id: "residential-scenarios",
    name: "Residential Load Calc - Scenarios",
    description: "Practice quick numeric scenarios using 2023 NEC references.",
    cards: RESIDENTIAL_SCENARIO_CARDS,
  },
];

export const FLASHCARDS: Flashcard[] = FLASHCARD_SETS.flatMap((set) => set.cards);
