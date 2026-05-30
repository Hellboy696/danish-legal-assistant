---
title: Danish Legal Assistant
emoji: ⚖️
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
license: mit
short_description: AI assistant for Danish immigration, tax, labor & business law
---

# ⚖️ Danish Legal Assistant

An AI-powered assistant for navigating Danish law — immigration, taxation, labor rights, and business regulations.

## Features

- 🔍 **Semantic Search** — hybrid BM25 + vector search across 41 Danish laws
- 💬 **AI Chat** — RAG-powered answers via Claude API with source citations
- 📚 **Law Catalog** — browse all laws by category with key facts
- 🌊 **Streaming** — real-time token-by-token responses (SSE)

## Categories

| Category | Laws |
|----------|------|
| 🛂 Immigration | 16 laws |
| 💰 Tax | 10 laws |
| 👷 Labor | 10 laws |
| 🏢 Business | 5 laws |

## Tech Stack

- **Backend**: FastAPI + LanceDB + BM25 (hybrid search) + Claude API
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Infrastructure**: Redis (caching) + Nginx + Supervisor

## Environment Variables

Set `ANTHROPIC_API_KEY` in Space secrets to enable AI chat responses.
Without it, the app runs in fallback mode (search works fully, chat returns pre-built summaries).

## Usage

1. Open the app
2. Type a legal question (e.g. *"How do I get a work permit in Denmark?"*)
3. Browse search results or use AI chat for detailed answers
