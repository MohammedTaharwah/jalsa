import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
Sparkles,
Zap,
Swords,
Snowflake,
RotateCw,
ArrowRight,
X,
Dices,
AlertTriangle,
Trophy
} from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { FORTUNE_WHEEL_OPTIONS } from '../data/categoriesData';

const getOptionIcon = (iconName) => {
switch (iconName) {
case 'Zap': return <Zap className="w-5 h-5 text-white" />;
case 'Snowflake': return <Snowflake className="w-5 h-5 text-white" />;
case 'Swords': return <Swords className="w-5 h-5 text-white" />;
default: return <Sparkles className="w-5 h-5 text-white" />;
}
};

// Math helpers for generating exact SVG circular sectors
const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
return {
x: centerX + radius * Math.cos(angleInRadians),
y: centerY + radius * Math.sin(angleInRadians)
};
};

const splitWheelLabel = (raw) => {
  const words = String(raw || '').split(' ').filter(Boolean);
  const mid = Math.ceil(words.length / 2);
  return {
    line1: words.slice(0, mid).join(' '),
    line2: words.slice(mid).join(' ')
  };
};

const describeArc = (x, y, radius, startAngle, endAngle) => {
const start = polarToCartesian(x, y, radius, endAngle);
const end = polarToCartesian(x, y, radius, startAngle);
const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
return [
'M', x, y,
'L', start.x, start.y,
'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
'Z'
].join(' ');
};

// 6 alternating sectors (each of the 3 dynamic options repeated twice)
const WHEEL_SECTORS = [
FORTUNE_WHEEL_OPTIONS[0], // double (0° - 60°)
FORTUNE_WHEEL_OPTIONS[1], // freeze (60° - 120°)
FORTUNE_WHEEL_OPTIONS[2], // steal_random (120° - 180°)
FORTUNE_WHEEL_OPTIONS[0], // double (180° - 240°)
FORTUNE_WHEEL_OPTIONS[1], // freeze (240° - 300°)
FORTUNE_WHEEL_OPTIONS[2] // steal_random (300° - 360°)
];

/**
* FortuneWheelModal - عجلة الحظ بالخيارات الديناميكية الثلاثة:
* 1. x2 تدبيل النقاط (+400)
* 2. حرمان الخصم من الأسلحة للدور القادم (تجميد)
* 3. سرقة سؤال عشوائي من الخصم
* 
* في نظام التحدي والمخاطرة:
* - فوز بالتحدي: تطبق ميزة العجلة لصالح الفريق صاحب الدور
* - خسارة التحدي: تطبق ميزة العجلة كعقاب لصالح الفريق الخصم
* 
* التصميم: نافذة منبثقة بخلفية داكنة مموهة (backdrop-blur-sm bg-black/60)
*/
export const FortuneWheelModal = () => {
const {
wheelModalOpen,
isWheelSpinning,
wheelRotation,
selectedWheelOption,
spinFortuneWheel,
confirmFortuneResult,
closeFortuneModal,
teams,
currentTurn,
isWheelChallengeActive,
wheelChallengeBeneficiary
} = useGameStore();

if (!wheelModalOpen) return null;

const currentTeam = teams[currentTurn] || teams[0];
const rivalIndex = (currentTurn + 1) % teams.length;
const rivalTeam = teams[rivalIndex] || teams[1] || teams[0];
const isWin = wheelChallengeBeneficiary === 'current';
const beneficiaryTeam = isWin ? currentTeam : rivalTeam;

return (
<AnimatePresence>
<div
className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/60"
dir="rtl"
>
<motion.div
initial={{ opacity: 0, scale: 0.88, y: 20 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.88, y: 20 }}
transition={{ type: 'spring', damping: 25, stiffness: 280 }}
className="relative w-full max-w-lg bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-slate-700/80 text-white text-center overflow-hidden"
>
{/* Decorative ambient background glows */}
<div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
<div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

{/* Close button */}
<button
onClick={closeFortuneModal}
disabled={isWheelSpinning}
className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
>
<X className="w-5 h-5" />
</button>

{/* Challenge Outcome Status Banner */}
<div className="mb-3 p-2.5 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 shadow-sm bg-emerald-950/60 border-emerald-500/50 text-emerald-300">
<Trophy className="w-4 h-4 text-emerald-400 shrink-0" />
<span>فوز بالتحدي! تدور العجلة حصراً لصالح فريق [{currentTeam.name}] 🎉</span>
</div>

{/* Header Badge */}
<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-black mb-2 shadow-sm">
<Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
<span>حدث تكتيكي ومخاطرة • عجلة الحظ </span>
</div>

<h3 className="text-2xl sm:text-3xl font-black text-white mb-1">
عجلة الحظ والمفاجآت
</h3>
<p className="text-slate-400 text-xs font-medium mb-5">
المستفيد من نتيجة العجلة:{' '}
<span className="font-bold text-amber-400">[{beneficiaryTeam.name}]</span>
</p>

{/* ================= DYNAMIC SVG 6-SECTOR WHEEL ================= */}
<div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto mb-6 flex items-center justify-center">
{/* Top Wheel Pointer */}
<div className="absolute -top-3 z-30 flex flex-col items-center">
<div className="w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[22px] border-t-amber-400 filter drop-shadow-md" />
<div className="w-2.5 h-2.5 rounded-full bg-amber-500 -mt-2 ring-2 ring-slate-900" />
</div>

{/* Rotating Wheel Container */}
<motion.div
animate={{ rotate: wheelRotation }}
transition={{
duration: 3.2,
ease: [0.15, 0.85, 0.25, 1]
}}
className="w-full h-full rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.5)] border-4 border-slate-700 overflow-hidden relative"
>
<svg viewBox="0 0 200 200" className="w-full h-full">
{WHEEL_SECTORS.map((sector, idx) => {
const startAngle = idx * 60;
const endAngle = (idx + 1) * 60;
const midAngle = startAngle + 30;
const pos = polarToCartesian(100, 100, 68, midAngle);
const { line1, line2 } = splitWheelLabel(sector.sublabel || sector.label);

return (
<g key={idx}>
<path
d={describeArc(100, 100, 100, startAngle, endAngle)}
fill={sector.color}
stroke="#1e293b"
strokeWidth="2.5"
/>
<g transform={`translate(${pos.x}, ${pos.y})`}>
<text
textAnchor="middle"
dominantBaseline="middle"
fill="#ffffff"
fontSize="7"
fontWeight="800"
transform={`rotate(${midAngle}, 0, 0)`}
className="select-none pointer-events-none drop-shadow"
>
{line2 ? (
<>
<tspan x="0" dy="-4">{line1}</tspan>
<tspan x="0" dy="9">{line2}</tspan>
</>
) : line1}
</text>
</g>
</g>
);
})}
</svg>

{/* Center Hub */}
<div className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-slate-900 shadow-xl border-4 border-amber-400 flex items-center justify-center z-20">
<Dices className="w-7 h-7 text-amber-400 animate-pulse" />
</div>
</motion.div>
</div>

{/* ================= WHEEL RESULT DISPLAY ================= */}
{selectedWheelOption && !isWheelSpinning ? (
<motion.div
initial={{ opacity: 0, y: 15 }}
animate={{ opacity: 1, y: 0 }}
className="mb-5 p-4 rounded-2xl border bg-slate-800/90 border-amber-500/40 shadow-sm"
>
<div className="flex items-center justify-center gap-2 mb-1.5">
<div
className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md"
style={{ backgroundColor: selectedWheelOption.color }}
>
{getOptionIcon(selectedWheelOption.icon)}
</div>
<h4 className="text-base sm:text-lg font-black text-white">
{selectedWheelOption.label} • {selectedWheelOption.sublabel}
</h4>
</div>
<p className="text-xs text-slate-300 font-bold leading-relaxed">
{selectedWheelOption.desc}
</p>
<span className="inline-block mt-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black">
ستطبق النتيجة لصالح فريق [{beneficiaryTeam.name}]
</span>
</motion.div>
) : (
<div className="mb-5 grid grid-cols-3 gap-2 text-center">
{FORTUNE_WHEEL_OPTIONS.map((opt) => (
<div
key={opt.id}
className="px-2.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex flex-col items-center justify-center text-[11px] font-bold text-slate-200 shadow-xs"
>
<span className="text-lg mb-0.5">{opt.emoji}</span>
<span className="leading-tight font-black">{opt.label}</span>
<span className="text-[9px] text-slate-400 mt-0.5">{opt.sublabel}</span>
</div>
))}
</div>
)}

{/* ================= ACTION BUTTONS ================= */}
<div className="flex flex-col gap-2.5">
{!selectedWheelOption || isWheelSpinning ? (
<>
<button
onClick={spinFortuneWheel}
disabled={isWheelSpinning}
className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm sm:text-base shadow-lg shadow-amber-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
>
<RotateCw className={`w-5 h-5 ${isWheelSpinning ? 'animate-spin' : ''}`} />
<span>{isWheelSpinning ? 'جاري تدوير العجلة...' : 'تدوير عجلة الحظ الآن! 🎡'}</span>
</button>

{!isWheelSpinning && (
<button
onClick={() => {
useGameStore.setState({ selectedWheelOption: FORTUNE_WHEEL_OPTIONS[0] });
confirmFortuneResult();
}}
className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/40 text-amber-300 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
>
<Zap className="w-4 h-4 text-amber-400" />
<span>استفادة مباشرة فورية (+400 نقطة لفريقك بدون دوران) ⚡</span>
</button>
)}
</>
) : (
<button
onClick={confirmFortuneResult}
className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
>
<span>تطبيق التأثير واستكمال اللعب </span>
<ArrowRight className="w-5 h-5 rotate-180" />
</button>
)}
</div>
</motion.div>
</div>
</AnimatePresence>
);
};

