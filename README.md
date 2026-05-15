# Eagle Eye

A high-performance, web-based file manager for personal NAS. Fast, resilient, and built for creative professional workflows.

![Eagle Eye](design/desktop-main-view.png)

## Features

- **Industrial Swiss Aesthetic** — Professional, high-performance UI using Industrial Grey (#64748B) and Safety Orange (#F97316).
- **Visual File Management** — Canva-inspired cards with high-fidelity thumbnails (grid + list view).
- **Deep Folder Uploads** — Recursively drag and drop entire directory structures with full path preservation.
- **RAW Photography Support** — Instant high-quality previews for `.NEF`, `.ARW`, `.CR2`, and `.DNG` via internal extraction engine.
- **Cinema Video Previews** — Auto-generated thumbnails for `.MOV`, `.MP4`, and professional codecs like `.R3D`, `.BRAW`, and `.MXF`.
- **Integrated PDF Viewer** — View documents directly in the browser with a seamless full-screen player.
- **Drive Management** — Native mount/eject/format controls for removable storage (SD cards, USB drives).
- **System Task Log (`SYS_TASKS`)** — Real-time tracking of uploads, copies, and moves in a technical log-style interface.
- **Robust Notifications** — Immediate visual confirmation for all file operations via a dedicated toast system.
- **Search & Filter** — Rapid search across your entire file library with context-aware results.
- **Session Authentication** — Login-protected API with `HttpOnly` signed session cookies and login rate limiting.
- **Secure & Standalone** — Zero-dependency architecture relying on native Node.js and Linux commands.

## Quick Start

```bash
git clone https://github.com/salakoayoola/eagle-eye.git
cd eagle-eye
./install.sh
```

Or manually:

```bash
cp .env.example .env
# Edit .env — set strong auth values and session secret
# openssl rand -base64 48
docker compose up -d
# Open http://localhost:8080
```

## Architecture

```
Eagle Eye (React + shadcn/ui)    ← Frontend (Nginx Proxy)
Unified Backend (Hono + Node.js) ← File Ops + Drive Management
```

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, Sonner (Notifications)
- **Backend:** Unified Hono server running natively on Node.js. 
- **File System:** Direct management using native `fs` modules and standard Linux utilities (`cp`, `mv`, `rm`).
- **Media Engine:** `exiftool` for RAW extraction and `ffmpeg` for video thumbnail generation.

## Media Preview Notes

- **RAW Images**: Uses `exiftool` to extract the high-res embedded preview, bypassing the need for expensive transcoding.
- **Cinema Formats**: Supports a wide array of professional codecs; if the browser can't play it natively, Eagle Eye provides a frame-accurate thumbnail and metadata.

## Configuration

Copy `.env.example` to `.env` and adjust:

| Variable | Default | Description |
|----------|---------|-------------|
| `EAGLE_EYE_PORT` | `8080` | Web interface port |
| `COMPANION_PORT` | `3924` | Unified Backend API port |
| `MEDIA_MOUNT_DIR` | `/mnt/media` | Host mount point for removable drives |
| `EAGLE_EYE_AUTH_USER` | `admin` | Login username (required) |
| `EAGLE_EYE_AUTH_PASSWORD` | `change-me-now` | Login password (required, change immediately) |
| `EAGLE_EYE_SESSION_SECRET` | - | Long random secret used to sign session cookies (required) |
| `EAGLE_EYE_SESSION_TTL_HOURS` | `12` | Session lifetime in hours |
| `EAGLE_EYE_SECURE_COOKIE` | `false` | Set to `true` when served over HTTPS |
| `EAGLE_EYE_ALLOWED_ORIGINS` | `http://localhost:8080,http://127.0.0.1:8080` | Allowed CORS origins |

## Development

```bash
# Frontend
cd client
npm install
npm run dev

# Unified Backend
cd server
npm install
npm run dev
```

## License

MIT
