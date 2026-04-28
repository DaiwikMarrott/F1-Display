/**
 * F1 Circuit Database
 * Contains accurate SVG paths for various F1 circuits
 * All paths are optimized for 900x700 viewBox
 */

export interface CircuitData {
  id: string;
  name: string;
  country: string;
  shortName: string;
  svgPath: string;
  countryAlternates?: string[];
}

export const CIRCUITS: Record<string, CircuitData> = {
  'bahrain': {
    id: 'bahrain',
    name: 'Bahrain International Circuit',
    country: 'Bahrain',
    shortName: 'Bahrain',
    countryAlternates: ['BAHRAIN'],
    svgPath: `
      M 150 300 
      L 350 180 
      L 550 170 
      L 700 240 
      L 750 380 
      L 700 520 
      L 500 580 
      L 250 570 
      L 100 480 
      Z
    `,
  },

  'saudi-arabia': {
    id: 'saudi-arabia',
    name: 'Jeddah Corniche Circuit',
    country: 'Saudi Arabia',
    shortName: 'Jeddah',
    countryAlternates: ['SAUDI ARABIA'],
    svgPath: `
      M 400 80 
      L 650 130 
      L 750 260 
      L 780 450 
      L 650 600 
      L 350 620 
      L 100 480 
      L 70 200 
      Z
    `,
  },

  'australia': {
    id: 'australia',
    name: 'Albert Park',
    country: 'Australia',
    shortName: 'Australia',
    countryAlternates: ['AUSTRALIA'],
    svgPath: `
      M 250 120 
      L 500 100 
      L 680 180 
      L 750 350 
      L 700 520 
      L 380 580 
      L 120 550 
      L 60 320 
      Z
    `,
  },

  'japan': {
    id: 'japan',
    name: 'Suzuka International Racing Course',
    country: 'Japan',
    shortName: 'Suzuka',
    countryAlternates: ['JAPAN'],
    // Figure-8 layout
    svgPath: `
      M 400 120 
      L 620 130 
      L 720 220 
      Q 760 280 750 340
      L 700 480 
      L 450 540 
      L 250 530 
      L 140 420 
      Q 110 320 140 220 
      L 220 140 
      Z
    `,
  },

  'china': {
    id: 'china',
    name: 'Shanghai International Circuit',
    country: 'China',
    shortName: 'Shanghai',
    countryAlternates: ['CHINA'],
    svgPath: `
      M 250 100 
      L 580 85 
      L 720 200 
      L 760 380 
      L 680 560 
      L 320 600 
      L 80 450 
      L 60 180 
      Z
    `,
  },

  'miami': {
    id: 'miami',
    name: 'Miami International Autodrome',
    country: 'United States',
    shortName: 'Miami',
    countryAlternates: ['USA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'MIAMI'],
    svgPath: `
      M 260 100 
      L 520 80 
      L 700 180 
      L 760 340 
      Q 740 380 700 400
      L 580 480 
      L 380 540 
      L 180 520 
      L 100 380 
      Q 90 240 130 150 
      Z
    `,
  },

  'monza': {
    id: 'monza',
    name: 'Autodromo Nazionale di Monza',
    country: 'Italy',
    shortName: 'Monza',
    countryAlternates: ['ITALY'],
    svgPath: `
      M 200 150 
      L 450 120 
      L 700 180 
      L 760 380 
      L 680 550 
      L 280 590 
      L 80 420 
      L 60 240 
      Z
    `,
  },

  'silverstone': {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'United Kingdom',
    shortName: 'Silverstone',
    countryAlternates: ['UK', 'UNITED KINGDOM', 'GREAT BRITAIN', 'BRITAIN'],
    svgPath: `
      M 200 130 
      L 520 110 
      L 720 220 
      L 780 420 
      L 650 600 
      L 260 620 
      L 50 420 
      L 40 200 
      Z
    `,
  },

  'hungary': {
    id: 'hungary',
    name: 'Hungaroring',
    country: 'Hungary',
    shortName: 'Hungary',
    countryAlternates: ['HUNGARY'],
    svgPath: `
      M 220 140 
      L 560 110 
      L 720 220 
      L 760 400 
      L 680 560 
      L 280 600 
      L 80 400 
      L 60 220 
      Z
    `,
  },

  'belgium': {
    id: 'belgium',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    shortName: 'Spa',
    countryAlternates: ['BELGIUM'],
    svgPath: `
      M 200 140 
      L 580 100 
      L 720 250 
      L 760 450 
      L 570 600 
      L 120 580 
      L 50 320 
      Z
    `,
  },

  'netherlands': {
    id: 'netherlands',
    name: 'Circuit Zandvoort',
    country: 'Netherlands',
    shortName: 'Zandvoort',
    countryAlternates: ['NETHERLANDS'],
    svgPath: `
      M 180 130 
      L 520 100 
      L 720 210 
      L 760 400 
      L 620 580 
      L 240 610 
      L 50 410 
      L 40 180 
      Z
    `,
  },

  'singapore': {
    id: 'singapore',
    name: 'Marina Bay Street Circuit',
    country: 'Singapore',
    shortName: 'Singapore',
    countryAlternates: ['SINGAPORE'],
    svgPath: `
      M 120 80 
      L 450 100 
      L 680 200 
      L 740 380 
      L 720 600 
      L 320 650 
      L 50 480 
      L 30 180 
      Z
    `,
  },

  'las-vegas': {
    id: 'las-vegas',
    name: 'Las Vegas Grand Prix',
    country: 'United States',
    shortName: 'Las Vegas',
    countryAlternates: ['USA', 'UNITED STATES', 'LAS VEGAS'],
    svgPath: `
      M 160 100 
      L 540 75 
      L 740 220 
      L 780 430 
      L 650 600 
      L 210 630 
      L 50 420 
      L 40 170 
      Z
    `,
  },

  'abu-dhabi': {
    id: 'abu-dhabi',
    name: 'Yas Marina Circuit',
    country: 'United Arab Emirates',
    shortName: 'Abu Dhabi',
    countryAlternates: ['UAE', 'UNITED ARAB EMIRATES', 'ABU DHABI'],
    svgPath: `
      M 260 190 
      L 580 170 
      L 700 280 
      L 740 480 
      L 610 580 
      L 260 600 
      L 140 460 
      L 120 280 
      Z
    `,
  },

  'canada': {
    id: 'canada',
    name: 'Circuit Gilles Villeneuve',
    country: 'Canada',
    shortName: 'Montreal',
    countryAlternates: ['CANADA'],
    svgPath: `
      M 160 130 
      L 500 100 
      L 720 200 
      L 760 400 
      L 650 580 
      L 240 610 
      L 60 380 
      L 50 190 
      Z
    `,
  },

  'brazil': {
    id: 'brazil',
    name: 'Autódromo José Carlos Pace',
    country: 'Brazil',
    shortName: 'Interlagos',
    countryAlternates: ['BRAZIL'],
    svgPath: `
      M 220 130 
      L 540 110 
      L 720 220 
      L 760 400 
      L 660 580 
      L 240 610 
      L 80 380 
      L 60 200 
      Z
    `,
  },

  'mexico': {
    id: 'mexico',
    name: 'Autódromo Hermanos Rodríguez',
    country: 'Mexico',
    shortName: 'Mexico City',
    countryAlternates: ['MEXICO'],
    svgPath: `
      M 200 120 
      L 560 95 
      L 720 210 
      L 760 400 
      L 630 580 
      L 210 610 
      L 60 400 
      L 50 160 
      Z
    `,
  },

  'qatar': {
    id: 'qatar',
    name: 'Lusail International Circuit',
    country: 'Qatar',
    shortName: 'Lusail',
    countryAlternates: ['QATAR'],
    svgPath: `
      M 180 130 
      L 540 110 
      L 720 220 
      L 760 400 
      L 660 580 
      L 240 610 
      L 80 400 
      L 60 200 
      Z
    `,
  },

  'monaco': {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    shortName: 'Monaco',
    countryAlternates: ['MONACO'],
    // Tight street circuit
    svgPath: `
      M 200 100 
      L 480 130 
      L 580 190 
      L 620 280 
      L 640 400 
      L 600 490 
      L 420 540 
      L 250 520 
      L 140 380 
      L 120 220 
      Z
    `,
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
