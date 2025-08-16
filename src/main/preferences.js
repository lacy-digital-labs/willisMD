const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { app } = require('electron');

class PreferencesManager {
  constructor() {
    this.preferencesPath = path.join(app.getPath('userData'), 'preferences.json');
    this.defaultTemplatesPath = path.join(app.getPath('userData'), 'templates');
    this.defaultPreferences = {
      theme: 'standard', // 'standard', 'forest-green', 'blue-moon', 'monochrome', 'valentine', 'desert', 'polar', 'orange-blossom', 'christmas'
      mode: 'light', // 'light', 'dark'
      defaultFolder: null, // path to default folder
      templatesFolder: null, // path to templates folder (defaults to userData/templates)
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
      
      // Migrate old theme system to new theme + mode system
      if (this.preferences.theme && !this.preferences.mode) {
        if (this.preferences.theme === 'light') {
          this.preferences.theme = 'standard';
          this.preferences.mode = 'light';
        } else if (this.preferences.theme === 'dark') {
          this.preferences.theme = 'standard';
          this.preferences.mode = 'dark';
        } else {
          // Other themes default to light mode
          this.preferences.mode = 'light';
        }
        console.log('Migrated old theme system to new theme + mode system');
        await this.save(); // Save migrated preferences
      }
      
      this.loaded = true;
      console.log('Preferences loaded:', this.preferences);
    } catch (error) {
      console.log('No preferences file found, using defaults');
      this.preferences = { ...this.defaultPreferences };
      this.loaded = true;
      await this.save(); // Create initial preferences file
    }
    
    // Initialize default templates if needed
    await this.initializeDefaultTemplates();
    
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

  // Initialize default templates on first run or when folder is empty
  async initializeDefaultTemplates() {
    // If no templates folder is set, use the default
    if (!this.get('templatesFolder')) {
      await this.set('templatesFolder', this.defaultTemplatesPath);
    }
    
    const templatesFolder = this.get('templatesFolder');
    
    try {
      // Create templates folder if it doesn't exist
      await fs.mkdir(templatesFolder, { recursive: true });
      
      // Check if folder is empty or has no templates
      const files = await fs.readdir(templatesFolder);
      const hasTemplates = files.some(f => 
        f.endsWith('.md') || f.endsWith('.markdown') || f.endsWith('.txt')
      );
      
      if (!hasTemplates) {
        console.log('Initializing default templates...');
        await this.copyDefaultTemplates(templatesFolder);
      }
    } catch (error) {
      console.error('Failed to initialize templates:', error);
    }
  }
  
  // Copy bundled default templates to user's templates folder
  async copyDefaultTemplates(targetFolder, force = false) {
    try {
      // Get the path to bundled templates
      // In production, app.getAppPath() returns the asar archive path
      // We need to handle both development and production cases
      let sourceTemplatesPath;
      
      if (app.isPackaged) {
        // In production, templates are in the app.asar archive
        // We'll need to extract them from resources
        sourceTemplatesPath = path.join(process.resourcesPath, 'app.asar', 'templates');
        
        // If templates are not in asar, they might be unpacked
        if (!fsSync.existsSync(sourceTemplatesPath)) {
          sourceTemplatesPath = path.join(process.resourcesPath, 'app.asar.unpacked', 'templates');
        }
      } else {
        // In development, use the templates folder in the project root
        sourceTemplatesPath = path.join(app.getAppPath(), 'templates');
      }
      
      console.log('Source templates path:', sourceTemplatesPath);
      
      // Check if source templates exist
      if (!fsSync.existsSync(sourceTemplatesPath)) {
        console.log('No bundled templates found, creating default templates...');
        // Create default templates programmatically if bundled ones don't exist
        await this.createDefaultTemplates(targetFolder);
        return;
      }
      
      // Copy all template files
      const templateFiles = await fs.readdir(sourceTemplatesPath);
      for (const file of templateFiles) {
        if (file.endsWith('.md') || file.endsWith('.markdown') || file.endsWith('.txt')) {
          const sourcePath = path.join(sourceTemplatesPath, file);
          const targetPath = path.join(targetFolder, file);
          
          try {
            // Check if file exists and force is not set
            if (!force) {
              try {
                await fs.access(targetPath);
                console.log(`Template ${file} already exists, skipping`);
                continue;
              } catch {
                // File doesn't exist, proceed with copying
              }
            }
            
            const content = await fs.readFile(sourcePath, 'utf-8');
            await fs.writeFile(targetPath, content);
            console.log(`${force ? 'Refreshed' : 'Copied'} template: ${file}`);
          } catch (error) {
            console.error(`Failed to ${force ? 'refresh' : 'copy'} template ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to copy default templates:', error);
      // Fallback to creating templates programmatically
      await this.createDefaultTemplates(targetFolder, force);
    }
  }
  
  // Create default templates programmatically as a fallback
  async createDefaultTemplates(targetFolder, force = false) {
    const defaultTemplates = [
      {
        name: 'Blog Post.md',
        content: `# Blog Post Title\n\n*Published: ${new Date().toLocaleDateString()}*\n\n## Introduction\n\nStart your blog post with an engaging introduction that captures the reader's attention.\n\n## Main Content\n\n### Section 1\n\nYour main points go here. Use markdown formatting to structure your content:\n\n- **Bold text** for emphasis\n- *Italic text* for subtle emphasis\n- \`Code snippets\` for technical content\n\n### Section 2\n\nContinue developing your ideas...\n\n> Blockquotes are great for highlighting important quotes or key takeaways.\n\n## Conclusion\n\nWrap up your post with a strong conclusion that reinforces your main points.\n\n---\n\n*Tags: #blogging #writing*`
      },
      {
        name: 'Meeting Notes.md',
        content: `# Meeting Notes\n\n**Date:** ${new Date().toLocaleDateString()}\n**Time:** ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}\n**Attendees:** \n\n---\n\n## Agenda\n\n1. Topic 1\n2. Topic 2\n3. Topic 3\n\n## Discussion Points\n\n### Topic 1\n- Point discussed\n- Decision made\n\n### Topic 2\n- Point discussed\n- Action required\n\n## Action Items\n\n- [ ] Action item 1 - @assignee\n- [ ] Action item 2 - @assignee\n- [ ] Action item 3 - @assignee\n\n## Next Steps\n\n- Next meeting scheduled for: [Date]\n- Follow-up required on: [Items]\n\n---\n\n*Notes taken by: [Your Name]*`
      },
      {
        name: 'Project README.md',
        content: `# Project Name\n\n> A brief description of what this project does and who it's for\n\n## Features\n\n- Feature 1\n- Feature 2\n- Feature 3\n\n## Installation\n\n\`\`\`bash\n# Clone the repository\ngit clone https://github.com/username/project.git\n\n# Navigate to project directory\ncd project\n\n# Install dependencies\nnpm install\n\`\`\`\n\n## Usage\n\n\`\`\`javascript\n// Example code\nconst example = require('example');\nexample.doSomething();\n\`\`\`\n\n## Configuration\n\nDescribe any configuration options here.\n\n## Contributing\n\nContributions are welcome! Please feel free to submit a Pull Request.\n\n## License\n\nThis project is licensed under the MIT License - see the LICENSE file for details.\n\n## Contact\n\n- Author: Your Name\n- Email: your.email@example.com\n- Project Link: https://github.com/username/project`
      },
      {
        name: 'Daily Log.md',
        content: `# Daily Log - ${new Date().toLocaleDateString()}\n\n## Morning\n\n### Goals for Today\n- [ ] Task 1\n- [ ] Task 2\n- [ ] Task 3\n\n### Priority Tasks\n1. Most important task\n2. Second priority\n3. Third priority\n\n## Work Log\n\n### 9:00 AM\n- Started working on...\n\n### 10:00 AM\n- Completed...\n- Began...\n\n### 11:00 AM\n- Meeting with...\n- Discussed...\n\n## Afternoon\n\n### Progress Update\n- ✅ Completed tasks\n- 🔄 In progress\n- ⏸️ Blocked items\n\n## End of Day\n\n### Accomplishments\n- Achievement 1\n- Achievement 2\n\n### Challenges\n- Challenge faced\n- How it was addressed\n\n### Tomorrow's Priorities\n- [ ] Task for tomorrow\n- [ ] Follow-up needed\n\n---\n\n**Mood:** 😊\n**Energy Level:** 8/10\n**Notes:** Additional thoughts or reflections`
      },
      {
        name: 'Business Plan.md',
        content: `# Business Plan\n\n**Company:** [Your Company]\n**Date:** ${new Date().toLocaleDateString()}\n\n## Executive Summary\n[Brief description of your business and what it does]\n\n## Market\n- **Target Customers:** [Who you serve]\n- **Problem:** [What problem you solve]\n- **Solution:** [Your solution]\n\n## Business Model\n- **Revenue:** [How you make money]\n- **Competitive Advantage:** [What makes you different]\n\n## Financial Projections\n| Year | Revenue | Expenses | Profit |\n|------|---------|----------|---------|\n| 1 | $[amount] | $[amount] | $[amount] |\n| 2 | $[amount] | $[amount] | $[amount] |\n| 3 | $[amount] | $[amount] | $[amount] |\n\n## Next Steps\n- [ ] [First priority]\n- [ ] [Second priority]\n- [ ] [Third priority]`
      },
      {
        name: 'Root Cause Analysis.md',
        content: `# Root Cause Analysis\n\n**Problem:** [Brief description]\n**Date:** ${new Date().toLocaleDateString()}\n\n## What Happened?\n[Description of the issue and its impact]\n\n## 5 Whys\n1. **Why did this happen?** [Immediate cause]\n2. **Why did that happen?** [Deeper cause]\n3. **Why did that happen?** [Even deeper]\n4. **Why did that happen?** [Root territory]\n5. **Why did that happen?** **[ROOT CAUSE]**\n\n## Actions\n### Immediate Fix\n- [ ] [Quick fix to stop the problem]\n\n### Long-term Solution\n- [ ] [Prevent it from happening again]\n\n### Prevention\n- [ ] [Make it impossible to happen]\n\n## Follow-up\n- **Review Date:** [When to check if solutions worked]\n- **Owner:** [Who's responsible for implementation]`
      },
      {
        name: 'Agile Retrospective.md',
        content: `# Sprint Retrospective\n\n**Sprint:** [Number]\n**Team:** [Team Name]\n**Date:** ${new Date().toLocaleDateString()}\n\n## What Went Well? 😊\n- [Success 1]\n- [Success 2]\n- [Success 3]\n\n## What Didn't Go Well? 😟\n- [Challenge 1]\n- [Challenge 2]\n- [Challenge 3]\n\n## What Should We Do Differently? 💡\n- [Improvement 1]\n- [Improvement 2]\n- [Improvement 3]\n\n## Action Items\n- [ ] [Action] - [Owner] - [Due Date]\n- [ ] [Action] - [Owner] - [Due Date]\n- [ ] [Action] - [Owner] - [Due Date]`
      },
      {
        name: 'Agile Story.md',
        content: `# User Story\n\n**ID:** [PROJ-XXX]\n**Points:** [1, 2, 3, 5, 8, 13]\n\n## Story\n**As a** [user type]\n**I want** [feature/goal]\n**So that** [benefit/value]\n\n## Acceptance Criteria\n- [ ] [Criteria 1]\n- [ ] [Criteria 2] \n- [ ] [Criteria 3]\n\n## Definition of Done\n- [ ] Code complete\n- [ ] Code reviewed\n- [ ] Tests passing\n- [ ] PO approved\n\n**Assigned:** [Developer]\n**Status:** [To Do / In Progress / Done]`
      },
      {
        name: 'TED Style Talk.md',
        content: `# TED Style Talk\n\n**Title:** [Your Talk Title]\n**Speaker:** [Your Name]\n**Date:** ${new Date().toLocaleDateString()}\n\n## One Big Idea\n[What is the ONE idea you want your audience to remember?]\n\n## Opening Hook\n[Your opening story, statistic, or question]\n\n## The Problem\n[What problem are you addressing?]\n\n## Your Solution\n[Your main idea and supporting evidence]\n\n## Call to Action\n[What do you want people to do?]\n\n## Memorable Closing\n[Your powerful closing statement]`
      },
      {
        name: 'Project Status Report.md',
        content: `# Project Status Report\n\n**Project:** [Project Name]\n**Date:** ${new Date().toLocaleDateString()}\n**Status:** 🟢 Green / 🟡 Yellow / 🔴 Red\n\n## Key Accomplishments\n- [Major accomplishment 1]\n- [Major accomplishment 2]\n- [Major accomplishment 3]\n\n## Current Milestones\n| Milestone | Due Date | Status |\n|-----------|----------|--------|\n| [Milestone 1] | [Date] | Complete ✅ |\n| [Milestone 2] | [Date] | On Track 🟢 |\n| [Milestone 3] | [Date] | At Risk 🟡 |\n\n## Issues & Risks\n- [Issue 1]: [Description]\n- [Risk 1]: [Description and mitigation]\n\n## Next Steps\n- [Next action 1]\n- [Next action 2]`
      },
      {
        name: 'Performance Review.md',
        content: `# Performance Review\n\n**Employee:** [Employee Name]\n**Position:** [Job Title]\n**Review Period:** [Start Date] - [End Date]\n**Date:** ${new Date().toLocaleDateString()}\n\n## Overall Rating\n**[Exceeds Expectations / Meets Expectations / Below Expectations]**\n\n## Key Achievements\n1. [Achievement 1]\n2. [Achievement 2]\n3. [Achievement 3]\n\n## Core Skills Assessment\n| Skill | Rating (1-5) | Comments |\n|-------|--------------|----------|\n| Communication | [Rating] | [Comments] |\n| Collaboration | [Rating] | [Comments] |\n| Problem Solving | [Rating] | [Comments] |\n\n## Development Areas\n- [Area 1]: [Development plan]\n- [Area 2]: [Development plan]\n\n## Goals for Next Period\n1. [Goal 1] - Due: [Date]\n2. [Goal 2] - Due: [Date]\n3. [Goal 3] - Due: [Date]`
      },
      {
        name: 'Performance Self-Assessment.md',
        content: `# Performance Self-Assessment\n\n**Employee:** [Your Name]\n**Position:** [Your Job Title]\n**Review Period:** [Start Date] - [End Date]\n**Date:** ${new Date().toLocaleDateString()}\n\n## Overall Performance\n**Self-Rating:** [Exceeds / Meets / Below Expectations]\n\n[Brief summary of your performance]\n\n## Key Accomplishments\n1. [Achievement 1] - [Impact]\n2. [Achievement 2] - [Impact]\n3. [Achievement 3] - [Impact]\n\n## Skills Self-Evaluation\n| Skill | Rating (1-5) | Comments |\n|-------|--------------|----------|\n| Communication | [Rating] | [Examples] |\n| Collaboration | [Rating] | [Examples] |\n| Problem Solving | [Rating] | [Examples] |\n\n## Areas for Improvement\n- [Area 1]: [Development plan]\n- [Area 2]: [Development plan]\n\n## Goals for Next Period\n1. [Goal 1] - Timeline: [Timeframe]\n2. [Goal 2] - Timeline: [Timeframe]\n3. [Goal 3] - Timeline: [Timeframe]\n\n## Career Development\n**Short-term (1-2 years):** [Your goals]\n**Long-term (3-5 years):** [Your vision]\n\n**Support Needed:** [Training, mentoring, resources]`
      },
      {
        name: 'Lesson Plan.md',
        content: `# Lesson Plan\n\n**Subject:** [Subject Area]\n**Grade Level:** [Grade/Age Group]\n**Duration:** [Time Duration]\n**Date:** ${new Date().toLocaleDateString()}\n\n## Learning Objective\n**Students will be able to:** [Main learning goal]\n\n## Materials Needed\n- [Material 1]\n- [Material 2]\n- [Material 3]\n\n## Lesson Structure\n\n### Opening (X minutes)\n[Hook activity to engage students]\n\n### Main Instruction (X minutes)\n[Key concepts to teach]\n\n### Practice (X minutes)\n[Activity for students to practice]\n\n### Closing (X minutes)\n[How to wrap up and assess understanding]\n\n## Assessment\n[How you'll check if students learned the objective]\n\n## Homework\n[Assignment and due date]\n\n## Notes\n[Post-lesson reflections and improvements]`
      }
    ];
    
    for (const template of defaultTemplates) {
      const targetPath = path.join(targetFolder, template.name);
      try {
        // Check if file exists and force is not set
        if (!force) {
          try {
            await fs.access(targetPath);
            console.log(`Template ${template.name} already exists, skipping`);
            continue;
          } catch {
            // File doesn't exist, proceed with creating
          }
        }
        
        await fs.writeFile(targetPath, template.content);
        console.log(`${force ? 'Refreshed' : 'Created'} default template: ${template.name}`);
      } catch (error) {
        console.error(`Failed to ${force ? 'refresh' : 'create'} template ${template.name}:`, error);
      }
    }
  }
  
  // Get template files from templates folder
  async getTemplates() {
    const templatesFolder = this.get('templatesFolder') || this.defaultTemplatesPath;
    
    // Ensure templates are initialized
    if (!(await this.validateFolder(templatesFolder))) {
      await this.initializeDefaultTemplates();
    }
    
    if (!(await this.validateFolder(templatesFolder))) {
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

  // Force refresh templates - copy all default templates to templates folder
  async refreshTemplates() {
    const templatesFolder = this.get('templatesFolder') || this.defaultTemplatesPath;
    
    try {
      // Create templates folder if it doesn't exist
      await fs.mkdir(templatesFolder, { recursive: true });
      
      console.log('Refreshing templates in:', templatesFolder);
      
      // Force copy all default templates (this will overwrite existing ones)
      await this.copyDefaultTemplates(templatesFolder, true);
      
      console.log('Templates refreshed successfully');
      return { success: true, message: 'Templates refreshed successfully' };
    } catch (error) {
      console.error('Failed to refresh templates:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const preferencesManager = new PreferencesManager();

module.exports = preferencesManager;