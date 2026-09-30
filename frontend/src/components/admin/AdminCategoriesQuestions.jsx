import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  HelpCircle,
  Plus,
  Trash2,
  Edit,
  Search,
  Filter,
  RefreshCw,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  Layers,
  Upload
} from 'lucide-react';
import { authFetch } from '../../utils/api';

export const AdminCategoriesQuestions = () => {
  const [activeSubTab, setActiveSubTab] = useState('categories'); // 'categories' | 'questions'

  // Data states
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters for Questions
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [selectedPointsFilter, setSelectedPointsFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', description: '', image_url: '' });

  // Question Modal
  const [qModalOpen, setQModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qForm, setQForm] = useState({
    category_id: '',
    question_text: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct_option_index: 0,
    points_level: 200,
    status: 'approved'
  });

  const [toastMsg, setToastMsg] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleImportJson = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await authFetch('/api/admin/questions/import-json', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'تعذر استيراد ملف JSON');
      showToast(`تم استيراد ${data.imported} سؤال إلى طابور المراجعة.`);
      fetchQuestions();
    } catch (error) {
      showToast(error.message || 'تعذر استيراد ملف JSON');
    } finally {
      setIsImporting(false);
    }
  };

  // Fetch Categories
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !qForm.category_id) {
          setQForm((prev) => ({ ...prev, category_id: data[0].id }));
        }
      }
    } catch (e) {
      console.error('Error fetching categories:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Questions
  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      let url = '/api/admin/questions?';
      if (selectedCatFilter) url += `category_id=${selectedCatFilter}&`;
      if (selectedPointsFilter) url += `points_level=${selectedPointsFilter}&`;
      if (selectedStatusFilter && selectedStatusFilter !== 'all') url += `status=${selectedStatusFilter}&`;

      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (e) {
      console.error('Error fetching questions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'questions') {
      fetchQuestions();
    }
  }, [activeSubTab, selectedCatFilter, selectedPointsFilter, selectedStatusFilter]);

  // Handle Category Submit
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    try {
      if (editingCategory) {
        const res = await authFetch(`/api/admin/categories/${editingCategory.id}`, {
          method: 'PUT',
          body: JSON.stringify(catForm)
        });
        if (!res.ok) throw new Error('فشل تحديث الفئة');
        showToast('تم تحديث الفئة بنجاح! ✨');
      } else {
        const res = await authFetch('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(catForm)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'فشل إضافة الفئة');
        }
        showToast('تمت إضافة الفئة الجديدة بنجاح! 🚀');
      }
      setCatModalOpen(false);
      setEditingCategory(null);
      setCatForm({ name: '', description: '', image_url: '' });
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف فئة [${name}] وكافة أسئلتها؟`)) return;
    try {
      const res = await authFetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast(`تم حذف فئة [${name}] بنجاح.`);
        fetchCategories();
        if (activeSubTab === 'questions') fetchQuestions();
      }
    } catch (err) {
      alert('فشل حذف الفئة');
    }
  };

  // Handle Question Submit
  const handleQuestionSubmit = async (e) => {
    e.preventDefault();
    if (!qForm.question_text.trim()) return;

    const options = [
      qForm.option1.trim(),
      qForm.option2.trim(),
      qForm.option3.trim(),
      qForm.option4.trim()
    ].filter(Boolean);

    if (options.length < 2) {
      alert('يجب كتابة خيارين على الأقل للسؤال.');
      return;
    }

    const correctAnswer = options[qForm.correct_option_index] || options[0];

    const payload = {
      category_id: parseInt(qForm.category_id, 10),
      question_text: qForm.question_text.trim(),
      options_json: options,
      correct_answer: correctAnswer,
      points_level: parseInt(qForm.points_level, 10),
      media_url: qForm.media_url?.trim() || null,
      status: qForm.status || 'approved'
    };

    try {
      if (editingQuestion) {
        const res = await authFetch(`/api/admin/questions/${editingQuestion.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('فشل تحديث السؤال');
        showToast('تم تحديث السؤال بنجاح! ✨');
      } else {
        const res = await authFetch('/api/admin/questions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('فشل إضافة السؤال');
        showToast('تمت إضافة السؤال لبنك الأسئلة بنجاح! 🎉');
      }

      setQModalOpen(false);
      setEditingQuestion(null);
      setQForm({
        category_id: categories[0]?.id || '',
        question_text: '',
        option1: '',
        option2: '',
        option3: '',
        option4: '',
        correct_option_index: 0,
        points_level: 200,
        status: 'approved'
      });
      fetchQuestions();
      fetchCategories();
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Delete Question
  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال نهائياً؟')) return;
    try {
      const res = await authFetch(`/api/admin/questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('تم حذف السؤال.');
        fetchQuestions();
        fetchCategories();
      }
    } catch (err) {
      alert('فشل حذف السؤال');
    }
  };

  const handleApproveAllPending = async () => {
    if (!window.confirm('هل تريد اعتماد جميع الأسئلة الموجودة في طابور المراجعة؟')) return;

    try {
      const response = await authFetch('/api/admin/questions/approve-all-pending', {
        method: 'POST'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'تعذر اعتماد الأسئلة');
      showToast(`تم اعتماد ${data.approved} سؤال بنجاح.`);
      fetchQuestions();
    } catch (error) {
      showToast(error.message || 'تعذر اعتماد الأسئلة');
    }
  };

  const handleShuffleAllOptions = async () => {
    if (!window.confirm('هل تريد خلط خيارات جميع الأسئلة؟ ستبقى الإجابات الصحيحة محفوظة.')) return;

    try {
      const response = await authFetch('/api/admin/questions/shuffle-options', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'تعذر خلط الخيارات');
      showToast(`تم خلط خيارات ${data.shuffled} سؤال.`);
      fetchQuestions();
    } catch (error) {
      showToast(error.message || 'تعذر خلط الخيارات');
    }
  };

  const handleDeleteAllQuestions = async () => {
    if (!window.confirm('تحذير: سيتم حذف جميع أسئلة بنك الأسئلة نهائياً. هل تريد المتابعة؟')) return;
    if (!window.confirm('تأكيد أخير: حذف جميع الأسئلة؟')) return;

    try {
      const response = await authFetch('/api/admin/questions/delete-all', { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'تعذر حذف الأسئلة');
      showToast(`تم حذف ${data.deleted} سؤال.`);
      fetchQuestions();
      fetchCategories();
    } catch (error) {
      showToast(error.message || 'تعذر حذف الأسئلة');
    }
  };

  const getCategoryName = (catId) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : `فئة #${catId}`;
  };

  const filteredQuestions = questions.filter((q) =>
    q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      {/* Main Header & Sub-Tabs Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-800">الفئات وبنك الأسئلة</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            إدارة فئات وتصنيفات اللعبة، وربط الأسئلة مع مستويات النقاط التكتيكية (200، 400، 600).
          </p>
        </div>

        {/* Sub-Tabs Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveSubTab('categories')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'categories'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-4 h-4" /> فئات اللعبة ({categories.length})
          </button>
          <button
            onClick={() => setActiveSubTab('questions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'questions'
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> بنك الأسئلة
          </button>
        </div>
      </div>

      {/* ================= SECTION 1: CATEGORIES ================= */}
      {activeSubTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-slate-800">قائمة التصنيفات النشطة</h3>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatForm({ name: '', description: '', image_url: '' });
                setCatModalOpen(true);
              }}
              className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> إضافة فئة جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                whileHover={{ y: -3 }}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
                      {cat.image_url ? (
                        <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        '🎯'
                      )}
                    </div>
                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-black border border-purple-100">
                      {cat.questions_count || 0} سؤال
                    </span>
                  </div>

                  <h4 className="text-lg font-black text-slate-900 mt-4">{cat.name}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {cat.description || 'لا يوجد وصف مدخل لهذه الفئة.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-50">
                  <button
                    onClick={() => {
                      setEditingCategory(cat);
                      setCatForm({
                        name: cat.name,
                        description: cat.description || '',
                        image_url: cat.image_url || ''
                      });
                      setCatModalOpen(true);
                    }}
                    className="flex-1 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" /> تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs transition"
                    title="حذف الفئة"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ================= SECTION 2: QUESTION BANK ================= */}
      {activeSubTab === 'questions' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في نص السؤال..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-9 pl-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:border-purple-500"
            >
              <option value="">كافة الفئات</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Points Filter */}
            <select
              value={selectedPointsFilter}
              onChange={(e) => setSelectedPointsFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:border-purple-500"
            >
              <option value="">كافة النقاط</option>
              <option value="200">مستوى 200 نقطة</option>
              <option value="400">مستوى 400 نقطة</option>
              <option value="600">مستوى 600 نقطة</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:border-purple-500"
            >
              <option value="all">كافة الحالات</option>
              <option value="approved">معتمد (Approved)</option>
              <option value="pending">قيد المراجعة (Pending)</option>
              <option value="active">نشط (Active)</option>
            </select>

            <button
              onClick={() => {
                setEditingQuestion(null);
                setQForm({
                  category_id: categories[0]?.id || '',
                  question_text: '',
                  option1: '',
                  option2: '',
                  option3: '',
                  option4: '',
                  correct_option_index: 0,
                  points_level: 200,
                  media_url: '',
                  status: 'approved'
                });
                setQModalOpen(true);
              }}
              className="py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> إضافة سؤال يدوياً
            </button>

            <label className="cursor-pointer py-2 px-4 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition">
              <Upload className="w-4 h-4" />
              {isImporting ? 'جارٍ الاستيراد...' : 'رفع JSON'}
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleImportJson}
                className="hidden"
                disabled={isImporting}
              />
            </label>

            <button
              type="button"
              onClick={handleApproveAllPending}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" /> اعتماد الكل
            </button>

            <button
              type="button"
              onClick={handleShuffleAllOptions}
              className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <RefreshCw className="w-4 h-4" /> لخبطة الإجابات
            </button>

            <button
              type="button"
              onClick={handleDeleteAllQuestions}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Trash2 className="w-4 h-4" /> حذف الكل
            </button>
          </div>

          {/* Questions Table */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">نص السؤال</th>
                    <th className="py-3.5 px-4">الفئة</th>
                    <th className="py-3.5 px-4">مستوى النقاط</th>
                    <th className="py-3.5 px-4">الإجابة الصحيحة</th>
                    <th className="py-3.5 px-4">الحالة</th>
                    <th className="py-3.5 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-medium text-slate-700">
                  {filteredQuestions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                        لا توجد أسئلة مطابقة للفلتر المحدد
                      </td>
                    </tr>
                  ) : (
                    filteredQuestions.map((q) => (
                      <tr key={q.id} className="hover:bg-purple-50/30 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-400">{q.id}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">{q.question_text}</td>
                        <td className="py-3.5 px-4 text-slate-600 font-bold">{getCategoryName(q.category_id)}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black inline-block ${
                            q.points_level === 600
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : q.points_level === 400
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                              : 'bg-purple-100 text-purple-800 border border-purple-200'
                          }`}>
                            {q.points_level} نقطة
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px] inline-block">
                            ✓ {q.correct_answer}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            q.status === 'approved' || q.status === 'active'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {q.status === 'approved' || q.status === 'active' ? 'معتمد' : 'معلق'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingQuestion(q);
                                const opts = Array.isArray(q.options_json) ? q.options_json : [];
                                setQForm({
                                  category_id: q.category_id,
                                  question_text: q.question_text,
                                  option1: opts[0] || '',
                                  option2: opts[1] || '',
                                  option3: opts[2] || '',
                                  option4: opts[3] || '',
                                  correct_option_index: opts.indexOf(q.correct_answer) >= 0 ? opts.indexOf(q.correct_answer) : 0,
                                  points_level: q.points_level,
                                  media_url: q.media_url || '',
                                  status: q.status
                                });
                                setQModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-purple-600 rounded-lg hover:bg-slate-100"
                              title="تعديل"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= CATEGORY MODAL ================= */}
      <AnimatePresence>
        {catModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-800">
                  {editingCategory ? 'تعديل بيانات الفئة' : 'إضافة فئة جديدة'}
                </h3>
                <button onClick={() => setCatModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCategorySubmit} className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">اسم الفئة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: تاريخ وإمبراطوريات"
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">الوصف</label>
                  <textarea
                    rows={3}
                    placeholder="نبذة مختصرة عن أسئلة وتحديات هذه الفئة"
                    value={catForm.description}
                    onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">رابط الصورة / الأيقونة (اختياري)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={catForm.image_url}
                    onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition"
                  >
                    حفظ الفئة
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatModalOpen(false)}
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

      {/* ================= QUESTION MODAL ================= */}
      <AnimatePresence>
        {qModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-800">
                  {editingQuestion ? 'تعديل السؤال' : 'إضافة سؤال جديد لبنك الأسئلة'}
                </h3>
                <button onClick={() => setQModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleQuestionSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">الفئة</label>
                    <select
                      value={qForm.category_id}
                      onChange={(e) => setQForm({ ...qForm, category_id: e.target.value })}
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

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">مستوى النقاط</label>
                    <select
                      value={qForm.points_level}
                      onChange={(e) => setQForm({ ...qForm, points_level: e.target.value })}
                      className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:outline-none focus:border-purple-500"
                    >
                      <option value="200">200 نقطة (مستوى البداية)</option>
                      <option value="400">400 نقطة (مستوى التحدي)</option>
                      <option value="600">600 نقطة (مستوى الحسم)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">نص السؤال</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="أدخل نص السؤال بوضوح..."
                    value={qForm.question_text}
                    onChange={(e) => setQForm({ ...qForm, question_text: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                  />
                </div>

                {/* 4 Options with radio for correct answer */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">
                    الخيارات الأربعة (حدد الإجابة الصحيحة بالدائرة الخضراء):
                  </label>
                  <div className="space-y-2">
                    {['option1', 'option2', 'option3', 'option4'].map((optKey, idx) => (
                      <div key={optKey} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correct_answer_radio"
                          checked={qForm.correct_option_index === idx}
                          onChange={() => setQForm({ ...qForm, correct_option_index: idx })}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <input
                          type="text"
                          required={idx < 2}
                          placeholder={`الخيار ${idx + 1}`}
                          value={qForm[optKey]}
                          onChange={(e) => setQForm({ ...qForm, [optKey]: e.target.value })}
                          className={`flex-1 py-2 px-3 text-xs rounded-2xl border ${
                            qForm.correct_option_index === idx
                              ? 'bg-emerald-50/40 border-emerald-300 font-bold'
                              : 'bg-slate-50 border-slate-200'
                          } focus:outline-none focus:border-purple-500`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    رابط وسائط السؤال (اختياري: صورة أو مقطع صوتي)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg أو .mp3"
                    value={qForm.media_url || ''}
                    onChange={(e) => setQForm({ ...qForm, media_url: e.target.value })}
                    className="w-full py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 font-medium"
                    dir="ltr"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    يدعم صور JPG / PNG / WebP ومقاطع MP3 / WAV / OGG
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-xs transition"
                  >
                    حفظ السؤال
                  </button>
                  <button
                    type="button"
                    onClick={() => setQModalOpen(false)}
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
