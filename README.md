# 🎓 StudySathi — ICSE Class 8 Narayana Academic Platform

> A specialized academic tuition and learning management platform tailored for **ICSE Class 8 (Narayana Board / Techno Curriculum)**.

---

## 🌟 Key Features

- **📚 ICSE Class 8 Narayana Curriculum**: Mathematics, Science (Physics, Chemistry, Biology), English Literature & Grammar, and Social Sciences.
- **📅 Interactive Streak & Attendance Calendar**: Visual monthly streak tracker, active study logs, and daily targets.
- **✅ Student Todo & Task Management**: Full CRUD operations for custom student study tasks, priorities, and deadlines.
- **📝 Live Chapter Notes & Formula Sheets**: Formatted with KaTeX math rendering for ICSE formulas and scientific theorems.
- **🧪 Interactive Practice Quizzes**: Chapter-wise timed assessments with instant scoring and detailed feedback.
- **💬 Doubt Clearing Portal**: Students can ask academic queries; tutor **Sourav Kumar** reviews and provides clear explanations.
- **👨‍🏫 Dedicated Tutor Dashboard**: Manage chapters, notes, homework assignments, student doubts, and AI question generation.

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Tutor (Admin)** | tutor@studysathi.com | admin123 | **Sourav Kumar** (Senior ICSE Faculty) |
| **Student** | student@studysathi.com | student123 | **Aarav Sharma** (Class 8 Narayana Student) |

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
`ash
git clone https://github.com/sourav20975-oss/Study-With-Me.git
cd Study-With-Me
`

### 2. Install dependencies
`ash
# Install root, backend, and frontend dependencies
npm run render-build
`

### 3. Run development servers
`ash
# Run both client and server concurrently
npm run dev
`
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

---

## ☁️ Deploy to Render (Render.com)

This repository is pre-configured with a **unified single-service deployment** for Render:
The Node.js Express backend serves both the REST API and the compiled React SPA static bundle on the same port, completely eliminating CORS issues.

### Step 1: Push code to GitHub
Push this codebase to your GitHub repository under https://github.com/sourav20975-oss/:
`ash
git remote add origin https://github.com/sourav20975-oss/Study-With-Me.git
git branch -M main
git push -u origin main
`

### Step 2: Create Web Service on Render
1. Log in to [dashboard.render.com](https://dashboard.render.com).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository Study-With-Me.
4. Configure the settings:
   - **Name**: studysathi (or your choice)
   - **Runtime**: Node
   - **Build Command**: 
pm run render-build
   - **Start Command**: 
pm start
   - **Instance Type**: Free
5. Under **Environment Variables**, add:
   - NODE_ENV: production
   - JWT_SECRET: studysathi_super_secret_production_key_2026
   - *(Optional)* GEMINI_API_KEY: *(Your Google AI Gemini key for AI question generation)*
6. Click **Create Web Service**.

Render will automatically install dependencies, build the Vite React frontend, and boot the server. Your app will be live at https://studysathi.onrender.com!

---

## 🛡️ Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS, Lucide Icons, KaTeX Math
- **Backend**: Node.js, Express, File-based JSON Database with Atomic Writes
- **Deployment**: Render Web Service, Git, GitHub

