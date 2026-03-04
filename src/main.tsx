import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

console.log('Pizarra: Iniciando main.tsx');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Pizarra: No se encontró el elemento root');
} else {
  console.log('Pizarra: Elemento root encontrado, renderizando...');
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
