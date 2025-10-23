# Quick Start Guide

> Get up and running with Auto Explainer in 5 minutes!

---

## Step 1: Open the Tool

1. Navigate to the `auto_explainer` folder
2. **Double-click `index_v2.html`** to open in your browser
3. Make sure you're using Chrome, Edge, or Opera (Firefox/Safari don't support the File System Access API)

---

## Step 2: Open or Create a Project Folder

### Option A: Create a New Project
```
1. Click "📁 Open Folder" button (top-left)
2. Navigate to where you want to create projects
   (e.g., Documents/my_projects/)
3. Click "New Folder" in the system dialog
4. Name it (e.g., "my_first_animation")
5. Click "Select Folder" and grant permission
```

### Option B: Open an Existing Project
```
1. Click "📁 Open Folder"
2. Navigate to your project folder
3. Select it and grant permission
```

The tool will automatically:
- ✅ Create `project_name.json` if it doesn't exist
- ✅ Create `assets/` folder
- ✅ Load existing project data

---

## Step 3: Add Your First Asset

### Drag & Drop Method (Recommended)
```
1. Find an image file on your computer (PNG, JPG, etc.)
2. Drag it onto the "ASSETS & TEXT" sidebar
3. Enter an ID when prompted (e.g., "logo")
4. File is saved as logo.png in assets/ folder
```

### Manual Method
```
1. Click "Load" button next to an asset placeholder
2. Select your image file
3. It's saved with the filename from JSON
```

---

## Step 4: Add Asset to Timeline

### Method 1: Drag from Sidebar
```
1. Click and drag an asset from the sidebar
2. Drop it onto the timeline area
3. A timeline block is created at that time
```

### Method 2: Right-click Timeline
```
1. Right-click empty area in timeline
2. Select an asset from the menu
3. Block created at clicked time position
```

---

## Step 5: Position Your Asset

```
1. Click the timeline block to select it
2. Element appears in viewport with handles
3. Drag it to position
4. Use corner handles to resize
5. Use bottom handle to rotate
```

---

## Step 6: Add Animation

### Entry Animation
```
1. Select your timeline block
2. Click "🎬 Animation" button (top-right)
3. In the panel, set:
   - In Type: "fadeIn" or "slideIn"
   - Duration: 0.5 seconds
   - Easing: "easeOut"
```

### Exit Animation
```
Same panel:
   - Out Type: "fadeOut"
   - Duration: 0.5 seconds
   - Easing: "easeIn"
```

---

## Step 7: Add Keyframes (Optional)

Want to animate movement during the block?

```
1. Select the element in viewport
2. Click "📍 Position" button (timeline area)
3. Move playhead to a new time
4. Drag element to new position
5. Keyframe automatically created!
```

**Repeat for smooth animation paths!**

---

## Step 8: Preview Your Animation

```
1. Move playhead to start (time 0)
2. Click "▶ Play" button
3. Watch your animation!
4. Adjust timing/positions as needed
```

---

## Step 9: Add More Elements

Repeat steps 3-7 to add more assets:
- More images
- Videos
- Text objects (click "T+" button)

Layer them using the `layer` property (higher = on top)

---

## Common Shortcuts

| Action | Shortcut |
|--------|----------|
| Play/Pause | `Space` |
| Undo | `Ctrl+Z` |
| Redo | `Ctrl+Y` |
| Save | `Ctrl+S` |
| Delete selected | `Delete` or `Backspace` |
| Deselect | `Escape` |

---

## Tips for Success

### ✅ DO:
- Keep project folders **outside** the `auto_explainer/` directory
- Use descriptive asset IDs (e.g., "logo", "character", "background")
- Start with simple 5-10 second animations
- Save often (Ctrl+S)
- Click Refresh button after editing JSON externally

### ❌ DON'T:
- Don't put project folders inside `auto_explainer/` (causes page reloads)
- Don't use spaces or special characters in asset IDs
- Don't make your first animation too complex

---

## Example Project Structure

```
Documents/
├── auto_explainer/              ← The app
│   └── index_v2.html
│
└── my_projects/                 ← Your projects
    └── my_first_animation/
        ├── my_first_animation.json
        └── assets/
            ├── logo.png
            ├── background.jpg
            └── character.png
```

---

## Next Steps

1. **Experiment!** Try different animations, positions, and timings
2. **Read [Features](FEATURES.md)** to learn about all capabilities
3. **Check [JSON Guide](JSON_GUIDE.md)** for advanced JSON editing
4. **See [Project Setup](PROJECT_SETUP.md)** for folder organization tips

---

## Having Issues?

See the [Troubleshooting Guide](TROUBLESHOOTING.md) for common problems and solutions.

---

**You're ready to create! 🎨**

