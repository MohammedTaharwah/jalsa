import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import {
  Gamepad2,
  Flame,
  Trophy,
  CheckCircle2,
  X,
  CreditCard,
  ShieldCheck,
  Sparkles,
  RotateCw,
  Gift,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../store/useGameStore';
import { API_BASE } from '../utils/api';

const PACKAGES = [
  {
    id: 'package_starter_5',
    name: 'باقة البداية',
    tag: '5 جلسات',
    games_count: 5,
    price_usd: '2.99',
    icon: Gamepad2,
    color: 'from-purple-600 to-indigo-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50/50'
  },
  {
    id: 'package_gather_10',
    name: 'باقة اللمة',
    tag: '10 جلسات',
    games_count: 10,
    price_usd: '5.00',
    popular: true,
    icon: Flame,
    color: 'from-orange-500 to-amber-500',
    border: 'border-orange-300 ring-2 ring-orange-400/30',
    bg: 'bg-gradient-to-b from-orange-50/60 to-white'
  },
  {
    id: 'package_championship_25',
    name: 'باقة البطولة',
    tag: '25 جلسة',
    games_count: 25,
    price_usd: '9.99',
    badge: 'أفضل قيمة 🏆',
    icon: Trophy,
    color: 'from-emerald-600 to-teal-600',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/50'
  }
];

export const CheckoutModal = ({
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const { setAvailableGames, currentUser } = useGameStore();

  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1]); // Default to "باقة اللمة"
  const [isProcessing, setIsProcessing] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'test';

  if (!isOpen) return null;

  const handleCloseAndReset = () => {
    setSuccessResult(null);
    setErrorMsg('');
    setIsProcessing(false);
    onClose();
  };

  // Create Order API call to backend
  const handleCreateOrder = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('jalsah_access_token') || sessionStorage.getItem('jalsah_access_token');
      const res = await fetch(`${API_BASE}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          package_id: selectedPackage.id,
          user_id: currentUser?.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'فشل في إنشاء طلب الدفع');
      return data.orderID;
    } catch (err) {
      setErrorMsg(err.message || 'حدث خطأ في الاتصال بالخادم');
      setIsProcessing(false);
      throw err;
    }
  };

  // Capture Order API call to backend
  const handleApprove = async (data) => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('jalsah_access_token') || sessionStorage.getItem('jalsah_access_token');
      const res = await fetch(`${API_BASE}/payment/capture-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          orderID: data.orderID,
          package_id: selectedPackage.id,
          user_id: currentUser?.id
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'فشل في تأكيد الدفع');

      // 1. Set Success State
      setSuccessResult(result);

      // 2. Confetti celebratory effect
      confetti({ particleCount: 180, spread: 85, origin: { y: 0.55 } });

      // 3. Update Global State immediately
      setAvailableGames(result.new_balance);

      // 4. Notify parent component
      if (onPaymentSuccess) {
        onPaymentSuccess(result.new_balance, result.games_added);
      }
    } catch (err) {
      setErrorMsg(err.message || 'فشل في إتمام وتأكيد عملية الشراء');
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        className="w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col justify-between overflow-y-auto text-right"
      >
        {/* Header (Only shown when not in success state for cleaner focus) */}
        {!successResult && (
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-orange-500 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                  <span>متجر باقات جلسة 🎮</span>
                  <span className="text-[10px] bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-bold">
                    PayPal Secure
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  اختر الباقة المناسبة لجلساتك وادفع بأمان عبر PayPal
                </p>
              </div>
            </div>

            <button
              onClick={handleCloseAndReset}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ================= SUCCESS STATE WITH FRAMER-MOTION ================= */}
        {successResult ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/40 border-2 border-emerald-300 text-center my-auto shadow-xl shadow-emerald-500/10"
          >
            {/* Smooth Animated Green Confirmation Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 12, stiffness: 220, delay: 0.15 }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-500/35 ring-4 ring-emerald-100"
            >
              <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-black mb-3">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '4s' }} />
                <span>عملية دفع مؤكدة وآمنة</span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                تم الدفع بنجاح! 🎉
              </h3>
              
              <p className="text-sm sm:text-base font-bold text-emerald-800 mb-6">
                تم الدفع بنجاح! تمت إضافة باقة الألعاب إلى رصيدك
              </p>

              {/* Package & Live Balance Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 mb-8">
                <div className="px-4 py-2 rounded-2xl bg-white border border-emerald-200 text-slate-800 text-xs font-bold shadow-xs">
                  الباقة المشتراة: <span className="text-emerald-700 font-black">{selectedPackage.name}</span> (+{successResult.games_added || selectedPackage.games_count} ألعاب)
                </div>
                <div className="px-4 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-black shadow-md shadow-emerald-600/20">
                  رصيدك الإجمالي الآن: {successResult.new_balance} ألعاب متاحة 🎮
                </div>
              </div>

              {/* Action Button: Return to Game Setup */}
              <button
                type="button"
                onClick={handleCloseAndReset}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-base shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>العودة إلى إعدادات الجلسة والبدء 🚀</span>
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
            </motion.div>
          </motion.div>
        ) : (
          /* ================= PACKAGES SELECTION & PAYPAL BUTTONS ================= */
          <div className="space-y-6">
            {/* Packages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {PACKAGES.map((pkg) => {
                const isSelected = selectedPackage.id === pkg.id;
                const PkgIcon = pkg.icon;

                return (
                  <motion.div
                    key={pkg.id}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPackage(pkg)}
                    className={`relative p-4 rounded-3xl cursor-pointer transition-all border-2 flex flex-col justify-between ${
                      isSelected
                        ? 'border-orange-500 bg-white shadow-lg shadow-orange-500/10 ring-2 ring-orange-400/20'
                        : `${pkg.bg} ${pkg.border} opacity-85 hover:opacity-100`
                    }`}
                  >
                    {/* Popular Badge */}
                    {pkg.popular && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-orange-500 text-white text-[9px] font-black shadow-md shadow-orange-500/30">
                        ⭐ الأكثر طلباً
                      </span>
                    )}
                    {pkg.badge && (
                      <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black shadow-md shadow-emerald-600/30">
                        {pkg.badge}
                      </span>
                    )}

                    <div>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white bg-gradient-to-tr ${pkg.color} shadow-sm mb-3`}>
                        <PkgIcon className="w-5 h-5" />
                      </div>

                      <h4 className="text-sm font-black text-slate-900 leading-snug">
                        {pkg.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                        {pkg.tag}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-xl font-black text-slate-900">
                        ${pkg.price_usd}
                      </span>
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                        {pkg.games_count} ألعاب
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {errorMsg}
              </div>
            )}

            {/* Selected Package Summary */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 font-bold">الباقة المحددة:</span>
                <h5 className="text-sm font-black text-slate-900">
                  {selectedPackage.name} ({selectedPackage.games_count} جلسات)
                </h5>
              </div>
              <div className="text-left font-mono">
                <span className="text-xs text-slate-400 block font-sans">المجموع:</span>
                <span className="text-xl font-black text-purple-700">
                  ${selectedPackage.price_usd} USD
                </span>
              </div>
            </div>

            {/* ================= PAYPAL SCRIPT PROVIDER & BUTTONS ================= */}
            <div className="relative rounded-2xl bg-white p-3 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2 text-xs font-bold text-slate-600 px-1">
                <span>طريقة الدفع الآمنة:</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-600">
                  <ShieldCheck className="w-3.5 h-3.5" /> تشفير آمن 256-bit
                </span>
              </div>

              <PayPalScriptProvider options={{ "clientId": paypalClientId, currency: "USD" }}>
                <PayPalButtons
                  style={{ layout: "vertical", shape: "pill", color: "gold", height: 44 }}
                  createOrder={handleCreateOrder}
                  onApprove={handleApprove}
                  onError={(err) => {
                    console.error("PayPal Error:", err);
                    setErrorMsg("حدث خطأ أثناء الاتصال ببوابة PayPal");
                  }}
                />
              </PayPalScriptProvider>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
