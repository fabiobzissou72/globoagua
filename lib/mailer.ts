import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendInviteEmail({
  to,
  companyName,
  inviteLink,
  tempPassword,
}: {
  to: string
  companyName: string
  inviteLink: string
  tempPassword?: string
}) {
  await transporter.sendMail({
    from: `"Globo Água" <${process.env.EMAIL_FROM}>`,
    to,
    subject: `Seu acesso ao sistema Globo Água está pronto`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F0F4FF;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table width="100%" style="max-width:480px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:#1565C0;padding:32px;text-align:center;">
            <p style="margin:0;color:#fff;font-size:28px;font-weight:900;letter-spacing:-0.5px">💧 Globo Água</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 8px;color:#1565C0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Bem-vindo(a)</p>
            <h1 style="margin:0 0 16px;color:#111;font-size:22px;line-height:1.3">${companyName}</h1>
            <p style="margin:0 0 24px;color:#555;font-size:15px;line-height:1.6">
              Seu acesso ao sistema de pedidos da <strong>Globo Água</strong> foi criado.
            </p>
            ${tempPassword ? `
            <table width="100%" style="background:#F0F4FF;border-radius:12px;margin-bottom:24px">
              <tr><td style="padding:20px;">
                <p style="margin:0 0 10px;color:#555;font-size:13px;font-weight:600">Suas credenciais de acesso:</p>
                <p style="margin:0 0 6px;font-size:14px;color:#333">📧 <strong>E-mail:</strong> <span style="font-family:monospace">${to}</span></p>
                <p style="margin:0;font-size:14px;color:#333">🔑 <strong>Senha:</strong> <span style="font-family:monospace;background:#fff;padding:2px 8px;border-radius:6px;border:1px solid #dde">${tempPassword}</span></p>
              </td></tr>
            </table>` : ''}
            <a href="${inviteLink}"
              style="display:inline-block;background:#1565C0;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;">
              Acessar o sistema →
            </a>
            <p style="margin:24px 0 0;color:#999;font-size:12px;">
              ⚠️ Recomendamos alterar a senha após o primeiro acesso.<br>
              Se você não solicitou este acesso, ignore este email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#F8FAFF;padding:16px 32px;border-top:1px solid #EEF2FF;">
            <p style="margin:0;color:#aaa;font-size:11px;text-align:center;">
              © Globo Água · contato@globoagua.com.br
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  })
}
