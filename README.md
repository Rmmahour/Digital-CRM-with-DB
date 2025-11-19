# Abacus CRM - Social Media Management Platform

A full-stack Social Media CRM application built with React, Node.js, Express, PostgreSQL, and Prisma ORM. Features role-based access control, task management, real-time notifications, file uploads, and comprehensive activity logging.

## Features

- **JWT Authentication** with role-based access control
- **7 User Roles**: Super Admin, Admin, Account Manager, Writer, Designer, Post Scheduler, Client Viewer
- **Task Management** with status tracking, priorities, assignments, and filtering
- **Brand Management** for multiple client brands
- **File Uploads** with local and cloud storage support (Cloudinary)
- **Real-time Notifications** via Socket.io
- **Activity Logging** for complete audit trails
- **Comments System** for task collaboration
- **Approvals Workflow** for content review
- **User Profile Management** with password change
- **Settings Dashboard** for system administrators
- **Responsive Design** with Tailwind CSS

## User Roles

1. **Super Admin** - Full system access, user management, system settings
2. **Admin** - Manage brands, tasks, approvals, and team members
3. **Account Manager** - Manage client accounts and coordinate tasks
4. **Writer** - Create and manage content tasks
5. **Designer** - Create and manage design tasks
6. **Post Scheduler** - Schedule and publish social media posts
7. **Client Viewer** - View-only access to content and performance

## Tech Stack

### Backend
- Node.js + Express.js
- PostgreSQL with Prisma ORM
- JWT for authentication
- Socket.io for real-time features
- Multer for file uploads
- Cloudinary for cloud storage
- bcryptjs for password hashing

### Frontend
- React 18 with Vite
- React Router for navigation
- Axios for API calls
- Socket.io-client for real-time updates
- Tailwind CSS for styling
- Lucide React for icons
- date-fns for date formatting

## Project Structure

\`\`\`
abacus-crm/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   ├── src/
│   │   ├── config/
│   │   │   └── prisma.js
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── brand.controller.js
│   │   │   ├── task.controller.js
│   │   │   └── notification.controller.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   └── error.middleware.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── brand.routes.js
│   │   │   ├── task.routes.js
│   │   │   └── notification.routes.js
│   │   └── server.js
│   ├── .env.example
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── TaskList.jsx
│   │   │   ├── CreateTaskModal.jsx
│   │   │   ├── EditTaskModal.jsx
│   │   │   └── NotificationsPanel.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── layouts/
│   │   │   └── DashboardLayout.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   ├── ResetPassword.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   ├── TaskDetailPage.jsx
│   │   │   ├── UsersPage.jsx
│   │   │   ├── BrandsPage.jsx
│   │   │   └── dashboards/
│   │   │       ├── SuperAdminDashboard.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── AccountManagerDashboard.jsx
│   │   │       ├── WriterDashboard.jsx
│   │   │       ├── DesignerDashboard.jsx
│   │   │       ├── PostSchedulerDashboard.jsx
│   │   │       └── ClientViewerDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   └── README.md
└── README.md
\`\`\`

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
\`\`\`bash
cd backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and configure your database connection:
\`\`\`env
DATABASE_URL="postgresql://user:password@localhost:5432/abacus_crm"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
UPLOAD_STORAGE="local"
MAX_FILE_SIZE=10485760
\`\`\`

4. Generate Prisma Client:
\`\`\`bash
npm run prisma:generate
\`\`\`

5. Run database migrations:
\`\`\`bash
npm run prisma:migrate
\`\`\`

6. Seed the database with sample data:
\`\`\`bash
npm run prisma:seed
\`\`\`

7. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
\`\`\`bash
cd frontend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Set up environment variables:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` if needed:
\`\`\`env
VITE_API_URL=http://localhost:5000/api
\`\`\`

4. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The frontend will start on `http://localhost:5173`

## Test Accounts

After seeding the database, you can login with these accounts:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@abacus.com | password123 |
| Admin | admin@abacus.com | password123 |
| Account Manager | manager@abacus.com | password123 |
| Writer | writer@abacus.com | password123 |
| Designer | designer@abacus.com | password123 |
| Post Scheduler | scheduler@abacus.com | password123 |
| Client Viewer | client@abacus.com | password123 |

## Role Permissions

### Super Admin
- Full system access
- User management (create, edit, delete)
- Role assignment
- System settings
- View activity logs
- All brand and task permissions

### Admin
- Brand management
- Task management
- User viewing
- Approvals workflow
- Activity logs

### Account Manager
- Manage assigned brands
- Create and assign tasks
- View team performance
- Client communication

### Writer
- View assigned tasks
- Upload text content and files
- Add comments
- Update task status

### Designer
- View assigned tasks
- Upload design files (images, videos, links)
- Add comments
- Update task status

### Post Scheduler
- View approved content
- Schedule posts
- Update posting status

### Client Viewer
- View brand performance
- Read-only access to tasks
- View reports

## API Documentation

### Authentication Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### User Endpoints

- `GET /api/users` - Get all users (Admin+)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Super Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Super Admin only)

### Brand Endpoints

- `GET /api/brands` - Get all brands
- `GET /api/brands/:id` - Get brand by ID
- `POST /api/brands` - Create brand (Admin+)
- `PUT /api/brands/:id` - Update brand (Admin+)
- `DELETE /api/brands/:id` - Delete brand (Admin+)
- `POST /api/brands/:id/users` - Assign user to brand
- `DELETE /api/brands/:id/users/:userId` - Remove user from brand

### Task Endpoints

- `GET /api/tasks` - Get all tasks (filtered by role)
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:taskId/comments` - Add comment to task
- `GET /api/tasks/:taskId/comments` - Get task comments
- `POST /api/tasks/:taskId/attachments` - Upload attachment
- `GET /api/tasks/:taskId/attachments` - Get attachments
- `DELETE /api/tasks/attachments/:attachmentId` - Delete attachment

### Notification Endpoints

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

### Activity Log Endpoints

- `GET /api/activity` - Get activity logs (Admin only)

## Real-Time Features

The application uses Socket.io for real-time updates:

- **Live Notifications**: Instant notifications for task assignments and updates
- **Real-Time Comments**: See new comments as they're posted
- **File Upload Notifications**: Get notified when files are uploaded to tasks
- **Activity Updates**: Live updates on task status changes

## File Upload Configuration

### Local Storage (Default)
Files are stored in `backend/uploads/` directory.

### Cloud Storage (Cloudinary)
Add to `.env`:
\`\`\`env
UPLOAD_STORAGE="cloud"
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
\`\`\`

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed production deployment instructions including:
- VPS deployment (DigitalOcean, AWS EC2, Linode)
- Platform as a Service (Heroku, Railway, Render)
- Database setup (Neon, Supabase, Railway)
- SSL configuration with Let's Encrypt
- PM2 process management
- Nginx reverse proxy setup
- Backup strategies
- Scaling considerations

## Development

### Running Prisma Studio

To view and edit your database with a GUI:
\`\`\`bash
cd backend
npm run prisma:studio
\`\`\`

### Database Management

\`\`\`bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
\`\`\`

### Building for Production

Backend:
\`\`\`bash
cd backend
npm start
\`\`\`

Frontend:
\`\`\`bash
cd frontend
npm run build
npm run preview
\`\`\`

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists

### Port Already in Use
\`\`\`bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
\`\`\`

### File Upload Issues
- Check uploads directory permissions: `chmod 755 uploads/`
- Verify MAX_FILE_SIZE setting
- Check Cloudinary credentials if using cloud storage

## Completed Features

- ✅ JWT Authentication with role-based access
- ✅ 7 distinct user roles with custom dashboards
- ✅ Task management with CRUD operations
- ✅ Brand management
- ✅ Real-time notifications via Socket.io
- ✅ Comments system
- ✅ File uploads (local and cloud)
- ✅ Activity logging for audit trails
- ✅ User profile management
- ✅ Password change functionality
- ✅ Approvals workflow
- ✅ Settings dashboard
- ✅ Responsive design

## Future Enhancements

- Email notifications
- Calendar integration
- Social media platform integrations
- Advanced analytics and reporting
- Team chat functionality
- Mobile app
- Content scheduling automation
- AI-powered content suggestions

## License

MIT

## Support

For issues and questions, please open an issue on the repository.
# CRM96
# CRM96
# CRM-with-Change-in-permissions-and-Task-Details-Page
# Digital-CRM-with-DB
