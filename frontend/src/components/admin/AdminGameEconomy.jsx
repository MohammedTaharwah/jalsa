import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coins,
  Zap,
  Snowflake,
  Swords,
  HelpCircle,
  Shield,
  Edit,
  Save,
  Plus,
  X,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { authFetch } from '../../utils/api';

export const AdminGameEconomy = () => {
  const [powerups, setPowerups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Edit State
  const [editingPowerup, setEditingPowerup] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', cost: 100 });

  // Add State
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', description: '', cost: 100 });

  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchPowerups = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/economy/powerups');
      if (res.ok) {
        const data = await res.json();
        setPowerups(data);
      }
    } catch (e) {
      console.error('Error fetching powerups:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPowerups();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingPowerup) return;

    try {
      const res = await authFetch(`/api/admin/economy/powerups/${editingPowerup.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          cost: parseInt(editForm.cost, 10),
          name: editForm.name,
          description: editForm.description
        })
      });

      if (!res.ok) throw new Error('فشل تحديث تكلفة السلاح التكتيكي');

      showToast(`تم تحديث تكلفة [${editForm.name}] إلى ${editForm.cost} نقطة بنجاح! ⚡`);
      setEditingPowerup(null);
      fetchPowerups();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;

    try {
      const res = await authFetch('/api/admin/economy/powerups', {
        method: 'POST',
        body: JSON.stringify({
          name: addForm.name.trim(),
          description: addForm.description.trim(),
          cost: parseInt(addForm.cost, 10)
        })
      });

      if (!res.ok) throw new Error('فشل إضافة السلاح التكتيكي');

      showToast('تمت إضافة السلاح التكتيكي الجديد بنجاح! 🛡️');
      setAddModalOpen(false);
      setAddForm({ name: '', description: '', cost: 100 });
      fetchPowerups();
    } catch (err) {
      alert(err.message);
    }
  };

  const getPowerupVisuals = (name) => {
    const n = name.toLowerCase();
    if (n.includes('double') || n.includes('دبل') || n.includes('مضاعف')) {
      return {
        icon: Zap,
        color: 'from-purple-500 to-indigo-600',
        badge: 'x2 مضاعفة',
        bg: 'bg-purple-50 text-purple-700 border-purple-200'
      };
    }
    if (n.includes('freeze') || n.includes('حظر') || n.includes('تجميد')) {
      return {
        icon: Snowflake,
        color: 'from-cyan-500 to-blue-600',
        badge: 'حظر دور',
        bg: 'bg-cyan-50 text-cyan-700 border-cyan-200'
      };
    }
    if (n.includes('steal') || n.includes('سرقة') || n.includes('سلب')) {
      return {
        icon: Swords,
        color: 'from-rose-500 to-pink-600',
        badge: 'سرقة سؤال',
        bg: 'bg-rose-50 text-rose-700 border-rose-200'
      };
    }
    if (n.includes('fifty') || n.includes('50') || n.includes('حذف')) {
      return {
        icon: HelpCircle,
        color: 'from-amber-500 to-orange-500',
        badge: 'حذف 50:50',
        bg: 'bg-amber-50 text-amber-700 border-amber-200'
      };
    }
    return {
      icon: Shield,
      color: 'from-emerald-500 to-teal-600',
      badge: 'سلاح تكتيكي',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800">اقتصاد اللعبة والأسلحة التكتيكية</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            التحكم الديناميكي في تكلفة الأسلحة بالنقاط (حظر الخصم، دبل النقاط، سرقة سؤال، 50:50) مباشرة من قاعدة البيانات.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAddModalOpen(true)}
            className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> إضافة سلاح جديد
          </button>
          <button
            onClick={fetchPowerups}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
            title="تحديث"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Powerups Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {powerups.map((p) => {
          const visuals = getPowerupVisuals(p.name);
          const Icon = visuals.icon;

          return (
            <motion.div
              key={p.id}
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-gradient-to-tr ${visuals.color} shadow-md`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${visuals.bg}`}>
                    {visuals.badge}
                  </span>
                </div>

                <h3 className="text-base font-black text-slate-900 mt-4 capitalize">{p.name}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-3">
                  {p.description || 'سلاح تكتيكي يمنح الفريق ميزة تنافسية أثناء الجلسة.'}
                </p>

                <div className="mt-5 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900">تكلفة التفعيل:</span>
                  <span className="text-lg font-black text-amber-700 flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-500" />
                    {p.cost} نقطة
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setEditingPowerup(p);
                  setEditForm({
                    name: p.name,
                    description: p.description || '',
                    cost: p.cost
                  });
                }}
                className="mt-6 w-full py-2.5 px-4 bg-slate-50 hover:bg-purple-50 hover:text-purple-700 text-slate-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-100"
              >
                <Edit className="w-3.5 h-3.5" /> تعديل التكلفة والوصف
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Edit Powerup Modal */}
      <AnimatePresence>
        {editingPowerup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-800">
                  تعديل السلاح التكتيكي: {editingPowerup.name}
                </h3>
                <button onClick={() => setEditingPowerup(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم السلاح</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تكلفة النقاط (Points Cost)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="10"
                    value={editForm.cost}
                    onChange={(e) => setEditForm({ ...editForm, cost: e.target.value })}
                    className="w-full py-2.5 px-3 text-base font-black text-amber-700 bg-amber-50/50 border border-amber-300 rounded-2xl focus:outline-none focus:border-purple-500 text-center"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">النقاط التي يجب على الفريق دفعها من رصيده لتفعيل هذا السلاح.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الوصف والتأثير</label>
                  <textarea
                    rows={3}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition"
                  >
                    حفظ التغييرات في PostgreSQL
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingPowerup(null)}
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

      {/* Create Powerup Modal */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-800">إضافة سلاح تكتيكي جديد</h3>
                <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم السلاح (Key/Name)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: shield أو تمديد الوقت"
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">تكلفة النقاط</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="10"
                    value={addForm.cost}
                    onChange={(e) => setAddForm({ ...addForm, cost: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الوصف</label>
                  <textarea
                    rows={3}
                    placeholder="شرح آلية عمل السلاح وكيفية الاستفادة منه"
                    value={addForm.description}
                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition"
                  >
                    حفظ السلاح
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
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
