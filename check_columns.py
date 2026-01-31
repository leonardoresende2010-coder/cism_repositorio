from sqlalchemy import create_engine, inspect
import os

db_path = "./cism_prepwise.db"
if os.path.exists(db_path):
    engine = create_engine(f"sqlite:///{db_path}")
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('quizzes')]
    print(f"Columns in 'quizzes': {columns}")
    
    columns_wp = [c['name'] for c in inspector.get_columns('workplaces')]
    print(f"Columns in 'workplaces': {columns_wp}")
else:
    print(f"Database file {db_path} not found.")
