# Visualizzatore di Campo Magnetico 2D

Simulatore scientifico interattivo in 2D per lo studio e la visualizzazione delle linee di forza e del campo vettoriale magnetico $\vec{B}$, progettato per studenti e docenti di fisica.

## Funzionalità

- **Generatori di Campo Magnetico Trascinabili**:
  - **Magnete a Barra (Dipolo)**: Poli Nord (rosso) e Sud (blu) con visualizzazione delle linee continue.
  - **Magnete a Ferro di Cavallo**: Sagoma classica da laboratorio didattico con traferro ad alta densità di flusso.
  - **Filo con Corrente (Oersted / Biot-Savart)**: Linee concentriche circolari con verso selezionabile (uscente $\odot$ o entrante $\otimes$).
- **Visualizzazioni del Campo in Tempo Reale**:
  - **Linee di Forza Continue**: Calcolate con integrazione numerica Runge-Kutta 4 (RK4) con frecce orientate da N a S e flusso animato opzionale.
  - **Griglia di Bussole / Aghi**: Piccole bussole pivotanti con ago rosso (N) e blu (S).
  - **Frecce Vettoriali $\vec{B}$**: Vettori con intensità e colore proporzionali a $|\vec{B}|$.
  - **Limatura di Ferro**: Simulazione realistica di micro-schegge orientate lungo le linee di forza.
  - **Mappa Cromatica di Calore**: Intensità logaritmica del campo magnetico.
- **Sonda di Misura Interattiva**:
  - Lettura istantanea di $|\vec{B}|$ (in milliTesla e Gauss), componenti $B_x, B_y$ e angolo $\theta$.
- **Preset Didattici**:
  - Singola barra, Attrazione N-S, Repulsione N-N, Ferro di cavallo, Esperimento di Oersted, Quadrupolo.

## Come avviare il progetto in locale

1. Clona il repository:
   ```bash
   git clone https://github.com/<TUO-USERNAME>/<NOME-REPO>.git
   cd <NOME-REPO>
   ```

2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Avvia il server di sviluppo:
   ```bash
   npm run dev
   ```
   Apri il browser all'indirizzo `http://localhost:3000`.

## Pubblicazione su GitHub Pages

Il repository include già il workflow automatico in `.github/workflows/deploy.yml` e la configurazione `base: './'` in `vite.config.ts`.

Per pubblicarlo online:
1. Crea un nuovo repository su GitHub e carica tutti i file.
2. Vai nelle **Settings** del repository su GitHub.
3. Nel menu laterale a sinistra clicca su **Pages**.
4. Sotto **Build and deployment** > **Source**, seleziona **GitHub Actions**.
5. Finito! GitHub compilerà automaticamente l'app e ti fornirà il link pubblico (es. `https://<tuo-username>.github.io/<nome-repo>/`) da condividere con i tuoi studenti.
