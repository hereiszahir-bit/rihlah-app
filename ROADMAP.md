# Rihlah Product Roadmap

> A private travel community for Muslims who move with intention.
> Technology-first. Community-driven. Operationally lean.

---

## Business Segments

Rihlah touches four revenue segments over time. Each phase unlocks the next.

| Segment | What | Revenue model | When |
|---------|------|---------------|------|
| **B2C Members** | Subscription access to the community + AI concierge | $12/month or $120/year | Phase 2 |
| **Marketplace** | Curated experiences, dining, accommodation — partnered, not operated | 15-20% commission on bookings | Phase 3 |
| **B2B Destinations** | Tourism boards + hospitality brands pay for access to Muslim traveler audience | Sponsorship / campaign deals ($15-50K each) | Phase 4 |
| **Data & Intelligence** | Muslim travel behavior insights — where they go, what they spend, what they need | Licensed reports / API access | Phase 5 |

---

## Phase 1: Foundation (Months 1-3)

**Goal:** Build the core app, seed the first 500 members, establish the brand.

**Build:**
- [ ] Dark-first design system + component library
- [ ] Application flow (name, city, short answer: "what does travel mean to you?")
- [ ] Member profiles — travel identity (where you've been, where you want to go, travel style)
- [ ] Discover feed — curated city content in story format (full-screen, swipeable)
- [ ] Member directory — browse by destination interest, city, travel style
- [ ] Basic presence — "Going to Istanbul in March" status

**Content:**
- [ ] Launch city guides for 4 cities: Istanbul, Marrakech, Andalusia, Mexico City
- [ ] Instagram relaunch — match website aesthetic, editorial content
- [ ] Website live at rihlah.io

**Revenue:** $0 — this phase is about building the base.

**Key metric:** 500 members with complete profiles.

**What this proves:** Do Muslim travelers want a curated community? Will they apply? Will they fill out profiles?

---

## Phase 2: Intelligence (Months 3-6)

**Goal:** Launch the AI concierge. Convert free members to paid.

**Build:**
- [ ] AI city concierge (Claude API + structured city data)
  - "I'm in Istanbul, it's 3pm, Asr is at 5:15 — what should I do?"
  - Prayer-time-aware daily itineraries
  - Dining recommendations with community verification
  - Mosque finder with walking directions
- [ ] Save/wishlist — save places, experiences, restaurants across cities
- [ ] City activation — "I'm here now" mode unlocks full city guide
- [ ] Premium tier gate — free members browse and save, paid members get AI concierge + connect with members

**Content:**
- [ ] Expand to 8-10 city guides
- [ ] Community-submitted recommendations (members verify restaurants, experiences)
- [ ] Content partnerships with Muslim travel creators

**Revenue:** Premium subscriptions.
- Target: 1,000 paid members x $12/month = **$144K ARR**
- Freemium conversion rate target: 20-25%

**Key metric:** Paid conversion rate + weekly active usage of AI concierge.

**What this proves:** Will people pay for Muslim-specific travel intelligence? Is the AI concierge useful enough to justify $12/month?

---

## Phase 3: Connection + Marketplace (Months 6-12)

**Goal:** Enable member connections. Launch experience marketplace. Hit $500K ARR.

**Build:**
- [ ] Connect / request system — request to connect with members
- [ ] Messaging — DMs between connected members
- [ ] "Here now" ambient presence — see members currently in your city (opt-in)
- [ ] City-based member view — "12 Rihlah members in Istanbul this week"
- [ ] Experience marketplace — curated local experiences bookable in-app
  - Walking tours, food tours, cultural experiences, boat rides
  - Partnered with local operators (not operated by Rihlah)
  - 15-20% commission per booking
- [ ] Restaurant booking integration — reserve through the app at verified spots
- [ ] Group formation — organic "who's interested in doing X on Thursday?" (not forced)

**Content:**
- [ ] 15-20 city guides
- [ ] Member spotlight stories (editorial content featuring members)
- [ ] Trip reports — members share their experiences (user-generated content loop)

**Revenue:**
- Subscriptions: 3,000 paid x $12/month = **$432K**
- Marketplace: 4,000 bookings x $80 avg x 18% = **$58K**
- **Total: ~$490K ARR**

**Key metric:** Connections per member, marketplace conversion rate, NPS.

**What this proves:** Do members actually connect and meet? Do they book experiences through the app? Is the marketplace viable?

---

## Phase 4: B2B + Scale (Months 12-18)

**Goal:** Open the B2B revenue stream. Become the channel for reaching Muslim travelers.

**Build:**
- [ ] Destination partnerships portal — tourism boards can sponsor city guides, feature experiences
- [ ] Promoted venues — restaurants and hotels pay for premium placement
- [ ] Analytics dashboard for B2B partners — impressions, bookings, audience demographics
- [ ] Events — member-organized meetups and gatherings (Rihlah provides the platform, members organize)
- [ ] Referral system — members invite other members (curated, not viral)

**Business development:**
- [ ] Pitch 5-10 tourism boards (Turkey, Morocco, Spain, UAE, Malaysia, Indonesia)
- [ ] Hotel/accommodation partnerships in top cities
- [ ] Airline partnerships (Muslim traveler audience access)

**Revenue:**
- Subscriptions: 6,000 paid x $12/month = **$864K**
- Marketplace: 10,000 bookings x $85 avg x 18% = **$153K**
- B2B partnerships: 6 deals x $30K avg = **$180K**
- Promoted venues: 50 venues x $200/month = **$120K**
- **Total: ~$1.3M ARR**

**Key metric:** B2B deal close rate, revenue per member, geographic expansion.

---

## Phase 5: Platform (Months 18-30)

**Goal:** Expand beyond travel. Become the Muslim professional/cultural network.

**Potential expansions:**
- [ ] Events beyond travel — Eid gatherings, cultural events, professional meetups
- [ ] Muslim professional network layer — career connections, industry tags
- [ ] City relocation guides — "Moving to Dubai? Here's what you need to know."
- [ ] Data licensing — aggregated Muslim travel intelligence sold to hospitality, airlines, tourism
- [ ] API — third-party apps integrate Rihlah's verified dining/mosque data
- [ ] White-label city guides for hotels and airlines

**Revenue target:** $2-3M ARR

**What this becomes:** The infrastructure layer for Muslim life in global cities — not just travel, but living, working, and connecting.

---

## Technical Architecture

| Layer | Stack | Notes |
|-------|-------|-------|
| **Frontend** | React 19 + Framer Motion | Dark-first, story-format UI |
| **Native** | Capacitor (iOS + Android) | Single codebase, native distribution |
| **Backend** | Firebase (Auth, Firestore, Storage) | Already in place |
| **AI** | Claude API (Anthropic) | City concierge, itinerary generation |
| **Payments** | Stripe | Subscriptions + marketplace |
| **Maps** | Mapbox or Google Maps | Member presence, city guides |
| **Prayer times** | Aladhan API or similar | Core to the AI concierge |
| **Analytics** | Mixpanel or Amplitude | Engagement, conversion, retention |

---

## Defensibility Stack

Each layer makes Rihlah harder to copy:

1. **Community** — the members and their connections (network effect)
2. **Data** — community-verified dining, mosques, experiences (gets better with use)
3. **AI** — trained on Muslim-specific travel patterns no general AI has
4. **Brand** — editorial quality, founder voice, cultural positioning
5. **B2B relationships** — tourism board contracts, venue partnerships

---

## Kill Criteria

Stop and reassess if:
- Phase 1: < 200 applications in first 60 days
- Phase 2: < 10% free-to-paid conversion after 90 days
- Phase 3: < 2 connections per active member per month
- Phase 4: < 2 B2B deals closed in 6 months

---

## Current Priority

Phase 1. Ship the app with:
1. Design system (dark-first)
2. Application flow
3. Member profiles
4. Discover feed (4 city guides)
5. Member directory

Everything else waits until the foundation proves demand.
