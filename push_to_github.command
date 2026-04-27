#!/bin/bash
cd "$(dirname "$0")"

echo "=== Pushing changes to GitHub ==="

rm -f .git/config.lock .git/index.lock .git/HEAD.lock .git/objects/*/tmp_obj_*

echo "Staging changes..."
git add lib/game-engine.ts push_to_github.command

echo "Committing..."
git commit -m "balance: reduce Pulse bullet speed by 10% (618 -> 556)"

echo "Pushing to GitHub..."
git push origin main

echo ""
echo "=== Done! ==="
echo "Press any key to close..."
read -n 1
