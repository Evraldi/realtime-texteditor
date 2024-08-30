import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => (
  <header>
    <h1>Real-Time Text Editor</h1>
    <nav>
      <Link to="/documents">Documents</Link>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
    </nav>
  </header>
);

export default Header;
