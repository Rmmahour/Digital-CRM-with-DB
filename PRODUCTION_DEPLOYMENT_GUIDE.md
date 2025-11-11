# Abacus CRM - Production Deployment Guide

## 1. SYSTEM REQUIREMENTS

### Minimum Server Specifications
- **CPU**: 2 vCPU (4 vCPU recommended for 100+ concurrent users)
- **RAM**: 4GB (8GB recommended)
- **Storage**: 50GB minimum (SSD recommended for better performance)
- **Bandwidth**: 10Mbps minimum

### Operating System
- **Recommended**: Ubuntu 20.04 LTS or CentOS 8
- **Supports**: Any Linux distribution with Node.js support

---

## 2. REQUIRED SOFTWARE VERSIONS

### Node.js
\`\`\`
Node.js: v16.x or v18.x (v18.x recommended)
npm: v8.x or higher
\`\`\`
**Installation**:
\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verify installation
npm --version
\`\`\`

### PostgreSQL
\`\`\`
PostgreSQL: v13.x or higher (v14.x or v15.x recommended)
\`\`\`
**Installation (Ubuntu)**:
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
psql --version
\`\`\`

### Nginx (Reverse Proxy)
\`\`\`
Nginx: Latest stable version
\`\`\`
**Installation**:
\`\`\`bash
sudo apt update
sudo apt install nginx
sudo systemctl start nginx
sudo systemctl enable nginx
\`\`\`

### PM2 (Process Manager)
\`\`\`
PM2: Latest version
\`\`\`
**Installation**:
\`\`\`bash
sudo npm install -g pm2
pm2 --version
\`\`\`

---

## 3. DATABASE CONFIGURATION

### PostgreSQL Remote Database Setup

#### Step 1: Create Database and User
\`\`\`sql
-- Connect to PostgreSQL as superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE abacus_crm;

-- Create user with password
CREATE USER abacus_user WITH PASSWORD 'your_secure_password_here';

-- Grant privileges
ALTER ROLE abacus_user SET client_encoding TO 'utf8';
ALTER ROLE abacus_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE abacus_user SET default_transaction_deferrable TO on;
ALTER ROLE abacus_user SET default_transaction_read_only TO off;
GRANT ALL PRIVILEGES ON DATABASE abacus_crm TO abacus_user;

-- Connect to the database
\c abacus_crm

-- Grant schema privileges
GRANT ALL PRIVILEGES ON SCHEMA public TO abacus_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO abacus_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO abacus_user;

-- Exit psql
\q
\`\`\`

#### Step 2: Configure PostgreSQL for Remote Connections
Edit `/etc/postgresql/14/main/postgresql.conf`:
\`\`\`bash
sudo nano /etc/postgresql/14/main/postgresql.conf
\`\`\`
Add or modify:
\`\`\`
listen_addresses = '*'
\`\`\`

Edit `/etc/postgresql/14/main/pg_hba.conf`:
\`\`\`bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
\`\`\`
Add at the end:
\`\`\`
host    abacus_crm    abacus_user    0.0.0.0/0    md5
\`\`\`

Restart PostgreSQL:
\`\`\`bash
sudo systemctl restart postgresql
\`\`\`

#### Step 3: Test Remote Connection
\`\`\`bash
psql -h SERVER_IP -U abacus_user -d abacus_crm -c "SELECT 1;"
\`\`\`

---

## 4. ENVIRONMENT VARIABLES

### Backend (.env file location: `/backend/.env`)

\`\`\`env
# === DATABASE ===
DATABASE_URL="postgresql://abacus_user:your_secure_password@db.server.com:5432/abacus_crm?schema=public"

# === SERVER ===
PORT=5000
NODE_ENV="production"

# === FRONTEND ===
FRONTEND_URL="https://yourdomain.com"

# === JWT ===
JWT_SECRET="generate_a_strong_32_character_secret_key_here"
JWT_EXPIRES_IN="7d"

# === FILE UPLOAD ===
UPLOAD_STORAGE="local"
MAX_FILE_SIZE=10485760

# === CLOUDINARY (Optional - for cloud image storage) ===
CLOUDINARY_CLOUD_NAME="your_cloudinary_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# === EMAIL CONFIGURATION ===
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-app-password"
EMAIL_FROM="Abacus CRM <noreply@abacuscrm.com>"

# === TWILIO WHATSAPP (Optional) ===
TWILIO_ACCOUNT_SID="your_account_sid"
TWILIO_AUTH_TOKEN="your_auth_token"
TWILIO_WHATSAPP_FROM="whatsapp:+1234567890"
\`\`\`

### Frontend (.env file location: `/frontend/.env`)

\`\`\`env
VITE_API_BASE_URL="https://api.yourdomain.com"
VITE_SOCKET_URL="https://api.yourdomain.com"
\`\`\`

---

## 5. DEPLOYMENT SETUP PROCESS

### Step 1: Install Dependencies

**Backend**:
\`\`\`bash
cd /var/www/abacus-crm/backend
npm install
\`\`\`

**Frontend**:
\`\`\`bash
cd /var/www/abacus-crm/frontend
npm install
\`\`\`

### Step 2: Database Migration

\`\`\`bash
cd /var/www/abacus-crm/backend
npx prisma migrate deploy
npx prisma generate
npx prisma db seed  # Optional: seed initial data
\`\`\`

### Step 3: Build Frontend

\`\`\`bash
cd /var/www/abacus-crm/frontend
npm run build
\`\`\`

This creates a `dist/` folder with optimized production files.

### Step 4: Start Backend with PM2

\`\`\`bash
cd /var/www/abacus-crm/backend

# Start the application
pm2 start npm --name "abacus-crm-backend" -- start

# Save PM2 process list to auto-start on reboot
pm2 save

# Set up PM2 to start on system boot
pm2 startup
\`\`\`

Monitor logs:
\`\`\`bash
pm2 logs abacus-crm-backend
pm2 monit
\`\`\`

---

## 6. NGINX REVERSE PROXY CONFIGURATION

### Step 1: Create Nginx Config

Create `/etc/nginx/sites-available/abacus-crm`:

\`\`\`nginx
# Upstream backend server
upstream backend {
    server localhost:5000;
    keepalive 64;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com api.yourdomain.com;
    
    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Backend API
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;
    
    # SSL Certificates (use Let's Encrypt with Certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Logging
    access_log /var/log/nginx/abacus-crm-access.log;
    error_log /var/log/nginx/abacus-crm-error.log;
    
    # API endpoints
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Socket.io configuration
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Socket.io endpoint
    location /socket.io {
        proxy_pass http://backend/socket.io;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    location /uploads/ {
        proxy_pass http://backend/uploads/;
        proxy_set_header Host $host;
        proxy_cache_valid 200 10m;
    }
}

# HTTPS Frontend
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com;
    
    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval'" always;
    
    # Logging
    access_log /var/log/nginx/abacus-crm-frontend-access.log;
    error_log /var/log/nginx/abacus-crm-frontend-error.log;
    
    # Root directory
    root /var/www/abacus-crm/frontend/dist;
    index index.html;
    
    # SPA routing - rewrite all non-file requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
\`\`\`

### Step 2: Enable Configuration

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/abacus-crm /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
\`\`\`

---

## 7. SSL CERTIFICATE SETUP (Let's Encrypt)

### Install Certbot

\`\`\`bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
\`\`\`

### Generate Certificates

\`\`\`bash
# For API domain
sudo certbot certonly --nginx -d api.yourdomain.com

# For frontend domain
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renew setup
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
\`\`\`

---

## 8. SOCKET.IO CONFIGURATION

The backend is configured with Socket.io for real-time features:

**Features**:
- Real-time chat messages
- Task status updates
- Notifications
- User typing indicators

**Configuration in server.js**:
- Port: 5000 (same as backend)
- CORS enabled for frontend domain
- Connection rooms: `user-{userId}`, `chat-{roomId}`

No additional setup needed - Socket.io is included in `npm install`.

---

## 9. FILE UPLOADS & CLOUDINARY

### Local Storage (Current Setup)
Files are stored in `/backend/uploads/` folder. Ensure proper permissions:

\`\`\`bash
sudo chown -R node:node /var/www/abacus-crm/backend/uploads
sudo chmod 755 /var/www/abacus-crm/backend/uploads
\`\`\`

### Cloud Storage with Cloudinary (Optional)

1. Sign up at https://cloudinary.com
2. Get your credentials (Cloud Name, API Key, API Secret)
3. Add to `.env`:
\`\`\`env
UPLOAD_STORAGE="cloudinary"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
\`\`\`

---

## 10. FOLDER STRUCTURE

### Deployment Directory
\`\`\`
/var/www/abacus-crm/
├── backend/
│   ├── src/
│   ├── prisma/
│   ├── uploads/
│   ├── package.json
│   ├── .env (production)
│   └── node_modules/
├── frontend/
│   ├── src/
│   ├── dist/  (build output)
│   ├── package.json
│   ├── .env (production)
│   └── node_modules/
└── logs/
    ├── nginx/
    └── pm2/
\`\`\`

### Setup Commands
\`\`\`bash
sudo mkdir -p /var/www/abacus-crm/{backend,frontend,logs/{nginx,pm2}}
sudo chown -R node:node /var/www/abacus-crm
\`\`\`

---

## 11. MONITORING & LOGS

### PM2 Process Monitoring
\`\`\`bash
pm2 status              # Check process status
pm2 logs               # View all logs
pm2 logs abacus-crm-backend  # Backend logs only
pm2 monit              # Real-time monitoring
pm2 save               # Save current setup
pm2 load               # Reload saved setup
\`\`\`

### Nginx Logs
\`\`\`bash
tail -f /var/log/nginx/abacus-crm-access.log
tail -f /var/log/nginx/abacus-crm-error.log
\`\`\`

### System Monitoring
\`\`\`bash
# Check memory and CPU
htop

# Check disk space
df -h

# Check running processes
ps aux | grep node
\`\`\`

---

## 12. BACKUP & DISASTER RECOVERY

### PostgreSQL Backup
\`\`\`bash
# Daily backup
0 2 * * * pg_dump -U abacus_user -d abacus_crm > /backups/abacus_crm_$(date +\%Y\%m\%d).sql

# Restore from backup
psql -U abacus_user -d abacus_crm < /backups/abacus_crm_YYYYMMDD.sql
\`\`\`

### Application Files Backup
\`\`\`bash
# Backup uploads folder
0 3 * * * tar -czf /backups/uploads_$(date +\%Y\%m\%d).tar.gz /var/www/abacus-crm/backend/uploads/
\`\`\`

---

## 13. PERFORMANCE TUNING

### PostgreSQL Optimization
Edit `/etc/postgresql/14/main/postgresql.conf`:
\`\`\`
shared_buffers = 256MB          # 25% of total RAM
effective_cache_size = 1GB      # 50-75% of RAM
work_mem = 32MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
\`\`\`

Restart: `sudo systemctl restart postgresql`

### Nginx Performance
\`\`\`nginx
# In nginx.conf
worker_processes auto;
worker_connections 4096;
keepalive_timeout 65;
gzip on;
gzip_min_length 1000;
gzip_types text/plain text/css text/javascript application/json;
\`\`\`

### Node.js Memory
\`\`\`bash
NODE_OPTIONS="--max-old-space-size=1024" pm2 start npm --name "abacus-crm-backend" -- start
\`\`\`

---

## 14. QUICK DEPLOYMENT CHECKLIST

- [ ] Node.js v18.x installed
- [ ] PostgreSQL 14+ installed and running
- [ ] Nginx installed
- [ ] PM2 installed globally
- [ ] Backend .env configured with production values
- [ ] Frontend .env configured with production API URL
- [ ] Database created and user permissions set
- [ ] Prisma migrations applied
- [ ] Frontend built (`npm run build`)
- [ ] SSL certificates installed (Let's Encrypt)
- [ ] Nginx config created and enabled
- [ ] Backend started with PM2
- [ ] Nginx configured for socket.io
- [ ] Domain DNS records updated
- [ ] Backups configured
- [ ] Monitoring setup (PM2 + Nginx logs)

---

## 15. TROUBLESHOOTING

### Backend won't start
\`\`\`bash
pm2 logs abacus-crm-backend
# Check for database connection issues
psql -h DB_HOST -U abacus_user -d abacus_crm -c "SELECT 1;"
\`\`\`

### Socket.io connection fails
- Check FRONTEND_URL in .env matches actual frontend domain
- Ensure Nginx proxy_buffering is off for /socket.io
- Check firewall allows WebSocket connections

### Frontend shows blank page
- Verify frontend .env VITE_API_BASE_URL is correct
- Check browser console for errors
- Clear browser cache and rebuild frontend: `npm run build`

### Database connection errors
- Verify DATABASE_URL is correct
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Test connection: `psql -h HOST -U USER -d DB -c "SELECT 1;"`

---

## Support
For issues, check logs: `pm2 logs` and `tail -f /var/log/nginx/abacus-crm-*.log`
