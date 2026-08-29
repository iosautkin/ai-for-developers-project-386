# language: ru
Функция: Публичное бронирование встречи
  Гость без регистрации выбирает тип встречи и свободное время по Москве.

  Предыстория:
    Дано существует предустановленный владелец "Иван"

  @SCN-HOME-001 @e2e
  Сценарий: Переход с главной страницы к записи
    Дано гость находится на UIElements.HOME_SCREEN
    Когда гость нажимает UIElements.HOME_BOOK_BUTTON
    Тогда открывается UIElements.CATALOG_SCREEN

  @SCN-CATALOG-001 @e2e
  Сценарий: Просмотр опубликованных типов встреч
    Дано владелец создал несколько типов встреч
    Когда гость открывает UIElements.CATALOG_SCREEN
    Тогда UIElements.CATALOG_MEETING_TYPE_LIST показывает все типы встреч
    И каждая UIElements.CATALOG_MEETING_TYPE_CARD показывает название, описание и длительность

  @SCN-CATALOG-002 @e2e
  Сценарий: Пустой публичный каталог
    Дано типы встреч отсутствуют
    Когда гость открывает UIElements.CATALOG_SCREEN
    Тогда отображается UIElements.CATALOG_EMPTY_STATE
    И ссылка на административную часть в пустом состоянии отсутствует

  @SCN-CATALOG-003 @e2e
  Сценарий: Ошибка загрузки каталога
    Дано каталог временно недоступен
    Когда гость открывает UIElements.CATALOG_SCREEN
    Тогда отображается UIElements.CATALOG_ERROR_ALERT
    И гость может нажать UIElements.CATALOG_RETRY_BUTTON

  @SCN-BOOK-001 @e2e
  Сценарий: Успешное бронирование без регистрации
    Дано гость выбрал UIElements.CATALOG_MEETING_TYPE_CARD типа "Консультация"
    И выбрал доступную дату в UIElements.BOOKING_DATE_CALENDAR
    И выбрал свободный UIElements.BOOKING_SLOT_BUTTON
    Когда гость нажимает UIElements.BOOKING_CONTINUE_BUTTON
    И вводит имя в UIElements.GUEST_NAME_INPUT
    И вводит корректный email в UIElements.GUEST_EMAIL_INPUT
    И нажимает UIElements.GUEST_SUBMIT_BUTTON
    Тогда отображается UIElements.BOOKING_SUCCESS_SCREEN
    И UIElements.BOOKING_SUCCESS_DETAILS показывает тип, длительность, дату, начало, окончание, гостя и владельца

  @SCN-BOOK-002 @e2e
  Структура сценария: Проверка имени и email гостя
    Дано гость находится на UIElements.GUEST_DETAILS_SCREEN
    Когда гость вводит "<имя>" в UIElements.GUEST_NAME_INPUT
    И вводит "<email>" в UIElements.GUEST_EMAIL_INPUT
    И нажимает UIElements.GUEST_SUBMIT_BUTTON
    Тогда UIElements.GUEST_FORM_ERROR_ALERT сообщает "<ошибка>"

    Примеры:
      | имя  | email          | ошибка                     |
      |      | guest@test.ru  | Укажите имя                 |
      | Анна |                | Укажите email               |
      | Анна | неверный-email | Укажите корректный email    |

  @SCN-BOOK-003 @e2e
  Сценарий: Необязательная заметка гостя
    Дано гость заполнил UIElements.GUEST_NAME_INPUT
    И заполнил UIElements.GUEST_EMAIL_INPUT
    И оставил UIElements.GUEST_NOTE_INPUT пустым
    Когда гость нажимает UIElements.GUEST_SUBMIT_BUTTON
    Тогда бронирование создаётся без заметки
    И отображается UIElements.BOOKING_SUCCESS_SCREEN

  @SCN-BOOK-004 @e2e
  Сценарий: Выбранный слот заняли до подтверждения
    Дано гость выбрал свободный UIElements.BOOKING_SLOT_BUTTON
    И другой гость занял этот интервал
    Когда гость нажимает UIElements.GUEST_SUBMIT_BUTTON
    Тогда бронирование не создаётся
    И гость возвращается на UIElements.BOOKING_SCREEN
    И UIElements.BOOKING_CONFLICT_ALERT объясняет конфликт
    И выбранная дата сохраняется, слот очищается, а список интервалов обновляется

  @SCN-BOOK-005 @e2e
  Сценарий: Общая ошибка создания бронирования
    Дано гость корректно заполнил UIElements.GUEST_DETAILS_SCREEN
    И сервис бронирования временно недоступен
    Когда гость нажимает UIElements.GUEST_SUBMIT_BUTTON
    Тогда введённые данные сохраняются
    И отображается UIElements.GUEST_SUBMIT_ERROR_ALERT
    И гость может нажать UIElements.GUEST_RETRY_BUTTON

  @SCN-AVAIL-001 @e2e
  Сценарий: Окно записи содержит четырнадцать московских дат
    Дано текущая дата по Москве — 11 августа 2026 года
    Когда гость открывает UIElements.BOOKING_DATE_CALENDAR
    Тогда доступны даты с 11 по 24 августа 2026 года включительно
    И даты вне этого окна недоступны

  @SCN-AVAIL-002 @e2e
  Сценарий: Выходные недоступны
    Когда гость открывает UIElements.BOOKING_DATE_CALENDAR
    Тогда субботы и воскресенья в окне записи недоступны

  @SCN-AVAIL-003 @e2e
  Сценарий: Прошедшее время текущего дня недоступно
    Дано текущее московское время — 11 августа 2026 года 12:07
    Когда гость выбирает 11 августа в UIElements.BOOKING_DATE_CALENDAR
    Тогда интервалы с началом до 12:15 недоступны

  @SCN-AVAIL-004 @e2e
  Сценарий: Встреча полностью помещается в рабочее время
    Дано выбран тип встречи длительностью 30 минут
    Когда гость просматривает UIElements.BOOKING_SLOT_LIST
    Тогда слот 17:30–18:00 доступен
    И слот 17:45–18:15 отсутствует

  @SCN-AVAIL-005 @e2e
  Сценарий: Бронирование другого типа блокирует пересечение
    Дано существует бронирование другого типа на 10:00–10:30
    Когда гость просматривает UIElements.BOOKING_SLOT_LIST
    Тогда пересекающиеся UIElements.BOOKING_SLOT_BUTTON недоступны

  @SCN-AVAIL-006 @e2e
  Сценарий: Соприкасающиеся интервалы допустимы
    Дано существует бронирование на 10:00–10:30
    Когда гость выбирает встречу на 10:30–11:00
    Тогда соответствующий UIElements.BOOKING_SLOT_BUTTON доступен

  @SCN-AVAIL-007 @e2e
  Сценарий: Конкурирующие запросы не создают двойную запись
    Дано два гостя выбрали один свободный интервал
    Когда оба гостя одновременно подтверждают бронирование
    Тогда успешно создаётся не более одного бронирования
