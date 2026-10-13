import type { DataPackage } from "../types";


export const PACKAGES: DataPackage[] = [
  { id: 'p-1h', price: 10, label: '1 hour unlimited', durationText: 'Valid for 1 hour', durationHours: 1 },
  { id: 'p-2h', price: 15, label: '2 hour unlimited', durationText: 'Valid for 2 hours', durationHours: 2 },
  { id: 'p-3h', price: 20, label: '3 hour unlimited', durationText: 'Valid for 3 hours', durationHours: 3 },
  { id: 'p-6h', price: 30, label: '6 hour unlimited', durationText: 'Valid for 6 hours', durationHours: 6 },
  { id: 'p-12h', price: 40, label: '12 hour unlimited', durationText: 'Valid for 12 hours', durationHours: 12 },
  { id: 'p-24h', price: 50, label: '24 hour unlimited', durationText: 'Valid for 1 day', durationHours: 24 },
  { id: 'p-1w', price: 200, label: '1 week unlimited', durationText: 'Valid for 1 week', durationHours: 168 },
  { id: 'p-2w', price: 400, label: '2 week unlimited', durationText: 'Valid for 2 weeks', durationHours: 336 },
  { id: 'p-1m', price: 800, label: '1 month unlimited', durationText: 'Valid for 1 month', durationHours: 720 }
];
