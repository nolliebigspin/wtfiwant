# Legal launch review — 23 October 2026

Scope: published German/English legal pages, source code, Stripe Checkout and
current live configuration. This records technical evidence and issues for legal
and tax review; it is not a certification of compliance in every jurisdiction.

The operator has now supplied these provider details: Alec Winter, sole
proprietor, Blumenau 89, 22089 Hamburg, Germany; contact@awinter.dev;
+49 178 1705600. The operator declares use of §19 UStG and reports no VAT ID,
OSS registration or cross-border EU SME registration. These are operator-supplied
facts, not independent tax-status verification. The trade deregistration is not
confirmed; the exact classification of this product activity remains unresolved.
The operator explicitly wants worldwide sales. No registrations, tax calculation,
Stripe business identity, or country restrictions were changed in this update.

## Result

Payments work technically. There are unresolved launch issues, particularly
international VAT, business/activity classification, sensitive reflection data and
retention schedules. The technical purchase-record and confirmation gaps below
have been addressed, but the business/legal inputs remain unresolved. Expected low sales and a planned LLC do not settle
these issues. No VAT liability is inferred merely from the absence of Stripe Tax.
Conversely, a tax-inclusive Stripe price does not establish correct taxation.

## Direct fixes in this review

- Private API responses, including errors and withdrawal receipts, now prohibit
  caching and indexing and suppress the referrer. Private reflection/result pages
  also receive an explicit HTTP no-index header.
- Checkout explicitly uses the payment button type. The refund notice gives
  priority to statutory withdrawal/defect remedies and explains that there is no
  additional voluntary money-back guarantee.
- Removed the blanket “all purchases are final” headline from legal pages.
- Terms describe the actual paid product, optional questions, review, goal,
  four-week plan, PDF and email delivery.
- Updated the agreement version and displayed date together. Existing purchases
  retain their stored agreement snapshots; this does not rewrite past contracts.
- Added information about purposes/legal bases, necessary browser storage,
  actual data supplied to Stripe/Resend, provider retention, international
  processing, existing retention behavior and additional data-subject rights.
  These additions do not resolve the outstanding GDPR items below.

## Follow-up implemented on 23 October 2026

- Migration `0011_commerce_legal_records.sql` separates the original contract,
  consent, amount, recipient and Stripe payment references from reflection data.
  Existing paid purchases are backfilled without changing their agreement or
  sending historical buyers a new email. Reflection deletion still removes
  answers, reports and AI jobs; it leaves only the separate purchase ledger.
- New purchases receive a separate contract-confirmation email containing their
  original terms and consent snapshot before any paid AI job can start. A leased
  database queue retries delivery, with stable provider idempotency keys. A
  provider accepting the message is not proof that it reached the inbox, and this
  technical sequencing does not establish the contract's legal classification or
  lawful expiry of the withdrawal right.
- Withdrawal declarations are persisted before sending and queued atomically.
  Failed receipts are retried by the report worker without the customer submitting
  the declaration again. Support still decides/processes refunds and resolves
  cases; the app does not silently treat receipt of a withdrawal as a refund.
- Signed refund and dispute events are normalised to minimal payment records.
  A full refund removes paid access and cancels outstanding AI jobs; a partial
  refund or dispute alone does not remove access. Event replay and out-of-order
  delivery cannot restore a fully refunded purchase. Short-lived unmatched
  payment references are pruned after seven days.
- Deletion is available at the free checkpoint too. German/English deletion,
  terms, refund and privacy text now explain the actual separate records,
  confirmation sequence and refund behavior.
- A linked German/English provider notice (`/de/imprint`, `/en/imprint`) now
  identifies the actual sole proprietor with the supplied address, telephone and
  email. The same identity is used in terms, withdrawal information, the online
  withdrawal page, privacy/controller information and withdrawal receipts.
- New agreement version `.3` freezes those provider details and a voluntary
  withdrawal form template into the terms/refund snapshot delivered by email.
  Earlier stored agreements are unchanged. The template offers buyer address,
  order/receipt date and paper-only signature fields; those fields are not newly
  mandatory in the account-free online declaration. The text does not claim a
  worldwide VAT exemption or a confirmed professional/business registration.
- The reconciliation command reports aggregate delivery/payment issues without
  answers, email addresses, private session links or raw Stripe payloads.
  See [commerce operations](commerce-operations.md) for monitoring and recovery.

These changes do not supply missing merchant information, choose retention
periods, establish tax registrations or replace legal review. The independent
confirmation stage applies from version `.2` onwards; older purchases retain
exactly their stored terms and continue under the existing flow.

## Outstanding work

| Priority | Issue and evidence | Required resolution |
| --- | --- | --- |
| Supplied details implemented | The operator-provided name, sole-proprietor status, service address, telephone and email are now published in the provider notice, privacy information and new contract documents. No VAT ID was supplied, and none is invented. | Confirm the address remains serviceable and report any future registration/identity changes. Account-level Stripe seller details, any register entry, additional regulated-activity duties and other case-specific disclosures still need verification where applicable. |
| Before worldwide selling | The operator declares German §19 status, no OSS/cross-border SME registration, and requests global sales. Production remains `STRIPE_AUTOMATIC_TAX=false`; no country allowlist is enforced. | Establish country-specific VAT/GST/sales-tax treatment and applicable registrations, product classification, evidence and filing requirements. A worldwide merchant-of-record arrangement is an alternative commercial path to investigate; it is not part of current Stripe Checkout. German §19 status is not a worldwide tax exemption. |
| Before selling | The activity's classification is unresolved. The operator's existing freelance status and planned trade deregistration do not classify automated report sales. | Confirm with tax/business-registration advice whether this activity is covered by existing registration and whether the deregistration has taken effect. Coordinate the eventual LLC change separately, including existing contracts and data-controller identity. |
| Before selling | Free-text answers can reveal health, religion, sexual life or other Article 9 information. The local safety classifier also examines answers. The current contract/analytics consent is not an explicit sensitive-data processing mechanism. | Decide and document a lawful Article 9 approach where applicable, beginning before collection. Consider data minimisation, a separate recorded consent/withdrawal flow, restricted processing and a DPIA assessment. A warning to avoid sensitive details is only a minimisation measure, not a complete fix. |
| Before selling | Public policies are not evidence of account-specific data-processing terms, international-transfer safeguards, hosting location or retention settings. | Verify and retain the applicable OpenAI, Resend, hosting and payment terms/DPAs and roles; document locations, subprocessors, safeguards and retention. Complete the controller address and the GDPR information accordingly. `store:false` alone is not zero retention. |
| Before selling | Minimal purchase/contract/consent/payment evidence is now stored independently of reflection deletion and existing paid purchases are backfilled. The ledger has no answers, report, private result URL or reflection ID. No approved retention schedule is established. | Determine justified legal/accounting retention periods for purchase, withdrawal, refund/dispute and delivery records. Document backup, restore and deletion procedures. The implementation deliberately does not invent a multi-year period or retroactively destroy records. |
| Before relying on early expiry of withdrawal | A separate durable confirmation with the original snapshot is now sent before new paid AI jobs start; failures are queued/retried. Provider acceptance alone is not proof of receipt. The legal classification remains unresolved. | Confirm whether the package is digital content, a digital service or a mixed contract; review the consent language, sequencing and early-performance consequences accordingly. Never treat payment, checkbox or send acknowledgement alone as conclusive expiry. |
| Before relying on complete consumer information | The provider address and a voluntary withdrawal form template are now on the site and in new refund-policy snapshots. Terms set acceptance at confirmed Stripe payment. The product combines automated questions, browser use and report/PDF delivery. | Have the digital-content/service classification and the complete withdrawal instructions/template reviewed together. Set a realistic delivery commitment and access/download duration. The template and provider address alone do not settle all pre-contract information or withdrawal-expiry requirements. |
| Operational | Withdrawal declarations and receipt jobs are now persisted atomically; the worker retries failed receipts. After eight attempts or 23 hours from the first attempt, automatic retries stop for reconciliation. There is no case/closure state or automatic refund. | Monitor the support inbox and failed/pending receipts; process valid claims in time. Check the provider before any manual resend beyond its idempotency window. Define support case ownership, closure and whether a pending withdrawal should stop fulfillment. |
| Operational | Refund/dispute event handling is implemented with signature validation, idempotency, out-of-order matching and durable minimal records. Full refunds revoke access; partial refunds/disputes alone retain it. | Keep the live Stripe endpoint subscribed to the seven events in the operations guide; review dispute/refund cases in Stripe and support. There is no automatic reimbursement or dispute response, and a lost dispute is not silently treated as a merchant refund. |
| Data minimisation | Reflections have no automatic time-based expiry. Umami statistics remain until administrative deletion. A private result link grants access without a separate login, and report/PDF content is sent through email. | Set justified retention schedules for abandoned sessions, paid content, Umami, logs and backups. Assess link access, email copies and email-provider tracking. Keep sensitive content out of support/analytics. |
| Before wider marketing | No explicit adult-only/minor handling policy or verified microenterprise/accessibility assessment is recorded. | Establish the intended age group and contract-capacity handling. Assess BFSG scope/exemption, accessibility of form/payment/PDF and any required information. Check applicable dispute-resolution notices. Do not add an obsolete EU ODR link. |
| Before wider marketing | AI is disclosed, but a complete AI Act role/transparency assessment and operator literacy measures are not documented. Later Meta Ads measurement would introduce another purpose and recipient. | Review the applicable provider/deployer obligations, including content marking and transparency, and document operator competence and safety handling. Assess any later Meta integration separately; existing Umami consent is not blanket permission for advertising tracking. |

## Activity description and global sales

Working activity description for review with the registration office/tax adviser:
“Betrieb einer Online-Plattform zur automatisierten Erstellung und Bereitstellung
personalisierter Reflexionsberichte und digitaler Premium-Inhalte.”

The product is sold as a standardised, automated online offering. The working
assessment is commercial operation/sale of digital products rather than a
personally performed freelance consultation. This is an inference from the
implementation, not an administrative ruling. Unlocking “premium content” does
not itself determine a tax exemption, free-profession status or reduced VAT rate.
Do not represent this activity as covered by the previous freelance registration
or a pending trade deregistration without confirmation.

Worldwide sales remain a business goal, not a compliance finding. Germany's §19
exemption does not override foreign rules. For example, HMRC states that foreign
suppliers of taxable digital services to UK consumers must register; no German
small-business safe harbour follows. Current standard Stripe Checkout is not a
merchant of record. No country exclusion, tax registration or blanket zero-rate
setting was silently applied.

## Tax treatment: decision framework

The report appears to be an electronically supplied B2C service: automated,
internet-delivered and requiring little human intervention. This is an inference
from the implementation, not a binding tax classification. A PDF attachment alone
does not determine the tax category or make the product a reduced-rate e-book.

- **Germany:** If the operator is established in Germany and actually qualifies
  under §19 UStG, eligible domestic turnover may be VAT exempt. “Freelancer” does
  not by itself establish that exemption. Do not show an invented VAT amount or
  VAT ID. Current §19 thresholds are €25,000 prior-year and €100,000 current-year
  turnover, with additional details to assess, including commencement of trade.
- **Other EU consumers:** Customer-country treatment is generally relevant to
  electronic services. The €10,000 exception has conditions, combines relevant
  cross-border sales and is not a worldwide allowance. It is distinct from the
  German small-business thresholds. OSS can simplify declaration/payment of tax
  owed across the EU. The cross-border SME exemption introduced in 2025 requires
  its own eligibility and administrative procedure; German §19 treatment does
  not automatically apply abroad.
- **UK, Switzerland and other countries:** Review local digital-services VAT/GST
  obligations and thresholds, including cases requiring registration from the
  first taxable sale by a foreign supplier. In the US, nexus and whether this
  kind of product is taxable vary by state. No universal “19% everywhere” rule
  or all-countries safe harbour follows from low expected sales.
- **Price:** A fixed gross €19 price can remain €19 when inclusive taxes are
  correctly applied; the tax portion changes. At an applicable 19% rate the net
  is about €15.97 and tax €3.03; at 20% it is about €15.83 and €3.17. These are
  arithmetic examples, not a finding that either rate applies to this business.
  An exemption is not the same thing as a taxable transaction at a 0% rate.
- **Stripe:** Standard Checkout is a payment processor, not the merchant of
  record for this integration. Automatic Tax calculates based on configured
  registrations, product treatment and customer location; it does not by itself
  establish registrations or complete all filings/remittances. The current
  Checkout does not request business VAT IDs and should not be presented as a
  complete B2B/reverse-charge workflow. Confirm invoice/receipt and bookkeeping
  requirements before enabling additional invoice products or permissions.

## What is already in place

- Deterministic free reflection; no AI provider call before verified payment.
- Required, unticked hosted-Checkout digital-delivery consent; acceptance is
  independently retrieved from Stripe, not trusted from the browser.
- Original contract/consent text is stored independently of reflection content
  and included in a separate confirmation for new purchases and the report email. Statutory defect/non-delivery remedies are expressly reserved.
- A visible two-step “Vertrag widerrufen” flow works without an account or reason.
  Receipt timestamp is persisted before email and stays stable on retry.
- Signed Stripe webhooks and idempotent fulfillment. A live expired QA Checkout
  was delivered successfully with HTTP 200 without a payment being made.
- Umami consent gates optional telemetry; allow/decline have equivalent controls.
  No answers, private links or emails are sent to Umami. No Meta integration.
- Clear AI/self-reflection disclosure and no diagnosis/therapy/outcome guarantee.

## Sources checked

- [Activity classification: §18 EStG](https://www.gesetze-im-internet.de/estg/__18.html)
- [Federal start-up portal: software self-distribution (orientation; archived guidance)](https://www.existenzgruendungsportal.de/Redaktion/DE/BMWK-Infopool/Antworten/Gruendungsplanung/Freie-Berufe/gemischte-Taetig/Software-entwickeln-und-vertreiben-freiberufliche-Taetigkeiten)
- [Provider information: §5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html)
- [Pre-contract information: Art. 246a §1 EGBGB](https://www.gesetze-im-internet.de/bgbeg/art_246a__1.html)
- [Payment button: §312j BGB](https://www.gesetze-im-internet.de/bgb/__312j.html)
- [Durable contract confirmation: §312f BGB](https://www.gesetze-im-internet.de/bgb/__312f.html)
- [Withdrawal: §356 BGB, current digital-content rule in subsection 6](https://www.gesetze-im-internet.de/bgb/__356.html)
- [Electronic withdrawal function: §356a BGB](https://www.gesetze-im-internet.de/bgb/__356a.html)
- [Statutory model withdrawal form](https://www.gesetze-im-internet.de/bgbeg/art_253anlage_2.html)
- [Place of supply: §3a UStG](https://www.gesetze-im-internet.de/ustg_1980/__3a.html)
- [German small-business exemption: §19 UStG](https://www.gesetze-im-internet.de/ustg_1980/__19.html)
- [European Commission: cross-border SME scheme](https://sme-vat-rules.ec.europa.eu/sme-scheme/cross-border-sme-scheme_en)
- [EU One Stop Shop](https://vat-one-stop-shop.ec.europa.eu/one-stop-shop_en)
- [Stripe event types](https://docs.stripe.com/api/events/types)
- [Resend idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys)
- [Stripe automatic tax in Checkout](https://docs.stripe.com/tax/checkout/page)
- [Stripe tax compliance steps](https://docs.stripe.com/tax/how-tax-works)
- [DSGVO information requirements: Saxon supervisory authority](https://www.datenschutz.sachsen.de/informationspflichten.html)
- [Sensitive data: European Commission](https://commission.europa.eu/law/law-topic/data-protection/information-business-and-organisations/legal-grounds-processing-data_en)
- [Device storage: §25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html)
- [OpenAI API data controls](https://developers.openai.com/api/docs/guides/your-data)
- [Resend DPA and transfer terms](https://resend.com/legal/dpa)
- [BFSG §3](https://www.gesetze-im-internet.de/bfsg/__3.html)
- [Federal accessibility office: scope and microenterprise definition](https://www.bundesfachstelle-barrierefreiheit.de/DE/Barrierefreiheitsstaerkungsgesetz/FAQ/faq)
- [Dispute-resolution information: §36 VSBG](https://www.gesetze-im-internet.de/vsbg/__36.html)
- [HMRC: digital services supplied to consumers](https://www.gov.uk/guidance/the-vat-rules-if-you-supply-digital-services-to-private-consumers)
- [HMRC: VAT registration for non-established suppliers](https://www.gov.uk/government/publications/vat-notice-7001-should-i-be-registered-for-vat/vat-notice-7001-should-i-be-registered-for-vat)
- [Swiss FTA: foreign-company VAT liability](https://www.estv.admin.ch/en/vat-liability-foreign-companies)
- [European Commission: AI transparency obligations](https://digital-strategy.ec.europa.eu/en/faqs/transparency-obligations-under-article-50-ai-act)
- [European Commission: AI literacy](https://digital-strategy.ec.europa.eu/en/policies/ai-talent-skills-and-literacy)
