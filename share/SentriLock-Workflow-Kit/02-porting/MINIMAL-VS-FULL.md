# Minimal and full adoption

Start with Intake → Implementation → Unit Tests → Review → Handoff. In `PROJECT.md`, set API suite, post-deploy QA, and release publishing to `disabled`.

Enable a stage only after its command, environment, fixture policy, and owner are configured. The generic prompts document skipped stages; changing extension routing is optional. If you remove a stage from routing, update both extension and CLI router and run the extension tests.
