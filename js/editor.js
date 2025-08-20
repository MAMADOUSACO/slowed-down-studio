// Editor Tab Functionality

class EditorController {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.currentFile = null;
    this.isComparing = false;
    this.originalParameters = null;
    
    // History for undo/redo
    this.history = [];
    this.historyIndex = -1;
    this.maxHistory = 50;
    
    // Waveform visualization
    this.waveformCanvas = null;
    this.waveformCtx = null;
    this.waveformData = null;
    
    this.init();
  }

  init() {
    this.setupFileUpload();
    this.setupPresets();
    this.setupControls();
    this.setupWaveform();
    this.setupExport();
    this.loadPresets();
    
    // Auto-save parameters
    this.setupAutoSave();
  }

  setupFileUpload() {
    const dropZone = document.getElementById('file-drop-zone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('file-browse-btn');

    // Setup drag and drop
    UIUtils.setupDragAndDrop(dropZone, (files) => {
      this.handleFileUpload(files[0]);
    });

    // Browse button
    browseBtn.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileUpload(e.target.files[0]);
      }
    });
  }

  async handleFileUpload(file) {
    if (!UIUtils.isValidAudioFile(file)) {
      UIUtils.showToast('Please select a valid audio file', 'error');
      return;
    }

    try {
      UIUtils.showToast('Loading audio file...', 'success', 1000);
      
      await this.audioEngine.loadAudioFile(file);
      this.currentFile = file;
      
      // Reset parameters and history
      this.resetParameters();
      this.saveToHistory();
      
      // Update UI
      this.updateFileInfo();
      this.drawWaveform();
      this.enableControls();
      
      UIUtils.showToast(`Loaded: ${file.name}`, 'success');
      
    } catch (error) {
      console.error('Failed to load audio file:', error);
      UIUtils.showToast('Failed to load audio file', 'error');
    }
  }

  setupPresets() {
    const presetButtons = document.querySelectorAll('.preset-btn');
    
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetName = btn.dataset.preset;
        this.loadPreset(presetName);
        
        // Update active state
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  async loadPresets() {
    // Embedded preset data (avoids CORS issues with local files)
    this.presets = {
      'classic-slowed': {
        name: "Classic Slowed",
        description: "The quintessential slowed + reverb sound - deep, atmospheric, and nostalgic",
        parameters: {
          speed: 0.75,
          pitch: -2,
          reverbAmount: 25,
          roomSize: 70,
          decayTime: 3,
          volume: 90,
          bassGain: 3,
          midGain: -1,
          trebleGain: -2,
          lowPassFreq: 8000,
          compression: 15,
          stereoWidth: 120,
          fadeIn: 0,
          fadeOut: 0,
          panPosition: 0
        }
      },
      'nightcore': {
        name: "Nightcore",
        description: "High-energy, sped-up sound with bright, crisp characteristics",
        parameters: {
          speed: 1.3,
          pitch: 4,
          reverbAmount: 10,
          roomSize: 30,
          decayTime: 1.5,
          volume: 95,
          bassGain: -2,
          midGain: 2,
          trebleGain: 4,
          lowPassFreq: 20000,
          compression: 25,
          stereoWidth: 110,
          fadeIn: 0,
          fadeOut: 0,
          panPosition: 0
        }
      },
      'vaporwave': {
        name: "Vaporwave", 
        description: "Dreamy, nostalgic aesthetic with heavy filtering and atmospheric effects",
        parameters: {
          speed: 0.6,
          pitch: -4,
          reverbAmount: 40,
          roomSize: 80,
          decayTime: 4,
          volume: 85,
          bassGain: 2,
          midGain: -2,
          trebleGain: -4,
          lowPassFreq: 6000,
          compression: 10,
          stereoWidth: 140,
          fadeIn: 0.5,
          fadeOut: 0.5,
          panPosition: 0
        }
      },
      'ambient': {
        name: "Ambient",
        description: "Spacious, ethereal soundscape perfect for relaxation and meditation",
        parameters: {
          speed: 0.8,
          pitch: 0,
          reverbAmount: 60,
          roomSize: 90,
          decayTime: 6,
          volume: 80,
          bassGain: 1,
          midGain: -3,
          trebleGain: -5,
          lowPassFreq: 4000,
          compression: 5,
          stereoWidth: 160,
          fadeIn: 2,
          fadeOut: 2,
          panPosition: 0
        }
      },
      'hyperpop': {
        name: "Hyperpop",
        description: "Heavily processed, maximalist sound with extreme compression and EQ", 
        parameters: {
          speed: 1.1,
          pitch: 2,
          reverbAmount: 15,
          roomSize: 40,
          decayTime: 2,
          volume: 100,
          bassGain: 5,
          midGain: 3,
          trebleGain: 6,
          lowPassFreq: 20000,
          compression: 40,
          stereoWidth: 90,
          fadeIn: 0,
          fadeOut: 0,
          panPosition: 0
        }
      },
      'lo-fi': {
        name: "Lo-Fi",
        description: "Warm, vintage sound with reduced clarity and cozy atmosphere",
        parameters: {
          speed: 0.9,
          pitch: -1,
          reverbAmount: 20,
          roomSize: 50,
          decayTime: 2.5,
          volume: 85,
          bassGain: 4,
          midGain: -2,
          trebleGain: -6,
          lowPassFreq: 3000,
          compression: 20,
          stereoWidth: 80,
          fadeIn: 0.2,
          fadeOut: 0.2,
          panPosition: 0
        }
      }
    };
    
    console.log('✅ Presets loaded successfully!');
  }



  loadPreset(presetName) {
    if (!this.currentFile) {
      UIUtils.showToast('Please load an audio file first', 'warning');
      return;
    }

    const preset = this.presets[presetName];
    if (preset && preset.parameters) {
      this.audioEngine.setParameters(preset.parameters);
      this.updateAllSliders();
      this.saveToHistory();
      this.updateParameterDisplay();
      UIUtils.showToast(`Applied ${preset.name} preset`, 'success');
    } else {
      UIUtils.showToast(`Preset "${presetName}" not found`, 'error');
    }
  }

  setupControls() {
    // Speed and Pitch
    this.setupSlider('speed-slider', 'speed-value', (value) => {
      this.audioEngine.setSpeed(parseFloat(value));
      this.updateParameterDisplay();
    }, 'x');

    this.setupSlider('pitch-slider', 'pitch-value', (value) => {
      this.audioEngine.setPitch(parseFloat(value));
      this.updateParameterDisplay();
    });

    // Link speed and pitch checkbox
    const linkCheckbox = document.getElementById('link-speed-pitch');
    linkCheckbox.addEventListener('change', () => {
      if (linkCheckbox.checked) {
        // Sync pitch with speed changes
        const speedSlider = document.getElementById('speed-slider');
        const pitchSlider = document.getElementById('pitch-slider');
        const speedChange = (parseFloat(speedSlider.value) - 1) * 12;
        pitchSlider.value = speedChange;
        this.audioEngine.setPitch(speedChange);
        UIUtils.updateSliderDisplay(pitchSlider, document.getElementById('pitch-value'));
      }
    });

    // Reverb controls
    this.setupSlider('reverb-amount', 'reverb-amount-value', () => {
      this.updateReverb();
    }, '%');

    this.setupSlider('room-size', 'room-size-value', () => {
      this.updateReverb();
    }, '%');

    this.setupSlider('decay-time', 'decay-time-value', () => {
      this.updateReverb();
    }, 's');

    // EQ controls
    this.setupSlider('eq-bass', 'eq-bass-value', () => {
      this.updateEQ();
    }, 'dB');

    this.setupSlider('eq-mid', 'eq-mid-value', () => {
      this.updateEQ();
    }, 'dB');

    this.setupSlider('eq-treble', 'eq-treble-value', () => {
      this.updateEQ();
    }, 'dB');

    // Filter and dynamics
    this.setupSlider('lowpass-filter', 'lowpass-value', (value) => {
      this.audioEngine.setLowPassFilter(parseFloat(value));
      this.updateParameterDisplay();
    }, 'Hz');

    this.setupSlider('volume-slider', 'volume-value', (value) => {
      this.audioEngine.setVolume(parseFloat(value));
      this.updateParameterDisplay();
    }, '%');

    this.setupSlider('compression', 'compression-value', (value) => {
      this.audioEngine.setCompression(parseFloat(value));
      this.updateParameterDisplay();
    }, '%');

    this.setupSlider('stereo-width', 'stereo-width-value', (value) => {
      this.audioEngine.setStereoWidth(parseFloat(value));
      this.updateParameterDisplay();
    }, '%');

    this.setupSlider('fade-in', 'fade-in-value', (value) => {
      // Fade effects would be applied during export
      this.updateParameterDisplay();
    }, 's');

    this.setupSlider('fade-out', 'fade-out-value', (value) => {
      // Fade effects would be applied during export
      this.updateParameterDisplay();
    }, 's');

    // Playback controls
    document.getElementById('play-btn').addEventListener('click', () => {
      this.togglePlayback();
    });

    document.getElementById('stop-btn').addEventListener('click', () => {
      this.audioEngine.stop();
      this.updatePlayButton();
    });

    document.getElementById('ab-toggle-btn').addEventListener('click', () => {
      this.toggleABComparison();
    });

    // Undo/Redo
    document.getElementById('undo-btn').addEventListener('click', () => {
      this.undo();
    });

    document.getElementById('redo-btn').addEventListener('click', () => {
      this.redo();
    });
  }

  setupSlider(sliderId, displayId, callback, suffix = '') {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    
    if (!slider || !display) return;

    const updateValue = UIUtils.debounce(() => {
      UIUtils.updateSliderDisplay(slider, display, suffix);
      if (callback) callback(slider.value);
      this.saveToHistory();
    }, 100);

    slider.addEventListener('input', () => {
      UIUtils.updateSliderDisplay(slider, display, suffix);
      if (callback) callback(slider.value);
    });
    
    slider.addEventListener('change', updateValue);
    
    // Initialize display
    UIUtils.updateSliderDisplay(slider, display, suffix);
  }

  updateReverb() {
    const amount = document.getElementById('reverb-amount').value;
    const roomSize = document.getElementById('room-size').value;
    const decayTime = document.getElementById('decay-time').value;
    
    this.audioEngine.setReverb(
      parseFloat(amount),
      parseFloat(roomSize),
      parseFloat(decayTime)
    );
    this.updateParameterDisplay();
  }

  updateEQ() {
    const bass = document.getElementById('eq-bass').value;
    const mid = document.getElementById('eq-mid').value;
    const treble = document.getElementById('eq-treble').value;
    
    this.audioEngine.setEQ(
      parseFloat(bass),
      parseFloat(mid),
      parseFloat(treble)
    );
    this.updateParameterDisplay();
  }

  setupWaveform() {
    this.waveformCanvas = document.getElementById('waveform-canvas');
    this.waveformCtx = this.waveformCanvas.getContext('2d');
    
    // Handle canvas resize
    const resizeCanvas = () => {
      const rect = this.waveformCanvas.getBoundingClientRect();
      this.waveformCanvas.width = rect.width * window.devicePixelRatio;
      this.waveformCanvas.height = rect.height * window.devicePixelRatio;
      this.waveformCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
      this.drawWaveform();
    };
    
    window.addEventListener('resize', UIUtils.debounce(resizeCanvas, 250));
    resizeCanvas();

    // Click to seek
    this.waveformCanvas.addEventListener('click', (e) => {
      if (!this.audioEngine.audioBuffer) return;
      
      const rect = this.waveformCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const progress = x / rect.width;
      const seekTime = progress * this.audioEngine.duration;
      
      this.audioEngine.seekTo(seekTime);
    });
  }

  drawWaveform() {
    if (!this.audioEngine.audioBuffer || !this.waveformCtx) return;

    const canvas = this.waveformCanvas;
    const ctx = this.waveformCtx;
    const buffer = this.audioEngine.audioBuffer;
    
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw waveform
    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;
    
    ctx.fillStyle = getComputedStyle(document.documentElement)
      .getPropertyValue('--waveform-color').trim();
    
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      ctx.fillRect(i, (1 + min) * amp, 1, Math.max(1, (max - min) * amp));
    }
    
    // Draw playback position
    if (this.audioEngine.isPlaying || this.audioEngine.isPaused) {
      const currentTime = this.audioEngine.getCurrentTime();
      const progress = currentTime / this.audioEngine.duration;
      const x = progress * width;
      
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  }

  togglePlayback() {
    if (!this.currentFile) {
      UIUtils.showToast('Please load an audio file first', 'warning');
      return;
    }

    if (this.audioEngine.isPlaying) {
      this.audioEngine.pause();
    } else {
      this.audioEngine.play();
    }
    
    this.updatePlayButton();
  }

  updatePlayButton() {
    const playBtn = document.getElementById('play-btn');
    playBtn.textContent = this.audioEngine.isPlaying ? '⏸️' : '▶️';
  }

  toggleABComparison() {
    if (!this.currentFile) {
      UIUtils.showToast('Please load an audio file first', 'warning');
      return;
    }

    this.isComparing = !this.isComparing;
    const abBtn = document.getElementById('ab-toggle-btn');
    
    if (this.isComparing) {
      // Save current parameters and switch to original
      this.originalParameters = this.audioEngine.getParameters();
      this.resetParameters();
      abBtn.classList.add('active');
      abBtn.textContent = 'Original';
      UIUtils.showToast('Playing original audio', 'success', 1500);
    } else {
      // Restore modified parameters
      if (this.originalParameters) {
        this.audioEngine.setParameters(this.originalParameters);
        this.updateAllSliders();
      }
      abBtn.classList.remove('active');
      abBtn.textContent = 'A/B';
      UIUtils.showToast('Playing modified audio', 'success', 1500);
    }
  }

  setupExport() {
    const exportBtn = document.getElementById('export-btn');
    const modal = document.getElementById('export-modal');
    const cancelBtn = document.getElementById('export-cancel-btn');
    const confirmBtn = document.getElementById('export-confirm-btn');
    const filenameInput = document.getElementById('export-filename');

    exportBtn.addEventListener('click', () => {
      if (!this.currentFile) {
        UIUtils.showToast('Please load an audio file first', 'warning');
        return;
      }
      
      // Set default filename
      const baseName = this.currentFile.name.replace(/\.[^/.]+$/, '');
      filenameInput.value = `${baseName}-processed`;
      
      UIUtils.modal.show('export-modal');
    });

    cancelBtn.addEventListener('click', () => {
      UIUtils.modal.hide('export-modal');
    });

    confirmBtn.addEventListener('click', () => {
      this.exportAudio();
    });

    // Setup modal
    UIUtils.modal.setup('export-modal', ['#export-cancel-btn']);
  }

  async exportAudio() {
    try {
      const format = document.getElementById('export-format').value;
      const quality = document.getElementById('export-quality').value;
      const filename = document.getElementById('export-filename').value;

      UIUtils.showToast('Exporting audio...', 'success', 2000);
      UIUtils.setLoadingState(document.getElementById('export-confirm-btn'), true);

      const blob = await this.audioEngine.exportAudio(format, quality);
      
      // Download the file
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      UIUtils.modal.hide('export-modal');
      UIUtils.showToast('Export completed!', 'success');
      
    } catch (error) {
      console.error('Export failed:', error);
      UIUtils.showToast('Export failed', 'error');
    } finally {
      UIUtils.setLoadingState(document.getElementById('export-confirm-btn'), false);
    }
  }

  // History management
  saveToHistory() {
    if (!this.currentFile) return;

    const state = {
      parameters: this.audioEngine.getParameters(),
      timestamp: Date.now()
    };

    // Remove any history after current index
    this.history = this.history.slice(0, this.historyIndex + 1);
    
    // Add new state
    this.history.push(state);
    this.historyIndex = this.history.length - 1;
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.historyIndex--;
    }

    this.updateHistoryButtons();
  }

  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      const state = this.history[this.historyIndex];
      this.audioEngine.setParameters(state.parameters);
      this.updateAllSliders();
      this.updateParameterDisplay();
      this.updateHistoryButtons();
      UIUtils.showToast('Undone', 'success', 1000);
    }
  }

  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      const state = this.history[this.historyIndex];
      this.audioEngine.setParameters(state.parameters);
      this.updateAllSliders();
      this.updateParameterDisplay();
      this.updateHistoryButtons();
      UIUtils.showToast('Redone', 'success', 1000);
    }
  }

  updateHistoryButtons() {
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');
    
    undoBtn.disabled = this.historyIndex <= 0;
    redoBtn.disabled = this.historyIndex >= this.history.length - 1;
  }

  updateAllSliders() {
    const params = this.audioEngine.getParameters();
    
    // Update all sliders with current parameters
    this.setSliderValue('speed-slider', 'speed-value', params.speed, 'x');
    this.setSliderValue('pitch-slider', 'pitch-value', params.pitch);
    this.setSliderValue('reverb-amount', 'reverb-amount-value', params.reverbAmount, '%');
    this.setSliderValue('room-size', 'room-size-value', params.roomSize, '%');
    this.setSliderValue('decay-time', 'decay-time-value', params.decayTime, 's');
    this.setSliderValue('eq-bass', 'eq-bass-value', params.bassGain, 'dB');
    this.setSliderValue('eq-mid', 'eq-mid-value', params.midGain, 'dB');
    this.setSliderValue('eq-treble', 'eq-treble-value', params.trebleGain, 'dB');
    this.setSliderValue('lowpass-filter', 'lowpass-value', params.lowPassFreq, 'Hz');
    this.setSliderValue('volume-slider', 'volume-value', params.volume, '%');
    this.setSliderValue('compression', 'compression-value', params.compression, '%');
    this.setSliderValue('stereo-width', 'stereo-width-value', params.stereoWidth, '%');
    this.setSliderValue('fade-in', 'fade-in-value', params.fadeIn, 's');
    this.setSliderValue('fade-out', 'fade-out-value', params.fadeOut, 's');
  }

  setSliderValue(sliderId, displayId, value, suffix = '') {
    const slider = document.getElementById(sliderId);
    const display = document.getElementById(displayId);
    
    if (slider && display) {
      slider.value = value;
      UIUtils.updateSliderDisplay(slider, display, suffix);
    }
  }

  updateParameterDisplay() {
    const params = this.audioEngine.getParameters();
    
    document.getElementById('speed-display').textContent = `${params.speed.toFixed(2)}x`;
    document.getElementById('pitch-display').textContent = params.pitch.toFixed(1);
    document.getElementById('reverb-display').textContent = `${params.reverbAmount.toFixed(0)}%`;
  }

  resetParameters() {
    // Reset to default parameters
    const defaultParams = {
      speed: 1,
      pitch: 0,
      reverbAmount: 0,
      roomSize: 50,
      decayTime: 2,
      volume: 100,
      bassGain: 0,
      midGain: 0,
      trebleGain: 0,
      lowPassFreq: 20000,
      compression: 0,
      stereoWidth: 100,
      fadeIn: 0,
      fadeOut: 0,
      panPosition: 0
    };
    
    this.audioEngine.setParameters(defaultParams);
    this.updateAllSliders();
    this.updateParameterDisplay();
  }

  updateFileInfo() {
    if (this.currentFile) {
      document.getElementById('duration').textContent = 
        UIUtils.formatTime(this.audioEngine.duration);
    }
  }

  enableControls() {
    document.getElementById('export-btn').disabled = false;
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.disabled = false;
    });
  }

  setupAutoSave() {
    // Auto-save parameters every 30 seconds
    setInterval(() => {
      if (this.currentFile) {
        const params = this.audioEngine.getParameters();
        UIUtils.storage.set('lastParameters', params);
      }
    }, 30000);

    // Load saved parameters on startup
    const savedParams = UIUtils.storage.get('lastParameters');
    if (savedParams) {
      // Will be applied when audio is loaded
      this.savedParameters = savedParams;
    }
  }

  // Animation loop for real-time updates
  startAnimationLoop() {
    const animate = () => {
      if (this.audioEngine.isPlaying) {
        this.drawWaveform();
        
        // Update time display
        const currentTime = this.audioEngine.getCurrentTime();
        document.getElementById('current-time').textContent = 
          UIUtils.formatTime(currentTime);
      }
      
      requestAnimationFrame(animate);
    };
    
    animate();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EditorController;
} else {
  window.EditorController = EditorController;
}