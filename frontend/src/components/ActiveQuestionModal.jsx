import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Check, X, ArrowLeft, Brain, ShieldAlert, Award } from 'lucide-react';
import { useGame } from '../context/GameContext';

const OPTION_THEMES = [
  { letter: 'أ', bg: 'hover:border-purple-400 hover:bg-purple-900/30', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
  { letter: 'ب', bg: 'hover:border-orange-400 hover:bg-orange-900/30', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' },
  { letter: 'ج', bg: 'hover:border-yellow-400 hover:bg-yellow-900/30', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40' },
  { letter: 'د', bg: 'hover:border-emerald-400 hover:bg-emerald-900/30', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
];

export const ActiveQuestionModal = () => {
  const {
    activeTile,
    activeQuestion,
    activeTeam,
    wheelState,
    wheelModifier,
    isComebackActive,
    selectedOption,
    isAnswerRevealed,
    isCorrect,
    eliminatedOptions,
    submitAnswer,
    returnToBoard
  } = useGame();

  const [memoryAnswerRevealed, setMemoryAnswerRevealed] = useState(false);

  // If wheel is open or neither tile nor comeback is active, don't show
  if (wheelState.isOpen || (!activeTile && !isComebackActive) || !activeQuestion) return null;

  const isNoOptionsMode = wheelModifier === 'no_options';
  const options = activeQuestion.options_json || [];

  // Calculate Effective Points
  let effectivePoints = activeQuestion.points || (activeTile ? activeTile.points : 200);
  if (wheelModifier === 'double') effectivePoints *= 2;
  else if (wheelModifier === 'no_options') effectivePoints *= 3;
  else if (wheelModifier === 'safe_bonus') effectivePoints += 100;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-3xl bg-gradient-to-br from-[#1a1533] via-[#141026] to-[#0e0b1c] rounded-3xl p-6 sm:p-10 border-2 border-purple-500/50 shadow-2xl flex flex-col gap-6 text-center">
        {/* Glow ambient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-24 bg-purple-500/15 blur-3xl pointer-events-none" />

        {/* Top Header Information */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-900/50 pb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-purple-950 text-purple-300 border border-purple-800 text-xs font-bold">
              🏷️ {activeQuestion.category_name}
            </span>

            {isComebackActive && (
              <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs animate-pulse flex items-center gap-1 shadow-md shadow-red-600/40">
                <Flame className="w-3.5 h-3.5 fill-white" />
                <span>سؤال الريمونتادا الأسطوري</span>
              </span>
            )}
          </div>

          {/* Active Team Badge */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-900 to-indigo-900 border border-amber-400 text-white font-black text-xs shadow-md">
            <span>⚡ دور:</span>
            <span className="text-amber-300">{activeTeam.name}</span>
          </div>

          {/* Points Pill */}
          <div className="flex items-center gap-1.5">
            <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-md">
              ✨ {effectivePoints} نقطة
            </span>
          </div>
        </div>

        {/* Wheel Modifier Alert if active */}
        {wheelModifier && (
          <div className="p-3 rounded-2xl bg-white/5 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2">
            <span>🎡 تأثير عجلة الحظ النشط:</span>
            {wheelModifier === 'double' && <span>⚡ مضاعفة النقاط (x2)</span>}
            {wheelModifier === 'no_options' && <span>🧠 الإجابة بدون خيارات لثلاثة أضعاف النقاط (3x)</span>}
            {wheelModifier === 'penalty_danger' && <span className="text-red-400">⚠️ فخ الخصم: خصم النقاط في حال الخطأ!</span>}
            {wheelModifier === 'safe_bonus' && <span className="text-emerald-400">🎁 +100 نقطة مجانية إضافية!</span>}
          </div>
        )}

        {/* Question Text Box */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#1d1838] border border-purple-700/40 shadow-inner flex flex-col items-center justify-center min-h-[140px]">
          <h3 className="text-2xl sm:text-3xl font-black text-white leading-relaxed tracking-wide">
            {activeQuestion.question_text}
          </h3>
        </div>

        {/* Options Grid OR Memory Mode */}
        {isNoOptionsMode ? (
          <div className="p-6 rounded-3xl bg-amber-500/10 border-2 border-amber-400 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-black text-base">
              <Brain className="w-5 h-5" />
              <span>تحدي الذاكرة (بدون خيارات)! ناقشوا الإجابة معاً واذكروها بصوت عالٍ</span>
            </div>

            {!memoryAnswerRevealed ? (
              <button
                onClick={() => setMemoryAnswerRevealed(true)}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/30"
              >
                👁️ كشف الإجابة النموذجية للتحقق
              </button>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-sm text-purple-200">
                  الإجابة الصحيحة هي: <strong className="text-amber-300 font-black text-lg mr-1">{activeQuestion.correct_answer}</strong>
                </div>

                {!isAnswerRevealed && (
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => submitAnswer(activeQuestion.correct_answer)}
                      className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>أجبنا بشكل صحيح (+{effectivePoints})</span>
                    </button>
                    <button
                      onClick={() => submitAnswer("__wrong__")}
                      className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-red-600/30"
                    >
                      <X className="w-4 h-4 stroke-[3]" />
                      <span>أخطأنا في الإجابة</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {options.map((option, idx) => {
              const theme = OPTION_THEMES[idx] || OPTION_THEMES[0];
              const isSelected = selectedOption === option;
              const isCorrectAnswer = option === activeQuestion.correct_answer;
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
                  className={`p-4 sm:p-5 rounded-2xl font-bold text-base sm:text-lg text-right transition-all flex items-center justify-between gap-3 shadow-md active:scale-[0.98] ${buttonStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border ${theme.badge}`}>
                      {theme.letter}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </div>

                  {isAnswerRevealed && isCorrectAnswer && (
                    <span className="text-xl animate-bounce-short">✅</span>
                  )}
                  {isAnswerRevealed && isSelected && !isCorrect && (
                    <span className="text-xl">❌</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Answer Feedback Banner and Return Button */}
        {isAnswerRevealed && (
          <div className="p-4 rounded-2xl bg-white/10 border border-purple-600 flex flex-col sm:flex-row items-center justify-between gap-4 animate-fadeIn">
            <div className="text-right">
              <div className="text-base font-black text-white">
                {isCorrect
                  ? `🎉 إجابة صحيحة! نال [${activeTeam.name}] +${effectivePoints} نقطة!`
                  : `❌ إجابة خاطئة!`}
              </div>
              <div className="text-xs text-purple-200">
                الإجابة الصحيحة: <strong className="text-amber-400 font-bold">{activeQuestion.correct_answer}</strong>
              </div>
            </div>

            <button
              onClick={() => {
                setMemoryAnswerRevealed(false);
                returnToBoard();
              }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-sm shadow-lg shadow-orange-500/30 hover:scale-[1.03] transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>العودة لساحة التحدي</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
