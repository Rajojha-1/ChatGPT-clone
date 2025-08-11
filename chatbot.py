import os
import re
import json
import mimetypes
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
from urllib.request import Request, urlopen

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(PROJECT_ROOT, 'templates')
STATIC_DIR = os.path.join(PROJECT_ROOT, 'static')

SYSTEM_PROMPT = (
    "You are the smartest of all human beings and AI, answer like the smartest person ever."
)


def _render_index_html() -> bytes:
    index_path = os.path.join(TEMPLATES_DIR, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()
    # Replace Flask url_for static references with direct /static/ paths
    html = re.sub(r"\{\{\s*url_for\('static',\s*filename='([^']+)'\)\s*\}\}", r"/static/\\1", html)
    return html.encode('utf-8')


def _chat_with_openai(user_message: str) -> str:
    api_key = os.environ.get('OPENAI_API_KEY')
    if not api_key:
        return 'Error: OPENAI_API_KEY is not set.'

    payload = {
        'model': 'gpt-4o-mini',
        'messages': [
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': user_message},
        ],
        'temperature': 0.7,
    }
    req = Request(
        url='https://api.openai.com/v1/chat/completions',
        data=json.dumps(payload).encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}',
        },
        method='POST',
    )
    try:
        with urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return (
                data.get('choices', [{}])[0]
                    .get('message', {})
                    .get('content', 'No response')
            )
    except Exception as exc:
        return f'Error contacting OpenAI: {exc}'


class ChatHandler(BaseHTTPRequestHandler):
    def _send_bytes(self, code: int, body: bytes, content_type: str = 'text/plain; charset=utf-8') -> None:
        self.send_response(code)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):  # noqa: N802 (BaseHTTPRequestHandler API)
        parsed = urlparse(self.path)
        if parsed.path == '/' or parsed.path == '/index.html':
            body = _render_index_html()
            return self._send_bytes(200, body, 'text/html; charset=utf-8')
        if parsed.path.startswith('/static/'):
            rel_path = parsed.path[len('/static/'):]
            fs_path = os.path.normpath(os.path.join(STATIC_DIR, rel_path))
            # Prevent path traversal
            if not fs_path.startswith(STATIC_DIR):
                return self._send_bytes(403, b'Forbidden')
            if not os.path.isfile(fs_path):
                return self._send_bytes(404, b'Not Found')
            ctype, _ = mimetypes.guess_type(fs_path)
            ctype = ctype or 'application/octet-stream'
            with open(fs_path, 'rb') as f:
                data = f.read()
            return self._send_bytes(200, data, ctype)
        return self._send_bytes(404, b'Not Found')

    def do_POST(self):  # noqa: N802 (BaseHTTPRequestHandler API)
        parsed = urlparse(self.path)
        if parsed.path == '/chat':
            content_length = int(self.headers.get('Content-Length', '0'))
            raw = self.rfile.read(content_length) if content_length > 0 else b'{}'
            try:
                payload = json.loads(raw.decode('utf-8'))
            except json.JSONDecodeError:
                payload = {}
            message = (payload or {}).get('message', '')
            reply = _chat_with_openai(message)
            body = json.dumps({'reply': reply}).encode('utf-8')
            return self._send_bytes(200, body, 'application/json; charset=utf-8')
        return self._send_bytes(404, b'Not Found')

    def log_message(self, fmt, *args):
        # Quieter logs
        return


def run(host: str = '127.0.0.1', port: int = 5000) -> None:
    server = ThreadingHTTPServer((host, port), ChatHandler)
    print(f'Server running at http://{host}:{port}')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    run()
