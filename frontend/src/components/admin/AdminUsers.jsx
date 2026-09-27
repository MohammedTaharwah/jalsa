import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  Filter,
  Coins,
  Shield,
  CheckCircle2,
  XCircle,
  Edit,
  Plus,
  Minus,
  RefreshCw,
  Save,
  X,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { authFetch } from '../../utils/api';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Edit Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [editBalance, setEditBalance] = useState(0);
  const [editRole, setEditRole] = useState('player');
  const [reason, setReason] = useState('تعويض ودعم فني');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditBalance(user.games_balance || 0);
    setEditRole(user.role || 'player');
    setReason('تعويض ودعم فني');
  };

  const handleSaveBalance = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/admin/users/${selectedUser.id}/balance`, {
        method: 'PATCH',
        body: JSON.stringify({
          games_balance: parseInt(editBalance, 10),
          role: editRole,
          reason: reason
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'فشل تحديث رصيد المستخدم');
      }

      const updatedUser = await res.json();

      // Update state in table
      setUsers((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );

      setToastMsg(`تم تحديث رصيد ${updatedUser.username} بنجاح إلى ${updatedUser.games_balance} جلسة! 🎉`);
      setTimeout(() => setToastMsg(null), 3500);

      setSelectedUser(null);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء حفظ التعديل');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold px-6 py-3 rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center gap-2 text-sm"
          >
            <CheckCircle2 className="w-5 h-5" />
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800">إدارة المستخدمين والدعم الفني</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            استعراض حسابات اللاعبين، التحقق من التوثيق، وإدارة أرصدة الجلسات والتعويضات.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="بحث بالاسم أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:border-purple-500"
          >
            <option value="all">كافة الأدوار</option>
            <option value="admin">المدراء فقط</option>
            <option value="player">اللاعبون فقط</option>
          </select>

          <button
            onClick={fetchUsers}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">#</th>
                <th className="py-3.5 px-4">اسم المستخدم</th>
                <th className="py-3.5 px-4">البريد الإلكتروني</th>
                <th className="py-3.5 px-4">الصلاحية</th>
                <th className="py-3.5 px-4">حالة التوثيق (OTP)</th>
                <th className="py-3.5 px-4">رصيد الجلسات</th>
                <th className="py-3.5 px-4 text-center">إجراءات الدعم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                    لا يوجد مستخدمين مطابقين للبحث
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-purple-50/30 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{u.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{u.username}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 border border-purple-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {u.role === 'admin' ? <Shield className="w-3 h-3" /> : null}
                        {u.role === 'admin' ? 'مدير (Admin)' : 'لاعب (Player)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        u.is_verified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {u.is_verified ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <XCircle className="w-3 h-3 text-amber-500" />}
                        {u.is_verified ? 'حساب موثق' : 'بانتظار التحقق'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-black text-slate-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 text-amber-800 inline-flex items-center gap-1.5">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        {u.games_balance} جلسات
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto shadow-sm shadow-purple-600/20"
                      >
                        <Edit className="w-3.5 h-3.5" /> تعديل الرصيد
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Balance & Support Modal */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Coins className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-slate-800">
                      تعديل رصيد اللاعب: {selectedUser.username}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBalance} className="mt-6 space-y-5">
                {/* Balance Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    رصيد الجلسات المتاح (Available Games)
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setEditBalance((prev) => Math.max(0, parseInt(prev || 0, 10) - 1))}
                      className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center text-base"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <input
                      type="number"
                      min="0"
                      value={editBalance}
                      onChange={(e) => setEditBalance(e.target.value)}
                      className="flex-1 py-2 px-4 text-center font-black text-xl text-purple-700 bg-purple-50/50 border border-purple-200 rounded-2xl focus:outline-none focus:border-purple-500"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setEditBalance((prev) => parseInt(prev || 0, 10) + 1)}
                      className="w-10 h-10 rounded-2xl bg-purple-100 hover:bg-purple-200 text-purple-700 font-black flex items-center justify-center text-base"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Increment Presets */}
                  <div className="flex items-center justify-center gap-2 mt-2">
                    {[+2, +5, +10, 0].map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (preset === 0) setEditBalance(0);
                          else setEditBalance((prev) => parseInt(prev || 0, 10) + preset);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
                      >
                        {preset === 0 ? 'تصفير (0)' : `+${preset} جلسات`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    صلاحية الحساب (Role)
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="player">لاعب عادي (Player)</option>
                    <option value="admin">مدير النظام (Admin) 👑</option>
                  </select>
                </div>

                {/* Reason Note */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    سبب التعديل / ملاحظة الدعم
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="مثال: تعويض انقطاع اتصال أو مكافأة"
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات فوراً'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
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
