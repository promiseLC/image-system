import { createRoot } from 'react-dom/client';
import './index.css';
import './styles/view-transitions.css';
import App from './App.tsx';

// react-activation 与 StrictMode/createRoot 不兼容，需移除 StrictMode
createRoot(document.getElementById('root')!).render(<App />);
