import os
import sys
import json
import time
import urllib.request
import urllib.parse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from app.database import SessionLocal
from app.models.category import Category
from app.models.question import Question

PUBLIC_MEDIA_DIR = BASE_DIR / "frontend" / "public" / "game-media" / "معالم_وعجائب"
PUBLIC_MEDIA_DIR.mkdir(parents=True, exist_ok=True)

USER_AGENT = "JalsaApp/1.0 (https://jalsa.app; contact: info@jalsa.app)"

# Mapping of arabic answer to english wikipedia search keyword
WIKI_MAPPING = {
    "برج إيفل": "Eiffel Tower",
    "أهرامات الجيزة": "Great Pyramid of Giza",
    "تمثال الحرية": "Statue of Liberty",
    "الكولوسيوم": "Colosseum",
    "ساعة بيغ بن": "Big Ben",
    "تاج محل": "Taj Mahal",
    "سور الصين العظيم": "Great Wall of China",
    "برج خليفة": "Burj Khalifa",
    "الخزنة في البتراء": "Al-Khazneh",
    "برج بيزا المائل": "Leaning Tower of Pisa",
    "دار أوبرا سيدني": "Sydney Opera House",
    "تمثال المسيح المخلص": "Christ the Redeemer (statue)",
    "أبو الهول": "Great Sphinx of Giza",
    "ماتشو بيتشو": "Machu Picchu",
    "جسر البوابة الذهبية": "Golden Gate Bridge",
    "جسر البرج (تاور بريدج)": "Tower Bridge",
    "برج العرب": "Burj Al Arab",
    "قبة الصخرة": "Dome of the Rock",
    "آيا صوفيا": "Hagia Sophia",
    "ساغرادا فاميليا": "Sagrada Família",
    "بوابة براندنبورغ": "Brandenburg Gate",
    "جبل فوجي": "Mount Fuji",
    "مبنى إمباير ستيت": "Empire State Building",
    "ستونهنج": "Stonehenge",
    "البارثينون": "Parthenon",
    "هرم اللوفر الزجاجي": "Louvre Pyramid",
    "شلالات نياغرا": "Niagara Falls",
    "أنكور وات": "Angkor Wat",
    "الدير في البتراء": "Ad Deir",
    "وادي رم": "Wadi Rum",
    "قوس هادريان في جرش": "Arch of Hadrian (Jerash)",
    "معبد هرقل في عمان": "Temple of Hercules (Amman)",
    "المدرج الروماني في عمان": "Roman Theater (Amman)",
    "معبد الكرنك": "Karnak",
    "معبد أبو سمبل": "Abu Simbel temples",
    "قصر الحمراء": "Alhambra",
    "قلعة نويشفانشتاين": "Neuschwanstein Castle",
    "برجا بتروناس": "Petronas Towers",
    "تايبيه 101": "Taipei 101",
    "برج سي إن": "CN Tower",
    "سبيس نيدل": "Space Needle",
    "تشيتشن إيتزا": "Chichen Itza",
    "تماثيل الموآي في جزيرة الفصح": "Moai",
    "المدينة المحرمة": "Forbidden City",
    "معبد بوروبودور": "Borobudur",
    "المسجد الأزرق": "Sultan Ahmed Mosque",
    "جامع الشيخ زايد": "Sheikh Zayed Grand Mosque",
    "كابادوكيا": "Cappadocia",
    "مون سان ميشيل": "Mont-Saint-Michel",
    "كاتدرائية القديس باسيل": "Saint Basil's Cathedral",
    "أتوميوم بروكسل": "Atomium",
    "قصر فرساي": "Palace of Versailles",
    "شلالات فيكتوريا": "Victoria Falls",
    "مارينا باي ساندز": "Marina Bay Sands",
    "الأعمدة في تدمر": "Great Colonnade at Palmyra",
    "معبد جوبيتر في بعلبك": "Temple of Jupiter (Roman Baalbek)",
    "قلعة الحصن (كراك دي شوفالييه)": "Krak des Chevaliers",
    "قلعة عجلون": "Ajloun Castle",
    "قصير عمرة": "Qusayr 'Amra",
    "قلعة الكرك": "Kerak Castle",
    "جبل نبو": "Mount Nebo (Jordan)",
    "أم قيس": "Gadara",
    "موقع المغطس": "Al-Maghtas",
    "سيجيريا (صخرة الأسد)": "Sigiriya",
    "قصر بوتالا": "Potala Palace",
    "ميتيورا": "Meteora",
    "معابد باغان": "Bagan",
    "خليج ها لونغ": "Hạ Long Bay",
    "طريق العمالقة": "Giant's Causeway",
    "بامو كالي (قلعة القطن)": "Pamukkale",
    "مكتبة سيلسوس في أفسس": "Library of Celsus",
    "جامع جيني الطيني في مالي": "Great Mosque of Djenné",
    "كنائس لاليبيلا الصخرية": "Rock-Hewn Churches, Lalibela",
    "قصبة آيت بن حدو": "Aït Benhaddou",
    "مسجد الحسن الثاني": "Hassan II Mosque",
    "المعبد الذهبي كينكاكوجي": "Kinkaku-ji",
    "قلعة حلب": "Citadel of Aleppo",
    "معبد حتشبسوت (الدير البحري)": "Mortuary Temple of Hatshepsut",
    "تيكال": "Tikal",
    "قصر الرياح (هاوا محل)": "Hawa Mahal"
}


def fetch_wiki_thumbnail(wiki_title):
    api_url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(wiki_title)}&prop=pageimages&format=json&pithumbsize=600"
    req = urllib.request.Request(api_url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            pages = data.get("query", {}).get("pages", {})
            for pid, pdata in pages.items():
                if "thumbnail" in pdata and "source" in pdata["thumbnail"]:
                    return pdata["thumbnail"]["source"]
    except Exception as e:
        print(f"[-] Wiki search failed for {wiki_title}: {e}")
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
        print(f"[-] Download error for {url}: {e}")
        return False


def process_landmarks():
    json_path = BASE_DIR / "landmarks_questions.json"
    with open(json_path, "r", encoding="utf-8") as f:
        questions_data = json.load(f)

    db = SessionLocal()

    cat_name = "معالم وعجائب"
    category = db.query(Category).filter(Category.name == cat_name).first()
    if not category:
        category = Category(
            name=cat_name,
            section="الدول",
            description="خمّن المعالم التاريخية والعجائب العالمية من وراء الغشاوة والتغبيش!",
            image_url="/game-media/معالم_وعجائب/eiffel_tower.jpg"
        )
        db.add(category)
        db.flush()
        print(f"✨ Created category: {cat_name}")
    else:
        print(f"ℹ️ Category exists: {cat_name}")

    print(f"\n🚀 Processing {len(questions_data)} landmarks questions...")

    success_downloads = 0
    added_questions = 0

    for idx, item in enumerate(questions_data):
        ans = item["correct_answer"].strip()
        filename = item["media_url"]
        target_path = PUBLIC_MEDIA_DIR / filename
        rel_media_url = f"/game-media/معالم_وعجائب/{filename}"

        # 1. Fetch and download image if not present
        if not target_path.exists():
            wiki_search = WIKI_MAPPING.get(ans, ans)
            print(f"[{idx+1}/{len(questions_data)}] Downloading image for: {ans} ({wiki_search}) -> {filename} ...")
            img_url = fetch_wiki_thumbnail(wiki_search)
            if img_url and download_image(img_url, target_path):
                success_downloads += 1
                print(f"   ✅ Saved: {filename}")
            else:
                print(f"   ⚠️ Could not fetch: {ans}")
            time.sleep(0.15)
        else:
            success_downloads += 1

        # 2. Add or update question in DB (strictly 600 points)
        # Avoid duplicate questions by checking existing correct_answer in this category
        q_obj = db.query(Question).filter(
            Question.category_id == category.id,
            Question.correct_answer == ans
        ).first()

        if not q_obj:
            q_obj = Question(
                category_id=category.id,
                question_text="ما هو هذا المعلم؟",
                options_json=item["options_json"],
                correct_answer=ans,
                points_level=600,  # All image questions set to 600 points as requested!
                media_url=rel_media_url,
                status="active"
            )
            db.add(q_obj)
            added_questions += 1
        else:
            # Update to concise text and 600 points
            q_obj.question_text = "ما هو هذا المعلم؟"
            q_obj.points_level = 600
            q_obj.media_url = rel_media_url
            q_obj.options_json = item["options_json"]

    # Also ensure all questions in categories with images have points_level = 600
    all_image_questions = db.query(Question).filter(Question.media_url != None).all()
    for q in all_image_questions:
        q.points_level = 600

    db.commit()
    db.close()

    print(f"\n🎉 Finished processing landmarks!")
    print(f"📊 Downloaded/Confirmed: {success_downloads}/{len(questions_data)} images")
    print(f"📊 Added {added_questions} new questions (all 600 points) to category: {cat_name}")


if __name__ == "__main__":
    process_landmarks()
