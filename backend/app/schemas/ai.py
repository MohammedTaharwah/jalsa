from typing import List, Optional, Any, Union
from pydantic import BaseModel, Field


class GenerateQuestionsRequest(BaseModel):
    category_name: Optional[str] = Field(None, description="Name of category for AI to generate questions for", example="تاريخ وعلوم")
    category_id: Optional[int] = Field(None, description="Optional ID of existing category in database")
    count: int = Field(default=5, ge=1, le=30, description="Number of questions to generate", example=5)
    difficulty: Optional[str] = Field(default="medium", description="Question difficulty: easy, medium, hard")
    language: Optional[str] = Field(default="ar", description="Language of generated questions")


class GeneratedQuestionItem(BaseModel):
    question_text: str = Field(..., description="The question text")
    options_json: List[Any] = Field(..., description="List of choices/options, e.g. ['A', 'B', 'C', 'D']")
    correct_answer: str = Field(..., description="The correct answer matching one of the options")
    points_level: Optional[int] = Field(default=100, description="Points value for this question")
    media_url: Optional[str] = Field(None, description="Optional image/media URL for the question")
    category_id: Optional[int] = Field(None, description="Category ID if known")
    category_name: Optional[str] = Field(None, description="Category name if category_id not provided")


class N8NWebhookPayload(BaseModel):
    category_id: Optional[int] = None
    category_name: Optional[str] = None
    questions: Optional[List[GeneratedQuestionItem]] = None
