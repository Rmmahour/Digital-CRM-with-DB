# Frontend Setup Instructions

## Prerequisites
- Node.js 18+ installed
- Backend server running on http://localhost:5000

## Installation Steps

### 1. Install Dependencies
\`\`\`bash
cd frontend
npm install
\`\`\`

### 2. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

The frontend will start on http://localhost:5173

## Troubleshooting

### If you see PostCSS or Tailwind errors:
1. Delete `node_modules` folder
2. Delete `package-lock.json`
3. Run `npm install` again
4. Run `npm run dev`

### If the backend connection fails:
- Make sure the backend is running on port 5000
- Check that `frontend/src/services/api.js` has the correct API URL

## Test Accounts
Use these credentials to test different roles:

- **Super Admin**: superadmin@abacus.com / password123
- **Admin**: admin@abacus.com / password123
- **Account Manager**: manager@abacus.com / password123
- **Writer**: writer@abacus.com / password123
- **Designer**: designer@abacus.com / password123
- **Post Scheduler**: scheduler@abacus.com / password123
- **Client Viewer**: client@abacus.com / password123

## Building for Production
\`\`\`bash
npm run build
\`\`\`

The production build will be in the `dist` folder.
