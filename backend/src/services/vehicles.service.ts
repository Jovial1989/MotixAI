import { prisma } from '../config/database';

export class VehiclesService {
  async search(q: string) {
    return prisma.vehicleModel.findMany({
      where: {
        OR: [
          { make: { contains: q, mode: 'insensitive' } },
          { model: { contains: q, mode: 'insensitive' } },
          { vin: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
    });
  }

  async decodeVin(vin: string) {
    // Extension point: integrate NHTSA / CARFAX / enterprise VIN decoder
    // For now, return parsed structure from VIN format
    const year = this.vinToYear(vin);
    return { vin, year, make: null, model: null, note: 'VIN decoder connector not configured' };
  }

  private vinToYear(vin: string): number | null {
    const yearChar = vin[9];
    if (!yearChar) return null;
    const map: Record<string, number> = {
      A: 1980, B: 1981, C: 1982, D: 1983, E: 1984, F: 1985, G: 1986, H: 1987,
      J: 1988, K: 1989, L: 1990, M: 1991, N: 1992, P: 1993, R: 1994, S: 1995,
      T: 1996, V: 1997, W: 1998, X: 1999, Y: 2000, '1': 2001, '2': 2002, '3': 2003,
      '4': 2004, '5': 2005, '6': 2006, '7': 2007, '8': 2008, '9': 2009, A2: 2010,
    };
    return map[yearChar.toUpperCase()] ?? null;
  }
}

export const vehiclesService = new VehiclesService();
