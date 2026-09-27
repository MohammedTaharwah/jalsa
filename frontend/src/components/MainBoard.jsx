import React from 'react';
import { useGame } from '../context/GameContext';

const OPTION_THEMES = [
  { letter: 'أ', bg: 'hover:border-purple-400 hover:bg-purple-900/30', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { letter: 'ب', bg: 'hover:border-orange-400 hover:bg-orange-900/30', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  { letter: 'ج', bg: 'hover:border-yellow-400 hover:bg-yellow-900/30', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { letter: 'د', bg: 'hover:border-emerald-400 hover:bg-emerald-900/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
];

export const MainBoard = () => {
  const {
    teams,
    activeTeam,
    activeTeamIndex,
    currentQuestionIndex,
    totalQuestionsLimit,
    currentQuestion,
    selectedOption,
    isAnswerRevealed,
    isCorrect,
    isDoublePoints,
    eliminatedOptions,
    submitAnswer,
    usePowerup,
    nextTurn
  } = useGame();

  const options = currentQuestion.options_json || [];
  const points = isDoublePoints ? (currentQuestion.points_level || 100) * 2 : (currentQuestion.points_level || 100);

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-4 animate-fadeIn flex flex-col gap-6">
      {/* Top Bar: Progress, Active Team Indicator, Points */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#17142b]/90 border border-purple-800/40 rounded-2xl p-4 shadow-xl">
        {/* Question Counter */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-700/50 text-purple-200 text-xs font-black">
            السؤال {currentQuestionIndex + 1} / {totalQuestionsLimit}
          </span>
          {currentQuestion.category_name && (
            <span className="hidden sm:inline-block px-3 py-1 rounded-xl bg-slate-800/80 text-purple-300 text-xs font-bold border border-slate-700">
              🏷️ {currentQuestion.category_name}
            </span>
          )}
        </div>

        {/* Turn Indicator Banner */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-purple-900/80 border-2 border-game-yellow shadow-lg shadow-purple-900/50 animate-pulse-fast">
          <span className="w-3 h-3 rounded-full bg-game-yellow animate-ping"></span>
          <span className="text-xs font-black text-game-yellow uppercase tracking-wider">
            دور الفريق:
          </span>
          <span className="text-sm sm:text-base font-black text-white">
            {activeTeam.name} ⚡
          </span>
        </div>

        {/* Points Level Badge */}
        <div className="flex items-center gap-1.5">
          <span
            className={`px-3.5 py-1 rounded-xl text-xs font-black border transition-all ${
              isDoublePoints
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-yellow-300 shadow-lg shadow-orange-500/50 animate-bounce-short'
                : 'bg-emerald-950/70 text-emerald-300 border-emerald-600/40'
            }`}
          >
            {isDoublePoints ? '🔥 مضاعفة: 200 نقطة' : `✨ ${points} نقطة`}
          </span>
        </div>
      </div>

      {/* Center Board: Question Box */}
      <div className="relative bg-gradient-to-br from-[#1d1838] via-[#16132b] to-[#120f24] border-2 border-purple-700/50 rounded-3xl p-8 sm:p-12 shadow-2xl text-center flex flex-col justify-center min-h-[220px]">
        {/* Background ambient lighting */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-purple-500/10 blur-3xl pointer-events-none"></div>

        {currentQuestion.media_url && (
          <div className="mb-6 mx-auto max-w-sm rounded-2xl overflow-hidden border border-purple-800/60 shadow-lg">
            <img src={currentQuestion.media_url} alt="Question Media" className="w-full h-48 object-cover" />
          </div>
        )}

        <h2 className="text-2xl sm:text-4xl font-black text-white leading-relaxed tracking-wide drop-shadow-md">
          {currentQuestion.question_text}
        </h2>
      </div>

      {/* Options Grid (4 Large Choices) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map((option, idx) => {
          const theme = OPTION_THEMES[idx] || OPTION_THEMES[0];
          const isSelected = selectedOption === option;
          const isCorrectAnswer = option === currentQuestion.correct_answer;
          const isEliminated = eliminatedOptions.includes(option);

          let buttonStyle = `bg-[#18142c] border-2 border-purple-900/60 text-white ${theme.bg}`;

          if (isAnswerRevealed) {
            if (isCorrectAnswer) {
              buttonStyle = 'bg-gradient-to-r from-emerald-600 to-teal-600 border-2 border-emerald-300 text-white shadow-xl shadow-emerald-500/30 scale-[1.02]';
            } else if (isSelected && !isCorrect) {
              buttonStyle = 'bg-gradient-to-r from-red-600 to-rose-600 border-2 border-red-300 text-white shadow-xl shadow-red-500/30 animate-shake';
            } else {
              buttonStyle = 'bg-[#120f24]/50 border-purple-950 text-gray-500 opacity-40';
            }
          } else if (isEliminated) {
            buttonStyle = 'bg-[#120f24]/30 border-purple-950 text-gray-600 opacity-25 line-through cursor-not-allowed';
          }

          return (
            <button
              key={idx}
              disabled={isAnswerRevealed || isEliminated}
              onClick={() => submitAnswer(option)}
              className={`relative p-5 sm:p-6 rounded-2xl font-bold text-lg sm:text-xl text-right transition-all flex items-center justify-between gap-4 shadow-lg active:scale-[0.98] ${buttonStyle}`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base border ${theme.badge}`}>
                  {theme.letter}
                </span>
                <span className="leading-snug">{option}</span>
              </div>

              {isAnswerRevealed && isCorrectAnswer && (
                <span className="text-2xl drop-shadow animate-bounce-short">✅</span>
              )}
              {isAnswerRevealed && isSelected && !isCorrect && (
                <span className="text-2xl drop-shadow">❌</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Answer Feedback & Next Turn Button */}
      {isAnswerRevealed && (
        <div className="bg-[#1b1534] border-2 border-purple-600/60 rounded-3xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <span className="text-4xl">{isCorrect ? '🎉' : '💡'}</span>
            <div>
              <div className="text-lg font-black text-white">
                {isCorrect ? `إجابة صحيحة! حصل [${activeTeam.name}] على ${points} نقطة!` : `إجابة غير صحيحة!`}
              </div>
              <div className="text-xs text-purple-300/80 font-medium">
                الإجابة الصحيحة هي: <strong className="text-game-yellow text-sm font-black">{currentQuestion.correct_answer}</strong>
              </div>
            </div>
          </div>

          <button
            onClick={nextTurn}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-game-orange to-game-yellow text-slate-950 font-black text-base shadow-xl shadow-orange-500/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center justify-center gap-2"
          >
            <span>{currentQuestionIndex + 1 >= totalQuestionsLimit ? 'عرض النتيجة النهائية 🏆' : 'السؤال التالي ➡️'}</span>
          </button>
        </div>
      )}

      {/* Power-Ups Weapons System Bar */}
      <div className="bg-[#151226] border border-purple-800/40 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚔️</span>
            <span className="text-xs font-black uppercase tracking-wider text-purple-300">
              ترسانة أسلحة الفريق ({activeTeam.name}):
            </span>
          </div>
          <span className="text-[11px] text-purple-400/70 font-semibold">
            استخدم سلاحاً لمباغتة الخصم قبل الإجابة!
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Ban Weapon Button */}
          <button
            disabled={isAnswerRevealed || !activeTeam.powerups.ban}
            onClick={() => usePowerup('ban')}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-right ${
              activeTeam.powerups.ban && !isAnswerRevealed
                ? 'bg-gradient-to-r from-red-950/60 to-rose-950/60 border-red-600/50 hover:border-red-400 hover:scale-[1.02] shadow-md shadow-red-900/30'
                : 'bg-slate-900/40 border-slate-800 text-gray-600 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🚫</span>
              <div>
                <div className="text-xs font-black text-white">سلاح الحظر</div>
                <div className="text-[10px] text-red-300/80">منع الخصم من دوره القادم</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-red-600/30 text-red-300 text-xs font-black border border-red-500/40">
              x{activeTeam.powerups.ban || 0}
            </span>
          </button>

          {/* Double Points Weapon Button */}
          <button
            disabled={isAnswerRevealed || !activeTeam.powerups.double || isDoublePoints}
            onClick={() => usePowerup('double')}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-right ${
              activeTeam.powerups.double && !isAnswerRevealed && !isDoublePoints
                ? 'bg-gradient-to-r from-amber-950/60 to-yellow-950/60 border-yellow-500/50 hover:border-yellow-300 hover:scale-[1.02] shadow-md shadow-yellow-900/30'
                : 'bg-slate-900/40 border-slate-800 text-gray-600 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">⚡</span>
              <div>
                <div className="text-xs font-black text-white">مضاعفة النقاط</div>
                <div className="text-[10px] text-yellow-300/80">مضاعفة نقاط السؤال (x2)</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-yellow-500/30 text-yellow-300 text-xs font-black border border-yellow-500/40">
              x{activeTeam.powerups.double || 0}
            </span>
          </button>

          {/* 50:50 Hint Weapon Button */}
          <button
            disabled={isAnswerRevealed || !activeTeam.powerups.fifty || eliminatedOptions.length > 0}
            onClick={() => usePowerup('fifty')}
            className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-right ${
              activeTeam.powerups.fifty && !isAnswerRevealed && eliminatedOptions.length === 0
                ? 'bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border-purple-500/50 hover:border-purple-300 hover:scale-[1.02] shadow-md shadow-purple-900/30'
                : 'bg-slate-900/40 border-slate-800 text-gray-600 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎯</span>
              <div>
                <div className="text-xs font-black text-white">حذف إجابتين</div>
                <div className="text-[10px] text-purple-300/80">استبعاد خيارين خاطئين</div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-purple-500/30 text-purple-300 text-xs font-black border border-purple-500/40">
              x{activeTeam.powerups.fifty || 0}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Scoreboard: Teams Cards */}
      <div className="mt-2">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-black uppercase tracking-wider text-purple-300/80">
            📊 لوحة نتائج الجولة الحالية:
          </span>
          <span className="text-[11px] text-purple-400/60 font-semibold">
            (Shared Screen Mode)
          </span>
        </div>

        <div className={`grid grid-cols-2 sm:grid-cols-${teams.length} gap-4`}>
          {teams.map((team, idx) => {
            const isActive = idx === activeTeamIndex;
            return (
              <div
                key={team.id}
                className={`relative p-5 rounded-3xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-b from-[#2e1d52] via-[#21153b] to-[#170e2b] border-2 border-game-yellow shadow-2xl shadow-purple-500/30 scale-[1.03]'
                    : 'bg-[#17142b]/80 border border-purple-900/40 opacity-85'
                }`}
              >
                {isActive && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-game-yellow text-slate-950 shadow-md shadow-yellow-500/50 flex items-center gap-1">
                    <span>⚡</span> دورهم الآن
                  </span>
                )}

                {team.isBanned && (
                  <span className="absolute top-2 left-2 px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-red-600 text-white animate-pulse shadow-md">
                    🚫 محظور
                  </span>
                )}

                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm text-purple-200 truncate">
                    {team.name}
                  </div>
                  <span className="text-xl">
                    {idx === 0 ? '🦅' : idx === 1 ? '🦁' : idx === 2 ? '🐺' : '⚡'}
                  </span>
                </div>

                <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-game-yellow to-game-orange bg-clip-text text-transparent">
                  {team.score}
                  <span className="text-xs text-purple-300 font-semibold mr-1">نقطة</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
