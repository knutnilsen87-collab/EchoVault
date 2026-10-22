FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends libsndfile1 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir "fastapi>=0.115" "uvicorn>=0.32" "pydantic>=2.9" "python-multipart>=0.0.12" "numpy>=1.26" "scipy>=1.12" "soundfile>=0.12" "pyloudnorm>=0.1.1"
COPY app ./app
EXPOSE 8001
USER nobody
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
