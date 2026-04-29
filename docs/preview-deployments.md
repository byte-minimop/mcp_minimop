# MCP Office Preview Deployments

Recommended provider: Vercel.

This is for safe product previews only. Do not connect this preview project to Azure production resources or real customer accounts.

## Vercel setup

1. Import GitHub repo `byte-minimop/mcp_minimop` into Vercel.
2. Framework preset: Next.js.
3. Use the repository root as the Vercel project root.
4. Vercel should read `vercel.json` automatically:
   - install: `npm ci`
   - build: `cd apps/mcp-office && npm run build`
   - output: `apps/mcp-office/.next`

Alternative setup: set Vercel's project root to `apps/mcp-office`. If using that path, make sure Vercel still has access to the repository root because `apps/mcp-office/package.json` uses local `file:` dependencies to `../../adapters`, `../..`, and `../../domain-google-ads`.

## Preview environment variables

Minimal safe defaults:

| Variable | Suggested preview value | Notes |
| --- | --- | --- |
| `MCP_DATA_DIR` | unset | Preview can run without persistent production learning storage unless testing storage readiness. |
| `MCP_SHARED_SECRET` | unset for UI-only preview | Add only when testing protected runtime endpoints. |
| `BEACON_SQLITE_PATH` | unset | Avoid coupling generic previews to Beacon runtime data. |
| `GOOGLE_DEVELOPER_KNOWLEDGE_API_KEY` | unset | Add only for vendor docs lookup tests. |

Avoid adding these in generic previews:

- production shared secrets
- Beacon production SQLite paths
- real vendor API keys
- Azure production resource secrets

## Expected behavior

- Every pull request gets a Vercel preview URL.
- The MCP Office UI can be reviewed visually.
- Runtime endpoints that require secrets may be unavailable or intentionally fail closed.
- Azure App Service deployment remains separate.

## Known follow-up

If previews need realistic runtime state, create a separate non-production dataset and preview-only secrets. Do not point previews at production Beacon/MCP storage.
