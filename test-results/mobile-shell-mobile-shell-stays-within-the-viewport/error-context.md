# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: mobile-shell.spec.ts >> mobile shell stays within the viewport
- Location: e2e/mobile-shell.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'New Entry' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: 'New Entry' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - navigation [ref=e6]:
      - generic [ref=e8]:
        - img [ref=e10]
        - generic [ref=e12]: DeltaJournal
    - generic [ref=e13]:
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]:
            - heading "DELTA" [level=1] [ref=e19]
            - heading "DELTA" [level=1] [ref=e20]
          - heading "TRADING JOURNAL" [level=1] [ref=e21]
          - paragraph [ref=e22]: Professional Crypto Trading Psychology
        - button "ACCESS TERMINAL" [ref=e24] [cursor=pointer]: ACCESS TERMINAL
      - generic [ref=e26]:
        - generic [ref=e27]:
          - generic [ref=e28]: SYSTEM STATUS
          - generic [ref=e29]: OPERATIONAL
        - generic [ref=e31]:
          - generic [ref=e32]: VERSION
          - text: 2.0.9 [BETA]
    - generic [ref=e34]:
      - generic [ref=e35]:
        - generic [ref=e36]:
          - generic [ref=e37]:
            - img [ref=e39]
            - generic [ref=e40]: "01"
          - generic [ref=e41]:
            - heading "Emotional Alpha" [level=3] [ref=e42]
            - paragraph [ref=e43]: Track your psychological state alongside market movements. Identify the emotions that lead to your best and worst trades.
        - generic [ref=e44]:
          - generic [ref=e45]:
            - img [ref=e47]
            - generic [ref=e48]: "02"
          - generic [ref=e49]:
            - heading "P&L Correlation" [level=3] [ref=e50]
            - paragraph [ref=e51]: Visualize the direct impact of your mood on your profit and loss. Data-driven insights to optimize your trading psychology.
        - generic [ref=e52]:
          - generic [ref=e53]:
            - img [ref=e55]
            - generic [ref=e56]: "03"
          - generic [ref=e57]:
            - heading "Pre-Market Routine" [level=3] [ref=e58]
            - paragraph [ref=e59]: Structured journaling prompts to baseline your mental state before the opening bell. Enter the market with clarity.
      - generic [ref=e60]:
        - generic [ref=e61]:
          - generic [ref=e62]:
            - img [ref=e64]
            - generic [ref=e67]: "04"
          - generic [ref=e68]:
            - heading "Tilt Detection" [level=3] [ref=e69]
            - paragraph [ref=e70]: Real-time analysis to detect signs of emotional tilt. Get alerts to step away before you force a bad trade.
        - generic [ref=e71]:
          - generic [ref=e72]:
            - img [ref=e74]
            - generic [ref=e77]: "05"
          - generic [ref=e78]:
            - heading "Trade Review" [level=3] [ref=e79]
            - paragraph [ref=e80]: Link specific journal entries to trade executions. specific feedback loops for continuous improvement.
        - generic [ref=e81]:
          - generic [ref=e82]:
            - img [ref=e84]
            - generic [ref=e87]: "06"
          - generic [ref=e88]:
            - heading "Secure Vault" [level=3] [ref=e89]
            - paragraph [ref=e90]: Your trading edge is private. End-to-end encryption ensures your psychological data remains yours alone.
    - generic [ref=e92]:
      - generic [ref=e93]:
        - heading "Choose your edge in the market_" [level=2] [ref=e94]:
          - generic [ref=e95]: Choose your edge in the market_
        - paragraph [ref=e96]: Transparent pricing, no hidden fees. Focus on your trading while we handle the data.
        - generic [ref=e98]:
          - button "Monthly" [ref=e99] [cursor=pointer]
          - button "Annual" [ref=e100] [cursor=pointer]
      - generic [ref=e101]:
        - generic [ref=e104]:
          - generic [ref=e105]: BETA
          - generic [ref=e106]:
            - heading "[01] BETA ACCESS" [level=3] [ref=e107]
            - heading "Beta Access" [level=4] [ref=e108]
            - paragraph [ref=e109]: Experience the full power of Delta Trading Journal during our beta phase. Refine your emotional edge for free.
            - generic [ref=e110]:
              - generic [ref=e111]: $0
              - generic [ref=e112]: EARLY ACCESS PROGRAM
          - list [ref=e113]:
            - listitem [ref=e114]: Unlimited Journal Entries
            - listitem [ref=e116]: Emotional Alpha Analytics
            - listitem [ref=e118]: Interactive P&L Correlation
            - listitem [ref=e120]: Daily Pre-Market Baselining
            - listitem [ref=e122]: Secure Data Encryption
          - button "Access Terminal" [ref=e124] [cursor=pointer]: Access Terminal
        - generic [ref=e127]:
          - generic [ref=e128]: PRO
          - generic [ref=e129]:
            - heading "[02] PRO TERMINAL" [level=3] [ref=e130]
            - heading "PRO Terminal" [level=4] [ref=e131]
            - paragraph [ref=e132]: Advanced psychological analytics for elite traders seeking mathematical precision in their discipline.
            - generic [ref=e133]:
              - generic [ref=e134]: Coming soon
              - generic [ref=e135]: Roadmap Q2 2026
          - list [ref=e136]:
            - listitem [ref=e137]: Exchange Integration (Bybit, Binance, OKX)
            - listitem [ref=e139]: Strategy Performance Matrices
            - listitem [ref=e141]: Advanced Risk-Psych Correlation
            - listitem [ref=e143]: Dedicated Support Roadmap
            - listitem [ref=e145]: Custom Feature Voting
          - button "Notify Me" [ref=e147] [cursor=pointer]: Notify Me
      - generic [ref=e150]:
        - generic [ref=e151]:
          - generic [ref=e153]: $
          - generic [ref=e155]: ₿
        - paragraph [ref=e156]:
          - text: Annual Crypto payments accepted
          - link "Get started in Discord →" [ref=e157] [cursor=pointer]:
            - /url: "#"
    - generic [ref=e159]:
      - heading "Trusted by High Performers" [level=2] [ref=e160]
      - generic [ref=e161]:
        - generic [ref=e162]:
          - generic [ref=e163]: "\""
          - paragraph [ref=e164]: This app completely changed how I view my daily stress. The data visualization is a game changer.
          - generic [ref=e165]:
            - generic [ref=e166]: A
            - generic [ref=e167]:
              - heading "Alex M." [level=4] [ref=e168]
              - paragraph [ref=e169]: Day Trader
        - generic [ref=e170]:
          - generic [ref=e171]: "\""
          - paragraph [ref=e172]: Finally, a journaling app that feels professional and sleek. It helps me stay grounded.
          - generic [ref=e173]:
            - generic [ref=e174]: S
            - generic [ref=e175]:
              - heading "Sarah K." [level=4] [ref=e176]
              - paragraph [ref=e177]: Software Engineer
        - generic [ref=e178]:
          - generic [ref=e179]: "\""
          - paragraph [ref=e180]: I love the dark mode and the intuitive design. It makes reflection feel like a high-value activity.
          - generic [ref=e181]:
            - generic [ref=e182]: J
            - generic [ref=e183]:
              - heading "James L." [level=4] [ref=e184]
              - paragraph [ref=e185]: Product Manager
    - contentinfo [ref=e186]:
      - generic [ref=e188]:
        - generic [ref=e189]: © 2026 Delta Trading Journal. All rights reserved.
        - generic [ref=e190]:
          - button "Privacy Policy" [ref=e191] [cursor=pointer]
          - button "Terms of Service" [ref=e192] [cursor=pointer]
          - link "Contact" [ref=e193] [cursor=pointer]:
            - /url: mailto:contact@deltajly.xyz
  - generic [ref=e196]:
    - generic [ref=e197]:
      - heading "We value your privacy" [level=3] [ref=e198]
      - paragraph [ref=e199]: We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
    - generic [ref=e200]:
      - button "Customize" [ref=e201] [cursor=pointer]
      - button "Reject All" [ref=e202] [cursor=pointer]
      - button "Accept All" [ref=e203] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('mobile shell stays within the viewport', async ({ page }) => {
  4  |   await page.setViewportSize({ width: 360, height: 800 });
  5  |   await page.goto('/');
  6  | 
> 7  |   await expect(page.getByRole('button', { name: 'New Entry' })).toBeVisible();
     |                                                                 ^ Error: expect(locator).toBeVisible() failed
  8  |   await expect(page.getByRole('button', { name: /journal/i }).first()).toBeVisible();
  9  | 
  10 |   const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  11 |   expect(hasHorizontalOverflow).toBe(false);
  12 | });
  13 | 
```