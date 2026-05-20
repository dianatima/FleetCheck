export const vehicleTypeOptions = [
  'Sedan',
  'SUV',
  'Pickup Truck',
  'Van',
  'Box Truck',
  'Semi Truck',
  'Taxi',
  'Construction Equipment',
  'Boom Lift',
  'Crane',
  'Bus',
  'Trailer',
  'Custom Vehicle',
] as const

export type VehicleTypeOption = (typeof vehicleTypeOptions)[number]

export const vehicleCatalog: Record<string, Record<string, string[]>> = {
  Sedan: {
    Toyota: ['Camry', 'Corolla', 'Avalon'],
    Honda: ['Accord', 'Civic'],
    Nissan: ['Altima', 'Sentra'],
    Hyundai: ['Elantra', 'Sonata'],
  },
  SUV: {
    Toyota: ['RAV4', 'Highlander'],
    Honda: ['CR-V', 'Pilot'],
    Ford: ['Explorer', 'Escape'],
    Chevrolet: ['Tahoe', 'Suburban'],
  },
  'Pickup Truck': {
    Ford: ['F-150', 'F-250', 'F-350'],
    Chevrolet: ['Silverado 1500', 'Silverado 2500HD'],
    RAM: ['1500', '2500'],
    GMC: ['Sierra 1500', 'Sierra 2500HD'],
  },
  Van: {
    Ford: ['Transit', 'Transit Connect'],
    'Mercedes-Benz': ['Sprinter'],
    RAM: ['ProMaster'],
    Nissan: ['NV200'],
  },
  'Box Truck': {
    Isuzu: ['NPR', 'NQR'],
    Hino: ['268', '338'],
    Ford: ['E-Series Cutaway'],
    Freightliner: ['M2 106 Box Truck'],
  },
  'Semi Truck': {
    Kenworth: ['T680', 'W990'],
    Peterbilt: ['579', '389'],
    Freightliner: ['Cascadia'],
    Volvo: ['VNL 760', 'VNL 860'],
    Mack: ['Anthem'],
  },
  Taxi: {
    Toyota: ['Prius', 'Camry Hybrid'],
    Hyundai: ['Sonata Hybrid'],
    Ford: ['Escape Hybrid'],
  },
  'Construction Equipment': {
    Caterpillar: ['320 Excavator', '950 Loader'],
    'John Deere': ['310SL Backhoe', '644 P-Tier'],
    Komatsu: ['PC210LC', 'WA320'],
    JCB: ['3CX', '540-170'],
  },
  'Boom Lift': {
    Genie: ['S-65', 'Z-45 XC'],
    JLG: ['600AJ', '800S'],
    Skyjack: ['SJ66T', 'SJ86T'],
  },
  Crane: {
    Liebherr: ['LTM 1090', 'LTM 1160'],
    Grove: ['GMK3060', 'TMS9000-2'],
    Tadano: ['ATF 70G-4', 'GR-1000XL'],
  },
  Bus: {
    'Blue Bird': ['Vision', 'All American'],
    'Thomas Built': ['Saf-T-Liner C2'],
    'IC Bus': ['CE Series'],
  },
  Trailer: {
    Wabash: ['Dry Van'],
    Utility: ['3000R'],
    'Great Dane': ['Champion'],
  },
}

const legacyTypeMap: Record<string, VehicleTypeOption> = {
  Truck: 'Semi Truck',
  Car: 'Sedan',
  Pickup: 'Pickup Truck',
  Equipment: 'Construction Equipment',
  Other: 'Custom Vehicle',
}

export function normalizeVehicleType(type: string | null | undefined): VehicleTypeOption | '' {
  if (!type) {
    return ''
  }

  if ((vehicleTypeOptions as readonly string[]).includes(type)) {
    return type as VehicleTypeOption
  }

  return legacyTypeMap[type] || ''
}

export function getMakesForVehicleType(type: string | null | undefined) {
  const normalized = normalizeVehicleType(type)
  if (!normalized) {
    return []
  }

  return Object.keys(vehicleCatalog[normalized] || {})
}

export function getModelsForMake(type: string | null | undefined, make: string | null | undefined) {
  const normalized = normalizeVehicleType(type)
  if (!normalized || !make) {
    return []
  }

  return vehicleCatalog[normalized]?.[make] || []
}

export function yearOptions() {
  const currentYear = new Date().getFullYear() + 1
  return Array.from({ length: currentYear - 1989 }, (_, index) => currentYear - index)
}