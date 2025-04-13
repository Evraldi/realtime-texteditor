import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DocumentList from './components/Document/DocumentList';
import EditorPage from './pages/EditorPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ForgotPassword from './components/Auth/ForgotPassword';
import ResetPassword from './components/Auth/ResetPassword';
import PrivateRoute from './components/Auth/PrivateRoute';
import { SocketProvider } from './components/SocketProvider';
import Header from './components/Layout/Header';

/**
 * Main App component
 * @returns {JSX.Element} App component
 */
function App() {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <main className="main-content">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/" element={<Login />} />

            {/* Protected routes */}
            <Route
              path="/documents"
              element={
                <PrivateRoute>
                  <SocketProvider>
                    <DocumentList />
                  </SocketProvider>
                </PrivateRoute>
              }
            />
            <Route
              path="/editor/:docId"
              element={
                <PrivateRoute>
                  <SocketProvider>
                    <EditorPage />
                  </SocketProvider>
                </PrivateRoute>
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
