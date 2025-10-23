/* ============================================
   VIDEO EXPORT - Frame-by-frame rendering
   ============================================ */

import { state } from '../state/state.js';
import { getById, showNotification } from '../utils/dom.js';
import { updateViewport } from '../viewport/viewport.js';
import { updatePlayhead } from '../timeline/playhead.js';

/**
 * Export configuration
 */
const EXPORT_CONFIG = {
    fps: 30,
    width: 1920,
    height: 1080,
    videoBitrate: 8000000, // 8 Mbps
    quality: 0.95
};

/**
 * Show export dialog
 */
export function showExportDialog() {
    if (!state.project) {
        alert('Please load a project first');
        return;
    }

    const duration = state.project.project.duration;
    const frameCount = Math.ceil(duration * EXPORT_CONFIG.fps);
    
    const existingDialog = document.getElementById('exportDialog');
    if (existingDialog) existingDialog.remove();

    const dialog = document.createElement('div');
    dialog.id = 'exportDialog';
    dialog.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: var(--bg-primary); border: 1.4px solid var(--border-color); border-radius: 4.2px; padding: 21px; max-width: 420px; width: 90%;">
                <h3 style="margin: 0 0 14px 0; font-size: 14px;">📹 Export Video</h3>
                
                <div style="margin-bottom: 14px;">
                    <label style="display: block; margin-bottom: 5.6px; font-size: 9.8px; color: var(--text-secondary);">Resolution</label>
                    <select id="exportResolution" style="width: 100%; padding: 5.6px; border: 1px solid var(--border-color); border-radius: 2.8px; background: var(--bg-darker); color: var(--text-primary); font-size: 9.8px;">
                        <option value="1920x1080">1920x1080 (Full HD)</option>
                        <option value="1280x720">1280x720 (HD)</option>
                        <option value="3840x2160">3840x2160 (4K)</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                <div id="customResolution" style="display: none; margin-bottom: 14px; gap: 7px; grid-template-columns: 1fr 1fr;">
                    <div>
                        <label style="display: block; margin-bottom: 5.6px; font-size: 9.8px; color: var(--text-secondary);">Width</label>
                        <input type="number" id="exportWidth" value="1920" min="320" max="7680" style="width: 100%; padding: 5.6px; border: 1px solid var(--border-color); border-radius: 2.8px; background: var(--bg-darker); color: var(--text-primary); font-size: 9.8px;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5.6px; font-size: 9.8px; color: var(--text-secondary);">Height</label>
                        <input type="number" id="exportHeight" value="1080" min="240" max="4320" style="width: 100%; padding: 5.6px; border: 1px solid var(--border-color); border-radius: 2.8px; background: var(--bg-darker); color: var(--text-primary); font-size: 9.8px;">
                    </div>
                </div>

                <div style="margin-bottom: 14px;">
                    <label style="display: block; margin-bottom: 5.6px; font-size: 9.8px; color: var(--text-secondary);">Frame Rate (FPS)</label>
                    <select id="exportFps" style="width: 100%; padding: 5.6px; border: 1px solid var(--border-color); border-radius: 2.8px; background: var(--bg-darker); color: var(--text-primary); font-size: 9.8px;">
                        <option value="24">24 FPS (Cinematic)</option>
                        <option value="30" selected>30 FPS (Standard)</option>
                        <option value="60">60 FPS (Smooth)</option>
                    </select>
                </div>

                <div style="margin-bottom: 14px;">
                    <label style="display: block; margin-bottom: 5.6px; font-size: 9.8px; color: var(--text-secondary);">Format</label>
                    <select id="exportFormat" style="width: 100%; padding: 5.6px; border: 1px solid var(--border-color); border-radius: 2.8px; background: var(--bg-darker); color: var(--text-primary); font-size: 9.8px;">
                        <option value="webm">WebM (VP9)</option>
                        <option value="mp4">MP4 (H.264) - Experimental</option>
                    </select>
                </div>

                <div style="background: var(--bg-darker); padding: 10.5px; border-radius: 2.8px; margin-bottom: 14px; font-size: 9.8px; color: var(--text-secondary);">
                    <div style="margin-bottom: 3.5px;"><strong>Duration:</strong> ${duration.toFixed(2)}s</div>
                    <div style="margin-bottom: 3.5px;"><strong>Frames:</strong> ${frameCount}</div>
                    <div><strong>Estimated time:</strong> ${Math.ceil(frameCount / 10)}s</div>
                </div>

                <div style="display: flex; gap: 7px; justify-content: flex-end;">
                    <button id="exportCancelBtn" style="padding: 7px 14px; border: 1px solid var(--border-color); border-radius: 2.8px; background: var(--bg-darker); color: var(--text-primary); cursor: pointer; font-size: 9.8px;">Cancel</button>
                    <button id="exportStartBtn" style="padding: 7px 14px; border: none; border-radius: 2.8px; background: var(--accent-info); color: white; cursor: pointer; font-size: 9.8px;">📹 Export</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    // Resolution change handler
    getById('exportResolution').addEventListener('change', (e) => {
        const customDiv = getById('customResolution');
        if (e.target.value === 'custom') {
            customDiv.style.display = 'grid';
        } else {
            customDiv.style.display = 'none';
            const [w, h] = e.target.value.split('x');
            EXPORT_CONFIG.width = parseInt(w);
            EXPORT_CONFIG.height = parseInt(h);
        }
    });

    // Cancel button
    getById('exportCancelBtn').addEventListener('click', () => {
        dialog.remove();
    });

    // Export button
    getById('exportStartBtn').addEventListener('click', () => {
        const resolution = getById('exportResolution').value;
        if (resolution === 'custom') {
            EXPORT_CONFIG.width = parseInt(getById('exportWidth').value);
            EXPORT_CONFIG.height = parseInt(getById('exportHeight').value);
        } else {
            const [w, h] = resolution.split('x');
            EXPORT_CONFIG.width = parseInt(w);
            EXPORT_CONFIG.height = parseInt(h);
        }
        
        EXPORT_CONFIG.fps = parseInt(getById('exportFps').value);
        const format = getById('exportFormat').value;
        
        dialog.remove();
        startExport(format);
    });
}

/**
 * Start export process
 */
async function startExport(format) {
    const originalTime = state.currentTime;
    const originalCanvasWidth = state.project.project.canvasWidth;
    const originalCanvasHeight = state.project.project.canvasHeight;
    
    // Reset cancel flag
    state.exportCancelled = false;
    
    try {
        // Show progress dialog
        showProgressDialog();
        
        // Temporarily set canvas size for export
        state.project.project.canvasWidth = EXPORT_CONFIG.width;
        state.project.project.canvasHeight = EXPORT_CONFIG.height;
        updateViewport();
        
        // Start rendering frames
        if (format === 'webm') {
            await exportWebM();
        } else {
            await exportMP4();
        }
        
    } catch (error) {
        if (error.message === 'Export cancelled') {
            console.log('Export cancelled by user');
        } else {
            console.error('Export error:', error);
            showNotification('Export failed: ' + error.message, 5000, 'error');
        }
    } finally {
        // Restore original settings
        state.currentTime = originalTime;
        state.project.project.canvasWidth = originalCanvasWidth;
        state.project.project.canvasHeight = originalCanvasHeight;
        updateViewport();
        updatePlayhead();
        
        const progressDialog = document.getElementById('exportProgressDialog');
        if (progressDialog) progressDialog.remove();
        
        // Clean up cancel flag
        state.exportCancelled = false;
    }
}

/**
 * Show progress dialog
 */
function showProgressDialog() {
    const dialog = document.createElement('div');
    dialog.id = 'exportProgressDialog';
    dialog.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 10001; display: flex; align-items: center; justify-content: center;">
            <div style="background: var(--bg-primary); border: 1.4px solid var(--border-color); border-radius: 4.2px; padding: 21px; max-width: 420px; width: 90%; text-align: center;">
                <h3 style="margin: 0 0 14px 0; font-size: 14px;">🎬 Rendering Video...</h3>
                
                <div style="background: var(--bg-darker); height: 21px; border-radius: 10.5px; overflow: hidden; margin-bottom: 14px;">
                    <div id="exportProgressBar" style="height: 100%; background: var(--accent-info); width: 0%; transition: width 0.3s;"></div>
                </div>
                
                <div id="exportProgressText" style="font-size: 11.2px; color: var(--text-secondary); margin-bottom: 7px;">Preparing...</div>
                <div id="exportProgressDetails" style="font-size: 9.8px; color: var(--text-secondary);">Frame 0 / 0</div>
                
                <button id="exportCancelProgressBtn" style="margin-top: 14px; padding: 7px 14px; border: 1px solid var(--border-color); border-radius: 2.8px; background: var(--bg-darker); color: var(--text-primary); cursor: pointer; font-size: 9.8px;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(dialog);
    
    // Add cancel button handler
    const cancelBtn = getById('exportCancelProgressBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            state.exportCancelled = true;
            dialog.remove();
            showNotification('Export cancelled', 2000, 'info');
        });
    }
}

/**
 * Update progress
 */
function updateProgress(current, total, message = '') {
    const progressBar = getById('exportProgressBar');
    const progressText = getById('exportProgressText');
    const progressDetails = getById('exportProgressDetails');
    
    if (progressBar) {
        const percent = (current / total) * 100;
        progressBar.style.width = percent + '%';
    }
    
    if (progressText && message) {
        progressText.textContent = message;
    }
    
    if (progressDetails) {
        progressDetails.textContent = `Frame ${current} / ${total}`;
    }
}

/**
 * Export as WebM using MediaRecorder (frame-by-frame)
 */
async function exportWebM() {
    const duration = state.project.project.duration;
    const fps = EXPORT_CONFIG.fps;
    const frameCount = Math.ceil(duration * fps);
    const frameDuration = 1 / fps;
    
    // Create offscreen canvas for rendering
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_CONFIG.width;
    canvas.height = EXPORT_CONFIG.height;
    const ctx = canvas.getContext('2d');
    
    // Get viewport elements
    const viewport = getById('viewport');
    const bgVideo = getById('backgroundVideo');
    
    // Capture frames
    const frames = [];
    updateProgress(0, frameCount, 'Rendering frames...');
    
    for (let i = 0; i < frameCount; i++) {
        // Check if cancelled
        if (state.exportCancelled) {
            throw new Error('Export cancelled');
        }
        
        const time = i * frameDuration;
        state.currentTime = Math.min(time, duration);
        
        // Update background video time if it exists
        if (bgVideo && bgVideo.style.display !== 'none') {
            bgVideo.currentTime = time;
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        // Force immediate viewport update
        updateViewport();
        
        // Wait for render to complete
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Capture viewport using html2canvas approach
        await captureViewportSimple(viewport, bgVideo, canvas, ctx);
        
        // Convert to blob
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', EXPORT_CONFIG.quality));
        frames.push(blob);
        
        updateProgress(i + 1, frameCount, 'Rendering frames...');
        
        // Yield to prevent blocking
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }
    
    // Encode to video using MediaRecorder
    updateProgress(frameCount, frameCount, 'Encoding video...');
    await encodeFramesToVideo(frames, fps);
}

/**
 * Simple viewport capture - leverage the viewport's built-in responsive scaling
 */
async function captureViewportSimple(viewport, bgVideo, canvas, ctx) {
    // Clear canvas
    ctx.fillStyle = state.project.project.backgroundColor || '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw background video if exists
    if (bgVideo && bgVideo.style.display !== 'none' && bgVideo.readyState >= 2) {
        ctx.drawImage(bgVideo, 0, 0, canvas.width, canvas.height);
    }
    
    // Get viewport canvas - this is where elements are rendered with proper scaling
    const viewportCanvas = getById('viewportCanvas');
    const viewportRect = viewportCanvas.getBoundingClientRect();
    
    // Calculate scale ratio between export and current display
    const scaleX = canvas.width / viewportRect.width;
    const scaleY = canvas.height / viewportRect.height;
    
    // Draw each viewport element with proper scaling
    const elements = viewportCanvas.querySelectorAll('.viewport-element');
    for (const el of elements) {
        const elRect = el.getBoundingClientRect();
        const vpRect = viewportRect;
        
        // Get position relative to viewport canvas
        const x = (elRect.left - vpRect.left) * scaleX;
        const y = (elRect.top - vpRect.top) * scaleY;
        const w = elRect.width * scaleX;
        const h = elRect.height * scaleY;
        
        const opacity = parseFloat(window.getComputedStyle(el).opacity) || 1;
        
        ctx.save();
        ctx.globalAlpha = opacity;
        
        // Draw element content
        if (el.classList.contains('viewport-text')) {
            // Draw text with scaled font
            const computedStyle = window.getComputedStyle(el);
            const fontSize = parseFloat(computedStyle.fontSize) * scaleX;
            
            ctx.font = `${computedStyle.fontWeight} ${fontSize}px ${computedStyle.fontFamily}`;
            ctx.fillStyle = computedStyle.color;
            ctx.textAlign = computedStyle.textAlign || 'left';
            ctx.textBaseline = 'top';
            
            const text = el.textContent;
            const lines = text.split('\n');
            const lineHeight = (parseFloat(computedStyle.lineHeight) || parseFloat(computedStyle.fontSize) * 1.2) * scaleY;
            
            lines.forEach((line, i) => {
                let textX = x;
                if (ctx.textAlign === 'center') textX = x + w / 2;
                else if (ctx.textAlign === 'right') textX = x + w;
                
                ctx.fillText(line, textX, y + i * lineHeight);
            });
        } else {
            // Draw image/video - simple and direct
            const img = el.querySelector('img');
            const video = el.querySelector('video');
            
            if (img && img.complete) {
                ctx.drawImage(img, x, y, w, h);
            } else if (video && video.readyState >= 2) {
                ctx.drawImage(video, x, y, w, h);
            }
        }
        
        ctx.restore();
    }
}

/**
 * Encode frames to video using MediaRecorder
 */
async function encodeFramesToVideo(frames, fps) {
    // Create a canvas stream
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_CONFIG.width;
    canvas.height = EXPORT_CONFIG.height;
    const ctx = canvas.getContext('2d');
    
    const stream = canvas.captureStream(fps);
    const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: EXPORT_CONFIG.videoBitrate
    });
    
    const chunks = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
    };
    
    mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        downloadBlob(blob, `export_${Date.now()}.webm`);
        showNotification('✅ Video exported successfully!', 3000, 'success');
    };
    
    mediaRecorder.start();
    
    // Play frames at correct timing
    const frameDuration = 1000 / fps;
    for (let i = 0; i < frames.length; i++) {
        const img = await createImageBitmap(frames[i]);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        await new Promise(resolve => setTimeout(resolve, frameDuration));
    }
    
    mediaRecorder.stop();
}

/**
 * Export as MP4 (experimental)
 */
async function exportMP4() {
    showNotification('MP4 export is experimental. Using WebM fallback.', 3000, 'info');
    await exportWebM();
}

/**
 * Download blob as file
 */
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// Expose to window
if (typeof window !== 'undefined') {
    window.showExportDialog = showExportDialog;
}

