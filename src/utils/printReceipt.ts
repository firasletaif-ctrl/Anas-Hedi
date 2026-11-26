import { Order } from '../types';

export function printReceipt(order: Order) {
  const win = window.open('', '_blank', 'width=420,height=650');
  if (!win) {
    window.print();
    return;
  }

  const itemsHtml = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:6px 0;">${i.quantity}x ${i.name}</td>
        <td style="padding:6px 0;text-align:right;">${(i.price * i.quantity).toFixed(2)} DT</td>
      </tr>`
    )
    .join('');

  const promoHtml = order.promoCode
    ? `<tr>
        <td style="padding:4px 0;color:#16a34a;">Promo (${order.promoCode})</td>
        <td style="padding:4px 0;text-align:right;color:#16a34a;">-${Number(order.discountAmount || 0).toFixed(2)} DT</td>
      </tr>`
    : '';

  win.document.write(`
    <!doctype html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>Reçu ${order.id} — ZoneStore</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 24px; color: #0a0a0a; max-width: 360px; margin: 0 auto; }
          h1 { font-size: 18px; margin: 0 0 4px; text-align: center; }
          .sub { font-size: 11px; color: #666; text-align: center; margin-bottom: 16px; }
          .line { border-top: 1px dashed #999; margin: 12px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .total { font-size: 15px; font-weight: bold; }
          .info { font-size: 11px; color: #333; line-height: 1.5; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>ZONESTORE</h1>
        <div class="sub">Ticket de caisse · ${order.id}<br/>${new Date(order.createdAt).toLocaleString('fr-FR')}</div>
        <div class="line"></div>
        <div class="info">
          <strong>Client :</strong> ${order.customerName}<br/>
          <strong>Adresse :</strong> ${order.customerAddress}
        </div>
        <div class="line"></div>
        <table>
          ${itemsHtml}
          ${promoHtml}
        </table>
        <div class="line"></div>
        <table>
          <tr class="total">
            <td>TOTAL PAYÉ</td>
            <td style="text-align:right;">${order.total.toFixed(2)} DT</td>
          </tr>
        </table>
        <div class="line"></div>
        <div class="sub">Merci pour votre confiance !<br/>Suivez votre commande avec le n° ${order.id}</div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `);
  win.document.close();
}
