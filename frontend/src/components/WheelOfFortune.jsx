import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Dices, AlertTriangle, ArrowRight } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { WHEEL_SEGMENTS } from '../data/triviaQuestions';

export const WheelOfFortune = () => {
  const { wheelState, spinWheel, confirmWheelResult, activeTeam } = useGame();

  if (!wheelState.isOpen) return null;

  const segmentCount = WHEEL_SEGMENTS.length;
  const anglePerSegment = 360 / segmentCount;

  // Build SVG Pie slices
  const createSlicePath = (index) => {
    const startAngle = index * anglePerSegment;
    const endAngle = (index + 1) * anglePerSegment;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const r = 160;
    const cx = 175;
    const cy = 175;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#1c1833] via-[#141026] to-[#0d0a1a] rounded-3xl p-6 sm:p-8 border-2 border-purple-500/50 shadow-2xl text-center overflow-hidden">
        {/* Glow ambient header */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 bg-purple-500/20 blur-3xl pointer-events-none" />

        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 text-xs font-black mb-3 shadow-md shadow-orange-500/30">
          <Dices className="w-4 h-4" />
          <span>مربع الحظ السري! (Mystery Tile)</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-black text-white mb-1">
          عجلة الحظ والمفاجآت 🎡
        </h3>
        <p className="text-xs text-purple-200/70 font-medium mb-6">
          دور فريق <strong className="text-amber-400 font-black">[{activeTeam.name}]</strong> لتدوير العجلة وتحديد مصير السؤال!
        </p>

        {/* Wheel Container with Pointer */}
        <div className="relative w-[310px] h-[310px] sm:w-[350px] sm:h-[350px] mx-auto mb-6 flex items-center justify-center">
          {/* Top Pointer Indicator */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
            <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[32px] border-t-amber-400 drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)]"></div>
          </div>

          {/* Outer Glowing Ring */}
          <div className="absolute inset-0 rounded-full border-4 border-amber-400/40 shadow-[0_0_30px_rgba(168,85,247,0.3)] pointer-events-none"></div>

          {/* Rotating SVG Wheel */}
          <div
            className="w-full h-full rounded-full transition-transform duration-[3800ms] cubic-bezier(0.15,0.85,0.35,1.05)"
            style={{
              transform: `rotate(${wheelState.rotation}deg)`,
              transitionTimingFunction: 'cubic-bezier(0.12, 0.8, 0.32, 1)'
            }}
          >
            <svg viewBox="0 0 350 350" className="w-full h-full drop-shadow-2xl">
              {WHEEL_SEGMENTS.map((seg, idx) => {
                const midAngle = idx * anglePerSegment + anglePerSegment / 2;
                const midRad = (midAngle - 90) * (Math.PI / 180);
                const textX = 175 + 105 * Math.cos(midRad);
                const textY = 175 + 105 * Math.sin(midRad);

                return (
                  <g key={seg.id}>
                    <path
                      d={createSlicePath(idx)}
                      fill={seg.color}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                    />
                    {/* Segment text and icon */}
                    <text
                      x={textX}
                      y={textY}
                      fill="#ffffff"
                      fontSize="13"
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                      className="select-none pointer-events-none"
                    >
                      {seg.icon} {seg.subtitle}
                    </text>
                  </g>
                );
              })}

              {/* Center Hub */}
              <circle cx="175" cy="175" r="32" fill="#141026" stroke="#fbbf24" strokeWidth="4" />
              <text
                x="175"
                y="175"
                fill="#fbbf24"
                fontSize="18"
                fontWeight="900"
                textAnchor="middle"
                dominantBaseline="central"
              >
                جلسة
              </text>
            </svg>
          </div>
        </div>

        {/* Spin / Outcome Controls */}
        <div className="space-y-4">
          {!wheelState.segment && !wheelState.isSpinning ? (
            <button
              onClick={spinWheel}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-slate-950 font-black text-xl shadow-xl shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>أدر عجلة الحظ الآن!</span>
              <span className="text-2xl animate-spin">🎡</span>
            </button>
          ) : wheelState.isSpinning ? (
            <div className="py-4 text-center">
              <span className="inline-block text-amber-400 font-black text-lg animate-pulse">
                جاري تحديد مصير السؤال... ⏳
              </span>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-5 rounded-2xl bg-white/10 border border-white/20 text-center"
            >
              <div className="text-3xl mb-1">{wheelState.segment.icon}</div>
              <h4 className="text-xl font-black text-white mb-1">
                {wheelState.segment.title}
              </h4>
              <p className="text-xs text-amber-200/90 font-medium mb-4">
                {wheelState.segment.description}
              </p>

              <button
                onClick={confirmWheelResult}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-base shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>الانتقال للسؤال</span>
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
