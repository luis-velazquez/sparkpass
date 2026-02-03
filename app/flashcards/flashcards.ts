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

// Load Calculations - Steps (Article 220)
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

// Load Calculations - Scenarios (Article 220)
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

// Grounding & Bonding Flashcards (Article 250)
export const GROUNDING_BONDING_CARDS: Flashcard[] = [
  {
    id: "gb-001",
    front: "What is the purpose of grounding electrical systems?",
    back: "To limit voltage from lightning, line surges, and contact with higher-voltage lines; and to stabilize voltage to earth during normal operation.",
    category: "grounding-bonding",
    necReference: "NEC 250.4(A)(1)",
  },
  {
    id: "gb-002",
    front: "What is the purpose of bonding?",
    back: "To establish an effective ground-fault current path capable of carrying fault current to facilitate overcurrent device operation.",
    category: "grounding-bonding",
    necReference: "NEC 250.4(A)(3)",
  },
  {
    id: "gb-003",
    front: "Where must the grounding electrode conductor connect?",
    back: "To the grounding electrode system at the service or separately derived system.",
    category: "grounding-bonding",
    necReference: "NEC 250.24(A)",
  },
  {
    id: "gb-004",
    front: "What is the minimum size copper grounding electrode conductor for a 200A service?",
    back: "4 AWG copper.",
    category: "grounding-bonding",
    necReference: "NEC Table 250.66",
  },
  {
    id: "gb-005",
    front: "What electrodes make up the grounding electrode system?",
    back: "Metal underground water pipe, metal building frame, concrete-encased electrode (Ufer), ground ring, rod/pipe electrodes, plate electrodes.",
    category: "grounding-bonding",
    necReference: "NEC 250.52",
  },
  {
    id: "gb-006",
    front: "What is the minimum length for a driven ground rod?",
    back: "8 feet in contact with soil.",
    category: "grounding-bonding",
    necReference: "NEC 250.52(A)(5)",
  },
  {
    id: "gb-007",
    front: "When is a supplemental electrode required with a water pipe electrode?",
    back: "Always - a metal underground water pipe must be supplemented by an additional electrode.",
    category: "grounding-bonding",
    necReference: "NEC 250.53(D)(2)",
  },
  {
    id: "gb-008",
    front: "What is the maximum resistance for a single rod electrode before a second rod is required?",
    back: "25 ohms. If over 25 ohms, a second rod is required.",
    category: "grounding-bonding",
    necReference: "NEC 250.53(A)(2)",
  },
  {
    id: "gb-009",
    front: "How do you size the equipment grounding conductor (EGC)?",
    back: "Based on the rating of the overcurrent device using Table 250.122.",
    category: "grounding-bonding",
    necReference: "NEC Table 250.122",
  },
  {
    id: "gb-010",
    front: "What is the minimum EGC size for a 60A circuit?",
    back: "10 AWG copper or 8 AWG aluminum.",
    category: "grounding-bonding",
    necReference: "NEC Table 250.122",
  },
  {
    id: "gb-011",
    front: "What is the main bonding jumper?",
    back: "The connection between the grounded conductor and the equipment grounding conductor at the service.",
    category: "grounding-bonding",
    necReference: "NEC 250.28",
  },
  {
    id: "gb-012",
    front: "Where is the neutral-to-ground bond made?",
    back: "At the service disconnecting means or at a separately derived system.",
    category: "grounding-bonding",
    necReference: "NEC 250.24(A)(5)",
  },
  {
    id: "gb-013",
    front: "What is a concrete-encased electrode (Ufer ground)?",
    back: "20 ft of 4 AWG copper or 1/2\" rebar encased in 2\" of concrete in direct contact with earth.",
    category: "grounding-bonding",
    necReference: "NEC 250.52(A)(3)",
  },
  {
    id: "gb-014",
    front: "What bonding is required for metal water piping in a building?",
    back: "Interior metal water piping must be bonded to the service equipment, grounded conductor, or GEC.",
    category: "grounding-bonding",
    necReference: "NEC 250.104(A)",
  },
  {
    id: "gb-015",
    front: "Can the neutral be used as an EGC in a subpanel?",
    back: "No. Neutral and ground must be separated in subpanels; bonding only occurs at the service.",
    category: "grounding-bonding",
    necReference: "NEC 250.142(B)",
  },
];

// Services Flashcards (Article 230)
export const SERVICES_CARDS: Flashcard[] = [
  {
    id: "sv-001",
    front: "What is the minimum service size for a single-family dwelling?",
    back: "100 amperes, 3-wire.",
    category: "services",
    necReference: "NEC 230.79(C)",
  },
  {
    id: "sv-002",
    front: "How many services are generally permitted per building?",
    back: "One service, with specific exceptions allowed.",
    category: "services",
    necReference: "NEC 230.2",
  },
  {
    id: "sv-003",
    front: "What is the maximum number of service disconnects permitted?",
    back: "Six disconnects grouped in one location.",
    category: "services",
    necReference: "NEC 230.71(A)",
  },
  {
    id: "sv-004",
    front: "What is the minimum clearance for service drops over residential driveways?",
    back: "12 feet.",
    category: "services",
    necReference: "NEC 230.24(B)",
  },
  {
    id: "sv-005",
    front: "What is the minimum clearance for service drops over public streets?",
    back: "18 feet.",
    category: "services",
    necReference: "NEC 230.24(B)",
  },
  {
    id: "sv-006",
    front: "What is the minimum clearance for service drops over roofs (general)?",
    back: "8 feet, with specific reductions allowed in certain conditions.",
    category: "services",
    necReference: "NEC 230.24(A)",
  },
  {
    id: "sv-007",
    front: "Where must the service disconnecting means be located?",
    back: "At a readily accessible location, nearest the point of service entrance.",
    category: "services",
    necReference: "NEC 230.70(A)",
  },
  {
    id: "sv-008",
    front: "What determines service conductor ampacity?",
    back: "Not less than the calculated load per Article 220.",
    category: "services",
    necReference: "NEC 230.42(A)",
  },
  {
    id: "sv-009",
    front: "What is the minimum size for service-entrance conductors (copper)?",
    back: "8 AWG copper for 100A or less service.",
    category: "services",
    necReference: "NEC 230.42(A)",
  },
  {
    id: "sv-010",
    front: "Must service conductors have overcurrent protection?",
    back: "Yes, at their ampacity with up to six disconnects.",
    category: "services",
    necReference: "NEC 230.90",
  },
  {
    id: "sv-011",
    front: "What is the service point?",
    back: "The point of connection between utility facilities and customer premises wiring.",
    category: "services",
    necReference: "NEC Article 100",
  },
  {
    id: "sv-012",
    front: "What wiring methods are permitted for service-entrance conductors?",
    back: "Open wiring, rigid metal conduit, IMC, EMT, service-entrance cable, and other methods in 230.43.",
    category: "services",
    necReference: "NEC 230.43",
  },
  {
    id: "sv-013",
    front: "What marking is required on service equipment?",
    back: "Marked as suitable for use as service equipment.",
    category: "services",
    necReference: "NEC 230.66",
  },
  {
    id: "sv-014",
    front: "What is the minimum height for a meter socket installation?",
    back: "Typically 4-6 feet per utility requirements (NEC defers to utility).",
    category: "services",
    necReference: "Utility Requirements",
  },
  {
    id: "sv-015",
    front: "When can service conductors pass through a building?",
    back: "When installed in rigid metal conduit, IMC, or Schedule 80 PVC, or enclosed in 2\" concrete.",
    category: "services",
    necReference: "NEC 230.6",
  },
];

// Chapter 9 Tables Flashcards
export const CHAPTER_9_TABLES_CARDS: Flashcard[] = [
  {
    id: "c9-001",
    front: "What is the maximum conduit fill percentage for ONE conductor?",
    back: "53% of the conduit's total area.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 1",
  },
  {
    id: "c9-002",
    front: "What is the maximum conduit fill percentage for TWO conductors?",
    back: "31% of the conduit's total area.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 1",
  },
  {
    id: "c9-003",
    front: "What is the maximum conduit fill percentage for THREE or more conductors?",
    back: "40% of the conduit's total area.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 1",
  },
  {
    id: "c9-004",
    front: "Which Chapter 9 table gives you the INTERNAL AREA of conduit and tubing?",
    back: "Table 4 - Dimensions and Percent Area of Conduit and Tubing.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 4",
  },
  {
    id: "c9-005",
    front: "Which Chapter 9 table gives you the AREA of individual conductors?",
    back: "Table 5 - Dimensions of Insulated Conductors and Fixture Wires.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 5",
  },
  {
    id: "c9-006",
    front: "What is a circular mil?",
    back: "The area of a circle with a diameter of 1 mil (0.001 inch). Used to express wire cross-sectional area.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 8",
  },
  {
    id: "c9-007",
    front: "Which Chapter 9 table provides DC resistance and circular mil area of conductors?",
    back: "Table 8 - Conductor Properties.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 8",
  },
  {
    id: "c9-008",
    front: "Which Chapter 9 table is used for AC voltage drop calculations?",
    back: "Table 9 - AC Resistance and Reactance for 600-Volt Cables.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 9",
  },
  {
    id: "c9-009",
    front: "Where do you find pre-calculated conduit fill tables showing how many conductors fit in each conduit size?",
    back: "Annex C - Conduit and Tubing Fill Tables for Conductors of the Same Size.",
    category: "chapter-9-tables",
    necReference: "NEC Annex C",
  },
  {
    id: "c9-010",
    front: "What is the basic formula for conduit fill calculation?",
    back: "Total conductor area ÷ Allowable fill percentage = Minimum conduit area needed. Then select conduit from Table 4.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Tables 1, 4, 5",
  },
  {
    id: "c9-011",
    front: "For conduit fill with DIFFERENT size conductors, what must you do?",
    back: "Add up the individual areas from Table 5, then compare to the 40% fill area from Table 4.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Tables 4 & 5",
  },
  {
    id: "c9-012",
    front: "What is the area of a 12 AWG THHN conductor?",
    back: "0.0133 sq inches (from Table 5).",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 5",
  },
  {
    id: "c9-013",
    front: "How many 12 AWG THHN conductors can fit in 3/4\" EMT?",
    back: "16 conductors (from Annex C, Table C.1).",
    category: "chapter-9-tables",
    necReference: "NEC Annex C, Table C.1",
  },
  {
    id: "c9-014",
    front: "What is the 40% fill area for 1\" EMT?",
    back: "0.346 sq inches.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 4",
  },
  {
    id: "c9-015",
    front: "When using Table 9 for voltage drop, what does 'Effective Z' represent?",
    back: "The combined effect of resistance and reactance at a specific power factor, used for AC voltage drop calculations.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 9",
  },
  {
    id: "c9-016",
    front: "What is the DC resistance of 500 kcmil copper conductor at 75°C?",
    back: "0.027 ohms per 1000 feet (from Table 8, uncoated copper).",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 8",
  },
  {
    id: "c9-017",
    front: "What does 'kcmil' stand for and what does it mean?",
    back: "Kilo-circular mils. 1 kcmil = 1,000 circular mils. It's the standard unit for large conductor sizes.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 8",
  },
  {
    id: "c9-018",
    front: "Why is the 40% fill rule used for 3+ conductors instead of a higher percentage?",
    back: "To allow for heat dissipation and to make pulling conductors through conduit practical without damaging insulation.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 1 Notes",
  },
  {
    id: "c9-019",
    front: "What is the formula for calculating voltage drop using Table 8 (DC)?",
    back: "VD = 2 × K × I × D / CM, where K=12.9 (copper) or 21.2 (aluminum), I=amps, D=distance, CM=circular mils.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 8",
  },
  {
    id: "c9-020",
    front: "Equipment grounding conductors in a conduit: Do they count toward conduit fill?",
    back: "Yes! All conductors including EGCs must be counted when calculating conduit fill.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 1 Note 3",
  },
  {
    id: "c9-021",
    front: "If the NEC article says “use Chapter 9, Table 1,” what are you finding?",
    back: "The allowable conduit fill percentage based on the number of conductors.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 1",
  },
  {
    id: "c9-022",
    front: "If you know total conductor area, which Chapter 9 table helps you choose the conduit size?",
    back: "Table 4 provides conduit areas used to select a raceway size.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 4",
  },
  {
    id: "c9-023",
    front: "Where do you find conductor areas when insulation type changes (THHN vs XHHW, etc.)?",
    back: "Table 5 lists conductor areas by insulation type.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 5",
  },
  {
    id: "c9-024",
    front: "You have a mixed conductor pull. What is the correct Chapter 9 workflow?",
    back: "Sum areas from Table 5, apply Table 1 fill %, then verify conduit area in Table 4.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Tables 1, 4, 5",
  },
  {
    id: "c9-025",
    front: "When is Annex C appropriate to use for conduit fill?",
    back: "When all conductors are the same size and insulation type and the table applies to the raceway.",
    category: "chapter-9-tables",
    necReference: "NEC Annex C",
  },
  {
    id: "c9-026",
    front: "If Annex C doesn’t match your conductor mix, what should you do?",
    back: "Use Chapter 9 Tables 1, 4, and 5 to calculate fill directly.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9; Annex C",
  },
  {
    id: "c9-027",
    front: "You need AC resistance and reactance for voltage drop. Which table is referenced?",
    back: "Chapter 9, Table 9 provides AC resistance and reactance values.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 9",
  },
  {
    id: "c9-028",
    front: "You need DC resistance for voltage drop calculations. Which table is referenced?",
    back: "Chapter 9, Table 8 provides DC resistance and conductor properties.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 8",
  },
  {
    id: "c9-029",
    front: "Where do you confirm the insulation temperature rating for a conductor type?",
    back: "Table 310.104(A) is referenced for insulation types and ratings.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9; Table 310.104(A)",
  },
  {
    id: "c9-030",
    front: "When does Chapter 9 apply by default?",
    back: "Only when an NEC article or section specifically references it.",
    category: "chapter-9-tables",
    necReference: "NEC 90.3",
  },
  {
    id: "c9-031",
    front: "You need to confirm the internal area for a raceway type. Which table is used?",
    back: "Table 4 provides internal areas for conduit and tubing.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 4",
  },
  {
    id: "c9-032",
    front: "You are calculating fill for more than two conductors. Which fill percentage applies?",
    back: "Use the 40% fill rule from Table 1.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 1",
  },
  {
    id: "c9-033",
    front: "Where do you find conductor area for a specific AWG size?",
    back: "Table 5 lists areas by AWG/kcmil and insulation type.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 5",
  },
  {
    id: "c9-034",
    front: "If a calculation requires circular mils, where do you find CM values?",
    back: "Chapter 9, Table 8 lists circular mil areas.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 8",
  },
  {
    id: "c9-035",
    front: "Which table is commonly used with power factor to determine AC voltage drop?",
    back: "Table 9 is used with power factor for AC voltage drop calculations.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 9",
  },
  {
    id: "c9-036",
    front: "You need to size a raceway without Annex C. Which three Chapter 9 tables do you use?",
    back: "Table 1 (fill %), Table 4 (raceway area), and Table 5 (conductor area).",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Tables 1, 4, 5",
  },
  {
    id: "c9-037",
    front: "Where do you find conductor properties used in voltage drop and heating calculations?",
    back: "Table 8 provides conductor properties and resistance data.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 8",
  },
  {
    id: "c9-038",
    front: "If a question says “use Table 1 notes,” what is the topic?",
    back: "Conduit fill rules and exceptions tied to Table 1.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 1 Notes",
  },
  {
    id: "c9-039",
    front: "You need to verify raceway fill for a short nipple. Which table still applies?",
    back: "Table 1 still provides fill rules unless the article allows a different allowance.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9, Table 1",
  },
  {
    id: "c9-040",
    front: "Which chapter should you check first when a calculation calls for a table?",
    back: "Chapter 9, unless the article points to a different table or annex.",
    category: "chapter-9-tables",
    necReference: "NEC Chapter 9",
  },
];

export const FLASHCARD_SETS: FlashcardSet[] = [
  {
    id: "residential-steps",
    name: "Load Calc - Steps",
    description: "Article 220 - Step-by-step dwelling load calculation process.",
    cards: RESIDENTIAL_STEP_CARDS,
  },
  {
    id: "residential-scenarios",
    name: "Load Calc - Scenarios",
    description: "Article 220 - Practice numeric scenarios for load calculations.",
    cards: RESIDENTIAL_SCENARIO_CARDS,
  },
  {
    id: "grounding-bonding",
    name: "Grounding & Bonding",
    description: "Article 250 - Grounding electrode systems, bonding, and EGC sizing.",
    cards: GROUNDING_BONDING_CARDS,
  },
  {
    id: "services",
    name: "Services",
    description: "Article 230 - Service entrance, disconnects, and clearances.",
    cards: SERVICES_CARDS,
  },
  {
    id: "chapter-9-tables",
    name: "Chapter 9 Tables",
    description: "Chapter 9 - Conduit fill, conductor properties, and voltage drop tables.",
    cards: CHAPTER_9_TABLES_CARDS,
  },
];

export const FLASHCARDS: Flashcard[] = FLASHCARD_SETS.flatMap((set) => set.cards);
