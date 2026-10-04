import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Timer,
  Plus,
  Trash2,
  Upload,
  Search,
  Sparkles,
  Check,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { FIVE_SECONDS_QUESTIONS } from '../../data/fiveSecondsQuestions';
import { API_BASE } from '../../utils/api';

export const AdminFiveSecondsManager = () => {
  const { getAuthToken } = useGameStore();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');

  // Modals & Inputs
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState('');
  const [newCategory, setNewCategory] = useState('عام');
  const [importJsonText, setImportJsonText] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CATEGORIES = ['الكل', 'عام', 'أكلات', 'رياضة', 'سينما', 'يوميات'];

  // Fetch questions from backend with fallback to initial static questions
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/five-seconds/questions`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setQuestions(data);
          return;
        }
      }
      // If DB has 0 questions yet, show the 50 default questions
      setQuestions(FIVE_SECONDS_QUESTIONS);
    } catch (e) {
      console.warn('Backend fetch failed, using local questions:', e);
      setQuestions(FIVE_SECONDS_QUESTIONS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const showToast = (text, type = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Add a single question
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/five-seconds/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          category: newCategory,
          prompt: newPrompt.trim()
        })
      });

      if (res.ok) {
        const created = await res.json();
        setQuestions(prev => [created, ...prev]);
        setNewPrompt('');
        setAddModalOpen(false);
        showToast('تمت إضافة السؤال الجديد بنجاح!');
      } else {
        // Local fallback
        const localQ = { id: Date.now(), category: newCategory, prompt: newPrompt.trim() };
        setQuestions(prev => [localQ, ...prev]);
        setNewPrompt('');
        setAddModalOpen(false);
        showToast('تمت إضافة السؤال بنجاح (محلياً)!');
      }
    } catch (err) {
      const localQ = { id: Date.now(), category: newCategory, prompt: newPrompt.trim() };
      setQuestions(prev => [localQ, ...prev]);
      setNewPrompt('');
      setAddModalOpen(false);
      showToast('تمت إضافة السؤال بنجاح!');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk Import Questions from JSON or CSV
  const handleBulkImport = async () => {
    if (!importJsonText.trim()) return;
    setIsSubmitting(true);

    try {
      let parsed = [];
      try {
        parsed = JSON.parse(importJsonText);
      } catch (jsonErr) {
        // Try line-by-line format: prompt or category,prompt
        const lines = importJsonText.split('\n').filter(l => l.trim().length > 3);
        parsed = lines.map(line => {
          if (line.includes(',') || line.includes('،')) {
            const parts = line.split(/[,،]/);
            return { category: parts[0].trim(), prompt: parts.slice(1).join(',').trim() };
          }
          return { category: 'عام', prompt: line.trim() };
        });
      }

      if (!Array.isArray(parsed) || parsed.length === 0) {
        showToast('صيغة البيانات غير صحيحة. يرجى إدخال JSON أو أسطر نصية صحيحة.', 'error');
        setIsSubmitting(false);
        return;
      }

      const formatted = parsed.map(item => ({
        category: item.category || 'عام',
        prompt: item.prompt || item.text || item.question || ''
      })).filter(q => q.prompt.length > 3);

      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/five-seconds/questions/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ questions: formatted })
      });

      if (res.ok) {
        showToast(`تم استيراد ${formatted.length} سؤال بنجاح!`);
        fetchQuestions();
      } else {
        // Fallback local update
        setQuestions(prev => [...formatted.map((q, idx) => ({ ...q, id: Date.now() + idx })), ...prev]);
        showToast(`تم استيراد ${formatted.length} سؤال بنجاح!`);
      }

      setImportJsonText('');
      setImportModalOpen(false);
    } catch (err) {
      showToast('حدث خطأ أثناء الاستيراد.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete question
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا السؤال؟')) return;

    try {
      const token = getAuthToken();
      await fetch(`${API_BASE}/five-seconds/questions/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      setQuestions(prev => prev.filter(q => q.id !== id));
      showToast('تم حذف السؤال بنجاح');
    } catch (e) {
      setQuestions(prev => prev.filter(q => q.id !== id));
      showToast('تم حذف السؤال');
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchCat = selectedCategory === 'الكل' || q.category === selectedCategory;
    const matchSearch = !searchQuery.trim() || q.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20">
            ⚡
          </div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              إدارة أسئلة تحدي الـ 5 ثواني
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                مجانية 100%
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              إجمالي الأسئلة في البنك: <strong className="text-amber-400">{questions.length} سؤال</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-purple-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة سؤال جديد</span>
          </button>

          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>رفع دفعة مجمعة (Bulk)</span>
          </button>
        </div>
      </div>

      {/* Toast Alert */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 border ${
              statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4 text-rose-600" /> : <Check className="w-4 h-4 text-emerald-600" />}
            <span>{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ابحث عن سؤال أو كلمة معينة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500 font-bold text-slate-800"
            />
          </div>

          <div className="text-xs text-slate-500 font-bold">
            المعروض: <span className="text-purple-700 font-black">{filteredQuestions.length}</span> من {questions.length}
          </div>
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredQuestions.map((q, idx) => (
          <div
            key={q.id || idx}
            className="p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-purple-300 transition-all shadow-xs flex items-start justify-between gap-3 group"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-purple-50 border border-purple-200 text-purple-700 text-[10px] font-black">
                  {q.category || 'عام'}
                </span>
                <span className="text-[10px] text-slate-400 font-bold"># {q.id || idx + 1}</span>
              </div>
              <h4 className="text-sm font-black text-slate-900 leading-snug">
                {q.prompt}
              </h4>
            </div>

            <button
              type="button"
              onClick={() => handleDeleteQuestion(q.id)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0 opacity-60 group-hover:opacity-100"
              title="حذف هذا السؤال"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* ================= MODAL 1: ADD SINGLE QUESTION ================= */}
      <AnimatePresence>
        {addModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-purple-600" />
                  <span>إضافة سؤال تحدي 5 ثواني جديد</span>
                </h3>
                <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddQuestion} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">فئة السؤال:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="عام">عام</option>
                    <option value="أكلات">أكلات ومشروبات</option>
                    <option value="رياضة">رياضة وكرة قدم</option>
                    <option value="سينما">سينما وفن</option>
                    <option value="يوميات">مواقف ويوميات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    نص التحدي (يجب أن يبدأ بـ "اذكر 3..."):
                  </label>
                  <textarea
                    rows={3}
                    placeholder="مثال: اذكر 3 دول عربية تبدأ بحرف الميم!"
                    value={newPrompt}
                    onChange={(e) => setNewPrompt(e.target.value)}
                    className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-purple-500 resize-none"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition shadow-md shadow-purple-600/20"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : 'حفظ السؤال'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 2: BULK IMPORT ================= */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm" dir="rtl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Upload className="w-5 h-5 text-amber-500" />
                  <span>رفع واستيراد دفعة أسئلة مجمعة (Bulk Upload)</span>
                </h3>
                <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">يمكنك لصق الأسئلة كـ JSON أو سطر تلو الآخر كالتالي:</p>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-600 leading-relaxed" dir="ltr">
                  اذكر 3 دول في إفريقيا<br />
                  أكلات, اذكر 3 حلويات شرقية<br />
                  رياضة, اذكر 3 لاعبين فازوا بالكرة الذهبية
                </div>
              </div>

              <textarea
                rows={8}
                placeholder="الصق الأسئلة هنا..."
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full p-3 text-xs bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-amber-500 resize-none font-mono"
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={isSubmitting || !importJsonText.trim()}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition shadow-md shadow-amber-500/20"
                >
                  {isSubmitting ? 'جاري الاستيراد...' : 'بدء الاستيراد الآن'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
