import { Standing } from './nhlApi';

export interface MatchupNode {
  id: string; // e.g., 'R1-E-1'
  round: number;
  match: number;
  team1: Standing | null;
  team2: Standing | null;
  winner: Standing | null;
  nextMatchupId: string | null;
  nextSlot: 1 | 2 | null; // 1 means winner goes to team1 of next matchup, 2 means team2
}

export interface BracketState {
  matchups: Record<string, MatchupNode>;
  baseHash: string; // Hash or stringified standings to detect changes
}

export function generateInitialBracket(standings: Standing[]): BracketState {
  const matchups: Record<string, MatchupNode> = {};

  const teamsByConference = standings.reduce((acc, team) => {
    if (!acc[team.conferenceName]) acc[team.conferenceName] = [];
    acc[team.conferenceName].push(team);
    return acc;
  }, {} as Record<string, Standing[]>);

  const sortTeams = (a: Standing, b: Standing) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.regulationWins - a.regulationWins;
  };

  const conferences = ['Eastern', 'Western'];

  conferences.forEach((conf) => {
    const confTeams = teamsByConference[conf] || [];
    const divisions = Array.from(new Set(confTeams.map(t => t.divisionName)));
    
    if (divisions.length < 2) return;

    const div1Teams = confTeams.filter(t => t.divisionName === divisions[0]).sort(sortTeams);
    const div2Teams = confTeams.filter(t => t.divisionName === divisions[1]).sort(sortTeams);

    const div1Top3 = div1Teams.slice(0, 3);
    const div2Top3 = div2Teams.slice(0, 3);

    const remainingTeams = [
      ...div1Teams.slice(3),
      ...div2Teams.slice(3)
    ].sort(sortTeams);

    const wildcards = remainingTeams.slice(0, 2);

    const div1Winner = div1Top3[0];
    const div2Winner = div2Top3[0];

    let p1Matchup: [Standing | null, Standing | null];
    let p2Matchup: [Standing | null, Standing | null];

    if ((div1Winner?.points || 0) >= (div2Winner?.points || 0)) {
        p1Matchup = [div1Winner || null, wildcards[1] || null];
        p2Matchup = [div2Winner || null, wildcards[0] || null];
    } else {
        p1Matchup = [div2Winner || null, wildcards[1] || null];
        p2Matchup = [div1Winner || null, wildcards[0] || null];
    }

    const p3Matchup: [Standing | null, Standing | null] = [div1Top3[1] || null, div1Top3[2] || null];
    const p4Matchup: [Standing | null, Standing | null] = [div2Top3[1] || null, div2Top3[2] || null];

    const confPrefix = conf.charAt(0); // E or W

    // Round 1
    // M1 vs M2 -> winner goes to R2-1
    // M3 vs M4 -> winner goes to R2-2
    matchups[`R1-${confPrefix}-1`] = { id: `R1-${confPrefix}-1`, round: 1, match: 1, team1: p1Matchup[0], team2: p1Matchup[1], winner: null, nextMatchupId: `R2-${confPrefix}-1`, nextSlot: 1 };
    matchups[`R1-${confPrefix}-2`] = { id: `R1-${confPrefix}-2`, round: 1, match: 2, team1: p3Matchup[0], team2: p3Matchup[1], winner: null, nextMatchupId: `R2-${confPrefix}-1`, nextSlot: 2 };
    matchups[`R1-${confPrefix}-3`] = { id: `R1-${confPrefix}-3`, round: 1, match: 3, team1: p2Matchup[0], team2: p2Matchup[1], winner: null, nextMatchupId: `R2-${confPrefix}-2`, nextSlot: 1 };
    matchups[`R1-${confPrefix}-4`] = { id: `R1-${confPrefix}-4`, round: 1, match: 4, team1: p4Matchup[0], team2: p4Matchup[1], winner: null, nextMatchupId: `R2-${confPrefix}-2`, nextSlot: 2 };

    // Round 2
    matchups[`R2-${confPrefix}-1`] = { id: `R2-${confPrefix}-1`, round: 2, match: 1, team1: null, team2: null, winner: null, nextMatchupId: `R3-${confPrefix}-1`, nextSlot: 1 };
    matchups[`R2-${confPrefix}-2`] = { id: `R2-${confPrefix}-2`, round: 2, match: 2, team1: null, team2: null, winner: null, nextMatchupId: `R3-${confPrefix}-1`, nextSlot: 2 };

    // Round 3 (Conference Finals)
    matchups[`R3-${confPrefix}-1`] = { id: `R3-${confPrefix}-1`, round: 3, match: 1, team1: null, team2: null, winner: null, nextMatchupId: `R4-SCF-1`, nextSlot: confPrefix === 'E' ? 1 : 2 };
  });

  // Round 4 (Stanley Cup Finals)
  matchups[`R4-SCF-1`] = { id: `R4-SCF-1`, round: 4, match: 1, team1: null, team2: null, winner: null, nextMatchupId: null, nextSlot: null };

  // Hash standings to detect changes
  const baseHash = JSON.stringify(standings.map(t => t.teamAbbrev.default));

  return { matchups, baseHash };
}

export function advanceTeam(state: BracketState, matchupId: string, winner: Standing): BracketState {
  // Deep clone to avoid mutating state directly
  const newState = JSON.parse(JSON.stringify(state)) as BracketState;
  const matchup = newState.matchups[matchupId];
  
  if (!matchup) return newState;

  // If changing winner, clear downstream path
  if (matchup.winner && matchup.winner.teamAbbrev.default !== winner.teamAbbrev.default) {
      clearDownstream(newState, matchupId, matchup.winner);
  }

  matchup.winner = winner;

  if (matchup.nextMatchupId && matchup.nextSlot) {
    const nextMatchup = newState.matchups[matchup.nextMatchupId];
    if (matchup.nextSlot === 1) {
      nextMatchup.team1 = winner;
    } else {
      nextMatchup.team2 = winner;
    }
    
    // Auto-clear if the next matchup's winner is now invalid (they were the previous winner, but we just replaced them)
    // Wait, the `clearDownstream` function takes care of this
  }

  return newState;
}

function clearDownstream(state: BracketState, fromMatchupId: string, oldWinner: Standing) {
  let currentId: string | null = state.matchups[fromMatchupId].nextMatchupId;
  const abbrev = oldWinner.teamAbbrev.default;

  while (currentId) {
    const m = state.matchups[currentId];
    
    let modified = false;
    if (m.team1?.teamAbbrev.default === abbrev) {
        m.team1 = null;
        modified = true;
    }
    if (m.team2?.teamAbbrev.default === abbrev) {
        m.team2 = null;
        modified = true;
    }

    if (m.winner?.teamAbbrev.default === abbrev) {
        m.winner = null;
    } else if (modified) {
        // If they weren't the winner but were a team, we just removed them.
        // If m.winner matches the OTHER team, they are unaffected? Actually if the team is removed, the match can't have a winner
        // because it hasn't been played. 
        m.winner = null; 
    }

    currentId = m.nextMatchupId;
  }
}

// Reconciles a new standings fetch with an existing bracket state, invalidating rounds if matchups changed
export function reconcileBracket(existingState: BracketState, newStandings: Standing[]): BracketState {
  const newHash = JSON.stringify(newStandings.map(t => t.teamAbbrev.default));
  
  // If standings haven't changed the top 16 or order in a way that affects seedings, we're good
  if (existingState.baseHash === newHash) {
      return existingState;
  }

  // Generate a completely fresh bracket to get the new true matchups
  const freshState = generateInitialBracket(newStandings);

  // We need to port over the user's picks IF the matchup still exists.
  // For each round 1 matchup, if the team1 & team2 match exactly, bring over the winner.
  Object.keys(freshState.matchups).forEach(id => {
      const freshM = freshState.matchups[id];
      const oldM = existingState.matchups[id];
      
      // If it's round 1, check if teams are identical
      if (freshM.round === 1 && oldM && oldM.winner) {
          const freshT1 = freshM.team1?.teamAbbrev.default;
          const freshT2 = freshM.team2?.teamAbbrev.default;
          
          const oldT1 = oldM.team1?.teamAbbrev.default;
          const oldT2 = oldM.team2?.teamAbbrev.default;

          // If identical matchup, port pick
          if (
            (freshT1 === oldT1 && freshT2 === oldT2) || 
            (freshT1 === oldT2 && freshT2 === oldT1)
          ) {
              if (oldM.winner.teamAbbrev.default === freshT1) {
                 // re-run advance logic to populate later rounds correctly
                 Object.assign(freshState, advanceTeam(freshState, id, freshM.team1!));
              } else if (oldM.winner.teamAbbrev.default === freshT2) {
                 Object.assign(freshState, advanceTeam(freshState, id, freshM.team2!));
              }
          }
      }
  });

  // What about round 2+ picks? We could walk the tree and port them as well if the matchups still arose organically
  // But let's keep it simple: any change to standings invalidates downstream picks unless we explicitly re-advance.
  // Wait, the user might want their R2 pick preserved if R1 didn't change. 
  // Let's recursively port picks for higher rounds if the matchup resolved to the exact same teams.
  
  [2, 3, 4].forEach(round => {
      Object.keys(freshState.matchups)
          .filter(id => freshState.matchups[id].round === round)
          .forEach(id => {
              const freshM = freshState.matchups[id];
              const oldM = existingState.matchups[id];
              
              if (oldM?.winner && freshM.team1 && freshM.team2) {
                  const freshT1 = freshM.team1?.teamAbbrev.default;
                  const freshT2 = freshM.team2?.teamAbbrev.default;
                  
                  const oldT1 = oldM.team1?.teamAbbrev.default;
                  const oldT2 = oldM.team2?.teamAbbrev.default;

                  if (
                    (freshT1 === oldT1 && freshT2 === oldT2) || 
                    (freshT1 === oldT2 && freshT2 === oldT1)
                  ) {
                      if (oldM.winner.teamAbbrev.default === freshT1) {
                         Object.assign(freshState, advanceTeam(freshState, id, freshM.team1!));
                      } else if (oldM.winner.teamAbbrev.default === freshT2) {
                         Object.assign(freshState, advanceTeam(freshState, id, freshM.team2!));
                      }
                  }
              }
          });
  });

  return freshState;
}
