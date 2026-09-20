# English Vault

Personal English-learning web app, ready for Vercel.

## Features
- Local vault stored in the browser with `localStorage`
- Vocabulary, slang, phrasal verbs, expressions, collocations, idioms, connectors and grammar tricks
- Practice modes and review status
- UK/US pronunciation using the browser speech engine
- “Surprise me” with a built-in bank of new discoveries
- AI Autofill through a private Vercel serverless function

## AI setup on Vercel
Add this environment variable in your Vercel project:

`OPENAI_API_KEY` = your OpenAI API key

Then redeploy the project. The key stays server-side and is never included in the browser bundle or GitHub source.

The `/api/autofill` function uses `gpt-5.6-luna` through the OpenAI Responses API.

## Privacy / storage
Vault entries are stored locally in the current browser. Use Export/Import to move them between browsers or devices.

## Surprise behaviour
- Top-bar **Surprise me** opens a random entry already saved in the vault.
- Home hero **Surprise me · discover something new** asks the AI for a new unsaved discovery.
- **See full info** generates the complete AI entry and opens the normal Add form. Nothing is saved until **Save entry** is pressed.
