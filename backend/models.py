from sqlalchemy import Column, String, Integer
import uuid

from database import Base


class User(Base):
    __tablename__ = "users"

    # id automatically generated for each user as a primary key
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))

    username = Column(String, nullable=False, unique=True)

    pin = Column(Integer, nullable=True)
