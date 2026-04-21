#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add components/game-canvas.tsx push_to_github.command

echo "Committing..."
git commit -m "ui: sprinkle crimson #B31B1B across game

Added deep crimson accent to SHOP button, Armor gear column, HARD difficulty, RETRY button, and Shop title for contrast with purple palette."

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
