# Design System — Eagle Eye

## Product Context
- **What this is:** A high-performance, standalone NAS file manager. Professional-grade browsing with integrated drive management and advanced media extraction.
- **Who it's for:** Creative professionals (photographers, videographers) and NAS power users who require speed, technical accuracy, and resilient file operations.
- **Space/industry:** Personal storage solutions, NAS OS software.
- **Unified Backend:** A standalone Hono-based Node.js server managing all file operations via native system commands.

## Aesthetic Direction: Industrial Swiss
- **Concept:** Utilitarian precision. The UI should feel like a high-performance system utility — clean, predictable, and robust.
- **Tone:** Technical, professional, and dense. Prioritizes data visibility and operation status over soft or "friendly" aesthetics.
- **Key Motifs:** Sharp 4px corners, monospace metadata, high-contrast states, and monotonic progress tracking.

## Color Palette
- **Primary (Industrial):** `#64748B` (Industrial Grey). Used for primary UI borders, sidebar headers, and core components.
- **Accent (Safety):** `#F97316` (Safety Orange). Used exclusively for critical calls-to-action, active selection states, and live task indicators.
- **Backgrounds:** Extremely high-contrast. Near-white for light mode, deep charcoal for dark mode.
- **Neutral Scale:** 
    - Muted technical data: `oklch(0.5 0.02 250)`
    - Technical borders: `oklch(0.9 0.01 250)`

## Typography
- **Core UI:** Geist Sans. Modern, readable, and perfectly balanced for technical interfaces.
- **Technical Data:** Geist Mono. Used for filenames, file sizes, timestamps, and the `SYS_TASKS` log.
- **Scale:**
    - `text-[9px]`: System labels, small metadata.
    - `text-[10px]`: Primary monospace data.
    - `text-xs (12px)`: Primary filenames, sidebar items.
    - `text-sm (14px)`: Modal headers, page titles.

## Visual Components

### File & Folder Cards
- **Geometry:** Sharp `rounded-sm` corners.
- **Hover:** Fast 150ms transition. Bold border highlight (`border-primary`) with a subtle 4px hard shadow.
- **Selection:** High-visibility safety orange border and ring.

### System Task Log (`SYS_TASKS`)
- Redesigned as a technical "Live Log" at the bottom right.
- Features a pulsing "Active" status indicator.
- Monospace font for all operation names and error reports.
- Non-rounded progress bars for a precise, "digital" feel.

### Sidebar & TopBar
- **Sidebar:** Categorized into uppercase headers with tracking. Active items use solid primary backgrounds with high-contrast foregrounds.
- **TopBar:** Features minimalist "Drive Pills" showing current storage utilization.

## Interaction Patterns

### File Operations
- **Real-time Feedback:** Integrated `sonner` toast notifications for every single file operation (Copy, Move, Upload, Delete).
- **Batch Processing:** Recursive traversal for folder uploads with a 4-worker concurrency limit to ensure backend stability.
- **Context Awareness:** Smarter right-click menus that adjust available actions based on single vs. multi-file selection.

### Media Engine
- **RAW Extraction:** On-the-fly thumbnail generation using `exiftool` to pull embedded JPEGs from photography formats (.NEF, .ARW, etc.).
- **Video Logic:** Frame-accurate thumbnail generation using `ffmpeg`.

## Decision Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-26 | Standalone Hono Backend | Removed CopyParty dependency to gain direct control over OS commands and resolve persistent permission/CORS issues. |
| 2026-04-26 | Industrial Swiss Aesthetic | Shifted from "Canva-friendly" to "Industrial Swiss" to better match the high-performance, professional nature of the tool. |
| 2026-04-26 | Monospace for Metadata | Enhances the technical feel and improves the alignment of tabular data (file sizes, dates). |
| 2026-04-26 | Forward Auth (Authentik ready) | Pre-configured Nginx to support enterprise-grade authentication at the network edge. |
