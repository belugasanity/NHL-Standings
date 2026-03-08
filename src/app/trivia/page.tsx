import { fetchAllPlayers } from '@/lib/playerTriviaApi';
import TriviaGame from '@/components/TriviaGame';

export const revalidate = 3600; // Players don't change often, revalidate hourly

export default async function TriviaPage() {
  const allPlayers = await fetchAllPlayers();

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)] relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-emerald-600/10 blur-[150px] rounded-full pointer-events-none" />
      
      <main className="flex-1 relative z-10 flex flex-col items-center pt-8 pb-16">
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-emerald-400 tracking-tight text-center drop-shadow-sm mb-2">
          PLAYER TRIVIA
        </h1>
        <p className="text-slate-400 font-medium mb-8">Test your knowledge of all active NHL rosters</p>
        
        <TriviaGame allPlayers={allPlayers} />
      </main>
    </div>
  );
}
