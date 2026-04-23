#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add lib/game-engine.ts lib/game-types.ts components/game-canvas.tsx push_to_github.command

echo "Committing..."
git commit -m "feature: working gear upgrades - power, fuel, ammo, ammo use, durability, weight (200 stars each, max level 5)"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
