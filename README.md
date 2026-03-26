# english_learning_app

## Local setup

Put these environment variables in `.env.local`:

- `OPENAI_API_KEY`
- `OPENAI_CHAT_MODEL` optional, defaults to `gpt-4.1-mini`
- `OPENAI_DICTIONARY_MODEL` optional, defaults to `gpt-4.1-mini`
- `DICTIONARY_CACHE_TTL_MS` optional, expects milliseconds and defaults to 14 days

Useful commands:

- `npm run dev`
- `npm run lint`
- `npm run test:run`
- `OPENAI_API_KEY=test npm run test:run -- app/api/chat/route.test.ts`
