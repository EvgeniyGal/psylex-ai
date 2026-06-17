import type { Locale } from "@/lib/i18n";

export type AdminCopy = {
  adminConsole: string;
  navSessions: string;
  navMediators: string;
  navSettings: string;
  logout: string;
  portalTitle: string;
  searchPlaceholder: string;
  sessionsTitle: string;
  sessionsSubtitle: string;
  newSession: string;
  createSession: string;
  cancel: string;
  close: string;
  deleteSession: string;
  deleteSessionConfirm: string;
  returnToSessions: string;
  createSessionSubtitle: string;
  sessionDetails: string;
  participants: string;
  sessionTitleLabel: string;
  sessionDescriptionLabel: string;
  plaintiffTitleLabel: string;
  plaintiffDescriptionLabel: string;
  defendantTitleLabel: string;
  defendantDescriptionLabel: string;
  titleLabel: string;
  descriptionLabel: string;
  noSessions: string;
  noSearchResults: string;
  tableCreatedAt: string;
  tableStatus: string;
  active: string;
  save: string;
  saveParticipant: string;
  loginLabel: string;
  passwordLabel: string;
  copyCredentials: string;
  magicLink: string;
  magicLinkCopied: string;
  magicLinkFailed: string;
  systemHealth: string;
  stable: string;
  systemHealthDesc: string;
  aiInsight: string;
  aiInsightDesc: string;
  mediatorsTitle: string;
  mediatorsSubtitle: string;
  createMediator: string;
  returnToMediators: string;
  createMediatorSubtitle: string;
  mediatorDetails: string;
  deleteMediator: string;
  deleteMediatorConfirm: string;
  selectSession: string;
  mediatorTitlePlaceholder: string;
  mediatorDescPlaceholder: string;
  noMediators: string;
  saveMediator: string;
  settingsTitle: string;
  settingsSubtitle: string;
  tabCredentials: string;
  tabTests: string;
  credentialsSubtitle: string;
  testsSubtitle: string;
  openaiApiKeyLabel: string;
  airtableApiKeyLabel: string;
  testUrlLabel: string;
  testPersonalityType: string;
  testFaceFear: string;
  testCharacterTraits: string;
  testPersonalityConflicts: string;
  settingsSaved: string;
  comingSoon: string;
  comingSoonDesc: string;
  general: string;
  notifications: string;
  security: string;
  integrations: string;
  settingsPlaceholder: (name: string) => string;
  roles: Record<string, string>;
};

export const adminCopy: Record<Locale, AdminCopy> = {
  en: {
    adminConsole: "Admin Console",
    navSessions: "Sessions",
    navMediators: "Mediators",
    navSettings: "Settings",
    logout: "Logout",
    portalTitle: "Mediation Portal",
    searchPlaceholder: "Search...",
    sessionsTitle: "Active Sessions",
    sessionsSubtitle:
      "Oversee and manage secure mediation environments. Monitor credentials and distribute access links to participating legal parties.",
    newSession: "New Session",
    createSession: "Create Session",
    cancel: "Cancel",
    close: "Close",
    deleteSession: "Delete Session",
    deleteSessionConfirm: "Delete this session and all its participants? This cannot be undone.",
    returnToSessions: "Return to sessions",
    createSessionSubtitle: "Set up the session and both parties. Credentials will be generated when you create the session.",
    sessionDetails: "Session details",
    participants: "Participants",
    sessionTitleLabel: "Session title",
    sessionDescriptionLabel: "Session description",
    plaintiffTitleLabel: "Plaintiff title",
    plaintiffDescriptionLabel: "Plaintiff description",
    defendantTitleLabel: "Defendant title",
    defendantDescriptionLabel: "Defendant description",
    titleLabel: "Title",
    descriptionLabel: "Description",
    noSessions: "No sessions yet. Create your first session to generate plaintiff and defendant credentials.",
    noSearchResults: "No sessions match your search.",
    tableCreatedAt: "Created",
    tableStatus: "Status",
    active: "ACTIVE",
    save: "Save",
    saveParticipant: "Save participant",
    loginLabel: "Login (UUID)",
    passwordLabel: "Password",
    copyCredentials: "Copy Credentials",
    magicLink: "Magic Link",
    magicLinkCopied: "Magic link copied to clipboard",
    magicLinkFailed: "Could not generate magic link",
    systemHealth: "SYSTEM HEALTH",
    stable: "Stable",
    systemHealthDesc: "All mediation nodes operational.",
    aiInsight: "AI INSIGHT PANEL",
    aiInsightDesc:
      "Optimal resolution window detected for active sessions. Recommend facilitating the next session promptly.",
    mediatorsTitle: "Registry",
    mediatorsSubtitle: "Manage credentials and access for accredited legal mediators.",
    createMediator: "Create Mediator",
    returnToMediators: "Return to mediators",
    createMediatorSubtitle: "Add a mediator with title and description. Login and password will be generated automatically.",
    mediatorDetails: "Mediator details",
    deleteMediator: "Delete mediator",
    deleteMediatorConfirm: "Delete this mediator? This cannot be undone.",
    selectSession: "Select session",
    mediatorTitlePlaceholder: "Mediator title",
    mediatorDescPlaceholder: "Mediator description",
    noMediators: "No mediators yet. Create your first mediator to generate credentials.",
    saveMediator: "Save mediator",
    settingsTitle: "Settings",
    settingsSubtitle: "Configure platform preferences and administrative controls.",
    tabCredentials: "Credentials",
    tabTests: "Tests",
    credentialsSubtitle: "Add API keys for external integrations used by the platform.",
    testsSubtitle: "Configure links to personality and conflict assessment tests.",
    openaiApiKeyLabel: "OpenAI API key",
    airtableApiKeyLabel: "Airtable API key",
    testUrlLabel: "Test URL",
    testPersonalityType: "What is my personality type",
    testFaceFear: "Face to face with fear",
    testCharacterTraits: "Character traits",
    testPersonalityConflicts: "Personality conflicts",
    settingsSaved: "Settings saved",
    comingSoon: "COMING SOON",
    comingSoonDesc:
      "Application settings are not yet available in this MVP. Future releases will include notification preferences, branding options, and integration controls.",
    general: "General",
    notifications: "Notifications",
    security: "Security",
    integrations: "Integrations",
    settingsPlaceholder: (name) => `Placeholder for ${name.toLowerCase()} settings.`,
    roles: {
      plaintiff: "Plaintiff",
      defendant: "Defendant",
      mediator: "Mediator",
      admin: "Admin",
    },
  },
  uk: {
    adminConsole: "Адмін-панель",
    navSessions: "Сесії",
    navMediators: "Медіатори",
    navSettings: "Налаштування",
    logout: "Вийти",
    portalTitle: "Портал медіації",
    searchPlaceholder: "Пошук...",
    sessionsTitle: "Активні сесії",
    sessionsSubtitle:
      "Керуйте безпечними середовищами медіації. Переглядайте облікові дані та надсилайте посилання учасникам.",
    newSession: "Нова сесія",
    createSession: "Створити сесію",
    cancel: "Скасувати",
    close: "Закрити",
    deleteSession: "Видалити сесію",
    deleteSessionConfirm: "Видалити цю сесію та всіх учасників? Цю дію не можна скасувати.",
    returnToSessions: "Повернутися до сесій",
    createSessionSubtitle: "Налаштуйте сесію та обидві сторони. Облікові дані буде згенеровано після створення.",
    sessionDetails: "Деталі сесії",
    participants: "Учасники",
    sessionTitleLabel: "Назва сесії",
    sessionDescriptionLabel: "Опис сесії",
    plaintiffTitleLabel: "Назва позивача",
    plaintiffDescriptionLabel: "Опис позивача",
    defendantTitleLabel: "Назва відповідача",
    defendantDescriptionLabel: "Опис відповідача",
    titleLabel: "Назва",
    descriptionLabel: "Опис",
    noSessions: "Сесій ще немає. Створіть першу сесію для генерації облікових даних сторін.",
    noSearchResults: "Немає сесій за вашим запитом.",
    tableCreatedAt: "Створено",
    tableStatus: "Статус",
    active: "АКТИВНА",
    save: "Зберегти",
    saveParticipant: "Зберегти учасника",
    loginLabel: "Логін (UUID)",
    passwordLabel: "Пароль",
    copyCredentials: "Копіювати дані",
    magicLink: "Magic Link",
    magicLinkCopied: "Посилання скопійовано",
    magicLinkFailed: "Не вдалося створити magic link",
    systemHealth: "СТАН СИСТЕМИ",
    stable: "Стабільно",
    systemHealthDesc: "Усі вузли медіації працюють.",
    aiInsight: "AI АНАЛІТИКА",
    aiInsightDesc:
      "Виявлено оптимальне вікно для врегулювання активних сесій. Рекомендуємо провести наступну сесію найближчим часом.",
    mediatorsTitle: "Реєстр",
    mediatorsSubtitle: "Керуйте обліковими даними та доступом акредитованих медіаторів.",
    createMediator: "Створити медіатора",
    returnToMediators: "Повернутися до медіаторів",
    createMediatorSubtitle: "Додайте медіатора з назвою та описом. Логін і пароль буде згенеровано автоматично.",
    mediatorDetails: "Деталі медіатора",
    deleteMediator: "Видалити медіатора",
    deleteMediatorConfirm: "Видалити цього медіатора? Цю дію не можна скасувати.",
    selectSession: "Оберіть сесію",
    mediatorTitlePlaceholder: "Назва медіатора",
    mediatorDescPlaceholder: "Опис медіатора",
    noMediators: "Медіаторів ще немає. Створіть першого медіатора для генерації облікових даних.",
    saveMediator: "Зберегти медіатора",
    settingsTitle: "Налаштування",
    settingsSubtitle: "Налаштування платформи та адміністративні параметри.",
    tabCredentials: "Облікові дані",
    tabTests: "Тести",
    credentialsSubtitle: "Додайте API-ключі для зовнішніх інтеграцій платформи.",
    testsSubtitle: "Налаштуйте посилання на тести особистості та конфліктів.",
    openaiApiKeyLabel: "OpenAI API ключ",
    airtableApiKeyLabel: "Airtable API ключ",
    testUrlLabel: "Посилання на тест",
    testPersonalityType: "Який мій тип характеру",
    testFaceFear: "Віч-на-віч зі страхом",
    testCharacterTraits: "Риси характеру",
    testPersonalityConflicts: "Конфлікти особистості",
    settingsSaved: "Налаштування збережено",
    comingSoon: "НЕЗАБАРОМ",
    comingSoonDesc:
      "Налаштування застосунку ще недоступні в цьому MVP. У майбутніх релізах з’являться сповіщення, брендинг та інтеграції.",
    general: "Загальні",
    notifications: "Сповіщення",
    security: "Безпека",
    integrations: "Інтеграції",
    settingsPlaceholder: (name) => `Заглушка для налаштувань: ${name.toLowerCase()}.`,
    roles: {
      plaintiff: "Позивач",
      defendant: "Відповідач",
      mediator: "Медіатор",
      admin: "Адмін",
    },
  },
};
