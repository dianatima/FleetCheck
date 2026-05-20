export type DistanceUnit = 'mi' | 'km'
export type DimensionUnit = 'ft' | 'yd' | 'm'

export const distanceUnitOptions: Array<{ value: DistanceUnit; label: string }> = [
  { value: 'mi', label: 'Miles (mi)' },
  { value: 'km', label: 'Kilometers (km)' },
]

export const dimensionUnitOptions: Array<{ value: DimensionUnit; label: string }> = [
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'yd', label: 'Yards (yd)' },
  { value: 'm', label: 'Meters (m)' },
]

const mileCountries = new Set(['United States', 'Liberia', 'Myanmar', 'United Kingdom'])
const yardCountries = new Set(['United Kingdom'])

export function defaultDistanceUnitForCountry(country?: string | null): DistanceUnit {
  return country && mileCountries.has(country) ? 'mi' : 'km'
}

export function defaultDimensionUnitForCountry(country?: string | null): DimensionUnit {
  if (country && yardCountries.has(country)) {
    return 'yd'
  }

  return country && mileCountries.has(country) ? 'ft' : 'm'
}

export function distanceUnitLabel(unit: DistanceUnit) {
  return distanceUnitOptions.find((option) => option.value === unit)?.label || unit
}

export function dimensionUnitLabel(unit: DimensionUnit) {
  return dimensionUnitOptions.find((option) => option.value === unit)?.label || unit
}