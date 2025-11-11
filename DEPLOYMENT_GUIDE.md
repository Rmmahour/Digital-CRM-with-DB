# Abacus CRM - Production Deployment Guide

This guide will help you deploy the Abacus CRM application to a live server with demo data.

## Prerequisites

Before deploying, ensure you have:
- A server with Node.js 18+ installed
- PostgreSQL database (local or cloud-based like Neon, Supabase, AWS RDS)
- Domain name (optional but recommended)
- SSL certificate (for HTTPS)

## Deployment Options

### Option 1: Deploy to VPS (DigitalOcean, AWS EC2, Linode, etc.)
### Option 2: Deploy to Platform as a Service (Heroku, Railway, Render)
### Option 3: Deploy to Vercel (Frontend) + Railway/Render (Backend)

---

## Step 1: Prepare Your Database

### Using Cloud PostgreSQL (Recommended)

**Option A: Neon (Free tier available)**
1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:pass@host.neon.tech/dbname`)

**Option B: Supabase (Free tier available)**
1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Settings > Database and copy the connection string

**Option C: Railway (Free tier available)**
1. Go to [railway.app](https://railway.app) and create an account
2. Create a new PostgreSQL database
3. Copy the connection string from the database settings

### Using Local PostgreSQL
\`\`\`bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres psql
CREATE DATABASE abacus_crm;
CREATE USER abacus_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE abacus_crm TO abacus_user;
\q
\`\`\`

---

## Step 2: Deploy Backend

### A. Clone and Setup

\`\`\`bash
# Clone your repository
git clone <your-repo-url>
cd abacus-crm/backend

# Install dependencies
npm install

# Install PM2 for process management (production)
npm install -g pm2
\`\`\`

### B. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

\`\`\`env
# Database
DATABASE_URL="postgresql://user:password@host:5432/abacus_crm"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=5000
NODE_ENV="production"

# Frontend URL (for CORS)
FRONTEND_URL="https://yourdomain.com"

# File Upload Configuration
UPLOAD_STORAGE="local"  # or "cloud"
MAX_FILE_SIZE=10485760  # 10MB in bytes

# Cloudinary (Optional - for cloud storage)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
\`\`\`

**Generate a secure JWT_SECRET:**
\`\`\`bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
\`\`\`

### C. Run Database Migrations and Seed Data

\`\`\`bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create tables
npx prisma migrate deploy

# Seed database with demo data
npm run prisma:seed
\`\`\`

This will create 7 demo accounts:
- `superadmin@abacus.com` / `password123` (Super Admin)
- `admin@abacus.com` / `password123` (Admin)
- `manager@abacus.com` / `password123` (Account Manager)
- `writer@abacus.com` / `password123` (Writer)
- `designer@abacus.com` / `password123` (Designer)
- `scheduler@abacus.com` / `password123` (Post Scheduler)
- `client@abacus.com` / `password123` (Client Viewer)

### D. Start Backend Server

**For Development:**
\`\`\`bash
npm run dev
\`\`\`

**For Production (with PM2):**
\`\`\`bash
# Start the server
pm2 start src/server.js --name abacus-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# View logs
pm2 logs abacus-backend

# Monitor
pm2 monit
\`\`\`

### E. Setup Nginx Reverse Proxy (Optional but Recommended)

\`\`\`bash
# Install Nginx
sudo apt-get install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/abacus-api
\`\`\`

Add this configuration:
\`\`\`nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

\`\`\`bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/abacus-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
\`\`\`

### F. Setup SSL with Let's Encrypt (Recommended)

\`\`\`bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is setup automatically
\`\`\`

---

## Step 3: Deploy Frontend

### A. Configure Frontend

Update `frontend/.env`:
\`\`\`env
VITE_API_URL=https://api.yourdomain.com/api
\`\`\`

Or if backend is on the same domain:
\`\`\`env
VITE_API_URL=https://yourdomain.com/api
\`\`\`

### B. Build Frontend

\`\`\`bash
cd frontend
npm install
npm run build
\`\`\`

This creates a `dist/` folder with production-ready files.

### C. Deploy Frontend

**Option 1: Deploy to Vercel (Recommended - Free)**

\`\`\`bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
\`\`\`

**Option 2: Deploy to Netlify (Free)**

\`\`\`bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod --dir=dist
\`\`\`

**Option 3: Serve with Nginx (Same server as backend)**

\`\`\`bash
# Copy build files to web directory
sudo cp -r dist/* /var/www/abacus-crm/

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/abacus-frontend
\`\`\`

Add this configuration:
\`\`\`nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/abacus-crm;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (if backend is on same server)
    location /api {
        proxy_pass http://localhost:5000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

\`\`\`bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/abacus-frontend /etc/nginx/sites-enabled/

# Restart Nginx
sudo systemctl restart nginx

# Setup SSL
sudo certbot --nginx -d yourdomain.com
\`\`\`

---

## Step 4: Post-Deployment Checklist

### Security
- [ ] Change all demo account passwords
- [ ] Update JWT_SECRET to a strong random value
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall (UFW or cloud provider firewall)
- [ ] Set up database backups
- [ ] Restrict database access to backend server only

### Monitoring
- [ ] Setup error logging (Sentry, LogRocket, etc.)
- [ ] Configure uptime monitoring (UptimeRobot, Pingdom)
- [ ] Setup PM2 monitoring dashboard
- [ ] Configure database monitoring

### Performance
- [ ] Enable Nginx gzip compression
- [ ] Setup CDN for static assets (Cloudflare)
- [ ] Configure database connection pooling
- [ ] Enable Redis caching (optional)

### Backup Strategy
\`\`\`bash
# Automated database backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > /backups/abacus_crm_$DATE.sql
# Keep only last 7 days of backups
find /backups -name "abacus_crm_*.sql" -mtime +7 -delete
\`\`\`

Add to crontab:
\`\`\`bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-script.sh
\`\`\`

---

## Step 5: Update Demo Data (Optional)

If you want to customize the demo data:

1. Edit `backend/prisma/seed.js`
2. Modify user accounts, brands, or tasks
3. Re-run the seed:
\`\`\`bash
npx prisma db seed
\`\`\`

Or reset and reseed:
\`\`\`bash
npx prisma migrate reset
\`\`\`

---

## Troubleshooting

### Backend won't start
\`\`\`bash
# Check logs
pm2 logs abacus-backend

# Check if port is in use
sudo lsof -i :5000

# Restart backend
pm2 restart abacus-backend
\`\`\`

### Database connection issues
\`\`\`bash
# Test database connection
npx prisma db pull

# Check DATABASE_URL format
echo $DATABASE_URL
\`\`\`

### Frontend can't connect to backend
- Check CORS settings in backend
- Verify VITE_API_URL in frontend .env
- Check browser console for errors
- Verify SSL certificates are valid

### File uploads not working
- Check `uploads/` directory permissions: `chmod 755 uploads/`
- Verify MAX_FILE_SIZE in .env
- Check Cloudinary credentials if using cloud storage

---

## Scaling Considerations

### For High Traffic:
1. **Load Balancing**: Use Nginx or cloud load balancer
2. **Database**: Use connection pooling, read replicas
3. **Caching**: Implement Redis for sessions and frequently accessed data
4. **CDN**: Use Cloudflare or AWS CloudFront
5. **Horizontal Scaling**: Deploy multiple backend instances

### Database Optimization:
\`\`\`sql
-- Add indexes for frequently queried fields
CREATE INDEX idx_tasks_status ON "Task"(status);
CREATE INDEX idx_tasks_priority ON "Task"(priority);
CREATE INDEX idx_users_role ON "User"(role);
\`\`\`

---

## Support & Maintenance

### Regular Maintenance Tasks:
- Update dependencies monthly: `npm update`
- Review and rotate JWT secrets quarterly
- Monitor disk space for uploads
- Review activity logs for suspicious activity
- Update SSL certificates (auto-renewed with Let's Encrypt)

### Updating the Application:
\`\`\`bash
# Pull latest changes
git pull origin main

# Backend
cd backend
npm install
npx prisma migrate deploy
pm2 restart abacus-backend

# Frontend
cd ../frontend
npm install
npm run build
# Copy new build files to web directory
\`\`\`

---

## Quick Deploy Commands Summary

\`\`\`bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
pm2 start src/server.js --name abacus-backend

# Frontend
cd frontend
npm install
npm run build
vercel --prod  # or copy dist/ to web server
\`\`\`

---

## Environment-Specific URLs

**Development:**
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

**Production:**
- Frontend: https://yourdomain.com
- Backend: https://api.yourdomain.com (or https://yourdomain.com/api)

---

## Demo Credentials (Change in Production!)

After deployment, login with:
- **Super Admin**: superadmin@abacus.com / password123
- **Admin**: admin@abacus.com / password123
- **Account Manager**: manager@abacus.com / password123
- **Writer**: writer@abacus.com / password123
- **Designer**: designer@abacus.com / password123
- **Post Scheduler**: scheduler@abacus.com / password123
- **Client Viewer**: client@abacus.com / password123

**IMPORTANT**: Change all passwords immediately after first login!

---

## Additional Resources

- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/getting-started/)

---

For questions or issues, refer to the main README.md or create an issue in the repository.
