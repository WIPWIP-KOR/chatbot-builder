#!/bin/bash
# =============================================================
# Oracle Cloud Compute Instance - Chatbot Builder Deploy Script
# =============================================================
# OS: Ubuntu 22.04 (Oracle Cloud Free Tier)
#
# Usage:
#   1. Create Oracle Cloud Compute Instance (Ubuntu 22.04)
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

# ---- Step 5: Setup .env ----
echo ""
echo "[5/5] Setting up environment..."
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "============================================"
    echo "  IMPORTANT: Edit .env file with API keys!"
    echo "============================================"
    echo "  Run: nano .env"
    echo ""
    echo "  Then set at least one API key:"
    echo "    ANTHROPIC_API_KEY=sk-ant-..."
    echo "    OPENAI_API_KEY=sk-..."
    echo "    GEMINI_API_KEY=..."
    echo "============================================"
else
    echo ".env file already exists."
fi

echo ""
echo "=========================================="
echo "  Setup complete!"
echo "=========================================="
echo ""
echo "  Next steps:"
echo "    1. Edit .env file:  nano .env"
echo "    2. Start the app:   docker-compose -f docker-compose.prod.yml up -d --build"
echo "    3. View logs:        docker-compose -f docker-compose.prod.yml logs -f"
echo "    4. Access:           http://<YOUR_PUBLIC_IP>"
echo ""
echo "  Stop:    docker-compose -f docker-compose.prod.yml down"
echo "  Restart: docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "  NOTE: Also open port 80 in Oracle Cloud"
echo "        Security List / Network Security Group!"
echo "=========================================="
