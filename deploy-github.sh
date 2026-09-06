#!/bin/bash
# Script para subir T21 EcoLingo a GitHub
# Uso: ./deploy-github.sh
# O:   bash deploy-github.sh

set -e

REPO_URL="https://github.com/jocerdaroales2008-afk/TP21ECOLINGO.git"

echo "=========================================="
echo "  T21 EcoLingo - Deploy a GitHub"
echo "=========================================="
echo ""

# Verificar si ya es un repo git
if [ ! -d .git ]; then
  echo "[1/4] Inicializando repositorio Git..."
  git init
  git branch -M main
else
  echo "[1/4] Repositorio Git ya inicializado."
fi

# Configurar usuario si no existe
git config user.email 2>/dev/null || git config user.email "ecolingo@bolt.new"
git config user.name 2>/dev/null || git config user.name "EcoLingo"

echo "[2/4] Agregando archivos..."
git add -A

echo "[3/4] Creando commit..."
git commit -m "feat: T21 EcoLingo - Reciclaje domiciliario con búsqueda dinámica, voz, mapa y PWA" || echo "  (commit ya existe, continuando...)"

echo "[4/4] Subiendo a GitHub..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"
git push -u origin main

echo ""
echo "=========================================="
echo "  Listo! Tu proyecto está en GitHub:"
echo "  $REPO_URL"
echo "=========================================="
