/**
 * Server-side Gemini AI integration for food scanning.
 * This module MUST only be imported in server-side code (API routes).
 * The API key is never exposed to the client.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { foodScanAnalysisSchema } from '@/lib/validation/schemas';
import type { FoodScanAnalysis } from '@/types';

export const DEFAULT_PRIMARY_MODEL = 'gemini-2.0-flash';
export const DEFAULT_FALLBACK_MODELS = [
  'gemini-1.5-flash',
];

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const ANALYSIS_TIMEOUT_MS = 30_000;
const MAX_RETRIES_PER_MODEL = 2;
const INITIAL_BACKOFF_MS = 1000;

export function getModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_PRIMARY_MODEL;
  const envFallbacks = process.env.GEMINI_FALLBACK_MODELS
    ? process.env.GEMINI_FALLBACK_MODELS.split(',')
        .map((m) => m.trim())
        .filter(Boolean)
    : DEFAULT_FALLBACK_MODELS;

  const candidates = [primary];
  for (const m of envFallbacks) {
    if (!candidates.includes(m)) {
      candidates.push(m);
    }
  }
  return candidates;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const ANALYSIS_PROMPT = `
Kamu adalah asisten analisis nutrisi yang membantu pengguna memperkirakan kandungan nutrisi makanan dari foto.

Analisis gambar makanan yang diberikan dan kembalikan HANYA JSON valid (tanpa markdown, tanpa penjelasan di luar JSON) dengan struktur berikut:

{
  "items": [
    {
      "name": "Nama makanan dalam bahasa Indonesia",
      "estimatedWeightGrams": 200,
      "servingDescription": "Sekitar 1 porsi / 200 gram",
      "caloriesKcal": 260,
      "proteinGrams": 5.0,
      "carbsGrams": 57.0,
      "fatGrams": 1.0,
      "confidence": "medium",
      "estimationNotes": "Penjelasan singkat tentang estimasi dan ketidakpastian"
    }
  ],
  "overallNotes": [
    "Catatan penting tentang estimasi keseluruhan"
  ]
}

Aturan penting:
- Semua nilai numerik harus >= 0 (tidak boleh negatif)
- confidence harus salah satu dari: "low", "medium", "high"
- Jika makanan tidak teridentifikasi, kembalikan items kosong: []
- Jika foto tidak mengandung makanan, kembalikan items kosong dengan overallNotes yang menjelaskan
- Pisahkan komponen makanan yang jelas berbeda (misal: nasi dan lauk)
- Untuk makanan campuran, gabungkan dalam satu item dengan estimasi total
- Selalu cantumkan ketidakpastian dalam estimationNotes (minyak, saus, bahan tersembunyi)
- caloriesKcal harus konsisten dengan proteinGrams×4 + carbsGrams×4 + fatGrams×9
- Perkiraan berat dalam gram adalah estimasi visual — cantumkan ketidakpastian
`.trim();

// ─── Image Validation ─────────────────────────────────────────────────────────

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(
  mimeType: string,
  sizeBytes: number,
): ImageValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Tipe file tidak didukung. Gunakan JPEG, PNG, WebP, atau HEIC.`,
    };
  }
  if (sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimum 10 MB.`,
    };
  }
  return { valid: true };
}

// ─── Analysis ─────────────────────────────────────────────────────────────────

export interface AnalyzeImageResult {
  success: true;
  analysis: FoodScanAnalysis;
  rawText?: string;
  modelUsed?: string;
}

export interface AnalyzeImageError {
  success: false;
  error: string;
  code: 'API_KEY_MISSING' | 'VALIDATION_ERROR' | 'PARSE_ERROR' | 'API_ERROR' | 'TIMEOUT';
}

export type AnalyzeImageResponse = AnalyzeImageResult | AnalyzeImageError;

/**
 * Analyze a food image using Google Gemini with fallback models and retry logic.
 *
 * Strategy:
 * 1. Try the primary model (gemini-3.6-flash)
 * 2. If it fails (unavailable / high demand / 429 / 503), retry up to MAX_RETRIES_PER_MODEL
 *    with exponential backoff
 * 3. If primary model is exhausted or fails, automatically fall through to the next
 *    fallback models:
 *      - gemini-2.5-flash-lite-preview-06-17
 *      - gemini-2.0-flash
 *
 * @param imageBase64 - Base64-encoded image data (without data: prefix)
 * @param mimeType    - MIME type of the image
 */
export async function analyzeFood(
  imageBase64: string,
  mimeType: string,
): Promise<AnalyzeImageResponse> {
  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error:
        'Gemini API key belum dikonfigurasi. Tambahkan GEMINI_API_KEY ke file .env.local.',
      code: 'API_KEY_MISSING',
    };
  }

  // Validate image
  const sizeBytes = Buffer.byteLength(imageBase64, 'base64');
  const validation = validateImage(mimeType, sizeBytes);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error!,
      code: 'VALIDATION_ERROR',
    };
  }

  // Initialize Gemini client
  const genAI = new GoogleGenerativeAI(apiKey);
  const candidates = getModelCandidates();
  let lastErrorMsg = '';
  let lastErrorCode: AnalyzeImageError['code'] = 'API_ERROR';

  for (const modelName of candidates) {
    let attempt = 0;
    while (attempt < MAX_RETRIES_PER_MODEL) {
      attempt++;
      try {
        console.log(`[gemini] Trying model ${modelName} (attempt ${attempt}/${MAX_RETRIES_PER_MODEL})...`);
        const model = genAI.getGenerativeModel({ model: modelName });

        const analysisPromise = model.generateContent([
          ANALYSIS_PROMPT,
          {
            inlineData: {
              mimeType,
              data: imageBase64,
            },
          },
        ]);

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('TIMEOUT')),
            ANALYSIS_TIMEOUT_MS,
          ),
        );

        const result = await Promise.race([analysisPromise, timeoutPromise]);
        const rawText = result.response.text().trim();

        // Extract JSON from response
        let jsonText = rawText;
        const jsonMatch = rawText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          jsonText = jsonMatch[1].trim();
        }

        // Parse JSON
        let parsed: unknown;
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          console.warn(`[gemini] Failed to parse JSON from model ${modelName}`);
          lastErrorMsg = 'Respons AI tidak dapat diproses (format JSON tidak valid).';
          lastErrorCode = 'PARSE_ERROR';
          break; // Move to next candidate model
        }

        // Validate with Zod
        const schemaValidation = foodScanAnalysisSchema.safeParse(parsed);
        if (!schemaValidation.success) {
          console.warn(
            `[gemini] Schema validation failed on model ${modelName}:`,
            schemaValidation.error,
          );
          lastErrorMsg = 'Format respons AI tidak sesuai skema nutrisi.';
          lastErrorCode = 'PARSE_ERROR';
          break; // Move to next candidate model
        }

        return {
          success: true,
          analysis: schemaValidation.data,
          rawText,
          modelUsed: modelName,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        lastErrorMsg = message;

        if (message === 'TIMEOUT') {
          console.warn(`[gemini] Model ${modelName} timed out.`);
          lastErrorCode = 'TIMEOUT';
          break; // Move to next candidate model
        }

        console.warn(
          `[gemini] Model ${modelName} error on attempt ${attempt}: ${message}`,
        );

        // Exponential backoff if more attempts remain for this model
        if (attempt < MAX_RETRIES_PER_MODEL) {
          await new Promise((resolve) =>
            setTimeout(resolve, INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1)),
          );
        }
      }
    }
  }

  return {
    success: false,
    error: `Semua model AI (${candidates.join(', ')}) gagal memproses. Terakhir: ${lastErrorMsg || 'Kesalahan tidak diketahui'}`,
    code: lastErrorCode,
  };
}
