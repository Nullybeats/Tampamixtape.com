const nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid if API key is provided
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Create SMTP transporter (fallback)
let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    const port = parseInt(process.env.SMTP_PORT) || 587;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// Use SendGrid FROM email or SMTP FROM email
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || 'noreply@tampamixtape.com';
const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT_EMAIL || 'contact@tampamixtape.com';

// Brand colors
const BRAND = {
  primary: '#22c55e',
  primaryDark: '#16a34a',
  primaryDarker: '#15803d',
  dark: '#0a0a0a',
  darkGray: '#1a1a1a',
  lightGray: '#2a2a2a',
  text: '#ffffff',
  textMuted: '#9ca3af',
  success: '#22c55e',
  error: '#ef4444',
  warning: '#f59e0b',
};

// Logo URL (hosted on the site)
const LOGO_URL = 'https://tampamixtape.com/favicon.png';

/**
 * Generate email header with logo
 */
function getEmailHeader() {
  return `
    <div style="background: linear-gradient(135deg, ${BRAND.dark} 0%, ${BRAND.darkGray} 100%); padding: 40px 20px; text-align: center; border-bottom: 3px solid ${BRAND.primary};">
      <div style="margin-bottom: 15px;">
        <img src="${LOGO_URL}" alt="TM" width="60" height="60" style="width: 60px; height: 60px; border-radius: 12px; display: inline-block;" />
      </div>
      <h1 style="color: ${BRAND.text}; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
        Tampa<span style="color: ${BRAND.primary};">Mixtape</span>
      </h1>
      <p style="color: ${BRAND.textMuted}; margin: 8px 0 0 0; font-size: 14px;">Tampa Bay's Music Discovery Platform</p>
    </div>
  `;
}

/**
 * Generate email footer
 */
function getEmailFooter() {
  return `
    <div style="background: ${BRAND.dark}; padding: 30px 20px; text-align: center; border-top: 1px solid ${BRAND.lightGray};">
      <p style="color: ${BRAND.textMuted}; margin: 0 0 15px 0; font-size: 14px;">
        Discover Tampa Bay's finest artists and music
      </p>
      <div style="margin-bottom: 15px;">
        <a href="https://tampamixtape.com" style="color: ${BRAND.primary}; text-decoration: none; font-size: 14px; margin: 0 10px;">Website</a>
        <span style="color: ${BRAND.lightGray};">|</span>
        <a href="https://tampamixtape.com/artists" style="color: ${BRAND.primary}; text-decoration: none; font-size: 14px; margin: 0 10px;">Artists</a>
        <span style="color: ${BRAND.lightGray};">|</span>
        <a href="https://tampamixtape.com/contact" style="color: ${BRAND.primary}; text-decoration: none; font-size: 14px; margin: 0 10px;">Contact</a>
      </div>
      <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} Tampa Mixtape. All rights reserved.
      </p>
    </div>
  `;
}

/**
 * Generate button style
 */
function getButton(text, url, color = BRAND.primary) {
  return `
    <a href="${url}" style="display: inline-block; background: ${color}; color: ${BRAND.text}; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 10px 0;">
      ${text}
    </a>
  `;
}

/**
 * Check if email service is configured (SendGrid preferred, SMTP fallback)
 */
function isConfigured() {
  return !!(process.env.SENDGRID_API_KEY || (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS));
}

/**
 * Check if SendGrid is configured
 */
function useSendGrid() {
  return !!process.env.SENDGRID_API_KEY;
}

/**
 * Send email via SendGrid or SMTP
 */
async function sendEmail(mailOptions) {
  if (useSendGrid()) {
    const msg = {
      to: mailOptions.to,
      from: mailOptions.from,
      subject: mailOptions.subject,
      text: mailOptions.text,
      html: mailOptions.html,
    };
    if (mailOptions.replyTo) {
      msg.replyTo = mailOptions.replyTo;
    }
    await sgMail.send(msg);
  } else if (getTransporter()) {
    await getTransporter().sendMail(mailOptions);
  } else {
    throw new Error('No email service configured');
  }
}

/**
 * Send contact form submission to admin
 */
async function sendContactFormEmail({ name, email, subject, message }) {
  if (!isConfigured()) {
    console.log('Email not configured, skipping contact form email');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `Tampa Mixtape <${FROM_EMAIL}>`,
    to: CONTACT_RECIPIENT,
    replyTo: email,
    subject: `New Contact: ${subject}`,
    text: `
New contact form submission from Tampa Mixtape:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: ${BRAND.darkGray};">
    ${getEmailHeader()}

    <div style="padding: 40px 30px;">
      <div style="background: ${BRAND.lightGray}; border-radius: 12px; padding: 25px; margin-bottom: 25px; border-left: 4px solid ${BRAND.primary};">
        <h2 style="color: ${BRAND.text}; margin: 0 0 5px 0; font-size: 20px;">New Contact Form Submission</h2>
        <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 14px;">Someone reached out through the website</p>
      </div>

      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.lightGray}; color: ${BRAND.textMuted}; font-size: 14px; width: 100px;">Name</td>
            <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.lightGray}; color: ${BRAND.text}; font-size: 14px; font-weight: 500;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.lightGray}; color: ${BRAND.textMuted}; font-size: 14px;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid ${BRAND.lightGray}; color: ${BRAND.primary}; font-size: 14px;"><a href="mailto:${email}" style="color: ${BRAND.primary}; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; color: ${BRAND.textMuted}; font-size: 14px;">Subject</td>
            <td style="padding: 12px 0; color: ${BRAND.text}; font-size: 14px; font-weight: 500;">${subject}</td>
          </tr>
        </table>
      </div>

      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 25px;">
        <h3 style="color: ${BRAND.textMuted}; margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Message</h3>
        <p style="color: ${BRAND.text}; margin: 0; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        ${getButton('Reply to ' + name, 'mailto:' + email)}
      </div>
    </div>

    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sendEmail(mailOptions);
    console.log('Contact form email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact form email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email when a profile claim is submitted
 */
async function sendClaimSubmittedEmail({ email, artistName }) {
  if (!isConfigured()) {
    console.log('Email not configured, skipping claim submitted email');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `Tampa Mixtape <${FROM_EMAIL}>`,
    to: email,
    subject: `Claim Received: ${artistName}`,
    text: `
Hi there,

We've received your claim request for the artist profile "${artistName}" on Tampa Mixtape.

What happens next:
1. Our team will review your submission and verify your identity
2. This typically takes 1-3 business days
3. You'll receive an email once we've made a decision

If your claim is approved, you'll receive login credentials to manage your artist profile.

Thank you for being part of the Tampa Bay music community!

- The Tampa Mixtape Team

Questions? Visit tampamixtape.com/contact
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: ${BRAND.darkGray};">
    ${getEmailHeader()}

    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background: ${BRAND.primary}20; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
          <span style="font-size: 32px;">📨</span>
        </div>
        <h2 style="color: ${BRAND.text}; margin: 0 0 10px 0; font-size: 24px;">Claim Request Received</h2>
        <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 16px;">We've got your submission for <strong style="color: ${BRAND.primary};">${artistName}</strong></p>
      </div>

      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h3 style="color: ${BRAND.text}; margin: 0 0 20px 0; font-size: 16px;">What happens next?</h3>

        <div style="display: flex; margin-bottom: 15px;">
          <div style="background: ${BRAND.primary}; color: ${BRAND.text}; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px; flex-shrink: 0;">1</div>
          <div style="margin-left: 15px;">
            <p style="color: ${BRAND.text}; margin: 0 0 3px 0; font-size: 14px; font-weight: 500;">Review Process</p>
            <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 13px;">Our team will verify your identity and review your submission</p>
          </div>
        </div>

        <div style="display: flex; margin-bottom: 15px;">
          <div style="background: ${BRAND.lightGray}; color: ${BRAND.text}; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px; flex-shrink: 0;">2</div>
          <div style="margin-left: 15px;">
            <p style="color: ${BRAND.text}; margin: 0 0 3px 0; font-size: 14px; font-weight: 500;">Processing Time</p>
            <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 13px;">This typically takes 1-3 business days</p>
          </div>
        </div>

        <div style="display: flex;">
          <div style="background: ${BRAND.lightGray}; color: ${BRAND.text}; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 600; font-size: 14px; flex-shrink: 0;">3</div>
          <div style="margin-left: 15px;">
            <p style="color: ${BRAND.text}; margin: 0 0 3px 0; font-size: 14px; font-weight: 500;">Decision Notification</p>
            <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 13px;">You'll receive an email with our decision</p>
          </div>
        </div>
      </div>

      <div style="background: ${BRAND.primary}15; border: 1px solid ${BRAND.primary}30; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="color: ${BRAND.text}; margin: 0; font-size: 14px;">
          If approved, you'll receive login credentials to manage your artist profile on Tampa Mixtape.
        </p>
      </div>

      <p style="color: ${BRAND.textMuted}; text-align: center; margin-top: 30px; font-size: 14px;">
        Thank you for being part of the Tampa Bay music community!
      </p>
    </div>

    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sendEmail(mailOptions);
    console.log(`Claim submitted email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send claim submitted email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send email when a profile claim is approved (includes temporary password)
 */
async function sendClaimApprovedEmail({ email, artistName, tempPassword }) {
  if (!isConfigured()) {
    console.log('Email not configured, skipping claim approved email');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `Tampa Mixtape <${FROM_EMAIL}>`,
    to: email,
    subject: `Welcome to Tampa Mixtape, ${artistName}!`,
    text: `
Congratulations!

Your claim for the artist profile "${artistName}" has been approved. You now have full control of your profile on Tampa Mixtape.

Your Login Credentials:
Email: ${email}
Temporary Password: ${tempPassword}

IMPORTANT: Please log in and change your password immediately.

Login here: https://tampamixtape.com/login

Once logged in, you can:
- Update your bio and profile photo
- Add your social media links
- Manage your artist information

Welcome to the Tampa Bay music community!

- The Tampa Mixtape Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: ${BRAND.darkGray};">
    ${getEmailHeader()}

    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background: ${BRAND.success}20; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
          <span style="font-size: 32px;">🎉</span>
        </div>
        <h2 style="color: ${BRAND.success}; margin: 0 0 10px 0; font-size: 24px;">Claim Approved!</h2>
        <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 16px;">Welcome to Tampa Mixtape, <strong style="color: ${BRAND.text};">${artistName}</strong></p>
      </div>

      <p style="color: ${BRAND.text}; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
        You now have full control of your artist profile. Use the credentials below to log in and start managing your presence on Tampa Mixtape.
      </p>

      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid ${BRAND.success}30;">
        <h3 style="color: ${BRAND.textMuted}; margin: 0 0 15px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Your Login Credentials</h3>

        <div style="margin-bottom: 15px;">
          <p style="color: ${BRAND.textMuted}; margin: 0 0 5px 0; font-size: 12px;">Email</p>
          <p style="color: ${BRAND.text}; margin: 0; font-size: 16px; font-weight: 500;">${email}</p>
        </div>

        <div>
          <p style="color: ${BRAND.textMuted}; margin: 0 0 5px 0; font-size: 12px;">Temporary Password</p>
          <code style="display: block; background: ${BRAND.lightGray}; color: ${BRAND.primary}; padding: 12px 15px; border-radius: 8px; font-size: 18px; font-weight: 600; letter-spacing: 1px;">${tempPassword}</code>
        </div>
      </div>

      <div style="background: ${BRAND.warning}15; border: 1px solid ${BRAND.warning}30; border-radius: 12px; padding: 15px; margin-bottom: 30px;">
        <p style="color: ${BRAND.warning}; margin: 0; font-size: 14px; font-weight: 500;">
          ⚠️ Please change your password immediately after logging in
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        ${getButton('Log In to Your Profile', 'https://tampamixtape.com/login')}
      </div>

      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 20px;">
        <h3 style="color: ${BRAND.text}; margin: 0 0 15px 0; font-size: 14px;">Once logged in, you can:</h3>
        <ul style="color: ${BRAND.textMuted}; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
          <li>Update your bio and profile photo</li>
          <li>Add your social media links</li>
          <li>Manage your artist information</li>
          <li>Connect with the Tampa Bay music community</li>
        </ul>
      </div>
    </div>

    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sendEmail(mailOptions);
    console.log(`Claim approved email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send claim approved email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send email when a profile claim is rejected
 */
async function sendClaimRejectedEmail({ email, artistName, reason }) {
  if (!isConfigured()) {
    console.log('Email not configured, skipping claim rejected email');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `Tampa Mixtape <${FROM_EMAIL}>`,
    to: email,
    subject: `Update on Your Claim: ${artistName}`,
    text: `
Hi there,

Thank you for submitting a claim for the artist profile "${artistName}" on Tampa Mixtape.

After reviewing your submission, we were unable to approve your claim at this time.

${reason ? `Reason: ${reason}` : ''}

If you believe this decision was made in error, or if you have additional documentation to support your claim, please feel free to submit a new claim with more information or contact us.

We appreciate your interest in Tampa Mixtape and the Tampa Bay music scene.

- The Tampa Mixtape Team

Questions? Visit tampamixtape.com/contact
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: ${BRAND.darkGray};">
    ${getEmailHeader()}

    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background: ${BRAND.textMuted}20; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
          <span style="font-size: 32px;">📋</span>
        </div>
        <h2 style="color: ${BRAND.text}; margin: 0 0 10px 0; font-size: 24px;">Claim Update</h2>
        <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 16px;">Regarding your claim for <strong style="color: ${BRAND.text};">${artistName}</strong></p>
      </div>

      <p style="color: ${BRAND.text}; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
        Thank you for your interest in claiming the artist profile "${artistName}" on Tampa Mixtape. After careful review, we were unable to approve your claim at this time.
      </p>

      ${reason ? `
      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 4px solid ${BRAND.error};">
        <h3 style="color: ${BRAND.textMuted}; margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reason</h3>
        <p style="color: ${BRAND.text}; margin: 0; font-size: 15px;">${reason}</p>
      </div>
      ` : ''}

      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h3 style="color: ${BRAND.text}; margin: 0 0 15px 0; font-size: 16px;">What you can do:</h3>
        <ul style="color: ${BRAND.textMuted}; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
          <li>Submit a new claim with additional documentation</li>
          <li>Provide more proof of your identity as the artist</li>
          <li>Contact us if you have questions about the decision</li>
        </ul>
      </div>

      <div style="text-align: center;">
        ${getButton('Contact Support', 'https://tampamixtape.com/contact', BRAND.lightGray)}
      </div>

      <p style="color: ${BRAND.textMuted}; text-align: center; margin-top: 30px; font-size: 14px;">
        We appreciate your interest in the Tampa Bay music community.
      </p>
    </div>

    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sendEmail(mailOptions);
    console.log(`Claim rejected email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send claim rejected email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send email when an artist application is approved
 */
async function sendArtistApplicationApprovedEmail({ email, artistName, profileSlug }) {
  if (!isConfigured()) {
    console.log('Email not configured, skipping artist approval email');
    return { success: false, reason: 'not_configured' };
  }

  const profileUrl = profileSlug ? `https://tampamixtape.com/${profileSlug}` : 'https://tampamixtape.com/login';

  const mailOptions = {
    from: `Tampa Mixtape <${FROM_EMAIL}>`,
    to: email,
    subject: `You're in! Welcome to Tampa Mixtape, ${artistName}`,
    text: `
Congratulations ${artistName}!

Your artist application has been approved. You're now part of Tampa Mixtape — Tampa Bay's music discovery platform.

What you can do now:
- Log in and finish your profile (bio, photo, genres)
- Connect your Apple Music profile to sync your releases
- Manage your social links
- Track who's listening with your artist dashboard

Log in: https://tampamixtape.com/login
${profileSlug ? `Your profile: ${profileUrl}` : ''}

Welcome to the Tampa Bay music community!

- The Tampa Mixtape Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: ${BRAND.darkGray};">
    ${getEmailHeader()}

    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background: ${BRAND.success}20; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
          <span style="font-size: 32px;">🎉</span>
        </div>
        <h2 style="color: ${BRAND.success}; margin: 0 0 10px 0; font-size: 24px;">You're Approved!</h2>
        <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 16px;">Welcome to Tampa Mixtape, <strong style="color: ${BRAND.text};">${artistName}</strong></p>
      </div>

      <p style="color: ${BRAND.text}; font-size: 15px; line-height: 1.6; text-align: center; margin-bottom: 30px;">
        Your artist application has been approved. Log in to finish setting up your profile and start connecting with Tampa Bay listeners.
      </p>

      <div style="text-align: center; margin-bottom: 30px;">
        ${getButton('Log In to Your Dashboard', 'https://tampamixtape.com/login')}
      </div>

      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 25px;">
        <h3 style="color: ${BRAND.text}; margin: 0 0 15px 0; font-size: 16px;">Next steps:</h3>
        <ul style="color: ${BRAND.textMuted}; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
          <li>Add a bio, photo, and genres</li>
          <li>Connect your Apple Music profile to sync releases</li>
          <li>Add your social links</li>
          <li>Track listeners and demand from your dashboard</li>
        </ul>
      </div>

      <p style="color: ${BRAND.textMuted}; text-align: center; margin-top: 30px; font-size: 14px;">
        Welcome to the Tampa Bay music community.
      </p>
    </div>

    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sendEmail(mailOptions);
    console.log(`Artist approval email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send artist approval email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send email when an artist application is rejected
 */
async function sendArtistApplicationRejectedEmail({ email, artistName, reason }) {
  if (!isConfigured()) {
    console.log('Email not configured, skipping artist rejection email');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `Tampa Mixtape <${FROM_EMAIL}>`,
    to: email,
    subject: `Update on your Tampa Mixtape application`,
    text: `
Hi ${artistName || 'there'},

Thank you for applying to Tampa Mixtape. After reviewing your application, we were unable to approve it at this time.

${reason ? `Reason: ${reason}` : ''}

If you'd like to reapply with additional information, or if you think this was a mistake, please reach out at https://tampamixtape.com/contact.

We appreciate your interest in the Tampa Bay music scene.

- The Tampa Mixtape Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.dark}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: ${BRAND.darkGray};">
    ${getEmailHeader()}

    <div style="padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; background: ${BRAND.textMuted}20; border-radius: 50%; padding: 15px; margin-bottom: 15px;">
          <span style="font-size: 32px;">📋</span>
        </div>
        <h2 style="color: ${BRAND.text}; margin: 0 0 10px 0; font-size: 24px;">Application Update</h2>
        <p style="color: ${BRAND.textMuted}; margin: 0; font-size: 16px;">Regarding your application${artistName ? ` for <strong style="color: ${BRAND.text};">${artistName}</strong>` : ''}</p>
      </div>

      <p style="color: ${BRAND.text}; font-size: 15px; line-height: 1.6; margin-bottom: 25px;">
        Thank you for applying to Tampa Mixtape. After careful review, we were unable to approve your application at this time.
      </p>

      ${reason ? `
      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 20px; margin-bottom: 25px; border-left: 4px solid ${BRAND.error};">
        <h3 style="color: ${BRAND.textMuted}; margin: 0 0 10px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Reason</h3>
        <p style="color: ${BRAND.text}; margin: 0; font-size: 15px; white-space: pre-wrap;">${reason}</p>
      </div>
      ` : ''}

      <div style="background: ${BRAND.dark}; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
        <h3 style="color: ${BRAND.text}; margin: 0 0 15px 0; font-size: 16px;">What you can do:</h3>
        <ul style="color: ${BRAND.textMuted}; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
          <li>Reapply with additional information about your work</li>
          <li>Reach out to us if you have questions about the decision</li>
        </ul>
      </div>

      <div style="text-align: center;">
        ${getButton('Contact Support', 'https://tampamixtape.com/contact', BRAND.lightGray)}
      </div>
    </div>

    ${getEmailFooter()}
  </div>
</body>
</html>
    `.trim(),
  };

  try {
    await sendEmail(mailOptions);
    console.log(`Artist rejection email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send artist rejection email:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendAdminAlert({ subject, message }) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.log('[Email] No ADMIN_EMAIL configured, skipping alert');
    return { success: false, error: 'No admin email configured' };
  }

  try {
    await sendEmail({
      from: FROM_EMAIL,
      to: adminEmail,
      subject: subject || 'Tampa Mixtape Alert',
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #e11d48;">⚠️ Tampa Mixtape Alert</h2>
          <p style="font-size: 16px; line-height: 1.5;">${message}</p>
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">This is an automated alert from Tampa Mixtape.</p>
        </div>
      `,
    });
    console.log('[Email] Admin alert sent:', subject);
    return { success: true };
  } catch (error) {
    console.error('Failed to send admin alert:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  isConfigured,
  sendContactFormEmail,
  sendClaimSubmittedEmail,
  sendClaimApprovedEmail,
  sendClaimRejectedEmail,
  sendArtistApplicationApprovedEmail,
  sendArtistApplicationRejectedEmail,
  sendAdminAlert,
};
