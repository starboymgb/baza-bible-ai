import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables if a .env file is present locally
load_dotenv()

app = FastAPI(title="Baza Bible AI Backend", version="1.0.0")

# Configure CORS so your frontend can communicate safely with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust to your frontend domain in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize API Keys from Environment Variables
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)

# Request body validation schema using Pydantic
class ChatRequest(BaseModel):
    prompt: str
    model: str = "gemini"  # Default model selector ("gemini" or "openai")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Baza Bible AI API is running successfully!"
    }

@app.post("/api/chat")
def chat_endpoint(request: ChatRequest):
    try:
        # Example logic route for your AI interactions
        if not request.prompt:
            raise HTTPException(status_code=400, detail="Prompt cannot be empty.")
            
        # You can expand this to call Google GenAI or OpenRouter/OpenAI based on the request
        return {
            "status": "success",
            "model_used": request.model,
            "response": f"Baza Bible AI processed your prompt: '{request.prompt}'"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))