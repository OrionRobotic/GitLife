# Contributing Guidelines

We welcome contributions! Please follow these rules to ensure a smooth workflow with others.

## 1. Issues

- **Create an Issue:** Every piece of work (feature or bug) must have a corresponding issue.
- **Detail:** The issue must contain a **detailed explanation** of the task or problem.

## 2. Branching Strategy

Branches must follow this naming convention:
`initials/issue-number/explanation`

**Example:** `ar/10/linting`

- `ar`: Author initials
- `10`: Issue number
- `linting`: Short description

## 3. Pull Requests (PRs)

- **Title:** The PR title must start with a category prefix followed by a colon and space, then clearly describe the change.
  - **Categories:**
    - `feat:` - New feature
    - `fix:` - Bug fix
    - `refactor:` - Code refactoring
    - `doc:` - Documentation changes
    - `style:` - Code style changes (formatting, etc.)
    - `test:` - Adding or updating tests
    - `chore:` - Maintenance tasks
    - `perf:` - Performance improvements
  - **Example:** `feat: Add dark mode toggle`
- **Description:** The body of the PR must list the **commits** included.
- **Reviewers:** You must assign **2 reviewers** to every PR.

## 4. Review & Merge Rules

**Standard Rule:**

- Wait for **1 approval** before merging.

**"Yolo Deployment" Exceptions:**
You may merge _without_ approval if:

- The time is between **00:00 (Midnight) and 05:00 AM**.
- OR the PR is a critical **bug fix**.

## 5. Merging

- **Squash and Merge:** Always use the "Squash and merge" option.
- **Cleanup:** The branch will be automatically deleted after merging.
