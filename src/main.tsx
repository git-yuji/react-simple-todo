import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './style.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('画面を表示するroot要素が見つかりません。');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
