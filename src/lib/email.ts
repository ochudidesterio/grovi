import "server-only";
import { Resend } from "resend";

// Shared Resend test domain for now (no DNS/domain verification needed) —
// swap for a verified sending domain before this goes in front of real
// guests; see CLAUDE.md's Phase 2 backlog notes.
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "Grovi <onboarding@resend.dev>";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

// Every send is best-effort: a missing API key or a failed request should
// never break the planting/follow-up flow that triggered it — the record
// is already saved by the time email is attempted.

export async function sendPlantingConfirmationEmail({
  to,
  guestName,
  treeCode,
  speciesName,
  publicUrl,
}: {
  to: string;
  guestName: string;
  treeCode: string;
  speciesName: string | null;
  publicUrl: string;
}) {
  const client = getClient();
  if (!client) {
    console.warn(`RESEND_API_KEY not set — skipping planting confirmation email to ${to}`);
    return;
  }
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "Your tree has been planted 🌱",
      html: `
        <p>Hi ${guestName},</p>
        <p>Your ${speciesName ?? "tree"} has just been planted and given its own page —
        you can watch it grow over time.</p>
        <p><a href="${publicUrl}">${publicUrl}</a></p>
        <p style="color:#78716c;font-size:13px;">Tag: ${treeCode}</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send planting confirmation email:", err);
  }
}

export async function sendQuarterlyUpdateEmail({
  to,
  guestName,
  treeCode,
  speciesName,
  publicUrl,
  photoUrl,
}: {
  to: string;
  guestName: string;
  treeCode: string;
  speciesName: string | null;
  publicUrl: string;
  photoUrl: string | null;
}) {
  const client = getClient();
  if (!client) {
    console.warn(`RESEND_API_KEY not set — skipping quarterly update email to ${to}`);
    return;
  }
  try {
    await client.emails.send({
      from: FROM_ADDRESS,
      to,
      subject: "New photo of your tree 📷",
      html: `
        <p>Hi ${guestName},</p>
        <p>Your ${speciesName ?? "tree"} (${treeCode}) has a new photo.</p>
        ${photoUrl ? `<img src="${photoUrl}" alt="" style="max-width:100%;border-radius:8px;" />` : ""}
        <p><a href="${publicUrl}">${publicUrl}</a></p>
      `,
    });
  } catch (err) {
    console.error("Failed to send quarterly update email:", err);
  }
}
