export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const spreadsheetId = (globalThis as any).process?.env?.GOOGLE_SHEETS_SPREADSHEET_ID as
      | string
      | undefined;
    const credsPath = (globalThis as any).process?.env?.GOOGLE_SERVICE_ACCOUNT_PATH as
      | string
      | undefined;
    if (!spreadsheetId || !credsPath) {
      return new Response(JSON.stringify({ ok: false, error: 'Google Sheets not configured' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { google } = await import('googleapis');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const projectRoot = process.cwd();
    let absoluteCreds = path.resolve(projectRoot, credsPath);
    try {
      await (await import('node:fs/promises')).stat(absoluteCreds);
    } catch {
      absoluteCreds = path.resolve(projectRoot, '..', credsPath);
    }
    const raw = await fs.readFile(absoluteCreds, 'utf-8');
    const creds = JSON.parse(raw);

    const jwt = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    const sheets = google.sheets({ version: 'v4', auth: jwt });

    const valuesRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:K',
    });
    const rows = valuesRes.data.values ?? [];
    if (rows.length < 2) {
      return new Response(JSON.stringify({ ok: false, error: 'No data' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const header = rows[0];
    const idIdx = header.indexOf('id');
    const match = rows.find((r) => r[idIdx] === params.id);
    if (!match) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Reconstruct a minimal report response based on columns we stored
    const obj: any = {};
    header.forEach((h: string, i: number) => (obj[h] = match[i]));
    return new Response(JSON.stringify({ ok: true, report: obj }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message ?? 'unknown' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}


