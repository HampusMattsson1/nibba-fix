#!/usr/bin/env bash

# Clone the repos this bases itself on

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

clone_repo() {
  local url="$1"
  local dir="$2"

  if [ -d "$ROOT/$dir/.git" ]; then
    echo "$dir already cloned, skipping"
  else
    git clone "$url" "$ROOT/$dir"
  fi
}

clone_repo "https://github.com/anerdins/nibepi.git" "nibepi"
clone_repo "https://github.com/anerdins/node-red-contrib-nibepi.git" "node-red-contrib-nibepi"