/**
 * F1 Circuit Database
 * Contains realistic SVG path approximations for F1 circuits
 * All paths are designed for a 900x700 viewBox
 */
import type { Session } from '../types/f1';

export interface CircuitData {
  id: string;
  name: string;
  country: string;
  shortName: string;
  svgPath: string;
  countryAlternates?: string[];
  circuitAlternates?: string[];
}

export const CIRCUITS: Record<string, CircuitData> = {
  'bahrain': {
    id: 'bahrain',
    name: 'Bahrain International Circuit',
    country: 'Bahrain',
    shortName: 'Bahrain',
    countryAlternates: ['BAHRAIN'],
    circuitAlternates: ['SAKHIR', 'BAHRAIN INTERNATIONAL CIRCUIT'],
    // Sakhir: distinctive hairpin at T10, series of tight corners
    svgPath: `M 350 120 L 600 120 L 650 160 L 650 250 L 700 280 L 700 350 L 650 380 L 650 420 L 580 450 L 580 520 Q 560 560 520 560 L 400 560 L 350 520 L 350 460 Q 320 430 280 430 L 230 430 Q 200 400 200 360 L 200 280 Q 200 240 240 220 L 300 200 L 350 160 Z`,
  },
  'saudi-arabia': {
    id: 'saudi-arabia',
    name: 'Jeddah Corniche Circuit',
    country: 'Saudi Arabia',
    shortName: 'Jeddah',
    countryAlternates: ['SAUDI ARABIA'],
    // Jeddah: long, fast street circuit along the corniche
    svgPath: `M 200 100 L 250 100 Q 280 100 300 120 L 400 250 Q 420 280 450 280 L 650 280 Q 700 280 720 310 L 750 400 Q 760 440 740 470 L 680 550 Q 650 580 610 580 L 400 580 Q 360 580 340 550 L 280 460 Q 260 430 230 430 L 180 430 Q 140 430 130 400 L 120 320 Q 110 280 130 250 L 170 180 Q 180 140 200 100 Z`,
  },
  'australia': {
    id: 'australia',
    name: 'Albert Park Circuit',
    country: 'Australia',
    shortName: 'Melbourne',
    countryAlternates: ['AUSTRALIA'],
    circuitAlternates: ['MELBOURNE', 'ALBERT PARK'],
    // Albert Park: lake-hugging layout, fast corners then chicanes
    svgPath: `M 300 100 L 500 100 Q 560 100 580 140 L 620 220 Q 640 260 640 300 L 640 400 Q 640 440 610 460 L 540 510 Q 500 530 460 530 L 380 540 Q 340 540 310 520 L 240 470 Q 200 440 180 400 L 160 340 Q 150 300 160 260 L 180 200 Q 200 150 240 120 L 300 100 Z`,
  },
  'japan': {
    id: 'japan',
    name: 'Suzuka International Racing Course',
    country: 'Japan',
    shortName: 'Suzuka',
    countryAlternates: ['JAPAN'],
    // Suzuka: famous figure-8 layout with crossover
    svgPath: `M 300 180 Q 250 140 200 160 Q 140 190 120 260 Q 100 330 140 390 Q 180 440 250 450 Q 310 460 360 430 L 420 390 L 480 340 L 540 310 Q 590 290 640 310 Q 700 340 720 410 Q 740 480 700 540 Q 660 590 590 600 Q 520 610 460 580 L 400 540 L 340 490 L 300 450 Q 350 400 400 360 L 460 310 Q 500 270 520 220 Q 530 180 500 150 Q 460 120 400 130 Q 350 140 300 180 Z`,
  },
  'china': {
    id: 'china',
    name: 'Shanghai International Circuit',
    country: 'China',
    shortName: 'Shanghai',
    countryAlternates: ['CHINA'],
    // Shanghai: distinctive long turn 1-2-3 complex, back straight
    svgPath: `M 350 120 Q 300 120 260 160 Q 200 220 180 300 Q 160 380 200 430 Q 240 480 300 500 L 400 520 Q 450 530 500 520 L 600 480 Q 650 460 680 420 L 720 340 Q 740 280 710 230 Q 680 180 630 160 L 550 140 Q 500 130 450 140 L 400 160 Q 380 170 370 160 L 350 120 Z`,
  },
  'miami': {
    id: 'miami',
    name: 'Miami International Autodrome',
    country: 'United States',
    shortName: 'Miami',
    countryAlternates: ['USA', 'UNITED STATES', 'UNITED STATES OF AMERICA', 'MIAMI'],
    circuitAlternates: ['MIAMI INTERNATIONAL AUTODROME'],
    // Miami: stadium section, chicane, long straights
    svgPath: `M 200 150 L 550 150 Q 600 150 630 180 L 700 260 Q 720 290 720 330 L 720 420 Q 720 470 680 500 L 600 550 Q 560 570 510 570 L 350 570 Q 300 570 270 540 L 200 460 Q 170 420 170 370 L 170 250 Q 170 200 200 170 Z`,
  },
  'monza': {
    id: 'monza',
    name: 'Autodromo Nazionale di Monza',
    country: 'Italy',
    shortName: 'Monza',
    countryAlternates: ['ITALY'],
    // Monza: Temple of Speed – very long straights, tight chicanes
    svgPath: `M 200 200 L 650 120 Q 690 115 710 140 L 740 200 Q 750 230 730 260 L 680 320 Q 660 340 660 370 L 670 420 Q 680 460 660 490 L 600 560 Q 570 590 530 590 L 350 600 Q 300 600 270 570 L 220 500 Q 200 470 200 430 L 210 360 Q 220 320 200 290 L 170 250 Q 150 220 170 200 Z`,
  },
  'silverstone': {
    id: 'silverstone',
    name: 'Silverstone Circuit',
    country: 'United Kingdom',
    shortName: 'Silverstone',
    countryAlternates: ['UK', 'UNITED KINGDOM', 'GREAT BRITAIN', 'BRITAIN'],
    // Silverstone: Maggots/Becketts complex, fast and flowing
    svgPath: `M 350 100 L 550 100 Q 600 100 630 130 L 700 210 Q 730 250 730 300 L 720 370 Q 710 420 670 450 L 580 510 Q 540 530 500 540 L 380 560 Q 330 560 290 530 L 220 470 Q 180 430 160 380 L 140 300 Q 130 250 150 210 L 200 150 Q 230 120 270 110 L 350 100 Z`,
  },
  'hungary': {
    id: 'hungary',
    name: 'Hungaroring',
    country: 'Hungary',
    shortName: 'Hungary',
    countryAlternates: ['HUNGARY'],
    circuitAlternates: ['HUNGARORING'],
    // Hungaroring: tight and twisty, like a kart track
    svgPath: `M 400 100 L 550 120 Q 600 130 630 170 L 680 260 Q 700 310 680 360 L 640 430 Q 610 470 560 490 L 480 520 Q 430 530 380 520 L 300 490 Q 250 470 220 430 L 190 370 Q 170 320 190 270 L 230 190 Q 260 140 310 120 L 400 100 Z`,
  },
  'belgium': {
    id: 'belgium',
    name: 'Circuit de Spa-Francorchamps',
    country: 'Belgium',
    shortName: 'Spa',
    countryAlternates: ['BELGIUM'],
    circuitAlternates: ['SPA-FRANCORCHAMPS', 'SPA FRANCORCHAMPS'],
    // Spa: Eau Rouge, long Kemmel straight, sweeping through Ardennes
    svgPath: `M 150 400 L 150 250 Q 150 200 180 170 L 250 120 Q 280 100 320 100 L 500 100 Q 540 100 560 130 L 620 220 Q 640 260 680 270 L 750 280 Q 780 290 780 320 L 770 420 Q 760 460 730 480 L 650 530 Q 600 560 540 560 L 350 570 Q 290 570 250 530 L 180 450 Q 160 430 150 400 Z`,
  },
  'netherlands': {
    id: 'netherlands',
    name: 'Circuit Zandvoort',
    country: 'Netherlands',
    shortName: 'Zandvoort',
    countryAlternates: ['NETHERLANDS'],
    // Zandvoort: banked turns, flowing through dunes
    svgPath: `M 300 130 L 500 120 Q 560 120 600 160 L 670 250 Q 700 300 690 360 L 660 440 Q 630 490 570 510 L 450 540 Q 390 550 330 530 L 250 490 Q 200 460 180 400 L 160 320 Q 150 260 180 210 L 240 150 Q 270 130 300 130 Z`,
  },
  'singapore': {
    id: 'singapore',
    name: 'Marina Bay Street Circuit',
    country: 'Singapore',
    shortName: 'Singapore',
    countryAlternates: ['SINGAPORE'],
    circuitAlternates: ['MARINA BAY', 'MARINA BAY STREET CIRCUIT'],
    // Marina Bay: tight street circuit, many 90-degree turns
    svgPath: `M 250 130 L 600 130 L 650 130 Q 680 130 700 160 L 720 220 L 720 350 Q 720 400 680 430 L 620 480 L 550 480 L 550 550 Q 550 580 520 600 L 400 600 Q 360 600 340 570 L 300 500 L 250 500 Q 200 500 180 470 L 150 400 L 150 250 Q 150 190 200 160 L 250 130 Z`,
  },
  'las-vegas': {
    id: 'las-vegas',
    name: 'Las Vegas Grand Prix',
    country: 'United States',
    shortName: 'Las Vegas',
    countryAlternates: ['LAS VEGAS'],
    circuitAlternates: ['LAS VEGAS STRIP CIRCUIT'],
    // Las Vegas Strip: long straight down the Strip, tight corners
    svgPath: `M 200 100 L 650 100 Q 700 100 720 140 L 740 220 Q 750 260 730 290 L 680 350 Q 650 380 650 420 L 660 500 Q 660 550 620 570 L 500 600 Q 460 610 420 600 L 300 560 Q 260 540 240 500 L 200 400 Q 180 350 180 300 L 180 200 Q 180 140 200 100 Z`,
  },
  'abu-dhabi': {
    id: 'abu-dhabi',
    name: 'Yas Marina Circuit',
    country: 'United Arab Emirates',
    shortName: 'Abu Dhabi',
    countryAlternates: ['UAE', 'UNITED ARAB EMIRATES', 'ABU DHABI'],
    circuitAlternates: ['YAS MARINA', 'YAS MARINA CIRCUIT'],
    // Yas Marina: hotel section, harbor chicane, long straights
    svgPath: `M 300 140 L 500 120 Q 560 115 600 150 L 680 240 Q 710 280 710 330 L 700 420 Q 690 470 650 500 L 560 560 Q 510 580 450 580 L 340 570 Q 280 560 240 520 L 190 440 Q 160 390 170 330 L 190 260 Q 210 200 260 170 L 300 140 Z`,
  },
  'canada': {
    id: 'canada',
    name: 'Circuit Gilles Villeneuve',
    country: 'Canada',
    shortName: 'Montreal',
    countryAlternates: ['CANADA'],
    circuitAlternates: ['MONTREAL', 'CIRCUIT GILLES VILLENEUVE'],
    // Montreal: Wall of Champions, island circuit, chicanes
    svgPath: `M 250 150 L 550 120 Q 600 115 640 140 L 700 200 Q 730 240 730 290 L 720 380 Q 710 430 670 460 L 580 520 Q 530 550 470 560 L 350 570 Q 290 570 250 540 L 190 480 Q 160 440 150 390 L 140 300 Q 140 240 170 200 L 220 160 Q 240 150 250 150 Z`,
  },
  'brazil': {
    id: 'brazil',
    name: 'Autódromo José Carlos Pace',
    country: 'Brazil',
    shortName: 'Interlagos',
    countryAlternates: ['BRAZIL'],
    circuitAlternates: ['INTERLAGOS', 'JOSE CARLOS PACE'],
    // Interlagos: anti-clockwise, steep elevation, Senna S
    svgPath: `M 550 150 L 350 130 Q 290 125 250 160 L 180 240 Q 150 280 150 330 L 160 420 Q 170 470 210 500 L 300 560 Q 350 590 410 590 L 530 580 Q 590 570 630 530 L 700 440 Q 730 390 720 330 L 690 260 Q 660 210 610 180 L 550 150 Z`,
  },
  'mexico': {
    id: 'mexico',
    name: 'Autódromo Hermanos Rodríguez',
    country: 'Mexico',
    shortName: 'Mexico City',
    countryAlternates: ['MEXICO'],
    circuitAlternates: ['MEXICO CITY', 'HERMANOS RODRIGUEZ'],
    // Mexico: stadium section, Peraltada, long straight
    svgPath: `M 300 120 L 550 120 Q 610 120 640 160 L 700 260 Q 720 310 700 360 L 640 440 Q 600 490 540 510 L 460 540 Q 400 550 340 530 L 260 490 Q 210 450 190 390 L 170 310 Q 160 250 190 200 L 240 150 Q 270 120 300 120 Z`,
  },
  'qatar': {
    id: 'qatar',
    name: 'Lusail International Circuit',
    country: 'Qatar',
    shortName: 'Lusail',
    countryAlternates: ['QATAR'],
    circuitAlternates: ['LUSAIL', 'LOSAIL'],
    // Lusail: flowing medium-speed layout under lights
    svgPath: `M 350 110 L 530 110 Q 580 110 620 150 L 700 260 Q 730 310 720 370 L 690 450 Q 660 500 600 530 L 480 570 Q 420 580 360 560 L 260 510 Q 210 480 190 420 L 170 340 Q 160 280 190 220 L 240 160 Q 280 120 350 110 Z`,
  },
  'monaco': {
    id: 'monaco',
    name: 'Circuit de Monaco',
    country: 'Monaco',
    shortName: 'Monaco',
    countryAlternates: ['MONACO'],
    circuitAlternates: ['MONTE CARLO'],
    // Monaco: tight hairpin, tunnel, chicane, swimming pool
    svgPath: `M 300 140 L 450 120 Q 500 115 530 140 L 580 200 Q 600 240 590 280 L 560 340 Q 540 370 560 400 L 620 450 Q 650 480 640 520 L 600 570 Q 570 600 520 600 L 380 590 Q 330 580 300 550 L 240 480 Q 210 440 200 390 L 190 310 Q 185 260 210 220 L 260 160 Q 280 140 300 140 Z`,
  },
  'spain': {
    id: 'spain',
    name: 'Circuit de Barcelona-Catalunya',
    country: 'Spain',
    shortName: 'Barcelona',
    countryAlternates: ['SPAIN'],
    circuitAlternates: ['CATALUNYA', 'BARCELONA-CATALUNYA', 'BARCELONA CATALUNYA'],
    // Barcelona: flowing layout, final sector chicane
    svgPath: `M 350 120 L 550 110 Q 600 110 640 150 L 710 250 Q 740 300 730 360 L 700 440 Q 670 490 610 520 L 500 560 Q 440 570 380 550 L 280 500 Q 230 470 200 410 L 170 330 Q 155 270 180 210 L 230 150 Q 270 120 350 120 Z`,
  },
  'austria': {
    id: 'austria',
    name: 'Red Bull Ring',
    country: 'Austria',
    shortName: 'Spielberg',
    countryAlternates: ['AUSTRIA'],
    // Red Bull Ring: short, fast, uphill then downhill
    svgPath: `M 350 180 L 500 120 Q 550 100 590 130 L 660 200 Q 690 240 690 290 L 680 380 Q 670 430 630 460 L 550 510 Q 500 530 440 530 L 340 520 Q 280 510 240 470 L 200 400 Q 170 350 180 290 L 210 220 Q 240 180 290 170 L 350 180 Z`,
  },
  'austin': {
    id: 'austin',
    name: 'Circuit of the Americas',
    country: 'United States',
    shortName: 'Austin',
    countryAlternates: ['USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'],
    circuitAlternates: ['COTA', 'CIRCUIT OF THE AMERICAS'],
    svgPath: `M 210 520 L 180 430 L 210 350 L 170 280 L 210 190 L 300 120 L 390 150 L 460 110 L 540 150 L 610 130 L 700 210 L 680 300 L 730 370 L 680 450 L 590 470 L 520 550 L 410 530 L 330 580 L 250 560 Z`,
  },
  'madrid': {
    id: 'madrid',
    name: 'Madring',
    country: 'Spain',
    shortName: 'Madrid',
    countryAlternates: ['SPAIN'],
    circuitAlternates: ['MADRING'],
    svgPath: `M 190 190 L 520 120 Q 610 100 680 170 L 730 260 L 690 330 L 730 410 L 650 500 L 530 530 L 450 590 L 330 550 L 240 580 L 170 500 L 200 410 L 150 330 L 190 250 Z`,
  },
  'azerbaijan': {
    id: 'azerbaijan',
    name: 'Baku City Circuit',
    country: 'Azerbaijan',
    shortName: 'Baku',
    countryAlternates: ['AZERBAIJAN'],
    circuitAlternates: ['BAKU CITY CIRCUIT'],
    svgPath: `M 170 560 L 170 170 L 650 170 L 700 220 L 700 310 L 620 310 L 620 250 L 550 250 L 550 390 L 470 390 L 470 310 L 390 310 L 390 470 L 300 470 L 300 560 Z`,
  },
};

function normalizeCircuitName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

export function getCircuitByCountry(country: string | null | undefined): CircuitData | null {
  if (!country) return null;
  const countryName = normalizeCircuitName(country);
  const matches = Object.values(CIRCUITS).filter(circuit => {
    const countries = [circuit.country, ...(circuit.countryAlternates ?? [])];
    return countries.some(candidate => normalizeCircuitName(candidate) === countryName);
  });
  return matches.length === 1 ? matches[0] : null;
}

export function getCircuitByShortName(shortName: string | null | undefined): CircuitData | null {
  if (!shortName) return null;
  const target = normalizeCircuitName(shortName);
  return Object.values(CIRCUITS).find(circuit => {
    const names = [
      circuit.id,
      circuit.name,
      circuit.shortName,
      ...(circuit.circuitAlternates ?? []),
    ];
    return names.some(name => normalizeCircuitName(name) === target);
  }) ?? null;
}

export function getCircuitForSession(
  session: Pick<Session, 'circuit_short_name' | 'country_name'> | null | undefined,
): CircuitData | null {
  if (!session) return null;
  return getCircuitByShortName(session.circuit_short_name)
    ?? getCircuitByCountry(session.country_name);
}

export function getCircuit(id: string): CircuitData | null {
  return CIRCUITS[id] || null;
}

export function getAllCircuits(): CircuitData[] {
  return Object.values(CIRCUITS);
}
