from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from typing import List, Optional
from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
import json

from google.oauth2 import id_token
from google.auth.transport import requests

from . import models, schemas, database
import mercadopago

from dotenv import load_dotenv

load_dotenv()

# --- Config ---
SECRET_KEY = os.getenv("SECRET_KEY")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
if not SECRET_KEY:
    raise ValueError("No SECRET_KEY set for Flask application")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

# --- Mercado Pago ---
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN")
sdk = mercadopago.SDK(MP_ACCESS_TOKEN) if MP_ACCESS_TOKEN else None

# --- Security ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- DB & Tables ---
app = FastAPI()

@app.on_event("startup")
def on_startup():
    print("🚀 Initializing database tables...")
    try:
        models.Base.metadata.create_all(bind=database.engine)
        print("✅ Database tables created/verified.")
    except Exception as e:
        print(f"❌ Error during database initialization: {e}")

# CORS
cors_origins_env = os.getenv("CORS_ORIGINS", "")
allowed_origins = [origin.strip() for origin in cors_origins_env.split(",")] if cors_origins_env else ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have enough privileges"
        )
    return current_user

# --- Auth Routes ---

@app.post("/auth/register", response_model=schemas.User)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username, 
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_password,
        is_admin=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/google", response_model=schemas.Token)
def google_login(auth: schemas.GoogleAuth, db: Session = Depends(get_db)):
    try:
        # print(f"DEBUG: Verifying token with Client ID: {GOOGLE_CLIENT_ID}") 
        # Verify the token
        id_info = id_token.verify_oauth2_token(auth.token, requests.Request(), GOOGLE_CLIENT_ID)

        # ID token is valid. Get the user's Google Account ID from the decoded token.
        google_sub = id_info['sub']
        email = id_info.get('email')
        
        if not email:
             raise HTTPException(status_code=400, detail="Google token does not contain email")

        # Check if user exists by google_sub or email
        user = db.query(models.User).filter(
            (models.User.google_sub == google_sub) | (models.User.email == email)
        ).first()

        if not user:
            # Create new user
            # We need a username. Let's use the email part or generate one.
            # Simple strategy: use email as username if available, else random.
            new_username = email.split('@')[0]
            
            # Ensure username uniqueness
            counter = 1
            base_username = new_username
            while db.query(models.User).filter(models.User.username == new_username).first():
                new_username = f"{base_username}{counter}"
                counter += 1
            
            user = models.User(
                username=new_username,
                email=email,
                full_name=id_info.get('name'), # Extract name from Google token
                google_sub=google_sub,
                hashed_password=None, # No password for Google users
                is_admin=False
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update existing user if missing google_sub
            if not user.google_sub:
                user.google_sub = google_sub
                db.commit()

        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.username}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError as e:
        print(f"Google Auth Value Error: {e}")
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        print(f"Google Auth Unexpected Error: {e}")
        raise HTTPException(status_code=500, detail=f"Google Login Error: {str(e)}")

@app.get("/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/users/validate/{username}")
def validate_username(username: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Check if a username exists in the system"""
    user = db.query(models.User).filter(models.User.username == username).first()
    return {"exists": user is not None, "username": username}

# --- Premium Limits ---
FREE_WORKPLACE_LIMIT = 1
FREE_QUIZ_LIMIT = 1
FREE_QUESTION_LIMIT = 20

@app.post("/users/upgrade")
def upgrade_user(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Simulates upgrading a user to premium for 6 months"""
    current_user.is_premium = True
    current_user.premium_until = datetime.datetime.utcnow() + datetime.timedelta(days=180)
    db.commit()
    db.refresh(current_user)
    return current_user

# --- Workplace Routes ---

@app.post("/workplaces/", response_model=schemas.Workplace)
def create_workplace(workplace: schemas.WorkplaceCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_premium:
        count = db.query(models.Workplace).filter(models.Workplace.user_id == current_user.id).count()
        if count >= FREE_WORKPLACE_LIMIT:
            raise HTTPException(status_code=403, detail=f"Usuários gratuitos podem ter apenas {FREE_WORKPLACE_LIMIT} workplace.")

    db_workplace = models.Workplace(
        name=workplace.name,
        user_id=current_user.id
    )
    db.add(db_workplace)
    db.commit()
    db.refresh(db_workplace)
    return db_workplace

@app.get("/workplaces/", response_model=List[schemas.Workplace])
def list_workplaces(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workplaces = db.query(models.Workplace).filter(models.Workplace.user_id == current_user.id).all()
    return workplaces

@app.delete("/workplaces/{workplace_id}")
def delete_workplace(workplace_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    workplace = db.query(models.Workplace).filter(models.Workplace.id == workplace_id, models.Workplace.user_id == current_user.id).first()
    if not workplace:
        raise HTTPException(status_code=404, detail="Workplace not found")
    
    db.delete(workplace)
    db.commit()
    return {"ok": True}

# --- Study Group Routes ---

@app.post("/study-groups/", response_model=schemas.StudyGroup)
def create_study_group(group: schemas.StudyGroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_premium:
        raise HTTPException(status_code=403, detail="Grupos de Estudo estão disponíveis apenas na versão completa.")
    db_group = models.StudyGroup(
        name=group.name,
        creator_id=current_user.id,
        members=group.members
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    return db_group

@app.get("/study-groups/", response_model=List[schemas.StudyGroup])
def list_study_groups(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_premium:
        return []
    
    # Groups created by user OR where user is a member
    # Note: current implementation of members is JSON list of usernames
    created_groups = db.query(models.StudyGroup).filter(models.StudyGroup.creator_id == current_user.id).all()
    # Simple search for member in JSON (SQLite specific or general)
    # For simplicity, returning created groups and we can filter for membership in python if needed
    return created_groups

@app.get("/study-groups/dashboard")
def get_study_groups_dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_premium:
        return []
    
    """Get study groups created by current user with member progress"""
    # Get official named groups
    named_groups = db.query(models.StudyGroup).filter(models.StudyGroup.creator_id == current_user.id).all()
    
    # Get all notes created by current user with group visibility (to catch ad-hoc groups)
    user_group_notes = db.query(models.CommunityNote).filter(
        models.CommunityNote.user_id == current_user.id,
        models.CommunityNote.visibility == "group"
    ).all()
    
    # Structure for groups (Key = tuple of members)
    groups_data = {}
    
    # Initialize with named groups
    for g in named_groups:
        group_key = tuple(sorted(g.members))
        groups_data[group_key] = {
            "id": g.id,
            "name": g.name,
            "members": g.members,
            "notes_count": 0,
            "questions": set(),
            "is_named": True
        }

    # Add data from notes
    for note in user_group_notes:
        if not note.shared_with:
            continue
            
        group_key = tuple(sorted(note.shared_with))
        
        if group_key not in groups_data:
            groups_data[group_key] = {
                "id": "-".join(note.shared_with),
                "name": "Grupo Ad-hoc",
                "members": list(note.shared_with),
                "notes_count": 0,
                "questions": set(),
                "is_named": False
            }
        
        groups_data[group_key]["notes_count"] += 1
        if note.question_id:
            groups_data[group_key]["questions"].add(note.question_id)
    
    # Get stats for each member in each group
    result = []
    for group_key, group_info in groups_data.items():
        members_stats = []
        for member_username in group_info["members"]:
            member = db.query(models.User).filter(models.User.username == member_username).first()
            if member:
                # Get member's quizzes
                member_quizzes = db.query(models.Quiz).filter(models.Quiz.user_id == member.id).all()
                quizzes_info = []
                for quiz in member_quizzes:
                    total_questions = len(quiz.questions)
                    answered = db.query(models.UserProgress).filter(
                        models.UserProgress.user_id == member.id,
                        models.UserProgress.question_id.in_([q.id for q in quiz.questions])
                    ).count()
                    quizzes_info.append({
                        "title": quiz.title,
                        "provider": quiz.provider,
                        "total_questions": total_questions,
                        "answered_questions": answered,
                        "progress_percent": round((answered / total_questions * 100) if total_questions > 0 else 0, 1)
                    })
                
                members_stats.append({
                    "username": member_username,
                    "exists": True,
                    "quizzes": quizzes_info
                })
            else:
                members_stats.append({
                    "username": member_username,
                    "exists": False,
                    "quizzes": []
                })
        
        result.append({
            "id": group_info["id"],
            "name": group_info["name"],
            "members": group_info["members"],
            "notes_count": group_info["notes_count"],
            "questions_count": len(group_info["questions"]),
            "is_named": group_info["is_named"],
            "members_stats": members_stats
        })
    
    return result

# --- App Routes ---

@app.get("/")
def read_root():
    return {"message": "CISM Backend API is running"}

@app.post("/quizzes/", response_model=schemas.Quiz)
def create_quiz(quiz: schemas.QuizCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_premium:
        count = db.query(models.Quiz).filter(models.Quiz.user_id == current_user.id).count()
        if count >= FREE_QUIZ_LIMIT:
            raise HTTPException(status_code=403, detail=f"Usuários gratuitos podem ter apenas {FREE_QUIZ_LIMIT} bloco de questões.")
        
        if quiz.questions and len(quiz.questions) > FREE_QUESTION_LIMIT:
            raise HTTPException(status_code=403, detail=f"Usuários gratuitos podem importar até {FREE_QUESTION_LIMIT} questões por bloco.")

    db_quiz = models.Quiz(
        title=quiz.title, 
        description=quiz.description,
        provider=quiz.provider, 
        file_name=quiz.file_name, 
        user_id=current_user.id,
        workplace_id=quiz.workplace_id
    )
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)

    if quiz.questions:
        for q in quiz.questions:
            db_question = models.Question(
                id=q.id,
                quiz_id=db_quiz.id,
                text=q.text,
                correct_answer_label=q.correct_answer_label,
                explanation=q.explanation,
                options=[opt.dict() for opt in q.options],
                content_hash=models.create_question_hash(q.text)  # Generate hash for cross-user sharing
            )
            db.add(db_question)
        db.commit()
        db.refresh(db_quiz)
    
    return db_quiz

@app.patch("/quizzes/{quiz_id}/questions", response_model=schemas.Quiz)
def update_quiz_questions(quiz_id: str, update: schemas.QuizUpdateQuestions, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id, models.Quiz.user_id == current_user.id).first()
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    if not current_user.is_premium:
        current_count = db.query(models.Question).filter(models.Question.quiz_id == quiz_id).count()
        if (current_count + len(update.questions)) > FREE_QUESTION_LIMIT:
             raise HTTPException(status_code=403, detail=f"Usuários gratuitos podem ter no máximo {FREE_QUESTION_LIMIT} questões por bloco.")

    for q in update.questions:
        db_question = models.Question(
            id=q.id,
            quiz_id=db_quiz.id,
            text=q.text,
            correct_answer_label=q.correct_answer_label,
            explanation=q.explanation,
            options=[opt.dict() for opt in q.options],
            content_hash=models.create_question_hash(q.text)
        )
        db.add(db_question)
    
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

@app.get("/quizzes/", response_model=List[schemas.Quiz])
def read_quizzes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quizzes = db.query(models.Quiz).filter(models.Quiz.user_id == current_user.id).offset(skip).limit(limit).all()
    return quizzes

@app.delete("/quizzes/{quiz_id}")
def delete_quiz(quiz_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id, models.Quiz.user_id == current_user.id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    # Although cascade is set, explicit deletion helps avoid issues with SQLite foreign keys when not fully synced
    questions = db.query(models.Question).filter(models.Question.quiz_id == quiz_id).all()
    question_ids = [q.id for q in questions]
    
    if question_ids:
        # Delete progress
        db.query(models.UserProgress).filter(models.UserProgress.question_id.in_(question_ids), models.UserProgress.user_id == current_user.id).delete(synchronize_session=False)
        # Delete community notes for THESE specific questions (hashes are different)
        db.query(models.CommunityNote).filter(models.CommunityNote.question_id.in_(question_ids)).delete(synchronize_session=False)
    
    db.delete(quiz)
    db.commit()
    return {"ok": True}

@app.post("/progress/", response_model=schemas.UserProgress)
def update_progress(progress: schemas.UserProgressUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_progress = db.query(models.UserProgress).filter(
        models.UserProgress.question_id == progress.question_id,
        models.UserProgress.user_id == current_user.id
    ).first()
    
    if db_progress:
        # Update existing
        if progress.selected_answer is not None:
             db_progress.selected_answer = progress.selected_answer
        if progress.is_flagged_disagree_key is not None:
             db_progress.is_flagged_disagree_key = progress.is_flagged_disagree_key
        if progress.is_flagged_disagree_ai is not None:
             db_progress.is_flagged_disagree_ai = progress.is_flagged_disagree_ai
        if progress.ai_analysis is not None:
             db_progress.ai_analysis = progress.ai_analysis
    else:
        # Create new
        db_progress = models.UserProgress(
            question_id=progress.question_id,
            user_id=current_user.id,
            selected_answer=progress.selected_answer,
            is_flagged_disagree_key=progress.is_flagged_disagree_key or False,
            is_flagged_disagree_ai=progress.is_flagged_disagree_ai or False,
            ai_analysis=progress.ai_analysis
        )
        db.add(db_progress)

    db.commit()
    db.refresh(db_progress)
    return db_progress

@app.get("/progress/", response_model=List[schemas.UserProgress])
def get_all_progress(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.UserProgress).filter(models.UserProgress.user_id == current_user.id).all()

@app.delete("/progress/reset-block/{quiz_id}")
def reset_block_progress(quiz_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get question IDs for the quiz
    questions = db.query(models.Question).filter(models.Question.quiz_id == quiz_id).all()
    question_ids = [q.id for q in questions]
    
    if not question_ids:
        return {"ok": True}

    db.query(models.UserProgress).filter(
        models.UserProgress.question_id.in_(question_ids),
        models.UserProgress.user_id == current_user.id
    ).delete(synchronize_session=False)
    
    db.commit()
    return {"ok": True}

@app.delete("/progress/reset-all")
def reset_all_progress(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.UserProgress).filter(models.UserProgress.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return {"ok": True}
    
# --- Community Notes Routes ---

@app.get("/community-notes/{question_id}", response_model=List[schemas.CommunityNote])
def get_community_notes(question_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get the question to find its hash
    question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not question:
        return []
    
    # If question has a hash, get all notes with that hash (cross-user sharing)
    if question.content_hash:
        all_notes = db.query(models.CommunityNote).filter(
            models.CommunityNote.question_hash == question.content_hash
        ).order_by(models.CommunityNote.created_at.desc()).all()
    else:
        # Fallback to old behavior for questions without hash
        all_notes = db.query(models.CommunityNote).filter(
            models.CommunityNote.question_id == question_id
        ).order_by(models.CommunityNote.created_at.desc()).all()
    
    # Filter based on visibility and study group permissions
    visible_notes = []
    for note in all_notes:
        # Public notes are visible to everyone
        if note.visibility == "public":
            visible_notes.append(note)
        # Group notes are visible only to author and shared users
        elif note.visibility == "group":
            # Author can always see their own note
            if note.user_id == current_user.id:
                visible_notes.append(note)
            # Check if current user is in shared_with list
            elif note.shared_with and current_user.username in note.shared_with:
                visible_notes.append(note)
    
    return visible_notes

@app.post("/community-notes/", response_model=schemas.CommunityNote)
def create_community_note(note: schemas.CommunityNoteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Get the question to find its hash
    question = db.query(models.Question).filter(models.Question.id == note.question_id).first()
    
    # Validate shared_with usernames if visibility is "group"
    if note.visibility == "group":
        if not current_user.is_premium:
            raise HTTPException(status_code=403, detail="Compartilhamento com grupos está disponível apenas na versão completa.")
        
        if note.shared_with:
            # Ensure all usernames exist
            existing_users = db.query(models.User.username).filter(
                models.User.username.in_(note.shared_with)
            ).all()
            existing_usernames = [u[0] for u in existing_users]
            
            # Filter out invalid usernames
            valid_shared_with = [u for u in note.shared_with if u in existing_usernames]
        else:
            valid_shared_with = None
    else:
        valid_shared_with = None
    
    db_note = models.CommunityNote(
        question_id=note.question_id,
        question_hash=question.content_hash if question else None,  # Store hash for cross-user sharing
        user_id=current_user.id,
        user_name=note.user_name,
        content=note.content,
        visibility=note.visibility or "public",
        shared_with=valid_shared_with
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

from . import gemini_service

# --- AI Debug Endpoint (public, for diagnostics) ---
@app.get("/ai/debug")
def ai_debug():
    """Public diagnostic endpoint to test OpenRouter API connectivity."""
    import requests as req
    
    results = {
        "step_1_env_var": None,
        "step_2_key_format": None,
        "step_3_api_test": None,
        "step_4_response": None,
        "all_env_vars": {},
        "conclusion": ""
    }
    
    # Step 1: Check if env var exists
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        results["step_1_env_var"] = "FAIL - OPENROUTER_API_KEY not found in environment"
        # Check if it might be under a different name
        for key in os.environ:
            if "OPENROUTER" in key.upper() or "API" in key.upper() or "KEY" in key.upper():
                results["all_env_vars"][key] = f"{os.environ[key][:8]}..." if len(os.environ[key]) > 8 else "***"
        results["conclusion"] = "API key not configured. Check Railway variable name."
        return results
    
    results["step_1_env_var"] = f"OK - Key found, length={len(api_key)}, starts with: {api_key[:12]}..."
    
    # Step 2: Check key format
    if api_key.startswith("sk-or-"):
        results["step_2_key_format"] = "OK - Starts with sk-or- (valid OpenRouter format)"
    elif api_key.startswith("sk-"):
        results["step_2_key_format"] = "WARNING - Starts with sk- (might be OpenAI, not OpenRouter)"
    elif api_key.startswith("AIza"):
        results["step_2_key_format"] = "FAIL - This is a Google/Gemini key, not OpenRouter!"
        results["conclusion"] = "Wrong API key! You need an OpenRouter key (starts with sk-or-), not a Gemini key."
        return results
    else:
        results["step_2_key_format"] = f"UNKNOWN - Starts with: {api_key[:6]}..."
    
    # Step 3: Make test request
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("FRONTEND_URL", "https://prepwise.vercel.app"),
        "X-Title": "PrepWise CISM Debug"
    }
    
    payload = {
        "model": "google/gemma-3-27b-it:free",
        "messages": [
            {"role": "user", "content": "Say hello in one word."}
        ],
        "max_tokens": 10,
        "temperature": 0
    }
    
    try:
        resp = req.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=30
        )
        
        results["step_3_api_test"] = {
            "status_code": resp.status_code,
            "headers": dict(resp.headers),
        }
        
        try:
            body = resp.json()
            results["step_4_response"] = body
        except:
            results["step_4_response"] = resp.text[:1000]
        
        if resp.status_code == 200:
            results["conclusion"] = "SUCCESS! OpenRouter API is working correctly."
        elif resp.status_code == 401:
            results["conclusion"] = "FAIL - API key is invalid or expired. Generate a new key at openrouter.ai"
        elif resp.status_code == 429:
            results["conclusion"] = "RATE LIMITED - Too many requests. Wait a few minutes and try again."
        elif resp.status_code == 404:
            results["conclusion"] = "NOT FOUND - The model or endpoint may not exist. Check the response body for details."
        else:
            results["conclusion"] = f"UNEXPECTED STATUS {resp.status_code}. Check step_4_response for details."
            
    except req.exceptions.Timeout:
        results["step_3_api_test"] = "TIMEOUT - Request took too long"
        results["conclusion"] = "TIMEOUT - OpenRouter did not respond in 30 seconds."
    except req.exceptions.ConnectionError as e:
        results["step_3_api_test"] = f"CONNECTION ERROR - {str(e)}"
        results["conclusion"] = "Cannot connect to OpenRouter. Possible network/firewall issue on Railway."
    except Exception as e:
        results["step_3_api_test"] = f"ERROR - {str(e)}"
        results["conclusion"] = f"Unexpected error: {str(e)}"
    
    return results

@app.get("/ai/debug-full")
def ai_debug_full():
    """Test with a realistic CISM question prompt - reproduces the 400 error."""
    import requests as req
    
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return {"error": "No API key"}
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("FRONTEND_URL", "https://prepwise.vercel.app"),
        "X-Title": "PrepWise CISM"
    }
    
    # Simulate a real CISM question analysis prompt
    prompt = """Analyze this CISM exam question. Explain the correct answer and why other options are incorrect.

Question: Which of the following is the MOST important reason for conducting a risk assessment?

Options:
A) To identify vulnerabilities in systems
B) To comply with regulatory requirements
C) To support risk-based decisions on security investments
D) To document threats to the organization

Correct Answer: C

Existing Explanation: None provided

Provide a concise analysis focusing on the ISACA mindset."""

    payload = {
        "model": "google/gemma-3-27b-it:free",
        "messages": [
            {"role": "system", "content": "You are an expert CISM exam tutor. Provide concise, clear analysis in Portuguese (Brazil)."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 2048,
        "temperature": 0.7
    }
    
    try:
        resp = req.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=90
        )
        
        result = {
            "status_code": resp.status_code,
            "response_body": None,
            "payload_sent": {
                "model": payload["model"],
                "messages_count": len(payload["messages"]),
                "system_msg_length": len(payload["messages"][0]["content"]),
                "user_msg_length": len(payload["messages"][1]["content"]),
                "max_tokens": payload["max_tokens"],
            }
        }
        
        try:
            result["response_body"] = resp.json()
        except:
            result["response_body"] = resp.text[:2000]
        
        return result
    except Exception as e:
        return {"error": str(e)}

@app.post("/ai/analyze", response_model=str)
def ai_analyze_question(question: schemas.Question, current_user: models.User = Depends(get_current_user)):
    if not current_user.is_premium:
        raise HTTPException(status_code=403, detail="Análise por IA está disponível apenas na versão completa.")
    # In a real app, you might want to rate limit this or check user quotas
    return gemini_service.analyze_question(question)

@app.post("/ai/generate", response_model=List[schemas.QuestionCreate])
def ai_generate_quiz(difficulty: str = "Médio", count: int = 5, current_user: models.User = Depends(get_current_user)):
    if not current_user.is_premium:
        raise HTTPException(status_code=403, detail="Geração por IA está disponível apenas na versão completa.")
    
    quiz_json = gemini_service.generate_quiz(difficulty, count)
    try:
        questions = json.loads(quiz_json)
        # Ensure questions match QuestionCreate schema
        # We need to map labels and texts correctly
        return questions
    except Exception as e:
        print(f"Error parsing AI quiz JSON: {e}")
        raise HTTPException(status_code=500, detail="Erro ao processar o quiz gerado pela IA. Tente novamente.")


# --- Mercado Pago Routes ---

@app.post("/payments/create-preference")
def create_payment_preference(current_user: models.User = Depends(get_current_user)):
    if not sdk:
        raise HTTPException(status_code=500, detail="Mercado Pago não configurado (Falta MP_ACCESS_TOKEN)")

    preference_data = {
        "items": [
            {
                "title": "PrepWise 2.0 - Plano 6 Meses",
                "quantity": 1,
                "unit_price": 50.00,
                "currency_id": "BRL"
            }
        ],
        "payer": {
            "email": current_user.email or "test_user@example.com",
            "name": current_user.full_name or current_user.username
        },
        "back_urls": {
            "success": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')}/?payment=success",
            "failure": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')}/?payment=failure",
            "pending": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000').rstrip('/')}/?payment=pending"
        },
        "auto_return": "approved",
        "external_reference": str(current_user.id),
        "notification_url": f"{os.getenv('WEBHOOK_BASE_URL', 'https://your-domain.com')}/payments/webhook"
    }

    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]
    
    return {
        "preference_id": preference["id"],
        "init_point": preference["init_point"] # sandbox_init_point if in sandbox
    }

@app.post("/payments/webhook")
async def mercadopago_webhook(request: Request, db: Session = Depends(get_db)):
    # This endpoint receives notifications from Mercado Pago
    # For a real implementation, you should verify the notification
    # https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/notifications/webhooks
    
    data = await request.json()
    print(f"DEBUG: Mercado Pago Webhook received: {data}")
    
    if data.get("type") == "payment":
        payment_id = data.get("data", {}).get("id")
        if payment_id and sdk:
            # Query the payment details
            payment_info = sdk.payment().get(payment_id)
            if payment_info["status"] == 200:
                payment_data = payment_info["response"]
                if payment_data["status"] == "approved":
                    user_id = payment_data.get("external_reference")
                    if user_id:
                        user = db.query(models.User).filter(models.User.id == user_id).first()
                        if user:
                            print(f"✅ Payment approved for user: {user.username}")
                            user.is_premium = True
                            user.premium_until = datetime.utcnow() + timedelta(days=180)
                            db.commit()
                            return {"status": "success"}
        elif payment_id and not sdk:
            # Fallback for manual testing/simulation
            print(f"DEBUG: SDK not configured, bypass check for payment_id: {payment_id}")
            # In simulation, we need the user_id somehow. 
            # Let's use the external_reference from the data if provided for test purposes
            user_id = data.get("external_reference")
            if user_id:
                user = db.query(models.User).filter(models.User.id == user_id).first()
                if user:
                    print(f"✅ [SIMULATION] Payment approved for user: {user.username}")
                    user.is_premium = True
                    user.premium_until = datetime.utcnow() + timedelta(days=180)
                    db.commit()
                    return {"status": "success", "simulated": True}

    return {"status": "received"}


@app.get("/exams/available")
def list_available_exams():
    """List exams available in the filesystem structure Resilience"""
    base_path = os.getenv("EXAMS_BASE_PATH", "./data/Testescript")
    structure = {}
    
    if os.path.exists(base_path):
        for provider in os.listdir(base_path):
            provider_path = os.path.join(base_path, provider)
            if os.path.isdir(provider_path):
                exams = []
                for exam in os.listdir(provider_path):
                    if os.path.isdir(os.path.join(provider_path, exam)):
                        exams.append(exam)
                if exams:
                    structure[provider] = sorted(exams)
    
    return structure

@app.get("/exams/autoload/{exam_name}")
def autoload_exam(exam_name: str, current_user: models.User = Depends(get_current_user)):
    print(f"DEBUG: autoload_exam called with exam_name='{exam_name}'")
    
    base_path = os.getenv("EXAMS_BASE_PATH", "./data/Testescript")
    file_path = None
    filename = None
    
    # Normalize exam_name for folder search
    search_name = exam_name.split('(')[0].strip().upper()
    
    if os.path.exists(base_path):
        for provider in os.listdir(base_path):
            provider_path = os.path.join(base_path, provider)
            if not os.path.isdir(provider_path):
                continue
                
            for exam_dir in os.listdir(provider_path):
                # Check both exact and normalized
                if exam_dir.upper() == exam_name.upper() or exam_dir.upper() == search_name:
                    exam_path = os.path.join(provider_path, exam_dir)
                    # Look for the first .txt file
                    for f in os.listdir(exam_path):
                        if f.endswith('.txt'):
                            file_path = os.path.join(exam_path, f)
                            filename = f
                            break
                if file_path: break
            if file_path: break

    if file_path:
        print(f"DEBUG: Looking for file at {file_path}")
        if os.path.exists(file_path):
            print(f"DEBUG: File found, reading...")
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except UnicodeDecodeError:
                print(f"DEBUG: UTF-8 decode failed, trying latin-1")
                with open(file_path, "r", encoding="latin-1") as f:
                    content = f.read()
            print(f"DEBUG: Read {len(content)} characters")
            return {"content": content, "filename": filename}
    
    raise HTTPException(status_code=404, detail=f"Exame '{exam_name}' não encontrado no servidor em {base_path}")
