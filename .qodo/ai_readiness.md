# 🧠 Codebase Context & Testability Analysis Workflow for AI Enhancement

Evaluate a given codebase or project directory to determine its AI enhancement readiness, with a focus on identifying missing contextual and test-related files that would improve the efficiency, accuracy, and depth of automated reasoning, code generation, and test creation (unit and acceptance tests).

- `project_root`: Path to the root of the target project directory.
- `project_name`: Name of the project being analyzed.
- `language`: (Optional) Primary programming language(s) used in the project.
- `project_type`: (Optional) Type of project (e.g., web app, ML model, CLI tool, library).
- `existing_docs`: (Optional) Boolean indicating if documentation already exists.
- `ai_use_case`: (Optional) Intended automation task (e.g., bug fixing, feature generation, refactoring, test creation).
- `skip_generate`: (Optional) Boolean to skip generation of missing files (default: true).

1. **Scan Codebase**  Analyze the `project_root` for presence of key files grouped by their **function** and **priority**. Each file is categorized based on how essential it is for automated reasoning and task execution:

- **Analysis**
- `README.md`: High-level project overview, purpose, and setup.
- `module_index.md`: Maps key source files and their roles.
- **Design**
- `architecture.md`: System architecture, components, and interactions.
- `design_decisions.md`: Rationale behind major design or implementation choices.
- **Testing**
- `test/coverage-summary.json`: Objective view of test coverage.
- `test_strategy.md`: Testing approach, tools used, and philosophy.
- **Configuration**
- `env.schema.json` or `.env.example`: Describes required environment variables.

- **Design / Coding / Testing**
- `best_practices.md`: Standards and conventions across code, architecture, and testing.
- **Design**
- `data_schema.md`: Core data models, payloads, and API formats.
- `config/`: Organized runtime or deployment configurations.
- **Testing**
- `unit_test_guidelines.md`: Standards and patterns for writing unit tests.
- `acceptance_criteria.md`: Validation rules for feature completeness.
- `test_fixtures/`, `mock_data/`: Sample or mock data for repeatable tests.

- **Documentation**
- `ROADMAP.md`: Planned features and long-term direction.
- `tasks.md`: Known issues, upcoming tasks, or feature backlog.
- `examples/`: Realistic usage patterns or integration cases.

2. **Identify Missing Files**  For each functional area—**Analysis**, **Design**, **Coding**, **Testing**, and **Documentation**—identify missing files by comparing the scan results to the above checklist. For each missing file, document:
- **File name**
- **Priority level** (Critical, High, Medium)
- **Functional role** (Analysis, Design, Coding, Testing, Documentation)
- **How its presence would improve:**
- Automated **code analysis**
- Informed **design reasoning**
- Accelerated **code generation**
- High-quality **test creation**
- Accurate **project comprehension**

3. **Summarize and Explain**  Generate a Markdown report explaining:
- Each missing file
- Justification and use case
- Recommended contents and structure
- Impact across Analysis, Design, Coding, Testing, or Documentation

4. **(Optional) Generate Missing Files**  If `skip_generate` is false, create the missing files and complete them with content generated from doing the respective analysis on the project. Place the generated files in `project_root/.ai/`.

- A file titled:    `Codebase AI Readiness Analysis Report for {{project_name}} - {{current_date}}.md`  where `{{current_date}}` is the date the analysis is executed. Put this file in the .qodo directory, if present. If not, generate it and save the file there.
- `.ai/`: (If generated) Directory with generated files for each missing component.

- If `skip_generate = true`, skip file generation.
- If partial context files exist, confirm before modifying or extending them.

Return a detailed summary of the codebase’s readiness for automation, highlighting missing context across all relevant functions. Offer optional follow-up prompt:
> Would you like to auto-fill any of the context files using inferred information from your code?## 🎯 Purpose
## 📥 Inputs
## 🧩 Actions
### 🔍 Critical Priority
### 🟧 High Priority
### 🟨 Medium Priority
## 📤 Outputs
## 🔀 Decision Points
## ✅ Wrap-Up
