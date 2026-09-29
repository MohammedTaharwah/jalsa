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
  Landmark,
  Gift,
  CreditCard
} from 'lucide-react';
import logo from '../../assets/logo.png';
import { SocialFooter } from '../SocialFooter';
import { useGameStore } from '../../store/useGameStore';
import { CheckoutModal } from '../CheckoutModal';
import { API_BASE } from '../../utils/api';

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

const SPY_GAME_SESSION_KEY = 'jalsah_spy_game_session';

const loadSavedSpySession = () => {
  try {
    const raw = localStorage.getItem(SPY_GAME_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const SUGGESTED_NAMES = [
  'محمد', 'أحمد', 'عمر', 'خالد', 'سارة', 'فاطمة', 'يوسف', 'علي', 'نور', 'حمزة', 'مريم', 'زين', 'ليان', 'كريم'
];

export const SpyGame = ({ onExit }) => {
  const savedSession = loadSavedSpySession();

  const {
    availableGames,
    setAvailableGames,
    currentUser,
    getAuthToken
  } = useGameStore();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [balanceAlert, setBalanceAlert] = useState(null);
  const [isConsuming, setIsConsuming] = useState(false);

  // Phases: 'setup' -> 'categories' -> 'reveal' -> 'discussion' -> 'vote' -> 'result'
  const [phase, setPhase] = useState(() => savedSession?.phase || 'setup');

  // Players config
  const [playerCount, setPlayerCount] = useState(() => savedSession?.playerCount || 4);
  const [playerNames, setPlayerNames] = useState(() => {
    if (savedSession?.playerNames && Array.isArray(savedSession.playerNames)) {
      return savedSession.playerNames;
    }
    return ['', '', '', ''];
  });
  const [spyCount, setSpyCount] = useState(() => savedSession?.spyCount || 1);
  const [discussionDuration, setDiscussionDuration] = useState(() => savedSession?.discussionDuration ?? 120);

  // Categories
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(() => savedSession?.selectedCategoryIds || []);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Active round runtime state
  const [activeCategory, setActiveCategory] = useState(() => savedSession?.activeCategory || null);
  const [secretWord, setSecretWord] = useState(() => savedSession?.secretWord || '');
  const [assignedRoles, setAssignedRoles] = useState(() => savedSession?.assignedRoles || []);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(() => savedSession?.currentRevealIndex || 0);
  const [isHoldingToReveal, setIsHoldingToReveal] = useState(false);

  // Discussion & Timer
  const [timeLeft, setTimeLeft] = useState(() => savedSession?.timeLeft ?? 120);
  const [timerRunning, setTimerRunning] = useState(() => savedSession?.timerRunning || false);

  // Vote
  const [suspectedSpy, setSuspectedSpy] = useState(() => savedSession?.suspectedSpy || null);

  // Persist Spy session across page refresh
  useEffect(() => {
    try {
      const dataToSave = {
        phase,
        playerCount,
        playerNames,
        spyCount,
        discussionDuration,
        selectedCategoryIds,
        activeCategory,
        secretWord,
        assignedRoles,
        currentRevealIndex,
        timeLeft,
        timerRunning,
        suspectedSpy
      };
      localStorage.setItem(SPY_GAME_SESSION_KEY, JSON.stringify(dataToSave));
    } catch (e) {}
  }, [
    phase,
    playerCount,
    playerNames,
    spyCount,
    discussionDuration,
    selectedCategoryIds,
    activeCategory,
    secretWord,
    assignedRoles,
    currentRevealIndex,
    timeLeft,
    timerRunning,
    suspectedSpy
  ]);

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
            if (!savedSession?.selectedCategoryIds || savedSession.selectedCategoryIds.length === 0) {
              setSelectedCategoryIds(data.map((c) => c.id));
            }
            return;
          }
        }
      } catch (e) {
        console.error('Using fallback categories for spy game:', e);
      } finally {
        setLoadingCategories(false);
      }
      setAllCategories(DEFAULT_FALLBACK_CATEGORIES);
      if (!savedSession?.selectedCategoryIds || savedSession.selectedCategoryIds.length === 0) {
        setSelectedCategoryIds(DEFAULT_FALLBACK_CATEGORIES.map((c) => c.id));
      }
    };
    loadCategories();
  }, []);

  // Update players list when count changes (keep user typed names, leave new slots blank)
  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    const updated = [...playerNames];
    while (updated.length < count) {
      updated.push('');
    }
    setPlayerNames(updated.slice(0, count));
    if (count < 6 && spyCount > 1) {
      setSpyCount(1);
    }
  };

  const handleNameChange = (index, value) => {
    const updated = [...playerNames];
    updated[index] = value;
    setPlayerNames(updated);
  };

  // Pick a suggestion chip into the next empty player slot
  const handlePickSuggestion = (sugName) => {
    const updated = [...playerNames];
    const emptyIdx = updated.findIndex((n) => !n || !n.trim());
    if (emptyIdx !== -1) {
      updated[emptyIdx] = sugName;
    } else {
      updated[updated.length - 1] = sugName;
    }
    setPlayerNames(updated);
  };

  // Auto-fill all slots with suggestions
  const fillAllWithSuggestions = () => {
    const updated = playerNames.map((n, i) => (n && n.trim()) ? n : SUGGESTED_NAMES[i % SUGGESTED_NAMES.length]);
    setPlayerNames(updated);
  };

  // Clear all names
  const clearAllNames = () => {
    setPlayerNames(new Array(playerCount).fill(''));
  };

  const toggleCategorySelection = (catId) => {
    if (selectedCategoryIds.includes(catId)) {
      if (selectedCategoryIds.length <= 1) return; // Keep at least 1
      setSelectedCategoryIds(selectedCategoryIds.filter((id) => id !== catId));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, catId]);
    }
  };

  const handleEndRound = () => {
    setPhase('setup');
    setActiveCategory(null);
    setSecretWord('');
    setAssignedRoles([]);
    setCurrentRevealIndex(0);
    setIsHoldingToReveal(false);
    setTimeLeft(discussionDuration);
    setTimerRunning(false);
    setSuspectedSpy(null);
    try {
      localStorage.removeItem(SPY_GAME_SESSION_KEY);
    } catch (e) {}
  };

  const handleExitGame = () => {
    try {
      localStorage.removeItem(SPY_GAME_SESSION_KEY);
    } catch (e) {}
    onExit?.();
  };

  // Start the secret round (deducts 1 game session)
  const startSecretRound = async () => {
    if (isConsuming) return;

    // 1. Strictly verify games balance
    if (availableGames <= 0) {
      setBalanceAlert('نفد رصيدك من الألعاب! يرجى شحن رصيدك عبر باقات الألعاب لتتمكن من بدء جولة جديدة في لعبة مين الدسوس.');
      return;
    }

    setIsConsuming(true);
    setBalanceAlert(null);

    try {
      // 2. Atomically consume 1 game on backend
      const token = getAuthToken();
      const consumeRes = await fetch(`${API_BASE}/promo/consume-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ user_id: currentUser?.id })
      });

      if (!consumeRes.ok) {
        const errorData = await consumeRes.json().catch(() => ({}));
        setBalanceAlert(errorData.detail || 'نفد رصيدك من الألعاب! يرجى شحن رصيدك لتتمكن من خوض جولة جديدة.');
        setAvailableGames(0);
        setIsConsuming(false);
        return;
      }

      const consumeData = await consumeRes.json();
      const updatedBalance = typeof consumeData.remaining_games === 'number'
        ? consumeData.remaining_games
        : Math.max(0, availableGames - 1);
      setAvailableGames(updatedBalance);
    } catch (err) {
      console.error('Failed to consume game session:', err);
    } finally {
      setIsConsuming(false);
    }

    // 3. Pick a random category from selected
    const activeCats = allCategories.filter((c) => selectedCategoryIds.includes(c.id));
    const randomCat = activeCats[Math.floor(Math.random() * activeCats.length)] || allCategories[0];

    // 4. Pick a random word from this category
    const wordsList = randomCat.words || [];
    const randomWordObj = wordsList[Math.floor(Math.random() * wordsList.length)] || { word: 'شاورما' };
    const chosenWord = typeof randomWordObj === 'string' ? randomWordObj : randomWordObj.word;

    // 5. Assign spy index/indices randomly
    const total = playerNames.length;
    const spyIndices = new Set();
    while (spyIndices.size < Math.min(spyCount, total - 1)) {
      spyIndices.add(Math.floor(Math.random() * total));
    }

    const roles = playerNames.map((name, idx) => ({
      name: (name && name.trim()) ? name.trim() : `لاعب ${idx + 1}`,
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
            onClick={handleExitGame}
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
          {/* Games Balance Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Gift className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span className="hidden sm:inline">رصيد الجولات:</span>
            <span className="px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 font-black">
              {availableGames}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCheckoutOpen(true)}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs transition flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
            title="شراء باقات ألعاب عبر PayPal"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">شحن الرصيد</span>
          </button>

          {phase !== 'setup' && (
            <button
              onClick={handleEndRound}
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
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black text-slate-300">
                  أسماء اللاعبين (مرتبة حسب التمرير):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fillAllWithSuggestions}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
                    title="تعبئة الخانات الفارغة بأسماء مقترحة"
                  >
                    💡 تعبئة مقترحة
                  </button>
                  <span className="text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={clearAllNames}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition cursor-pointer"
                    title="تفريغ كافة الخانات"
                  >
                    مسح الأسماء
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                {playerNames.map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 focus-within:border-amber-400/80 transition-colors">
                    <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-black text-amber-400 shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => handleNameChange(idx, e.target.value)}
                      className="bg-transparent border-none text-xs text-white font-bold w-full focus:outline-none"
                      placeholder={`لاعب ${idx + 1}`}
                    />
                    {name && (
                      <button
                        type="button"
                        onClick={() => handleNameChange(idx, '')}
                        className="text-slate-500 hover:text-slate-300 text-xs px-1 cursor-pointer"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Interactive Suggested Names Bar */}
              <div className="mt-2 bg-slate-900/90 p-2.5 rounded-2xl border border-slate-800">
                <span className="block text-[11px] font-bold text-amber-400/90 mb-1.5">
                  اضغط على أي اسم لاختياره مباشرة في الخانة الفارغة:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {SUGGESTED_NAMES.map((sugName) => {
                    const isChosen = playerNames.includes(sugName);
                    return (
                      <button
                        key={sugName}
                        type="button"
                        disabled={isChosen}
                        onClick={() => handlePickSuggestion(sugName)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          isChosen
                            ? 'bg-slate-800 text-slate-500 border-slate-800 cursor-not-allowed opacity-50'
                            : 'bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border-slate-700 hover:border-amber-400/60 active:scale-95'
                        }`}
                      >
                        + {sugName}
                      </button>
                    );
                  })}
                </div>
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
                      onClick={handleEndRound}
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

      {/* Social Media Footer */}
      <SocialFooter isDark={true} />

      {/* Balance Exhaustion Alert Modal */}
      <AnimatePresence>
        {balanceAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm dir-rtl" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-500 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">
                نفد رصيدك من الألعاب!
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed mb-6">
                {balanceAlert}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setBalanceAlert(null);
                    setIsCheckoutOpen(true);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-orange-500/20 active:scale-95 transition cursor-pointer"
                >
                  شحن رصيد الجولات 💳
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAlert(null)}
                  className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PayPal Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onPaymentSuccess={(newBal) => {
          setAvailableGames(newBal);
        }}
      />
    </div>
  );
};
