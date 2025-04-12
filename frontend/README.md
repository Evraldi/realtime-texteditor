# Real-Time Text Editor Frontend

This is the frontend application for the Real-Time Text Editor.

## Features

- Real-time collaborative text editing
- User authentication
- Document management
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

5. Update the `.env` file with your configuration

### Running the Application

Development mode:

```bash
npm start
# or
yarn start
```

Build for production:

```bash
npm run build
# or
yarn build
```

## Project Structure

```
frontend/
├── public/          # Static files
├── src/
│   ├── components/  # React components
│   │   ├── Auth/    # Authentication components
│   │   ├── Document/ # Document components
│   │   ├── Layout/  # Layout components
│   │   └── UI/      # UI components
│   ├── context/     # React context providers
│   ├── pages/       # Page components
│   ├── services/    # API services
│   ├── styles/      # CSS styles
│   ├── utils/       # Utility functions
│   ├── App.js       # Main App component
│   └── index.js     # Entry point
├── .env             # Environment variables
├── .env.example     # Example environment file
└── package.json     # Dependencies
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| REACT_APP_BACKEND_URL | Backend API URL | http://localhost:5000 |
| REACT_APP_ENV | Environment (development/production) | development |
| REACT_APP_DEBUG | Enable debug mode | true |

## Available Scripts

- `npm start`: Run the app in development mode
- `npm test`: Run tests
- `npm run build`: Build the app for production
- `npm run eject`: Eject from Create React App

## Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

For more information about Create React App, check out the [documentation](https://facebook.github.io/create-react-app/docs/getting-started).
