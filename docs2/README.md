# Auto Explainer v2 - Documentation

> **A browser-based animation tool for creating explainer videos with images, videos, and text.**

## 📚 Documentation Index

### Getting Started
- **[Quick Start Guide](QUICK_START.md)** - Get up and running in 5 minutes
- **[Project Setup](PROJECT_SETUP.md)** - How to organize your project folders

### Core Documentation
- **[JSON Guide](JSON_GUIDE.md)** - Complete JSON schema reference
- **[Features Overview](FEATURES.md)** - All implemented features explained
- **[Keyboard Shortcuts](KEYBOARD_SHORTCUTS.md)** - All available shortcuts

### Troubleshooting & Help
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions
- **[Architecture](ARCHITECTURE.md)** - Technical overview of the codebase

---

## ✨ What is Auto Explainer?

Auto Explainer is a **local-first**, **browser-based** animation tool that lets you create explainer videos using:
- 🖼️ Images (PNG, JPG, etc.)
- 🎬 Videos (MP4, WebM)
- 📝 Text with full styling
- 🎨 Color masks for stylized graphics
- ⏱️ Timeline-based animation with keyframes

### Key Features
- ✅ **No server required** - runs entirely in your browser
- ✅ **Direct folder access** - edit files directly on your computer
- ✅ **Video export** - frame-by-frame rendering to WebM/MP4 (720p, 1080p, 4K)
- ✅ **Multi-selection** ⭐ NEW - Shift+Click to select multiple elements for batch editing
- ✅ **Manual refresh** - click refresh button to reload external changes
- ✅ **Undo/Redo** - full history with Ctrl+Z/Ctrl+Y
- ✅ **Keyframe animation** - smooth interpolation for position, size, rotation, opacity
- ✅ **Entry/exit animations** - fade, slide, scale effects
- ✅ **Loop animations** - continuous and blocky swing, jitter effects
- ✅ **Text objects** - create and style text directly in the UI
- ✅ **Video backgrounds** - looping animated backgrounds
- ✅ **Image masks** - white-on-black images with custom colors
- ✅ **Element duplication** - Ctrl+D to duplicate with smart positioning

---

## 🚀 Quick Links

### I want to...

**Start using the tool**
→ [Quick Start Guide](QUICK_START.md)

**Understand the JSON format**
→ [JSON Guide](JSON_GUIDE.md)

**Learn what features are available**
→ [Features Overview](FEATURES.md)

**Fix an issue**
→ [Troubleshooting](TROUBLESHOOTING.md)

**Understand the code**
→ [Architecture](ARCHITECTURE.md)

---

## 🎯 Typical Workflow

1. **Open folder** - Click "📁 Open Folder" and select/create a project folder
2. **Add assets** - Drag & drop images/videos onto the sidebar
3. **Create timeline blocks** - Right-click timeline or drag assets from sidebar
4. **Position & animate** - Drag elements in viewport, add keyframes
5. **Preview** - Click ▶ Play to see your animation
6. **Export** - Click "📹 Export" to render your animation as a video file

---

## 📖 File Structure

```
my_project/
├── my_project.json      ← Project data (auto-created)
└── assets/              ← Media files (auto-created)
    ├── logo.png
    ├── background.mp4
    └── character.png
```

The tool automatically:
- Creates the JSON file
- Creates the `assets/` folder
- Saves files with filenames from the JSON
- Detects changes when you click the Refresh button

---

## 🔧 System Requirements

- **Browser:** Chrome, Edge, or Opera (File System Access API required)
- **Not supported:** Firefox, Safari (no File System Access API)
- **OS:** Windows, macOS, Linux

---

## 📝 License & Credits

This tool is part of the Auto Explainer project.
Created for rapid prototyping of explainer video animations.

---

**Next Steps:** Read the [Quick Start Guide](QUICK_START.md) to begin! 🚀

