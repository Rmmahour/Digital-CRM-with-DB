# Database Migration Guide

## Issue: Calendar Tables Don't Exist

If you're getting errors like "Table 'Calendar' does not exist" or "Failed to open calendar", you need to run a database migration to create the new Calendar tables.

## Solution: Run Prisma Migration

### Step 1: Navigate to Backend Folder
\`\`\`bash
cd backend
\`\`\`

### Step 2: Generate and Run Migration
\`\`\`bash
# Generate migration files
npx prisma migrate dev --name add_calendar_module

# This will:
# 1. Create migration files in prisma/migrations/
# 2. Apply the migration to your database
# 3. Generate Prisma Client with new models
\`\`\`

### Step 3: Verify Migration
\`\`\`bash
# Check if tables were created
npx prisma studio

# This opens Prisma Studio where you can see:
# - Calendar table
# - CalendarScope table
# - Updated Task table (with calendarId field)
\`\`\`

### Step 4: Restart Backend Server
\`\`\`bash
# Stop the server (Ctrl+C) and restart
npm run dev
\`\`\`

## What Gets Created

The migration adds these new tables:

### 1. Calendar Table
- id (String, Primary Key)
- brandId (Foreign Key to Brand)
- month (Integer, 1-12)
- year (Integer)
- status (Enum: DRAFT, ACTIVE, COMPLETED)
- createdById (Foreign Key to User)
- createdAt, updatedAt

### 2. CalendarScope Table
- id (String, Primary Key)
- calendarId (Foreign Key to Calendar)
- contentType (Enum: STATIC, VIDEO, STORY, REEL, CAROUSEL)
- quantity (Integer)
- completed (Integer, default 0)
- createdAt, updatedAt

### 3. Task Table Updates
- Adds calendarId (Optional Foreign Key to Calendar)
- Adds contentType (Optional Enum)
- Adds postingDate (Optional DateTime)

## Troubleshooting

### Error: "Migration failed"
\`\`\`bash
# Reset database (WARNING: This deletes all data)
npx prisma migrate reset

# Then run seed again
npm run prisma:seed
\`\`\`

### Error: "Prisma Client out of sync"
\`\`\`bash
# Regenerate Prisma Client
npx prisma generate
\`\`\`

### Error: "Connection refused"
Make sure PostgreSQL is running and DATABASE_URL in .env is correct.

## Production Migration

For production servers:

\`\`\`bash
# Don't use migrate dev in production
# Use migrate deploy instead
npx prisma migrate deploy
\`\`\`

This applies pending migrations without prompting for input.

## Verify Everything Works

After migration:

1. Restart backend: `npm run dev`
2. Open frontend: `http://localhost:5173`
3. Go to Brands page
4. Click on any brand name
5. Should open calendar page (or create one if it doesn't exist)

## Need Help?

If you still get errors after migration:
1. Check backend console logs
2. Check browser console (F12)
3. Verify DATABASE_URL is correct
4. Make sure PostgreSQL is running
