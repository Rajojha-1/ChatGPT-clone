# ChatGPT-clone

Quickstart

1. Set your OpenAI API key:
   export OPENAI_API_KEY=sk-...

2. Run the app (no extra installs needed):
   python chatbot.py

3. Open in your browser:
   http://127.0.0.1:5000/

Notes
- The server is a zero-dependency stdlib HTTP server that serves `templates/` and `static/`, and handles POST `/chat` by calling OpenAI. Ensure your network can reach `https://api.openai.com/`.