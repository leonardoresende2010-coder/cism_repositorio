from sqlalchemy import create_engine, inspect
import os

db_path = "./cism_prepwise.db"
if os.path.exists(db_path):
    engine = create_engine(f"sqlite:///{db_path}")
    inspector = inspect(engine)
    columns = [c['name'] for c in inspector.get_columns('study_groups')]
    print(f"Columns in 'study_groups': {columns}")
else:
    print(f"Database file {db_path} not found.")
