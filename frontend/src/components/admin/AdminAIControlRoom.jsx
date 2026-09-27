import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Zap,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  Upload
} from 'lucide-react';
import { authFetch } from '../../utils/api';

export const AdminAIControlRoom = () => {
  const [categories, setCategories] = useState([]);
  const [pendingQuestions, setPendingQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generator form
  const [selectedCatId, setSelectedCatId] = useState('');
  const [genCount, setGenCount] = useState(3);
  const [difficulty, setDifficulty] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchCategories = async () => {
    try {
      const res = await authFetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !selectedCatId) {
          setSelectedCatId(data[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    }
  };

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/questions/pending');
      if (res.ok) {
        const data = await res.json();
        setPendingQuestions(data);
      }
    } catch (e) {
      console.error('Error fetching pending questions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchPending();
  }, []);

  // Trigger n8n Generation
  const handleTriggerGeneration = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setGenResult(null);

    const catObj = categories.find((c) => c.id === parseInt(selectedCatId, 10));

    try {
      const res = await authFetch('/api/admin/generate-questions', {
        method: 'POST',
        body: JSON.stringify({
          category_id: catObj?.id,
          category_name: catObj?.name || 'عام',
          count: parseInt(genCount, 10),
          difficulty: difficulty,
          language: 'ar'
        })
      });

      const data = await res.json();
      setGenResult(data);

      if (res.ok) {
        showToast('تم إرسال أمر التوليد بنجاح! 🚀');
        // Refresh pending questions after a short delay
        setTimeout(() => fetchPending(), 1200);
      } else {
        throw new Error(data.detail || 'حدث خطأ أثناء الاتصال بـ n8n');
      }
    } catch (err) {
      setGenResult({
        status: 'error',
        message: err.message || 'تعذر التواصل مع خادم n8n'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportJson = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch('/api/admin/questions/import-json', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'تعذر استيراد ملف JSON');
      showToast(`تم استيراد ${data.imported} سؤال إلى طابور المراجعة.`);
      fetchPending();
    } catch (error) {
      showToast(error.message || 'تعذر استيراد ملف JSON');
    } finally {
      setIsImporting(false);
    }
  };

  // Approve / Reject Question
  const handleReviewStatus = async (qId, newStatus) => {
    try {
      const res = await authFetch(`/api/admin/questions/${qId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setPendingQuestions((prev) => prev.filter((q) => q.id !== qId));
        if (newStatus === 'approved') {
          showToast('تم اعتماد السؤال وإضافته لبنك الأسئلة المتاح باللعبة! 🎉');
        } else {
          showToast('تم رفض واستبعاد السؤال.');
        }
      }
    } catch (err) {
      alert('فشل تحديث حالة السؤال');
    }
  };

  const getCategoryName = (catId) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : `فئة #${catId}`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-purple-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-amber-300 flex items-center gap-1">
              <Bot className="w-3.5 h-3.5" /> غرفة الذكاء الاصطناعي و n8n
            </span>
            <span className="text-xs text-purple-200">Webhook Automation</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            توليد ومراجعة الأسئلة الذكية 🤖
          </h2>
          <p className="text-purple-200 text-sm mt-1 max-w-xl">
            إطلاق أوامر التوليد الآلي عبر n8n ومراجعة طابور الأسئلة المعلقة لاعتمادها في اللوحة.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-4 py-2 bg-white/10 border border-white/20 rounded-2xl text-xs font-bold backdrop-blur-sm flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            جاهز لاستقبال الـ Webhooks
          </div>
        </div>
      </div>

      {/* Generation Trigger Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-800">إطلاق أمر توليد أسئلة جديد</h3>
            <p className="text-xs text-slate-400">حدد الفئة والمواصفات لإرسال حمولة الـ Webhook إلى سير عمل n8n</p>
          </div>
        </div>

        <form onSubmit={handleTriggerGeneration} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Category Select */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">الفئة المستهدفة</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-purple-500"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Count */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">عدد الأسئلة المطلوب</label>
            <select
              value={genCount}
              onChange={(e) => setGenCount(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-purple-500"
            >
              <option value="3">3 أسئلة (تغطية تدرج 200, 400, 600)</option>
              <option value="6">6 أسئلة</option>
              <option value="9">9 أسئلة</option>
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">مستوى التحدي</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-purple-500"
            >
              <option value="medium">متدرج وموزع (مستحسن)</option>
              <option value="hard">صعب وتكتيكي (Pro)</option>
              <option value="easy">سهل وممتع (Casual)</option>
            </select>
          </div>

          {/* Trigger Button */}
          <div>
            <button
              type="submit"
              disabled={isGenerating || categories.length === 0}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جارٍ التوليد عبر n8n...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  توليد الأسئلة فوراً 🚀
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-300">
          <div>
            <p className="text-xs font-black text-slate-700">n8n لا يعمل؟ استورد الأسئلة من JSON</p>
            <p className="text-[11px] text-slate-500 mt-1">سيتم فحصها وإضافتها إلى طابور المراجعة بحالة Pending.</p>
          </div>
          <label className="cursor-pointer px-4 py-2 rounded-xl bg-white border border-slate-200 text-purple-700 hover:bg-purple-50 text-xs font-black flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {isImporting ? 'جارٍ الاستيراد...' : 'اختيار ملف JSON'}
            <input type="file" accept="application/json,.json" onChange={handleImportJson} className="hidden" disabled={isImporting} />
          </label>
        </div>

        {/* Feedback alert after generation */}
        {genResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mt-4 p-4 rounded-2xl text-xs font-bold flex items-center justify-between ${
              genResult.status === 'success' || genResult.status === 'simulated_success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{genResult.message}</span>
            </div>
            <button
              onClick={() => setGenResult(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Review Queue (طابور المراجعة والاعتماد) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              {pendingQuestions.length}
            </span>
            <h3 className="text-lg font-black text-slate-800">
              طابور المراجعة والاعتماد (Pending Approval)
            </h3>
          </div>

          <button
            onClick={fetchPending}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث الطابور
          </button>
        </div>

        {pendingQuestions.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-black text-slate-800">
              رائع! طابور المراجعة فارغ تماماً 🎉
            </h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              كافة الأسئلة المولدة بالذكاء الاصطناعي تمت مراجعتها واعتمادها في بنك الأسئلة. يمكنك توليد دفعة جديدة بالأعلى في أي وقت.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingQuestions.map((q) => {
              const options = Array.isArray(q.options_json) ? q.options_json : [];
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-3xl p-6 border-2 border-amber-200/70 hover:border-amber-300 shadow-sm flex flex-col justify-between transition-all"
                >
                  <div>
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700 font-black text-[11px] border border-purple-100">
                        {getCategoryName(q.category_id)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-black ${
                        q.points_level === 600
                          ? 'bg-amber-100 text-amber-800'
                          : q.points_level === 400
                          ? 'bg-cyan-100 text-cyan-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {q.points_level} نقطة
                      </span>
                    </div>

                    {/* Question text */}
                    <h4 className="text-sm font-black text-slate-900 leading-snug">
                      {q.question_text}
                    </h4>

                    {/* Options list */}
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {options.map((opt, idx) => {
                        const isCorrect = opt === q.correct_answer;
                        return (
                          <div
                            key={idx}
                            className={`p-2.5 rounded-2xl text-xs font-bold border transition ${
                              isCorrect
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-300'
                                : 'bg-slate-50 text-slate-600 border-slate-100'
                            }`}
                          >
                            <span className="text-[10px] opacity-60 ml-1">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            {opt}
                            {isCorrect && (
                              <span className="text-[10px] text-emerald-600 mr-1 font-black">
                                (صحيح ✓)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleReviewStatus(q.id, 'approved')}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20 transition"
                    >
                      <Check className="w-4 h-4" /> اعتماد وإضافة للبنك
                    </button>
                    <button
                      onClick={() => handleReviewStatus(q.id, 'rejected')}
                      className="py-2.5 px-4 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <X className="w-4 h-4" /> رفض
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
