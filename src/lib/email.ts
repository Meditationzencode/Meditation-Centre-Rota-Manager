import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM = 'Bodhi Grove Rota <rota@bodhigrove.demo>'

async function send(to: string, subject: string, html: string) {
  if (!resend) return
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch {
    // Non-fatal
  }
}

function wrap(body: string) {
  return `<!DOCTYPE html><html><body style="font-family:Georgia,serif;max-width:560px;margin:40px auto;color:#292524;background:#fafaf9;padding:32px;border-radius:8px;border:1px solid #e7e5e4">
  <div style="font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#78716c;margin-bottom:8px">◆ Bodhi Grove</div>
  ${body}
  <hr style="border:none;border-top:1px solid #e7e5e4;margin:24px 0">
  <p style="font-size:12px;color:#a8a29e">Bodhi Grove Meditation Centre — Sangha Rota</p>
</body></html>`
}

export async function sendSignupConfirmation(to: string, duty: string, date: string, time: string, location: string) {
  await send(to, `Rota sign-up confirmed: ${duty}`, wrap(`
    <h2 style="font-size:20px;margin:0 0 16px">Sign-up confirmed</h2>
    <p>You have signed up for the following shift:</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:6px 0;color:#78716c;width:100px">Duty</td><td style="font-weight:bold">${duty}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c">Date</td><td>${date}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c">Time</td><td>${time}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c">Location</td><td>${location}</td></tr>
    </table>
    <p>Thank you for volunteering.</p>
  `))
}

export async function sendSignupCancelled(to: string, duty: string, date: string) {
  await send(to, `Rota sign-up cancelled: ${duty}`, wrap(`
    <h2 style="font-size:20px;margin:0 0 16px">Sign-up cancelled</h2>
    <p>Your sign-up for <strong>${duty}</strong> on <strong>${date}</strong> has been cancelled.</p>
    <p>If this was a mistake, you can sign up again on the rota.</p>
  `))
}

export async function sendSwapRequestedToAdmins(adminEmails: string[], requesterName: string, duty: string, date: string, reason: string) {
  if (adminEmails.length === 0) return
  const reasonHtml = reason
    ? `<p><strong>Reason:</strong> ${reason}</p>`
    : ''
  await send(adminEmails.join(','), `Swap request: ${requesterName} — ${duty}`, wrap(`
    <h2 style="font-size:20px;margin:0 0 16px">Shift swap request</h2>
    <p><strong>${requesterName}</strong> has requested a swap for:</p>
    <table style="border-collapse:collapse;width:100%;margin:16px 0">
      <tr><td style="padding:6px 0;color:#78716c;width:100px">Duty</td><td style="font-weight:bold">${duty}</td></tr>
      <tr><td style="padding:6px 0;color:#78716c">Date</td><td>${date}</td></tr>
    </table>
    ${reasonHtml}
    <p>Log in to review the request in the Swaps section.</p>
  `))
}

export async function sendSwapDecision(to: string, approved: boolean, duty: string, date: string) {
  const verb = approved ? 'approved' : 'rejected'
  await send(to, `Swap request ${verb}: ${duty}`, wrap(`
    <h2 style="font-size:20px;margin:0 0 16px">Swap request ${verb}</h2>
    <p>Your swap request for <strong>${duty}</strong> on <strong>${date}</strong> has been <strong>${verb}</strong>.</p>
    ${approved ? '<p>Your sign-up has been cancelled. You are free for that slot.</p>' : '<p>Your sign-up remains in place. Please continue as scheduled.</p>'}
  `))
}
