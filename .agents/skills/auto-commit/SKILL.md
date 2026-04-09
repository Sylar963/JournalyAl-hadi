---
name: auto-commit
description: Automatically commit code changes to Git after every task. Use this skill to ensure that all changes made by the agent are tracked with a timestamp and a summary of modifications.
---

This skill ensures that every time you (the agent) modify the codebase, the changes are immediately committed to Git.

## Instructions

Whenever you complete a task that involving creating, modifying, or deleting files:
1.  **Run the Commit Script**: Execute the script with a descriptive header and body.
    ```bash
    ./scripts/agent-commit.sh "[Descriptive Header]" "[Detailed Body]"
    ```
    *Example*:
    ```bash
    ./scripts/agent-commit.sh "feat(auth): add login validation" "Implemented email and password validation logic in the AuthService. Updated the LoginForm component to display error messages."
    ```
2.  **Verify Success**: Ensure the script output indicates a successful commit.
3.  **No Changes**: If the script reports "No changes to commit," you can proceed without further action.

## Commit Message Format

The `scripts/agent-commit.sh` script automatically generates a message in the following format:
`Auto-commit: [timestamp] | Changes: [git diff summary] | Files: [list of files]`

## When to use this skill

-   After every successful `write_to_file`, `replace_file_content`, or `multi_replace_file_content` call.
-   After running a command that modifies the filesystem (e.g., `npm run build`, `lint`).
-   Before reporting completion of a task to the user.

**CRITICAL**: You MUST run this script to maintain a clean and traceable history of agent actions.
