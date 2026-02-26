#!/bin/bash
# =============================================================
# Oracle Cloud Compute Instance - Chatbot Builder Deploy Script
# =============================================================
# OS: Ubuntu 22.04 (Oracle Cloud Free Tier - Ampere A1)
#
# Usage:
#   1. Create Oracle Cloud Compute Instance (Ubuntu 22.04, ARM64)
#   2. SSH into the instance
#   3. Upload this project or git clone
#   4. Run: chmod +x deploy/setup-oracle.sh && ./deploy/setup-oracle.sh
# =============================================================

set -e

echo "=========================================="
echo "  Chatbot Builder - Oracle Cloud Setup"
echo "=========================================="

# ---- Step 1: System Update ----
echo ""
echo "[1/5] Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y

# ---- Step 2: Install Docker ----
echo ""
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y ca-certificates curl gnupg lsb-release
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    echo "Docker installed successfully."
else
    echo "Docker already installed."
fi

# ---- Step 3: Install Docker Compose ----
echo ""
echo "[3/5] Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt-get install -y docker-compose
    echo "Docker Compose installed."
else
    echo "Docker Compose already installed."
fi

# ---- Step 4: Firewall (iptables) ----
echo ""
echo "[4/5] Configuring firewall (open port 80)..."
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || true
echo "Firewall rules applied."

# ---- Step 5: Setup .env and GHCR login ----
echo ""
echo "[5/5] Setting up environment..."
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
    cp .env.example .env
fi

echo ""
echo "============================================"
echo "  GHCR (GitHub Container Registry) Login"
echo "============================================"
echo ""
echo "  Pre-built Docker images are pulled from GHCR."
echo "  You need a GitHub Personal Access Token (PAT)"
echo "  with 'read:packages' scope."
echo ""
echo "  Create one at: https://github.com/settings/tokens"
echo ""
read -p "  GitHub Username: " GH_USER
read -sp "  GitHub PAT (read:packages): " GH_TOKEN
echo ""

echo "$GH_TOKEN" | docker login ghcr.io -u "$GH_USER" --password-stdin

echo ""
echo "  GHCR login successful!"

echo ""
echo "============================================"
echo "  Configure .env"
echo "============================================"
echo ""
echo "  Edit .env file and set:"
echo ""
echo "    GHCR_REPO=ghcr.io/<owner>/chatbot-builder"
echo ""
echo "  API keys can now be set via the Settings page"
echo "  in the web UI after deployment."
echo "============================================"

echo ""
echo "=========================================="
echo "  Setup complete!"
echo "=========================================="
echo ""
echo "  Next steps:"
echo "    1. Edit .env file:  nano .env"
echo "    2. Set GHCR_REPO:   GHCR_REPO=ghcr.io/<owner>/chatbot-builder"
echo "    3. Deploy:           ./deploy/update.sh"
echo "    4. View logs:        docker compose -f docker-compose.prod.yml logs -f"
echo "    5. Access:           http://<YOUR_PUBLIC_IP>"
echo ""
echo "  Stop:    docker compose -f docker-compose.prod.yml down"
echo "  Update:  ./deploy/update.sh"
echo ""
echo "  NOTE: Also open port 80 in Oracle Cloud"
echo "        Security List / Network Security Group!"
echo "=========================================="
