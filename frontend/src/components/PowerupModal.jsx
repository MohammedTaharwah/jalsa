import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';

export const PowerupModal = () => {
  const { powerupEffect, closePowerupModal } = useGame();

  useEffect(() => {
    if (!powerupEffect) return;

    // Auto-dismiss after 4 seconds if not clicked
    const timer = setTimeout(() => {
      closePowerupModal();
    }, 4000);

    return () => clearTimeout(timer);
  }, [powerupEffect, closePowerupModal]);

  if (!powerupEffect) return null;

  const isBan = powerupEffect.type === 'ban' || powerupEffect.type === 'skip_ban';
  const isDouble = powerupEffect.type === 'double';
  const isFifty = powerupEffect.type === 'fifty';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className={`relative w-full max-w-lg p-8 rounded-3xl border-4 shadow-2xl text-center overflow-hidden ${
          isBan
            ? 'bg-gradient-to-b from-[#2b0d18] via-[#1a0812] to-[#12050c] border-red-500 shadow-red-500/30'
            : isDouble
            ? 'bg-gradient-to-b from-[#2d1b06] via-[#1b1004] to-[#120b02] border-yellow-400 shadow-yellow-500/30'
            : 'bg-gradient-to-b from-[#1b0d2b] via-[#11081a] to-[#0c0512] border-purple-500 shadow-purple-500/30'
        }`}
      >
        {/* Animated Background Rays */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"></div>

        {/* Central Icon Stamp with Keyframe Animation */}
        <div className="mb-4 inline-flex items-center justify-center w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 animate-ban-stamp">
          <span className="text-6xl drop-shadow-lg">
            {isBan ? '🚫' : isDouble ? '⚡' : '🎯'}
          </span>
        </div>

        {/* Stamp Badge */}
        {isBan && (
          <div className="mb-4">
            <span className="inline-block px-5 py-1.5 rounded-full text-sm font-black uppercase tracking-widest bg-red-600 text-white shadow-lg shadow-red-600/50 animate-bounce-short">
              ⚠️ حالة حظر إجبارية!
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-wide">
          {powerupEffect.title}
        </h3>

        {/* Message */}
        <p className="text-base sm:text-lg text-white/90 font-medium mb-8 leading-relaxed max-w-md mx-auto">
          {powerupEffect.message}
        </p>

        {/* Action Button */}
        <button
          onClick={closePowerupModal}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all shadow-xl hover:scale-[1.02] active:scale-[0.98] ${
            isBan
              ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-red-600/40 hover:from-red-500 hover:to-rose-500'
              : isDouble
              ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-950 shadow-yellow-500/40'
              : 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-purple-500/40'
          }`}
        >
          حسناً، استمرار المواجهة 🚀
        </button>
      </div>
    </div>
  );
};
