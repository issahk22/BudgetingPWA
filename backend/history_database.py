from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

HISTORY_DATABASE_URL = "sqlite:///./history.db"

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
