FROM python:3.12-slim
WORKDIR /app
COPY llm_server.py startup-graveyard.html ./
EXPOSE 8000
CMD ["python3", "llm_server.py"]
