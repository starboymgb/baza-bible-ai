import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Baza Bible AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

class ChatRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {"status": "online", "message": "Baza Bible AI API is running successfully!"}

@app.get("/api/daily")
def get_daily_verse(language: str = "English"):
    return {
        "verse": "John 3:16",
        "text": "For God so loved the world, that he gave his only begotten Son...",
        "language": language
    }

@app.post("/api/ask")
def ask_endpoint(request: ChatRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API Key is not configured on the server.")
    
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://baza-bible-ai.com",
            "X-Title": "Baza Bible AI"
        }
        payload = {
            "model": "openrouter/free",
            "messages": [
                {"role": "system", "content": "You are Baza Bible AI, a knowledgeable, respectful assistant specialized in the Bible."},
                {"role": "user", "content": request.prompt}
            ]
        }
        
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"OpenRouter Error: {response.text}")
            
        data = response.json()
        answer = data["choices"][0]["message"]["content"]
        
        return {
            "status": "success",
            "response": answer
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))