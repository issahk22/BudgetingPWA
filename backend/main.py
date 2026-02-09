from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import User
from schemas import UserCreate, UserResponse

# creates tables in db if they don't exist already
Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.post("/users", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):


    # check if user already exists 
    existing = db.query(User).filter(User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    # create new user and pushes to db 
    new_user = User(username=user.username)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)  # refreshes so that the id is populated instead of keeping it none. 

    return new_user
