import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FolderTree,
  Bot,
  Ticket,
  Coins,
  LogOut,
  ChevronLeft,
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import logo from '../../assets/logo.png';
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminCategoriesQuestions } from './AdminCategoriesQuestions';
import { AdminAIControlRoom } from './AdminAIControlRoom';
import { AdminPackagesPromos } from './AdminPackagesPromos';
import { AdminGameEconomy } from './AdminGameEconomy';
import { AdminSpyManager } from './AdminSpyManager';

export const AdminLayout = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      icon: LayoutDashboard,
      desc: 'المؤشرات والمبيعات'
    },
    {
      id: 'users',
      label: 'المستخدمين والدعم',
      icon: Users,
      desc: 'الحسابات ورصيد الجلسات'
    },
    {
      id: 'categories',
      label: 'الفئات وبنك الأسئلة',
      icon: FolderTree,
      desc: 'إدارة الفئات ومستويات النقاط'
    },
    {
      id: 'spy-game',
      label: 'لعبة مين الدسوس؟',
      icon: Sparkles,
      desc: 'إدارة الفئات والكلمات السرية',
      badge: 'جديد'
    },
    {
      id: 'ai-control',
      label: 'غرفة الذكاء الاصطناعي',
      icon: Bot,
      desc: 'سير عمل n8n وطابور المراجعة',
      badge: 'n8n'
    },
    {
      id: 'packages',
      label: 'الباقات والأكواد',
      icon: Ticket,
      desc: 'تسعير الباقات والبرومو كود'
    },
    {
      id: 'economy',
      label: 'اقتصاد اللعبة',
      icon: Coins,
      desc: 'تكلفة الأسلحة التكتيكية'
    }
  ];

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminOverview onNavigateTab={(tab) => setActiveTab(tab)} />;
      case 'users':
        return <AdminUsers />;
      case 'categories':
        return <AdminCategoriesQuestions />;
      case 'spy-game':
        return <AdminSpyManager />;
      case 'ai-control':
        return <AdminAIControlRoom />;
      case 'packages':
        return <AdminPackagesPromos />;
      case 'economy':
        return <AdminGameEconomy />;
      default:
        return <AdminOverview onNavigateTab={(tab) => setActiveTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 dir-rtl" dir="rtl">
      {/* 
        Header Requirement:
        "وشريطاً علوياً (Header) يحتوي فقط على شعار المنصة (logo) وزر 'تسجيل الخروج'."
      */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-purple-600 hover:bg-slate-100 rounded-xl transition"
            aria-label="القائمة الجانبية"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Platform Logo */}
          <div className="flex items-center gap-2">
            <img src={logo} alt="جلسة - Jalsah" className="h-9 sm:h-10 w-auto object-contain cursor-pointer" />
          </div>
        </div>

        {/* Logout Button ONLY */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 py-2 px-4 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 font-bold rounded-2xl text-xs sm:text-sm border border-red-200/60 transition shadow-xs"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج</span>
        </button>
      </header>

      {/* Main Body: Sidebar + Dynamic Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed md:static inset-y-0 right-0 z-30 w-72 bg-white border-l border-slate-200/80 flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full md:translate-x-0'
          }`}
          style={{ top: '61px', height: 'calc(100vh - 61px)' }}
        >
          {/* Sidebar Nav Items */}
          <div className="p-4 space-y-1.5 overflow-y-auto flex-1">
            <div className="px-3 py-2 text-[11px] font-black text-slate-400 uppercase tracking-wider">
              أقسام لوحة الإدارة
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-right p-3 rounded-2xl transition flex items-center justify-between group ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-md shadow-purple-600/20'
                      : 'hover:bg-slate-50 text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="text-xs sm:text-sm font-black">{item.label}</div>
                      <div
                        className={`text-[10px] ${
                          isActive ? 'text-purple-200' : 'text-slate-400'
                        }`}
                      >
                        {item.desc}
                      </div>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Bottom: Admin Profile Badge */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center font-black text-sm shadow-sm">
                👑
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 truncate">مدير النظام (Admin)</p>
                <p className="text-[11px] text-purple-600 font-bold truncate">صلاحيات تحكم كاملة</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Backdrop for Mobile Sidebar */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 z-20 md:hidden backdrop-blur-xs"
            style={{ top: '61px' }}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-6xl mx-auto pb-12">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </div>
  );
};
