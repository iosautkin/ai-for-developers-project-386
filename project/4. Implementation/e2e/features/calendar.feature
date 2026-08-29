# language: ru
Функция: Сквозные сценарии календаря звонков
  Реальный браузер работает с отдельными frontend и backend через TypeSpec API.

  @SCN-BOOK-001 @e2e
  Сценарий: Гость бронирует слот, а владелец видит встречу
    Дано гость открыл UIElements.HOME_SCREEN
    Когда гость проходит к первому UIElements.CATALOG_MEETING_TYPE_CARD
    И выбирает первый UIElements.BOOKING_SLOT_BUTTON
    И заполняет UIElements.GUEST_DETAILS_SCREEN именем "Анна" и email "anna@example.ru"
    Тогда отображается UIElements.BOOKING_SUCCESS_SCREEN
    Когда владелец открывает UIElements.ADMIN_BOOKINGS_SCREEN
    Тогда UIElements.ADMIN_BOOKING_CARD содержит гостя "Анна"

  @SCN-BOOK-004 @e2e
  Сценарий: Гость получает понятный конфликт занятого слота
    Дано гость дошёл до UIElements.GUEST_DETAILS_SCREEN с выбранным слотом
    И другой гость занял выбранный слот через API
    Когда гость подтверждает UIElements.GUEST_DETAILS_SCREEN
    Тогда отображается UIElements.BOOKING_CONFLICT_ALERT

  @SCN-ADMIN-TYPE-001 @SCN-ADMIN-TYPE-003 @e2e
  Сценарий: Владелец создаёт тип встречи и публикует его гостям
    Дано владелец открыл UIElements.ADMIN_MEETING_TYPES_SCREEN
    Когда владелец создаёт тип встречи "Вводный звонок"
    Тогда отображается UIElements.ADMIN_MEETING_TYPE_CREATED_NOTIFICATION
    И публичный UIElements.CATALOG_MEETING_TYPE_LIST содержит "Вводный звонок"

  @SCN-CATALOG-002 @e2e
  Сценарий: Гость видит пустой каталог
    Дано в тестовой базе нет типов встреч
    Когда гость открывает UIElements.CATALOG_SCREEN
    Тогда отображается UIElements.CATALOG_EMPTY_STATE
