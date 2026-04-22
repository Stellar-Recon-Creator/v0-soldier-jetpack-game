#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add components/game-canvas.tsx push_to_github.command

echo "Committing..."
git commit -m "ui: full color scheme overhaul to blue/teal/purple palette

New palette: #000d6f, #8cd4ff, #0092ff, #7200ea, #0b517c. All button text now white."

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
