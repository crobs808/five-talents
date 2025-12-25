# Podman Setup Guide

## Overview

Podman is a drop-in replacement for Docker with key advantages:
- ✅ **Rootless by default** - No privilege escalation needed
- ✅ **Daemonless** - More efficient resource usage
- ✅ **Compatible** - Works with docker-compose files
- ✅ **Secure** - Reduced attack surface

## Prerequisites

### Install Podman

**Ubuntu/Debian:**
```bash
sudo apt-get install podman
```

**CentOS/RHEL:**
```bash
sudo dnf install podman
```

**macOS:**
```bash
brew install podman
```

**Windows (WSL2):**
```bash
wsl -d podman -- podman run -d nginx
```

### Install podman-compose

```bash
pip install podman-compose
```

Or from package manager:
```bash
# Ubuntu
sudo apt-get install podman-compose

# macOS
brew install podman-compose
```

## Quick Start

### Option 1: Using podman-compose (Easiest)

```bash
cd /path/to/five-talents
podman-compose up --build
```

That's it! The `docker-compose.yml` works as-is with podman-compose.

### Option 2: Using Podman Directly (More Control)

```bash
# 1. Build the image
podman build -t five-talents:latest .

# 2. Create a pod for the app
podman pod create \
  --name five-talents \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data:z

# 3. Run the container
podman run -d \
  --pod five-talents \
  --name app \
  -e DATABASE_URL=file:/app/data/checkin.db \
  five-talents:latest

# 4. Initialize database
podman exec app npm run db:push
podman exec app npm run db:seed

# 5. View logs
podman logs -f app
```

## Common Commands

### Container Management

```bash
# List containers
podman ps -a

# View logs
podman logs app                # Latest logs
podman logs -f app             # Follow logs
podman logs --tail 50 app      # Last 50 lines

# Execute commands
podman exec app npm run db:push
podman exec -it app bash       # Interactive shell

# Stop/start
podman stop app
podman start app
podman restart app

# Remove
podman rm app
```

### Pod Management

```bash
# List pods
podman pod ls -a

# Pod stats
podman pod stats five-talents

# Stop entire pod
podman pod stop five-talents

# Remove entire pod
podman pod rm five-talents
```

### Image Management

```bash
# List images
podman image ls

# Remove image
podman rmi five-talents:latest

# Tag image
podman tag five-talents:latest myregistry/five-talents:1.0

# Push to registry
podman push myregistry/five-talents:1.0
```

## Rootless Mode (Default)

Podman runs rootless by default, which is more secure:

```bash
# Check if running rootless
podman info | grep rootless

# User-specific storage
~/.local/share/containers/storage

# SystemD user services work in rootless mode
systemctl --user start podman
```

## SELinux Compatibility

If using SELinux, add `:z` to volume mounts:

```bash
podman run -d \
  --pod five-talents \
  -v $(pwd)/data:/app/data:z \  # Add :z for SELinux
  five-talents:latest
```

## Network Configuration

### Port Mapping

```bash
# Single port
podman pod create -n five-talents -p 3000:3000

# Multiple ports
podman pod create -n five-talents \
  -p 3000:3000 \
  -p 8080:8080

# Specific interface
podman pod create -n five-talents -p 127.0.0.1:3000:3000
```

### Custom Networks

```bash
# Create network
podman network create five-talents-net

# Create pod on network
podman pod create --network five-talents-net -n five-talents

# Containers can communicate by name
```

## Persistent Storage

### Volumes

```bash
# Create named volume
podman volume create five-talents-data

# Use in container
podman run -d \
  -v five-talents-data:/app/data \
  five-talents:latest

# List volumes
podman volume ls

# Remove volume
podman volume rm five-talents-data
```

### Bind Mounts

```bash
# Mount host directory
podman run -d \
  -v $(pwd)/data:/app/data:z \
  five-talents:latest

# Read-only mount
podman run -d \
  -v $(pwd)/data:/app/data:ro,z \
  five-talents:latest
```

## Environment Variables

```bash
# Pass via command line
podman run -d \
  -e DATABASE_URL=file:/app/data/checkin.db \
  -e NODE_ENV=production \
  five-talents:latest

# Pass via file
podman run -d \
  --env-file .env \
  five-talents:latest
```

## Systemd Integration

### Create User Service

```bash
# Create directory
mkdir -p ~/.config/systemd/user

# Create service file
cat > ~/.config/systemd/user/five-talents.service << 'EOF'
[Unit]
Description=Five Talents Check-In
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
Restart=on-failure
RestartSec=10
ExecStart=/usr/bin/podman run --rm \
  --pod-id-file=%t/five-talents.pod-id \
  --pod five-talents \
  --name app \
  -e DATABASE_URL=file:/app/data/checkin.db \
  five-talents:latest

ExecStop=/usr/bin/podman stop app

[Install]
WantedBy=default.target
EOF

# Enable and start
systemctl --user daemon-reload
systemctl --user enable five-talents.service
systemctl --user start five-talents.service
```

### View Service Status

```bash
systemctl --user status five-talents.service
systemctl --user logs -u five-talents.service
systemctl --user restart five-talents.service
```

## Podman Pod Setup for Production

### Complete Production Setup

```bash
#!/bin/bash
set -e

# Variables
APP_NAME="five-talents"
IMAGE="five-talents:latest"
PORT=3000
DATA_DIR="$(pwd)/data"
DB_FILE="$DATA_DIR/checkin.db"

# Create data directory
mkdir -p "$DATA_DIR"

# Build image
echo "Building image..."
podman build -t "$IMAGE" .

# Stop existing pod
echo "Stopping existing pod..."
podman pod stop "$APP_NAME" 2>/dev/null || true
podman pod rm "$APP_NAME" 2>/dev/null || true

# Create pod
echo "Creating pod..."
podman pod create \
  --name "$APP_NAME" \
  -p "$PORT:3000" \
  -v "$DATA_DIR:/app/data:z"

# Run container
echo "Starting container..."
podman run -d \
  --pod "$APP_NAME" \
  --name app \
  -e DATABASE_URL="file:/app/data/checkin.db" \
  -e NODE_ENV=production \
  "$IMAGE"

# Initialize database
echo "Initializing database..."
podman exec app npm run db:push
podman exec app npm run db:seed

# Verify
echo "Verifying..."
sleep 2
podman logs app | head -20
podman pod stats "$APP_NAME" --no-stream

echo "✅ Done! App available at http://localhost:$PORT"
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
podman logs app

# Check pod status
podman pod inspect five-talents

# Try running interactively
podman run -it --pod five-talents five-talents:latest sh
```

### Permission Issues

```bash
# Fix volume permissions
ls -la data/
chmod 755 data/

# For SELinux, use :z flag on mounts
podman run -v $(pwd)/data:/app/data:z ...
```

### Port Already in Use

```bash
# Check what's using the port
sudo lsof -i :3000

# Use different port
podman pod create -p 8000:3000 five-talents
```

### Out of Disk Space

```bash
# Clean up unused volumes
podman volume prune

# Clean up unused images
podman image prune

# Clean up unused containers
podman container prune

# Deep clean
podman system prune -a
```

## Migration from Docker

```bash
# If you were using Docker, cleanup is simple:
docker-compose down
docker images prune -a

# Then just use podman with same compose file:
podman-compose up --build
```

## Performance Tips

1. **Use volume mounts sparingly** - They have overhead
2. **Use named volumes** for databases - Better performance
3. **Set memory limits** - Prevent runaway containers
4. **Monitor resource usage** - `podman stats`
5. **Cache layers** - Build images incrementally

## Security Best Practices

✅ **Default**: Rootless mode (unprivileged containers)
✅ **Isolation**: Pods provide network isolation
✅ **Secrets**: Use `podman secret` for sensitive data
✅ **Images**: Use verified images from registries
✅ **Scanning**: Scan images for vulnerabilities

## Further Reading

- [Podman Documentation](https://docs.podman.io/)
- [podman-compose GitHub](https://github.com/containers/podman-compose)
- [Podman vs Docker](https://docs.podman.io/en/latest/markdown/podman.1.html#introduction)
