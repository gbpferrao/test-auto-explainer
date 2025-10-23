# Troubleshooting Guide

> Common issues and their solutions

---

## Browser Compatibility

### Issue: "File System Access API not supported"

**Cause:** Your browser doesn't support the File System Access API

**Solution:**
- ✅ Use Chrome, Edge, or Opera (Chromium-based browsers)
- ❌ Firefox and Safari don't support this API yet
- Update your browser to the latest version

---

## Project Loading

### Issue: Project won't load / blank screen

**Possible causes & solutions:**

1. **JSON syntax error**
   - Open JSON in VS Code
   - Look for red squiggly lines
   - Fix syntax (missing commas, quotes, brackets)
   - Check browser console (F12) for error details

2. **Missing required fields**
   - Ensure `project`, `assets`, and `timeline` sections exist
   - Check that `project.viewport` is defined
   - Verify all asset IDs are unique

3. **Folder permissions**
   - Re-open folder and grant permissions
   - Try a different folder location

---

## Page Reloading

### Issue: Page reloads every time I make a change

**Cause:** Project folder is inside `auto_explainer/` directory and dev server is watching it

**Solution:**
1. Move project folder outside `auto_explainer/`
2. Or configure Live Server to ignore project folders
3. Or use a different server without auto-reload

See [Project Setup Guide](PROJECT_SETUP.md) for details.

---

## Assets Not Loading

### Issue: Assets show as placeholders / won't load

**Possible causes & solutions:**

1. **File not in assets folder**
   - Check that file exists in `project_folder/assets/`
   - Filename must match exactly (case-sensitive)

2. **Wrong filename in JSON**
   - JSON says `"filename": "logo.png"`
   - File must be named `logo.png` (not `Logo.png` or `LOGO.PNG`)

3. **File format not supported**
   - Images: Use PNG, JPG, JPEG, GIF, WebP
   - Videos: Use MP4, WebM
   - Avoid: BMP, TIFF, AVI, MOV

4. **File not refreshed yet**
   - Click "🔄 Refresh" button in sidebar to reload assets
   - Or reload the entire project with Ctrl+R

---

## Viewport Issues

### Issue: Can't see my element in viewport

**Possible causes:**

1. **Element is outside viewport bounds**
   - Check `position.x` and `position.y` values
   - Viewport is from (0,0) to (width, height)
   - Use anchor points to center: `"anchorX": 0.5, "anchorY": 0.5`

2. **Element is behind others**
   - Check `layer` property
   - Higher layer = on top
   - Try setting to a high number like 100

3. **Element opacity is 0**
   - Check `opacity` property
   - Should be between 0.0 and 1.0

4. **Element size is too small**
   - Check `size.width` and `size.height`
   - Minimum is 20px

---

## Timeline Issues

### Issue: Timeline block won't appear

**Possible causes:**

1. **Time is outside project duration**
   - `startTime` and `endTime` must be within project duration
   - Check `project.duration` value

2. **startTime >= endTime**
   - `startTime` must be less than `endTime`
   - Example: start=2, end=5 ✅ | start=5, end=2 ❌

3. **Asset ID doesn't exist**
   - Check that `assetId` matches an entry in `assets` array
   - IDs are case-sensitive

---

## Keyframe Issues

### Issue: Keyframes not animating

**Possible causes:**

1. **Only one keyframe exists**
   - Need at least 2 keyframes to interpolate
   - Add keyframes at different times

2. **Keyframes have same time**
   - Each keyframe must have unique time value
   - Duplicate times cause unexpected behavior

3. **Keyframe times outside block range**
   - Keyframes must be within `startTime` and `endTime`
   - Example: block 0-10s, keyframe at 15s won't work

4. **Wrong property**
   - Check that keyframe property exists
   - Valid: `position`, `size`, `rotation`, `opacity`

---

## Animation Issues

### Issue: Entry/exit animations not playing

**Possible causes:**

1. **Animation type is "none"**
   - Check `animation.in.type` and `animation.out.type`
   - Set to `fadeIn`, `slideIn`, etc.

2. **Duration is 0**
   - Check `animation.in.duration`
   - Should be > 0 (e.g., 0.5 seconds)

3. **Block too short for animation**
   - If block is 1s and animation is 2s, it won't complete
   - Make block longer or animation shorter

---

## Text Issues

### Issue: Text not showing / looks weird

**Possible causes:**

1. **Font not available**
   - Use web-safe fonts: Arial, Times, Courier, etc.
   - Or use Google Fonts-style font families

2. **Text color same as background**
   - Check `style.color` vs `project.backgroundColor`
   - Use contrasting colors

3. **Text size too small**
   - Check `style.fontSize`
   - Minimum readable size is ~16px

4. **Text outside text box**
   - Check `size.width` and `size.height`
   - Make text box larger
   - Or reduce `style.fontSize`

---

## Video Issues

### Issue: Video not playing

**Possible causes:**

1. **Video codec not supported**
   - Use H.264 codec for MP4
   - Or VP8/VP9 for WebM
   - Avoid proprietary codecs

2. **Video file corrupted**
   - Try playing video in media player
   - Re-encode if necessary

3. **Video too large**
   - Large videos (>100MB) may be slow
   - Compress or reduce resolution

### Issue: Video playback stuttering

**Solutions:**
- Reduce video resolution (720p instead of 4K)
- Compress video file
- Close other browser tabs
- Use MP4 instead of WebM

---

## Playback Issues

### Issue: Playback doesn't start / plays only when switching tabs

**Cause:** Timing mismatch between `performance.now()` and `requestAnimationFrame` timestamp

**Symptoms:**
- Press play, nothing happens
- Switch to another tab and back, it plays a tiny bit then stops
- Playhead doesn't advance smoothly

**Solution:**
- In `togglePlayback()`, set `state.lastFrameTime = 0` (not `performance.now()`)
- In `animate()`, initialize `lastFrameTime` on first frame using the RAF timestamp
- Clamp `deltaTime` to prevent huge jumps from inactive tabs

**Technical details:**
- `requestAnimationFrame` passes a DOMHighResTimeStamp to the callback
- Using `performance.now()` separately can cause sync issues
- Must use the RAF timestamp consistently throughout the animation loop

---

## Performance Issues

### Issue: Playback is extremely laggy or choppy

**Cause:** Console logs running on every frame (debug statements left in code)

**Solution:**
- Remove or comment out any `console.log()` statements in viewport rendering code
- Especially check `updateViewport()`, `updateViewportBackground()`, and `animate()` functions
- Console logging is very expensive and can reduce playback from 60 FPS to 2-3 FPS

**Technical details:**
- The app renders at 30-60 FPS during playback
- Each console.log can take 10-50ms, blocking the render loop
- Even one console.log per frame can cause severe lag

### Issue: Tool feels slow / laggy

**Solutions:**

1. **Reduce project complexity**
   - Fewer simultaneous elements
   - Smaller images/videos
   - Fewer keyframes

2. **Close other tabs/apps**
   - Free up system resources

3. **Use smaller viewport**
   - 720p instead of 1080p for editing
   - Scale up for final export

4. **Disable browser extensions**
   - Some extensions slow down apps

---

## Saving Issues

### Issue: Changes not saving

**Possible causes:**

1. **No write permissions**
   - Check folder permissions
   - Try a different folder

2. **Disk full**
   - Check available disk space
   - Free up space if needed

3. **Auto-save failed**
   - Press `Ctrl+S` to manually save
   - Check console (F12) for errors

---

## Debug Mode

To enable detailed logging:

```javascript
// In browser console (F12):
window.toggleDebugPanel()
```

This shows:
- All state changes
- File operations
- Rendering updates
- Error messages

**Very helpful for diagnosing issues!**

---

## Getting More Help

1. **Check browser console** (F12) for error messages
2. **Enable debug panel** to see detailed logs
3. **Test with a simpler project** to isolate the issue
4. **Try a different browser** to rule out browser issues
5. **Check JSON syntax** in a validator

---

## Known Limitations

These are current limitations (not bugs):

- **No audio support** - Videos are muted
- **No video trimming** - Videos play from start
- **No undo for external changes** - Only tracks changes made in UI
- **No multi-select** - Can only select one element at a time
- **No copy/paste** - Coming in future version

---

**Still having issues?** Check the [JSON Guide](JSON_GUIDE.md) for correct format specifications.

