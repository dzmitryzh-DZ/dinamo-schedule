import type { Lang } from "../data/types";

export type UiStrings = {
  edit: string;
  done: string;
  reset: string;
  exportProject: string;
  importProject: string;
  print: string;
  pdf: string;
  preview: string;
  copySchedule: string;
  copyScheduleDone: string;
  copyScheduleError: string;
  addRow: string;
  addSplitRow: string;
  toggleSplitRow: string;
  addPlayer: string;
  addDay: string;
  addNext10Days: string;
  removeDay: string;
  dayLabel: string;
  showPastDays: string;
  hidePastDays: string;
  dayMenu: string;
  saved: string;
  projectExported: string;
  projectImported: string;
  projectImportError: string;
  projectExportError: string;
  confirmImport: string;
  syncLoaded: string;
  syncSaved: string;
  syncLocalOnly: string;
  syncUpdated: string;
  syncBadgeSynced: string;
  syncBadgeLocal: string;
  syncConflict: string;
  syncBadgeConflict: string;
  undoLabel: string;
  redoLabel: string;
  resetDone: string;
  dayAdded: string;
  next10Added: string;
  next10Exists: string;
  dayRemoved: string;
  lastDay: string;
  noPreviousDay: string;
  pulledPrevious: string;
  pullFromDay: string;
  selectSourceDay: string;
  confirmPullFromDay: string;
  pullFromTemplate: string;
  selectTemplate: string;
  confirmPullFromTemplate: string;
  saveAsTemplate: string;
  templateNamePrompt: string;
  templateSaved: string;
  templateNameRequired: string;
  noTemplates: string;
  templatesLibrary: string;
  templatesLibraryHint: string;
  confirmRemoveTemplate: string;
  templateRows: string;
  pdfPreparing: string;
  pdfSaved: string;
  pdfError: string;
  club: string;
  titleBilingual: string;
  groupsTitleBilingual: string;
  dateLabel: string;
  scheduleLabel: string;
  groupsLabel: string;
  groupsLabelBilingual: string;
  time: string;
  note: string;
  group1: string;
  group2: string;
  groupName: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  moveToOtherGroup: string;
  moveRow: string;
  color: string;
  cancel: string;
  languageLabel: string;
  viewLabel: string;
  cellTraining: string;
  cellHome: string;
  cellAway: string;
  cellGame: string;
  cellOff: string;
  cellRecovery: string;
  cellFlight: string;
  cellTrain: string;
  posGoalies: string;
  posDefence: string;
  posForwards: string;
  posNoPosition: string;
  positionLabel: string;
  numberLabel: string;
  positionNone: string;
  positionVr: string;
  positionZn: string;
  positionNp: string;
  nameRuPlaceholder: string;
  nameEnPlaceholder: string;
  confirmReset: string;
  confirmRemoveDay: string;
  untitledDay: string;
  selectPlayer: string;
  rosterLabel: string;
  rosterHint: string;
  addToRoster: string;
  confirmRemoveRoster: string;
  active: string;
  injured: string;
  tabDay: string;
  tabMonth: string;
  tabLibrary: string;
  activityLibrary: string;
  activityLibraryHint: string;
  activityGroup: string;
  typeActivity: string;
  selectSplit: string;
  addActivity: string;
  confirmRemoveActivity: string;
  splitLibrary: string;
  splitLibraryHint: string;
  addSplit: string;
  confirmRemoveSplit: string;
  monthTitle: string;
  watermark: string;
  kindTraining: string;
  kindHome: string;
  kindAway: string;
  kindOff: string;
  kindRecovery: string;
  kindFlight: string;
  flightDestRu: string;
  flightDestEn: string;
  flightDestHint: string;
  kindTrain: string;
  trainDestRu: string;
  trainDestEn: string;
  trainDestHint: string;
  airportLegend: string;
  scheduleChangeNotice: string;
  prevMonth: string;
  nextMonth: string;
  legend: string;
  calendarHint: string;
  activityList: string;
  customMonthActivity: string;
  customMonthActivityRu: string;
  customMonthActivityEn: string;
  addMonthActivity: string;
  confirmRemoveMonthActivity: string;
  activityLogoHint: string;
  clearDayKind: string;
  matchHome: string;
  matchAway: string;
  matchAbbrHint: string;
  selectTeam: string;
  customTeam: string;
  teamLibrary: string;
  teamLibraryHint: string;
  addTeam: string;
  confirmRemoveTeam: string;
  teamAbbr: string;
  teamLogo: string;
  uploadLogo: string;
  clearLogo: string;
  weekdays: string[];
  creator: string;
  loginTitle: string;
  loginSubtitle: string;
  passwordLabel: string;
  loginButton: string;
  loginError: string;
  logout: string;
  settings: string;
  yandexTokenLabel: string;
  yandexTokenHint: string;
  tokenSave: string;
  tokenGet: string;
  tokenCheck: string;
  tokenCheckOk: string;
  tokenCheckInvalid: string;
  tokenCheckNone: string;
  tokenCheckUnreachable: string;
  tokenSaved: string;
  tokenClear: string;
  tokenPlaceholder: string;
  changePassword: string;
  currentPasswordLabel: string;
  newPasswordLabel: string;
  changePasswordButton: string;
  passwordChanged: string;
  passwordWrong: string;
  passwordWeak: string;
  whatsappCopy: string;
  whatsappOpen: string;
  whatsappCopied: string;
  whatsappError: string;
  close: string;
};

const RU: UiStrings = {
  edit: "Изменить",
  done: "Готово",
  reset: "Сбросить",
  exportProject: "Сохранить проект",
  importProject: "Загрузить проект",
  print: "Печать",
  pdf: "Сохранить PDF",
  preview: "Превью",
  copySchedule: "Копировать для WhatsApp",
  copyScheduleDone: "Расписание скопировано.",
  copyScheduleError: "Не удалось скопировать расписание.",
  addRow: "+ Добавить строку",
  addSplitRow: "+ Разделитель составов",
  toggleSplitRow: "Разделитель составов",
  addPlayer: "+ Добавить игрока",
  addDay: "+ День",
  addNext10Days: "+ 10 дней",
  removeDay: "Удалить день",
  dayLabel: "Тренировочный день",
  showPastDays: "Показать прошедшие",
  hidePastDays: "Скрыть прошедшие",
  dayMenu: "День",
  saved: "Сохранено в этом браузере.",
  projectExported: "Проект сохранён в JSON-файл.",
  projectImported: "Проект загружен.",
  projectImportError: "Не удалось загрузить файл проекта.",
  projectExportError: "Не удалось сохранить файл проекта.",
  confirmImport: "Загрузить проект из файла? Текущие данные будут заменены.",
  syncLoaded: "Данные загружены из файла проекта (Яндекс.Диск / папка проекта).",
  syncSaved: "Сохранено в браузере и в файле проекта — доступно на другом компьютере.",
  syncLocalOnly: "Сохранено только в этом браузере (файл проекта недоступен).",
  syncUpdated: "Подтянуты изменения из файла проекта.",
  syncBadgeSynced: "Файл проекта",
  syncBadgeLocal: "Только браузер",
  syncConflict:
    "Конфликт версий: показана серверная версия, ваша копия сохранена локально.",
  syncBadgeConflict: "Конфликт версий",
  undoLabel: "Отменить (Ctrl+Z)",
  redoLabel: "Повторить (Ctrl+Shift+Z)",
  resetDone: "Восстановлены данные по умолчанию.",
  dayAdded: "Тренировочный день добавлен.",
  next10Added: "Добавлено дней: {n}. Расписание и составы скопированы с текущего дня.",
  next10Exists: "Ближайшие 10 дней уже есть в списке.",
  dayRemoved: "Тренировочный день удалён.",
  lastDay: "Нужен хотя бы один тренировочный день.",
  noPreviousDay: "Нет предыдущего тренировочного дня.",
  pulledPrevious: "Расписание и составы подтянуты с {date}.",
  pullFromDay: "Подтянуть с дня",
  selectSourceDay: "Выберите день-источник",
  confirmPullFromDay:
    "Подтянуть расписание и составы групп с {date}? Текущие данные этого дня будут заменены.",
  pullFromTemplate: "Подтянуть из шаблона",
  selectTemplate: "Выберите шаблон",
  confirmPullFromTemplate:
    "Подтянуть расписание и составы групп из шаблона «{name}»? Текущие данные этого дня будут заменены.",
  saveAsTemplate: "Сохранить как шаблон",
  templateNamePrompt: "Название шаблона",
  templateSaved: "Шаблон «{name}» сохранён.",
  templateNameRequired: "Укажите название шаблона.",
  noTemplates: "Нет сохранённых шаблонов.",
  templatesLibrary: "Шаблоны расписания",
  templatesLibraryHint:
    "Сохраните типичный день как шаблон, затем подтягивайте его на любую дату во вкладке «День».",
  confirmRemoveTemplate: "Удалить этот шаблон?",
  templateRows: "строк: {n}",
  pdfPreparing: "Готовим PDF…",
  pdfSaved: "PDF сохранён.",
  pdfError: "Не удалось создать PDF. Открываю диалог печати.",
  club: "ХК Динамо-Минск",
  titleBilingual: "Расписание дня / Daily Schedule",
  groupsTitleBilingual: "Состав групп / Group Rosters",
  dateLabel: "Дата",
  scheduleLabel: "Расписание",
  groupsLabel: "Тренировочные группы",
  groupsLabelBilingual: "Тренировочные группы / Training groups",
  time: "Время",
  note: "Примечание",
  group1: "Группа 1",
  group2: "Группа 2",
  groupName: "Название группы",
  remove: "Удалить",
  moveUp: "Выше",
  moveDown: "Ниже",
  moveToOtherGroup: "Перенести в другую группу",
  moveRow: "Перетащить",
  color: "Цвет",
  cancel: "Отмена",
  languageLabel: "Язык",
  viewLabel: "Вид",
  cellTraining: "Тренировка",
  cellHome: "Дома",
  cellAway: "Выезд",
  cellGame: "ИГРА",
  cellOff: "Выходной",
  cellRecovery: "Восст.",
  cellFlight: "ВЫЛЕТ В",
  cellTrain: "ПОЕЗД В",
  posGoalies: "Вратари / Goalies",
  posDefence: "Защитники / Defenders",
  posForwards: "Нападающие / Forwards",
  posNoPosition: "Без амплуа / No position",
  positionLabel: "Амплуа",
  numberLabel: "Номер",
  positionNone: "—",
  positionVr: "ВР — вратарь",
  positionZn: "ЗЩ — защитник",
  positionNp: "НП — нападающий",
  nameRuPlaceholder: "Фамилия И.",
  nameEnPlaceholder: "Lastname I.",
  confirmReset: "Хотите сбросить все данные к исходным? Это действие нельзя отменить.",
  confirmRemoveDay: "Удалить этот тренировочный день?",
  untitledDay: "Без даты",
  selectPlayer: "Выберите игрока",
  rosterLabel: "Список хоккеистов",
  rosterHint: "Общий список для выбора в группы",
  addToRoster: "Добавить в список",
  confirmRemoveRoster: "Удалить игрока из общего списка?",
  active: "Активен",
  injured: "Травма",
  tabDay: "День",
  tabMonth: "Месяц",
  tabLibrary: "Справочники",
  activityLibrary: "Список активностей",
  activityLibraryHint: "Активности из этого списка можно выбрать при редактировании расписания. Каждой можно задать цвет и группу.",
  activityGroup: "Группа",
  typeActivity: "Введите или выберите активность",
  selectSplit: "Выберите разделитель",
  addActivity: "Добавить активность",
  confirmRemoveActivity: "Удалить активность из списка?",
  splitLibrary: "Разделители составов",
  splitLibraryHint: "Подписи для разделения играющего и неиграющего составов. Каждому можно задать свой цвет.",
  addSplit: "Добавить разделитель",
  confirmRemoveSplit: "Удалить разделитель из списка?",
  monthTitle: "Календарь месяца",
  watermark: "Подложка",
  kindTraining: "Тренировка",
  kindHome: "Игровой день (дома)",
  kindAway: "Игровой день (в гостях)",
  kindOff: "Выходной",
  kindRecovery: "Восстановительный день",
  kindFlight: "Самолет",
  flightDestRu: "Слово (RU)",
  flightDestEn: "Word (EN)",
  flightDestHint:
    "Код аэропорта (KUF, MSQ) одинаков на обоих языках. Слово — до 12 букв: RU и EN. Если заполнено одно поле, оно показывается на обоих языках. Пустые поля снимают самолет.",
  kindTrain: "Поезд",
  trainDestRu: "Слово (RU)",
  trainDestEn: "Word (EN)",
  trainDestHint:
    "Слово — до 12 букв: RU и EN. Если заполнено одно поле, оно показывается на обоих языках. Пустые поля снимают поезд.",
  airportLegend: "Аэропорты",
  scheduleChangeNotice: "ВНИМАНИЕ! В РАСПИСАНИИ ВОЗМОЖНЫ ИЗМЕНЕНИЯ!",
  prevMonth: "Предыдущий месяц",
  nextMonth: "Следующий месяц",
  legend: "Типы дней",
  calendarHint:
    "Выберите активность и нажмите на дату, чтобы добавить или убрать её. Внутри дня стрелками ↑ ↓ справа от активности меняйте порядок. «Очистить» удаляет все активности дня.",
  activityList: "Список активностей",
  customMonthActivity: "Своя активность",
  customMonthActivityRu: "Название (RU)",
  customMonthActivityEn: "Name (EN)",
  addMonthActivity: "Добавить",
  confirmRemoveMonthActivity: "Удалить активность «{name}» из списка?",
  activityLogoHint: "Логотип выбранной активности",
  clearDayKind: "Очистить",
  matchHome: "Дома",
  matchAway: "В гостях",
  matchAbbrHint: "3 буквы",
  selectTeam: "Выберите команду",
  customTeam: "Своё сокращение",
  teamLibrary: "Команды",
  teamLibraryHint:
    "Команды из этого списка выбираются в календаре месяца. У каждой — трёхбуквенное сокращение и логотип.",
  addTeam: "Добавить команду",
  confirmRemoveTeam: "Удалить команду из списка?",
  teamAbbr: "Аббревиатура",
  teamLogo: "Логотип",
  uploadLogo: "Загрузить логотип",
  clearLogo: "Убрать логотип",
  weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
  creator: "Создатель проекта: Dzmitry Zhurauski, goalie coach",
  loginTitle: "Вход",
  loginSubtitle: "ХК Динамо-Минск — расписание дня и месяца",
  passwordLabel: "Пароль",
  loginButton: "Войти",
  loginError: "Неверный пароль.",
  logout: "Выйти",
  settings: "Настройки",
  yandexTokenLabel: "Токен Яндекс.Диска",
  yandexTokenHint:
    "OAuth-токен нужен для сохранения расписания на Яндекс.Диск (файл app:/schedule.json). Получить: yandex.ru/dev/disk/poligon → «Получить OAuth-токен». Токен хранится только в этом браузере.",
  tokenSave: "Сохранить токен",
  tokenGet: "Получить токен",
  tokenCheck: "Проверить соединение",
  tokenCheckOk: "Соединение есть — автосохранение на Яндекс.Диск активно.",
  tokenCheckInvalid:
    "Яндекс отклонил токен. Скопируйте его заново целиком и сохраните.",
  tokenCheckNone: "Сначала вставьте и сохраните токен.",
  tokenCheckUnreachable: "Нет связи с Яндекс.Диском. Проверьте интернет.",
  tokenSaved: "Токен сохранён. Перезагрузка…",
  tokenClear: "Удалить токен",
  tokenPlaceholder: "Вставьте OAuth-токен",
  changePassword: "Смена пароля",
  currentPasswordLabel: "Текущий пароль",
  newPasswordLabel: "Новый пароль (минимум 6 символов)",
  changePasswordButton: "Сменить пароль",
  passwordChanged: "Пароль изменён.",
  passwordWrong: "Неверный текущий пароль.",
  passwordWeak: "Новый пароль слишком короткий.",
  whatsappCopy: "WhatsApp",
  whatsappOpen: "Открыть в WhatsApp",
  whatsappCopied: "Скопировано — вставьте в чат WhatsApp.",
  whatsappError: "Не удалось скопировать расписание.",
  close: "Закрыть",
};

const EN: UiStrings = {
  edit: "Edit",
  done: "Done",
  reset: "Reset",
  exportProject: "Save project",
  importProject: "Load project",
  print: "Print",
  pdf: "Save PDF",
  preview: "Preview",
  copySchedule: "Copy for WhatsApp",
  copyScheduleDone: "Schedule copied.",
  copyScheduleError: "Could not copy schedule.",
  addRow: "+ Add row",
  addSplitRow: "+ Split roster",
  toggleSplitRow: "Split roster",
  addPlayer: "+ Add player",
  addDay: "+ Day",
  addNext10Days: "+ 10 days",
  removeDay: "Delete day",
  dayLabel: "Training day",
  showPastDays: "Show past days",
  hidePastDays: "Hide past days",
  dayMenu: "Day",
  saved: "Saved locally in this browser.",
  projectExported: "Project saved as a JSON file.",
  projectImported: "Project loaded.",
  projectImportError: "Could not load the project file.",
  projectExportError: "Could not save the project file.",
  confirmImport: "Load project from file? Current data will be replaced.",
  syncLoaded: "Loaded from the project file (Yandex Disk / project folder).",
  syncSaved: "Saved in this browser and the project file — available on other computers.",
  syncLocalOnly: "Saved only in this browser (project file unavailable).",
  syncUpdated: "Pulled updates from the project file.",
  syncBadgeSynced: "Project file",
  syncBadgeLocal: "This browser only",
  syncConflict:
    "Version conflict: showing the server copy; yours was saved locally.",
  syncBadgeConflict: "Version conflict",
  undoLabel: "Undo (Ctrl+Z)",
  redoLabel: "Redo (Ctrl+Shift+Z)",
  resetDone: "Restored default data.",
  dayAdded: "Training day added.",
  next10Added: "Added days: {n}. Schedule and groups were copied from the current day.",
  next10Exists: "The next 10 days are already in the list.",
  dayRemoved: "Training day removed.",
  lastDay: "At least one training day is required.",
  noPreviousDay: "No previous training day found.",
  pulledPrevious: "Schedule and groups pulled from {date}.",
  pullFromDay: "Pull from day",
  selectSourceDay: "Select source day",
  confirmPullFromDay:
    "Pull schedule and group rosters from {date}? Current data for this day will be replaced.",
  pullFromTemplate: "Pull from template",
  selectTemplate: "Select template",
  confirmPullFromTemplate:
    "Pull schedule and group rosters from template “{name}”? Current data for this day will be replaced.",
  saveAsTemplate: "Save as template",
  templateNamePrompt: "Template name",
  templateSaved: "Template “{name}” saved.",
  templateNameRequired: "Enter a template name.",
  noTemplates: "No saved templates.",
  templatesLibrary: "Schedule templates",
  templatesLibraryHint:
    "Save a typical day as a template, then apply it to any date on the Day tab.",
  confirmRemoveTemplate: "Delete this template?",
  templateRows: "rows: {n}",
  pdfPreparing: "Preparing PDF…",
  pdfSaved: "PDF downloaded.",
  pdfError: "Could not create PDF. Opening print dialog instead.",
  club: "HC Dinamo-Minsk",
  titleBilingual: "Расписание дня / Daily Schedule",
  groupsTitleBilingual: "Состав групп / Group Rosters",
  dateLabel: "Date",
  scheduleLabel: "Schedule",
  groupsLabel: "Training groups",
  groupsLabelBilingual: "Тренировочные группы / Training groups",
  time: "Time",
  note: "Note",
  group1: "Group 1",
  group2: "Group 2",
  groupName: "Group name",
  remove: "Remove",
  moveUp: "Move up",
  moveDown: "Move down",
  moveToOtherGroup: "Move to other group",
  moveRow: "Drag to reorder",
  color: "Color",
  cancel: "Cancel",
  languageLabel: "Language",
  viewLabel: "View",
  cellTraining: "PRACTICE",
  cellHome: "Home",
  cellAway: "Away",
  cellGame: "GAME",
  cellOff: "Day off",
  cellRecovery: "Recovery",
  cellFlight: "FLIGHT TO",
  cellTrain: "TRAIN TO",
  posGoalies: "Вратари / Goalies",
  posDefence: "Защитники / Defenders",
  posForwards: "Нападающие / Forwards",
  posNoPosition: "Без амплуа / No position",
  positionLabel: "Position",
  numberLabel: "Number",
  positionNone: "—",
  positionVr: "ВР — goalie",
  positionZn: "ЗЩ — defenceman",
  positionNp: "НП — forward",
  nameRuPlaceholder: "Name (RU)",
  nameEnPlaceholder: "Name (EN)",
  confirmReset: "Do you want to reset all data to defaults? This cannot be undone.",
  confirmRemoveDay: "Delete this training day?",
  untitledDay: "Untitled day",
  selectPlayer: "Select player",
  rosterLabel: "Player roster",
  rosterHint: "Master list used in group dropdowns",
  addToRoster: "Add to roster",
  confirmRemoveRoster: "Remove player from the master roster?",
  active: "Active",
  injured: "Injured",
  tabDay: "Day",
  tabMonth: "Month",
  tabLibrary: "Library",
  activityLibrary: "Activity library",
  activityLibraryHint: "Activities from this list can be selected when editing the schedule. Each activity can have its own color and group.",
  activityGroup: "Group",
  typeActivity: "Type or select activity",
  selectSplit: "Select split",
  addActivity: "Add activity",
  confirmRemoveActivity: "Remove activity from the library?",
  splitLibrary: "Roster splits",
  splitLibraryHint: "Labels for splitting playing and non-playing rosters. Each split can have its own color.",
  addSplit: "Add split",
  confirmRemoveSplit: "Remove split from the library?",
  monthTitle: "Month calendar",
  watermark: "Watermark",
  kindTraining: "Practice day",
  kindHome: "Game day (home)",
  kindAway: "Game day (away)",
  kindOff: "Day off",
  kindRecovery: "Recovery day",
  kindFlight: "Flight",
  flightDestRu: "Word (RU)",
  flightDestEn: "Word (EN)",
  flightDestHint:
    "An airport code (KUF, MSQ) is the same in both languages. A word is up to 12 letters in RU and EN. If only one field is filled, it is shown in both languages. Empty fields remove the plane.",
  kindTrain: "Train",
  trainDestRu: "Word (RU)",
  trainDestEn: "Word (EN)",
  trainDestHint:
    "A word is up to 12 letters in RU and EN. If only one field is filled, it is shown in both languages. Empty fields remove the train.",
  airportLegend: "Airports",
  scheduleChangeNotice: "ATTENTION! THE SCHEDULE IS SUBJECT TO CHANGE!",
  prevMonth: "Previous month",
  nextMonth: "Next month",
  legend: "Day types",
  calendarHint:
    "Select an activity and click a date to add or remove it. Use the ↑ ↓ arrows inside each day to reorder activities. «Clear» removes all activities from the day.",
  activityList: "Activity list",
  customMonthActivity: "Custom activity",
  customMonthActivityRu: "Name (RU)",
  customMonthActivityEn: "Name (EN)",
  addMonthActivity: "Add",
  confirmRemoveMonthActivity: "Remove activity “{name}” from the list?",
  activityLogoHint: "Logo for the selected activity",
  clearDayKind: "Clear",
  matchHome: "Home",
  matchAway: "Away",
  matchAbbrHint: "3 letters",
  selectTeam: "Select a team",
  customTeam: "Custom abbreviation",
  teamLibrary: "Teams",
  teamLibraryHint:
    "Teams from this list can be chosen on the month calendar. Each has a 3-letter abbreviation and a logo.",
  addTeam: "Add team",
  confirmRemoveTeam: "Remove team from the library?",
  teamAbbr: "Abbreviation",
  teamLogo: "Logo",
  uploadLogo: "Upload logo",
  clearLogo: "Remove logo",
  weekdays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
  creator: "Created by Dzmitry Zhurauski, goalie coach",
  loginTitle: "Sign in",
  loginSubtitle: "HC Dinamo-Minsk — day and month schedule",
  passwordLabel: "Password",
  loginButton: "Sign in",
  loginError: "Wrong password.",
  logout: "Log out",
  settings: "Settings",
  yandexTokenLabel: "Yandex Disk token",
  yandexTokenHint:
    "An OAuth token is used to save the schedule to Yandex Disk (app:/schedule.json). Get one at yandex.ru/dev/disk/poligon → “Get OAuth token”. The token is stored only in this browser.",
  tokenSave: "Save token",
  tokenGet: "Get token",
  tokenCheck: "Test connection",
  tokenCheckOk: "Connected — autosave to Yandex Disk is active.",
  tokenCheckInvalid: "Yandex rejected the token. Copy it again in full and save.",
  tokenCheckNone: "Paste and save a token first.",
  tokenCheckUnreachable: "Cannot reach Yandex Disk. Check your connection.",
  tokenSaved: "Token saved. Reloading…",
  tokenClear: "Remove token",
  tokenPlaceholder: "Paste the OAuth token",
  changePassword: "Change password",
  currentPasswordLabel: "Current password",
  newPasswordLabel: "New password (min. 6 characters)",
  changePasswordButton: "Change password",
  passwordChanged: "Password changed.",
  passwordWrong: "Wrong current password.",
  passwordWeak: "The new password is too short.",
  whatsappCopy: "WhatsApp",
  whatsappOpen: "Open in WhatsApp",
  whatsappCopied: "Copied — paste it into a WhatsApp chat.",
  whatsappError: "Could not copy the schedule.",
  close: "Close",
};

export function getUi(lang: Lang): UiStrings {
  return lang === "en" ? EN : RU;
}
