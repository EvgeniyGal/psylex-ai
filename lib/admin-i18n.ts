import type { Locale } from "@/lib/i18n";

export type AdminCopy = {
  adminConsole: string;
  mediatorConsole: string;
  navRooms: string;
  navMediators: string;
  navSettings: string;
  logout: string;
  portalTitle: string;
  searchPlaceholder: string;
  roomsTitle: string;
  roomsSubtitle: string;
  newRoom: string;
  createRoom: string;
  cancel: string;
  close: string;
  jurisdictionFieldHelp: string;
  jurisdictionLabel: string;
  jurisdictionUkraineDesc: string;
  jurisdictionUsaDesc: string;
  deleteRoom: string;
  deleteRoomConfirm: string;
  returnToRooms: string;
  createRoomSubtitle: string;
  roomDetails: string;
  participants: string;
  roomTitleLabel: string;
  roomDescriptionLabel: string;
  side1TitleLabel: string;
  side1DescriptionLabel: string;
  side2TitleLabel: string;
  side2DescriptionLabel: string;
  titleLabel: string;
  descriptionLabel: string;
  noRooms: string;
  noAdminRooms: string;
  noMediatorRooms: string;
  noSearchResults: string;
  tabAdminRooms: string;
  tabMediatorRooms: string;
  unknownMediator: string;
  tableCreatedAt: string;
  tableSides: string;
  tableStatus: string;
  active: string;
  save: string;
  saveParticipant: string;
  saveChanges: string;
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
  addMediator: string;
  mediatorTitleLabel: string;
  returnToMediators: string;
  createMediatorSubtitle: string;
  mediatorDetails: string;
  deleteMediator: string;
  deleteMediatorConfirm: string;
  selectRoom: string;
  mediatorTitlePlaceholder: string;
  mediatorDescPlaceholder: string;
  noMediators: string;
  saveMediator: string;
  tableActions: string;
  openCard: string;
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
  tabPrompts: string;
  promptsComingSoonDesc: string;
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
    mediatorConsole: "Mediator Console",
    navRooms: "Rooms",
    navMediators: "Mediators",
    navSettings: "Settings",
    logout: "Logout",
    portalTitle: "Mediation Portal",
    searchPlaceholder: "Search...",
    roomsTitle: "Negotiation Rooms",
    roomsSubtitle:
      "Oversee and manage secure mediation environments. Monitor credentials and distribute access links to participating parties.",
    newRoom: "New Room",
    createRoom: "Create Room",
    cancel: "Cancel",
    close: "Close",
    jurisdictionFieldHelp:
      "Choose the legal jurisdiction for this room. This determines which laws and precedents apply throughout the mediation process.",
    jurisdictionLabel: "Jurisdiction",
    jurisdictionUkraineDesc: "Ukrainian law and legal practice",
    jurisdictionUsaDesc: "United States law and legal practice",
    deleteRoom: "Delete Room",
    deleteRoomConfirm: "Delete this room and all its participants? This cannot be undone.",
    returnToRooms: "Return to rooms",
    createRoomSubtitle: "Set up the room and both sides. Credentials will be generated when you create the room.",
    roomDetails: "Room details",
    participants: "Participants",
    roomTitleLabel: "Room title",
    roomDescriptionLabel: "Room description",
    side1TitleLabel: "Title / Name",
    side1DescriptionLabel: "Description",
    side2TitleLabel: "Title / Name",
    side2DescriptionLabel: "Description",
    titleLabel: "Title",
    descriptionLabel: "Description",
    noRooms: "No rooms yet. Create your first room to generate Sides credentials.",
    noAdminRooms: "No admin rooms yet. Create a room to generate participant credentials.",
    noMediatorRooms: "No mediator rooms yet.",
    noSearchResults: "No rooms match your search.",
    tabAdminRooms: "Admin rooms",
    tabMediatorRooms: "Mediator rooms",
    unknownMediator: "Unknown mediator",
    tableCreatedAt: "Created",
    tableSides: "Sides",
    tableStatus: "Status",
    active: "ACTIVE",
    save: "Save",
    saveParticipant: "Save participant",
    saveChanges: "Save Changes",
    loginLabel: "Login",
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
      "Optimal resolution window detected for active negotiation rooms. Recommend facilitating the next room promptly.",
    mediatorsTitle: "Registry",
    mediatorsSubtitle: "Manage credentials and access for accredited legal mediators.",
    createMediator: "Create Mediator",
    addMediator: "Add Mediator",
    mediatorTitleLabel: "Title / Name",
    returnToMediators: "Return to mediators",
    createMediatorSubtitle: "Add a mediator with title/name and description. Login and password will be generated automatically.",
    mediatorDetails: "Mediator details",
    deleteMediator: "Delete mediator",
    deleteMediatorConfirm: "Delete this mediator? This cannot be undone.",
    selectRoom: "Select room",
    mediatorTitlePlaceholder: "Mediator title/name",
    mediatorDescPlaceholder: "Mediator description",
    noMediators: "No mediators yet. Create your first mediator to generate credentials.",
    saveMediator: "Save Changes",
    tableActions: "Actions",
    openCard: "Open card",
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
    tabPrompts: "Prompts",
    promptsComingSoonDesc:
      "AI prompt configuration will be available here in a future release.",
    comingSoon: "COMING SOON",
    comingSoonDesc:
      "Application settings are not yet available in this MVP. Future releases will include notification preferences, branding options, and integration controls.",
    general: "General",
    notifications: "Notifications",
    security: "Security",
    integrations: "Integrations",
    settingsPlaceholder: (name) => `Placeholder for ${name.toLowerCase()} settings.`,
    roles: {
      side1: "Side 1",
      side2: "Side 2",
      mediator: "Mediator",
      admin: "Admin",
    },
  },
  uk: {
    adminConsole: "Адмін-панель",
    mediatorConsole: "Панель медіатора",
    navRooms: "Кімнати",
    navMediators: "Медіатори",
    navSettings: "Налаштування",
    logout: "Вийти",
    portalTitle: "Портал медіації",
    searchPlaceholder: "Пошук...",
    roomsTitle: "Кімнати перемовин",
    roomsSubtitle:
      "Керуйте безпечними середовищами медіації. Переглядайте облікові дані та надсилайте посилання учасникам.",
    newRoom: "Нова кімната",
    createRoom: "Створити кімнату",
    cancel: "Скасувати",
    close: "Закрити",
    jurisdictionFieldHelp:
      "Оберіть правову юрисдикцію для цієї кімнати. Вона визначатиме, які закони та прецеденти застосовуватимуться під час медіації.",
    jurisdictionLabel: "Юрисдикція",
    jurisdictionUkraineDesc: "Українське право та судова практика",
    jurisdictionUsaDesc: "Право США та судова практика",
    deleteRoom: "Видалити кімнату",
    deleteRoomConfirm: "Видалити цю кімнату та всіх учасників? Цю дію не можна скасувати.",
    returnToRooms: "Повернутися до кімнат",
    createRoomSubtitle: "Налаштуйте кімнату та обидві сторони. Облікові дані буде згенеровано після створення.",
    roomDetails: "Деталі кімнати",
    participants: "Учасники",
    roomTitleLabel: "Назва кімнати",
    roomDescriptionLabel: "Опис кімнати",
    side1TitleLabel: "Назва / Ім'я",
    side1DescriptionLabel: "Опис",
    side2TitleLabel: "Назва / Ім'я",
    side2DescriptionLabel: "Опис",
    titleLabel: "Назва",
    descriptionLabel: "Опис",
    noRooms: "Кімнат ще немає. Створіть першу кімнату для генерації облікових даних сторін.",
    noAdminRooms: "Адміністративних кімнат ще немає. Створіть кімнату для генерації облікових даних учасників.",
    noMediatorRooms: "Кімнат медіаторів ще немає.",
    noSearchResults: "Немає кімнат за вашим запитом.",
    tabAdminRooms: "Кімнати адміна",
    tabMediatorRooms: "Кімнати медіаторів",
    unknownMediator: "Невідомий медіатор",
    tableCreatedAt: "Створено",
    tableSides: "Сторони",
    tableStatus: "Статус",
    active: "АКТИВНА",
    save: "Зберегти",
    saveParticipant: "Зберегти учасника",
    saveChanges: "Зберегти зміни",
    loginLabel: "Логін",
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
      "Виявлено оптимальне вікно для врегулювання в активних кімнатах перемовин. Рекомендуємо провести наступну кімнату найближчим часом.",
    mediatorsTitle: "Реєстр",
    mediatorsSubtitle: "Керуйте обліковими даними та доступом акредитованих медіаторів.",
    createMediator: "Створити медіатора",
    addMediator: "Додати медіатора",
    mediatorTitleLabel: "Назва / Ім'я",
    returnToMediators: "Повернутися до медіаторів",
    createMediatorSubtitle: "Додайте медіатора з назвою/ім'ям та описом. Логін і пароль буде згенеровано автоматично.",
    mediatorDetails: "Деталі медіатора",
    deleteMediator: "Видалити медіатора",
    deleteMediatorConfirm: "Видалити цього медіатора? Цю дію не можна скасувати.",
    selectRoom: "Оберіть кімнату",
    mediatorTitlePlaceholder: "Назва/ім'я медіатора",
    mediatorDescPlaceholder: "Опис медіатора",
    noMediators: "Медіаторів ще немає. Створіть першого медіатора для генерації облікових даних.",
    saveMediator: "Зберегти зміни",
    tableActions: "Дії",
    openCard: "Відкрити",
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
    tabPrompts: "Промпти",
    promptsComingSoonDesc:
      "Налаштування AI-промптів буде доступне тут у майбутньому релізі.",
    comingSoon: "НЕЗАБАРОМ",
    comingSoonDesc:
      "Налаштування застосунку ще недоступні в цьому MVP. У майбутніх релізах з’являться сповіщення, брендинг та інтеграції.",
    general: "Загальні",
    notifications: "Сповіщення",
    security: "Безпека",
    integrations: "Інтеграції",
    settingsPlaceholder: (name) => `Заглушка для налаштувань: ${name.toLowerCase()}.`,
    roles: {
      side1: "Сторона 1",
      side2: "Сторона 2",
      mediator: "Медіатор",
      admin: "Адмін",
    },
  },
};
