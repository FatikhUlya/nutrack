'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Zap,
  Camera,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Plus,
  Minus,
} from 'lucide-react';
import { FoodIllustration } from '@/components/ui/FoodIllustration';
import type { FoodScanItem, FoodScanAnalysis, MealType, CreateFoodEntryInput } from '@/types';
import { MEAL_TYPE_LABELS } from '@/types';

interface FoodScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumptionDate: string;
  defaultMealType?: MealType;
  onSaveItems: (items: CreateFoodEntryInput[]) => void;
}

type ScanState = 'camera' | 'analyzing' | 'result';

function calculateNutritionScore(item: FoodScanItem): {
  grade: 'A' | 'B' | 'C' | 'D';
  color: string;
  description: string;
} {
  const { caloriesKcal, proteinGrams, fatGrams } = item;
  const proteinRatio = (proteinGrams * 4) / Math.max(1, caloriesKcal);
  const fatRatio = (fatGrams * 9) / Math.max(1, caloriesKcal);

  if (proteinRatio >= 0.3 && fatRatio <= 0.3)
    return { grade: 'A', color: '#22C55E', description: 'Sangat bergizi! Kaya protein berkualitas tinggi dan rendah lemak jenuh.' };
  if (proteinRatio >= 0.2 || (fatRatio <= 0.35 && caloriesKcal <= 500))
    return { grade: 'B', color: '#10B981', description: 'Sehat jika dikonsumsi seimbang. Mengandung makronutrien esensial.' };
  if (fatRatio <= 0.5)
    return { grade: 'C', color: '#F59E0B', description: 'Netral dengan nutrisi esensial namun ada lemak/gula yang cukup. Nikmati dengan porsi wajar.' };
  return { grade: 'D', color: '#EF4444', description: 'Tinggi kalori atau lemak jenuh. Perhatikan asupan makanan lain hari ini.' };
}

export function FoodScannerModal({
  isOpen,
  onClose,
  consumptionDate,
  defaultMealType = 'lunch',
  onSaveItems,
}: FoodScannerModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<ScanState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('Memindai makanan...');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodScanAnalysis | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [itemMultipliers, setItemMultipliers] = useState<Record<number, number>>({});
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [servingUnit, setServingUnit] = useState<string>('porsi (100g)');
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const applyTorch = useCallback(async (enabled: boolean) => {
    if (!mediaStreamRef.current) return;
    const track = mediaStreamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      await (track as any).applyConstraints({ advanced: [{ torch: enabled }] });
    } catch {
      // Device does not support torch
    }
  }, []);

  const startCameraStream = useCallback(async () => {
    if (!isOpen) return;
    setCameraPermissionDenied(false);
    try {
      stopCameraStream();
      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraPermissionDenied(true);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      const name = err instanceof Error ? err.name : '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setCameraPermissionDenied(true);
      }
      setCameraActive(false);
    }
  }, [isOpen, facingMode, stopCameraStream]);

  useEffect(() => {
    if (isOpen) {
      setScanState('camera');
      setError(null);
      setCapturedImage(null);
      setAnalysisResult(null);
      setPortionMultiplier(1.0);
      startCameraStream();
    } else {
      stopCameraStream();
      setFlashEnabled(false);
    }
    return () => stopCameraStream();
  }, [isOpen, startCameraStream, stopCameraStream]);

  useEffect(() => {
    applyTorch(flashEnabled);
  }, [flashEnabled, applyTorch]);

  const handleToggleCamera = () => setFacingMode((p) => (p === 'environment' ? 'user' : 'environment'));

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedImage(dataUrl);
        stopCameraStream();
        analyzeCapturedImage(dataUrl);
        return;
      }
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Harap pilih file gambar (JPG, PNG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedImage(dataUrl);
      stopCameraStream();
      analyzeCapturedImage(dataUrl);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const analyzeCapturedImage = async (dataUrl: string) => {
    setScanState('analyzing');
    setError(null);
    setAnalysisStep('Menghubungkan ke Gemini AI...');
    try {
      const response = await fetch('/api/scan-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Gagal menganalisis foto makanan.');
      setAnalysisResult(data.analysis);
      setIsDemoMode(Boolean(data.isDemo));
      if (data.modelUsed) setModelUsed(data.modelUsed);
      setPortionMultiplier(1.0);
      setActiveItemIndex(0);
      if (data.analysis.items?.[0]) setServingUnit(data.analysis.items[0].servingDescription || 'porsi (100g)');
      setScanState('result');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat memproses gambar.');
      setScanState('camera');
      startCameraStream();
    }
  };

  const handleRetake = () => {
    setScanState('camera');
    setCapturedImage(null);
    setAnalysisResult(null);
    setError(null);
    setPortionMultiplier(1.0);
    startCameraStream();
  };

  const handleClose = () => {
    stopCameraStream();
    onClose();
  };

  const handleConfirmSave = () => {
    if (!analysisResult?.items.length) return;
    const entriesToSave: CreateFoodEntryInput[] = analysisResult.items.map((item, idx) => {
      const mult = itemMultipliers[idx] ?? portionMultiplier;
      return {
        consumptionDate: consumptionDate || new Date().toISOString().split('T')[0],
        mealType: selectedMealType,
        foodName: item.name,
        quantity: Math.max(0.1, Number(mult.toFixed(1))),
        servingUnit: item.servingDescription || 'porsi',
        weightGrams: item.estimatedWeightGrams ? Math.round(item.estimatedWeightGrams * mult) : undefined,
        caloriesKcal: Math.round(item.caloriesKcal * mult),
        proteinG: Number((item.proteinGrams * mult).toFixed(1)),
        carbsG: Number((item.carbsGrams * mult).toFixed(1)),
        fatG: Number((item.fatGrams * mult).toFixed(1)),
        notes: item.estimationNotes ?? 'Dianalisis dengan Gemini AI',
        source: 'scanner',
        aiEstimated: true,
        estimationNotes: item.estimationNotes,
      };
    });
    onSaveItems(entriesToSave);
    handleClose();
  };

  if (!isOpen) return null;

  const currentItem = analysisResult?.items?.[activeItemIndex] ?? analysisResult?.items?.[0];
  const nutritionScore = currentItem ? calculateNutritionScore(currentItem) : null;
  const activeMultiplier = itemMultipliers[activeItemIndex] ?? portionMultiplier;
  const activeCalories = currentItem ? Math.round(currentItem.caloriesKcal * activeMultiplier) : 0;
  const activeProtein = currentItem ? Math.round(currentItem.proteinGrams * activeMultiplier) : 0;
  const activeCarbs = currentItem ? Math.round(currentItem.carbsGrams * activeMultiplier) : 0;
  const activeFat = currentItem ? Math.round(currentItem.fatGrams * activeMultiplier) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl overflow-hidden bg-black flex flex-col shadow-2xl border border-white/10">

        {/* VIEW 1: CAMERA */}
        {scanState === 'camera' && (
          <div className="relative flex-1 flex flex-col bg-black overflow-hidden" style={{ minHeight: '100dvh' }}>

            {/* Live video */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* No-camera fallback */}
            {!cameraActive && (
              <div className="absolute inset-0 bg-gradient-to-b from-[#0D1F0D] via-[#111] to-[#0A120A] flex flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent animate-pulse">
                  <Camera className="h-9 w-9" />
                </div>
                {cameraPermissionDenied ? (
                  <>
                    <h3 className="text-white font-bold text-base mt-2">Izin Kamera Diperlukan</h3>
                    <p className="text-white/50 text-xs max-w-xs leading-relaxed">
                      Aktifkan izin kamera di pengaturan browser, atau gunakan tombol galeri di bawah.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-white text-sm font-bold active:scale-95 transition-all"
                    >
                      <ImageIcon className="h-4 w-4" />
                      Buka Galeri
                    </button>
                  </>
                ) : (
                  <>
                    <h3 className="text-white font-bold text-base mt-2">Memulai Kamera...</h3>
                    <p className="text-white/40 text-xs">Pastikan izin kamera sudah diaktifkan</p>
                  </>
                )}
              </div>
            )}

            {/* Floating Header */}
            <div
              className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 pt-12 pb-6"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)' }}
            >
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm border border-white/15 hover:bg-black/60 active:scale-95 transition-all"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setFlashEnabled((f) => !f)}
                className={`flex h-10 px-4 items-center gap-2 rounded-full backdrop-blur-sm border transition-all active:scale-95 ${
                  flashEnabled
                    ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_14px_rgba(250,204,21,0.7)]'
                    : 'bg-black/40 text-white border-white/15 hover:bg-black/60'
                }`}
                aria-label="Toggle Flash"
              >
                <Zap className="h-4 w-4" fill={flashEnabled ? 'currentColor' : 'none'} />
                <span className="text-xs font-bold">A</span>
              </button>
            </div>

            {/* Viewfinder overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                <div className="absolute top-0 left-0 w-7 h-7 border-t-[3px] border-l-[3px] border-accent rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-7 h-7 border-t-[3px] border-r-[3px] border-accent rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-7 h-7 border-b-[3px] border-l-[3px] border-accent rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-7 h-7 border-b-[3px] border-r-[3px] border-accent rounded-br-lg" />
                <div className="absolute inset-4 grid grid-cols-3 grid-rows-3 opacity-20">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-white" />
                  ))}
                </div>
                {cameraActive && (
                  <div
                    className="absolute left-4 right-4 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-80 animate-pulse"
                    style={{ top: '50%' }}
                  />
                )}
              </div>
            </div>

            {/* Error banner */}
            {error && (
              <div
                className="absolute z-20 left-4 right-4 rounded-xl bg-red-600/90 text-white p-3 text-xs flex items-center gap-2 backdrop-blur-md border border-red-400/30"
                style={{ bottom: '7rem' }}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Floating Footer */}
            <div
              className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-8 pb-10 pt-8"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)' }}
            >
              {/* Gallery */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white hover:bg-white/25 active:scale-95 transition-all"
                aria-label="Pilih dari Galeri"
              >
                <ImageIcon className="h-6 w-6" />
              </button>

              {/* Shutter */}
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="flex h-20 w-20 items-center justify-center rounded-full transition-all active:scale-90 hover:scale-105"
                aria-label="Ambil Foto"
              >
                <div className="w-full h-full rounded-full border-[3px] border-white/80 p-1.5 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.25)]">
                  <div className="w-full h-full rounded-full bg-white shadow-inner" />
                </div>
              </button>

              {/* Flip camera */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-white hover:bg-white/25 active:scale-95 transition-all"
                aria-label="Ganti Kamera"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>

          </div>
        )}

        {/* VIEW 2: ANALYZING */}
        {scanState === 'analyzing' && (
          <div className="relative flex-1 flex flex-col bg-black min-h-[580px]">
            <div className="relative flex-1 overflow-hidden flex items-center justify-center">
              {capturedImage ? (
                <img src={capturedImage} alt="Captured food" className="w-full h-full object-cover filter brightness-75" />
              ) : (
                <div className="w-full h-full bg-[#1C261C] flex items-center justify-center">
                  <FoodIllustration type="burger" size={140} />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-72 h-72 border-2 border-accent/60 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-30">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border border-white/40" />
                    ))}
                  </div>
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_15px_#F97316] animate-pulse top-1/2" />
                </div>
              </div>
            </div>
            <div className="relative z-20 bg-white rounded-t-3xl pt-8 pb-10 px-6 flex flex-col items-center justify-center shadow-2xl">
              <div className="relative w-14 h-14 mb-4">
                <div className="w-14 h-14 rounded-full border-4 border-orange-100 border-t-accent animate-spin" />
              </div>
              <h3 className="text-base font-extrabold text-[#1A2E1A] tracking-tight">Scanning in progress</h3>
              <p className="text-xs text-[#7A9A7A] mt-1">{analysisStep}</p>
            </div>
          </div>
        )}

        {/* VIEW 3: RESULT */}
        {scanState === 'result' && currentItem && (
          <div className="relative flex-1 flex flex-col bg-[#202326] overflow-y-auto max-h-[92vh] text-[#F4F5F6] font-sans">
            <div className="flex items-center justify-between px-5 pt-5 pb-2 border-b border-[#2D3134]">
              <button
                type="button"
                onClick={handleRetake}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17191B] text-[#D6FF3F] hover:bg-[#292D30] active:scale-95 transition-all"
                aria-label="Kembali / Foto Ulang"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>
              <div className="flex items-center gap-1.5 bg-[#D6FF3F]/15 px-3 py-1 rounded-full border border-[#D6FF3F]/30 text-xs font-bold text-[#D6FF3F]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gemini AI {modelUsed ? `(${modelUsed})` : ''}</span>
              </div>
            </div>

            <div className="px-6 pt-4 pb-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-[#F4F5F6] tracking-tight leading-snug">{currentItem.name}</h2>
                <p className="text-xs text-[#747C83] mt-1">{currentItem.servingDescription || 'Estimasi visual porsi'}</p>
                <div className="flex items-center gap-1.5 mt-3">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMealType(m)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                        selectedMealType === m
                          ? 'bg-[#D6FF3F] text-[#17191B] font-black'
                          : 'bg-[#17191B] text-[#A7ADB3] border border-[#383D41] hover:text-[#F4F5F6]'
                      }`}
                    >
                      {MEAL_TYPE_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="shrink-0 flex items-center justify-center w-24 h-24 rounded-2xl bg-[#17191B] p-2 border border-[#383D41]">
                <FoodIllustration name={currentItem.name} size={76} />
              </div>
            </div>

            <div className="px-6 py-2">
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-[#17191B] rounded-2xl p-2.5 text-center border border-[#D6FF3F]/30">
                  <div className="text-lg font-black text-[#D6FF3F] leading-none">{activeCalories}</div>
                  <div className="text-[9px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1">KALORI</div>
                </div>
                <div className="bg-[#17191B] rounded-2xl p-2.5 text-center border border-[#77B7FF]/30">
                  <div className="text-lg font-black text-[#77B7FF] leading-none">{activeProtein}g</div>
                  <div className="text-[9px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1">PROTEIN</div>
                </div>
                <div className="bg-[#17191B] rounded-2xl p-2.5 text-center border border-[#67E8F9]/30">
                  <div className="text-lg font-black text-[#67E8F9] leading-none">{activeCarbs}g</div>
                  <div className="text-[9px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1">KARBO</div>
                </div>
                <div className="bg-[#17191B] rounded-2xl p-2.5 text-center border border-[#C4B5FD]/30">
                  <div className="text-lg font-black text-[#C4B5FD] leading-none">{activeFat}g</div>
                  <div className="text-[9px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1">LEMAK</div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex-1 bg-[#202326] border-t border-[#2D3134] p-6 flex flex-col justify-between space-y-5">
              <div>
                <h4 className="text-xs font-bold text-[#F4F5F6] uppercase tracking-wider mb-2.5">Serving size</h4>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-[#17191B] rounded-xl border border-[#383D41] px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setPortionMultiplier((p) => Math.max(0.5, Number((p - 0.5).toFixed(1))))}
                      className="h-8 w-8 flex items-center justify-center text-[#A7ADB3] hover:text-[#D6FF3F]"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-extrabold text-sm text-[#F4F5F6]">{portionMultiplier.toFixed(1)}</span>
                    <button
                      type="button"
                      onClick={() => setPortionMultiplier((p) => Number((p + 0.5).toFixed(1)))}
                      className="h-8 w-8 flex items-center justify-center text-[#A7ADB3] hover:text-[#D6FF3F]"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex-1 relative">
                    <select
                      value={servingUnit}
                      onChange={(e) => setServingUnit(e.target.value)}
                      className="w-full appearance-none bg-[#17191B] border border-[#383D41] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#F4F5F6] focus:outline-none focus:border-[#D6FF3F]"
                    >
                      <option value={currentItem.servingDescription || 'porsi (100g)'}>{currentItem.servingDescription || 'porsi (100g)'}</option>
                      <option value="setengah porsi (50g)">setengah porsi (50g)</option>
                      <option value="porsi besar (200g)">porsi besar (200g)</option>
                      <option value="mangkuk">1 mangkuk sedang</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-[#747C83] pointer-events-none" />
                  </div>
                </div>

                {analysisResult && analysisResult.items.length > 1 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-bold text-[#747C83] mb-1.5">Makanan Lain yang Terdeteksi:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.items.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => { setActiveItemIndex(idx); setServingUnit(item.servingDescription || 'porsi (100g)'); }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all ${
                            idx === activeItemIndex
                              ? 'bg-[#D6FF3F]/20 border-[#D6FF3F] text-[#D6FF3F]'
                              : 'bg-[#17191B] border-[#383D41] text-[#A7ADB3] hover:text-[#F4F5F6]'
                          }`}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {nutritionScore && (
                  <div className="mt-5">
                    <h4 className="text-xs font-bold text-[#F4F5F6] uppercase tracking-wider mb-2.5">Nutrition quality</h4>
                    <div className="flex items-start gap-3.5 bg-[#17191B] p-3.5 rounded-2xl border border-[#2D3134]">
                      <div
                        className="w-11 h-11 shrink-0 rounded-full border-2 flex items-center justify-center font-black text-lg"
                        style={{ borderColor: nutritionScore.color, color: nutritionScore.color, backgroundColor: `${nutritionScore.color}20` }}
                      >
                        {nutritionScore.grade}
                      </div>
                      <p className="text-xs text-[#A7ADB3] leading-relaxed">{nutritionScore.description}</p>
                    </div>
                  </div>
                )}

                {isDemoMode && (
                  <div className="mt-3 rounded-xl bg-[#D6FF3F]/10 border border-[#D6FF3F]/20 p-2 text-center text-[11px] text-[#D6FF3F] font-semibold">
                    Mode Demonstrasi (Gemini API key dapat ditambahkan di .env.local)
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="w-full py-4 rounded-2xl bg-[#D6FF3F] text-[#17191B] font-black text-base shadow-neon-glow hover:bg-[#C7F02D] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Confirm</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
