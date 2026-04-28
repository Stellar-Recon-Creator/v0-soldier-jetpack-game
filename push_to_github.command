#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/HEAD.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add lib/game-types.ts lib/game-engine.ts lib/game-renderer.ts components/game-canvas.tsx push_to_github.command

echo "Committing..."
git commit -m "feature: add Charger weapon - hold to charge 3 bars, release to fire, orange theme, stellar crate"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
