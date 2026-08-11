#!/bin/sh
set -eu

image_name="${1:-calendar-foundation:smoke}"
container_name="calendar-foundation-smoke"
volume_name="calendar-foundation-smoke-data"

cleanup() {
  docker rm -f "$container_name" >/dev/null 2>&1 || true
  docker volume rm "$volume_name" >/dev/null 2>&1 || true
}

wait_until_ready() {
  attempt=0
  until docker exec "$container_name" node -e "Promise.all([fetch('http://127.0.0.1:3000/api/health'),fetch('http://127.0.0.1:3000/')]).then(async ([api,spa])=>{if(!api.ok||!spa.ok||!(await spa.text()).includes('<div id=\"root\"></div>'))process.exit(1)})"; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 20 ]; then
      docker logs "$container_name"
      exit 1
    fi
    sleep 1
  done
}

trap cleanup EXIT
cleanup

docker volume create "$volume_name" >/dev/null
docker run -d --name "$container_name" -v "$volume_name:/data" "$image_name" >/dev/null
wait_until_ready

docker exec "$container_name" sh -c "printf persisted > /data/volume-smoke"
docker rm -f "$container_name" >/dev/null
docker run -d --name "$container_name" -v "$volume_name:/data" "$image_name" >/dev/null
wait_until_ready
docker exec "$container_name" test -f /data/volume-smoke
