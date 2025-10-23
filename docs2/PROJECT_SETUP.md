# Project Setup Guide

> How to organize your project folders for optimal workflow

---

## ⚠️ CRITICAL: Folder Location

**Always keep project folders OUTSIDE the `auto_explainer/` directory!**

### Why?

If you use a development server (Live Server, etc.), it watches for file changes. When project files are inside the app directory, every save triggers a page reload, which:
- Interrupts your work
- Loses unsaved state
- Causes "flash" effects
- Degrades user experience

---

## ✅ Correct Structure

```
Desktop/
├── auto_explainer/              ← The app
│   ├── index_v2.html
│   ├── js/
│   └── css/
│
└── my_projects/                 ← Your projects HERE!
    ├── showcase_demo/
    │   ├── showcase_demo.json
    │   └── assets/
    │       ├── logo.png
    │       └── background.mp4
    │
    ├── bitcoin_explainer/
    │   ├── bitcoin_explainer.json
    │   └── assets/
    │
    └── new_animation/
        ├── new_animation.json
        └── assets/
```

---

## ❌ Incorrect Structure

```
auto_explainer/
├── index_v2.html
├── js/
├── showcase_demo/           ← DON'T PUT HERE!
│   └── showcase_demo.json       (causes reloads)
└── bitcoin_explainer/       ← OR HERE!
    └── bitcoin_explainer.json   (causes reloads)
```

---

## Recommended Folder Organization

### Option 1: Documents Folder
```
Documents/
├── auto_explainer/           ← App
└── auto_explainer_projects/  ← All your projects
    ├── project_1/
    ├── project_2/
    └── project_3/
```

### Option 2: Desktop Folder
```
Desktop/
├── auto_explainer/           ← App
└── animations/               ← All your projects
    ├── intro_video/
    ├── explainer_1/
    └── demo_reel/
```

### Option 3: Dedicated Drive
```
D:/
├── Tools/
│   └── auto_explainer/       ← App
└── Projects/
    └── animations/           ← All your projects
```

---

## Auto-Created Files

When you open a folder, the tool automatically creates:

```
your_project/
├── your_project.json    ← Project data (auto-created)
└── assets/              ← Media folder (auto-created)
```

The tool names the JSON file after the folder name.

---

## Naming Conventions

### Folder Names
- ✅ `my_animation` (underscores)
- ✅ `showcase-demo` (hyphens)
- ✅ `IntroVideo` (camelCase)
- ❌ `my animation` (spaces - avoid!)
- ❌ `demo@2024` (special characters - avoid!)

### Asset Filenames
Assets are saved with filenames from the JSON `filename` property:
- If JSON says `"filename": "logo.png"`, file is saved as `logo.png`
- Original filename doesn't matter
- Tool handles renaming automatically

---

## Working with External Editors

You can edit the JSON directly in VS Code or any text editor!

```
1. Open project in Auto Explainer
2. Open the JSON in VS Code
3. Make changes and save
4. Click refresh button (🔄) in Auto Explainer sidebar
5. Changes appear in UI
```

**Click the refresh button to load external changes!**

---

## Multiple Projects

You can work on multiple projects by switching folders:

```
1. Click "📁 Open Folder"
2. Select different project
3. Previous project auto-saves
4. New project loads
```

No need to close the tab - just switch folders!

---

## Backing Up Projects

Since projects are just folders with files, backup is easy:

### Option 1: Manual Copy
```bash
# Copy entire project folder
cp -r my_project/ backups/my_project_2024-01-15/
```

### Option 2: Version Control
```bash
# Initialize git in project folder
cd my_project/
git init
git add .
git commit -m "Initial version"
```

### Option 3: Cloud Sync
Put your projects folder in:
- Google Drive
- Dropbox
- OneDrive
- iCloud

---

## Sharing Projects

To share a project with someone:

```
1. Zip the entire project folder:
   - project_name.json
   - assets/ (with all files)
   
2. Send the zip file

3. Recipient:
   - Extracts zip
   - Opens folder in Auto Explainer
   - Everything works!
```

---

## Troubleshooting Folder Issues

### Issue: Page reloads on every save
**Solution:** Move project folder outside `auto_explainer/`

### Issue: Assets not loading
**Solution:** Check that assets are in the `assets/` subfolder

### Issue: Changes not saving
**Solution:** Ensure folder permissions allow writing

### Issue: JSON file not created
**Solution:** Grant folder access permission when prompted

---

## Best Practices

### ✅ DO:
- Keep projects outside app directory
- Use descriptive folder names
- Organize projects in a dedicated folder
- Backup important projects
- Use version control for complex projects

### ❌ DON'T:
- Put projects inside `auto_explainer/`
- Use spaces or special characters in folder names
- Mix app files and project files
- Delete the `assets/` folder manually
- Edit files while tool is open (use auto-refresh)

---

## Quick Test

To verify your setup is correct:

```
1. Open project in Auto Explainer
2. Click an element in viewport
3. Move it slightly
4. Watch for page reload
   - ✅ No reload = correct setup
   - ❌ Page reloads = move folder outside app
```

---

**Next:** Learn about all [Features](FEATURES.md) available!

