import React from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Flame,
  Zap,
  Sparkles,
  Shield,
  HelpCircle,
  Swords,
  Crown,
  Dices,
  RotateCcw
} from 'lucide-react';
import { useGame } from '../context/GameContext';

const getCategoryIcon = (catId) => {
  switch (catId) {
    case 'sports': return '⚽';
    case 'history': return '🏛️';
    case 'science': return '🪐';
    case 'cinema': return '🎬';
    case 'general': return '💡';
    case 'tech': return '💻';
    case 'geography': return '🌍';
    case 'arts': return '🎨';
    default: return '❓';
  }
};

export const BattlegroundBoard = () => {
  const {
    teams,
    activeTeam,
    activeTeamIndex,
    board,
    selectTile,
    canTriggerComeback,
    triggerComeback,
    usePowerup
  } = useGame();

  const answeredCount = board.reduce(
    (acc, col) => acc + col.tiles.filter(t => t.status === 'answered').length,
    0
  );
  const totalCount = board.reduce((acc, col) => acc + col.tiles.length, 0);

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* Top Header: Scoreboard & Turn Indicator */}
      <div className="bg-[#18142c] border border-purple-900/50 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Teams Live Score Cards */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {teams.map((team, idx) => {
            const isActive = idx === activeTeamIndex;
            return (
              <div
                key={team.id}
                className={`relative px-4 py-2.5 rounded-2xl transition-all flex items-center gap-3 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-900 to-indigo-900 border-2 border-amber-400 shadow-lg shadow-purple-600/30 scale-105'
                    : 'bg-[#120f24] border border-purple-900/40 opacity-80'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow-md">
                    ⚡ دورهم الآن
                  </span>
                )}

                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center font-black text-white text-base">
                  {idx === 0 ? '🦅' : idx === 1 ? '🦁' : idx === 2 ? '🐺' : '⚡'}
                </div>

                <div>
                  <div className="text-xs font-bold text-purple-200 truncate max-w-[120px]">
                    {team.name}
                  </div>
                  <div className="text-lg font-black bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">
                    {team.score} <span className="text-[10px] text-purple-300">نقطة</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Board Meta & Comeback Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <span className="text-xs font-bold text-purple-300/80 bg-purple-950/60 px-3 py-1.5 rounded-xl border border-purple-800/40">
            📊 فتح {answeredCount} من {totalCount} مربعاً
          </span>

          {/* Comeback Button (ظهر فقط للفريق المتأخر في الثلث الأخير) */}
          {canTriggerComeback && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={triggerComeback}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-600/40 animate-pulse flex items-center gap-2 cursor-pointer border border-amber-300"
            >
              <Flame className="w-4 h-4 fill-white" />
              <span>زر الريمونتادا (المواجهة المباشرة: 1000 نقطة)!</span>
            </motion.button>
          )}
        </div>
      </div>

      {/* The Battleground Grid (6 Categories x 3 Levels: 200, 400, 600) */}
      <div className="bg-[#151126] border-2 border-purple-800/40 rounded-3xl p-4 sm:p-6 shadow-2xl">
        {/* Banner */}
        <div className="flex items-center justify-between mb-5 border-b border-purple-900/40 pb-3">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-orange-400" />
            <h3 className="text-base sm:text-lg font-black text-white">
              ساحة المواجهة المشتركة (The Battleground)
            </h3>
          </div>
          <span className="text-[11px] text-purple-300/70 font-semibold">
            🎯 اختر مربعاً من فئتك أو اغزُ فئة الخصم لحرمانه من نقاطها!
          </span>
        </div>

        {/* 6 Columns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {board.map((column) => (
            <div key={column.categoryId} className="flex flex-col gap-2.5">
              {/* Category Header Card */}
              <div className="p-3 rounded-2xl bg-gradient-to-b from-[#221b3d] to-[#1a1430] border border-purple-700/40 text-center flex flex-col items-center justify-center min-h-[90px] shadow-sm">
                <span className="text-2xl mb-1">{getCategoryIcon(column.categoryId)}</span>
                <h4 className="text-xs font-black text-white leading-tight mb-1 truncate w-full">
                  {column.categoryName}
                </h4>
                {column.chosenByTeam && (
                  <span className="text-[9px] font-bold text-amber-300/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 truncate max-w-full">
                    {column.chosenByTeam.name}
                  </span>
                )}
              </div>

              {/* 3 Tiles: 200, 400, 600 */}
              <div className="flex flex-col gap-2.5">
                {column.tiles.map((tile) => {
                  const isAnswered = tile.status === 'answered';
                  const isWonByTeam = tile.winnerTeamId !== null;
                  const winnerTeam = teams.find(t => t.id === tile.winnerTeamId);

                  if (isAnswered) {
                    return (
                      <div
                        key={tile.id}
                        className="h-20 sm:h-24 rounded-2xl bg-[#0f0d1a]/80 border border-purple-950 flex flex-col items-center justify-center text-center p-2 opacity-50 cursor-not-allowed"
                      >
                        <span className="text-xs text-gray-500 font-bold line-through mb-1">
                          {tile.points}
                        </span>
                        {isWonByTeam && winnerTeam ? (
                          <span className="text-[10px] font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                            {winnerTeam.name}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-500">
                            أُغلِق ❌
                          </span>
                        )}
                      </div>
                    );
                  }

                  return (
                    <motion.button
                      key={tile.id}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => selectTile(tile)}
                      className={`h-20 sm:h-24 rounded-2xl font-black text-2xl sm:text-3xl transition-all flex flex-col items-center justify-center relative overflow-hidden shadow-lg cursor-pointer ${
                        tile.points === 200
                          ? 'bg-gradient-to-br from-indigo-900 via-purple-900 to-[#1e153b] border-2 border-purple-500/60 hover:border-purple-300 text-purple-200'
                          : tile.points === 400
                          ? 'bg-gradient-to-br from-purple-900 via-violet-900 to-[#221742] border-2 border-amber-400/60 hover:border-amber-300 text-amber-300'
                          : 'bg-gradient-to-br from-amber-900 via-orange-900 to-[#2b184a] border-2 border-orange-500/60 hover:border-orange-300 text-orange-200'
                      }`}
                    >
                      {/* Mystery Sparkle Indicator if mystery tile */}
                      {tile.isMystery && (
                        <span className="absolute top-1.5 left-1.5 text-xs animate-bounce-short" title="مربع الحظ السري!">
                          ✨
                        </span>
                      )}

                      <span>{tile.points}</span>
                      <span className="text-[10px] font-bold tracking-wider opacity-70 mt-0.5">
                        نقطة
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Tactical Weapons bar for active team */}
      <div className="bg-[#18142c] border border-purple-900/50 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚔️</span>
          <span className="text-white font-bold">
            أسلحة فريق <strong className="text-amber-400 font-black">[{activeTeam.name}]</strong> النشط:
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => usePowerup('ban')}
            disabled={!activeTeam.powerups?.ban}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTeam.powerups?.ban
                ? 'bg-red-950/70 text-red-300 border-red-600/60 hover:bg-red-900'
                : 'bg-slate-900 text-gray-600 border-slate-800 opacity-40 cursor-not-allowed'
            }`}
          >
            <span>🚫 سلاح الحظر</span>
            <span className="bg-red-600/30 px-1.5 rounded text-[10px]">x{activeTeam.powerups?.ban || 0}</span>
          </button>

          <button
            onClick={() => usePowerup('double')}
            disabled={!activeTeam.powerups?.double}
            className={`px-3 py-1.5 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTeam.powerups?.double
                ? 'bg-amber-950/70 text-amber-300 border-amber-600/60 hover:bg-amber-900'
                : 'bg-slate-900 text-gray-600 border-slate-800 opacity-40 cursor-not-allowed'
            }`}
          >
            <span>⚡ مضاعفة (x2)</span>
            <span className="bg-amber-600/30 px-1.5 rounded text-[10px]">x{activeTeam.powerups?.double || 0}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
