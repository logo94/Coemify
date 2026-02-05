FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100

WORKDIR /app

# Upgrade pip tooling
RUN pip install --upgrade pip setuptools wheel

# Copy requirements first for layer caching
COPY requirements.txt .

# Install deps with hardened pip settings (THIS IS THE FIX)
RUN pip install \
    --retries 10 \
    --timeout 100 \
    --prefer-binary \
    --index-url https://pypi.org/simple \
    -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
