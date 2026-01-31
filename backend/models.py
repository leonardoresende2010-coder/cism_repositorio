from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON
from .database import Base
import datetime
import uuid
import hashlib

def generate_uuid():
    return str(uuid.uuid4())

def create_question_hash(question_text: str) -> str:
    """Create a hash from question text to identify identical questions across users"""
    normalized_text = question_text.strip().lower()
    return hashlib.sha256(normalized_text.encode()).hexdigest()[:16]  # Use first 16 chars

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id")) # Link Quiz to User
    workplace_id = Column(String, ForeignKey("workplaces.id"), nullable=True) # Link Quiz to Workplace
    title = Column(String, index=True)
    description = Column(String, nullable=True)
    provider = Column(String, nullable=True) # e.g. ISACA, CompTIA, EXIN
    file_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")
    user = relationship("User", back_populates="quizzes")
    workplace = relationship("Workplace", back_populates="quizzes")

class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=generate_uuid)
    quiz_id = Column(String, ForeignKey("quizzes.id"))
    text = Column(Text)
    correct_answer_label = Column(String)
    explanation = Column(Text, nullable=True)
    
    # Store options as JSON: [{"id": "abc", "label": "A", "text": "Option text"}]
    options = Column(JSON)
    
    # Hash of question text to identify identical questions across different users/quizzes
    content_hash = Column(String, index=True, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")
    # progress relationship might be multiple now? No, usually one per user per question. But simplistic:
    # progress = relationship("UserProgress", back_populates="question", uselist=False) 
    # ^ logic changes with multi-user. One question has many progresses (one per user).
    # easier to remove back_populates on Question side if not needed, or make it list.
    progresses = relationship("UserProgress", back_populates="question", cascade="all, delete-orphan")
    notes = relationship("CommunityNote", back_populates="question", cascade="all, delete-orphan")

class UserProgress(Base):
    __tablename__ = "user_progress"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id")) # Link Progress to User
    question_id = Column(String, ForeignKey("questions.id")) # Removed unique=True
    
    selected_answer = Column(String, nullable=True) # Option ID
    is_flagged_disagree_key = Column(Boolean, default=False)
    is_flagged_disagree_ai = Column(Boolean, default=False)
    ai_analysis = Column(Text, nullable=True)
    
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    question = relationship("Question", back_populates="progresses")
    user = relationship("User", back_populates="progress")

class CommunityNote(Base):
    __tablename__ = "community_notes"

    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(String, ForeignKey("questions.id"), index=True, nullable=True)  # Keep for backward compatibility
    question_hash = Column(String, index=True, nullable=True)  # Hash of question content for cross-user sharing
    user_id = Column(String, ForeignKey("users.id"))
    user_name = Column(String) # Stored for easy display
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Study Group functionality
    visibility = Column(String, default="public")  # "public" or "group"
    shared_with = Column(JSON, nullable=True)  # List of usernames for "group" visibility

    question = relationship("Question", back_populates="notes")
    user = relationship("User", back_populates="community_notes")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, index=True)
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    google_sub = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True) # Nullable for purely Google users
    is_premium = Column(Boolean, default=False)
    is_admin = Column(Boolean, default=False)
    premium_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    quizzes = relationship("Quiz", back_populates="user")
    workplaces = relationship("Workplace", back_populates="user")
    progress = relationship("UserProgress", back_populates="user")
    community_notes = relationship("CommunityNote", back_populates="user")
    study_groups = relationship("StudyGroup", back_populates="creator")

class Workplace(Base):
    __tablename__ = "workplaces"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="workplaces")
    quizzes = relationship("Quiz", back_populates="workplace", cascade="all, delete-orphan")

class StudyGroup(Base):
    __tablename__ = "study_groups"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, index=True)
    creator_id = Column(String, ForeignKey("users.id"))
    members = Column(JSON)  # List of usernames
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    creator = relationship("User", back_populates="study_groups")
