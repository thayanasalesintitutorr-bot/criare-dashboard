// Service worker mínimo — existe só pra habilitar o "Instalar app" no
// Android/Chrome. Não guarda nada em cache (o painel sempre precisa de
// dados ao vivo), só repassa toda requisição direto pra rede.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', () => {
  // Intencionalmente vazio: sem estratégia de cache.
})
