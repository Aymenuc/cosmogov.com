# Supabase and Vercel deployment

The Vercel build runs `prisma migrate deploy` before building Next.js. A `P1001` error at this step means the database connection must be repaired before the application can deploy.

1. Open the intended Supabase project and confirm it is active. Restore a paused project. If its project reference changed, replace the old reference in both Vercel connection strings.
2. In Supabase, open **Connect**. Copy the exact connection strings shown there; do not construct the pooler hostname or region from memory.
3. In the Vercel project serving cosmogov.com, update **Production** environment variables:
   - `DATABASE_URL`: transaction pooler URI (port 6543), with `pgbouncer=true` for Prisma runtime use.
   - `DIRECT_URL`: session pooler URI (port 5432) for migration access over IPv4. A reachable direct endpoint is also supported. Direct `db.<reference>.supabase.co` hosts normally use IPv6 unless the project has the IPv4 add-on.
4. Replace the password placeholder with the actual database password and percent-encode reserved characters in it. Store credentials only in Vercel's environment settings.
5. Confirm the existing `SESSION_SECRET`, AI configuration and `CRON_SECRET` are configured as described in `MISSION_STUDIO.md`, then redeploy `main` with the updated environment.

The session pooler is distinct from the direct endpoint: both can use port 5432, but their hostnames and usernames differ. The transaction pooler is intended for runtime connections; use the session or direct connection for migrations.

On 14 November 2026, the deployment of `30b8c93` failed before Next.js compilation with `P1001`. Public DNS checks returned NXDOMAIN for both A and AAAA queries for the configured database hostname, and for its project API hostname. Dashboard access is required to establish whether the project is paused, removed or incorrectly referenced. Changing application code cannot restore that endpoint.

After connectivity is restored, retain the migration step. If Prisma reports another error, inspect that error before modifying migration history or the database. Build success and a domain check are required before calling the release live.

Official connection guidance: https://supabase.com/docs/guides/database/connecting-to-postgres
