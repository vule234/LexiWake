# LexiWake Mobile

LexiWake Mobile is an Expo + React Native vocabulary learning app that connects alarms, short study sessions, progress tracking, and an AI tutor into a single mobile experience.

This repository contains the mobile client only. It expects a separate REST API service and a separate AI service during development.

## What the app includes

- Alarm-driven learning flows
- Authentication and guest mode
- Onboarding for level, goals, lessons, and notification preferences
- Vocabulary library, deck selection, favorites, and review screens
- Learning sessions with flashcards, quizzes, cram mode, and completion flow
- Progress views for streaks and trophies
- AI tutor overlay connected to a dedicated AI service
- Settings for profile, notifications, learning behavior, offline screens, and widget preview

## Tech stack

- Expo 54
- React Native 0.81
- React 19
- Expo Router
- Zustand
- Axios
- NativeWind
- TypeScript

## Project scope

The app is designed to talk to two local services by default:

- Main API: `http://localhost:5000/api`
- AI API: `http://localhost:5100`

Those values can be overridden with environment variables.

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Create a local environment file

Use `.env.example` as the reference and create your own local `.env`.

```env
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EXPO_PUBLIC_AI_API_URL=http://localhost:5100
```

Do not commit real secrets or private service credentials.

### 3. Start the app

```bash
npm run start
```

Common targets:

```bash
npm run android
npm run ios
npm run web
```

## Available scripts

- `npm run start` starts the Expo dev server
- `npm run android` runs the native Android target
- `npm run ios` runs the native iOS target
- `npm run web` starts the web target
- `npm run build:android:dev` creates an internal Android dev build with EAS
- `npm run build:android:apk` creates an internal Android preview APK with EAS

## Environment variables

The mobile app uses public Expo environment variables:

- `EXPO_PUBLIC_API_URL`: base URL for the main backend API
- `EXPO_PUBLIC_AI_API_URL`: base URL for the AI tutor service

The current code also auto-resolves local hostnames for Expo-based development where possible.

## Project structure

```text
app/                    Expo Router routes and screens
src/components/         Shared UI and feature components
src/features/           Feature-specific state and controllers
src/lib/                API clients, hooks, notifications, alarm logic
src/stores/             Zustand stores
src/theme/              App theme tokens
assets/                 App icons, splash assets, and brand images
```

## Notes for Android alarm testing

- Alarm and notification behavior is centered on Android exact alarm flows.
- Some notification features require a native build and are limited in Expo Go.
- Helper scripts such as `start-ldplayer.ps1` and `open-ldplayer-expo.ps1` support LDPlayer-based local testing.
- If needed, set `LDPLAYER_HOME` to your local LDPlayer installation path.

## Validation

TypeScript validation:

```bash
npx tsc --noEmit
```

## Status

This codebase is currently structured as a mobile-first client for the LexiWake learning experience, with alarm scheduling, learning flows, and AI-assisted tutoring already wired into the app shell.
