import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const fromAddress = process.env.RESEND_FROM || "ONE Group <noreply@onegroup.in>";

const resend = apiKey ? new Resend(apiKey) : null;

export type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: SendEmailArgs) {
  if (!resend) {
    console.log("[email:dev]", { to, subject, html });
    return { id: "dev-mode", delivered: false, dev: true };
  }

  const { data, error } = await resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] send failed", error);
    throw new Error(error.message || "Email send failed");
  }

  return { id: data?.id ?? null, delivered: true, dev: false };
}

export function wrapBrandedEmail(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background:#f5f5f7; margin:0; padding:24px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <tr><td style="background:linear-gradient(135deg,#1e3a8a,#1e40af); color:#fff; padding:24px;">
      <h1 style="margin:0; font-size:20px;">ONE Group</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <h2 style="color:#111827; margin:0 0 16px; font-size:18px;">${title}</h2>
      <div style="color:#374151; font-size:14px; line-height:1.6;">${body}</div>
    </td></tr>
    <tr><td style="background:#f9fafb; color:#6b7280; padding:16px; text-align:center; font-size:12px;">
      ONE Group Customer Portal · This is an automated message.
    </td></tr>
  </table>
</body>
</html>`;
}
