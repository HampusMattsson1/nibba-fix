podman build -t nibepi-runtime image-to-oci-image\nibepi-runtime

podman build -f image-to-oci-image/nibepi-runtime/Containerfile -t nibepi-runtime .

podman build -f image-to-oci-image/nibepi-runtime/Containerfile -t nibepi-runtime