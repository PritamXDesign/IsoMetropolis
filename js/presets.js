/**
 * IsoMetropolis Pre-built Starter Cities
 * Allows instant gameplay and exploration of different architectural styles.
 */

const PRESETS = {
  // Preset 1: Sunny Bay Metropolis (Modern Style)
  sunny_bay: {
    name: 'Sunny Bay Metropolis',
    desc: 'A thriving coastal metropolis with high-rise towers, bustling avenues, and full utility grid.',
    funds: 35000,
    style: 'modern',
    build: function(map) {
      map.generateTerrain();

      // Main arterial road grid
      for (let x = 8; x <= 28; x++) {
        map.buildRoad(x, 14);
        map.buildRoad(x, 22);
      }
      for (let y = 8; y <= 26; y++) {
        map.buildRoad(12, y);
        map.buildRoad(20, y);
        map.buildRoad(26, y);
      }

      // Utilities
      map.buildBuilding(9, 9, 'wind_turbine', 'modern');
      map.buildBuilding(10, 9, 'wind_turbine', 'modern');
      map.buildBuilding(11, 9, 'wind_turbine', 'modern');
      map.buildBuilding(9, 10, 'water_tower', 'modern');

      // Civic services
      map.buildBuilding(13, 13, 'police', 'modern');
      map.buildBuilding(14, 13, 'fire_dept', 'modern');
      map.buildBuilding(15, 13, 'hospital', 'modern');
      map.buildBuilding(16, 13, 'school', 'modern');
      map.buildBuilding(17, 13, 'park_fountain', 'modern');
      map.buildBuilding(21, 13, 'city_hall', 'modern');

      // Residential District (North-Central)
      for (let y = 10; y <= 13; y++) {
        for (let x = 13; x <= 19; x++) {
          if (!map.getTile(x, y).building && !map.getTile(x, y).road) {
            map.buildZone(x, y, 'zone_res', 'modern');
            const t = map.getTile(x, y);
            t.stage = 2 + Math.floor(Math.random() * 3); // Stages 2 to 4
          }
        }
      }

      // Downtown Commercial High-rises (Center)
      for (let y = 15; y <= 21; y++) {
        for (let x = 13; x <= 19; x++) {
          if (!map.getTile(x, y).road) {
            map.buildZone(x, y, 'zone_com', 'modern');
            const t = map.getTile(x, y);
            t.stage = 2 + Math.floor(Math.random() * 3);
          }
        }
      }

      // Industrial & Logistics Zone (East)
      for (let y = 15; y <= 21; y++) {
        for (let x = 21; x <= 25; x++) {
          if (!map.getTile(x, y).road) {
            map.buildZone(x, y, 'zone_ind', 'modern');
            const t = map.getTile(x, y);
            t.stage = 1 + Math.floor(Math.random() * 3);
          }
        }
      }

      map.refreshRoadsList();
      map.updateConnectivity();
    }
  },

  // Preset 2: Neo Tokyo 2099 (Cyberpunk / Japanese Style)
  neo_tokyo: {
    name: 'Neo Tokyo 2099',
    desc: 'Dense neon spires, holographic plazas, state-of-the-art solar arrays, and high-tech campuses.',
    funds: 50000,
    style: 'cyberpunk',
    build: function(map) {
      map.generateTerrain();

      // Cyber avenue grid
      for (let x = 10; x <= 26; x++) {
        map.buildRoad(x, 12);
        map.buildRoad(x, 18);
        map.buildRoad(x, 24);
      }
      for (let y = 10; y <= 26; y++) {
        map.buildRoad(14, y);
        map.buildRoad(22, y);
      }

      // Clean solar power & water
      map.buildBuilding(11, 10, 'solar_farm', 'cyberpunk');
      map.buildBuilding(12, 10, 'solar_farm', 'cyberpunk');
      map.buildBuilding(11, 11, 'water_tower', 'cyberpunk');

      // Cyber Plazas & Landmarks
      map.buildBuilding(18, 15, 'cyber_plaza', 'cyberpunk');
      map.buildBuilding(17, 15, 'monolith', 'cyberpunk');
      map.buildBuilding(15, 13, 'university', 'cyberpunk');
      map.buildBuilding(16, 13, 'police', 'cyberpunk');

      // Dense residential zones
      for (let y = 13; y <= 17; y++) {
        for (let x = 10; x <= 13; x++) {
          if (!map.getTile(x, y).road && !map.getTile(x, y).building) {
            map.buildZone(x, y, 'zone_res', 'cyberpunk');
            map.getTile(x, y).stage = 3 + Math.floor(Math.random() * 2);
          }
        }
      }

      // Neon Commercial Mega-Blocks
      for (let y = 19; y <= 23; y++) {
        for (let x = 15; x <= 21; x++) {
          if (!map.getTile(x, y).road && !map.getTile(x, y).building) {
            map.buildZone(x, y, 'zone_com', 'cyberpunk');
            map.getTile(x, y).stage = 3 + Math.floor(Math.random() * 2);
          }
        }
      }

      // High-Tech Industrial
      for (let y = 13; y <= 17; y++) {
        for (let x = 23; x <= 26; x++) {
          if (!map.getTile(x, y).road) {
            map.buildZone(x, y, 'zone_ind', 'cyberpunk');
            map.getTile(x, y).stage = 2 + Math.floor(Math.random() * 3);
          }
        }
      }

      map.refreshRoadsList();
      map.updateConnectivity();
    }
  },

  // Preset 3: Old Haussmann River (European Style)
  old_haussmann: {
    name: 'Old Haussmann Rivertown',
    desc: 'Historic Parisian style avenues, slate roofs, public fountains, clock tower, and cafe plazas.',
    funds: 40000,
    style: 'european',
    build: function(map) {
      map.generateTerrain();

      // Boulevards
      for (let x = 10; x <= 25; x++) {
        map.buildRoad(x, 15);
        map.buildRoad(x, 21);
      }
      for (let y = 10; y <= 25; y++) {
        map.buildRoad(15, y);
        map.buildRoad(21, y);
      }

      // Landmarks
      map.buildBuilding(18, 18, 'park_fountain', 'european');
      map.buildBuilding(17, 18, 'clock_tower', 'european');
      map.buildBuilding(19, 18, 'city_hall', 'european');
      map.buildBuilding(16, 14, 'school', 'european');
      map.buildBuilding(20, 14, 'clinic', 'european');
      map.buildBuilding(10, 14, 'water_tower', 'european');
      map.buildBuilding(10, 13, 'wind_turbine', 'european');

      // European Residential Mansions
      for (let y = 11; y <= 14; y++) {
        for (let x = 11; x <= 14; x++) {
          if (!map.getTile(x, y).road && !map.getTile(x, y).building) {
            map.buildZone(x, y, 'zone_res', 'european');
            map.getTile(x, y).stage = 2 + Math.floor(Math.random() * 2);
          }
        }
      }

      // Parisian Boutiques & Cafes
      for (let y = 16; y <= 20; y++) {
        for (let x = 11; x <= 14; x++) {
          if (!map.getTile(x, y).road && !map.getTile(x, y).building) {
            map.buildZone(x, y, 'zone_com', 'european');
            map.getTile(x, y).stage = 2 + Math.floor(Math.random() * 2);
          }
        }
      }

      map.refreshRoadsList();
      map.updateConnectivity();
    }
  },

  // Preset 4: Virgin Blank Canvas
  blank_canvas: {
    name: 'New Mayor Blank Canvas',
    desc: 'Untouched pristine landscape with gentle river and sandy coasts. Create your own dream city!',
    funds: CONFIG.STARTING_FUNDS,
    style: 'european',
    build: function(map) {
      map.generateTerrain();
      map.refreshRoadsList();
      map.updateConnectivity();
    }
  }
};
