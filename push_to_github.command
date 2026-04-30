#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/HEAD.lock .git/packed-refs.lock
rm -f .git/refs/heads/*.lock
rm -f .git/objects/*/tmp_obj_*

echo "Switching to main..."
git checkout main 2>/dev/null

echo "Staging changes..."
git add lib/game-renderer.ts push_to_github.command

echo "Committing..."
git commit -m "redesign: Charger weapon model - capacitor coils, focusing barrel, heat sinks, foregrip" --allow-empty

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
