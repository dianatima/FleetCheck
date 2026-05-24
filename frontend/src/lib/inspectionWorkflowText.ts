import type { Language } from '@/stores/app'

export const inspectionWorkflowLocales: Record<Language, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  es: 'es-ES',
  fr: 'fr-FR',
}

type WorkflowCopy = {
  guidedInspection: string
  workflow: string
  stepOne: string
  inspectionSetup: string
  inspectionSetupDescription: string
  matchedInspectionTemplate: string
  noActiveTemplateAssigned: string
  appliedAutomatically: (vehicleType: string, tripType: string) => string
  adminMustCreateTemplate: (tripType: string) => string
  currentOdometer: string
  currentEngineHours: string
  liveContext: string
  readyBeforeStart: string
  dateLabel: string
  lastOdometer: string
  checklistItems: string
  stepHelp: string
  checklistItem: (current: number, total: number) => string
  passShort: string
  issuesShort: string
  evaluateItem: string
  evaluateItemDescription: string
  passAction: string
  issueFound: string
  issueNote: string
  addPhoto: string
  photoCount: (count: number, max: number) => string
  minimumOnePhotoRequired: string
  finalStep: string
  reviewAndSign: string
  reviewAndSignDescription: string
  passed: string
  issues: string
  photos: string
  vehicleLabel: string
  reportedBy: string
  referenceSignatureOnFile: string
  referenceSignatureAlt: string
  noReferenceSignature: string
  freshInspectionSignature: string
  freshInspectionSignatureDescription: string
  clear: string
  drawSignatureToFinish: string
  freshSignatureCaptured: string
  checklistItemsAnswered: (done: number, total: number) => string
  back: string
  tripTypeShort: {
    pre: string
    post: string
  }
  stepOneOfSetup: string
  finalStepOf: (total: number) => string
  beginChecklist: string
  nextItem: string
  general: string
  unknownType: string
  selectedVehicleUnavailable: string
  noActiveTemplateConfigured: (tripType: string, vehicleType: string) => string
  selectVehicleWithValidType: string
  unableLoadVehicles: string
  maxPhotosPerItem: string
  firstFivePhotosKept: string
  noActiveTemplateConfiguredForCurrentType: (tripType: string) => string
  selectVehicleBeforeStart: string
  enterCurrentOdometer: string
  odometerBelowLast: (lastValue: string, unit: string) => string
  engineHoursBelowLast: (lastValue: string) => string
  checklistItemNotFound: string
  choosePassOrIssue: string
  addRequiredPhoto: string
  drawFreshSignatureBeforeSubmit: string
  selectVehicleBeforeSubmit: string
  completeEveryChecklistItem: string
  addPhotosToRequiredItems: string
  unableSaveInspection: string
  inspectionEvidenceAlt: string
  assignedDriver: string
  durationMinutes: (minutes: number) => string
}

const workflowTextByLanguage: Record<Language, WorkflowCopy> = {
  en: {
    guidedInspection: 'Guided inspection',
    workflow: 'workflow',
    stepOne: 'Step 1',
    inspectionSetup: 'Inspection setup',
    inspectionSetupDescription: 'Pick the vehicle, confirm telemetry, then the checklist will open one item at a time.',
    matchedInspectionTemplate: 'Matched inspection template',
    noActiveTemplateAssigned: 'No active template assigned for this vehicle type.',
    appliedAutomatically: (vehicleType, tripType) => `Applied automatically for ${vehicleType} ${tripType} inspections.`,
    adminMustCreateTemplate: (tripType) => `The administrator must create an active ${tripType} template for this vehicle type in Settings before this inspection can start.`,
    currentOdometer: 'Current odometer',
    currentEngineHours: 'Current engine hours',
    liveContext: 'Live context',
    readyBeforeStart: 'Ready before you start',
    dateLabel: 'Date',
    lastOdometer: 'Last odometer',
    checklistItems: 'Checklist items',
    stepHelp: 'Every checklist item will be shown one by one. The driver cannot finish the workflow without answering each item and drawing a fresh signature.',
    checklistItem: (current, total) => `Checklist item ${current} of ${total}`,
    passShort: 'pass',
    issuesShort: 'issues',
    evaluateItem: 'Evaluate this item',
    evaluateItemDescription: 'Mark it as OK or flag an issue. If this item requires photos, add at least one image before continuing.',
    passAction: 'Pass',
    issueFound: 'Issue found',
    issueNote: 'Issue note',
    addPhoto: 'Add photo',
    photoCount: (count, max) => `${count}/${max} photos`,
    minimumOnePhotoRequired: 'Minimum 1 photo required',
    finalStep: 'Final step',
    reviewAndSign: 'Review and sign',
    reviewAndSignDescription: 'Keep the signature on file as a reference only. This inspection still requires a brand-new signature now.',
    passed: 'Passed',
    issues: 'Issues',
    photos: 'Photos',
    vehicleLabel: 'Vehicle',
    reportedBy: 'Reported by',
    referenceSignatureOnFile: 'Reference signature on file',
    referenceSignatureAlt: 'Reference signature',
    noReferenceSignature: 'No reference signature is stored for this account. You can still draw a fresh signature below and submit the inspection.',
    freshInspectionSignature: 'Fresh inspection signature',
    freshInspectionSignatureDescription: 'Draw the signature directly here. A new signature is required every time.',
    clear: 'Clear',
    drawSignatureToFinish: 'Draw your signature to finish this inspection.',
    freshSignatureCaptured: 'Fresh signature captured for this inspection.',
    checklistItemsAnswered: (done, total) => `${done} / ${total} checklist items answered`,
    back: 'Back',
    tripTypeShort: { pre: 'pre-trip', post: 'post-trip' },
    stepOneOfSetup: 'Step 1 of setup',
    finalStepOf: (total) => `Final step of ${total}`,
    beginChecklist: 'Begin checklist',
    nextItem: 'Next item',
    general: 'General',
    unknownType: 'Unknown type',
    selectedVehicleUnavailable: 'The selected vehicle is not available in the active business context.',
    noActiveTemplateConfigured: (tripType, vehicleType) => `No active ${tripType} template is configured for ${vehicleType}. Ask an admin to create one in Settings before this inspection starts.`,
    selectVehicleWithValidType: 'Select a vehicle with a valid type before starting the inspection.',
    unableLoadVehicles: 'Unable to load vehicles.',
    maxPhotosPerItem: 'You can upload up to 5 photos per checklist item.',
    firstFivePhotosKept: 'Only the first 5 photos were kept for this checklist item.',
    noActiveTemplateConfiguredForCurrentType: (tripType) => `No active ${tripType} template is configured for this vehicle type yet.`,
    selectVehicleBeforeStart: 'Select a vehicle from the fleet before starting the checklist.',
    enterCurrentOdometer: 'Enter the current odometer reading before starting the checklist.',
    odometerBelowLast: (lastValue, unit) => `Current odometer cannot be less than the last recorded value of ${lastValue} ${unit}.`,
    engineHoursBelowLast: (lastValue) => `Current engine hours cannot be less than the last recorded value of ${lastValue} hrs.`,
    checklistItemNotFound: 'Checklist item not found.',
    choosePassOrIssue: 'Choose Pass or Issue before moving to the next item.',
    addRequiredPhoto: 'Add at least one photo for this checklist item before continuing.',
    drawFreshSignatureBeforeSubmit: 'Draw a fresh signature before submitting the inspection.',
    selectVehicleBeforeSubmit: 'Select a vehicle from the fleet before submitting the inspection.',
    completeEveryChecklistItem: 'Complete every checklist item before submitting.',
    addPhotosToRequiredItems: 'Add photos to every checklist item that requires photo evidence.',
    unableSaveInspection: 'Unable to save inspection record.',
    inspectionEvidenceAlt: 'Inspection evidence',
    assignedDriver: 'Assigned driver',
    durationMinutes: (minutes) => `${minutes} minutes`,
  },
  uk: {
    guidedInspection: 'Покроковий огляд',
    workflow: 'процесу',
    stepOne: 'Крок 1',
    inspectionSetup: 'Підготовка огляду',
    inspectionSetupDescription: 'Оберіть транспорт, підтвердіть показники, після чого чекліст відкриється по одному пункту за раз.',
    matchedInspectionTemplate: 'Підібраний шаблон огляду',
    noActiveTemplateAssigned: 'Для цього типу транспорту немає активного шаблону.',
    appliedAutomatically: (vehicleType, tripType) => `Автоматично застосовано для ${tripType} оглядів типу ${vehicleType}.`,
    adminMustCreateTemplate: (tripType) => `Адміністратор має створити активний шаблон ${tripType} для цього типу транспорту в Налаштуваннях, перш ніж огляд можна буде почати.`,
    currentOdometer: 'Поточний одометр',
    currentEngineHours: 'Поточні мотогодини',
    liveContext: 'Контекст у реальному часі',
    readyBeforeStart: 'Готово перед початком',
    dateLabel: 'Дата',
    lastOdometer: 'Останній одометр',
    checklistItems: 'Пункти чекліста',
    stepHelp: 'Кожен пункт чекліста буде показано окремо. Водій не зможе завершити процес, не відповівши на кожен пункт і не намалювавши новий підпис.',
    checklistItem: (current, total) => `Пункт чекліста ${current} з ${total}`,
    passShort: 'без зауважень',
    issuesShort: 'проблем',
    evaluateItem: 'Оцініть цей пункт',
    evaluateItemDescription: 'Позначте, що все гаразд, або зафіксуйте проблему. Якщо для цього пункту потрібні фото, додайте хоча б одне зображення перед продовженням.',
    passAction: 'Все гаразд',
    issueFound: 'Є проблема',
    issueNote: 'Опис проблеми',
    addPhoto: 'Додати фото',
    photoCount: (count, max) => `${count}/${max} фото`,
    minimumOnePhotoRequired: 'Потрібно мінімум 1 фото',
    finalStep: 'Фінальний крок',
    reviewAndSign: 'Перевірка та підпис',
    reviewAndSignDescription: 'Підпис у профілі зберігається лише як зразок. Для цього огляду все одно потрібен новий підпис.',
    passed: 'Пройдено',
    issues: 'Проблеми',
    photos: 'Фото',
    vehicleLabel: 'Транспорт',
    reportedBy: 'Хто виконав',
    referenceSignatureOnFile: 'Еталонний підпис у профілі',
    referenceSignatureAlt: 'Еталонний підпис',
    noReferenceSignature: 'Для цього акаунта не збережено еталонний підпис. Ви все одно можете намалювати новий підпис нижче й відправити огляд.',
    freshInspectionSignature: 'Новий підпис для огляду',
    freshInspectionSignatureDescription: 'Намалюйте підпис прямо тут. Новий підпис потрібен щоразу.',
    clear: 'Очистити',
    drawSignatureToFinish: 'Намалюйте підпис, щоб завершити цей огляд.',
    freshSignatureCaptured: 'Новий підпис для цього огляду збережено.',
    checklistItemsAnswered: (done, total) => `${done} / ${total} пунктів чекліста заповнено`,
    back: 'Назад',
    tripTypeShort: { pre: 'до поїздки', post: 'після поїздки' },
    stepOneOfSetup: 'Крок 1 підготовки',
    finalStepOf: (total) => `Фінальний крок із ${total}`,
    beginChecklist: 'Почати чекліст',
    nextItem: 'Наступний пункт',
    general: 'Загальне',
    unknownType: 'Невідомий тип',
    selectedVehicleUnavailable: 'Вибраний транспорт недоступний у поточному бізнес-контексті.',
    noActiveTemplateConfigured: (tripType, vehicleType) => `Для ${tripType} огляду типу ${vehicleType} немає активного шаблону. Попросіть адміністратора створити його в Налаштуваннях перед початком огляду.`,
    selectVehicleWithValidType: 'Оберіть транспорт із коректним типом перед початком огляду.',
    unableLoadVehicles: 'Не вдалося завантажити транспорт.',
    maxPhotosPerItem: 'Для одного пункту чекліста можна завантажити максимум 5 фото.',
    firstFivePhotosKept: 'Для цього пункту збережено лише перші 5 фото.',
    noActiveTemplateConfiguredForCurrentType: (tripType) => `Для цього типу транспорту ще не налаштовано активний шаблон ${tripType} огляду.`,
    selectVehicleBeforeStart: 'Оберіть транспорт із флоту перед початком чекліста.',
    enterCurrentOdometer: 'Вкажіть поточний одометр перед початком чекліста.',
    odometerBelowLast: (lastValue, unit) => `Поточний одометр не може бути меншим за останнє зафіксоване значення ${lastValue} ${unit}.`,
    engineHoursBelowLast: (lastValue) => `Поточні мотогодини не можуть бути меншими за останнє зафіксоване значення ${lastValue} год.`,
    checklistItemNotFound: 'Пункт чекліста не знайдено.',
    choosePassOrIssue: 'Перш ніж переходити далі, виберіть, чи все гаразд, чи є проблема.',
    addRequiredPhoto: 'Додайте хоча б одне фото для цього пункту чекліста перед продовженням.',
    drawFreshSignatureBeforeSubmit: 'Перед відправкою огляду намалюйте новий підпис.',
    selectVehicleBeforeSubmit: 'Оберіть транспорт із флоту перед відправкою огляду.',
    completeEveryChecklistItem: 'Перед відправкою потрібно заповнити кожен пункт чекліста.',
    addPhotosToRequiredItems: 'Додайте фото до всіх пунктів чекліста, де потрібне фотопідтвердження.',
    unableSaveInspection: 'Не вдалося зберегти запис огляду.',
    inspectionEvidenceAlt: 'Доказове фото огляду',
    assignedDriver: 'Призначений водій',
    durationMinutes: (minutes) => `${minutes} хвилин`,
  },
  es: {
    guidedInspection: 'Inspeccion guiada',
    workflow: 'del flujo',
    stepOne: 'Paso 1',
    inspectionSetup: 'Configuracion de la inspeccion',
    inspectionSetupDescription: 'Elige el vehiculo, confirma la telemetria y luego la lista se abrira un elemento a la vez.',
    matchedInspectionTemplate: 'Plantilla de inspeccion aplicada',
    noActiveTemplateAssigned: 'No hay una plantilla activa asignada para este tipo de vehiculo.',
    appliedAutomatically: (vehicleType, tripType) => `Aplicada automaticamente para inspecciones ${tripType} de tipo ${vehicleType}.`,
    adminMustCreateTemplate: (tripType) => `El administrador debe crear una plantilla activa ${tripType} para este tipo de vehiculo en Configuracion antes de iniciar esta inspeccion.`,
    currentOdometer: 'Odometro actual',
    currentEngineHours: 'Horas actuales del motor',
    liveContext: 'Contexto en vivo',
    readyBeforeStart: 'Listo antes de comenzar',
    dateLabel: 'Fecha',
    lastOdometer: 'Ultimo odometro',
    checklistItems: 'Elementos de la lista',
    stepHelp: 'Cada elemento de la lista se mostrara uno por uno. El conductor no puede terminar el flujo sin responder cada elemento y dibujar una firma nueva.',
    checklistItem: (current, total) => `Elemento ${current} de ${total}`,
    passShort: 'ok',
    issuesShort: 'problemas',
    evaluateItem: 'Evalua este elemento',
    evaluateItemDescription: 'Marcado como correcto o reporta un problema. Si este elemento requiere fotos, agrega al menos una antes de continuar.',
    passAction: 'Correcto',
    issueFound: 'Problema detectado',
    issueNote: 'Nota del problema',
    addPhoto: 'Agregar foto',
    photoCount: (count, max) => `${count}/${max} fotos`,
    minimumOnePhotoRequired: 'Se requiere minimo 1 foto',
    finalStep: 'Paso final',
    reviewAndSign: 'Revisar y firmar',
    reviewAndSignDescription: 'La firma guardada en el perfil es solo una referencia. Esta inspeccion aun requiere una firma nueva ahora.',
    passed: 'Aprobados',
    issues: 'Problemas',
    photos: 'Fotos',
    vehicleLabel: 'Vehiculo',
    reportedBy: 'Reportado por',
    referenceSignatureOnFile: 'Firma de referencia guardada',
    referenceSignatureAlt: 'Firma de referencia',
    noReferenceSignature: 'No hay una firma de referencia guardada para esta cuenta. Aun puedes dibujar una firma nueva abajo y enviar la inspeccion.',
    freshInspectionSignature: 'Firma nueva de la inspeccion',
    freshInspectionSignatureDescription: 'Dibuja la firma directamente aqui. Se requiere una firma nueva cada vez.',
    clear: 'Limpiar',
    drawSignatureToFinish: 'Dibuja tu firma para finalizar esta inspeccion.',
    freshSignatureCaptured: 'Firma nueva capturada para esta inspeccion.',
    checklistItemsAnswered: (done, total) => `${done} / ${total} elementos respondidos`,
    back: 'Atras',
    tripTypeShort: { pre: 'pre-viaje', post: 'post-viaje' },
    stepOneOfSetup: 'Paso 1 de configuracion',
    finalStepOf: (total) => `Paso final de ${total}`,
    beginChecklist: 'Comenzar lista',
    nextItem: 'Siguiente elemento',
    general: 'General',
    unknownType: 'Tipo desconocido',
    selectedVehicleUnavailable: 'El vehiculo seleccionado no esta disponible en el contexto activo de la empresa.',
    noActiveTemplateConfigured: (tripType, vehicleType) => `No hay una plantilla activa ${tripType} configurada para ${vehicleType}. Pide a un administrador que cree una en Configuracion antes de iniciar esta inspeccion.`,
    selectVehicleWithValidType: 'Selecciona un vehiculo con un tipo valido antes de iniciar la inspeccion.',
    unableLoadVehicles: 'No se pudieron cargar los vehiculos.',
    maxPhotosPerItem: 'Puedes subir hasta 5 fotos por elemento de la lista.',
    firstFivePhotosKept: 'Solo se conservaron las primeras 5 fotos para este elemento.',
    noActiveTemplateConfiguredForCurrentType: (tripType) => `Aun no hay una plantilla activa ${tripType} configurada para este tipo de vehiculo.`,
    selectVehicleBeforeStart: 'Selecciona un vehiculo de la flota antes de comenzar la lista.',
    enterCurrentOdometer: 'Ingresa el odometro actual antes de comenzar la lista.',
    odometerBelowLast: (lastValue, unit) => `El odometro actual no puede ser menor que el ultimo valor registrado de ${lastValue} ${unit}.`,
    engineHoursBelowLast: (lastValue) => `Las horas actuales del motor no pueden ser menores que el ultimo valor registrado de ${lastValue} h.`,
    checklistItemNotFound: 'No se encontro el elemento de la lista.',
    choosePassOrIssue: 'Elige Correcto o Problema antes de pasar al siguiente elemento.',
    addRequiredPhoto: 'Agrega al menos una foto para este elemento antes de continuar.',
    drawFreshSignatureBeforeSubmit: 'Dibuja una firma nueva antes de enviar la inspeccion.',
    selectVehicleBeforeSubmit: 'Selecciona un vehiculo de la flota antes de enviar la inspeccion.',
    completeEveryChecklistItem: 'Completa cada elemento de la lista antes de enviar.',
    addPhotosToRequiredItems: 'Agrega fotos a todos los elementos que requieren evidencia fotografica.',
    unableSaveInspection: 'No se pudo guardar el registro de la inspeccion.',
    inspectionEvidenceAlt: 'Evidencia fotografica de la inspeccion',
    assignedDriver: 'Conductor asignado',
    durationMinutes: (minutes) => `${minutes} minutos`,
  },
  fr: {
    guidedInspection: 'Inspection guidee',
    workflow: 'du processus',
    stepOne: 'Etape 1',
    inspectionSetup: 'Preparation de l\'inspection',
    inspectionSetupDescription: 'Choisissez le vehicule, confirmez la telemetrie, puis la liste s\'ouvrira un element a la fois.',
    matchedInspectionTemplate: 'Modele d\'inspection applique',
    noActiveTemplateAssigned: 'Aucun modele actif n\'est assigne a ce type de vehicule.',
    appliedAutomatically: (vehicleType, tripType) => `Applique automatiquement pour les inspections ${tripType} du type ${vehicleType}.`,
    adminMustCreateTemplate: (tripType) => `L\'administrateur doit creer un modele actif ${tripType} pour ce type de vehicule dans les Parametres avant de pouvoir lancer cette inspection.`,
    currentOdometer: 'Compteur kilometrique actuel',
    currentEngineHours: 'Heures moteur actuelles',
    liveContext: 'Contexte en direct',
    readyBeforeStart: 'Pret avant de commencer',
    dateLabel: 'Date',
    lastOdometer: 'Dernier compteur',
    checklistItems: 'Elements de controle',
    stepHelp: 'Chaque element de la liste sera affiche un par un. Le conducteur ne peut pas terminer le processus sans repondre a chaque element et dessiner une nouvelle signature.',
    checklistItem: (current, total) => `Element ${current} sur ${total}`,
    passShort: 'ok',
    issuesShort: 'problemes',
    evaluateItem: 'Evaluez cet element',
    evaluateItemDescription: 'Marquez-le comme correct ou signalez un probleme. Si cet element exige des photos, ajoutez-en au moins une avant de continuer.',
    passAction: 'Conforme',
    issueFound: 'Probleme detecte',
    issueNote: 'Note du probleme',
    addPhoto: 'Ajouter une photo',
    photoCount: (count, max) => `${count}/${max} photos`,
    minimumOnePhotoRequired: 'Minimum 1 photo requise',
    finalStep: 'Etape finale',
    reviewAndSign: 'Verifier et signer',
    reviewAndSignDescription: 'La signature enregistree dans le profil sert seulement de reference. Cette inspection exige quand meme une toute nouvelle signature.',
    passed: 'Valides',
    issues: 'Problemes',
    photos: 'Photos',
    vehicleLabel: 'Vehicule',
    reportedBy: 'Realise par',
    referenceSignatureOnFile: 'Signature de reference enregistree',
    referenceSignatureAlt: 'Signature de reference',
    noReferenceSignature: 'Aucune signature de reference n\'est enregistree pour ce compte. Vous pouvez quand meme dessiner une nouvelle signature ci-dessous et envoyer l\'inspection.',
    freshInspectionSignature: 'Nouvelle signature d\'inspection',
    freshInspectionSignatureDescription: 'Dessinez la signature directement ici. Une nouvelle signature est requise a chaque fois.',
    clear: 'Effacer',
    drawSignatureToFinish: 'Dessinez votre signature pour terminer cette inspection.',
    freshSignatureCaptured: 'Nouvelle signature capturee pour cette inspection.',
    checklistItemsAnswered: (done, total) => `${done} / ${total} elements renseignes`,
    back: 'Retour',
    tripTypeShort: { pre: 'avant trajet', post: 'apres trajet' },
    stepOneOfSetup: 'Etape 1 de preparation',
    finalStepOf: (total) => `Etape finale sur ${total}`,
    beginChecklist: 'Commencer la liste',
    nextItem: 'Element suivant',
    general: 'General',
    unknownType: 'Type inconnu',
    selectedVehicleUnavailable: 'Le vehicule selectionne n\'est pas disponible dans le contexte actif de l\'entreprise.',
    noActiveTemplateConfigured: (tripType, vehicleType) => `Aucun modele actif ${tripType} n\'est configure pour ${vehicleType}. Demandez a un administrateur d\'en creer un dans les Parametres avant de demarrer cette inspection.`,
    selectVehicleWithValidType: 'Choisissez un vehicule avec un type valide avant de demarrer l\'inspection.',
    unableLoadVehicles: 'Impossible de charger les vehicules.',
    maxPhotosPerItem: 'Vous pouvez telecharger jusqu\'a 5 photos par element de la liste.',
    firstFivePhotosKept: 'Seules les 5 premieres photos ont ete conservees pour cet element.',
    noActiveTemplateConfiguredForCurrentType: (tripType) => `Aucun modele actif ${tripType} n\'est encore configure pour ce type de vehicule.`,
    selectVehicleBeforeStart: 'Choisissez un vehicule de la flotte avant de commencer la liste.',
    enterCurrentOdometer: 'Saisissez le compteur actuel avant de commencer la liste.',
    odometerBelowLast: (lastValue, unit) => `Le compteur actuel ne peut pas etre inferieur a la derniere valeur enregistree de ${lastValue} ${unit}.`,
    engineHoursBelowLast: (lastValue) => `Les heures moteur actuelles ne peuvent pas etre inferieures a la derniere valeur enregistree de ${lastValue} h.`,
    checklistItemNotFound: 'Element de la liste introuvable.',
    choosePassOrIssue: 'Choisissez Conforme ou Probleme avant de passer a l\'element suivant.',
    addRequiredPhoto: 'Ajoutez au moins une photo pour cet element avant de continuer.',
    drawFreshSignatureBeforeSubmit: 'Dessinez une nouvelle signature avant de soumettre l\'inspection.',
    selectVehicleBeforeSubmit: 'Choisissez un vehicule de la flotte avant de soumettre l\'inspection.',
    completeEveryChecklistItem: 'Renseignez chaque element de la liste avant de soumettre.',
    addPhotosToRequiredItems: 'Ajoutez des photos a tous les elements qui exigent une preuve photo.',
    unableSaveInspection: 'Impossible d\'enregistrer l\'inspection.',
    inspectionEvidenceAlt: 'Preuve photo de l\'inspection',
    assignedDriver: 'Conducteur assigne',
    durationMinutes: (minutes) => `${minutes} minutes`,
  },
}

export function getInspectionWorkflowCopy(language: Language) {
  return workflowTextByLanguage[language] || workflowTextByLanguage.en
}