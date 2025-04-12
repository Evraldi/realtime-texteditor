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
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
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
