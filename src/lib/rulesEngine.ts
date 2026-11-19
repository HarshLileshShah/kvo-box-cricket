import { BallOutcomeType, DismissalType, PlayerCategory } from '@/types/cricket';

export interface CalculateBallRunsParams {
  outcomeType: BallOutcomeType;
  batsmanCategory: PlayerCategory;
  isPowerOver: boolean;
  extraBatRunsOnNoBall?: number; // runs run between wickets or hit on NB
  isCatchByFemale?: boolean;
}

export interface CalculatedBallResult {
  effectiveTeamRuns: number; // Added to team total (negative for wickets!)
  batsmanRuns: number;       // Credited to batsman's stats
  rawRuns: number;           // Display number (e.g. 4, 6, 1)
  isLegalDelivery: boolean;
  isWicket: boolean;
  isBoundary: boolean;
  isFour: boolean;
  isSix: boolean;
  commentary: string;
}

/**
 * ADIOR STONE Presents KVO BOX CRICKET TOURNAMENT
 * Official Rules Engine
 */
export function calculateBallOutcome(params: CalculateBallRunsParams): CalculatedBallResult {
  const { outcomeType, batsmanCategory, isPowerOver, extraBatRunsOnNoBall = 0, isCatchByFemale = false } = params;

  // 1. WICKETS / DISMISSALS
  // - Batters DO NOT leave after dismissal; they continue batting.
  // - Score CAN become negative (e.g. 0 -> -2, or 0 -> -4).
  // - Normal over standard dismissal: -2 runs deducted.
  // - Normal over caught by female player: -4 runs deducted (-2 standard wicket + -2 female catch bonus reduction).
  // - Power over standard dismissal: -5 runs deducted.
  // - Power over caught by female player: -7 runs deducted (-5 power wicket + -2 female catch bonus reduction).
  if (outcomeType === 'WICKET') {
    let deduction = -2;
    let comment = 'WICKET! Batters continue. 2 runs deducted (-2).';

    if (isPowerOver) {
      if (isCatchByFemale) {
        deduction = -7;
        comment = 'POWER OVER WICKET! Caught by Female Player! 7 runs deducted (-7: 5 power wicket + 2 female catch).';
      } else {
        deduction = -5;
        comment = 'POWER OVER WICKET! 5 runs deducted (-5).';
      }
    } else if (isCatchByFemale) {
      deduction = -4; // -2 wicket + -2 female catch reduction = -4 runs
      comment = 'WICKET! Caught by Female Player! 4 runs deducted (-4: 2 dismissal + 2 female catch reduction).';
    }

    return {
      effectiveTeamRuns: deduction,
      batsmanRuns: 0,
      rawRuns: 0,
      isLegalDelivery: true,
      isWicket: true,
      isBoundary: false,
      isFour: false,
      isSix: false,
      commentary: comment,
    };
  }

  // 2. EXTRAS: WIDE
  // Standard cricket rule: 1 run + extra ball
  // Wide penalties count as normal runs and are not doubled in power over
  if (outcomeType === 'WIDE') {
    return {
      effectiveTeamRuns: 1,
      batsmanRuns: 0,
      rawRuns: 1,
      isLegalDelivery: false,
      isWicket: false,
      isBoundary: false,
      isFour: false,
      isSix: false,
      commentary: 'Wide ball: 1 run + extra delivery.',
    };
  }

  // 3. EXTRAS: NO-BALL
  // 1 run penalty + free hit.
  // Runs scored off the bat on a no-ball are doubled during power over.
  if (outcomeType === 'NO_BALL') {
    let batRuns = extraBatRunsOnNoBall;
    if (batsmanCategory === 'FEMALE') {
      batRuns = batRuns * 2;
    }
    if (isPowerOver && batRuns > 0) {
      batRuns = batRuns * 2;
    }
    const totalRuns = 1 + batRuns;

    return {
      effectiveTeamRuns: totalRuns,
      batsmanRuns: batRuns,
      rawRuns: totalRuns,
      isLegalDelivery: false,
      isWicket: false,
      isBoundary: false,
      isFour: false,
      isSix: false,
      commentary: `No Ball: 1 penalty run ${batRuns > 0 ? `+ ${batRuns} bat runs` : ''} + Free Hit!`,
    };
  }

  // 4. EXTRAS: BYE
  // Byes will not be doubled in Power Over
  if (outcomeType === 'BYE') {
    return {
      effectiveTeamRuns: 1,
      batsmanRuns: 0,
      rawRuns: 1,
      isLegalDelivery: true,
      isWicket: false,
      isBoundary: false,
      isFour: false,
      isSix: false,
      commentary: 'Bye: 1 run taken.',
    };
  }

  // 5. DOT BALL
  if (outcomeType === 'DOT') {
    return {
      effectiveTeamRuns: 0,
      batsmanRuns: 0,
      rawRuns: 0,
      isLegalDelivery: true,
      isWicket: false,
      isBoundary: false,
      isFour: false,
      isSix: false,
      commentary: 'Dot ball.',
    };
  }

  // 6. DECLARATION RUNS (1D / 2D)
  // "A ball going out through sides is 1D, if hit by the female is 2D. During power over the power over rules apply"
  if (outcomeType === 'DECLARATION_1D') {
    let runs = batsmanCategory === 'FEMALE' ? 2 : 1;
    if (isPowerOver) {
      runs = runs * 2;
    }

    return {
      effectiveTeamRuns: runs,
      batsmanRuns: runs,
      rawRuns: runs,
      isLegalDelivery: true,
      isWicket: false,
      isBoundary: false,
      isFour: false,
      isSix: false,
      commentary: `Side net hit (${batsmanCategory === 'FEMALE' ? '2D Female' : '1D'}${isPowerOver ? ' - Power Over 2x' : ''}): ${runs} run(s).`,
    };
  }

  // 7. BAT RUNS: RUN_1, RUN_2, RUN_3
  if (outcomeType === 'RUN_1' || outcomeType === 'RUN_2' || outcomeType === 'RUN_3') {
    const base = outcomeType === 'RUN_1' ? 1 : outcomeType === 'RUN_2' ? 2 : 3;
    let score = base;

    // Runs hit by women players are doubled
    if (batsmanCategory === 'FEMALE') {
      score = base * 2;
    }

    // Power Over: all runs scored off the bat doubled
    if (isPowerOver) {
      score = score * 2;
    }

    return {
      effectiveTeamRuns: score,
      batsmanRuns: score,
      rawRuns: base,
      isLegalDelivery: true,
      isWicket: false,
      isBoundary: false,
      isFour: false,
      isSix: false,
      commentary: `${base} run(s) scored ${batsmanCategory === 'FEMALE' ? '(Doubled for Female)' : ''}${isPowerOver ? ' [Power Over 2x]' : ''} = ${score} runs.`,
    };
  }

  // 8. FOUR (BOUNDARY)
  // Boundary scored by female, Senior and kid player: Four: +1 run extra
  // Runs hit by women players doubled:
  // For Female: (4 x 2) + 1 = 9 runs.
  // For Senior / Kid: 4 + 1 = 5 runs.
  // For Regular: 4 runs.
  // During Power Over: runs off bat doubled.
  if (outcomeType === 'FOUR') {
    let score = 4;
    let desc = 'FOUR!';

    if (batsmanCategory === 'FEMALE') {
      score = 4 * 2 + 1; // 9 runs
      desc = 'FOUR by Female Player! (4x2)+1 = 9 runs!';
    } else if (batsmanCategory === 'SENIOR' || batsmanCategory === 'KID') {
      score = 4 + 1; // 5 runs
      desc = `FOUR by ${batsmanCategory === 'SENIOR' ? 'Senior Citizen' : 'Junior Player'}! 4+1 = 5 runs!`;
    }

    if (isPowerOver) {
      score = score * 2;
      desc += ' [POWER OVER 2x]';
    }

    return {
      effectiveTeamRuns: score,
      batsmanRuns: score,
      rawRuns: 4,
      isLegalDelivery: true,
      isWicket: false,
      isBoundary: true,
      isFour: true,
      isSix: false,
      commentary: `${desc} (${score} runs)`,
    };
  }

  // 9. SIX (MAXIMUM)
  // Boundary scored by female, Senior and kid player: Six: +2 run Extra
  // Example given in PDF: if a woman hits a six then the score would be (6x2)+2 = 14 runs!
  // For Senior / Kid: 6 + 2 = 8 runs.
  // For Regular: 6 runs.
  // During Power Over: doubled!
  if (outcomeType === 'SIX') {
    let score = 6;
    let desc = 'SIX! Magnificent shot!';

    if (batsmanCategory === 'FEMALE') {
      score = 6 * 2 + 2; // 14 runs
      desc = 'SIX by Female Player! (6x2)+2 = 14 runs!';
    } else if (batsmanCategory === 'SENIOR' || batsmanCategory === 'KID') {
      score = 6 + 2; // 8 runs
      desc = `SIX by ${batsmanCategory === 'SENIOR' ? 'Senior Citizen' : 'Junior Player'}! 6+2 = 8 runs!`;
    }

    if (isPowerOver) {
      score = score * 2;
      desc += ' [POWER OVER 2x]';
    }

    return {
      effectiveTeamRuns: score,
      batsmanRuns: score,
      rawRuns: 6,
      isLegalDelivery: true,
      isWicket: false,
      isBoundary: true,
      isFour: false,
      isSix: true,
      commentary: `${desc} (${score} runs)`,
    };
  }

  return {
    effectiveTeamRuns: 0,
    batsmanRuns: 0,
    rawRuns: 0,
    isLegalDelivery: true,
    isWicket: false,
    isBoundary: false,
    isFour: false,
    isSix: false,
    commentary: '',
  };
}

/**
 * Checks rules compliance warnings:
 * 1. Overs 1 & 2 must be Female batting pair
 * 2. Overs 1 & 2 must be Female bowler
 * 3. Junior must bat before 6th over
 * 4. Senior must face at least 6 balls
 * 5. In Semi/Final Over 5: Senior citizen must bowl and opposing senior must bat solo
 */
export function checkRuleCompliance(params: {
  currentOver: number;
  isSemiFinalOrFinal: boolean;
  strikerCategory: PlayerCategory;
  nonStrikerCategory: PlayerCategory;
  bowlerCategory: PlayerCategory;
  seniorBallsFaced: number;
  juniorHasBatted: boolean;
}): { warnings: string[]; info: string[] } {
  const warnings: string[] = [];
  const info: string[] = [];

  const {
    currentOver,
    isSemiFinalOrFinal,
    strikerCategory,
    nonStrikerCategory,
    bowlerCategory,
    seniorBallsFaced,
    juniorHasBatted,
  } = params;

  // Overs 1 & 2: Female Batting Pair Mandate
  if (currentOver === 1 || currentOver === 2) {
    if (strikerCategory !== 'FEMALE' || nonStrikerCategory !== 'FEMALE') {
      warnings.push(`Rule Warning: Overs 1 & 2 must be batted exclusively by the Female pair.`);
    } else {
      info.push(`Mandatory: Female batting pair active for Overs 1 & 2.`);
    }

    // Overs 1 & 2: Female Bowler Mandate
    if (bowlerCategory !== 'FEMALE') {
      warnings.push(`Rule Warning: Overs 1 & 2 must be bowled by a Female bowler.`);
    } else {
      info.push(`Mandatory: Female bowler bowling to female pair.`);
    }
  }

  // Semi-Final & Final: Over 5 Senior Solo Mandate
  if (isSemiFinalOrFinal && currentOver === 5) {
    if (bowlerCategory !== 'SENIOR') {
      warnings.push(`Semi/Final Rule: Over 5 must be bowled by the Senior Citizen player.`);
    }
    if (strikerCategory !== 'SENIOR') {
      warnings.push(`Semi/Final Rule: Over 5 must be faced solo by the opposing Senior Citizen player.`);
    }
  }

  // Junior rule: Must bat before completion of 6th over
  if (currentOver >= 5 && !juniorHasBatted) {
    warnings.push(`Junior Rule Alert: Junior player must bat before the completion of the 6th over!`);
  }

  // Senior rule: Must face at least 6 balls
  if (currentOver >= 6 && seniorBallsFaced < 6) {
    warnings.push(`Senior Citizen Rule: Senior has only faced ${seniorBallsFaced}/6 required balls.`);
  }

  return { warnings, info };
}

/**
 * Calculates Net Run Rate (NRR)
 */
export function calculateNRR(
  runsScored: number,
  oversFaced: number,
  runsConceded: number,
  oversBowled: number
): number {
  if (oversFaced === 0 || oversBowled === 0) return 0;
  const battingRate = runsScored / oversFaced;
  const bowlingRate = runsConceded / oversBowled;
  return Number((battingRate - bowlingRate).toFixed(3));
}
