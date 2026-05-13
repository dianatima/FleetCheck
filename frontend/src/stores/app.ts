import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Language = 'en' | 'uk' | 'es' | 'fr'
export type Role = 'manager' | 'driver' | 'mechanic' | 'admin' | null

const translations: Record<Language, Record<string, string>> = {
  en: {
    appName: 'FleetCheck Pro',
    tagline: 'Digital vehicle inspections for safer fleets',
    getStarted: 'Get Started',
    companyLogin: 'Company Login',
    driverRegistration: 'Driver Registration',
    dashboard: 'Dashboard',
    vehicles: 'Vehicles',
    drivers: 'Drivers',
    inspections: 'Inspections',
    reports: 'Reports',
    repairs: 'Repairs',
    settings: 'Settings',
    login: 'Login',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    next: 'Next',
    back: 'Back',
    finish: 'Finish',
    search: 'Search...',
    language: 'Language',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    selectLanguage: 'Select Language',
    english: 'English',
    ukrainian: 'Ukrainian',
    spanish: 'Spanish',
    french: 'French',
    preTripInspection: 'Pre-Trip Inspection',
    postTripInspection: 'Post-Trip Inspection',
    startInspection: 'Start Inspection',
    pass: 'Pass',
    fail: 'Fail',
    na: 'N/A',
    addPhoto: 'Add Photo',
    addComment: 'Add Comment',
    signHere: 'Sign here',
    submitInspection: 'Submit Inspection',
    inspectionPassed: 'Inspection Passed',
    inspectionFailed: 'Issues Found',
    createRepairRequest: 'Create Repair Request',
    notifyManager: 'Notify Manager',
    pendingApproval: 'Registration Pending Approval',
    pendingMessage: 'Your registration has been submitted. Please wait for manager approval.',
    invitationCode: 'Invitation Code',
  },
  uk: {
    appName: 'FleetCheck Pro',
    tagline: 'Цифрові огляди транспортних засобів для безпечних автопарків',
    getStarted: 'Розпочати',
    companyLogin: 'Вхід для компанії',
    driverRegistration: 'Реєстрація водія',
    dashboard: 'Панель',
    vehicles: 'Транспорт',
    drivers: 'Водії',
    inspections: 'Огляди',
    reports: 'Звіти',
    repairs: 'Ремонти',
    settings: 'Налаштування',
    login: 'Увійти',
    logout: 'Вийти',
    email: 'Ел. пошта',
    password: 'Пароль',
    firstName: "Ім'я",
    lastName: 'Прізвище',
    phone: 'Телефон',
    save: 'Зберегти',
    cancel: 'Скасувати',
    submit: 'Надіслати',
    next: 'Далі',
    back: 'Назад',
    finish: 'Завершити',
    search: 'Пошук...',
    language: 'Мова',
    theme: 'Тема',
    lightMode: 'Світла тема',
    darkMode: 'Темна тема',
    selectLanguage: 'Оберіть мову',
    english: 'Англійська',
    ukrainian: 'Українська',
    spanish: 'Іспанська',
    french: 'Французька',
    preTripInspection: 'Огляд до поїздки',
    postTripInspection: 'Огляд після поїздки',
    startInspection: 'Почати огляд',
    pass: 'Пройдено',
    fail: 'Не пройдено',
    na: 'Н/Д',
    addPhoto: 'Додати фото',
    addComment: 'Додати коментар',
    signHere: 'Підписати тут',
    submitInspection: 'Надіслати огляд',
    inspectionPassed: 'Огляд пройдено',
    inspectionFailed: 'Знайдено проблеми',
    createRepairRequest: 'Створити заявку на ремонт',
    notifyManager: 'Повідомити менеджера',
    pendingApproval: 'Реєстрація очікує підтвердження',
    pendingMessage: 'Вашу реєстрацію подано. Очікуйте підтвердження менеджера.',
    invitationCode: 'Код запрошення',
  },
  es: {
    appName: 'FleetCheck Pro',
    tagline: 'Inspecciones digitales de vehículos para flotas más seguras',
    getStarted: 'Comenzar',
    companyLogin: 'Acceso Empresa',
    driverRegistration: 'Registro de Conductor',
    dashboard: 'Panel',
    vehicles: 'Vehículos',
    drivers: 'Conductores',
    inspections: 'Inspecciones',
    reports: 'Reportes',
    repairs: 'Reparaciones',
    settings: 'Configuración',
    login: 'Iniciar sesión',
    logout: 'Cerrar sesión',
    email: 'Correo electrónico',
    password: 'Contraseña',
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono',
    save: 'Guardar',
    cancel: 'Cancelar',
    submit: 'Enviar',
    next: 'Siguiente',
    back: 'Atrás',
    finish: 'Finalizar',
    search: 'Buscar...',
    language: 'Idioma',
    theme: 'Tema',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Oscuro',
    selectLanguage: 'Seleccionar idioma',
    english: 'Inglés',
    ukrainian: 'Ucraniano',
    spanish: 'Español',
    french: 'Francés',
    preTripInspection: 'Inspección Pre-Viaje',
    postTripInspection: 'Inspección Post-Viaje',
    startInspection: 'Iniciar Inspección',
    pass: 'Aprobado',
    fail: 'Fallido',
    na: 'N/A',
    addPhoto: 'Agregar Foto',
    addComment: 'Agregar Comentario',
    signHere: 'Firmar aquí',
    submitInspection: 'Enviar Inspección',
    inspectionPassed: 'Inspección Aprobada',
    inspectionFailed: 'Problemas Encontrados',
    createRepairRequest: 'Crear Solicitud de Reparación',
    notifyManager: 'Notificar al Gerente',
    pendingApproval: 'Registro Pendiente de Aprobación',
    pendingMessage: 'Su registro ha sido enviado. Espere la aprobación del gerente.',
    invitationCode: 'Código de Invitación',
  },
  fr: {
    appName: 'FleetCheck Pro',
    tagline: 'Inspections numériques de véhicules pour des flottes plus sûres',
    getStarted: 'Commencer',
    companyLogin: 'Connexion Entreprise',
    driverRegistration: 'Inscription Conducteur',
    dashboard: 'Tableau de bord',
    vehicles: 'Véhicules',
    drivers: 'Conducteurs',
    inspections: 'Inspections',
    reports: 'Rapports',
    repairs: 'Réparations',
    settings: 'Paramètres',
    login: 'Connexion',
    logout: 'Déconnexion',
    email: 'E-mail',
    password: 'Mot de passe',
    firstName: 'Prénom',
    lastName: 'Nom de famille',
    phone: 'Téléphone',
    save: 'Enregistrer',
    cancel: 'Annuler',
    submit: 'Soumettre',
    next: 'Suivant',
    back: 'Retour',
    finish: 'Terminer',
    search: 'Rechercher...',
    language: 'Langue',
    theme: 'Thème',
    lightMode: 'Mode Clair',
    darkMode: 'Mode Sombre',
    selectLanguage: 'Sélectionner la langue',
    english: 'Anglais',
    ukrainian: 'Ukrainien',
    spanish: 'Espagnol',
    french: 'Français',
    preTripInspection: 'Inspection Pré-Voyage',
    postTripInspection: 'Inspection Post-Voyage',
    startInspection: "Démarrer l'inspection",
    pass: 'Réussi',
    fail: 'Échoué',
    na: 'N/A',
    addPhoto: 'Ajouter Photo',
    addComment: 'Ajouter Commentaire',
    signHere: 'Signer ici',
    submitInspection: "Soumettre l'inspection",
    inspectionPassed: 'Inspection Réussie',
    inspectionFailed: 'Problèmes Trouvés',
    createRepairRequest: 'Créer une Demande de Réparation',
    notifyManager: 'Notifier le Gestionnaire',
    pendingApproval: "Inscription en attente d'approbation",
    pendingMessage: "Votre inscription a été soumise. Veuillez attendre l'approbation du gestionnaire.",
    invitationCode: "Code d'invitation",
  },
}

export const useAppStore = defineStore('app', () => {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
  const prefDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const theme = ref<'light' | 'dark'>(savedTheme ?? (prefDark ? 'dark' : 'light'))
  const language = ref<Language>((localStorage.getItem('lang') as Language) ?? 'en')
  const role = ref<Role>(null)
  const inspectionResult = ref<'pass' | 'fail' | null>(null)

  watch(theme, (val) => {
    const root = document.documentElement
    if (val === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', val)
  }, { immediate: true })

  watch(language, (val) => {
    localStorage.setItem('lang', val)
  })

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  function setLanguage(lang: Language) {
    language.value = lang
  }

  function setRole(r: Role) {
    role.value = r
  }

  function setInspectionResult(r: 'pass' | 'fail') {
    inspectionResult.value = r
  }

  function t(key: string): string {
    return translations[language.value][key] ?? key
  }

  return { theme, language, role, inspectionResult, toggleTheme, setLanguage, setRole, setInspectionResult, t }
})
