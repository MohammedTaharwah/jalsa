import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Dumbbell,
  Landmark,
  Atom,
  Film,
  HelpCircle,
  Laptop,
  Globe,
  Palette,
  Check,
  Sparkles
} from 'lucide-react';

// Dynamic Fallback Icon resolver
const getFallbackIcon = (iconName, catId) => {
  const map = {
    Dumbbell: Dumbbell,
    sports: Dumbbell,
    Landmark: Landmark,
    history: Landmark,
    Atom: Atom,
    science: Atom,
    Film: Film,
    cinema: Film,
    HelpCircle: HelpCircle,
    general: HelpCircle,
    Laptop: Laptop,
    tech: Laptop,
    Globe: Globe,
    geography: Globe,
    Palette: Palette,
    arts: Palette
  };

  return map[iconName] || map[catId] || HelpCircle;
};

/**
 * CategoryCard - بطاقة الفئة التفاعلية بصور عالية الجودة
 * - صورة في النصف العلوي مع تدرج لوني أرجواني/برتقالي خفيف
 * - تأثير تكبير حركي (Hover Zoom) عبر framer-motion
 * - أيقونة بديلة (Fallback Icon) من lucide-react عند عدم توفر الصورة
 */
export const CategoryCard = ({
  category,
  isSelected = false,
  onToggle,
  showSelection = true,
  disabled = false,
  disabledBadge = null,
  selectionBadge = null
}) => {
  const [imgError, setImgError] = useState(false);
  const FallbackIcon = getFallbackIcon(category.iconName, category.id);

  return (
    <motion.div
      whileHover={!disabled ? { y: -5 } : {}}
      whileTap={!disabled ? { scale: 0.97 } : {}}
      onClick={() => !disabled && onToggle && onToggle(category.id)}
      className={`group relative rounded-3xl overflow-hidden cursor-pointer transition-all duration-300 border-2 flex flex-col justify-between bg-white text-right ${
        isSelected
          ? 'border-orange-500 shadow-[0_12px_30px_rgba(249,115,22,0.18)] ring-2 ring-orange-400/20'
          : 'border-slate-200/90 hover:border-purple-300 shadow-sm hover:shadow-md'
      } ${disabled ? 'opacity-60 cursor-not-allowed grayscale-[30%]' : ''}`}
      dir="rtl"
    >
      {/* ================= UPPER HALF: IMAGE WITH GRADIENT & HOVER ZOOM ================= */}
      <div className="relative w-full h-28 sm:h-32 bg-slate-100 overflow-hidden">
        {!imgError && category.imageUrl ? (
          <motion.img
            src={category.imageUrl}
            alt={category.name}
            onError={() => setImgError(true)}
            whileHover={!disabled ? { scale: 1.14 } : {}}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="w-full h-full object-cover select-none"
            loading="lazy"
          />
        ) : (
          /* Fallback UI when image is missing or fails to load */
          <div
            className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr ${
              category.color || 'from-purple-600 to-indigo-600'
            } text-white relative overflow-hidden`}
          >
            {/* Subtle decorative background circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 blur-sm pointer-events-none" />
            <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/10 blur-sm pointer-events-none" />

            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg"
            >
              <FallbackIcon className="w-6 h-6 text-white drop-shadow" />
            </motion.div>
            <span className="text-[11px] font-bold mt-1 text-white/90">
              {category.emoji || '✨'}
            </span>
          </div>
        )}

        {/* Ambient Gradient Overlay (Smooth purple/orange/dark blend) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-purple-950/20 to-transparent pointer-events-none" />

        {/* Disabled Badge (e.g. chosen by other team) */}
        {disabled && disabledBadge && (
          <div className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-xl bg-slate-900/85 backdrop-blur-md text-amber-300 text-[10px] font-black flex items-center gap-1 shadow-md border border-white/20">
            <span>🔒</span>
            <span>{disabledBadge}</span>
          </div>
        )}

        {/* Selected Checkmark / Team Badge */}
        {showSelection && isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="absolute top-2.5 right-2.5 z-10 px-2.5 py-1 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white flex items-center gap-1.5 shadow-md shadow-orange-500/40 border border-white/60 text-[10px] font-black"
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            {selectionBadge && <span>{selectionBadge}</span>}
          </motion.div>
        )}

        {/* Category Emoji Badge */}
        <div className="absolute bottom-2 right-2.5 z-10 px-2 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-white text-xs font-bold flex items-center gap-1 shadow-sm">
          <span>{category.emoji || '🎯'}</span>
          <span className="text-[10px] text-white/90 font-medium">
            {category.count ? `${category.count} سؤال` : 'جاهز'}
          </span>
        </div>
      </div>

      {/* ================= LOWER HALF: DETAILS & METADATA ================= */}
      <div className="p-3.5 flex flex-col justify-between flex-grow">
        <div>
          <h4 className="text-sm font-black text-slate-800 leading-snug group-hover:text-purple-700 transition-colors">
            {category.name}
          </h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2 mt-1">
            {category.desc}
          </p>
        </div>

        {/* Bottom Accent Line */}
        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold">
          <span className={`inline-flex items-center gap-1 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`}>
            <Sparkles className="w-3 h-3" />
            {isSelected ? 'تم الاختيار' : 'اضغط للتحديد'}
          </span>
          <span className="text-slate-300 group-hover:text-purple-400 transition-colors">
            200 • 400 • 600
          </span>
        </div>
      </div>
    </motion.div>
  );
};
