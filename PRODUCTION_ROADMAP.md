# ConvoGlass Production Roadmap

This roadmap turns ConvoGlass from a polished frontend prototype into a production-grade interview practice platform.

## Product Goal

ConvoGlass should become a real mock interview platform where a user can:

- Sign up and manage their profile.
- Upload a resume.
- Choose an interview type: behavioral, coding, or system design.
- Complete an AI-led interview through text or voice.
- Receive structured feedback.
- Review past sessions and track improvement over time.

The first production version should focus on making the core interview loop excellent before adding payments, enterprise dashboards, marketplace features, or complex admin tools.

## Phase 0: Scope Lock

Define the minimum production product.

### Deliverables

- Confirm target users: students, job seekers, bootcamp learners, or engineering professionals.
- Define the v1 interview types.
- Decide whether v1 supports only behavioral interviews or all three rounds.
- Define scoring categories for each interview type.
- Decide what data must be stored and what should remain temporary.

### Recommended V1 Scope

- Authentication
- Resume upload
- Behavioral interview with real AI follow-ups
- Session transcript persistence
- Structured feedback report
- Basic progress history

## Phase 1: Stabilize Current App

Goal: make the existing frontend reliable and maintainable.

### Tasks

- Run `npm run build` and fix all build errors.
- Run `npm run lint` and fix lint errors.
- Test `/` and `/workspace` manually in browser.
- Audit browser console warnings and runtime errors.
- Remove or isolate fake prototype values such as hardcoded candidate names, fake score history, and static resume data.
- Replace `alert`, `confirm`, and `prompt` with proper modal components.
- Improve responsive layout for mobile and tablet.
- Split large files into smaller components, especially `src/app/workspace/page.tsx`.

### Suggested Frontend Structure

```text
src/
  app/
    page.tsx
    workspace/page.tsx
    api/
  components/
    layout/
    interview/
    coding/
    whiteboard/
    feedback/
    analytics/
  lib/
    ai/
    auth/
    db/
    resume/
    scoring/
    speech/
```

## Phase 2: Backend Foundation

Goal: add real server-side architecture.

### Recommended Stack

- Next.js server routes or server actions
- PostgreSQL
- Prisma or Drizzle
- Auth.js, Clerk, or Supabase Auth
- S3, R2, or Supabase Storage for resume files
- Vercel for deployment

### Core Data Models

```text
User
Resume
InterviewSession
InterviewTurn
SpeechMetric
CodingSubmission
FeedbackReport
SystemDesignArtifact
```

### Initial API Surface

```text
POST /api/resume/upload
POST /api/interview/start
POST /api/interview/respond
POST /api/interview/finish
POST /api/feedback/generate
GET  /api/sessions
GET  /api/sessions/:id
```

Coding-specific APIs can come later:

```text
POST /api/coding/run
POST /api/coding/submit
```

## Phase 3: Real AI Interview Engine

Goal: replace simulated interviewer behavior with structured AI responses.

### Tasks

- Create an AI service layer under `src/lib/ai`.
- Add reusable prompt templates.
- Use structured outputs for predictable app behavior.
- Store every interviewer and user turn.
- Generate follow-up questions from previous answers.
- Add clear session-ending logic.

### Suggested AI Module Structure

```text
src/lib/ai/
  client.ts
  prompts.ts
  schemas.ts
  interview-engine.ts
  feedback-engine.ts
```

### Interview Response Shape

```ts
type InterviewResponse = {
  interviewerMessage: string;
  intent: "follow_up" | "challenge" | "clarify" | "finish";
  scoreDelta: number;
  observedSignals: string[];
  suggestedFocus: string[];
};
```

### Recommended First Target

Start with behavioral interviews. They are the fastest path to a real production loop because they do not require secure code execution or diagram evaluation.

## Phase 4: Resume Parsing

Goal: make resume-aware interviews real.

### Pipeline

1. User uploads a resume file.
2. Backend validates file type and size.
3. Backend extracts text from PDF or DOCX.
4. AI converts raw resume text into structured profile data.
5. Profile data is stored and linked to interview sessions.
6. Interview questions are generated from the resume profile.

### Resume Profile Shape

```ts
type ResumeProfile = {
  name: string;
  roles: string[];
  skills: string[];
  projects: {
    name: string;
    stack: string[];
    description: string;
    riskAreas: string[];
  }[];
  experience: {
    company: string;
    role: string;
    impact: string[];
  }[];
};
```

### Production Requirements

- File size limits
- File type validation
- Secure storage
- Delete/resubmit resume flow
- Privacy policy
- User consent for AI processing
- Prompt-injection protection for resume text

## Phase 5: Session Persistence

Goal: users should never lose interview progress.

### Persist

- User ID
- Resume ID
- Interview type
- Persona
- Target company
- Session status
- Transcript
- Speech metrics
- Coding submissions
- Whiteboard state
- Final feedback report
- Session duration
- Created and updated timestamps

### Replace Prototype Data

- Replace fake recent sessions with database-backed sessions.
- Replace static analytics chart data with real user history.
- Replace generated feedback placeholders with stored reports.

## Phase 6: Feedback And Scoring

Goal: make feedback consistent, useful, and trustworthy.

### Behavioral Rubric

- STAR structure
- Specificity
- Ownership
- Impact quantification
- Clarity
- Filler-word control

### Coding Rubric

- Correctness
- Time complexity
- Space complexity
- Edge cases
- Explanation quality
- Debugging behavior

### System Design Rubric

- Requirement clarification
- API and data model quality
- Scalability
- Reliability
- Trade-off reasoning
- Bottleneck identification

### Feedback Report Shape

```ts
type FeedbackReport = {
  overallScore: number;
  categoryScores: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  improvedAnswer: string;
  roadmap: string[];
  nextRecommendedSession: string;
};
```

## Phase 7: Secure Coding Sandbox

Goal: support real coding interviews safely.

Current state:

- JavaScript execution happens in the browser with `new Function`.
- Python execution is mocked.

### Production Direction

- Do not run arbitrary user code directly on the server.
- Use a sandbox provider, isolated containers, or a judge-style execution service.
- Add strict execution timeouts and memory limits.
- Add hidden test cases.
- Store submissions and results.

### Coding V1

- JavaScript only
- Predefined problems
- Hidden test cases
- Safer execution boundary
- AI explanation review after submission

### Coding V2

- Python support
- More languages
- Better test diagnostics
- Complexity analysis
- Replayable submissions

## Phase 8: Voice And Speech

Goal: make voice mode reliable and transparent.

### Tasks

- Keep text input as a first-class fallback.
- Add clear microphone permission states.
- Add browser compatibility warnings.
- Consider server-side transcription for production reliability.
- Store speech metrics separately from raw transcript.
- Store audio only with explicit user consent.

### Speech Metrics

- Words per minute
- Filler count
- Pause duration
- Answer length
- Repeated phrases
- Estimated clarity score

Avoid presenting confidence as a psychological truth. Treat it as an estimated communication metric.

## Phase 9: System Design Whiteboard

Goal: make the whiteboard saveable and evaluatable.

### Tasks

- Persist canvas state as JSON.
- Add undo and redo.
- Add keyboard deletion.
- Add better node selection states.
- Replace browser prompts with inline label editing.
- Add export to image.
- Add system component templates.
- Let AI evaluate the diagram plus spoken or typed explanation.

### Whiteboard State Shape

```ts
type WhiteboardArtifact = {
  nodes: Node[];
  connections: Connection[];
  notes: string[];
};
```

## Phase 10: Testing And Quality

Goal: make future changes safe.

### Recommended Tools

- Vitest
- React Testing Library
- Playwright
- ESLint
- TypeScript strict mode

### Test Coverage

- Unit tests for speech metrics.
- Unit tests for scoring helpers.
- Unit tests for AI response schema validation.
- Component tests for interview UI.
- API tests for interview start/respond/finish.
- Playwright tests for critical user flows.

### Critical E2E Flows

- Sign up.
- Upload resume.
- Start behavioral interview.
- Answer two questions.
- Finish interview.
- View feedback report.
- Reopen session from history.

## Phase 11: Security And Privacy

Goal: protect sensitive resume and interview data.

### Must-Haves

- Authentication
- Authorization checks on every session and resume
- Input validation with Zod or equivalent
- File validation
- Rate limiting
- API abuse protection
- Prompt-injection defenses
- Secure environment variable handling
- No sensitive data in production logs
- Data deletion flow
- Privacy policy and terms

### Useful Additions

- Audit logs for sensitive actions
- Request IDs in logs
- Encryption for sensitive stored fields if needed
- Separate development and production credentials

## Phase 12: Deployment And Observability

Goal: confidently run the app in production.

### Deployment

- Vercel for the Next.js app
- Managed PostgreSQL
- Object storage for resumes
- Environment variables for AI and storage credentials

### Observability

- Error tracking with Sentry or similar
- Product analytics with PostHog, Plausible, or similar
- Structured server logs
- AI latency tracking
- AI cost tracking

### Metrics To Track

- Interview completion rate
- Resume upload failure rate
- AI response latency
- AI cost per session
- Feedback generation failure rate
- Speech recognition fallback rate
- Returning user rate

## MVP Milestones

### Milestone 1: Production Skeleton

- Build and lint pass.
- Auth is added.
- Database is added.
- User sessions are persisted.
- Dashboard reads real user data.

### Milestone 2: Real Behavioral Interview

- Resume upload works.
- Resume text extraction works.
- AI generates interview questions.
- AI generates follow-up questions.
- Transcript is stored.
- Feedback report is generated from real session data.

### Milestone 3: History And Analytics

- Past sessions page works.
- Score trend chart uses real data.
- User can reopen old feedback.
- App recommends next practice area.

### Milestone 4: Coding Round

- JavaScript execution is safer.
- Hidden test cases exist.
- Coding submissions are persisted.
- AI feedback includes correctness and explanation quality.

### Milestone 5: System Design Round

- Whiteboard is persisted.
- Canvas can be exported.
- AI evaluates diagram and explanation.
- System design scorecard is round-specific.

### Milestone 6: Launch Readiness

- Critical tests exist.
- Rate limits exist.
- Error monitoring is installed.
- Privacy and deletion flows exist.
- Production deployment is documented.

## Immediate Next Sprint

This is the recommended first production sprint.

### Sprint Goal

Convert the prototype into a stable app foundation with the first real AI-backed interview loop.

### Checklist

- [x] Run `npm run build`.
- [x] Run `npm run lint`.
- [x] Fix current build and lint issues.
- [ ] Refactor `src/app/workspace/page.tsx` into smaller components.
- [ ] Add auth decision: Auth.js, Clerk, or Supabase Auth.
- [ ] Add database decision: Prisma or Drizzle with PostgreSQL.
- [ ] Create initial database schema.
- [ ] Persist `InterviewSession` and `InterviewTurn`.
- [ ] Create `POST /api/interview/start`.
- [ ] Create `POST /api/interview/respond`.
- [ ] Create `POST /api/interview/finish`.
- [ ] Add structured AI response schema.
- [ ] Replace behavioral interview simulation with real AI responses.
- [ ] Replace fake feedback with AI-generated structured feedback.
- [ ] Replace fake session history with stored sessions.

## Guiding Principle

Keep the product loop small and real:

```text
Upload resume -> Start interview -> Answer questions -> Get feedback -> Improve next session
```

Everything else should support that loop.
