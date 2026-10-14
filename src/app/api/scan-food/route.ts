import { NextRequest, NextResponse } from 'next/server';
import { analyzeFood, validateImage } from '@/lib/ai/gemini';
import type { FoodScanAnalysis } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    let imageBase64 = '';
    let mimeType = 'image/jpeg';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: 'Tidak ada file gambar yang diunggah.' },
          { status: 400 },
        );
      }

      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      imageBase64 = buffer.toString('base64');
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      imageBase64 = body.image ?? '';
      mimeType = body.mimeType ?? 'image/jpeg';

      // Strip data url prefix if included
      if (imageBase64.includes('base64,')) {
        const parts = imageBase64.split('base64,');
        imageBase64 = parts[1];
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'Content-Type tidak didukung.' },
        { status: 400 },
      );
    }

    if (!imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Gambar tidak ditemukan.' },
        { status: 400 },
      );
    }

    // Check if GEMINI_API_KEY is configured
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'GEMINI_API_KEY belum dikonfigurasi di file .env.local server.',
        code: 'API_KEY_MISSING',
      }, { status: 400 });
    }

    // Call Gemini AI
    const result = await analyzeFood(imageBase64, mimeType);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.code },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      modelUsed: result.modelUsed,
      isDemo: false,
    });
  } catch (err) {
    console.error('Scan food API error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan sistem saat memproses gambar.',
      },
      { status: 500 },
    );
  }
}
