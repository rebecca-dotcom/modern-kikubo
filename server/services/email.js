const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

async function sendMail({ to, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
    console.log(`[email skipped — no credentials] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: `"Modern Kikubo" <${process.env.GMAIL_USER}>`, to, subject, html });
    console.log(`[email sent] To: ${to} | ${subject}`);
  } catch (err) {
    console.error(`[email error] ${err.message}`);
  }
}

function orderPlacedVendor({ vendorEmail, vendorName, orderId, items, total, address }) {
  return sendMail({
    to: vendorEmail,
    subject: '🛍️ New order received — Modern Kikubo',
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#2F7D5B">New order on Modern Kikubo!</h2>
        <p>Hi ${vendorName},</p>
        <p>You have a new order <strong>#${orderId.slice(-6).toUpperCase()}</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:1rem 0">
          ${items.map(i => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee">${i.title}</td><td style="text-align:right;padding:6px 0;border-bottom:1px solid #eee">UGX ${i.price.toLocaleString()}</td></tr>`).join('')}
          <tr><td style="padding:8px 0;font-weight:bold">Total</td><td style="text-align:right;font-weight:bold">UGX ${total.toLocaleString()}</td></tr>
        </table>
        <p>📍 Delivery address: <strong>${address}</strong></p>
        <p>Log in to your dashboard to prepare the order.</p>
        <a href="http://localhost:5173/vendor" style="display:inline-block;background:#2F7D5B;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:1rem">Go to dashboard →</a>
      </div>
    `,
  });
}

function orderStatusBuyer({ buyerEmail, buyerName, orderId, status }) {
  const messages = {
    PICKED_UP: { emoji: '🛵', text: 'Your order is on the way!', sub: 'Your boda rider has picked up your order and is heading to you.' },
    DELIVERED: { emoji: '✅', text: 'Your order has been delivered!', sub: 'We hope you love your new items. Thank you for shopping on Modern Kikubo.' },
  };
  const msg = messages[status];
  if (!msg) return Promise.resolve();

  return sendMail({
    to: buyerEmail,
    subject: `${msg.emoji} ${msg.text} — Modern Kikubo`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:auto">
        <h2 style="color:#2F7D5B">${msg.emoji} ${msg.text}</h2>
        <p>Hi ${buyerName},</p>
        <p>${msg.sub}</p>
        <p>Order: <strong>#${orderId.slice(-6).toUpperCase()}</strong></p>
        <a href="http://localhost:5173/orders" style="display:inline-block;background:#2F7D5B;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;margin-top:1rem">Track my order →</a>
      </div>
    `,
  });
}

module.exports = { orderPlacedVendor, orderStatusBuyer };
