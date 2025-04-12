import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DocumentList from './components/Document/DocumentList';
import EditorPage from './pages/EditorPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PrivateRoute from './components/Layout/PrivateRoute';
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
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
            <Route path="/" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
