from pydantic import BaseModel

# API accepts username 
class UserCreate(BaseModel):
    username: str
class UserResponse(BaseModel):
    id: str
    username: str
    class Config:
        from_attributes = True
