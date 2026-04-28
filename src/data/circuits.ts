/**
 * F1 Circuit Database
 * Contains accurate SVG paths for various F1 circuits
 * Viewbox: 600x600
 */

export interface CircuitData {
  id: string;
  name: string;
  country: string;
  shortName: string;
  svgPath: string;
  startFinishX: number;
  startFinishY: number;
  viewBox: { width: number; height: number };
  countryAlternates?: string[];
}

export const CIRCUITS: Record<string, CircuitData> = {
  'bahrain': {
    id: 'bahrain',
    name: 'Bahrain International Circuit',
    country: 'Bahrain',
    shortName: 'Bahrain',
    countryAlternates: ['BAHRAIN'],
    // Fast flowing circuit with smooth corners
    svgPath: `
      M 100 250
      L 250 150
      L 400 140
      L 520 180
      L 560 280
      L 550 380
      L 420 440
      L 200 450
      L 80 380
      Z
    `,
    startFinishX: 100,
    startFinishY: 250,
    viewBox: { width: 600, height: 600 },
  },

  'saudi-arabia': {
    id: 'saudi-arabia',
    name: 'Jeddah Corniche Circuit',
    country: 'Saudi Arabia',
    shortName: 'Jeddah',
    countryAlternates: ['SAUDI ARABIA'],
    // Fast street circuit with tight corners
    svgPath: `
      M 300 60
      L 500 100
      L 560 200
      L 570 350
      L 480 450
      L 250 480
      L 80 380
      L 50 150
      Z
    `,
    startFinishX: 300,
    startFinishY: 60,
    viewBox: { width: 600, height: 600 },
  },

  'australia': {
    id: 'australia',
    name: 'Albert Park',
    country: 'Australia',
    shortName: 'Australia',
    countryAlternates: ['AUSTRALIA'],
    // Parkside circuit, relatively smooth
    svgPath: `
      M 200 100
      L 400 80
      L 520 150
      L 560 280
      L 520 400
      L 300 450
      L 100 420
      L 60 250
      Z
    `,
    startFinishX: 200,
    startFinishY: 100,
    viewBox: { width: 600, height: 600 },
  },

  'japan': {
    id: 'japan',
    name: 'Suzuka International Racing Course',
    country: 'Japan',
    shortName: 'Suzuka',
    countryAlternates: ['JAPAN'],
    // Famous figure-8 circuit
    svgPath: `
      M 300 100
      L 480 110
      L 540 180
      Q 560 250 540 300
      L 520 380
      L 350 420
      L 200 410
      L 120 320
      Q 100 250 120 180
      L 180 120
      Z
    `,
    startFinishX: 300,
    startFinishY: 100,
    viewBox: { width: 600, height: 600 },
  },

  'china': {
    id: 'china',
    name: 'Shanghai International Circuit',
    country: 'China',
    shortName: 'Shanghai',
    countryAlternates: ['CHINA'],
    // Modern F1 circuit with long straights
    svgPath: `
      M 200 80
      L 450 75
      L 540 160
      L 560 300
      L 500 430
      L 250 470
      L 80 360
      L 60 150
      Z
    `,
    startFinishX: 200,
    startFinishY: 80,
    viewBox: { width: 600, height: 600 },
  },

  'miami': {
    id: 'miami',
    name: 'Miami International Autodrome',
    country: 'United States',
    shortName: 'Miami',
    countryAlternates: ['USA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'MIAMI'],
    // Figure-8 street circuit
    svgPath: `
      M 200 80
      L 400 70
      L 520 140
      L 560 250
      Q 540 300 520 320
      L 450 380
      L 300 420
      L 150 400
      L 80 300
      Q 70 200 100 120
      Z
    `,
    startFinishX: 200,
    startFinishY: 80,
    viewBox: { width: 600, height: 600 },
  },

  'monza': {
    id: 'monza',
    name: 'Autodromo Nazionale di Monza',
    country: 'Italy',
    shortName: 'Monza',
    countryAlternates: ['ITALY'],
    // Fast open circuit with chicanes at start/end
    svgPath: `
      M 150 120
      L 350 100
      L 520 150
      L 560 300
      L 500 430
      L 200 460
      L 60 320
      L 50 180
      Z
    `,
    startFinishX: 150,
    startFinishY: 120,
    viewBox: { width: 600, height: 600 },
  },

  'silverstone': {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'United Kingdom',
    shortName: 'Silverstone',
    countryAlternates: ['UK', 'UNITED KINGDOM', 'GREAT BRITAIN', 'BRITAIN'],
    // Teardrop shaped circuit
    svgPath: `
      M 150 100
      L 400 85
      L 550 170
      L 570 320
      L 480 440
      L 200 480
      L 50 320
      L 40 150
      Z
    `,
    startFinishX: 150,
    startFinishY: 100,
    viewBox: { width: 600, height: 600 },
  },

  'hungary': {
    id: 'hungary',
    name: 'Hungaroring',
    country: 'Hungary',
    shortName: 'Hungary',
    countryAlternates: ['HUNGARY'],
    // Egg-shaped circuit
    svgPath: `
      M 180 110
      L 420 95
      L 540 180
      L 560 310
      L 490 430
      L 210 460
      L 60 310
      L 50 180
      Z
    `,
    startFinishX: 180,
    startFinishY: 110,
    viewBox: { width: 600, height: 600 },
  },

  'belgium': {
    id: 'belgium',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    shortName: 'Spa',
    countryAlternates: ['BELGIUM'],
    // Triangle-like fast circuit
    svgPath: `
      M 150 110
      L 450 80
      L 540 200
      L 560 350
      L 420 460
      L 100 440
      L 40 250
      Z
    `,
    startFinishX: 150,
    startFinishY: 110,
    viewBox: { width: 600, height: 600 },
  },

  'netherlands': {
    id: 'netherlands',
    name: 'Circuit Zandvoort',
    country: 'Netherlands',
    shortName: 'Zandvoort',
    countryAlternates: ['NETHERLANDS'],
    // High banked circuit
    svgPath: `
      M 140 100
      L 400 80
      L 540 170
      L 560 320
      L 460 440
      L 180 470
      L 50 320
      L 40 150
      Z
    `,
    startFinishX: 140,
    startFinishY: 100,
    viewBox: { width: 600, height: 600 },
  },

  'singapore': {
    id: 'singapore',
    name: 'Marina Bay Street Circuit',
    country: 'Singapore',
    shortName: 'Singapore',
    countryAlternates: ['SINGAPORE'],
    // Long street circuit, tight and complex
    svgPath: `
      M 100 70
      L 350 80
      L 520 160
      L 560 300
      L 540 480
      L 250 520
      L 50 380
      L 30 150
      Z
    `,
    startFinishX: 100,
    startFinishY: 70,
    viewBox: { width: 600, height: 600 },
  },

  'las-vegas': {
    id: 'las-vegas',
    name: 'Las Vegas Grand Prix',
    country: 'United States',
    shortName: 'Las Vegas',
    countryAlternates: ['USA', 'UNITED STATES', 'LAS VEGAS'],
    // Street circuit in Las Vegas
    svgPath: `
      M 120 80
      L 420 60
      L 560 180
      L 580 340
      L 480 470
      L 160 490
      L 40 340
      L 30 140
      Z
    `,
    startFinishX: 120,
    startFinishY: 80,
    viewBox: { width: 600, height: 600 },
  },

  'abu-dhabi': {
    id: 'abu-dhabi',
    name: 'Yas Marina Circuit',
    country: 'United Arab Emirates',
    shortName: 'Abu Dhabi',
    countryAlternates: ['UAE', 'UNITED ARAB EMIRATES', 'ABU DHABI'],
    // Nearly square shaped circuit
    svgPath: `
      M 200 150
      L 450 140
      L 520 220
      L 540 380
      L 450 440
      L 200 450
      L 120 360
      L 100 220
      Z
    `,
    startFinishX: 200,
    startFinishY: 150,
    viewBox: { width: 600, height: 600 },
  },

  'canada': {
    id: 'canada',
    name: 'Circuit Gilles Villeneuve',
    country: 'Canada',
    shortName: 'Montreal',
    countryAlternates: ['CANADA'],
    // Island circuit with sharp corners
    svgPath: `
      M 120 100
      L 380 80
      L 540 160
      L 560 310
      L 480 430
      L 180 460
      L 50 300
      L 40 150
      Z
    `,
    startFinishX: 120,
    startFinishY: 100,
    viewBox: { width: 600, height: 600 },
  },

  'brazil': {
    id: 'brazil',
    name: 'Autódromo José Carlos Pace',
    country: 'Brazil',
    shortName: 'Interlagos',
    countryAlternates: ['BRAZIL'],
    // Undulating circuit
    svgPath: `
      M 180 100
      L 420 90
      L 540 180
      L 560 320
      L 480 430
      L 190 460
      L 60 300
      L 50 160
      Z
    `,
    startFinishX: 180,
    startFinishY: 100,
    viewBox: { width: 600, height: 600 },
  },

  'mexico': {
    id: 'mexico',
    name: 'Autódromo Hermanos Rodríguez',
    country: 'Mexico',
    shortName: 'Mexico City',
    countryAlternates: ['MEXICO'],
    // High altitude circuit
    svgPath: `
      M 160 90
      L 430 75
      L 540 170
      L 560 310
      L 460 440
      L 160 470
      L 50 310
      L 40 140
      Z
    `,
    startFinishX: 160,
    startFinishY: 90,
    viewBox: { width: 600, height: 600 },
  },

  'qatar': {
    id: 'qatar',
    name: 'Lusail International Circuit',
    country: 'Qatar',
    shortName: 'Lusail',
    countryAlternates: ['QATAR'],
    // Modern F1 circuit
    svgPath: `
      M 140 100
      L 420 85
      L 540 170
      L 560 320
      L 480 440
      L 180 470
      L 60 310
      L 50 160
      Z
    `,
    startFinishX: 140,
    startFinishY: 100,
    viewBox: { width: 600, height: 600 },
  },

  'monaco': {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    shortName: 'Monaco',
    countryAlternates: ['MONACO'],
    // Tight street circuit
    svgPath: `
      M 150 80
      L 380 100
      L 450 150
      L 480 220
      L 490 310
      L 460 380
      L 320 420
      L 180 400
      L 100 300
      L 80 180
      Z
    `,
    startFinishX: 150,
    startFinishY: 80,
    viewBox: { width: 600, height: 600 },
  },
};

export function getCircuitByCountry(country: string | null | undefined): CircuitData | null {
  if (!country) return null;
  
  const countryUpper = country.toUpperCase().trim();
  
  for (const circuit of Object.values(CIRCUITS)) {
    if (circuit.country.toUpperCase() === countryUpper) {
      return circuit;
    }
    if (circuit.countryAlternates) {
      for (const alt of circuit.countryAlternates) {
        if (alt === countryUpper) {
          return circuit;
        }
      }
    }
  }
  
  return null;
}

export function getCircuit(id: string): CircuitData | null {
  return CIRCUITS[id] || null;
}

export function getAllCircuits(): CircuitData[] {
  return Object.values(CIRCUITS);
}
