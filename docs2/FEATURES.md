# Features Overview

> Complete guide to all implemented features in Auto Explainer v2

---

## Table of Contents

1. [Core Features](#core-features)
2. [Asset Management](#asset-management)
3. [Timeline & Playback](#timeline--playback)
4. [Viewport Transformations](#viewport-transformations)
5. [Multi-Element Operations](#multi-element-operations) ⭐ NEW
6. [Animations](#animations)
7. [Keyframe System](#keyframe-system)
8. [Text Objects](#text-objects)
9. [Video Support](#video-support)
10. [Video Export](#video-export)
11. [Undo/Redo & History](#undoredo--history)
12. [Project Management](#project-management)
13. [User Interface](#user-interface) ⭐ NEW

---

## Core Features

### Element Duplication

**Quick duplicate with Ctrl+D** - Clone any selected timeline element instantly.

**What gets copied:**
- All properties (position, size, rotation, opacity, etc.)
- All keyframes with timing preserved
- Text content (for text objects)
- Asset reference (shares the same underlying asset)
- Entrance, loop, and exit animations

**Smart positioning:**
- **Viewport**: Duplicates are offset by 20px in both X and Y for easy distinction
- **Position keyframes**: All position keyframe values are delta-ed by 20px (maintains relative animation)
- **Timeline**: Same start/end time as original (appears at exact same time)
- **Stacking**: Timeline automatically stacks overlapping blocks vertically
- **Other keyframes**: Size, rotation, opacity keyframes keep original values

**Use case:**
Create multiple copies of animated elements (like repeated text or images) without re-importing assets or manually recreating animations.

---

### File System Access
- **No server required** - Runs entirely in browser
- **Direct folder access** - Edit files on your computer directly
- **Auto-save** - Changes save automatically
- **Manual refresh** - Click refresh button to reload external changes

### Supported Browsers
- ✅ Chrome (recommended)
- ✅ Edge
- ✅ Opera
- ❌ Firefox (no File System Access API)
- ❌ Safari (no File System Access API)

---

## Asset Management

### Supported File Types

#### Images
- **Formats:** PNG, JPG, JPEG, GIF, WebP
- **Use cases:** Logos, characters, icons, backgrounds
- **Max recommended size:** 4096x4096 pixels

#### Videos
- **Formats:** MP4 (H.264), WebM (VP8/VP9)
- **Use cases:** Video clips, animated backgrounds
- **Max recommended size:** 1920x1080, <100MB

### Adding Assets

#### Method 1: Floating Action Toolbar ⭐ NEW (Recommended)
```
1. Click one of the floating buttons:
   - 📝 Add Text
   - 🖼️ Add Image
   - 📹 Add Video
   - 🎭 Add Mask
2. Element appears in timeline/viewport/sidebar as placeholder
3. Optionally name the asset (or keep auto-generated ID)
4. Load file later via sidebar when ready
```

**Placeholder Workflow:**
- Assets can exist without files assigned
- Shows in timeline/viewport/sidebar immediately
- Click "Load" in sidebar when ready to assign file
- Perfect for planning layout before gathering assets
- Can rename assets via double-click on name in sidebar

#### Method 2: Drag & Drop
```
1. Drag image/video from file explorer
2. Drop onto sidebar
3. Enter asset ID (e.g., "logo")
4. File saved automatically to assets/ folder
```

#### Method 3: Load Button
```
1. Click "Load" button on existing placeholder
2. Select file
3. File saved with filename from JSON
```

### Asset Types

#### Regular Images
Standard images displayed as-is
```json
{
  "id": "logo",
  "type": "image",
  "filename": "logo.png"
}
```

#### Image Masks (Colored)
White-on-black images that become a chosen color
```json
{
  "id": "star",
  "type": "image",
  "maskMode": true,
  "color": "#FFD700"
}
```

**Use cases:**
- Stylized graphics
- Icon sets with consistent colors
- Hand-drawn elements
- Quick recoloring without image editing

**How to create:**
1. Create white drawing on black background
2. Save as PNG
3. Set `maskMode: true` and `color: "#hexcolor"`

#### Background Videos
Looping videos behind all content
```json
{
  "id": "bg_video",
  "type": "video",
  "isBackground": true,
  "loop": true
}
```

---

## Timeline & Playback

### Timeline Blocks

Each block represents an element's visibility window:
- **Start Time** - When element appears
- **End Time** - When element disappears
- **Duration** - Automatically calculated

### Creating Timeline Blocks

#### Method 1: Drag from Sidebar
```
1. Click and drag asset from sidebar
2. Drop onto timeline at desired time
3. Block created automatically
```

#### Method 2: Right-click Timeline
```
1. Right-click timeline at desired time
2. Select asset from menu
3. Block created at that time
```

### Editing Timeline Blocks

- **Move block:** Drag left/right
- **Resize duration:** Drag left/right edges
- **Delete block:** Select and press Delete
- **Select block:** Click on it

### Playback Controls

- **Play/Pause:** Space bar or ▶ button
- **Scrub:** Drag playhead left/right
- **Time display:** Shows current time and total duration

### FPS and Frame Navigation ⭐ NEW

**Project FPS Selection:**
Choose your project's frame rate (24, 25, 30, or 60 FPS):
- Affects timeline snapping
- Keyframes snap to frame positions
- Playback advances frame-by-frame
- Export uses selected FPS

**Frame Navigation:**
- **<** button - Go to previous frame
- **>** button - Go to next frame
- **Frame input** - Type frame number to jump to specific frame
- **Frame counter** - Shows current frame / total frames

**Timecode Display:**
- Format: `mm:ss:ff` (minutes:seconds:frames)
- Shows: `00:05:15` (5 seconds, 15 frames at 30 FPS)
- **Click to type** - Input timecode to jump to specific time
- Total duration also displayed in timecode format

**Timeline Snapping:**
- Playhead snaps to frame positions (discrete, not continuous)
- Keyframe diamonds auto-snap to nearest frame
- Non-destructive - changing FPS doesn't corrupt keyframe data

### Timeline Customization ⭐ NEW

**Adjustable Height:**
- **Drag top edge** of timeline to resize vertically
- Range: 150px - 600px
- Persists across sessions (localStorage)
- Viewport auto-adjusts to remaining space
- Floating toolbar repositions automatically

**Lane Stacking:**
- Timeline blocks for the same asset automatically stack vertically
- Prevents visual overlaps when element appears multiple times
- Each "sub-lane" has proper spacing
- Keyframe diamonds follow stacked positions

**Timeline Panning:**
- **Right-click drag** - Pan timeline (doesn't drag blocks)
- **Middle-click drag** - Alternative panning method
- **Left-click drag** - Drag blocks/keyframes (normal behavior)

**Timeline Ruler:**
- Fixed at top of timeline (high z-index)
- Always visible above lane blocks
- Shows time markers and grid

---

## Viewport Transformations

### Selecting Elements

#### Single Selection
- Click element in viewport/timeline/sidebar to select
- Selection shows **blue outline** with handles
- Info display shows dimensions and position

#### Multi-Selection ⭐ NEW
- **Shift+Click** to add elements to selection
- Selected elements show **orange outlines** (no handles)
- Select from viewport, timeline, or sidebar
- Works across all UI components simultaneously

#### Selection Behaviors
- **ESC key** - Deselect all
- **Click empty space** - Deselect all (viewport, sidebar, topbar)
- **Timeline empty clicks** - Keep selection (doesn't deselect)
- **Out-of-frame indicators** - Selected elements not in current frame show **dashed outlines** at their position

### Transformations

#### Position (Drag)
```
1. Click and hold element
2. Drag to new position
3. Release to apply
4. Updates position.x and position.y
```

#### Resize (Corner Handles)
```
1. Drag any corner handle
2. Element scales from anchor point
3. Release to apply
4. Updates size.width and size.height
```

#### Rotate (Bottom Handle)
```
1. Drag rotation handle (bottom circle)
2. Element rotates around anchor point
3. Release to apply
4. Updates rotation value (0-360°)
```

### Anchor Points

Control the transformation origin:
- `anchorX: 0.5, anchorY: 0.5` - Center (default)
- `anchorX: 0, anchorY: 0` - Top-left
- `anchorX: 1, anchorY: 1` - Bottom-right

**Affects:** Rotation, scaling, positioning

---

## Multi-Element Operations ⭐ NEW

### Selecting Multiple Elements

Use **Shift+Click** to build your selection:
```
1. Click first element → Blue outline (selected)
2. Shift+Click second element → Both show orange outlines
3. Shift+Click more elements → All selected elements stay orange
4. Shift+Click selected element → Removes from selection
```

**Visual Feedback:**
- **Blue outline** = Single selected element with handles
- **Orange outline** = Multiple selected elements (no handles)
- **Dashed outline** = Selected element not visible in current frame

### Multi-Element Dragging

**Viewport:**
- **Normal drag** - Moves all selected elements together
- **Ctrl+Shift+Drag** - Delta mode: offsets all position keyframes by drag amount

**Timeline:**
- **Drag any selected block** - All selected blocks move together
- Maintains relative timing between blocks
- Shows dragging state on all selected blocks
- History shows "Moved X timeline blocks"

### Multi-Element Animation Editing

Apply animations to all selected elements at once:
```
1. Select multiple elements (Shift+Click)
2. Click 🎬 Animate button
3. Panel shows "(Editing X elements)"
4. Change animation settings
5. Click Save → Applied to all selected elements
```

**Supported:**
- Entry animations (fadeIn, slideIn, scaleIn)
- Exit animations (fadeOut, slideOut, scaleOut)
- Loop animations (continuous/blocky swing, jitter)
- All animation properties (duration, easing, direction)

### Multi-Mask Color Editing

Change color for all selected masks:
```
1. Select multiple mask assets (Shift+Click)
2. Click color picker on any selected mask
3. Choose new color
4. All selected masks update instantly
```

**Use case:** Quickly change color scheme across multiple icons or graphics

### Multi-Text Formatting

Edit formatting for all selected text elements:
```
1. Select multiple text objects (Shift+Click)
2. Click ✏️ Edit Text button
3. Panel shows "(Editing X texts)"
4. Content field is hidden (formatting only mode)
5. Change formatting (font, size, color, alignment, etc.)
6. Click Save → Formatting applied to all texts
```

**Formatting Options:**
- Font family, size, weight, style
- Text color and background color
- Text alignment and decoration
- Line height and letter spacing
- Padding and border radius

**Note:** Text content is NOT changed in multi-edit mode - only visual formatting

### Multi-Selection Tips

**Best Practices:**
- Select similar elements for consistent editing
- Use multi-animation to create synchronized effects
- Multi-mask color for quick recoloring
- Multi-text formatting for consistent typography
- Check orange outlines to verify selection

**Limitations:**
- No unified rotation/scaling (individual transforms only)
- Text content not editable in multi-mode
- Only Ctrl+Shift+Drag for position delta

---

## Animations

### Entry Animations (In)

Play when element appears:

| Type | Description |
|------|-------------|
| `fadeIn` | Opacity 0→1 |
| `slideIn` | Slide from direction |
| `scaleIn` | Scale from 0→100% |
| `none` | No animation |

### Exit Animations (Out)

Play when element disappears:

| Type | Description |
|------|-------------|
| `fadeOut` | Opacity 1→0 |
| `slideOut` | Slide to direction |
| `scaleOut` | Scale to 0 |
| `none` | No animation |

### Loop Animations (Continuous) ⭐ NEW

Play continuously while element is visible (after entrance, before exit):

| Type | Description |
|------|-------------|
| `none` | No loop animation |
| `continuous_swing` | Smooth sine-wave rotation swing |
| `blocky_swing` | Stepped rotation swing (discrete angles) |
| `blocky_jitter` | Blocky swing + random position offset |

**Parameters:**
```json
{
  "animation": {
    "loop": {
      "type": "continuous_swing",
      "cycleDuration": 2.0,  // seconds per cycle
      "minAngle": -5,         // minimum rotation angle
      "maxAngle": 5,          // maximum rotation angle
      "maxOffset": 3          // max position offset (jitter only)
    }
  }
}
```

**Use cases:**
- Floating/hovering effects
- Attention-grabbing wobble
- Organic movement
- Visual interest during long visibility

### Animation Properties

```json
{
  "animation": {
    "in": {
      "type": "slideIn",
      "direction": "left",  // left, right, up, down (slideIn/Out only)
      "duration": 0.5,      // seconds
      "easing": "easeOut"   // linear, easeIn, easeOut, easeInOut
    },
    "out": {
      "type": "fadeOut",
      "duration": 0.3,
      "easing": "easeIn"
    }
  }
}
```

### Easing Functions

| Easing | Effect |
|--------|--------|
| `linear` | Constant speed throughout |
| `easeIn` | Slow start, fast end |
| `easeOut` | Fast start, slow end |
| `easeInOut` | Slow start and end, fast middle |

---

## Keyframe System

### What are Keyframes?

Keyframes define property values at specific times. The tool interpolates smoothly between keyframes.

### Supported Properties

- **Position** - Animate movement
- **Size** - Animate scaling
- **Rotation** - Animate spinning
- **Opacity** - Animate transparency

### Creating Keyframes

#### Method 1: Quick Actions (Recommended)
```
1. Select element in viewport
2. Move playhead to desired time
3. Click property button (📍 Position, 📏 Size, etc.)
4. Keyframe created at current element state
```

#### Method 2: Manual Transform
```
1. Select element
2. Move playhead to time
3. Transform element (drag, resize, rotate)
4. Keyframe auto-created on release
```

### Editing Keyframes

#### Dragging Keyframes
```
1. Click and hold keyframe diamond (◆)
2. Drag left/right to change time
3. Release to apply
4. Keyframe stays within block's time range
```

#### Delta Mode: Offset ALL Keyframes
```
Hold Ctrl while dragging/resizing/rotating to offset ALL keyframes at once:

Normal drag: Creates/updates keyframe at current time
Ctrl+Drag: Offsets ALL position keyframes by the same amount

This is perfect for:
- Adjusting overall position after animation is complete
- Moving an entire animated sequence without changing relative motion
- Tweaking size/rotation across all keyframes simultaneously
```

**How it works:**
- **Ctrl+Drag element** - Offsets all position keyframes
- **Ctrl+Drag corner** - Offsets all size keyframes (and position if corner affects it)
- **Ctrl+Drag rotation handle** - Offsets all rotation keyframes

**Use case example:**
You've animated a logo moving from left to right with 5 keyframes, but realize it needs to be 100px higher. Instead of manually adjusting all 5 keyframes, just hold Ctrl and drag up - all keyframes move together!

#### Deleting Keyframes
```
1. Click keyframe to select
2. Press Delete key
(Coming soon - currently edit JSON manually)
```

### Keyframe Lanes

Keyframes appear in expandable lanes below timeline blocks:
- **P** - Position keyframes
- **S** - Size keyframes  
- **R** - Rotation keyframes
- **O** - Opacity keyframes

Click property toggle to show/hide lanes.

---

## Text Objects

### Creating Text

```
1. Click "T+" button (top bar)
2. Enter text in editor
3. Choose styling options
4. Click "Save"
5. Text appears in viewport and timeline
```

### Text Styling Options

#### Typography
- **Font Family:** 20+ web-safe fonts
- **Font Size:** 8-200px
- **Font Weight:** normal, bold, 300, 600, 900
- **Font Style:** normal, italic
- **Text Decoration:** none, underline, line-through

#### Colors & Background
- **Text Color:** Any hex color
- **Background Color:** Solid color or transparent
- **Padding:** 0-100px
- **Border Radius:** 0-100px for rounded backgrounds

#### Layout
- **Text Align:** left, center, right, justify
- **Line Height:** 0.5-3.0 multiplier
- **Letter Spacing:** -5 to +20 pixels

#### Effects
- **Text Shadow:** CSS shadow syntax
- **Auto-resize:** Fit text box to content

### Editing Text

#### Method 1: Inline Editing (Sidebar) ⭐ NEW
```
1. Find text element in sidebar
2. Click on the text preview
3. Edit directly in place
4. Press Enter or click outside to save
```

**Quick content updates without opening the full editor!**

#### Method 2: Double-click (Viewport)
```
Double-click text in viewport → Editor opens
```

#### Method 3: Edit Button
```
Select text → Click ✏️ Edit button
```

### Text Features

- ✅ **Inline sidebar editing** ⭐ NEW - Quick content changes
- ✅ **Multiline support** - Use `\n` for line breaks
- ✅ **All transformations** - Drag, resize, rotate
- ✅ **All animations** - Fade, slide, scale
- ✅ **All keyframes** - Position, size, rotation, opacity
- ✅ **Preview mode** - See changes before saving

---

## Video Support

### Video as Timeline Element

Regular video clips in timeline:
```json
{
  "assetId": "intro_clip",
  "type": "video",
  "loop": false,
  "startTime": 0,
  "endTime": 10
}
```

**Features:**
- Synced with timeline playback
- Plays portion of video during block
- Supports all transformations
- Supports animations

### Video as Background

Looping animated background:
```json
{
  "id": "bg_video",
  "type": "video",
  "isBackground": true,
  "loop": true
}
```

**Features:**
- Automatically loops
- Always behind other elements (layer -1)
- Fills entire viewport
- Only one background at a time

### Video Playback

- Videos sync with timeline time
- Muted by default (no audio support)
- Loop property controls looping
- Time offset from timeline startTime

### Video Formats

**Recommended:**
- MP4 with H.264 codec
- Resolution: 720p or 1080p
- Bitrate: <10 Mbps

**Also works:**
- WebM with VP8/VP9

**Not recommended:**
- Very large files (>100MB)
- 4K videos (performance issues)
- Exotic codecs

---

## Video Export

### Frame-by-Frame Rendering

Export your animation as a high-quality video file.

**How to Export:**
```
1. Click "📹 Export" button (top bar)
2. Configure export settings:
   - Resolution (720p, 1080p, 4K, or custom)
   - Frame rate (24, 30, or 60 FPS)
   - Format (WebM or MP4)
3. Click "Export"
4. Wait for rendering to complete
5. Video downloads automatically
```

### Export Settings

#### Resolution Options
- **1280x720** (HD) - Smaller file size, faster rendering
- **1920x1080** (Full HD) - Standard quality, recommended
- **3840x2160** (4K) - Maximum quality, larger file size
- **Custom** - Any resolution you need

#### Frame Rates
- **24 FPS** - Cinematic look, smaller file size
- **30 FPS** - Standard video, good balance (recommended)
- **60 FPS** - Smooth motion, larger file size

#### Formats
- **WebM (VP9)** - Best quality, modern format, smaller files
- **MP4 (H.264)** - Experimental, better compatibility

### How It Works

**Frame-by-Frame Process:**
1. Steps through each frame of your animation
2. Renders each frame at full quality (no dropped frames)
3. Captures the viewport at export resolution
4. Encodes frames into video format
5. Downloads completed video

**Advantages:**
- ✅ Perfect quality - no dropped frames
- ✅ Faster than real-time rendering
- ✅ Independent of playback performance
- ✅ Accurate timing
- ✅ High resolution support (up to 4K)

### Export Tips

**Best Practices:**
- Use 1080p @ 30 FPS for most cases
- Use 60 FPS only for smooth motion animations
- Test with short clips first
- Close other programs during export for best performance

**Estimated Export Times:**
- 10 second video @ 30 FPS: ~3 seconds
- 30 second video @ 30 FPS: ~9 seconds
- 60 second video @ 30 FPS: ~18 seconds

*(Times vary based on complexity and resolution)*

---

## Undo/Redo & History

### Undo/Redo System

- **Undo:** `Ctrl+Z` - Revert last change
- **Redo:** `Ctrl+Y` or `Ctrl+Shift+Z` - Reapply change
- **History depth:** Up to 50 snapshots
- **What's tracked:** All edits made in UI

### What is Tracked

✅ **Tracked:**
- Element transformations
- Timeline block changes
- Asset additions/deletions
- Text edits
- Keyframe changes
- Animation settings

❌ **Not tracked:**
- External JSON edits
- Asset file replacements
- Folder operations

### History Panel

View all changes:
```
1. Click "📜" button (top bar)
2. See list of all changes
3. Click any entry to jump to that state
4. Current state highlighted
```

**Features:**
- Timestamps for each change
- Color-coded indicators
- One-click state restoration
- Shows unsaved changes

---

## Project Management

### Creating Projects

```
1. Click "📁 Open Folder"
2. Create/select folder
3. Grant permissions
4. Tool auto-creates:
   - project_name.json
   - assets/ folder
```

### Opening Projects

```
1. Click "📁 Open Folder"
2. Select existing project folder
3. Grant permissions
4. Project loads automatically
```

### Saving

#### Auto-save
- Saves automatically after changes
- Indicator shows save status
- Debounced (waits 500ms after last change)

#### Manual save
- `Ctrl+S` - Force immediate save
- Useful when auto-save seems slow

### Project Structure

```
project_folder/
├── project_name.json    ← All project data
└── assets/              ← All media files
    ├── logo.png
    ├── background.mp4
    └── character.png
```

### Manual Refresh

Use the refresh button to reload external changes:
- Click "🔄" button in asset sidebar
- Detects JSON modifications
- Detects asset additions/deletions
- Reloads UI with fresh data

**Use case:**
- Edit JSON in VS Code
- Save changes
- Click refresh button in Auto Explainer
- UI updates with external changes

---

## Tips & Best Practices

### Performance

- Use 720p viewport for editing, 1080p for export
- Compress large images/videos
- Limit simultaneous elements to <20
- Use fewer keyframes for better performance

### Workflow

- Save often (Ctrl+S)
- Use descriptive asset IDs
- Organize layers: background (0-5), content (10-20), text (30+)
- Test with short durations first (5-10s)

### Keyframes

- Start simple with 2-3 keyframes
- Use easeOut for natural movement
- Add keyframes at important moments
- Test playback frequently

### Text

- Use web-safe fonts for compatibility
- High contrast for readability
- Padding for better backgrounds
- Test different sizes

---

## User Interface

### Floating Collapsible Panels ⭐ NEW

**Context-sensitive panels** appear when elements are selected:

**Location:**
- Float in the viewport area (not attached to sidebar)
- Stack vertically: Animate button above Edit Text button
- Auto-position to top of available viewport space

**Behavior:**
- Click button to expand/collapse panel
- Expanding one panel collapses the other
- Panel extends from button (unified visual)
- Dark/gray theme (matches overall design)

**Panels Available:**
- **🎬 Animate** - Appears for any selected element(s)
  - Entry, exit, and loop animations
  - Shows "(Editing X elements)" for multi-selection
- **✏️ Edit Text** - Appears only when text selected
  - Shows "(Editing X texts)" for multi-selection
  - Content field hidden in multi-edit (formatting only)

**Features:**
- Click outside to close
- ESC to close
- Consistent width and styling
- Save button for both panels

### Notifications

Visual feedback for user actions appears in the bottom-right of the viewport:

**Location:** Above timeline, bottom-right corner

**Types:**
- ✅ **Success** (green) - Saves, exports, asset additions
- ❌ **Error** (red) - Failed operations, validation errors
- ℹ️ **Info** (blue) - Undo/redo, status updates

**Features:**
- Auto-dismiss after 1-3 seconds
- Stack vertically when multiple notifications appear
- Slide in/out animations
- Automatically adjusts position when timeline is resized

**Examples:**
- `✓ Saved` - Project auto-saved
- `↶ Undo` - Undo performed
- `✓ Added: logo` - Asset added successfully
- `✅ Video exported successfully!` - Export complete

---

## Known Limitations

Current limitations (not bugs):

- ❌ No audio support
- ❌ No video trimming
- ❌ No copy/paste between projects
- ❌ No permanent grouping
- ❌ No unified multi-element rotate/scale
- ❌ Firefox/Safari not supported

---

## Coming Soon

Features planned for future versions:

- 📋 Copy/paste between projects
- 📁 Permanent element grouping
- 🔄 Multi-element unified transforms
- ✂️ Video trimming
- 🎵 Audio support
- 🎨 Filters & effects
- 📱 Mobile support

---

**Ready to dive deeper?** Check the [JSON Guide](JSON_GUIDE.md) for complete format reference!

