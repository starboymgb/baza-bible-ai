import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend connection

# Initialize OpenAI client configured for OpenRouter
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

@app.route("/", methods=["GET"])
def read_root():
    return jsonify({"message": "Welcome to Baza Bible AI API (Flask Edition)."}), 200

@app.route("/api/ask", methods=["POST"])
def ask_bible_ai():
    data = request.get_json()
    if not data or not data.get("question", "").strip():
        return jsonify({"error": "Question cannot be empty."}), 400

    question = data.get("question")
    translation = data.get("translation", "ESV")
    language = data.get("language", "English")

    lang_instructions = {
        "English": "Write the verse_text, pastoral explanation, and verse_reference in English.",
        "Kinyarwanda": "Andika inyandiko y'umurongo wa Bibiliya (verse_text), ibisobanuro by'ubusasereri (pastoral explanation), ndetse n'aho umurongo uherereye (verse_reference) mu Gikinyarwanda cyiza kandi cyumvikana neza.",
        "Français": "Rédigez le texte du verset (verse_text), l'explication pastorale et la référence en Français."
    }

    selected_lang_instruction = lang_instructions.get(language, lang_instructions["English"])

    system_prompt = f"""
    You are Baza Bible AI, a compassionate, wise, and scripturally faithful pastoral assistant. 
    A user is asking a life question. Your job is to:
    1. Identify the most relevant Bible verse or passage.
    2. Provide the exact Verse Reference (Book Chapter:Verse) using the appropriate naming conventions for the requested language (e.g., Zaburi for Kinyarwanda, Psaume for French, Psalm for English).
    3. Provide the exact text of the verse translated into the requested language ({language}).
    4. {selected_lang_instruction} Write a warm, encouraging, and deeply practical explanation of "The Bible Way".
    
    Format your response strictly as valid JSON with these exact keys: 
    "verse_reference", "verse_text", and "pastoral_explanation". Do not include markdown code block ticks around the JSON, just raw JSON.
    """

    try:
        response = client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            max_tokens=1000
        )
        
        content = response.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        parsed_response = json.loads(content)
        return jsonify(parsed_response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/daily", methods=["GET"])
def get_daily_devotional():
    language = request.args.get("language", "English")
    
    lang_prompts = {
        "English": "Generate an inspiring Daily Verse and Devotional in English. Include verse_reference, verse_text, and devotional.",
        "Kinyarwanda": "Tegura umurongo wa Bibiliya w'umunsi n'inyigisho ngufi yo guhumuriza mu Gikinyarwanda. Ongeramo verse_reference, verse_text, na devotional zose ziri mu Gikinyarwanda.",
        "Français": "Générez un verset du jour et une méditation inspirante en Français. Incluez verse_reference, verse_text et devotional en Français."
    }
    
    prompt_text = lang_prompts.get(language, lang_prompts["English"])

    system_prompt = f"""
    You are Baza Bible AI. {prompt_text}
    Format your response strictly as valid JSON with these exact keys: 
    "verse_reference", "verse_text", and "devotional". Do not include markdown code block ticks around the JSON, just raw JSON.
    """

    try:
        response = client.chat.completions.create(
            model="google/gemini-2.5-flash",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "Give me today's daily devotional."}
            ],
            max_tokens=600
        )
        
        content = response.choices[0].message.content
        content = content.replace("```json", "").replace("```", "").strip()
        parsed_response = json.loads(content)
        return jsonify(parsed_response), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)