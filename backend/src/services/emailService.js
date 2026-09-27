const FROM = process.env.EMAIL_FROM || "Shop <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, text }) {
  const key = process.env.RESEND_API_KEY;
  const appUrl = process.env.APP_URL || "http://localhost:5173";

  if (!key) {
    console.log("[email:dev]", { to, subject, text: text || html });
    return { dev: true, appUrl };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject,
      html: html || `<p>${text}</p>`,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Email failed: ${err}`);
  }
  return res.json();
}

export function buildResetEmail(link) {
  return {
    subject: "Reset your Shop password",
    text: `Reset your password: ${link}\nThis link expires in 1 hour.`,
    html: `<p>Reset your password:</p><p><a href="${link}">${link}</a></p><p>Expires in 1 hour.</p>`,
  };
}

export function buildVerifyEmail(link) {
  return {
    subject: "Confirm your new email",
    text: `Confirm your email: ${link}\nThis link expires in 24 hours.`,
    html: `<p>Confirm your new email:</p><p><a href="${link}">${link}</a></p><p>Expires in 24 hours.</p>`,
  };
}
