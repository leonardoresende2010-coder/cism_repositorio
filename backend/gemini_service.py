import google.generativeai as genai
import os
from .schemas import Question

def configure_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return False
    genai.configure(api_key=api_key)
    return True

def analyze_question(question: Question) -> str:
    if not configure_gemini():
        return "Erro: GEMINI_API_KEY não configurada no servidor. Por favor, adicione a chave ao arquivo .env."
    
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    Analyze this CISM exam question. Explain the correct answer and why other options are incorrect.
    
    Question: {question.text}
    
    Options:
    {chr(10).join([f"{opt.label}) {opt.text}" for opt in question.options])}
    
    Correct Answer: {question.correct_answer_label}
    
    Existing Explanation: {question.explanation or "None provided"}
    
    Provide a concise analysis focusing on the ISACA mindset.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        error_msg = str(e)
        print(f"Gemini API Error: {error_msg}")
        if "API_KEY_INVALID" in error_msg:
            return "Erro: A chave API configurada é inválida."
        if "quota" in error_msg.lower():
            return "Erro: Cota da API Gemini excedida."
        return f"IA Temporariamente indisponível: {error_msg}"

def generate_quiz(difficulty: str = "Médio", count: int = 5) -> str:
    if not configure_gemini():
        return "Erro: GEMINI_API_KEY não configurada."
    
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"""
    Gerar {count} questões de simulação para o exame ISACA CISM em nível de dificuldade "{difficulty}".
    
    Regras:
    1. Focar especificamente no mindset da ISACA.
    2. Cada questão deve ter 4 opções (A, B, C, D).
    3. Retornar APENAS um array JSON válido.
    
    Estrutura do JSON:
    [
      {{
        "text": "Texto da pergunta",
        "options": [
          {{"label": "A", "text": "Opção 1"}},
          {{"label": "B", "text": "Opção 2"}},
          {{"label": "C", "text": "Opção 3"}},
          {{"label": "D", "text": "Opção 4"}}
        ],
        "correct_answer_label": "A",
        "explanation": "Explicação detalhada baseada no CISM"
      }}
    ]
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return text
    except Exception as e:
        print(f"Gemini Generation Error: {e}")
        return "[]"
