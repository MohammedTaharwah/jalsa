import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const TEAM_PALETTES = [
  { color: 'purple', bg: 'from-purple-600 to-indigo-600', border: 'border-purple-400', badge: 'bg-purple-500/20 text-purple-300', emoji: '🦅' },
  { color: 'orange', bg: 'from-amber-500 to-orange-600', border: 'border-orange-400', badge: 'bg-orange-500/20 text-orange-300', emoji: '🦁' },
  { color: 'green', bg: 'from-emerald-500 to-teal-600', border: 'border-emerald-400', badge: 'bg-emerald-500/20 text-emerald-300', emoji: '🐺' },
  { color: 'pink', bg: 'from-pink-500 to-rose-600', border: 'border-pink-400', badge: 'bg-pink-500/20 text-pink-300', emoji: '⚡' }
];

export const SetupScreen = () => {
  const { startGame } = useGame();

  const [teams, setTeams] = useState([
    { id: 1, name: 'فريق الصقور', color: 'purple', emoji: '🦅' },
    { id: 2, name: 'فريق الأسود', color: 'orange', emoji: '🦁' }
  ]);
  const [questionCount, setQuestionCount] = useState(5);

  const handleNameChange = (id, newName) => {
    setTeams(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
  };

  const addTeam = () => {
    if (teams.length >= 4) return;
    const nextIdx = teams.length;
    const palette = TEAM_PALETTES[nextIdx];
    const defaultNames = ['فريق الذئاب', 'فريق الصواعق'];
    setTeams(prev => [
      ...prev,
      {
        id: nextIdx + 1,
        name: defaultNames[nextIdx - 2] || `فريق ${nextIdx + 1}`,
        color: palette.color,
        emoji: palette.emoji
      }
    ]);
  };

  const removeTeam = (id) => {
    if (teams.length <= 2) return;
    setTeams(prev => prev.filter(t => t.id !== id));
  };

  const handleStart = (e) => {
    e.preventDefault();
    // Validate team names
    const validatedTeams = teams.map((t, idx) => ({
      ...t,
      name: t.name.trim() || `فريق ${idx + 1}`
    }));
    startGame(validatedTeams, questionCount);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 animate-fadeIn">
      {/* Hero Title */}
      <div className="text-center mb-10">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-500/10 text-game-yellow border border-game-yellow/30 mb-3 shadow-sm">
          ✨ استعد للمواجهة الكبرى!
        </span>
        <h2 className="text-4xl sm:text-5xl font-black text-white mb-3">
          إعداد الجلسة والتحدي 🎯
        </h2>
        <p className="text-purple-200/80 text-base max-w-xl mx-auto">
          اختر أسماء الفرق المشاركة على نفس الشاشة، حدد طول الجولة، واستعد لأقوى الأسئلة والمفاجآت التكتيكية!
        </p>
      </div>

      <form onSubmit={handleStart} className="space-y-8">
        {/* Teams Configuration Card */}
        <div className="bg-[#17142b] border border-purple-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👥</span>
              <div>
                <h3 className="text-xl font-bold text-white">الفرق المتنافسة</h3>
                <p className="text-xs text-purple-300/70">حدد أسماء الفرق المتنافسة (من فريقين إلى 4 فرق)</p>
              </div>
            </div>

            {teams.length < 4 && (
              <button
                type="button"
                onClick={addTeam}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/30"
              >
                <span>➕</span> إضافة فريق
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teams.map((team, idx) => {
              const palette = TEAM_PALETTES[idx] || TEAM_PALETTES[0];
              return (
                <div
                  key={team.id}
                  className={`relative p-5 rounded-2xl bg-gradient-to-br from-[#201c38] to-[#161327] border-2 ${palette.border} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{palette.emoji}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${palette.badge}`}>
                        فريق #{idx + 1}
                      </span>
                      {teams.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeTeam(team.id)}
                          className="text-red-400 hover:text-red-300 text-xs p-1"
                          title="حذف الفريق"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <label className="block text-xs font-semibold text-purple-200/90 mb-1.5">
                    اسم الفريق:
                  </label>
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => handleNameChange(team.id, e.target.value)}
                    maxLength={25}
                    placeholder={`فريق ${idx + 1}`}
                    required
                    className="w-full bg-[#0f0e1a] border border-purple-800/60 focus:border-game-yellow rounded-xl px-4 py-2.5 text-white font-bold text-sm outline-none transition-all placeholder:text-gray-600"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Questions Count Selector Card */}
        <div className="bg-[#17142b] border border-purple-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">⏱️</span>
            <div>
              <h3 className="text-xl font-bold text-white">عدد أسئلة الجولة</h3>
              <p className="text-xs text-purple-300/70">اختر كمية الأسئلة لتحديد مدة الجلسة وسرعتها</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[5, 10, 15, 20].map((count) => {
              const isSelected = questionCount === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`py-4 px-3 rounded-2xl font-black text-center transition-all ${
                    isSelected
                      ? 'bg-gradient-to-tr from-game-orange to-game-yellow text-slate-950 shadow-lg shadow-orange-500/30 scale-105 border-2 border-yellow-200'
                      : 'bg-[#201c38] text-purple-200 border border-purple-800/50 hover:bg-purple-900/40'
                  }`}
                >
                  <div className="text-2xl font-black">{count}</div>
                  <div className="text-xs font-bold opacity-90">أسئلة</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Game Action Button */}
        <div className="text-center pt-2">
          <button
            type="submit"
            className="w-full sm:w-auto min-w-[280px] px-10 py-5 rounded-2xl bg-gradient-to-r from-game-purple via-game-orange to-game-yellow text-slate-950 font-black text-xl shadow-2xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mx-auto"
          >
            <span>انطلاق التحدي</span>
            <span className="text-2xl">🚀</span>
          </button>
          <p className="text-xs text-purple-300/60 mt-3 font-medium">
            💡 نصيحة: جهّز الشاشة الكبيرة واجمع الأصدقاء للمنافسة!
          </p>
        </div>
      </form>
    </div>
  );
};
