import os
from flask import Flask, request, jsonify, render_template
from openai import OpenAI

# Load API key from environment
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def chat_with_gpt(user_input: str) -> str:
    response = client.responses.create(
        model="gpt-4o-mini",
        input=[
            {"role": "system", "content": "You are the smartest of all human beings and AI, answer like the smartest person ever."},
            {"role": "user", "content": user_input}
        ]
    )
    return response.output_text

app = Flask(__name__)

@app.route("/")
def home():
    # Serve index.html from templates folder
    return render_template("index.html")

@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    user_message = data.get("message", "")
    reply = chat_with_gpt(user_message)
    return jsonify({"reply": reply})

if __name__ == "__main__":
    # Flask default binds to 127.0.0.1 and prints the familiar message
    app.run(debug=True)
