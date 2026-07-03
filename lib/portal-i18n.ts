import type { Locale } from "@/lib/i18n";
import type { ParticipantRole } from "@/lib/participant-roles";
import type { TestKey } from "@/lib/test-keys";

type RoleCopy = {
  welcomeTitle: string;
  welcomeBody: string;
  welcomeCta: string;
  disclaimerIntro: string;
  disclaimerParagraphs: string[];
  testsTitle: string;
  testsSubtitle: string;
};

type PortalCopy = {
  brand: string;
  roleLabel: string;
  roles: Record<ParticipantRole, string>;
  confidential: string;
  disclaimerTitle: string;
  importantInfo: string;
  consentLabel: string;
  proceed: string;
  proceedLoading: string;
  secureEnv: string;
  testsHint: string;
  nextStep: string;
  passed: string;
  notPassed: string;
  locked: string;
  pendingCompletion: string;
  openTest: string;
  updateTestStatus: string;
  updateBotStatus: string;
  personalBoardTitle: string;
  personalBoardReady: string;
  personalBoardPending: string;
  personalBoardReadySubtitle: string;
  personalBoardPendingSubtitle: string;
  personalBoardLockedSubtitle: string;
  testMeta: Record<TestKey, { title: string; subtitle: string; icon: string }>;
  participant: RoleCopy;
  mediator: RoleCopy;
  dashboardTitle: string;
  dashboardBody: string;
  dashboardEnterRoom: string;
  disputeIntakeTitle: string;
  disputeIntakeSubtitle: string;
  disputeIntakeQ1: string;
  disputeIntakeQ2: string;
  disputeIntakeQ3: string;
  disputeIntakeSubmit: string;
  disputeIntakeSubmitting: string;
  mediationLobbyTitle: string;
  mediationLobbySubtitle: string;
  mediationOppositeSide: string;
  mediationStatusReady: string;
  mediationStatusNotReady: string;
  mediationOppositeNotReady: string;
  mediationStart: string;
  mediationYourStatus: string;
  mediationAgentsWorking: string;
  mediationHandshakeWaiting: string;
  mediationHandshakeOppositeReady: string;
  mediationHandshakeExpired: string;
  mediationHandshakeWindowRemaining: string;
  mediationCountdownLabel: string;
  mediationSessionEnded: string;
  backToStart: string;
  logout: string;
  roomTitle: string;
  roomComingSoon: string;
  roomComingSoonDesc: string;
};

export const portalCopy: Record<Locale, PortalCopy> = {
  en: {
    brand: "PsyLex",
    roleLabel: "Role",
    roles: {
      side1: "Side 1",
      side2: "Side 2",
      mediator: "Mediator",
    },
    confidential: "Your responses are strictly confidential",
    disclaimerTitle: "Disclaimer & Consent",
    importantInfo: "Important Information",
    consentLabel: "I have read and agree to the terms of participation.",
    proceed: "Proceed to Next Step",
    proceedLoading: "Checking test completion…",
    secureEnv: "Secure & Confidential Environment",
    testsHint:
      "Complete all tests and wait for your personal AI bot to be ready before proceeding. Results may take up to two hours to process after you submit a test.",
    nextStep: "Next Step",
    passed: "Passed",
    notPassed: "Not passed",
    locked: "Locked until prerequisites met",
    pendingCompletion: "Pending completion",
    openTest: "Open test",
    updateTestStatus: "Update test status",
    updateBotStatus: "Update bot status",
    personalBoardTitle: "Personal AI Bot",
    personalBoardReady: "Ready",
    personalBoardPending: "Pending",
    personalBoardReadySubtitle: "Your personal AI bot is ready",
    personalBoardPendingSubtitle: "Processing your profile — this may take up to two hours",
    personalBoardLockedSubtitle: "Available after all tests are completed",
    testMeta: {
      personality_type: {
        title: "What is my personality type",
        subtitle: "Core assessment module",
        icon: "psychology",
      },
      face_fear: {
        title: "Face to face with fear",
        subtitle: "Emotional resilience module",
        icon: "mood_bad",
      },
      character_traits: {
        title: "Character traits",
        subtitle: "In-depth analysis",
        icon: "analytics",
      },
      personality_conflicts: {
        title: "Personality conflicts",
        subtitle: "Conflict dynamics module",
        icon: "gavel",
      },
    },
    participant: {
      welcomeTitle: "Welcome to the application",
      welcomeBody:
        "This tool will help you assess your psychological state, identify your strengths, and prepare for the next steps in your case.",
      welcomeCta: "Start Assessment",
      disclaimerIntro:
        "Please review the following information carefully before proceeding with the mediation process.",
      disclaimerParagraphs: [
        "This service does not provide professional legal advice and is not a substitute for therapy. The tools and insights provided by PsyLex are intended to facilitate communication and structured negotiation.",
        "Participation in this platform is completely voluntary. You may choose to pause or exit the process at any time without penalty.",
        "All your responses remain strictly confidential and are protected by enterprise-grade encryption.",
      ],
      testsTitle: "Psychological Assessment",
      testsSubtitle: "Complete the required modules below to proceed with your mediation profile.",
    },
    mediator: {
      welcomeTitle: "Welcome, Mediator",
      welcomeBody:
        "This platform will help you facilitate structured mediation, review psychological profiles, and guide parties toward a balanced resolution.",
      welcomeCta: "Begin Mediator Setup",
      disclaimerIntro:
        "Please review the following information carefully before facilitating sessions on this platform.",
      disclaimerParagraphs: [
        "As a mediator, you facilitate communication between parties. PsyLex does not replace your professional judgment, legal counsel, or therapeutic services.",
        "You are responsible for maintaining neutrality and confidentiality throughout the mediation process. Participation remains voluntary for all parties.",
        "All session data and psychological assessments are confidential and protected by enterprise-grade encryption.",
      ],
      testsTitle: "Mediator Assessment",
      testsSubtitle: "Complete the required modules below to build your mediator profile and unlock session tools.",
    },
    dashboardTitle: "You're all set",
    dashboardBody: "Your onboarding is complete. Enter your mediation room when you are ready.",
    dashboardEnterRoom: "Enter mediation room",
    disputeIntakeTitle: "Describe your dispute",
    disputeIntakeSubtitle:
      "Please answer the following questions so we can prepare your mediation session.",
    disputeIntakeQ1: "Please describe the dispute in your own words.",
    disputeIntakeQ2: "What is most important to you in this dispute?",
    disputeIntakeQ3: "What outcome would you consider acceptable?",
    disputeIntakeSubmit: "Submit answers",
    disputeIntakeSubmitting: "Submitting…",
    mediationLobbyTitle: "Mediation readiness",
    mediationLobbySubtitle: "Both sides must complete onboarding and answer the dispute questions before mediation can begin.",
    mediationOppositeSide: "Opposite side",
    mediationStatusReady: "Ready for mediation",
    mediationStatusNotReady: "Not ready for mediation",
    mediationOppositeNotReady:
      "The opposite side is not ready for mediation yet. They may still be completing tests or answering the dispute questions.",
    mediationStart: "Start Mediation",
    mediationYourStatus: "Your status",
    mediationAgentsWorking:
      "Our analysis agents are preparing your mediation session. This may take several minutes. Please wait — the Start Mediation button will become available when analysis is complete.",
    mediationHandshakeWaiting:
      "You clicked Start Mediation. Waiting for the opposite side to click as well.",
    mediationHandshakeOppositeReady:
      "The opposite side is ready to start. Click Start Mediation within the next minute to join the session together.",
    mediationHandshakeExpired:
      "The one-minute start window expired. Both sides need to click Start Mediation again.",
    mediationHandshakeWindowRemaining: "Time remaining for the opposite side to join: {seconds}s",
    mediationCountdownLabel: "Session time remaining",
    mediationSessionEnded: "The 20-minute mediation session has ended.",
    backToStart: "Back to start",
    logout: "Logout",
    roomTitle: "Mediation room",
    roomComingSoon: "COMING SOON",
    roomComingSoonDesc: "Mediation room features are being rebuilt and will be available in a future release.",
  },
  uk: {
    brand: "PsyLex",
    roleLabel: "Роль",
    roles: {
      side1: "Сторона 1",
      side2: "Сторона 2",
      mediator: "Медіатор",
    },
    confidential: "Ваші відповіді суворо конфіденційні",
    disclaimerTitle: "Відмова та згода",
    importantInfo: "Важлива інформація",
    consentLabel: "Я прочитав(ла) та погоджуюсь з умовами участі.",
    proceed: "Перейти до наступного кроку",
    proceedLoading: "Перевіряємо проходження тестів…",
    secureEnv: "Безпечне та конфіденційне середовище",
    testsHint:
      "Пройдіть усі тести та дочекайтеся готовності персонального ШІ-бота, перш ніж продовжити. Обробка результатів після надсилання тесту може тривати до двох годин.",
    nextStep: "Наступний крок",
    passed: "Пройдено",
    notPassed: "Не пройдено",
    locked: "Заблоковано до виконання попередніх",
    pendingCompletion: "Очікує завершення",
    openTest: "Відкрити тест",
    updateTestStatus: "Оновити статус тестів",
    updateBotStatus: "Оновити статус бота",
    personalBoardTitle: "Персональний ШІ-бот",
    personalBoardReady: "Готово",
    personalBoardPending: "Очікується",
    personalBoardReadySubtitle: "Ваш персональний ШІ-бот готовий",
    personalBoardPendingSubtitle: "Обробка профілю — це може зайняти до двох годин",
    personalBoardLockedSubtitle: "Доступно після проходження всіх тестів",
    testMeta: {
      personality_type: {
        title: "Який мій тип характеру",
        subtitle: "Базовий модуль оцінювання",
        icon: "psychology",
      },
      face_fear: {
        title: "Обличчям до страху",
        subtitle: "Модуль емоційної стійкості",
        icon: "mood_bad",
      },
      character_traits: {
        title: "Риси характеру",
        subtitle: "Поглиблений аналіз",
        icon: "analytics",
      },
      personality_conflicts: {
        title: "Конфлікти особистості",
        subtitle: "Модуль динаміки конфліктів",
        icon: "gavel",
      },
    },
    participant: {
      welcomeTitle: "Ласкаво просимо до застосунку",
      welcomeBody:
        "Цей інструмент допоможе вам оцінити психологічний стан, визначити сильні сторони та підготуватися до наступних кроків у вашій справі.",
      welcomeCta: "Почати оцінювання",
      disclaimerIntro:
        "Уважно ознайомтеся з наведеною інформацією перед початком процесу медіації.",
      disclaimerParagraphs: [
        "Цей сервіс не надає професійних юридичних порад і не є заміною терапії. Інструменти та аналітика PsyLex призначені для полегшення комунікації та структурованих переговорів.",
        "Участь на платформі є повністю добровільною. Ви можете призупинити або завершити процес у будь-який момент без наслідків.",
        "Усі ваші відповіді залишаються суворо конфіденційними та захищені шифруванням корпоративного рівня.",
      ],
      testsTitle: "Психологічне оцінювання",
      testsSubtitle: "Пройдіть обов'язкові модулі нижче, щоб продовжити формування профілю медіації.",
    },
    mediator: {
      welcomeTitle: "Ласкаво просимо, медіаторе",
      welcomeBody:
        "Ця платформа допоможе вам проводити структуровану медіацію, переглядати психологічні профілі та спрямовувати сторони до збалансованого рішення.",
      welcomeCta: "Почати налаштування медіатора",
      disclaimerIntro:
        "Уважно ознайомтеся з наведеною інформацією перед проведенням сесій на цій платформі.",
      disclaimerParagraphs: [
        "Як медіатор, ви сприяєте комунікації між сторонами. PsyLex не замінює ваш професійний судж, юридичні консультації чи терапевтичні послуги.",
        "Ви відповідаєте за нейтральність і конфіденційність протягом усього процесу медіації. Участь усіх сторін залишається добровільною.",
        "Усі дані сесій та психологічні оцінювання є конфіденційними та захищені шифруванням корпоративного рівня.",
      ],
      testsTitle: "Оцінювання медіатора",
      testsSubtitle: "Пройдіть обов'язкові модулі нижче, щоб сформувати профіль медіатора та розблокувати інструменти сесій.",
    },
    dashboardTitle: "Усе готово",
    dashboardBody: "Онбординг завершено. Увійдіть до кімнати медіації, коли будете готові.",
    dashboardEnterRoom: "Увійти до кімнати медіації",
    disputeIntakeTitle: "Опишіть ваш спір",
    disputeIntakeSubtitle:
      "Будь ласка, дайте відповіді на наступні запитання, щоб ми могли підготувати сесію медіації.",
    disputeIntakeQ1: "Опишіть, будь ласка, суть спору у довільній формі.",
    disputeIntakeQ2: "Що для вас є найважливішим у цьому конфлікті?",
    disputeIntakeQ3: "Який результат ви вважаєте прийнятним?",
    disputeIntakeSubmit: "Надіслати відповіді",
    disputeIntakeSubmitting: "Надсилання…",
    mediationLobbyTitle: "Готовність до медіації",
    mediationLobbySubtitle:
      "Обидві сторони мають завершити онбординг і відповісти на запитання про спір, перш ніж можна почати медіацію.",
    mediationOppositeSide: "Інша сторона",
    mediationStatusReady: "Готова до медіації",
    mediationStatusNotReady: "Не готова до медіації",
    mediationOppositeNotReady:
      "Інша сторона ще не готова до медіації. Вона може ще проходити тести або відповідати на запитання про спір.",
    mediationStart: "Почати медіацію",
    mediationYourStatus: "Ваш статус",
    mediationAgentsWorking:
      "Агенти аналізу готують вашу сесію медіації. Це може зайняти кілька хвилин. Зачекайте — кнопка «Почати медіацію» стане доступною після завершення аналізу.",
    mediationHandshakeWaiting:
      "Ви натиснули «Почати медіацію». Очікуємо, поки інша сторона також натисне кнопку.",
    mediationHandshakeOppositeReady:
      "Інша сторона готова почати. Натисніть «Почати медіацію» протягом наступної хвилини, щоб разом увійти в сесію.",
    mediationHandshakeExpired:
      "Хвилинне вікно для старту минуло. Обидві сторони мають знову натиснути «Почати медіацію».",
    mediationHandshakeWindowRemaining: "Час для приєднання іншої сторони: {seconds} с",
    mediationCountdownLabel: "Час сесії",
    mediationSessionEnded: "20-хвилинна сесія медіації завершилася.",
    backToStart: "На головну",
    logout: "Вийти",
    roomTitle: "Кімната медіації",
    roomComingSoon: "НЕЗАБАРОМ",
    roomComingSoonDesc: "Функції кімнати медіації перебудовуються та будуть доступні в майбутньому релізі.",
  },
};

export function getRoleCopy(role: ParticipantRole, locale: Locale): RoleCopy {
  const copy = portalCopy[locale];
  return role === "mediator" ? copy.mediator : copy.participant;
}
