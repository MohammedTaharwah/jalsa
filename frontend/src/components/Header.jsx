import React from 'react';
import { useGame } from '../context/GameContext';

export const Header = () => {
  const { gameStage, resetGame } = useGame();

  return (
    <header className="w-full max-w-6xl mx-auto px-4 py-4 flex items-center justify-between border-b border-purple-900/40">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-game-purple to-game-pink flex items-center justify-center text-2xl shadow-lg shadow-purple-500/30">
          🎮
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-wider bg-gradient-to-r from-game-yellow via-game-orange to-game-pink bg-clip-text text-transparent">
            جَـلْـسَـة
          </h1>
          <p className="text-xs text-purple-300/70 font-medium">منصة التحديات الجماعية (شاشة مشتركة)</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-950/70 text-purple-200 border border-purple-800/50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          نمط اللعب المحلي (Local Shared Screen)
        </span>

        {gameStage !== 'setup' && (
          <button
            onClick={resetGame}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-200 bg-amber-950/60 border border-amber-600/40 hover:bg-amber-900/50 transition-all flex items-center gap-1.5"
          >
            <span>🔄</span> إنهاء وبدء جلسة جديدة
          </button>
        )}
      </div>
    </header>
  );
};
