#!/usr/bin/env bash
# Install the Project Workflow Agent extension into Cursor (default) or VS Code.
# Compiles TypeScript and copies output into the IDE extensions directory.
#
# Usage:
#   ./install.sh           # install to ~/.cursor/extensions (Cursor)
#   ./install.sh --vscode  # install to ~/.vscode/extensions (VS Code Copilot)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXT_ID="sentrilock.project-workflow-agent"
TARGET="${1:-cursor}"
CURSOR_EXT_ROOT="$HOME/.cursor/extensions"

VERSION="$(node -p "require('$SCRIPT_DIR/package.json').version" 2>/dev/null || echo unknown)"

if [[ "$TARGET" == "--vscode" ]]; then
  EXT_DIR="$HOME/.vscode/extensions/$EXT_ID"
  IDE="VS Code"
else
  # Cursor expects publisher.name-version folders (matches gallery extensions).
  EXT_DIR="$CURSOR_EXT_ROOT/${EXT_ID}-${VERSION}"
  IDE="Cursor"
  TARGET="cursor"
fi

echo "Building Project Workflow Agent extension v$VERSION ..."
cd "$SCRIPT_DIR"
npm install --silent
npm run compile

echo "Installing to $EXT_DIR ($IDE) ..."
if [[ "$IDE" == "Cursor" ]]; then
  rm -rf "$CURSOR_EXT_ROOT"/project-workflow-agent-* 2>/dev/null || true
  rm -rf "$CURSOR_EXT_ROOT"/sentrilock.project-workflow-agent 2>/dev/null || true
  rm -rf "$CURSOR_EXT_ROOT"/sentrilock.project-workflow-agent-* 2>/dev/null || true

  # Clear stale "marked for removal" entries after Cursor updates.
  OBSOLETE_FILE="$CURSOR_EXT_ROOT/.obsolete"
  if [[ -f "$OBSOLETE_FILE" ]]; then
    node -e "
      const fs = require('fs');
      const p = process.argv[1];
      const data = JSON.parse(fs.readFileSync(p, 'utf8'));
      for (const key of Object.keys(data)) {
        if (key.startsWith('sentrilock.project-workflow-agent')) delete data[key];
      }
      fs.writeFileSync(p, JSON.stringify(data));
    " "$OBSOLETE_FILE"
  fi
fi
rm -rf "$EXT_DIR"
mkdir -p "$EXT_DIR/out"

cp package.json "$EXT_DIR/"
cp -r out/. "$EXT_DIR/out/"
rm -f "$EXT_DIR"/out/*.test.js "$EXT_DIR"/out/*.test.js.map

echo ""
echo "Installed project-workflow-agent v$VERSION → $EXT_DIR"
echo "Reload $IDE to activate:"
echo "  Cmd+Shift+P → Developer: Reload Window"
echo ""
echo "Start a ticket:"
echo "  Cmd+Shift+P → Project Workflow: Start Dev Ticket"
