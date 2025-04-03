// src/config/destinations.js

export const destinations = [
  {
    id: 'dest_moon',
    name: 'Moon',
    caption: 'Moon',
    visualStyle: 'moon', // CSS class identifier
    position: { x: 35, y: 95 }, // Moved right, Inverted Y for distance
    color: '#c0c0c0', // Silver grey
    motion: null // No special motion
  },
  {
    id: 'dest_mars_compound', // Updated ID for clarity
    name: 'Mars System', // Updated name
    position: { x: 80, y: 85 }, // Position for Mars (parent) - Moved right, Inverted Y
    parentBody: { // Mars Planet
      visualStyle: 'planet_mars',
      size: 60, // Example size
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
    position: { x: 50, y: 70 }, // Inverted Y for distance
    color: '#add8e6', // Light blue / metallic
    motion: { type: 'pulse', speed: 0.5 } // Example: slow pulse
  },
  {
    id: 'dest_proxima_outpost',
    name: 'Proxima Centauri Outpost',
    caption: 'Proxima Outpost',
    visualStyle: 'alien_outpost',
    position: { x: 30, y: 55 }, // Inverted Y for distance
    color: '#9400d3', // Dark violet
    motion: null
  },
  {
    id: 'dest_alien_planet',
    name: 'Exoplanet Kepler-186f', // Example name
    caption: 'Alien Planet',
    visualStyle: 'alien_planet',
    position: { x: 70, y: 40 }, // Inverted Y for distance
    color: '#00fa9a', // Medium spring green
    motion: { type: 'rotate', speed: 0.05 } // Example: slow rotation
  },
  {
    id: 'dest_mega_structure',
    name: 'Galactic Core Structure',
    caption: 'Mega Structure',
    visualStyle: 'mega_structure',
    position: { x: 50, y: 25 }, // Inverted Y for distance
    color: '#ffd700', // Gold
    motion: { type: 'shimmer', speed: 1 } // Example: shimmering effect
  }
];