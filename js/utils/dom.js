/* ============================================
   DOM UTILITIES - Element Creation & Manipulation
   ============================================ */

/**
 * Create an element with classes and attributes
 * @param {string} tag - HTML tag name
 * @param {object} options - { classes: [], attributes: {}, styles: {} }
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}) {
    const el = document.createElement(tag);
    
    if (options.classes) {
        el.className = Array.isArray(options.classes) 
            ? options.classes.join(' ') 
            : options.classes;
    }
    
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            el.setAttribute(key, value);
        });
    }
    
    if (options.styles) {
        Object.entries(options.styles).forEach(([key, value]) => {
            el.style[key] = value;
        });
    }
    
    if (options.innerHTML) {
        el.innerHTML = options.innerHTML;
    }
    
    if (options.textContent) {
        el.textContent = options.textContent;
    }
    
    return el;
}

/**
 * Get element by ID with error handling
 * @param {string} id
 * @returns {HTMLElement|null}
 */
export function getById(id) {
    const el = document.getElementById(id);
    if (!el) {
        console.warn(`Element with ID "${id}" not found`);
    }
    return el;
}

/**
 * Clear all children from an element
 * @param {HTMLElement} element
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Show/hide element
 * @param {HTMLElement} element
 * @param {boolean} show
 */
export function toggleElement(element, show) {
    if (show) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

/**
 * Add multiple event listeners to an element
 * @param {HTMLElement} element
 * @param {object} events - { eventName: handler }
 */
export function addEventListeners(element, events) {
    Object.entries(events).forEach(([event, handler]) => {
        element.addEventListener(event, handler);
    });
}

/**
 * Get or create notification container
 * Positioned at bottom-right of viewport container, above timeline
 */
function getNotificationContainer() {
    let container = document.getElementById('notification-container');
    
    if (!container) {
        container = createElement('div', {
            attributes: { id: 'notification-container' },
            styles: {
                position: 'fixed',
                bottom: '14px',
                right: '14px',
                zIndex: '10000',
                display: 'flex',
                flexDirection: 'column-reverse', // Stack from bottom up
                gap: '7px',
                pointerEvents: 'none'
            }
        });
        
        // Append to viewport container instead of body
        const viewportContainer = document.querySelector('.viewport-container');
        if (viewportContainer) {
            viewportContainer.appendChild(container);
        } else {
            document.body.appendChild(container);
        }
    }
    
    // Update position to account for timeline height
    updateNotificationPosition(container);
    
    return container;
}

/**
 * Update notification container position based on timeline height
 */
function updateNotificationPosition(container) {
    if (!container) return;
    
    const timelineSection = document.querySelector('.timeline-section');
    if (timelineSection) {
        const timelineHeight = timelineSection.offsetHeight;
        // Position above timeline with some padding
        container.style.bottom = (timelineHeight + 14) + 'px';
    } else {
        container.style.bottom = '14px';
    }
}

/**
 * Update notification container position (public API)
 * Called when timeline is resized
 */
export function updateNotificationContainerPosition() {
    const container = document.getElementById('notification-container');
    if (container) {
        updateNotificationPosition(container);
    }
}

/**
 * Show temporary notification (stacks vertically)
 * @param {string} message
 * @param {number} duration - Duration in milliseconds
 * @param {string} type - 'success', 'error', 'info'
 */
export function showNotification(message, duration = 2000, type = 'success') {
    const colors = {
        success: '#4CAF50',
        error: '#f44336',
        info: '#2196F3'
    };
    
    const container = getNotificationContainer();
    
    const indicator = createElement('div', {
        textContent: message,
        styles: {
            background: colors[type] || colors.info,
            color: 'white',
            padding: '7px 14px',
            borderRadius: '2.8px',
            boxShadow: '0 1.4px 7px rgba(0,0,0,0.3)',
            pointerEvents: 'auto',
            animation: 'slideInRight 0.3s ease-out'
        }
    });
    
    container.appendChild(indicator);
    
    setTimeout(() => {
        indicator.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            indicator.remove();
            // Remove container if empty
            if (container.children.length === 0) {
                container.remove();
            }
        }, 300);
    }, duration);
}

