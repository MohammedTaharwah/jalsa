import { create } from 'zustand';
import confetti from 'canvas-confetti';
import { BATTLEGROUND_QUESTIONS } from '../data/triviaQuestions';
import { CATEGORIES_DATA, FORTUNE_WHEEL_OPTIONS, POWERUPS_CATALOG } from '../data/categoriesData';
import { API_BASE } from '../utils/api';

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
export const useGameStore = create((set, get) => ({
// ================= STATE =================
gameStage: 'setup', // 'setup' | 'playing' | 'game_over'
teams: [
{
id: 1,
name: 'فريق الصقور',
score: 0,
color: 'purple',
iconName: 'Shield',
isFrozen: false,
hasUsedWheel: false,
loadout: ['double', 'steal'],
powerups: { double: 1, steal: 1 }
},
{
id: 2,
name: 'فريق الأسود',
score: 0,
color: 'orange',
iconName: 'Flame',
isFrozen: false,
hasUsedWheel: false,
loadout: ['freeze', 'fifty'],
powerups: { freeze: 1, fifty: 1 }
}
],
currentTurn: 0, // Index of active team
activeTeamIndex: 0, // Alias for backward compatibility

// Tactical Steal Mode
isStealMode: false,

// Wheel Challenge Mode
isWheelChallengeActive: false,
wheelChallengeBeneficiary: 'current', // 'current' | 'opponent'

// Dynamic Level Tracking for Locking Rule: records of { teamId, categoryId, points }
teamLevelPicks: [],

// Jeopardy Grid Board: 6 columns x 3 tiles (200, 400, 600)
board: [],

// Active Question Modal State
activeTile: null,
activeQuestion: null,
questionModalOpen: false,
selectedOption: null,
isAnswerRevealed: false,
isCorrect: null,
eliminatedOptions: [],

// Fortune Wheel State
wheelModalOpen: false,
isWheelSpinning: false,
selectedWheelOption: null,
wheelRotation: 0,
activeModifier: null, // null | 'double' | 'steal' | 'freeze' | 'fifty'

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
} catch (e) {}
return 'setup';
})(),

// Current User Session
currentUser: (() => {
try {
const saved = localStorage.getItem('jalsah_user');
if (saved) return JSON.parse(saved);
} catch (e) {}
return {
id: 2,
username: 'ahmed_player',
email: 'ahmed@example.com',
is_verified: true,
games_balance: 1,
role: 'player'
};
})(),

// Available Games Balance in Global Store
availableGames: (() => {
try {
const saved = localStorage.getItem('jalsah_user');
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
localStorage.setItem('jalsah_user', JSON.stringify(user));
} else {
localStorage.removeItem('jalsah_user');
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
} catch (e) {}
if (typeof window !== 'undefined') {
window.history.pushState(null, '', '/');
}
set({
currentUser: null,
currentRoute: 'setup',
availableGames: 1
});
},

setAvailableGames: (count) => {
const validCount = Math.max(0, count);
set(state => {
let updatedUser = state.currentUser;
if (updatedUser) {
updatedUser = { ...updatedUser, games_balance: validCount };
try {
localStorage.setItem('jalsah_user', JSON.stringify(updatedUser));
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
* تهيئة اللعبة وبناء اللوحة وشبكة الأسئلة
*/
initGame: (configuredTeams, selectedCategoryIds = ['sports', 'history', 'science', 'cinema', 'general', 'tech']) => {
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

const newBoard = catKeys.map((catKey, colIdx) => {
const meta = CATEGORIES_DATA.find(c => c.id === catKey) || CATEGORIES_DATA[0];
const questionsList = BATTLEGROUND_QUESTIONS[catKey] || BATTLEGROUND_QUESTIONS.general;
const ownerTeam = colIdx < 3 ? configuredTeams[0] : (configuredTeams[1] || configuredTeams[0]);

// 6 question tiles per category: [200, 200, 400, 400, 600, 600]
const pointTiers = [200, 200, 400, 400, 600, 600];
const tierCounters = { 200: 0, 400: 0, 600: 0 };

const tiles = pointTiers.map((pts, rowIdx) => {
const tierIdx = tierCounters[pts];
tierCounters[pts] += 1;

const matchingQuestions = questionsList.filter(q => q.points === pts);
const qData = matchingQuestions[tierIdx] || matchingQuestions[0] || questionsList[rowIdx % questionsList.length];

return {
id: `${catKey}-${pts}-${rowIdx}`,
categoryId: catKey,
categoryName: meta.name,
categoryMeta: meta,
points: pts,
isUsed: false,
status: 'available',
winnerTeamId: null,
isMystery: (rowIdx === 2 || rowIdx === 3) && colIdx % 2 === 0, // Mystery cue
question: qData
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

set({
gameStage: 'playing',
teams: configuredTeams.map((t, i) => {
const teamLoadout = t.loadout && t.loadout.length === 2
? t.loadout
: (i === 0 ? ['double', 'steal'] : ['freeze', 'fifty']);
return {
...t,
id: t.id || i + 1,
score: t.score || 0,
isFrozen: false,
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
},

// Alias for backward compatibility
startBattlegroundGame: (configuredTeams, selectedCategoryIds) => {
get().initGame(configuredTeams, selectedCategoryIds);
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

// Check points score
if (currentTeam.score < cost) {
set({
gameBanner: {
type: 'warning',
title: 'رصيد النقاط غير كافٍ!',
message: `تكلفة سلاح [${catalogItem.name}] هي ${cost} نقطة. رصيد فريقك الحالي هو ${currentTeam.score} نقطة. اكسب نقاطاً من الأسئلة أولاً!`
}
});
return;
}

// Deduct points cost from active team score
set(state => ({
teams: state.teams.map((t, idx) =>
idx === currentTurn ? { ...t, score: Math.max(0, t.score - cost) } : t
)
}));

if (powerupId === 'double') {
set({
activeModifier: 'double',
gameBanner: {
type: 'double',
title: 'تم تفعيل دبل النقاط (x2)!',
message: `تم خصم ${cost} نقطة. ستحصل على ضعف النقاط (x2) عند الإجابة الصحيحة على السؤال القادم!`
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
message: `تم خصم ${cost} نقطة. تم تجميد فريق [${rivalName}] وحرمانه من استخدام أي سلاح في دوره القادم!`
}
}));
confetti({ particleCount: 55, spread: 60 });
} else if (powerupId === 'steal') {
set({
isStealMode: true,
gameBanner: {
type: 'steal',
title: 'وضع سرقة السؤال مفعّل!',
message: `تم خصم ${cost} نقطة. اختر الآن أي سؤال متاح من فئات الفريق الخصم لسرقته وحرمانه منه نهائياً!`
}
});
confetti({ particleCount: 70, spread: 70 });
} else if (powerupId === 'fifty') {
const { activeQuestion } = get();
if (activeQuestion && activeQuestion.options && !get().isAnswerRevealed) {
const wrongOpts = activeQuestion.options.filter(o => o !== activeQuestion.correct_answer);
const shuffled = [...wrongOpts].sort(() => Math.random() - 0.5);
const toEliminate = shuffled.slice(0, 2);
set({
eliminatedOptions: toEliminate,
gameBanner: {
type: 'fifty',
title: 'تفعيل 50:50!',
message: `تم خصم ${cost} نقطة وحذف خيارين خاطئين!`
}
});
} else {
set({
activeModifier: 'fifty',
gameBanner: {
type: 'fifty',
title: 'تفعيل 50:50!',
message: `تم خصم ${cost} نقطة. سيتم حذف خيارين خاطئين فور فتح السؤال القادم!`
}
});
}
}
},

/**
* قاعدة القفل الديناميكية (Dynamic Locking Rule):
* هل هذا المستوى (points) مقفل للفريق صاحب الدور الحالي في هذه الفئة (categoryId)؟
*/
isLockedForCurrentTeam: (categoryId, points) => {
const { teams, currentTurn, teamLevelPicks } = get();
const currentTeam = teams[currentTurn];
if (!currentTeam || !teamLevelPicks || teamLevelPicks.length === 0) return false;
return teamLevelPicks.some(
p => p.teamId === currentTeam.id && p.categoryId === categoryId && p.points === points
);
},

/**
* تفعيل ميزة "تحدي العجلة" (Wheel Challenge)
* - متاح مرة واحدة فقط لكل فريق طوال الجلسة
* - يجبر الفريق على اختيار سؤال 400 نقطة حصراً من فئات الخصم
*/
activateWheelChallenge: () => {
const { teams, currentTurn, isWheelChallengeActive, questionModalOpen, wheelModalOpen } = get();
if (questionModalOpen || wheelModalOpen) return;
const currentTeam = teams[currentTurn];
if (!currentTeam || currentTeam.hasUsedWheel || isWheelChallengeActive) return;

set(state => ({
isWheelChallengeActive: true,
teams: state.teams.map((t, idx) => idx === currentTurn ? { ...t, hasUsedWheel: true } : t),
gameBanner: {
type: 'wheel_challenge',
title: 'تم تفعيل تحدي العجلة!',
message: `فريق [${currentTeam.name}]، يجب اختيار سؤال بقيمة 400 نقطة حصراً من فئات الفريق الخصم!`
}
}));
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
if (isLockedForCurrentTeam(category.categoryId, tile.points)) {
set({
gameBanner: {
type: 'warning',
title: 'مربع مقفل لفريقك!',
message: `فريق [${currentTeam.name}] أجاب مسبقاً على سؤال بقيمة ${tile.points} نقطة في فئة [${category.name || category.categoryName}]. اختر مستوى آخر!`
}
});
return;
}

// 2. Wheel Challenge restrictions: 400 points ONLY and Rival category ONLY!
if (isWheelChallengeActive) {
if (tile.points !== 400) {
set({
gameBanner: {
type: 'warning',
title: 'شرط تحدي العجلة!',
message: 'في تحدي العجلة، يجب اختيار سؤال بقيمة 400 نقطة حصراً!'
}
});
return;
}
if (!isRivalCategory) {
set({
gameBanner: {
type: 'warning',
title: 'فئة الخصم مطلوبة!',
message: 'في تحدي العجلة، يجب أن يكون السؤال من فئات الفريق الخصم!'
}
});
return;
}
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

set({
activeTile: fullTileData,
activeQuestion: tile.question,
selectedOption: null,
isAnswerRevealed: false,
isCorrect: null,
eliminatedOptions: [],
questionModalOpen: true,
activeModifier: isStealMode ? 'steal' : get().activeModifier
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
const available = col.tiles.find(t => !t.isUsed && t.is_available !== false);
if (available) {
stolen = { tile: available, col };
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
title: 'سرقة سؤال من الخصم!',
message: `عجلة الحظ سرقت سؤالاً بقيمة ${stolen.tile.points} نقطة لصالح [${targetTeam.name}]!`
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
* منطق احتساب النقاط وتتبع مستويات الأسئلة وتحدي العجلة
*/
handleAnswer: (isCorrect, pointsOverride) => {
const { activeTile, activeQuestion, activeModifier, isStealMode, isWheelChallengeActive, teams, currentTurn } = get();
if (!activeTile || !activeQuestion) return;

let basePoints = pointsOverride || activeTile.points || 200;
if (activeModifier === 'double') {
basePoints *= 2;
}

const currentTeam = teams[currentTurn];
const rivalTeam = teams.find(t => t.id !== currentTeam.id) || teams[(currentTurn + 1) % teams.length];

// Record question as seen in backend database
if (activeQuestion && typeof activeQuestion.id === 'number') {
try {
fetch(`${API_BASE}/game/record-seen`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ user_id: 1, question_ids: [activeQuestion.id] })
}).catch(() => {});
} catch (e) {}
}

// Dynamic Level Tracking Record
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
title: 'فوز بتحدي العجلة!',
message: `إجابة صحيحة! كسب فريق [${currentTeam.name}] ${basePoints} نقطة وسيتم تدوير العجلة لصالحه!`
};
} else if (isStealMode || activeModifier === 'steal') {
banner = {
type: 'steal_success',
title: 'تمت سرقة السؤال بنجاح!',
message: `أحسنت! كسب فريق [${currentTeam.name}] ${basePoints} نقطة وحُرم الخصم منها نهائياً!`
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
// Wrong answer
let banner = null;
if (isWheelChallengeActive) {
banner = {
type: 'wheel_loss',
title: 'خسارة تحدي العجلة!',
message: `إجابة خاطئة! كعقاب لفشلك في التحدي، ستطبق ميزة العجلة لصالح الفريق الخصم [${rivalTeam.name}]!`
};
} else if (isStealMode || activeModifier === 'steal') {
banner = {
type: 'steal_failed',
title: 'فشلت محاولة السرقة!',
message: `إجابة خاطئة! أهدر فريق [${currentTeam.name}] فرصة سرقة السؤال وتم حرق المربع.`
};
}

set(state => ({
teams: state.teams.map((t, idx) => {
if (idx === currentTurn) {
return { ...t, score: Math.max(0, t.score - Math.floor(basePoints / 2)) };
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
winnerTeamId: null
};
}
return tile;
})
})),
teamLevelPicks: [...state.teamLevelPicks, newPick],
isAnswerRevealed: true,
isCorrect: false,
isStealMode: false,
wheelChallengeBeneficiary: 'opponent',
gameBanner: banner || state.gameBanner
}));
}
},

/**
* اختيار إجابة من الخيارات الأربعة
*/
selectOption: (option) => {
const { isAnswerRevealed, activeQuestion, handleAnswer } = get();
if (isAnswerRevealed || !activeQuestion) return;

set({ selectedOption: option });
const isCorrect = option === activeQuestion.correct_answer;
handleAnswer(isCorrect);
},

/**
* منطق تناوب الأدوار (Turn Logic):
* دالة nextTurn تقوم بنقل اللعب للفريق التالي تلقائياً
*/
nextTurn: () => {
const { teams, currentTurn, board } = get();

// Check if game is completed (all tiles used)
const remainingTiles = board.reduce(
(acc, col) => acc + col.tiles.filter(t => !t.isUsed && t.is_available !== false).length,
0
);

if (remainingTiles === 0) {
confetti({ particleCount: 220, spread: 100, origin: { y: 0.5 } });
set({
gameStage: 'game_over',
questionModalOpen: false,
activeTile: null,
activeQuestion: null,
isStealMode: false,
isWheelChallengeActive: false,
activeModifier: null
});
return;
}

// Advance to next team
let nextIndex = (currentTurn + 1) % teams.length;
let nextTeam = teams[nextIndex];

let banner = null;
if (nextTeam.isFrozen) {
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
gameBanner: banner
});
},

/**
* إغلاق نافذة السؤال واستدعاء nextTurn أو فتح عجلة الحظ إذا كان التحدي مفعّلاً
*/
closeQuestionModal: () => {
const { isWheelChallengeActive } = get();
if (isWheelChallengeActive) {
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
set({
gameStage: 'setup',
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
}));

