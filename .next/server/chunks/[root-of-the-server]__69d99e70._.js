module.exports = [
"[project]/.next-internal/server/app/api/report/save/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/api/report/save/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Save analysis to Google Sheets using a service account JSON file in project root
// Requires env: GOOGLE_SHEETS_SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_PATH (relative to repo root)
__turbopack_context__.s([
    "POST",
    ()=>POST,
    "revalidate",
    ()=>revalidate,
    "runtime",
    ()=>runtime
]);
const runtime = 'nodejs';
const revalidate = 0;
async function POST(req) {
    try {
        const body = await req.json();
        if (!body?.id || !body?.data) {
            return new Response(JSON.stringify({
                ok: false,
                error: 'Invalid payload'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        const spreadsheetId = globalThis.process?.env?.GOOGLE_SHEETS_SPREADSHEET_ID;
        const credsPath = globalThis.process?.env?.GOOGLE_SERVICE_ACCOUNT_PATH;
        if (!spreadsheetId || !credsPath) {
            return new Response(JSON.stringify({
                ok: false,
                error: 'Google Sheets not configured'
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        // Dynamically import googleapis to keep cold starts lighter
        const { google } = await __turbopack_context__.A("[project]/node_modules/googleapis/build/src/index.js [app-route] (ecmascript, async loader)");
        const fs = await __turbopack_context__.A("[externals]/node:fs/promises [external] (node:fs/promises, cjs, async loader)");
        const path = await __turbopack_context__.A("[externals]/node:path [external] (node:path, cjs, async loader)");
        const projectRoot = process.cwd();
        // Try provided path relative to project root; if not found, try demo/..
        let absoluteCreds = path.resolve(projectRoot, credsPath);
        try {
            await fs.stat(absoluteCreds);
        } catch  {
            absoluteCreds = path.resolve(projectRoot, '..', credsPath);
        }
        const raw = await fs.readFile(absoluteCreds, 'utf-8');
        const creds = JSON.parse(raw);
        const jwt = new google.auth.JWT({
            email: creds.client_email,
            key: creds.private_key,
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets'
            ]
        });
        const sheets = google.sheets({
            version: 'v4',
            auth: jwt
        });
        const timestamp = new Date().toISOString();
        const concernsSummary = (body.data.concerns ?? []).join(' | ') || 'None';
        const parameterNames = body.data.levels.map((l)=>l.name).join(', ');
        const values = body.data.levels.map((l)=>l.value).join(', ');
        const referenceRanges = body.data.levels.map((l)=>l.reference_range ?? 'N/A').join(', ');
        const whatItIsAll = body.data.levels.map((l)=>`${l.name}: ${l.what_it_is}`).join(' || ');
        const yourLevelMeansAll = body.data.levels.map((l)=>`${l.name}: ${l.your_level_means}`).join(' || ');
        const whyItMattersAll = body.data.levels.map((l)=>`${l.name}: ${l.why_it_matters}`).join(' || ');
        const possibleCausesAll = body.data.levels.map((l)=>`${l.name}: ${l.possible_causes ?? 'N/A'}`).join(' || ');
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
                                'concerns_summary'
                            ]
                        ]
                    }
                ]
            }
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
                        concernsSummary
                    ]
                ]
            }
        });
        return new Response(JSON.stringify({
            ok: true
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (e) {
        return new Response(JSON.stringify({
            ok: false,
            error: e?.message ?? 'unknown'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__69d99e70._.js.map