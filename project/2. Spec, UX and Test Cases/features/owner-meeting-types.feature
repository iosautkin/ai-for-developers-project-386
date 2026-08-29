# language: ru
Функция: Управление типами встреч владельцем
  Владелец создаёт типы встреч, которые появляются в публичном каталоге.

  @SCN-ADMIN-TYPE-001 @e2e
  Сценарий: Создание типа встречи
    Дано владелец находится на UIElements.ADMIN_MEETING_TYPES_SCREEN
    Когда владелец нажимает UIElements.ADMIN_CREATE_MEETING_TYPE_BUTTON
    И вводит "consultation" в UIElements.ADMIN_MEETING_TYPE_ID_INPUT
    И вводит "Консультация" в UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT
    И вводит описание в UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT
    И выбирает 30 минут в UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT
    И нажимает UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON
    Тогда отображается UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION
    И UIElements.ADMIN_MEETING_TYPES_LIST содержит созданный тип

  @SCN-ADMIN-TYPE-002 @e2e
  Структура сценария: Валидация типа встречи
    Дано владелец находится на UIElements.ADMIN_CREATE_MEETING_TYPE_SCREEN
    Когда владелец вводит "<id>" в UIElements.ADMIN_MEETING_TYPE_ID_INPUT
    И вводит "<название>" в UIElements.ADMIN_MEETING_TYPE_TITLE_INPUT
    И вводит "<описание>" в UIElements.ADMIN_MEETING_TYPE_DESCRIPTION_INPUT
    И выбирает "<длительность>" в UIElements.ADMIN_MEETING_TYPE_DURATION_SELECT
    И нажимает UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON
    Тогда UIElements.ADMIN_MEETING_TYPE_FORM_ERROR_ALERT сообщает "<ошибка>"

    Примеры:
      | id        | название      | описание | длительность | ошибка                                  |
      |           | Консультация  | Описание | 30           | Укажите идентификатор                   |
      | Bad Slug  | Консультация  | Описание | 30           | Используйте латиницу, цифры и дефисы    |
      | meeting   |               | Описание | 30           | Укажите название                        |
      | meeting   | Консультация  |          | 30           | Укажите описание                        |
      | meeting   | Консультация  | Описание | 20           | Длительность должна быть кратна 15 минутам |

  @SCN-ADMIN-TYPE-003 @e2e
  Сценарий: Новый тип опубликован для гостя
    Дано владелец успешно создал тип встречи
    Когда гость открывает UIElements.CATALOG_SCREEN
    Тогда UIElements.CATALOG_MEETING_TYPE_LIST содержит новый тип встречи

  @SCN-ADMIN-TYPE-004 @e2e
  Сценарий: Идентификатор типа встречи должен быть уникальным
    Дано тип встречи с идентификатором "consultation" уже существует
    Когда владелец вводит "consultation" в UIElements.ADMIN_MEETING_TYPE_ID_INPUT
    И нажимает UIElements.ADMIN_MEETING_TYPE_SUBMIT_BUTTON
    Тогда новый тип не создаётся
    И отображается UIElements.ADMIN_MEETING_TYPE_DUPLICATE_ALERT
