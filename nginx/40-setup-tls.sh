#!/bin/sh
set -eu

SOURCE_CERT_DIR="/etc/nginx/certs"
RUNTIME_CERT_DIR="/etc/nginx/runtime-certs"
RUNTIME_CONFIG_DIR="/etc/nginx/runtime-config"
RUNTIME_CERT="${RUNTIME_CERT_DIR}/tls.crt"
RUNTIME_KEY="${RUNTIME_CERT_DIR}/tls.key"
HTTP_CONF_SRC="${RUNTIME_CONFIG_DIR}/default.http.conf"
TLS_CONF_SRC="${RUNTIME_CONFIG_DIR}/default.tls.conf"
TARGET_CONF="/etc/nginx/conf.d/default.conf"

mkdir -p "${RUNTIME_CERT_DIR}"

if [ -f "${SOURCE_CERT_DIR}/fullchain.pem" ] && [ -f "${SOURCE_CERT_DIR}/privkey.pem" ]; then
  cp "${SOURCE_CERT_DIR}/fullchain.pem" "${RUNTIME_CERT}"
  cp "${SOURCE_CERT_DIR}/privkey.pem" "${RUNTIME_KEY}"
  cat "${HTTP_CONF_SRC}" > "${TARGET_CONF}"
  printf '\n' >> "${TARGET_CONF}"
  cat "${TLS_CONF_SRC}" >> "${TARGET_CONF}"
  echo "Using mounted TLS certificate from ${SOURCE_CERT_DIR}; HTTP (80) and HTTPS (443) are enabled"
  exit 0
fi

cp "${HTTP_CONF_SRC}" "${TARGET_CONF}"
rm -f "${RUNTIME_CERT}" "${RUNTIME_KEY}"
echo "No mounted TLS certificate found; serving HTTP only on port 80"
