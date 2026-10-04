import os
import sys
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from app.database import SessionLocal
from app.models.category import Category
from app.models.question import Question

# Concise questions mapping
SIMPLIFIED_QUESTIONS = [
    {
        "category_name": "شعارات الأندية والمنتخبات",
        "questions": [
            # 200
            {"media": "club_barcelona.png", "q": "ما هو هذا النادي؟", "ans": "برشلونة", "pts": 200, "opts": ["برشلونة", "ريال مدريد", "أتلتيكو مدريد", "فالنسيا"]},
            {"media": "club_real_madrid.png", "q": "ما هو هذا النادي؟", "ans": "ريال مدريد", "pts": 200, "opts": ["ريال مدريد", "إشبيلية", "ريال سوسيداد", "ريال بيتيس"]},
            {"media": "club_al_ahly.png", "q": "ما هو هذا النادي؟", "ans": "الأهلي المصري", "pts": 200, "opts": ["الأهلي المصري", "الزمالك", "الترجي التونسي", "الوداد المغربي"]},
            {"media": "team_brazil.png", "q": "ما هو هذا المنتخب؟", "ans": "البرازيل", "pts": 200, "opts": ["البرازيل", "الأرجنتين", "كولومبيا", "الأوروغواي"]},
            # 400
            {"media": "club_man_united.png", "q": "ما هو هذا النادي؟", "ans": "مانشستر يونايتد", "pts": 400, "opts": ["مانشستر يونايتد", "ليفربول", "أرسنال", "مانشستر سيتي"]},
            {"media": "club_liverpool.png", "q": "ما هو هذا النادي؟", "ans": "ليفربول", "pts": 400, "opts": ["ليفربول", "مانشستر يونايتد", "أستون فيلا", "إيفرتون"]},
            {"media": "club_chelsea.png", "q": "ما هو هذا النادي؟", "ans": "تشيلسي", "pts": 400, "opts": ["تشيلسي", "توتنهام", "أرسنال", "وست هام"]},
            {"media": "club_bayern_munich.png", "q": "ما هو هذا النادي؟", "ans": "بايرن ميونخ", "pts": 400, "opts": ["بايرن ميونخ", "بوروسيا دورتموند", "باير ليفركوزن", "شالكه"]},
            # 600
            {"media": "club_juventus.png", "q": "ما هو هذا النادي؟", "ans": "يوفنتوس", "pts": 600, "opts": ["يوفنتوس", "ميلان", "إنتر ميلان", "أودينيزي"]},
            {"media": "club_psg.png", "q": "ما هو هذا النادي؟", "ans": "باريس سان جيرمان", "pts": 600, "opts": ["باريس سان جيرمان", "مارسيليا", "موناكو", "ليون"]},
            {"media": "club_boca_juniors.png", "q": "ما هو هذا النادي؟", "ans": "بوكا جونيورز", "pts": 600, "opts": ["بوكا جونيورز", "ريفر بليت", "سان لورينزو", "راسينغ"]},
            {"media": "club_porto.png", "q": "ما هو هذا النادي؟", "ans": "بورتو", "pts": 600, "opts": ["بورتو", "بنفيكا", "سبورتينغ لشبونة", "براغا"]}
        ]
    },
    {
        "category_name": "أعلام الدول",
        "questions": [
            # 200
            {"media": "flag_jordan.png", "q": "علم أي دولة هذا؟", "ans": "الأردن", "pts": 200, "opts": ["الأردن", "فلسطين", "الكويت", "السودان"]},
            {"media": "flag_palestine.png", "q": "علم أي دولة هذا؟", "ans": "فلسطين", "pts": 200, "opts": ["فلسطين", "الأردن", "العراق", "اليمن"]},
            {"media": "flag_saudi_arabia.png", "q": "علم أي دولة هذا؟", "ans": "السعودية", "pts": 200, "opts": ["السعودية", "الجزائر", "موريتانيا", "باكستان"]},
            {"media": "flag_japan.png", "q": "علم أي دولة هذا؟", "ans": "اليابان", "pts": 200, "opts": ["اليابان", "كوريا الجنوبية", "الصين", "سنغافورة"]},
            # 400
            {"media": "flag_argentina.png", "q": "علم أي دولة هذا؟", "ans": "الأرجنتين", "pts": 400, "opts": ["الأرجنتين", "الأوروغواي", "غواتيمالا", "هندوراس"]},
            {"media": "flag_germany.png", "q": "علم أي دولة هذا؟", "ans": "ألمانيا", "pts": 400, "opts": ["ألمانيا", "بلجيكا", "هولندا", "النمسا"]},
            {"media": "flag_turkey.png", "q": "علم أي دولة هذا؟", "ans": "تركيا", "pts": 400, "opts": ["تركيا", "تونس", "أذربيجان", "الجزائر"]},
            {"media": "flag_south_africa.png", "q": "علم أي دولة هذا؟", "ans": "جنوب إفريقيا", "pts": 400, "opts": ["جنوب إفريقيا", "غانا", "نيجيريا", "كينيا"]},
            # 600
            {"media": "flag_chad.png", "q": "علم أي دولة هذا؟", "ans": "تشاد", "pts": 600, "opts": ["تشاد", "مالي", "غينيا", "الكاميرون"]},
            {"media": "flag_indonesia.png", "q": "علم أي دولة هذا؟", "ans": "إندونيسيا", "pts": 600, "opts": ["إندونيسيا", "بولندا", "سنغافورة", "الفلبين"]},
            {"media": "flag_iceland.png", "q": "علم أي دولة هذا؟", "ans": "آيسلندا", "pts": 600, "opts": ["آيسلندا", "النرويج", "فنلندا", "السويد"]},
            {"media": "flag_qatar.png", "q": "علم أي دولة هذا؟", "ans": "قطر", "pts": 600, "opts": ["قطر", "البحرين", "عُمان", "الكويت"]}
        ]
    },
    {
        "category_name": "معالم سياحية وأثرية",
        "questions": [
            # 200
            {"media": "landmark_petra.png", "q": "ما هو هذا المعلم؟", "ans": "البتراء (الخزنة)", "pts": 200, "opts": ["البتراء (الخزنة)", "جرش", "قلعة عجلون", "أم قيس"]},
            {"media": "landmark_dome_of_rock.png", "q": "ما هو هذا المعلم؟", "ans": "قبة الصخرة المشرفة", "pts": 200, "opts": ["قبة الصخرة المشرفة", "المسجد القبلي", "المسجد الإبراهيمي", "جامع بني أمية"]},
            {"media": "landmark_eiffel_tower.png", "q": "ما هو هذا المعلم؟", "ans": "برج إيفل", "pts": 200, "opts": ["برج إيفل", "برج بيزا", "ساعة بيغ بن", "برج طوكيو"]},
            {"media": "landmark_pyramids_giza.png", "q": "ما هو هذا المعلم؟", "ans": "أهرامات الجيزة", "pts": 200, "opts": ["أهرامات الجيزة", "معبد الكرنك", "معبد أبو سمبل", "قلعة قايتباي"]},
            # 400
            {"media": "landmark_colosseum.png", "q": "ما هو هذا المعلم؟", "ans": "الكولوسيوم", "pts": 400, "opts": ["الكولوسيوم", "البانثيون", "مدرج بصرى", "مدرج الجم"]},
            {"media": "landmark_taj_mahal.png", "q": "ما هو هذا المعلم؟", "ans": "تاج محل", "pts": 400, "opts": ["تاج محل", "قصر الحمراء", "مسجد بادشاهي", "قطب منار"]},
            {"media": "landmark_pisa_tower.png", "q": "ما هو هذا المعلم؟", "ans": "برج بيزا المائل", "pts": 400, "opts": ["برج بيزا المائل", "برج خليفة", "برج لندن", "برج جالاتا"]},
            {"media": "landmark_jerash_oval_plaza.png", "q": "ما هو هذا الموقع الأثري؟", "ans": "جرش (الساحة البيضاوية)", "pts": 400, "opts": ["جرش (الساحة البيضاوية)", "مادبا", "أم الرصاص", "طبقة فحل"]},
            # 600
            {"media": "landmark_machu_picchu.png", "q": "ما هو هذا المعلم؟", "ans": "ماتشو بيتشو", "pts": 600, "opts": ["ماتشو بيتشو", "تشيتشن إيتزا", "تيوتيهواكان", "تيواناكو"]},
            {"media": "landmark_alhambra.png", "q": "ما هو هذا القصر التاريخي؟", "ans": "قصر الحمراء", "pts": 600, "opts": ["قصر الحمراء", "قصر المورق (إشبيلية)", "جامع قرطبة", "قصر الجعفرية"]},
            {"media": "landmark_statue_of_liberty.png", "q": "ما هو هذا المجسم/المعلم؟", "ans": "تمثال الحرية", "pts": 600, "opts": ["تمثال الحرية", "تمثال المسيح الفادي", "تمثال الوطن الأم", "أبو الهول"]},
            {"media": "landmark_ajloun_castle.png", "q": "ما هي هذه القلعة التاريخية؟", "ans": "قلعة عجلون", "pts": 600, "opts": ["قلعة عجلون", "قلعة الكرك", "قلعة الشوبك", "قلعة عمان"]}
        ]
    }
]

def update_questions():
    db = SessionLocal()
    updated_count = 0
    try:
        for cat_data in SIMPLIFIED_QUESTIONS:
            cat_name = cat_data["category_name"]
            cat = db.query(Category).filter(Category.name == cat_name).first()
            if not cat:
                continue

            for item in cat_data["questions"]:
                # Match by correct answer or media filename
                q_obj = db.query(Question).filter(
                    Question.category_id == cat.id,
                    Question.correct_answer == item["ans"]
                ).first()

                if not q_obj:
                    # try matching by media_url
                    q_obj = db.query(Question).filter(
                        Question.category_id == cat.id,
                        Question.media_url.like(f"%{item['media']}%")
                    ).first()

                if q_obj:
                    q_obj.question_text = item["q"]
                    q_obj.points_level = item["pts"]
                    q_obj.options_json = item["opts"]
                    q_obj.correct_answer = item["ans"]
                    updated_count += 1

        db.commit()
        print(f"✅ Successfully updated {updated_count} questions to short and fast text!")
    except Exception as e:
        db.rollback()
        print(f"[-] Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_questions()
