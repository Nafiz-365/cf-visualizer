# Codeforces Visualizer

A lightweight Codeforces analytics dashboard I built from scratch to explore contest history, problem stats, and submission trends.

This project is a simple React + Vite app with a small Express proxy server for Codeforces API calls and Gemini AI support. It is hand assembled to keep the experience fast and easy to run.

## Live demo

[Open Codeforces Visualizer](https://cf-visualizer-by-talha.netlify.app/)

## What this repo includes

- `src/` – React components for dashboard, charts, leaderboards, contest history, and AI insights
- `server.ts` – Express server that proxies Codeforces API requests and handles Gemini chat generation
- `package.json` – local dependencies and scripts for dev, build, and start
- `tsconfig.json` / `vite.config.ts` – TypeScript and Vite setup for the frontend

## Run locally

### Requirements

- Node.js installed
- `npm` available in your terminal

### Start the app

1. Install dependencies:
   `npm install`
2. Create a `.env` file next to `server.ts` with your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```
3. Start the project:
   `npm run dev`

Then open `http://localhost:3000` in your browser.

## Notes

- The app does not use a database. It fetches data live from the Codeforces API and caches responses in memory while the server is running.
- If you want to remove Gemini support, you can safely use the app without setting `GEMINI_API_KEY`.

## Why I built it

This repo is meant to be a hands-on Codeforces dashboard with custom charts and lightweight server logic. I wrote the features directly in the code, without relying on external AI-generated scaffolding.
