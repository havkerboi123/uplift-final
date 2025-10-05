module.exports = [
"[project]/.next-internal/server/app/api/analyze/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

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
"[project]/app/api/analyze/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// Use standard Web APIs to avoid Node/Next type dependencies
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
function generateTwoDigitId() {
    return String(Math.floor(Math.random() * 90) + 10); // 10..99
}
function arrayBufferToBase64(ab) {
    const bytes = new Uint8Array(ab);
    let binary = '';
    for(let i = 0; i < bytes.length; i++)binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}
async function fileToDataUrl(file) {
    const base64 = arrayBufferToBase64(await file.arrayBuffer());
    const mime = file.type || 'image/png';
    return `data:${mime};base64,${base64}`;
}
const SIMPLE_MEDICAL_PROMPT = `You are a medical report analyzer that helps patients understand their test results in simple language.

Return STRICT JSON with keys: type (string), levels (array of {name, value, reference_range, what_it_is, your_level_means, why_it_matters, possible_causes}), concerns (array of strings).
No extra text. If unknown, use null or empty arrays.
`;
async function POST(req) {
    try {
        const form = await req.formData();
        const file = form.get('image');
        if (!(file instanceof File)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'No image file provided',
                message: 'Upload a PNG with key "image"'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        const filename = file.name || 'upload.png';
        const lower = filename.toLowerCase();
        if (!lower.endsWith('.png')) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid file format',
                message: 'Only .png is accepted'
            }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        const imageDataUri = await fileToDataUrl(file);
        const apiKey = globalThis.process?.env?.OPENAI_API_KEY;
        if (!apiKey) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Server misconfigured',
                message: 'OPENAI_API_KEY not set'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        // Call OpenAI Chat Completions to get structured JSON back
        const chatBody = {
            model: 'gpt-4o-2024-08-06',
            temperature: 0.3,
            messages: [
                {
                    role: 'system',
                    content: SIMPLE_MEDICAL_PROMPT
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: 'Analyze this medical report and return strict JSON.'
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: imageDataUri
                            }
                        }
                    ]
                }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'medical_report_analysis',
                    schema: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            type: {
                                type: 'string'
                            },
                            levels: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    additionalProperties: false,
                                    properties: {
                                        name: {
                                            type: 'string'
                                        },
                                        value: {
                                            type: 'string'
                                        },
                                        reference_range: {
                                            type: [
                                                'string',
                                                'null'
                                            ]
                                        },
                                        what_it_is: {
                                            type: 'string'
                                        },
                                        your_level_means: {
                                            type: 'string'
                                        },
                                        why_it_matters: {
                                            type: 'string'
                                        },
                                        possible_causes: {
                                            type: [
                                                'string',
                                                'null'
                                            ]
                                        }
                                    },
                                    required: [
                                        'name',
                                        'value',
                                        'reference_range',
                                        'what_it_is',
                                        'your_level_means',
                                        'why_it_matters',
                                        'possible_causes'
                                    ]
                                }
                            },
                            concerns: {
                                type: 'array',
                                items: {
                                    type: 'string'
                                }
                            }
                        },
                        required: [
                            'type',
                            'levels',
                            'concerns'
                        ]
                    },
                    strict: true
                }
            }
        };
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify(chatBody)
        });
        if (!resp.ok) {
            const text = await resp.text();
            return new Response(JSON.stringify({
                success: false,
                error: 'OpenAI request failed',
                message: text
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        const json = await resp.json();
        const content = json?.choices?.[0]?.message?.content;
        let data = null;
        try {
            data = typeof content === 'string' ? JSON.parse(content) : null;
        } catch  {
            // fallback: try to coerce
            data = null;
        }
        if (!data) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Parsing error',
                message: 'Failed to parse analysis JSON'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }
        const id = generateTwoDigitId();
        // Save to Google Sheets (best-effort)
        try {
            const sheetResp = await fetch(`${new URL(req.url).origin}/api/report/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id,
                    data
                })
            });
            // ignore failures; continue returning analysis
            await sheetResp.text().catch(()=>{});
        } catch  {}
        return new Response(JSON.stringify({
            success: true,
            id,
            timestamp: new Date().toISOString(),
            data
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Analysis failed',
            message: err?.message ?? 'Unknown error'
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

//# sourceMappingURL=%5Broot-of-the-server%5D__f5cba0e9._.js.map