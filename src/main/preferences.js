const fs = require('fs').promises;
const path = require('path');
const { app } = require('electron');

class PreferencesManager {
  constructor() {
    this.preferencesPath = path.join(app.getPath('userData'), 'preferences.json');
    this.defaultPreferences = {
      theme: 'light', // 'light' or 'dark'
      defaultFolder: null, // path to default folder
      templatesFolder: null, // path to templates folder
      autoSave: false,
      autoSaveInterval: 30000, // 30 seconds
      fontSize: 14,
      fontFamily: 'monospace',
      wordWrap: true,
      showLineNumbers: false,
      tabSize: 2
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
}

// Create singleton instance
const preferencesManager = new PreferencesManager();

module.exports = preferencesManager;