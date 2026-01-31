from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class Option(BaseModel):
    id: str
    label: str
    text: str

class QuestionBase(BaseModel):
    id: str
    text: str
    options: List[Option]
    correct_answer_label: str
    explanation: Optional[str] = None

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    class Config:
        from_attributes = True

class QuizBase(BaseModel):
    title: str
    description: Optional[str] = None
    provider: Optional[str] = None
    file_name: Optional[str] = None
    workplace_id: Optional[str] = None

class QuizCreate(QuizBase):
    questions: List[QuestionCreate]

class Quiz(QuizBase):
    id: str
    created_at: datetime
    questions: List[Question]
    workplace_id: Optional[str] = None
    
    # We might want to include progress here or fetch separately
    class Config:
        from_attributes = True

class UserProgressBase(BaseModel):
    question_id: str
    selected_answer: Optional[str] = None
    is_flagged_disagree_key: Optional[bool] = False
    is_flagged_disagree_ai: Optional[bool] = False
    ai_analysis: Optional[str] = None

class UserProgressUpdate(UserProgressBase):
    pass

class UserProgress(UserProgressBase):
    id: str
    updated_at: datetime
    class Config:
        from_attributes = True

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class GoogleAuth(BaseModel):
    token: str

class User(UserBase):
    id: str
    is_premium: bool
    is_admin: bool
    premium_until: Optional[datetime] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class GenerateQuizRequest(BaseModel):
    exam_name: str
    num_questions: Optional[int] = 20

class CommunityNoteBase(BaseModel):
    question_id: str
    user_name: str
    content: str
    visibility: Optional[str] = "public"  # "public" or "group"
    shared_with: Optional[list] = None  # List of usernames

class CommunityNoteCreate(CommunityNoteBase):
    pass

class CommunityNote(CommunityNoteBase):
    id: str
    created_at: datetime
    class Config:
        from_attributes = True

class StudyGroupBase(BaseModel):
    name: str
    members: List[str]

class StudyGroupCreate(StudyGroupBase):
    pass

class StudyGroup(StudyGroupBase):
    id: str
    creator_id: str
    created_at: datetime
    class Config:
        from_attributes = True

class WorkplaceBase(BaseModel):
    name: str

class WorkplaceCreate(WorkplaceBase):
    pass

class Workplace(WorkplaceBase):
    id: str
    user_id: str
    created_at: datetime
    quizzes: List[Quiz] = []
    class Config:
        from_attributes = True

class QuizUpdateQuestions(BaseModel):
    questions: List[QuestionCreate]
