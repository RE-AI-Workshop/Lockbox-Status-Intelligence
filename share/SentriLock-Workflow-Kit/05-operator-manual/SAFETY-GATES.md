# Safety gates

Keep these in prompts and in human process.

**Need an explicit human yes:**

- git commit, push, merge, branch create/delete
- Pipeline YAML edits or triggering production deploys
- Database migrations
- Production / customer-data writes
- Bulk calls that can hit a rate limit
- Confluence publish (release notes)
- Jira attach (handoff asks)

**Never:**

- Put tokens in `active-brief.md`, `HANDOFF.md`, or chat summaries
- Use a validation-bypass user to make tests green
- Let the reviewer patch product code
- Let the suite executor “just fix the service”
- Upload failing TestRail runs to pretty-up a dashboard

**Fixture vs caller:** privileged user sets the table; ACs about identity use the real shape.
