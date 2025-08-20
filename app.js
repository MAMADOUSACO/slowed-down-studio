// Main App Controller & State Management

class SlowedReverbStudioApp {
  constructor() {
    this.audioEngine = null;
    this.editor = null;
    this.player = null;
    this.playlist = null;
    
    this.currentTab = 'editor';
    this.keyboardShortcuts = null;
    
    this.init();
  }

  async init() {
    try {
      // Initialize audio engine
      this.audioEngine = new AudioEngine();
      await this.audioEngine.init();
      
      // Initialize controllers
      this.editor = new EditorController(this.audioEngine);
      this.player = new PlayerController(this.audioEngine);
      this.playlist = new PlaylistController(this.audioEngine);
      
      // Setup UI
      this.setupTabNavigation();
      this.setupTheme();
      this.setupKeyboardShortcuts();
      this.setupGlobalControls();
      
      // Connect components
      this.connectComponents();
      
      // Start animation loops
      this.editor.startAnimationLoop();
      
      // Load saved state
      this.loadAppState();
      
      console.log('🎵 Slowed + Reverb Studio Pro initialized successfully!');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.showErrorState(error);
    }
  }

  setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        this.switchTab(tabName);
      });
    });
    
    // Initialize with editor tab
    this.switchTab('editor');
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    this.currentTab = tabName;
    
    // Tab-specific actions
    switch (tabName) {
      case 'editor':
        // Focus on editor functionality
        break;
      case 'player':
        // Update player display if needed
        this.syncPlayerWithCurrentSong();
        break;
      case 'playlist':
        // Refresh playlist display
        break;
    }
    
    // Save current tab
    UIUtils.storage.set('currentTab', tabName);
  }

  setupTheme() {
    UIUtils.theme.init();
    
    document.getElementById('theme-toggle').addEventListener('click', () => {
      UIUtils.theme.toggle();
    });
  }

  setupKeyboardShortcuts() {
    const shortcuts = {
      ' ': (e) => {
        e.preventDefault();
        this.togglePlayback();
      },
      '1': () => this.switchTab('editor'),
      '2': () => this.switchTab('player'),
      '3': () => this.switchTab('playlist'),
      'ArrowLeft': () => this.seekBackward(),
      'ArrowRight': () => this.seekForward(),
      'ArrowUp': () => this.volumeUp(),
      'ArrowDown': () => this.volumeDown(),
      'ctrl+z': () => {
        if (this.currentTab === 'editor') {
          this.editor.undo();
        }
      },
      'ctrl+y': () => {
        if (this.currentTab === 'editor') {
          this.editor.redo();
        }
      },
      'ctrl+s': (e) => {
        e.preventDefault();
        this.quickExport();
      },
      'f': () => {
        if (this.currentTab === 'player') {
          this.player.toggleFullscreenVisualizer();
        }
      },
      'n': () => {
        if (this.player.currentPlaylist) {
          this.player.nextSong();
        }
      },
      'p': () => {
        if (this.player.currentPlaylist) {
          this.player.previousSong();
        }
      }
    };
    
    this.keyboardShortcuts = UIUtils.setupKeyboardShortcuts(shortcuts);
  }

  setupGlobalControls() {
    // Update status bar with current song info
    this.updateStatusBar();
    
    // Setup settings modal (if implemented)
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.showSettings();
    });
    
    // Global audio context unlock (for mobile)
    document.addEventListener('touchstart', () => {
      if (this.audioEngine.audioContext.state === 'suspended') {
        this.audioEngine.audioContext.resume();
      }
    }, { once: true });
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden, could pause if desired
      } else {
        // Page is visible again
        if (this.audioEngine.audioContext.state === 'suspended') {
          this.audioEngine.audioContext.resume();
        }
      }
    });
    
    // Handle beforeunload for unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  connectComponents() {
    // Connect editor to player
    this.editor.onSongProcessed = (songData) => {
      this.player.loadSong(songData);
    };
    
    // Connect editor to playlist
    this.editor.onAddToPlaylist = (songData) => {
      this.playlist.addSongToPlaylist(songData);
    };
    
    // Connect player to playlist for navigation
    this.player.onSongEnd = () => {
      if (this.player.currentPlaylist) {
        const nextSong = this.playlist.getNextSong(this.player.currentIndex);
        if (nextSong) {
          this.player.loadSong(nextSong.song, this.player.currentPlaylist, nextSong.index);
          if (this.audioEngine.isPlaying) {
            setTimeout(() => this.audioEngine.play(), 100);
          }
        }
      }
    };
    
    // Global song change handler
    this.audioEngine.onSongEnd = () => {
      if (this.player.onSongEnd) {
        this.player.onSongEnd();
      }
    };
  }

  // Cross-component actions
  switchToEditor(songData = null) {
    this.switchTab('editor');
    if (songData) {
      this.editor.handleFileUpload(songData.file);
      if (songData.parameters) {
        setTimeout(() => {
          this.audioEngine.setParameters(songData.parameters);
          this.editor.updateAllSliders();
        }, 500);
      }
    }
  }

  switchToPlayer(songData = null, playlistData = null, index = 0) {
    this.switchTab('player');
    if (songData) {
      this.player.loadSong(songData, playlistData, index);
    }
  }

  syncPlayerWithCurrentSong() {
    if (this.editor.currentFile && this.currentTab === 'player') {
      const songData = {
        title: this.editor.currentFile.name.replace(/\.[^/.]+$/, ''),
        name: this.editor.currentFile.name,
        file: this.editor.currentFile,
        parameters: this.audioEngine.getParameters()
      };
      
      this.player.loadSong(songData);
    }
  }

  // Global playback controls
  togglePlayback() {
    if (this.currentTab === 'editor') {
      this.editor.togglePlayback();
    } else if (this.currentTab === 'player') {
      this.player.togglePlayback();
    }
  }

  seekBackward(seconds = 10) {
    if (this.audioEngine.audioBuffer) {
      const currentTime = this.audioEngine.getCurrentTime();
      this.audioEngine.seekTo(Math.max(0, currentTime - seconds));
    }
  }

  seekForward(seconds = 10) {
    if (this.audioEngine.audioBuffer) {
      const currentTime = this.audioEngine.getCurrentTime();
      this.audioEngine.seekTo(Math.min(this.audioEngine.duration, currentTime + seconds));
    }
  }

  volumeUp(increment = 5) {
    const currentVolume = this.audioEngine.parameters.volume;
    const newVolume = Math.min(200, currentVolume + increment);
    this.audioEngine.setVolume(newVolume);
    
    // Update UI if in editor
    if (this.currentTab === 'editor') {
      document.getElementById('volume-slider').value = newVolume;
      UIUtils.updateSliderDisplay(
        document.getElementById('volume-slider'),
        document.getElementById('volume-value'),
        '%'
      );
    }
    
    UIUtils.showToast(`Volume: ${newVolume}%`, 'success', 1000);
  }

  volumeDown(increment = 5) {
    const currentVolume = this.audioEngine.parameters.volume;
    const newVolume = Math.max(0, currentVolume - increment);
    this.audioEngine.setVolume(newVolume);
    
    // Update UI if in editor
    if (this.currentTab === 'editor') {
      document.getElementById('volume-slider').value = newVolume;
      UIUtils.updateSliderDisplay(
        document.getElementById('volume-slider'),
        document.getElementById('volume-value'),
        '%'
      );
    }
    
    UIUtils.showToast(`Volume: ${newVolume}%`, 'success', 1000);
  }

  async quickExport() {
    if (!this.editor.currentFile) {
      UIUtils.showToast('No audio file loaded', 'warning');
      return;
    }
    
    try {
      const blob = await this.audioEngine.exportAudio('mp3', 192);
      const filename = `${this.editor.currentFile.name.replace(/\.[^/.]+$/, '')}-processed.mp3`;
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      UIUtils.showToast('Quick export completed!', 'success');
    } catch (error) {
      console.error('Quick export failed:', error);
      UIUtils.showToast('Quick export failed', 'error');
    }
  }

  updateStatusBar() {
    const statusSong = document.getElementById('status-song');
    
    setInterval(() => {
      if (this.editor.currentFile) {
        const fileName = this.editor.currentFile.name;
        const isPlaying = this.audioEngine.isPlaying ? ' ⏵' : '';
        statusSong.textContent = `${fileName}${isPlaying}`;
      } else {
        statusSong.textContent = 'No song loaded';
      }
    }, 1000);
  }

  showSettings() {
    // Basic settings modal
    const settings = {
      crossfadeDuration: this.player.crossfadeDuration || 3,
      gaplessPlayback: this.player.gaplessPlayback || false,
      autoSave: true,
      theme: UIUtils.theme.current
    };
    
    // For now, just show current settings
    UIUtils.showToast(`Theme: ${settings.theme} | Crossfade: ${settings.crossfadeDuration}s`, 'success', 3000);
  }

  hasUnsavedChanges() {
    // Check if there are unsaved changes in the editor
    return this.editor.currentFile && this.editor.history.length > 1;
  }

  saveAppState() {
    const state = {
      currentTab: this.currentTab,
      editorParameters: this.audioEngine.getParameters(),
      playerSettings: {
        volume: this.audioEngine.parameters.volume,
        crossfadeDuration: this.player.crossfadeDuration
      },
      timestamp: Date.now()
    };
    
    UIUtils.storage.set('appState', state);
  }

  loadAppState() {
    const state = UIUtils.storage.get('appState');
    if (state) {
      // Restore tab
      if (state.currentTab) {
        this.switchTab(state.currentTab);
      }
      
      // Restore player settings
      if (state.playerSettings) {
        if (state.playerSettings.volume) {
          this.audioEngine.setVolume(state.playerSettings.volume);
        }
        if (state.playerSettings.crossfadeDuration) {
          this.player.crossfadeDuration = state.playerSettings.crossfadeDuration;
        }
      }
    }
  }

  showErrorState(error) {
    const errorHtml = `
      <div style="text-align: center; padding: 2rem; color: var(--danger);">
        <h2>⚠️ Application Error</h2>
        <p>Failed to initialize the audio system.</p>
        <p><small>${error.message}</small></p>
        <button onclick="window.location.reload()" class="action-btn">Reload App</button>
      </div>
    `;
    
    document.querySelector('.main-content').innerHTML = errorHtml;
  }

  // Cleanup
  destroy() {
    if (this.keyboardShortcuts) {
      this.keyboardShortcuts.destroy();
    }
    
    if (this.audioEngine) {
      this.audioEngine.destroy();
    }
    
    if (this.player) {
      this.player.destroy();
    }
    
    // Save state before destroy
    this.saveAppState();
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new SlowedReverbStudioApp();
  
  // Make controllers globally accessible for inline event handlers
  window.playlistController = window.app.playlist;
  window.editorController = window.app.editor;
  window.playerController = window.app.player;
});

// Handle page unload
window.addEventListener('beforeunload', () => {
  if (window.app) {
    window.app.destroy();
  }
});

// Service Worker registration (for offline capabilities if desired)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Uncomment if you want to add a service worker
    // navigator.serviceWorker.register('/sw.js')
    //   .then(registration => console.log('SW registered'))
    //   .catch(error => console.log('SW registration failed'));
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SlowedReverbStudioApp;
} else {
  window.SlowedReverbStudioApp = SlowedReverbStudioApp;
}