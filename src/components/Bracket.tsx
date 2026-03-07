'use client';

import { useEffect, useState } from 'react';
import { BracketState, MatchupNode, generateInitialBracket, reconcileBracket, advanceTeam } from '@/lib/bracketLogic';
import { Standing } from '@/lib/nhlApi';
import Matchup from './Matchup';

interface BracketProps {
  currentStandings: Standing[];
}

export default function Bracket({ currentStandings }: BracketProps) {
  const [bracket, setBracket] = useState<BracketState | null>(null);

  useEffect(() => {
    // On mount, try to load from local storage
    const saved = localStorage.getItem('nhl-bracket');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as BracketState;
        // Reconcile with live standings
        const updated = reconcileBracket(parsed, currentStandings);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setBracket(updated);
      } catch (e) {
        console.error("Failed to parse saved bracket", e);
        setBracket(generateInitialBracket(currentStandings));
      }
    } else {
      setBracket(generateInitialBracket(currentStandings));
    }
  }, [currentStandings]);

  // Save to local storage whenever it changes
  useEffect(() => {
    if (bracket) {
      localStorage.setItem('nhl-bracket', JSON.stringify(bracket));
    }
  }, [bracket]);

  if (!bracket) return <div className="text-white animate-pulse">Loading Bracket...</div>;

  const handleSelectWinner = (matchupId: string, winner: Standing) => {
    setBracket(prev => {
      if (!prev) return prev;
      return advanceTeam(prev, matchupId, winner);
    });
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your bracket? This cannot be undone.')) {
      setBracket(generateInitialBracket(currentStandings));
    }
  };

  const renderColumn = (matchups: MatchupNode[], className: string = '') => (
    <div className={`flex flex-col justify-around h-full gap-4 ${className}`}>
      {matchups.map(m => (
        <Matchup
          key={m.id}
          matchup={m}
          onSelectWinner={handleSelectWinner}
          isActive={!!m.team1 && !!m.team2 && !m.winner}
        />
      ))}
    </div>
  );

  // Group matchups
  const m = bracket.matchups;

  const eR1 = [m['R1-E-1'], m['R1-E-2'], m['R1-E-3'], m['R1-E-4']];
  const eR2 = [m['R2-E-1'], m['R2-E-2']];
  const eR3 = [m['R3-E-1']];

  const scf = [m['R4-SCF-1']];

  const wR3 = [m['R3-W-1']];
  const wR2 = [m['R2-W-1'], m['R2-W-2']];
  const wR1 = [m['R1-W-1'], m['R1-W-2'], m['R1-W-3'], m['R1-W-4']];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex items-start md:items-center justify-start lg:justify-center min-h-[600px] md:min-h-[800px] overflow-x-auto p-4 md:p-8">
        <div className="flex gap-6 md:gap-16 min-w-max h-[600px] md:h-[800px] items-stretch relative">

          {/* Western Conference */}
          {renderColumn(wR1)}
          {renderColumn(wR2)}
          {renderColumn(wR3)}

          {/* Stanley Cup Finals */}
          <div className="flex flex-col justify-center h-full relative z-10 mx-2 md:mx-4">
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-b from-slate-200 to-slate-500 uppercase tracking-widest drop-shadow-sm text-center">
                Stanley Cup<br />Finals
              </h2>
            </div>
            <Matchup
              matchup={scf[0]}
              onSelectWinner={handleSelectWinner}
              isActive={!!scf[0].team1 && !!scf[0].team2 && !scf[0].winner}
            />
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-slate-700 hover:border-slate-500 shadow-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                Reset
              </button>
            </div>
          </div>

          {/* Eastern Conference */}
          {renderColumn(eR3)}
          {renderColumn(eR2)}
          {renderColumn(eR1)}

        </div>
      </div>
    </div>
  );
}
