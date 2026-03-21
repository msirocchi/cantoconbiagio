// ============================================================
// Main Application Logic
// ============================================================

const App = (() => {
  const MOMENTI = [
    { key: 'Ingresso',           icon: '&#128694;' },
    { key: 'Riconciliazione',    icon: '&#128591;' },
    { key: 'Gloria',             icon: '&#9728;'   },
    { key: 'Salmo',              icon: '&#128220;'  },
    { key: 'Alleluia',           icon: '&#127775;' },
    { key: 'Offertorio',         icon: '&#127838;' },
    { key: 'Santo',              icon: '&#128310;' },
    { key: 'Mistero della fede', icon: '&#10013;'  },
    { key: 'Pace',               icon: '&#129309;' },
    { key: 'Agnello di Dio',     icon: '&#128048;' },
    { key: 'Comunione',          icon: '&#127863;' },
    { key: 'Ringraziamento',     icon: '&#128153;' },
    { key: 'Finale',             icon: '&#127926;' }
  ];

  let currentAssignments = {};
  let allSongs = [];
  let adminPin = '';
  let isAdmin = false;

  // ---- Initialization ----

  function init() {
    registerServiceWorker();
    showApp();
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  function showApp() {
    document.getElementById('app').style.display = 'block';
    loadUserView();
  }

  function saveSetup() {
    showApp();
  }

  // ---- User View ----

  async function loadUserView() {
    setHeaderDate();
    loadLiturgy();
    loadAssignments();
  }

  function setHeaderDate() {
    const now = new Date();
    const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const dateStr = now.toLocaleDateString('it-IT', opts);
    document.getElementById('header-date').textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }

  async function loadLiturgy() {
    try {
      const today = todayStr();
      const data = await API.getLiturgy(today);

      if (data.liturgicalDay) {
        document.getElementById('header-liturgy').textContent = data.liturgicalDay;
      }

      if (data.color) {
        const liturgyEl = document.getElementById('header-liturgy');
        liturgyEl.textContent += ' \u2022 ' + data.color;
      }

      if (data.readings && data.readings.length > 0) {
        const section = document.getElementById('readings-section');
        const list = document.getElementById('readings-list');

        let html = '';
        data.readings.forEach((reading, idx) => {
          const label = reading.label || 'Lettura';
          const icon = reading.icon || '\uD83D\uDCD6';
          const text = reading.text || String(reading);

          html +=
            '<div class="reading-card">' +
            '  <div class="reading-header" onclick="App.toggleReading(' + idx + ')">' +
            '    <span class="reading-icon">' + icon + '</span>' +
            '    <span class="reading-label">' + escHtml(label) + '</span>' +
            '    <span class="reading-chevron" id="chevron-' + idx + '">\u25B6</span>' +
            '  </div>' +
            '  <div class="reading-body" id="reading-body-' + idx + '" style="display:none;">' +
                 escHtml(text) +
            '  </div>' +
            '</div>';
        });

        list.innerHTML = html;
        section.style.display = 'block';
      }
    } catch (e) {
      console.warn('Letture non disponibili:', e.message);
    }
  }

  function toggleReading(idx) {
    const body = document.getElementById('reading-body-' + idx);
    const chevron = document.getElementById('chevron-' + idx);
    if (!body) return;

    const isExpanded = body.style.display !== 'none';
    body.style.display = isExpanded ? 'none' : 'block';
    if (chevron) chevron.textContent = isExpanded ? '\u25B6' : '\u25BC';
  }

  async function loadAssignments() {
    const container = document.getElementById('moments-list');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    try {
      const today = todayStr();
      const data = await API.getAssignments(today);
      currentAssignments = data.assignments || {};
      renderMoments();
    } catch (e) {
      container.innerHTML =
        '<div class="empty-state">' +
        '<div class="icon">&#128268;</div>' +
        '<p>Impossibile caricare i dati.<br>Verifica la connessione.</p>' +
        '</div>';
    }
  }

  function renderMoments() {
    const container = document.getElementById('moments-list');
    let html = '';

    MOMENTI.forEach(m => {
      const assignment = currentAssignments[m.key];
      const isEmpty = !assignment || !assignment.fileId;
      const songName = isEmpty ? 'Nessun canto assegnato' : assignment.name;
      const cardClass = isEmpty ? 'moment-card empty' : 'moment-card';
      const dataAttrs = isEmpty ? '' :
        ' data-file-id="' + escHtml(assignment.fileId) + '" data-song-name="' + escHtml(assignment.name) + '"';

      html +=
        '<div class="' + cardClass + '"' + dataAttrs + '>' +
        '  <div class="moment-icon">' + m.icon + '</div>' +
        '  <div class="moment-info">' +
        '    <div class="moment-label">' + escHtml(m.key) + '</div>' +
        '    <div class="moment-song">' + escHtml(songName) + '</div>' +
        '  </div>' +
        (isEmpty ? '' : '  <div class="moment-arrow">&#8250;</div>') +
        '</div>';
    });

    container.innerHTML = html;

    container.querySelectorAll('.moment-card:not(.empty)').forEach(card => {
      card.addEventListener('click', () => {
        openPdf(card.dataset.fileId, card.dataset.songName);
      });
    });
  }

  // ---- PDF Viewer ----

  async function openPdf(fileId, name) {
    const modal = document.getElementById('pdf-modal');
    const iframe = document.getElementById('pdf-iframe');
    const title = document.getElementById('pdf-title');

    title.textContent = name || 'Caricamento...';
    iframe.src = '';
    modal.classList.add('active');

    try {
      const data = await API.getPdfUrl(fileId);
      if (data.error) throw new Error(data.error);
      iframe.src = data.previewUrl;
    } catch (e) {
      iframe.src = '';
      title.textContent = 'Errore: ' + e.message;
    }
  }

  function closePdfModal(event) {
    if (event && event.target !== event.currentTarget) return;
    const modal = document.getElementById('pdf-modal');
    modal.classList.remove('active');
    document.getElementById('pdf-iframe').src = '';
  }

  // ---- PIN / Admin Access ----

  function showPinModal() {
    const modal = document.getElementById('pin-modal');
    modal.classList.add('active');
    document.getElementById('pin-error').classList.remove('visible');
    clearPinInputs();
    const firstInput = document.querySelector('#pin-input input[data-idx="0"]');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
  }

  function closePinModal(event) {
    if (event && event.target !== event.currentTarget) return;
    document.getElementById('pin-modal').classList.remove('active');
    clearPinInputs();
  }

  function clearPinInputs() {
    document.querySelectorAll('#pin-input input').forEach(input => {
      input.value = '';
    });
  }

  function handlePinInput(event) {
    const input = event.target;
    const idx = parseInt(input.dataset.idx);

    if (input.value && idx < 5) {
      const next = document.querySelector(`#pin-input input[data-idx="${idx + 1}"]`);
      if (next) next.focus();
    }

    if (idx === 5 && input.value) {
      verifyPin();
    }
  }

  function handlePinKeydown(event) {
    const input = event.target;
    const idx = parseInt(input.dataset.idx);

    if (event.key === 'Backspace' && !input.value && idx > 0) {
      const prev = document.querySelector(`#pin-input input[data-idx="${idx - 1}"]`);
      if (prev) {
        prev.value = '';
        prev.focus();
      }
    }
  }

  async function verifyPin() {
    const inputs = document.querySelectorAll('#pin-input input');
    let pin = '';
    inputs.forEach(input => { pin += input.value; });

    if (pin.length < 6) return;

    adminPin = pin;

    try {
      const result = await API.verifyPin(pin);
      if (!result.valid) {
        document.getElementById('pin-error').classList.add('visible');
        clearPinInputs();
        const first = document.querySelector('#pin-input input[data-idx="0"]');
        if (first) first.focus();
        adminPin = '';
        return;
      }

      isAdmin = true;
      closePinModal();
      enterAdmin();
    } catch (e) {
      document.getElementById('pin-error').classList.add('visible');
      clearPinInputs();
      adminPin = '';
    }
  }

  // ---- Admin Panel ----

  function enterAdmin() {
    document.getElementById('user-view').style.display = 'none';
    document.getElementById('admin-panel').classList.add('active');
    document.getElementById('admin-date').value = todayStr();
    loadAdminData();
  }

  function exitAdmin() {
    isAdmin = false;
    adminPin = '';
    document.getElementById('admin-panel').classList.remove('active');
    document.getElementById('user-view').style.display = 'block';
    loadAssignments();
  }

  async function loadAdminData() {
    const container = document.getElementById('assignment-list');
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    const date = document.getElementById('admin-date').value || todayStr();

    try {
      const [songsData, assignData] = await Promise.all([
        API.listSongs(),
        API.getAssignments(date)
      ]);

      allSongs = songsData.songs || [];
      const assignments = assignData.assignments || {};

      renderAdminAssignments(assignments);
      loadRecommendedSongs(date);
    } catch (e) {
      container.innerHTML =
        '<div class="status-message error">Errore nel caricamento: ' + escHtml(e.message) + '</div>';
    }
  }

  function renderAdminAssignments(assignments) {
    const container = document.getElementById('assignment-list');
    let html = '';

    MOMENTI.forEach(m => {
      const current = assignments[m.key];
      const currentFileId = current ? current.fileId : '';

      html +=
        '<div class="assignment-card">' +
        '  <div class="momento-label">' + m.icon + ' ' + escHtml(m.key) + '</div>' +
        '  <select data-momento="' + escHtml(m.key) + '">' +
        '    <option value="">-- Nessun canto --</option>';

      allSongs.forEach(song => {
        const selected = song.id === currentFileId ? ' selected' : '';
        html += '    <option value="' + escHtml(song.id) + '"' + selected + '>' +
                escHtml(song.name) + '</option>';
      });

      html +=
        '  </select>' +
        '  <div class="suggestion-slot" data-momento-suggestion="' + escHtml(m.key) + '"></div>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  async function loadRecommendedSongs(date) {
    const section = document.getElementById('recommended-section');
    const listEl = document.getElementById('recommended-list');
    const linksEl = document.getElementById('search-links');

    try {
      const data = await API.getRecommendedSongs(date);

      let listHtml = '';

      if (data.coraleRuahImage) {
        listHtml += '<li class="ruah-image-item">' +
          '<a href="https://www.coraleruah.it/santa-messa" target="_blank" rel="noopener">' +
          '<img src="' + escHtml(data.coraleRuahImage) + '" alt="Canti suggeriti Corale Ruah" class="ruah-image">' +
          '</a></li>';
      }

      if (data.suggestions && Object.keys(data.suggestions).length > 0) {
        Object.entries(data.suggestions).forEach(([momento, songs]) => {
          songs.forEach(song => {
            const badge = song.inDrive
              ? '<span class="badge-in-drive">Nel Drive</span>'
              : '<span class="badge-not-found">Non trovato</span>';
            const link = !song.inDrive && song.searchUrl
              ? ' <a href="' + escHtml(song.searchUrl) + '" target="_blank" rel="noopener">Cerca partitura</a>'
              : '';

            listHtml +=
              '<li>' +
              '<strong>' + escHtml(momento) + ':</strong> ' +
              escHtml(song.name) + ' ' + badge + link +
              '</li>';
          });
        });

        Object.entries(data.suggestions).forEach(([momento, songs]) => {
          songs.forEach(song => {
            if (song.inDrive && song.fileId) {
              const slot = document.querySelector(`[data-momento-suggestion="${momento}"]`);
              if (slot) {
                slot.innerHTML =
                  '<div class="suggestion-badge">' +
                  '&#128161; Consigliato: ' + escHtml(song.name) +
                  '</div>';
              }
            }
          });
        });
      }

      listEl.innerHTML = listHtml || '<li>Visita Corale Ruah per i suggerimenti settimanali</li>';

      let linksHtml = '';
      if (data.searchLinks && data.searchLinks.length > 0) {
        data.searchLinks.forEach(link => {
          linksHtml += '<a href="' + escHtml(link.searchUrl) + '" target="_blank" rel="noopener">' +
                       escHtml(link.name) + '</a> ';
        });
      }
      linksEl.innerHTML = linksHtml;

      section.style.display = 'block';
    } catch (e) {
      console.warn('Canti consigliati non disponibili:', e.message);
      section.style.display = 'none';
    }
  }

  async function saveAssignments() {
    const date = document.getElementById('admin-date').value || todayStr();
    const selects = document.querySelectorAll('#assignment-list select');
    const assignments = {};

    selects.forEach(select => {
      const momento = select.dataset.momento;
      const fileId = select.value;
      if (fileId) {
        const song = allSongs.find(s => s.id === fileId);
        assignments[momento] = {
          fileId: fileId,
          name: song ? song.name : ''
        };
      }
    });

    try {
      const result = await API.setAssignments(date, assignments, adminPin);
      if (result.error) {
        toast(result.error, 'error');
        return;
      }
      toast('Assegnazioni salvate!', 'success');
    } catch (e) {
      toast('Errore nel salvataggio: ' + e.message, 'error');
    }
  }

  async function changePin() {
    const currentPinEl = document.getElementById('current-pin');
    const newPinEl = document.getElementById('new-pin');
    const current = currentPinEl.value;
    const newPin = newPinEl.value;

    if (!current || !newPin) {
      toast('Compila entrambi i campi', 'error');
      return;
    }
    if (newPin.length < 4) {
      toast('Il nuovo PIN deve avere almeno 4 cifre', 'error');
      return;
    }

    try {
      const result = await API.setPin(current, newPin);
      if (result.error) {
        toast(result.error, 'error');
        return;
      }
      adminPin = newPin;
      currentPinEl.value = '';
      newPinEl.value = '';
      toast('PIN aggiornato!', 'success');
    } catch (e) {
      toast('Errore: ' + e.message, 'error');
    }
  }

  // ---- Utilities ----

  function todayStr() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function escHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function toast(message, type) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' ' + type : '');
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ---- Public API ----

  return {
    init,
    saveSetup,
    showPinModal,
    closePinModal,
    closePdfModal,
    openPdf,
    handlePinInput,
    handlePinKeydown,
    verifyPin,
    exitAdmin,
    loadAdminData,
    saveAssignments,
    changePin,
    toggleReading
  };
})();

document.addEventListener('DOMContentLoaded', App.init);
