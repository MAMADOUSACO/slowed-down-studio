// Playlist Tab Functionality

class PlaylistController {
  constructor(audioEngine) {
    this.audioEngine = audioEngine;
    this.playlists = [];
    this.currentPlaylistId = null;
    this.draggedIndex = null;
    this.playbackMode = 'normal'; // normal, shuffle, repeat
    this.shuffleOrder = [];
    
    this.init();
  }

  init() {
    this.setupPlaylistSidebar();
    this.setupPlaylistControls();
    this.setupDragAndDrop();
    this.setupBatchOperations();
    this.loadPlaylists();
    this.createDefaultPlaylist();
  }

  setupPlaylistSidebar() {
    // New playlist button
    document.getElementById('new-playlist-btn').addEventListener('click', () => {
      this.createNewPlaylist();
    });

    // Import/Export
    document.getElementById('import-playlist-btn').addEventListener('click', () => {
      document.getElementById('import-file-input').click();
    });

    document.getElementById('import-file-input').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.importPlaylist(e.target.files[0]);
      }
    });

    // Batch upload
    document.getElementById('batch-upload-btn').addEventListener('click', () => {
      document.getElementById('batch-file-input').click();
    });

    document.getElementById('batch-file-input').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.batchUploadSongs(Array.from(e.target.files));
      }
    });
  }

  setupPlaylistControls() {
    // Playback controls
    document.getElementById('play-all-btn').addEventListener('click', () => {
      this.playAll();
    });

    document.getElementById('shuffle-btn').addEventListener('click', () => {
      this.toggleShuffle();
    });

    document.getElementById('repeat-btn').addEventListener('click', () => {
      this.toggleRepeat();
    });

    // Playlist actions
    document.getElementById('export-playlist-btn').addEventListener('click', () => {
      this.exportCurrentPlaylist();
    });

    document.getElementById('download-all-btn').addEventListener('click', () => {
      this.downloadAllSongs();
    });

    document.getElementById('clear-playlist-btn').addEventListener('click', () => {
      this.clearCurrentPlaylist();
    });
  }

  setupDragAndDrop() {
    const songList = document.getElementById('song-list');
    
    // Setup drag and drop for reordering
    UIUtils.setupDragAndDrop(songList, (files) => {
      this.addSongsToCurrentPlaylist(files);
    });
  }

  setupBatchOperations() {
    // Batch operations will be handled through context menus and selection
    this.selectedSongs = new Set();
  }

  createNewPlaylist() {
    const name = prompt('Enter playlist name:');
    if (!name || name.trim() === '') return;

    const playlist = {
      id: UIUtils.generateId(),
      name: name.trim(),
      songs: [],
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    this.playlists.push(playlist);
    this.currentPlaylistId = playlist.id;
    this.renderPlaylistSidebar();
    this.renderCurrentPlaylist();
    this.savePlaylists();
    
    UIUtils.showToast(`Created playlist: ${name}`, 'success');
  }

  createDefaultPlaylist() {
    if (this.playlists.length === 0) {
      const defaultPlaylist = {
        id: 'default',
        name: 'My Songs',
        songs: [],
        createdAt: Date.now(),
        modifiedAt: Date.now()
      };
      
      this.playlists.push(defaultPlaylist);
      this.currentPlaylistId = defaultPlaylist.id;
      this.renderPlaylistSidebar();
      this.renderCurrentPlaylist();
    }
  }

  renderPlaylistSidebar() {
    const listContainer = document.getElementById('playlist-list');
    listContainer.innerHTML = '';

    this.playlists.forEach(playlist => {
      const item = document.createElement('div');
      item.className = `playlist-item ${playlist.id === this.currentPlaylistId ? 'active' : ''}`;
      item.dataset.playlistId = playlist.id;
      
      item.innerHTML = `
        <span class="playlist-item-icon">🎵</span>
        <div class="playlist-item-info">
          <div class="playlist-item-name">${playlist.name}</div>
          <div class="playlist-item-meta">${playlist.songs.length} songs</div>
        </div>
      `;
      
      item.addEventListener('click', () => {
        this.selectPlaylist(playlist.id);
      });
      
      // Context menu for playlist options
      item.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showPlaylistContextMenu(e, playlist);
      });
      
      listContainer.appendChild(item);
    });
  }

  selectPlaylist(playlistId) {
    this.currentPlaylistId = playlistId;
    this.renderPlaylistSidebar();
    this.renderCurrentPlaylist();
  }

  getCurrentPlaylist() {
    return this.playlists.find(p => p.id === this.currentPlaylistId);
  }

  renderCurrentPlaylist() {
    const playlist = this.getCurrentPlaylist();
    
    if (!playlist) {
      this.renderEmptyState();
      return;
    }

    // Update playlist header
    document.getElementById('current-playlist-name').textContent = playlist.name;
    this.updatePlaylistStats(playlist);
    
    // Render songs
    const songList = document.getElementById('song-list');
    songList.innerHTML = '';
    
    if (playlist.songs.length === 0) {
      songList.innerHTML = `
        <div class="empty-playlist">
          <p>No songs in this playlist</p>
          <p>Add some songs to get started!</p>
        </div>
      `;
      return;
    }
    
    playlist.songs.forEach((song, index) => {
      const songItem = this.createSongItem(song, index);
      songList.appendChild(songItem);
    });

    // Show shuffle order if active
    if (this.playbackMode === 'shuffle') {
      this.renderShuffleOrder();
    }
  }

  createSongItem(song, index) {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.dataset.index = index;
    item.draggable = true;
    
    // Get song info
    const title = song.title || song.name || 'Unknown Title';
    const artist = song.artist || 'Unknown Artist';
    const duration = song.duration ? UIUtils.formatTime(song.duration) : '0:00';
    const effects = this.getSongEffectsSummary(song);
    
    item.innerHTML = `
      <span class="drag-handle">≡</span>
      <div class="song-info">
        <div class="song-title">${title}</div>
        <div class="song-meta">
          <span>${artist}</span>
          <span>${duration}</span>
          <span>${effects}</span>
        </div>
      </div>
      <div class="song-actions">
        <button class="action-btn" onclick="playlistController.playSong(${index})">▶️</button>
        <button class="action-btn" onclick="playlistController.editSong(${index})">✏️</button>
        <button class="action-btn" onclick="playlistController.removeSong(${index})">🗑️</button>
      </div>
    `;
    
    // Setup drag events
    this.setupSongDragEvents(item, index);
    
    return item;
  }

  getSongEffectsSummary(song) {
    if (!song.parameters) return 'No effects';
    
    const params = song.parameters;
    const effects = [];
    
    if (params.speed !== 1) effects.push(`${params.speed.toFixed(2)}x`);
    if (params.pitch !== 0) effects.push(`${params.pitch > 0 ? '+' : ''}${params.pitch.toFixed(1)}`);
    if (params.reverbAmount > 0) effects.push(`Rev:${params.reverbAmount.toFixed(0)}%`);
    
    return effects.length > 0 ? effects.join(', ') : 'No effects';
  }

  setupSongDragEvents(item, index) {
    item.addEventListener('dragstart', (e) => {
      this.draggedIndex = index;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      this.draggedIndex = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      if (this.draggedIndex !== null && this.draggedIndex !== index) {
        this.reorderSong(this.draggedIndex, index);
      }
    });
  }

  reorderSong(fromIndex, toIndex) {
    const playlist = this.getCurrentPlaylist();
    if (!playlist) return;

    const song = playlist.songs.splice(fromIndex, 1)[0];
    playlist.songs.splice(toIndex, 0, song);
    
    playlist.modifiedAt = Date.now();
    this.savePlaylists();
    this.renderCurrentPlaylist();
    
    UIUtils.showToast('Song reordered', 'success', 1000);
  }

  playSong(index) {
    const playlist = this.getCurrentPlaylist();
    if (!playlist || !playlist.songs[index]) return;

    const song = playlist.songs[index];
    
    // Switch to player tab and load song
    window.app.switchTab('player');
    window.app.player.loadSong(song, playlist, index);
    
    UIUtils.showToast(`Playing: ${song.title || song.name}`, 'success');
  }

  editSong(index) {
    const playlist = this.getCurrentPlaylist();
    if (!playlist || !playlist.songs[index]) return;

    const song = playlist.songs[index];
    
    // Switch to editor tab with song
    window.app.switchTab('editor');
    window.app.editor.handleFileUpload(song.file);
    
    if (song.parameters) {
      setTimeout(() => {
        window.app.audioEngine.setParameters(song.parameters);
        window.app.editor.updateAllSliders();
      }, 500);
    }
  }

  removeSong(index) {
    const playlist = this.getCurrentPlaylist();
    if (!playlist || !playlist.songs[index]) return;

    const song = playlist.songs[index];
    const confirm = window.confirm(`Remove "${song.title || song.name}" from playlist?`);
    
    if (confirm) {
      playlist.songs.splice(index, 1);
      playlist.modifiedAt = Date.now();
      this.savePlaylists();
      this.renderCurrentPlaylist();
      
      UIUtils.showToast('Song removed from playlist', 'success');
    }
  }

  addSongToPlaylist(songData, playlistId = null) {
    const targetPlaylistId = playlistId || this.currentPlaylistId;
    const playlist = this.playlists.find(p => p.id === targetPlaylistId);
    
    if (!playlist) {
      UIUtils.showToast('Playlist not found', 'error');
      return;
    }

    // Check for duplicates
    const exists = playlist.songs.some(song => 
      song.name === songData.name && song.size === songData.size
    );
    
    if (exists) {
      UIUtils.showToast('Song already exists in playlist', 'warning');
      return;
    }

    playlist.songs.push(songData);
    playlist.modifiedAt = Date.now();
    this.savePlaylists();
    
    if (targetPlaylistId === this.currentPlaylistId) {
      this.renderCurrentPlaylist();
    }
    this.renderPlaylistSidebar();
    
    UIUtils.showToast(`Added to ${playlist.name}`, 'success');
  }

  async addSongsToCurrentPlaylist(files) {
    const playlist = this.getCurrentPlaylist();
    if (!playlist) return;

    let addedCount = 0;
    
    for (const file of files) {
      if (UIUtils.isValidAudioFile(file)) {
        const songData = {
          id: UIUtils.generateId(),
          name: file.name,
          title: file.name.replace(/\.[^/.]+$/, ''),
          file: file,
          size: file.size,
          addedAt: Date.now(),
          parameters: null
        };
        
        // Check for duplicates
        const exists = playlist.songs.some(song => 
          song.name === file.name && song.size === file.size
        );
        
        if (!exists) {
          playlist.songs.push(songData);
          addedCount++;
        }
      }
    }
    
    if (addedCount > 0) {
      playlist.modifiedAt = Date.now();
      this.savePlaylists();
      this.renderCurrentPlaylist();
      this.renderPlaylistSidebar();
      
      UIUtils.showToast(`Added ${addedCount} song(s) to playlist`, 'success');
    } else {
      UIUtils.showToast('No valid audio files to add', 'warning');
    }
  }

  async batchUploadSongs(files) {
    if (!this.currentPlaylistId) {
      UIUtils.showToast('Please select a playlist first', 'warning');
      return;
    }
    
    await this.addSongsToCurrentPlaylist(files);
  }

  playAll() {
    const playlist = this.getCurrentPlaylist();
    if (!playlist || playlist.songs.length === 0) {
      UIUtils.showToast('No songs in playlist', 'warning');
      return;
    }

    this.playSong(0);
  }

  toggleShuffle() {
    const shuffleBtn = document.getElementById('shuffle-btn');
    
    if (this.playbackMode === 'shuffle') {
      this.playbackMode = 'normal';
      shuffleBtn.classList.remove('active');
      this.hideShuffleOrder();
      UIUtils.showToast('Shuffle disabled', 'success', 1000);
    } else {
      this.playbackMode = 'shuffle';
      shuffleBtn.classList.add('active');
      this.generateShuffleOrder();
      this.renderShuffleOrder();
      UIUtils.showToast('Shuffle enabled', 'success', 1000);
    }
  }

  toggleRepeat() {
    const repeatBtn = document.getElementById('repeat-btn');
    
    if (this.playbackMode === 'repeat') {
      this.playbackMode = 'normal';
      repeatBtn.classList.remove('active');
      UIUtils.showToast('Repeat disabled', 'success', 1000);
    } else {
      this.playbackMode = 'repeat';
      repeatBtn.classList.add('active');
      UIUtils.showToast('Repeat enabled', 'success', 1000);
    }
  }

  generateShuffleOrder() {
    const playlist = this.getCurrentPlaylist();
    if (!playlist) return;

    this.shuffleOrder = [...Array(playlist.songs.length).keys()];
    
    // Fisher-Yates shuffle algorithm
    for (let i = this.shuffleOrder.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffleOrder[i], this.shuffleOrder[j]] = [this.shuffleOrder[j], this.shuffleOrder[i]];
    }
  }

  renderShuffleOrder() {
    const playlist = this.getCurrentPlaylist();
    if (!playlist || this.playbackMode !== 'shuffle') return;

    const songList = document.getElementById('song-list');
    let shuffleDisplay = document.getElementById('shuffle-order');
    
    if (!shuffleDisplay) {
      shuffleDisplay = document.createElement('div');
      shuffleDisplay.id = 'shuffle-order';
      shuffleDisplay.className = 'shuffle-order';
      songList.appendChild(shuffleDisplay);
    }
    
    shuffleDisplay.innerHTML = `
      <h5>Shuffle Play Order:</h5>
      <div class="shuffle-list">
        ${this.shuffleOrder.map((songIndex, playOrder) => `
          <span class="shuffle-item ${playOrder === 0 ? 'current' : ''}">
            ${playOrder + 1}: ${playlist.songs[songIndex]?.title || playlist.songs[songIndex]?.name || 'Unknown'}
          </span>
        `).join('')}
      </div>
    `;
  }

  hideShuffleOrder() {
    const shuffleDisplay = document.getElementById('shuffle-order');
    if (shuffleDisplay) {
      shuffleDisplay.remove();
    }
  }

  updatePlaylistStats(playlist) {
    const songCount = playlist.songs.length;
    const totalDuration = playlist.songs.reduce((total, song) => {
      return total + (song.duration || 0);
    }, 0);
    
    document.getElementById('playlist-song-count').textContent = 
      `${songCount} song${songCount !== 1 ? 's' : ''}`;
    document.getElementById('playlist-duration').textContent = 
      UIUtils.formatTime(totalDuration);
  }

  renderEmptyState() {
    document.getElementById('current-playlist-name').textContent = 'Select a Playlist';
    document.getElementById('playlist-song-count').textContent = '0 songs';
    document.getElementById('playlist-duration').textContent = '0:00 total';
    
    const songList = document.getElementById('song-list');
    songList.innerHTML = `
      <div class="empty-playlist">
        <p>No playlist selected</p>
        <p>Create or select a playlist to get started!</p>
      </div>
    `;
  }

  exportCurrentPlaylist() {
    const playlist = this.getCurrentPlaylist();
    if (!playlist) {
      UIUtils.showToast('No playlist selected', 'warning');
      return;
    }

    // Create export data (without actual file objects)
    const exportData = {
      name: playlist.name,
      songs: playlist.songs.map(song => ({
        title: song.title,
        name: song.name,
        artist: song.artist,
        duration: song.duration,
        parameters: song.parameters,
        addedAt: song.addedAt
      })),
      createdAt: playlist.createdAt,
      modifiedAt: playlist.modifiedAt,
      exportedAt: Date.now()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlist.name.replace(/[^a-z0-9]/gi, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    UIUtils.showToast('Playlist exported', 'success');
  }

  async importPlaylist(file) {
    try {
      const text = await file.text();
      const playlistData = JSON.parse(text);
      
      const playlist = {
        id: UIUtils.generateId(),
        name: playlistData.name || 'Imported Playlist',
        songs: [], // Songs will need to be re-added manually
        createdAt: Date.now(),
        modifiedAt: Date.now()
      };
      
      this.playlists.push(playlist);
      this.currentPlaylistId = playlist.id;
      this.savePlaylists();
      this.renderPlaylistSidebar();
      this.renderCurrentPlaylist();
      
      UIUtils.showToast(`Imported playlist: ${playlist.name}`, 'success');
      UIUtils.showToast('Note: You\'ll need to re-add the audio files', 'warning', 5000);
      
    } catch (error) {
      console.error('Failed to import playlist:', error);
      UIUtils.showToast('Failed to import playlist', 'error');
    }
  }

  async downloadAllSongs() {
    const playlist = this.getCurrentPlaylist();
    if (!playlist || playlist.songs.length === 0) {
      UIUtils.showToast('No songs to download', 'warning');
      return;
    }

    UIUtils.showToast('This feature would export all songs with their effects', 'success');
    // Implementation would require processing each song through the audio engine
  }

  clearCurrentPlaylist() {
    const playlist = this.getCurrentPlaylist();
    if (!playlist) return;

    const confirm = window.confirm(`Clear all songs from "${playlist.name}"?`);
    if (confirm) {
      playlist.songs = [];
      playlist.modifiedAt = Date.now();
      this.savePlaylists();
      this.renderCurrentPlaylist();
      this.renderPlaylistSidebar();
      
      UIUtils.showToast('Playlist cleared', 'success');
    }
  }

  showPlaylistContextMenu(event, playlist) {
    // Create context menu for playlist operations
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.innerHTML = `
      <button onclick="playlistController.renamePlaylist('${playlist.id}')">Rename</button>
      <button onclick="playlistController.duplicatePlaylist('${playlist.id}')">Duplicate</button>
      <button onclick="playlistController.deletePlaylist('${playlist.id}')">Delete</button>
    `;
    
    menu.style.position = 'fixed';
    menu.style.left = event.clientX + 'px';
    menu.style.top = event.clientY + 'px';
    menu.style.zIndex = '1000';
    
    document.body.appendChild(menu);
    
    // Remove menu on click outside
    setTimeout(() => {
      document.addEventListener('click', () => {
        if (document.body.contains(menu)) {
          document.body.removeChild(menu);
        }
      }, { once: true });
    }, 100);
  }

  renamePlaylist(playlistId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const newName = prompt('Enter new name:', playlist.name);
    if (newName && newName.trim() !== '') {
      playlist.name = newName.trim();
      playlist.modifiedAt = Date.now();
      this.savePlaylists();
      this.renderPlaylistSidebar();
      this.renderCurrentPlaylist();
      
      UIUtils.showToast('Playlist renamed', 'success');
    }
  }

  duplicatePlaylist(playlistId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const duplicate = {
      ...playlist,
      id: UIUtils.generateId(),
      name: `${playlist.name} (Copy)`,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      songs: [...playlist.songs] // Shallow copy
    };
    
    this.playlists.push(duplicate);
    this.savePlaylists();
    this.renderPlaylistSidebar();
    
    UIUtils.showToast('Playlist duplicated', 'success');
  }

  deletePlaylist(playlistId) {
    const playlist = this.playlists.find(p => p.id === playlistId);
    if (!playlist) return;

    const confirm = window.confirm(`Delete playlist "${playlist.name}"?`);
    if (confirm) {
      this.playlists = this.playlists.filter(p => p.id !== playlistId);
      
      if (this.currentPlaylistId === playlistId) {
        this.currentPlaylistId = this.playlists.length > 0 ? this.playlists[0].id : null;
      }
      
      this.savePlaylists();
      this.renderPlaylistSidebar();
      this.renderCurrentPlaylist();
      
      UIUtils.showToast('Playlist deleted', 'success');
    }
  }

  // Data persistence
  savePlaylists() {
    try {
      // Save playlist metadata (without file objects)
      const playlistsData = this.playlists.map(playlist => ({
        ...playlist,
        songs: playlist.songs.map(song => ({
          ...song,
          file: null // Don't save file objects
        }))
      }));
      
      UIUtils.storage.set('playlists', playlistsData);
    } catch (error) {
      console.warn('Failed to save playlists:', error);
    }
  }

  loadPlaylists() {
    try {
      const playlistsData = UIUtils.storage.get('playlists', []);
      this.playlists = playlistsData;
      
      if (this.playlists.length > 0) {
        this.currentPlaylistId = this.playlists[0].id;
        this.renderPlaylistSidebar();
        this.renderCurrentPlaylist();
      }
    } catch (error) {
      console.warn('Failed to load playlists:', error);
      this.playlists = [];
    }
  }

  // Get next song for player
  getNextSong(currentIndex) {
    const playlist = this.getCurrentPlaylist();
    if (!playlist || playlist.songs.length === 0) return null;

    if (this.playbackMode === 'shuffle') {
      const currentShuffleIndex = this.shuffleOrder.indexOf(currentIndex);
      const nextShuffleIndex = (currentShuffleIndex + 1) % this.shuffleOrder.length;
      return {
        song: playlist.songs[this.shuffleOrder[nextShuffleIndex]],
        index: this.shuffleOrder[nextShuffleIndex]
      };
    } else {
      const nextIndex = (currentIndex + 1) % playlist.songs.length;
      return {
        song: playlist.songs[nextIndex],
        index: nextIndex
      };
    }
  }

  getPreviousSong(currentIndex) {
    const playlist = this.getCurrentPlaylist();
    if (!playlist || playlist.songs.length === 0) return null;

    if (this.playbackMode === 'shuffle') {
      const currentShuffleIndex = this.shuffleOrder.indexOf(currentIndex);
      const prevShuffleIndex = currentShuffleIndex === 0 ? 
        this.shuffleOrder.length - 1 : currentShuffleIndex - 1;
      return {
        song: playlist.songs[this.shuffleOrder[prevShuffleIndex]],
        index: this.shuffleOrder[prevShuffleIndex]
      };
    } else {
      const prevIndex = currentIndex === 0 ? 
        playlist.songs.length - 1 : currentIndex - 1;
      return {
        song: playlist.songs[prevIndex],
        index: prevIndex
      };
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PlaylistController;
} else {
  window.PlaylistController = PlaylistController;
}