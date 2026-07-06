# SomBill — Design Folder Prompt Reference

Save this alongside the three HTML files in your `design` folder. It documents what each mockup is, its design intent, and can be reused as a prompt if you ever need to regenerate, extend, or brief someone else (a designer, developer, or Devin) on these screens.

```
design/
 ├── kitchen-dashboard.html
 ├── waiter-dashboard.html
 ├── customer-menu.html
 └── design-brief.md   ← this file
```

---

## Shared brand system (applies to all three)

**Colors**
- Deep purple (primary/background): `#170438`, `#2C0F72`, `#39129A`
- Ice blue (accent): `#8FB9D6`, `#B7D4E8`
- Silver (neutral/surface): `#DADCE1`, `#F1F2F4`
- Status colors: success green `#2FAF7B` / `#3FD08F`, warning amber `#E3922E` / `#F0A93E`, danger red `#E1505C` / `#F0555F`

**Typography**
- Outfit — headings, brand name, display text
- Inter — body copy, labels, UI text
- IBM Plex Mono — order numbers, timers, prices, table codes

**Signature motif**
- An S-curve accent (echoing the SomBill logo mark) used as a status/progress indicator — the colored curved edge on kitchen tickets, and the small curve icon beside customer menu section headers.

---

## 1. Kitchen Display System — `kitchen-dashboard.html`

**Prompt used:** *A kitchen display system for a restaurant POS, dark themed for mounted-screen visibility, showing order tickets flowing through New → Preparing → Ready columns, with color-coded elapsed timers, station filtering, and a live stats strip — using SomBill's deep purple / ice blue brand system and IBM Plex Mono for all numeric data.*

**Design intent**
- Dark background chosen deliberately — kitchen screens are mounted and need to stay legible from a distance and under bright kitchen lighting, unlike a typical light-mode dashboard.
- Three-column ticket board mirrors how kitchens actually think: what's new, what's cooking, what's ready to go out.
- Timers shift color (ice blue → amber → red) as a ticket ages, so a glance tells the kitchen what's falling behind — no need to read every number.
- Station tabs (Grill, Fry, Cold, Drinks) let a station only see its own tickets.

**Key interactions**
- Start Preparing / Mark Ready / Bump — Order Served buttons move a ticket through the state machine.
- Live clock and running stats (orders in queue, avg prep time, running late, completed today).

---

## 2. Waiter Dashboard — `waiter-dashboard.html`

**Prompt used:** *A waiter-facing tablet dashboard for a restaurant POS, light themed, built around a visual floor map of tables rather than a list, with color-coded table status (available, occupied, needs attention, bill requested), a slide-out order panel per table, and a live NFC call-bell alert banner — using SomBill's brand system.*

**Design intent**
- Floor map instead of a table list — waiters think spatially about their section, not by ID number.
- Table status colors double as a triage tool: amber pulsing = go there now, silver = print the bill, purple fill = order already in the kitchen.
- The call-bell banner surfaces NFC call requests (tied to SomBill's Call Bell product) as an interruption-worthy alert, not a buried notification.
- Order panel is a lightweight add/send/print flow so a waiter isn't context-switching to a separate screen mid-service.

**Key interactions**
- Tap a table → order panel slides in with live order, add-item flow, send-to-kitchen and print-bill actions.
- Acknowledge button on the call-bell banner.

---

## 3. Customer NFC Menu — `customer-menu.html`

**Prompt used:** *A mobile-first customer-facing digital menu for an NFC-enabled restaurant table, phone-frame mockup, dark luxury purple hero matching the SomBill brand card, bilingual English/Somali toggle with Somali dish names shown alongside English, category browsing, add-to-cart, a sticky cart bar, and a tap-to-call-waiter action.*

**Design intent**
- Phone-frame presentation because this is genuinely a phone-viewport experience (NFC tap opens it on the guest's own device) — not a desktop admin screen.
- Dark hero echoes the SomBill brand card itself (deep purple gradient, "Trusted Hospitality Partner"-style tagline) so the first thing a guest sees feels premium, not like a generic menu PDF.
- Bilingual by default (EN/SO toggle, Somali names shown under English ones) since this is core to the Somaliland market SomBill serves — not an afterthought setting.
- Sticky cart bar keeps checkout one thumb-reach away while browsing a long menu.

**Key interactions**
- Category tabs, add-to-order (+) buttons with live cart count/total.
- EN/SO language toggle.
- "Tap to call your waiter" — fires the same call-bell event the Waiter Dashboard listens for.

---

## How to reuse this

- **For a designer:** hand them the "Prompt used" line for each screen plus the shared brand system — enough to extend to new screens (e.g. Manager, onboarding) in the same visual language.
- **For Devin or another dev:** pair this file with `devin-prompt-enterprise-saas.md` — this doc explains the *why* behind each screen, the SaaS prompt explains the *architecture* to build it against.
- **For yourself, later:** if you want a 4th screen (e.g. a manager reporting view or an onboarding flow), copy the "Prompt used" format above and describe it the same way before generating.
