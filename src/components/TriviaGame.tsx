'use client';

import { useEffect, useState, useMemo } from 'react';
import { Player } from '@/lib/playerTriviaApi';
import { TriviaState, initializeTriviaState, generateOptions, getUniqueTeams } from '@/lib/triviaLogic';

interface TriviaGameProps {
  allPlayers: Player[];
}

export default function TriviaGame({ allPlayers }: TriviaGameProps) {
  const [gameState, setGameState] = useState<TriviaState | null>(null);
  const [currentOptions, setCurrentOptions] = useState<{ abbrev: string, logo: string, name: string }[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);

  // We only want to compute the unique teams array once as it's static for the choices
  const allTeams = useMemo(() => getUniqueTeams(allPlayers), [allPlayers]);

  useEffect(() => {
    // On mount, load generic progress or initialize
    const saved = localStorage.getItem('nhl-trivia-state');
    let loadedState: TriviaState;
    if (saved) {
      try {
        loadedState = JSON.parse(saved);
        // Verify it matches version and data structures if needed
        // If they played through the whole deck, reshuffle immediately
        if (loadedState.currentIndex >= loadedState.playerPool.length) {
          loadedState = initializeTriviaState(allPlayers);
        }
      } catch {
        loadedState = initializeTriviaState(allPlayers);
      }
    } else {
      loadedState = initializeTriviaState(allPlayers);
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGameState(loadedState);
  }, [allPlayers]);

  useEffect(() => {
    if (gameState && !showResult && gameState.currentIndex < gameState.playerPool.length) {
      const currentPlayer = gameState.playerPool[gameState.currentIndex];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentOptions(generateOptions(currentPlayer, allTeams));
      setSelectedOption(null);
    }
  }, [gameState, showResult, allTeams]);

  // Persist to local storage whenever game state advances
  useEffect(() => {
    if (gameState) {
      localStorage.setItem('nhl-trivia-state', JSON.stringify(gameState));
    }
  }, [gameState]);

  if (!gameState || !allPlayers.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center animate-pulse">
        <div className="w-24 h-24 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-6"></div>
        <p className="text-xl text-slate-400 font-medium">Scouting players...</p>
      </div>
    );
  }

  const currentPlayer = gameState.playerPool[gameState.currentIndex];
  // Format percentage
  const totalGuesses = gameState.correctGuesses + gameState.incorrectGuesses;
  const accuracy = totalGuesses === 0 ? 0 : Math.round((gameState.correctGuesses / totalGuesses) * 100);

  const handleGuess = (teamAbbrev: string) => {
    if (showResult) return;
    
    setSelectedOption(teamAbbrev);
    setShowResult(true);

    const isCorrect = teamAbbrev === currentPlayer.teamAbbrev;

    // We wait briefly so user sees the result, then advance
    setTimeout(() => {
      setGameState(prev => {
        if (!prev) return prev;
        
        const nextIndex = prev.currentIndex + 1;
        const newState = {
          ...prev,
          currentIndex: nextIndex,
          correctGuesses: isCorrect ? prev.correctGuesses + 1 : prev.correctGuesses,
          incorrectGuesses: !isCorrect ? prev.incorrectGuesses + 1 : prev.incorrectGuesses
        };

        // Auto-reshuffle if deck exhausted
        if (nextIndex >= prev.playerPool.length) {
          return {
             ...initializeTriviaState(allPlayers),
             correctGuesses: newState.correctGuesses,
             incorrectGuesses: newState.incorrectGuesses
          };
        }
        
        return newState;
      });
      setShowResult(false);
    }, 1500); // 1.5 seconds delay to see if they got it right
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center p-4">
      
      {/* Stats Header */}
      <div className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-4 md:p-6 mb-8 flex items-center justify-between text-sm md:text-base">
        <div className="flex flex-col">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Progress</span>
          <span className="font-semibold">{gameState.currentIndex + 1} / {gameState.playerPool.length}</span>
        </div>
        <div className="flex flex-col items-center border-x border-slate-700/50 px-6 mx-2">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Accuracy</span>
          <span className="font-black text-blue-400 text-lg md:text-xl">{accuracy}%</span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Score</span>
          <div className="flex gap-2 justify-end font-semibold">
            <span className="text-emerald-400">{gameState.correctGuesses}</span>
            <span className="text-slate-600">/</span>
            <span className="text-rose-400">{gameState.incorrectGuesses}</span>
          </div>
        </div>
      </div>

      {/* Player Card */}
      <div className="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 md:p-10 border border-slate-700/80 shadow-2xl flex flex-col items-center max-w-md w-full mb-8 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-emerald-500 to-blue-500 opacity-50"></div>
        
        <div className="relative w-40 h-40 md:w-56 md:h-56 mb-6 rounded-full overflow-hidden bg-slate-900/80 border-4 border-slate-700/50 flex items-end justify-center group-hover:border-blue-500/50 transition-colors duration-500 shadow-inner">
           {/* eslint-disable-next-line @next/next/no-img-element */}
           <img 
             src={currentPlayer.headshot} 
             alt={`${currentPlayer.firstName.default} ${currentPlayer.lastName.default}`}
             className="w-full object-cover object-bottom"
             onError={(e) => { e.currentTarget.style.display = 'none'; }}
           />
        </div>

        <h2 className="text-3xl md:text-4xl font-black text-white text-center tracking-tight mb-2 drop-shadow-md">
          {currentPlayer.firstName.default} {currentPlayer.lastName.default}
        </h2>
        
        <div className="flex items-center gap-3 mt-2">
          <span className="bg-slate-900/80 text-blue-400 px-4 py-1.5 rounded-lg font-mono font-bold text-xl border border-blue-900/30">
            #{currentPlayer.sweaterNumber}
          </span>
          <span className="bg-slate-900/80 text-slate-300 px-4 py-1.5 rounded-lg font-bold tracking-wide border border-slate-700/50">
            {currentPlayer.positionCode}
          </span>
        </div>
      </div>

      {/* Multiple Choice Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
        {currentOptions.map((option) => {
          const isSelected = selectedOption === option.abbrev;
          const isCorrect = option.abbrev === currentPlayer.teamAbbrev;
          
          let buttonClass = "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-500 text-slate-200";
          
          if (showResult) {
            if (isCorrect) {
              buttonClass = "bg-emerald-900/80 border-emerald-500/50 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.3)] z-10 scale-[1.02]";
            } else if (isSelected && !isCorrect) {
              buttonClass = "bg-rose-900/50 border-rose-500/30 text-rose-200 opacity-80";
            } else {
              buttonClass = "bg-slate-900/50 border-slate-800 text-slate-600 opacity-50";
            }
          }

          return (
            <button
              key={option.abbrev}
              disabled={showResult}
              onClick={() => handleGuess(option.abbrev)}
              className={`relative overflow-hidden flex items-center p-4 rounded-xl border-2 transition-all duration-300 group ${buttonClass}`}
            >
              <div className="w-12 h-12 shrink-0 bg-white/5 rounded-lg p-2 mr-4 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={option.logo} alt={option.name} className="max-w-full max-h-full object-contain drop-shadow-sm" />
              </div>
              <span className="font-bold text-lg md:text-xl tracking-tight text-left">{option.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
