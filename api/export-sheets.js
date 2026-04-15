import { google } from 'googleapis';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // 1. Fetch data from Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/solicitudes?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );
    const solicitudes = await response.json();

    // 2. Build the data array
    const headers = ["ID", "Fecha", "Solicitado Por", "Cliente", "Concepto", "Proyecto", "Tipo Servicio", "Valor", "Moneda", "IVA", "Retención", "Forma Pago", "Estado", "Aprobado Por", "Fecha Aprobación", "# Factura", "Fecha Facturación", "Mes", "Observaciones"];
    const rows = solicitudes.map((s) => [
      `FAC-${String(s.id).padStart(3, '0')}`,
      s.fecha || '',
      s.solicitado_por || '',
      s.cliente || '',
      s.concepto || '',
      s.proyecto || '',
      s.tipo_servicio || '',
      String(s.valor || ''),
      s.moneda || '',
      s.incluye_iva ? 'Sí' : 'No',
      s.aplica_retencion ? 'Sí' : 'No',
      s.forma_pago || '',
      s.estado || '',
      s.aprobado_por || '',
      s.fecha_aprobacion || '',
      s.num_factura || '',
      s.fecha_facturacion || '',
      s.mes_facturacion || '',
      s.observaciones || '',
    ]);

    // 3. Authenticate with Google using service account
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'],
    });
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 4. Create the spreadsheet
    const today = new Date().toISOString().slice(0, 10);
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: { title: `Facturación Flash - ${today}` },
      },
    });
    const spreadsheetId = spreadsheet.data.spreadsheetId;

    // 5. Populate with data
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'Sheet1!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [headers, ...rows] },
    });

    // 6. Format header row (bold + background color)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: { sheetId: 0, startRowIndex: 0, endRowIndex: 1 },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.898, green: 0.224, blue: 0.208 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: { sheetId: 0, dimension: 'COLUMNS', startIndex: 0, endIndex: 19 },
            },
          },
        ],
      },
    });

    // 7. Share with the user's email
    const userEmail = process.env.GOOGLE_SHARE_EMAIL || 'mariana.rozo@somosflash.com';
    await drive.permissions.create({
      fileId: spreadsheetId,
      requestBody: { type: 'user', role: 'writer', emailAddress: userEmail },
      sendNotificationEmail: false,
    });

    const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
    return res.status(200).json({ success: true, url, count: solicitudes.length });
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ error: error.message || 'Error creating Google Sheet' });
  }
}
