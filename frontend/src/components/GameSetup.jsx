import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
Users,
Shield,
Zap,
Crown,
Flame,
Swords,
Sparkles,
Trophy,
Check,
ChevronRight,
ChevronLeft,
Plus,
Trash2,
Film,
Landmark,
Globe,
Atom,
HelpCircle,
Palette,
Sliders,
Rocket,
Timer,
CheckCircle2,
Dumbbell,
Laptop,
Tag,
Mail,
AlertTriangle,
RotateCw,
X,
Gift,
CreditCard,
Snowflake,
User
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGame } from '../context/GameContext';
import { CategoryCard } from './CategoryCard';
import { CATEGORIES_DATA, POWERUPS_CATALOG } from '../data/categoriesData';
import { AdminPromoManager } from './AdminPromoManager';
import { OTPScreen } from './OTPScreen';
import { API_BASE } from '../utils/api';
import { CheckoutModal } from './CheckoutModal';
import { AuthModal } from './AuthModal';
import logo from '../assets/logo.png';

// Palette definitions for Teams
const TEAM_CONFIGS = [
{
id: 1,
defaultName: 'فريق الصقور',
colorName: 'أرجواني',
bgLight: 'bg-purple-50',
border: 'border-purple-200 focus-within:border-purple-500',
ring: 'focus-within:ring-purple-500/20',
iconBg: 'bg-purple-600 text-white shadow-purple-200',
iconName: 'Shield',
accentText: 'text-purple-700'
},
{
id: 2,
defaultName: 'فريق الأسود',
colorName: 'برتقالي',
bgLight: 'bg-orange-50',
border: 'border-orange-200 focus-within:border-orange-500',
ring: 'focus-within:ring-orange-500/20',
iconBg: 'bg-orange-500 text-white shadow-orange-200',
iconName: 'Flame',
accentText: 'text-orange-700'
},
{
id: 3,
defaultName: 'فريق الذئاب',
colorName: 'زمردي',
bgLight: 'bg-emerald-50',
border: 'border-emerald-200 focus-within:border-emerald-500',
ring: 'focus-within:ring-emerald-500/20',
iconBg: 'bg-emerald-600 text-white shadow-emerald-200',
iconName: 'Zap',
accentText: 'text-emerald-700'
},
{
id: 4,
defaultName: 'فريق الصواعق',
colorName: 'وردي',
bgLight: 'bg-pink-50',
border: 'border-pink-200 focus-within:border-pink-500',
ring: 'focus-within:ring-pink-500/20',
iconBg: 'bg-pink-600 text-white shadow-pink-200',
iconName: 'Crown',
accentText: 'text-pink-700'
}
];

// Helper to render Lucide icon dynamically
const renderTeamIcon = (name, className = "w-5 h-5") => {
switch (name) {
case 'Shield': return <Shield className={className} />;
case 'Flame': return <Flame className={className} />;
case 'Zap': return <Zap className={className} />;
case 'Crown': return <Crown className={className} />;
case 'Swords': return <Swords className={className} />;
case 'Trophy': return <Trophy className={className} />;
default: return <Users className={className} />;
}
};

const categoryKeyByName = {
'رياضة ولياقة': 'sports',
'تاريخ وحضارات': 'history',
'علوم وفضاء': 'science',
'أفلام وسينما': 'cinema',
'ثقافة عامة': 'general',
'تكنولوجيا واختراعات': 'tech',
'جغرافيا وسفر': 'geography',
'فنون وأدب': 'arts'
};

export const GameSetup = () => {
const {
startBattlegroundGame,
availableGames,
setAvailableGames,
consumeGameSession,
currentUser,
setCurrentUser,
setGameMode
} = useGame();

const SETUP_STEP_KEY = 'jalsah_setup_step';
const SETUP_TEAMS_KEY = 'jalsah_setup_teams';
const SETUP_T1_CATS_KEY = 'jalsah_setup_t1_cats';
const SETUP_T2_CATS_KEY = 'jalsah_setup_t2_cats';

// Wizard Step State (1 to 4) - persisted across page refresh
const [currentStep, setCurrentStep] = useState(() => {
try {
const saved = localStorage.getItem(SETUP_STEP_KEY) || sessionStorage.getItem(SETUP_STEP_KEY);
const n = parseInt(saved, 10);
return (n >= 1 && n <= 4) ? n : 1;
} catch (e) {
return 1;
}
});

useEffect(() => {
try {
localStorage.setItem(SETUP_STEP_KEY, String(currentStep));
sessionStorage.setItem(SETUP_STEP_KEY, String(currentStep));
} catch (e) {}
}, [currentStep]);

// User Verification & Promo Code State
const [isOTPOpen, setIsOTPOpen] = useState(false);
const [isAdminPromoOpen, setIsAdminPromoOpen] = useState(false);
const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
const [isAuthOpen, setIsAuthOpen] = useState(false);
const [availableCategories, setAvailableCategories] = useState([]);
const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
const [categoriesError, setCategoriesError] = useState('');

const isVerified = currentUser ? !!currentUser.is_verified : true;
const userEmail = currentUser ? currentUser.email : 'ahmed@example.com';
const isAdmin = currentUser?.email === 'admin@jalsah.com' || currentUser?.username === 'admin_user';

// Promo Input in Setup
const [promoCodeInput, setPromoCodeInput] = useState('');
const [isApplyingPromo, setIsApplyingPromo] = useState(false);
const [promoFeedback, setPromoFeedback] = useState(null);
const [isLaunching, setIsLaunching] = useState(false);

// Questions Exhaustion Alert State
const [exhaustionAlert, setExhaustionAlert] = useState(null);

// Step 1: Teams State with Loadout (2 powerups per team) - persisted across refresh
const [teams, setTeams] = useState(() => {
try {
const saved = localStorage.getItem(SETUP_TEAMS_KEY) || sessionStorage.getItem(SETUP_TEAMS_KEY);
if (saved) return JSON.parse(saved);
} catch (e) {}
return [
{ id: 1, name: 'فريق الصقور', iconName: 'Shield', color: 'purple', loadout: ['double', 'steal'] },
{ id: 2, name: 'فريق الأسود', iconName: 'Flame', color: 'orange', loadout: ['freeze', 'fifty'] }
];
});

useEffect(() => {
try {
localStorage.setItem(SETUP_TEAMS_KEY, JSON.stringify(teams));
sessionStorage.setItem(SETUP_TEAMS_KEY, JSON.stringify(teams));
} catch (e) {}
}, [teams]);

// Step 2: Turn-based Category Selection (3 categories for Team 1, 3 for Team 2) - persisted across refresh
const [team1Categories, setTeam1Categories] = useState(() => {
try {
const saved = localStorage.getItem(SETUP_T1_CATS_KEY) || sessionStorage.getItem(SETUP_T1_CATS_KEY);
if (saved) return JSON.parse(saved);
} catch (e) {}
return [];
});

useEffect(() => {
try {
localStorage.setItem(SETUP_T1_CATS_KEY, JSON.stringify(team1Categories));
sessionStorage.setItem(SETUP_T1_CATS_KEY, JSON.stringify(team1Categories));
} catch (e) {}
}, [team1Categories]);

const [team2Categories, setTeam2Categories] = useState(() => {
try {
const saved = localStorage.getItem(SETUP_T2_CATS_KEY) || sessionStorage.getItem(SETUP_T2_CATS_KEY);
if (saved) return JSON.parse(saved);
} catch (e) {}
return [];
});

useEffect(() => {
try {
localStorage.setItem(SETUP_T2_CATS_KEY, JSON.stringify(team2Categories));
sessionStorage.setItem(SETUP_T2_CATS_KEY, JSON.stringify(team2Categories));
} catch (e) {}
}, [team2Categories]);

const [categorySelectingTeam, setCategorySelectingTeam] = useState(0); // 0 = Team 1, 1 = Team 2

const selectedCategories = [...team1Categories, ...team2Categories];

useEffect(() => {
const loadCategories = async () => {
try {
const response = await fetch(`${API_BASE}/categories/?limit=100`);
if (!response.ok) throw new Error('تعذر تحميل الفئات من قاعدة البيانات.');
const databaseCategories = await response.json();
const GRADIENT_COLORS = [
  'from-purple-600 to-indigo-600',
  'from-orange-500 to-amber-500',
  'from-blue-600 to-cyan-500',
  'from-rose-500 to-pink-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-yellow-500',
  'from-violet-600 to-purple-700',
  'from-teal-500 to-emerald-600'
];

const mappedCategories = databaseCategories.map((category, idx) => ({
  id: category.id,
  dbId: category.id,
  name: category.name,
  desc: category.description || 'فئة التحدي والأسئلة',
  imageUrl: category.image_url || null,
  color: GRADIENT_COLORS[idx % GRADIENT_COLORS.length],
  iconName: 'Sparkles',
  count: 6
}));

setAvailableCategories(mappedCategories);
setTeam1Categories(prev1 => {
  if (prev1 && prev1.length > 0) return prev1;
  if (mappedCategories.length >= 6) {
    return mappedCategories.slice(0, 3).map((c) => c.id);
  }
  const half = Math.ceil(mappedCategories.length / 2);
  return mappedCategories.slice(0, half).map((c) => c.id);
});
setTeam2Categories(prev2 => {
  if (prev2 && prev2.length > 0) return prev2;
  if (mappedCategories.length >= 6) {
    return mappedCategories.slice(3, 6).map((c) => c.id);
  }
  const half = Math.ceil(mappedCategories.length / 2);
  return mappedCategories.slice(half).map((c) => c.id);
});
} catch (error) {
setCategoriesError(error.message || 'تعذر تحميل الفئات.');
} finally {
setIsCategoriesLoading(false);
}
};

loadCategories();
}, []);

// Step 3: Game Settings
const [questionCount, setQuestionCount] = useState(10);
const [enablePowerups, setEnablePowerups] = useState(true);
const [enableTimer, setEnableTimer] = useState(true);
const [enableBonusRounds, setEnableBonusRounds] = useState(true);

// Stepper metadata
const STEPS = [
{ number: 1, title: 'الفرق', desc: 'تحديد الفرق', icon: Users },
{ number: 2, title: 'الفئات', desc: 'مجالات بالتناوب', icon: Sparkles },
{ number: 3, title: 'الأسلحة', desc: 'تجهيز السلاحين', icon: Swords },
{ number: 4, title: 'الانطلاق', desc: 'مراجعة وتحدي', icon: Rocket }
];

// Team handling
const handleTeamNameChange = (id, newName) => {
setTeams(prev => prev.map(t => t.id === id ? { ...t, name: newName } : t));
};

const handleTeamIconChange = (id, iconName) => {
setTeams(prev => prev.map(t => t.id === id ? { ...t, iconName } : t));
};

// Toggle power-up in loadout (max 2 per team)
const handleToggleLoadout = (teamId, powerupId) => {
setTeams(prev => prev.map(t => {
if (t.id !== teamId) return t;
const currentLoadout = t.loadout || [];
if (currentLoadout.includes(powerupId)) {
return {
...t,
loadout: currentLoadout.filter(id => id !== powerupId)
};
} else {
if (currentLoadout.length >= 2) {
return {
...t,
loadout: [currentLoadout[1], powerupId]
};
} else {
return {
...t,
loadout: [...currentLoadout, powerupId]
};
}
}
}));
};

const addTeam = () => {
if (teams.length >= 4) return;
const nextId = teams.length + 1;
const config = TEAM_CONFIGS[nextId - 1] || TEAM_CONFIGS[0];
setTeams(prev => [
...prev,
{
id: nextId,
name: config.defaultName,
iconName: config.iconName,
color: config.colorName === 'زمردي' ? 'emerald' : 'pink',
loadout: ['double', 'steal']
}
]);
};

const removeTeam = (id) => {
if (teams.length <= 2) return;
setTeams(prev => prev.filter(t => t.id !== id));
};

// Turn-based Category toggle
const toggleCategory = (catId) => {
if (categorySelectingTeam === 0) {
// Team 1 is choosing (max 3)
if (team1Categories.includes(catId)) {
setTeam1Categories(prev => prev.filter(id => id !== catId));
} else {
if (team2Categories.includes(catId)) return; // Already picked by Team 2
if (team1Categories.length < 3) {
const next = [...team1Categories, catId];
setTeam1Categories(next);
// Automatically advance to Team 2 once 3 categories are chosen!
if (next.length === 3) {
setCategorySelectingTeam(1);
confetti({ particleCount: 50, spread: 60, origin: { y: 0.55 } });
}
}
}
} else {
// Team 2 is choosing (max 3) - Categories chosen by Team 1 are strictly DISABLED
if (team1Categories.includes(catId)) return;
if (team2Categories.includes(catId)) {
setTeam2Categories(prev => prev.filter(id => id !== catId));
} else {
if (team2Categories.length < 3) {
const next = [...team2Categories, catId];
setTeam2Categories(next);
if (next.length === 3) {
confetti({ particleCount: 65, spread: 70, origin: { y: 0.55 } });
}
}
}
}
};

// Step navigation
const nextStep = () => {
if (currentStep === 2) {
if (team1Categories.length < 3) {
setCategorySelectingTeam(0);
return;
}
if (team2Categories.length < 3) {
setCategorySelectingTeam(1);
return;
}
}
if (currentStep === 3) {
// Ensure all teams have selected 2 weapons
setTeams(prev => prev.map((t, idx) => {
let l = t.loadout ? [...t.loadout] : [];
const fallback = idx === 0 ? ['double', 'steal'] : ['freeze', 'fifty'];
while (l.length < 2) {
const nextW = fallback.find(w => !l.includes(w)) || POWERUPS_CATALOG.find(p => !l.includes(p.id))?.id || 'double';
l.push(nextW);
}
return { ...t, loadout: l.slice(0, 2) };
}));
}
if (currentStep < 4) setCurrentStep(prev => prev + 1);
};

const prevStep = () => {
if (currentStep > 1) setCurrentStep(prev => prev - 1);
};

// Apply Promo Code
const handleApplyPromo = async (e) => {
e?.preventDefault();
if (!promoCodeInput.trim()) return;

setIsApplyingPromo(true);
setPromoFeedback(null);

try {
const token = localStorage.getItem('jalsah_access_token');
const res = await fetch(`${API_BASE}/promo/apply`, {
method: 'POST',
headers: {
'Content-Type': 'application/json',
...(token ? { Authorization: `Bearer ${token}` } : {})
},
body: JSON.stringify({
code: promoCodeInput.trim(),
user_id: currentUser?.id || null
})
});

const data = await res.json();

if (!res.ok) {
throw new Error(data.detail || 'الكود غير صالح أو تم استخدامه مسبقاً');
}

const gamesAdded = data.games_reward || 2;
const updatedBalance = data.new_balance !== undefined ? data.new_balance : (availableGames + gamesAdded);
setAvailableGames(updatedBalance);
setPromoFeedback({
type: 'success',
text: ` تم تفعيل الكود بنجاح (+${gamesAdded} ألعاب مجانية)! إجمالي رصيدك الآن: ${updatedBalance} ألعاب.`
});
confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
setPromoCodeInput('');
} catch (err) {
setPromoFeedback({
type: 'error',
text: err.message
});
} finally {
setIsApplyingPromo(false);
}
};

// Final submit & Launch game
const handleLaunchGame = async () => {
if (isLaunching) return;

// 1. Verify User status
if (!isVerified) {
setIsOTPOpen(true);
return;
}

// 2. Check games balance strictly
if (availableGames <= 0) {
setPromoFeedback({
type: 'error',
text: 'نفد رصيدك من الألعاب! يرجى شحن رصيدك عبر باقات الألعاب أو إدخال برومو كود للحصول على جولات جديدة.'
});
return;
}

setIsLaunching(true);
setPromoFeedback(null);

try {
// 3. Atomically consume 1 game session on backend first
const token = localStorage.getItem('jalsah_access_token');
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
setPromoFeedback({
type: 'error',
text: errorData.detail || 'نفد رصيدك من الألعاب! يرجى شحن رصيدك لتتمكن من خوض جولة جديدة.'
});
setAvailableGames(0);
setIsLaunching(false);
return;
}

const consumeData = await consumeRes.json();
const updatedBalance = typeof consumeData.remaining_games === 'number'
? consumeData.remaining_games
: Math.max(0, availableGames - 1);
setAvailableGames(updatedBalance);

const validatedTeams = teams.map((t, idx) => ({
...t,
name: t.name.trim() || `فريق ${idx + 1}`,
loadout: t.loadout && t.loadout.length === 2 ? t.loadout : (idx === 0 ? ['double', 'steal'] : ['freeze', 'fifty'])
}));

try {
localStorage.removeItem(SETUP_STEP_KEY);
localStorage.removeItem(SETUP_TEAMS_KEY);
localStorage.removeItem(SETUP_T1_CATS_KEY);
localStorage.removeItem(SETUP_T2_CATS_KEY);
sessionStorage.removeItem(SETUP_STEP_KEY);
sessionStorage.removeItem(SETUP_TEAMS_KEY);
sessionStorage.removeItem(SETUP_T1_CATS_KEY);
sessionStorage.removeItem(SETUP_T2_CATS_KEY);
} catch (e) {}

await startBattlegroundGame(validatedTeams, selectedCategories);
} catch (err) {
console.error('Launch game failed:', err);
setPromoFeedback({
type: 'error',
text: 'حدث خطأ أثناء بدء الجلسة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.'
});
} finally {
setIsLaunching(false);
}
};

// Slide Animation Variants
const slideVariants = {
initial: { opacity: 0, x: -20, scale: 0.98 },
animate: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } },
exit: { opacity: 0, x: 20, scale: 0.98, transition: { duration: 0.2, ease: 'easeIn' } }
};

return (
<div className="w-full min-h-screen bg-slate-50 text-slate-800 flex flex-col items-center py-6 px-4 font-sans select-none selection:bg-purple-100 selection:text-purple-900" dir="rtl">
{/* ================= TOP UTILITY BAR (BALANCES, USER PROFILE, PROMO, OTP, PAYPAL) ================= */}
<div className="w-full max-w-3xl mb-4 flex flex-wrap items-center justify-between gap-3 px-2">
{/* User Account & Games Balance Badges */}
<div className="flex flex-wrap items-center gap-2">
{/* User Profile / Switcher Button */}
<button
type="button"
onClick={() => setIsAuthOpen(true)}
className="px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 shadow-sm flex items-center gap-2 text-xs font-black text-slate-800 transition-all cursor-pointer active:scale-95 group"
title="إدارة الحساب وتسجيل الدخول"
>
<div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white ${
isAdmin ? 'bg-amber-500' : 'bg-purple-600'
}`}>
{isAdmin ? <Crown className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
</div>
<span>{currentUser ? currentUser.username : 'تسجيل الدخول'}</span>
{isAdmin ? (
<span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-bold">
Admin 
</span>
) : (
<span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-md font-bold">
لاعب 
</span>
)}
</button>

{/* Games Balance Badge */}
<div className="px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center gap-2 text-xs font-black text-slate-800">
<Gift className="w-4 h-4 text-orange-500 animate-pulse" />
<span>رصيد الجولات:</span>
<span className="px-2 py-0.5 rounded-lg bg-orange-100 text-orange-800 text-xs font-black">
{availableGames} ألعاب
</span>
</div>

{/* Verification Status */}
{isVerified ? (
<span className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
<CheckCircle2 className="w-3.5 h-3.5" />
<span>حساب موثق</span>
</span>
) : (
<button
onClick={() => setIsOTPOpen(true)}
className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm cursor-pointer"
>
<Mail className="w-3.5 h-3.5 text-amber-600" />
<span>توثيق الإيميل (OTP)</span>
</button>
)}
</div>

<div className="flex items-center gap-2">
{/* Admin Promo Codes Button */}
{isAdmin && (
<button
onClick={() => setIsAdminPromoOpen(true)}
className="px-3 py-1.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-black transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
title="فتح لوحة إدارة البرومو كود للمدير"
>
<Tag className="w-3.5 h-3.5 text-purple-600" />
<span>إدارة الأكواد </span>
</button>
)}

{/* Buy Games Packages with PayPal Button */}
<button
onClick={() => setIsCheckoutOpen(true)}
className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
title="شراء باقات ألعاب عبر PayPal"
>
<CreditCard className="w-3.5 h-3.5" />
<span>باقات الألعاب </span>
</button>
</div>
</div>

{/* ================= TOP HEADER & 3D LOGO (كلمة جلسة بدون اليد وبدون local party) ================= */}
<div className="text-center mb-6 flex flex-col items-center">
<motion.div
initial={{ opacity: 0, y: -15 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
className="relative inline-block mb-3"
>
<div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white p-2 shadow-[0_12px_30px_rgba(124,58,237,0.12)] border border-slate-100 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
<img
src={logo}
alt="جلسة"
className="w-full h-full object-contain drop-shadow"
/>
</div>
</motion.div>

<motion.h1
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 0.15 }}
className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-1"
>
إعداد الجلسة والتحدي
</motion.h1>
<p className="text-slate-500 text-xs sm:text-sm max-w-md font-medium">
خطوات بسيطة لتخصيص الفرق والقوانين للمنافسة على الشاشة المشتركة
</p>
</div>

{/* ================= GAME MODE SELECTOR ================= */}
<div className="w-full max-w-3xl mb-6 flex items-center justify-center">
  <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-2 w-full sm:w-auto">
    <button
      type="button"
      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs sm:text-sm shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 transition"
    >
      <Trophy className="w-4 h-4 text-amber-300" />
      <span>جلسة التحدي (Jeopardy)</span>
    </button>

    <button
      type="button"
      onClick={() => setGameMode('spy')}
      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 font-black text-xs sm:text-sm border border-transparent hover:border-amber-200 flex items-center justify-center gap-2 transition group cursor-pointer"
    >
      <span className="text-base group-hover:scale-110 transition-transform">🕵️‍♂️</span>
      <span>مين الدسوس؟</span>
      <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[10px] text-white font-extrabold shadow-sm">
        جديد
      </span>
    </button>
  </div>
</div>

{/* Stepper Progress Bar */}
<div className="w-full max-w-3xl mb-8">
<div className="bg-white rounded-3xl p-3.5 sm:p-5 shadow-[0_10px_30px_rgba(124,58,237,0.06)] border border-slate-100">
<div className="grid grid-cols-4 gap-2 relative">
<div className="absolute top-5 left-[12%] right-[12%] h-1 bg-slate-100 -z-0 rounded-full">
<div
className="h-full bg-gradient-to-r from-purple-600 to-orange-500 transition-all duration-500 rounded-full"
style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
/>
</div>

{STEPS.map((step) => {
const isPassed = currentStep > step.number;
const isCurrent = currentStep === step.number;
const StepIcon = step.icon;

return (
<div key={step.number} className="flex flex-col items-center relative z-10 text-center">
<div
className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
isPassed
? 'bg-purple-600 text-white shadow-md shadow-purple-500/25'
: isCurrent
? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 ring-4 ring-purple-100 scale-110'
: 'bg-white text-slate-400 border border-slate-200'
}`}
>
{isPassed ? <Check className="w-5 h-5 stroke-[2.5]" /> : <StepIcon className="w-5 h-5" />}
</div>

<span
className={`mt-2 text-xs font-bold transition-colors ${
isCurrent ? 'text-purple-700 font-black' : isPassed ? 'text-slate-700' : 'text-slate-400'
}`}
>
{step.title}
</span>
</div>
);
})}
</div>
</div>
</div>

{/* Main Wizard Step Box */}
<div className="w-full max-w-3xl">
<div className="bg-white rounded-3xl p-6 sm:p-10 shadow-[0_15px_35px_rgba(124,58,237,0.06)] border border-slate-100/80 min-h-[460px] flex flex-col justify-between">
<AnimatePresence mode="wait">
{/* ================= STEP 1: TEAMS ================= */}
{currentStep === 1 && (
<motion.div
key="step1"
variants={slideVariants}
initial="initial"
animate="animate"
exit="exit"
className="space-y-6"
>
<div className="flex items-center justify-between border-b border-slate-100 pb-4">
<div>
<h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
<Users className="w-6 h-6 text-purple-600" />
الفرق المتنافسة
</h2>
<p className="text-xs text-slate-500 mt-0.5">
أضف أسماء الفرق (من فريقين إلى 4 فرق)
</p>
</div>

{teams.length < 4 && (
<button
type="button"
onClick={addTeam}
className="px-4 py-2 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200/80 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
>
<Plus className="w-4 h-4" />
<span>إضافة فريق</span>
</button>
)}
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
{teams.map((team, index) => {
const cfg = TEAM_CONFIGS[index] || TEAM_CONFIGS[0];
return (
<motion.div
key={team.id}
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
className={`p-4 rounded-3xl border-2 transition-all ${cfg.bgLight} ${cfg.border} shadow-sm`}
>
<div className="flex items-center justify-between mb-3">
<span className={`text-xs font-black ${cfg.accentText}`}>
الفريق {index + 1}
</span>
{teams.length > 2 && (
<button
type="button"
onClick={() => removeTeam(team.id)}
className="text-slate-400 hover:text-rose-500 transition-colors p-1"
title="حذف الفريق"
>
<Trash2 className="w-4 h-4" />
</button>
)}
</div>

<div className="flex items-center gap-3">
<div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${cfg.iconBg}`}>
{renderTeamIcon(team.iconName, 'w-5 h-5 text-white')}
</div>

<div className="flex-1">
<input
type="text"
value={team.name}
onChange={(e) => handleTeamNameChange(team.id, e.target.value)}
placeholder={`اسم الفريق ${index + 1}`}
className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm font-bold focus:outline-none focus:border-purple-500 shadow-sm"
/>
</div>
</div>
</motion.div>
);
})}
</div>
</motion.div>
)}

{/* ================= STEP 2: TURN-BASED CATEGORIES SELECTION ================= */}
{currentStep === 2 && (
<motion.div
key="step2"
variants={slideVariants}
initial="initial"
animate="animate"
exit="exit"
className="space-y-5"
>
{isCategoriesLoading && (
<div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-bold text-center">
جاري تحميل الفئات من قاعدة البيانات...
</div>
)}
{categoriesError && (
<div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold text-center">
{categoriesError}
</div>
)}
{!isCategoriesLoading && !categoriesError && availableCategories.length < 6 && (
<div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold text-center">
يجب إضافة 6 فئات على الأقل في قاعدة البيانات قبل بدء اللعبة. الفئات الحالية: {availableCategories.length}
</div>
)}
{/* Header */}
<div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
<div>
<h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
<Sparkles className="w-6 h-6 text-orange-500" />
<span>اختيار الفئات بالتناوب بين الفرق</span>
</h2>
<p className="text-xs text-slate-500 mt-0.5">
يختار كل فريق 3 فئات تمثل نقاط قوته لتشكيل لوحة التحدي المكونة من 6 فئات
</p>
</div>

<div className="flex items-center gap-2">
<span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-black border border-purple-200 shadow-xs">
{team1Categories.length + team2Categories.length} من 6 فئات مكتملة
</span>
</div>
</div>

{/* Turn-based Active Picking Banner */}
<motion.div
key={categorySelectingTeam}
initial={{ opacity: 0, y: -8 }}
animate={{ opacity: 1, y: 0 }}
className={`p-4 rounded-3xl border-2 shadow-md transition-all flex flex-wrap items-center justify-between gap-4 ${
categorySelectingTeam === 0
? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white border-purple-400/50 shadow-purple-600/15'
: 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white border-orange-300/50 shadow-orange-500/15'
}`}
>
<div className="flex items-center gap-3">
<div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-sm font-black">
{categorySelectingTeam === 0 ? <Shield className="w-6 h-6" /> : <Flame className="w-6 h-6" />}
</div>

<div>
<div className="flex items-center gap-2">
<span className="w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
<h3 className="text-sm sm:text-base font-black">
{categorySelectingTeam === 0
? `دور [${teams[0]?.name || 'فريق 1'}] لاختيار 3 فئات`
: `دور [${teams[1]?.name || 'فريق 2'}] لاختيار 3 فئات`}
</h3>
</div>
<p className="text-[11px] sm:text-xs opacity-90 font-medium mt-0.5">
{categorySelectingTeam === 0
? `حدد 3 فئات لفريقك. المتبقي: ${3 - team1Categories.length} فئات (سينتقل الدور تلقائياً للفريق الثاني)`
: `حدد 3 فئات إضافية لفريقك. فئات الفريق الأول معطلة لتفادي التكرار. المتبقي: ${3 - team2Categories.length} فئات`}
</p>
</div>
</div>

{/* Manual Team Switcher Pill Buttons */}
<div className="flex items-center gap-2">
<button
type="button"
onClick={() => setCategorySelectingTeam(0)}
className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
categorySelectingTeam === 0
? 'bg-white text-purple-900 border-white shadow-sm scale-105'
: 'bg-white/20 text-white border-white/30 hover:bg-white/30'
}`}
>
<Shield className="w-3.5 h-3.5" />
<span>{teams[0]?.name || 'الفريق 1'}</span>
<span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[10px]">
{team1Categories.length}/3
</span>
</button>

<button
type="button"
onClick={() => setCategorySelectingTeam(1)}
className={`px-3 py-1.5 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 border cursor-pointer ${
categorySelectingTeam === 1
? 'bg-white text-orange-900 border-white shadow-sm scale-105'
: 'bg-white/20 text-white border-white/30 hover:bg-white/30'
}`}
>
<Flame className="w-3.5 h-3.5" />
<span>{teams[1]?.name || 'الفريق 2'}</span>
<span className="px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-800 text-[10px]">
{team2Categories.length}/3
</span>
</button>
</div>
</motion.div>

{/* Categories Grid (with disabled state for categories chosen by the other team) */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
{availableCategories.map((cat) => {
const isChosenByTeam1 = team1Categories.includes(cat.id);
const isChosenByTeam2 = team2Categories.includes(cat.id);

// If Team 1 is choosing:
// - Disabled if Team 2 picked it
// If Team 2 is choosing:
// - Disabled if Team 1 picked it
const isDisabled = categorySelectingTeam === 0
? isChosenByTeam2
: isChosenByTeam1;

const disabledMsg = isDisabled
? categorySelectingTeam === 0
? `اختارها ${teams[1]?.name || 'الخصم'}`
: `اختارها ${teams[0]?.name || 'الفريق 1'}`
: null;

const isSelected = categorySelectingTeam === 0 ? isChosenByTeam1 : isChosenByTeam2;
const selectionMsg = isSelected
? categorySelectingTeam === 0
? teams[0]?.name
: teams[1]?.name
: null;

return (
<CategoryCard
key={cat.id}
category={cat}
isSelected={isSelected}
disabled={isDisabled}
disabledBadge={disabledMsg}
selectionBadge={selectionMsg}
onToggle={toggleCategory}
/>
);
})}
</div>

{/* Bottom Summary: Selected Categories Breakdown per Team */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
{/* Team 1 Summary */}
<div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80">
<div className="flex items-center justify-between mb-2">
<span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
<Shield className="w-3.5 h-3.5 text-purple-600" />
<span>فئات [{teams[0]?.name}]:</span>
</span>
<span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-200/80 text-purple-800">
{team1Categories.length} من 3 فئات
</span>
</div>
<div className="flex flex-wrap gap-1.5">
{team1Categories.length > 0 ? (
team1Categories.map(cId => {
const cMeta = availableCategories.find(c => c.id === cId);
return (
<span key={cId} className="px-2.5 py-1 rounded-xl bg-white border border-purple-200 text-purple-800 text-[11px] font-bold shadow-2xs flex items-center gap-1">
<span>{cMeta?.emoji || ''}</span>
<span>{cMeta?.name}</span>
</span>
);
})
) : (
<span className="text-[11px] text-slate-400 font-medium">لم يتم اختيار أي فئة بعد</span>
)}
</div>
</div>

{/* Team 2 Summary */}
<div className="p-3.5 rounded-2xl bg-orange-50/70 border border-orange-200/80">
<div className="flex items-center justify-between mb-2">
<span className="text-xs font-black text-orange-900 flex items-center gap-1.5">
<Flame className="w-3.5 h-3.5 text-orange-600" />
<span>فئات [{teams[1]?.name}]:</span>
</span>
<span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-200/80 text-orange-800">
{team2Categories.length} من 3 فئات
</span>
</div>
<div className="flex flex-wrap gap-1.5">
{team2Categories.length > 0 ? (
team2Categories.map(cId => {
const cMeta = availableCategories.find(c => c.id === cId);
return (
<span key={cId} className="px-2.5 py-1 rounded-xl bg-white border border-orange-200 text-orange-800 text-[11px] font-bold shadow-2xs flex items-center gap-1">
<span>{cMeta?.emoji || ''}</span>
<span>{cMeta?.name}</span>
</span>
);
})
) : (
<span className="text-[11px] text-slate-400 font-medium">لم يتم اختيار أي فئة بعد</span>
)}
</div>
</div>
</div>
</motion.div>
)}

{/* ================= STEP 3: TACTICAL POWER-UPS LOADOUT ================= */}
{currentStep === 3 && (
<motion.div
key="step3"
variants={slideVariants}
initial="initial"
animate="animate"
exit="exit"
className="space-y-6"
>
<div className="border-b border-slate-100 pb-4">
<div className="flex items-center justify-between">
<div>
<h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
<Swords className="w-6 h-6 text-purple-600" />
تجهيز الأسلحة التكتيكية (Loadout)
</h2>
<p className="text-xs text-slate-500 mt-0.5">
اختر <span className="font-bold text-purple-700">سلاحين فقط</span> لكل فريق لاستخدامهما في اللعبة بنظام تكلفة النقاط
</p>
</div>
<div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-50 text-purple-700 text-xs font-black border border-purple-200">
<Sparkles className="w-3.5 h-3.5" />
<span>سلاحين لكل فريق</span>
</div>
</div>
</div>

{/* Loadout selection for each team */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">
{teams.map((team, teamIndex) => {
const teamLoadout = team.loadout || [];
const isSelectedCount = teamLoadout.length;

return (
<div
key={team.id}
className={`p-5 rounded-3xl border-2 transition-all ${
teamIndex === 0
? 'bg-purple-50/40 border-purple-200'
: 'bg-orange-50/40 border-orange-200'
}`}
>
{/* Team Loadout Header */}
<div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-200/80">
<div className="flex items-center gap-2.5">
<div
className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${
teamIndex === 0 ? 'bg-purple-600' : 'bg-orange-500'
}`}
>
{renderTeamIcon(team.iconName, 'w-5 h-5')}
</div>
<div>
<h4 className="text-sm font-black text-slate-900">{team.name}</h4>
<span className="text-[10px] text-slate-500 font-semibold">عتاد الفريق</span>
</div>
</div>

<div
className={`px-3 py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 ${
isSelectedCount === 2
? 'bg-emerald-50 text-emerald-700 border-emerald-300'
: 'bg-amber-50 text-amber-700 border-amber-300'
}`}
>
<span>{isSelectedCount} / 2</span>
<span>{isSelectedCount === 2 ? 'مكتمل ' : 'اختر سلاحين'}</span>
</div>
</div>

{/* Power-ups Catalog Grid */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
{POWERUPS_CATALOG.map((powerup) => {
const isPicked = teamLoadout.includes(powerup.id);
return (
<button
key={powerup.id}
type="button"
onClick={() => handleToggleLoadout(team.id, powerup.id)}
className={`p-3 rounded-2xl border-2 text-right transition-all flex flex-col justify-between relative cursor-pointer ${
isPicked
? teamIndex === 0
? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 scale-[1.02]'
: 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20 scale-[1.02]'
: 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
}`}
>
<div className="flex items-center justify-between w-full mb-1.5">
<div className="flex items-center gap-1.5">
<span className="text-base">{powerup.emoji}</span>
<span className="text-xs font-black">{powerup.name}</span>
</div>
<span
className={`text-[10px] font-black px-2 py-0.5 rounded-lg ${
isPicked
? 'bg-white/20 text-white'
: 'bg-slate-100 text-slate-600'
}`}
>
{powerup.cost} نقطة
</span>
</div>

<p
className={`text-[10px] font-medium leading-tight ${
isPicked ? 'text-purple-100' : 'text-slate-500'
}`}
>
{powerup.desc}
</p>

{isPicked && (
<div className="absolute top-2 left-2 w-4 h-4 rounded-full bg-white text-purple-700 flex items-center justify-center text-[10px] font-black shadow-xs">

</div>
)}
</button>
);
})}
</div>
</div>
);
})}
</div>
</motion.div>
)}

{/* ================= STEP 4: LAUNCH & PROMO CODE REDEMPTION ================= */}
{currentStep === 4 && (
<motion.div
key="step4"
variants={slideVariants}
initial="initial"
animate="animate"
exit="exit"
className="space-y-5"
>
<div className="border-b border-slate-100 pb-4 text-center">
<h2 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
<Rocket className="w-7 h-7 text-orange-500" />
جاهزون للانطلاق!
</h2>
<p className="text-xs text-slate-500 mt-1">
راجع ملخص الجلسة والأسلحة، ويمكنك إدخال برومو كود للحصول على ألعاب إضافية
</p>
</div>

{/* Match Summary Card with Loadout */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
<div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80">
<span className="text-xs font-black text-purple-700 flex items-center gap-1.5 mb-2.5">
<Users className="w-4 h-4" /> الفرق والعتاد التكتيكي:
</span>
<div className="space-y-2">
{teams.map((t) => (
<div key={t.id} className="p-2 rounded-xl bg-white border border-purple-100 shadow-xs flex items-center justify-between">
<div className="flex items-center gap-2">
<div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
{renderTeamIcon(t.iconName, 'w-3.5 h-3.5')}
</div>
<span className="text-xs font-bold text-slate-800">{t.name}</span>
</div>
<div className="flex items-center gap-1">
{(t.loadout || []).map((wId) => {
const weapon = POWERUPS_CATALOG.find(p => p.id === wId);
return (
<span
key={wId}
className="text-[10px] font-black px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 flex items-center gap-1"
>
<span>{weapon?.emoji}</span>
<span>{weapon?.shortName || wId}</span>
</span>
);
})}
</div>
</div>
))}
</div>
</div>

<div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/80 flex flex-col justify-between">
<div>
<span className="text-xs font-black text-orange-700 flex items-center gap-1.5 mb-2">
<Sparkles className="w-4 h-4" /> فئات التحدي الـ 6 بالتناوب:
</span>
<div className="space-y-1.5 mb-3 text-xs">
<div className="flex items-center gap-1.5 flex-wrap">
<span className="font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md text-[10px]">
{teams[0]?.name}:
</span>
<span className="text-slate-800 font-bold">
{team1Categories.map(cId => availableCategories.find(c => c.id === cId)?.name).filter(Boolean).join(' • ')}
</span>
</div>
<div className="flex items-center gap-1.5 flex-wrap">
<span className="font-bold text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-md text-[10px]">
{teams[1]?.name}:
</span>
<span className="text-slate-800 font-bold">
{team2Categories.map(cId => availableCategories.find(c => c.id === cId)?.name).filter(Boolean).join(' • ')}
</span>
</div>
</div>
</div>

{/* Quick Settings Toggles */}
<div className="pt-2 border-t border-orange-200/60 flex items-center justify-between text-xs">
<span className="font-bold text-slate-700 flex items-center gap-1">
<Timer className="w-3.5 h-3.5 text-orange-600" />
مؤقت 30 ثانية لكل سؤال
</span>
<button
type="button"
onClick={() => setEnableTimer(!enableTimer)}
className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
enableTimer ? 'bg-orange-500' : 'bg-slate-300'
}`}
>
<div className={`w-4 h-4 rounded-full bg-white transition-transform ${
enableTimer ? 'translate-x-0' : '-translate-x-5'
}`} />
</button>
</div>
</div>
</div>

{/* ================= PROMO CODE INPUT CARD ================= */}
<div className="p-4 rounded-2xl bg-gradient-to-r from-orange-50/80 via-white to-purple-50/80 border border-orange-200/80 shadow-sm text-right">
<div className="flex items-center gap-2 mb-2">
<Tag className="w-4 h-4 text-orange-600" />
<span className="text-xs font-black text-slate-800">
هل لديك برومو كود؟ (ألعاب مجانية)
</span>
</div>

<form onSubmit={handleApplyPromo} className="flex gap-2">
<input
type="text"
placeholder="أدخل الرمز هنا (مثال: JALSAH2026)"
value={promoCodeInput}
onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono font-bold text-xs uppercase focus:border-orange-500 outline-none"
/>
<button
type="submit"
disabled={isApplyingPromo || !promoCodeInput.trim()}
className="px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
>
{isApplyingPromo ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <span>تفعيل</span>}
</button>
</form>

{/* Promo feedback */}
{promoFeedback && (
<motion.div
initial={{ opacity: 0, y: -4 }}
animate={{ opacity: 1, y: 0 }}
className={`mt-2 p-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
promoFeedback.type === 'success'
? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
: 'bg-rose-50 text-rose-700 border border-rose-200'
}`}
>
{promoFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
<span>{promoFeedback.text}</span>
</motion.div>
)}
</div>

{/* Big Vibrant Call To Action */}
<div className="pt-2">
<motion.button
whileHover={!isLaunching && availableGames > 0 ? { scale: 1.02 } : {}}
whileTap={!isLaunching && availableGames > 0 ? { scale: 0.98 } : {}}
type="button"
disabled={isLaunching || availableGames <= 0}
onClick={handleLaunchGame}
className={`w-full py-4 sm:py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 ${
availableGames <= 0
? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300 shadow-none'
: isLaunching
? 'bg-purple-700 text-white cursor-wait opacity-90'
: 'bg-gradient-to-r from-orange-500 via-amber-500 to-purple-600 text-white shadow-[0_15px_35px_rgba(249,115,22,0.3)] cursor-pointer'
}`}
>
{isLaunching ? (
<>
<RotateCw className="w-6 h-6 animate-spin" />
<span>جاري تجهيز الجلسة والأسئلة...</span>
</>
) : availableGames <= 0 ? (
<>
<AlertTriangle className="w-6 h-6 text-amber-500" />
<span>نفد رصيدك من الألعاب (شحن الرصيد مطلوب)</span>
</>
) : (
<>
<span>ابدأ التحدي الآن</span>
<Rocket className="w-6 h-6 stroke-[2.5]" />
</>
)}
</motion.button>
{availableGames <= 0 && (
<div className="mt-3 flex justify-center">
<button
type="button"
onClick={() => setIsCheckoutOpen(true)}
className="text-xs font-bold text-purple-700 hover:text-purple-800 underline flex items-center gap-1.5 cursor-pointer py-1 px-3 rounded-lg hover:bg-purple-50 transition-colors"
>
<CreditCard className="w-4 h-4 text-purple-600" />
<span>شحن رصيد الألعاب عبر باقات جلسة الآن</span>
</button>
</div>
)}
</div>
</motion.div>
)}
</AnimatePresence>

{/* Stepper Navigation Buttons (Back & Next) */}
<div className="flex items-center justify-between border-t border-slate-100 pt-5 mt-6">
<button
type="button"
onClick={prevStep}
disabled={currentStep === 1}
className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
currentStep === 1
? 'text-slate-300 bg-slate-50 cursor-not-allowed'
: 'text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95'
}`}
>
<ChevronRight className="w-4 h-4" />
<span>السابق</span>
</button>

<div className="text-xs font-bold text-slate-400">
الخطوة {currentStep} من 4
</div>

{currentStep < 4 ? (
<button
type="button"
onClick={nextStep}
className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-purple-500/20 active:scale-95 transition-all"
>
<span>التالي</span>
<ChevronLeft className="w-4 h-4" />
</button>
) : (
<div className="w-20" />
)}
</div>
</div>
</div>

{/* ================= MODAL: ADMIN PROMO MANAGER ================= */}
<AdminPromoManager
isOpen={isAdminPromoOpen}
onClose={() => setIsAdminPromoOpen(false)}
/>

{/* ================= MODAL: OTP VERIFICATION SCREEN ================= */}
<AnimatePresence>
{isOTPOpen && (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
<OTPScreen
email={userEmail}
onVerified={(data) => {
setIsVerified(true);
setIsOTPOpen(false);
}}
onCancel={() => setIsOTPOpen(false)}
/>
</div>
)}
</AnimatePresence>

{/* ================= MODAL: SEEN QUESTIONS EXHAUSTION ALERT ================= */}
<AnimatePresence>
{exhaustionAlert && (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm" dir="rtl">
<motion.div
initial={{ opacity: 0, scale: 0.9, y: 15 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.9 }}
className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center"
>
<div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
<AlertTriangle className="w-8 h-8" />
</div>

<h3 className="text-xl font-black text-slate-900 mb-2">
تنبيه نفاد الأسئلة 
</h3>
<p className="text-slate-600 text-xs sm:text-sm font-bold leading-relaxed mb-6">
{exhaustionAlert}
</p>

<button
onClick={() => setExhaustionAlert(null)}
className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-purple-500/25 active:scale-95 transition-all"
>
اختيار فئات أخرى
</button>
</motion.div>
</div>
)}
</AnimatePresence>

{/* ================= MODAL: AUTH / USER SWITCHER ================= */}
<AuthModal
isOpen={isAuthOpen}
onClose={() => setIsAuthOpen(false)}
/>

{/* ================= MODAL: PAYPAL CHECKOUT MODAL ================= */}
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

