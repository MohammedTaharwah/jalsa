import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  BookOpen,
  Trophy,
  Swords,
  Shield,
  Zap,
  Bomb,
  Snowflake,
  HelpCircle,
  Hourglass,
  Clock,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Users,
  Dices,
  Flame,
  Volume2
} from 'lucide-react';
import { POWERUPS_CATALOG } from '../data/categoriesData';

export const GameGuideModal = ({ isOpen, onClose, initialTab = 'jeopardy' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md" dir="rtl">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-4xl bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200 relative max-h-[92vh] flex flex-col font-sans"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 text-xl">
                📖
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  دليل ألعاب منصة جلسة
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  شرح كامل لطريقة اللعب، القوانين، الأسلحة التكتيكية، وحيل الفوز في كل طور
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 py-3 border-b border-slate-100 overflow-x-auto shrink-0">
            {[
              { id: 'jeopardy', label: 'لوحة التحدي (Jeopardy)', icon: Trophy, color: 'text-purple-600' },
              { id: 'weapons', label: 'الأسلحة والتكتيكات', icon: Swords, color: 'text-amber-500' },
              { id: 'spy', label: 'مين الدسوس؟', icon: Shield, color: 'text-rose-500' },
              { id: 'five_seconds', label: 'تحدي الـ 5 ثواني', icon: Zap, color: 'text-orange-500' }
            ].map(tab => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 transition cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${isActive ? 'text-white' : tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Modal Body */}
          <div className="overflow-y-auto py-4 space-y-4 pr-1 flex-1 text-right">
            {/* ================= TAB 1: JEOPARDY RULES ================= */}
            {activeTab === 'jeopardy' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                  <h4 className="text-sm font-black text-purple-950 flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-purple-600" />
                    <span>فكرة التحدي ونظام النقاط</span>
                  </h4>
                  <p className="text-xs text-purple-900 leading-relaxed font-medium">
                    يتنافس فريقان بالتناوب لاختيار الأسئلة من فئات متنوعة. تُقسّم الأسئلة في كل فئة إلى 3 مستويات من النقاط:
                    <strong className="text-purple-950"> 200 نقطة</strong> (سهل)،
                    <strong className="text-purple-950"> 400 نقطة</strong> (متوسط)،
                    و<strong className="text-purple-950"> 600 نقطة</strong> (صعب وحاسم). الإجابة الصحيحة تكسب فريقك النقاط كاملة، بينما الإجابة الخاطئة تخصم النقاط.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Feature 1: Free Question Switch */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 transition shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                        🔄
                      </div>
                      <h5 className="text-xs sm:text-sm font-black text-slate-900">تغيير السؤال المجاني</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      يحق لكل فريق <strong>تغيير السؤال لمرة واحدة فقط</strong> مجاناً طوال الجلسة! عند استخدامه، يُستبدل السؤال بسؤال جديد من نفس الفئة ونفس النقاط دون أي خصم.
                    </p>
                  </div>

                  {/* Feature 2: Fortune Wheel */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 transition shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                        🎡
                      </div>
                      <h5 className="text-xs sm:text-sm font-black text-slate-900">عجلة الحظ التكتيكية</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      متاحة لمرة واحدة لكل فريق في دوره قبل فتح السؤال. قد تمنحك مضاعفة النقاط (x2) أو سرقة نقاط أو قد تعرضك لتخطي الدور! استخدمها بجرأة حين تحتاج لقلب النتيجة.
                    </p>
                  </div>

                  {/* Feature 3: Image Questions & Blur */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 transition shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                        🖼️
                      </div>
                      <h5 className="text-xs sm:text-sm font-black text-slate-900">أسئلة الصور وكشف الوضوح</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      في أسئلة الصور المشوشة، تبدأ الصورة بدرجة تشويش عالية مقابل 600 نقطة. بإمكان الفريق تخفيض التشويش لرؤية أوضح مقابل التنازل عن جزء من النقاط (إلى 400 ثم 200).
                    </p>
                  </div>

                  {/* Feature 4: Fair Judging */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 transition shadow-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                        ⚖️
                      </div>
                      <h5 className="text-xs sm:text-sm font-black text-slate-900">التحكيم وإظهار الإجابة</h5>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      يقوم قائد الجلسة بالاستماع لإجابة الفريق ثم الضغط على "كشف الإجابة"، ليظهر الجواب النموذجي، ثم يضغط "إجابة صحيحة" لاحتساب النقاط أو "إجابة خاطئة" لتسجيل الخصم ونقل الدور.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-bold flex items-center gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>نصيحة ذهبية:</strong> احرص على اختيار تشكيلة الأسلحة المناسبة في شاشة الإعداد، واستخدم أسلحتك في الوقت الحاسم لضمان الفوز!
                  </span>
                </div>
              </div>
            )}

            {/* ================= TAB 2: WEAPONS CATALOG ================= */}
            {activeTab === 'weapons' && (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                  <div className="font-black flex items-center gap-1.5 mb-1 text-sm text-amber-900">
                    <Swords className="w-4 h-4 text-amber-600" />
                    <span>كتالوج الأسلحة التكتيكية (Loadout)</span>
                  </div>
                  <p className="font-medium text-amber-900">
                    يمتلك كل فريق سلاحين تكتيكيين تم اختيارهما في بداية الجلسة. يمكنك تفعيل السلاح في دور فريقك بالضغط على أيقونته في الشريط العلوي للوحة.
                  </p>
                </div>

                {POWERUPS_CATALOG.map((weapon) => (
                  <div
                    key={weapon.id}
                    className="p-4 rounded-2xl border border-slate-200/90 bg-gradient-to-r from-slate-50 to-white hover:border-purple-300 transition-all shadow-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{weapon.emoji}</span>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                            {weapon.name}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700">
                              {weapon.type}
                            </span>
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">مستوى القوة:</span>
                        <span className="text-amber-500 font-black text-xs">
                          {'⭐'.repeat(weapon.powerLevel || 4)}
                        </span>
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 font-black text-xs text-slate-700 border border-slate-200">
                          {weapon.cost} نقطة
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mb-2 font-medium leading-relaxed">
                      {weapon.desc}
                    </p>

                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-xs font-bold flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-amber-800 font-black">أفضل تكتيك للاستخدام: </span>
                        {weapon.tacticHint}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ================= TAB 3: SPY GAME RULES ================= */}
            {activeTab === 'spy' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
                  <h4 className="text-sm font-black text-rose-950 flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4 text-rose-600" />
                    <span>فكرة لعبة "مين الدسوس؟" (لعبة مجانية 100%)</span>
                  </h4>
                  <p className="text-xs text-rose-900 leading-relaxed font-medium">
                    لعبة جماعية تلعب بجهاز واحد يتناوبه الأصدقاء. جميع اللاعبين يعرفون المكان السري ما عدا "الدسوس" الذي لا يعرف المكان وعليه التظاهر بأنه مواطن عادي دون أن يُكشف!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="text-2xl mb-2">1️⃣</div>
                    <h5 className="font-black text-slate-900 mb-1">توزيع الأدوار السري</h5>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      يمرر الهاتف لكل لاعب ليكشف بطاقته سرّياً. المواطن يرى المكان والدسوس يرى تنبيهاً بأنه الدسوس.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="text-2xl mb-2">2️⃣</div>
                    <h5 className="font-black text-slate-900 mb-1">الأسئلة والاستجواب</h5>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      يبدأ مؤقت النقاش، ويسأل كل لاعب شخصاً آخر أسئلة ذكية حول المكان لاختبار معرفته دون إعطاء إجابات مفضوحة.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="text-2xl mb-2">3️⃣</div>
                    <h5 className="font-black text-slate-900 mb-1">التصويت وحسم الهوية</h5>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      يصوّت الجميع لاختيار المشتبه به. إذا كُشف الدسوس يحق له تخمين المكان لقلب النتيجة لصالحه!
                    </p>
                  </div>
                </div>

                {/* Spy Points Table */}
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                  <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    <span>جدول احتساب النقاط التلقائي:</span>
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-700 font-medium">المواطن: تصويت صحيح للدسوس</span>
                      <span className="font-black text-emerald-600">+100 نقطة</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-700 font-medium">المواطنون: فوز الفريق بالأغلبية</span>
                      <span className="font-black text-emerald-600">+50 نقطة</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-700 font-medium">الدسوس: النجاة وخداع الأغلبية</span>
                      <span className="font-black text-rose-600">+150 نقطة</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex justify-between items-center">
                      <span className="text-slate-700 font-medium">الدسوس: تخمين المكان السري بنجاح</span>
                      <span className="font-black text-amber-600">+100 نقطة</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= TAB 4: FIVE SECONDS CHALLENGE ================= */}
            {activeTab === 'five_seconds' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-orange-50/70 border border-orange-200">
                  <h4 className="text-sm font-black text-orange-950 flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-orange-600" />
                    <span>فكرة "تحدي الـ 5 ثواني" (لعبة سريعة مجانية 100%)</span>
                  </h4>
                  <p className="text-xs text-orange-900 leading-relaxed font-medium">
                    تحدي الحماس وسرعة البديهة تحت ضغط الوقت! يظهر سؤال سريع يتطلب ذكر <strong>3 أشياء محددة</strong>، وعند انطلاق المؤقت لديك <strong>5 ثوانٍ فقط</strong> للنطق بالإجابات الثلاثة قبل انتهاء الوقت!
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="text-2xl mb-2">⚡</div>
                    <h5 className="font-black text-slate-900 mb-1">3 إجابات في 5 ثوانٍ</h5>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      مثال: "اذكر 3 عواصم عربية" أو "3 أكلات شعبية". لا وقت للتردد، انطق فوراً بالإجابات!
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="text-2xl mb-2">⏱️</div>
                    <h5 className="font-black text-slate-900 mb-1">مؤقت تفاعلي بأصوات تنبيه</h5>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      المؤقت يتدرج مع أصوات دقات سريعة وجرس نهائي يعلن انتهاء الثواني الخمس تلقائياً.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-white">
                    <div className="text-2xl mb-2">🎯</div>
                    <h5 className="font-black text-slate-900 mb-1">أول من يصل لنقاط الفوز</h5>
                    <p className="text-slate-600 leading-relaxed font-medium">
                      يمكنك تحديد طول المباراة قبل البدء: <strong>5 نقاط (سريعة)</strong>، <strong>7 نقاط (متوسطة)</strong>، أو <strong>10 نقاط (حماسية)</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    التحكيم مرن وفوري: يستمع الفريق الخصم للإجابات ثم يضغط "أجاب بنجاح (+1)" أو "ما لحق / خطأ (0)" لتدوير الدور فوراً للفريق التالي!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-slate-400 font-bold">
              جلسة • دليل الألعاب التفاعلي
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition cursor-pointer shadow-md shadow-purple-500/20"
            >
              إغلاق الدليل
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
