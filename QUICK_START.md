# Quick Start Guide

## Initial Setup (First Time Only)

### 1. Install All Dependencies
\`\`\`bash
npm run install:all
\`\`\`

This installs dependencies for root, backend, and frontend.

### 2. Configure Backend Environment
\`\`\`bash
cd backend
cp .env.example .env
\`\`\`

Edit `backend/.env` with your configuration:
\`\`\`env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/abacus_crm"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"

# Optional: For cloud file uploads
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
\`\`\`

### 3. Setup Database
\`\`\`bash
npm run prisma:migrate
npm run prisma:seed
\`\`\`

This creates all tables and adds demo users.

### 4. Configure Frontend (Optional)
\`\`\`bash
cd frontend
cp .env.example .env
\`\`\`

Edit `frontend/.env`:
\`\`\`env
VITE_API_URL=http://localhost:5000/api
\`\`\`

---

## Running the Application

### Development Mode (Both Backend + Frontend)
\`\`\`bash
npm run dev
\`\`\`

This starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:5173`

### Run Backend Only
\`\`\`bash
npm run dev:backend
\`\`\`

### Run Frontend Only
\`\`\`bash
npm run dev:frontend
\`\`\`

---

## Building for Production

### Build Frontend
\`\`\`bash
npm run build
\`\`\`

This creates optimized production files in `frontend/dist/`

### Start Production Server
\`\`\`bash
npm run start
\`\`\`

This starts both backend and frontend in production mode.

---

## Database Management

### Open Prisma Studio (Database GUI)
\`\`\`bash
npm run prisma:studio
\`\`\`

### Run New Migrations
\`\`\`bash
npm run prisma:migrate
\`\`\`

### Re-seed Database
\`\`\`bash
npm run prisma:seed
\`\`\`

---

## Complete Setup (One Command)
\`\`\`bash
npm run setup
\`\`\`

This runs: install:all → prisma:migrate → prisma:seed

---

## Test Accounts

After seeding, you can login with:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@abacus.com | password123 |
| Admin | admin@abacus.com | password123 |
| Account Manager | manager@abacus.com | password123 |
| Writer | writer@abacus.com | password123 |
| Designer | designer@abacus.com | password123 |
| Post Scheduler | scheduler@abacus.com | password123 |
| Client Viewer | client@abacus.com | password123 |

---

## Troubleshooting

### Port Already in Use
If port 5000 or 5173 is already in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

### Database Connection Error
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `backend/.env`
- Check database exists: `createdb abacus_crm`

### Module Not Found
\`\`\`bash
npm run clean
npm run install:all
\`\`\`

---

## Production Deployment

See `DEPLOYMENT_GUIDE.md` for detailed production deployment instructions.
