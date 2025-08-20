// Audio Engine - Web Audio API Wrapper & Effects

class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.audioBuffer = null;
    this.sourceNode = null;
    this.gainNode = null;
    this.analyserNode = null;
    this.convolver = null;
    
    // Effect nodes
    this.compressor = null;
    this.bassFilter = null;
    this.midFilter = null;
    this.trebleFilter = null;
    this.lowPassFilter = null;
    this.stereoPanner = null;
    this.chorus = null;
    this.delay = null;
    
    // State
    this.isPlaying = false;
    this.isPaused = false;
    this.startTime = 0;
    this.pauseTime = 0;
    this.duration = 0;
    this.playbackRate = 1;
    
    // Parameters
    this.parameters = {
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

    // Audio analysis data
    this.frequencyData = null;
    this.waveformData = null;
    
    this.init();
  }

  async init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.setupAudioNodes();
      await this.createImpulseResponse();
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
      throw error;
    }
  }

  setupAudioNodes() {
    // Create gain node
    this.gainNode = this.audioContext.createGain();
    
    // Create analyser for visualizations
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = 256;
    this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.waveformData = new Uint8Array(this.analyserNode.fftSize);
    
    // Create compressor
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
    
    // Create EQ filters
    this.bassFilter = this.audioContext.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.setValueAtTime(320, this.audioContext.currentTime);
    
    this.midFilter = this.audioContext.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    this.midFilter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
    
    this.trebleFilter = this.audioContext.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.setValueAtTime(3200, this.audioContext.currentTime);
    
    // Create low-pass filter
    this.lowPassFilter = this.audioContext.createBiquadFilter();
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.setValueAtTime(20000, this.audioContext.currentTime);
    
    // Create stereo panner
    this.stereoPanner = this.audioContext.createStereoPanner();
    
    // Create convolver for reverb
    this.convolver = this.audioContext.createConvolver();
    
    // Create delay for echo effect
    this.delay = this.audioContext.createDelay(1.0);
    this.delayGain = this.audioContext.createGain();
    this.delayFeedback = this.audioContext.createGain();
    
    // Setup delay routing
    this.delay.delayTime.setValueAtTime(0.3, this.audioContext.currentTime);
    this.delayGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.delayFeedback.gain.setValueAtTime(0.3, this.audioContext.currentTime);
  }

  async createImpulseResponse() {
    // Create impulse response for reverb
    const length = this.audioContext.sampleRate * 2; // 2 seconds
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, 2);
        channelData[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    
    this.convolver.buffer = impulse;
  }

  async loadAudioFile(file) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.duration = this.audioBuffer.duration;
      return this.audioBuffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw error;
    }
  }

  createAudioGraph() {
    if (!this.audioBuffer) return;

    // Stop any existing playback
    this.stop();

    // Create source
    this.sourceNode = this.audioContext.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.playbackRate.setValueAtTime(this.parameters.speed, this.audioContext.currentTime);

    // Create dry/wet gains for effects
    this.dryGain = this.audioContext.createGain();
    this.wetGain = this.audioContext.createGain();
    this.reverbGain = this.audioContext.createGain();

    // Connect the audio graph
    // Source -> EQ -> Filters -> Compression -> Panning -> Gain -> Output
    this.sourceNode.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.compressor);
    this.compressor.connect(this.stereoPanner);
    this.stereoPanner.connect(this.dryGain);

    // Reverb path
    this.stereoPanner.connect(this.convolver);
    this.convolver.connect(this.reverbGain);

    // Delay path
    this.stereoPanner.connect(this.delay);
    this.delay.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delay);
    this.delay.connect(this.delayGain);

    // Mix dry and wet signals
    this.dryGain.connect(this.gainNode);
    this.reverbGain.connect(this.gainNode);
    this.delayGain.connect(this.gainNode);

    // Connect to analyser and output
    this.gainNode.connect(this.analyserNode);
    this.analyserNode.connect(this.audioContext.destination);

    // Apply current parameters
    this.updateAllParameters();
  }

  play() {
    if (!this.audioBuffer) return;

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    if (this.isPaused) {
      // Resume from pause
      this.createAudioGraph();
      this.sourceNode.start(0, this.pauseTime);
      this.startTime = this.audioContext.currentTime - this.pauseTime;
      this.isPaused = false;
    } else {
      // Start from beginning
      this.createAudioGraph();
      this.sourceNode.start(0);
      this.startTime = this.audioContext.currentTime;
    }

    this.isPlaying = true;
    
    // Handle playback end
    this.sourceNode.onended = () => {
      if (this.isPlaying) {
        this.isPlaying = false;
        this.isPaused = false;
        this.pauseTime = 0;
      }
    };
  }

  pause() {
    if (this.isPlaying) {
      this.pauseTime = this.getCurrentTime();
      this.stop();
      this.isPaused = true;
    }
  }

  stop() {
    if (this.sourceNode) {
      this.sourceNode.stop();
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.pauseTime = 0;
    this.startTime = 0;
  }

  getCurrentTime() {
    if (!this.isPlaying) return this.pauseTime;
    return (this.audioContext.currentTime - this.startTime) * this.parameters.speed;
  }

  seekTo(time) {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.pauseTime = Math.max(0, Math.min(time, this.duration));
    
    if (wasPlaying) {
      this.play();
    } else {
      this.isPaused = true;
    }
  }

  // Parameter update methods
  setSpeed(speed) {
    this.parameters.speed = speed;
    if (this.sourceNode) {
      this.sourceNode.playbackRate.setValueAtTime(speed, this.audioContext.currentTime);
    }
  }

  setPitch(pitch) {
    this.parameters.pitch = pitch;
    // Pitch shifting would require more complex processing
    // For now, we'll use playback rate as approximation
    const pitchFactor = Math.pow(2, pitch / 12);
    if (this.sourceNode) {
      this.sourceNode.playbackRate.setValueAtTime(
        this.parameters.speed * pitchFactor, 
        this.audioContext.currentTime
      );
    }
  }

  setVolume(volume) {
    this.parameters.volume = volume;
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(volume / 100, this.audioContext.currentTime);
    }
  }

  setReverb(amount, roomSize, decayTime) {
    this.parameters.reverbAmount = amount;
    this.parameters.roomSize = roomSize;
    this.parameters.decayTime = decayTime;
    
    if (this.reverbGain) {
      this.reverbGain.gain.setValueAtTime(amount / 100, this.audioContext.currentTime);
    }
    
    if (this.dryGain) {
      this.dryGain.gain.setValueAtTime(1 - (amount / 100), this.audioContext.currentTime);
    }
  }

  setEQ(bass, mid, treble) {
    this.parameters.bassGain = bass;
    this.parameters.midGain = mid;
    this.parameters.trebleGain = treble;

    if (this.bassFilter) {
      this.bassFilter.gain.setValueAtTime(bass, this.audioContext.currentTime);
    }
    if (this.midFilter) {
      this.midFilter.gain.setValueAtTime(mid, this.audioContext.currentTime);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setValueAtTime(treble, this.audioContext.currentTime);
    }
  }

  setLowPassFilter(frequency) {
    this.parameters.lowPassFreq = frequency;
    if (this.lowPassFilter) {
      this.lowPassFilter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    }
  }

  setCompression(amount) {
    this.parameters.compression = amount;
    if (this.compressor) {
      // Adjust compressor parameters based on amount
      const threshold = -24 + (amount / 100) * 20;
      const ratio = 1 + (amount / 100) * 19;
      this.compressor.threshold.setValueAtTime(threshold, this.audioContext.currentTime);
      this.compressor.ratio.setValueAtTime(ratio, this.audioContext.currentTime);
    }
  }

  setPanning(position) {
    this.parameters.panPosition = position;
    if (this.stereoPanner) {
      this.stereoPanner.pan.setValueAtTime(position / 100, this.audioContext.currentTime);
    }
  }

  setStereoWidth(width) {
    this.parameters.stereoWidth = width;
    // Stereo width would require more complex processing
    // This is a simplified implementation
  }

  setDelay(time, feedback, wetness) {
    if (this.delay) {
      this.delay.delayTime.setValueAtTime(time, this.audioContext.currentTime);
    }
    if (this.delayFeedback) {
      this.delayFeedback.gain.setValueAtTime(feedback, this.audioContext.currentTime);
    }
    if (this.delayGain) {
      this.delayGain.gain.setValueAtTime(wetness, this.audioContext.currentTime);
    }
  }

  updateAllParameters() {
    this.setSpeed(this.parameters.speed);
    this.setPitch(this.parameters.pitch);
    this.setVolume(this.parameters.volume);
    this.setReverb(this.parameters.reverbAmount, this.parameters.roomSize, this.parameters.decayTime);
    this.setEQ(this.parameters.bassGain, this.parameters.midGain, this.parameters.trebleGain);
    this.setLowPassFilter(this.parameters.lowPassFreq);
    this.setCompression(this.parameters.compression);
    this.setPanning(this.parameters.panPosition);
    this.setStereoWidth(this.parameters.stereoWidth);
  }

  // Audio analysis methods
  getFrequencyData() {
    if (this.analyserNode) {
      this.analyserNode.getByteFrequencyData(this.frequencyData);
      return this.frequencyData;
    }
    return null;
  }

  getWaveformData() {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(this.waveformData);
      return this.waveformData;
    }
    return null;
  }

  // Export processed audio
  async exportAudio(format = 'wav', quality = 192) {
    if (!this.audioBuffer) throw new Error('No audio loaded');

    // Create offline context for rendering
    const offlineContext = new OfflineAudioContext(
      this.audioBuffer.numberOfChannels,
      this.audioBuffer.duration * this.audioBuffer.sampleRate,
      this.audioBuffer.sampleRate
    );

    // Create offline audio graph with current parameters
    const offlineSource = offlineContext.createBufferSource();
    offlineSource.buffer = this.audioBuffer;
    
    // Apply effects offline (simplified)
    const offlineGain = offlineContext.createGain();
    offlineGain.gain.setValueAtTime(this.parameters.volume / 100, 0);
    
    offlineSource.connect(offlineGain);
    offlineGain.connect(offlineContext.destination);
    
    offlineSource.start(0);
    
    try {
      const renderedBuffer = await offlineContext.startRendering();
      return this.bufferToBlob(renderedBuffer, format);
    } catch (error) {
      console.error('Failed to export audio:', error);
      throw error;
    }
  }

  bufferToBlob(buffer, format) {
    const length = buffer.length * buffer.numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(length + 44);
    const view = new DataView(arrayBuffer);
    
    // Write WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, length + 36, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, buffer.numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * buffer.numberOfChannels * 2, true);
    view.setUint16(32, buffer.numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length, true);
    
    // Write audio data
    let offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  // Preset loading
  async loadPreset(presetData) {
    Object.assign(this.parameters, presetData);
    this.updateAllParameters();
  }

  getParameters() {
    return { ...this.parameters };
  }

  setParameters(params) {
    Object.assign(this.parameters, params);
    this.updateAllParameters();
  }

  // Cleanup
  destroy() {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioEngine;
} else {
  window.AudioEngine = AudioEngine;
}