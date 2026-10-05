import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# Initialize OpenAI client configured for OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

def generate_bible_answer(question: str, translation: str):
    system_prompt = f"""
    You are Baza Bible AI, a compassionate, wise, and scripturally faithful pastoral assistant. 
    A user is asking a life question. Your job is to:
    1. Identify the most relevant Bible verse or passage using the {translation} translation.
    2. Provide the exact Verse Reference (Book Chapter:Verse).
    3. Write a warm, encouraging, and deeply practical explanation of "The Bible Way"—explaining how the scripture speaks directly to their situation without twisting its meaning.
    
    Format your response strictly as valid JSON with these exact keys: 
    "verse_reference", "verse_text", and "pastoral_explanation". Do not include markdown code block ticks around the JSON if possible, just raw JSON.
    """

    response = client.chat.completions.create(
        model="google/gemini-2.5-flash", # You can change this to any model on OpenRouter
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": question}
        ]
    )
    
    import json
    content = response.choices[0].message.content
    # Clean up markdown code blocks if the model accidentally includes them
    content = content.replace("```json", "").replace("```", "").strip()
    return json.loads(content)