import { Player } from './playerTriviaApi';

export interface TriviaState {
  version: number; // For future migrations if needed
  playerPool: Player[]; // The completely shuffled deck
  currentIndex: number; // Where we are in the deck
  correctGuesses: number;
  incorrectGuesses: number;
}

// Fisher-Yates shuffle algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function initializeTriviaState(allPlayers: Player[]): TriviaState {
  return {
    version: 1,
    playerPool: shuffleArray(allPlayers),
    currentIndex: 0,
    correctGuesses: 0,
    incorrectGuesses: 0
  };
}

export function generateOptions(correctPlayer: Player, allTeams: { abbrev: string, logo: string, name: string }[]): { abbrev: string, logo: string, name: string }[] {
  const correctTeam = { 
    abbrev: correctPlayer.teamAbbrev, 
    logo: correctPlayer.teamLogo, 
    name: correctPlayer.teamName 
  };

  // Filter out the correct team so we can pick wrong options
  const incorrectTeams = allTeams.filter(t => t.abbrev !== correctPlayer.teamAbbrev);
  const shuffledIncorrect = shuffleArray(incorrectTeams);
  
  // Take 3 wrong teams
  const wrongOptions = shuffledIncorrect.slice(0, 3);
  
  // Combine and shuffle the final 4 options
  return shuffleArray([correctTeam, ...wrongOptions]);
}

export function getUniqueTeams(players: Player[]): { abbrev: string, logo: string, name: string }[] {
  const map = new Map<string, { abbrev: string, logo: string, name: string }>();
  
  players.forEach(p => {
    if (!map.has(p.teamAbbrev)) {
      map.set(p.teamAbbrev, { abbrev: p.teamAbbrev, logo: p.teamLogo, name: p.teamName });
    }
  });

  return Array.from(map.values());
}
