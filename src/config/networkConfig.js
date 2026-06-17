/**
 * Configuração da URL do servidor de jogo (Socket.io).
 *
 * Em desenvolvimento (rodando local via `node server/index.js`), usamos
 * http://localhost:3000.
 *
 * Em produção (ex: front-end publicado no GitHub Pages), o servidor Node.js
 * precisa estar hospedado em algum lugar que rode Node 24h (Render, Railway,
 * Fly.io, etc.). Coloque a URL pública desse servidor em PROD_SERVER_URL.
 *
 */

const PROD_SERVER_URL = 'https://neon-battlegrounds.onrender.com/';

// Detecta se estamos rodando localmente
const isLocalhost =
    typeof window !== 'undefined' &&
    /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$/.test(window.location.hostname);

export const SERVER_URL = isLocalhost
    ? 'http://localhost:3000'
    : PROD_SERVER_URL;
