# PR 5 Review Pack — MCP Office Azure Deployment Docs

Status: prepared in local ZIP snapshot only. Not a git branch, not pushed.

## PR intent

Document MCP Office Azure deployment requirements without changing runtime behavior.

This PR should be documentation-only and secret-free.

## In scope

- Azure App Service runtime app settings.
- GitHub Actions secret names used by the MCP deployment workflow.
- Persistent storage requirements for MCP learning SQLite data.
- Health-check expectations for `/api/mcp/health`.
- Shared-secret coordination notes for Beacon → MCP runtime calls.
- Rollback procedure using immutable image SHA tags.
- Deployment ordering rules with Beacon.
- `apps/mcp-office/.env.local.example` placeholders for documented settings.

## Out of scope

- Runtime code changes.
- MCP auth implementation changes.
- GitHub Actions workflow changes.
- Package/dependency changes.
- Real secret values.
- Azure resource creation.

## Files to copy into the real MCP repo

- `docs/azure-deployment-checklist.md`
- `apps/mcp-office/.env.local.example`
- `docs/pr-5-azure-deployment-docs-review.md` *(optional but useful for PR review context)*

## Review checklist

- [ ] Confirm no real secrets are present.
- [ ] Confirm app setting names match actual Azure/App Service naming conventions.
- [ ] Confirm `MCP_DATA_DIR` target path matches the intended Azure Files mount path.
- [ ] Confirm `MCP_SHARED_SECRET` is documented as required for production protected endpoints.
- [ ] Confirm Beacon `MCP_API_SECRET` coordination is documented without storing the value.
- [ ] Confirm optional `BEACON_SQLITE_PATH` is read-only if used.
- [ ] Confirm rollback instructions use immutable SHA tags, not `latest`.
- [ ] Confirm health-check expectations match the intended readiness behavior.

## Minimal validation for the real PR

```bash
# Documentation-only sanity checks
LC_ALL=C grep -RInE "(sk-|ghp_|AZURE_[A-Z_]*=.+|SECRET=.+|TOKEN=.+|PASSWORD=.+)" \
  docs/azure-deployment-checklist.md apps/mcp-office/.env.local.example docs/pr-5-azure-deployment-docs-review.md

# Optional: verify markdown/env example files exist and are readable
test -f docs/azure-deployment-checklist.md
test -f apps/mcp-office/.env.local.example
```

The grep command is intentionally conservative; placeholder names may appear, but real secret-looking values should not.

## Rollback

Revert this documentation PR. No runtime or deployment behavior changes should be included in this PR.
