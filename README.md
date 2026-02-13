# AdAlchemist

🧪 AdAlchemist
AI-Powered AdTech Content Generation & Optimization Platform
AdAlchemist is a full-stack AI-driven AdTech platform that enables users to generate, optimize, and manage high-performing marketing creatives using Generative AI. It helps marketers, startups, and businesses create compelling ad copy and structured campaign assets efficiently.

🚀 Live Demo
🔗 https://ad-alchemist.vercel.app
📌 Project Overview

AdAlchemist leverages AI to:
Generate high-converting ad copies
Create campaign-specific content variations
Manage projects & creatives
Track user credits
Provide scalable backend infrastructure

This platform is built with a production-ready architecture using modern web technologies and cloud deployment.

🏗️ Tech Stack:

💻 Frontend
React.js (Vite)
TypeScript
Tailwind CSS
Framer Motion
Axios
Clerk Authentication

⚙️ Backend
Node.js
Express.js
TypeScript
Prisma ORM
PostgreSQL (Neon DB)
OpenAI API (for AI content generation)
Sentry (Error Monitoring)

☁️ Deployment
Frontend → Vercel
Backend → Render
Database → Neon PostgreSQL

🎯 Features
🔐 Authentication & Authorization
Secure authentication using Clerk
Protected API routes
User-specific project isolation

🧠 AI Ad Generation
Generate ad copy using OpenAI
Multiple tone variations
Structured output format
Token/credit-based generation system

📁 Project Management
Create, edit, delete projects
Fetch project by ID
Store generated ads inside projects

💳 Credit System
Each user has AI credits
Deduct credits per generation
Prevent overuse

📊 Error Monitoring
Integrated Sentry for backend error tracking
🌍 Production-Ready CORS Handling
Secure cross-origin configuration
Environment-based configuration


📂 Folder Structure
AdAlchemist/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.tsx
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── configs/
│   │   ├── services/
│   │   └── server.ts
│   └── prisma/
│       └── schema.prisma
│
└── README.md
🗄️ Database Schema (Prisma)
model User {
  id        String   @id @default(cuid())
  clerkId   String   @unique
  email     String
  credits   Int      @default(10)
  projects  Project[]
  createdAt DateTime @default(now())
}

model Project {
  id        String   @id @default(cuid())
  name      String
  userId    String
  ads       Ad[]
  createdAt DateTime @default(now())
}

model Ad {
  id        String   @id @default(cuid())
  content   String
  projectId String
  createdAt DateTime @default(now())
}

⚙️ Environment Variables

🔹 Backend (.env)
PORT=3000
DATABASE_URL=your_neon_database_url
CLERK_SECRET_KEY=your_clerk_secret
OPENAI_API_KEY=your_openai_key
SENTRY_DSN=your_sentry_dsn
CLIENT_URL=http://localhost:5173

🔹 Frontend (.env)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_API_URL=http://localhost:5000

🛠️ Installation & Setup
1️⃣ Clone Repository
git clone https://github.com/yourusername/AdAlchemist.git
cd AdAlchemist

2️⃣ Backend Setup
cd backend
npm install
Run Prisma migrations:
npx prisma migrate dev
Start backend:
npm run dev
Backend runs on:
http://localhost:5000

3️⃣ Frontend Setup
cd frontend
npm install
npm run dev
Frontend runs on:
http://localhost:5173


🔌 API Endpoints
👤 User
GET /api/user/credits → Get user credits
📁 Projects
POST /api/project/create
GET /api/project/:projectId
DELETE /api/project/:projectId

🧠 AI Generation
POST /api/ad/generate
Deducts credits
Returns generated ad copy
🔄 Request Flow
User logs in via Clerk
Clerk token sent to backend
Backend verifies user
User creates project
User generates ad
Backend:
Checks credits
Calls OpenAI
Saves response
Deducts credits
Response returned to frontend

🛡️ Security Measures
JWT-based authentication (Clerk)
CORS restricted to frontend domain
Input validation
Credit limitation system
Environment variable protection
📈 Future Enhancements
💳 Stripe payment integration for buying credits
📊 Analytics dashboard (CTR prediction)
📢 Multi-platform ad formatting (Google, Meta, LinkedIn)
🧠 Fine-tuned AI model
🗂️ Campaign performance tracking
📱 Mobile responsiveness optimization

🧪 Testing Strategy
Backend API testing via Postman
Manual integration testing
Error tracking via Sentry

🚀 Deployment Guide
Backend → Render
Push backend to GitHub
Connect to Render
Add environment variables
Deploy
Frontend → Vercel
Push frontend to GitHub
Import project in Vercel
Add environment variables
Deploy

📊 Performance Optimizations
Lazy loading components
Environment-based configs
Optimized Prisma queries
Centralized error handling
API response structuring


👨‍💻 Author
Manoj Kalasgonda
Full Stack Developer | AI Enthusiast | AdAlchemist Builder

📜 License
No license..Enjoy.

🌟 Why AdAlchemist?
AdAlchemist transforms raw product ideas into persuasive, high-performing marketing creatives using AI — making ad generation scalable, fast, and data-driven.
