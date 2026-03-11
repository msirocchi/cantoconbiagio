// ============================================================
// API Client - Communicates with Google Apps Script backend
// ============================================================

const API = (() => {
  const STORAGE_KEY = 'cantoconbiagio_script_url';

  function getBaseUrl() {
    return localStorage.getItem(STORAGE_KEY) || '';
  }

  function setBaseUrl(url) {
    const clean = url.trim().replace(/\/+$/, '');
    localStorage.setItem(STORAGE_KEY, clean);
  }

  function isConfigured() {
    return !!getBaseUrl();
  }

  async function get(params) {
    const url = new URL(getBaseUrl());
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow'
    });

    if (!response.ok) throw new Error('Errore di rete: ' + response.status);
    return response.json();
  }

  async function post(data) {
    const response = await fetch(getBaseUrl(), {
      method: 'POST',
      redirect: 'follow',
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Errore di rete: ' + response.status);
    return response.json();
  }

  return {
    getBaseUrl,
    setBaseUrl,
    isConfigured,

    ping() {
      return get({ action: 'ping' });
    },

    listSongs() {
      return get({ action: 'listSongs' });
    },

    getAssignments(date) {
      return get({ action: 'getAssignments', date });
    },

    verifyPin(pin) {
      return post({ action: 'verifyPin', pin });
    },

    setAssignments(date, assignments, pin) {
      return post({ action: 'setAssignments', date, assignments, pin });
    },

    getConfig() {
      return get({ action: 'getConfig' });
    },

    getLiturgy(date) {
      return get({ action: 'getLiturgy', date });
    },

    getRecommendedSongs(date) {
      return get({ action: 'getRecommendedSongs', date });
    },

    getPdfUrl(fileId) {
      return get({ action: 'getPdfUrl', fileId });
    },

    setPin(currentPin, newPin) {
      return post({ action: 'setPin', currentPin, newPin });
    }
  };
})();
