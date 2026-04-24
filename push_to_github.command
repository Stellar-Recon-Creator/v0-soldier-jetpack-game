#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add lib/game-engine.ts components/game-canvas.tsx push_to_github.command

echo "Committing..."
git commit -m "balance: alien fire rate scales with difficulty - easy 1x, medium 1.3x, hard 1.5x"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
