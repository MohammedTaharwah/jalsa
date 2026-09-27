import React from 'react';
import { useGame } from '../context/GameContext';

export const GameOverScreen = () => {
const { teams, resetGame } = useGame();

// Sort teams descending by score
const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
const winner = sortedTeams[0];
const isTie = sortedTeams.length > 1 && sortedTeams[0].score === sortedTeams[1].score;

return (
<div className="w-full max-w-3xl mx-auto py-12 px-4 text-center animate-fadeIn">
{/* Trophy and Badge */}
<div className="relative inline-block mb-6">
<div className="w-28 h-28 rounded-full bg-gradient-to-tr from-amber-400 via-game-yellow to-orange-500 flex items-center justify-center text-6xl shadow-2xl shadow-yellow-500/40 animate-bounce-short">

</div>
</div>

<h2 className="text-4xl sm:text-5xl font-black text-white mb-2">
{isTie ? 'تعادل ملحمي بين الأبطال! ' : `مبروك الفوز لـ [${winner.name}]! `}
</h2>
<p className="text-purple-200/80 text-base mb-8 max-w-md mx-auto">
انتهت الجولة بعد مواجهة شرسة وأسئلة تكتيكية ممتعة! إليكم جدول الترتيب النهائي:
</p>

{/* Leaderboard Cards */}
<div className="space-y-3 mb-10 max-w-xl mx-auto">
{sortedTeams.map((team, idx) => {
const isFirst = idx === 0;
return (
<div
key={team.id}
className={`p-5 rounded-3xl flex items-center justify-between border-2 transition-all ${
isFirst
? 'bg-gradient-to-r from-[#321e5c] via-[#261647] to-[#1d1038] border-game-yellow shadow-xl shadow-yellow-500/20 scale-105'
: 'bg-[#18142b]/90 border-purple-900/50'
}`}
>
<div className="flex items-center gap-4">
<span className="text-3xl">
{idx === 0 ? '' : idx === 1 ? '' : idx === 2 ? '' : ''}
</span>
<div className="text-right">
<div className="text-lg font-black text-white">{team.name}</div>
<div className="text-xs text-purple-300/70">
المركز #{idx + 1}
</div>
</div>
</div>

<div className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-game-yellow to-game-orange bg-clip-text text-transparent">
{team.score}
<span className="text-xs text-purple-300 font-bold mr-1">نقطة</span>
</div>
</div>
);
})}
</div>

{/* Restart Button */}
<button
onClick={resetGame}
className="px-10 py-5 rounded-2xl bg-gradient-to-r from-game-purple via-game-orange to-game-yellow text-slate-950 font-black text-xl shadow-2xl shadow-orange-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mx-auto"
>
<span>بدء جلسة وتحدي جديد</span>
<span className="text-2xl"></span>
</button>
</div>
);
};

