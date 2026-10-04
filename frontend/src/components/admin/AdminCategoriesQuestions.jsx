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
  Upload,
  Download
} from 'lucide-react';
import { authFetch, API_BASE } from '../../utils/api';

const PREDEFINED_SECTIONS = [
  'كرة القدم',
  'رياضة ولياقة',
  'أفلام وسينما',
  'تاريخ وحضارات',
  'علوم وفضاء',
  'جغرافيا ودول',
  'تكنولوجيا واختراعات',
  'إسلاميات ودين',
  'فنون وأدب',
  'عام'
];

const getMediaUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/game-media/') || url.startsWith('/assets/')) {
    return url;
  }
  return `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
};

const isAudioUrl = (url) => {
  if (!url) return false;
  return /\.(mp3|wav|ogg)($|\?)/i.test(url) || url.startsWith('data:audio');
};

export const AdminCategoriesQuestions = () => {
  const [activeSubTab, setActiveSubTab] = useState('categories'); // 'categories' | 'questions'

  // Data states
  const [categories, setCategories] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filters for Categories
  const [selectedAdminCatSectionFilter, setSelectedAdminCatSectionFilter] = useState('الكل');

  // Filters for Questions
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [selectedPointsFilter, setSelectedPointsFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Category Modal
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', section: 'كرة القدم', description: '', image_url: '' });

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
    media_url: '',
    status: 'approved'
  });

  const [toastMsg, setToastMsg] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewBlur, setPreviewBlur] = useState('auto'); // 'auto' | 0 | 200 | 400 | 600

  const fileInputRef = React.useRef(null);
  const catFileInputRef = React.useRef(null);

  const compressImage = (file) => {
    return new Promise((resolve) => {
      if (!file.type || !file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataUrl);
        };
        img.onerror = () => resolve(event.target.result);
        img.src = event.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await authFetch('/api/admin/upload-media', {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
      return await compressImage(file);
    } catch (e) {
      return await compressImage(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDirectFile = async (file, target = 'question') => {
    if (!file) return;
    try {
      const url = await uploadFile(file);
      if (url) {
        if (target === 'question') {
          setQForm((prev) => ({ ...prev, media_url: url }));
          showToast('تم إرفاق الصورة بالسؤال بنجاح ✓');
        } else {
          setCatForm((prev) => ({ ...prev, image_url: url }));
          showToast('تم إرفاق صورة الفئة بنجاح ✓');
        }
      }
    } catch (err) {
      showToast('تعذر رفع الملف');
    }
  };

  const handleQuestionFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleDirectFile(file, 'question');
    e.target.value = '';
  };

  const handleCategoryFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) handleDirectFile(file, 'category');
    e.target.value = '';
  };

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

  const downloadSampleQuestionsJson = () => {
    const sampleData = {
      questions: [
        {
          section: "كرة القدم",
          category_name: "ريال مدريد",
          question_text: "كم عدد بطولات دوري أبطال أوروبا التي حققها ريال مدريد حتى عام 2024؟",
          options_json: ["15 بطولة", "14 بطولة", "12 بطولة", "10 بطولات"],
          correct_answer: "15 بطولة",
          points_level: 200,
          media_url: null
        },
        {
          section: "كرة القدم",
          category_name: "برشلونة",
          question_text: "من هو الهداف التاريخي لنادي برشلونة في كافة المسابقات؟",
          options_json: ["ليونيل ميسي", "لويس سواريز", "سيزار رودريغيز", "رونالدينيو"],
          correct_answer: "ليونيل ميسي",
          points_level: 400,
          media_url: null
        },
        {
          section: "كرة القدم",
          category_name: "كأس العالم",
          question_text: "أي منتخب فاز بلقب كأس العالم 2022 في قطر؟",
          options_json: ["الأرجنتين", "فرنسا", "كرواتيا", "البرازيل"],
          correct_answer: "الأرجنتين",
          points_level: 200,
          media_url: null
        },
        {
          section: "تاريخ وحضارات",
          category_name: "الحضارة الإسلامية",
          question_text: "في أي عام فُتحت القسطنطينية على يد السلطان محمد الفاتح؟",
          options_json: ["1453م", "1492م", "1258م", "1517م"],
          correct_answer: "1453م",
          points_level: 600,
          media_url: null
        }
      ]
    };

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'نموذج_اسئلة_جلسة_مع_الاقسام.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('تم تحميل نموذج JSON التجريبي بنجاح ✓');
  };

  const categoriesBySection = React.useMemo(() => {
    const groups = {};
    categories.forEach((cat) => {
      const sec = cat.section || 'عام';
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(cat);
    });
    return groups;
  }, [categories]);

  const uniqueAdminSections = React.useMemo(() => {
    const set = new Set();
    categories.forEach((cat) => {
      if (cat.section && cat.section.trim()) {
        set.add(cat.section.trim());
      }
    });
    return ['الكل', ...Array.from(set)];
  }, [categories]);

  const filteredAdminCategories = React.useMemo(() => {
    return categories.filter((cat) => {
      if (selectedAdminCatSectionFilter && selectedAdminCatSectionFilter !== 'الكل') {
        return (cat.section || 'عام') === selectedAdminCatSectionFilter;
      }
      return true;
    });
  }, [categories, selectedAdminCatSectionFilter]);

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
      setCatForm({ name: '', section: 'كرة القدم', description: '', image_url: '' });
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
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'فشل تحديث السؤال');
        }
        showToast('تم تحديث السؤال بنجاح! ✨');
      } else {
        const res = await authFetch('/api/admin/questions', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'فشل إضافة السؤال');
        }
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
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-800">قائمة التصنيفات النشطة</h3>
              <p className="text-xs text-slate-400 mt-0.5">يمكنك تقسيم الفئات إلى أقسام رئيسية مثل (كرة القدم، سينما، تاريخ...) لترتيب الاختيار والأسئلة.</p>
            </div>
            <button
              onClick={() => {
                setEditingCategory(null);
                setCatForm({ name: '', section: 'كرة القدم', description: '', image_url: '' });
                setCatModalOpen(true);
              }}
              className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> إضافة فئة جديدة
            </button>
          </div>

          {/* Section Filter Pills for Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-white p-2.5 rounded-2xl border border-slate-100 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 pl-2 shrink-0">الأقسام:</span>
            {uniqueAdminSections.map((sec) => {
              const count = sec === 'الكل'
                ? categories.length
                : categories.filter((c) => (c.section || 'عام') === sec).length;
              const isActive = selectedAdminCatSectionFilter === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setSelectedAdminCatSectionFilter(sec)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{sec}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAdminCategories.map((cat) => (
              <motion.div
                key={cat.id}
                whileHover={{ y: -3 }}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold overflow-hidden shrink-0">
                      {cat.image_url ? (
                        <img src={getMediaUrl(cat.image_url)} alt={cat.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        '🎯'
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full text-[11px] font-black border border-purple-100">
                        {cat.questions_count || 0} سؤال
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                        📁 {cat.section || 'عام'}
                      </span>
                    </div>
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
                        section: cat.section || 'عام',
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

            {/* Category Filter Grouped by Section */}
            <select
              value={selectedCatFilter}
              onChange={(e) => setSelectedCatFilter(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:outline-none focus:border-purple-500"
            >
              <option value="">كافة الفئات</option>
              {Object.entries(categoriesBySection).map(([section, cats]) => (
                <optgroup key={section} label={`📁 قسم: ${section}`}>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </optgroup>
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
              onClick={downloadSampleQuestionsJson}
              className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              title="تحميل ملف JSON نموذجي جاهز للتعبئة والاستيراد مع الأقسام"
            >
              <Download className="w-4 h-4 text-purple-600" /> نموذج JSON
            </button>

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
                        <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span>{q.question_text}</span>
                            {q.media_url && (
                              <span className="px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 text-[10px] font-bold shrink-0 flex items-center gap-1" title="سؤال يحتوي على وسائط">
                                {isAudioUrl(q.media_url) ? '🔊 صوت' : '📷 صورة'}
                              </span>
                            )}
                          </div>
                        </td>
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
                    placeholder="مثال: ريال مدريد، دوري الأبطال، إمبراطوريات..."
                    value={catForm.name}
                    onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-600">القسم الرئيسي (المجال التابع له)</label>
                    <span className="text-[10px] text-purple-600 font-bold">لترتيب الفئات ومنع التشتت</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="مثال: كرة القدم، أفلام وسينما، تاريخ..."
                    value={catForm.section || ''}
                    onChange={(e) => setCatForm({ ...catForm, section: e.target.value })}
                    className="w-full py-2.5 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 font-bold"
                  />
                  {/* Predefined section suggestions pills */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {PREDEFINED_SECTIONS.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, section: sec })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                          catForm.section === sec
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600">أيقونة أو صورة الفئة (اختياري)</label>
                    {catForm.image_url && (
                      <button
                        type="button"
                        onClick={() => setCatForm({ ...catForm, image_url: '' })}
                        className="text-[11px] text-red-500 hover:text-red-700 font-bold"
                      >
                        إزالة الصورة
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition cursor-pointer select-none">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploading ? 'جاري الرفع...' : 'رفع صورة 📁'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCategoryFileUpload}
                        disabled={isUploading}
                        className="sr-only"
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="أو ضع رابط صورة مباشر..."
                      value={catForm.image_url}
                      onChange={(e) => setCatForm({ ...catForm, image_url: e.target.value })}
                      className="flex-1 py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500"
                      dir="ltr"
                    />
                  </div>
                  {catForm.image_url && (
                    <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <img
                        src={getMediaUrl(catForm.image_url)}
                        alt="معاينة"
                        className="w-10 h-10 rounded-xl object-cover border border-slate-300"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="text-[11px] text-emerald-600 font-bold">تم اختيار صورة للفئة ✓</span>
                    </div>
                  )}
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
                      {Object.entries(categoriesBySection).map(([section, cats]) => (
                        <optgroup key={section} label={`📁 قسم: ${section}`}>
                          {cats.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-purple-600" />
                      <span>وسائط السؤال (صورة توضيحية أو مقطع صوتي)</span>
                    </label>
                    {qForm.media_url && (
                      <button
                        type="button"
                        onClick={() => setQForm({ ...qForm, media_url: '' })}
                        className="text-[11px] text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        إزالة الوسائط
                      </button>
                    )}
                  </div>

                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleDirectFile(file, 'question');
                    }}
                    onPaste={(e) => {
                      const items = e.clipboardData?.items;
                      if (items) {
                        for (let i = 0; i < items.length; i++) {
                          if (items[i].type && items[i].type.startsWith('image/')) {
                            const file = items[i].getAsFile();
                            if (file) {
                              handleDirectFile(file, 'question');
                              break;
                            }
                          }
                        }
                      }
                    }}
                    className="space-y-2 p-3 bg-slate-50/80 rounded-2xl border border-dashed border-slate-300 hover:border-purple-400 transition"
                  >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <label className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer select-none shrink-0 disabled:opacity-50">
                        <Upload className="w-4 h-4" />
                        <span>{isUploading ? 'جاري التحميل...' : 'اختر صورة من جهازك 📁'}</span>
                        <input
                          type="file"
                          accept="image/*,audio/*"
                          onChange={handleQuestionFileUpload}
                          disabled={isUploading}
                          className="sr-only"
                        />
                      </label>

                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="أو الصق رابط صورة / صوت مباشر هنا (أو الصق صورة مباشرة Ctrl+V)..."
                          value={qForm.media_url || ''}
                          onChange={(e) => setQForm({ ...qForm, media_url: e.target.value })}
                          className="w-full py-2.5 px-3 text-xs bg-white border border-slate-200 rounded-2xl focus:outline-none focus:border-purple-500 font-medium"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between px-1">
                      <span>💡 يمكنك الضغط لاختيار صورة، أو سحبها وإفلاتها هنا، أو لصق صورة من الحافظة (Ctrl+V)</span>
                    </div>

                    {qForm.media_url && (
                      <div className="mt-2 p-3 bg-purple-50/50 border border-purple-100 rounded-2xl flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          {isAudioUrl(qForm.media_url) ? (
                            <div className="flex-1">
                              <audio controls className="w-full h-8" src={getMediaUrl(qForm.media_url)}>
                                متصفحك لا يدعم تشغيل الصوت
                              </audio>
                            </div>
                          ) : (
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-purple-200 bg-slate-900/10 shrink-0 shadow-xs flex items-center justify-center">
                              <img
                                src={getMediaUrl(qForm.media_url)}
                                alt="معاينة صورة السؤال"
                                style={{
                                  filter: `blur(${
                                    previewBlur === 'auto'
                                      ? (qForm.points_level === 200 ? '5px' : qForm.points_level === 400 ? '13px' : '25px')
                                      : (previewBlur === 0 ? '0px' : previewBlur === 200 ? '5px' : previewBlur === 400 ? '13px' : '25px')
                                  })`,
                                  transition: 'filter 0.4s ease'
                                }}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  e.currentTarget.src = 'https://via.placeholder.com/150?text=Error';
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-right">
                            <p className="text-xs font-bold text-slate-800 truncate">
                              {isAudioUrl(qForm.media_url) ? '🎵 ملف صوتي مرفق' : '🖼️ صورة مرفقة بالسؤال'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate font-mono" dir="ltr">
                              {qForm.media_url.startsWith('data:') ? 'صورة مرفوعة ومحفوظة بنجاح' : qForm.media_url}
                            </p>
                            {!isAudioUrl(qForm.media_url) && (
                              <p className="text-[10px] text-purple-700 font-bold mt-1">
                                {previewBlur === 0 ? '🔍 المعاينة: صورة واضحة (كشف الإجابة)' : `🎯 المعاينة: تغبيش مستوى ${previewBlur === 'auto' ? qForm.points_level : previewBlur}ن`}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setQForm({ ...qForm, media_url: '' })}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition cursor-pointer self-start"
                            title="إزالة الصورة"
                          >
                            ✕
                          </button>
                        </div>

                        {/* Interactive Blur Controls for Image Preview */}
                        {!isAudioUrl(qForm.media_url) && (
                          <div className="pt-2 border-t border-purple-100/80 flex items-center justify-between gap-1 text-[10px]">
                            <span className="font-bold text-slate-600">تجربة التغبيش:</span>
                            <div className="flex items-center gap-1">
                              {[
                                { id: 0, label: 'واضحة 0px' },
                                { id: 200, label: '200ن (خفيف)' },
                                { id: 400, label: '400ن (وسط)' },
                                { id: 600, label: '600ن (قوي)' },
                                { id: 'auto', label: 'تلقائي حسب السؤال' }
                              ].map(b => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => setPreviewBlur(b.id)}
                                  className={`px-2 py-0.5 rounded-md font-bold transition cursor-pointer ${
                                    previewBlur === b.id
                                      ? 'bg-purple-600 text-white shadow-2xs'
                                      : 'bg-white text-slate-600 hover:bg-purple-100/60 border border-purple-100'
                                  }`}
                                >
                                  {b.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 block px-1">
                      يدعم رفع صور (JPG, PNG, WebP, GIF) ومقاطع صوتية (MP3, WAV, OGG) حتى 10 ميجابايت، أو روابط الويب المباشرة.
                    </span>
                  </div>
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
