#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/HEAD.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add components/game-canvas.tsx push_to_github.command

echo "Committing..."
git commit -m "fix: lower ground further on far zoom (offset 0.7 -> 0.95)"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
