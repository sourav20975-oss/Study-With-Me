import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Layouts
import { StudentLayout } from './components/layout/StudentLayout.jsx';
import { AdminLayout } from './components/layout/AdminLayout.jsx';

// Public Pages
import { Login } from './pages/auth/Login.jsx';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard.jsx';
import { SubjectsBrowser } from './pages/student/SubjectsBrowser.jsx';
import { NotesReader } from './pages/student/NotesReader.jsx';
import { QuizzesList } from './pages/student/QuizzesList.jsx';
import { QuizTaking } from './pages/student/QuizTaking.jsx';
import { QuizResult } from './pages/student/QuizResult.jsx';
import { DoubtsView } from './pages/student/DoubtsView.jsx';
import { HomeworkView } from './pages/student/HomeworkView.jsx';
import { RevisionNotebook } from './pages/student/RevisionNotebook.jsx';
import { ProgressView } from './pages/student/ProgressView.jsx';
import { NewsView } from './pages/student/NewsView.jsx';
import { NotificationsView } from './pages/student/NotificationsView.jsx';
import { MoreMenu } from './pages/student/MoreMenu.jsx';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard.jsx';
import { AdminSubjects } from './pages/admin/AdminSubjects.jsx';
import { AdminNotes } from './pages/admin/AdminNotes.jsx';
import { AdminQuestionBank } from './pages/admin/AdminQuestionBank.jsx';
import { AdminAIGenerator } from './pages/admin/AdminAIGenerator.jsx';
import { AdminQuizzes } from './pages/admin/AdminQuizzes.jsx';
import { AdminAssignments } from './pages/admin/AdminAssignments.jsx';
import { AdminDoubts } from './pages/admin/AdminDoubts.jsx';
import { AdminSettings } from './pages/admin/AdminSettings.jsx';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center text-text-muted">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/app'} replace />;
  }

  return children;
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/app" replace />} />

          {/* Student Area */}
          <Route
            path="/app"
            element={
              <ProtectedRoute requiredRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<StudentDashboard />} />
            <Route path="subjects" element={<SubjectsBrowser />} />
            <Route path="subjects/:subjectId" element={<SubjectsBrowser />} />
            <Route path="notes/:id" element={<NotesReader />} />
            <Route path="quizzes" element={<QuizzesList />} />
            <Route path="quizzes/:id" element={<QuizTaking />} />
            <Route path="quiz-attempts/:id/result" element={<QuizResult />} />
            <Route path="homework" element={<HomeworkView />} />
            <Route path="homework/:id" element={<HomeworkView />} />
            <Route path="doubts" element={<DoubtsView />} />
            <Route path="doubts/:id" element={<DoubtsView />} />
            <Route path="revision" element={<RevisionNotebook />} />
            <Route path="bookmarks" element={<RevisionNotebook />} />
            <Route path="progress" element={<ProgressView />} />
            <Route path="news" element={<NewsView />} />
            <Route path="notifications" element={<NotificationsView />} />
            <Route path="more" element={<MoreMenu />} />
          </Route>

          {/* Admin Area */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="subjects" element={<AdminSubjects />} />
            <Route path="notes" element={<AdminNotes />} />
            <Route path="questions" element={<AdminQuestionBank />} />
            <Route path="ai-question-generator" element={<AdminAIGenerator />} />
            <Route path="quizzes" element={<AdminQuizzes />} />
            <Route path="assignments" element={<AdminAssignments />} />
            <Route path="doubts" element={<AdminDoubts />} />
            <Route path="news" element={<NewsView />} />
            <Route path="analytics" element={<AdminDashboard />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
