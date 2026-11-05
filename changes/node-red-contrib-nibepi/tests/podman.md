podman build -f changes/node-red-contrib-nibepi/tests/elpris/Containerfile -t nibba-elpris-test changes/node-red-contrib-nibepi
podman run --rm nibba-elpris-test