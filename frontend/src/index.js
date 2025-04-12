import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { store } from './store';

// Import global styles
import './styles/global.css';
import './styles/variables.css';
import './styles/components.css';
import './styles/auth.css';
import './styles/document.css';
import './styles/editor.css';
import './styles/header.css';
import './styles/modal.css';
import './styles/userlist.css';
import './styles/format-toolbar.css';
// comments.css has been replaced with modular CSS files in the Comments component
import './styles/select-dark.css';
import './components/Editor/TextEditor.css';

// Make store available globally for debugging and axios interceptor
window.reduxStore = store;

// Use createRoot API for React 18
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Provider>
  </React.StrictMode>
);
