import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
User,
ShieldCheck,
Crown,
Gamepad2,
LogIn,
LogOut,
Mail,
Lock,
CheckCircle2,
AlertCircle,
X,
RotateCw,
Gift,
UserPlus,
KeyRound,
RefreshCw,
ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { API_BASE, parseApiResponse } from '../utils/api';
import { useGameStore } from '../store/useGameStore';

export const AuthModal = ({ isOpen, onClose }) => {
const { currentUser, setCurrentUser, availableGames, setAvailableGames, logout } = useGameStore();

// Mode toggles
const [isLogin, setIsLogin] = useState(true);
const [isOTPStep, setIsOTPStep] = useState(false);

// Form Fields
const [username, setUsername] = useState('');
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [registeredEmail, setRegisteredEmail] = useState('');

// 6-Digit OTP State
const [otp, setOtp] = useState(['', '', '', '', '', '']);
const otpInputsRef = useRef([]);

// Loading & Feedback
const [isLoading, setIsLoading] = useState(false);
const [errorMsg, setErrorMsg] = useState('');
const [successMsg, setSuccessMsg] = useState('');

// Reset modal state on open/close
useEffect(() => {
if (!isOpen) {
setErrorMsg('');
setSuccessMsg('');
setIsOTPStep(false);
setOtp(['', '', '', '', '', '']);
}
}, [isOpen]);

if (!isOpen) return null;

// Handle Login Submit
const handleLoginSubmit = async (identifier, pass) => {
setIsLoading(true);
setErrorMsg('');
setSuccessMsg('');

try {
const res = await fetch(`${API_BASE}/auth/login`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
username_or_email: identifier.trim(),
password: pass
})
});

const data = await parseApiResponse(res);

if (data.access_token) {
localStorage.setItem('jalsah_access_token', data.access_token);
}

const userData = data.user;
setCurrentUser(userData);
if (typeof userData.games_balance === 'number') {
setAvailableGames(userData.games_balance);
}

setSuccessMsg(`أهلاً بك مجدداً، ${userData.username}! `);
confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });

setTimeout(() => {
onClose();
}, 1000);
} catch (err) {
setErrorMsg(err.message || 'حدث خطأ أثناء تسجيل الدخول');
} finally {
setIsLoading(false);
}
};

// Handle Register Submit
const handleRegisterSubmit = async (e) => {
e.preventDefault();
setIsLoading(true);
setErrorMsg('');
setSuccessMsg('');

try {
const res = await fetch(`${API_BASE}/auth/register`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
username: username.trim(),
email: email.trim(),
password: password
})
});

const data = await parseApiResponse(res);

setRegisteredEmail(email.trim());

if (data.requires_otp) {
  setIsOTPStep(true);
  if (data.debug_otp) {
    setSuccessMsg(`رمز التحقق لتفعيل حسابك هو: [ ${data.debug_otp} ] (أدخله في المربعات أدناه)`);
  } else {
    setSuccessMsg(data.message || 'تم إرسال رمز التحقق إلى بريدك الإلكتروني.');
  }
  return;
}

if (data.access_token) {
  localStorage.setItem('jalsah_access_token', data.access_token);
}
setCurrentUser(data.user);
if (typeof data.user?.games_balance === 'number') {
  setAvailableGames(data.user.games_balance);
}
setSuccessMsg(data.message || 'تم إنشاء الحساب بنجاح!');
setTimeout(() => onClose(), 800);
} catch (err) {
setErrorMsg(err.message || 'حدث خطأ أثناء التسجيل');
} finally {
setIsLoading(false);
}
};

// Handle OTP digit changes
const handleOtpChange = (index, value) => {
const digit = value.replace(/\D/g, '').slice(-1);
const newOtp = [...otp];
newOtp[index] = digit;
setOtp(newOtp);

if (digit && index < 5) {
otpInputsRef.current[index + 1]?.focus();
}
};

// Handle OTP backspace navigation
const handleOtpKeyDown = (index, e) => {
if (e.key === 'Backspace' && !otp[index] && index > 0) {
otpInputsRef.current[index - 1]?.focus();
}
};

// Handle Paste of 6-digit code
const handleOtpPaste = (e) => {
e.preventDefault();
const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
if (!pasted) return;

const newOtp = [...otp];
for (let i = 0; i < 6; i++) {
newOtp[i] = pasted[i] || '';
}
setOtp(newOtp);

const nextIndex = Math.min(pasted.length, 5);
otpInputsRef.current[nextIndex]?.focus();
};

// Verify OTP submission
const handleVerifyOtpSubmit = async (e) => {
if (e) e.preventDefault();
const fullCode = otp.join('');
if (fullCode.length !== 6) {
setErrorMsg('يرجى إدخال الرمز كاملاً المكون من 6 أرقام');
return;
}

setIsLoading(true);
setErrorMsg('');
setSuccessMsg('');

try {
const res = await fetch(`${API_BASE}/auth/verify-otp`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
email: registeredEmail,
otp_code: fullCode
})
});

const data = await parseApiResponse(res);

if (data.access_token) {
localStorage.setItem('jalsah_access_token', data.access_token);
}

const verifiedUser = data.user;
setCurrentUser(verifiedUser);
if (typeof verifiedUser.games_balance === 'number') {
setAvailableGames(verifiedUser.games_balance);
}

setSuccessMsg(' تم توثيق حسابك بنجاح! أهلاً بك في جلسة.');
confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

setTimeout(() => {
onClose();
}, 1200);
} catch (err) {
setErrorMsg(err.message || 'حدث خطأ أثناء تأكيد الرمز');
} finally {
setIsLoading(false);
}
};

// Resend OTP
const handleResendOtp = async () => {
setIsLoading(true);
setErrorMsg('');

try {
const res = await fetch(`${API_BASE}/auth/resend-otp`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({
email: registeredEmail
})
});

const data = await parseApiResponse(res);

if (data.debug_otp) {
  setSuccessMsg(`رمز التحقق الجديد الخاص بك هو: [ ${data.debug_otp} ]`);
} else {
  setSuccessMsg(data.message || 'تم إرسال رمز تحقق جديد إلى بريدك الإلكتروني!');
}
setOtp(['', '', '', '', '', '']);
otpInputsRef.current[0]?.focus();
} catch (err) {
setErrorMsg(err.message || 'فشل في إعادة إرسال الرمز');
} finally {
setIsLoading(false);
}
};

const handleLogout = () => {
logout();
setSuccessMsg('تم تسجيل الخروج بنجاح.');
setTimeout(() => {
setSuccessMsg('');
}, 1500);
};

const isAdmin = currentUser?.role === 'admin';

return (
<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm" dir="rtl">
<motion.div
initial={{ opacity: 0, scale: 0.92, y: 15 }}
animate={{ opacity: 1, scale: 1, y: 0 }}
exit={{ opacity: 0, scale: 0.92 }}
className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto text-right"
>
{/* Header */}
<div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
<div className="flex items-center gap-3">
<div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
{isOTPStep ? <KeyRound className="w-5 h-5" /> : isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
</div>
<div>
<h3 className="text-xl sm:text-2xl font-black text-slate-900">
{isOTPStep ? 'تأكيد الرمز (OTP)' : isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
</h3>
<p className="text-xs text-slate-500 font-medium">
{isOTPStep
? 'أدخل الرمز المكون من 6 أرقام لتفعيل الحساب'
: isLogin
? 'ادخل إلى حسابك للاستمتاع بجلسات اللعب'
: 'أنشئ حسابك واحصل على جلسة مجانية فورية'}
</p>
</div>
</div>

<button
onClick={onClose}
className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
>
<X className="w-5 h-5" />
</button>
</div>

{/* Current Active Account Box */}
{currentUser && !isOTPStep && (
<div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/70 to-indigo-50/40 border border-purple-200/80 mb-5">
<div className="flex items-center justify-between mb-3">
<div className="flex items-center gap-2.5">
<div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${
isAdmin ? 'bg-amber-500' : 'bg-purple-600'
}`}>
{isAdmin ? <Crown className="w-4 h-4" /> : <Gamepad2 className="w-4 h-4" />}
</div>
<div>
<h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
<span>{currentUser.username}</span>
{isAdmin ? (
<span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
مدير المنصة 
</span>
) : (
<span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">
لاعب 
</span>
)}
</h4>
<p className="text-xs text-slate-500 font-mono" dir="ltr">
{currentUser.email}
</p>
</div>
</div>

<button
type="button"
onClick={handleLogout}
className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
>
<LogOut className="w-3.5 h-3.5" />
<span>خروج</span>
</button>
</div>

<div className="grid grid-cols-2 gap-2 pt-2 border-t border-purple-100/80 text-xs font-bold text-slate-700">
<div className="flex items-center gap-1.5">
<Gift className="w-3.5 h-3.5 text-orange-500" />
<span>رصيد الجولات:</span>
<span className="font-black text-purple-700">{availableGames}</span>
</div>
<div className="flex items-center gap-1.5">
<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
<span>حالة التوثيق:</span>
<span className="text-emerald-700">{currentUser.is_verified ? 'موثق ' : 'غير موثق'}</span>
</div>
</div>
</div>
)}

{/* Feedback messages */}
{errorMsg && (
<div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold mb-4 flex items-center gap-2">
<AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
<span>{errorMsg}</span>
</div>
)}
{successMsg && (
<div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold mb-4 flex items-center gap-2">
<CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
<span>{successMsg}</span>
</div>
)}

{/* ================= STEP 1: OTP VERIFICATION STEP ================= */}
{isOTPStep ? (
<motion.div
initial={{ opacity: 0, x: 20 }}
animate={{ opacity: 1, x: 0 }}
className="space-y-5"
>
<div className="text-center py-2">
<div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center mx-auto mb-3">
<KeyRound className="w-7 h-7" />
</div>
<h4 className="text-base font-black text-gray-900">
أدخل رمز التحقق المكون من 6 أرقام
</h4>
<p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
تم إرسال كود OTP صالح لمدة 15 دقيقة إلى البريد:{' '}
<strong className="text-purple-700 font-mono" dir="ltr">{registeredEmail}</strong>
</p>
</div>

{/* 6 OTP Input Boxes */}
<div className="flex items-center justify-center gap-2 sm:gap-2.5" dir="ltr">
{otp.map((digit, idx) => (
<input
key={idx}
ref={(el) => (otpInputsRef.current[idx] = el)}
type="text"
inputMode="numeric"
maxLength={1}
value={digit}
onChange={(e) => handleOtpChange(idx, e.target.value)}
onKeyDown={(e) => handleOtpKeyDown(idx, e)}
onPaste={handleOtpPaste}
className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black bg-white text-gray-900 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-xs transition-all"
/>
))}
</div>

{/* Submit & Resend Buttons */}
<div className="space-y-2.5 pt-2">
<button
type="button"
onClick={handleVerifyOtpSubmit}
disabled={isLoading || otp.join('').length !== 6}
className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-black text-sm transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
>
{isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
<span>تأكيد الرمز وبدء اللعب </span>
</button>

<div className="flex items-center justify-between text-xs pt-1">
<button
type="button"
onClick={handleResendOtp}
disabled={isLoading}
className="text-purple-600 hover:text-purple-700 font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
>
<RefreshCw className="w-3.5 h-3.5" />
<span>إعادة إرسال الرمز</span>
</button>

<button
type="button"
onClick={() => setIsOTPStep(false)}
className="text-gray-500 hover:text-gray-700 font-medium cursor-pointer"
>
العودة لتعديل البريد
</button>
</div>
</div>
</motion.div>
) : (
/* ================= STEP 2: LOGIN / SIGNUP TABS & FORMS ================= */
<div>
{/* Tabs Toggle: تسجيل الدخول / إنشاء حساب */}
<div className="flex p-1 bg-gray-100 rounded-2xl mb-4">
<button
type="button"
onClick={() => {
setIsLogin(true);
setErrorMsg('');
setSuccessMsg('');
}}
className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
isLogin
? 'bg-white text-purple-700 shadow-sm'
: 'text-gray-500 hover:text-gray-700'
}`}
>
<LogIn className="w-3.5 h-3.5" />
<span>تسجيل الدخول</span>
</button>
<button
type="button"
onClick={() => {
setIsLogin(false);
setErrorMsg('');
setSuccessMsg('');
}}
className={`flex-1 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
!isLogin
? 'bg-white text-purple-700 shadow-sm'
: 'text-gray-500 hover:text-gray-700'
}`}
>
<UserPlus className="w-3.5 h-3.5" />
<span>إنشاء حساب جديد</span>
</button>
</div>

{/* Forms with Framer-Motion transition */}
<AnimatePresence mode="wait">
{isLogin ? (
/* ================= LOGIN FORM ================= */
<motion.form
key="login-form"
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
onSubmit={(e) => {
e.preventDefault();
handleLoginSubmit(email, password);
}}
className="space-y-3 pt-2 border-t border-gray-100"
>
<label className="block text-xs font-black text-gray-700">
أو سجّل الدخول ببياناتك:
</label>

<div>
<div className="relative">
<input
type="text"
value={email}
onChange={(e) => setEmail(e.target.value)}
placeholder="البريد الإلكتروني أو اسم المستخدم"
required
className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs font-bold placeholder:text-gray-400 shadow-xs"
/>
<Mail className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
</div>
</div>

<div>
<div className="relative">
<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
placeholder="كلمة المرور"
required
className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs font-bold placeholder:text-gray-400 shadow-xs"
/>
<Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
</div>
</div>

<button
type="submit"
disabled={isLoading || !email || !password}
className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-black text-xs transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
>
{isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
<span>تسجيل الدخول</span>
</button>

<div className="text-center pt-2">
<button
type="button"
onClick={() => setIsLogin(false)}
className="text-xs text-purple-600 hover:text-purple-700 font-bold hover:underline cursor-pointer"
>
ليس لديك حساب؟ إنشاء حساب جديد
</button>
</div>
</motion.form>
) : (
/* ================= SIGN UP FORM ================= */
<motion.form
key="signup-form"
initial={{ opacity: 0, y: 8 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0, y: -8 }}
onSubmit={handleRegisterSubmit}
className="space-y-3 pt-2 border-t border-gray-100"
>
<div>
<label className="block text-xs font-bold text-gray-700 mb-1">
الاسم الشخصي / اسم المستخدم:
</label>
<div className="relative">
<input
type="text"
value={username}
onChange={(e) => setUsername(e.target.value)}
placeholder="مثال: محمد العمري"
required
className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs font-bold placeholder:text-gray-400 shadow-xs"
/>
<User className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
</div>
</div>

<div>
<label className="block text-xs font-bold text-gray-700 mb-1">
البريد الإلكتروني:
</label>
<div className="relative">
<input
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
placeholder="name@example.com"
required
className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs font-bold placeholder:text-gray-400 shadow-xs"
/>
<Mail className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
</div>
</div>

<div>
<label className="block text-xs font-bold text-gray-700 mb-1">
كلمة المرور:
</label>
<div className="relative">
<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
placeholder="6 خانات على الأقل"
minLength={6}
required
className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-white text-gray-900 border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 text-xs font-bold placeholder:text-gray-400 shadow-xs"
/>
<Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
</div>
</div>

<button
type="submit"
disabled={isLoading || !username || !email || !password}
className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 text-white font-black text-xs sm:text-sm transition-all shadow-md shadow-purple-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
>
{isLoading ? <RotateCw className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
<span>إنشاء الحساب والمتابعة للتحقق </span>
</button>

<div className="text-center pt-2">
<button
type="button"
onClick={() => setIsLogin(true)}
className="text-xs text-purple-600 hover:text-purple-700 font-bold hover:underline cursor-pointer"
>
لديك حساب بالفعل؟ تسجيل الدخول
</button>
</div>
</motion.form>
)}
</AnimatePresence>
</div>
)}
</motion.div>
</div>
);
};

