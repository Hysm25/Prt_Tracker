# Game Port Analyzer

A Next.js (App Router, TypeScript, Tailwind CSS) web application that analyzes GitHub repositories of unofficial video game ports, source decompilations, and engine recreations.

Powered by **Google Gemini 2.0 Flash** and the **GitHub REST API**.

---

## Features

- **GitHub Repository Parsing & Validation**: Accepts standard `github.com` URLs, extracts owner and repository, and validates inputs.
- **Data Collection via GitHub REST API**: Fetches repository metadata (stars, description, topics), raw markdown README, and latest release information (version tag, publication date, download assets).
- **Gemini 2.0 Flash Intelligence**: Prompts Gemini 2.0 Flash using structured JSON output to extract:
  - **Project Name** (e.g. Dusklight, Ship of Harkinian, OpenGOAL)
  - **Original Game** (e.g. The Legend of Zelda: Twilight Princess)
  - **Supported Platforms** (e.g. Windows, Linux, macOS, Steam Deck, Android, iOS, Nintendo Switch)
  - **Latest Release Information** (version, date, direct binary download asset or release link)
- **Safe Parsing & Fallbacks**: Strips markdown code fences, gracefully handles JSON parsing errors, checks for missing READMEs, and sets `latestRelease` to `null` if no release exists.
- **In-Memory Caching**: Caches analysis results per repository for **10 minutes** to reduce unnecessary GitHub and Gemini API calls.
- **Dark-Mode-Friendly UI**: Minimalist glassmorphic dark interface with loading states, platform badges, error alerts, and one-click example presets.

---

## Project Structure

```
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts       # POST /api/analyze endpoint with 10m cache & fallbacks
│   ├── globals.css            # Tailwind CSS styling and theme definitions
│   ├── layout.tsx             # Root layout with dark mode classes and metadata
│   └── page.tsx               # Main UI page with search bar, examples, and state
├── components/
│   └── ResultCard.tsx         # Results display card with badges and download button
├── lib/
│   ├── gemini.ts              # Gemini 2.0 Flash REST caller and safe JSON parser
│   ├── github.ts              # GitHub URL parser and REST API fetcher
│   └── types.ts               # Shared TypeScript interfaces
├── .env.example               # Environment variables template
├── package.json
└── tsconfig.json
```

---

## Getting Started

### 1. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required: Google Gemini API key
# Obtain a free key from: https://aistudio.google.com/
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: GitHub Personal Access Token
# Increases GitHub API rate limit from 60 to 5,000 requests/hour:
GITHUB_TOKEN=your_github_token_here
```

### 2. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production

```bash
npm run build
npm run start
```
