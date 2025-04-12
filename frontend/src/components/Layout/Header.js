import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Header component with navigation and user menu
 * @returns {JSX.Element} Header component
 */
const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Handle logout button click
   */
  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/login');
  };

  /**
   * Toggle mobile menu
   */
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  /**
   * Toggle user dropdown menu
   */
  const toggleUserMenu = () => {
    setUserMenuOpen(!userMenuOpen);
  };

  /**
   * Get user initials for avatar
   * @returns {string} User initials
   */
  const getUserInitials = () => {
    if (user && user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <h1>Real-Time Editor</h1>
        </Link>

        <button className="header-mobile-toggle" onClick={toggleMenu} aria-label="Toggle menu">
          <span>☰</span>
        </button>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`}>
          {isAuthenticated && (
            <>
              <NavLink to="/documents" className="header-nav-link" onClick={() => setMenuOpen(false)}>
                Documents
              </NavLink>
            </>
          )}

          <div className="header-auth">
            {isAuthenticated ? (
              <div className="header-user">
                <div className="header-user-avatar" onClick={toggleUserMenu}>
                  {getUserInitials()}
                </div>
                {userMenuOpen && (
                  <div className="header-dropdown">
                    <span className="header-dropdown-item header-user-name">
                      {user?.email || 'User'}
                    </span>
                    <div className="header-dropdown-divider"></div>
                    <Link to="/documents" className="header-dropdown-item" onClick={() => setUserMenuOpen(false)}>
                      My Documents
                    </Link>
                    <div className="header-dropdown-divider"></div>
                    <button className="header-dropdown-item" onClick={handleLogout}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="header-auth-link" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="header-auth-button" onClick={() => setMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};

export default Header;
