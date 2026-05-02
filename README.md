# ASCII Art Generator

> **terminal_ascii** — Convert any image into styled ASCII art right in your browser. No dependencies, no build step, pure vanilla HTML/CSS/JS.

---

## Random Accent Color


https://github.com/user-attachments/assets/f91e64d5-0c5a-4d99-bc2d-d2da0e36eb16


## Features

### Image Input
- Drag-and-drop image upload (JPG, PNG, GIF, WEBP)
- Click-to-browse file picker
- Live image preview with filename and dimensions displayed
- Click or drag on the preview to replace the current image

### ASCII Conversion Engine
- Real-time ("live") conversion that re-runs automatically as settings change
- Configurable output width from 40 to 300 columns
- Adjustable font size (4–16 px) and letter spacing
- 5-step undo history (up to 5 snapshots)
- Generation stats: render time and total character count

### Character Sets
| Key | Description |
|---|---|
| `standard` | `@%#*+=-:. ` |
| `dense` | Full extended set of 70 characters |
| `blocks` | Unicode block elements (█▓▒░) |
| `minimal` | `#=:. ` |
| `slant` | Slash-based characters |
| `braille` | Unicode Braille patterns |
| `dots` | Dot/circle symbols |
| `emoji` | Moon-phase emoji ramp |
| `custom` | User-defined character string |
| `wordfill` | Repeating word or phrase fills the art |

### Image Adjustments
- **Brightness** (−100 to +100)
- **Contrast** (0.5× to 3.0×)
- **Gamma** (0.5 to 2.5)
- **Saturation** (0× to 3.0×)
- **Sharpening** (0–100%)
- **Blur pre-pass** (0–20 px)
- **Noise / Grain** (0–100%)
- **Tiling Grid** (1× to 5× tile repeat)
- **Auto Levels** — automatically optimises brightness and contrast from the image histogram
- **Invert** toggle
- **Floyd–Steinberg dithering** toggle
- **Horizontal / Vertical flip**
- **Rotation** — 0°, 90°, 180°, 270°

### Filter Modes
- **Normal** — standard luminance-to-character mapping
- **Edge Detection** — Sobel operator highlights outlines
- **Emboss** — relief / raised-surface effect
- **Stencil** — binary threshold, hard on/off

### Visual Effects
- **Color Mode** — maps original pixel colours to each character (colour ASCII)
- **Gradient Text** — applies a CSS colour gradient across the output
- **3D Perspective** — CSS 3D transform applied to the output panel
- **Frame / Border** — decorative border rendered around the art (multiple styles)

### Themes (Output Colours)
| Theme | Background | Foreground |
|---|---|---|
| Amber (default) | `#000` | Dynamic accent colour |
| Green | `#001500` | `#33ff66` |
| Paper | `#f5f0e4` | Dark ink |
| White | `#0d0d0d` | `#ffffff` |
| Blue | `#000d1a` | `#60cfff` |
| Pink | `#1a0010` | `#ff6eb4` |

The UI accent colour (referred to as `--amber`) is randomised from 64 hues on every page load.

### Presets
Eight one-click presets that set width, brightness, contrast, gamma, sharpening, saturation, character set, dithering, and filter mode simultaneously:

`Photo` · `Dense` · `Sketch` · `Bold` · `Wide` · `Micro` · `Edge` · `Retro`

### Animation / Generation Styles
- **Scan** — top-to-bottom sweep reveal
- **Type** — typewriter character-by-character
- **Wave** — wave-based reveal
- **Instant** — no animation, immediate render
- Configurable speed: Slowest · Slow · Medium · Fast · Turbo

### Export Formats
| Format | Notes |
|---|---|
| **Copy** | Copies plain-text ASCII to clipboard |
| **.txt** | Plain-text file download |
| **PNG** | Canvas-rendered image honouring current theme and colour mode |
| **SVG** | Vector image preserving font and colours |
| **HTML** | Self-contained HTML file with inline styles, supports colour mode |

### A/B Comparison Mode
- Save two independent sets of settings as State A and State B
- Toggle between them instantly to compare results side-by-side in time

### Config Import / Export
- Export the full current settings snapshot as a `.json` file
- Import a previously exported `.json` to restore every setting

### Split View
- Draggable divider overlays the original image alongside the ASCII output
- Touch-friendly drag support for mobile

### Region Masking
- Draw a mask directly on the output canvas with a brush
- Hold **Shift** to erase mask areas
- Only masked regions are converted; unmasked areas are left blank

### Zoom Controls
- Zoom in/out in 25% steps (25% – 400% range)
- Reset to 100%
- Pinch-to-zoom on touch devices

### Command Palette
- Open with **Ctrl/Cmd + K**
- Fuzzy-search all available actions
- Keyboard-navigable with arrow keys and Enter

### Keyboard Shortcuts
| Key | Action |
|---|---|
| `G` | Generate ASCII |
| `C` | Copy to clipboard |
| `P` | Export PNG |
| `T` | Export TXT |
| `V` | Export SVG |
| `H` | Export HTML |
| `S` | Toggle split view |
| `U` | Undo |
| `I` | Toggle invert |
| `D` | Toggle dithering |
| `+` / `−` | Zoom in / out |
| `0` | Reset zoom |
| `?` | Show shortcuts panel |
| `Esc` | Close open panels |
| `Ctrl/Cmd + K` | Open command palette |

### UI & Accessibility
- Responsive layout — sidebar collapses to a slide-in drawer on mobile
- Hamburger menu button for mobile sidebar access
- CRT scanline overlay and vignette effect for retro ambiance
- Matrix-rain idle animation in the output area
- Particle canvas for visual flair during generation
- Scan-sweep and generation cursor overlays
- Toast notifications for user feedback
- Light / dark UI theme toggle (independent from output theme)
- Status indicator (IDLE / RUNNING / DONE) with LED
- Live render indicator dot

---

## File Structure

```
├── index.html   — markup, sidebar controls, modals, output panel
├── style.css    — all styling, themes, animations, responsive layout
└── script.js    — conversion engine, controls, export, UX logic
```

---

## Dependencies

| Resource | Purpose |
|---|---|
| [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) | Monospace font for output and UI |
| [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk) | UI sans-serif font |

Both fonts are loaded from Google Fonts CDN. No npm packages, no bundler, no build step required.

---

## Browser Requirements

- Any modern browser with support for:
  - Canvas API (`2d` context)
  - `File` / `FileReader` API
  - `Blob` + `URL.createObjectURL`
  - CSS custom properties
  - `navigator.clipboard` (for copy; falls back to `execCommand`)
  - `ResizeObserver`
  - Touch Events (for mobile pinch-zoom and split-drag)
