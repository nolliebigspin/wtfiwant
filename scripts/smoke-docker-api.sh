#!/bin/sh

set -eu

docker compose up --build --detach postgres api

attempt=1
while [ "$attempt" -le 20 ]; do
  if curl --fail --silent http://localhost:4000/health >/dev/null 2>&1; then
    printf 'Docker API smoke test passed.\n'
    exit 0
  fi

  if [ "$(docker compose ps --status exited --quiet api)" ]; then
    break
  fi

  attempt=$((attempt + 1))
  sleep 0.5
done

docker compose logs api
printf 'Docker API smoke test failed.\n' >&2
exit 1
