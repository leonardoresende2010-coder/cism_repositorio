import os
import json
import time
import requests
from .schemas import Question

DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"
DEEPSEEK_MODEL = "deepseek-chat"

def get_api_key():
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        return None
    return api_key

def call_deepseek(messages: list, max_tokens: int = 2048) -> str:
    """Makes a request to the DeepSeek API."""
    api_key = get_api_key()
    if not api_key:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": DEEPSEEK_MODEL,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.7
    }

    print(f"[DeepSeek] Using model: {DEEPSEEK_MODEL}")
    print(f"[DeepSeek] API Key starts with: {api_key[:10]}...")

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = requests.post(DEEPSEEK_API_URL, headers=headers, json=payload, timeout=90)

            print(f"[DeepSeek] Attempt {attempt+1} - Status: {response.status_code}")

            if response.status_code == 429:
                if attempt < max_retries - 1:
                    wait_time = (attempt + 1) * 5
                    print(f"[DeepSeek] Rate limited (429), waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"[DeepSeek] Rate limited after {max_retries} attempts")
                    return None

            if response.status_code != 200:
                print(f"[DeepSeek] Error response: {response.text[:500]}")
                response.raise_for_status()

            data = response.json()
            content = data["choices"][0]["message"]["content"]
            print(f"[DeepSeek] Success! Response length: {len(content)} chars")
            return content

        except requests.exceptions.HTTPError:
            raise
        except requests.exceptions.Timeout:
            if attempt < max_retries - 1:
                print(f"[DeepSeek] Timeout on attempt {attempt+1}, retrying...")
                continue
            raise

    return None


def analyze_question(question: Question) -> str:
    if not get_api_key():
        return "Erro: DEEPSEEK_API_KEY não configurada no servidor."

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
        result = call_deepseek(messages)
        if result is None:
            return "Erro: Limite de requisições excedido. Aguarde e tente novamente."
        return result
    except requests.exceptions.HTTPError as e:
        status_code = e.response.status_code if e.response is not None else 0
        error_msg = str(e)
        print(f"DeepSeek API Error ({status_code}): {error_msg}")
        if status_code == 401:
            return "Erro: A chave API do DeepSeek é inválida."
        if status_code == 429:
            return "Erro: Limite de requisições excedido. Aguarde e tente novamente."
        if status_code == 402:
            return "Erro: Créditos insuficientes na API DeepSeek."
        return f"IA Temporariamente indisponível: {error_msg}"
    except requests.exceptions.Timeout:
        return "Erro: A requisição para a IA expirou. Tente novamente."
    except Exception as e:
        error_msg = str(e)
        print(f"DeepSeek API Error: {error_msg}")
        return f"IA Temporariamente indisponível: {error_msg}"

def generate_quiz(difficulty: str = "Médio", count: int = 5) -> str:
    if not get_api_key():
        return "Erro: DEEPSEEK_API_KEY não configurada."

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
        text = call_deepseek(messages, max_tokens=4096)
        if text is None:
            return "[]"
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        return text
    except Exception as e:
        print(f"DeepSeek Generation Error: {e}")
        return "[]"
