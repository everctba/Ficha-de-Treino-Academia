/*
  pwa.js — registro do Service Worker, botão "Instalar app" e aviso de atualização.
  Funciona em GitHub Pages: todos os caminhos são relativos à pasta do site.
*/
(function () {
  'use strict';

  var isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  var installBtn = document.getElementById('btn-install');
  var deferredPrompt = window.__pwaInstallPrompt || null;

  if (installBtn) {
    if (isStandalone) {
      installBtn.style.display = 'none';
    } else if (deferredPrompt) {
      installBtn.style.display = 'flex';
    }

    window.addEventListener('beforeinstallprompt', function (event) {
      event.preventDefault();
      deferredPrompt = event;
      window.__pwaInstallPrompt = event;
      installBtn.style.display = 'flex';
    });

    window.addEventListener('pwa-installable', function () {
      deferredPrompt = window.__pwaInstallPrompt;
      if (deferredPrompt && !isStandalone) installBtn.style.display = 'flex';
    });

    installBtn.addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        window.__pwaInstallPrompt = null;
        installBtn.style.display = 'none';
      });
    });

    window.addEventListener('appinstalled', function () {
      deferredPrompt = null;
      window.__pwaInstallPrompt = null;
      installBtn.style.display = 'none';
    });
  }

  if (!('serviceWorker' in navigator)) return;

  var isSecure =
    window.location.protocol === 'https:' ||
    ['localhost', '127.0.0.1', '[::1]'].indexOf(window.location.hostname) !== -1;

  if (!isSecure) {
    console.warn('[PWA] Service Worker exige HTTPS (ou localhost).');
    return;
  }

  var hadController = !!navigator.serviceWorker.controller;
  var reloading = false;

  window.addEventListener('load', function () {
    navigator.serviceWorker
      .register('./sw.js', { scope: './' })
      .then(function (registration) {
        registration.addEventListener('updatefound', function () {
          var worker = registration.installing;
          if (!worker) return;

          worker.addEventListener('statechange', function () {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateToast(worker);
            }
          });
        });
      })
      .catch(function (error) {
        console.warn('[PWA] Não foi possível registrar o Service Worker:', error);
      });
  });

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    if (!hadController || reloading) return;
    reloading = true;
    window.location.reload();
  });

  function showUpdateToast(worker) {
    if (document.getElementById('pwa-update-toast')) return;

    var toast = document.createElement('div');
    toast.id = 'pwa-update-toast';
    toast.className = 'pwa-toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML =
      '<div class="pwa-toast-text">' +
      '<span class="material-symbols-outlined pwa-toast-icon">system_update</span>' +
      '<span>Nova versão disponível</span>' +
      '</div>' +
      '<button type="button" class="pwa-toast-button">Atualizar</button>';

    var button = toast.querySelector('.pwa-toast-button');
    button.addEventListener('click', function () {
      button.disabled = true;
      button.textContent = 'Atualizando...';
      worker.postMessage({ type: 'SKIP_WAITING' });
    });

    document.body.appendChild(toast);
    requestAnimationFrame(function () {
      toast.classList.add('is-visible');
    });
  }
})();
