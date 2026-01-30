# Project Context for AI Assistants

## Project Overview

SongTribute - A collaborative platform for creating personalized songs from collective memories. Hosts invite contributors to share stories about an honoree, then AI generates a professional song.

## Tech Stack

- Next.js 16.1.1 with App Router and TypeScript
- React 19 with Server Components
- Supabase for auth, PostgreSQL database, and storage
- Tailwind CSS 4 for styling
- Zod for runtime validation

## Project Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/app/(auth)/` - Auth pages (login, register, verify) - public routes
- `src/app/(dashboard)/` - Protected host dashboard routes
- `src/app/api/v1/` - REST API endpoints
- `src/app/contribute/[token]/` - Magic link contributor pages (no auth required)
- `src/components/ui/` - Reusable UI components
- `src/components/dashboard/` - Dashboard-specific components
- `src/lib/supabase/` - Supabase client configuration (client.ts, server.ts, middleware.ts)
- `src/lib/services/` - External service integrations (Mureka for music, mocks for Twilio, SendGrid, Spotify)
- `src/lib/validations/` - Zod schemas for API validation
- `src/types/` - TypeScript type definitions
- `supabase/schema.sql` - Database schema (run manually in Supabase SQL editor)

## Code Conventions

DO:
- Use `@/` import alias for all internal imports
- Wrap components using `useSearchParams()` in Suspense boundaries
- Use Server Components by default, add `'use client'` only when needed
- Validate all API inputs with Zod schemas from `src/lib/validations/`
- Use the mock services in `src/lib/services/` - they're designed to be swapped for real APIs

DON'T:
- Don't use `useSearchParams()` without Suspense wrapper (causes build errors)
- Don't access Supabase directly in components - use API routes
- Don't hardcode URLs - use `NEXT_PUBLIC_APP_URL` env var
- Don't create database migrations - schema changes require manual SQL in Supabase dashboard

## Key Domain Concepts

- **Host**: Authenticated user who creates song projects
- **Contributor**: Anyone with a magic link token (no account needed)
- **Creation Modes**:
  - **Collaborative**: Invite contributors, collect memories over 24-72 hours
  - **Instant**: Host provides memories directly, generate song immediately
- **Project Status Flow**: draft → collecting → curating → generating → completed
  - Instant projects skip to `curating` status immediately
- **Submission Modes**: Quick (4 questions, 60-90s) or Deep (6 questions, 5-7min)
- **Revision Limit**: 3 song generations per project (can purchase more)

## External Services

- `mureka.ts` - **LIVE** Mureka API (requires `MUREKA_API_KEY`)
- `notifications.ts`, `spotify.ts` - Mocks that log to console

## Git Workflow

Include co-author line: `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
