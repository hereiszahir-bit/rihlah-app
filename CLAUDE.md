# Rihlah — Batin Operating Context

> This file layers on top of the global Batin identity (`~/.claude/CLAUDE.md`).
> Batin has already loaded who Z is, how we think, and what we're optimizing for.
> This file is the project-specific depth — the batin of Rihlah.

---

## The Thesis

There's a real, coordinated demand signal among Muslim travelers that no platform serves with cultural intelligence. Rihlah makes that signal visible. The "Here Now / Going Soon" mechanic creates organic coordination without us having to build messaging or booking infrastructure.

---

## Stack

- **Frontend:** React 19 + React Router 7 (CRA, SPA)
- **Backend:** Firebase — project `project-2cbf23b7-ef74-4136-b0e`
- **Database:** Firestore
- **Auth:** Firebase Auth (email/password + Google OAuth)
- **Storage:** Firebase Storage (profile photos)
- **Analytics:** Firebase Analytics
- **Hosting:** Firebase Hosting
- **Domain:** rihlah.io
- **Animations:** Framer Motion
- **Maps:** React Leaflet
- **Email:** EmailJS (waitlist confirmations)
- **Dates:** date-fns + react-date-range

---

## Screens

| Screen | Route | Purpose |
|--------|-------|---------|
| Landing | `/` | Marketing page + waitlist signup (currently "Coming Soon") |
| Signup | `/signup` | Email + Google registration |
| Login | `/login` | Authentication |
| Onboarding | `/onboarding` | Multi-step: name, age, gender, visibility, city, bio, interests, photo |
| Destinations | `/destinations` | Browse destinations with "Here Now" / "Planning" counts |
| Destination Detail | `/destination/:id` | People (filtered by gender/age/interests) + Experiences tab |
| Add Trip | `/add-trip` | Create trip with destination search, date range, overlap detection |
| Saved (My Trips) | `/saved` | Upcoming/past trips, overlapping travelers, saved experiences |
| Profile | `/profile` | User info, upcoming trips, connections, incoming requests |
| Edit Profile | `/edit-profile` | Update profile details |
| Messages | `/messages` | Conversation list with unread counts |
| Chat Room | `/chat/:id` | Real-time messaging |
| Waitlist | `/waitlist` | Waitlist management |

---

## Core Mechanic: Here Now / Going Soon

Fully implemented. This is the product's heartbeat.

- User adds a trip with `startDate` / `endDate`
- System compares against today's date on every view
- `today >= startDate && today <= endDate` → **Here Now**
- Future dates → **Going Soon / Planning**
- Destinations screen shows real-time counts per city
- Destination detail has subtabs filtering by status
- Connections display uses green ring (here now) vs gray ring (upcoming)
- Past trips auto-archive via `runCleanup()` in UserContext on login

---

## Architecture Decisions

| Decision | Rationale |
|---|---|
| Gender-based profile visibility | Privacy-first — users control who sees their profile |
| Bidirectional connection system | No one-sided following; mutual consent required |
| Firestore listeners for real-time | Presence freshness is the core value prop |
| EmailJS for waitlist | No backend needed for confirmation emails |
| Hardcoded experiences per destination | Curated quality over API noise — 16 featured destinations |
| Auto-cleanup of stale requests | 30-day old connection requests auto-deleted |
| WhatsApp/Instagram links on profiles | Don't build messaging infrastructure we don't need to own |

---

## File Structure

```
/src
  /pages
    ModernHome.js          ← landing + waitlist
    Signup.js, Login.js
    Onboarding.js          ← multi-step profile setup
    Destinations.js        ← main explorer with here now / planning counts
    DestinationDetail.js   ← people + experiences tabs
    AddTrip.js             ← trip creation with overlap detection
    Saved.js               ← my trips + saved experiences
    Profile.js             ← user profile + connections
    EditProfile.js
    Messages.js            ← conversation list
    ChatRoom.js            ← real-time chat
  /components
    TabBar.js              ← bottom nav (5 tabs)
    CommunityMap.js        ← Leaflet map
    DestinationGrid.js
    DateRangePicker.js
    OnboardingCards.js
    FilterBar.js
    PeopleTab.js           ← people listing with filters
    ExperiencesTab.js      ← experiences with GetYourGuide links
  /context
    UserContext.js         ← global state: user, connections, requests, cleanup
  firebase.js              ← config + service initialization
  App.js                   ← router + auth-based routing
```

---

## Firestore Schema

```
users/{userId}
  email, name, age, gender, profileVisibility
  city, bio, interests[], identity[]
  photoURL, whatsapp, instagram
  upcomingTrips[{destination, startDate, endDate, experiences[]}]
  pastTrips[]
  connections[{userId, name, age, gender, bio, photoURL, interests, whatsapp, instagram, connectedAt}]
  onboardingComplete, createdAt

connectionRequests/{requestId}
  fromUserId, fromUserName, fromUserAge, fromUserGender
  fromUserBio, fromUserPhotoURL, fromUserInterests
  toUserId, toUserName
  status: 'pending'|'accepted'|'rejected'
  createdAt

conversations/{conversationId}
  participants[], lastMessage, lastMessageTime, lastSenderId
  unread_${userId}
  messages/{messageId}
    senderId, text, createdAt

waitlist/{docId}
  email, name, age, gender, profileVisibility
  homeCity, identity[], interests[]
  travelSeasons[], countries[]
  source{utm_source, utm_medium, utm_campaign}
  createdAt
```

---

## Monetization: GetYourGuide Affiliate

Integrated but not yet monetized.

- 50+ experiences hardcoded across 16 featured destinations
- Each has name, price, duration, rating, review count, and `bookingUrl`
- URLs point to GetYourGuide but lack affiliate partner ID
- Muslim-specific curation: Umrah, mosque tours, halal food, Islamic history
- **To activate:** append `?partner=PARTNER_ID` to booking URLs

Featured destinations: Istanbul, Dubai, Cairo, Marrakech, Kuala Lumpur, Mecca, Medina, Amman, Sarajevo, Cordoba, Fez, Doha, Muscat, Baku, Zanzibar, Barcelona, London, Jakarta

---

## State Management

**UserContext.js** is the central nervous system:
- `currentUser` — Firebase Auth object
- `currentUserData` — full profile document
- `allUsers` / `allUsersMap` — all users with O(1) lookup
- `connections` — derived from profile + allUsersMap
- `connectionRequests` / `incomingRequests` / `outgoingRequests`
- `sentRequestUserIds` — quick lookup for UI state
- Auto-cleanup on login: archives past trips, purges stale requests

---

## Build & Deploy

```bash
npm run build            # CRA → /build
firebase deploy          # Hosting + rules + indexes
```

---

## Constraints

- **Privacy-first** — gender visibility controls are non-negotiable
- **Mobile-first** — designed for phones (vmin/vmax, touch-friendly)
- **Zero marketing budget** — organic distribution through community
- **Currently in waitlist mode** — "Coming Soon" on landing is intentional

---

## What We Are Not Building

- Booking engine (GetYourGuide handles transactions)
- In-app payments
- Flight/hotel search
- Native mobile apps (yet)
- Content/blog layer
