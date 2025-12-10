# Use an official lightweight Python image
FROM python:3.10-slim

# Set workdir
WORKDIR /app

# Prevent Python from writing .pyc files and enable stdout/stderr flush (good for logs)
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system deps (if any) and pip upgrade
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    gfortran \
    liblapack-dev \
    libblas-dev \
    && rm -rf /var/lib/apt/lists/*
    
# Copy requirements first (for better caching)
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy application code, models and data
COPY . /app

# Expose the port the app runs on
EXPOSE 5000

# Healthcheck (optional) — checks the docs page
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s \
  CMD curl -f http://127.0.0.1:5000/docs || exit 1

# Start the app with uvicorn (recommended for dev). For production, use gunicorn + uvicorn workers.
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]

