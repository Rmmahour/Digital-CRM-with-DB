# Abacus CRM - Frontend

React-based frontend for the Social Media CRM application.

## Features

- JWT Authentication
- Role-based Dashboards
- Real-time Notifications
- Task Management
- Brand Management
- Responsive Design with TailwindCSS

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` if your backend is running on a different URL:
\`\`\`
VITE_API_URL=http://localhost:5000/api
\`\`\`

## Running the App

Development mode:
\`\`\`bash
npm run dev
\`\`\`

The app will start on `http://localhost:5173`

Build for production:
\`\`\`bash
npm run build
\`\`\`

Preview production build:
\`\`\`bash
npm run preview
\`\`\`

## Test Accounts

- **Super Admin**: superadmin@abacus.com / admin123
- **Admin**: admin@abacus.com / admin123
- **Account Manager**: manager@abacus.com / admin123
- **Writer**: writer@abacus.com / admin123
- **Designer**: designer@abacus.com / admin123

## Project Structure

\`\`\`
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── layouts/         # Layout components
│   ├── pages/           # Page components
│   │   └── dashboards/  # Role-specific dashboards
│   ├── services/        # API services
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── index.html
├── vite.config.js
└── package.json
\`\`\`

## User Roles

1. **SUPER_ADMIN** - Full system access
2. **ADMIN** - Manage brands, tasks, users
3. **ACCOUNT_MANAGER** - Manage client accounts
4. **WRITER** - Create content
5. **DESIGNER** - Create designs
6. **POST_SCHEDULER** - Schedule posts
7. **CLIENT_VIEWER** - View-only access
