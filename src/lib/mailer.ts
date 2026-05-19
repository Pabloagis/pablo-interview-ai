import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error('GMAIL_USER or GMAIL_APP_PASSWORD is not set');

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: { user, pass },
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface SendApplicationEmailParams {
  to: string;
  name: string;
  role: string;
  company: string;
  transcript?: string | null;
}

export async function sendApplicationEmail({
  to,
  name,
  role,
  company,
  transcript,
}: SendApplicationEmailParams): Promise<{ id: string }> {
  const transporter = createTransporter();

  const cvPath = path.join(process.cwd(), 'public/assets/Pablo_Agis_Burgos_CV.pdf');
  const cvBuffer = fs.readFileSync(cvPath);

  const roleText = role ? `the ${role} opportunity` : 'the opportunity';
  const companyText = company ? ` at ${company}` : '';

  const infoCards = [
    role ? { label: 'Role', value: role } : null,
    company ? { label: 'Company', value: company } : null,
    { label: 'Candidate', value: 'Pablo Agis Burgos' },
  ]
    .filter(Boolean)
    .map(
      (card) => `
        <tr>
          <td style="padding-bottom:10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="background-color:#f1f5f9;border-radius:8px;padding:14px 18px;border-left:3px solid #2563eb;">
                  <p style="margin:0 0 3px 0;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">${card!.label}</p>
                  <p style="margin:0;font-size:15px;font-weight:600;color:#1a1a2e;">${escapeHtml(card!.value)}</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>`
    )
    .join('');

  const transcriptSection =
    transcript
      ? `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
          <tr>
            <td>
              <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;color:#1a1a2e;text-transform:uppercase;letter-spacing:0.8px;">Conversation Summary</p>
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="background-color:#f8f9fa;border-radius:8px;border:1px solid #e2e8f0;padding:20px;">
                    <pre style="margin:0;font-family:'Courier New',Courier,monospace;font-size:12px;line-height:1.7;color:#374151;white-space:pre-wrap;word-wrap:break-word;">${escapeHtml(transcript)}</pre>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`
      : '';

  const html = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Following up — Pablo Agis Burgos</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:Arial,Helvetica,sans-serif;">

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f8f9fa;">
    <tr>
      <td align="center" style="padding:40px 20px;">

        <!-- Main card -->
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- HEADER -->
          <tr>
            <td style="background-color:#1d4ed8;border-radius:12px 12px 0 0;padding:40px 40px 32px;text-align:center;">
              <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 16px auto;">
                <tr>
                  <td width="64" height="64" style="width:64px;height:64px;background-color:#ffffff;border-radius:32px;text-align:center;vertical-align:middle;">
                    <span style="font-size:20px;font-weight:700;color:#1d4ed8;display:block;line-height:64px;">PA</span>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">Pablo Agis Burgos</p>
              <p style="margin:0;font-size:13px;color:#bfdbfe;letter-spacing:0.3px;">Hospitality-tech professional · Barcelona</p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <!-- Greeting -->
              <p style="margin:0 0 16px 0;font-size:18px;font-weight:600;color:#1a1a2e;">Hi ${escapeHtml(name)},</p>

              <!-- Intro -->
              <p style="margin:0 0 12px 0;font-size:15px;line-height:1.75;color:#374151;">
                Thanks for taking the time to chat about ${roleText}${companyText}.
                I really enjoyed learning more about the team and the role.
              </p>
              <p style="margin:0 0 32px 0;font-size:15px;line-height:1.75;color:#374151;">
                As promised, I'm following up with my CV attached and a few ways to stay in touch.
              </p>

              <!-- Info cards -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:32px;">
                ${infoCards}
              </table>

              <!-- Transcript (conditional) -->
              ${transcriptSection}

              <!-- Contact cards -->
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="padding-bottom:10px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background-color:#f1f5f9;border-radius:8px;padding:14px 18px;border-left:3px solid #2563eb;">
                          <p style="margin:0 0 3px 0;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">CV</p>
                          <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a2e;">Pablo_Agis_Burgos_CV.pdf &middot; Attached</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background-color:#f1f5f9;border-radius:8px;padding:14px 18px;border-left:3px solid #2563eb;">
                          <p style="margin:0 0 3px 0;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">Email</p>
                          <p style="margin:0;font-size:14px;font-weight:600;"><a href="mailto:pabloagisburgos@gmail.com" style="color:#2563eb;text-decoration:none;">pabloagisburgos@gmail.com</a></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="background-color:#f1f5f9;border-radius:8px;padding:14px 18px;border-left:3px solid #2563eb;">
                          <p style="margin:0 0 3px 0;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px;">LinkedIn</p>
                          <p style="margin:0;font-size:14px;font-weight:600;"><a href="https://www.linkedin.com/in/pablo-agis-burgos" target="_blank" style="color:#2563eb;text-decoration:none;">linkedin.com/in/pablo-agis-burgos</a></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color:#f8f9fa;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:13px;color:#64748b;font-style:italic;">Sent with appreciation</p>
              <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                This email was sent after your AI-assisted conversation with Pablo's interview simulator.<br>
                If you didn't expect this, please reply to let us know.
              </p>
            </td>
          </tr>

        </table>
        <!-- / Main card -->

      </td>
    </tr>
  </table>

</body>
</html>`;

  const info = await transporter.sendMail({
    from: `"Pablo Agis Burgos" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Following up on our conversation — Pablo Agis Burgos',
    html,
    attachments: [
      {
        filename: 'Pablo_Agis_Burgos_CV.pdf',
        content: cvBuffer,
      },
    ],
  });

  return { id: info.messageId };
}
