from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services.ai_generator import generate_bible_answer

router = APIRouter()

class QuestionRequest(BaseModel):
    question: str
    translation: str = "ESV"

@router.post("/ask")
def ask_bible_ai(request: QuestionRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    try:
        response_data = generate_bible_answer(request.question, request.translation)
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))