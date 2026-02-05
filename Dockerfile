FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Upgrade pip FIRST (this fixes the FastAPI resolution failure)
RUN pip install --upgrade pip setuptools wheel

# Install Python dependencies
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy app code
COPY . .

EXPOSE 8080

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
