import os

# Gunicorn configuration for FastAPI/Uvicorn
# Using only 1 worker for Railway's free tier memory limits
bind = "0.0.0.0:" + os.getenv("PORT", "8000")
workers = 1  # Reduced from multiprocessing formula to avoid OOM on Railway
worker_class = "uvicorn.workers.UvicornWorker"
loglevel = "info"
accesslog = "-"
errorlog = "-"
timeout = 120
keepalive = 5
