from sqlalchemy import create_engine, inspect
import os

db_path = "./cism_prepwise.db"
if os.path.exists(db_path):
    engine = create_engine(f"sqlite:///{db_path}")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print(f"Tables found: {tables}")
else:
    print(f"Database file {db_path} not found.")
