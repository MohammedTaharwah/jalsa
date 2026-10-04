import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Trophy,
  ArrowRight,
  Flame,
  Users,
  Sparkles,
  HelpCircle,
  Volume2,
  VolumeX,
  ChevronRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FIVE_SECONDS_QUESTIONS } from '../../data/fiveSecondsQuestions';

export const FiveSecondsGame = ({ onExit }) => {
  // Game setup states
  const [gameState, setGameState] = useState('setup'); // 'setup' | 'playing' | 'round_ready' | 'round_running' | 'round_result' | 'game_over'
  const [teams, setTeams] = useState([
    { id: 1, name: 'فريق الصقور', score: 0, color: 'purple' },
    { id: 2, name: 'فريق الأسود', score: 0, color: 'orange' }
  ]);
  const [targetScore, setTargetScore] = useState(7); // first to 7 points
  const [currentTurn, setCurrentTurn] = useState(0); // 0 or 1
  const [questionPool, setQuestionPool] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [roundNumber, setRoundNumber] = useState(1);

  // 5-second countdown timer state
  const [timeLeft, setTimeLeft] = useState(5);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Sound synthesis / beep effect
  const playBeep = (freq = 440, duration = 0.1) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {}
  };

  // Start new game session
  const startGame = () => {
    const shuffled = [...FIVE_SECONDS_QUESTIONS].sort(() => Math.random() - 0.5);
    setQuestionPool(shuffled);
    setCurrentQuestion(shuffled[0]);
    setRoundNumber(1);
    setCurrentTurn(0);
    setTeams(prev => prev.map(t => ({ ...t, score: 0 })));
    setGameState('round_ready');
  };

  // Prepare next question
  const prepareNextQuestion = (nextTurnIndex, currentPool) => {
    const nextPool = currentPool.slice(1);
    const nextQ = nextPool.length > 0 ? nextPool[0] : FIVE_SECONDS_QUESTIONS[Math.floor(Math.random() * FIVE_SECONDS_QUESTIONS.length)];
    setQuestionPool(nextPool);
    setCurrentQuestion(nextQ);
    setCurrentTurn(nextTurnIndex);
    setTimeLeft(5);
    setIsTimerRunning(false);
    setGameState('round_ready');
  };

  // Start the 5-second countdown for current question
  const startFiveSeconds = () => {
    setTimeLeft(5);
    setIsTimerRunning(true);
    setGameState('round_running');
    playBeep(520, 0.15);
  };

  // Timer loop
  useEffect(() => {
    if (isTimerRunning && gameState === 'round_running') {
      if (timeLeft > 0) {
        timerRef.current = setTimeout(() => {
          setTimeLeft(prev => {
            const next = prev - 1;
            if (next > 0) {
              playBeep(440 + (5 - next) * 80, 0.08);
            } else {
              // Time's up buzzer sound
              playBeep(220, 0.35);
            }
            return next;
          });
        }, 1000);
      } else {
        // Time expired! Stop running and wait for judge verdict
        setIsTimerRunning(false);
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [isTimerRunning, timeLeft, gameState]);

  // Handle verdict (Did player name 3 things in 5 seconds?)
  const handleVerdict = (success) => {
    clearTimeout(timerRef.current);
    setIsTimerRunning(false);

    let updatedTeams = [...teams];
    if (success) {
      updatedTeams = teams.map((t, idx) => idx === currentTurn ? { ...t, score: t.score + 1 } : t);
      setTeams(updatedTeams);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
    }

    // Check win condition
    const winningTeam = updatedTeams.find(t => t.score >= targetScore);
    if (winningTeam) {
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.5 } });
      setGameState('game_over');
      return;
    }

    // Advance to rival team
    const nextTurn = (currentTurn + 1) % teams.length;
    setRoundNumber(prev => prev + 1);
    prepareNextQuestion(nextTurn, questionPool);
  };

  const activeTeam = teams[currentTurn];
  const sortedWinners = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-4 sm:p-6 font-sans select-none" dir="rtl">
      {/* Top Bar */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between border-b border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onExit}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowRight className="w-4 h-4" />
            <span>خروج للقائمة</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black shadow-md shadow-orange-500/20">
              ⚡
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white leading-tight">تحدي الـ 5 ثواني</h2>
              <span className="text-[10px] text-amber-400 font-bold">Mini-Game • سرعة البديهة والضغط</span>
            </div>
          </div>
        </div>

        {/* Live Score Pills */}
        {gameState !== 'setup' && (
          <div className="flex items-center gap-2">
            {teams.map((t, idx) => (
              <div
                key={t.id}
                className={`px-3 py-1 rounded-xl border text-xs font-black transition-all flex items-center gap-1.5 ${
                  idx === currentTurn
                    ? idx === 0
                      ? 'bg-purple-600/30 border-purple-500 text-purple-200 ring-2 ring-purple-500/40'
                      : 'bg-orange-600/30 border-orange-500 text-orange-200 ring-2 ring-orange-500/40'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <span>{t.name}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-white text-[11px]">
                  {t.score} / {targetScore}
                </span>
              </div>
            ))}
          </div>
        )}
      </header>

      {/* Main Game Screen */}
      <main className="w-full max-w-3xl mx-auto flex-1 flex flex-col items-center justify-center py-6 text-center">
        {/* ================= STATE 1: SETUP SCREEN ================= */}
        {gameState === 'setup' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-slate-800/80 rounded-3xl p-6 sm:p-10 border border-slate-700/80 shadow-2xl space-y-6"
          >
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-orange-600 mx-auto flex items-center justify-center text-3xl shadow-lg shadow-orange-500/30 animate-pulse">
              ⏱️
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">قوانين تحدي الـ 5 ثواني</h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-2 leading-relaxed font-medium">
                يظهر سؤال يتطلب ذكر <strong>3 أشياء محددة</strong>، وعند انطلاق المؤقت لديك <strong>5 ثوانٍ فقط</strong> للنطق بالإجابات الثلاثة قبل انتهاء الوقت!
              </p>
            </div>

            {/* Team Names Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-right">
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-2">
                <label className="text-xs font-black text-purple-300 block">اسم الفريق الأول:</label>
                <input
                  type="text"
                  value={teams[0].name}
                  onChange={(e) => setTeams(prev => [ { ...prev[0], name: e.target.value }, prev[1] ])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-purple-500/50 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-orange-950/40 border border-orange-500/40 space-y-2">
                <label className="text-xs font-black text-orange-300 block">اسم الفريق الثاني:</label>
                <input
                  type="text"
                  value={teams[1].name}
                  onChange={(e) => setTeams(prev => [ prev[0], { ...prev[1], name: e.target.value } ])}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-orange-500/50 text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Target Score Selector */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <span className="text-xs text-slate-400 font-bold">نقاط الفوز بالجولة:</span>
              {[5, 7, 10].map((pts) => (
                <button
                  key={pts}
                  type="button"
                  onClick={() => setTargetScore(pts)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    targetScore === pts
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {pts} نقاط
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={startGame}
              className="w-full max-w-sm mx-auto py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm shadow-xl shadow-orange-500/25 transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>ابدأ التحدي الآن</span>
            </button>
          </motion.div>
        )}

        {/* ================= STATE 2 & 3: QUESTION & COUNTDOWN ================= */}
        {(gameState === 'round_ready' || gameState === 'round_running') && currentQuestion && (
          <div className="w-full space-y-6">
            {/* Active Turn Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-2xl border text-xs sm:text-sm font-black shadow-lg ${
                currentTurn === 0
                  ? 'bg-purple-600/30 border-purple-500 text-purple-200'
                  : 'bg-orange-600/30 border-orange-500 text-orange-200'
              }`}
            >
              <span>دور:</span>
              <span className="text-white text-base">[{activeTeam.name}]</span>
              <span className="text-slate-400 font-medium">| الجولة {roundNumber}</span>
            </motion.div>

            {/* Challenge Card */}
            <div className="p-8 sm:p-12 rounded-3xl bg-slate-800/90 border-2 border-slate-700 shadow-2xl relative overflow-hidden">
              <span className="text-xs font-black text-amber-400 uppercase tracking-widest block mb-3">
                تحدي في 5 ثوانٍ فقط ⚡
              </span>
              <h3 className="text-2xl sm:text-4xl font-black text-white leading-relaxed">
                {currentQuestion.prompt}
              </h3>
            </div>

            {/* Giant Circular 5-Second Timer */}
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-slate-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className={`transition-all duration-1000 ${
                    timeLeft <= 2 ? 'stroke-rose-500' : 'stroke-amber-400'
                  }`}
                  strokeWidth="8"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (timeLeft / 5) * 264}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center text-center">
                <span
                  className={`text-5xl sm:text-6xl font-black transition-all ${
                    timeLeft === 0
                      ? 'text-rose-500 animate-bounce'
                      : timeLeft <= 2
                      ? 'text-rose-400 scale-110'
                      : 'text-amber-400'
                  }`}
                >
                  {timeLeft}
                </span>
                <span className="text-[11px] font-bold text-slate-400 mt-1">
                  {timeLeft === 0 ? 'انتهى الوقت!' : 'ثوانٍ'}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {gameState === 'round_ready' ? (
              <button
                type="button"
                onClick={startFiveSeconds}
                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/25 transition active:scale-95 cursor-pointer flex items-center gap-2 mx-auto"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>جاهز؟ ابدأ العد التنازلي! (5ث)</span>
              </button>
            ) : (
              /* Verdict Buttons during/after 5 seconds */
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-400 font-bold">
                  {timeLeft === 0 ? 'انتهت الـ 5 ثواني! هل استطاع ذكر 3 أشياء بنجاح؟' : 'استمع للإجابات واحكم فور انتهاء العد:'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleVerdict(true)}
                    className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>أجاب بنجاح (+1 نقطة)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerdict(false)}
                    className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition active:scale-95 cursor-pointer flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4 text-rose-200" />
                    <span>ما لحق / خطأ (0 نقطة)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STATE 4: GAME OVER / PODIUM ================= */}
        {gameState === 'game_over' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-slate-800 rounded-3xl p-8 sm:p-12 border border-slate-700 shadow-2xl text-center space-y-6"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 mx-auto flex items-center justify-center text-4xl shadow-xl shadow-amber-500/30 animate-bounce">
              🏆
            </div>
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black">
                بطل سرعة البديهة
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
                مبروك لفريق [{sortedWinners[0].name}] الفوز!
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                حسم التحدي بنتيجة {sortedWinners[0].score} مقابل {sortedWinners[1].score} نقطة
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <button
                type="button"
                onClick={startGame}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 transition active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>لعب جولة جديدة</span>
              </button>

              <button
                type="button"
                onClick={onExit}
                className="px-6 py-3.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-black text-xs sm:text-sm transition cursor-pointer"
              >
                العودة إلى القائمة الرئيسية
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer Info */}
      <footer className="w-full max-w-4xl mx-auto text-center border-t border-slate-800 pt-3 text-[11px] text-slate-500 font-medium shrink-0">
        جلسة • طور الألعاب السريعة • تحدي الـ 5 ثواني
      </footer>
    </div>
  );
};
