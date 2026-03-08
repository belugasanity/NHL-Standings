import { fetchCurrentStandings } from './nhlApi';

export interface Player {
  id: number;
  headshot: string;
  firstName: { default: string };
  lastName: { default: string };
  sweaterNumber: number;
  positionCode: string;
  teamAbbrev: string;
  teamLogo: string;
  teamName: string;
}

interface RosterResponse {
  forwards: PlayerData[];
  defensemen: PlayerData[];
  goalies: PlayerData[];
}

interface PlayerData {
  id: number;
  headshot: string;
  firstName: { default: string };
  lastName: { default: string };
  sweaterNumber: number;
  positionCode: string;
}

export async function fetchAllPlayers(): Promise<Player[]> {
  try {
    // 1. Get all teams from current standings
    const standingsData = await fetchCurrentStandings();
    const teams = standingsData.standings;

    // 2. Fetch rosters for all teams in parallel
    const rosterPromises = teams.map(async (team) => {
      try {
        const res = await fetch(`https://api-web.nhle.com/v1/roster/${team.teamAbbrev.default}/current`);
        if (!res.ok) return [];

        const roster: RosterResponse = await res.json();
        
        // Combine all positions
        const allTeamPlayers = [
          ...(roster.forwards || []),
          ...(roster.defensemen || []),
          ...(roster.goalies || [])
        ];

        // Map to our unified Player interface, injecting team info
        return allTeamPlayers.map(p => ({
          id: p.id,
          headshot: p.headshot,
          firstName: p.firstName,
          lastName: p.lastName,
          sweaterNumber: p.sweaterNumber || 0,
          positionCode: p.positionCode,
          teamAbbrev: team.teamAbbrev.default,
          teamLogo: team.teamLogo,
          teamName: team.teamName.default
        } as Player));

      } catch (e) {
        console.error(`Failed to fetch roster for ${team.teamAbbrev.default}`, e);
        return [];
      }
    });

    const rostersArray = await Promise.all(rosterPromises);
    
    // Flatten array of arrays
    return rostersArray.flat();

  } catch (error) {
    console.error("Failed to fetch all players:", error);
    return [];
  }
}
