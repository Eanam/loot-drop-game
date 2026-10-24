#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
《改命 · Quibi》本地 LLM 代理

用途：
  1. 托管游戏静态文件
  2. 把 /api/chat 转发到任意 OpenAI 兼容接口，并把流式响应透传给浏览器
  3. API Key 只存在服务端，不进入浏览器

运行：
  export LLM_API_KEY=sk-xxxx
  export LLM_BASE_URL=https://api.deepseek.com/v1
  export LLM_MODEL=deepseek-chat
  python3 llm_server.py

或创建 llm_config.json：
  { "api_key": "sk-xxxx",
    "base_url": "https://api.deepseek.com/v1",
    "model": "deepseek-chat" }

然后打开终端提示的地址（默认 http://localhost:8000/）。

仅依赖 Python 3 标准库。
"""

import json
import os
import sys
import urllib.error
import urllib.request
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))

DEFAULTS = {
    "api_key": "",
    "base_url": "https://api.deepseek.com/v1",
    "model": "deepseek-chat",
    "port": 8000,
}


def load_config():
    cfg = dict(DEFAULTS)

    path = os.path.join(HERE, "llm_config.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for k in ("api_key", "base_url", "model"):
                if data.get(k):
                    cfg[k] = str(data[k]).strip()
            if data.get("port"):
                cfg["port"] = int(data["port"])
        except Exception as e:
            print(f"[warn] 读取 llm_config.json 失败：{e}")

    # 环境变量优先级最高
    if os.environ.get("LLM_API_KEY"):
        cfg["api_key"] = os.environ["LLM_API_KEY"].strip()
    if os.environ.get("LLM_BASE_URL"):
        cfg["base_url"] = os.environ["LLM_BASE_URL"].strip()
    if os.environ.get("LLM_MODEL"):
        cfg["model"] = os.environ["LLM_MODEL"].strip()
    if os.environ.get("PORT"):
        cfg["port"] = int(os.environ["PORT"])

    cfg["base_url"] = cfg["base_url"].rstrip("/")
    return cfg


CFG = load_config()


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HERE, **kwargs)

    # ---------- 基础响应 ----------
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    # ---------- 路由 ----------
    def do_GET(self):
        if self.path in ("/", ""):
            self.path = "/startup-graveyard.html"
        if self.path.split("?")[0] == "/api/health":
            return self._json({
                "configured": bool(CFG["api_key"]),
                "model": CFG["model"],
                "base": CFG["base_url"],
            })
        return super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/chat":
            return self._json({"error": "not found"}, 404)

        if not CFG["api_key"]:
            return self._json({
                "error": "服务端未配置 API Key。请设置环境变量 LLM_API_KEY 或创建 llm_config.json。"
            }, 400)

        try:
            length = int(self.headers.get("Content-Length") or 0)
            payload = json.loads(self.rfile.read(length) or b"{}")
        except Exception as e:
            return self._json({"error": f"请求体解析失败：{e}"}, 400)

        upstream = {
            "model": payload.get("model") or CFG["model"],
            "messages": payload.get("messages", []),
            "temperature": payload.get("temperature", 0.85),
            "max_tokens": payload.get("max_tokens", 560),
            "stream": True,
        }

        req = urllib.request.Request(
            CFG["base_url"] + "/chat/completions",
            data=json.dumps(upstream).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": "Bearer " + CFG["api_key"],
                "Accept": "text/event-stream",
            },
            method="POST",
        )

        try:
            resp = urllib.request.urlopen(req, timeout=90)
        except urllib.error.HTTPError as e:
            try:
                detail = json.loads(e.read().decode("utf-8", "replace"))
                msg = detail.get("error", {}).get("message") or str(detail)
            except Exception:
                msg = f"上游返回 HTTP {e.code}"
            return self._json({"error": msg}, e.code)
        except Exception as e:
            return self._json({"error": f"连接上游失败：{e}"}, 502)

        ctype = (resp.headers.get("Content-Type") or "").lower()

        # 上游正常流式返回：原样透传
        if "text/event-stream" in ctype:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream; charset=utf-8")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("X-Accel-Buffering", "no")
            self._cors()
            self.end_headers()
            try:
                while True:
                    line = resp.readline()
                    if not line:
                        break
                    self.wfile.write(line)
                    self.wfile.flush()
            except (BrokenPipeError, ConnectionResetError):
                pass
            finally:
                resp.close()
            return

        # 上游忽略 stream 返回整段 JSON：转成 SSE
        raw = resp.read()
        resp.close()
        try:
            data = json.loads(raw.decode("utf-8", "replace"))
            text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
        except Exception:
            return self._json({"error": "上游返回了无法解析的内容"}, 502)

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-cache")
        self._cors()
        self.end_headers()
        chunk = {"choices": [{"delta": {"content": text}}]}
        self.wfile.write(("data: " + json.dumps(chunk, ensure_ascii=False) + "\n\n").encode("utf-8"))
        self.wfile.write(b"data: [DONE]\n\n")
        self.wfile.flush()

    def log_message(self, fmt, *args):
        line = fmt % args if args else fmt
        if "/api/chat" in line:
            return
        sys.stderr.write("[%s] %s\n" % (self.log_date_time_string(), line))


def main():
    port = CFG["port"]
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)

    print("=" * 58)
    print("  《改命 · Quibi》本地 LLM 代理")
    print("=" * 58)
    print(f"  上游地址 : {CFG['base_url']}")
    print(f"  模型     : {CFG['model']}")
    print(f"  API Key  : {'已配置 ' + CFG['api_key'][:6] + '...' if CFG['api_key'] else '未配置（游戏会回退到本地引擎）'}")
    print("-" * 58)
    print(f"  游戏地址 : http://localhost:{port}/")
    print("  Ctrl+C 退出")
    print("=" * 58)

    if not CFG["api_key"]:
        print("\n[提示] 未检测到 API Key，AI 推演不会启用。")
        print("       可设置环境变量 LLM_API_KEY，或创建 llm_config.json。\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
        server.shutdown()


if __name__ == "__main__":
    main()
