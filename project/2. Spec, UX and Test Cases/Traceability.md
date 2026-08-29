# Сквозная трассируемость

## Правило

`features/*.feature` — единственный источник продуктовых сценариев. Playwright BDD читает эти файлы напрямую из слоя 2; отдельная копия Gherkin в слое 4 не создаётся. Поэтому добавленный сценарий без реализованных шагов останавливает `bddgen`, а каждый успешно сгенерированный тест сохраняет `@SCN-*` в своём названии и отчёте.

UI-шаги используют символические имена из `UIElements.ts`. Storybook и реализация присваивают соответствующие значения как `data-testid`, а E2E импортирует тот же runtime enum. Трасса имеет вид:

`@SCN-*` → `UIElements.*` в Gherkin → Storybook state → production `data-testid` → Playwright step → backend/SQLite.

## Матрица сценариев

| Сценарии                 | Storybook design                                          | Реализация                          | E2E-проверка                                   |
| ------------------------ | --------------------------------------------------------- | ----------------------------------- | ---------------------------------------------- |
| `SCN-HOME-001`           | `Screens/Product states/Home`                             | `/` → `/book`                       | Навигация по `HOME_BOOK_BUTTON`                |
| `SCN-CATALOG-001`        | `Catalog`                                                 | `/book`, динамический каталог API   | Состав и поля всех карточек                    |
| `SCN-CATALOG-002`        | `Catalog Empty`                                           | Пустой ответ API                    | Пустое состояние без admin-ссылки              |
| `SCN-CATALOG-003`        | `Catalog Error`                                           | Ошибка и retry каталога             | Управляемый HTTP 500 и успешный повтор         |
| `SCN-BOOK-001`           | `Booking`, `Guest Details`, `Booking Success`             | Полный guest flow                   | Бронирование через UI и реальный backend       |
| `SCN-BOOK-002`           | `Guest Validation`                                        | Валидация формы гостя               | Три примера `Scenario Outline`                 |
| `SCN-BOOK-003`           | `Guest Details`, `Booking Success`                        | Необязательная заметка              | UI-submit и проверка сохранённой записи        |
| `SCN-BOOK-004`           | `Booking Conflict`                                        | Обновление availability после `409` | Конфликт через реальный backend и SQLite       |
| `SCN-BOOK-005`           | `Guest Submit Error`                                      | Ошибка и retry бронирования         | Управляемый HTTP 500, сохранение формы, retry  |
| `SCN-AVAIL-001`          | `Booking`                                                 | Календарь из backend availability   | Границы 14 московских дат                      |
| `SCN-AVAIL-002`          | `Booking`                                                 | Disabled dates                      | Недоступность субботы и воскресенья            |
| `SCN-AVAIL-003`          | `Booking`                                                 | Слоты выбранной даты                | Отсечение прошедших интервалов при 12:07       |
| `SCN-AVAIL-004`          | `Booking`                                                 | Список слотов                       | Рабочая граница 18:00                          |
| `SCN-AVAIL-005`          | `Booking`                                                 | Occupied slot state                 | Пересечение с бронированием другого типа       |
| `SCN-AVAIL-006`          | `Booking`                                                 | Available slot state                | Допустимое соприкосновение интервалов          |
| `SCN-AVAIL-007`          | `Booking`                                                 | API подтверждения                   | Два параллельных запроса к реальной SQLite     |
| `SCN-ADMIN-TYPE-001`     | `Admin Create Meeting Type`, `Admin Meeting Type Created` | `/admin/meeting-types/new`          | Создание через UI и появление в списке         |
| `SCN-ADMIN-TYPE-002`     | `Admin Create Validation`                                 | Валидация admin-формы               | Пять примеров `Scenario Outline`               |
| `SCN-ADMIN-TYPE-003`     | `Admin Meeting Types`, `Catalog`                          | Admin → public catalog              | Создание владельцем и публикация гостю         |
| `SCN-ADMIN-TYPE-004`     | `Admin Create Duplicate`                                  | Duplicate error state               | Реальный конфликт уникального id               |
| `SCN-ADMIN-BOOKINGS-001` | `Admin Bookings`                                          | `/admin/bookings`                   | Сортировка и данные предстоящих встреч         |
| `SCN-ADMIN-BOOKINGS-002` | `Admin Bookings Empty`                                    | Пустой список API                   | Empty state владельца                          |
| `SCN-PERSIST-001`        | `Admin Bookings`, `Catalog`                               | Единый SQLite-файл                  | Новый app instance читает данные после restart |

## Исполняемые связи

- Конфигурация источника Gherkin: `../4. Implementation/e2e/playwright.config.ts`.
- Реализация всех шагов: `../4. Implementation/e2e/steps/calendar.steps.ts`.
- Общие UI-id: `UIElements.ts`.
- Design states: `design/src/Screens.stories.tsx` и `design/src/Flows.stories.tsx`.
- Browser tests работают с production build, реальным Fastify backend и отдельным SQLite-файлом; база не мокается.
