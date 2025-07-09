const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  showSaveDialog: () => ipcRenderer.invoke('show-save-dialog'),
  readDirectory: (dirPath) => ipcRenderer.invoke('read-directory', dirPath),
  
  // Export operations
  exportPDF: (data) => ipcRenderer.invoke('export-pdf', data),
  exportHTML: (data) => ipcRenderer.invoke('export-html', data),
  exportEPUB: (data) => ipcRenderer.invoke('export-epub', data),
  exportDOCX: (data) => ipcRenderer.invoke('export-docx', data),
  
  // Save confirmation operations
  showSaveConfirmation: (data) => ipcRenderer.invoke('show-save-confirmation', data),
  showMessageBox: (options) => ipcRenderer.invoke('show-message-box', options),
  
  // File system operations
  duplicateFile: (sourcePath, targetPath) => ipcRenderer.invoke('duplicate-file', sourcePath, targetPath),
  createFolder: (folderPath) => ipcRenderer.invoke('create-folder', folderPath),
  deleteItem: (itemPath) => ipcRenderer.invoke('delete-item', itemPath),
  renameItem: (oldPath, newPath) => ipcRenderer.invoke('rename-item', oldPath, newPath),
  
  // Preferences operations
  preferencesLoad: () => ipcRenderer.invoke('preferences-load'),
  preferencesSave: (preferences) => ipcRenderer.invoke('preferences-save', preferences),
  preferencesGet: (key) => ipcRenderer.invoke('preferences-get', key),
  preferencesSet: (key, value) => ipcRenderer.invoke('preferences-set', key, value),
  showFolderDialog: () => ipcRenderer.invoke('show-folder-dialog'),
  getTemplates: () => ipcRenderer.invoke('get-templates'),
  
  // Menu events
  onNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  onNewFileFromTemplate: (callback) => ipcRenderer.on('menu-new-file-from-template', callback),
  onOpenFile: (callback) => {
    console.log('Preload: Setting up onOpenFile listener');
    ipcRenderer.on('menu-open-file', (event, filePath) => {
      console.log('Preload: Received menu-open-file with path:', filePath);
      try {
        callback(filePath);
        console.log('Preload: Successfully called callback');
      } catch (error) {
        console.error('Preload: Error calling callback:', error);
      }
    });
  },
  onSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback),
  onSaveFileAs: (callback) => ipcRenderer.on('menu-save-file-as', callback),
  onToggleAutosave: (callback) => ipcRenderer.on('menu-toggle-autosave', (event, enabled) => callback(enabled)),
  onOpenFolder: (callback) => ipcRenderer.on('menu-open-folder', (event, folderPath) => callback(folderPath)),
  onToggleExplorer: (callback) => ipcRenderer.on('menu-toggle-explorer', callback),
  onTogglePreview: (callback) => ipcRenderer.on('menu-toggle-preview', callback),
  
  // Export menu events
  onExportPDF: (callback) => ipcRenderer.on('menu-export-pdf', callback),
  onExportHTML: (callback) => ipcRenderer.on('menu-export-html', callback),
  onExportEPUB: (callback) => ipcRenderer.on('menu-export-epub', callback),
  onExportDOCX: (callback) => ipcRenderer.on('menu-export-docx', callback),
  
  // Preferences menu events
  onShowPreferences: (callback) => ipcRenderer.on('menu-show-preferences', callback),
  
  // About dialog
  readAboutContent: () => ipcRenderer.invoke('read-about-content'),
  onShowAbout: (callback) => {
    console.log('Preload: Setting up onShowAbout listener');
    ipcRenderer.on('menu-show-about', (event) => {
      console.log('Preload: Received menu-show-about event');
      callback();
    });
  },
  
  // Find and Replace
  onFind: (callback) => ipcRenderer.on('menu-find', callback),
  onReplace: (callback) => ipcRenderer.on('menu-replace', callback),
  
  // Recent files and folders
  getRecentFiles: () => ipcRenderer.invoke('get-recent-files'),
  getRecentFolders: () => ipcRenderer.invoke('get-recent-folders'),
  addRecentFile: (filePath) => ipcRenderer.invoke('add-recent-file', filePath),
  addRecentFolder: (folderPath) => ipcRenderer.invoke('add-recent-folder', folderPath),
  
  // Save confirmation events
  onCheckUnsavedChanges: (callback) => ipcRenderer.on('check-unsaved-changes', callback),
  onSaveAllBeforeQuit: (callback) => ipcRenderer.on('save-all-before-quit', callback),
  sendUnsavedChangesResponse: (data) => ipcRenderer.send('unsaved-changes-response', data),
  sendSaveAllComplete: () => ipcRenderer.send('save-all-complete'),
  
  // External links
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});