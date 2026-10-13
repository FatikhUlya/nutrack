import { NextRequest, NextResponse } from 'next/server';
import { analyzeFood, validateImage } from '@/lib/ai/gemini';
import type { FoodScanAnalysis } from '@/types';

// Fallback demo dish for when Gemini API key is not configured or offline
const SAMPLE_DEMO_MEAL: FoodScanAnalysis = {
  items: [
    {
      name: 'Nasi Putih Pulen',
      estimatedWeightGrams: 150,
      servingDescription: '1 mangkuk sedang (sekitar 150g)',
      caloriesKcal: 195,
      proteinGrams: 3.8,
      carbsGrams: 42.8,
      fatGrams: 0.4,
      confidence: 'high',
      estimationNotes: 'Estimasi visual porsi mangkuk standar',
    },
    {
      name: 'Ayam Bakar Dada Tanpa Kulit',
      estimatedWeightGrams: 140,
      servingDescription: '1 potong dada ayam bakar (140g)',
      caloriesKcal: 230,
      proteinGrams: 44.0,
      carbsGrams: 3.0,
      fatGrams: 4.5,
      confidence: 'high',
      estimationNotes: 'Bumbu bakar manis tipis dengan sedikit kecap',
    },
    {
      name: 'Tempe Bacem',
      estimatedWeightGrams: 50,
      servingDescription: '1 potong tempe bacem goreng (50g)',
      caloriesKcal: 120,
      proteinGrams: 9.5,
      carbsGrams: 6.0,
      fatGrams: 6.5,
      confidence: 'medium',
      estimationNotes: 'Termasuk penyerapan minyak goreng',
    },
    {
      name: 'Sambal Terasi & Lalapan Segar',
      estimatedWeightGrams: 40,
      servingDescription: '1 sdm sambal terasi + timun kemangi (40g)',
      caloriesKcal: 45,
      proteinGrams: 1.2,
      carbsGrams: 4.0,
      fatGrams: 2.8,
      confidence: 'medium',
      estimationNotes: 'Kandungan minyak cabai pada sambal',
    },
  ],
  overallNotes: [
    'Mode Demonstrasi: Gemini API key belum diisi di .env.local, menampilkan contoh menu makan siang khas Indonesia yang kaya protein.',
    'Anda dapat menyesuaikan porsi dan gramatur sebelum menyimpan ke buku harian.',
  ],
};

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
      // Simulate realistic analysis processing time for demo mode
      await new Promise(r => setTimeout(r, 1200));

      return NextResponse.json({
        success: true,
        analysis: SAMPLE_DEMO_MEAL,
        isDemo: true,
        message: 'Hasil demonstrasi disajikan karena GEMINI_API_KEY belum dikonfigurasi.',
      });
    }

    // Call Gemini AI
    const result = await analyzeFood(imageBase64, mimeType);

    if (!result.success) {
      // If error is API_KEY_MISSING, fallback gracefully
      if (result.code === 'API_KEY_MISSING') {
        return NextResponse.json({
          success: true,
          analysis: SAMPLE_DEMO_MEAL,
          isDemo: true,
        });
      }

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
