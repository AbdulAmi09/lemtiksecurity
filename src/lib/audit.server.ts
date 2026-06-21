import { z } from "zod";
import { getRequest } from "@tanstack/react-start/server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Json } from "@/integrations/supabase/types";
import { throwSafeError } from "@/lib/server-errors";

const uuidSchema = z.string().uuid();

const auditEventSchema = z.union([
  z.object({
    entity: z.literal("patrol"),
    action: z.literal("create"),
    details: z.object({ code: z.string().min(1).max(20), name: z.string().min(1).max(120) }).strict(),
  }),
  z.object({
    entity: z.literal("patrol"),
    action: z.literal("check_in"),
    details: z.object({
      code: z.string().min(1).max(20),
      checked_in: z.number().int().min(0).max(50),
      total: z.number().int().min(1).max(50),
    }).strict(),
  }),
  z.object({
    entity: z.literal("patrol"),
    action: z.literal("status_change"),
    details: z.object({ status: z.enum(["on_route", "delayed", "missed", "complete"]) }).strict(),
  }),
  z.object({
    entity: z.literal("user_role"),
    action: z.literal("assign_role"),
    details: z.object({ role: z.enum(["officer", "supervisor", "manager", "client_admin", "lemtik_admin"]) }).strict(),
  }),
  z.object({
    entity: z.literal("organisation"),
    action: z.enum(["create", "update", "member_add", "member_remove", "member_role_change"]),
    details: z.record(z.string(), z.any()),
  }),
]);

type AuditEventInput = z.input<typeof auditEventSchema> & {
  actorId: string;
  organisationId?: string | null;
  entityId?: string | null;
};

type BlackboxAuditInput = {
  orgId?: string | null;
  userId: string;
  userRole?: string | null;
  userEmail?: string | null;
  actionType: string;
  resourceType: string;
  resourceId?: string | null;
  actionDetail?: Json | null;
  oldValue?: Json | null;
  newValue?: Json | null;
  success?: boolean;
  errorMessage?: string | null;
  sessionId?: string | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

function collectRequestMeta() {
  const request = getRequest();
  const headers = request?.headers;
  if (!headers) return {};
  return {
    ipAddress:
      headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      ?? headers.get("x-real-ip")
      ?? headers.get("cf-connecting-ip")
      ?? null,
    userAgent: headers.get("user-agent") ?? null,
    requestId: headers.get("x-request-id") ?? headers.get("x-correlation-id") ?? null,
    sessionId: headers.get("x-session-id") ?? null,
  };
}

export async function recordBlackboxAudit(input: BlackboxAuditInput) {
  const userId = uuidSchema.parse(input.userId);
  const orgId = input.orgId == null ? null : uuidSchema.parse(input.orgId);
  const requestMeta = collectRequestMeta();
  const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId).catch(() => ({ data: null }));
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();

  const payload = {
    // Legacy columns
    actor_id: userId,
    actor_name: profile?.display_name ?? null,
    organisation_id: orgId,
    entity: input.resourceType,
    entity_id: input.resourceId ?? null,
    action: input.actionType,
    details: input.actionDetail ?? null,
    // Black-box columns
    timestamp: new Date().toISOString(),
    org_id: orgId,
    user_id: userId,
    user_role: input.userRole ?? null,
    user_email: input.userEmail ?? authUser?.user?.email ?? null,
    action_type: input.actionType,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    action_detail: input.actionDetail ?? null,
    old_value: input.oldValue ?? null,
    new_value: input.newValue ?? null,
    ip_address: input.ipAddress ?? requestMeta.ipAddress ?? null,
    user_agent: input.userAgent ?? requestMeta.userAgent ?? null,
    session_id: input.sessionId ?? requestMeta.sessionId ?? null,
    request_id: input.requestId ?? requestMeta.requestId ?? null,
    success: input.success ?? true,
    error_message: input.errorMessage ?? null,
  };

  const { error } = await supabaseAdmin.from("audit_log" as any).insert(payload as any);
  if (error) throwSafeError("audit.record", error, "Unable to record audit event.");
}

export async function recordAuditEvent(input: AuditEventInput) {
  const actorId = uuidSchema.parse(input.actorId);
  const entityId = input.entityId == null ? null : uuidSchema.parse(input.entityId);
  const organisationId = input.organisationId == null ? null : uuidSchema.parse(input.organisationId);
  const event = auditEventSchema.parse({
    entity: input.entity,
    action: input.action,
    details: input.details,
  });
  await recordBlackboxAudit({
    userId: actorId,
    orgId: organisationId,
    resourceType: event.entity,
    resourceId: entityId,
    actionType: event.action,
    actionDetail: event.details as Json,
  });
}
