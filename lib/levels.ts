// Level system configuration for SparkPass
// XP thresholds from SP-020: 1:0, 2:500, 3:1000, 4:2000, 5:3500, 6:5500, 7:8000, 8:11000, 9:15000, 10:20000

// XP reward constants
export const XP_REWARDS = {
  CORRECT_ANSWER: 25,
  QUIZ_COMPLETE: 50,
} as const;

export const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0, title: "Apprentice" },
  { level: 2, xp: 500, title: "Wire Puller" },
  { level: 3, xp: 1000, title: "Circuit Rookie" },
  { level: 4, xp: 2000, title: "Voltage Learner" },
  { level: 5, xp: 3500, title: "Current Carrier" },
  { level: 6, xp: 5500, title: "Panel Pro" },
  { level: 7, xp: 8000, title: "Load Calculator" },
  { level: 8, xp: 11000, title: "Code Scholar" },
  { level: 9, xp: 15000, title: "Master Candidate" },
  { level: 10, xp: 20000, title: "Master Electrician" },
] as const;

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i].xp) {
      return LEVEL_THRESHOLDS[i].level;
    }
  }
  return 1;
}

export function getLevelTitle(level: number): string {
  const levelData = LEVEL_THRESHOLDS.find((l) => l.level === level);
  return levelData?.title || "Apprentice";
}

export function getXPForLevel(level: number): number {
  const levelData = LEVEL_THRESHOLDS.find((l) => l.level === level);
  return levelData?.xp || 0;
}

export function getXPForNextLevel(currentLevel: number): number {
  const nextLevel = LEVEL_THRESHOLDS.find((l) => l.level === currentLevel + 1);
  return nextLevel?.xp || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].xp;
}

export function getXPProgress(xp: number, level: number): { current: number; needed: number; percentage: number } {
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForNextLevel(level);

  const xpIntoCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;

  // If at max level, show full bar
  if (level >= 10) {
    return { current: xp, needed: xp, percentage: 100 };
  }

  const percentage = Math.min(100, Math.round((xpIntoCurrentLevel / xpNeededForNextLevel) * 100));

  return {
    current: xpIntoCurrentLevel,
    needed: xpNeededForNextLevel,
    percentage,
  };
}

/**
 * Checks if a level-up occurred when XP increased.
 * Returns the new level info if a level-up happened, or null if not.
 */
export function checkLevelUp(
  previousXP: number,
  newXP: number
): { newLevel: number; newTitle: string } | null {
  const previousLevel = getLevelFromXP(previousXP);
  const newLevel = getLevelFromXP(newXP);

  if (newLevel > previousLevel) {
    return {
      newLevel,
      newTitle: getLevelTitle(newLevel),
    };
  }

  return null;
}

/**
 * Calculates XP earned from a quiz session based on correct answers.
 */
export function calculateQuizXP(correctAnswers: number): {
  answerXP: number;
  bonusXP: number;
  totalXP: number;
} {
  const answerXP = correctAnswers * XP_REWARDS.CORRECT_ANSWER;
  const bonusXP = XP_REWARDS.QUIZ_COMPLETE;
  return {
    answerXP,
    bonusXP,
    totalXP: answerXP + bonusXP,
  };
}
