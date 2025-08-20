// UI Utilities & Helpers

class UIUtils {
  // Format time from seconds to MM:SS format
  static formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Format file size in bytes to human readable format
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Create a toast notification
  static showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Trigger show animation
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto hide
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, duration);
  }

  // Generate unique ID
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Debounce function for performance
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Throttle function for performance
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Update slider value display
  static updateSliderDisplay(slider, display, suffix = '', multiplier = 1) {
    const value = (parseFloat(slider.value) * multiplier).toFixed(2);
    display.textContent = value + suffix;
  }

  // Create loading indicator
  static createLoadingIndicator() {
    const loader = document.createElement('div');
    loader.className = 'loading-indicator';
    return loader;
  }

  // Show/hide loading state on element
  static setLoadingState(element, isLoading) {
    if (isLoading) {
      element.classList.add('loading');
      element.disabled = true;
    } else {
      element.classList.remove('loading');
      element.disabled = false;
    }
  }

  // Animate value changes
  static animateValue(element, start, end, duration = 300) {
    const startTime = performance.now();
    const change = end - start;

    function updateValue(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = start + (change * easeOut);
      
      element.textContent = currentValue.toFixed(2);
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      }
    }
    
    requestAnimationFrame(updateValue);
  }

  // Get file extension from filename
  static getFileExtension(filename) {
    return filename.split('.').pop().toLowerCase();
  }

  // Validate audio file
  static isValidAudioFile(file) {
    const validTypes = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
    const extension = this.getFileExtension(file.name);
    return validTypes.includes(extension);
  }

  // Convert RGB to HSL for color manipulation
  static rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  }

  // Generate color from audio frequency data
  static getColorFromFrequency(frequencyData) {
    const bass = frequencyData.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
    const mid = frequencyData.slice(8, 24).reduce((a, b) => a + b, 0) / 16;
    const treble = frequencyData.slice(24, 32).reduce((a, b) => a + b, 0) / 8;
    
    const hue = (bass + mid + treble) / 3 * 1.4;
    const saturation = Math.max(60, Math.min(100, bass * 0.8));
    const lightness = Math.max(40, Math.min(80, mid * 0.6));
    
    return `hsl(${hue % 360}, ${saturation}%, ${lightness}%)`;
  }

  // Local storage helpers
  static storage = {
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.warn('Failed to save to localStorage:', error);
      }
    },

    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        console.warn('Failed to load from localStorage:', error);
        return defaultValue;
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    }
  };

  // Drag and drop helpers
  static setupDragAndDrop(dropZone, onDrop, onDragOver = null) {
    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDragOver = (e) => {
      preventDefault(e);
      dropZone.classList.add('dragover');
      if (onDragOver) onDragOver(e);
    };

    const handleDragLeave = (e) => {
      preventDefault(e);
      if (!dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove('dragover');
      }
    };

    const handleDrop = (e) => {
      preventDefault(e);
      dropZone.classList.remove('dragover');
      
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        onDrop(files);
      }
    };

    // Add event listeners
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefault);
    });

    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);

    return {
      destroy() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
          dropZone.removeEventListener(eventName, preventDefault);
        });
        dropZone.removeEventListener('dragover', handleDragOver);
        dropZone.removeEventListener('dragleave', handleDragLeave);
        dropZone.removeEventListener('drop', handleDrop);
      }
    };
  }

  // Keyboard shortcuts manager
  static setupKeyboardShortcuts(shortcuts) {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      const alt = e.altKey;

      for (const [shortcut, callback] of Object.entries(shortcuts)) {
        const parts = shortcut.toLowerCase().split('+');
        const requiredKey = parts[parts.length - 1];
        const requiredCtrl = parts.includes('ctrl');
        const requiredShift = parts.includes('shift');
        const requiredAlt = parts.includes('alt');

        if (key === requiredKey && 
            ctrl === requiredCtrl && 
            shift === requiredShift && 
            alt === requiredAlt) {
          e.preventDefault();
          callback(e);
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return {
      destroy() {
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
  }

  // Theme management
  static theme = {
    current: 'dark',
    
    init() {
      const saved = UIUtils.storage.get('theme', 'dark');
      this.set(saved);
    },

    set(theme) {
      this.current = theme;
      document.documentElement.setAttribute('data-theme', theme);
      UIUtils.storage.set('theme', theme);
      
      // Update theme toggle button
      const toggleBtn = document.getElementById('theme-toggle');
      if (toggleBtn) {
        toggleBtn.textContent = theme === 'dark' ? '🌙' : '☀️';
      }
    },

    toggle() {
      this.set(this.current === 'dark' ? 'light' : 'dark');
    }
  };

  // Modal management
  static modal = {
    show(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('fade-in');
        // Focus trap
        const focusableElements = modal.querySelectorAll(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        }
      }
    },

    hide(modalId) {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('fade-in');
      }
    },

    setup(modalId, closeSelectors = []) {
      const modal = document.getElementById(modalId);
      if (!modal) return;

      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.hide(modalId);
        }
      });

      // Close on escape key
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.hide(modalId);
        }
      });

      // Close on specific selectors
      closeSelectors.forEach(selector => {
        const element = modal.querySelector(selector);
        if (element) {
          element.addEventListener('click', () => this.hide(modalId));
        }
      });
    }
  };

  // Animation utilities
  static animate = {
    fadeIn(element, duration = 300) {
      element.style.opacity = '0';
      element.style.display = 'block';
      
      const start = performance.now();
      
      function fade(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = progress;
        
        if (progress < 1) {
          requestAnimationFrame(fade);
        }
      }
      
      requestAnimationFrame(fade);
    },

    fadeOut(element, duration = 300) {
      const start = performance.now();
      const startOpacity = parseFloat(getComputedStyle(element).opacity);
      
      function fade(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.opacity = startOpacity * (1 - progress);
        
        if (progress >= 1) {
          element.style.display = 'none';
        } else {
          requestAnimationFrame(fade);
        }
      }
      
      requestAnimationFrame(fade);
    },

    slideDown(element, duration = 300) {
      element.style.height = '0px';
      element.style.overflow = 'hidden';
      element.style.display = 'block';
      
      const targetHeight = element.scrollHeight;
      const start = performance.now();
      
      function slide(currentTime) {
        const elapsed = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        
        element.style.height = (targetHeight * progress) + 'px';
        
        if (progress >= 1) {
          element.style.height = '';
          element.style.overflow = '';
        } else {
          requestAnimationFrame(slide);
        }
      }
      
      requestAnimationFrame(slide);
    }
  };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIUtils;
} else {
  window.UIUtils = UIUtils;
}