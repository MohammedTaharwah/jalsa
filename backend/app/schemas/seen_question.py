from typing import List, Optional, Union
from pydantic import BaseModel, Field
from app.schemas.question import QuestionOut


class RecordSeenQuestionsRequest(BaseModel):
    user_id: int = Field(..., description="معرف المستخدم")
    question_ids: List[int] = Field(..., description="قائمة معرفات الأسئلة التي تم عرضها في الجلسة")


class SeenQuestionsResponse(BaseModel):
    success: bool
    recorded_count: int
    message: str


class BoardFetchRequest(BaseModel):
    category_ids: List[Union[int, str]] = Field(..., min_length=1, description="قائمة معرفات أو مفاتيح الفئات المختارة للوحة")
    user_id: Optional[int] = Field(None, description="معرف المستخدم لاستبعاد الأسئلة المشاهدة")


class BoardTileOut(BaseModel):
    points: int
    is_available: bool
    question: Optional[QuestionOut] = None
    message: Optional[str] = None


class BoardCategoryOut(BaseModel):
    category_id: Union[int, str]
    category_name: str
    tiles: List[BoardTileOut]
