import type { Language } from '@/stores/app'

type TemplateSectionKey =
  | 'tires'
  | 'lights'
  | 'brakes'
  | 'fluids'
  | 'documents'
  | 'safety'
  | 'interior'
  | 'bed'
  | 'doors'
  | 'cargo'
  | 'windshield'
  | 'mirrors'
  | 'hydraulics'
  | 'exterior'
  | 'rigging'
  | 'general'

export type TemplateTranslationKey =
  | 'tire-pressure'
  | 'headlights'
  | 'brake-pedal'
  | 'engine-oil'
  | 'insurance'
  | 'tread-depth'
  | 'turn-signals'
  | 'seat-belts'
  | 'interior-cleanliness'
  | 'cargo-area-secure-bed'
  | 'parking-brake'
  | 'brake-lights'
  | 'cargo-doors'
  | 'hazard-lights'
  | 'registration'
  | 'lift-gate'
  | 'cargo-area-secure-cargo'
  | 'marker-lights'
  | 'wipers'
  | 'left-mirror'
  | 'right-mirror'
  | 'passenger-cabin-cleanliness'
  | 'interior-dome-lights'
  | 'hydraulic-hoses'
  | 'backup-alarm'
  | 'boom-arm-condition'
  | 'emergency-stop'
  | 'harness-anchor-points'
  | 'hydraulic-leaks'
  | 'hook-latch'
  | 'cable-condition'
  | 'outriggers'
  | 'main-operational-check'

type TranslationMap = Record<Language, string>

const sectionTranslations: Record<TemplateSectionKey, TranslationMap> = {
  tires: { en: 'Tires', uk: 'Шини', es: 'Neumaticos', fr: 'Pneus' },
  lights: { en: 'Lights', uk: 'Освітлення', es: 'Luces', fr: 'Eclairage' },
  brakes: { en: 'Brakes', uk: 'Гальма', es: 'Frenos', fr: 'Freins' },
  fluids: { en: 'Fluids', uk: 'Рідини', es: 'Fluidos', fr: 'Fluides' },
  documents: { en: 'Documents', uk: 'Документи', es: 'Documentos', fr: 'Documents' },
  safety: { en: 'Safety', uk: 'Безпека', es: 'Seguridad', fr: 'Securite' },
  interior: { en: 'Interior', uk: 'Салон', es: 'Interior', fr: 'Interieur' },
  bed: { en: 'Bed', uk: 'Кузов', es: 'Plataforma', fr: 'Benne' },
  doors: { en: 'Doors', uk: 'Двері', es: 'Puertas', fr: 'Portes' },
  cargo: { en: 'Cargo', uk: 'Вантажний відсік', es: 'Carga', fr: 'Chargement' },
  windshield: { en: 'Windshield', uk: 'Лобове скло', es: 'Parabrisas', fr: 'Pare-brise' },
  mirrors: { en: 'Mirrors', uk: 'Дзеркала', es: 'Espejos', fr: 'Retroviseurs' },
  hydraulics: { en: 'Hydraulics', uk: 'Гідравліка', es: 'Hidraulica', fr: 'Hydraulique' },
  exterior: { en: 'Exterior', uk: 'Екстерʼєр', es: 'Exterior', fr: 'Exterieur' },
  rigging: { en: 'Rigging', uk: 'Такелаж', es: 'Aparejo', fr: 'Greement' },
  general: { en: 'General', uk: 'Загальне', es: 'General', fr: 'General' },
}

const templateItemTranslations: Record<TemplateTranslationKey, { section: TemplateSectionKey; label: TranslationMap }> = {
  'tire-pressure': { section: 'tires', label: { en: 'Tire pressure', uk: 'Тиск у шинах', es: 'Presion de los neumaticos', fr: 'Pression des pneus' } },
  'headlights': { section: 'lights', label: { en: 'Headlights', uk: 'Фари', es: 'Faros delanteros', fr: 'Phares' } },
  'brake-pedal': { section: 'brakes', label: { en: 'Brake pedal', uk: 'Педаль гальма', es: 'Pedal de freno', fr: 'Pedale de frein' } },
  'engine-oil': { section: 'fluids', label: { en: 'Engine oil', uk: 'Моторна олива', es: 'Aceite de motor', fr: 'Huile moteur' } },
  'insurance': { section: 'documents', label: { en: 'Insurance', uk: 'Страхування', es: 'Seguro', fr: 'Assurance' } },
  'tread-depth': { section: 'tires', label: { en: 'Tread depth', uk: 'Глибина протектора', es: 'Profundidad de la banda', fr: 'Profondeur de sculpture' } },
  'turn-signals': { section: 'lights', label: { en: 'Turn signals', uk: 'Покажчики повороту', es: 'Intermitentes', fr: 'Clignotants' } },
  'seat-belts': { section: 'safety', label: { en: 'Seat belts', uk: 'Ремені безпеки', es: 'Cinturones de seguridad', fr: 'Ceintures de securite' } },
  'interior-cleanliness': { section: 'interior', label: { en: 'Interior cleanliness', uk: 'Чистота салону', es: 'Limpieza interior', fr: 'Proprete interieure' } },
  'cargo-area-secure-bed': { section: 'bed', label: { en: 'Cargo area secure', uk: 'Надійність вантажної зони', es: 'Carga asegurada', fr: 'Zone de chargement securisee' } },
  'parking-brake': { section: 'brakes', label: { en: 'Parking brake', uk: 'Стоянкове гальмо', es: 'Freno de estacionamiento', fr: 'Frein de stationnement' } },
  'brake-lights': { section: 'lights', label: { en: 'Brake lights', uk: 'Стоп-сигнали', es: 'Luces de freno', fr: 'Feux stop' } },
  'cargo-doors': { section: 'doors', label: { en: 'Cargo doors', uk: 'Вантажні двері', es: 'Puertas de carga', fr: 'Portes de chargement' } },
  'hazard-lights': { section: 'lights', label: { en: 'Hazard lights', uk: 'Аварійна сигналізація', es: 'Luces de emergencia', fr: 'Feux de detresse' } },
  'registration': { section: 'documents', label: { en: 'Registration', uk: 'Реєстрація', es: 'Matricula', fr: 'Immatriculation' } },
  'lift-gate': { section: 'cargo', label: { en: 'Lift gate', uk: 'Гідроборт', es: 'Plataforma elevadora', fr: 'Hayon elevateur' } },
  'cargo-area-secure-cargo': { section: 'cargo', label: { en: 'Cargo area secure', uk: 'Надійність вантажної зони', es: 'Carga asegurada', fr: 'Zone de chargement securisee' } },
  'marker-lights': { section: 'lights', label: { en: 'Marker lights', uk: 'Габаритні вогні', es: 'Luces de posicion', fr: 'Feux de gabarit' } },
  'wipers': { section: 'windshield', label: { en: 'Wipers', uk: 'Склоочисники', es: 'Limpiaparabrisas', fr: 'Essuie-glaces' } },
  'left-mirror': { section: 'mirrors', label: { en: 'Left mirror', uk: 'Ліве дзеркало', es: 'Espejo izquierdo', fr: 'Retroviseur gauche' } },
  'right-mirror': { section: 'mirrors', label: { en: 'Right mirror', uk: 'Праве дзеркало', es: 'Espejo derecho', fr: 'Retroviseur droit' } },
  'passenger-cabin-cleanliness': { section: 'interior', label: { en: 'Passenger cabin cleanliness', uk: 'Чистота пасажирського салону', es: 'Limpieza de la cabina de pasajeros', fr: 'Proprete de l\'habitacle passager' } },
  'interior-dome-lights': { section: 'lights', label: { en: 'Interior dome lights', uk: 'Внутрішнє освітлення', es: 'Luces interiores', fr: 'Eclairage interieur' } },
  'hydraulic-hoses': { section: 'hydraulics', label: { en: 'Hydraulic hoses', uk: 'Гідравлічні шланги', es: 'Mangueras hidraulicas', fr: 'Flexibles hydrauliques' } },
  'backup-alarm': { section: 'safety', label: { en: 'Backup alarm', uk: 'Сигнал заднього ходу', es: 'Alarma de retroceso', fr: 'Alarme de recul' } },
  'boom-arm-condition': { section: 'exterior', label: { en: 'Boom / arm condition', uk: 'Стан стріли / рукояті', es: 'Estado de la pluma / brazo', fr: 'Etat du bras / de la fleche' } },
  'emergency-stop': { section: 'safety', label: { en: 'Emergency stop', uk: 'Аварійна зупинка', es: 'Parada de emergencia', fr: 'Arret d\'urgence' } },
  'harness-anchor-points': { section: 'safety', label: { en: 'Harness anchor points', uk: 'Точки кріплення страхувальної системи', es: 'Puntos de anclaje del arnes', fr: 'Points d\'ancrage du harnais' } },
  'hydraulic-leaks': { section: 'hydraulics', label: { en: 'Hydraulic leaks', uk: 'Гідравлічні витоки', es: 'Fugas hidraulicas', fr: 'Fuites hydrauliques' } },
  'hook-latch': { section: 'rigging', label: { en: 'Hook latch', uk: 'Фіксатор гака', es: 'Pestillo del gancho', fr: 'Linguet du crochet' } },
  'cable-condition': { section: 'rigging', label: { en: 'Cable condition', uk: 'Стан троса', es: 'Estado del cable', fr: 'Etat du cable' } },
  'outriggers': { section: 'safety', label: { en: 'Outriggers', uk: 'Аутригери', es: 'Estabilizadores', fr: 'Stabilisateurs' } },
  'main-operational-check': { section: 'general', label: { en: 'Main operational check', uk: 'Основна робоча перевірка', es: 'Revision operativa principal', fr: 'Controle operationnel principal' } },
}

export type LocalizableTemplateItem = {
  section?: string | null
  label?: string | null
  translationKey?: string | null
  translations?: TemplateItemTranslations | null
}

export type TemplateItemLocalizedText = {
  section?: string | null
  label?: string | null
}

export type TemplateItemTranslations = Partial<Record<Language, TemplateItemLocalizedText>>

function normalizeTemplateText(value?: string | null) {
  return (value || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

const englishLookup = new Map<string, TemplateTranslationKey>(
  (Object.keys(templateItemTranslations) as TemplateTranslationKey[]).map((key) => {
    const entry = templateItemTranslations[key]
    return [`${normalizeTemplateText(sectionTranslations[entry.section].en)}|${normalizeTemplateText(entry.label.en)}`, key]
  }),
)

export function inferTemplateTranslationKey(section?: string | null, label?: string | null): TemplateTranslationKey | '' {
  return englishLookup.get(`${normalizeTemplateText(section)}|${normalizeTemplateText(label)}`) || ''
}

export function getTemplateItemCatalogEntry(translationKey: TemplateTranslationKey, language: Language = 'en') {
  const entry = templateItemTranslations[translationKey]

  return {
    translationKey,
    section: sectionTranslations[entry.section][language] || sectionTranslations[entry.section].en,
    label: entry.label[language] || entry.label.en,
  }
}

export function getLocalizedTemplateItemText(item: LocalizableTemplateItem, language: Language) {
  const key = (item.translationKey as TemplateTranslationKey | undefined) || inferTemplateTranslationKey(item.section, item.label)

  if (!key) {
    const translatedText = item.translations?.[language]

    return {
      translationKey: '',
      section: (translatedText?.section || item.section || '').trim() || 'General',
      label: (translatedText?.label || item.label || '').trim(),
    }
  }

  return getTemplateItemCatalogEntry(key, language)
}