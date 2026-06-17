export type Locale = "en" | "uk";

export const localeStorageKey = "psylex-locale";

export const copy = {
  en: {
    headline: "Conflict doesn't need a winner. It needs a solution.",
    subheadline:
      "AI helps both sides find what they really need — together.",
    start: "Start on my own",
    mediators: "For Mediators →",
    contrastTitle: "Attorney vs PsyLex",
    contrast: [
      ["$300–700 per hour", "Accessible to everyone"],
      ["Someone loses", "Both sides find a solution"],
      ["Goal — to win", "Goal — to agree"],
      ["Months of conflict", "Resolution in one session"],
      ["You vs them", "We work together"],
    ],
    winwinTitle: "Win-Win-Win",
    win1: "Side A gets what they truly need",
    win2: "Side B gets what they truly need",
    win3: "Agreement is real and signed",
    winFooter:
      "Mediation is not compromise for the sake of compromise. It is a process of finding a solution where each side receives what truly matters.",
    howTitle: "How It Works",
    modeA: "Mode A (Self-resolution)",
    modeASteps: [
      "Describe your conflict and complete a short test",
      "AI builds a profile and starts a structured dialogue",
      "Receive a resolution plan to propose to the other side",
    ],
    modeB: "Mode B (Mediator)",
    modeBSteps: [
      "Mediator completes a test and adds both parties",
      "AI analyzes psychological profiles of all three participants and highlights risks",
      "Mediator conducts session with AI support and receives a report",
    ],
    disclaimer: "PsyLex provides general information only. Not legal advice. Not therapy.",
  },
  uk: {
    headline: "У спорі не повинно бути тих, хто програв",
    subheadline: "AI допомагає обом сторонам знайти те, що їм справді потрібно",
    start: "Почати самостійно",
    mediators: "Для медіаторів →",
    contrastTitle: "Адвокат vs PsyLex",
    contrast: [
      ["$300–700 за годину", "Доступно для всіх"],
      ["Хтось програє", "Обидві сторони знаходять рішення"],
      ["Мета — перемогти", "Мета — домовитись"],
      ["Місяці конфлікту", "Рішення за одну сесію"],
      ["Ви проти них", "Ми працюємо разом"],
    ],
    winwinTitle: "Win-Win-Win",
    win1: "Сторона A отримує те, що їй справді потрібно",
    win2: "Сторона B отримує те, що їй справді потрібно",
    win3: "Угода реальна та підписана",
    winFooter:
      "Медіація — це не компроміс заради компромісу. Це процес пошуку рішення, де кожна сторона отримує те, що для неї справді важливо.",
    howTitle: "Як це працює",
    modeA: "Режим A (самостійно)",
    modeASteps: [
      "Опишіть конфлікт і пройдіть короткий тест",
      "AI створює профіль і запускає структурований діалог",
      "Отримайте план врегулювання для іншої сторони",
    ],
    modeB: "Режим B (медіатор)",
    modeBSteps: [
      "Медіатор проходить тест і додає обидві сторони",
      "AI аналізує психологічні профілі трьох учасників і показує ризики",
      "Медіатор проводить сесію з підтримкою AI і отримує звіт",
    ],
    disclaimer: "PsyLex надає лише загальну інформацію. Це не юридична порада і не терапія.",
  },
} as const;
