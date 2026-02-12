import os
import json
import time
import requests
from .schemas import Question

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

def get_api_key():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    return api_key

def call_groq(messages: list, max_tokens: int = 2048) -> str:
    """Makes a request to the Groq API."""
    api_key = get_api_key()
    if not api_key:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": GROQ_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7
    }

    print(f"[Groq] Using model: {GROQ_MODEL}")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(GROQ_API_URL, headers=headers, json=payload, timeout=90)
            print(f"[Groq] Attempt {attempt+1} - Status: {response.status_code}")

            if response.status_code == 429:
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 5
                    print(f"[Groq] Rate limited, waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    return None

            if response.status_code != 200:
                print(f"[Groq] Error: {response.text[:500]}")
                response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            print(f"[Groq] Success! {len(content)} chars")
            return content

        except requests.exceptions.HTTPError:
            raise
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                continue
            raise

    return None


def analyze_question(question: Question) -> str:
    if not get_api_key():
        return "Erro: GROQ_API_KEY não configurada no servidor."

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
        result = call_groq(messages)
        if result is None:
            return "Erro: Limite de requisições excedido. Aguarde e tente novamente."
        return result
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 0
        print(f"Groq API Error ({status_code}): {e}")
        if status_code == 401:
            return "Erro: A chave API do Groq é inválida."
        if status_code == 429:
            return "Erro: Limite de requisições excedido. Aguarde e tente novamente."
        return f"IA Temporariamente indisponível: {e}"
    except requests.exceptions.Timeout:
        return "Erro: A requisição expirou. Tente novamente."
    except Exception as e:
        print(f"Groq API Error: {e}")
        return f"IA Temporariamente indisponível: {e}"

def generate_quiz(difficulty: str = "Médio", count: int = 5) -> str:
    if not get_api_key():
        return "Erro: GROQ_API_KEY não configurada."

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
        text = call_groq(messages, max_tokens=4096)
        if text is None:
            return "[]"
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return text
    except Exception as e:
        print(f"Groq Generation Error: {e}")
        return "[]"
