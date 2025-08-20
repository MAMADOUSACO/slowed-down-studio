// Player Tab Functionality

class PlayerController {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.currentSong = null;
    this.currentPlaylist = null;
    this.currentIndex = 0;
    
    // Visualizer
    this.visualizerCanvas = null;
    this.visualizerCtx = null;
    this.isFullscreen = false;
    this.animationId = null;
    
    // Crossfade settings
    this.crossfadeDuration = 3; // seconds
    this.nextAudioEngine = null;
    
    this.init();
  }

  init() {
    this.setupVisualizer();
    this.setupControls();
    this.setupTimelineControls();
    this.setupVolumeControls();
    this.setupActions();
    this.startVisualizerLoop();
  }

  setupVisualizer() {
    this.visualizerCanvas = document.getElementById('audio-visualizer');
    this.visualizerCtx = this.visualizerCanvas.getContext('2d');
    
    const resizeCanvas = () => {
      const rect = this.visualizerCanvas.getBoundingClientRect();
      this.visualizerCanvas.width = rect.width * window.devicePixelRatio;
      this.visualizerCanvas.height = rect.height * window.devicePixelRatio;
      this.visualizerCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    window.addEventListener('resize', UIUtils.debounce(resizeCanvas, 250));
    resizeCanvas();

    // Fullscreen toggle
    const fullscreenBtn = document.getElementById('fullscreen-viz-btn');
    fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreenVisualizer();
    });

    // Click visualizer to toggle fullscreen
    this.visualizerCanvas.addEventListener('click', () => {
      this.toggleFullscreenVisualizer();
    });
  }

  setupControls() {
    // Main playback controls
    document.getElementById('player-play-btn').addEventListener('click', () => {
      this.togglePlayback();
    });

    document.getElementById('prev-btn').addEventListener('click', () => {
      this.previousSong();
    });

    document.getElementById('next-btn').addEventListener('click', () => {
      this.nextSong();
    });
  }

  setupTimelineControls() {
    const timelineSlider = document.getElementById('timeline-slider');
    let isDragging = false;

    timelineSlider.addEventListener('mousedown', () => {
      isDragging = true;
    });

    timelineSlider.addEventListener('mouseup', () => {
      isDragging = false;
    });

    timelineSlider.addEventListener('input', () => {
      if (isDragging && this.audioEngine.audioBuffer) {
        const progress = timelineSlider.value / 100;
        const seekTime = progress * this.audioEngine.duration;
        this.audioEngine.seekTo(seekTime);
      }
    });

    // Update timeline regularly
    setInterval(() => {
      if (!isDragging && this.audioEngine.isPlaying) {
        this.updateTimeline();
      }
    }, 100);
  }

  setupVolumeControls() {
    const volumeSlider = document.getElementById('player-volume');
    const speedSlider = document.getElementById('player-speed');
    const speedDisplay = document.getElementById('player-speed-display');

    volumeSlider.addEventListener('input', () => {
      this.audioEngine.setVolume(volumeSlider.value);
    });

    speedSlider.addEventListener('input', () => {
      const speed = parseFloat(speedSlider.value);
      this.audioEngine.setSpeed(speed);
      speedDisplay.textContent = `${speed}x`;
    });

    // Initialize displays
    speedDisplay.textContent = `${speedSlider.value}x`;
  }

  setupActions() {
    document.getElementById('edit-current-btn').addEventListener('click', () => {
      if (this.currentSong) {
        // Switch to editor tab with current song
        window.app.switchToEditor(this.currentSong);
      } else {
        UIUtils.showToast('No song is currently loaded', 'warning');
      }
    });

    document.getElementById('add-to-playlist-btn').addEventListener('click', () => {
      if (this.currentSong) {
        // Show playlist selection or create new playlist
        this.showPlaylistSelection();
      } else {
        UIUtils.showToast('No song is currently loaded', 'warning');
      }
    });
  }

  loadSong(songData, playlistData = null, index = 0) {
    this.currentSong = songData;
    this.currentPlaylist = playlistData;
    this.currentIndex = index;
    
    // Update now playing display
    this.updateNowPlaying();
    
    // Update playlist context
    this.updatePlaylistContext();
    
    // Update effects summary
    this.updateEffectsSummary();
    
    // Load audio file
    if (songData.file) {
      this.audioEngine.loadAudioFile(songData.file).then(() => {
        if (songData.parameters) {
          this.audioEngine.setParameters(songData.parameters);
        }
        this.updateDuration();
      }).catch(error => {
        console.error('Failed to load song:', error);
        UIUtils.showToast('Failed to load song', 'error');
      });
    }
  }

  updateNowPlaying() {
    const titleElement = document.getElementById('now-playing-title');
    const artistElement = document.getElementById('now-playing-artist');
    
    if (this.currentSong) {
      titleElement.textContent = this.currentSong.title || this.currentSong.name || 'Unknown Title';
      artistElement.textContent = this.currentSong.artist || 'Unknown Artist';
    } else {
      titleElement.textContent = 'No Song Selected';
      artistElement.textContent = 'Upload or select a song to start';
    }
  }

  updatePlaylistContext() {
    const contextElement = document.getElementById('playlist-context');
    const playlistNameElement = document.getElementById('context-playlist-name');
    
    if (this.currentPlaylist) {
      playlistNameElement.textContent = this.currentPlaylist.name;
      contextElement.style.display = 'block';
    } else {
      contextElement.style.display = 'none';
    }
  }

  updateEffectsSummary() {
    const summaryElement = document.getElementById('effects-summary');
    
    if (this.currentSong && this.currentSong.parameters) {
      const params = this.currentSong.parameters;
      const effects = [];
      
      if (params.speed !== 1) {
        effects.push(`Speed: ${params.speed.toFixed(2)}x`);
      }
      
      if (params.pitch !== 0) {
        effects.push(`Pitch: ${params.pitch > 0 ? '+' : ''}${params.pitch.toFixed(1)}`);
      }
      
      if (params.reverbAmount > 0) {
        effects.push(`Reverb: ${params.reverbAmount.toFixed(0)}%`);
      }
      
      if (params.bassGain !== 0 || params.midGain !== 0 || params.trebleGain !== 0) {
        effects.push('EQ Applied');
      }
      
      if (params.compression > 0) {
        effects.push(`Compression: ${params.compression.toFixed(0)}%`);
      }
      
      if (params.lowPassFreq < 20000) {
        effects.push(`Low-pass: ${params.lowPassFreq}Hz`);
      }
      
      if (effects.length > 0) {
        summaryElement.innerHTML = effects.map(effect => 
          `<span class="effect-tag active">${effect}</span>`
        ).join('');
      } else {
        summaryElement.innerHTML = '<span class="effect-tag">No effects applied</span>';
      }
    } else {
      summaryElement.innerHTML = '<span class="effect-tag">No effects applied</span>';
    }
  }

  togglePlayback() {
    if (!this.currentSong) {
      UIUtils.showToast('No song loaded', 'warning');
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
    const playBtn = document.getElementById('player-play-btn');
    playBtn.textContent = this.audioEngine.isPlaying ? '⏸️' : '▶️';
  }

  previousSong() {
    if (!this.currentPlaylist || this.currentPlaylist.songs.length === 0) {
      UIUtils.showToast('No playlist loaded', 'warning');
      return;
    }

    let newIndex = this.currentIndex - 1;
    if (newIndex < 0) {
      newIndex = this.currentPlaylist.songs.length - 1; // Loop to end
    }
    
    this.loadSong(
      this.currentPlaylist.songs[newIndex], 
      this.currentPlaylist, 
      newIndex
    );
    
    // Auto-play if currently playing
    if (this.audioEngine.isPlaying) {
      setTimeout(() => this.audioEngine.play(), 100);
    }
  }

  nextSong() {
    if (!this.currentPlaylist || this.currentPlaylist.songs.length === 0) {
      UIUtils.showToast('No playlist loaded', 'warning');
      return;
    }

    let newIndex = this.currentIndex + 1;
    if (newIndex >= this.currentPlaylist.songs.length) {
      newIndex = 0; // Loop to beginning
    }
    
    this.loadSong(
      this.currentPlaylist.songs[newIndex], 
      this.currentPlaylist, 
      newIndex
    );
    
    // Auto-play if currently playing
    if (this.audioEngine.isPlaying) {
      setTimeout(() => this.audioEngine.play(), 100);
    }
  }

  updateTimeline() {
    if (!this.audioEngine.audioBuffer) return;

    const currentTime = this.audioEngine.getCurrentTime();
    const duration = this.audioEngine.duration;
    const progress = (currentTime / duration) * 100;
    
    document.getElementById('timeline-slider').value = progress;
    document.getElementById('player-current-time').textContent = 
      UIUtils.formatTime(currentTime);
  }

  updateDuration() {
    if (this.audioEngine.audioBuffer) {
      document.getElementById('player-duration').textContent = 
        UIUtils.formatTime(this.audioEngine.duration);
    }
  }

  toggleFullscreenVisualizer() {
    if (!this.isFullscreen) {
      this.enterFullscreenVisualizer();
    } else {
      this.exitFullscreenVisualizer();
    }
  }

  enterFullscreenVisualizer() {
    const container = document.createElement('div');
    container.className = 'visualizer-fullscreen';
    container.id = 'fullscreen-visualizer';
    
    // Clone canvas
    const fullscreenCanvas = this.visualizerCanvas.cloneNode();
    fullscreenCanvas.id = 'fullscreen-canvas';
    
    // Add exit button
    const exitBtn = document.createElement('button');
    exitBtn.className = 'fullscreen-btn';
    exitBtn.textContent = '✕';
    exitBtn.addEventListener('click', () => this.exitFullscreenVisualizer());
    
    container.appendChild(fullscreenCanvas);
    container.appendChild(exitBtn);
    document.body.appendChild(container);
    
    // Setup fullscreen canvas
    this.fullscreenCanvas = fullscreenCanvas;
    this.fullscreenCtx = fullscreenCanvas.getContext('2d');
    
    const resizeFullscreen = () => {
      fullscreenCanvas.width = window.innerWidth * window.devicePixelRatio;
      fullscreenCanvas.height = window.innerHeight * window.devicePixelRatio;
      this.fullscreenCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    
    resizeFullscreen();
    this.isFullscreen = true;
    
    // Handle escape key
    this.fullscreenKeyHandler = (e) => {
      if (e.key === 'Escape') {
        this.exitFullscreenVisualizer();
      }
    };
    document.addEventListener('keydown', this.fullscreenKeyHandler);
    
    UIUtils.showToast('Press ESC to exit fullscreen', 'success', 2000);
  }

  exitFullscreenVisualizer() {
    const container = document.getElementById('fullscreen-visualizer');
    if (container) {
      document.body.removeChild(container);
    }
    
    this.fullscreenCanvas = null;
    this.fullscreenCtx = null;
    this.isFullscreen = false;
    
    if (this.fullscreenKeyHandler) {
      document.removeEventListener('keydown', this.fullscreenKeyHandler);
      this.fullscreenKeyHandler = null;
    }
  }

  startVisualizerLoop() {
    const draw = () => {
      this.drawVisualizer();
      this.animationId = requestAnimationFrame(draw);
    };
    draw();
  }

  drawVisualizer() {
    // Draw on main canvas
    this.drawVisualizerOnCanvas(this.visualizerCanvas, this.visualizerCtx);
    
    // Draw on fullscreen canvas if active
    if (this.isFullscreen && this.fullscreenCanvas) {
      this.drawVisualizerOnCanvas(this.fullscreenCanvas, this.fullscreenCtx);
    }
  }

  drawVisualizerOnCanvas(canvas, ctx) {
    if (!ctx || !canvas) return;

    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    
    // Clear canvas with fade effect
    ctx.fillStyle = 'rgba(26, 26, 26, 0.1)';
    ctx.fillRect(0, 0, width, height);
    
    // Get frequency data
    const frequencyData = this.audioEngine.getFrequencyData();
    
    if (!frequencyData) {
      // Draw idle animation
      this.drawIdleAnimation(ctx, width, height);
      return;
    }
    
    // Draw frequency bars
    this.drawFrequencyBars(ctx, width, height, frequencyData);
    
    // Draw waveform overlay
    this.drawWaveformOverlay(ctx, width, height);
    
    // Draw particles effect
    this.drawParticles(ctx, width, height, frequencyData);
  }

  drawIdleAnimation(ctx, width, height) {
    const time = Date.now() * 0.002;
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw animated circles
    for (let i = 0; i < 3; i++) {
      const radius = 20 + i * 15 + Math.sin(time + i) * 10;
      const alpha = 0.3 - i * 0.1;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawFrequencyBars(ctx, width, height, frequencyData) {
    const barCount = 64;
    const barWidth = width / barCount;
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor(i * frequencyData.length / barCount);
      const barHeight = (frequencyData[dataIndex] / 255) * height * 0.8;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
      const hue = (i / barCount) * 360 + Date.now() * 0.1;
      gradient.addColorStop(0, `hsl(${hue % 360}, 70%, 60%)`);
      gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 80%, 70%)`);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 1, barHeight);
    }
  }

  drawWaveformOverlay(ctx, width, height) {
    const waveformData = this.audioEngine.getWaveformData();
    if (!waveformData) return;
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < waveformData.length; i++) {
      const x = (i / waveformData.length) * width;
      const y = ((waveformData[i] - 128) / 128) * (height / 4) + height / 2;
      
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    
    ctx.stroke();
  }

  drawParticles(ctx, width, height, frequencyData) {
    if (!this.particles) {
      this.particles = [];
      for (let i = 0; i < 50; i++) {
        this.particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          life: Math.random()
        });
      }
    }
    
    // Update and draw particles
    const avgFreq = frequencyData.reduce((a, b) => a + b, 0) / frequencyData.length;
    const intensity = avgFreq / 255;
    
    this.particles.forEach(particle => {
      // Update position
      particle.x += particle.vx * (1 + intensity);
      particle.y += particle.vy * (1 + intensity);
      
      // Wrap around edges
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
      
      // Update life
      particle.life += intensity * 0.01;
      if (particle.life > 1) particle.life = 0;
      
      // Draw particle
      const alpha = Math.sin(particle.life * Math.PI) * intensity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2 + intensity * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
      ctx.fill();
    });
  }

  showPlaylistSelection() {
    // This would show a modal to select which playlist to add the song to
    // For now, we'll just trigger the playlist tab
    UIUtils.showToast('Switch to Playlist tab to add this song', 'success');
    window.app.switchTab('playlist');
  }

  // Crossfade functionality for smooth transitions
  async prepareCrossfade(nextSong) {
    if (!this.nextAudioEngine) {
      this.nextAudioEngine = new AudioEngine();
      await this.nextAudioEngine.init();
    }
    
    await this.nextAudioEngine.loadAudioFile(nextSong.file);
    if (nextSong.parameters) {
      this.nextAudioEngine.setParameters(nextSong.parameters);
    }
  }

  startCrossfade() {
    if (!this.nextAudioEngine) return;
    
    const fadeTime = this.crossfadeDuration;
    const currentTime = this.audioEngine.audioContext.currentTime;
    
    // Start next song
    this.nextAudioEngine.play();
    this.nextAudioEngine.gainNode.gain.setValueAtTime(0, currentTime);
    this.nextAudioEngine.gainNode.gain.linearRampToValueAtTime(1, currentTime + fadeTime);
    
    // Fade out current song
    this.audioEngine.gainNode.gain.setValueAtTime(1, currentTime);
    this.audioEngine.gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeTime);
    
    // Switch engines after fade
    setTimeout(() => {
      this.audioEngine.stop();
      [this.audioEngine, this.nextAudioEngine] = [this.nextAudioEngine, this.audioEngine];
      this.nextAudioEngine = null;
    }, fadeTime * 1000);
  }

  // Gapless playback
  enableGaplessPlayback(enable = true) {
    this.gaplessPlayback = enable;
    if (enable) {
      // Preload next song when current song is 75% complete
      this.setupGaplessPreloading();
    }
  }

  setupGaplessPreloading() {
    setInterval(() => {
      if (this.audioEngine.isPlaying && this.currentPlaylist) {
        const progress = this.audioEngine.getCurrentTime() / this.audioEngine.duration;
        
        if (progress > 0.75 && !this.nextPreloaded) {
          const nextIndex = (this.currentIndex + 1) % this.currentPlaylist.songs.length;
          const nextSong = this.currentPlaylist.songs[nextIndex];
          
          if (nextSong) {
            this.prepareCrossfade(nextSong);
            this.nextPreloaded = true;
          }
        }
        
        // Reset preload flag when song changes
        if (progress < 0.1) {
          this.nextPreloaded = false;
        }
      }
    }, 1000);
  }

  // Cleanup
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    
    if (this.isFullscreen) {
      this.exitFullscreenVisualizer();
    }
    
    if (this.nextAudioEngine) {
      this.nextAudioEngine.destroy();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlayerController;
} else {
  window.PlayerController = PlayerController;
}