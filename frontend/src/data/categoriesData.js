// Category definitions with local images, Lucide icon fallbacks, and descriptions

export const CATEGORIES_DATA = [
{
id: 'sports',
name: 'رياضة ولياقة',
desc: 'كرة قدم، بطولات عالمية، وأرقام قياسية رياضية',
imageUrl: '/assets/categories/sports.png',
iconName: 'Dumbbell',
emoji: '',
color: 'from-orange-500 to-amber-500',
count: 24
},
{
id: 'history',
name: 'تاريخ وحضارات',
desc: 'تاريخ إسلامي، أحداث عالمية، وشخصيات تاريخية',
imageUrl: '/assets/categories/history.png',
iconName: 'Landmark',
emoji: '',
color: 'from-purple-600 to-indigo-600',
count: 32
},
{
id: 'science',
name: 'علوم وفضاء',
desc: 'كواكب، فيزياء، كيمياء، واكتشافات علمية مذهلة',
imageUrl: '/assets/categories/science.png',
iconName: 'Atom',
emoji: '',
color: 'from-blue-600 to-cyan-500',
count: 28
},
{
id: 'cinema',
name: 'أفلام وسينما',
desc: 'أفلام عربية وعالمية، ممثلون، وجوائز الأوسكار',
imageUrl: '/assets/categories/cinema.png',
iconName: 'Film',
emoji: '',
color: 'from-rose-500 to-pink-600',
count: 20
},
{
id: 'general',
name: 'ثقافة عامة',
desc: 'معلومات عامة، أسئلة ذكاء، ومفارقات ممتعة',
imageUrl: '/assets/categories/general.png',
iconName: 'HelpCircle',
emoji: '',
color: 'from-amber-500 to-yellow-500',
count: 45
},
{
id: 'tech',
name: 'تكنولوجيا واختراعات',
desc: 'ذكاء اصطناعي، برمجة، أجهزة وابتكارات حديثة',
imageUrl: '/assets/categories/tech.png',
iconName: 'Laptop',
emoji: '',
color: 'from-teal-500 to-emerald-600',
count: 26
},
{
id: 'geography',
name: 'جغرافيا وسفر',
desc: 'عواصم، معالم، طبيعة، وتضاريس العالم',
imageUrl: '/assets/categories/geography.png',
iconName: 'Globe',
emoji: '',
color: 'from-emerald-500 to-green-600',
count: 30
},
{
id: 'arts',
name: 'فنون وأدب',
desc: 'شعر، روايات، فن تشكيلي، وتراث عربي أصيل',
imageUrl: '/assets/categories/arts.png',
iconName: 'Palette',
emoji: '',
color: 'from-violet-600 to-purple-700',
count: 18
}
];

// Tactical Power-ups Catalog for Loadout selection (2 weapons per team)
export const POWERUPS_CATALOG = [
{
id: 'double',
name: 'دبل النقاط',
shortName: 'دبل (x2)',
desc: 'مضاعفة نقاط السؤال القادم مرتين عند الإجابة الصحيحة',
iconName: 'Zap',
cost: 150,
color: 'purple',
badge: 'x2',
emoji: ''
},
{
id: 'freeze',
name: 'حظر / تجميد الخصم',
shortName: 'تجميد الخصم',
desc: 'حرمان الفريق الخصم من استخدام أي سلاح تكتيكي في دوره القادم',
iconName: 'Snowflake',
cost: 100,
color: 'cyan',
badge: 'حظر',
emoji: ''
},
{
id: 'bomb',
name: 'قنبلة الوقت 💣',
shortName: 'قنبلة الوقت',
desc: 'زرع قنبلة تقلص وقت إجابة الفريق الخصم إلى النصف (15ث فقط) في دوره القادم!',
iconName: 'Bomb',
cost: 150,
color: 'rose',
badge: '💣 قنبلة',
emoji: '💣'
},
{
id: 'fifty',
name: 'حذف إجابتين (50:50)',
shortName: 'حذف 50:50',
desc: 'إلغاء خيارين خاطئين لرفع احتمالية الإجابة الصحيحة',
iconName: 'HelpCircle',
cost: 200,
color: 'amber',
badge: '50:50',
emoji: '🎯'
},
{
id: 'time_boost',
name: 'طلب وقت إضافي (+15ث)',
shortName: 'وقت إضافي',
desc: 'إضافة 15 ثانية لمؤقت السؤال للتفكير والنقاش',
iconName: 'Hourglass',
cost: 50,
color: 'blue',
badge: '+15ث',
emoji: '⏳'
}
];

// 3 Dynamic Wheel of Fortune Options as specified
export const FORTUNE_WHEEL_OPTIONS = [
{
id: 'double',
label: 'تدبيل النقاط',
multiplier: 2,
sublabel: 'ضعف النقاط (x2)',
icon: 'Zap',
emoji: '',
color: '#8B5CF6',
gradient: 'from-purple-600 to-indigo-600',
desc: 'مضاعفة نقاط السؤال الحالي مرتين (x2) إذا كانت إجابتك صحيحة!'
},
{
id: 'freeze',
label: 'حظر أسلحة الخصم',
multiplier: 1,
sublabel: 'حرمان للدور القادم',
icon: 'Snowflake',
emoji: '',
color: '#06B6D4',
gradient: 'from-cyan-500 to-blue-600',
desc: 'الفريق الخصم مجمّد ومحروم من استخدام أي أسلحة في دوره القادم!'
},
{
id: 'steal_random',
label: 'سرقة سؤال عشوائي',
multiplier: 1,
sublabel: 'سحب سؤال من الخصم',
icon: 'Swords',
emoji: '',
color: '#EC4899',
gradient: 'from-rose-500 to-pink-600',
desc: 'سرقة سؤال عشوائي من فئات الفريق الخصم لصالحك وحرمانه منه عند الإجابة!'
}
];


