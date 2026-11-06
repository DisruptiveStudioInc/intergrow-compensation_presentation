#!/bin/sh
# Run from the deployment directory, with compose.production.yaml next to this script.
set -eu
image=${1:?Usage: release.sh IMAGE [PORT]}
port=${2:-8080}
case "$port" in ''|*[!0-9]*) echo 'PORT must be numeric' >&2; exit 1;; esac
# Prevent two releases from racing with each other's rollback file.
exec 9>.deploy.lock
flock -n 9 || { echo 'Another deployment is running' >&2; exit 1; }
previous=''
if [ -f .env ]; then previous=$(sed -n 's/^IMAGE=//p' .env); fi
export IMAGE="$image" PORT="$port"
docker compose -f compose.production.yaml pull
if [ -f .env ]; then cp .env .env.previous; fi
printf 'IMAGE=%s\nPORT=%s\n' "$image" "$port" > .env.next
mv .env.next .env
if docker compose -f compose.production.yaml up -d --wait --wait-timeout 90; then
  echo "Deployed $image"
else
  if [ -n "$previous" ] && [ -f .env.previous ]; then
    cp .env.previous .env
    previous_port=$(sed -n 's/^PORT=//p' .env.previous)
    export IMAGE="$previous" PORT="${previous_port:-$port}"
    docker compose -f compose.production.yaml up -d --wait --wait-timeout 90
    echo 'Deployment failed; previous image restored.' >&2
  else
    docker compose -f compose.production.yaml down
    rm -f .env
    echo 'Initial deployment failed; failed container removed.' >&2
  fi
  exit 1
fi
