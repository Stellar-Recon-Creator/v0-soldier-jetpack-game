#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add lib/game-engine.ts push_to_github.command

echo "Committing..."
git commit -m "balance: increase starting ammo to 275, reduce lerange and hypershot ammo costs"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
