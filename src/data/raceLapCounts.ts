import type { Session } from '../types/f1';
import { isRaceSession } from '../domain/sessionSelection';

const LAP_COUNTS: Record<string, number> = {
  sakhir: 57,
  jeddah: 50,
  melbourne: 58,
  suzuka: 53,
  shanghai: 56,
  miami: 57,
  'imola': 63,
  'monte carlo': 78,
  monaco: 78,
  catalunya: 66,
  spielberg: 71,
  silverstone: 52,
  'spa-francorchamps': 44,
  hungaroring: 70,
  zandvoort: 72,
  monza: 53,
  baku: 51,
  singapore: 62,
  austin: 56,
  'mexico city': 71,
  interlagos: 71,
  'las vegas': 50,
  lusail: 57,
  'yas marina circuit': 58,
  'yas marina': 58,
  montreal: 70,
};

function normalizeCircuit(value: string): string {
  return value.trim().toLowerCase();
}

export function getRaceLapCount(session: Session | null): number | null {
  if (!session || !isRaceSession(session)) return null;
  return LAP_COUNTS[normalizeCircuit(session.circuit_short_name)] ?? null;
}
