'use client';

import React from 'react';
import { MatchupNode } from '@/lib/bracketLogic';
import { Standing } from '@/lib/nhlApi';
import { Trophy, ShieldAlert } from 'lucide-react';

interface MatchupProps {
  matchup: MatchupNode;
  onSelectWinner: (matchupId: string, winner: Standing) => void;
  isActive: boolean;
}

export default function Matchup({ matchup, onSelectWinner, isActive }: MatchupProps) {
  const { team1, team2, winner } = matchup;

  const handleSelect = (team: Standing | null) => {
    if (!team || !isActive) return;
    onSelectWinner(matchup.id, team);
  };

  const renderTeam = (team: Standing | null, isTop: boolean) => {
    const isWinner = winner && team && winner.teamAbbrev.default === team.teamAbbrev.default;
    const isSelectedRow = winner && isWinner;
    const isLoserRow = winner && !isWinner;

    return (
      <div 
        onClick={() => handleSelect(team)}
        className={`
          flex items-center justify-between p-2 cursor-pointer transition-all duration-200
          ${isTop ? 'rounded-t-lg border-b border-white/5' : 'rounded-b-lg'}
          ${isActive && team ? 'hover:bg-white/10' : ''}
          ${isSelectedRow ? 'bg-blue-600/30' : ''}
          ${isLoserRow ? 'opacity-40' : ''}
          ${!team ? 'opacity-30 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-5 h-5 md:w-6 md:h-6 shrink-0 relative flex items-center justify-center">
            {team ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={team.teamLogo} 
                alt={team.teamName.default} 
                className={`w-full h-full object-contain drop-shadow-md ${isLoserRow ? 'grayscale opacity-60' : ''}`}
                loading="lazy"
              />
            ) : (
              <ShieldAlert className="w-4 h-4 text-white/30" />
            )}
          </div>
          <div className="flex flex-col">
            <span className={`text-xs md:text-sm font-bold tracking-wider ${isSelectedRow ? 'text-white' : 'text-slate-200'}`}>
              {team ? team.teamAbbrev.default : 'TBD'}
            </span>
            <span className="text-[9px] md:text-[10px] text-slate-400 font-medium">
              {team ? `${team.points} PTS` : 'Awaiting'}
            </span>
          </div>
        </div>
        
        {isWinner && (
          <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
        )}
      </div>
    );
  };

  return (
    <div className={`
      relative w-36 md:w-48 flex flex-col bg-slate-900/60 backdrop-blur-md rounded-xl border
      shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]
      transition-all duration-300
      ${isActive ? 'border-white/20 hover:border-blue-400/50 hover:shadow-blue-500/20' : 'border-white/5 opacity-80'}
      ${winner ? 'border-blue-500/30' : ''}
    `}>
      {renderTeam(team1, true)}
      {renderTeam(team2, false)}
    </div>
  );
}
