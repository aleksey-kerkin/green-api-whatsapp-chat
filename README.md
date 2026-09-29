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

## Настройка инстанса в личном кабинете Green API

Перед демонстрацией проверьте в кабинете:

- [ ] Аккаунт WABA авторизован
- [ ] Поле `webhookUrl` пустое
- [ ] Отключён `incomingWebhook`
- [ ] Отключён `outgoingWebhook`
- [ ] Отключён `outgoingAPIMessageWebhook`
- [ ] Отключён `outgoingMessageWebhook`

Второй WhatsApp должен написать на номер инстанса в течение последних 24 часов до демо; иначе при отправке статус будет `noActiveSession`.

Учётные данные (ID инстанса, API Token, URL API) вводятся в браузере и **не** хранятся в репозитории.

## GitHub Pages

После включения Pages из GitHub Actions приложение доступно по адресу:

`https://<user>.github.io/<repo>/`
