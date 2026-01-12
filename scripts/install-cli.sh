#!/bin/bash

# GitLife CLI script

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CLI_FILE="$PROJECT_DIR/cli/git-gitlife.js"

chmod +x "$CLI_FILE"

# Create ~/.local/bin if it doesn't exist
mkdir -p "$HOME/.local/bin"

# create gitlife 
ln -sf "$CLI_FILE" "$HOME/.local/bin/gitlife"

echo "GitLife CLI installed successfully!"
echo ""
echo "Make sure ~/.local/bin is in your PATH."
echo "Add this to your ~/.zshrc or ~/.bashrc if needed:"
echo '  export PATH="$HOME/.local/bin:$PATH"'
echo ""
echo "Test the installation:"
echo "  gitlife --help"
echo ""
echo "Usage examples:"
echo "  gitlife -t workout"
echo "  gitlife --status"