const nodemailer = require('nodemailer');

// Create SMTP transporter
let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'noreply@tampamixtape.com';
const CONTACT_RECIPIENT = process.env.CONTACT_RECIPIENT_EMAIL || 'contact@tampamixtape.com';

/**
 * Check if email service is configured
 */
function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

/**
 * Send contact form submission to admin
 */
async function sendContactFormEmail({ name, email, subject, message }) {
  if (!isConfigured()) {
    console.log('SMTP not configured, skipping contact form email');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `"Tampa Mixtape" <${FROM_EMAIL}>`,
    to: CONTACT_RECIPIENT,
    replyTo: email,
    subject: `Tampa Mixtape Contact: ${subject}`,
    text: `
New contact form submission from Tampa Mixtape:

Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
    `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">New Contact Form Submission</h2>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${name}</td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
    </tr>
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">Subject:</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${subject}</td>
    </tr>
  </table>
  <h3 style="color: #333; margin-top: 20px;">Message:</h3>
  <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
    ${message.replace(/\n/g, '<br>')}
  </div>
  <p style="color: #888; font-size: 12px; margin-top: 20px;">
    This message was sent via the Tampa Mixtape contact form.
  </p>
</div>
    `.trim(),
  };

  try {
    await getTransporter().sendMail(mailOptions);
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
    console.log('SMTP not configured, skipping claim submitted email');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `"Tampa Mixtape" <${FROM_EMAIL}>`,
    to: email,
    subject: `Claim Received: ${artistName} - Tampa Mixtape`,
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

Questions? Reply to this email or visit tampamixtape.com/contact
    `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Tampa Mixtape</h1>
  </div>
  <div style="padding: 30px; background: #fff;">
    <h2 style="color: #333;">Claim Request Received</h2>
    <p>Hi there,</p>
    <p>We've received your claim request for the artist profile <strong>"${artistName}"</strong> on Tampa Mixtape.</p>

    <h3 style="color: #333;">What happens next:</h3>
    <ol style="color: #555;">
      <li>Our team will review your submission and verify your identity</li>
      <li>This typically takes 1-3 business days</li>
      <li>You'll receive an email once we've made a decision</li>
    </ol>

    <p>If your claim is approved, you'll receive login credentials to manage your artist profile.</p>

    <p style="margin-top: 30px;">Thank you for being part of the Tampa Bay music community!</p>
    <p><strong>- The Tampa Mixtape Team</strong></p>
  </div>
  <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888;">
    Questions? Visit <a href="https://tampamixtape.com/contact">tampamixtape.com/contact</a>
  </div>
</div>
    `.trim(),
  };

  try {
    await getTransporter().sendMail(mailOptions);
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
    console.log('SMTP not configured, skipping claim approved email');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `"Tampa Mixtape" <${FROM_EMAIL}>`,
    to: email,
    subject: `Claim Approved: ${artistName} - Tampa Mixtape`,
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
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Tampa Mixtape</h1>
  </div>
  <div style="padding: 30px; background: #fff;">
    <h2 style="color: #22c55e;">Claim Approved!</h2>
    <p>Congratulations! Your claim for the artist profile <strong>"${artistName}"</strong> has been approved.</p>
    <p>You now have full control of your profile on Tampa Mixtape.</p>

    <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #333;">Your Login Credentials</h3>
      <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e5e5e5; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code></p>
    </div>

    <p style="color: #dc2626; font-weight: bold;">IMPORTANT: Please log in and change your password immediately.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://tampamixtape.com/login" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Log In Now</a>
    </div>

    <p>Once logged in, you can:</p>
    <ul style="color: #555;">
      <li>Update your bio and profile photo</li>
      <li>Add your social media links</li>
      <li>Manage your artist information</li>
    </ul>

    <p style="margin-top: 30px;">Welcome to the Tampa Bay music community!</p>
    <p><strong>- The Tampa Mixtape Team</strong></p>
  </div>
  <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888;">
    Questions? Visit <a href="https://tampamixtape.com/contact">tampamixtape.com/contact</a>
  </div>
</div>
    `.trim(),
  };

  try {
    await getTransporter().sendMail(mailOptions);
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
    console.log('SMTP not configured, skipping claim rejected email');
    return { success: false, reason: 'not_configured' };
  }

  const mailOptions = {
    from: `"Tampa Mixtape" <${FROM_EMAIL}>`,
    to: email,
    subject: `Claim Update: ${artistName} - Tampa Mixtape`,
    text: `
Hi there,

Thank you for submitting a claim for the artist profile "${artistName}" on Tampa Mixtape.

After reviewing your submission, we were unable to approve your claim at this time.

${reason ? `Reason: ${reason}` : ''}

If you believe this decision was made in error, or if you have additional documentation to support your claim, please feel free to submit a new claim with more information or contact us at tampamixtape.com/contact.

We appreciate your interest in Tampa Mixtape and the Tampa Bay music scene.

- The Tampa Mixtape Team
    `.trim(),
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
    <h1 style="color: white; margin: 0;">Tampa Mixtape</h1>
  </div>
  <div style="padding: 30px; background: #fff;">
    <h2 style="color: #333;">Claim Update</h2>
    <p>Hi there,</p>
    <p>Thank you for submitting a claim for the artist profile <strong>"${artistName}"</strong> on Tampa Mixtape.</p>
    <p>After reviewing your submission, we were unable to approve your claim at this time.</p>

    ${reason ? `
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
      <strong>Reason:</strong> ${reason}
    </div>
    ` : ''}

    <p>If you believe this decision was made in error, or if you have additional documentation to support your claim, please feel free to:</p>
    <ul style="color: #555;">
      <li>Submit a new claim with more information</li>
      <li>Contact us at <a href="https://tampamixtape.com/contact">tampamixtape.com/contact</a></li>
    </ul>

    <p style="margin-top: 30px;">We appreciate your interest in Tampa Mixtape and the Tampa Bay music scene.</p>
    <p><strong>- The Tampa Mixtape Team</strong></p>
  </div>
  <div style="background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #888;">
    Questions? Visit <a href="https://tampamixtape.com/contact">tampamixtape.com/contact</a>
  </div>
</div>
    `.trim(),
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`Claim rejected email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send claim rejected email:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  isConfigured,
  sendContactFormEmail,
  sendClaimSubmittedEmail,
  sendClaimApprovedEmail,
  sendClaimRejectedEmail,
};
