// src/config/destinations.js

export const destinations = [
  {
    id: 'dest_moon',
    name: 'Moon',
    caption: 'Moon',
    visualStyle: 'moon', // CSS class identifier
    position: { x: 35, y: 80 }, // Moved up slightly
    color: '#c0c0c0', // Silver grey
    motion: null // No special motion
  },
  {
    id: 'dest_mars_compound', // Updated ID for clarity
    name: 'Mars System', // Updated name
    position: { x: 80, y: 75 }, // Moved down towards bottom right
    parentBody: { // Mars Planet
      visualStyle: 'planet_mars',
      size: 40, // Made smaller
      color: '#b22222', // Firebrick red for Mars
      caption: 'Mars'
    },
    childBody: { // Orbiting Outpost
      visualStyle: 'orbiting_outpost',
      size: 15, // Example size
      color: '#add8e6', // Light blue / metallic for outpost
      caption: 'Mars Outpost', // Keep specific caption for potential future use
      motion: { type: 'orbit', speed: 5 } // Example orbit animation speed (e.g., 5 seconds)
    }
    // Removed top-level visualStyle, color, caption, motion for this compound entry
  },
  {
    id: 'dest_satellite',
    name: 'Deep Space Satellite',
    caption: 'Satellite',
    visualStyle: 'satellite',
    position: { x: 50, y: 55 }, // Moved higher
    color: '#add8e6', // Light blue / metallic
    motion: { type: 'pulse', speed: 0.5 } // Example: slow pulse
  },
  {
    id: 'dest_proxima_outpost',
    name: 'Proxima Centauri Outpost',
    // Removed top-level visualStyle, color, caption, motion
    position: { x: 30, y: 35 }, // Moved further 'away' (up)
    parentBody: { // Small Planet
      visualStyle: 'small_planet', // New style needed
      size: 30, // Example size
      color: '#d2b48c', // Tan/Brownish color for planet
      caption: 'Proxima b' // Example planet name
    },
    childBody: { // Orbiting Station
      visualStyle: 'orbiting_station_iss', // New style needed
      size: 12, // Example size
      color: '#b0c4de', // Light steel blue / metallic grey
      caption: 'Proxima Station',
      motion: { type: 'orbit', speed: 8 } // Orbit animation speed
    }
  },
  {
    id: 'dest_alien_planet',
    name: 'Exoplanet Kepler-186f', // Example name
    caption: 'Alien Planet',
    visualStyle: 'alien_planet',
    position: { x: 20, y: 25 }, // Moved left and further 'away' (up)
    color: '#00fa9a', // Medium spring green
    motion: { type: 'rotate', speed: 0.05 } // Example: slow rotation
  },
  {
    id: 'dest_mega_structure',
    name: 'Galactic Core Structure',
    caption: 'Mega Structure',
    visualStyle: 'mega_structure',
    position: { x: 65, y: 15 }, // Moved right and further 'away' (up)
    color: '#00ffff', // Cyan
    motion: { type: 'shimmer', speed: 1 } // Example: shimmering effect
  }
];