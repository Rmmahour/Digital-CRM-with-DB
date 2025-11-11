export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Abacus CRM</h1>
          <p className="text-xl text-gray-600">Social Media Management Platform</p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8 rounded-r-lg">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Important: Separate Backend & Frontend Setup Required
          </h2>
          <p className="text-blue-800">
            This is a full-stack application with separate backend (Node.js/Express) and frontend (React/Vite) that need
            to be run independently.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Start</h2>

            <div className="space-y-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    1
                  </span>
                  Backend Setup
                </h3>
                <div className="ml-10 space-y-2">
                  <p className="text-gray-700 mb-3">Navigate to backend directory and install dependencies:</p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    {`cd backend
npm install
cp .env.example .env`}
                  </pre>
                  <p className="text-gray-700 mt-3 mb-2">
                    Configure your PostgreSQL database in <code className="bg-gray-200 px-2 py-1 rounded">.env</code>:
                  </p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    {`DATABASE_URL="postgresql://user:password@localhost:5432/abacus_crm"`}
                  </pre>
                  <p className="text-gray-700 mt-3 mb-2">Run migrations and seed data:</p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    {`npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev`}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    Backend will run on <strong>http://localhost:5000</strong>
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    2
                  </span>
                  Frontend Setup
                </h3>
                <div className="ml-10 space-y-2">
                  <p className="text-gray-700 mb-3">In a new terminal, navigate to frontend directory:</p>
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
                    {`cd frontend
npm install
npm run dev`}
                  </pre>
                  <p className="text-sm text-gray-600 mt-2">
                    Frontend will run on <strong>http://localhost:5173</strong>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Accounts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <p className="font-semibold text-purple-900">Super Admin</p>
                <p className="text-sm text-purple-700">superadmin@abacus.com / admin123</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <p className="font-semibold text-blue-900">Admin</p>
                <p className="text-sm text-blue-700">admin@abacus.com / admin123</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <p className="font-semibold text-green-900">Account Manager</p>
                <p className="text-sm text-green-700">manager@abacus.com / admin123</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-lg">
                <p className="font-semibold text-orange-900">Writer</p>
                <p className="text-sm text-orange-700">writer@abacus.com / admin123</p>
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">JWT Authentication</p>
                  <p className="text-sm text-gray-600">Secure login with password reset</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">7 User Roles</p>
                  <p className="text-sm text-gray-600">Role-based access control</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Task Management</p>
                  <p className="text-sm text-gray-600">Create, assign, and track tasks</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Real-Time Updates</p>
                  <p className="text-sm text-gray-600">Live notifications and comments</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">Brand Management</p>
                  <p className="text-sm text-gray-600">Organize by client brands</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-blue-500 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-gray-900">PostgreSQL + Prisma</p>
                  <p className="text-sm text-gray-600">Robust database with ORM</p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t pt-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Tech Stack</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">Backend</p>
                <p className="text-sm text-gray-600">Node.js + Express</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">Frontend</p>
                <p className="text-sm text-gray-600">React + Vite</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">Database</p>
                <p className="text-sm text-gray-600">PostgreSQL</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">Real-Time</p>
                <p className="text-sm text-gray-600">Socket.io</p>
              </div>
            </div>
          </section>

          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Prerequisites</h3>
            <ul className="list-disc list-inside text-yellow-800 space-y-1">
              <li>Node.js 18 or higher</li>
              <li>PostgreSQL 14 or higher</li>
              <li>npm or yarn</li>
            </ul>
          </div>

          <div className="text-center pt-4">
            <p className="text-gray-600">
              For detailed documentation, see <code className="bg-gray-200 px-2 py-1 rounded">README.md</code> in the
              root directory
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
