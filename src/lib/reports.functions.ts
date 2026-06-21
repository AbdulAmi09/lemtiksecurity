import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { buildReportDeliveryEmail, sendResendEmail } from "@/lib/email.service";
import { throwSafeError } from "@/lib/server-errors";
import { getActiveOrgId } from "@/lib/orgs.server";

export const sendReportDelivery = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      report_name: z.string().min(1).max(160),
      summary: z.string().min(1).max(1200),
      recipient_emails: z.array(z.string().email().max(200)).min(1).max(10),
      report_url: z.string().url().max(1000).nullable().optional(),
      unsubscribe_url: z.string().url().max(1000).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const orgId = await getActiveOrgId(context.supabase, context.userId);
    const { data: org, error } = await context.supabase
      .from("organisations")
      .select("name")
      .eq("id", orgId)
      .maybeSingle();
    if (error) throwSafeError("reports.delivery.org", error, "Unable to load organisation.");
    if (!org) throw new Error("Organisation not found.");

    const email = buildReportDeliveryEmail({
      reportName: data.report_name,
      organisationName: org.name,
      summary: data.summary,
      reportUrl: data.report_url ?? null,
      unsubscribeUrl: data.unsubscribe_url ?? null,
    });

    const delivery = await sendResendEmail({
      to: data.recipient_emails,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (!delivery.ok) {
      return { ok: true, warning: delivery.error ?? "Report email delivery skipped.", skipped: delivery.skipped };
    }

    return { ok: true };
  });
