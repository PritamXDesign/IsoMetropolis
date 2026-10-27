/**
 * IsoMetropolis Game Configuration & Data Models
 */

const CONFIG = {
  GRID_SIZE: 36, // 36x36 grid
  TILE_WIDTH: 64, // Isometric diamond width
  TILE_HEIGHT: 32, // Isometric diamond height
  STARTING_FUNDS: 25000,
  TICK_INTERVAL_MS: 1000, // 1 game day per second at 1x speed
  DAYS_PER_MONTH: 30,

  ARCH_STYLES: [
    { id: 'european', name: 'European (Haussmann)', desc: 'Slate mansard roofs, stone facades, Parisian charm' },
    { id: 'modern', name: 'Metropolis Modern', desc: 'Glass skyscrapers, sleek concrete, steel high-rises' },
    { id: 'japanese', name: 'Neo-Tokyo / Edo', desc: 'Curved tiled eaves, crimson accents, cherry blossoms' },
    { id: 'cyberpunk', name: 'Cyberpunk 2099', desc: 'Dark alloy towers, neon lights, holographic billboards' },
    { id: 'medieval', name: 'Old World Medieval', desc: 'Half-timbered beams, stone keeps, thatched roofs' }
  ],

  TOOLS: {
    SELECT: 'select',
    INSPECT: 'inspect',
    BULLDOZE: 'bulldoze',
    ROAD: 'road',
    // Zones
    ZONE_RES: 'zone_res',
    ZONE_COM: 'zone_com',
    ZONE_IND: 'zone_ind',
    DEZONE: 'dezone',
    // Utilities
    WIND_TURBINE: 'wind_turbine',
    SOLAR_FARM: 'solar_farm',
    COAL_POWER: 'coal_power',
    WATER_TOWER: 'water_tower',
    WATER_PUMP: 'water_pump',
    // Services
    POLICE: 'police',
    FIRE_DEPT: 'fire_dept',
    CLINIC: 'clinic',
    HOSPITAL: 'hospital',
    SCHOOL: 'school',
    UNIVERSITY: 'university',
    // Parks & Landmarks
    PARK_SMALL: 'park_small',
    PARK_FOUNTAIN: 'park_fountain',
    ZEN_GARDEN: 'zen_garden',
    CYBER_PLAZA: 'cyber_plaza',
    STADIUM: 'stadium',
    CITY_HALL: 'city_hall',
    CLOCK_TOWER: 'clock_tower',
    MONOLITH: 'monolith'
  },

  TILES: {
    EMPTY: 0,
    GRASS: 1,
    WATER: 2,
    SAND: 3,
    TREES: 4,
    ROAD: 5,
    BRIDGE: 6
  },

  ITEMS: {
    road: {
      id: 'road',
      name: 'Paved Road',
      category: 'transport',
      cost: 10,
      upkeep: 1,
      desc: 'Connects zones and carries traffic. Automatically connects to neighbors.'
    },
    dezone: {
      id: 'dezone',
      name: 'Clear Zone',
      category: 'zones',
      cost: 5,
      desc: 'Clears zoning designation from tiles without destroying roads.'
    },
    zone_res: {
      id: 'zone_res',
      name: 'Residential Zone',
      category: 'zones',
      cost: 25,
      desc: 'Citizens build homes here. Requires road access, power, and water.'
    },
    zone_com: {
      id: 'zone_com',
      name: 'Commercial Zone',
      category: 'zones',
      cost: 35,
      desc: 'Shops and offices. Provides jobs and shopping for residents.'
    },
    zone_ind: {
      id: 'zone_ind',
      name: 'Industrial Zone',
      category: 'zones',
      cost: 30,
      desc: 'Factories and workshops. Provides industrial jobs but emits pollution.'
    },
    wind_turbine: {
      id: 'wind_turbine',
      name: 'Wind Turbine',
      category: 'utilities',
      cost: 300,
      upkeep: 6,
      power: 45,
      pollution: 0,
      desc: 'Clean, renewable electricity. Perfect for green eco-districts.'
    },
    solar_farm: {
      id: 'solar_farm',
      name: 'Solar Array',
      category: 'utilities',
      cost: 750,
      upkeep: 14,
      power: 120,
      pollution: 0,
      desc: 'Zero-emission solar energy for modern cities.'
    },
    coal_power: {
      id: 'coal_power',
      name: 'Thermal Coal Plant',
      category: 'utilities',
      cost: 1500,
      upkeep: 45,
      power: 400,
      pollution: 15,
      desc: 'High output electrical generation, but creates heavy soot and smog.'
    },
    water_tower: {
      id: 'water_tower',
      name: 'Water Tower',
      category: 'utilities',
      cost: 400,
      upkeep: 8,
      water: 140,
      desc: 'Pumps and stores pressurized fresh water across neighborhoods.'
    },
    water_pump: {
      id: 'water_pump',
      name: 'River Water Works',
      category: 'utilities',
      cost: 900,
      upkeep: 22,
      water: 420,
      desc: 'Large capacity municipal water intake. Must be placed near water.'
    },
    police: {
      id: 'police',
      name: 'Police Station',
      category: 'services',
      cost: 550,
      upkeep: 28,
      radius: 10,
      safety: 40,
      desc: 'Dispatches police patrols to keep crime rates low in the district.'
    },
    fire_dept: {
      id: 'fire_dept',
      name: 'Fire Department',
      category: 'services',
      cost: 550,
      upkeep: 28,
      radius: 10,
      safety: 40,
      desc: 'Protects buildings from burning down and extinguishes outbreaks.'
    },
    clinic: {
      id: 'clinic',
      name: 'Community Clinic',
      category: 'services',
      cost: 650,
      upkeep: 32,
      radius: 9,
      health: 35,
      desc: 'Local doctors clinic. Boosts citizen health and average lifespan.'
    },
    hospital: {
      id: 'hospital',
      name: 'General Hospital',
      category: 'services',
      cost: 1800,
      upkeep: 85,
      radius: 16,
      health: 75,
      desc: 'High-tech medical center providing extensive healthcare coverage.'
    },
    school: {
      id: 'school',
      name: 'Elementary School',
      category: 'services',
      cost: 500,
      upkeep: 24,
      radius: 10,
      education: 35,
      desc: 'Educates younger citizens, raising land value and reducing crime.'
    },
    university: {
      id: 'university',
      name: 'State University',
      category: 'services',
      cost: 2200,
      upkeep: 95,
      radius: 20,
      education: 80,
      desc: 'Higher education hub. Attracts high-tech commercial and research firms.'
    },
    park_small: {
      id: 'park_small',
      name: 'Neighborhood Park',
      category: 'parks',
      cost: 120,
      upkeep: 3,
      happiness: 12,
      desc: 'Lush greenery, trees, and benches. Raises nearby land value.'
    },
    park_fountain: {
      id: 'park_fountain',
      name: 'Fountain Plaza',
      category: 'parks',
      cost: 280,
      upkeep: 6,
      happiness: 25,
      desc: 'Decorative marble water fountain where citizens love to gather.'
    },
    zen_garden: {
      id: 'zen_garden',
      name: 'Zen Rock Garden',
      category: 'parks',
      cost: 320,
      upkeep: 7,
      happiness: 28,
      desc: 'Tranquil cherry blossom trees and raked stone meditation paths.'
    },
    cyber_plaza: {
      id: 'cyber_plaza',
      name: 'Cyberpunk Plaza',
      category: 'parks',
      cost: 380,
      upkeep: 9,
      happiness: 30,
      desc: 'Neon monuments and holographic art displays with ambient night glow.'
    },
    stadium: {
      id: 'stadium',
      name: 'Sports Stadium',
      category: 'parks',
      cost: 2800,
      upkeep: 110,
      happiness: 65,
      desc: 'Major sports venue. Draws crowds, boosts city fame and tourist mood.'
    },
    city_hall: {
      id: 'city_hall',
      name: 'Grand City Hall',
      category: 'landmarks',
      cost: 1200,
      upkeep: 30,
      desc: 'Seat of municipal government. Grants a city-wide +10% happiness aura.'
    },
    clock_tower: {
      id: 'clock_tower',
      name: 'Historic Clock Tower',
      category: 'landmarks',
      cost: 850,
      upkeep: 18,
      desc: 'Charming historic timepiece tower admired by locals and visitors.'
    },
    monolith: {
      id: 'monolith',
      name: 'Apex Sky Spire',
      category: 'landmarks',
      cost: 3500,
      upkeep: 120,
      desc: 'Magnificent architectural wonder touching the clouds.'
    }
  },

  // News ticker sample headlines
  NEWS_TICKER: [
    "MAYOR ANNOUNCES NEW MUNICIPAL REFORMS: 'EVERYONE GETS CLEAN WATER OR ELSE'",
    "LOCAL SCIENTISTS CLAIM ISOMETRIC GRID PROJECTION LEADS TO 20% MORE PRODUCTIVITY",
    "POLL FINDS 94% OF CITIZENS PREFER ROADS OVER TREK THROUGH SWAMPS",
    "NEW CAFE OPENS DOWNTOWN; BARISTA APOLOGIZES FOR LACK OF EXTRA CARAMEL",
    "CITY BUDGET COMMITTEE REPORTS: 'COLLECTING TAXES IS BETTER THAN NOT'",
    "LLAMA SPOTTED WALKING PAST CITY HALL, DECLARED HONORARY VICE MAYOR",
    "TRAFFIC FLOW REPORT: ALL CARS OBSERVE PERFECT 45-DEGREE ANGLE TURNS",
    "SUNNY SKIES EXPECTED OVER THE METROPOLIS THIS ENTIRE SIMULATION CYCLE",
    "ARCHITECTURAL FORUM VOTES OVERWHELMINGLY IN FAVOR OF MIXING HAUSSMANN WITH CYBERPUNK",
    "FIRE CHIEF REMINDS EVERYONE: 'DO NOT LEAVE TOASTERS UNATTENDED IN WOODEN HOUSES'"
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
