# MCP Office Azure Deployment Checklist

This checklist is intentionally secret-free. It names required settings and operational checks, but never stores values.

## GitHub Actions secrets

Required by `.github/workflows/deploy-mcp.yml`:

| Secret | Purpose |
| --- | --- |
| `ACR_LOGIN_SERVER` | Azure Container Registry login server. |
| `ACR_USERNAME` | ACR push username, unless the workflow is later migrated to OIDC/managed identity for ACR. |
| `ACR_PASSWORD` | ACR push password. |
| `AZURE_CLIENT_ID` | Azure AD application/client ID configured with GitHub federated credentials. |
| `AZURE_TENANT_ID` | Azure tenant ID. |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID. |
| `AZURE_WEBAPP_NAME_MCP` | MCP Azure App Service name. Used for deploy and default health URL. |

Optional follow-up if default `azurewebsites.net` is blocked or not the intended endpoint: add an explicit health URL secret and update the workflow to use it.

## Azure App Service app settings

Required for production runtime:

| Setting | Purpose |
| --- | --- |
| `NODE_ENV=production` | Enables production runtime behavior. |
| `WEBSITES_PORT=3000` | Tells Linux App Service which port the custom container listens on. The Dockerfile exposes/runs Next on port `3000`. |
| `PORT=3000` | Keeps the Next standalone server aligned with the container/App Service port. |
| `MCP_DATA_DIR` | Persistent Azure Files mount path for `learning.sqlite`. Production health fails when unset. |
| `MCP_SHARED_SECRET` | Shared service secret required by all non-health MCP runtime endpoints. Beacon must send the same value via `MCP_API_SECRET`. |

Conditionally required:

| Setting | Required when | Purpose |
| --- | --- | --- |
| `BEACON_SQLITE_PATH` | MCP Office needs read-only Beacon activity/execution trace visibility. | Path to Beacon's SQLite database, preferably through a read-only mounted path. |
| `GOOGLE_DEVELOPER_KNOWLEDGE_API_KEY` | Vendor documentation lookup is enabled. | Google Developer Docs API access. |
| `AZURE_OPENAI_DEPLOYMENT` | MCP execution trace display/model metadata is used. | Display metadata only; MCP runtime APIs should not depend on external AI calls. |

## Persistent storage requirements

- Mount Azure Files at the path configured by `MCP_DATA_DIR`.
- Do not rely on container-local paths for MCP learning storage.
- Keep App Service single-instance while MCP uses SQLite/local file persistence.
- Set App Service scale-out / instance count to 1 until persistence moves to a managed database.
- MCP sets SQLite `busy_timeout` to 5000 ms for the learning store to reduce transient lock failures within the single instance.
- Back up the Azure Files share before risky migrations or deployment changes.

## Health and smoke checks

After deploy, the workflow checks:

```text
GET /api/mcp/health
```

Expected healthy response:

- HTTP `200`
- `status: "ok"`
- `checks.storage.ok: true`
- `checks.storage.data_dir_configured: true`

Expected failure modes:

- HTTP `503`, `status: "degraded"`, `error: "storage_data_dir_unconfigured"` when `MCP_DATA_DIR` is missing in production.
- HTTP `503`, `status: "degraded"`, `error: "storage_unavailable"` when the configured storage path is not writable/readable.

## Rollback

Images are pushed with both immutable and mutable tags:

- Immutable: `${ACR_LOGIN_SERVER}/marketing-ai/mcp-office:${GITHUB_SHA}`
- Mutable: `${ACR_LOGIN_SERVER}/marketing-ai/mcp-office:latest`

Rollback should use the previous known-good SHA tag, not `latest`.

Suggested manual rollback procedure:

1. Identify the previous successful workflow run and image SHA.
2. Configure the MCP App Service container image back to that SHA tag.
3. Restart the App Service if Azure does not restart it automatically.
4. Verify `/api/mcp/health` returns `200`.
5. Confirm Beacon still points to the intended MCP URL through `MCP_API_URL`.

## Deployment order with Beacon

- Deploy MCP first when MCP contract or runtime response shape changes.
- Deploy Beacon after MCP when Beacon consumes the new MCP shape.
- Keep `apps/mcp-office/lib/mcp/contract.ts` and Beacon's mirror contract in sync.
- If a Beacon change only consumes existing MCP behavior, Beacon can deploy independently.
- If an MCP change is breaking, support both old and new response shapes temporarily or coordinate a maintenance deployment window.

## Current security follow-up

The health endpoint is intentionally public for platform probes. Non-health MCP runtime endpoints are protected by `MCP_SHARED_SECRET` and expect Beacon to send the same value through the `x-mcp-shared-secret` header. Rotate the shared secret by updating both MCP `MCP_SHARED_SECRET` and Beacon `MCP_API_SECRET` together.

MCP Office pages under `/mcp/*` can expose Beacon run metadata and execution traces. For Azure production, protect the UI with one of these controls before exposing the App Service publicly:

1. Azure App Service Authentication / EasyAuth requiring the approved Concentrix owner/admin group.
2. Private networking / internal ingress only.
3. An app-level owner/admin auth middleware wired to the same corporate identity provider.

Do not rely on `MCP_SHARED_SECRET` for browser UI auth; it is a service-to-service runtime API secret for Beacon, not a user session mechanism.
