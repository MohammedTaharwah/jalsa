import os
import sys
import json
from pathlib import Path

# Add backend directory to path to use SQLAlchemy models & database session
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR / "backend"))

# Ensure UTF-8 output on Windows terminal
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')

from app.database import SessionLocal
from app.models.category import Category
from app.models.question import Question


def seed_questions():
    json_path = BASE_DIR / "scripts" / "ready_questions.json"
    if not json_path.exists():
        print(f"[-] File not found: {json_path}")
        return

    with open(json_path, "r", encoding="utf-8") as f:
        categories_data = json.load(f)

    db = SessionLocal()
    total_added_categories = 0
    total_added_questions = 0

    try:
        print("🌱 Seeding questions and categories into database...")
        for cat_info in categories_data:
            cat_name = cat_info["name"]
            
            # Check or create category
            category = db.query(Category).filter(Category.name == cat_name).first()
            if not category:
                category = Category(
                    name=cat_name,
                    section=cat_info.get("section", "عام"),
                    description=cat_info.get("description", ""),
                    image_url=cat_info["questions"][0]["media_url"] if cat_info["questions"] else None
                )
                db.add(category)
                db.flush()  # to get category.id
                total_added_categories += 1
                print(f"  ✨ Added Category: {cat_name}")
            else:
                print(f"  ℹ️ Category exists: {cat_name}")

            for q_data in cat_info["questions"]:
                # Check if question already exists in this category
                existing_q = db.query(Question).filter(
                    Question.category_id == category.id,
                    Question.question_text == q_data["question_text"]
                ).first()

                if not existing_q:
                    new_q = Question(
                        category_id=category.id,
                        question_text=q_data["question_text"],
                        options_json=q_data["options_json"],
                        correct_answer=q_data["correct_answer"],
                        points_level=q_data["points_level"],
                        media_url=q_data["media_url"],
                        status=q_data.get("status", "active")
                    )
                    db.add(new_q)
                    total_added_questions += 1
                else:
                    # Update media_url and points just in case
                    existing_q.media_url = q_data["media_url"]
                    existing_q.points_level = q_data["points_level"]
                    existing_q.options_json = q_data["options_json"]
                    existing_q.correct_answer = q_data["correct_answer"]

        db.commit()
        print(f"\n🎉 Seeding complete! Added {total_added_categories} categories and {total_added_questions} questions.")
    except Exception as e:
        db.rollback()
        print(f"[-] Error while seeding database: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_questions()
