
noteId: "22d85380684511f0abb4e977611d99b1"
tags: []

# 💧 Tuko Maji - Community Water Issue Reporting Platform

Tuko Maji is a community-driven platform that empowers citizens to report water-related issues, enables verifiers to validate them, and equips technicians with tools to resolve them.

## 🚀 Live Deployments

- **Frontend**: [https://tukomaji.onrender.com](https://tukomaji-app.onrender.com)  
- **Backend API**: [https://tukomaji-backend.onrender.com/api](https://tukomaji-backend.onrender.com)

## 🎤 Project Pitch

📽️ Watch the official presentation on Gamma:  
[https://gamma.app/docs/TukoMaji-avfv95o1s9ymc2m](https://gamma.app/docs/TukoMaji-avfv95o1s9ymc2m)

## 📁 Project Structure

---
```
week-8-capstone_-Denis-Mwanzia/
├── client/          # React + Vite frontend
├── server/          # Express.js backend
└── README.md
```
---

## 🧰 Setup for Local Development

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

### Installation

---
```bash
# Clone the repository
git clone https://github.com/PLP-MERN-Stack-Development/week-8-capstone_-Denis-Mwanzia.git
cd week-8-capstone_-Denis-Mwanzia

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```
---

## ⚙️ Environment Variables

To run this app locally, you need to configure environment variables.

### Setup

1. Copy `.env.example` into `.env` in both `server/` and `client/` folders.
2. Fill in your actual values.

### Sample for Server (`server/.env.example`)

---
```env
PORT=5000
MONGO_URI=your_mongo_connection_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```
---

### Sample for Client (`client/.env.example`)

---
```env
VITE_API_URL=http://localhost:5000/api
```
---

### Production

- Use `.env.production` for deployed frontend:
---
```env
  VITE_API_URL=https://tukomaji-backend.onrender.com/api
```
---

## 🧪 Running the App

### Start Backend

---
```bash
cd server
npm run dev
```
---

### Start Frontend

---
```bash
cd client
npm run dev
```
---

Then visit: [http://localhost:8080](http://localhost:8080)

## 👥 User Roles

- 👤 **Citizen** – Report water issues
- ✅ **Verifier** – Validate reports
- 🛠 **Technician** – Fix verified issues
- 🧑‍💼 **Admin** – Manage platform data

## ⚙️ Tech Stack

**Frontend**:
- React + Vite
- Tailwind CSS & Shadcn UI
- Zustand, React Hook Form, Axios

**Backend**:
- Express.js + Node.js
- MongoDB + Mongoose
- JWT Auth
- Multer (file uploads)

## 📡 API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Reports
- `GET /api/reports`
- `POST /api/reports`
- `PATCH /api/reports/:id`
- `DELETE /api/reports/:id`

### Users
- `GET /api/users`
- `PATCH /api/users/:id/role`

## ✅ Testing

### Backend

---
```bash
cd server
npm test
```
---

### Frontend

---
```bash
cd client
npm test
```
---

## 🤝 Contribution Guide

1. Fork this repository.
2. Create a new branch:
---
```bash
   git checkout -b feature/your-feature
```
---
3. Commit and push your changes.
4. Open a pull request.

## 📝 License

MIT © 2025 Denis Mwanzia  
Built with ❤️ for the Power Learn Project Capstone