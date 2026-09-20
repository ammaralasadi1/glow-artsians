# Inquiry measurement

The shared navigation script pushes `inquiry_intent` into the existing GTM data layer for consultation links, phone links, and email links. It does not transmit form values, link text, query strings, email addresses, or phone numbers.

Available data-layer variables:

- `inquiry_action`: `consultation_click`, `phone_click`, or `email_click`
- `inquiry_service`: `landscape`, `holiday`, or `unspecified`
- `inquiry_placement`: `header`, `footer`, or `content`

In GTM, configure a Custom Event trigger for `inquiry_intent` and forward the three variables as GA4 event parameters, subject to the site's consent configuration. Preview before publishing and check existing tags to prevent duplicate click events. These are intent signals, not primary lead conversions.

A confirmed lead requires a verified successful GHL submission. Neither an iframe load, a contact click, nor an arbitrary visit to `/thank-you` proves submission. Configure and test the actual GHL success integration before sending `generate_lead`. The website does not infer success from cross-origin messages.

The code changes do not publish the GTM container, modify GHL forms, configure advertising conversions, or establish a consent policy. Inspect the live container separately for duplicate tags, consent behavior, and unwanted personal data in automatically collected page URLs.

Search discovery is generated at build time from production canonical URLs. The thank-you page is noindex and excluded from the sitemap. Submit `/sitemap.xml` through Search Console after deployment. No artificial modification dates or ranking guarantees are used.
