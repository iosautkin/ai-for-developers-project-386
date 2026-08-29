### Hexlet tests and linter status:
[![Actions Status](https://github.com/iosautkin/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/iosautkin/ai-for-developers-project-386/actions)

# Календарь звонков

Учебное Design First приложение для записи на свободный слот без регистрации. Frontend и backend
разделены и взаимодействуют только через TypeSpec-контракт; production-сборка запускается единым
контейнером.

## Разработка

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Полная локальная проверка: `pnpm verify`. Браузерные Gherkin-сценарии: `pnpm build && pnpm
test:e2e`.

## Docker

```sh
docker compose up --build
```

Приложение откроется на `http://localhost:3000`. Другой порт можно передать через переменную
окружения `PORT`, например `PORT=8080 docker compose up --build`. SQLite хранится в именованном
volume `calendar-data` и не теряется при пересоздании контейнера.

Production smoke-тест собирает образ, запускает его на нестандартном порту, создаёт бронирование
через API и проверяет его после рестарта с тем же volume:

```sh
pnpm test:docker
```

Коммиты оформляются по Conventional Commits (`feat:`, `fix:`, `docs:` и другие). После изменений в
`main` release-please автоматически создаёт или обновляет release PR с версией и changelog.
