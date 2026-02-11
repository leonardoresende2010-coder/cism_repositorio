import os
import requests
from .schemas import Question

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
# Free model from OpenRouter - high quality and free
FREE_MODEL = "deepseek/deepseek-chat-v3-0324:free"

def get_api_key():
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        return None
    return api_key

def call_openrouter(messages: list, max_tokens: int = 2048) -> str:
    """Makes a request to the OpenRouter API using a free model."""
    api_key = get_api_key()
    if not api_key:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.getenv("FRONTEND_URL", "https://prepwise.vercel.app"),
        "X-Title": "PrepWise CISM"
    }

    payload = {
        "model": FREE_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7
    }

    response = requests.post(OPENROUTER_API_URL, headers=headers, json=payload, timeout=60)
    response.raise_for_status()

    data = response.json()
    return data["choices"][0]["message"]["content"]

def analyze_question(question: Question) -> str:
    if not get_api_key():
        return "Erro: OPENROUTER_API_KEY não configurada no servidor. Por favor, adicione a chave às variáveis de ambiente."

    prompt = f"""Analyze this CISM exam question. Explain the correct answer and why other options are incorrect.

Question: {question.text}

Options:
{chr(10).join([f"{opt.label}) {opt.text}" for opt in question.options])}

Correct Answer: {question.correct_answer_label}

Existing Explanation: {question.explanation or "None provided"}

Provide a concise analysis focusing on the ISACA mindset."""

    try:
        messages = [
            {"role": "system", "content": "You are an expert CISM exam tutor. Provide concise, clear analysis in Portuguese (Brazil)."},
            {"role": "user", "content": prompt}
        ]
        result = call_openrouter(messages)
        if result is None:
            return "Erro: OPENROUTER_API_KEY não configurada."
        return result
    except requests.exceptions.HTTPError as e:
        error_msg = str(e)
        status_code = e.response.status_code if e.response else 0
        print(f"OpenRouter API Error ({status_code}): {error_msg}")
        if status_code == 401:
            return "Erro: A chave API configurada é inválida."
        if status_code == 429:
            return "Erro: Limite de requisições excedido. Tente novamente em alguns segundos."
        if status_code == 402:
            return "Erro: Créditos insuficientes na API."
        return f"IA Temporariamente indisponível: {status_code} {error_msg}"
    except requests.exceptions.Timeout:
        return "Erro: A requisição para a IA expirou. Tente novamente."
    except Exception as e:
        error_msg = str(e)
        print(f"OpenRouter API Error: {error_msg}")
        return f"IA Temporariamente indisponível: {error_msg}"

def generate_quiz(difficulty: str = "Médio", count: int = 5) -> str:
    if not get_api_key():
        return "Erro: OPENROUTER_API_KEY não configurada."

    prompt = f"""Gerar {count} questões de simulação para o exame ISACA CISM em nível de dificuldade "{difficulty}".

Regras:
1. Focar especificamente no mindset da ISACA.
2. Cada questão deve ter 4 opções (A, B, C, D).
3. Retornar APENAS um array JSON válido, sem markdown, sem explicação adicional.

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
]"""

    try:
        messages = [
            {"role": "system", "content": "You are a CISM exam question generator. Return ONLY valid JSON arrays, no markdown formatting."},
            {"role": "user", "content": prompt}
        ]
        text = call_openrouter(messages, max_tokens=4096)
        if text is None:
            return "[]"
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return text
    except Exception as e:
        print(f"OpenRouter Generation Error: {e}")
        return "[]"
