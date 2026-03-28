import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
HISTORY_DB_PATH = os.path.join(_BACKEND_DIR, "history.db")
HISTORY_DATABASE_URL = f"sqlite:///{HISTORY_DB_PATH}"

engine = create_engine(HISTORY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)



class Base(DeclarativeBase):
    pass



def get_history_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
