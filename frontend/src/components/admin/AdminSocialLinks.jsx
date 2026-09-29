import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  InstagramIcon,
  FacebookIcon,
  SoundCloudIcon,
  KickIcon,
  TikTokIcon,
  TwitterXIcon,
  YoutubeIcon,
  DiscordIcon,
  OtherGlobeIcon,
  getSocialIconComponent
} from '../SocialIcons';
import { API_BASE } from '../../utils/api';

const PLATFORMS_CONFIG = {
  instagram: {
    label: 'إنستغرام (Instagram)',
    color: 'from-pink-500 via-purple-500 to-orange-500',
    badgeBg: 'bg-gradient-to-r from-pink-500 to-purple-600 text-white',
    icon: InstagramIcon,
    defaultUrl: 'https://instagram.com/'
  },
  facebook: {
    label: 'فيسبوك (Facebook)',
    color: 'from-blue-600 to-indigo-700',
    badgeBg: 'bg-blue-600 text-white font-bold',
    icon: FacebookIcon,
    defaultUrl: 'https://facebook.com/'
  },
  soundcloud: {
    label: 'ساوند كلاود (SoundCloud)',
    color: 'from-orange-500 to-amber-600',
    badgeBg: 'bg-orange-500 text-white font-bold',
    icon: SoundCloudIcon,
    defaultUrl: 'https://soundcloud.com/'
  },
  kick: {
    label: 'كيك (Kick Streaming)',
    color: 'from-emerald-500 to-green-600',
    badgeBg: 'bg-emerald-500 text-slate-950 font-black',
    icon: KickIcon,
    defaultUrl: 'https://kick.com/'
  },
  tiktok: {
    label: 'تيك توك (TikTok)',
    color: 'from-slate-900 to-slate-800',
    badgeBg: 'bg-slate-900 text-white border border-slate-700',
    icon: TikTokIcon,
    defaultUrl: 'https://tiktok.com/@'
  },
  twitter: {
    label: 'منصة X (تويتر)',
    color: 'from-slate-800 to-slate-950',
    badgeBg: 'bg-black text-white',
    icon: TwitterXIcon,
    defaultUrl: 'https://x.com/'
  },
  youtube: {
    label: 'يوتيوب (YouTube)',
    color: 'from-red-600 to-rose-600',
    badgeBg: 'bg-red-600 text-white',
    icon: YoutubeIcon,
    defaultUrl: 'https://youtube.com/@'
  },
  discord: {
    label: 'ديسكورد (Discord)',
    color: 'from-indigo-600 to-purple-600',
    badgeBg: 'bg-indigo-600 text-white',
    icon: DiscordIcon,
    defaultUrl: 'https://discord.gg/'
  },
  other: {
    label: 'رابط آخر / موقع إلكتروني',
    color: 'from-purple-600 to-indigo-600',
    badgeBg: 'bg-slate-700 text-white',
    icon: OtherGlobeIcon,
    defaultUrl: 'https://'
  }
};

export const AdminSocialLinks = () => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    platform: 'instagram',
    title: '',
    url: '',
    icon_name: 'Instagram',
    is_active: true,
    sort_order: 0
  });

  const getAuthToken = () => {
    try {
      return localStorage.getItem('jalsah_access_token') || '';
    } catch (e) {
      return '';
    }
  };

  const fetchLinks = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/admin/social-links`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) {
        throw new Error('فشل تحميل روابط التواصل الاجتماعي');
      }
      const data = await res.json();
      setLinks(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'حدث خطأ أثناء تحميل الروابط');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      platform: 'instagram',
      title: 'إنستغرام جلسة',
      url: 'https://instagram.com/',
      icon_name: 'Instagram',
      is_active: true,
      sort_order: links.length + 1
    });
    setIsModalOpen(true);
  };

  const openEditModal = (link) => {
    setEditingId(link.id);
    setFormData({
      platform: link.platform || 'other',
      title: link.title || '',
      url: link.url || '',
      icon_name: link.icon_name || 'Globe',
      is_active: link.is_active ?? true,
      sort_order: link.sort_order || 0
    });
    setIsModalOpen(true);
  };

  const handlePlatformSelect = (pKey) => {
    const conf = PLATFORMS_CONFIG[pKey] || PLATFORMS_CONFIG.other;
    setFormData((prev) => ({
      ...prev,
      platform: pKey,
      title: prev.title && prev.title !== 'إنستغرام جلسة' ? prev.title : conf.label.split(' ')[0],
      url: conf.defaultUrl,
      icon_name: conf.icon.name || 'Globe'
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.url.trim()) {
      alert('يرجى ملء اسم الحساب/العنوان ورابط الصفحة');
      return;
    }

    try {
      const token = getAuthToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      if (editingId) {
        // Update
        const res = await fetch(`${API_BASE}/admin/social-links/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('فشل تحديث الرابط');
        setSuccessMsg('تم تحديث الرابط بنجاح');
      } else {
        // Create
        const res = await fetch(`${API_BASE}/admin/social-links`, {
          method: 'POST',
          headers,
          body: JSON.stringify(formData)
        });
        if (!res.ok) throw new Error('فشل إضافة الرابط');
        setSuccessMsg('تمت إضافة رابط التواصل بنجاح');
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchLinks();
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا الرابط؟')) return;
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/admin/social-links/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error('فشل حذف الرابط');
      setSuccessMsg('تم حذف الرابط');
      setTimeout(() => setSuccessMsg(''), 3000);
      fetchLinks();
    } catch (err) {
      alert(err.message || 'تعذر حذف الرابط');
    }
  };

  const handleToggleActive = async (link) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_BASE}/admin/social-links/${link.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ is_active: !link.is_active })
      });
      if (!res.ok) throw new Error('فشل تحديث الحالة');
      fetchLinks();
    } catch (err) {
      alert(err.message || 'تعذر تغيير حالة الرابط');
    }
  };

  return (
    <div className="space-y-6 dir-rtl" dir="rtl">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Share2 className="w-6 h-6 text-purple-600" />
            <span>إدارة روابط التواصل الاجتماعي (Footer Social Links)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            أضف وخصص صفحاتك الرسمية على منصات التواصل (إنستغرام، كيك Kick، تيك توك، تويتر...) لتظهر للزوار واللاعبين أسفل الموقع.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLinks}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="تحديث القائمة"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs flex items-center gap-2 shadow-md shadow-purple-600/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة رابط جديد</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2"
          >
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {/* Links List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {links.map((link) => {
          const config = PLATFORMS_CONFIG[link.platform] || PLATFORMS_CONFIG.other;
          const IconComp = config.icon;

          return (
            <motion.div
              key={link.id}
              layout
              className={`bg-white rounded-3xl p-4 border transition-all shadow-xs flex flex-col justify-between ${
                link.is_active ? 'border-slate-200/90' : 'border-slate-200/60 opacity-60 bg-slate-50/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-xs ${config.badgeBg}`}>
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-sm text-slate-900">{link.title}</h4>
                      {!link.is_active && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">
                          معطل
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-400 capitalize">
                      {config.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={`p-1.5 rounded-xl border text-xs transition cursor-pointer ${
                      link.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                    title={link.is_active ? 'تعطيل الظهور في الموقع' : 'تفعيل الظهور في الموقع'}
                  >
                    {link.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => openEditModal(link)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-600 border border-slate-200 transition cursor-pointer"
                    title="تعديل الرابط"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 transition cursor-pointer"
                    title="حذف الرابط"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* URL Preview */}
              <div className="bg-slate-50 px-3 py-2 rounded-xl flex items-center justify-between text-xs font-mono text-slate-600 border border-slate-100">
                <span className="truncate max-w-[280px]" dir="ltr">{link.url}</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-600 hover:text-purple-700 flex items-center gap-1 font-sans text-[11px] font-bold shrink-0 mr-2"
                >
                  <span>زيارة</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          );
        })}

        {links.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-8">
            <Share2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-600 font-bold text-sm">لا توجد روابط تواصل حالياً</p>
            <p className="text-slate-400 text-xs mt-1">اضغط على زر "إضافة رابط جديد" لإدراج حساباتك على إنستغرام، كيك، أو غيرها.</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-purple-600" />
                  <span>{editingId ? 'تعديل رابط التواصل' : 'إضافة رابط تواصل جديد'}</span>
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Platform Selection */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    اختر المنصة:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.entries(PLATFORMS_CONFIG).map(([key, conf]) => {
                      const IconC = conf.icon;
                      const isSelected = formData.platform === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handlePlatformSelect(key)}
                          className={`p-2 rounded-2xl border text-xs font-bold flex items-center gap-2 transition cursor-pointer ${
                            isSelected
                              ? 'bg-purple-50 border-purple-500 text-purple-900 shadow-xs'
                              : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${conf.badgeBg}`}>
                            <IconC className="w-3.5 h-3.5" />
                          </div>
                          <span className="truncate">{conf.label.split(' ')[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    اسم الصفحة / العنوان الظاهر:
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-purple-500 transition"
                    placeholder="مثال: إنستغرام جلسة، قناة كيك، تيك توك"
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1">
                    الرابط الكامل (URL):
                  </label>
                  <input
                    type="url"
                    required
                    dir="ltr"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white focus:outline-none focus:border-purple-500 transition text-left"
                    placeholder="https://kick.com/channel_name"
                  />
                </div>

                {/* Sort Order & Active */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-black text-slate-700 mb-1">
                      ترتيب الظهور:
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 0 })}
                      className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded-md focus:ring-purple-500"
                      />
                      <span className="text-xs font-bold text-slate-700">مفعّل ويظهر في الفوتر</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-purple-600/20 active:scale-95 transition cursor-pointer"
                  >
                    {editingId ? 'حفظ التعديلات' : 'إضافة الرابط'}
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
