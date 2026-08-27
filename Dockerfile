FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements and install
COPY backend/requirements.txt /app/backend/requirements.txt
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy CLI requirements and install
COPY cli/requirements.txt /app/cli/requirements.txt
RUN pip install --no-cache-dir -r /app/cli/requirements.txt

# Copy application files
COPY backend /app/backend
COPY cli /app/cli

# Install CLI in editable mode
RUN pip install -e /app/cli

EXPOSE 8001

ENV PYTHONPATH=/app/backend

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
