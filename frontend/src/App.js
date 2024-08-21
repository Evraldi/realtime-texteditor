import React from 'react';
import Editor from './components/Editor';
import Navbar from './components/Navbar';
import './styles/App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <Editor />
    </div>
  );
}

export default App;
