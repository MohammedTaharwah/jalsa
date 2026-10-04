import os
import sys
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent
PUBLIC_MEDIA_DIR = BASE_DIR / "frontend" / "public" / "game-media"
OUTPUT_JSON_PATH = BASE_DIR / "scripts" / "ready_questions.json"

USER_AGENT = "JalsaApp/1.0 (https://jalsa.app; contact: info@jalsa.app)"

DATA = [
    {
        "category_name": "شعارات الأندية والمنتخبات",
        "section": "رياضة وتحدي",
        "description": "خمّن النادي أو المنتخب صاحب الشعار من وراء الغشاوة والتغبيش!",
        "questions": [
            # 200 Points (سهل جداً - ألوان وأشكال واضحة ومشهورة)
            {
                "file_title": "File:FC_Barcelona_(crest).svg",
                "page_title": "FC_Barcelona",
                "filename": "club_barcelona.png",
                "question": "ما هو النادي الإسباني العريق صاحب هذا الشعار الشهير؟",
                "options": ["برشلونة", "ريال مدريد", "أتلتيكو مدريد", "فالنسيا"],
                "correct_answer": "برشلونة",
                "points": 200
            },
            {
                "file_title": "File:Real_Madrid_CF.svg",
                "page_title": None,
                "filename": "club_real_madrid.png",
                "question": "ما هو النادي الملكي صاحب التاج الملكي وهذا الشعار التاريخي؟",
                "options": ["ريال مدريد", "إشبيلية", "ريال سوسيداد", "ريال بيتيس"],
                "correct_answer": "ريال مدريد",
                "points": 200
            },
            {
                "file_title": "File:Al_Ahly_SC_logo.svg",
                "page_title": None,
                "filename": "club_al_ahly.png",
                "question": "ما هو النادي العربي الملقب بنادي القرن الإفريقي وصاحب النسر الأحمر؟",
                "options": ["الأهلي المصري", "الزمالك", "الترجي التونسي", "الوداد المغربي"],
                "correct_answer": "الأهلي المصري",
                "points": 200
            },
            {
                "file_title": "File:Flag_of_Brazil.svg",
                "page_title": "Brazil_national_football_team",
                "filename": "team_brazil.png",
                "question": "ما هو المنتخب صاحب هذا اللون الأصفر السامبا والحائز على 5 كؤوس عالم؟",
                "options": ["البرازيل", "الأرجنتين", "كولومبيا", "الأوروغواي"],
                "correct_answer": "البرازيل",
                "points": 200
            },

            # 400 Points (متوسط - أندية ومنتخبات قوية تتطلب تدقيقاً)
            {
                "file_title": "File:Manchester_United_FC_crest.svg",
                "page_title": None,
                "filename": "club_man_united.png",
                "question": "ما هو النادي الإنجليزي العريق الملقب بـ 'الشياطين الحمر' صاحب هذا الشعار؟",
                "options": ["مانشستر يونايتد", "ليفربول", "أرسنال", "مانشستر سيتي"],
                "correct_answer": "مانشستر يونايتد",
                "points": 400
            },
            {
                "file_title": "File:Liverpool_FC.svg",
                "page_title": None,
                "filename": "club_liverpool.png",
                "question": "ما هو النادي الإنجليزي صاحب طائر الليفر العريق وشعار 'لن تسير وحدك أبداً'؟",
                "options": ["ليفربول", "مانشستر يونايتد", "أستون فيلا", "إيفرتون"],
                "correct_answer": "ليفربول",
                "points": 400
            },
            {
                "file_title": "File:Chelsea_FC.svg",
                "page_title": None,
                "filename": "club_chelsea.png",
                "question": "ما هو النادي اللندني الملقب بـ 'البلوز' صاحب شعار الأسد الأزرق؟",
                "options": ["تشيلسي", "توتنهام", "أرسنال", "وست هام"],
                "correct_answer": "تشيلسي",
                "points": 400
            },
            {
                "file_title": "File:FC_Bayern_München_logo_(2017).svg",
                "page_title": None,
                "filename": "club_bayern_munich.png",
                "question": "ما هو النادي البافاري العملاق صاحب هذا الشعار الدائري الأحمر والأزرق؟",
                "options": ["بايرن ميونخ", "بوروسيا دورتموند", "باير ليفركوزن", "شالكه"],
                "correct_answer": "بايرن ميونخ",
                "points": 400
            },

            # 600 Points (صعب - شعارات تتطلب تركيزاً دقيقاً في الألوان والتفاصيل)
            {
                "file_title": "File:Juventus_FC_2017_logo.svg",
                "page_title": None,
                "filename": "club_juventus.png",
                "question": "ما هو النادي الإيطالي الشهير الملقب بـ 'السيدة العجوز' صاحب حرف J العصري؟",
                "options": ["يوفنتوس", "ميلان", "إنتر ميلان", "أودينيزي"],
                "correct_answer": "يوفنتوس",
                "points": 600
            },
            {
                "file_title": "File:Paris_Saint-Germain_F.C..svg",
                "page_title": None,
                "filename": "club_psg.png",
                "question": "ما هو النادي الباريسي صاحب الشعار الدائري الذي يتوسطه برج إيفل وزهرة الزنبق؟",
                "options": ["باريس سان جيرمان", "مارسيليا", "موناكو", "ليون"],
                "correct_answer": "باريس سان جيرمان",
                "points": 600
            },
            {
                "file_title": "File:Boca_Juniors_logo18.svg",
                "page_title": None,
                "filename": "club_boca_juniors.png",
                "question": "ما هو النادي الأرجنتيني العريق صاحب اللونين الأزرق والأصفر والنجوم العديدة؟",
                "options": ["بوكا جونيورز", "ريفر بليت", "سان لورينزو", "راسينغ"],
                "correct_answer": "بوكا جونيورز",
                "points": 600
            },
            {
                "file_title": "File:FC_Porto.svg",
                "page_title": None,
                "filename": "club_porto.png",
                "question": "ما هو النادي البرتغالي الملقب بـ 'التنانين' صاحب هذا الشعار الأزرق والأبيض؟",
                "options": ["بورتو", "بنفيكا", "سبورتينغ لشبونة", "براغا"],
                "correct_answer": "بورتو",
                "points": 600
            }
        ]
    },
    {
        "category_name": "أعلام الدول",
        "section": "معلومات عامة وثقافة",
        "description": "خمّن الدولة من علمها ودرجات ألوانها المغبشة!",
        "questions": [
            # 200 Points
            {
                "file_title": "File:Flag_of_Jordan.svg",
                "page_title": "Flag_of_Jordan",
                "filename": "flag_jordan.png",
                "question": "ما هي الدولة صاحبة هذا العلم العربي ذو النجمة السباعية؟",
                "options": ["الأردن", "فلسطين", "الكويت", "السودان"],
                "correct_answer": "الأردن",
                "points": 200
            },
            {
                "file_title": "File:Flag_of_Palestine.svg",
                "page_title": "Flag_of_Palestine",
                "filename": "flag_palestine.png",
                "question": "ما هي الدولة صاحبة هذا العلم التاريخي والمثلث الأحمر؟",
                "options": ["فلسطين", "الأردن", "العراق", "اليمن"],
                "correct_answer": "فلسطين",
                "points": 200
            },
            {
                "file_title": "File:Flag_of_Saudi_Arabia.svg",
                "page_title": "Flag_of_Saudi_Arabia",
                "filename": "flag_saudi_arabia.png",
                "question": "ما هي الدولة صاحبة هذا العلم الأخضر المميز؟",
                "options": ["السعودية", "الجزائر", "موريتانيا", "باكستان"],
                "correct_answer": "السعودية",
                "points": 200
            },
            {
                "file_title": "File:Flag_of_Japan.svg",
                "page_title": "Flag_of_Japan",
                "filename": "flag_japan.png",
                "question": "ما هي الدولة صاحبة علم 'كوكب اليابان' والدائرة الحمراء؟",
                "options": ["اليابان", "كوريا الجنوبية", "الصين", "سنغافورة"],
                "correct_answer": "اليابان",
                "points": 200
            },

            # 400 Points
            {
                "file_title": "File:Flag_of_Argentina.svg",
                "page_title": "Flag_of_Argentina",
                "filename": "flag_argentina.png",
                "question": "ما هي الدولة اللاتينية صاحبة هذا العلم السماوي وفي وسطه شمس مايو؟",
                "options": ["الأرجنتين", "الأوروغواي", "غواتيمالا", "هندوراس"],
                "correct_answer": "الأرجنتين",
                "points": 400
            },
            {
                "file_title": "File:Flag_of_Germany.svg",
                "page_title": "Flag_of_Germany",
                "filename": "flag_germany.png",
                "question": "ما هي الدولة الأوروبية صاحبة الألوان الثلاثة (الأسود والأحمر والأصفر الذهبي)؟",
                "options": ["ألمانيا", "بلجيكا", "هولندا", "النمسا"],
                "correct_answer": "ألمانيا",
                "points": 400
            },
            {
                "file_title": "File:Flag_of_Turkey.svg",
                "page_title": "Flag_of_Turkey",
                "filename": "flag_turkey.png",
                "question": "ما هي الدولة صاحبة العلم الأحمر الذي يحمل الهلال والنجمة البيضاء؟",
                "options": ["تركيا", "تونس", "أذربيجان", "الجزائر"],
                "correct_answer": "تركيا",
                "points": 400
            },
            {
                "file_title": "File:Flag_of_South_Africa.svg",
                "page_title": "Flag_of_South_Africa",
                "filename": "flag_south_africa.png",
                "question": "ما هي الدولة الإفريقية صاحبة علم 'قوس قزح' متعدد الألوان؟",
                "options": ["جنوب إفريقيا", "غانا", "نيجيريا", "كينيا"],
                "correct_answer": "جنوب إفريقيا",
                "points": 400
            },

            # 600 Points
            {
                "file_title": "File:Flag_of_Chad.svg",
                "page_title": "Flag_of_Chad",
                "filename": "flag_chad.png",
                "question": "ما هي هذه الدولة التي يتطابق علمها تقريباً مع علم رومانيا (أزرق، أصفر، أحمر)؟",
                "options": ["تشاد", "مالي", "غينيا", "الكاميرون"],
                "correct_answer": "تشاد",
                "points": 600
            },
            {
                "file_title": "File:Flag_of_Indonesia.svg",
                "page_title": "Flag_of_Indonesia",
                "filename": "flag_indonesia.png",
                "question": "ما هي هذه الدولة الآسيوية صاحبة العلم ذي الخطين (الأحمر والأبيض) المتطابق مع موناكو؟",
                "options": ["إندونيسيا", "بولندا", "سنغافورة", "الفلبين"],
                "correct_answer": "إندونيسيا",
                "points": 600
            },
            {
                "file_title": "File:Flag_of_Iceland.svg",
                "page_title": "Flag_of_Iceland",
                "filename": "flag_iceland.png",
                "question": "ما هي هذه الدولة الشمالية صاحبة الصليب الأحمر المحاط بالأبيض على خلفية زرقاء؟",
                "options": ["آيسلندا", "النرويج", "فنلندا", "السويد"],
                "correct_answer": "آيسلندا",
                "points": 600
            },
            {
                "file_title": "File:Flag_of_Qatar.svg",
                "page_title": "Flag_of_Qatar",
                "filename": "flag_qatar.png",
                "question": "ما هي الدولة الخليجية صاحبة اللون العنابي (العنابي والأبيض بـ 9 رؤوس مسننة)؟",
                "options": ["قطر", "البحرين", "عُمان", "الكويت"],
                "correct_answer": "قطر",
                "points": 600
            }
        ]
    },
    {
        "category_name": "معالم سياحية وأثرية",
        "section": "تاريخ وجغرافيا",
        "description": "خمّن المعلم السياحي والتاريخي الشهير من خلف التغبيش!",
        "questions": [
            # 200 Points
            {
                "file_title": None,
                "page_title": "Petra",
                "filename": "landmark_petra.png",
                "question": "ما هي المدينة الوردية الأردنية وإحدى عجائب الدنيا السبع المعروضة بالصورة؟",
                "options": ["البتراء (الخزنة)", "جرش", "قلعة عجلون", "أم قيس"],
                "correct_answer": "البتراء (الخزنة)",
                "points": 200
            },
            {
                "file_title": None,
                "page_title": "Dome_of_the_Rock",
                "filename": "landmark_dome_of_rock.png",
                "question": "ما هو المعلم الإسلامي والقدسي الشريف ذو القبة الذهبية؟",
                "options": ["قبة الصخرة المشرفة", "المسجد القبلي", "المسجد الإبراهيمي", "جامع بني أمية"],
                "correct_answer": "قبة الصخرة المشرفة",
                "points": 200
            },
            {
                "file_title": None,
                "page_title": "Eiffel_Tower",
                "filename": "landmark_eiffel_tower.png",
                "question": "ما هو البرج الحديدي الشهير في باريس صاحب هذا الشكل؟",
                "options": ["برج إيفل", "برج بيزا", "ساعة بيغ بن", "برج طوكيو"],
                "correct_answer": "برج إيفل",
                "points": 200
            },
            {
                "file_title": None,
                "page_title": "Great_Pyramid_of_Giza",
                "filename": "landmark_pyramids_giza.png",
                "question": "ما هي إحدى عجائب العالم القديم الباقية في مصر؟",
                "options": ["أهرامات الجيزة", "معبد الكرنك", "معبد أبو سمبل", "قلعة قايتباي"],
                "correct_answer": "أهرامات الجيزة",
                "points": 200
            },

            # 400 Points
            {
                "file_title": None,
                "page_title": "Colosseum",
                "filename": "landmark_colosseum.png",
                "question": "ما هو المدرج الروماني العملاق الواقع في العاصمة الإيطالية روما؟",
                "options": ["الكولوسيوم", "البانثيون", "مدرج بصرى", "مدرج الجم"],
                "correct_answer": "الكولوسيوم",
                "points": 400
            },
            {
                "file_title": None,
                "page_title": "Taj_Mahal",
                "filename": "landmark_taj_mahal.png",
                "question": "ما هو الضريح المعماري الشهير المبني من الرخام الأبيض في الهند؟",
                "options": ["تاج محل", "قصر الحمراء", "مسجد بادشاهي", "قطب منار"],
                "correct_answer": "تاج محل",
                "points": 400
            },
            {
                "file_title": None,
                "page_title": "Leaning_Tower_of_Pisa",
                "filename": "landmark_pisa_tower.png",
                "question": "ما هو البرج الإيطالي الشهير المائل الذي يتحدى الجاذبية؟",
                "options": ["برج بيزا المائل", "برج خليفة", "برج لندن", "برج جالاتا"],
                "correct_answer": "برج بيزا المائل",
                "points": 400
            },
            {
                "file_title": None,
                "page_title": "Jerash",
                "filename": "landmark_jerash_oval_plaza.png",
                "question": "ما هي المدينة الأثرية الأردنية المعروفة بـ 'مدينة الألف عمود' وساحتها البيضاوية؟",
                "options": ["جرش", "مادبا", "أم الرصاص", "طبقة فحل"],
                "correct_answer": "جرش",
                "points": 400
            },

            # 600 Points
            {
                "file_title": None,
                "page_title": "Machu_Picchu",
                "filename": "landmark_machu_picchu.png",
                "question": "ما هي مدينة الإنكا المفقودة الشهيرة الواقعة فوق جبال الأنديز في البيرو؟",
                "options": ["ماتشو بيتشو", "تشيتشن إيتزا", "تيوتيهواكان", "تيواناكو"],
                "correct_answer": "ماتشو بيتشو",
                "points": 600
            },
            {
                "file_title": None,
                "page_title": "Alhambra",
                "filename": "landmark_alhambra.png",
                "question": "ما هو القصر الأندلسي التاريخي الفاخر الواقع في غرناطة بإسبانيا؟",
                "options": ["قصر الحمراء", "قصر المورق (إشبيلية)", "جامع قرطبة", "قصر الجعفرية"],
                "correct_answer": "قصر الحمراء",
                "points": 600
            },
            {
                "file_title": None,
                "page_title": "Statue_of_Liberty",
                "filename": "landmark_statue_of_liberty.png",
                "question": "ما هو التمثال الرمزي الشهير القائم في جزيرة الحرية بنيويورك؟",
                "options": ["تمثال الحرية", "تمثال المسيح الفادي", "تمثال الوطن الأم", "أبو الهول"],
                "correct_answer": "تمثال الحرية",
                "points": 600
            },
            {
                "file_title": None,
                "page_title": "Ajloun_Castle",
                "filename": "landmark_ajloun_castle.png",
                "question": "ما هي القلعة الأردنية التاريخية التي بناها القائد عز الدين أسامة بأمر من صلاح الدين الأيوبي؟",
                "options": ["قلعة عجلون", "قلعة الكرك", "قلعة الشوبك", "قلعة عمان"],
                "correct_answer": "قلعة عجلون",
                "points": 600
            }
        ]
    }
]


def fetch_image_from_file_title(file_title):
    api_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(file_title)}&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json"
    req = urllib.request.Request(api_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                imginfo = pdata.get("imageinfo", [])
                if imginfo and "thumburl" in imginfo[0]:
                    return imginfo[0]["thumburl"]
                elif imginfo and "url" in imginfo[0]:
                    return imginfo[0]["url"]
    except Exception as e:
        print(f"[-] Error fetching file title {file_title}: {e}")
    return None


def fetch_image_from_page_title(page_title):
    api_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(page_title)}&prop=pageimages&format=json&pithumbsize=600"
    req = urllib.request.Request(api_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                if "thumbnail" in pdata and "source" in pdata["thumbnail"]:
                    return pdata["thumbnail"]["source"]
    except Exception as e:
        print(f"[-] Error fetching page title {page_title}: {e}")
    return None


def download_image(url, save_path):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            content = resp.read()
            with open(save_path, "wb") as f:
                f.write(content)
            return True
    except Exception as e:
        print(f"[-] Error downloading {url}: {e}")
        return False


def main():
    PUBLIC_MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    all_categories_output = []

    print("🚀 Starting automated fetching of questions and high-res media...")

    for cat in DATA:
        cat_name = cat["category_name"]
        print(f"\n📂 Processing Category: {cat_name}")
        cat_folder = PUBLIC_MEDIA_DIR / cat_name.replace(" ", "_")
        cat_folder.mkdir(parents=True, exist_ok=True)

        prepared_questions = []

        for q in cat["questions"]:
            filename = q["filename"]
            target_path = cat_folder / filename
            rel_media_url = f"/game-media/{cat_name.replace(' ', '_')}/{filename}"

            print(f"  🔍 Fetching image: {filename} ...")
            img_url = None
            if q.get("file_title"):
                img_url = fetch_image_from_file_title(q["file_title"])
            if not img_url and q.get("page_title"):
                img_url = fetch_image_from_page_title(q["page_title"])

            success = False
            if img_url:
                success = download_image(img_url, target_path)

            if success:
                print(f"     ✅ Downloaded to {rel_media_url}")
            else:
                print(f"     ❌ FAILED to download for {filename}")

            prepared_questions.append({
                "question_text": q["question"],
                "options_json": q["options"],
                "correct_answer": q["correct_answer"],
                "points_level": q["points"],
                "media_url": rel_media_url,
                "status": "active"
            })
            time.sleep(0.2)

        all_categories_output.append({
            "name": cat_name,
            "section": cat["section"],
            "description": cat["description"],
            "questions": prepared_questions
        })

    with open(OUTPUT_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(all_categories_output, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Finished successfully! Questions JSON saved to {OUTPUT_JSON_PATH}")


if __name__ == "__main__":
    main()
