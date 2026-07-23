# Puli Digital Menu - Deployment Guide

## Architecture

Puli consists of three sub-projects:

| Sub-project | Directory | Technology |
|---|---|---|
| **Admin Frontend** | `puli-digimenu-adminV2/puli-digimenu-adminV2` | React + Vite + TypeScript |
| **Customer Frontend** | `puli-digital-menu_V2/puli-digital-menu_V2` | React + Vite + TypeScript |
| **Backend API** | `puli-mern-backend-v2` | Node.js + Express + MongoDB |

## Required Server Software

- **Node.js** >= 18.x
- **npm** >= 9.x
- **MongoDB** >= 6.x (local or Atlas)
- **PM2** (recommended) for process management: `npm install -g pm2`
- **Nginx** or **Caddy** (recommended) as a reverse proxy for HTTPS

## SSH Key Setup

1. Generate an SSH key pair on your local machine (Windows):
   ```cmd
   ssh-keygen -t ed25519 -C "your-email@example.com"
   ```

2. Copy the public key to your server:
   ```cmd
   type %USERPROFILE%\.ssh\id_ed25519.pub | ssh user@server "cat >> ~/.ssh/authorized_keys"
   ```

3. Test the connection:
   ```cmd
   ssh user@server
   ```

## Firewall Port Requirements

| Port | Service | Description |
|---|---|---|
| 22 | SSH | Secure shell access |
| 80 | HTTP | Web traffic (reverse proxy) |
| 443 | HTTPS | Encrypted web traffic (reverse proxy) |
| 5000 | Backend API | Node.js Express server (internal only) |
| 27017 | MongoDB | Database (internal only, or use MongoDB Atlas) |

## Production Environment Variables

Create/edit `.env` in `puli-mern-backend-v2/` on the server:

```env
# MongoDB Connection (use Atlas or local)
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/pulimenu

# Server Port
PORT=5000

# JWT Configuration (generate a strong random secret)
JWT_SECRET=<generate-a-strong-random-secret>
JWT_EXPIRE=8h

# Admin Credentials
ADMIN_EMAIL=admin@puli.com
ADMIN_PASSWORD=<strong-password>

# Environment
NODE_ENV=production
```

For the frontends, configure API URLs in their respective `.env` files:

**Admin frontend** (`puli-digimenu-adminV2/puli-digimenu-adminV2/.env`):
```env
VITE_API_URL=https://api.yourdomain.com
```

**Customer frontend** (`puli-digital-menu_V2/puli-digital-menu_V2/.env`):
```env
VITE_API_URL=https://api.yourdomain.com
```

## How to Run `host-ssh.cmd`

1. Open `host-ssh.cmd` in a text editor.
2. Set the configuration variables at the top of the file:
   ```cmd
   set "SSH_USER=<SSH_USERNAME>"
   set "SSH_HOST=<SERVER_IP_OR_DOMAIN>"
   set "SSH_PORT=22"
   set "REMOTE_DIR=/var/www/puli"
   set "APP_PORT=3000"
   ```
3. Replace `<SSH_USERNAME>` with your server username (e.g., `ubuntu` or `deploy`).
4. Replace `<SERVER_IP_OR_DOMAIN>` with your server's IP address or domain.
5. Change `SSH_PORT` if your server uses a non-standard port.
6. Change `REMOTE_DIR` to your desired deployment directory.
7. Change `APP_PORT` to the port the backend API will listen on.
8. Save the file and double-click `host-ssh.cmd` to deploy.

The script will:
- Create the remote directory
- Transfer all project files (excluding `.git`, `node_modules`, build caches, logs)
- Install dependencies on the remote server
- Build the frontends
- Start/restart the backend with PM2 (or nohup as fallback)

## How to Restart the Application

```bash
# Using PM2
pm2 restart puli-backend

# Or by process ID
pm2 restart 0

# Without PM2
cd /var/www/puli/puli-mern-backend-v2
kill $(cat app.pid) 2>/dev/null
nohup node server.js > app.log 2>&1 &
```

## How to Inspect Logs

```bash
# PM2 logs
pm2 logs puli-backend

# PM2 raw logs
pm2 logs --raw

# Application log file
tail -f /var/www/puli/puli-mern-backend-v2/app.log

# Nginx logs (if using reverse proxy)
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## How to Update the Deployed Application

1. Make changes locally in the Puli project.
2. Run `host-ssh.cmd` again — it transfers all files and restarts the application.

Or for a quick update of just the backend:

```cmd
cd /var/www/puli/puli-mern-backend-v2
git pull
npm install
pm2 restart puli-backend
```

## Recommended Production Setup

### Reverse Proxy with Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Admin panel (served as static files)
    location /admin {
        alias /var/www/puli/puli-digimenu-adminV2/puli-digimenu-adminV2/dist;
        try_files $uri $uri/ /admin/index.html;
    }

    # Customer menu (served as static files)
    location / {
        alias /var/www/puli/puli-digital-menu_V2/puli-digital-menu_V2/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### HTTPS with Certbot

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Process Management with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the backend
cd /var/www/puli/puli-mern-backend-v2
pm2 start server.js --name puli-backend -i max

# Save PM2 process list for auto-start on reboot
pm2 save
pm2 startup
```
