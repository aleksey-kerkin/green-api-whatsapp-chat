# WhatsApp Chat (Green API)

Веб-приложение для переписки через инстанс [Green API](https://green-api.com/).

## Требования

- Node.js 22

## Локальный запуск

```bash
npm install
npm run dev
```

## Тесты и сборка

```bash
npm test
npm run build
```

## Вход

На экране входа вводятся только `idInstance` и `apiTokenInstance`. Адрес API всегда `https://api.green-api.com`, отдельного поля для него нет. Эти данные сохраняются в `localStorage` браузера и **не** попадают в репозиторий.

## GitHub Pages

После включения Pages из GitHub Actions приложение доступно по адресу:

`https://<user>.github.io/<repo>/`
