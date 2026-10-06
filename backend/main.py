import os
import json
import re
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
    if language == "Kinyarwanda":
        return {
            "verse_reference": "Yohana 3:16",
            "verse_text": "Kuko Imana yakunze isi cyane, ku buryo yatanze Umwana wayo w'ikinege...",
            "devotional": "Urukundo rwayo rutagereranywa ruduha ubuzima bw'iteka n'amahirwe mashya buri munsi.",
            "language": language
        }
    elif language == "Français":
        return {
            "verse_reference": "Jean 3:16",
            "verse_text": "Car Dieu a tant aimé le monde qu'il a donné son Fils unique...",
            "devotional": "Son amour infini nous offre la vie éternelle et un nouveau départ chaque jour.",
            "language": language
        }
    else:
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
            f"Answer the user's question with a relevant Bible verse using the {request.translation} translation. "
            f"Provide the pastoral explanation entirely in {request.language}. "
            f"CRITICAL: Return ONLY a valid JSON object, with no extra text or markdown formatting before or after. "
            f"Use these exact keys: \"verse_reference\", \"verse_text\", and \"pastoral_explanation\"."
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
        
        # Clean up code blocks if present
        cleaned_answer = raw_answer.strip()
        if cleaned_answer.startswith("```json"):
            cleaned_answer = cleaned_answer[7:]
        if cleaned_answer.startswith("```"):
            cleaned_answer = cleaned_answer[3:]
        if cleaned_answer.endswith("```"):
            cleaned_answer = cleaned_answer[:-3]
        cleaned_answer = cleaned_answer.strip()
            
        try:
            parsed_answer = json.loads(cleaned_answer)
        except json.JSONDecodeError:
            # Fallback regex extraction if model included extra chatter
            match = re.search(r'\{.*\}', cleaned_answer, re.DOTALL)
            if match:
                parsed_answer = json.loads(match.group(0))
            else:
                # Ultimate fallback if everything fails
                parsed_answer = {
                    "verse_reference": "Romans 8:28",
                    "verse_text": "And we know that for those who love God all things work together for good...",
                    "pastoral_explanation": raw_answer
                }
        
        return {
            "verse_reference": parsed_answer.get("verse_reference", "Romans 8:28"),
            "verse_text": parsed_answer.get("verse_text", "And we know that for those who love God..."),
            "pastoral_explanation": parsed_answer.get("pastoral_explanation", raw_answer),
            "translation": request.translation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))