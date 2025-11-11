@echo off
echo Running Prisma migration...
cd backend

REM Generate and run migration  
npx prisma migrate dev --name add_avatar_mobile_website

echo Migration completed!
echo Now run: npm run dev
pause
