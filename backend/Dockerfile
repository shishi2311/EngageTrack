FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (cached layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 5000

# Migrate then start — entrypoint handles both
CMD ["sh", "-c", "flask db upgrade && python run.py"]
