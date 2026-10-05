import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Baza Bible AI Backend", version="1.0.0")

# Enable CORS for your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenRouter using OpenAI's Python client
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# OpenRouter uses the OpenAI client pointing to a custom base URL
client = openai.OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)

class ChatRequest(BaseModel):
    prompt: str

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Baza Bible AI API is running successfully!"
    }

@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    if not OPENROUTER_API_KEY:
        raise HTTPException(status_code=500, detail="OpenRouter API Key is not configured on the server.")
    
    try:
        # You can use any free or open-source model available on OpenRouter, e.g., "meta-llama/llama-3-8b-instruct:free"
        completion = client.chat.completions.create(
            model="meta-llama/llama-3-8b-instruct:free",
            messages=[
                {
                    "role": "system",
                    "content": "You are Baza Bible AI, a knowledgeable, respectful, and helpful assistant specialized in answering questions about the Bible, scripture, and theology."
                },
                {
                    "role": "user", 
                    "content": request.prompt
                }
            ]
        )
        
        return {
            "status": "success",
            "response": completion.choices[0].message.content
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))