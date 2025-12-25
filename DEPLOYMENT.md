# Deployment Guide

## Local Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone repository
git clone <repo>
cd five-talents

# Install dependencies
npm install

# Create environment file
echo "DATABASE_URL=file:./prisma/dev.db" > .env.local

# Initialize database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Docker Deployment

### Prerequisites (Choose One)

**Option 1: Docker**
- Docker
- Docker Compose

**Option 2: Podman** (rootless, more secure)
- Podman
- podman-compose

### Quick Start with Docker

```bash
# Build and run
docker-compose up --build

# In a new terminal, seed data
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed
```

Application will be at [http://localhost:3000](http://localhost:3000)

### Quick Start with Podman

```bash
# Using podman-compose
podman-compose up --build

# In a new terminal, seed data
podman-compose exec app npm run db:push
podman-compose exec app npm run db:seed
```

Or build manually:

```bash
# Build image
podman build -t five-talents:latest .

# Create pod with port and volume mapping
podman pod create -n five-talents -p 3000:3000 \
  -v $(pwd)/data:/app/data:z

# Run container
podman run -d --pod five-talents --name app \
  -e DATABASE_URL=file:/app/data/checkin.db \
  five-talents:latest

# Initialize database
podman exec app npm run db:push
podman exec app npm run db:seed
```

### Configuration

Edit `docker-compose.yml` to customize:
- Port: Change `3000:3000` to `8080:3000` etc.
- Database path: Modify `./data:/app/data`
- Environment variables

## Production Deployment

### Environment Variables

Create `.env.local` with production values:

```env
DATABASE_URL=postgresql://user:pass@db.example.com/checkin
NODE_ENV=production
NEXTAUTH_URL=https://checkin.example.com
```

### Database Setup

For production, use PostgreSQL instead of SQLite:

```bash
# Install postgres adapter
npm install @prisma/client-postgres

# Update prisma schema
# Change: provider = "sqlite"
# To: provider = "postgresql"

# Run migrations
npm run db:push
npm run db:seed
```

### SSL/HTTPS

Use a reverse proxy (nginx, Traefik) in front of Next.js:

```nginx
server {
    listen 443 ssl http2;
    server_name checkin.example.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Monitoring

Set up monitoring for:
- Application logs: `docker logs <container>`
- Database backups: `sqlite3 /path/to/db backup <backup.db>`
- Error tracking: Sentry, LogRocket, etc.

### Backups

For SQLite:
```bash
# Daily backup
sqlite3 /app/data/checkin.db ".backup /backups/checkin-$(date +%Y%m%d).db"
```

For PostgreSQL:
```bash
# Daily backup
pg_dump DATABASE_URL > /backups/checkin-$(date +%Y%m%d).sql
```

## Security Checklist

- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set secure staff PIN (hash with bcryptjs)
- [ ] Configure database user with minimal permissions
- [ ] Enable rate limiting on API endpoints
- [ ] Set up firewall rules
- [ ] Enable database backups and recovery testing
- [ ] Set NODE_ENV=production
- [ ] Implement monitoring and alerting
- [ ] Create security group/VPC rules
- [ ] Regular security updates for dependencies

## Performance Tuning

### Database
- Add indexes on frequently queried fields (already done in schema)
- Enable query caching if using PostgreSQL

### Application
- Enable caching headers for static assets
- Use CDN for asset delivery
- Enable compression middleware

### Server
- Use managed database service for high availability
- Set up load balancing for multiple app instances
- Configure auto-scaling if using containers

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Check database file permissions
ls -la /app/data/checkin.db
chmod 644 /app/data/checkin.db
```

### High Memory Usage

```bash
# Check process memory
docker stats

# Reduce node memory
docker run -m 512m <image>
```

### Slow Responses

```bash
# Check database
npm run db:push  # Ensure schema is up to date

# View logs
docker logs app -f

# Check indexes
sqlite3 /app/data/checkin.db ".indices"
```

## Scaling

### Horizontal Scaling
- Use load balancer (nginx, HAProxy)
- Share database across instances
- Use shared storage for uploads

### Vertical Scaling
- Increase server resources (CPU, RAM)
- Upgrade database hardware
- Enable query caching

## Support

For deployment issues:
1. Check logs: `docker logs -f <container>`
2. Verify database: `npm run db:push`
3. Review environment variables
4. Test API endpoints manually
5. Contact support with logs and configuration

## Podman-Specific Deployment

### Differences from Docker

- **Rootless by default**: No sudo required (more secure)
- **No daemon**: Podman is daemonless (use `podman service` if needed)
- **Pod management**: Use `podman pod` for multi-container apps
- **Volume mounts**: Add `:z` for SELinux compatibility

### Full Podman Setup

```bash
# Build image
podman build -t five-talents:latest .

# Create pod with networking
podman pod create -n five-talents \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data:z

# Run app container
podman run -d --pod five-talents \
  --name app \
  -e DATABASE_URL=file:/app/data/checkin.db \
  -e NODE_ENV=production \
  five-talents:latest

# Initialize database
podman exec app npm run db:push
podman exec app npm run db:seed

# View logs
podman logs -f app

# Stop pod
podman pod stop five-talents

# Remove pod
podman pod rm five-talents
```

### Podman Systemd Integration

Create a systemd service for auto-start:

```ini
# ~/.config/systemd/user/five-talents.service
[Unit]
Description=Five Talents Check-In
After=network-online.target

[Service]
Type=forking
Restart=always
ExecStart=/usr/bin/podman run -d --pod five-talents --name app \
  -e DATABASE_URL=file:/app/data/checkin.db \
  five-talents:latest
ExecStop=/usr/bin/podman stop five-talents

[Install]
WantedBy=default.target
```

Enable with: `systemctl --user enable five-talents.service`

### Podman Compose vs Docker Compose

Both work identically:

```bash
# Using podman-compose (same yaml format)
podman-compose up --build
podman-compose down
podman-compose exec app npm run db:seed

# podman-compose handles rootless/SELinux automatically
```
