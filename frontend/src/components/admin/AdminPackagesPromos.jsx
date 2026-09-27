import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ticket,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Gamepad2,
  DollarSign,
  Flame,
  Trophy,
  Sparkles,
  Save,
  X,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { authFetch } from '../../utils/api';

export const AdminPackagesPromos = () => {
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' | 'promos'

  // Data states
  const [packages, setPackages] = useState([]);
  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit Package Modal
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [pkgForm, setPkgForm] = useState({ name: '', subtitle: '', price_usd: '', games_count: 5 });

  // Create Promo Modal
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [promoForm, setPromoForm] = useState({ code: '', global_limit: 20, games_reward: 2, is_active: true });

  const [toastMsg, setToastMsg] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/packages');
      if (res.ok) {
        const data = await res.json();
        setPackages(data);
      }
    } catch (e) {
      console.error('Error fetching packages:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPromos = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/promos');
      if (res.ok) {
        const data = await res.json();
        setPromos(data);
      }
    } catch (e) {
      console.error('Error fetching promos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchPromos();
  }, []);

  // Update Package
  const handleUpdatePackage = async (e) => {
    e.preventDefault();
    if (!selectedPkg) return;

    try {
      const res = await authFetch(`/api/admin/packages/${selectedPkg.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: pkgForm.name,
          subtitle: pkgForm.subtitle,
          price_usd: pkgForm.price_usd,
          games_count: parseInt(pkgForm.games_count, 10)
        })
      });

      if (!res.ok) throw new Error('فشل تحديث بيانات الباقة');

      showToast(`تم تحديث باقة [${pkgForm.name}] بنجاح! 💰`);
      setSelectedPkg(null);
      fetchPackages();
    } catch (err) {
      alert(err.message);
    }
  };

  // Create Promo
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!promoForm.code.trim()) return;

    try {
      const res = await authFetch('/api/admin/promos', {
        method: 'POST',
        body: JSON.stringify({
          code: promoForm.code.trim().toUpperCase(),
          global_limit: parseInt(promoForm.global_limit, 10),
          games_reward: parseInt(promoForm.games_reward, 10),
          is_active: promoForm.is_active
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'فشل إنشاء البرومو كود');
      }

      showToast('تم إنشاء البرومو كود بنجاح! 🎉');
      setPromoModalOpen(false);
      setPromoForm({ code: '', global_limit: 20, games_reward: 2, is_active: true });
      fetchPromos();
    } catch (err) {
      alert(err.message);
    }
  };

  // Toggle Promo Active
  const handleTogglePromo = async (promoId) => {
    try {
      const res = await authFetch(`/api/admin/promos/${promoId}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok) {
        const updated = await res.json();
        setPromos((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast(`تم ${updated.is_active ? 'تفعيل' : 'تعطيل'} البرومو كود.`);
      }
    } catch (err) {
      alert('فشل تغيير حالة الكود');
    }
  };

  // Delete Promo
  const handleDeletePromo = async (promoId, code) => {
    if (!window.confirm(`هل أنت متأكد من حذف كود [${code}]؟`)) return;
    try {
      const res = await authFetch(`/api/admin/promos/${promoId}`, { method: 'DELETE' });
      if (res.ok) {
        setPromos((prev) => prev.filter((p) => p.id !== promoId));
        showToast('تم حذف البرومو كود.');
      }
    } catch (err) {
      alert('فشل حذف البرومو كود');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-purple-600 text-white font-bold px-6 py-3 rounded-2xl shadow-xl shadow-purple-600/30 flex items-center gap-2 text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800">الباقات والأكواد الترويجية</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة تسعير باقات شراء الجلسات وأكواد الخصم الترويجية وحدود الاستخدام.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'packages'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Gamepad2 className="w-4 h-4" /> باقات الشراء
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'promos'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ticket className="w-4 h-4" /> الأكواد والبرومو ({promos.length})
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: PACKAGES ================= */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800">باقات جلسات اللعب المعروضة في المتجر</h3>
            <span className="text-xs text-slate-400">تحديث فوري ينعكس على نافذة الشراء للمستخدمين</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <motion.div
                key={pkg.id}
                whileHover={{ y: -4 }}
                className={`bg-white rounded-3xl p-6 border-2 transition-all flex flex-col justify-between shadow-sm ${
                  pkg.popular ? 'border-orange-400 ring-2 ring-orange-200' : 'border-slate-100'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-tr ${pkg.color || 'from-purple-500 to-indigo-600'} shadow-md`}>
                      {pkg.icon === 'Flame' ? <Flame className="w-6 h-6" /> : pkg.icon === 'Trophy' ? <Trophy className="w-6 h-6" /> : <Gamepad2 className="w-6 h-6" />}
                    </div>
                    {pkg.popular && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-[11px] font-black">
                        الأكثر طلباً 🔥
                      </span>
                    )}
                  </div>

                  <h4 className="text-lg font-black text-slate-900 mt-4">{pkg.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{pkg.subtitle}</p>

                  <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">السعر بالدولار</span>
                      <span className="text-xl font-black text-slate-900">${pkg.price_usd}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400">عدد الجلسات الممنوحة</span>
                      <span className="text-sm font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-lg">
                        {pkg.games_count} جلسات
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedPkg(pkg);
                    setPkgForm({
                      name: pkg.name,
                      subtitle: pkg.subtitle || '',
                      price_usd: pkg.price_usd,
                      games_count: pkg.games_count
                    });
                  }}
                  className="mt-6 w-full py-2.5 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Edit className="w-4 h-4" /> تعديل السعر والجلسات
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 2: PROMO CODES ================= */}
      {activeTab === 'promos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800">قائمة البرومو كود وتتبع الاستخدام</h3>
            <button
              onClick={() => setPromoModalOpen(true)}
              className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> إنشاء برومو كود جديد
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">رمز الكود (Code)</th>
                    <th className="py-3.5 px-4">مكافأة الجلسات</th>
                    <th className="py-3.5 px-4">حد الاستخدام العام</th>
                    <th className="py-3.5 px-4">كم شخص استخدمه؟</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {promos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-bold">
                        لا توجد أكواد برومو مدخلة حالياً
                      </td>
                    </tr>
                  ) : (
                    promos.map((p) => {
                      const isExhausted = p.current_uses >= p.global_limit;
                      return (
                        <tr key={p.id} className="hover:bg-purple-50/30 transition">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200 text-xs">
                                {p.code}
                              </span>
                              <button
                                onClick={() => copyToClipboard(p.code)}
                                className="text-slate-400 hover:text-slate-600"
                                title="نسخ الكود"
                              >
                                {copiedCode === p.code ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            +{p.games_reward} جلسات
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-600">
                            {p.global_limit} مستخدم
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-black ${isExhausted ? 'text-red-600' : 'text-slate-800'}`}>
                                {p.current_uses} / {p.global_limit}
                              </span>
                              {isExhausted && (
                                <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                                  مكتمل
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleTogglePromo(p.id)}
                              className={`px-3 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 transition ${
                                p.is_active && !isExhausted
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {p.is_active && !isExhausted ? 'نشط ومتاح' : 'معطل'}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleTogglePromo(p.id)}
                                className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100"
                                title={p.is_active ? 'تعطيل الكود' : 'تفعيل الكود'}
                              >
                                {p.is_active ? (
                                  <ToggleRight className="w-5 h-5 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-slate-400" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeletePromo(p.id, p.code)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                title="حذف الكود"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= EDIT PACKAGE MODAL ================= */}
      <AnimatePresence>
        {selectedPkg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-800">
                  تعديل باقة: {selectedPkg.name}
                </h3>
                <button onClick={() => setSelectedPkg(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdatePackage} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم الباقة</label>
                  <input
                    type="text"
                    required
                    value={pkgForm.name}
                    onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الوصف الفرعي</label>
                  <input
                    type="text"
                    value={pkgForm.subtitle}
                    onChange={(e) => setPkgForm({ ...pkgForm, subtitle: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">السعر (USD)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 4.99"
                      value={pkgForm.price_usd}
                      onChange={(e) => setPkgForm({ ...pkgForm, price_usd: e.target.value })}
                      className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">عدد الجلسات</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={pkgForm.games_count}
                      onChange={(e) => setPkgForm({ ...pkgForm, games_count: e.target.value })}
                      className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition"
                  >
                    حفظ الباقة
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPkg(null)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= CREATE PROMO MODAL ================= */}
      <AnimatePresence>
        {promoModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-800">إنشاء برومو كود جديد</h3>
                <button onClick={() => setPromoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePromo} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">رمز الكود الترويجي</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: JALSAH2026"
                    value={promoForm.code}
                    onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-mono font-bold uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الحد الأقصى للمستخدمين</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={promoForm.global_limit}
                      onChange={(e) => setPromoForm({ ...promoForm, global_limit: e.target.value })}
                      className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">عدد الجلسات الممنوحة</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={promoForm.games_reward}
                      onChange={(e) => setPromoForm({ ...promoForm, games_reward: e.target.value })}
                      className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="is_active_cb"
                    checked={promoForm.is_active}
                    onChange={(e) => setPromoForm({ ...promoForm, is_active: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <label htmlFor="is_active_cb" className="text-xs font-bold text-slate-700">
                    تفعيل الكود فوراً للاستخدام
                  </label>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition"
                  >
                    حفظ البرومو كود
                  </button>
                  <button
                    type="button"
                    onClick={() => setPromoModalOpen(false)}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
