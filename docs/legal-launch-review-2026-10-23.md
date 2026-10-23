# Legal launch review — 23 October 2026

Scope: published German/English legal pages, source code, Stripe Checkout and
current live configuration. This records technical evidence and issues for legal
and tax review; it is not a certification of compliance in every jurisdiction.

The operator describes a current freelance/small business and an application to
deregister a trade, with a possible LLC later. This does **not** establish the
current legal business address, VAT exemption, effective deregistration date or
eligible sales countries. No tax registrations or business details were changed.

## Result

Payments work technically. There are unresolved launch issues, particularly
provider identification, international VAT, sensitive reflection data and
contract-record retention. Expected low sales and a planned LLC do not settle
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

## Outstanding work

| Priority | Issue and evidence | Required resolution |
| --- | --- | --- |
| Before selling | No complete provider notice. `merchant` contains only name/email; there is no Impressum route. The address is also absent from terms, contract confirmation and withdrawal information. | Confirm the actual operator, serviceable business address, business contact telephone, and any applicable VAT/business ID or register details. Publish a linked Impressum and use the same identity throughout the purchase documents. Never invent an address or present a future LLC as the seller. |
| Before selling | International tax handling is not established. Production has `STRIPE_AUTOMATIC_TAX=false`; the verified unpaid live Checkout had no automatic calculation. A country allowlist is not enforced. | Establish business location and actual §19 status, target markets and registration obligations. Configure the relevant tax registrations/product classification and then enable/test calculation, or limit sales to the markets whose treatment is established. Do not toggle Stripe Tax merely to make the warning disappear. |
| Before selling | The activity's classification is unresolved. The operator's existing freelance status and planned trade deregistration do not classify automated report sales. | Confirm with tax/business-registration advice whether this activity is covered by existing registration and whether the deregistration has taken effect. Coordinate the eventual LLC change separately, including existing contracts and data-controller identity. |
| Before selling | Free-text answers can reveal health, religion, sexual life or other Article 9 information. The local safety classifier also examines answers. The current contract/analytics consent is not an explicit sensitive-data processing mechanism. | Decide and document a lawful Article 9 approach where applicable, beginning before collection. Consider data minimisation, a separate recorded consent/withdrawal flow, restricted processing and a DPIA assessment. A warning to avoid sensitive details is only a minimisation measure, not a complete fix. |
| Before selling | Public policies are not evidence of account-specific data-processing terms, international-transfer safeguards, hosting location or retention settings. | Verify and retain the applicable OpenAI, Resend, hosting and payment terms/DPAs and roles; document locations, subprocessors, safeguards and retention. Complete the controller address and the GDPR information accordingly. `store:false` alone is not zero retention. |
| Before selling | `report_purchases` references `assessment_sessions` with `ON DELETE CASCADE`. Deleting a reflection removes the local contract snapshot, consent evidence, payment mapping and delivery evidence too. Stripe does not hold the full stored terms snapshot. | Separate a minimal legal/financial ledger from reflection content. Determine retention periods for each category with accounting/legal advice. Keep answers and reports out of that ledger and preserve their deletion behavior. Review backups and restore/deletion procedures too. |
| Before relying on early expiry of withdrawal | The contract confirmation is appended to the final report email. There is no independent confirmation immediately after payment. Paid AI questions/browser access can start earlier; failed generation or email delays can leave the customer without a durable confirmation. | Confirm whether the offered package is digital content, a digital service or a mixed contract. Add a reliable independent contract-confirmation delivery stage, using the original terms/consent snapshot; have the timing and early-performance statement reviewed against that classification. Never treat payment/checkbox alone as expiry. |
| Before selling | The withdrawal page includes a general explanation/example statement, not a complete statutory model form with the merchant address. Contract acceptance is described as payment confirmation **and** report availability; the delivery commitment/access duration is not precisely defined. | Complete the withdrawal instructions/model form once the address is known. Set a clear contract-acceptance moment, delivery commitment and access/download terms; reflect these consistently in Checkout and confirmation. |
| Operational | Withdrawal requests are persisted and emailed to the customer with support BCC. Failed receipts need reconciliation/manual retry; the report worker does not retry withdrawal receipts. There is no support case/closure state or refund automation. | Monitor the support inbox and pending withdrawal confirmations, process valid claims in time and add a reliable retry/alert workflow. An incoming withdrawal must not be lost just because email failed. Whether to stop pending fulfillment needs a defined support rule. |
| Operational | Stripe webhooks cover Checkout completion, delayed payment success/failure and expiration. Refund/dispute events are not synchronised to access/fulfillment even though a `refunded` status exists. | Define refund, partial-refund, dispute and access policies; synchronise appropriate events without denying mandatory consumer remedies. Accounting refund records must remain independent of reflection deletion. |
| Data minimisation | Reflections have no automatic time-based expiry. Umami statistics remain until administrative deletion. A private result link grants access without a separate login, and report/PDF content is sent through email. | Set justified retention schedules for abandoned sessions, paid content, Umami, logs and backups. Assess link access, email copies and email-provider tracking. Keep sensitive content out of support/analytics. |
| Before wider marketing | No explicit adult-only/minor handling policy or verified microenterprise/accessibility assessment is recorded. | Establish the intended age group and contract-capacity handling. Assess BFSG scope/exemption, accessibility of form/payment/PDF and any required information. Check applicable dispute-resolution notices. Do not add an obsolete EU ODR link. |
| Before wider marketing | AI is disclosed, but a complete AI Act role/transparency assessment and operator literacy measures are not documented. Later Meta Ads measurement would introduce another purpose and recipient. | Review the applicable provider/deployer obligations, including content marking and transparency, and document operator competence and safety handling. Assess any later Meta integration separately; existing Umami consent is not blanket permission for advertising tracking. |

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
- Original contract/consent text is stored with the purchase and included in the
  report email. Statutory defect/non-delivery remedies are expressly reserved.
- A visible two-step “Vertrag widerrufen” flow works without an account or reason.
  Receipt timestamp is persisted before email and stays stable on retry.
- Signed Stripe webhooks and idempotent fulfillment. A live expired QA Checkout
  was delivered successfully with HTTP 200 without a payment being made.
- Umami consent gates optional telemetry; allow/decline have equivalent controls.
  No answers, private links or emails are sent to Umami. No Meta integration.
- Clear AI/self-reflection disclosure and no diagnosis/therapy/outcome guarantee.

## Sources checked

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
