const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

class PreferencesManager {
  constructor() {
    this.preferencesPath = path.join(app.getPath('userData'), 'preferences.json');
    this.defaultPreferences = {
      theme: 'light', // 'light', 'dark', 'forest-green', 'blue-moon', 'monochrome', 'valentine', 'desert', 'polar', 'orange-blossom', 'christmas'
      defaultFolder: null, // path to default folder
      templatesFolder: null, // path to templates folder
      autoSave: false,
      autoSaveInterval: 30000, // 30 seconds
      fontSize: 14,
      fontFamily: 'monospace',
      wordWrap: true,
      showLineNumbers: false,
      tabSize: 2,
      recentFiles: [], // recently opened files
      recentFolders: [] // recently opened folders
    };
    this.preferences = { ...this.defaultPreferences };
    this.loaded = false;
  }

  async load() {
    try {
      const data = await fs.readFile(this.preferencesPath, 'utf-8');
      const saved = JSON.parse(data);
      this.preferences = { ...this.defaultPreferences, ...saved };
      this.loaded = true;
      console.log('Preferences loaded:', this.preferences);
    } catch (error) {
      console.log('No preferences file found, using defaults');
      this.preferences = { ...this.defaultPreferences };
      this.loaded = true;
      await this.save(); // Create initial preferences file
    }
    return this.preferences;
  }

  async save() {
    try {
      await fs.writeFile(this.preferencesPath, JSON.stringify(this.preferences, null, 2));
      console.log('Preferences saved');
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  get(key) {
    if (!this.loaded) {
      console.warn('Preferences not loaded yet');
      return this.defaultPreferences[key];
    }
    return this.preferences[key];
  }

  async set(key, value) {
    this.preferences[key] = value;
    await this.save();
    return this.preferences[key];
  }

  async setMultiple(updates) {
    Object.assign(this.preferences, updates);
    await this.save();
    return this.preferences;
  }

  getAll() {
    return { ...this.preferences };
  }

  async reset() {
    this.preferences = { ...this.defaultPreferences };
    await this.save();
    return this.preferences;
  }

  // Validate folder paths
  async validateFolder(folderPath) {
    if (!folderPath) return false;
    try {
      const stats = await fs.stat(folderPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  // Get template files from templates folder
  async getTemplates() {
    const templatesFolder = this.get('templatesFolder');
    if (!templatesFolder || !(await this.validateFolder(templatesFolder))) {
      return [];
    }

    try {
      const files = await fs.readdir(templatesFolder);
      const templates = [];

      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.markdown') || file.endsWith('.txt')) {
          const filePath = path.join(templatesFolder, file);
          const stats = await fs.stat(filePath);
          if (stats.isFile()) {
            templates.push({
              name: path.basename(file, path.extname(file)),
              path: filePath,
              extension: path.extname(file)
            });
          }
        }
      }

      return templates.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to read templates folder:', error);
      return [];
    }
  }

  // Add a file to recent files list
  async addRecentFile(filePath) {
    if (!filePath) return;
    
    let recentFiles = this.get('recentFiles') || [];
    
    // Remove if already exists to avoid duplicates
    recentFiles = recentFiles.filter(f => f !== filePath);
    
    // Add to beginning of list
    recentFiles.unshift(filePath);
    
    // Keep only last 10 files
    recentFiles = recentFiles.slice(0, 10);
    
    await this.set('recentFiles', recentFiles);
  }

  // Add a folder to recent folders list
  async addRecentFolder(folderPath) {
    if (!folderPath) return;
    
    let recentFolders = this.get('recentFolders') || [];
    
    // Remove if already exists to avoid duplicates
    recentFolders = recentFolders.filter(f => f !== folderPath);
    
    // Add to beginning of list
    recentFolders.unshift(folderPath);
    
    // Keep only last 10 folders
    recentFolders = recentFolders.slice(0, 10);
    
    await this.set('recentFolders', recentFolders);
  }

  // Get recent files, filtering out non-existent ones
  async getRecentFiles() {
    const recentFiles = this.get('recentFiles') || [];
    const validFiles = [];
    
    for (const filePath of recentFiles) {
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          validFiles.push(filePath);
        }
      } catch {
        // File no longer exists, skip it
      }
    }
    
    // Update the list if any files were removed
    if (validFiles.length !== recentFiles.length) {
      await this.set('recentFiles', validFiles);
    }
    
    return validFiles;
  }

  // Get recent folders, filtering out non-existent ones
  async getRecentFolders() {
    const recentFolders = this.get('recentFolders') || [];
    const validFolders = [];
    
    for (const folderPath of recentFolders) {
      try {
        const stats = await fs.stat(folderPath);
        if (stats.isDirectory()) {
          validFolders.push(folderPath);
        }
      } catch {
        // Folder no longer exists, skip it
      }
    }
    
    // Update the list if any folders were removed
    if (validFolders.length !== recentFolders.length) {
      await this.set('recentFolders', validFolders);
    }
    
    return validFolders;
  }

  // Clear recent files list
  async clearRecentFiles() {
    await this.set('recentFiles', []);
  }

  // Clear recent folders list
  async clearRecentFolders() {
    await this.set('recentFolders', []);
  }
}

// Create singleton instance
const preferencesManager = new PreferencesManager();

module.exports = preferencesManager;