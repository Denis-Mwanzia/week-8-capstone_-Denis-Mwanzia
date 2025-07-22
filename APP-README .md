
# Tuko Maji - Water Reporting System

A community-driven water issue reporting and tracking system for Kenya.

## Project Structure

---
```
tuko-maj/
├── client/          # React frontend
├── server/          # Express.js backend
└── README.md
```
---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
---
```bash
git clone <repository-url>
cd tuko-maji
```
---

2. Install dependencies for both client and server

**Client:**
---
```bash
cd client
npm install
```
---

**Server:**
---
```bash
cd server
npm install
```
---

### Environment Setup

1. Create `.env` file in the server directory:
---
```bash
cd server
cp .env.example .env
```
---

2. Update the `.env` file with your MongoDB connection string:
---
```env
MONGODB_URI=mongodb://localhost:27017/tukomaji
JWT_SECRET=your-secret-key-here
PORT=5000
```
---

### Running the Application

1. Start the backend server:
---
```bash
cd server
npm run dev
```
---

2. Start the frontend development server:
---
```bash
cd client
npm run dev
```
---

The client will be available at `http://localhost:8080` and the server at `http://localhost:5000`.

## Features

- **User Authentication**: Register, login, and role-based access
- **Report Management**: Create, view, and track water-related issues
- **Interactive Map**: Visualize reports on an interactive map
- **Role-based Dashboards**: Different views for citizens, technicians, and admins
- **Verification System**: Multi-level verification process for reports

## User Roles

- **Citizen**: Report water issues and view community reports
- **Verifier**: Verify submitted reports for accuracy
- **Technician**: Assigned to resolve verified issues
- **Admin**: Manage users, reports, and system settings

## Testing

### Client Tests
---
```bash
cd client
npm test              # Run tests
npm run test:ui       # Run tests with UI
npm run test:coverage # Run tests with coverage
```
---

### Server Tests
---
```bash
cd server
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```
---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Reports
- `GET /api/reports` - Get all reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/stats` - Get user statistics
- `PATCH /api/users/:id/role` - Update user role (admin only)

## Technologies Used

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Shadcn/ui Components
- React Hook Form
- Zustand (State Management)
- Vite (Build Tool)

### Backend
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs for password hashing
- CORS for cross-origin requests

### Testing
- **Frontend**: Vitest, React Testing Library
- **Backend**: Jest, Supertest

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
