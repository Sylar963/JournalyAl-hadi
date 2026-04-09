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

# Arguments
HEADER=$1
BODY=$2

# If no header is provided, use a generic one
if [ -z "$HEADER" ]; then
  SUMMARY=$(git diff --cached --stat | tail -n 1)
  FILES=$(git diff --cached --name-only | tr '\n' ',' | sed 's/,$//')
  HEADER="Changes in $FILES ($SUMMARY)"
fi

# Construct the full commit message
FULL_MSG="Auto-commit [$TIMESTAMP]: $HEADER"

if [ ! -z "$BODY" ]; then
  FULL_MSG="$FULL_MSG

$BODY"
fi

# Perform the commit
git commit -m "$FULL_MSG"

echo "Successfully auto-committed changes."
echo "Message header: Auto-commit [$TIMESTAMP]: $HEADER"
