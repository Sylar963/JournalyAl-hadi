#!/bin/bash

# Check if there are any staged or unstaged changes
if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit."
  exit 0
fi

# Stage all changes
git add .

# Get current timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# Generate a summary of changes
# We use git diff --cached --stat to get a summary of what's about to be committed
SUMMARY=$(git diff --cached --stat | tail -n 1)

# Get names of modified files for more detail
FILES=$(git diff --cached --name-only | tr '\n' ',' | sed 's/,$//')

# Construct the commit message
COMMIT_MSG="Auto-commit: $TIMESTAMP | Changes: $SUMMARY | Files: $FILES"

# Perform the commit
git commit -m "$COMMIT_MSG"

echo "Successfully auto-committed changes."
echo "Message: $COMMIT_MSG"
