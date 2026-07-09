# Multi-stage build optimized for Zeabur deployment
# Runs as root, uses dynamic $PORT — required for Zeabur auto-detection
FROM python:3.11-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.11-slim

WORKDIR /app

# Install FFmpeg, OpenCV dependencies, and Node.js (for yt-dlp JS challenges)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual env from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

# Always upgrade yt-dlp to latest (YouTube bot-detection changes frequently)
RUN pip install --upgrade --no-cache-dir yt-dlp

# Copy application code
COPY . .

# Create directories including Ultralytics cache config
RUN mkdir -p /app/uploads /app/output /tmp/Ultralytics

# Pre-download YOLO model on build
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Set Zeabur environment variable defaults
ENV PORT=8000
ENV MAX_CONCURRENT_JOBS=5
ENV DISABLE_YOUTUBE_URL=false
ENV RENDER_SERVICE_URL=http://renderer:3100
ENV AWS_REGION=eu-west-3
ENV AWS_S3_BUCKET=my-clips-bucket
ENV AWS_S3_PUBLIC_BUCKET=my-public-bucket

# Declare persistent volumes for uploads and outputs
VOLUME ["/app/uploads", "/app/output"]

# Expose port (documented port, Zeabur will use $PORT env variable at runtime)
EXPOSE 8000

# Run FastAPI app binding to the dynamic PORT environment variable
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
