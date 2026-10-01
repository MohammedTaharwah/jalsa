import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Gamepad2,
  Sparkles,
  HelpCircle,
  FolderTree,
  Coins,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  AlertTriangle,
  Sliders,
  DollarSign,
  Check,
  X,
  RotateCcw,
  Edit3,
  Receipt,
  CheckCircle2
} from 'lucide-react';
import { authFetch } from '../../utils/api';

const DASHBOARD_CONFIG_KEY = 'jalsah_admin_dashboard_config';

export const AdminOverview = ({ onNavigateTab }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard customization state (Currency & Numbers Override)
  const [dashConfig, setDashConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(DASHBOARD_CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customSales === '70.24' || parsed.customSales === '70' || Number(parsed.customSales) === 70.24) {
          parsed.customSales = '';
          parsed.isOverrideActive = false;
          localStorage.removeItem(DASHBOARD_CONFIG_KEY);
        }
        return parsed;
      }
    } catch (e) {}
    return {
      currencySymbol: '$',
      currencyPosition: 'before', // 'before' | 'after'
      isOverrideActive: false,
      customSales: '',
      customUsers: '',
      customGamesPlayed: '',
      customGamesBalance: '',
      salesGrowthText: ''
    };
  });

  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [formConfig, setFormConfig] = useState(dashConfig);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch('/api/admin/overview');
      if (!res.ok) {
        throw new Error('فشل جلب إحصائيات لوحة التحكم');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleSaveConfig = (e) => {
    e.preventDefault();
    setDashConfig(formConfig);
    try {
      localStorage.setItem(DASHBOARD_CONFIG_KEY, JSON.stringify(formConfig));
    } catch (e) {}
    setCustomizerOpen(false);
  };

  const handleResetToRealData = () => {
    const resetCfg = {
      currencySymbol: '$',
      currencyPosition: 'before',
      isOverrideActive: false,
      customSales: '',
      customUsers: '',
      customGamesPlayed: '',
      customGamesBalance: '',
      salesGrowthText: ''
    };
    setDashConfig(resetCfg);
    setFormConfig(resetCfg);
    try {
      localStorage.removeItem(DASHBOARD_CONFIG_KEY);
    } catch (e) {}
    setCustomizerOpen(false);
  };

  const formatMoney = (val) => {
    const symbol = dashConfig.currencySymbol || '$';
    const num = Number(val) || 0;
    const formattedNum = num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return dashConfig.currencyPosition === 'after' ? `${formattedNum} ${symbol}` : `${symbol}${formattedNum}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-10 h-10 animate-spin text-purple-600 mb-3" />
        <p className="font-bold text-slate-600">جارٍ تحميل المؤشرات والبيانات...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500" />
          <span className="font-semibold">{error}</span>
        </div>
        <button
          onClick={fetchOverview}
          className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition"
        >
          إعادة المحاولة
        </button>
      </div>
    );
  }

  const displaySales = dashConfig.isOverrideActive && dashConfig.customSales !== ''
    ? Number(dashConfig.customSales)
    : (data?.total_sales || 0);

  const displayUsers = dashConfig.isOverrideActive && dashConfig.customUsers !== ''
    ? Number(dashConfig.customUsers)
    : (data?.active_users || 0);

  const displayGamesPlayed = dashConfig.isOverrideActive && dashConfig.customGamesPlayed !== ''
    ? Number(dashConfig.customGamesPlayed)
    : (data?.total_games_played || 0);

  const displayGamesBalance = dashConfig.isOverrideActive && dashConfig.customGamesBalance !== ''
    ? Number(dashConfig.customGamesBalance)
    : (data?.total_games_balance || 0);

  const stats = [
    {
      title: 'إجمالي المبيعات والمدفوعات',
      value: formatMoney(displaySales),
      subtitle: 'مدفوعات PayPal الموثقة فقط',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: dashConfig.salesGrowthText || ((data?.total_paypal_orders > 0) ? `${data.total_paypal_orders} مدفوعات PayPal ✅` : '0 مدفوعات PayPal')
    },
    {
      title: 'عدد المستخدمين المسجلين',
      value: displayUsers.toLocaleString(),
      subtitle: 'حسابات نشطة في المنصة',
      icon: Users,
      color: 'from-purple-600 to-indigo-600',
      lightBg: 'bg-purple-50 text-purple-600 border-purple-200',
      badge: 'موثقون عبر OTP'
    },
    {
      title: 'إجمالي الجلسات الملعوبة',
      value: displayGamesPlayed.toLocaleString(),
      subtitle: 'جلسة تنافسية مكتملة',
      icon: Gamepad2,
      color: 'from-orange-500 to-amber-500',
      lightBg: 'bg-orange-50 text-orange-600 border-orange-200',
      badge: 'نشاط مرتفع 🔥'
    },
    {
      title: 'رصيد الجلسات المتبقي',
      value: displayGamesBalance.toLocaleString(),
      subtitle: 'جلسة بحوزة اللاعبين حالياً',
      icon: Coins,
      color: 'from-fuchsia-600 to-pink-600',
      lightBg: 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200',
      badge: 'جاهزة للعب'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-amber-300 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> لوحة تحكم الإدارة المركزية
            </span>
            <span className="text-xs text-purple-200">الإصدار 2.5 • نشط</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            نظرة عامة على أداء منصة "جلسة" 📊
          </h1>
          <p className="text-purple-200 text-sm mt-1 max-w-xl">
            متابعة فورية للمبيعات، نشاط اللاعبين، طابور اعتماد أسئلة الذكاء الاصطناعي واقتصاد اللعبة التكتيكي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFormConfig(dashConfig);
              setCustomizerOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            title="تعديل أرقام المبيعات والعملة المعروضة في اللوحة"
          >
            <Sliders className="w-4 h-4" />
            <span>تعديل الأرقام والعملة 💰</span>
          </button>

          <button
            onClick={fetchOverview}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-sm font-bold backdrop-blur-sm transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> تحديث البيانات
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-gradient-to-tr ${item.color} text-white shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${item.lightBg}`}>
                  {item.badge}
                </span>
              </div>

              <div className="mt-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-800 mt-1">{item.value}</h3>
                <p className="text-xs text-slate-500 mt-1">{item.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Secondary Metrics & Review Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Review Queue Alert Card */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5" />
              </span>
              <span className="px-3 py-1 bg-amber-200/70 text-amber-900 rounded-full text-xs font-black">
                {data?.pending_questions || 0} أسئلة معلقة
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-800 mt-4">
              طابور اعتماد الذكاء الاصطناعي (AI Review)
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              هناك أسئلة مولدة عبر n8n بانتظار موافقتك لإدراجها في بنك الأسئلة المعتمدة للوحة اللعب.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('ai-control')}
            className="mt-5 w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
          >
            فتح غرفة الذكاء الاصطناعي والمراجعة <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Questions Bank Summary */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <HelpCircle className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-slate-400">إجمالي الأسئلة</span>
            </div>
            <h3 className="text-3xl font-black text-slate-800 mt-3">{data?.total_questions || 0}</h3>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                {data?.approved_questions || 0} معتمد ومتاح
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                {data?.pending_questions || 0} قيد المراجعة
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('categories')}
            className="mt-5 w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition"
          >
            إدارة الفئات وبنك الأسئلة <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Categories & Promos */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <span className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FolderTree className="w-5 h-5" />
              </span>
              <span className="text-xs font-bold text-slate-400">التصنيفات والبرومو</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="text-2xl font-black text-slate-800">{data?.total_categories || 0}</p>
                <p className="text-xs text-slate-500">فئات نشطة</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800">{data?.total_promos || 0}</p>
                <p className="text-xs text-slate-500">أكواد ترويجية</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => onNavigateTab('packages')}
              className="py-2.5 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-2xl text-xs text-center transition"
            >
              الباقات والأكواد
            </button>
            <button
              onClick={() => onNavigateTab('economy')}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs text-center transition"
            >
              اقتصاد الأسلحة
            </button>
          </div>
        </div>
      </div>

      {/* Recent Users Quick Table */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-800">أحدث المستخدمين المسجلين</h3>
            <p className="text-xs text-slate-400">آخر الحسابات المنضمة للمنصة</p>
          </div>
          <button
            onClick={() => onNavigateTab('users')}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            عرض كافة المستخدمين والدعم <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="pb-3 font-bold">المستخدم</th>
                <th className="pb-3 font-bold">البريد الإلكتروني</th>
                <th className="pb-3 font-bold">الصلاحية</th>
                <th className="pb-3 font-bold">التوثيق (OTP)</th>
                <th className="pb-3 font-bold">رصيد الألعاب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data?.recent_users?.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 font-bold text-slate-800">{u.username}</td>
                  <td className="py-3 text-slate-600 font-mono">{u.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {u.role === 'admin' ? 'مدير (Admin)' : 'لاعب'}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.is_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {u.is_verified ? 'موثق ✓' : 'غير موثق'}
                    </span>
                  </td>
                  <td className="py-3 font-bold text-slate-800">
                    {u.games_balance} جلسات
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified PayPal Payments Log */}
      <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">سجل مدفوعات PayPal الموثقة 💳</h3>
              <p className="text-xs text-slate-400">عمليات الشراء الفعلية عبر بوابة PayPal فقط (لا تشمل الجلسات المضافة يدوياً)</p>
            </div>
          </div>
          <span className="self-start sm:self-auto text-xs font-black px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
            {data?.total_paypal_orders || data?.recent_payments?.length || 0} عمليات شراء مؤكدة
          </span>
        </div>

        {data?.recent_payments && data.recent_payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400">
                  <th className="pb-3 font-bold">معرف الطلب (PayPal Order ID)</th>
                  <th className="pb-3 font-bold">الباقة</th>
                  <th className="pb-3 font-bold">الجلسات المضافة</th>
                  <th className="pb-3 font-bold">المبلغ المدفوع</th>
                  <th className="pb-3 font-bold">الحالة</th>
                  <th className="pb-3 font-bold">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.recent_payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 font-mono font-bold text-slate-800 dir-ltr text-left">
                      {p.paypal_order_id}
                    </td>
                    <td className="py-3 font-bold text-slate-800">{p.package_name}</td>
                    <td className="py-3 font-bold text-purple-600">+{p.games_count} جلسة</td>
                    <td className="py-3 font-black text-emerald-600">{formatMoney(p.amount)}</td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        موثقة ومؤكدة عبر PayPal
                      </span>
                    </td>
                    <td className="py-3 text-slate-400 font-sans">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : 'الآن'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 px-4 rounded-2xl bg-slate-50/70 border border-slate-100 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-black text-slate-800">لا توجد عمليات شراء عبر PayPal حتى الآن</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-lg leading-relaxed">
              تم تصفير رصيد المبيعات الحالي إلى <strong className="text-slate-900">$0.00</strong>. سيتم البدء في حساب وتجميع الأرباح تلقائياً فور قيام أي لاعب بإتمام عملية شراء مؤكدة عبر PayPal، ولن يتم احتساب أي جلسات تمنحها يدوياً.
            </p>
          </div>
        )}
      </div>

      {/* ================= DASHBOARD OVERRIDE & CURRENCY MODAL ================= */}
      <AnimatePresence>
        {customizerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs dir-rtl" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      تخصيص أرقام لوحة التحكم والعملة
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
                      تحكم بالعملة المعروضة والأرقام التقديرية للمبيعات والجلسات
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomizerOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-4">
                {/* Currency Selection Presets */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">
                    اختيار رمز العملة:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { sym: '$', name: 'دولار أمريكي (USD)' },
                      { sym: 'د.أ', name: 'دينار أردني (JOD)' },
                      { sym: 'ر.س', name: 'ريال سعودي (SAR)' },
                      { sym: 'د.إ', name: 'درهم إماراتي (AED)' },
                      { sym: '€', name: 'يورو (EUR)' },
                      { sym: '£', name: 'جنيه استرليني (GBP)' }
                    ].map((cur) => (
                      <button
                        key={cur.sym}
                        type="button"
                        onClick={() => setFormConfig({ ...formConfig, currencySymbol: cur.sym })}
                        className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                          formConfig.currencySymbol === cur.sym
                            ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-base font-black">{cur.sym}</span>
                        <span className="text-[10px] opacity-70 mt-0.5">{cur.name.split(' ')[0]}</span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="text"
                      value={formConfig.currencySymbol}
                      onChange={(e) => setFormConfig({ ...formConfig, currencySymbol: e.target.value })}
                      placeholder="أو اكتب رمز عملة مخصص..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                    />

                    {/* Position */}
                    <select
                      value={formConfig.currencyPosition}
                      onChange={(e) => setFormConfig({ ...formConfig, currencyPosition: e.target.value })}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="before">قبل الرقم ($100)</option>
                      <option value="after">بعد الرقم (100 د.أ)</option>
                    </select>
                  </div>
                </div>

                {/* Toggle Manual Numbers Override */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formConfig.isOverrideActive}
                      onChange={(e) => setFormConfig({ ...formConfig, isOverrideActive: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded-md focus:ring-amber-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-black text-amber-950 block">
                        تفعيل التعديل اليدوي على أرقام الداشبورد (Override)
                      </span>
                      <span className="text-[10px] text-amber-800">
                        يتيح لك عرض أرقام مخصصة للمبيعات والنشاط بدلاً من الأرقام الافتراضية
                      </span>
                    </div>
                  </label>
                </div>

                {/* Overrides Fields */}
                {formConfig.isOverrideActive && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200"
                  >
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        إجمالي المبيعات والمدفوعات:
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formConfig.customSales}
                        onChange={(e) => setFormConfig({ ...formConfig, customSales: e.target.value })}
                        placeholder={`مثال: 1250.00`}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          عدد المستخدمين المسجلين:
                        </label>
                        <input
                          type="number"
                          value={formConfig.customUsers}
                          onChange={(e) => setFormConfig({ ...formConfig, customUsers: e.target.value })}
                          placeholder={`مثال: 45`}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          الجلسات الملعوبة:
                        </label>
                        <input
                          type="number"
                          value={formConfig.customGamesPlayed}
                          onChange={(e) => setFormConfig({ ...formConfig, customGamesPlayed: e.target.value })}
                          placeholder={`مثال: 180`}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        رصيد الجلسات المتبقي:
                      </label>
                      <input
                        type="number"
                        value={formConfig.customGamesBalance}
                        onChange={(e) => setFormConfig({ ...formConfig, customGamesBalance: e.target.value })}
                        placeholder={`مثال: 32`}
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        شارة النمو (Badge):
                      </label>
                      <input
                        type="text"
                        value={formConfig.salesGrowthText}
                        onChange={(e) => setFormConfig({ ...formConfig, salesGrowthText: e.target.value })}
                        placeholder="+24% هذا الشهر"
                        className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleResetToRealData}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>استعادة البيانات الحقيقية</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomizerOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-600/20 active:scale-95 transition cursor-pointer"
                    >
                      حفظ التعديلات
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
