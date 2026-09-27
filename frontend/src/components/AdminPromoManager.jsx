import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tag,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Users,
  Gamepad2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  Sparkles,
  RotateCw
} from 'lucide-react';
import { API_BASE } from '../utils/api';

export const AdminPromoManager = ({ isOpen, onClose }) => {
  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Form state
  const [code, setCode] = useState('');
  const [globalLimit, setGlobalLimit] = useState(20);
  const [gamesReward, setGamesReward] = useState(2);
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  // Fetch promos
  const fetchPromos = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/promo/admin/list`);
      if (res.ok) {
        const data = await res.json();
        setPromos(data);
      }
    } catch (err) {
      console.error('Error fetching promos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPromos();
    }
  }, [isOpen]);

  // Create promo
  const handleCreatePromo = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    setFormMsg({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE}/promo/admin/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          global_limit: Number(globalLimit),
          games_reward: Number(gamesReward),
          is_active: true
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || 'فشل في إنشاء الكود');
      }

      setFormMsg({ type: 'success', text: `تم إنشاء الكود [${data.code}] بنجاح!` });
      setCode('');
      fetchPromos();
    } catch (err) {
      setFormMsg({ type: 'error', text: err.message });
    }
  };

  // Toggle active
  const handleToggle = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/promo/admin/${id}/toggle`, {
        method: 'PATCH'
      });
      if (res.ok) {
        fetchPromos();
      }
    } catch (err) {
      console.error('Error toggling promo:', err);
    }
  };

  // Delete promo
  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا البرومو كود نهائياً؟')) return;

    try {
      const res = await fetch(`${API_BASE}/promo/admin/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchPromos();
      }
    } catch (err) {
      console.error('Error deleting promo:', err);
    }
  };

  // Copy code to clipboard
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94 }}
        className="w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col justify-between overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">
                إدارة الأكواد والبرومو كود 🎟️
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                إنشاء وتتبع أكواد الألعاب المجانية والتحكم بالحد الأقصى للمستخدمين
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area with scroll */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* Create Promo Form */}
          <form
            onSubmit={handleCreatePromo}
            className="p-5 rounded-2xl bg-gradient-to-r from-purple-50/60 via-slate-50 to-orange-50/60 border border-slate-200/80"
          >
            <h4 className="text-sm font-black text-slate-800 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-600" />
              إنشاء برومو كود جديد
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  نص الكود (Code)
                </label>
                <input
                  type="text"
                  placeholder="مثال: JALSAH2026"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-mono font-bold text-sm focus:border-purple-600 outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  الحد الأقصى للمستخدمين (Global Limit)
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={globalLimit}
                  onChange={(e) => setGlobalLimit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm focus:border-purple-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  عدد الألعاب المجانية (Reward)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={gamesReward}
                  onChange={(e) => setGamesReward(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-800 font-bold text-sm focus:border-purple-600 outline-none"
                />
              </div>
            </div>

            {/* Form Message */}
            {formMsg.text && (
              <div className={`p-2.5 rounded-xl mb-3 text-xs font-bold flex items-center gap-2 ${
                formMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {formMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{formMsg.text}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة وتفعيل الكود</span>
            </button>
          </form>

          {/* Promo Codes List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>قائمة الأكواد الحالية ({promos.length})</span>
                {isLoading && <RotateCw className="w-3.5 h-3.5 text-purple-600 animate-spin" />}
              </h4>

              <button
                onClick={fetchPromos}
                className="text-[11px] font-bold text-purple-600 hover:text-purple-800 transition-colors"
              >
                تحديث القائمة
              </button>
            </div>

            {promos.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs font-medium">
                لا توجد أكواد ترويجية مضافة بعد. يمكنك إنشاء كود جديد من النموذج أعلاه.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {promos.map((p) => {
                  const percentUsed = Math.min(100, Math.round((p.current_uses / p.global_limit) * 100));

                  return (
                    <div
                      key={p.id}
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
                        p.is_active
                          ? 'bg-white border-slate-200 shadow-sm'
                          : 'bg-slate-50 border-slate-200/60 opacity-60'
                      }`}
                    >
                      {/* Code and Reward Info */}
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-mono font-black text-sm tracking-wider flex items-center gap-2">
                          <span>{p.code}</span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.code, p.id)}
                            className="text-purple-400 hover:text-purple-700 transition-colors"
                            title="نسخ الكود"
                          >
                            {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>

                        <span className="px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 font-black text-xs flex items-center gap-1">
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span>+{p.games_reward} ألعاب</span>
                        </span>
                      </div>

                      {/* Usage Progress Bar */}
                      <div className="w-full sm:w-48 text-right">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" /> المستخدمين:
                          </span>
                          <span className={p.current_uses >= p.global_limit ? 'text-rose-600' : 'text-slate-800'}>
                            {p.current_uses} / {p.global_limit}
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percentUsed >= 100 ? 'bg-rose-500' : 'bg-purple-600'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggle(p.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                            p.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          {p.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          <span>{p.is_active ? 'مفعّل' : 'معطّل'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="حذف الكود"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
          >
            إغلاق لوحة الأكواد
          </button>
        </div>
      </motion.div>
    </div>
  );
};
