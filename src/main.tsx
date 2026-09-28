import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/common/ErrorBoundary.tsx';
import './index.css';
import {capturePendingInvite} from './services/inviteService';

// Remember ?invite=CODE so it survives Google sign-in
capturePendingInvite();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
