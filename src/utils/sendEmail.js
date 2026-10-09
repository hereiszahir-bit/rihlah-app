import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';

// Writes to Firestore `mail` collection — picked up by Firebase Trigger Email extension
// Extension must be installed and configured with an SMTP provider (Resend, SendGrid, etc.)

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Brand-consistent email wrapper — dark bg, Georgia serif, terracotta accents
function emailShell(content) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%;">
          <!-- Wordmark -->
          <tr>
            <td style="padding-bottom: 36px;">
              <span style="font-family: Georgia, serif; font-size: 26px; letter-spacing: 3px; color: #c4956a;">r</span><span style="font-family: Georgia, serif; font-size: 26px; letter-spacing: 3px; color: #f5f1ea;">ihlah</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="color: #f5f1ea;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding-top: 48px; border-top: 1px solid #1e1c1a; margin-top: 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding-top: 24px;">
                <tr>
                  <td style="font-size: 12px; color: #3d3935; line-height: 1.7;">
                    <a href="https://rihlah.io" style="color: #6b6560; text-decoration: none;">rihlah.io</a>
                    &nbsp;&middot;&nbsp;
                    <a href="https://instagram.com/rihlah.io" style="color: #6b6560; text-decoration: none;">@rihlah.io</a>
                    <br>
                    A curated travel community. Application only.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function ctaButton(text, url) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
      <tr>
        <td style="background-color: #c4956a; border-radius: 24px; padding: 14px 36px;">
          <a href="${url}" style="color: #0a0a0a; text-decoration: none; font-family: -apple-system, 'Segoe UI', sans-serif; font-size: 15px; font-weight: 600; display: inline-block;">${text}</a>
        </td>
      </tr>
    </table>`;
}

export async function sendApplicationReceived(userEmail, userName) {
  const html = emailShell(`
    <p style="font-size: 20px; line-height: 1.5; margin: 0 0 20px; color: #f5f1ea;">
      ${escapeHTML(userName)}, we received your application.
    </p>
    <p style="font-size: 15px; color: #a8a29e; line-height: 1.8; margin: 0 0 16px;">
      We review every application personally to keep this community intentional. You'll hear from us within 48 hours.
    </p>

    <!-- Divider -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
      <tr><td style="border-top: 1px solid #1e1c1a;"></td></tr>
    </table>

    <p style="font-size: 13px; color: #6b6560; line-height: 1.6; margin: 0 0 6px; font-family: -apple-system, 'Segoe UI', sans-serif; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">
      While you wait
    </p>
    <p style="font-size: 15px; color: #a8a29e; line-height: 1.7; margin: 0 0 20px;">
      Read what the community is thinking about.
    </p>

    <!-- Blog cards -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
      <tr>
        <td style="background-color: #141414; border: 1px solid #1e1c1a; border-radius: 10px; padding: 18px 20px;">
          <a href="https://rihlah.io/blog/seven-signs-you-belong-here" style="text-decoration: none;">
            <p style="font-family: Georgia, serif; font-size: 16px; color: #f5f1ea; margin: 0 0 4px; line-height: 1.3;">Seven Signs You Belong Here</p>
            <p style="font-size: 12px; color: #6b6560; margin: 0;">Community &middot; 4 min read</p>
          </a>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
      <tr>
        <td style="background-color: #141414; border: 1px solid #1e1c1a; border-radius: 10px; padding: 18px 20px;">
          <a href="https://rihlah.io/blog/five-cities-nobody-talks-about" style="text-decoration: none;">
            <p style="font-family: Georgia, serif; font-size: 16px; color: #f5f1ea; margin: 0 0 4px; line-height: 1.3;">Five Cities Nobody Talks About</p>
            <p style="font-size: 12px; color: #6b6560; margin: 0;">Destinations &middot; 5 min read</p>
          </a>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color: #141414; border: 1px solid #1e1c1a; border-radius: 10px; padding: 18px 20px;">
          <a href="https://rihlah.io/blog/the-airport-test" style="text-decoration: none;">
            <p style="font-family: Georgia, serif; font-size: 16px; color: #f5f1ea; margin: 0 0 4px; line-height: 1.3;">The Airport Test</p>
            <p style="font-size: 12px; color: #6b6560; margin: 0;">Culture &middot; 4 min read</p>
          </a>
        </td>
      </tr>
    </table>
  `);

  await addDoc(collection(db, 'mail'), {
    to: userEmail,
    message: {
      subject: 'Rihlah — Application received',
      html,
    },
  });
}

export async function sendApplicationApproved(userEmail, userName, isFoundingMember) {
  const founderBlock = isFoundingMember
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 28px 0;">
        <tr>
          <td style="border: 1px solid #c4956a; border-radius: 10px; padding: 24px; text-align: center;">
            <p style="font-size: 11px; font-weight: 700; letter-spacing: 4px; color: #c4956a; margin: 0 0 8px; font-family: -apple-system, 'Segoe UI', sans-serif; text-transform: uppercase;">Founding Member</p>
            <p style="font-size: 14px; color: #a8a29e; margin: 0; line-height: 1.6;">You are one of our first 100 members. This status is permanent — it stays with your account forever.</p>
          </td>
        </tr>
      </table>`
    : '';

  const html = emailShell(`
    <p style="font-size: 22px; line-height: 1.4; margin: 0 0 20px; color: #f5f1ea;">
      ${escapeHTML(userName)}, you're in.
    </p>
    <p style="font-size: 15px; color: #a8a29e; line-height: 1.8; margin: 0 0 8px;">
      Your application has been approved. Open the app to complete your profile, add your first trip, and start connecting with the community.
    </p>
    ${founderBlock}
    ${ctaButton('Open Rihlah', 'https://rihlah.io/login')}
  `);

  await addDoc(collection(db, 'mail'), {
    to: userEmail,
    message: {
      subject: 'Welcome to Rihlah',
      html,
    },
  });
}

export async function sendApplicationRejected(userEmail, userName) {
  const html = emailShell(`
    <p style="font-size: 20px; line-height: 1.5; margin: 0 0 20px; color: #f5f1ea;">
      ${escapeHTML(userName)}, thank you for your interest.
    </p>
    <p style="font-size: 15px; color: #a8a29e; line-height: 1.8; margin: 0 0 16px;">
      We're not able to accept your application at this time. Rihlah is a small, curated community and we're being very selective in this early phase.
    </p>
    <p style="font-size: 15px; color: #6b6560; line-height: 1.7; margin: 0;">
      You're welcome to reapply in the future. We appreciate your patience.
    </p>
  `);

  await addDoc(collection(db, 'mail'), {
    to: userEmail,
    message: {
      subject: 'Rihlah — Application update',
      html,
    },
  });
}

// --- Nurture Sequence ---
// Scheduled emails sent after application. Uses Firestore `mail` collection
// with a `delivery.startTime` field for delayed sending (Firebase extension feature).

export async function sendNurtureDay3(userEmail, userName) {
  const html = emailShell(`
    <p style="font-size: 20px; line-height: 1.5; margin: 0 0 20px; color: #f5f1ea;">
      While you wait, ${escapeHTML(userName)}.
    </p>
    <p style="font-size: 15px; color: #a8a29e; line-height: 1.8; margin: 0 0 24px;">
      We put together a few things worth reading. Not guides — more like how we think about cities, food, and the people who make travel worth it.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
      <tr>
        <td style="background-color: #141414; border: 1px solid #1e1c1a; border-radius: 10px; padding: 18px 20px;">
          <a href="https://rihlah.io/blog/five-cities-nobody-talks-about" style="text-decoration: none;">
            <p style="font-family: Georgia, serif; font-size: 16px; color: #f5f1ea; margin: 0 0 4px; line-height: 1.3;">Five Cities Nobody Talks About</p>
            <p style="font-size: 12px; color: #6b6560; margin: 0;">Tbilisi, Sarajevo, Oaxaca, Fez, Tashkent.</p>
          </a>
        </td>
      </tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color: #141414; border: 1px solid #1e1c1a; border-radius: 10px; padding: 18px 20px;">
          <a href="https://rihlah.io/blog/the-airport-test" style="text-decoration: none;">
            <p style="font-family: Georgia, serif; font-size: 16px; color: #f5f1ea; margin: 0 0 4px; line-height: 1.3;">The Airport Test</p>
            <p style="font-size: 12px; color: #6b6560; margin: 0;">How you handle a layover says everything.</p>
          </a>
        </td>
      </tr>
    </table>

    <p style="font-size: 14px; color: #6b6560; line-height: 1.7; margin: 24px 0 0;">
      More on the journal: <a href="https://rihlah.io/blog" style="color: #c4956a; text-decoration: none;">rihlah.io/blog</a>
    </p>
  `);

  await addDoc(collection(db, 'mail'), {
    to: userEmail,
    message: {
      subject: 'Rihlah — Worth reading',
      html,
    },
  });
}

export async function sendNurtureDay7(userEmail, userName) {
  const html = emailShell(`
    <p style="font-size: 20px; line-height: 1.5; margin: 0 0 20px; color: #f5f1ea;">
      The kind of people we are building this for.
    </p>
    <p style="font-size: 15px; color: #a8a29e; line-height: 1.8; margin: 0 0 16px;">
      Rihlah is not for everyone. It is for the person who has a notes app full of restaurant recommendations from strangers. Who has booked a flight on a feeling. Who packs light and stays longer than planned.
    </p>
    <p style="font-size: 15px; color: #a8a29e; line-height: 1.8; margin: 0 0 16px;">
      It is for the person who knows that the best part of travel is not the destination — it is knowing someone when you get there.
    </p>
    <p style="font-size: 15px; color: #f5f1ea; line-height: 1.8; margin: 0 0 4px;">
      We are reviewing applications now. Yours is in the queue.
    </p>

    ${ctaButton('Follow along', 'https://instagram.com/rihlah.io')}

    <p style="font-size: 13px; color: #6b6560; line-height: 1.7; margin: 28px 0 0;">
      In the meantime, we are on Instagram. That is where the conversation is happening.
    </p>
  `);

  await addDoc(collection(db, 'mail'), {
    to: userEmail,
    message: {
      subject: 'Rihlah — Your people',
      html,
    },
  });
}

// Schedule the nurture sequence after application. Call this from Onboarding.
// The delay is handled by writing scheduled docs — the Cloud Function
// (or Firebase extension with scheduled delivery) picks them up.
export async function scheduleNurtureSequence(userEmail, userName) {
  const now = Date.now();
  const day3 = new Date(now + 3 * 24 * 60 * 60 * 1000);
  const day7 = new Date(now + 7 * 24 * 60 * 60 * 1000);

  // Write scheduled tasks to Firestore — picked up by a Cloud Function
  await addDoc(collection(db, 'scheduledEmails'), {
    type: 'nurture-day-3',
    to: userEmail,
    userName,
    sendAt: day3.toISOString(),
    sent: false,
  });

  await addDoc(collection(db, 'scheduledEmails'), {
    type: 'nurture-day-7',
    to: userEmail,
    userName,
    sendAt: day7.toISOString(),
    sent: false,
  });
}

export async function sendAdminNotification(adminEmail, applicantName, applicantCity) {
  const html = emailShell(`
    <p style="font-size: 17px; line-height: 1.6; margin: 0 0 8px; color: #f5f1ea;">
      New application from <strong>${escapeHTML(applicantName)}</strong>
    </p>
    <p style="font-size: 14px; color: #6b6560; margin: 0 0 4px;">
      ${escapeHTML(applicantCity) || 'No city provided'}
    </p>
    ${ctaButton('Review applications', 'https://rihlah.io/admin')}
  `);

  await addDoc(collection(db, 'mail'), {
    to: adminEmail,
    message: {
      subject: `New application: ${escapeHTML(applicantName)}`,
      html,
    },
  });
}
