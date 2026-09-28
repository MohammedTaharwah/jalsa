import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
Trophy,
Flame,
Zap,
Sparkles,
Shield,
HelpCircle,
Swords,
Timer,
CheckCircle2,
XCircle,
ArrowRight,
Dices,
RotateCcw,
Check,
AlertCircle,
Eye,
Snowflake,
Lock,
X
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { FortuneWheelModal } from './FortuneWheelModal';
import { CATEGORIES_DATA, POWERUPS_CATALOG } from '../data/categoriesData';

const OPTION_LETTERS = ['أ', 'ب', 'ج', 'د'];

export const GameBoard = () => {
const {
teams,
currentTurn,
board,
isStealMode,
isWheelChallengeActive,
activateWheelChallenge,
cancelWheelChallenge,
isLockedForCurrentTeam,
activatePowerup,
activeTile,
activeQuestion,
questionModalOpen,
selectedOption,
isAnswerRevealed,
isCorrect,
activeModifier,
gameBanner,
clearBanner,
selectTile,
selectOption,
handleAnswer,
closeQuestionModal,
resetGame,
initGame,
availableGames
} = useGameStore();

// If board not yet created (e.g. refreshed page directly on board stage), initialize it
useEffect(() => {
if (!board || board.length === 0) {
if (availableGames <= 0) {
resetGame();
return;
}
initGame(teams, ['sports', 'history', 'science', 'cinema', 'general', 'tech']);
}
}, [board?.length, initGame, availableGames, resetGame, teams]);

// Circular Timer State (30 seconds per question)
const TIMER_SECONDS = 30;
const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
const [timerActive, setTimerActive] = useState(false);

// Exposed Question Mode local state (show / hide answer)
const [isExposedAnswerShown, setIsExposedAnswerShown] = useState(false);

// Sync timer when question modal opens
useEffect(() => {
if (questionModalOpen && activeTile) {
setTimeLeft(TIMER_SECONDS);
setTimerActive(true);
setIsExposedAnswerShown(false);
} else {
setTimerActive(false);
}
}, [questionModalOpen, activeTile]);

// Countdown Interval Effect
useEffect(() => {
let interval = null;
if (timerActive && timeLeft > 0 && !isAnswerRevealed) {
interval = setInterval(() => {
setTimeLeft(prev => prev - 1);
}, 1000);
} else if (timeLeft === 0 && !isAnswerRevealed && activeTile) {
// Time is up! Trigger wrong answer
setTimerActive(false);
handleAnswer(false);
}
return () => clearInterval(interval);
}, [timerActive, timeLeft, isAnswerRevealed, activeTile, handleAnswer]);

const currentTeam = teams[currentTurn] || teams[0];

// Circular SVG timer calculation
const strokeDashoffset = 100 - (timeLeft / TIMER_SECONDS) * 100;

// Calculate effective points for display
const getDisplayPoints = () => {
if (!activeTile) return 200;
if (activeModifier === 'double') return activeTile.points * 2;
if (activeModifier === 'exposed') return activeTile.points * 3;
return activeTile.points;
};

return (
<div
className="w-full h-screen max-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-2 sm:p-3 font-sans select-none overflow-hidden"
dir="rtl"
>
{/* ================= FLOATING GAME NOTIFICATION / BANNER ================= */}
<AnimatePresence>
{gameBanner && (
<motion.div
initial={{ opacity: 0, y: -20, scale: 0.95 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -20, scale: 0.95 }}
className="w-full max-w-7xl mx-auto mb-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white shadow-md border border-purple-400/40 flex items-center justify-between gap-3 shrink-0 text-xs"
>
<div className="flex items-center gap-2">
<span className="text-base animate-bounce"></span>
<div>
<h4 className="text-xs font-black text-amber-300">{gameBanner.title}</h4>
<p className="text-[11px] text-purple-100 font-medium">{gameBanner.message}</p>
</div>
</div>
<button
onClick={clearBanner}
className="px-2.5 py-0.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold transition-all cursor-pointer"
>
حسناً
</button>
</motion.div>
)}
</AnimatePresence>

{/* ================= TURN INDICATOR & LIVE SCOREBOARD ================= */}
<div className="w-full max-w-7xl mx-auto mb-1.5 shrink-0">
<div className="bg-white rounded-2xl px-3 py-1.5 shadow-sm border border-slate-100 flex flex-wrap items-center justify-between gap-2">
{/* Active Turn Banner */}
<div className="flex items-center gap-2">
<div
className={`flex items-center gap-2 px-3 py-1 rounded-xl text-white shadow-md border ${
currentTurn === 0
? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 shadow-purple-500/20 border-purple-400/40'
: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 shadow-orange-500/20 border-orange-400/40'
}`}
>
<span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
<span className="text-[11px] font-bold opacity-90">الدور:</span>
<span className="text-xs sm:text-sm font-black tracking-wide">
{currentTeam.name}
</span>
{currentTeam.isFrozen && (
<span className="px-1.5 py-0.2 rounded-md bg-cyan-400 text-slate-900 text-[9px] font-black flex items-center gap-0.5">
<Snowflake className="w-2.5 h-2.5" /> مجمّد
</span>
)}
</div>
</div>

{/* Teams Live Score Cards with Chosen Power-ups */}
<div className="flex flex-wrap items-center gap-2">
{teams.map((team, idx) => {
const isActive = idx === currentTurn;
const teamLoadout = team.loadout && team.loadout.length === 2
? team.loadout
: (idx === 0 ? ['double', 'steal'] : ['freeze', 'fifty']);

return (
<motion.div
key={team.id}
animate={{ scale: isActive ? 1.02 : 1 }}
className={`px-2.5 py-1 rounded-xl border-2 transition-all flex items-center gap-2 ${
isActive
? idx === 0
? 'bg-purple-50/70 border-purple-500 shadow-xs'
: 'bg-orange-50/70 border-orange-500 shadow-xs'
: 'bg-white border-slate-200/80 opacity-80'
}`}
>
<div
className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-xs text-white ${
idx === 0 ? 'bg-purple-600' : 'bg-orange-500'
}`}
>
{idx === 0 ? <Shield className="w-3.5 h-3.5" /> : <Flame className="w-3.5 h-3.5" />}
</div>

<div>
<div className="text-[11px] font-bold text-slate-700 truncate max-w-[100px] leading-tight">
{team.name}
</div>
<div className="text-xs sm:text-sm font-black text-slate-900 leading-none">
{team.score} <span className="text-[9px] text-purple-600 font-bold">ن</span>
</div>
</div>

{/* 2 Chosen Power-ups */}
<div className="flex items-center gap-1 pr-1 border-r border-slate-200/60">
{teamLoadout.map((powerupId) => {
const pData = POWERUPS_CATALOG.find(p => p.id === powerupId) || {
id: powerupId,
name: powerupId,
shortName: powerupId,
cost: 100,
emoji: ''
};
const canAfford = team.score >= pData.cost;
const isDisabled = !isActive || team.isFrozen || !canAfford;

return (
<button
key={powerupId}
type="button"
disabled={isDisabled}
onClick={() => activatePowerup(team.id, powerupId)}
title={`تفعيل ${pData.name} (${pData.cost}ن)`}
className={`px-1.5 py-0.5 rounded-md text-[9px] font-black flex items-center gap-0.5 border transition-all ${
isDisabled
? 'bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
: idx === 0
? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-2xs active:scale-95 cursor-pointer'
: 'bg-orange-500 hover:bg-orange-600 text-white border-orange-500 shadow-2xs active:scale-95 cursor-pointer'
}`}
>
<span>{pData.emoji}</span>
<span>{pData.shortName}</span>
</button>
);
})}
</div>
</motion.div>
);
})}

{/* Fortune Wheel Challenge Button */}
{currentTeam.hasUsedWheel ? (
<button
type="button"
disabled
className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-[11px] font-bold opacity-60 cursor-not-allowed flex items-center gap-1 shadow-2xs"
title="تم استهلاك ميزة عجلة الحظ لهذا الفريق في هذه الجلسة"
>
<Dices className="w-3.5 h-3.5 text-slate-400" />
<span>العجلة مستهلكة</span>
</button>
) : isWheelChallengeActive ? (
<div className="flex items-center gap-1">
<button
type="button"
className="px-2.5 py-1 rounded-xl bg-amber-500 text-white border border-amber-600 text-[11px] font-black flex items-center gap-1 shadow-xs ring-2 ring-amber-400/50"
title="تحدي العجلة نشط! اختر سؤال 400 نقطة المضاء بالذهبي من فئات الخصم"
>
<Dices className="w-3.5 h-3.5 animate-spin" />
<span>التحدي نشط 🎡</span>
</button>
<button
type="button"
onClick={cancelWheelChallenge}
className="px-2 py-1 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black flex items-center gap-1 shadow-xs transition-all cursor-pointer"
title="إلغاء التحدي والعودة للاختيار الطبيعي"
>
<X className="w-3 h-3" />
<span>إلغاء</span>
</button>
</div>
) : (
<button
type="button"
onClick={activateWheelChallenge}
className="px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white border border-amber-400 text-[11px] font-black transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
title="تفعيل تحدي العجلة: اختر سؤال 400 نقطة من الخصم للربح!"
>
<Dices className="w-3.5 h-3.5" />
<span>تحدي العجلة 🎡</span>
</button>
)}

{/* Restart Session Action */}
<button
onClick={resetGame}
className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
title="إنهاء وبدء جلسة جديدة"
>
<RotateCcw className="w-3.5 h-3.5" />
</button>
</div>
</div>
</div>

{/* ================= WHEEL CHALLENGE HIGH-ALERT BANNER ================= */}
<AnimatePresence>
{isWheelChallengeActive && (
<motion.div
initial={{ opacity: 0, y: -10, scale: 0.98 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -10, scale: 0.98 }}
className="w-full max-w-7xl mx-auto mb-1 p-2 rounded-2xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-md border border-amber-300 flex items-center justify-between gap-3 shrink-0"
>
<div className="flex items-center gap-2">
<span className="text-lg">🎡</span>
<div>
<h4 className="text-xs font-black text-amber-100">تحدي العجلة مفعّل!</h4>
<p className="text-[10px] text-amber-50 font-bold">
فريق [{currentTeam.name}]، اختر سؤال الـ 400 نقطة (المضاء بالذهبي) من فئات الخصم!
</p>
</div>
</div>
<div className="flex items-center gap-2">
<span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px] font-black">
سؤال 400 نقطة للخصم 🎯
</span>
<button
onClick={cancelWheelChallenge}
className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black flex items-center gap-1 shadow-sm transition-all cursor-pointer"
>
<X className="w-3 h-3" />
<span>إلغاء التحدي</span>
</button>
</div>
</motion.div>
)}
</AnimatePresence>

{/* ================= STEAL MODE HIGH-ALERT BANNER ================= */}
<AnimatePresence>
{isStealMode && (
<motion.div
initial={{ opacity: 0, y: -10, scale: 0.98 }}
animate={{ opacity: 1, y: 0, scale: 1 }}
exit={{ opacity: 0, y: -10, scale: 0.98 }}
className="w-full max-w-7xl mx-auto mb-1 p-2 rounded-2xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white shadow-md border border-rose-300 flex items-center justify-between gap-3 animate-pulse shrink-0"
>
<div className="flex items-center gap-2">
<span className="text-lg"></span>
<div>
<h4 className="text-xs font-black text-amber-200">وضع سرقة السؤال مفعّل!</h4>
<p className="text-[10px] text-rose-100 font-bold">
فريق [{currentTeam.name}] اختر أي سؤال متاح من فئات الفريق الخصم لسرقته!
</p>
</div>
</div>
<span className="px-2 py-0.5 rounded-lg bg-white/20 text-[10px] font-black">
اختر سؤال الخصم 
</span>
</motion.div>
)}
</AnimatePresence>

{/* ================= JEOPARDY-STYLE 6x6 GRID (NO SCROLLING) ================= */}
<div className="w-full max-w-7xl mx-auto flex-1 flex flex-col min-h-0 bg-white rounded-2xl p-2 sm:p-2.5 shadow-sm border border-slate-100 overflow-hidden">
{/* Header Bar */}
<div className="flex items-center justify-between border-b border-slate-100 pb-1 mb-1.5 shrink-0">
<div className="flex items-center gap-1.5">
<Sparkles className="w-4 h-4 text-orange-500" />
<h3 className="text-xs sm:text-sm font-black text-slate-900">
لوحة التحدي (6 فئات × 6 أسئلة)
</h3>
</div>
</div>

{/* 6 Category Columns */}
<div className="grid grid-cols-6 gap-1.5 sm:gap-2 flex-1 min-h-0">
{board.map((column) => {
const meta = column.categoryMeta || CATEGORIES_DATA.find(c => c.id === column.categoryId) || {};
const isRivalCategory = column.chosenByTeam && column.chosenByTeam.id !== currentTeam.id;

return (
<div
key={column.categoryId || column.key}
className={`flex flex-col gap-1 sm:gap-1.5 h-full min-h-0 transition-all ${
isStealMode
? isRivalCategory
? 'p-1 rounded-2xl bg-rose-50/50 border-2 border-rose-400 shadow-sm shadow-rose-500/10'
: 'opacity-40'
: ''
}`}
>
{/* Category Header Card */}
<div
className={`rounded-xl border text-center flex flex-col items-center justify-center p-1 shrink-0 h-13 sm:h-14 shadow-2xs transition-all ${
isStealMode && isRivalCategory
? 'bg-gradient-to-b from-rose-100 to-rose-50 border-rose-300'
: 'bg-gradient-to-b from-slate-50 to-white border-slate-200/90'
}`}
>
<span className="text-base leading-none mb-0.5">{meta.emoji || ''}</span>
<h4 className="text-[11px] sm:text-xs font-black text-slate-900 leading-tight truncate max-w-full">
{column.categoryName || column.name}
</h4>
{column.chosenByTeam && (
<span
className={`text-[8px] sm:text-[9px] font-bold px-1.5 py-0.2 rounded-md border mt-0.5 truncate max-w-full leading-none ${
isStealMode && isRivalCategory
? 'bg-rose-600 text-white border-rose-700 animate-pulse'
: 'text-purple-700 bg-purple-50 border-purple-200/80'
}`}
>
{isStealMode && isRivalCategory ? ' فئة الخصم' : column.chosenByTeam.name}
</span>
)}
</div>

{/* 6 Point Tiles (Grid of 6 rows, perfectly distributed vertically) */}
<div className="flex-1 grid grid-rows-6 gap-1 sm:gap-1.5 min-h-0">
{column.tiles.map((tile) => {
if (tile.isUsed) {
const winnerTeam = teams.find(t => t.id === tile.winnerTeamId);

return (
<div
key={tile.id}
className="w-full h-full rounded-xl bg-slate-100/80 border border-slate-200/70 flex flex-col items-center justify-center text-center p-0.5 opacity-50 cursor-not-allowed select-none"
>
<span className="text-xs text-slate-400 font-bold line-through leading-none">
{tile.points}
</span>
{winnerTeam ? (
<span className="text-[8px] text-purple-700 font-black mt-0.5 truncate max-w-full leading-none">
{winnerTeam.name}
</span>
) : (
<span className="text-[8px] text-slate-500 font-semibold mt-0.5 leading-none">
أُجيب
</span>
)}
</div>
);
}

if (tile.is_available === false) {
return (
<div
key={tile.id}
className="w-full h-full rounded-xl bg-rose-50/60 border border-dashed border-rose-200/80 flex flex-col items-center justify-center text-center p-0.5 opacity-70 cursor-not-allowed select-none"
title={tile.message || `نفدت الأسئلة لمستوى ${tile.points} نقطة`}
>
<span className="text-[11px] text-rose-400 font-bold line-through leading-none">
{tile.points}
</span>
<span className="text-[8px] text-rose-600 font-black mt-0.5 leading-none">
غير متاح
</span>
</div>
);
}

// 1. Dynamic Locking Rule: team already answered this point level in this category
const isLocked = isLockedForCurrentTeam(column.categoryId, tile.points);
if (isLocked) {
return (
<div
key={tile.id}
className="w-full h-full rounded-xl bg-slate-100/90 border border-slate-200/80 flex flex-col items-center justify-center text-center p-0.5 opacity-50 cursor-not-allowed select-none"
title={`أجاب فريقك مسبقاً على سؤال بمستوى ${tile.points} نقطة في هذه الفئة`}
>
<div className="flex items-center justify-center gap-1 text-slate-400">
<Lock className="w-3 h-3 text-slate-400" />
<span className="text-xs font-bold leading-none">{tile.points}</span>
</div>
<span className="text-[8px] text-slate-500 font-bold mt-0.5 leading-none">
مغلق 
</span>
</div>
);
}

// 2. Wheel Challenge Mode restrictions
const isWheelTarget = isWheelChallengeActive && isRivalCategory && tile.points === 400;
const isWheelMuted = isWheelChallengeActive && !isWheelTarget;

const isTileStealTarget = isStealMode && isRivalCategory;

return (
<motion.button
key={tile.id}
whileHover={{ scale: 1.03 }}
whileTap={{ scale: 0.96 }}
onClick={() => selectTile(column, tile)}
className={`w-full h-full rounded-xl font-black text-xs sm:text-sm lg:text-base transition-all flex flex-col items-center justify-center relative shadow-2xs hover:shadow-xs cursor-pointer border select-none ${
isWheelTarget
? 'bg-gradient-to-br from-amber-400 via-orange-500 to-amber-500 border-2 border-amber-600 text-white ring-4 ring-amber-300 ring-offset-1 shadow-lg shadow-amber-500/40 animate-pulse scale-[1.03]'
: isWheelMuted
? 'bg-slate-100/70 border-slate-200/60 text-slate-400 opacity-40 hover:opacity-75'
: isTileStealTarget
? 'bg-gradient-to-br from-rose-100 to-pink-100 border-rose-400 text-rose-700 ring-2 ring-rose-400/40 shadow-rose-500/20 animate-pulse'
: tile.points === 200
? 'bg-purple-50/80 hover:bg-purple-100/90 border-purple-200 text-purple-700'
: tile.points === 400
? 'bg-orange-50/80 hover:bg-orange-100/90 border-orange-200 text-orange-600'
: 'bg-amber-50/80 hover:bg-amber-100/90 border-amber-300 text-amber-700'
}`}
>
<span className="leading-none">{tile.points}</span>
<span className="text-[8px] font-bold opacity-75 leading-none mt-0.5">
{isWheelTarget ? 'تحدي 🎡' : isTileStealTarget ? 'اسرقني ⚔️' : tile.isMystery ? 'حظ 🎲' : 'نقطة'}
</span>
{tile.isMystery && !isWheelTarget && (
<span className="absolute top-0.5 left-1 text-[8px] text-amber-500 animate-pulse">
✨
</span>
)}
</motion.button>
);
})}
</div>
</div>
);
})}
</div>
</div>

{/* ================= QUESTION MODAL WITH CIRCULAR TIMER & MODIFIERS ================= */}
<AnimatePresence>
{questionModalOpen && activeTile && activeQuestion && (
<div
className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm"
dir="rtl"
>
<motion.div
initial={{ opacity: 0, scale: 0.92, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.92, y: 20 }}
transition={{ type: 'spring', damping: 25, stiffness: 300 }}
className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-10 shadow-[0_25px_60px_rgba(124,58,237,0.2)] border border-slate-100 flex flex-col gap-6 text-center overflow-hidden"
>
{/* Header: Category Badge, Points, & Circular Timer */}
<div className="flex items-center justify-between border-b border-slate-100 pb-4">
<span className="px-3.5 py-1.5 rounded-full bg-purple-50 text-purple-700 font-bold text-xs border border-purple-200">
{activeTile.categoryName}
</span>

{/* Circular Animated SVG Timer */}
<div className="flex items-center gap-2.5">
<div className="relative w-12 h-12 flex items-center justify-center">
<svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
<circle
cx="18"
cy="18"
r="14"
fill="none"
className="stroke-slate-100"
strokeWidth="3.5"
/>
<circle
cx="18"
cy="18"
r="14"
fill="none"
className={`transition-all duration-1000 ${
timeLeft <= 5 ? 'stroke-rose-500' : 'stroke-purple-600'
}`}
strokeWidth="3.5"
strokeDasharray="100"
strokeDashoffset={strokeDashoffset}
strokeLinecap="round"
/>
</svg>
<span
className={`absolute font-black text-xs ${
timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-700'
}`}
>
{timeLeft}
</span>
</div>

<span className="px-3.5 py-1.5 rounded-full bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-500/20">
{getDisplayPoints()} نقطة
</span>
</div>
</div>

{/* Active Wheel Modifier Banner if applied */}
{activeModifier && (
<div className="px-4 py-2 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm border animate-pulse">
{activeModifier === 'double' && (
<div className="bg-purple-100 text-purple-900 border-purple-300 w-full py-2 rounded-2xl flex items-center justify-center gap-2">
<Zap className="w-4 h-4 text-purple-700" />
<span> دبل النقاط نشط! النقاط مضاعفة x2 ({activeTile.points * 2} نقطة)</span>
</div>
)}
{activeModifier === 'exposed' && (
<div className="bg-orange-100 text-orange-900 border-orange-300 w-full py-2 rounded-2xl flex items-center justify-center gap-2">
<Flame className="w-4 h-4 text-orange-600" />
<span> سؤال مكشوف - الريمونتادا! الإجابة بدون خيارات تمنحك 3 أضعاف النقاط ({activeTile.points * 3} نقطة)!</span>
</div>
)}
{activeModifier === 'steal' && (
<div className="bg-rose-100 text-rose-950 border-rose-300 w-full py-2 rounded-2xl flex items-center justify-center gap-2">
<Swords className="w-4 h-4 text-rose-600" />
<span> سرقة سؤال من الخصم! الإجابة الصحيحة تمنح فريق [{currentTeam.name}] النقاط وتصادر السؤال نهائياً!</span>
</div>
)}
{activeModifier === 'freeze' && (
<div className="bg-cyan-100 text-cyan-900 border-cyan-300 w-full py-2 rounded-2xl flex items-center justify-center gap-2">
<Snowflake className="w-4 h-4 text-cyan-600" />
<span> تأثير التجميد نشط على المنافس!</span>
</div>
)}
</div>
)}

{/* Turn Banner */}
<div className="inline-block px-4 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-black mx-auto">
دور الفريق للإجابة: <strong className="text-purple-600 font-extrabold">{currentTeam.name}</strong>
</div>

{/* Big Arabic Question Text */}
<div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 flex items-center justify-center min-h-[140px]">
<h3 className="text-2xl sm:text-3xl font-black text-slate-900 leading-relaxed tracking-wide">
{activeQuestion.question_text}
</h3>
</div>

{/* ================= QUESTION CHOICES OR EXPOSED MODE ================= */}
{activeModifier === 'exposed' && !isAnswerRevealed ? (
/* Hardcore Mode: Question without choices, players answer verbally */
<div className="p-6 rounded-3xl bg-orange-50/70 border-2 border-dashed border-orange-300 flex flex-col items-center gap-4">
<Flame className="w-8 h-8 text-orange-500 animate-bounce" />
<div className="text-center">
<h4 className="text-base font-black text-orange-950">
تحدي السؤال المكشوف (بدون خيارات)!
</h4>
<p className="text-xs text-orange-800 mt-1 font-medium max-w-md">
يجب على فريق [{currentTeam.name}] الإجابة شفوياً بصوت مسموع، ثم اضغطوا للتحقق من الإجابة!
</p>
</div>

{!isExposedAnswerShown ? (
<button
onClick={() => setIsExposedAnswerShown(true)}
className="px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm shadow-md shadow-orange-500/25 flex items-center gap-2 transition-all active:scale-95"
>
<Eye className="w-4 h-4" />
<span>كشف الإجابة النموذجية للتحقق </span>
</button>
) : (
<div className="w-full flex flex-col items-center gap-4">
<div className="px-5 py-3 rounded-2xl bg-white border border-orange-200 shadow-sm text-sm font-black text-slate-800">
الإجابة الصحيحة هي:{' '}
<strong className="text-emerald-600 text-base">
{activeQuestion.correct_answer}
</strong>
</div>

<div className="flex flex-wrap items-center justify-center gap-3">
<button
onClick={() => handleAnswer(true)}
className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
>
<CheckCircle2 className="w-5 h-5" />
<span>أجاب الفريق بشكل صحيح (+{activeTile.points * 3} نقطة!) </span>
</button>
<button
onClick={() => handleAnswer(false)}
className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all active:scale-95"
>
<XCircle className="w-5 h-5" />
<span>أخطأ الفريق في الإجابة </span>
</button>
</div>
</div>
)}
</div>
) : (
/* Standard 4-Option Grid (أ، ب، ج، د) */
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
{(activeQuestion.options_json || []).map((option, idx) => {
const letter = OPTION_LETTERS[idx] || '•';
const isSelected = selectedOption === option;
const isCorrectAnswer = option === activeQuestion.correct_answer;

let style =
'bg-white border-2 border-slate-200 text-slate-800 hover:border-purple-300 hover:bg-purple-50/40';

if (isAnswerRevealed) {
if (isCorrectAnswer) {
style =
'bg-emerald-500 border-2 border-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]';
} else if (isSelected && !isCorrect) {
style =
'bg-rose-500 border-2 border-rose-600 text-white shadow-lg shadow-rose-500/25';
} else {
style = 'bg-slate-100 border-slate-200 text-slate-400 opacity-40';
}
}

return (
<motion.button
key={idx}
whileHover={!isAnswerRevealed ? { scale: 1.01 } : {}}
whileTap={!isAnswerRevealed ? { scale: 0.98 } : {}}
disabled={isAnswerRevealed}
onClick={() => selectOption(option)}
className={`p-4 sm:p-5 rounded-2xl font-bold text-base sm:text-lg text-right transition-all flex items-center justify-between gap-3 shadow-sm ${style}`}
>
<div className="flex items-center gap-3">
<span
className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
isAnswerRevealed && (isCorrectAnswer || isSelected)
? 'bg-white/20 text-white'
: 'bg-purple-50 text-purple-700 border border-purple-200'
}`}
>
{letter}
</span>
<span>{option}</span>
</div>

{isAnswerRevealed && isCorrectAnswer && (
<CheckCircle2 className="w-5 h-5 text-white" />
)}
{isAnswerRevealed && isSelected && !isCorrect && (
<XCircle className="w-5 h-5 text-white" />
)}
</motion.button>
);
})}
</div>
)}

{/* ================= ANSWER FEEDBACK & NEXT TURN ================= */}
{isAnswerRevealed && (
<motion.div
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4"
>
<div className="text-right">
<div className="text-base font-black text-slate-900">
{isCorrect
? ` إجابة صحيحة! أضيفت +${getDisplayPoints()} نقطة لرصيد [${currentTeam.name}]!`
: ` إجابة خاطئة أو انتهى الوقت! تم خصم النقاط.`}
</div>
<div className="text-xs text-slate-500 mt-0.5">
الإجابة النموذجية هي:{' '}
<strong className="text-purple-700 font-bold">
{activeQuestion.correct_answer}
</strong>
</div>
</div>

<button
onClick={closeQuestionModal}
className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-md shadow-purple-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
>
<span>
{isWheelChallengeActive && isCorrect
? 'الانتقال لتدوير عجلة الحظ 🎡'
: 'العودة للوحة والانتقال للدور التالي'}
</span>
<ArrowRight className="w-4 h-4 rotate-180" />
</button>
</motion.div>
)}
</motion.div>
</div>
)}
</AnimatePresence>

{/* ================= FORTUNE WHEEL MODAL (4 OUTCOMES) ================= */}
<FortuneWheelModal />
</div>
);
};

