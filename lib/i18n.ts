export type Locale = "en" | "uk";

export const localeStorageKey = "psylex-locale";

type Copy = {
  headline: string;
  headlineAccent: string;
  subheadline: string;
  start: string;
  mediators: string;
  login: string;
  win1: string;
  win2: string;
  win3: string;
  winFooter: string;
  psylexTitle: string;
  attorneyTitle: string;
  psylexPoints: string[];
  attorneyPoints: string[];
  howTitle: string;
  modeA: string;
  modeB: string;
  modeASteps: { title: string; body: string }[];
  modeBSteps: { title: string; body: string }[];
  disclaimer: string;
  footerLinks: { disclaimer: string; privacy: string; howItWorks: string };
};

export const copy: Record<Locale, Copy> = {
  en: {
    headline: "Conflict doesn't need a winner.",
    headlineAccent: "It needs a solution.",
    subheadline: "AI helps both sides find what they really need — together.",
    start: "Start on my own",
    mediators: "For Mediators →",
    login: "Login",
    win1: "Side A gets what they truly need.",
    win2: "Side B gets what they truly need.",
    win3: "Agreement is real and signed.",
    winFooter:
      '"Mediation is not a compromise for the sake of compromise. It is a search for a solution where each party receives what is important."',
    psylexTitle: "PsyLex Resolution",
    attorneyTitle: "Traditional Attorney",
    psylexPoints: [
      "Affordable for everyone",
      "Both sides find a way out",
      "Goal is to agree",
      "Solution in one session",
      "Working together for a solution",
    ],
    attorneyPoints: [
      "$300–700 per hour",
      "Someone loses",
      "Goal is to win",
      "Conflict for months",
      "You against them",
    ],
    howTitle: "How It Works",
    modeA: "Mode A: Self-Resolution",
    modeB: "Mode B: For Mediators",
    modeASteps: [
      {
        title: "Initial Assessment",
        body: "Describe your conflict and take a short test to help AI understand the context.",
      },
      {
        title: "AI Dialogue",
        body: "AI creates a profile and starts a structured dialogue to uncover underlying needs.",
      },
      {
        title: "Resolution Plan",
        body: "Get a resolution plan that you can present to the other party for final agreement.",
      },
    ],
    modeBSteps: [
      {
        title: "Setup & Intake",
        body: "The mediator takes a test and adds both parties to the secure digital workspace.",
      },
      {
        title: "Psychological Analysis",
        body: "AI analyzes the psychological profiles of all three and warns about potential risks.",
      },
      {
        title: "Guided Session",
        body: "The mediator conducts the session with AI support and receives a comprehensive report.",
      },
    ],
    disclaimer: "PsyLex provides general information only. Not legal advice. Not therapy.",
    footerLinks: { disclaimer: "Disclaimer", privacy: "Privacy", howItWorks: "How it works" },
  },
  uk: {
    headline: "У спорі не повинно бути тих, хто програв.",
    headlineAccent: "Потрібне рішення.",
    subheadline: "AI допомагає обом сторонам знайти те, що їм справді потрібно",
    start: "Почати самостійно",
    mediators: "Для медіаторів →",
    login: "Увійти",
    win1: "Сторона A отримує те, що їй справді потрібно.",
    win2: "Сторона B отримує те, що їй справді потрібно.",
    win3: "Угода реальна та підписана.",
    winFooter:
      "«Медіація — це не компроміс заради компромісу. Це пошук рішення, де кожна сторона отримує те, що для неї важливо.»",
    psylexTitle: "PsyLex Resolution",
    attorneyTitle: "Традиційний адвокат",
    psylexPoints: [
      "Доступно для всіх",
      "Обидві сторони знаходять вихід",
      "Мета — домовитись",
      "Рішення за одну сесію",
      "Працюємо разом над рішенням",
    ],
    attorneyPoints: [
      "$300–700 за годину",
      "Хтось програє",
      "Мета — перемогти",
      "Місяці конфлікту",
      "Ви проти них",
    ],
    howTitle: "Як це працює",
    modeA: "Режим A: Самостійно",
    modeB: "Режим B: Для медіаторів",
    modeASteps: [
      {
        title: "Початкова оцінка",
        body: "Опишіть конфлікт і пройдіть короткий тест, щоб AI зрозумів контекст.",
      },
      {
        title: "AI діалог",
        body: "AI створює профіль і запускає структурований діалог для виявлення справжніх потреб.",
      },
      {
        title: "План врегулювання",
        body: "Отримайте план врегулювання, який можна запропонувати іншій стороні.",
      },
    ],
    modeBSteps: [
      {
        title: "Налаштування",
        body: "Медіатор проходить тест і додає обидві сторони до захищеного робочого простору.",
      },
      {
        title: "Психологічний аналіз",
        body: "AI аналізує психологічні профілі всіх трьох учасників і показує ризики.",
      },
      {
        title: "Керована сесія",
        body: "Медіатор проводить сесію з підтримкою AI і отримує звіт.",
      },
    ],
    disclaimer: "PsyLex надає лише загальну інформацію. Це не юридична порада і не терапія.",
    footerLinks: { disclaimer: "Відмова", privacy: "Конфіденційність", howItWorks: "Як це працює" },
  },
};
