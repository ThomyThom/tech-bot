# app.py
from flask import Flask, render_template, request, jsonify
import random
import os

import google.generativeai as genai

app = Flask(__name__)

# --- Configuração da API Gemini ---
GEMINI_API_KEY = os.getenv('GOOGLE_API_KEY')

if not GEMINI_API_KEY:
    raise ValueError("A variável de ambiente 'GOOGLE_API_KEY' não está definida. Por favor, defina-a.")

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel('gemini-1.5-flash')

# --- Nova Variável: Mensagem de Filtro de Tópico ---
# Esta é a resposta que o bot dará se a pergunta não for tecnológica.
TOPIC_FILTER_MESSAGE = (
    "Desculpe, meu foco é exclusivamente em **tecnologia**. "
    "Posso ajudar com algo sobre programação, hardware, software, inteligência artificial ou tendências digitais?"
)

# --- Funções do Chatbot ---
def get_bot_response(user_message):
    try:
        # **ENGENHARIA DE PROMPT PARA FILTRO DE TÓPICO:**
        # Instruímos o modelo Gemini a se manter no tópico.
        # É importante ser claro e até pedir para ele recusar outros tópicos.
        prompt = (
            "Você é um chatbot especializado em **tecnologia**. "
            "Sua única função é fornecer informações, explicar conceitos, "
            "e discutir tópicos relacionados a programação, hardware, software, "
            "inteligência artificial, internet, cybersegurança, desenvolvimento web, "
            "e quaisquer outras áreas da tecnologia. "
            "**Se o usuário perguntar algo que NÃO seja sobre tecnologia, responda com:** "
            f"'{TOPIC_FILTER_MESSAGE}' "
            "Não invente respostas sobre outros assuntos. "
            "\n\nPergunta do usuário: " + user_message
        )

        response = model.generate_content(prompt)

        # O Gemini pode incluir asteriscos ou underscores para formatação.
        # Se a resposta do Gemini for exatamente a mensagem de filtro, retorne-a.
        # Caso contrário, retorne a resposta gerada.
        if response.text.strip().replace('**', '').replace('*', '').replace('_', '') == TOPIC_FILTER_MESSAGE.strip().replace('**', '').replace('*', '').replace('_', ''):
             return TOPIC_FILTER_MESSAGE
        else:
            return response.text

    except Exception as e:
        print(f"Erro ao chamar a API Gemini: {e}")
        # Resposta de fallback caso a API falhe ou por algum erro de cota
        return "Desculpe, não consegui processar sua solicitação no momento. Tente novamente mais tarde."

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    user_message = request.json.get('message')
    bot_response = get_bot_response(user_message)
    return jsonify({'response': bot_response})

if __name__ == '__main__':
    app.run(debug=True)