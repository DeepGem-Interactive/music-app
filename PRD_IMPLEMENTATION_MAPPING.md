# PRD → Existing Codebase Mapping
**Aligning "Collaborative Music Tribute Platform" PRD with SongTribute codebase**

---

## PRD Core Value Props → Current Features

| PRD Requirement | Current SongTribute Feature | Implementation Status |
|----------------|---------------------------|----------------------|
| **Transforms scattered memories into lasting gift** | Collaborative mode with invites & submissions | ✅ BUILT |
| **Reduces creation from weeks to 3-5 days** | Deadline-based collection + quick/deep modes | ✅ BUILT |
| **Emotional resonance through intimacy** | Curated submission flow, must-include lines | ✅ BUILT |
| **Full-length musical storytelling (3-4 min)** | Mureka API integration, multiple versions | ✅ BUILT |
| **Captures irreplaceable moments** | Voice note uploads, text memories | ⚠️ PARTIAL (needs audio recorder UI) |

---

## PRD Requirements → Implementation Status

### ✅ ALREADY IMPLEMENTED (70%)

1. **Tribute Orchestration Engine**
   - `src/app/(dashboard)/projects/` - Project creation & management
   - `src/app/api/v1/projects/` - Full CRUD + status transitions
   - Status flow: draft → collecting → curating → generating → completed

2. **Multi-Modal Contribution Collector**
   - `src/app/contribute/[token]/` - Magic link contribution pages
   - Text memories: ✅ (submission forms)
   - Voice notes: ✅ (upload URLs stored in `voice_note_urls`)
   - Audio recording UI: ❌ MISSING (needs browser recorder component)

3. **Invitation Service**
   - `src/app/api/v1/projects/[projectId]/invites/` - Invite CRUD
   - `src/lib/services/notifications.ts` - Email/SMS (currently mock)
   - Token-based magic links: ✅
   - Delivery tracking: ✅ (status field in invites table)
   - Reminders: ❌ MISSING

4. **Song Generation Engine**
   - `src/app/api/v1/projects/[projectId]/generate/` - Generation endpoint
   - `src/lib/services/mureka.ts` - Mureka API integration (LIVE)
   - `src/app/api/v1/jobs/[jobId]/` - Async job status polling
   - Multiple versions: ✅ (`song_versions` table)
   - Auto-regeneration: ❌ MISSING (currently manual trigger)

5. **Recipient Profile**
   - Database schema: ✅ (honoree_name, relationship, occasion, tones, music prefs)
   - UI: ⚠️ PARTIAL (needs personality traits, favorite moments from PRD)

6. **Tribute Dashboard**
   - `src/app/(dashboard)/projects/[projectId]/` - Project detail page
   - `src/components/dashboard/` - Dashboard components
   - Submission tracking: ✅
   - Real-time updates: ❌ MISSING

7. **Version Management**
   - Database: ✅ (`song_versions` table with version_number)
   - API: ✅ (`/api/v1/projects/[projectId]/versions/`)
   - Comparison UI: ❌ MISSING

### ❌ MISSING FROM CODEBASE (30%)

8. **Audio Recording UI**
   - Browser-based recorder with waveform visualization
   - Playback preview, re-record option
   - **Location:** Need to build in `src/components/ui/audio-recorder.tsx`

9. **Contribution-to-Song Mapping**
   - Visualization showing which contributions inform each song section
   - Timeline showing song evolution
   - **Location:** Need `src/components/dashboard/contribution-mapping.tsx`

10. **Gift Delivery System**
    - WAV download endpoint
    - Email delivery with embedded player
    - Scheduled delivery
    - Shareable links with password protection
    - **Location:** Need `/api/v1/projects/[projectId]/deliver/` + UI

11. **Iterative Song Generation Logic**
    - Auto-regeneration triggers when contributions arrive
    - Progressive song extension (90s → 3-4min)
    - **Location:** Enhance `/api/v1/projects/[projectId]/generate/`

12. **Email/SMS Orchestration**
    - Real email/SMS delivery (currently mocked)
    - Reminder scheduling
    - Open/click tracking
    - **Location:** Enhance `src/lib/services/notifications.ts`

13. **Warm, Intimate UI/UX**
    - Redesign with soft color palette
    - Empathetic copy throughout
    - Emotional resonance in design
    - **Location:** Tailwind config + all components

---

## Implementation Plan (Following AGENTS.md Conventions)

### Phase 1: Core Missing Features (Week 1)

**Priority 1: Audio Recording UI**
```typescript
// src/components/ui/audio-recorder.tsx
'use client'
// Browser MediaRecorder API
// Waveform visualization with canvas
// Upload to Supabase Storage
```

**Priority 2: Gift Delivery System**
```typescript
// src/app/api/v1/projects/[projectId]/deliver/route.ts
// WAV export from Supabase Storage
// Email with embedded player (enhance notifications.ts)
// Shareable link generation (with password)
```

**Priority 3: Auto-Regeneration Logic**
```typescript
// Enhance src/app/api/v1/projects/[projectId]/generate/route.ts
// Add webhook/trigger after submission approval
// Progressive song extension based on contribution count
```

**Priority 4: Contribution Mapping Visualization**
```typescript
// src/components/dashboard/contribution-mapping.tsx
// Timeline showing contributions → song sections
// Visual link between submissions and generated lyrics
```

### Phase 2: UX Enhancement (Week 2)

**Priority 5: UI/UX Redesign**
- Update Tailwind config with warm color palette
- Rewrite copy with empathetic tone
- Add intimate design touches (rounded corners, soft shadows)

**Priority 6: Real-time Dashboard Updates**
```typescript
// Use Supabase Realtime for live status updates
// Show contribution arrivals in real-time
// Update invitation status live
```

**Priority 7: Email/SMS Implementation**
```typescript
// Replace mocks in src/lib/services/notifications.ts
// Integrate SendGrid or similar
// Add reminder scheduling with cron
```

### Phase 3: Polish & Advanced Features (Week 3)

**Priority 8: Version Comparison UI**
```typescript
// src/components/dashboard/version-comparison.tsx
// Side-by-side audio players
// Diff view showing lyric changes
```

**Priority 9: Enhanced Recipient Profile**
```typescript
// Expand src/app/(dashboard)/projects/new/
// Add personality traits input
// Add favorite moments text area
// Music preference enhancement
```

---

## Following AGENTS.md Conventions

**DO:**
- ✅ Use `@/` import alias for all internal imports
- ✅ Wrap `useSearchParams()` in Suspense boundaries
- ✅ Use Server Components by default, `'use client'` only when needed
- ✅ Validate API inputs with Zod schemas from `src/lib/validations/`
- ✅ Keep mock services in `src/lib/services/` swappable for real APIs
- ✅ Include co-author line: `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`

**DON'T:**
- ❌ Use `useSearchParams()` without Suspense wrapper
- ❌ Access Supabase directly in components (use API routes)
- ❌ Hardcode URLs (use `NEXT_PUBLIC_APP_URL`)
- ❌ Create database migrations (manual SQL in Supabase dashboard only)

---

## Database Schema Changes Needed

**Additions to match PRD:**

```sql
-- Add personality traits and favorite moments to projects table
ALTER TABLE public.projects 
  ADD COLUMN personality_traits JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN favorite_moments TEXT,
  ADD COLUMN music_reminders JSONB DEFAULT '[]'::jsonb;

-- Add delivery tracking
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  delivery_method TEXT CHECK (delivery_method IN ('download', 'email', 'scheduled', 'shareable_link')),
  recipient_email TEXT,
  scheduled_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  shareable_link_token TEXT UNIQUE,
  password_protected BOOLEAN DEFAULT false,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add contribution mapping
CREATE TABLE IF NOT EXISTS public.contribution_mappings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  song_version_id UUID REFERENCES public.song_versions(id) ON DELETE CASCADE NOT NULL,
  submission_id UUID REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL,
  song_section TEXT CHECK (song_section IN ('verse1', 'chorus', 'verse2', 'bridge')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add reminder scheduling
ALTER TABLE public.invites
  ADD COLUMN reminder_sent_at TIMESTAMPTZ,
  ADD COLUMN reminder_count INTEGER DEFAULT 0;
```

**Run these manually in Supabase SQL editor** (per AGENTS.md convention)

---

## Sub-Agent Implementation Strategy

**Agent 1: Audio Recording Component**
- File: `src/components/ui/audio-recorder.tsx`
- API: Upload endpoint for Supabase Storage
- Duration: 4-6 hours

**Agent 2: Gift Delivery System**
- Files: `/api/v1/projects/[projectId]/deliver/`, delivery UI
- Database: deliveries table
- Duration: 6-8 hours

**Agent 3: Auto-Regeneration & Mapping**
- Files: Enhanced generation logic, contribution mapping UI
- Database: contribution_mappings table
- Duration: 6-8 hours

**Agent 4: UI/UX Redesign**
- Files: Tailwind config, all component redesigns
- Duration: 8-10 hours

**Agent 5: Real Email/SMS & Reminders**
- Files: Enhanced notifications.ts, reminder cron
- Duration: 4-6 hours

---

## Success Criteria

**End-to-End Flow:**
1. Host creates tribute with personality traits, favorite moments
2. Host invites contributors via email/SMS
3. Contributors record audio messages (browser recorder)
4. Song auto-regenerates as contributions arrive
5. Host sees contribution → song mapping visualization
6. Host delivers gift via email with embedded player OR scheduled delivery
7. Recipient receives shareable link (optional password)

**Matches PRD:**
- ✅ 3-4 minute full songs
- ✅ Warm, intimate UI/UX
- ✅ Multi-modal contributions (text + audio)
- ✅ Iterative song evolution
- ✅ Gift delivery options
- ✅ Email/SMS orchestration with tracking

---

## Ready to Implement?

Following your ai-coding-config (AGENTS.md), I'll spawn 5 sub-agents to implement in parallel while adhering to your conventions.

**Estimated Timeline:** 3 weeks for complete implementation
**Current Completion:** 70% infrastructure, 30% features remaining
