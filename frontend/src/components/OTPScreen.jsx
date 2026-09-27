import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Mail, ArrowRight, RotateCw, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import logo from '../assets/logo.png';
import { API_BASE } from '../utils/api';

export const OTPScreen = ({
  email = 'user@example.com',
  onVerified,
  onCancel
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Handle single digit input
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setErrorMsg('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste full 6-digit code
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      inputRefs.current[5]?.focus();
    }
  };

  // Submit OTP Verification
  const handleVerify = async (e) => {
    e?.preventDefault();
    const fullCode = otp.join('');

    if (fullCode.length < 6) {
      setErrorMsg('يرجى إدخال جميع الأرقام الستة لكود التحقق');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          otp_code: fullCode
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
      }

      setSuccessMsg('تم توثيق الحساب بنجاح! جاري تحويلك للعبة...');
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });

      setTimeout(() => {
        if (onVerified) onVerified(data);
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ أثناء التحقق، يرجى المحاولة لاحقاً');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return;

    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'تعذر إعادة إرسال الرمز حالياً');
      }

      setResendCooldown(60);
      setCanResend(false);
      setSuccessMsg('تم إرسال رمز تحقق جديد إلى بريدك بنجاح!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'فشل في إعادة الإرسال');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans select-none" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(124,58,237,0.08)] border border-slate-100 text-center relative overflow-hidden"
      >
        {/* Logo and Icon Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-sm border border-slate-100 flex items-center justify-center mb-3">
            <img src={logo} alt="جلسة" className="w-full h-full object-contain" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-black mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>توثيق الحساب • OTP</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            أدخل رمز التحقق 🔐
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed font-medium">
            أرسلنا رمزاً مكوناً من 6 أرقام إلى بريدك الإلكتروني:{' '}
            <strong className="text-purple-700 font-bold block mt-0.5">{email}</strong>
          </p>
        </div>

        {/* 6 Digit Input Boxes */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-2.5" dir="ltr" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoFocus={idx === 0}
                className="w-11 h-14 sm:w-12 sm:h-14 rounded-2xl text-center text-xl sm:text-2xl font-black text-slate-900 bg-slate-50 border-2 border-slate-200 focus:border-purple-600 focus:bg-white focus:ring-4 focus:ring-purple-500/15 outline-none transition-all"
              />
            ))}
          </div>

          {/* Feedback messages */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Verification CTA */}
          <button
            type="submit"
            disabled={isLoading || otp.join('').length < 6}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-base shadow-lg shadow-purple-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <RotateCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>تفعيل الحساب والبدء باللعب</span>
                <ArrowRight className="w-5 h-5 rotate-180" />
              </>
            )}
          </button>
        </form>

        {/* Resend OTP Section */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">لم يصلك الرمز؟</span>

          {canResend ? (
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="text-purple-600 hover:text-purple-800 font-black flex items-center gap-1 transition-colors"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>إعادة إرسال الرمز</span>
            </button>
          ) : (
            <span className="text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-lg">
              إعادة الإرسال بعد ({resendCooldown}s)
            </span>
          )}
        </div>

        {/* Close or back option */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="mt-4 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
          >
            العودة لاحقاً
          </button>
        )}
      </motion.div>
    </div>
  );
};
