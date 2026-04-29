# ASCII Art Generator

A high-performance, visually sophisticated web application for converting images into ASCII art. Features real-time preview, multiple output formats, customizable rendering options, and a professional dark-themed interface with matrix rain animations.

## Features

- Image-to-ASCII conversion with live preview
- Real-time parameter adjustment with instant feedback
- Multiple output formats: TXT, PNG, HTML, and clipboard copy
- Customizable rendering options:
  - Width control (adjustable column count)
  - Brightness/contrast adjustment
  - Color mode with per-character color preservation
  - Sharpen filter
  - Gamma correction
- Multiple theme options (dark, green terminal, light, white, blue, pink)
- Responsive design (desktop and mobile)
- Matrix rain background animation
- Particle burst effects on generation
- CRT screen flicker and vignette overlay effects
- Automatic live conversion with debounce
- Toast notifications for user feedback
- Professional monospace typography (IBM Plex Mono, Space Grotesk)

## Usage

1. Open `index.html` in a modern web browser
2. Click the file upload area or drag-and-drop an image
3. Adjust parameters in the sidebar:
   - Width: Set the number of columns for ASCII output
   - Brightness: Adjust overall darkness (+/- range)
   - Contrast: Control tonal range (×0.5 to ×2.0)
   - Sharpen: Enhance detail (0-100%)
   - Gamma: Control midtone brightness (0.5-2.0)
   - Font Size: Adjust preview size (8-32px)
   - Line Spacing: Control vertical spacing (0.8-1.4em)
   - Speed: Conversion animation speed (Slowest to Turbo)
4. Select output theme and color mode
5. Generate and export in your preferred format

## Supported Image Formats

- JPEG
- PNG
- GIF
- WebP
- BMP
- TIFF

## Export Options

- **Text (.txt)**: Plain ASCII art file
- **PNG (.png)**: Rasterized image with embedded styling
- **HTML (.html)**: Interactive HTML file with original colors (if color mode enabled)
- **Clipboard**: Copy ASCII art directly to system clipboard

## System Requirements

- Modern web browser with HTML5 Canvas support
- JavaScript enabled
- Minimum 8MB available RAM

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Technical Details

### Technologies Used
- HTML5 Canvas for image processing and rendering
- Web Workers for non-blocking ASCII conversion
- CSS Grid and Flexbox for responsive layout
- JavaScript ES6+ for application logic

### Key Components
- **Image Processing**: Grayscale conversion, contrast/brightness adjustment, gamma correction
- **ASCII Rendering**: Character mapping based on luminance values
- **Animation**: CSS keyframes and requestAnimationFrame for smooth effects
- **UI Framework**: Custom CSS with CSS variables for theming

## Customization

### Theme Colors
Edit CSS variables in `:root` to customize the appearance:
- `--amber`: Primary accent color
- `--bg-0` through `--bg-4`: Background gradient levels
- `--text`: Primary text color
- `--green`: Secondary accent (terminal theme)

### ASCII Character Set
Modify the character density levels in the conversion logic to use different character palettes.

### Animation Timing
Adjust animation keyframes and transition durations in the CSS `@keyframes` section.

## Performance Optimization

- Debounced live conversion (280ms delay) to prevent excessive processing
- Efficient canvas operations with minimal redraws
- GPU-accelerated CSS animations
- Lazy-loaded image processing
- Responsive particle effects with early termination

## Known Limitations

- Large images (>10MP) may experience slower conversion times
- Color mode requires significant memory for large outputs
- Mobile devices may have reduced animation smoothness

## License

This project is provided as-is for personal and commercial use.

## Credits

Built with HTML5, CSS3, and vanilla JavaScript. Uses IBM Plex Mono and Space Grotesk fonts from Google Fonts.

