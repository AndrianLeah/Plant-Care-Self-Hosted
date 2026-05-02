#!/bin/sh
set -eu

SOURCE_CERT_DIR="/etc/nginx/certs"
RUNTIME_CERT_DIR="/etc/nginx/runtime-certs"
RUNTIME_CERT="${RUNTIME_CERT_DIR}/tls.crt"
RUNTIME_KEY="${RUNTIME_CERT_DIR}/tls.key"

mkdir -p "${RUNTIME_CERT_DIR}"

if [ -f "${SOURCE_CERT_DIR}/fullchain.pem" ] && [ -f "${SOURCE_CERT_DIR}/privkey.pem" ]; then
  cp "${SOURCE_CERT_DIR}/fullchain.pem" "${RUNTIME_CERT}"
  cp "${SOURCE_CERT_DIR}/privkey.pem" "${RUNTIME_KEY}"
  echo "Using mounted TLS certificate from ${SOURCE_CERT_DIR}"
  exit 0
fi

if [ ! -f "${RUNTIME_CERT}" ] || [ ! -f "${RUNTIME_KEY}" ]; then
  echo "No mounted TLS certificate found; generating self-signed fallback certificate"
  openssl req \
    -x509 \
    -nodes \
    -newkey rsa:2048 \
    -days 365 \
    -keyout "${RUNTIME_KEY}" \
    -out "${RUNTIME_CERT}" \
    -subj "/CN=localhost" \
    -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" \
    >/dev/null 2>&1
fi
