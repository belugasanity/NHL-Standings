export interface Team {
  id: number;
  name: string;
  abbreviation: string;
  logo: string;
}

export interface Standing {
  conferenceName: string;
  divisionName: string;
  teamAbbrev: { default: string };
  teamName: { default: string };
  teamLogo: string;
  points: number;
  regulationWins: number;
  wildcardSequence: number;
  divisionSequence: number;
  conferenceSequence: number;
}

export interface StandingsResponse {
  standingsDateTimeUtc: string;
  standings: Standing[];
}

export async function fetchCurrentStandings(): Promise<StandingsResponse> {
  // We'll use Next.js fetch with revalidation to ensure we get fresh data but don't spam the API unnecessarily.
  const res = await fetch('https://api-web.nhle.com/v1/standings/now', {
    next: { revalidate: 60 }, // Revalidate every minute
  });

  if (!res.ok) {
    throw new Error('Failed to fetch NHL standings');
  }

  return res.json();
}
