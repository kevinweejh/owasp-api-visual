# 🛡️ OWASP API Security Top 10 — Visualised (2023 Edition)

**A static, interactive educational site that shows API developers what OWASP API Security Top 10 vulnerabilities actually look like** — from the request, through the server code, to what an attacker sees in a terminal or DevTools console.

Unlike hacking playgrounds (crAPI, VAmPI) where you exploit a live vulnerable API, this project is a **visual museum exhibit**: step-by-step walkthroughs that show the anatomy of each API-specific vulnerability using simulated, static demonstrations. No setup, no Docker, no attack infrastructure.

This is a sibling project to "OWASP Top 10 — Visualised" (the general web application Top 10, 2025 edition), following the exact same architecture and conventions, adapted for the API-specific 2023 list.

> 🎯 **Target audience:** Backend, mobile and frontend developers who build or consume APIs daily and want to understand the _shape_ of API-specific security failures — which look different from classic web vulnerabilities — without needing a penetration testing background.

---

## Viewing it

Open [OWASP API Top 10 (2023) Visualised](https://labs.codebykevin.dev/owasp-api-visual/) in any modern browser. That's it — no build, no server, no dependencies.

Each category (API1–API10) walks through the same 5-step story: the normal flow, the vulnerable code, the attack, the impact, and the fix — shown from multiple perspectives (code, request/response, DevTools/terminal, database, fixed code, defense principles). Dark/light theming follows your OS setting by default, with a manual toggle to override.

---

## Content Coverage

Each category's "Impact" step also cites real-world breaches or incidents illustrating that failure mode in practice.

| # | Category | Attack Vectors Demonstrated |
|---|----------|----------------------------|
| **API1** | Broken Object Level Authorization | Order-lookup ID enumeration via DevTools console + automation script |
| **API2** | Broken Authentication | Forged `alg:none` JWT, credential stuffing against an unthrottled login API |
| **API3** | Broken Object Property Level Authorization | Excessive data exposure via raw object serialization, mass assignment privilege escalation |
| **API4** | Unrestricted Resource Consumption | SMS-OTP cost-abuse bombing, unpaginated export endpoint exhaustion |
| **API5** | Broken Function Level Authorization | Regular user calling an undocumented admin endpoint discovered in a JS bundle |
| **API6** | Unrestricted Access to Sensitive Business Flows | Bot swarm automating a ticket-purchase flow with perfectly valid, correctly-authorized requests |
| **API7** | Server Side Request Forgery | Cloud metadata credential theft and internal network scanning via a URL-fetching feature |
| **API8** | Security Misconfiguration | Publicly exposed Swagger/OpenAPI docs, CORS origin-echo exploitation, verbose stack traces |
| **API9** | Improper Inventory Management | A forgotten, weakly-authenticated "zombie" v1 API left running alongside a secured v2 |
| **API10** | Unsafe Consumption of APIs | Blind trust in a compromised partner API's response, leading to stored XSS and an internal redirect |

---

## Architecture

Three files, no build step, no framework: `index.html` (all content), `styles.css` (theming + a reusable "mock UI" component library), `script.js` (a single `DOMContentLoaded` handler wiring up all interactivity, with API-specific `localStorage` keys and glossary terms).

---

## License & Disclaimer

### Disclaimer

This project is an **educational resource** for defensive security awareness. All demonstrations use simulated, static examples. No real systems are targeted, attacked, or harmed.

The techniques shown are for **defensive understanding only** — to help developers recognise, prevent, and fix these issues in their own APIs.

**Unauthorised testing of systems you do not own is illegal** under:
- Computer Fraud and Abuse Act (CFAA) — United States
- Computer Misuse Act 1990 — United Kingdom
- Equivalent legislation in most jurisdictions worldwide

### Attribution

- Based on the [OWASP API Security Top 10 (2023)](https://owasp.org/projects/api-security-project) by the OWASP Foundation
- Not affiliated with or endorsed by the OWASP Foundation
- Real-world breach examples cited for educational context only

### License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built with 🛡️ by a web developer learning security — for API developers learning security.</strong>
</p>
