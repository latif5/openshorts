# Deploying OpenShorts on Zeabur

This guide walks you through deploying all three OpenShorts services (Backend, Renderer, and Frontend) on [Zeabur](https://zeabur.com) from a single GitHub repository.

---

## Prerequisites

- A [Zeabur account](https://zeabur.com) (free tier works for testing)
- Your OpenShorts repository pushed to GitHub
- (Optional) An AWS S3 bucket for video backup
- A Google Gemini API key (required for AI processing)

---

## Architecture Overview

OpenShorts consists of three separate services deployed from the same repository:

| Service | Directory | Port | Description |
|---|---|---|---|
| **Backend** | `/` (repo root) | `8000` | FastAPI + AI processing |
| **Renderer** | `render-service/` | `3100` | Remotion video renderer |
| **Frontend** | `dashboard/` | `5173` | React dashboard UI |

---

## Step 1 — Create a Zeabur Project

1. Log in to the [Zeabur Dashboard](https://zeabur.com/projects).
2. Click **New Project**.
3. Give it a name (e.g., `openshorts`).

---

## Step 2 — Deploy the Backend Service

The backend is the main FastAPI service. It uses `Dockerfile.zeabur` at the repo root.

### 2.1 — Add the Service

1. Inside your project, click **Add Service → Git** (or GitHub).
2. Select or enter your OpenShorts repository URL.
3. Leave **Root Directory** empty (use `/`).
4. Zeabur will automatically detect the `Dockerfile` at the root and use it.

> **Note:** The first build takes ~5–10 minutes because it downloads the YOLO model during the image build.

### 2.2 — Set Environment Variables

Go to the **Variables** tab of the backend service and add the following:

#### Required

| Variable | Value |
|---|---|
| `PORT` | `8000` |
| `GEMINI_API_KEY` | Your Google Gemini API key |

#### Optional (AWS S3 for video backup)

| Variable | Value |
|---|---|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `AWS_REGION` | e.g. `eu-west-3` |
| `AWS_S3_BUCKET` | Your private S3 bucket name |
| `AWS_S3_PUBLIC_BUCKET` | Your public S3 bucket name |

#### Optional (Advanced)

| Variable | Default | Description |
|---|---|---|
| `MAX_CONCURRENT_JOBS` | `5` | Max parallel video processing jobs |
| `DISABLE_YOUTUBE_URL` | `false` | Set `true` to block YouTube downloads |
| `RENDER_SERVICE_URL` | `http://renderer:3100` | Internal URL of the renderer service |
| `YOUTUBE_COOKIES` | *(empty)* | Netscape-format cookies to bypass bot detection |

### 2.3 — Mount Persistent Volumes

Go to the **Volumes** tab and add two volumes:

| Volume ID | Mount Directory | Purpose |
|---|---|---|
| `backend-uploads` | `/app/uploads` | Temporary uploaded video files |
| `backend-output` | `/app/output` | Generated short clips |

> **Warning:** Mounting a volume disables zero-downtime restarts. The service will briefly go offline during restarts.

### 2.4 — Configure Networking

Go to the **Networking** tab and expose the service on port `8000`. Zeabur will assign a public domain automatically.

---

## Step 3 — Deploy the Renderer Service

The renderer uses Remotion to generate MP4 clips with effects and subtitles.

### 3.1 — Add the Service

1. Inside your project, click **Add Service → Git** (or GitHub).
2. Select or enter the same OpenShorts repository URL.
3. Keep **Root Directory** as `/` (repository root). This is necessary because the renderer build needs access to the `remotion/` directory, which is outside of `render-service/`.
4. Name the service `renderer` so Zeabur auto-matches `Dockerfile.renderer` at the repo root.

> **Alternative:** If you use a different service name, add the environment variable `ZBPACK_DOCKERFILE_PATH` set to `render-service/Dockerfile` (or `Dockerfile.renderer`).

> **Important:** Do **not** set Root Directory to `render-service`. Zeabur will try to run `/render-service` as a native binary and the container will crash on startup.

### 3.2 — Set Environment Variables

Go to the **Variables** tab of the renderer service and add:

#### Required (runtime)

| Variable | Value |
|---|---|
| `PORT` | `3100` |
| `OUTPUT_DIR` | `/output` |
| `REMOTION_BUNDLE_PATH` | `/app/remotion` |

#### Required (build) — if the service is **not** named `renderer` or `render-service`

| Variable | Value |
|---|---|
| `ZBPACK_DOCKERFILE_PATH` | `Dockerfile.renderer` |

Without this, Zeabur uses the root `Dockerfile` (the Python backend, ~646 MB) and the container will fail to start.

### 3.3 — Mount Persistent Volume

Go to the **Volumes** tab and add:

| Volume ID | Mount Directory | Purpose |
|---|---|---|
| `renderer-output` | `/output` | Rendered video files |

### 3.4 — Update the Backend's `RENDER_SERVICE_URL`

Once the renderer is running:

1. Go to the renderer's **Networking** tab and note its **internal hostname** (shown as the service name, e.g., `renderer`).
2. Go back to the **backend** service's **Variables** tab.
3. Set `RENDER_SERVICE_URL` to `http://renderer:3100` (Zeabur services on the same project communicate via internal DNS using the service name).

---

## Step 4 — Deploy the Frontend Service

The frontend is the React + Vite dashboard.

### 4.1 — Add the Service

1. Inside your project, click **Add Service → Git** (or GitHub).
2. Select or enter the same OpenShorts repository URL.
3. Set **Root Directory** to `dashboard` (Settings → Root Directory).
4. Zeabur will detect `dashboard/Dockerfile` and `dashboard/zbpack.json` automatically.

> **Alternative:** Keep Root Directory as `/` and either name the service `dashboard` (Zeabur auto-matches `Dockerfile.dashboard`) or set `ZBPACK_DOCKERFILE_PATH=dashboard/Dockerfile`.

### 4.2 — Set Environment Variables

Go to the **Variables** tab of the frontend service and add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | The public HTTPS domain of your backend service (e.g. `https://openshorts-backend.zeabur.app`) |

### 4.3 — Configure Networking

Expose the service on port `5173`. Zeabur will assign a public domain.

---

## Step 5 — Verify the Deployment

Once all three services are running (green status):

1. Open the **frontend** public domain in your browser.
2. Click the ⚙️ settings icon and enter your **Gemini API key** (stored locally in your browser — never sent to the server).
3. Paste a YouTube URL or upload a video file.
4. Click **Process** and watch the AI generate your short clips.

---

## Troubleshooting

### Build takes too long / times out
The backend image downloads `yolov8n.pt` (~6 MB) during build. If builds time out, consider using a Zeabur plan with a larger **Build Spec** (more CPU/RAM for the build machine).

### "Permission denied" on volume paths
The `Dockerfile.zeabur` runs as `root` specifically to avoid this. If you see permission errors, ensure you are using `Dockerfile.zeabur` and not the original `Dockerfile` (which uses a non-root user).

### Renderer cannot connect to backend
Make sure both services are in the **same Zeabur project**. Internal service DNS only works within the same project. The `RENDER_SERVICE_URL` should use the service name (e.g., `http://renderer:3100`), not the public domain.

### Frontend cannot reach the backend
Double-check that `VITE_API_URL` is set to the backend's **public HTTPS** domain (e.g., `https://openshorts-backend.zeabur.app`), not an internal address.

### YouTube downloads failing
Try setting `YOUTUBE_COOKIES` with valid Netscape-format cookies from a logged-in YouTube session. Alternatively, set `DISABLE_YOUTUBE_URL=true` and use local video uploads only.

### `exec: "/render-service": no such file or directory`
Zeabur is not using the renderer Dockerfile. Common causes:

1. **Root Directory** is set to `render-service` → Zeabur tries to run `/render-service` as a native binary.
2. **Wrong Dockerfile** — service name is not `renderer`/`render-service` and `ZBPACK_DOCKERFILE_PATH` is missing → Zeabur builds the Python backend (~646 MB image) instead.

**Fix (do all of these):**

1. Open the renderer service → **Settings**.
2. Set **Root Directory** to `/` (empty / repository root).
3. Clear any custom **Start Command** (leave it blank).
4. Go to **Variables** and add `ZBPACK_DOCKERFILE_PATH` = `Dockerfile.renderer` (unless the service is already named `renderer` or `render-service`).
5. **Redeploy** and wait for a fresh build. In the build log you should see Node.js + Chromium steps, not Python/YOLO.
6. After deploy, image size should be ~400–700 MB with Chromium — if you still see the exact same ~646 MB backend image hash, the wrong Dockerfile is still being used.

### `exec: "/dashboard": no such file or directory`
Zeabur is using the Root Directory name (`dashboard`) as the container entrypoint instead of the Dockerfile `CMD`.

**Quick fix in Zeabur (do all of these):**
1. Open the service → **Settings** → clear **Start Command** (leave empty).
2. Check **Variables** — delete `ZBPACK_START_COMMAND` if it is set to `/dashboard`.
3. Set **Root Directory** to `dashboard` (for frontend) or `/` (for backend).
4. Click **Redeploy** and wait for a **new build** — the image digest in logs must change (not `d-6a4fb423d5520eae64fa54b6`).

**Repo fix:** `dashboard/zeabur-entrypoint.sh` is installed at `/dashboard` in the image so this Zeabur behavior works after a fresh build.

If Root Directory is `/`, set `ZBPACK_DOCKERFILE_PATH=dashboard/Dockerfile`.
If Root Directory is `dashboard`, do **not** set `ZBPACK_DOCKERFILE_PATH`.

---

## Files Added for Zeabur Support

| File | Purpose |
|---|---|
| [`Dockerfile`](../Dockerfile) | Zeabur-optimized backend Dockerfile (runs as root, binds to `$PORT`) |
| [`dashboard/Dockerfile`](../dashboard/Dockerfile) | Frontend Dockerfile |
| [`Dockerfile.renderer`](../Dockerfile.renderer) | Renderer Dockerfile (auto-matched when service is named `renderer`) |
| [`render-service/Dockerfile`](../render-service/Dockerfile) | Same renderer Dockerfile (use with `ZBPACK_DOCKERFILE_PATH`) |
| [`zeabur.yaml`](../zeabur.yaml) | Reference-only deployment config (env vars, volumes, ports) |
