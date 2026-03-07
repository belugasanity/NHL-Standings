import { fetchCurrentStandings } from "@/lib/nhlApi";
import Bracket from "@/components/Bracket";

export const revalidate = 60; // Revalidate standings every 60 seconds

export default async function Home() {
  const data = await fetchCurrentStandings();
  const standings = data.standings;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      
      <header className="w-full relative z-10 pt-12 pb-6 flex flex-col items-center justify-center border-b border-white/5 bg-slate-900/40 backdrop-blur-xl">
        <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-white to-blue-400 tracking-tight text-center drop-shadow-sm">
          NHL PLAYOFFS
        </h1>
        <p className="mt-4 text-slate-400 font-medium tracking-wide flex items-center gap-2">
          <span>{new Date(data.standingsDateTimeUtc).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
          <span>LIVE STANDINGS</span>
        </p>
      </header>

      <main className="flex-1 relative z-10">
        <Bracket currentStandings={standings} />
      </main>

      <footer className="w-full py-6 text-center text-sm text-slate-500 border-t border-white/5 relative z-10">
        Built with Next.js & Tailwind CSS
      </footer>
    </div>
  );
}
