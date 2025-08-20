# 🎵 Slowed + Reverb Studio Pro

A comprehensive web-based audio transformation studio for creating slowed + reverb, nightcore, and various atmospheric music styles. Transform your music with professional-grade effects in an intuitive three-tab workflow.

## ✨ Features

### 🎛️ Editor Tab
- **Drag & Drop File Upload** - Easy audio file loading
- **6 Professional Presets** - Classic Slowed, Nightcore, Vaporwave, Ambient, Hyperpop, Lo-Fi
- **Advanced Audio Effects**:
  - Independent speed & pitch control with linking option
  - Atmospheric reverb with room size and decay controls
  - 3-band EQ (Bass, Mid, Treble)
  - Low-pass filtering for warm effects
  - Dynamic compression
  - Stereo width and panning
  - Fade in/out controls
- **Real-time Preview** - Instant audio feedback
- **Undo/Redo System** - Full edit history
- **A/B Comparison** - Compare original vs processed audio
- **Export Engine** - Download with custom format and quality

### 🎵 Player Tab
- **Clean Playback Interface** - Distraction-free listening
- **Audio Visualizer** - Real-time frequency visualization with fullscreen mode
- **Playlist Integration** - Seamless playback from playlists
- **Crossfade Support** - Smooth transitions between songs
- **Gapless Playback** - Continuous listening experience
- **Playback Speed Control** - Independent of processing effects
- **Effects Summary** - View applied effects at a glance

### 📋 Playlist Tab
- **Multi-Playlist Management** - Create and organize multiple playlists
- **Drag & Drop Reordering** - Visual song arrangement
- **Batch Operations** - Upload multiple songs simultaneously
- **Shuffle & Repeat Modes** - Various playback options
- **Export/Import Playlists** - Save and share playlist configurations
- **Individual Song Settings** - Each song remembers unique parameters

### 🔧 System-Wide Features
- **Dark/Light Theme** - Customizable appearance
- **Keyboard Shortcuts** - Efficient workflow navigation
- **Mobile Responsive** - Works on all devices
- **Auto-Save Functionality** - Never lose your work
- **Local Storage** - Persistent data without cloud dependency

## 🚀 Quick Start

### **Minimum Required Files:**
You only need these files to run the app:
```
slowed-reverb-studio/
├── index.html
├── style.css  
├── app.js
├── js/ (all 5 JavaScript files)
└── css/ (all 3 CSS files)
```

1. **Download the required files** (you can delete the `presets/` folder)
2. **Open `index.html`** in a modern web browser
3. **Start creating** - No installation or build process required!

> **Note**: All presets are embedded in `editor.js`, so you don't need the JSON files in the `presets/` folder. The app works perfectly with just the HTML, CSS, and JS files!

### Alternative: Local Server (Optional)
If you want to modify the preset JSON files, you can run a local server:
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```
Then open `http://localhost:8000` in your browser.

## 🎹 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Space` | Play/Pause |
| `1` `2` `3` | Switch between Editor/Player/Playlist tabs |
| `←` `→` | Seek backward/forward (10s) |
| `↑` `↓` | Volume up/down |
| `Ctrl+Z` `Ctrl+Y` | Undo/Redo (in Editor) |
| `Ctrl+S` | Quick export |
| `F` | Fullscreen visualizer (in Player) |
| `N` `P` | Next/Previous song (in playlists) |

## 🎚️ Preset Guide

### Classic Slowed
- **Speed**: 0.75x
- **Pitch**: -2 semitones
- **Character**: Deep, atmospheric, nostalgic
- **Best for**: Hip-hop, R&B, pop

### Nightcore
- **Speed**: 1.3x
- **Pitch**: +4 semitones
- **Character**: High-energy, bright, crisp
- **Best for**: Electronic, pop, anime music

### Vaporwave
- **Speed**: 0.6x
- **Pitch**: -4 semitones
- **Character**: Dreamy, nostalgic, heavily filtered
- **Best for**: 80s music, synthwave, pop

### Ambient
- **Speed**: 0.8x
- **Pitch**: 0 semitones
- **Character**: Spacious, ethereal, meditative
- **Best for**: Any genre for relaxation

### Hyperpop
- **Speed**: 1.1x
- **Pitch**: +2 semitones
- **Character**: Heavily processed, maximalist
- **Best for**: Pop, electronic, experimental

### Lo-Fi
- **Speed**: 0.9x
- **Pitch**: -1 semitone
- **Character**: Warm, vintage, cozy
- **Best for**: Jazz, indie, chill music

## 🔧 Technical Details

### Browser Support
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 13.4+)
- **Mobile**: Responsive design with touch gestures

### Audio Formats
- **Input**: MP3, WAV, OGG, FLAC, AAC, M4A
- **Output**: MP3, WAV
- **Quality**: 128-320 kbps options

### File Structure
```
slowed-reverb-studio/
├── index.html              # Main application
├── style.css               # Global styles
├── app.js                  # Main app controller
├── js/                     # JavaScript modules
│   ├── audio-engine.js     # Web Audio API wrapper
│   ├── editor.js           # Editor functionality (includes embedded presets)
│   ├── player.js           # Player functionality
│   ├── playlist.js         # Playlist management
│   └── ui-utils.js         # Utility functions
├── css/                    # Stylesheets
│   ├── components.css      # UI components
│   ├── tabs.css           # Tab-specific styles
│   └── responsive.css     # Mobile styles
└── README.md              # This file

# Optional (no longer needed):
presets/                   # These JSON files are now embedded in editor.js
├── classic-slowed.json    # Can be deleted
├── nightcore.json         # Can be deleted  
├── vaporwave.json         # Can be deleted
├── ambient.json           # Can be deleted
├── hyperpop.json          # Can be deleted
└── lo-fi.json            # Can be deleted
```

## 🎯 Usage Tips

### For Best Results
1. **Use high-quality audio files** (320kbps MP3 or WAV)
2. **Start with presets** then fine-tune to your taste
3. **Use A/B comparison** to check your changes
4. **Save multiple versions** by exporting different variations

### Performance Tips
- **Close other browser tabs** for better audio performance
- **Use headphones** for accurate monitoring
- **Allow microphone access** if prompted (for audio context)

### Mobile Usage
- **Tap to interact** with visualizers and controls
- **Swipe gestures** for song navigation
- **Portrait mode recommended** for best experience

## 🐛 Troubleshooting

### Audio Not Playing
1. Check if browser supports Web Audio API
2. Try clicking play after loading a file
3. Refresh the page and try again
4. Ensure audio file is not corrupted

### Preset Loading Issues
- **Fixed**: Presets are now embedded in the code to avoid CORS issues
- If you see preset errors, refresh the page
- All 6 presets should load automatically

### Export Issues
1. Wait for processing to complete
2. Check browser's download settings
3. Try a different export format

### CORS/File Loading Issues
- The app works directly from `index.html` (no server needed)
- If you want to use external JSON files, run a local server
- Avoid opening files with `file://` protocol for advanced features

### Mobile Issues
1. Use a modern mobile browser
2. Ensure sufficient storage space
3. Close other apps if experiencing lag

## 🔮 Future Enhancements

- **Cloud Storage Integration**
- **Collaborative Playlists** 
- **More Audio Effects** (Chorus, Flanger, etc.)
- **Spectrum Analyzer**
- **MIDI Controller Support**
- **Batch Processing**
- **External Preset Loading** (if you want to use custom JSON presets)

## 📦 What You Actually Need

**Core Files (Required):**
- `index.html` + `style.css` + `app.js`
- `js/` folder (5 JavaScript files)
- `css/` folder (3 CSS files)

**Optional Files:**
- `presets/` folder (6 JSON files) - Can be deleted since presets are embedded
- `README.md` - Documentation

**Total: 10 files minimum** for a fully functional studio!

## 🤝 Contributing

This is a personal project, but feel free to:
- Report bugs or issues
- Suggest new features
- Fork and modify for your needs

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Built with vanilla JavaScript and Web Audio API
- Inspired by the slowed + reverb music community
- Uses modern CSS features for beautiful UI
- Designed with accessibility in mind

---

**Enjoy creating your atmospheric music transformations! 🎶**