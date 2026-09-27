// Categorized Trivia Questions for Jeopardy Battleground Board (200, 200, 400, 400, 600, 600 pts)

export const BATTLEGROUND_QUESTIONS = {
  sports: [
    {
      id: 301,
      points: 200,
      question_text: "كم عدد لاعبي فريق كرة القدم داخل أرضية الملعب في بداية المباراة؟",
      options_json: ["11 لاعباً", "10 لاعبين", "12 لاعباً", "9 لاعبين"],
      correct_answer: "11 لاعباً",
      category_name: "رياضة ولياقة"
    },
    {
      id: 302,
      points: 200,
      question_text: "ما هي اللعبة التي تستخدم فيها المضرب والكرة الصفراء والشبكة المنخفضة؟",
      options_json: ["التنس الأرضي", "كرة اليد", "الريشة الطائرة", "الغولف"],
      correct_answer: "التنس الأرضي",
      category_name: "رياضة ولياقة"
    },
    {
      id: 303,
      points: 400,
      question_text: "في أي دولة أقيمت أول بطولة لكأس العالم لكرة القدم عام 1930؟",
      options_json: ["الأوروغواي", "البرازيل", "إيطاليا", "الأرجنتين"],
      correct_answer: "الأوروغواي",
      category_name: "رياضة ولياقة"
    },
    {
      id: 304,
      points: 400,
      question_text: "كم دقيقة تستغرق مباراة كرة السلة في دوري الـ NBA مقسمة على 4 أشواط؟",
      options_json: ["48 دقيقة", "40 دقيقة", "50 دقيقة", "60 دقيقة"],
      correct_answer: "48 دقيقة",
      category_name: "رياضة ولياقة"
    },
    {
      id: 305,
      points: 600,
      question_text: "من هو اللاعب الوحيد الذي حقق لقب كأس العالم 3 مرات كلاعب؟",
      options_json: ["بيليه", "مارادونا", "رونالدو البرازيلي", "زين الدين زيدان"],
      correct_answer: "بيليه",
      category_name: "رياضة ولياقة"
    },
    {
      id: 306,
      points: 600,
      question_text: "ما هي الدولة الأكثر فوزاً بميداليات في تاريخ دورات الألعاب الأولمبية الحديثة؟",
      options_json: ["الولايات المتحدة", "روسيا", "ألمانيا", "الصين"],
      correct_answer: "الولايات المتحدة",
      category_name: "رياضة ولياقة"
    }
  ],
  history: [
    {
      id: 101,
      points: 200,
      question_text: "ما هي عاصمة الدولة الأموية في ذروة اتساعها؟",
      options_json: ["دمشق", "بغداد", "المدينة المنورة", "القاهرة"],
      correct_answer: "دمشق",
      category_name: "تاريخ وحضارات"
    },
    {
      id: 102,
      points: 200,
      question_text: "في أي دولة بنيت الأهرامات الشهيرة في الجيزة؟",
      options_json: ["مصر", "السودان", "العراق", "المكسيك"],
      correct_answer: "مصر",
      category_name: "تاريخ وحضارات"
    },
    {
      id: 103,
      points: 400,
      question_text: "في أي عام تم فتح القسطنطينية على يد القائد العثماني محمد الفاتح؟",
      options_json: ["1453م", "1492م", "1258م", "1517م"],
      correct_answer: "1453م",
      category_name: "تاريخ وحضارات"
    },
    {
      id: 104,
      points: 400,
      question_text: "من هو القائد القرطاجي الشهير الذي عبر جبال الألب لغزو روما؟",
      options_json: ["حنبعل", "حمورابي", "سنحاريب", "سقراط"],
      correct_answer: "حنبعل",
      category_name: "تاريخ وحضارات"
    },
    {
      id: 105,
      points: 600,
      question_text: "من هو القائد المسلم الذي قاد معركة حطين التاريخية لتحرير القدس عام 1187م؟",
      options_json: ["صلاح الدين الأيوبي", "نور الدين زنكي", "سيف الدين قطز", "الظاهر بيبرس"],
      correct_answer: "صلاح الدين الأيوبي",
      category_name: "تاريخ وحضارات"
    },
    {
      id: 106,
      points: 600,
      question_text: "في أي عام اندلعت الحرب العالمية الأولى رسمياً؟",
      options_json: ["1914م", "1939م", "1918م", "1905م"],
      correct_answer: "1914م",
      category_name: "تاريخ وحضارات"
    }
  ],
  science: [
    {
      id: 201,
      points: 200,
      question_text: "ما هو الكوكب الأقرب إلى الشمس في المجموعة الشمسية؟",
      options_json: ["عطارد", "الزهرة", "المريخ", "الأرض"],
      correct_answer: "عطارد",
      category_name: "علوم وفضاء"
    },
    {
      id: 202,
      points: 200,
      question_text: "ما هي الصيغة الكيميائية للماء؟",
      options_json: ["H2O", "CO2", "O2", "NaCl"],
      correct_answer: "H2O",
      category_name: "علوم وفضاء"
    },
    {
      id: 203,
      points: 400,
      question_text: "ما هو العنصر الكيميائي الأكثر وفرة في الغلاف الجوي للأرض بنسبة تقارب 78%؟",
      options_json: ["النيتروجين", "الأكسجين", "ثاني أكسيد الكربون", "الهيدروجين"],
      correct_answer: "النيتروجين",
      category_name: "علوم وفضاء"
    },
    {
      id: 204,
      points: 400,
      question_text: "ما هي أكبر عضية خلوية تخزن المادة الوراثية DNA في الخلايا حقيقية النواة؟",
      options_json: ["النواة", "الميتوكوندريا", "الريبوسوم", "جهاز غولجي"],
      correct_answer: "النواة",
      category_name: "علوم وفضاء"
    },
    {
      id: 205,
      points: 600,
      question_text: "ما هو الجسيم دون الذري الذي يحمل شحنة كهربائية سالبة ويدور حول النواة؟",
      options_json: ["الإلكترون", "البروتون", "النيوترون", "الفوتون"],
      correct_answer: "الإلكترون",
      category_name: "علوم وفضاء"
    },
    {
      id: 206,
      points: 600,
      question_text: "كم تبلغ سرعة الضوء التقريبية في الفراغ؟",
      options_json: ["300,000 كم/ث", "150,000 كم/ث", "500,000 كم/ث", "100,000 كم/ث"],
      correct_answer: "300,000 كم/ث",
      category_name: "علوم وفضاء"
    }
  ],
  cinema: [
    {
      id: 401,
      points: 200,
      question_text: "ما هو اسم أشهر تمثال وجائزة سينمائية تقدمها أكاديمية الفنون في هوليوود؟",
      options_json: ["الأوسكار", "السعفة الذهبية", "الدب الذهبي", "الغرامي"],
      correct_answer: "الأوسكار",
      category_name: "أفلام وسينما"
    },
    {
      id: 402,
      points: 200,
      question_text: "ما هو لون شخصية الرسوم المتحركة الشهيرة شريك (Shrek)؟",
      options_json: ["أخضر", "أزرق", "أصفر", "أحمر"],
      correct_answer: "أخضر",
      category_name: "أفلام وسينما"
    },
    {
      id: 403,
      points: 400,
      question_text: "من أخرج فيلم الخيال العلمي الشهير (Interstellar) الصادر عام 2014؟",
      options_json: ["كريستوفر نولان", "ستيفن سبيلبرغ", "جيمس كاميرون", "مارتن سكورسيزي"],
      correct_answer: "كريستوفر نولان",
      category_name: "أفلام وسينما"
    },
    {
      id: 404,
      points: 400,
      question_text: "ما هو اسم الجزيرة التي تقع فيها أحداث فيلم حديقة الديناصورات (Jurassic Park)؟",
      options_json: ["جزيرة نوبلار", "جزيرة مدغشقر", "جزيرة الجمجمة", "جزيرة الفصح"],
      correct_answer: "جزيرة نوبلار",
      category_name: "أفلام وسينما"
    },
    {
      id: 405,
      points: 600,
      question_text: "أي من هذه الأفلام حقق أعلى إيرادات في تاريخ شباك التذاكر العالمي بدون احتساب التضخم؟",
      options_json: ["Avatar (2009)", "Avengers: Endgame", "Titanic", "Star Wars: The Force Awakens"],
      correct_answer: "Avatar (2009)",
      category_name: "أفلام وسينما"
    },
    {
      id: 406,
      points: 600,
      question_text: "من قام بدور شخصية الجوكر في فيلم The Dark Knight وحاز على أوسكار بعد وفاته؟",
      options_json: ["هيث ليدجر", "خواكين فينيكس", "جاك نيكلسون", "جاريد ليتو"],
      correct_answer: "هيث ليدجر",
      category_name: "أفلام وسينما"
    }
  ],
  general: [
    {
      id: 501,
      points: 200,
      question_text: "ما هو الحيوان المعروف بلقب (سفينة الصحراء)؟",
      options_json: ["الجمل", "الحصان", "الفيل", "الظبي"],
      correct_answer: "الجمل",
      category_name: "ثقافة عامة"
    },
    {
      id: 502,
      points: 200,
      question_text: "ما هو أكبر طائر في العالم لا يطير؟",
      options_json: ["النعامة", "البطريق", "الكيوي", "الطاووس"],
      correct_answer: "النعامة",
      category_name: "ثقافة عامة"
    },
    {
      id: 503,
      points: 400,
      question_text: "كم عدد أضلاع الشكل الهندسي المعروف بـ (المثمن)؟",
      options_json: ["8 أضلاع", "6 أضلاع", "7 أضلاع", "10 أضلاع"],
      correct_answer: "8 أضلاع",
      category_name: "ثقافة عامة"
    },
    {
      id: 504,
      points: 400,
      question_text: "ما هي العملة الرسمية للمملكة المتحدة؟",
      options_json: ["الجنيه الإسترليني", "اليورو", "الدولار", "الفرنك"],
      correct_answer: "الجنيه الإسترليني",
      category_name: "ثقافة عامة"
    },
    {
      id: 505,
      points: 600,
      question_text: "ما هو أندر فصيلة دم بين البشر في الإحصائيات العالمية؟",
      options_json: ["AB سالب (AB-)", "O سالب (O-)", "B سالب (B-)", "A موجب (A+)"],
      correct_answer: "AB سالب (AB-)",
      category_name: "ثقافة عامة"
    },
    {
      id: 506,
      points: 600,
      question_text: "ما هي عاصمة كندا الوطنية؟",
      options_json: ["أوتاوا", "تورونتو", "فانكوفر", "مونتريال"],
      correct_answer: "أوتاوا",
      category_name: "ثقافة عامة"
    }
  ],
  tech: [
    {
      id: 601,
      points: 200,
      question_text: "ماذا تعني الحروف الأولى من شبكة الإنترنت العالمية (WWW)؟",
      options_json: ["World Wide Web", "World Wide Windows", "Wide Wireless Web", "Web World Wide"],
      correct_answer: "World Wide Web",
      category_name: "تكنولوجيا واختراعات"
    },
    {
      id: 602,
      points: 200,
      question_text: "ما هي الشركة التي طورت نظام التشغيل أندرويد؟",
      options_json: ["غوغل", "أبل", "مايكروسوفت", "سامسونج"],
      correct_answer: "غوغل",
      category_name: "تكنولوجيا واختراعات"
    },
    {
      id: 603,
      points: 400,
      question_text: "من هو مؤسس شركة مايكروسوفت بجانب بول ألين؟",
      options_json: ["بيل غيتس", "ستيف جوبز", "مارك زوكربيرغ", "إيلون ماسك"],
      correct_answer: "بيل غيتس",
      category_name: "تكنولوجيا واختراعات"
    },
    {
      id: 604,
      points: 400,
      question_text: "ما هو البروتوكول المستخدم لنقل صفحات الويب الآمنة والمشفرة؟",
      options_json: ["HTTPS", "FTP", "SMTP", "SSH"],
      correct_answer: "HTTPS",
      category_name: "تكنولوجيا واختراعات"
    },
    {
      id: 605,
      points: 600,
      question_text: "أي خوارزمية ذكاء اصطناعي مشهورة أطلقتها شركة OpenAI عام 2022 وتعتمد على نماذج Transformer؟",
      options_json: ["ChatGPT / GPT", "AlphaGo", "DeepBlue", "Watson"],
      correct_answer: "ChatGPT / GPT",
      category_name: "تكنولوجيا واختراعات"
    },
    {
      id: 606,
      points: 600,
      question_text: "ما هي وحدة قياس تردد المعالجات المركزية الحديثة؟",
      options_json: ["جيجاهرتز - GHz", "ميجابايت", "فولت", "أمبير"],
      correct_answer: "جيجاهرتز - GHz",
      category_name: "تكنولوجيا واختراعات"
    }
  ]
};

// High Stakes Comeback Questions (1000 Points)
export const COMEBACK_QUESTIONS = [
  {
    points: 1000,
    question_text: "سؤال الريمونتادا الأسطوري: ما هو أول قمر صناعي أطلقه البشر إلى الفضاء الخارجي عام 1957؟",
    options_json: ["سبوتنيك 1 (Sputnik 1)", "أبولو 11 (Apollo 11)", "فوستوك 1 (Vostok 1)", "إكسبلورر 1 (Explorer 1)"],
    correct_answer: "سبوتنيك 1 (Sputnik 1)",
    category_name: "المواجهة الكبرى 🔥"
  },
  {
    points: 1000,
    question_text: "سؤال الريمونتادا الأسطوري: في أي معركة تاريخية هُزم نابليون بونابرت نهائياً عام 1815؟",
    options_json: ["معركة واترلو (Waterloo)", "معركة أوسترليتز", "معركة وادرام", "معركة الطرف الأغر"],
    correct_answer: "معركة واترلو (Waterloo)",
    category_name: "المواجهة الكبرى 🔥"
  },
  {
    points: 1000,
    question_text: "سؤال الريمونتادا الأسطوري: ما هي أول لغة برمجة عالية المستوى تم تطويرها عام 1957 للاستخدام العلمي؟",
    options_json: ["فورتران (Fortran)", "سي (C)", "كوبول (COBOL)", "بيسك (BASIC)"],
    correct_answer: "فورتران (Fortran)",
    category_name: "المواجهة الكبرى 🔥"
  }
];
