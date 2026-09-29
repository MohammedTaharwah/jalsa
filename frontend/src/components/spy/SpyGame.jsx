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
  CreditCard,
  Lock,
  Unlock,
  Award,
  Vote,
  Target,
  ChevronDown,
  ChevronUp
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
const SPY_PLAYER_SCORES_KEY = 'jalsah_spy_player_scores';

const loadSavedSpySession = () => {
  try {
    const raw = localStorage.getItem(SPY_GAME_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

const loadSavedPlayerScores = () => {
  try {
    const raw = localStorage.getItem(SPY_PLAYER_SCORES_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
};

const SUGGESTED_NAMES = [
  'محمد', 'أحمد', 'عمر', 'خالد', 'سارة', 'فاطمة', 'يوسف', 'علي', 'نور', 'حمزة', 'مريم', 'زين', 'ليان', 'كريم'
];

/**
 * دالة احتساب نقاط الجولة وفق منطق دقيق وممتع:
 * للمواطنين:
 * - صوت صحيح على الدسوس: +100
 * - كشف الدسوس بالأغلبية (مكافأة الفريق): +50
 * للدسوس:
 * - النجاة وخداع الأغلبية: +150
 * - تضليل الأصوات: +25 عن كل صوت مواطن ذهب لمواطن بريء
 * - تخمين الكلمة السرية: +100
 * - هروب ذكي (إذا كُشف بالتصويت لكنه عرف الكلمة): +50
 */
const calculateScores = ({ assignedRoles, votes, secretWord, spyGuess, spyGuessedCorrectly }) => {
  const actualSpies = (assignedRoles || []).filter((r) => r.isSpy).map((r) => r.name);
  const citizens = (assignedRoles || []).filter((r) => !r.isSpy).map((r) => r.name);

  // 1. فرز الأصوات
  const voteTally = {};
  (assignedRoles || []).forEach((r) => {
    voteTally[r.name] = 0;
  });

  Object.values(votes || {}).forEach((candidate) => {
    if (candidate && voteTally[candidate] !== undefined) {
      voteTally[candidate] += 1;
    }
  });

  // 2. تحديد المشتبه به الحائز على أعلى أصوات
  let maxVotes = 0;
  Object.values(voteTally).forEach((cnt) => {
    if (cnt > maxVotes) maxVotes = cnt;
  });

  const mostVotedPlayers = Object.keys(voteTally).filter(
    (name) => voteTally[name] === maxVotes && maxVotes > 0
  );

  // هل كُشف الدسوس؟ (أي أن أحد الجواسيس حصل على أعلى الأصوات)
  const spyCaught = actualSpies.some((spy) => mostVotedPlayers.includes(spy));

  const roundPoints = {};
  const pointBreakdowns = {};

  (assignedRoles || []).forEach((r) => {
    roundPoints[r.name] = 0;
    pointBreakdowns[r.name] = [];
  });

  // 3. نقاط المواطنين
  citizens.forEach((cit) => {
    const theirVote = votes?.[cit];
    // صوت صحيح على الدسوس
    if (actualSpies.includes(theirVote)) {
      roundPoints[cit] += 100;
      pointBreakdowns[cit].push({ label: 'صوت صحيح لكشف الدسوس 🎯', points: 100 });
    }
    // مكافأة فوز الفريق الجماعي
    if (spyCaught) {
      roundPoints[cit] += 50;
      pointBreakdowns[cit].push({ label: 'مكافأة انتصار المواطنين 🛡️', points: 50 });
    }
  });

  // 4. نقاط الدسوس (الجاسوس)
  actualSpies.forEach((spy) => {
    // نجاة الدسوس وعدم كشفه بالأغلبية
    if (!spyCaught) {
      roundPoints[spy] += 150;
      pointBreakdowns[spy].push({ label: 'النجاة وخداع الأغلبية 🕵️‍♂️', points: 150 });
    }

    // نقاط التمويه والتضليل: كل صوت من مواطن ذهب لمواطن بريء يعطي الدسوس 25 نقطة
    let misdirectedVotes = 0;
    citizens.forEach((cit) => {
      const v = votes?.[cit];
      if (v && citizens.includes(v)) {
        misdirectedVotes += 1;
      }
    });

    if (misdirectedVotes > 0) {
      const misleadPts = misdirectedVotes * 25;
      roundPoints[spy] += misleadPts;
      pointBreakdowns[spy].push({
        label: `تضليل أصوات المواطنين (${misdirectedVotes} أصوات بريئة) 🌀`,
        points: misleadPts
      });
    }

    // نقاط تخمين الكلمة السرية
    if (spyGuessedCorrectly) {
      roundPoints[spy] += 100;
      pointBreakdowns[spy].push({ label: 'تخمين الكلمة السرية بنجاح 🧠', points: 100 });

      // مكافأة الهروب الذكي إذا كان قد كشف بالتصويت لكنه عرف الكلمة
      if (spyCaught) {
        roundPoints[spy] += 50;
        pointBreakdowns[spy].push({ label: 'مكافأة الهروب الذكي بالكلمة 🚀', points: 50 });
      }
    }
  });

  return {
    voteTally,
    mostVotedPlayers,
    spyCaught,
    roundPoints,
    pointBreakdowns
  };
};

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

  // Phases: 'setup' -> 'categories' -> 'reveal' -> 'discussion' -> 'voting' -> 'spy_guess' -> 'result'
  // Auto-normalize legacy 'vote' phase into 'voting'
  const [phase, setPhase] = useState(() => {
    const p = savedSession?.phase;
    return (p === 'vote' ? 'voting' : p) || 'setup';
  });

  // Players config
  const [playerCount, setPlayerCount] = useState(() => savedSession?.playerCount || 4);
  const [playerNames, setPlayerNames] = useState(() => {
    if (savedSession?.playerNames && Array.isArray(savedSession.playerNames)) {
      return savedSession.playerNames;
    }
    return ['لاعب 1', 'لاعب 2', 'لاعب 3', 'لاعب 4'];
  });
  const [spyCount, setSpyCount] = useState(() => savedSession?.spyCount || 1);
  const [discussionDuration, setDiscussionDuration] = useState(() => savedSession?.discussionDuration ?? 120);

  // Cumulative player scores across rounds
  const [playerScores, setPlayerScores] = useState(() => {
    if (savedSession?.playerScores && typeof savedSession.playerScores === 'object') {
      return savedSession.playerScores;
    }
    return loadSavedPlayerScores();
  });

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

  // Voting State: Supports both Unified Screen and Pass-the-Device
  const [votingMode, setVotingMode] = useState('unified'); // 'unified' | 'pass'
  const [currentVoterIndex, setCurrentVoterIndex] = useState(() => savedSession?.currentVoterIndex || 0);
  const [isVoterReady, setIsVoterReady] = useState(() => savedSession?.isVoterReady || false);
  const [votes, setVotes] = useState(() => savedSession?.votes || {});
  const [selectedSuspectInTurn, setSelectedSuspectInTurn] = useState(null);

  // Spy Guessing Phase State
  const [spyWordGuessOptions, setSpyWordGuessOptions] = useState(() => savedSession?.spyWordGuessOptions || []);
  const [spySelectedWord, setSpySelectedWord] = useState(() => savedSession?.spySelectedWord || null);
  const [spyGuessedCorrectly, setSpyGuessedCorrectly] = useState(() => savedSession?.spyGuessedCorrectly ?? null);
  const [roundResultData, setRoundResultData] = useState(() => savedSession?.roundResultData || null);

  // Helper to ensure clean player names
  const getCleanPlayerNames = () => {
    return playerNames.map((n, i) => (n && n.trim()) ? n.trim() : `لاعب ${i + 1}`);
  };

  // Persist Player Scores separately
  useEffect(() => {
    try {
      localStorage.setItem(SPY_PLAYER_SCORES_KEY, JSON.stringify(playerScores));
    } catch (e) {}
  }, [playerScores]);

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
        currentVoterIndex,
        isVoterReady,
        votes,
        spyWordGuessOptions,
        spySelectedWord,
        spyGuessedCorrectly,
        roundResultData,
        playerScores
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
    currentVoterIndex,
    isVoterReady,
    votes,
    spyWordGuessOptions,
    spySelectedWord,
    spyGuessedCorrectly,
    roundResultData,
    playerScores
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

  // Update players list when count changes
  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
    const updated = [...playerNames];
    while (updated.length < count) {
      updated.push(`لاعب ${updated.length + 1}`);
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
    const emptyIdx = updated.findIndex((n) => !n || !n.trim() || n.startsWith('لاعب '));
    if (emptyIdx !== -1) {
      updated[emptyIdx] = sugName;
    } else {
      updated[updated.length - 1] = sugName;
    }
    setPlayerNames(updated);
  };

  // Auto-fill all slots with suggestions
  const fillAllWithSuggestions = () => {
    const updated = playerNames.map((n, i) => (n && n.trim() && !n.startsWith('لاعب ')) ? n : SUGGESTED_NAMES[i % SUGGESTED_NAMES.length]);
    setPlayerNames(updated);
  };

  // Clear all names to defaults
  const clearAllNames = () => {
    setPlayerNames(new Array(playerCount).fill('').map((_, i) => `لاعب ${i + 1}`));
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
    setVotes({});
    setCurrentVoterIndex(0);
    setIsVoterReady(false);
    setSelectedSuspectInTurn(null);
    setSpySelectedWord(null);
    setSpyGuessedCorrectly(null);
    setRoundResultData(null);
    try {
      localStorage.removeItem(SPY_GAME_SESSION_KEY);
    } catch (e) {}
  };

  const handleResetScores = () => {
    const resetObj = {};
    getCleanPlayerNames().forEach((validName) => {
      resetObj[validName] = 0;
    });
    setPlayerScores(resetObj);
    try {
      localStorage.setItem(SPY_PLAYER_SCORES_KEY, JSON.stringify(resetObj));
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

    // 3. Clean player names
    const cleanNames = getCleanPlayerNames();
    setPlayerNames(cleanNames);

    // 4. Pick a random category from selected
    const activeCats = allCategories.filter((c) => selectedCategoryIds.includes(c.id));
    const randomCat = activeCats[Math.floor(Math.random() * activeCats.length)] || allCategories[0];

    // 5. Pick a random word from this category
    const wordsList = randomCat.words || [];
    const randomWordObj = wordsList[Math.floor(Math.random() * wordsList.length)] || { word: 'شاورما' };
    const chosenWord = typeof randomWordObj === 'string' ? randomWordObj : randomWordObj.word;

    // 6. Generate 4 options for the Spy Word Guessing stage (chosen word + 3 distractors)
    const categoryWords = (randomCat.words || []).map((w) => (typeof w === 'string' ? w : w.word));
    const poolDistractors = categoryWords.filter((w) => w && w !== chosenWord);
    if (poolDistractors.length < 3) {
      DEFAULT_FALLBACK_CATEGORIES.forEach((c) => {
        (c.words || []).forEach((w) => {
          const wStr = typeof w === 'string' ? w : w.word;
          if (wStr && wStr !== chosenWord && !poolDistractors.includes(wStr)) {
            poolDistractors.push(wStr);
          }
        });
      });
    }
    const shuffledDistractors = [...poolDistractors].sort(() => Math.random() - 0.5).slice(0, 3);
    const guessOptions = [chosenWord, ...shuffledDistractors].sort(() => Math.random() - 0.5);

    // 7. Assign spy index/indices randomly
    const total = cleanNames.length;
    const spyIndices = new Set();
    while (spyIndices.size < Math.min(spyCount, total - 1)) {
      spyIndices.add(Math.floor(Math.random() * total));
    }

    const roles = cleanNames.map((name, idx) => ({
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

    // Reset round states
    setVotes({});
    setCurrentVoterIndex(0);
    setIsVoterReady(false);
    setSelectedSuspectInTurn(null);
    setSpyWordGuessOptions(guessOptions);
    setSpySelectedWord(null);
    setSpyGuessedCorrectly(null);
    setRoundResultData(null);

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

  // Set individual vote in unified voting mode
  const handleSetUnifiedVote = (voterName, targetName) => {
    setVotes((prev) => ({
      ...prev,
      [voterName]: targetName
    }));
  };

  // Move from voting to spy guess
  const handleProceedToSpyGuess = () => {
    // Fill any missing votes with random innocent choice to avoid ever getting stuck
    const updatedVotes = { ...votes };
    assignedRoles.forEach((r) => {
      if (!updatedVotes[r.name]) {
        const otherPlayers = assignedRoles.filter((o) => o.name !== r.name);
        const randomTarget = otherPlayers[Math.floor(Math.random() * otherPlayers.length)]?.name || r.name;
        updatedVotes[r.name] = randomTarget;
      }
    });
    setVotes(updatedVotes);
    setPhase('spy_guess');
  };

  // Pass-the-device confirm vote
  const handleConfirmPassVote = () => {
    if (!selectedSuspectInTurn) return;
    const currentVoter = assignedRoles[currentVoterIndex];
    if (!currentVoter) return;

    const updatedVotes = {
      ...votes,
      [currentVoter.name]: selectedSuspectInTurn
    };
    setVotes(updatedVotes);
    setSelectedSuspectInTurn(null);

    if (currentVoterIndex + 1 < assignedRoles.length) {
      setCurrentVoterIndex((prev) => prev + 1);
      setIsVoterReady(false);
    } else {
      setPhase('spy_guess');
    }
  };

  // Handle Spy Word Guess Submission & calculate round points
  const handleSpyGuessSubmit = (chosenOptionOrNull) => {
    const isCorrect = chosenOptionOrNull === secretWord;
    setSpySelectedWord(chosenOptionOrNull);
    setSpyGuessedCorrectly(isCorrect);

    // Calculate complete scores
    const results = calculateScores({
      assignedRoles,
      votes,
      secretWord,
      spyGuess: chosenOptionOrNull,
      spyGuessedCorrectly: isCorrect
    });
    setRoundResultData(results);

    // Accumulate into cumulative player scores
    setPlayerScores((prev) => {
      const nextScores = { ...prev };
      assignedRoles.forEach((r) => {
        const earned = results.roundPoints[r.name] || 0;
        nextScores[r.name] = (nextScores[r.name] || 0) + earned;
      });
      try {
        localStorage.setItem(SPY_PLAYER_SCORES_KEY, JSON.stringify(nextScores));
      } catch (e) {}
      return nextScores;
    });

    setPhase('result');
  };

  const currentPlayer = assignedRoles[currentRevealIndex] || { name: 'اللاعب' };
  const currentVoter = assignedRoles[currentVoterIndex] || { name: 'اللاعب' };
  const spyPlayers = assignedRoles.filter((r) => r.isSpy);

  // Total votes cast so far
  const totalVotesCast = Object.keys(votes).filter((v) => votes[v]).length;
  const isVotingComplete = assignedRoles.length > 0 && totalVotesCast >= assignedRoles.length;

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
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-5xl mx-auto w-full">
        {/* ======================================================== */}
        {/* PHASE 1: PLAYERS SETUP + REQUESTED RULES SIDEBOX         */}
        {/* ======================================================== */}
        {phase === 'setup' && (
          <div className="w-full flex flex-col lg:grid lg:grid-cols-3 gap-6 items-start">
            {/* Main Setup Card (2 Columns) */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full lg:col-span-2 bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-5"
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

              {/* Cumulative Leaderboard Banner if active */}
              {Object.keys(playerScores).length > 0 && Object.values(playerScores).some((s) => s > 0) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="text-xs font-black text-amber-300">
                        النقاط محفوظة في لوحة الصدارة
                      </h4>
                      <span className="text-[11px] text-slate-300">
                        ستستمر النقاط بالتراكم لتحديد بطل الجلسة!
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetScores}
                    className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 text-xs font-bold border border-rose-800/60 transition cursor-pointer"
                  >
                    تصفير النقاط
                  </button>
                </div>
              )}

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
                      className={`flex-1 min-w-[45px] py-2 rounded-xl font-black text-xs transition cursor-pointer border ${
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
                      title="تعبئة الخانات بأسماء مقترحة"
                    >
                      💡 تعبئة مقترحة
                    </button>
                    <span className="text-slate-700">|</span>
                    <button
                      type="button"
                      onClick={clearAllNames}
                      className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition cursor-pointer"
                      title="استعادة الأسماء الافتراضية"
                    >
                      إعادة تعيين
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1">
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
                          onClick={() => handleNameChange(idx, `لاعب ${idx + 1}`)}
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
                    اضغط على أي اسم لاختياره مباشرة في الخانة التالية:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Number of Spies */}
                <div className="space-y-1.5">
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
                      🕵️‍♂️🕵️‍♂️ اثنان (6+)
                    </button>
                  </div>
                </div>

                {/* Discussion Timer */}
                <div className="space-y-1.5">
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
              <div className="pt-3 border-t border-slate-800">
                <button
                  onClick={() => {
                    setPlayerNames(getCleanPlayerNames());
                    setPhase('categories');
                  }}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-base rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>متابعة لاختيار الفئات </span>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </motion.div>

            {/* Requested Side Card: Points Rules Guide (شريحة شرح النقاط على جنب) */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              className="w-full lg:col-span-1 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-5 border border-amber-500/30 shadow-xl space-y-4"
            >
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
                  🏆
                </div>
                <div>
                  <h3 className="text-sm font-black text-amber-300">
                    دليل احتساب النقاط
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    نظام النقاط الرسمي في مين الدسوس
                  </span>
                </div>
              </div>

              {/* Citizens Rules */}
              <div className="space-y-2">
                <span className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>المواطنون الشرفاء:</span>
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">🎯 صوت صحيح لكشف الدسوس</span>
                    <span className="font-black text-emerald-400">+100 ن</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">👥 فوز الفريق بالأغلبية</span>
                    <span className="font-black text-emerald-400">+50 ن</span>
                  </div>
                </div>
              </div>

              {/* Spy Rules */}
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <span className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                  <span>🕵️‍♂️</span>
                  <span>الـ Spy Master (الدسوس):</span>
                </span>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">🎭 النجاة وخداع الأغلبية</span>
                    <span className="font-black text-rose-400">+150 ن</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">🌀 تضليل صوت مواطن لبريء</span>
                    <span className="font-black text-rose-400">+25 ن</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">🧠 تخمين الكلمة السرية</span>
                    <span className="font-black text-amber-400">+100 ن</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">🚀 مكافأة الهروب الذكي</span>
                    <span className="font-black text-amber-400">+50 ن</span>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed font-medium">
                ⚡ يحسب السيستم جميع النقاط تلقائياً بناءً على أصواتكم وتخمين الدسوس، وتضاف مباشرة للوحة الصدارة!
              </div>
            </motion.div>
          </div>
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
                      الجميع يعرفون الكلمة السرية ما عداك! استمع لنقاشهم جيداً وتظاهر بأنك تعرفها لتكتشف الكلمة دون أن يكتشفوك!
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
                {assignedRoles.map((r, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200"
                  >
                    👤 {r.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setPhase('voting');
                  setCurrentVoterIndex(0);
                  setIsVoterReady(false);
                  setSelectedSuspectInTurn(null);
                  setVotes({});
                }}
                className="flex-1 py-4 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-rose-600/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Vote className="w-5 h-5" />
                <span>بدء التصويت وتحديد الدسوس 🗳️</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* PHASE 5: VOTING (تصويت شامل ومضمون لا يعلّق أبداً)       */}
        {/* ======================================================== */}
        {phase === 'voting' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-black">
                  مرحلة الحسم والتصويت 🗳️
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                  من هو الشخص المشتبه به؟
                </h2>
                <p className="text-xs text-slate-400">
                  صوتوا لاختيار من تشكون بأنه الدسوس!
                </p>
              </div>

              {/* Mode switch (Unified vs Pass-the-phone) */}
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setVotingMode('unified')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    votingMode === 'unified'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  تصويت مباشر 👥
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVotingMode('pass');
                    setIsVoterReady(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    votingMode === 'pass'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  تمرير سري 📱
                </button>
              </div>
            </div>

            {/* MODE A: UNIFIED DIRECT VOTING (الجميع على شاشة واحدة) */}
            {votingMode === 'unified' ? (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/80 text-xs text-slate-300 flex items-center justify-between">
                  <span>
                    تم تصويت: <strong className="text-amber-400 font-black text-sm">{totalVotesCast}</strong> من{' '}
                    <strong className="text-white font-black">{assignedRoles.length}</strong> لاعبين
                  </span>
                  <span className="text-[11px] text-slate-400">
                    اضغط على المشتبه به أمام كل لاعب:
                  </span>
                </div>

                <div className="space-y-3 max-h-[380px] overflow-y-auto p-1">
                  {assignedRoles.map((voter) => {
                    const voterChoice = votes[voter.name];

                    return (
                      <div
                        key={voter.name}
                        className="p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs font-black">
                            👤
                          </span>
                          <span className="text-sm font-black text-white">{voter.name}</span>
                          <span className="text-[10px] text-slate-400">يصوت لـ:</span>
                        </div>

                        {/* Candidates to vote for (exclude the voter themselves) */}
                        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                          {assignedRoles
                            .filter((cand) => cand.name !== voter.name)
                            .map((cand) => {
                              const isSelected = voterChoice === cand.name;
                              return (
                                <button
                                  key={cand.name}
                                  type="button"
                                  onClick={() => handleSetUnifiedVote(voter.name, cand.name)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer border ${
                                    isSelected
                                      ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400/40 scale-102'
                                      : 'bg-slate-900/80 hover:bg-slate-700 text-slate-300 border-slate-700/80'
                                  }`}
                                >
                                  {cand.name}
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Big Proceed Button */}
                <div className="pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={handleProceedToSpyGuess}
                    className={`w-full py-4 text-slate-950 font-black text-base rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isVotingComplete
                        ? 'bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:to-orange-600 shadow-amber-500/20 active:scale-98'
                        : 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>
                      {isVotingComplete
                        ? 'اكتمل التصويت! كشف الحقيقة وتخمين الدسوس 🎭 ⬅️'
                        : `المتابعة وتأكيد النتائج (${totalVotesCast}/${assignedRoles.length}) ⬅️`}
                    </span>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              /* MODE B: PASS-THE-DEVICE SECRET VOTING */
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span className="text-purple-400 font-black">
                    المصوّت: [{currentVoter.name}] ({currentVoterIndex + 1} من {assignedRoles.length})
                  </span>
                </div>

                {!isVoterReady ? (
                  <div className="py-6 space-y-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-800/80 text-purple-400 flex items-center justify-center mx-auto shadow-lg">
                      <Lock className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-white">
                        مرر الجهاز إلى: <span className="text-amber-400">[{currentVoter.name}]</span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        تأكد ألا أحد ينظر إلى الشاشة سواك، ثم اضغط لفتح خياراتك سراً.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsVoterReady(true)}
                      className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-black text-sm rounded-2xl shadow-md transition cursor-pointer"
                    >
                      أنا [{currentVoter.name}]، افتح شاشة التصويت 🔒
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center space-y-1">
                      <h4 className="text-base font-black text-white">
                        [{currentVoter.name}]، من تعتقد أنه الدسوس؟
                      </h4>
                      <p className="text-xs text-slate-400">اختر لاعباً واحداً تشتبه به سراً:</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {assignedRoles
                        .filter((r) => r.name !== currentVoter.name)
                        .map((r) => {
                          const isSelected = selectedSuspectInTurn === r.name;
                          return (
                            <button
                              key={r.name}
                              type="button"
                              onClick={() => setSelectedSuspectInTurn(r.name)}
                              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-black transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                                isSelected
                                  ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/40 shadow-lg scale-102'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                              }`}
                            >
                              <span className="text-lg">👤</span>
                              <span>{r.name}</span>
                            </button>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      disabled={!selectedSuspectInTurn}
                      onClick={handleConfirmPassVote}
                      className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-md transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      تأكيد صوتي وتمرير الجهاز ➡️
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* PHASE 5.5: SPY SECRET WORD GUESSING (تخمين الدسوس للكلمة)   */}
        {/* ======================================================== */}
        {phase === 'spy_guess' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl text-center space-y-6"
          >
            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-black">
                مرحلة الدسوس الذهبية 🧠
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                تخمين الدسوس (Spy Master) للكلمة السرية
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                سلّموا الجهاز إلى <span className="text-rose-400 font-bold">الدسوس</span>! فئة الكلمة كانت:{' '}
                <span className="text-amber-400 font-black">[{activeCategory?.name}]</span>. إذا استطاع الدسوس تخمين الكلمة بنجاح، يحصل على{' '}
                <span className="text-emerald-400 font-black">+100 نقطة إضافية ومكافأة هروب</span>!
              </p>
            </div>

            {/* Word Options Grid for the Spy */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 block text-right pr-1">
                اختر الكلمة السرية التي تعتقد أن المواطنين كانوا يتحدثون عنها:
              </span>
              <div className="grid grid-cols-2 gap-2.5">
                {spyWordGuessOptions.map((optWord) => (
                  <button
                    key={optWord}
                    type="button"
                    onClick={() => handleSpyGuessSubmit(optWord)}
                    className="p-4 rounded-2xl bg-slate-800/90 hover:bg-amber-500/20 hover:border-amber-400/60 border border-slate-700 text-slate-100 hover:text-amber-300 font-black text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    🏷️ {optWord}
                  </button>
                ))}
              </div>
            </div>

            {/* Concede / Don't Know Option */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSpyGuessSubmit(null)}
                className="w-full py-3 bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-bold text-xs rounded-xl border border-slate-700/80 transition cursor-pointer"
              >
                🤷‍♂️ الدسوس لم يعرف الكلمة (تخطي واحتساب النقاط)
              </button>
            </div>
          </motion.div>
        )}

        {/* ======================================================== */}
        {/* PHASE 6: FINAL RESULT, VOTES BREAKDOWN & LEADERBOARD      */}
        {/* ======================================================== */}
        {phase === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-6"
          >
            {/* Outcome Icon & Header */}
            {(() => {
              const resData = roundResultData || calculateScores({
                assignedRoles,
                votes,
                secretWord,
                spyGuess: spySelectedWord,
                spyGuessedCorrectly
              });

              const actualSpies = (assignedRoles || []).filter((r) => r.isSpy).map((r) => r.name);
              const caught = resData.spyCaught;

              return (
                <>
                  <div className="text-center space-y-2">
                    <span className="text-5xl">{caught ? '🎉' : '🕵️‍♂️'}</span>
                    <h2
                      className={`text-2xl sm:text-3xl font-black ${
                        caught ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {caught ? 'كشفتم الدسوس بنجاح!' : 'فاز الدسوس وخداع الجميع!'}
                    </h2>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      {caught
                        ? `أحسنتم! حاز الدسوس الحقيقي على أعلى نسبة تصويت واقتنص المواطنون الشرفاء الفوز!`
                        : `نجح الدسوس في تمويه نفسه وتشتيت أصوات المواطنين الشرفاء!`}
                    </p>
                  </div>

                  {/* Secret Information Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    {/* Actual Spy */}
                    <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                      <span className="text-[11px] text-slate-400 font-bold block mb-1">
                        🕵️‍♂️ الدسوس الحقيقي:
                      </span>
                      <div className="text-sm font-black text-rose-400 truncate">
                        {actualSpies.join(' ، ')}
                      </div>
                    </div>

                    {/* Secret Word */}
                    <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                      <span className="text-[11px] text-slate-400 font-bold block mb-1">
                        🔑 الكلمة ({activeCategory?.name}):
                      </span>
                      <div className="text-sm font-black text-amber-400 truncate">
                        {secretWord}
                      </div>
                    </div>

                    {/* Spy Word Guess Result */}
                    <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-center">
                      <span className="text-[11px] text-slate-400 font-bold block mb-1">
                        🧠 تخمين الدسوس للكلمة:
                      </span>
                      <div
                        className={`text-xs font-black truncate ${
                          spyGuessedCorrectly ? 'text-emerald-400' : 'text-slate-400'
                        }`}
                      >
                        {spyGuessedCorrectly
                          ? `عرفها بنجاح (+100) 🎯`
                          : spySelectedWord
                          ? `خاطئ (${spySelectedWord}) ❌`
                          : 'لم يخمن (تخطي) 🤷‍♂️'}
                      </div>
                    </div>
                  </div>

                  {/* Voting Record (Who Voted for Whom) */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-black text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Vote className="w-4 h-4 text-purple-400" />
                        <span>سجل أصوات هذه الجولة:</span>
                      </span>
                      <span className="text-[10px] text-slate-500">
                        الأعلى تصويتاً: {resData.mostVotedPlayers.join(' ، ')} ({resData.voteTally[resData.mostVotedPlayers[0]] || 0} أصوات)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {assignedRoles.map((voter) => {
                        const target = votes[voter.name];
                        const isCorrectOnSpy = actualSpies.includes(target);
                        const isVoterSpy = voter.isSpy;

                        return (
                          <div
                            key={voter.name}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/80"
                          >
                            <span className="font-bold text-slate-200">
                              {isVoterSpy ? '🕵️‍♂️' : '👤'} {voter.name}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-slate-400">صوّت لـ</span>
                              <span
                                className={`px-2 py-0.5 rounded-lg text-[11px] font-black border ${
                                  isCorrectOnSpy
                                    ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300'
                                    : 'bg-slate-800 border-slate-700 text-slate-300'
                                }`}
                              >
                                {target || 'لم يصوّت'} {isCorrectOnSpy ? '🎯' : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Round Points Earned */}
                  <div className="space-y-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between text-xs font-black text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>نقاط هذه الجولة (احتساب السيستم التلقائي):</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {assignedRoles.map((r) => {
                        const earned = resData.roundPoints[r.name] || 0;
                        const reasons = resData.pointBreakdowns[r.name] || [];

                        return (
                          <div
                            key={r.name}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/80 flex flex-col justify-between gap-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-200">
                                {r.isSpy ? '🕵️‍♂️' : '👤'} {r.name}
                              </span>
                              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-black text-xs">
                                +{earned} نقطة
                              </span>
                            </div>

                            {/* Reasons Badges */}
                            <div className="flex flex-wrap gap-1">
                              {reasons.length > 0 ? (
                                reasons.map((b, idx) => (
                                  <span
                                    key={idx}
                                    className="px-1.5 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 border border-slate-700/60"
                                  >
                                    {b.label} (+{b.points})
                                  </span>
                                ))
                              ) : (
                                <span className="text-[10px] text-slate-500">لم يحرز نقاطاً في هذه الجولة</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Cumulative Leaderboard (لوحة الصدارة الإجمالية - محسوبة تلقائياً وبدون أزرار زائد وناقص) */}
                  <div className="space-y-2 bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-950 p-4 rounded-2xl border border-amber-500/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm font-black text-amber-300">
                          لوحة الصدارة الإجمالية (مجموع كل الجولات)
                        </h4>
                      </div>
                      <button
                        type="button"
                        onClick={handleResetScores}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold transition cursor-pointer"
                      >
                        تصفير النقاط 🔁
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {assignedRoles
                        .map((r) => ({
                          name: r.name,
                          score: playerScores[r.name] || 0
                        }))
                        .sort((a, b) => b.score - a.score)
                        .map((playerItem, rank) => {
                          const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `#${rank + 1}`;
                          return (
                            <div
                              key={playerItem.name}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                                rank === 0
                                  ? 'bg-amber-500/15 border-amber-500/50 text-white font-black'
                                  : 'bg-slate-900/90 border-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <span className="text-base font-black w-6 text-center">{medal}</span>
                                <span className="text-xs font-bold">{playerItem.name}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-amber-400">
                                  {playerItem.score} نقطة
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Replay & Action Buttons */}
                  <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={startSecretRound}
                      className="flex-1 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-lg shadow-amber-500/20 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw className="w-5 h-5" />
                      <span>جولة جديدة (مع الاحتفاظ بالنقاط) 🔄</span>
                    </button>

                    <button
                      onClick={handleEndRound}
                      className="px-5 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-2xl transition border border-slate-700 cursor-pointer"
                    >
                      تغيير الإعدادات ⚙️
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
