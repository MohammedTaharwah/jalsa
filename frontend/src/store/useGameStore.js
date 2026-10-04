import { create } from 'zustand';
import confetti from 'canvas-confetti';
import { BATTLEGROUND_QUESTIONS } from '../data/triviaQuestions';
import { CATEGORIES_DATA, FORTUNE_WHEEL_OPTIONS, POWERUPS_CATALOG } from '../data/categoriesData';
import { API_BASE } from '../utils/api';

const shuffleArray = (items) => {
const shuffled = [...items];
for (let index = shuffled.length - 1; index > 0; index -= 1) {
const randomIndex = Math.floor(Math.random() * (index + 1));
[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
}
return shuffled;
};

const getSeenQuestionKey = (userId) => `jalsah_seen_questions_${userId}`;

const loadSeenQuestionIds = (userId) => {
try {
const saved = localStorage.getItem(getSeenQuestionKey(userId));
return new Set(saved ? JSON.parse(saved) : []);
} catch (error) {
return new Set();
}
};

const saveSeenQuestionId = (userId, questionId) => {
if (!userId || questionId === undefined || questionId === null) return;
const seenIds = loadSeenQuestionIds(userId);
seenIds.add(questionId);
try {
localStorage.setItem(getSeenQuestionKey(userId), JSON.stringify([...seenIds]));
} catch (error) {
// A failed local cache write must not interrupt the game.
}
};

const ACTIVE_GAME_KEY = 'jalsah_active_game';

const loadSavedActiveGame = () => {
  try {
    const saved = localStorage.getItem(ACTIVE_GAME_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    if (parsed && Array.isArray(parsed.board) && parsed.board.length > 0 && parsed.gameStage) {
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse active game from cache:', error);
  }
  return null;
};

export const persistActiveGame = (state) => {
  try {
    if (state && (state.gameStage === 'playing' || state.gameStage === 'game_over')) {
      const payload = {
        gameStage: state.gameStage,
        board: state.board,
        teams: state.teams,
        currentTurn: state.currentTurn,
        activeTeamIndex: state.activeTeamIndex,
        teamLevelPicks: state.teamLevelPicks || []
      };
      localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(payload));
    } else {
      localStorage.removeItem(ACTIVE_GAME_KEY);
    }
  } catch (error) {
    console.warn('Failed to persist active game state:', error);
  }
};

export const clearSavedActiveGame = () => {
  try {
    localStorage.removeItem(ACTIVE_GAME_KEY);
  } catch (e) {}
};

/**
 * useGameStore - مخزن الحالة المركزي للعبة "جلسة" باستخدام Zustand
 * يوفر إدارة كاملة لـ:
 * 1. قائمة الفرق ونقاطهم وتجهيز الأسلحة (Power-ups Loadout)
 * 2. مؤشر الفريق الحالي والتناوب التلقائي للأدوار (nextTurn)
 * 3. حالة مربعات الأسئلة (هل فتحت، والنقاط، والرابح)
 * 4. منطق احتساب النقاط (handleAnswer) مع مضاعفات x2 ونظام سرقة السؤال
 * 5. منطق عجلة الحظ مع 3 خيارات ديناميكية وتطبيق التأثير فوراً
 * 6. آلية سرقة السؤال (Steal Mechanic) من فئات الفريق الخصم
 */
export const useGameStore = create((set, get) => {
  const savedActiveGame = loadSavedActiveGame();

  return {
    // ================= STATE =================
    gameStage: savedActiveGame ? savedActiveGame.gameStage : 'setup', // 'setup' | 'playing' | 'game_over'
    gameMode: (() => {
      try {
        const saved = localStorage.getItem('jalsah_game_mode');
        if (saved === 'spy' || saved === 'trivia') return saved;
      } catch (e) {}
      return 'trivia';
    })(),
    teams: savedActiveGame ? savedActiveGame.teams : [
      {
        id: 1,
        name: 'فريق الصقور',
        score: 0,
        color: 'purple',
        iconName: 'Shield',
        isFrozen: false,
        isBombed: false,
        hasUsedSwap: false,
        hasUsedWheel: false,
        loadout: ['double', 'bomb'],
        powerups: { double: 1, bomb: 1 }
      },
      {
        id: 2,
        name: 'فريق الأسود',
        score: 0,
        color: 'orange',
        iconName: 'Flame',
        isFrozen: false,
        isBombed: false,
        hasUsedSwap: false,
        hasUsedWheel: false,
        loadout: ['freeze', 'fifty'],
        powerups: { freeze: 1, fifty: 1 }
      }
    ],
    currentTurn: savedActiveGame ? savedActiveGame.currentTurn : 0, // Index of active team
    activeTeamIndex: savedActiveGame ? savedActiveGame.activeTeamIndex : 0, // Alias for backward compatibility

    // Tactical Steal Mode
    isStealMode: false,
    stealDeductionType: null,
    stealCost: 150,

    // Wheel Challenge Mode
    isWheelChallengeActive: false,
    wheelChallengeBeneficiary: 'current', // 'current' | 'opponent'

    // Dynamic Level Tracking for Locking Rule: records of { teamId, categoryId, points }
    teamLevelPicks: savedActiveGame ? (savedActiveGame.teamLevelPicks || []) : [],

    // Jeopardy Grid Board: 6 columns x 3 tiles (200, 400, 600)
    board: savedActiveGame ? savedActiveGame.board : [],

    // Active Question Modal State
    activeTile: null,
    activeQuestion: null,
    questionModalOpen: false,
    selectedOption: null,
    isAnswerRevealed: false,
    isCorrect: null,
    eliminatedOptions: [],

    // Timer Setting (30s question timer & 10s rebound timer)
    isTimerEnabled: (() => {
      try {
        const saved = localStorage.getItem('jalsah_timer_enabled');
        if (saved !== null) return JSON.parse(saved);
      } catch (e) {}
      return true;
    })(),

    // Rebound Chance (Second Team Opportunity on Wrong Answer)
    reboundState: {
      isActive: false,
      teamIndex: null,
      wrongOptions: [],
      timeLeft: 10,
      basePoints: 0
    },

    // Mystery Tile Modifier ('shield' | null)
    mysteryModifier: null,

    // Fortune Wheel State
    wheelModalOpen: false,
    isWheelSpinning: false,
    selectedWheelOption: null,
    wheelRotation: 0,
    activeModifier: null, // null | 'double' | 'steal' | 'freeze' | 'fifty' | 'secret_bet'

    // Secret Bet (Daily Double) State
    secretBetModalOpen: false,
    activeSecretBetTile: null,

    // Final Round (Sudden Death on Tie) State
    finalRoundModalOpen: false,
    finalRoundQuestion: null,

    // Route & Navigation State
    currentRoute: (() => {
      try {
        const saved = localStorage.getItem('jalsah_user');
        if (saved) {
          const u = JSON.parse(saved);
          if (u.role === 'admin') return 'admin';
        }
        if (typeof window !== 'undefined' && window.location.pathname === '/admin') {
          return 'admin';
        }
        if (savedActiveGame && (savedActiveGame.gameStage === 'playing' || savedActiveGame.gameStage === 'game_over')) {
          return 'board';
        }
        if (typeof window !== 'undefined' && window.location.pathname === '/board') {
          return 'board';
        }
      } catch (e) {}
      return 'setup';
    })(),

    // Current User Session
    currentUser: (() => {
      try {
        const saved = localStorage.getItem('jalsah_user') || sessionStorage.getItem('jalsah_user');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
      return null;
    })(),

    // Available Games Balance in Global Store
    availableGames: (() => {
      try {
        const saved = localStorage.getItem('jalsah_user') || sessionStorage.getItem('jalsah_user');
        if (saved) {
          const u = JSON.parse(saved);
          if (typeof u.games_balance === 'number') return u.games_balance;
        }
      } catch (e) {}
      return 1;
    })(),

    // Alerts & Notifications
    gameBanner: null,

    // ================= ACTIONS =================

    setCurrentUser: (user) => {
      try {
        if (user) {
          const isSessionOnly = !!sessionStorage.getItem('jalsah_access_token');
          if (isSessionOnly) {
            sessionStorage.setItem('jalsah_user', JSON.stringify(user));
            localStorage.removeItem('jalsah_user');
          } else {
            localStorage.setItem('jalsah_user', JSON.stringify(user));
            sessionStorage.removeItem('jalsah_user');
          }
        } else {
          localStorage.removeItem('jalsah_user');
          sessionStorage.removeItem('jalsah_user');
        }
      } catch (e) {}

      const isAdmin = user?.role === 'admin';
      const newRoute = isAdmin ? 'admin' : (get().currentRoute === 'admin' ? 'setup' : get().currentRoute);
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', newRoute === 'admin' ? '/admin' : newRoute === 'board' ? '/board' : '/');
      }

      set({
        currentUser: user,
        currentRoute: newRoute,
        availableGames: user?.games_balance !== undefined ? user.games_balance : 1
      });
    },

setGameMode: (gameMode) => {
  try {
    localStorage.setItem('jalsah_game_mode', gameMode);
  } catch (e) {}
  set({ gameMode });
},

adjustTeamScore: (teamId, delta) => {
  set((state) => {
    const updatedTeams = state.teams.map((t) => {
      if (t.id === teamId) {
        const newScore = (t.score || 0) + delta;
        return { ...t, score: newScore };
      }
      return t;
    });
    return { teams: updatedTeams };
  });
  persistActiveGame(get());
},

setCurrentRoute: (route) => {
const user = get().currentUser;
// Strict RBAC: Admin is locked to admin route
if (user?.role === 'admin') {
if (typeof window !== 'undefined' && window.location.pathname !== '/admin') {
window.history.pushState(null, '', '/admin');
}
set({ currentRoute: 'admin' });
return;
}

// Normal player blocked from admin route
if (route === 'admin') {
if (typeof window !== 'undefined') {
window.history.pushState(null, '', '/');
}
set({ currentRoute: 'setup' });
return;
}

if (typeof window !== 'undefined') {
window.history.pushState(null, '', route === 'board' ? '/board' : '/');
}
set({ currentRoute: route });
},

    logout: () => {
      try {
        localStorage.removeItem('jalsah_access_token');
        localStorage.removeItem('jalsah_user');
        sessionStorage.removeItem('jalsah_access_token');
        sessionStorage.removeItem('jalsah_user');
        clearSavedActiveGame();
      } catch (e) {}
      if (typeof window !== 'undefined') {
        window.history.pushState(null, '', '/');
      }
      set({
        currentUser: null,
        currentRoute: 'setup',
        gameStage: 'setup',
        board: [],
        availableGames: 1
      });
    },

    rehydrateSession: async () => {
      const token = get().getAuthToken();
      if (!token) return;

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          get().logout();
          return;
        }

        const user = await response.json();
        get().setCurrentUser(user);
      } catch (error) {
        // Keep the cached session during a temporary network outage.
        console.error('Unable to restore the saved session:', error);
      }
    },

    getAuthToken: () => {
      try {
        return localStorage.getItem('jalsah_access_token') || sessionStorage.getItem('jalsah_access_token') || '';
      } catch (e) {
        return '';
      }
    },

    setAvailableGames: (count) => {
      const validCount = Math.max(0, count);
      set(state => {
        let updatedUser = state.currentUser;
        if (updatedUser) {
          updatedUser = { ...updatedUser, games_balance: validCount };
          try {
            if (sessionStorage.getItem('jalsah_user')) {
              sessionStorage.setItem('jalsah_user', JSON.stringify(updatedUser));
            } else {
              localStorage.setItem('jalsah_user', JSON.stringify(updatedUser));
            }
          } catch (e) {}
        }
        return {
          availableGames: validCount,
          currentUser: updatedUser
        };
      });
    },

addAvailableGames: (count) => {
const current = get().availableGames || 0;
get().setAvailableGames(current + count);
},

consumeGameSession: () => {
const current = get().availableGames || 0;
get().setAvailableGames(Math.max(0, current - 1));
},

/**
* تهيئة اللعبة وبناء اللوحة وشبكة الأسئلة مباشرة من قاعدة البيانات
*/
initGame: async (configuredTeams, selectedCategoryIds = ['sports', 'history', 'science', 'cinema', 'general', 'tech']) => {
const currentBalance = get().availableGames;
const currentStage = get().gameStage;
if (currentBalance <= 0 && currentStage !== 'playing') {
set({
gameBanner: {
type: 'warning',
title: 'نفد الرصيد!',
message: 'نفد رصيدك من الألعاب! يرجى شحن رصيدك لتتمكن من خوض جولة جديدة.'
},
gameStage: 'setup',
currentRoute: 'setup'
});
if (typeof window !== 'undefined' && window.location.pathname !== '/') {
window.history.pushState(null, '', '/');
}
return false;
}

const currentUserId = get().currentUser?.id;
const seenQuestionIds = loadSeenQuestionIds(currentUserId);
let catKeys = selectedCategoryIds && selectedCategoryIds.length >= 4
? selectedCategoryIds
: ['sports', 'history', 'science', 'cinema', 'general', 'tech'];

// Guarantee exactly 6 categories
if (catKeys.length < 6) {
const allKeys = CATEGORIES_DATA.map(c => c.id);
const needed = 6 - catKeys.length;
const extra = allKeys.filter(k => !catKeys.includes(k)).slice(0, needed);
catKeys = [...catKeys, ...extra];
} else if (catKeys.length > 6) {
catKeys = catKeys.slice(0, 6);
}

let newBoard = null;

// 1. Fetch questions directly from PostgreSQL Database via /game/board-fetch
try {
const res = await fetch(`${API_BASE}/game/board-fetch`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
category_ids: catKeys,
user_id: currentUserId || null
})
});

if (res.ok) {
const dbCategories = await res.json();
if (Array.isArray(dbCategories) && dbCategories.length >= 4) {
const selectedCols = dbCategories.slice(0, 6);
const midPoint = Math.ceil(selectedCols.length / 2);
newBoard = selectedCols.map((col, colIdx) => {
const catKey = catKeys[colIdx] || col.category_id;
const meta = {
id: catKey,
name: col.category_name,
color: [
'from-purple-600 to-indigo-600',
'from-orange-500 to-amber-500',
'from-blue-600 to-cyan-500',
'from-rose-500 to-pink-600',
'from-emerald-500 to-teal-600',
'from-amber-500 to-yellow-500'
][colIdx % 6]
};
const ownerTeam = colIdx < midPoint ? configuredTeams[0] : (configuredTeams[1] || configuredTeams[0]);

const tiles = col.tiles.map((tileData, rowIdx) => {
const q = tileData.question;
const pts = tileData.points || (rowIdx < 2 ? 200 : rowIdx < 4 ? 400 : 600);

if (!q || !tileData.is_available) {
return {
id: `${catKey}-${pts}-${rowIdx}`,
categoryId: catKey,
categoryName: col.category_name,
categoryMeta: meta,
points: pts,
isUsed: false,
is_available: false,
status: 'exhausted',
winnerTeamId: null,
isMystery: false,
question: null
};
}

return {
id: `${catKey}-${pts}-${rowIdx}`,
categoryId: catKey,
categoryName: col.category_name,
categoryMeta: meta,
points: pts,
isUsed: false,
status: 'available',
winnerTeamId: null,
isMystery: (rowIdx === 2 || rowIdx === 3) && colIdx % 2 === 0,
isSecretBet: (rowIdx === 2 && (colIdx === 1 || colIdx === 4)),
question: {
id: q.id,
question_text: q.question_text,
options_json: shuffleArray(q.options_json || []),
correct_answer: q.correct_answer,
points: q.points_level || pts,
media_url: q.media_url || null,
category_name: col.category_name
}
};
});

return {
key: catKey,
categoryId: catKey,
name: col.category_name,
categoryName: col.category_name,
categoryMeta: meta,
chosenByTeam: ownerTeam,
tiles: tiles
};
});
}
} else {
const errJson = await res.json().catch(() => ({}));
if (res.status === 403 || res.status === 400) {
set({
gameBanner: {
type: 'warning',
title: 'نفد الرصيد!',
message: errJson.detail || 'نفد رصيدك من الألعاب! يرجى شحن الرصيد لتتمكن من اللعب.'
},
gameStage: 'setup',
currentRoute: 'setup'
});
if (typeof window !== 'undefined' && window.location.pathname !== '/') {
window.history.pushState(null, '', '/');
}
return false;
}
}
} catch (dbErr) {
console.warn('Backend board-fetch error, using fallback:', dbErr);
}

// 2. Fallback only if database is unreachable (offline resilience)
if (!newBoard) {
newBoard = catKeys.map((catKey, colIdx) => {
const meta = CATEGORIES_DATA.find(c => c.id === catKey) || CATEGORIES_DATA[0];
const questionsList = shuffleArray(BATTLEGROUND_QUESTIONS[catKey] || BATTLEGROUND_QUESTIONS.general);
const ownerTeam = colIdx < 3 ? configuredTeams[0] : (configuredTeams[1] || configuredTeams[0]);

const pointTiers = [200, 200, 400, 400, 600, 600];
const tierCounters = { 200: 0, 400: 0, 600: 0 };

const tiles = pointTiers.map((pts, rowIdx) => {
const tierIdx = tierCounters[pts];
tierCounters[pts] += 1;

const matchingQuestions = questionsList.filter(q => q.points === pts);
const unseenQuestions = matchingQuestions.filter(q => !seenQuestionIds.has(q.id));
const qData = unseenQuestions[tierIdx] || unseenQuestions[0];
if (!qData) {
return {
id: `${catKey}-${pts}-${rowIdx}`,
categoryId: catKey,
categoryName: meta.name,
categoryMeta: meta,
points: pts,
isUsed: false,
is_available: false,
status: 'exhausted',
winnerTeamId: null,
isMystery: false,
question: null
};
}
const randomizedQuestion = {
...qData,
options_json: shuffleArray(qData.options_json || [])
};

return {
id: `${catKey}-${pts}-${rowIdx}`,
categoryId: catKey,
categoryName: meta.name,
categoryMeta: meta,
points: pts,
isUsed: false,
status: 'available',
winnerTeamId: null,
isMystery: (rowIdx === 2 || rowIdx === 3) && colIdx % 2 === 0,
isSecretBet: (rowIdx === 2 && (colIdx === 1 || colIdx === 4)),
question: {
...randomizedQuestion,
media_url: randomizedQuestion.media_url || null
}
};
});

return {
key: catKey,
categoryId: catKey,
name: meta.name,
categoryName: meta.name,
categoryMeta: meta,
chosenByTeam: ownerTeam,
tiles: tiles
};
});
}

if (typeof window !== 'undefined' && window.location.pathname !== '/board') {
window.history.pushState(null, '', '/board');
}

set({
gameStage: 'playing',
currentRoute: 'board',
teams: configuredTeams.map((t, i) => {
const teamLoadout = t.loadout && t.loadout.length === 2
? t.loadout
: (i === 0 ? ['double', 'bomb'] : ['freeze', 'fifty']);
return {
...t,
id: t.id || i + 1,
score: t.score || 0,
isFrozen: false,
isBombed: false,
hasUsedSwap: false,
hasUsedWheel: false,
loadout: teamLoadout,
powerups: teamLoadout.reduce((acc, w) => ({ ...acc, [w]: 1 }), {})
};
}),
currentTurn: 0,
activeTeamIndex: 0,
board: newBoard,
isStealMode: false,
isWheelChallengeActive: false,
wheelChallengeBeneficiary: 'current',
teamLevelPicks: [],
activeTile: null,
activeQuestion: null,
questionModalOpen: false,
selectedOption: null,
isAnswerRevealed: false,
isCorrect: null,
eliminatedOptions: [],
wheelModalOpen: false,
isWheelSpinning: false,
selectedWheelOption: null,
activeModifier: null,
gameBanner: null
});

persistActiveGame(get());
},

// Alias for backward compatibility
startBattlegroundGame: async (configuredTeams, selectedCategoryIds) => {
await get().initGame(configuredTeams, selectedCategoryIds);
},

/**
* تفعيل السلاح التكتيكي للفريق النشط مع خصم تكلفة النقاط
*/
activatePowerup: (teamId, powerupId) => {
const { teams, currentTurn } = get();
const currentTeam = teams[currentTurn];
if (!currentTeam || currentTeam.id !== teamId) {
set({
gameBanner: {
type: 'warning',
title: 'ليس دورك!',
message: `تفعيل الأسلحة متاح فقط للفريق صاحب الدور الحالي [${currentTeam?.name}]!`
}
});
return;
}

if (currentTeam.isFrozen) {
set({
gameBanner: {
type: 'freeze',
title: 'الفريق مجمّد!',
message: `فريق [${currentTeam.name}] مجمّد هذا الدور ومحروم من استخدام الأسلحة التكتيكية!`
}
});
return;
}

const catalogItem = POWERUPS_CATALOG.find(p => p.id === powerupId) || {
id: powerupId,
name: 'سلاح تكتيكي',
cost: 100
};

const cost = catalogItem.cost;
const hasCharge = Boolean(currentTeam.powerups && currentTeam.powerups[powerupId] > 0);
const canAffordPoints = currentTeam.score >= cost;

// Check points score or available charges
if (!hasCharge && !canAffordPoints) {
set({
gameBanner: {
type: 'warning',
title: 'رصيد النقاط غير كافٍ!',
message: `تكلفة سلاح [${catalogItem.name}] هي ${cost} نقطة وليس لديك شحنات متبقية. اكسب نقاطاً من الأسئلة أولاً!`
}
});
return;
}

// Deduct: consume charge if available, otherwise deduct points from score
set(state => ({
teams: state.teams.map((t, idx) => {
if (idx !== currentTurn) return t;
if (hasCharge) {
return {
...t,
powerups: {
...t.powerups,
[powerupId]: Math.max(0, (t.powerups?.[powerupId] || 1) - 1)
}
};
} else {
return {
...t,
score: Math.max(0, t.score - cost)
};
}
})
}));

if (powerupId === 'double') {
set({
activeModifier: 'double',
gameBanner: {
type: 'double',
title: 'تم تفعيل دبل النقاط (x2)!',
message: hasCharge
? 'تم استخدام شحنة دبل النقاط! ستحصل على ضعف النقاط (x2) عند الإجابة الصحيحة!'
: `تم خصم ${cost} نقطة. ستحصل على ضعف النقاط (x2) عند الإجابة الصحيحة على السؤال القادم!`
}
});
confetti({ particleCount: 55, spread: 60 });
} else if (powerupId === 'freeze') {
const rivalIndex = (currentTurn + 1) % teams.length;
const rivalName = teams[rivalIndex]?.name || 'الفريق الخصم';
set(state => ({
teams: state.teams.map((t, idx) => idx === rivalIndex ? { ...t, isFrozen: true } : t),
gameBanner: {
type: 'freeze',
title: 'تم تجميد الخصم!',
message: hasCharge
? `تم استخدام شحنة التجميد! تم تجميد فريق [${rivalName}] وحرمانه من استخدام أي سلاح في دوره القادم!`
: `تم خصم ${cost} نقطة. تم تجميد فريق [${rivalName}] وحرمانه من استخدام أي سلاح في دوره القادم!`
}
}));
confetti({ particleCount: 55, spread: 60 });
} else if (powerupId === 'bomb') {
const rivalIndex = (currentTurn + 1) % teams.length;
const rivalName = teams[rivalIndex]?.name || 'الفريق الخصم';
set(state => ({
teams: state.teams.map((t, idx) => idx === rivalIndex ? { ...t, isBombed: true } : t),
gameBanner: {
type: 'warning',
title: '💣 تم زرع قنبلة الوقت!',
message: hasCharge
? `تم استخدام شحنة القنبلة! تم زرع قنبلة وقت لفريق [${rivalName}]، سيتقلص وقت إجابته إلى (15 ثانية فقط) في دوره القادم!`
: `تم خصم ${cost} نقطة. تم زرع قنبلة وقت لفريق [${rivalName}]، سيتقلص وقت إجابته إلى (15 ثانية فقط) في دوره القادم!`
}
}));
confetti({ particleCount: 75, spread: 80 });
} else if (powerupId === 'fifty') {
const { activeQuestion } = get();
const options = activeQuestion?.options_json || activeQuestion?.options || [];
if (activeQuestion && options.length >= 3 && !get().isAnswerRevealed) {
const correctAns = String(activeQuestion.correct_answer || '').trim();
const wrongOpts = options.filter(o => {
const optStr = String(o || '').trim();
return optStr !== correctAns && optStr.toLowerCase() !== correctAns.toLowerCase();
});
const shuffled = [...wrongOpts].sort(() => Math.random() - 0.5);
const toEliminate = shuffled.slice(0, 2).filter(o => String(o || '').trim() !== correctAns);
set({
eliminatedOptions: toEliminate,
activeModifier: 'fifty',
gameBanner: {
type: 'fifty',
title: '🎯 تم تفعيل 50:50 بنجاح!',
message: hasCharge
? 'تم استخدام شحنة 50:50 وحذف خيارين خاطئين! اختر الآن من بين الخيارين المتبقيين.'
: `تم خصم ${cost} نقطة وحذف خيارين خاطئين! اختر الآن من بين الخيارين المتبقيين.`
}
});
confetti({ particleCount: 65, spread: 70 });
} else {
set({
activeModifier: 'fifty',
gameBanner: {
type: 'fifty',
title: '🎯 تم تجهيز 50:50!',
message: hasCharge
? 'تم تفعيل 50:50! سيتم استبعاد خيارين خاطئين تلقائياً فور فتح السؤال القادم!'
: `تم خصم ${cost} نقطة. سيتم حذف خيارين خاطئين فور فتح السؤال القادم!`
}
});
confetti({ particleCount: 50, spread: 50 });
}
}
},

/**
 * هل المربع محدد ومقفل لفريق معين؟
 * جميع المربعات غير المجابة مفتوحة ومتاحة لكلا الفريقين بالتساوي لمنع نفاد الأسئلة لأي فريق قبل الآخر.
 */
isTileLockedForTeam: () => false,

/**
 * حساب عدد المربعات المتاحة لفريق معين
 */
countAvailableTilesForTeam: (teamIndex) => {
  const { board } = get();
  if (!board || board.length === 0) return 0;
  return board.reduce((acc, col) => 
    acc + (col.tiles || []).filter(t => !t.isUsed && t.is_available !== false).length,
    0
  );
},

/**
 * هل يمتلك الفريق أي مربعات متاحة غير مقفلة للاختيار؟
 */
hasAvailableTilesForTeam: (teamIndex) => {
  return get().countAvailableTilesForTeam(teamIndex) > 0;
},

/**
 * فك قفل الأسئلة المتبقية باللوحة عند تعثر الفرق
 */
unlockRemainingTiles: () => {
  set({
    teamLevelPicks: [],
    gameBanner: {
      type: 'info',
      title: '🔓 جميع الأسئلة متاحة!',
      message: 'كافة الأسئلة المتبقية باللوحة مفتوحة لكلا الفريقين بالتساوي!'
    }
  });
  persistActiveGame(get());
},

/**
 * إنهاء الجلسة فوراً وتتويج الفائز
 */
endGame: () => {
  const { teams } = get();
  confetti({ particleCount: 220, spread: 100, origin: { y: 0.5 } });

  const sorted = [...teams].sort((a, b) => b.score - a.score);
  const isTie = sorted.length > 1 && sorted[0].score === sorted[1].score;

  if (isTie) {
    get().startFinalRound();
    return;
  }

  set({
    gameStage: 'game_over',
    questionModalOpen: false,
    activeTile: null,
    activeQuestion: null,
    isStealMode: false,
    isWheelChallengeActive: false,
    activeModifier: null,
    gameBanner: {
      type: 'wheel_win',
      title: '🏆 انتهت الجلسة!',
      message: `ألف مبروك لفريق [${sorted[0]?.name}] التتويج بلقب جلسة اليوم بنتيجة ${sorted[0]?.score} نقطة!`
    }
  });
  persistActiveGame(get());
},

/**
 * تخطي الدور يدوياً
 */
skipTurn: () => {
  get().nextTurn();
},

/**
* قاعدة القفل:
* جميع الأسئلة غير المجابة مفتوحة ومتاحة لكلا الفريقين في أدوارهما بالتساوي.
*/
isLockedForCurrentTeam: () => false,

/**
 * تفعيل ميزة "تحدي العجلة" (Wheel Challenge)
 * - متاح مرة واحدة فقط لكل فريق طوال الجلسة
 * - يجبر الفريق على اختيار سؤال 400 نقطة حصراً من فئات الخصم
 * - يتحقق مسبقاً من وجود سؤال 400 متاح وغير مقفل لتجنب أي تعليق
 */
activateWheelChallenge: () => {
  const { teams, currentTurn, isWheelChallengeActive, questionModalOpen, wheelModalOpen, board, isLockedForCurrentTeam } = get();
  if (questionModalOpen || wheelModalOpen) return;
  const currentTeam = teams[currentTurn];
  if (!currentTeam || currentTeam.hasUsedWheel || isWheelChallengeActive) return;

  // فحص هل يوجد سؤال 400 متاح وغير مقفل في فئات الفريق الخصم
  const rivalCategories = (board || []).filter(c => c.chosenByTeam && c.chosenByTeam.id !== currentTeam.id);
  const hasAvailable400 = rivalCategories.some(c =>
    c.tiles && c.tiles.some(t => t.points === 400 && !t.isUsed && t.is_available !== false && !isLockedForCurrentTeam(c.categoryId, 400))
  );

  if (!hasAvailable400) {
    set({
      gameBanner: {
        type: 'warning',
        title: 'لا يمكن تفعيل التحدي!',
        message: 'لا توجد أسئلة بقيمة 400 نقطة متاحة وغير مجابة في فئات الخصم حالياً!'
      }
    });
    return;
  }

  set({
    isWheelChallengeActive: true,
    gameBanner: {
      type: 'wheel_challenge',
      title: 'تم تفعيل تحدي العجلة! 🎡',
      message: `فريق [${currentTeam.name}]، اختر سؤال 400 نقطة (المضاء باللون الذهبي) من فئات الخصم للمخاطرة!`
    }
  });
},

/**
 * إلغاء تحدي العجلة واستعادة الاختيار الحر الطبيعي
 */
cancelWheelChallenge: () => {
  const { isWheelChallengeActive } = get();
  if (!isWheelChallengeActive) return;
  set({
    isWheelChallengeActive: false,
    gameBanner: {
      type: 'info',
      title: 'تم إلغاء التحدي',
      message: 'تم إلغاء تحدي العجلة. يمكنك الآن اختيار أي سؤال متاح بشكل طبيعي.'
    }
  });
},

/**
 * إلغاء وضع السرقة وتغيير الاختيار مع استرجاع السلاح أو النقاط
 */
cancelStealMode: () => {
  const { isStealMode, teams, currentTurn, stealDeductionType, stealCost } = get();
  if (!isStealMode) return;

  const currentTeam = teams[currentTurn];
  set(state => ({
    isStealMode: false,
    activeModifier: state.activeModifier === 'steal' ? null : state.activeModifier,
    teams: state.teams.map((t, idx) => {
      if (idx !== currentTurn) return t;
      if (stealDeductionType === 'points') {
        return { ...t, score: t.score + (stealCost || 150) };
      } else {
        return {
          ...t,
          powerups: {
            ...t.powerups,
            steal: (t.powerups?.steal || 0) + 1
          }
        };
      }
    }),
    gameBanner: {
      type: 'info',
      title: 'تم إلغاء وضع السرقة',
      message: `تم إلغاء وضع السرقة واسترجاع ${stealDeductionType === 'points' ? `${stealCost || 150} نقطة` : 'سلاح السرقة'} لفريق [${currentTeam?.name || ''}]. يمكنك الآن اختيار أي سؤال متاح.`
    }
  }));
},

/**
 * تغيير السؤال الحالي واستبداله بسؤال بديل من نفس المستوى (مجاناً ومرة واحدة فقط لكل فريق طوال الجلسة)
 */
swapActiveQuestion: () => {
  const { activeTile, activeQuestion, board, currentUser, teams, currentTurn } = get();
  if (!activeTile || !activeQuestion || get().isAnswerRevealed) return;

  const currentTeam = teams[currentTurn];
  if (currentTeam?.hasUsedSwap) {
    set({
      gameBanner: {
        type: 'warning',
        title: 'استنفدت فرصة التغيير!',
        message: `فريق [${currentTeam.name}] استهلك فرصة تغيير السؤال المجانية المتاحة له في هذه اللعبة!`
      }
    });
    return;
  }

  const catId = activeTile.categoryId;
  const pts = activeTile.points;
  const currentQId = activeQuestion.id;
  const currentUserId = currentUser?.id;
  const seenIds = loadSeenQuestionIds(currentUserId);

  const pool = [
    ...(BATTLEGROUND_QUESTIONS[catId] || []),
    ...(BATTLEGROUND_QUESTIONS.general || [])
  ];

  let candidates = pool.filter(q => q.points === pts && q.id !== currentQId && !seenIds.has(q.id));
  if (candidates.length === 0) {
    candidates = pool.filter(q => q.points === pts && q.id !== currentQId);
  }
  if (candidates.length === 0) {
    candidates = pool.filter(q => q.id !== currentQId);
  }

  if (candidates.length === 0) {
    set({
      gameBanner: {
        type: 'warning',
        title: 'تعذر التغيير',
        message: 'لا تتوفر أسئلة بديلة إضافية لهذا المستوى حالياً.'
      }
    });
    return;
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const rawOptions = chosen.options_json || chosen.options || [];
  const randomizedOptions = shuffleArray(rawOptions);

  const newQuestion = {
    id: chosen.id,
    question_text: chosen.question_text || chosen.question,
    options_json: randomizedOptions,
    correct_answer: chosen.correct_answer || chosen.answer,
    points: pts,
    category_name: activeTile.categoryName
  };

  if (currentUserId && newQuestion.id) {
    saveSeenQuestionId(currentUserId, newQuestion.id);
  }

  const updatedBoard = (board || []).map(col => {
    if (col.categoryId !== catId) return col;
    return {
      ...col,
      tiles: (col.tiles || []).map(t => {
        if (t.id !== activeTile.id) return t;
        return {
          ...t,
          question: newQuestion
        };
      })
    };
  });

  set(state => ({
    teams: state.teams.map((t, idx) => idx === currentTurn ? { ...t, hasUsedSwap: true } : t),
    board: updatedBoard,
    activeQuestion: newQuestion,
    eliminatedOptions: [],
    selectedOption: null,
    gameBanner: {
      type: 'info',
      title: '🔄 تم تغيير السؤال بنجاح!',
      message: `تم استبدال السؤال بسؤال جديد مختلف لفريق [${currentTeam.name}]. (تم استهلاك الفرصة المجانية).`
    }
  }));

  confetti({ particleCount: 45, spread: 65 });
},

/**
 * تأكيد رهان السؤال السري وبدء السؤال بالنقاط المرهونة
 */
confirmSecretBet: (betAmount) => {
  const { activeSecretBetTile, teams, currentTurn } = get();
  if (!activeSecretBetTile) return;
  const currentTeam = teams[currentTurn];
  const maxBet = Math.max(currentTeam.score || 0, 600);
  const minBet = 100;
  const validBet = Math.min(Math.max(Number(betAmount) || minBet, minBet), maxBet);

  const tileWithBet = {
    ...activeSecretBetTile,
    points: validBet,
    originalPoints: activeSecretBetTile.points
  };

  set({
    activeTile: tileWithBet,
    activeQuestion: activeSecretBetTile.question,
    selectedOption: null,
    isAnswerRevealed: false,
    isCorrect: null,
    eliminatedOptions: [],
    secretBetModalOpen: false,
    questionModalOpen: true,
    activeModifier: 'secret_bet',
    mysteryModifier: null,
    reboundState: { isActive: false, teamIndex: null, wrongOptions: [], timeLeft: 10, basePoints: 0 },
    gameBanner: {
      type: 'double',
      title: `🎲 تم تأكيد الرهان بـ ${validBet} نقطة!`,
      message: `فريق [${currentTeam.name}] راهن بـ ${validBet} نقطة على هذا السؤال!`
    }
  });
  confetti({ particleCount: 70, spread: 80 });
},

/**
 * إلغاء الرهان السري والعودة للوحة
 */
cancelSecretBet: () => {
  set({
    secretBetModalOpen: false,
    activeSecretBetTile: null
  });
},

/**
 * بدء الجولة النهائية الحاسمة في حالة التعادل فقط (Final Round)
 */
startFinalRound: () => {
  const { teams } = get();
  const pool = BATTLEGROUND_QUESTIONS.general || [];
  const q = pool[Math.floor(Math.random() * pool.length)] || {
    id: 9999,
    question_text: 'ما هي الدولة العربية الوحيدة التي تطل على البحر الأبيض المتوسط والمحيط الأطلسي معاً؟',
    options_json: ['المغرب', 'مصر', 'الجزائر', 'موريتانيا'],
    correct_answer: 'المغرب',
    points: 1000
  };

  set({
    finalRoundModalOpen: true,
    finalRoundQuestion: {
      ...q,
      options_json: shuffleArray(q.options_json || [])
    },
    gameBanner: {
      type: 'warning',
      title: '⚔️ الجولة النهائية الحاسمة لكسر التعادل!',
      message: `تعادل الفريقان بنتيجة [${teams[0]?.score || 0}] نقطة! السؤال الأخير سيحسم لقب الجلسة!`
    }
  });
  confetti({ particleCount: 160, spread: 90 });
},

/**
 * تتويج الفائز في الجولة النهائية الحاسمة
 */
resolveFinalRound: (winningTeamIndex) => {
  const { teams } = get();
  const winner = teams[winningTeamIndex];

  set(state => ({
    teams: state.teams.map((t, idx) => idx === winningTeamIndex ? { ...t, score: t.score + 500 } : t),
    finalRoundModalOpen: false,
    finalRoundQuestion: null,
    gameStage: 'game_over',
    gameBanner: {
      type: 'wheel_win',
      title: '🏆 حسم البطولة في الجولة الحاسمة!',
      message: `ألف مبروك لفريق [${winner?.name}] حسم الجولة النهائية والتتويج بلقب جلسة اليوم!`
    }
  }));
  confetti({ particleCount: 250, spread: 100, origin: { y: 0.5 } });
  persistActiveGame(get());
},

/**
* دالة الضغط على مربع السؤال مع التحقق من قاعدة القفل وتحدي العجلة
*/
selectTile: (category, tile) => {
const {
activeTile,
questionModalOpen,
wheelModalOpen,
isStealMode,
isWheelChallengeActive,
teams,
currentTurn,
isLockedForCurrentTeam
} = get();

if (tile.isUsed || tile.is_available === false || activeTile || questionModalOpen || wheelModalOpen) return;

const currentTeam = teams[currentTurn];
const isRivalCategory = category.chosenByTeam && category.chosenByTeam.id !== currentTeam.id;

// 1. Dynamic Locking Rule: Block if current team already answered this point level in this category
// EXCEPT when in Steal Mode on a rival category: Steal weapon unlocks locked questions!
if (isLockedForCurrentTeam(category.categoryId, tile.points)) {
  if (isStealMode && isRivalCategory) {
    // Allowed! Steal weapon unlocks and opens the locked rival question!
  } else {
    set({
      gameBanner: {
        type: 'warning',
        title: 'مربع مقفل لفريقك!',
        message: `فريق [${currentTeam.name}] أجاب مسبقاً على سؤال بقيمة ${tile.points} نقطة في فئة [${category.name || category.categoryName}]. اختر مستوى آخر!`
      }
    });
    return;
  }
}

// 2. Wheel Challenge restrictions: 400 points ONLY and Rival category ONLY!
if (isWheelChallengeActive) {
if (tile.points !== 400) {
set({
gameBanner: {
type: 'warning',
title: 'شرط تحدي العجلة!',
message: 'في تحدي العجلة، يجب اختيار سؤال بقيمة 400 نقطة حصراً من فئات الخصم (أو اضغط زر إلغاء التحدي أعلى اللوحة)!'
}
});
return;
}
if (!isRivalCategory) {
set({
gameBanner: {
type: 'warning',
title: 'فئة الخصم مطلوبة!',
message: 'في تحدي العجلة، يجب أن يكون السؤال من فئات الفريق الخصم (أو اضغط زر إلغاء التحدي أعلى اللوحة)!'
}
});
return;
}
// استهلاك ميزة العجلة لهذا الفريق فور اختيار السؤال وبدء التحدي
set(state => ({
teams: state.teams.map((t, idx) => idx === currentTurn ? { ...t, hasUsedWheel: true } : t)
}));
}

// 3. Steal Mechanic: Must select from rival's categories
if (isStealMode && !isRivalCategory) {
set({
gameBanner: {
type: 'warning',
title: 'أنت في وضع السرقة!',
message: 'يجب اختيار سؤال من فئات الفريق الخصم لسرقته!'
}
});
return;
}

const fullTileData = {
...tile,
categoryName: category.name || category.categoryName,
categoryMeta: category.categoryMeta || CATEGORIES_DATA.find(c => c.id === tile.categoryId)
};

// فحص سؤال الرهان السري (Secret Bet / Daily Double)
if (tile.isSecretBet && !isStealMode && !isWheelChallengeActive) {
  set({
    secretBetModalOpen: true,
    activeSecretBetTile: fullTileData,
    gameBanner: {
      type: 'double',
      title: '🎲 عثرت على مربع الرهان السري!',
      message: `فريق [${currentTeam.name}]، عثرتم على مربع الرهان السري! حدد مقدار رهانك قبل فتح السؤال!`
    }
  });
  return;
}

let activeMod = isStealMode ? 'steal' : get().activeModifier;
let mysteryMod = null;
let banner = get().gameBanner;

// تفعيل مفاجأة المربع إذا كان مربع مفاجأة (Mystery Tile)
if (tile.isMystery) {
const mysteryTypes = ['double', 'shield', 'bonus'];
const chosenType = mysteryTypes[Math.floor(Math.random() * mysteryTypes.length)];

if (chosenType === 'double') {
activeMod = 'double';
banner = {
type: 'double',
title: '🎁 مربع المفاجأة: دبل النقاط التلقائي (x2)!',
message: `فريق [${currentTeam.name}]، نقاط هذا السؤال أصبحت مضاعفة x2 تلقائياً!`
};
} else if (chosenType === 'shield') {
mysteryMod = 'shield';
banner = {
type: 'info',
title: '🎁 مربع المفاجأة: درع الحماية!',
message: `فريق [${currentTeam.name}] حصل على درع الحماية! في حال الخطأ لن تُخصم أي نقاط!`
};
} else if (chosenType === 'bonus') {
set(state => ({
teams: state.teams.map((t, idx) => idx === currentTurn ? { ...t, score: t.score + 100 } : t)
}));
banner = {
type: 'info',
title: '🎁 مربع المفاجأة: بونص فوري +100 نقطة!',
message: `أضيفت 100 نقطة فورية هدية إلى رصيد فريق [${currentTeam.name}]!`
};
}
}

let eliminated = [];
if (activeMod === 'fifty' && tile.question) {
const opts = tile.question.options_json || tile.question.options || [];
const correctAns = String(tile.question.correct_answer || '').trim();
const wrongOpts = opts.filter(o => {
const optStr = String(o || '').trim();
return optStr !== correctAns && optStr.toLowerCase() !== correctAns.toLowerCase();
});
const shuffled = [...wrongOpts].sort(() => Math.random() - 0.5);
eliminated = shuffled.slice(0, 2).filter(o => String(o || '').trim() !== correctAns);
banner = {
type: 'fifty',
title: '🎯 تم تفعيل 50:50 تلقائياً!',
message: 'تم استبعاد خيارين خاطئين لهذا السؤال بنجاح!'
};
}

set({
activeTile: fullTileData,
activeQuestion: tile.question,
selectedOption: null,
isAnswerRevealed: false,
isCorrect: null,
eliminatedOptions: eliminated,
questionModalOpen: true,
activeModifier: activeMod,
mysteryModifier: mysteryMod,
reboundState: {
isActive: false,
teamIndex: null,
wrongOptions: [],
timeLeft: 10,
basePoints: 0
},
gameBanner: banner
});
},

/**
* تدوير عجلة الحظ واختيار نتيجة من الخيارات الديناميكية الثلاثة
* وتطبيق التأثير فوراً على Game State عند توقف العجلة
*/
spinFortuneWheel: () => {
const { isWheelSpinning } = get();
if (isWheelSpinning) return;

// 3 Dynamic Options: double, freeze, steal_random
const randIndex = Math.floor(Math.random() * FORTUNE_WHEEL_OPTIONS.length);
const chosenOption = FORTUNE_WHEEL_OPTIONS[randIndex];

// Wheel has 6 visual sectors (each of 3 options repeated twice), each sector = 60°
// Sectors layout: [option0, option1, option2, option0, option1, option2]
// Pointer is at top (0°). We rotate the wheel so that the chosen option's
// first sector (at position randIndex) ends up under the pointer.
// +30° offset centers the pointer inside the sector (not on the edge).
const NUM_SECTORS = 6;
const segmentAngle = 360 / NUM_SECTORS; // 60°
const targetDeg = 360 * 5 + (NUM_SECTORS - 1 - randIndex) * segmentAngle + (segmentAngle / 2);

set({
isWheelSpinning: true,
wheelRotation: targetDeg,
selectedWheelOption: chosenOption
});

setTimeout(() => {
set({ isWheelSpinning: false });
confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
}, 3200);
},

/**
* تأكيد نتيجة عجلة الحظ وتطبيق التأثير على الفريق المستحق (الفائز بالتحدي أو الخصم عند الخسارة)
*/
confirmFortuneResult: () => {
const { selectedWheelOption, wheelChallengeBeneficiary, teams, currentTurn, board } = get();
const currentTeam = teams[currentTurn];
const rivalIndex = (currentTurn + 1) % teams.length;
const rivalTeam = teams[rivalIndex];
const targetTeam = wheelChallengeBeneficiary === 'current' ? currentTeam : rivalTeam;
const penalizedTeam = wheelChallengeBeneficiary === 'current' ? rivalTeam : currentTeam;

const optId = selectedWheelOption ? selectedWheelOption.id : 'double';

if (optId === 'double') {
set(state => ({
teams: state.teams.map(t => t.id === targetTeam.id ? { ...t, score: t.score + 400 } : t),
gameBanner: {
type: 'double',
title: 'مضاعفة النقاط (+400)!',
message: `عجلة الحظ أضافت 400 نقطة لصالح فريق [${targetTeam.name}]!`
}
}));
} else if (optId === 'freeze') {
set(state => ({
teams: state.teams.map(t => t.id === penalizedTeam.id ? { ...t, isFrozen: true } : t),
gameBanner: {
type: 'freeze',
title: 'تجميد أسلحة الفريق!',
message: `عجلة الحظ جمدت فريق [${penalizedTeam.name}] وحرمته من استخدام أسلحته لدوره القادم!`
}
}));
} else if (optId === 'steal_random') {
const rivalCols = board.filter(c => c.chosenByTeam && c.chosenByTeam.id === penalizedTeam.id);
let stolen = null;
for (const col of rivalCols) {
const available = [...col.tiles]
.filter(t => !t.isUsed && t.is_available !== false)
.sort((a, b) => b.points - a.points);
if (available.length > 0) {
stolen = { tile: available[0], col };
break;
}
}
if (stolen) {
set(state => ({
board: state.board.map(c => c.categoryId === stolen.col.categoryId ? {
...c,
tiles: c.tiles.map(t => t.id === stolen.tile.id ? { ...t, isUsed: true, status: 'answered', winnerTeamId: targetTeam.id } : t)
} : c),
teams: state.teams.map(t => t.id === targetTeam.id ? { ...t, score: t.score + stolen.tile.points } : t),
gameBanner: {
type: 'steal',
title: 'سرقة سؤال من الخصم! ⚔️',
message: `عجلة الحظ سرقت سؤالاً بقيمة ${stolen.tile.points} نقطة من فئة [${stolen.col.categoryName || stolen.col.name}] لصالح [${targetTeam.name}]!`
}
}));
} else {
// مكافأة بديلة في حال كانت كل أسئلة الخصم مجابة
set(state => ({
teams: state.teams.map(t => t.id === targetTeam.id ? { ...t, score: t.score + 400 } : t),
gameBanner: {
type: 'double',
title: 'مكافأة بديلة (+400 نقطة)!',
message: `نظراً لعدم توفر أسئلة لسرقتها، منحت العجلة 400 نقطة إضافية لصالح [${targetTeam.name}]!`
}
}));
}
}

set({
wheelModalOpen: false,
isWheelChallengeActive: false,
selectedWheelOption: null
});

get().nextTurn();
},

closeFortuneModal: () => {
if (get().selectedWheelOption) {
get().confirmFortuneResult();
} else {
set({
wheelModalOpen: false,
isWheelChallengeActive: false
});
get().nextTurn();
}
},

/**
 * تبديل حالة المؤقت (30 ثانية للسؤال و10 ثوانٍ لفرصة الخطف)
 */
toggleTimer: () => {
set(state => {
const nextVal = !state.isTimerEnabled;
try {
localStorage.setItem('jalsah_timer_enabled', JSON.stringify(nextVal));
} catch (e) {}
return {
isTimerEnabled: nextVal,
gameBanner: {
type: 'info',
title: nextVal ? 'المؤقت مفعّل (30 ثانية)' : 'المؤقت معطّل (وقت مفتوح)',
message: nextVal ? 'تم تفعيل مؤقت الـ 30 ثانية ومؤقت الـ 10 ثوانٍ لفرصة الخطف.' : 'تم تعطيل المؤقت، الإجابة وفرصة الخطف أصبحت بوقت مفتوح.'
}
};
});
},

/**
 * تخطي فرصة الخطف من قبل الفريق الثاني دون أي خصم (0 نقطة)
 */
skipRebound: () => {
const { reboundState, activeTile, teams } = get();
if (!reboundState.isActive || !activeTile) return;
const secondTeam = teams[reboundState.teamIndex];

set(state => ({
board: state.board.map(col => ({
...col,
tiles: col.tiles.map(tile => {
if (tile.id === activeTile.id) {
return {
...tile,
isUsed: true,
status: 'answered',
winnerTeamId: null
};
}
return tile;
})
})),
reboundState: {
isActive: false,
teamIndex: null,
wrongOptions: [],
timeLeft: 10,
basePoints: 0
},
questionModalOpen: false,
activeTile: null,
activeQuestion: null,
selectedOption: null,
isAnswerRevealed: false,
isCorrect: null,
eliminatedOptions: [],
mysteryModifier: null,
gameBanner: {
type: 'info',
title: 'تخطي الفرصة دون مخاطرة',
message: `اختار فريق [${secondTeam?.name || 'الخصم'}] عدم المخاطرة وتخطي الفرصة دون أي خصم.`
}
}));
get().nextTurn();
},

/**
* منطق احتساب النقاط وتتبع مستويات الأسئلة وتحدي العجلة وفرصة الخطف للفريق الثاني
*/
handleAnswer: (isCorrect, pointsOverride) => {
const {
activeTile,
activeQuestion,
activeModifier,
mysteryModifier,
isStealMode,
isWheelChallengeActive,
teams,
currentTurn,
reboundState,
isTimerEnabled,
selectedOption
} = get();

if (!activeTile || !activeQuestion) return;

let basePoints = pointsOverride || reboundState.basePoints || activeTile.points || 200;
if (activeModifier === 'double' && !reboundState.isActive) {
basePoints *= 2;
}

const currentTeam = teams[currentTurn];
const rivalIndex = (currentTurn + 1) % teams.length;
const rivalTeam = teams[rivalIndex];

// ========================================================
// 1. إجابة الفريق الثاني في فرصة الخطف (Rebound Opportunity)
// ========================================================
if (reboundState.isActive) {
const secondTeamIndex = reboundState.teamIndex;
const secondTeam = teams[secondTeamIndex];

if (isCorrect) {
confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
set(state => ({
teams: state.teams.map((t, idx) => idx === secondTeamIndex ? { ...t, score: t.score + basePoints } : t),
board: state.board.map(col => ({
...col,
tiles: col.tiles.map(tile => tile.id === activeTile.id ? { ...tile, isUsed: true, status: 'answered', winnerTeamId: secondTeam.id } : tile)
})),
isAnswerRevealed: true,
isCorrect: true,
reboundState: { isActive: false, teamIndex: null, wrongOptions: [], timeLeft: 10, basePoints: 0 },
gameBanner: {
type: 'steal_success',
title: '⚡ خطف النقاط بنجاح!',
message: `إجابة صحيحة! كسب فريق [${secondTeam.name}] ${basePoints} نقطة كاملة بخطف السؤال!`
}
}));
} else {
// أخطأ الفريق الثاني في فرصة الخطف (أو انتهى وقت الـ 10 ثواني) -> يُخصم نصف النقاط
const penalty = Math.floor(basePoints / 2);
set(state => ({
teams: state.teams.map((t, idx) => idx === secondTeamIndex ? { ...t, score: Math.max(0, t.score - penalty) } : t),
board: state.board.map(col => ({
...col,
tiles: col.tiles.map(tile => tile.id === activeTile.id ? { ...tile, isUsed: true, status: 'answered', winnerTeamId: null } : tile)
})),
isAnswerRevealed: true,
isCorrect: false,
reboundState: { isActive: false, teamIndex: null, wrongOptions: [], timeLeft: 10, basePoints: 0 },
gameBanner: {
type: 'warning',
title: 'إجابة خاطئة في فرصة الخطف!',
message: `أخطأ فريق [${secondTeam.name}]! تم خصم نصف النقاط (${penalty} نقطة).`
}
}));
}
persistActiveGame(get());
return;
}

// ========================================================
// 2. إجابة الفريق الأساسي صاحب الدور
// ========================================================
if (activeQuestion && typeof activeQuestion.id === 'number') {
const currentUserId = get().currentUser?.id;
saveSeenQuestionId(currentUserId, activeQuestion.id);
try {
fetch(`${API_BASE}/game/record-seen`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ user_id: currentUserId, question_ids: [activeQuestion.id] })
}).catch(() => {});
} catch (e) {}
}

const newPick = {
teamId: currentTeam.id,
categoryId: activeTile.categoryId,
points: activeTile.points
};

if (isCorrect) {
confetti({ particleCount: 110, spread: 75, origin: { y: 0.6 } });

let banner = null;
if (isWheelChallengeActive) {
banner = {
type: 'wheel_win',
title: 'فوز بتحدي العجلة! 🎡',
message: `إجابة صحيحة! كسب فريق [${currentTeam.name}] ${basePoints} نقطة وسيتم تدوير العجلة لصالحه!`
};
} else if (isStealMode || activeModifier === 'steal') {
banner = {
type: 'steal_success',
title: 'تمت سرقة السؤال بنجاح!',
message: `أحسنت! كسب فريق [${currentTeam.name}] ${basePoints} نقطة وحُرم الخصم منها نهائياً!`
};
} else if (activeModifier === 'secret_bet') {
banner = {
type: 'double',
title: '🎲 فوز كاسح بالرهان السري!',
message: `إجابة صحيحة خارقة! كسب فريق [${currentTeam.name}] الرهان كاملاً (+${basePoints} نقطة)!`
};
}

set(state => ({
teams: state.teams.map((t, idx) => {
if (idx === currentTurn) {
return { ...t, score: t.score + basePoints };
}
return t;
}),
board: state.board.map(col => ({
...col,
tiles: col.tiles.map(tile => {
if (tile.id === activeTile.id) {
return {
...tile,
isUsed: true,
status: 'answered',
winnerTeamId: currentTeam.id
};
}
return tile;
})
})),
teamLevelPicks: [...state.teamLevelPicks, newPick],
isAnswerRevealed: true,
isCorrect: true,
isStealMode: false,
wheelChallengeBeneficiary: 'current',
gameBanner: banner || state.gameBanner
}));
} else {
// الفريق الأساسي أخطأ أو انتهى وقته!
const hasShield = mysteryModifier === 'shield';
const penalty = hasShield ? 0 : (activeModifier === 'secret_bet' ? basePoints : Math.floor(basePoints / 2));

let banner = null;
if (hasShield) {
banner = {
type: 'info',
title: '🛡️ درع الحماية أنقذك!',
message: `إجابة غير صحيحة لفريق [${currentTeam.name}]، لكن درع الحماية منع خصم أي نقاط!`
};
} else if (isWheelChallengeActive) {
banner = {
type: 'wheel_loss',
title: 'خسارة تحدي العجلة!',
message: `إجابة خاطئة! خسر فريق [${currentTeam.name}] فرصة التحدي ونقاط السؤال.`
};
} else if (activeModifier === 'secret_bet') {
banner = {
type: 'warning',
title: 'خسارة الرهان السري! 🎲',
message: `إجابة خاطئة! خسر فريق [${currentTeam.name}] رهان الـ ${basePoints} نقطة بالكامل!`
};
}

// خصم النقاط من الفريق الأساسي
set(state => ({
teams: state.teams.map((t, idx) => {
if (idx === currentTurn) {
return { ...t, score: Math.max(0, t.score - penalty) };
}
return t;
}),
teamLevelPicks: [...state.teamLevelPicks, newPick],
gameBanner: banner || state.gameBanner
}));

// في تحدي العجلة أو الرهان السري: ينتهي السؤال فوراً دون فرصة خطف للخصم
if (isWheelChallengeActive || activeModifier === 'secret_bet') {
set(state => ({
board: state.board.map(col => ({
...col,
tiles: col.tiles.map(tile => {
if (tile.id === activeTile.id) {
return {
...tile,
isUsed: true,
status: 'answered',
winnerTeamId: null
};
}
return tile;
})
})),
isAnswerRevealed: true,
isCorrect: false,
wheelChallengeBeneficiary: 'none'
}));
persistActiveGame(get());
return;
}

// إتاحة فرصة الخطف للفريق الثاني (Rebound Chance)
const wrongOpts = selectedOption ? [selectedOption] : [];
set({
reboundState: {
isActive: true,
teamIndex: rivalIndex,
wrongOptions: wrongOpts,
timeLeft: isTimerEnabled ? 10 : 0,
basePoints: basePoints
},
isAnswerRevealed: false,
selectedOption: null,
isCorrect: null,
gameBanner: {
type: 'warning',
title: `⚡ فرصة خطف السؤال لفريق [${rivalTeam.name}]!`,
message: `أخطأ فريق [${currentTeam.name}]. لديكم فرصة لخطف الـ ${basePoints} نقطة أو تخطي الفرصة دون مخاطرة!`
}
});
}

persistActiveGame(get());
},

/**
* اختيار إجابة من الخيارات الأربعة
*/
selectOption: (option, pointsOverride) => {
const { isAnswerRevealed, activeQuestion, handleAnswer } = get();
if (isAnswerRevealed || !activeQuestion) return;

set({ selectedOption: option });
const isCorrect = option === activeQuestion.correct_answer;
handleAnswer(isCorrect, pointsOverride);
},

/**
* منطق تناوب الأدوار (Turn Logic):
* دالة nextTurn تقوم بنقل اللعب للفريق التالي الذي يمتلك أسئلة متاحة،
* وتفك قفل الأسئلة المتبقية عند تعثر الجميع، وتنهي اللعبة فور اكتمال الأسئلة.
*/
nextTurn: () => {
  const { teams, currentTurn, board } = get();

  // 1. فحص إجمالي المربعات غير المستخدمة والمتاحة في اللوحة
  const allUnusedTiles = (board || []).flatMap(col =>
    (col.tiles || []).filter(t => !t.isUsed && t.is_available !== false)
  );

  // إذا لم يتبق أي مربع غير مستخدم في اللوحة -> تنتهي اللعبة فوراً!
  if (allUnusedTiles.length === 0) {
    get().endGame();
    return;
  }

  // 2. التحقق مما إذا كان هناك أي فريق يمتلك مربعات متاحة بشكل قانوني
  const anyTeamHasMoves = teams.some((_, idx) => get().hasAvailableTilesForTeam(idx));

  if (!anyTeamHasMoves) {
    // جميع المربعات المتبقية مقفلة لجميع الفرق!
    // نقوم بفك قفل المربعات المتبقية تلقائياً حتى يتمكن اللاعبون من إنهاء الأسئلة المتبقية!
    get().unlockRemainingTiles();
  }

  // 3. البحث عن الفريق التالي الذي يمتلك أسئلة متاحة للعب
  let nextIndex = (currentTurn + 1) % teams.length;
  let checkedCount = 0;
  let foundPlayableTeam = false;

  while (checkedCount < teams.length) {
    if (get().hasAvailableTilesForTeam(nextIndex)) {
      foundPlayableTeam = true;
      break;
    }
    nextIndex = (nextIndex + 1) % teams.length;
    checkedCount++;
  }

  if (!foundPlayableTeam) {
    // إذا لم يتبق أي فريق يمكنه اللعب -> تنتهي اللعبة فوراً!
    get().endGame();
    return;
  }

  const immediateNext = (currentTurn + 1) % teams.length;
  let skipBanner = null;
  if (nextIndex !== immediateNext) {
    skipBanner = {
      type: 'info',
      title: 'تخطي الدور تلقائياً ⏭️',
      message: `نفدت الأسئلة المتاحة لفريق [${teams[immediateNext]?.name}]، تم تحويل الدور تلقائياً إلى [${teams[nextIndex]?.name}]!`
    };
  }

  let nextTeam = teams[nextIndex];
  let banner = skipBanner;
  if (nextTeam.isBombed) {
    banner = {
      type: 'warning',
      title: '💣 تنبيه قنبلة الوقت!',
      message: `دور [${nextTeam.name}] الآن تحت تأثير قنبلة الوقت! تم تقليص وقت الإجابة إلى 15 ثانية فقط!`
    };
  } else if (nextTeam.isFrozen) {
    banner = {
      type: 'frozen_turn',
      title: 'تنبيه التجميد!',
      message: `دور [${nextTeam.name}] الآن، ولكنه مجمّد ومحروم من استخدام الأسلحة المساعدة في هذا الدور!`
    };
    set(state => ({
      teams: state.teams.map((t, idx) => idx === nextIndex ? { ...t, isFrozen: false } : t)
    }));
  }

  set({
    currentTurn: nextIndex,
    activeTeamIndex: nextIndex,
    activeTile: null,
    activeQuestion: null,
    questionModalOpen: false,
    selectedOption: null,
    isAnswerRevealed: false,
    isCorrect: null,
    eliminatedOptions: [],
    activeModifier: null,
    selectedWheelOption: null,
    isStealMode: false,
    isWheelChallengeActive: false,
    gameBanner: banner || get().gameBanner
  });
  persistActiveGame(get());
},

/**
* إغلاق نافذة السؤال واستدعاء nextTurn أو فتح عجلة الحظ إذا كان التحدي مفعّلاً
*/
closeQuestionModal: () => {
const { isWheelChallengeActive, wheelChallengeBeneficiary } = get();
if (isWheelChallengeActive && wheelChallengeBeneficiary === 'current') {
set({
questionModalOpen: false,
activeTile: null,
activeQuestion: null,
selectedOption: null,
isAnswerRevealed: false,
isCorrect: null,
eliminatedOptions: [],
wheelModalOpen: true,
selectedWheelOption: null,
isWheelSpinning: false,
wheelRotation: 0
});
} else {
set({
isWheelChallengeActive: false
});
get().nextTurn();
}
},

/**
* مسح رسالة التنبيه العلوية
*/
clearBanner: () => {
set({ gameBanner: null });
},

/**
* إعادة ضبط وبدء جلسة جديدة
*/
resetGame: () => {
clearSavedActiveGame();
if (typeof window !== 'undefined' && window.location.pathname !== '/') {
window.history.pushState(null, '', '/');
}
set({
gameStage: 'setup',
currentRoute: 'setup',
board: [],
activeTile: null,
activeQuestion: null,
questionModalOpen: false,
wheelModalOpen: false,
activeModifier: null,
gameBanner: null,
isWheelChallengeActive: false,
wheelChallengeBeneficiary: 'current',
teamLevelPicks: [],
teams: get().teams.map(t => ({ ...t, score: 0, isFrozen: false, hasUsedWheel: false }))
});
}
};
});

