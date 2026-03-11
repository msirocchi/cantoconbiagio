# Canto con Biagio

PWA per la gestione dei canti della messa. Permette di scegliere e condividere i canti con la comunità, leggendo i testi PDF da Google Drive.

## Funzionalità

- **Vista utente**: mostra i canti assegnati a ogni momento della messa; cliccando sul titolo si apre il testo PDF
- **Vista amministratore**: pannello protetto da PIN per assegnare i canti ai momenti della messa
- **Canti consigliati**: suggerimenti automatici da fonti online per la liturgia del giorno
- **Letture del giorno**: mostra la data e le letture consigliate per la messa odierna
- **PWA installabile**: può essere aggiunta alla home del telefono

## Prerequisiti

- Un account Google (es. cantoconbiagio@gmail.com)
- Una cartella `TestiCanti` su Google Drive contenente i file PDF dei canti
- Accesso a [Google Apps Script](https://script.google.com)

## Setup - Passo 1: Preparare Google Drive

1. Accedi a [Google Drive](https://drive.google.com) con l'account cantoconbiagio@gmail.com
2. Crea una cartella chiamata **`TestiCanti`** (esattamente con questo nome)
3. Carica nella cartella tutti i file PDF dei canti. Il nome del file (senza `.pdf`) sarà il titolo mostrato nell'app

## Setup - Passo 2: Creare il Backend (Google Apps Script)

1. Vai su [https://script.google.com](https://script.google.com) e accedi con lo stesso account Google
2. Clicca **"Nuovo progetto"**
3. Rinomina il progetto in **"CantoConBiagio Backend"**
4. Cancella tutto il contenuto del file `Code.gs`
5. Copia e incolla il contenuto del file `google-apps-script/Code.gs` di questo progetto
6. Salva con Ctrl+S

### Primo test

1. Nella barra in alto, seleziona la funzione **`setup`** dal menu a tendina
2. Clicca il pulsante **Esegui** (▶)
3. Google chiederà di autorizzare l'accesso - clicca **"Rivedi autorizzazioni"**, seleziona l'account, e clicca **"Consenti"**
4. Controlla i log (Visualizza → Log) per verificare che non ci siano errori

### Deploy come Web App

1. Clicca **Deploy** → **Nuova distribuzione**
2. Clicca l'icona ingranaggio accanto a "Tipo" e seleziona **"App web"**
3. Configura così:
   - **Descrizione**: "CantoConBiagio API"
   - **Esegui come**: "Me" (il tuo account)
   - **Chi ha accesso**: "Chiunque"
4. Clicca **Esegui il deployment**
5. **Copia l'URL** che viene mostrato (es. `https://script.google.com/macros/s/ABC.../exec`)

> **IMPORTANTE**: Ogni volta che modifichi il codice di Code.gs, devi creare un nuovo deployment o aggiornare quello esistente tramite **Deploy → Gestisci deployment → Modifica**.

## Setup - Passo 3: Pubblicare la PWA

### Opzione A: GitHub Pages (consigliato, gratuito)

1. Crea un repository su [GitHub](https://github.com)
2. Carica tutti i file della cartella `CantoConBiagio` (eccetto `google-apps-script/` e `README.md`)
3. Vai in **Settings → Pages** → seleziona "main" branch → salva
4. Il sito sarà disponibile su `https://tuonome.github.io/nomerepository/`

### Opzione B: Netlify (gratuito)

1. Vai su [Netlify](https://www.netlify.com)
2. Trascina la cartella `CantoConBiagio` nella dashboard
3. Il sito sarà disponibile immediatamente

### Opzione C: Locale / LAN

1. Usa un server HTTP locale:
   ```bash
   cd CantoConBiagio
   npx serve .
   ```
2. Apri il browser all'indirizzo indicato

## Setup - Passo 4: Primo avvio

1. Apri l'URL della PWA nel browser
2. Apparirà la schermata di configurazione
3. Incolla l'URL del Google Apps Script (copiato al Passo 2)
4. Clicca **"Connetti"**

## Utilizzo

### Utente normale
- Apri l'app per vedere i canti assegnati per oggi
- Clicca su un canto per visualizzare il PDF

### Amministratore
1. Clicca **"Admin"** in alto a destra
2. Inserisci il PIN (default: **123456**)
3. Per ogni momento della messa, seleziona un canto dal menu a tendina
4. Consulta i **canti consigliati** in basso
5. Clicca **"Salva Assegnazioni"**
6. Per cambiare il PIN, usa la sezione in fondo al pannello admin

## Struttura del progetto

```
CantoConBiagio/
├── index.html                    # Pagina principale
├── manifest.json                 # Manifest PWA
├── sw.js                         # Service Worker
├── css/
│   └── style.css                 # Stili
├── js/
│   ├── api.js                    # Client API
│   └── app.js                    # Logica applicazione
├── icons/
│   ├── icon-192.svg              # Icona PWA
│   └── icon-512.svg              # Icona PWA grande
├── google-apps-script/
│   └── Code.gs                   # Backend (da copiare in Apps Script)
└── README.md                     # Questa guida
```

## Note di sicurezza

- Il PIN è salvato nel Google Sheet ed è verificato lato server
- I file PDF vengono condivisi automaticamente con link "Chiunque abbia il link"
- **Non condividere mai le credenziali dell'account Google** nel codice o in chat pubbliche
- Cambia regolarmente il PIN dell'amministratore
