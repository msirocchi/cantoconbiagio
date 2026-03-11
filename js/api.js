// ============================================================
// API Client - Communicates with Google Apps Script backend
// ============================================================

const API = (() => {
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwwzKl32i9hLSNBR4IBLymt2W_75W5XxyBszXp941OQAM8y4cVddpiFCDPenM_ylG4vPQ/exec';

  function getBaseUrl() {
    return SCRIPT_URL;
  }

  function isConfigured() {
    return true;
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
