podman build -t nibepi-runtime image-to-oci-image\nibepi-runtime

podman build -f image-to-oci-image/nibepi-runtime/Containerfile -t nibepi-runtime .

podman build -f image-to-oci-image/nibepi-runtime/Containerfile -t nibepi-runtime

podman build -f image-to-oci-image/nibepi-runtime/Containerfile -t nibepi-runtime .

## Kör lokalt

podman run -d --name nibepi -p 1880:1880 localhost/nibepi-runtime:latest

Node-RED: http://localhost:1880
Dashboard: http://localhost:1880/ui

Loggar: podman logs -f nibepi
Stoppa: podman rm -f nibepi

## Kör i Kubernetes

kubectl apply -f image-to-oci-image/nibepi-runtime/k8s/nibepi-runtime.yaml

Kräver att imagen finns lokalt (`imagePullPolicy: Never`). Node-RED på NodePort 31880.