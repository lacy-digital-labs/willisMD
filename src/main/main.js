const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exportToPDF, exportToHTML, exportToEPUB, exportToDOCX } = require('./exportUtils');
const preferencesManager = require('./preferences');

let mainWindow;

function createWindow() {
  console.log('Creating Electron window...');
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    show: false
  });

  console.log('Window created, loading URL...');
  
  // Load from dist folder instead of dev server for now
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:8080')
      .then(() => {
        console.log('Successfully loaded URL');
        win.webContents.openDevTools(); // Open DevTools
        win.show();
      })
      .catch(error => {
        console.error('Failed to load URL:', error);
        win.webContents.openDevTools(); // Open DevTools even on error
        win.show();
      });
  } else {
    // In production, the app is packaged differently
    let indexPath;
    if (app.isPackaged) {
      // In the packaged app, dist files are in the app directory
      indexPath = path.join(__dirname, '../../dist/index.html');
    } else {
      // Running with electron . (not packaged)
      indexPath = path.join(__dirname, '../../dist/index.html');
    }
    
    console.log('Loading index.html from:', indexPath);
    
    win.loadFile(indexPath)
      .then(() => {
        console.log('Successfully loaded file');
        // DevTools disabled for production
        // win.webContents.openDevTools(); 
        win.show();
      })
      .catch(error => {
        console.error('Failed to load file:', error);
        // Try alternative path as fallback
        const altPath = path.join(__dirname, '../../dist/index.html');
        console.log('Trying alternative path:', altPath);
        win.loadFile(altPath)
          .then(() => {
            console.log('Loaded from alternative path');
            win.show();
          })
          .catch(err => {
            console.error('Alternative path also failed:', err);
            win.show();
          });
      });
  }

  // Show window when ready (backup)
  win.once('ready-to-show', () => {
    console.log('Window ready to show');
    win.show();
  });

  // Log when window is shown
  win.once('show', () => {
    console.log('Window is now visible');
  });

  // Prevent crashes from closing the window
  win.webContents.on('crashed', (event, killed) => {
    console.error('Renderer process crashed, killed:', killed);
    // Don't close window, try to reload instead
    win.reload();
  });

  win.webContents.on('unresponsive', () => {
    console.error('Renderer process became unresponsive');
  });

  win.webContents.on('responsive', () => {
    console.log('Renderer process became responsive again');
  });

  // Track windows
  win.on('closed', () => {
    console.log('Window closed');
    mainWindow = null;
  });

  return win;
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            console.log('New File menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-new-file');
            } else {
              // Create new window if none exists
              mainWindow = createWindow();
            }
          }
        },
        {
          label: 'New File from Template...',
          accelerator: 'CmdOrCtrl+Shift+N',
          click: () => {
            console.log('New File from Template menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-new-file-from-template');
            } else {
              // Create new window if none exists
              mainWindow = createWindow();
            }
          }
        },
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            console.log('Open File menu clicked');
            
            // Create window if none exists
            if (!mainWindow || mainWindow.isDestroyed()) {
              mainWindow = createWindow();
              // Wait a bit for window to be ready
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'Markdown Files', extensions: ['md', 'markdown', 'txt'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            console.log('Dialog result:', result);
            
            if (!result.canceled && result.filePaths.length > 0) {
              console.log('Sending file path to renderer:', result.filePaths[0]);
              mainWindow.webContents.send('menu-open-file', result.filePaths[0]);
            }
          }
        },
        {
          label: 'Open Folder...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: async () => {
            console.log('Open Folder menu clicked');
            
            // Create window if none exists
            if (!mainWindow || mainWindow.isDestroyed()) {
              mainWindow = createWindow();
              // Wait a bit for window to be ready
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openDirectory'],
              buttonLabel: 'Open Folder'
            });
            
            console.log('Folder dialog result:', result);
            
            if (!result.canceled && result.filePaths.length > 0) {
              console.log('Sending folder path to renderer:', result.filePaths[0]);
              mainWindow.webContents.send('menu-open-folder', result.filePaths[0]);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            console.log('Save menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-save-file');
            }
          }
        },
        {
          label: 'Save As...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => {
            console.log('Save As menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-save-file-as');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Auto Save',
          type: 'checkbox',
          checked: false,
          click: (menuItem) => {
            console.log('Auto save toggled:', menuItem.checked);
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-toggle-autosave', menuItem.checked);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
          click: () => {
            console.log('Preferences menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-show-preferences');
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export as PDF...',
              click: () => {
                console.log('Export PDF menu clicked');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu-export-pdf');
                }
              }
            },
            {
              label: 'Export as HTML...',
              click: () => {
                console.log('Export HTML menu clicked');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu-export-html');
                }
              }
            },
            {
              label: 'Export as EPUB...',
              click: () => {
                console.log('Export EPUB menu clicked');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu-export-epub');
                }
              }
            },
            {
              label: 'Export as DOCX...',
              click: () => {
                console.log('Export DOCX menu clicked');
                if (mainWindow && !mainWindow.isDestroyed()) {
                  mainWindow.webContents.send('menu-export-docx');
                }
              }
            }
          ]
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Force Reload', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Toggle Developer Tools', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        {
          label: 'Toggle Explorer',
          accelerator: 'CmdOrCtrl+Shift+E',
          click: () => {
            console.log('Toggle Explorer menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-toggle-explorer');
            }
          }
        },
        {
          label: 'Toggle Preview',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => {
            console.log('Toggle Preview menu clicked');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-toggle-preview');
            }
          }
        },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Toggle Fullscreen', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: 'willisMD',
      submenu: [
        { label: 'About willisMD', role: 'about' },
        { type: 'separator' },
        {
          label: 'Preferences...',
          accelerator: 'Cmd+,',
          click: () => {
            console.log('Preferences menu clicked (macOS)');
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('menu-show-preferences');
            }
          }
        },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide willisMD', accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  console.log('Menu created and set');
}

// IPC handlers
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-save-dialog', async () => {
  // Get the focused window or use mainWindow
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  
  if (!win || win.isDestroyed()) {
    return { success: false, error: 'No active window' };
  }
  
  const result = await dialog.showSaveDialog(win, {
    filters: [
      { name: 'Markdown Files', extensions: ['md', 'markdown'] },
      { name: 'Text Files', extensions: ['txt'] },
      { name: 'All Files', extensions: ['*'] }
    ],
    defaultPath: 'Untitled.md'
  });
  
  if (!result.canceled) {
    return { success: true, filePath: result.filePath };
  }
  return { success: false, canceled: true };
});

ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const result = [];
    
    for (const item of items) {
      // Skip hidden files/folders (starting with .)
      if (item.name.startsWith('.')) continue;
      
      const fullPath = path.join(dirPath, item.name);
      const stats = await fs.stat(fullPath);
      
      result.push({
        name: item.name,
        path: fullPath,
        isDirectory: item.isDirectory(),
        isFile: item.isFile(),
        size: stats.size,
        modified: stats.mtime
      });
    }
    
    // Sort: directories first, then files, alphabetically
    result.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    
    return { success: true, items: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Export handlers
ipcMain.handle('export-pdf', async (event, { markdown, title }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] }
      ],
      defaultPath: `${title || 'document'}.pdf`
    });
    
    if (!result.canceled) {
      return await exportToPDF(markdown, result.filePath, { title });
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-html', async (event, { markdown, title }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'HTML Files', extensions: ['html'] }
      ],
      defaultPath: `${title || 'document'}.html`
    });
    
    if (!result.canceled) {
      return await exportToHTML(markdown, result.filePath, { title });
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-epub', async (event, { markdown, title, author }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'EPUB Files', extensions: ['epub'] }
      ],
      defaultPath: `${title || 'document'}.epub`
    });
    
    if (!result.canceled) {
      return await exportToEPUB(markdown, result.filePath, { title, author });
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-docx', async (event, { markdown, title }) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      filters: [
        { name: 'Word Documents', extensions: ['docx'] }
      ],
      defaultPath: `${title || 'document'}.docx`
    });
    
    if (!result.canceled) {
      return await exportToDOCX(markdown, result.filePath, { title });
    }
    return { success: false, canceled: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Save confirmation dialog
ipcMain.handle('show-save-confirmation', async (event, { fileName, hasUnsavedChanges }) => {
  if (!hasUnsavedChanges) {
    return { action: 'dont-save' };
  }
  
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Save', "Don't Save", 'Cancel'],
    defaultId: 0,
    cancelId: 2,
    message: `Do you want to save the changes you made to "${fileName}"?`,
    detail: 'Your changes will be lost if you don\'t save them.'
  });
  
  const actions = ['save', 'dont-save', 'cancel'];
  return { action: actions[result.response] };
});

// Preferences handlers
ipcMain.handle('preferences-load', async () => {
  try {
    return await preferencesManager.load();
  } catch (error) {
    console.error('Failed to load preferences:', error);
    return preferencesManager.getAll();
  }
});

ipcMain.handle('preferences-save', async (event, preferences) => {
  try {
    return await preferencesManager.setMultiple(preferences);
  } catch (error) {
    console.error('Failed to save preferences:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('preferences-get', async (event, key) => {
  return preferencesManager.get(key);
});

ipcMain.handle('preferences-set', async (event, key, value) => {
  try {
    return await preferencesManager.set(key, value);
  } catch (error) {
    console.error('Failed to set preference:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-folder-dialog', async () => {
  const win = BrowserWindow.getFocusedWindow() || mainWindow;
  
  if (!win || win.isDestroyed()) {
    return { success: false, error: 'No active window' };
  }
  
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory'],
    buttonLabel: 'Select Folder'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return { success: true, folderPath: result.filePaths[0] };
  }
  return { success: false, canceled: true };
});

ipcMain.handle('get-templates', async () => {
  try {
    return await preferencesManager.getTemplates();
  } catch (error) {
    console.error('Failed to get templates:', error);
    return [];
  }
});

// App event handlers
app.whenReady().then(async () => {
  console.log('Electron app ready, creating window...');
  
  // Load preferences first
  await preferencesManager.load();
  
  mainWindow = createWindow();
  createMenu();
});

// Handle app quit with save confirmation
let isQuitting = false;

app.on('before-quit', async (event) => {
  console.log('App before-quit event');
  
  if (isQuitting) {
    return; // Already handling quit
  }
  
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  
  event.preventDefault();
  isQuitting = true;
  
  try {
    // Ask renderer if there are unsaved changes
    const unsavedCheck = await new Promise((resolve) => {
      mainWindow.webContents.send('check-unsaved-changes');
      
      const timeout = setTimeout(() => {
        resolve({ hasUnsaved: false });
      }, 1000);
      
      ipcMain.once('unsaved-changes-response', (event, data) => {
        clearTimeout(timeout);
        resolve(data);
      });
    });
    
    if (unsavedCheck.hasUnsaved) {
      const confirmation = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: ['Save All', "Don't Save", 'Cancel'],
        defaultId: 0,
        cancelId: 2,
        message: 'You have unsaved changes in one or more files.',
        detail: 'Do you want to save your changes before quitting?'
      });
      
      if (confirmation.response === 2) {
        // Cancel quit
        isQuitting = false;
        return;
      } else if (confirmation.response === 0) {
        // Save all
        mainWindow.webContents.send('save-all-before-quit');
        
        // Wait for save completion
        const saveTimeout = setTimeout(() => {
          console.log('Save timeout, forcing quit');
          app.exit();
        }, 5000);
        
        ipcMain.once('save-all-complete', () => {
          clearTimeout(saveTimeout);
          console.log('Save complete, quitting app');
          app.exit();
        });
        
        return;
      }
    }
    
    // No unsaved changes or user chose don't save
    console.log('No unsaved changes, quitting app');
    app.exit();
    
  } catch (error) {
    console.error('Error checking unsaved changes:', error);
    app.exit();
  }
});

app.on('window-all-closed', () => {
  console.log('All windows closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App activated');
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});

console.log('Electron main process started');