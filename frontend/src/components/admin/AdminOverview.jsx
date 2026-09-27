import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  AlertTriangle
} from 'lucide-react';
import { authFetch } from '../../utils/api';

export const AdminOverview = ({ onNavigateTab }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const stats = [
    {
      title: 'إجمالي المبيعات والمدفوعات',
      value: `$${data?.total_sales?.toFixed(2) || '0.00'}`,
      subtitle: 'عبر بوابات الدفع PayPal والباقات',
      icon: TrendingUp,
      color: 'from-emerald-500 to-teal-600',
      lightBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: '+18% هذا الأسبوع'
    },
    {
      title: 'عدد المستخدمين المسجلين',
      value: data?.active_users || 0,
      subtitle: 'حسابات نشطة في المنصة',
      icon: Users,
      color: 'from-purple-600 to-indigo-600',
      lightBg: 'bg-purple-50 text-purple-600 border-purple-200',
      badge: 'موثقون عبر OTP'
    },
    {
      title: 'إجمالي الجلسات الملعوبة',
      value: data?.total_games_played || 0,
      subtitle: 'جلسة تنافسية مكتملة',
      icon: Gamepad2,
      color: 'from-orange-500 to-amber-500',
      lightBg: 'bg-orange-50 text-orange-600 border-orange-200',
      badge: 'نشاط مرتفع 🔥'
    },
    {
      title: 'رصيد الجلسات المتبقي',
      value: data?.total_games_balance || 0,
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

        <div className="flex items-center gap-3">
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
    </div>
  );
};
