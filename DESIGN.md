# Design System — Eagle Eye

## Product Context
- **What this is:** A web-based file manager for personal NAS, powered by CopyParty's backend. OS-like drive management with mount/eject, file browsing, and media preview.
- **Who it's for:** Creative professionals managing large media libraries on home NAS setups. Regular users who want Finder/Nautilus-level ease in a browser.
- **Space/industry:** Self-hosted file management, NAS software. Peers: Synology File Station, Nextcloud Files, FileBrowser, GNOME Nautilus, macOS Finder.
- **Project type:** Web app (React + shadcn/ui). System-adaptive light/dark. Mobile responsive. Open source.
- **Backend:** CopyParty JSON API for all file operations. Thin companion API for mount/unmount/eject.
- **Inspiration:** Canva's file/folder card aesthetic (visual, friendly, thumbnail-driven). Ubuntu Nautilus layout. Phone notification bar for drive status.

## Aesthetic Direction
- **Direction:** Industrial Refined with Canva-level friendliness
- **Decoration level:** Intentional. Subtle surface elevation via shadcn card patterns, thin borders, gentle hover states. Folders and files are visual cards with thumbnail previews, not plain text rows.
- **Mood:** Warm, approachable, professional. Like a creative tool you enjoy using, not an IT admin panel. The kind of UI where a non-technical person feels comfortable dragging files around.
- **Reference sites:** Canva (file/folder cards), GNOME Nautilus (sidebar + layout), macOS Finder (drive eject UX)
- **Anti-patterns:** No blue accents (every NAS UI is blue). No terminal-style dark UIs. No data-dense admin tables. No settings in the main view.

## Typography
- **Display/Hero:** Satoshi (geometric sans with warmth, distinctive without being loud)
  - CDN: https://api.fontshare.com/v2/css?f[]=satoshi@700,500&display=swap
- **Body/UI:** Geist (excellent UI readability, built for interfaces, supports tabular-nums for file sizes)
  - CDN: https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css
- **Data/Mono:** Geist Mono (file paths, byte sizes, technical metadata)
  - CDN: https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-mono/style.css
- **Scale:**
  - `text-xs`: 12px / 1.5 (metadata, timestamps)
  - `text-sm`: 14px / 1.5 (file names in list view, labels)
  - `text-base`: 16px / 1.5 (body text, folder names in grid)
  - `text-lg`: 18px / 1.4 (section headers)
  - `text-xl`: 20px / 1.3 (page titles, breadcrumb current)
  - `text-2xl`: 24px / 1.2 (drive names in sidebar)

## Color
- **Approach:** Restrained. One warm accent + warm neutrals. No blue.
- **Accent:** `#D4A574` (warm amber/gold) — ties to "Eagle Eye" name, gives instant identity vs blue competitors
  - Hover: `#C4945E`
  - Active: `#B8854D`
  - Subtle background: `#D4A574/10` (10% opacity for selected states)
- **Neutrals (warm gray, not blue-tinted):**
  - `--gray-50`: `#FAFAF8`
  - `--gray-100`: `#F5F5F2`
  - `--gray-200`: `#E8E8E4`
  - `--gray-300`: `#D4D4D0`
  - `--gray-400`: `#A3A39E`
  - `--gray-500`: `#737370`
  - `--gray-600`: `#525250`
  - `--gray-700`: `#3D3D3B`
  - `--gray-800`: `#1E1E1C`
  - `--gray-900`: `#141413`
- **Semantic:**
  - Success: `#4CAF50` (drive mounted, upload complete)
  - Warning: `#E8A73E` (drive busy, low space)
  - Error: `#D94343` (mount failed, upload error)
  - Info: `#6B9BD2` (muted blue, only for informational badges)
- **Light mode:**
  - Background: `#FAFAF8`
  - Surface (cards, sidebar): `#FFFFFF`
  - Border: `#E8E8E4`
  - Primary text: `#1A1A18`
  - Secondary text: `#737370`
- **Dark mode:**
  - Background: `#141413`
  - Surface: `#1E1E1C`
  - Border: `#3D3D3B`
  - Primary text: `#E8E8E6`
  - Secondary text: `#A3A39E`

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable. Files need room for scanning but not wasteful.
- **Scale:**
  - `2xs`: 2px (micro gaps, icon padding)
  - `xs`: 4px (tight element gaps)
  - `sm`: 8px (within-component padding)
  - `md`: 16px (card padding, list item padding)
  - `lg`: 24px (section gaps)
  - `xl`: 32px (major section separation)
  - `2xl`: 48px (page-level margins)

## Layout
- **Approach:** Grid-disciplined
- **Structure:**
  - Sidebar: 240px (collapsible on mobile, icon-only at 56px)
  - Top bar: 48px height (notification-style drive status bar)
  - Content area: fluid, fills remaining space
- **Grid (content area):**
  - Grid view: auto-fill cards, min 180px, max 220px per card
  - List view: full-width rows, 48px height per row
- **Max content width:** None (fills available space, this is a tool not a marketing site)
- **Breakpoints:**
  - Mobile: < 768px (sidebar collapses to bottom sheet or hamburger)
  - Tablet: 768px-1024px (sidebar collapsible, icon-only default)
  - Desktop: > 1024px (sidebar expanded)
- **Border radius (shadcn-aligned):**
  - `sm`: 4px (buttons, inputs)
  - `md`: 8px (cards, dropdowns)
  - `lg`: 12px (file/folder thumbnail cards, modals)
  - `full`: 9999px (avatars, status dots, pills)

## Motion
- **Approach:** Minimal-functional
- **Easing:** Enter: ease-out, Exit: ease-in, Move: ease-in-out
- **Durations:**
  - Micro: 100ms (hover states, focus rings)
  - Short: 150ms (file list fade-in on navigation, tooltip appear)
  - Medium: 200ms (sidebar collapse/expand, card selection)
  - Long: 250ms (drive notification slide-in/out from top bar, modal open)
- **Specific animations:**
  - Drive connected: slide-in from top of status bar, green pulse on status dot
  - Drive eject: fade-out from status bar, confirmation toast
  - File hover (video): 500ms delay before thumbnail video preview starts playing (muted, looped, low-res)
  - Folder hover: no delay, show 2x2 thumbnail grid of folder contents
  - Upload progress: linear progress bar in status bar

## Component Library
- **Framework:** shadcn/ui (Radix primitives + Tailwind CSS)
- **Why:** Accessible by default, copy-paste ownership (no vendor lock), system-adaptive theming via CSS variables, great React integration, active community.

## UI Architecture

### Top Status Bar (48px, always visible)
Phone notification-style bar showing the most important system info at a glance:
- Left: Eagle Eye logo + name
- Center: Connected drives as pill badges with status dots (green=mounted, amber=busy). Each pill shows: drive label, usage fraction (e.g. "7.5T / 10.8T"), eject icon button.
- Right: Search icon, settings gear (opens settings page, NOT a panel), user/connection info
- Drive mount notification: slides in as a temporary toast-style badge when a new device is plugged in. Shows "NIKON_ZR connected" with mount/dismiss actions.

### Sidebar (240px, left)
- **Favorites** section: pinned folders (user-configurable)
- **Locations** section: RAID, cloud storage (future R2/S3)
- **No settings here.** Settings is a separate page/route.
- Sidebar items: icon + label, subtle hover highlight using accent at 10% opacity
- Active item: left accent border (2px amber), background fill at 5% opacity

### Content Area
- **Breadcrumb bar** at top: clickable path segments, current segment in bold
- **Toolbar:** View toggle (grid/list), sort dropdown, new file button (+), upload button
- **Grid view (default):** Canva-style cards
  - Folder card: 12px rounded corners, thumbnail preview (2x2 grid of contents), folder name below, item count badge
  - File card: 12px rounded corners, file type icon or thumbnail preview, file name below, size + date metadata
  - Image files: actual image thumbnail
  - Video files: first-frame thumbnail, play icon overlay, duration badge. On hover (500ms delay): plays low-res preview loop (muted)
  - Audio files: waveform thumbnail or album art
  - Other files: file type icon (large, centered)
- **List view:** Compact rows (48px), columns: icon + name, size (tabular-nums), modified date, type
- **Selection:** Click to select (amber highlight), Shift+click for range, Ctrl+click for multi
- **Context menu:** Right-click or long-press on mobile. Actions: Open, Download, Rename, Move, Copy, Delete, Get Info

### File Creation
- "New" button in toolbar with dropdown: New Folder, New Text File (.txt), New JSON File (.json)
- Text/JSON files open in a simple inline editor (Monaco or textarea with syntax highlighting for JSON)

### Media Preview
- **Images:** Click opens lightbox overlay with full-resolution image, prev/next navigation
- **Videos:** Click opens video player overlay (HTML5 video, uses CopyParty's streaming)
- **Video hover preview:** After 500ms hover delay, the card thumbnail becomes a muted video loop (first 5-10 seconds, low resolution). Leaving the card stops playback immediately.
- **Folder thumbnails:** Show a 2x2 grid of the first 4 image/video thumbnails from the folder contents. If fewer than 4 media files, fill remaining slots with file type icons.

### Settings (separate page, /settings route)
- NOT in sidebar, NOT in main view
- Accessed via gear icon in top bar
- Sections: Account, Appearance (theme toggle), Storage, Network, About
- Storage section: detailed drive info, mount/unmount controls for drives not shown in status bar

## Interaction Patterns

### Drive Mount/Unmount
- **Mount notification:** When a new device is detected, a toast slides in from the top status bar showing the device label and a "Mount" action button. Auto-dismisses after 10 seconds if no action.
- **Eject:** Click the eject icon on any drive pill in the status bar. Shows confirmation: "Safely remove NIKON_ZR?" with Cancel/Eject buttons. On success: drive pill fades out, success toast appears.
- **No format option.** Eagle Eye never formats drives. Mount and safely remove only.

### Drag and Drop
- Files can be dragged between folders, between drives (sidebar targets highlight on drag-over)
- Upload: drag files from desktop onto any folder card or the content area
- Drop zone: subtle dashed border + amber tint appears on valid drop targets

### Mobile (< 768px)
- Sidebar becomes a slide-out drawer (hamburger menu)
- Status bar condenses: only shows drive status dots (tap to expand)
- Grid view: 2 columns
- List view: simplified (name + size only)
- Context menu: long-press triggers bottom sheet with actions
- Upload: tap "+" button, opens system file picker

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-05 | Amber/gold accent (#D4A574) | Every NAS competitor uses blue. Amber ties to "Eagle Eye" name and gives instant visual identity. |
| 2026-04-05 | Canva-style thumbnail cards | User specifically requested Canva's file aesthetic. Visual cards feel friendlier than text-heavy lists for creative professionals. |
| 2026-04-05 | Top status bar for drive management | User wanted phone notification-style drive info. Keeps settings out of the main view while making mount/eject always accessible. |
| 2026-04-05 | shadcn/ui component library | User specified. Good fit: accessible, themeable, React-native, no vendor lock-in. |
| 2026-04-05 | No blue anywhere in the palette | Explicit user requirement. Differentiates from Nextcloud, Synology, FileBrowser, and most NAS UIs. |
| 2026-04-05 | Video hover preview (500ms delay) | Creative professionals browsing footage need quick preview without opening each file. Delay prevents accidental playback while scrolling. |
| 2026-04-05 | Settings as separate page | User wants clean main view. Settings accessed via gear icon, not cluttering sidebar or content area. |
| 2026-04-05 | Text/JSON file creation | User needs simple text-based file creation (.txt, .json) without leaving the file browser. |
