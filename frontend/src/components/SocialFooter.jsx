import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { getSocialIconComponent } from './SocialIcons';
import { API_BASE } from '../utils/api';

const PLATFORM_STYLES = {
  instagram: {
    bgLight: 'hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white hover:border-pink-500',
    bgDark: 'hover:bg-gradient-to-r hover:from-pink-500 hover:to-purple-600 hover:text-white hover:border-pink-500',
    accentText: 'text-pink-600 dark:text-pink-400'
  },
  facebook: {
    bgLight: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
    bgDark: 'hover:bg-blue-600 hover:text-white hover:border-blue-600',
    accentText: 'text-blue-600 dark:text-blue-400'
  },
  soundcloud: {
    bgLight: 'hover:bg-orange-500 hover:text-white hover:border-orange-500',
    bgDark: 'hover:bg-orange-500 hover:text-white hover:border-orange-500',
    accentText: 'text-orange-500 dark:text-orange-400'
  },
  kick: {
    bgLight: 'hover:bg-emerald-500 hover:text-slate-950 hover:border-emerald-500',
    bgDark: 'hover:bg-emerald-400 hover:text-slate-950 hover:border-emerald-400',
    accentText: 'text-emerald-600 dark:text-emerald-400'
  },
  tiktok: {
    bgLight: 'hover:bg-slate-900 hover:text-white hover:border-slate-900',
    bgDark: 'hover:bg-white hover:text-slate-900 hover:border-white',
    accentText: 'text-slate-800 dark:text-slate-200'
  },
  twitter: {
    bgLight: 'hover:bg-slate-900 hover:text-white hover:border-slate-900',
    bgDark: 'hover:bg-white hover:text-slate-900 hover:border-white',
    accentText: 'text-slate-700 dark:text-slate-300'
  },
  youtube: {
    bgLight: 'hover:bg-red-600 hover:text-white hover:border-red-600',
    bgDark: 'hover:bg-red-600 hover:text-white hover:border-red-600',
    accentText: 'text-red-600 dark:text-red-400'
  },
  discord: {
    bgLight: 'hover:bg-indigo-600 hover:text-white hover:border-indigo-600',
    bgDark: 'hover:bg-indigo-600 hover:text-white hover:border-indigo-600',
    accentText: 'text-indigo-600 dark:text-indigo-400'
  },
  other: {
    bgLight: 'hover:bg-purple-600 hover:text-white hover:border-purple-600',
    bgDark: 'hover:bg-purple-600 hover:text-white hover:border-purple-600',
    accentText: 'text-purple-600 dark:text-purple-400'
  }
};

const DEFAULT_SOCIAL_LINKS = [
  { id: 'def-1', platform: 'instagram', title: 'إنستغرام', url: 'https://instagram.com' },
  { id: 'def-2', platform: 'facebook', title: 'فيسبوك', url: 'https://facebook.com' },
  { id: 'def-3', platform: 'soundcloud', title: 'ساوند كلاود', url: 'https://soundcloud.com' },
  { id: 'def-4', platform: 'kick', title: 'قناة كيك (Kick)', url: 'https://kick.com' },
  { id: 'def-5', platform: 'tiktok', title: 'تيك توك', url: 'https://tiktok.com' }
];

export const SocialFooter = ({ isDark = false }) => {
  const [links, setLinks] = useState(DEFAULT_SOCIAL_LINKS);

  useEffect(() => {
    let isMounted = true;
    const loadLinks = async () => {
      try {
        const res = await fetch(`${API_BASE}/social-links`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setLinks(data);
          }
        }
      } catch (e) {
        // Fallback to default links
      }
    };
    loadLinks();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer
      className={`w-full py-6 px-4 mt-auto border-t transition-colors select-none ${
        isDark
          ? 'bg-slate-950/80 border-slate-800/80 text-slate-400'
          : 'bg-white/80 backdrop-blur-md border-slate-200/80 text-slate-500'
      }`}
      dir="rtl"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand & Rights */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="text-base">✨</span>
          <span className={isDark ? 'text-slate-300 font-black' : 'text-slate-800 font-black'}>
            جلسة
          </span>
          <span className="opacity-60">• منصة المسابقات والتحديات الجماعية</span>
        </div>

        {/* Social Links Chips */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {links.map((link) => {
            const Icon = getSocialIconComponent(link.platform);
            const style = PLATFORM_STYLES[link.platform] || PLATFORM_STYLES.other;

            return (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 transition-all duration-200 shadow-2xs group active:scale-95 ${
                  isDark
                    ? `bg-slate-900 border-slate-800 text-slate-300 ${style.bgDark}`
                    : `bg-slate-50 border-slate-200 text-slate-700 ${style.bgLight}`
                }`}
                title={link.title}
              >
                <Icon className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>{link.title}</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-40 group-hover:opacity-100 transition-opacity" />
              </a>
            );
          })}
        </div>
      </div>
    </footer>
  );
};
