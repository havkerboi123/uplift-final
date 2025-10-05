// Save analysis to Google Sheets using a service account JSON file in project root
// Requires env: GOOGLE_SHEETS_SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_PATH (relative to repo root)

export const runtime = 'nodejs';
export const revalidate = 0;

type SaveBody = {
  id: string;
  data: {
    type: string;
    levels: Array<{
      name: string;
      value: string;
      reference_range?: string | null;
      what_it_is: string;
      your_level_means: string;
      why_it_matters: string;
      possible_causes?: string | null;
    }>;
    concerns: string[];
  };
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SaveBody;
    if (!body?.id || !body?.data) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const spreadsheetId = (globalThis as any).process?.env?.GOOGLE_SHEETS_SPREADSHEET_ID as
      | string
      | undefined;
    const credsPath = (globalThis as any).process?.env?.GOOGLE_SERVICE_ACCOUNT_PATH as
      | string
      | undefined;

    if (!spreadsheetId || !credsPath) {
      return new Response(JSON.stringify({ ok: false, error: 'Google Sheets not configured' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Dynamically import googleapis to keep cold starts lighter
    const { google } = await import('googleapis');
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const projectRoot = process.cwd();
    // Try provided path relative to project root; if not found, try demo/..
    let absoluteCreds = path.resolve(projectRoot, credsPath);
    try {
      await fs.stat(absoluteCreds);
    } catch {
      absoluteCreds = path.resolve(projectRoot, '..', credsPath);
    }
    const raw = await fs.readFile(absoluteCreds, 'utf-8');
    const creds = JSON.parse(raw);

    const jwt = new google.auth.JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const sheets = google.sheets({ version: 'v4', auth: jwt });

    const timestamp = new Date().toISOString();
    const concernsSummary = (body.data.concerns ?? []).join(' | ') || 'None';
    const parameterNames = body.data.levels.map((l) => l.name).join(', ');
    const values = body.data.levels.map((l) => l.value).join(', ');
    const referenceRanges = body.data.levels
      .map((l) => (l.reference_range ?? 'N/A'))
      .join(', ');
    const whatItIsAll = body.data.levels.map((l) => `${l.name}: ${l.what_it_is}`).join(' || ');
    const yourLevelMeansAll = body.data.levels
      .map((l) => `${l.name}: ${l.your_level_means}`)
      .join(' || ');
    const whyItMattersAll = body.data.levels
      .map((l) => `${l.name}: ${l.why_it_matters}`)
      .join(' || ');
    const possibleCausesAll = body.data.levels
      .map((l) => `${l.name}: ${l.possible_causes ?? 'N/A'}`)
      .join(' || ');

    // Ensure header row exists in A1:K1
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data: [
          {
            range: 'Sheet1!A1:K1',
            values: [
              [
                'id',
                'timestamp',
                'test_type',
                'parameter_name',
                'value',
                'reference_range',
                'what_it_is',
                'your_level_means',
                'why_it_matters',
                'possible_causes',
                'concerns_summary',
              ],
            ],
          },
        ],
      },
    });

    // Append row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Sheet1!A:K',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            body.id,
            timestamp,
            body.data.type,
            parameterNames,
            values,
            referenceRanges,
            whatItIsAll,
            yourLevelMeansAll,
            whyItMattersAll,
            possibleCausesAll,
            concernsSummary,
          ],
        ],
      },
    });

    return new Response(JSON.stringify({ ok: true }), {
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


