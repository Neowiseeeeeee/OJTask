@echo off
cd /d "%~dp0"
set DATABASE_URL=mongodb+srv://ojadmin:ojadmin@cluster0.haavtu6.mongodb.net/ojtask
npx tsx server/index.ts
pause

