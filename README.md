# English Vault

Standalone React version prepared for free static deployment.

## Data storage
Entries are stored in the browser with localStorage. No backend or database is required. Use the app's JSON export/import feature to back up or move your vocabulary between browsers/devices.

## Local development

```bash
yarn install
yarn start
```

## Production build

```bash
yarn install
yarn build
```

## Vercel
Import this folder as a project. Framework preset: Create React App. Build command: `yarn build`. Output directory: `build`. No environment variables are required.
