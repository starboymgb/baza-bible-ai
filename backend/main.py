import os
import json
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
    translation: str = "ESV"
    language: str = "English"

@app.get("/")
def read_root():
    return {"status": "online", "message": "Baza Bible AI API is running successfully!"}

@app.get("/api/daily")
def get_daily_verse(language: str = "English"):
    return {
        "verse_reference": "John 3:16",
        "verse_text": "For God so loved the world, that he gave his only begotten Son...",
        "devotional": "His boundless love offers us eternal life and a fresh start every single day.",
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
        
        system_prompt = (
            f"You are Baza Bible AI, a knowledgeable and respectful assistant specialized in the Bible. "
            f"Answer the user's question with a relevant Bible verse using the {request.translation} translation, "
            f"and provide a pastoral explanation in {request.language}. "
            f"You MUST return a valid JSON object with EXACTLY these keys: "
            f"\"verse_reference\", \"verse_text\", and \"pastoral_explanation\"."
        )
        
        payload = {
            "model": "openrouter/free",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.prompt}
            ]
        }
        
        response = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"OpenRouter Error: {response.text}")
            
        data = response.json()
        raw_answer = data["choices"][0]["message"]["content"]
        
        # Clean up code blocks if the model outputs them
        cleaned_answer = raw_answer.strip()
        if cleaned_answer.startswith("```json"):
            cleaned_answer = cleaned_answer[7:]
        if cleaned_answer.startswith("```"):
            cleaned_answer = cleaned_answer[3:]
        if cleaned_answer.endswith("```"):
            cleaned_answer = cleaned_answer[:-3]
            
        parsed_answer = json.loads(cleaned_answer.strip())
        
        return {
            "verse_reference": parsed_answer.get("verse_reference", "John 3:16"),
            "verse_text": parsed_answer.get("verse_text", "For God so loved the world..."),
            "pastoral_explanation": parsed_answer.get("pastoral_explanation", raw_answer),
            "translation": request.translation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))