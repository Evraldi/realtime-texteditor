import React from 'react';
import ReactDOM from 'react-dom';
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
import './styles/history.css';
import './styles/format-toolbar.css';
import './styles/comments.css';
import './styles/select-dark.css';
import './components/Editor/TextEditor.css';

ReactDOM.render(
  <Provider store={store}>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Provider>,
  document.getElementById('root')
);
