# Source notes — compensation plan

Source: the supplied 15-page `Plan_compensacion_esp.pdf`. The Spanish wording is transcribed into semantic HTML; English and French are translations. Decorative cover wording is additional editorial framing. Line breaks, capitalization, and accent marks may differ. Financial values are stored once in `src/content/slides.ts`; no earnings calculations are performed.

Unresolved source discrepancies, deliberately preserved in every language:

- Page 13 is labeled **6M**, requires 6,120,000–11,999,999 USDT, but the narrative says **5 million dollars**.
- Page 14 is labeled **12M**, requires 12,000,000 USDT, but the narrative says **10 million dollars**.
- Rank names are approximate milestones: **300K** starts at 306,000, **600K** at 612,000, **1.2M** at 1,224,000, and **3M** at 3,060,000. These are not normalized.
- The promoter volume uses **USD** while other rank volumes use **USDT**. Preserve the distinction.
- Page 6 mentions **5% or 6%** compound monthly returns after the first 3 direct referrals, without defining which rate applies when. Both figures and the condition are preserved; no eligibility rule is invented.
- The source uses both `1,02M` and `2.04M`. Retain these strings rather than interpreting them computationally.

Images were copied from the existing company website: `images/body/estate/hero.webp`, `images/landings/lideres-oportunidad.webp`, and `images/landings/lideres-expansion.webp`. Logo and webfonts also come from company assets. No external image or font requests are made.
