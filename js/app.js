/**
 * IsoMetropolis Game App Entry Point
 * Orchestrates rendering, simulation ticks, news ticker, save/load, and presets.
 */

window.addEventListener('DOMContentLoaded', () => {
  const mainCanvas = document.getElementById('city-canvas');
  const miniCanvas = document.getElementById('minimap-canvas');

  // Handle high-DPI crisp canvas sizing
  function resizeCanvas() {
    mainCanvas.width = window.innerWidth;
    mainCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Initialize Game Subsystems
  const cityMap = new CityMap(CONFIG.GRID_SIZE);
  const simEngine = new SimulationEngine(cityMap);
  const trafficSys = new TrafficSystem(cityMap);
  const renderer = new IsometricRenderer(mainCanvas, miniCanvas, cityMap, simEngine, trafficSys);
  const ui = new UIManager(renderer, cityMap, simEngine, trafficSys);

  // Load default preset: Sunny Bay Metropolis!
  PRESETS.sunny_bay.build(cityMap);
  simEngine.funds = PRESETS.sunny_bay.funds;
  renderer.activeStyle = PRESETS.sunny_bay.style;
  renderer.centerCamera();

  // News Ticker Cycler
  const elNews = document.getElementById('news-text');
  function cycleNews() {
    if (elNews) {
      elNews.textContent = simEngine.getNextNews();
    }
  }
  cycleNews();
  setInterval(cycleNews, 8000);
  if (elNews) {
    elNews.parentElement.addEventListener('click', cycleNews);
  }

  // Simulation Tick Loop
  let lastTickTime = performance.now();
  function simLoop(time) {
    const elapsed = time - lastTickTime;
    const interval = CONFIG.TICK_INTERVAL_MS / (simEngine.speed || 1);

    if (simEngine.speed > 0 && elapsed >= interval) {
      simEngine.tick();
      ui.updateHUD();
      lastTickTime = time;
    }
    requestAnimationFrame(simLoop);
  }
  requestAnimationFrame(simLoop);

  // 60 FPS Render & Traffic Animation Loop
  function renderLoop() {
    trafficSys.update();
    renderer.render();
    requestAnimationFrame(renderLoop);
  }
  requestAnimationFrame(renderLoop);

  // Connect Toolbar Tool Category Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.palette-panel').forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.target;
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
      sound.playClick();
    });
  });

  // Connect Tool Placement Buttons
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      ui.setTool(btn.dataset.tool);
    });
  });

  // Connect Speed Controls
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const spd = parseInt(btn.dataset.speed, 10);
      simEngine.setSpeed(spd);
      ui.updateSpeedButtons();
      sound.playClick();
    });
  });

  // Connect Architectural Style Selector
  const styleSelect = document.getElementById('select-style');
  if (styleSelect) {
    styleSelect.addEventListener('change', e => {
      ui.setStyle(e.target.value);
    });
  }

  // Connect Overlays Selector
  const overlaySelect = document.getElementById('select-overlay');
  if (overlaySelect) {
    overlaySelect.addEventListener('change', e => {
      renderer.activeOverlay = e.target.value;
      sound.playClick();
    });
  }

  // Connect Grid & Day/Night Toggles
  const btnGrid = document.getElementById('btn-grid');
  if (btnGrid) {
    btnGrid.addEventListener('click', () => ui.toggleGrid());
  }

  const btnDayNight = document.getElementById('btn-daynight');
  if (btnDayNight) {
    btnDayNight.addEventListener('click', () => ui.toggleDayNight());
  }

  // Connect Audio & Music Toggles
  const btnAudio = document.getElementById('btn-audio');
  if (btnAudio) {
    btnAudio.addEventListener('click', () => {
      const isMuted = sound.toggleMute();
      btnAudio.textContent = isMuted ? '🔇 Audio Off' : '🔊 Audio On';
      btnAudio.classList.toggle('active', !isMuted);
    });
  }

  const btnMusic = document.getElementById('btn-music');
  if (btnMusic) {
    btnMusic.addEventListener('click', () => {
      const isMusic = sound.toggleMusic();
      btnMusic.textContent = isMusic ? '🎵 Lo-Fi On' : '🎵 Lo-Fi Off';
      btnMusic.classList.toggle('active', isMusic);
    });
  }

  // Preset City Buttons
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const pKey = btn.dataset.preset;
      const preset = PRESETS[pKey];
      if (preset) {
        preset.build(cityMap);
        simEngine.funds = preset.funds;
        renderer.activeStyle = preset.style;
        if (styleSelect) styleSelect.value = preset.style;
        renderer.centerCamera();
        ui.updateHUD();
        sound.playMoney();

        const dialog = document.getElementById('dialog-presets');
        if (dialog) dialog.close();
      }
    });
  });

  // Save to LocalStorage
  const btnSaveLocal = document.getElementById('btn-save-local');
  if (btnSaveLocal) {
    btnSaveLocal.addEventListener('click', () => {
      const json = cityMap.exportJSON({
        cityName: ui.cityName,
        mayorName: ui.mayorName,
        funds: simEngine.funds,
        year: simEngine.year,
        month: simEngine.month,
        style: renderer.activeStyle
      });
      localStorage.setItem('isometropolis_saved_game', json);
      alert('💾 City saved successfully to browser storage!');
      sound.playMoney();
    });
  }

  // Load from LocalStorage
  const btnLoadLocal = document.getElementById('btn-load-local');
  if (btnLoadLocal) {
    btnLoadLocal.addEventListener('click', () => {
      const json = localStorage.getItem('isometropolis_saved_game') || localStorage.getItem('cityrt_saved_game');
      if (!json) {
        alert('No saved city found in browser storage!');
        return;
      }
      const meta = cityMap.importJSON(json);
      if (meta) {
        if (meta.funds !== undefined) simEngine.funds = meta.funds;
        if (meta.year !== undefined) simEngine.year = meta.year;
        if (meta.month !== undefined) simEngine.month = meta.month;
        if (meta.style) {
          renderer.activeStyle = meta.style;
          if (styleSelect) styleSelect.value = meta.style;
        }
        renderer.centerCamera();
        ui.updateHUD();
        sound.playMoney();
        alert('City loaded successfully!');
        const dialog = document.getElementById('dialog-presets');
        if (dialog) dialog.close();
      }
    });
  }

  // Export City to JSON File (Download)
  const btnExport = document.getElementById('btn-export-json');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const json = cityMap.exportJSON({
        cityName: ui.cityName,
        mayorName: ui.mayorName,
        funds: simEngine.funds,
        year: simEngine.year,
        month: simEngine.month,
        style: renderer.activeStyle
      });
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ui.cityName.toLowerCase().replace(/\s+/g, '_')}_isometropolis.json`;
      a.click();
      URL.revokeObjectURL(url);
      sound.playMoney();
    });
  }

  // Import City from JSON File (Upload)
  const fileInput = document.getElementById('file-import-json');
  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        const meta = cityMap.importJSON(ev.target.result);
        if (meta) {
          if (meta.funds !== undefined) simEngine.funds = meta.funds;
          if (meta.year !== undefined) simEngine.year = meta.year;
          if (meta.month !== undefined) simEngine.month = meta.month;
          if (meta.style) {
            renderer.activeStyle = meta.style;
            if (styleSelect) styleSelect.value = meta.style;
          }
          renderer.centerCamera();
          ui.updateHUD();
          sound.playMoney();
          alert('City imported successfully!');
          const dialog = document.getElementById('dialog-presets');
          if (dialog) dialog.close();
        } else {
          alert('Failed to load JSON city file.');
        }
      };
      reader.readAsText(file);
    });
  }

  // Editable City Name
  const elCityName = document.getElementById('hud-city-name');
  if (elCityName) {
    elCityName.addEventListener('click', () => {
      const newName = prompt('Enter new city name:', ui.cityName);
      if (newName && newName.trim()) {
        ui.cityName = newName.trim();
        elCityName.textContent = ui.cityName;
      }
    });
  }
});
