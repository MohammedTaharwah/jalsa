import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Users,
  Timer,
  Shield,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  Zap,
  Trophy,
  Globe,
  Utensils,
  Briefcase,
  Film,
  Laptop,
  Landmark
} from 'lucide-react';
import logo from '../../assets/logo.png';

// Fallback default categories if backend is loading or offline
const DEFAULT_FALLBACK_CATEGORIES = [
  {
    id: 1,
    name: 'أكلات ومشروبات',
    icon: 'Utensils',
    description: 'وجبات عربية وعالمية، حلويات ومشروبات مشهورة',
    words: [
      { id: 1, word: 'شاورما' },
      { id: 2, word: 'منسف' },
      { id: 3, word: 'بيتزا' },
      { id: 4, word: 'كبسة' },
      { id: 5, word: 'سوشي' },
      { id: 6, word: 'فلافل' },
      { id: 7, word: 'كنافة' },
      { id: 8, word: 'ورق عنب' }
    ]
  },
  {
    id: 2,
    name: 'دول ومدن وعواصم',
    icon: 'Globe',
    description: 'عواصم وبلدان سياحية ومعالم شهيرة حول العالم',
    words: [
      { id: 9, word: 'القدس' },
      { id: 10, word: 'عَمّان' },
      { id: 11, word: 'القاهرة' },
      { id: 12, word: 'الرياض' },
      { id: 13, word: 'دبي' },
      { id: 14, word: 'باريس' },
      { id: 15, word: 'لندن' },
      { id: 16, word: 'طوكيو' }
    ]
  },
  {
    id: 3,
    name: 'مهن ووظائف',
    icon: 'Briefcase',
    description: 'وظائف ومهن يومية وأدوار قيادية',
    words: [
      { id: 17, word: 'طبيب جراح' },
      { id: 18, word: 'طيار مدني' },
      { id: 19, word: 'مبرمج ومطور' },
      { id: 20, word: 'مهندس معماري' },
      { id: 21, word: 'شيف مطعم' },
      { id: 22, word: 'شرطي مرور' },
      { id: 23, word: 'رائد فضاء' }
    ]
  },
  {
    id: 4,
    name: 'رياضة ولاعبون',
    icon: 'Trophy',
    description: 'رياضات مشهورة، أندية ونجوم عالميون',
    words: [
      { id: 24, word: 'كرة القدم' },
      { id: 25, word: 'ريال مدريد' },
      { id: 26, word: 'برشلونة' },
      { id: 27, word: 'ميسي' },
      { id: 28, word: 'كريستيانو رونالدو' },
      { id: 29, word: 'السباحة' }
    ]
  },
  {
    id: 5,
    name: 'أجهزة وتكنولوجيا',
    icon: 'Laptop',
    description: 'ابتكارات إلكترونية، تطبيقات ومصطلحات ذكية',
    words: [
      { id: 30, word: 'آيفون' },
      { id: 31, word: 'بلايستيشن 5' },
      { id: 32, word: 'ذكاء اصطناعي' },
      { id: 33, word: 'سماعات لاسلكية' },
      { id: 34, word: 'تيك توك' }
    ]
  },
  {
    id: 6,
    name: 'شخصيات كرتون وسينما',
    icon: 'Film',
    description: 'أبطال خارقون، رسوم متحركة وأفلام أسطورية',
    words: [
      { id: 35, word: 'توم وجيري' },
      { id: 36, word: 'المحقق كونان' },
      { id: 37, word: 'سبايدرمان' },
      { id: 38, word: 'باتمان' },
      { id: 39, word: 'هاري بوتر' }
    ]
  }
];

const DEFAULT_PLAYER_NAMES = [
  'محمد',
  'أحمد',
  'عمر',
  'خالد',
  'سارة',
  'فاطمة',
  'يوسف',
  'علي',
  'نور',
  'حمزة'
];

export const SpyGame = ({ onExit }) => {
  // Phases: 'setup' -> 'categories' -> 'reveal' -> 'discussion' -> 'vote' -> 'result'
  const [phase, setPhase] = useState('setup');

  // Players config
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState(DEFAULT_PLAYER_NAMES.slice(0, 4));
  const [spyCount, setSpyCount] = useState(1);
  const [discussionDuration, setDiscussionDuration] = useState(120); // 2 minutes in seconds (0 = unlimited)

  // Categories
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Active round runtime state
  const [activeCategory, setActiveCategory] = useState(null);
  const [secretWord, setSecretWord] = useState('');
  const [assignedRoles, setAssignedRoles] = useState([]); // [{ name, isSpy, hasRevealed }]
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);
  const [isHoldingToReveal, setIsHoldingToReveal] = useState(false);

  // Discussion & Timer
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerRunning, setTimerRunning] = useState(false);

  // Vote
  const [suspectedSpy, setSuspectedSpy] = useState(null);

  // Fetch full categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await fetch('/api/spy/full-categories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setAllCategories(data);
            setSelectedCategoryIds(data.map((c) => c.id));
            return;
          }
        }
      } catch (e) {
        console.error('Using fallback categories for spy game:', e);
      } finally {
        setLoadingCategories(false);
      }
      setAllCategories(DEFAULT_FALLBACK_CATEGORIES);
      setSelectedCategoryIds(DEFAULT_FALLBACK_CATEGORIES.map((c) => c.id));
    };
    loadCategories();
  }, []);

  // Update players list when count changes
  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    const updated = [...playerNames];
    while (updated.length < count) {
      updated.push(DEFAULT_PLAYER_NAMES[updated.length] || `لاعب ${updated.length + 1}`);
    }
    setPlayerNames(updated.slice(0, count));
    if (count < 7 && spyCount > 1) {
      setSpyCount(1);
    }
  };

  const handleNameChange = (index, value) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  const toggleCategorySelection = (catId) => {
    if (selectedCategoryIds.includes(catId)) {
      if (selectedCategoryIds.length <= 1) return; // Keep at least 1
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  // Start the secret round
  const startSecretRound = () => {
    // 1. Pick a random category from selected
    const activeCats = allCategories.filter((c) => selectedCategoryIds.includes(c.id));
    const randomCat = activeCats[Math.floor(Math.random() * activeCats.length)] || allCategories[0];

    // 2. Pick a random word from this category
    const wordsList = randomCat.words || [];
    const randomWordObj = wordsList[Math.floor(Math.random() * wordsList.length)] || { word: 'شاورما' };
    const chosenWord = typeof randomWordObj === 'string' ? randomWordObj : randomWordObj.word;

    // 3. Assign spy index/indices randomly
    const total = playerNames.length;
    const spyIndices = new Set();
    while (spyIndices.size < Math.min(spyCount, total - 1)) {
      spyIndices.add(Math.floor(Math.random() * total));
    }

    const roles = playerNames.map((name, idx) => ({
      name,
      isSpy: spyIndices.has(idx),
      hasRevealed: false
    }));

    setActiveCategory(randomCat);
    setSecretWord(chosenWord);
    setAssignedRoles(roles);
    setCurrentRevealIndex(0);
    setIsHoldingToReveal(false);
    setTimeLeft(discussionDuration);
    setTimerRunning(false);
    setSuspectedSpy(null);
    setPhase('reveal');
  };

  // Discussion Timer Effect
  useEffect(() => {
    let interval = null;
    if (phase === 'discussion' && timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'discussion' && timerRunning && timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [phase, timerRunning, timeLeft]);

  const currentPlayer = assignedRoles[currentRevealIndex] || { name: 'اللاعب' };

  return (
    <div
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none dir-rtl"
      dir="rtl"
    >
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة للمسابقات 🏆</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xl">🕵️‍♂️</span>
            <span className="text-sm sm:text-base font-black text-amber-400 tracking-wide">
              مين الدسوس؟
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {phase !== 'setup' && (
            <button
              onClick={() => setPhase('setup')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-800/60 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إنهاء الجولة</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {/* ======================================================== */}
        {/* PHASE 1: PLAYERS SETUP                                   */}
        {/* ======================================================== */}
        {phase === 'setup' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-6"
          >
            <div className="text-center space-y-1.5">
              <span className="px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-black">
                الخطوة 1: تحديد اللاعبين والقواعد
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                تجهيز جلسة مين الدسوس
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                الجميع سيعرفون نفس الكلمة السرية، ما عدا "الدسوس"... ومهمتكم كشفه من طريقة كلامه!
              </p>
            </div>

            {/* Player Count Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-300">
                عدد اللاعبين: <span className="text-amber-400 font-black text-sm">{playerCount} لاعبين</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => handlePlayerCountChange(num)}
                    className={`flex-1 min-w-[50px] py-2.5 rounded-xl font-black text-xs transition cursor-pointer border ${
                      playerCount === num
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Player Names Inputs Grid */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-300">
                أسماء اللاعبين (مرتبة حسب التمرير):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                {playerNames.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80">
                    <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-black text-amber-400">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(idx, e.target.value)}
                      className="bg-transparent border-none text-xs text-white font-bold w-full focus:outline-none"
                      placeholder={`لاعب ${idx + 1}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Spy Count & Discussion Timer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Number of Spies */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-300">
                  عدد الجواسيس (الدسوس):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSpyCount(1)}
                    className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                      spyCount === 1
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    🕵️‍♂️ دسوس واحد
                  </button>
                  <button
                    onClick={() => setSpyCount(2)}
                    disabled={playerCount < 6}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      playerCount < 6
                        ? 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-500 border-slate-800'
                        : spyCount === 2
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm cursor-pointer'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 cursor-pointer'
                    }`}
                  >
                    🕵️‍♂️🕵️‍♂️ اثنان (6+ لاعبين)
                  </button>
                </div>
              </div>

              {/* Discussion Timer */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-slate-300">
                  وقت النقاش:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'دقيقة', val: 60 },
                    { label: 'دقيقتين', val: 120 },
                    { label: 'مفتوح', val: 0 }
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => setDiscussionDuration(item.val)}
                      className={`py-2 rounded-xl text-xs font-black border transition cursor-pointer ${
                        discussionDuration === item.val
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Next Step Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setPhase('categories')}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>متابعة لاختيار الفئات </span>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* PHASE 2: CATEGORIES SELECTION                           */}
        {/* ======================================================== */}
        {phase === 'categories' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-slate-900/90 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-3.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-black">
                  الخطوة 2: اختيار فئات الجولة
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  اختر الفئات المرغوبة لهذه الجولة
                </h2>
                <p className="text-xs text-slate-400 font-medium">
                  سيتم اختيار فئة وكلمة سرية عشوائياً من بين الفئات المحددة باللون الأخضر.
                </p>
              </div>

              <button
                onClick={() => {
                  if (selectedCategoryIds.length === allCategories.length) {
                    setSelectedCategoryIds([allCategories[0].id]);
                  } else {
                    setSelectedCategoryIds(allCategories.map((c) => c.id));
                  }
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-xl border border-slate-700 cursor-pointer"
              >
                {selectedCategoryIds.length === allCategories.length ? 'إلغاء التحديد' : 'تحديد الكل'}
              </button>
            </div>

            {/* Categories Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto p-1">
              {allCategories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                return (
                  <div
                    key={cat.id}
                    onClick={() => toggleCategorySelection(cat.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/60 ring-2 ring-amber-500/20 shadow-md'
                        : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700/80 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                        🏷️
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white">{cat.name}</h4>
                        <span className="text-[10px] text-slate-400">
                          {cat.words?.length || cat.words_count || 10} كلمة سرية
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition ${
                        isSelected ? 'bg-amber-500 text-slate-950 font-black' : 'border border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Launch Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setPhase('setup')}
                className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm rounded-2xl transition cursor-pointer"
              >
                تعديل اللاعبين
              </button>

              <button
                onClick={startSecretRound}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>بدء الجولة وتوزيع البطاقات 🎭</span>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* PHASE 3: PASS & REVEAL (كشف الهوية بالتمرير)              */}
        {/* ======================================================== */}
        {phase === 'reveal' && (
          <motion.div
            key={currentRevealIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl text-center space-y-6"
          >
            {/* Progress indicator */}
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 border-b border-slate-800 pb-3">
              <span>كشف بطاقة الهوية</span>
              <span className="text-amber-400 font-black">
                اللاعب {currentRevealIndex + 1} من {assignedRoles.length}
              </span>
            </div>

            {/* Hand-over Screen Prompt */}
            <div className="space-y-2">
              <span className="text-4xl">📱</span>
              <h3 className="text-xl sm:text-2xl font-black text-white">
                سلّم الجهاز إلى: <span className="text-amber-400">[{currentPlayer.name}]</span>
              </h3>
              <p className="text-xs text-slate-400">
                تأكد أن لا أحد ينظر إلى الشاشة سواك، ثم اضغط باستمرار أو انقر لكشف هويتك!
              </p>
            </div>

            {/* Secret Identity Card */}
            <div
              className={`p-6 sm:p-8 rounded-3xl border-2 transition-all min-h-[180px] flex flex-col items-center justify-center text-center ${
                isHoldingToReveal
                  ? currentPlayer.isSpy
                    ? 'bg-rose-950/70 border-rose-500 shadow-xl shadow-rose-900/30'
                    : 'bg-emerald-950/70 border-emerald-500 shadow-xl shadow-emerald-900/30'
                  : 'bg-slate-800/80 border-slate-700'
              }`}
            >
              {isHoldingToReveal ? (
                currentPlayer.isSpy ? (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-2">
                    <span className="text-4xl animate-bounce">🕵️‍♂️</span>
                    <h4 className="text-2xl font-black text-rose-400 tracking-wider">
                      أنت الدسوس (الجاسوس)!
                    </h4>
                    <div className="inline-block px-3 py-1 rounded-full bg-rose-900/60 border border-rose-700/80 text-xs text-rose-200 font-bold">
                      فئة الكلمة هي: <span className="text-white font-black">{activeCategory?.name}</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-2 font-medium">
                      الجميع يعرفون الكلمة السرية ما عداك! استمع لنقاشهم جيداً وتظاهر بأنك تعرفها دون أن يكتشفوك!
                    </p>
                  </motion.div>
                ) : (
                  <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="space-y-2">
                    <span className="text-4xl">🔑</span>
                    <span className="text-xs font-bold text-emerald-400 block">
                      فئة: {activeCategory?.name}
                    </span>
                    <div className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                      الكلمة السرية:{' '}
                      <span className="text-amber-400 underline decoration-amber-400 underline-offset-4">
                        {secretWord}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-2 font-medium">
                      أنت مواطن شريف! حاول طرح أسئلة ذكية حول الكلمة لكشف الدسوس دون أن تصرح بها صراحة!
                    </p>
                  </motion.div>
                )
              ) : (
                <div className="space-y-3">
                  <EyeOff className="w-10 h-10 text-slate-500 mx-auto" />
                  <span className="text-xs font-bold text-slate-400 block">
                    البطاقة محجوبة لحماية السرية
                  </span>
                </div>
              )}
            </div>

            {/* Toggle / Hold Button */}
            <div className="space-y-3">
              <button
                onMouseDown={() => setIsHoldingToReveal(true)}
                onMouseUp={() => setIsHoldingToReveal(false)}
                onTouchStart={() => setIsHoldingToReveal(true)}
                onTouchEnd={() => setIsHoldingToReveal(false)}
                onClick={() => setIsHoldingToReveal(!isHoldingToReveal)}
                className={`w-full py-4 rounded-2xl font-black text-sm sm:text-base border shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  isHoldingToReveal
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-amber-500/20'
                }`}
              >
                {isHoldingToReveal ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                <span>
                  {isHoldingToReveal ? 'أفلت لإخفاء البطاقة 🙈' : 'اضغط مع الاستمرار لكشف بطاقتك 👁️'}
                </span>
              </button>

              {/* Next Player Button */}
              <button
                onClick={() => {
                  setIsHoldingToReveal(false);
                  if (currentRevealIndex + 1 < assignedRoles.length) {
                    setCurrentRevealIndex(currentRevealIndex + 1);
                  } else {
                    // Everyone revealed! Go to discussion!
                    setPhase('discussion');
                    setTimerRunning(true);
                  }
                }}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>
                  {currentRevealIndex + 1 < assignedRoles.length
                    ? 'تم الاطلاع! الانتقال للاعب التالي ⬅️'
                    : 'الجميع اطلعوا! بدء جولة النقاش والتحدي 🗣️'}
                </span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* PHASE 4: DISCUSSION & TIME COUNTDOWN                    */}
        {/* ======================================================== */}
        {phase === 'discussion' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl text-center space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-black">
              <span>🗣️ جولة النقاش والتحقيق</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ابدأوا بطرح الأسئلة!
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              كل لاعب يوجه سؤالاً ذكياً للاعب آخر عن الكلمة. انتبهوا لأي إجابة مترددة أو عامة جداً... فصاحبها هو الدسوس!
            </p>

            {/* Timer Display */}
            {discussionDuration > 0 && (
              <div className="py-4">
                <div
                  className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border text-xl font-black ${
                    timeLeft <= 20
                      ? 'bg-rose-950/60 border-rose-500/60 text-rose-400 animate-pulse'
                      : 'bg-slate-800/80 border-slate-700 text-amber-400'
                  }`}
                >
                  <Timer className="w-6 h-6" />
                  <span>
                    {Math.floor(timeLeft / 60)}:
                    {(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            )}

            {/* Active Players Chips */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">
                اللاعبون في الجلسة:
              </span>
              <div className="flex flex-wrap justify-center gap-2">
                {playerNames.map((name, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
                  >
                    👤 {name}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setPhase('vote')}
                className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-rose-600/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>حان وقت التصويت! كشف الدسوس 🗳️</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* PHASE 5: VOTING                                         */}
        {/* ======================================================== */}
        {phase === 'vote' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl text-center space-y-6"
          >
            <div className="space-y-1">
              <span className="px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-black">
                مرحلة الحسم والتصويت
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                من هو الشخص المشتبه به؟
              </h2>
              <p className="text-xs text-slate-400">
                تشاوروا وصوتوا على الشخص الذي تشكون بأنه الدسوس!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto p-1">
              {playerNames.map((name, i) => {
                const isSelected = suspectedSpy === name;
                return (
                  <button
                    key={i}
                    onClick={() => setSuspectedSpy(name)}
                    className={`p-3 rounded-2xl border text-xs sm:text-sm font-black transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/30 shadow-lg'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <span>👤</span>
                    <span>{name}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                disabled={!suspectedSpy}
                onClick={() => setPhase('result')}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>كشف الحقيقة والنتيجة 🎭</span>
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* PHASE 6: FINAL RESULT & PODIUM                           */}
        {/* ======================================================== */}
        {phase === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl text-center space-y-6"
          >
            {/* Outcome Icon & Header */}
            {(() => {
              const actualSpies = assignedRoles.filter((r) => r.isSpy).map((r) => r.name);
              const caught = actualSpies.includes(suspectedSpy);

              return (
                <>
                  <div className="space-y-2">
                    <span className="text-5xl">{caught ? '🎉' : '🕵️‍♂️'}</span>
                    <h2
                      className={`text-2xl sm:text-3xl font-black ${
                        caught ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {caught ? 'كشفتم الدسوس بنجاح!' : 'فاز الدسوس وخداع الجميع!'}
                    </h2>
                    <p className="text-xs text-slate-400">
                      {caught
                        ? `أحسنتم! تم كشف الدسوس [${suspectedSpy}] واقتناص الفوز للمواطنين الشرفاء!`
                        : `الدسوس نجح في تمويه نفسه وخداعكم!`}
                    </p>
                  </div>

                  {/* Secret Information Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                      <span className="text-[11px] text-slate-400 font-bold block mb-1">
                        الدسوس الحقيقي:
                      </span>
                      <div className="text-base font-black text-rose-400">
                        {actualSpies.join(' ، ')}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700">
                      <span className="text-[11px] text-slate-400 font-bold block mb-1">
                        الكلمة السرية ({activeCategory?.name}):
                      </span>
                      <div className="text-base font-black text-amber-400">
                        {secretWord}
                      </div>
                    </div>
                  </div>

                  {/* Replay Buttons */}
                  <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={startSecretRound}
                      className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>جولة جديدة بنفس الفئات</span>
                    </button>

                    <button
                      onClick={() => setPhase('setup')}
                      className="px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-2xl transition border border-slate-700 cursor-pointer"
                    >
                      تغيير الإعدادات
                    </button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </main>
    </div>
  );
};
