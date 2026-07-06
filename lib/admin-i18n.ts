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
  roomUsaSubJurisdiction: string;
  roomUsaSubJurisdictionHelp: string;
  deleteRoom: string;
  deleteRoomConfirm: string;
  returnToRooms: string;
  createRoomSubtitle: string;
  roomDetails: string;
  participants: string;
  roomTitleLabel: string;
  roomDescriptionLabel: string;
  partyATitleLabel: string;
  partyADescriptionLabel: string;
  partyBTitleLabel: string;
  partyBDescriptionLabel: string;
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
  tabRag: string;
  ragSubtitle: string;
  ragUploadDocument: string;
  ragDocumentName: string;
  ragSourceUrl: string;
  ragCategory: string;
  ragCategoryFilter: string;
  ragAllCategories: string;
  ragJurisdictionUkraine: string;
  ragJurisdictionUsa: string;
  ragUsaSubJurisdiction: string;
  ragUsaSubJurisdictionFilter: string;
  ragAllUsaSubJurisdictions: string;
  ragUsaSubJurisdictionHint: string;
  ragUpload: string;
  ragUploading: string;
  ragUploadingHint: string;
  ragEditDocument: string;
  ragDeleteDocument: string;
  ragDeleteConfirm: string;
  ragReprocess: string;
  ragStatusPending: string;
  ragStatusProcessing: string;
  ragStatusReady: string;
  ragStatusFailed: string;
  ragNoDocuments: string;
  ragTestInquiry: string;
  ragTestQuestion: string;
  ragTestSubmit: string;
  ragTestSelectDocument: string;
  ragTestAllDocuments: string;
  ragTestPreparedQueries: string;
  ragDocumentUploaded: string;
  ragDocumentUpdated: string;
  ragDocumentDeleted: string;
  ragProcessingIncomplete: string;
  ragFileLabel: string;
  promptsComingSoonDesc: string;
  agentPromptsSubtitle: string;
  agentTabPsychodynamic: string;
  agentTabInterests: string;
  agentTabEmotionalTriggers: string;
  agentTabLegalAnalysis: string;
  agentSystemPrompt: string;
  agentTestPanel: string;
  agentTestSelectUser: string;
  agentTestSelectRoom: string;
  agentTestRun: string;
  agentTestInput: string;
  agentTestResult: string;
  agentTestPersonalBotPrompt: string;
  agentTestDisputeAnswers: string;
  agentTestJurisdiction: string;
  agentTestResponseLocale: string;
  agentLegalNotFoundTitle: string;
  agentPromptSaved: string;
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
    roomUsaSubJurisdiction: "State / territory",
    roomUsaSubJurisdictionHelp: "Select the US state or territory whose law applies to this dispute.",
    deleteRoom: "Delete Room",
    deleteRoomConfirm: "Delete this room and all its participants? This cannot be undone.",
    returnToRooms: "Return to rooms",
    createRoomSubtitle: "Set up the room and both sides. Credentials will be generated when you create the room.",
    roomDetails: "Room details",
    participants: "Participants",
    roomTitleLabel: "Room title",
    roomDescriptionLabel: "Room description",
    partyATitleLabel: "Title / Name",
    partyADescriptionLabel: "Description",
    partyBTitleLabel: "Title / Name",
    partyBDescriptionLabel: "Description",
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
    tabRag: "RAG",
    ragSubtitle: "Manage legal documents for hybrid retrieval. Upload legislation by jurisdiction and category.",
    ragUploadDocument: "Upload document",
    ragDocumentName: "Document name",
    ragSourceUrl: "Source URL",
    ragCategory: "Category",
    ragCategoryFilter: "Filter by category",
    ragAllCategories: "All categories",
    ragJurisdictionUkraine: "Ukraine",
    ragJurisdictionUsa: "United States",
    ragUsaSubJurisdiction: "State / territory",
    ragUsaSubJurisdictionFilter: "Filter by state / territory",
    ragAllUsaSubJurisdictions: "All states & territories",
    ragUsaSubJurisdictionHint:
      "Documents are stored per state. Select the matching state (e.g. Florida for FL statutes) or leave as all states.",
    ragUpload: "Upload",
    ragUploading: "Uploading document…",
    ragUploadingHint: "Extracting text and building the search index. This may take a moment.",
    ragEditDocument: "Edit document",
    ragDeleteDocument: "Delete",
    ragDeleteConfirm: "Delete this document and all indexed chunks?",
    ragReprocess: "Reprocess",
    ragStatusPending: "Pending",
    ragStatusProcessing: "Processing",
    ragStatusReady: "Ready",
    ragStatusFailed: "Failed",
    ragNoDocuments: "No documents yet.",
    ragTestInquiry: "Test inquiry",
    ragTestQuestion: "Ask a question about the corpus",
    ragTestSubmit: "Run inquiry",
    ragTestSelectDocument: "Document (optional)",
    ragTestAllDocuments: "Search entire jurisdiction",
    ragTestPreparedQueries: "Prepared search queries",
    ragDocumentUploaded: "Document uploaded",
    ragDocumentUpdated: "Document updated",
    ragDocumentDeleted: "Document deleted",
    ragProcessingIncomplete: "Document processing is not complete.",
    ragFileLabel: "File (TXT, PDF, DOCX)",
    promptsComingSoonDesc:
      "AI prompt configuration will be available here in a future release.",
    agentPromptsSubtitle: "Edit system prompts and test each post-intake analysis agent in isolation.",
    agentTabPsychodynamic: "Psychodynamic",
    agentTabInterests: "Interests",
    agentTabEmotionalTriggers: "Emotional Triggers",
    agentTabLegalAnalysis: "Legal Analysis",
    agentSystemPrompt: "System prompt",
    agentTestPanel: "Test agent",
    agentTestSelectUser: "Select participant",
    agentTestSelectRoom: "Select room",
    agentTestRun: "Run test",
    agentTestInput: "Input data",
    agentTestResult: "Result",
    agentTestPersonalBotPrompt: "Personal bot prompt",
    agentTestDisputeAnswers: "Dispute answers",
    agentTestJurisdiction: "Jurisdiction",
    agentTestResponseLocale: "Response language",
    agentLegalNotFoundTitle: "No relevant legal information found",
    agentPromptSaved: "Agent prompt saved",
    comingSoon: "COMING SOON",
    comingSoonDesc:
      "Application settings are not yet available in this MVP. Future releases will include notification preferences, branding options, and integration controls.",
    general: "General",
    notifications: "Notifications",
    security: "Security",
    integrations: "Integrations",
    settingsPlaceholder: (name) => `Placeholder for ${name.toLowerCase()} settings.`,
    roles: {
      party_a: "Party A",
      party_b: "Party B",
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
    roomUsaSubJurisdiction: "Штат / територія",
    roomUsaSubJurisdictionHelp: "Оберіть штат або територію США, право яких застосовується до цього спору.",
    deleteRoom: "Видалити кімнату",
    deleteRoomConfirm: "Видалити цю кімнату та всіх учасників? Цю дію не можна скасувати.",
    returnToRooms: "Повернутися до кімнат",
    createRoomSubtitle: "Налаштуйте кімнату та обидві сторони. Облікові дані буде згенеровано після створення.",
    roomDetails: "Деталі кімнати",
    participants: "Учасники",
    roomTitleLabel: "Назва кімнати",
    roomDescriptionLabel: "Опис кімнати",
    partyATitleLabel: "Назва / Ім'я",
    partyADescriptionLabel: "Опис",
    partyBTitleLabel: "Назва / Ім'я",
    partyBDescriptionLabel: "Опис",
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
    tabRag: "RAG",
    ragSubtitle: "Керуйте правовими документами для гібридного пошуку. Завантажуйте законодавство за юрисдикцією та категорією.",
    ragUploadDocument: "Завантажити документ",
    ragDocumentName: "Назва документа",
    ragSourceUrl: "Посилання на джерело",
    ragCategory: "Категорія",
    ragCategoryFilter: "Фільтр за категорією",
    ragAllCategories: "Усі категорії",
    ragJurisdictionUkraine: "Україна",
    ragJurisdictionUsa: "США",
    ragUsaSubJurisdiction: "Штат / територія",
    ragUsaSubJurisdictionFilter: "Фільтр за штатом / територією",
    ragAllUsaSubJurisdictions: "Усі штати та території",
    ragUsaSubJurisdictionHint:
      "Документи прив’язані до штату. Оберіть відповідний штат (наприклад, Флорида для законів FL) або залиште «Усі штати».",
    ragUpload: "Завантажити",
    ragUploading: "Завантаження документа…",
    ragUploadingHint: "Витягуємо текст і будуємо пошуковий індекс. Це може зайняти деякий час.",
    ragEditDocument: "Редагувати документ",
    ragDeleteDocument: "Видалити",
    ragDeleteConfirm: "Видалити цей документ і всі проіндексовані фрагменти?",
    ragReprocess: "Переобробити",
    ragStatusPending: "Очікує",
    ragStatusProcessing: "Обробка",
    ragStatusReady: "Готово",
    ragStatusFailed: "Помилка",
    ragNoDocuments: "Документів ще немає.",
    ragTestInquiry: "Тестовий запит",
    ragTestQuestion: "Поставте питання щодо корпусу",
    ragTestSubmit: "Запустити запит",
    ragTestSelectDocument: "Документ (необов'язково)",
    ragTestAllDocuments: "Шукати в усій юрисдикції",
    ragTestPreparedQueries: "Підготовлені пошукові запити",
    ragDocumentUploaded: "Документ завантажено",
    ragDocumentUpdated: "Документ оновлено",
    ragDocumentDeleted: "Документ видалено",
    ragProcessingIncomplete: "Обробка документа ще не завершена.",
    ragFileLabel: "Файл (TXT, PDF, DOCX)",
    promptsComingSoonDesc:
      "Налаштування AI-промптів буде доступне тут у майбутньому релізі.",
    agentPromptsSubtitle: "Редагуйте системні промпти та тестуйте кожного агента пост-інтейк аналізу окремо.",
    agentTabPsychodynamic: "Психодинаміка",
    agentTabInterests: "Інтереси",
    agentTabEmotionalTriggers: "Емоційні тригери",
    agentTabLegalAnalysis: "Правовий аналіз",
    agentSystemPrompt: "Системний промпт",
    agentTestPanel: "Тест агента",
    agentTestSelectUser: "Оберіть учасника",
    agentTestSelectRoom: "Оберіть кімнату",
    agentTestRun: "Запустити тест",
    agentTestInput: "Вхідні дані",
    agentTestResult: "Результат",
    agentTestPersonalBotPrompt: "Промпт персонального бота",
    agentTestDisputeAnswers: "Відповіді про спір",
    agentTestJurisdiction: "Юрисдикція",
    agentTestResponseLocale: "Мова відповіді",
    agentLegalNotFoundTitle: "Релевантну правову інформацію не знайдено",
    agentPromptSaved: "Промпт агента збережено",
    comingSoon: "НЕЗАБАРОМ",
    comingSoonDesc:
      "Налаштування застосунку ще недоступні в цьому MVP. У майбутніх релізах з’являться сповіщення, брендинг та інтеграції.",
    general: "Загальні",
    notifications: "Сповіщення",
    security: "Безпека",
    integrations: "Інтеграції",
    settingsPlaceholder: (name) => `Заглушка для налаштувань: ${name.toLowerCase()}.`,
    roles: {
      party_a: "Сторона А",
      party_b: "Сторона Б",
      mediator: "Медіатор",
      admin: "Адмін",
    },
  },
};
