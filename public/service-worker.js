// public/service-worker.js

self.addEventListener("install", (event) => {
    console.log("Service Worker instalado");
    // Você pode fazer pré-cache de arquivos aqui, se quiser
  });
  
  self.addEventListener("activate", (event) => {
    console.log("Service Worker ativado");
  });
  
  self.addEventListener("fetch", (event) => {
    // Isso intercepta todas as requisições, você pode usar cache aqui se quiser
    event.respondWith(fetch(event.request));
  });
  