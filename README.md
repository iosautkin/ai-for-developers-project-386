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

Коммиты оформляются по Conventional Commits (`feat:`, `fix:`, `docs:` и другие). После изменений в
`main` release-please автоматически создаёт или обновляет release PR с версией и changelog.
