import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  RotateCw,
  Search,
  Sparkles,
  Check,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export const AdminSpyManager = () => {
  const { getAuthToken } = useGameStore();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryWords, setCategoryWords] = useState([]);
  const [wordsLoading, setWordsLoading] = useState(false);

  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // Form states
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('Sparkles');
  const [catDesc, setCatDesc] = useState('');
  const [catInitialWords, setCatInitialWords] = useState('');
  const [newWordsInput, setNewWordsInput] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/spy/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !selectedCategory) {
          selectCategory(data[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching spy categories:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectCategory = async (cat) => {
    setSelectedCategory(cat);
    try {
      setWordsLoading(true);
      const res = await fetch(`/api/spy/full-categories?category_ids=${cat.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setCategoryWords(data[0].words || []);
        } else {
          setCategoryWords([]);
        }
      }
    } catch (e) {
      console.error('Error loading category words:', e);
    } finally {
      setWordsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    const token = getAuthToken();
    try {
      let catId = editingCategory?.id;
      if (editingCategory) {
        // Update
        const res = await fetch(`/api/admin/spy/categories/${catId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: catName.trim(),
            icon: catIcon,
            description: catDesc.trim()
          })
        });
        if (!res.ok) throw new Error('فشل تحديث الفئة');
      } else {
        // Create
        const res = await fetch('/api/admin/spy/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: catName.trim(),
            icon: catIcon,
            description: catDesc.trim()
          })
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || 'فشل إنشاء الفئة');
        }
        const created = await res.json();
        catId = created.id;

        // If initial words provided
        if (catInitialWords.trim()) {
          const wordsList = catInitialWords
            .split(/[,،\n]+/)
            .map((w) => w.trim())
            .filter(Boolean);
          if (wordsList.length > 0) {
            await fetch(`/api/admin/spy/categories/${catId}/words`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify(wordsList)
            });
          }
        }
      }

      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCatName('');
      setCatDesc('');
      setCatInitialWords('');
      setStatusMessage({ type: 'success', text: 'تم حفظ الفئة بنجاح!' });
      await fetchCategories();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err.message });
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الفئة وجميع كلماتها بالكامل؟')) return;
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/admin/spy/categories/${catId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStatusMessage({ type: 'success', text: 'تم حذف الفئة بنجاح' });
        setSelectedCategory(null);
        setCategoryWords([]);
        await fetchCategories();
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'حدث خطأ أثناء الحذف' });
    }
  };

  const handleAddWords = async (e) => {
    e.preventDefault();
    if (!newWordsInput.trim() || !selectedCategory) return;
    const wordsList = newWordsInput
      .split(/[,،\n]+/)
      .map((w) => w.trim())
      .filter(Boolean);
    if (wordsList.length === 0) return;

    const token = getAuthToken();
    try {
      const res = await fetch(`/api/admin/spy/categories/${selectedCategory.id}/words`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(wordsList)
      });
      if (res.ok) {
        setNewWordsInput('');
        setStatusMessage({ type: 'success', text: `تمت إضافة ${wordsList.length} كلمة بنجاح!` });
        selectCategory(selectedCategory);
        fetchCategories();
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'فشلت إضافة الكلمات' });
    }
  };

  const handleDeleteWord = async (wordId) => {
    const token = getAuthToken();
    try {
      const res = await fetch(`/api/admin/spy/words/${wordId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setCategoryWords(categoryWords.filter((w) => w.id !== wordId));
        fetchCategories();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportJson = async () => {
    const token = getAuthToken();
    try {
      const res = await fetch('/api/admin/spy/export', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `spy_categories_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setStatusMessage({ type: 'error', text: 'فشل تصدير البيانات' });
    }
  };

  const handleImportJson = async () => {
    if (!importJsonText.trim()) return;
    let parsed;
    try {
      parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) throw new Error('يجب أن يكون الملف مصفوفة JSON تحتوي على فئات وكلمات');
    } catch (e) {
      alert('خطأ في صيغة الـ JSON: ' + e.message);
      return;
    }

    const token = getAuthToken();
    try {
      const res = await fetch('/api/admin/spy/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(parsed)
      });
      if (res.ok) {
        const result = await res.json();
        setImportModalOpen(false);
        setImportJsonText('');
        setStatusMessage({ type: 'success', text: result.message });
        await fetchCategories();
      } else {
        const err = await res.json();
        alert(err.detail || 'فشل الاستيراد');
      }
    } catch (e) {
      alert('خطأ أثناء الاستيراد');
    }
  };

  const filteredCategories = categories.filter((c) =>
    (c.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 dir-rtl" dir="rtl">
      {/* Top Banner Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold shadow-sm transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{statusMessage.text}</span>
          <button onClick={() => setStatusMessage(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-black mb-1 border border-purple-200">
            <Eye className="w-3.5 h-3.5" />
            <span>لعبة مين الدسوس؟ (The Spy Game)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            إدارة فئات وبنك الكلمات السرية
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-1">
            أضف وعدّل الفئات والكلمات المتاحة للاعبين، أو استورد وصدّر حزم الكلمات عبر JSON.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              setEditingCategory(null);
              setCatName('');
              setCatDesc('');
              setCatInitialWords('');
              setCategoryModalOpen(true);
            }}
            className="flex-1 sm:flex-initial px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة فئة جديدة</span>
          </button>

          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="استيراد عبر ملف أو نص JSON"
          >
            <Upload className="w-4 h-4" />
            <span>استيراد JSON</span>
          </button>

          <button
            onClick={handleExportJson}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="تصدير جميع الفئات كملف JSON"
          >
            <Download className="w-4 h-4" />
            <span>تصدير JSON</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Categories List, Right Words Manager */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Categories List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">
                الفئات المتاحة ({categories.length})
              </h3>
              <div className="relative w-44">
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pr-7 pl-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5" />
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                جاري تحميل الفئات...
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 font-bold">
                لا توجد فئات مطابقة
              </div>
            ) : (
              <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
                {filteredCategories.map((cat) => {
                  const isSelected = selectedCategory?.id === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => selectCategory(cat)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-purple-50 border-purple-300 ring-2 ring-purple-400/20 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                            isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          🏷️
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                            {cat.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 truncate max-w-xs mt-0.5">
                            {cat.description || 'بدون وصف'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black">
                          {cat.words_count || 0} كلمة
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingCategory(cat);
                            setCatName(cat.name);
                            setCatDesc(cat.description || '');
                            setCatIcon(cat.icon || 'Sparkles');
                            setCatInitialWords('');
                            setCategoryModalOpen(true);
                          }}
                          className="p-1 text-slate-400 hover:text-purple-600 rounded-lg hover:bg-purple-50"
                          title="تعديل الفئة"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCategory(cat.id);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                          title="حذف الفئة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Category Words Management (7 cols) */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs h-full flex flex-col">
            {selectedCategory ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏷️</span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">
                        {selectedCategory.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-black">
                        {categoryWords.length} كلمة مسجلة
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedCategory.description || 'لا يوجد وصف مضاف لهذه الفئة'}
                    </p>
                  </div>
                </div>

                {/* Add Words Form */}
                <form onSubmit={handleAddWords} className="mb-5 space-y-2">
                  <label className="block text-xs font-black text-slate-700">
                    إضافة كلمات جديدة إلى [{selectedCategory.name}]:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اكتب كلمة، أو كلمات متعددة مفصولة بفاصلة (مثال: تفاح، برتقال، موز)..."
                      value={newWordsInput}
                      onChange={(e) => setNewWordsInput(e.target.value)}
                      className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-sm transition cursor-pointer shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة</span>
                    </button>
                  </div>
                </form>

                {/* Words Chips Container */}
                <div className="flex-1 min-h-[300px]">
                  {wordsLoading ? (
                    <div className="py-16 text-center text-xs text-slate-400 font-bold">
                      جاري تحميل كلمات الفئة...
                    </div>
                  ) : categoryWords.length === 0 ? (
                    <div className="py-16 text-center text-xs text-slate-400 font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      لا توجد كلمات في هذه الفئة حتى الآن. استخدم الحقل أعلاه لإضافة كلمات!
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-[450px] overflow-y-auto p-1">
                      {categoryWords.map((item) => (
                        <span
                          key={item.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-800 hover:text-purple-700 text-xs font-bold transition group"
                        >
                          <span>{item.word}</span>
                          <button
                            onClick={() => handleDeleteWord(item.id)}
                            className="text-slate-400 group-hover:text-rose-600 transition p-0.5 rounded-md hover:bg-rose-100"
                            title="حذف الكلمة"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-24 text-center text-slate-400 text-xs font-bold">
                اختر فئة من القائمة الجانبية لعرض وتعديل كلماتها
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= MODAL: CREATE / EDIT CATEGORY ================= */}
      <AnimatePresence>
        {categoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900">
                  {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة في مين الدسوس'}
                </h3>
                <button
                  onClick={() => setCategoryModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCategory} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    اسم الفئة: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: فواكه وخضروات، ماركات وسيارات..."
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    وصف مختصر:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="وصف الفئة ليظهر للاعبين عند الاختيار..."
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                {!editingCategory && (
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      كلمات أولية لهذه الفئة (اختياري - مفصولة بفاصلة):
                    </label>
                    <textarea
                      rows={3}
                      placeholder="تفاح، موز، بطيخ، أناناس، فراولة..."
                      value={catInitialWords}
                      onChange={(e) => setCatInitialWords(e.target.value)}
                      className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/20 transition cursor-pointer"
                  >
                    {editingCategory ? 'حفظ التعديلات' : 'إنشاء الفئة'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: BULK IMPORT JSON ================= */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-purple-600" />
                  <h3 className="text-base font-black text-slate-900">
                    استيراد فئات وكلمات سريعة عبر JSON
                  </h3>
                </div>
                <button
                  onClick={() => setImportModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs text-slate-600 space-y-2">
                <p>
                  يمكنك لصق كود JSON مباشر يحتوي على مصفوفة الفئات والكلمات بالشكل التالي:
                </p>
                <pre className="bg-slate-900 text-purple-300 p-3 rounded-xl text-[11px] font-mono overflow-x-auto text-left" dir="ltr">
{`[
  {
    "name": "أكلات سريعة",
    "description": "وجبات وأكلات شهيرة",
    "words": ["شاورما", "برغر", "بيتزا", "فلافل"]
  }
]`}
                </pre>
              </div>

              <div>
                <textarea
                  rows={8}
                  placeholder="الصق كود الـ JSON هنا..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-purple-500"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setImportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleImportJson}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/20 transition cursor-pointer"
                >
                  تأكيد واستيراد
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
