#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add lib/game-engine.ts components/game-canvas.tsx push_to_github.command

echo "Committing..."
git commit -m "balance: move Pulse to stellar crate, lerange to nova, nerf Pulse speed -7%, buff Pulse damage +10%"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
