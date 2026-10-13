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
import { FoodIllustration, resolveFoodType } from '@/components/ui/FoodIllustration';
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

// Calculate nutrient health score (A, B, C, D) based on macros
function calculateNutritionScore(item: FoodScanItem): { grade: 'A' | 'B' | 'C' | 'D'; color: string; description: string } {
  const { caloriesKcal, proteinGrams, carbsGrams, fatGrams } = item;
  const proteinRatio = (proteinGrams * 4) / Math.max(1, caloriesKcal);
  const fatRatio = (fatGrams * 9) / Math.max(1, caloriesKcal);

  if (proteinRatio >= 0.3 && fatRatio <= 0.3) {
    return {
      grade: 'A',
      color: '#22C55E',
      description: 'Sangat bergizi! Kaya akan protein berkualitas tinggi dan rendah lemak jenuh. Pilihan ideal untuk target kebugaran Anda.',
    };
  } else if (proteinRatio >= 0.2 || (fatRatio <= 0.35 && caloriesKcal <= 500)) {
    return {
      grade: 'B',
      color: '#10B981',
      description: 'Sehat jika dikonsumsi seimbang. Mengandung makronutrien esensial dengan porsi kalori yang terjaga.',
    };
  } else if (fatRatio <= 0.5) {
    return {
      grade: 'C',
      color: '#F59E0B',
      description: 'Netral dengan nutrisi esensial namun ada kandungan lemak/gula yang seimbang. Nikmati dengan porsi wajar.',
    };
  } else {
    return {
      grade: 'D',
      color: '#EF4444',
      description: 'Tinggi kalori atau lemak jenuh. Cocok sebagai santapan berkala, perhatikan asupan makanan lain hari ini.',
    };
  }
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
  const [analysisStep, setAnalysisStep] = useState<string>('Memindai makanan...');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<FoodScanAnalysis | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<MealType>(defaultMealType);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Result state adjustments
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);
  const [servingUnit, setServingUnit] = useState<string>('porsi (100g)');
  const [activeItemIndex, setActiveItemIndex] = useState<number>(0);

  // Stop camera stream helper
  const stopCameraStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Start camera stream
  const startCameraStream = useCallback(async () => {
    if (!isOpen) return;
    try {
      stopCameraStream();
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        mediaStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setCameraActive(true);
        }
      }
    } catch {
      // Camera permission denied or not available; fallback gracefully to upload view
      setCameraActive(false);
    }
  }, [isOpen, facingMode, stopCameraStream]);

  // Manage camera on modal open/close
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
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen, startCameraStream, stopCameraStream]);

  // Flip camera
  const handleToggleCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture photo from live video feed
  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current && cameraActive) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setCapturedImage(dataUrl);
        stopCameraStream();
        analyzeCapturedImage(dataUrl);
        return;
      }
    }

    // If camera feed is not running, trigger file picker or sample image
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle image file selection
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
  };

  // Analyze image with AI
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

      if (!data.success) {
        throw new Error(data.error || 'Gagal menganalisis foto makanan.');
      }

      setAnalysisResult(data.analysis);
      setIsDemoMode(Boolean(data.isDemo));
      if (data.modelUsed) setModelUsed(data.modelUsed);
      setPortionMultiplier(1.0);
      setActiveItemIndex(0);

      if (data.analysis.items?.[0]) {
        setServingUnit(data.analysis.items[0].servingDescription || 'porsi (100g)');
      }

      setScanState('result');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan saat memproses gambar.');
      setScanState('camera');
      startCameraStream();
    }
  };

  // Retake or close
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

  // Confirm and save
  const handleConfirmSave = () => {
    if (!analysisResult || !analysisResult.items.length) return;

    const entriesToSave: CreateFoodEntryInput[] = analysisResult.items.map((item, idx) => {
      const mult = idx === activeItemIndex ? portionMultiplier : 1.0;
      return {
        consumptionDate: consumptionDate || new Date().toISOString().split('T')[0],
        mealType: selectedMealType,
        foodName: item.name,
        quantity: Math.max(0.1, Number((mult).toFixed(1))),
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

  const currentItem = analysisResult?.items?.[activeItemIndex] || analysisResult?.items?.[0];
  const nutritionScore = currentItem ? calculateNutritionScore(currentItem) : null;

  // Active item scaled macros
  const activeCalories = currentItem ? Math.round(currentItem.caloriesKcal * portionMultiplier) : 0;
  const activeProtein = currentItem ? Math.round(currentItem.proteinGrams * portionMultiplier) : 0;
  const activeCarbs = currentItem ? Math.round(currentItem.carbsGrams * portionMultiplier) : 0;
  const activeFat = currentItem ? Math.round(currentItem.fatGrams * portionMultiplier) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-0 sm:p-4 animate-fade-in">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Container - Phone Aspect Ratio Frame */}
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-md sm:rounded-3xl overflow-hidden bg-[#121212] flex flex-col shadow-2xl border border-white/10">
        {/* ========================================================= */}
        {/* VIEW 1: CAMERA & VIEWFINDER                              */}
        {/* ========================================================= */}
        {scanState === 'camera' && (
          <div className="relative flex-1 flex flex-col bg-black overflow-hidden min-h-[580px]">
            {/* Top Bar */}
            <div className="relative z-20 flex items-center justify-between px-5 pt-5 pb-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md hover:bg-black/60 active:scale-95 transition-all"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={() => setFlashEnabled(!flashEnabled)}
                className={`flex h-10 px-3.5 items-center gap-1.5 rounded-full backdrop-blur-md transition-all active:scale-95 ${
                  flashEnabled ? 'bg-accent text-white shadow-orange-glow' : 'bg-black/40 text-white hover:bg-black/60'
                }`}
                aria-label="Toggle Flash"
              >
                <Zap className="h-4 w-4" fill={flashEnabled ? 'currentColor' : 'none'} />
                <span className="text-xs font-bold">A</span>
              </button>
            </div>

            {/* Viewfinder area */}
            <div className="relative flex-1 flex items-center justify-center overflow-hidden">
              {/* Live Video or Image Placeholder */}
              {cameraActive ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#1C261C] to-[#0A120A] cursor-pointer p-6 text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center mb-4 text-accent animate-pulse">
                    <Camera className="h-10 w-10" />
                  </div>
                  <h3 className="text-white font-bold text-base mb-1">Kamera Siap Memindai</h3>
                  <p className="text-white/60 text-xs max-w-xs">
                    Klik untuk membuka galeri foto atau aktifkan kamera untuk foto makanan
                  </p>
                </div>
              )}

              {/* Viewfinder Bounding Box & Grid Lines */}
              <div className="relative z-10 w-72 h-72 border-2 border-white/40 rounded-2xl pointer-events-none flex flex-col justify-between p-2 shadow-2xl">
                {/* Corner markers */}
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-4 border-l-4 border-accent rounded-tl-lg" />
                  <div className="w-6 h-6 border-t-4 border-r-4 border-accent rounded-tr-lg" />
                </div>

                {/* Grid Overlay */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-25 pointer-events-none">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>

                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-4 border-l-4 border-accent rounded-bl-lg" />
                  <div className="w-6 h-6 border-b-4 border-r-4 border-accent rounded-br-lg" />
                </div>
              </div>

              {/* Error banner */}
              {error && (
                <div className="absolute bottom-4 left-4 right-4 z-20 rounded-xl bg-danger/90 text-white p-3 text-xs flex items-center gap-2 backdrop-blur-md">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Bottom Controls Bar (Matches reference screenshot 2) */}
            <div className="relative z-20 bg-white/95 rounded-t-3xl pt-5 pb-7 px-8 flex items-center justify-between shadow-2xl">
              {/* Gallery button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F8F0] border border-border text-text-primary hover:bg-[#E0EDE0] active:scale-95 transition-all shadow-sm"
                aria-label="Pilih dari Galeri"
              >
                <ImageIcon className="h-6 w-6 text-text-secondary" />
              </button>

              {/* Big Double-Ring Shutter Button */}
              <button
                type="button"
                onClick={handleCapturePhoto}
                className="flex h-20 w-20 items-center justify-center rounded-full p-1.5 transition-all active:scale-90 hover:scale-105"
                aria-label="Ambil Foto"
              >
                <div className="w-full h-full rounded-full border-4 border-accent p-1 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-accent to-[#FB923C] shadow-orange-glow" />
                </div>
              </button>

              {/* Flip camera button */}
              <button
                type="button"
                onClick={handleToggleCamera}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0F8F0] border border-border text-text-primary hover:bg-[#E0EDE0] active:scale-95 transition-all shadow-sm"
                aria-label="Ganti Kamera"
              >
                <RefreshCw className="h-5 w-5 text-text-secondary" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SCANNING IN PROGRESS STATE                       */}
        {/* ========================================================= */}
        {scanState === 'analyzing' && (
          <div className="relative flex-1 flex flex-col bg-black min-h-[580px]">
            {/* Captured or Simulated Photo Background */}
            <div className="relative flex-1 overflow-hidden flex items-center justify-center">
              {capturedImage ? (
                <img
                  src={capturedImage}
                  alt="Captured food"
                  className="w-full h-full object-cover filter brightness-75"
                />
              ) : (
                <div className="w-full h-full bg-[#1C261C] flex items-center justify-center">
                  <FoodIllustration type="burger" size={140} />
                </div>
              )}

              {/* Scanning Target Grid & Laser Beam */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-72 h-72 border-2 border-accent/60 rounded-2xl overflow-hidden shadow-2xl">
                  {/* Grid */}
                  <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-30">
                    {Array.from({ length: 16 }).map((_, i) => (
                      <div key={i} className="border border-white/40" />
                    ))}
                  </div>
                  {/* Glowing Laser line */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent shadow-[0_0_15px_#F97316] animate-pulse top-1/2" />
                </div>
              </div>
            </div>

            {/* Bottom Scanning Sheet (Matches middle image) */}
            <div className="relative z-20 bg-white rounded-t-3xl pt-8 pb-10 px-6 flex flex-col items-center justify-center shadow-2xl">
              {/* Circular spinning ring */}
              <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-4 border-orange-100 border-t-accent animate-spin" />
              </div>
              <h3 className="text-base font-extrabold text-[#1A2E1A] tracking-tight">
                Scanning in progress
              </h3>
              <p className="text-xs text-[#7A9A7A] mt-1">{analysisStep}</p>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: SCAN RESULT & CONFIRM MODAL (Neon Dark Mode)     */}
        {/* ========================================================= */}
        {scanState === 'result' && currentItem && (
          <div className="relative flex-1 flex flex-col bg-[#202326] overflow-y-auto max-h-[92vh] text-[#F4F5F6] font-sans">
            {/* Top close button */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2 border-b border-[#2D3134]">
              <button
                type="button"
                onClick={handleRetake}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17191B] text-[#D6FF3F] hover:bg-[#292D30] active:scale-95 transition-all shadow-xs"
                aria-label="Kembali / Foto Ulang"
              >
                <X className="h-5 w-5 stroke-[2.5]" />
              </button>

              <div className="flex items-center gap-1.5 bg-[#D6FF3F]/15 px-3 py-1 rounded-full border border-[#D6FF3F]/30 text-xs font-bold text-[#D6FF3F]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Gemini AI {modelUsed ? `(${modelUsed})` : ''}</span>
              </div>
            </div>

            {/* Food Title & 3D Thumbnail Section */}
            <div className="px-6 pt-4 pb-4 flex items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-extrabold text-[#F4F5F6] tracking-tight leading-snug">
                  {currentItem.name}
                </h2>
                <p className="text-xs text-[#747C83] mt-1">
                  {currentItem.servingDescription || 'Estimasi visual porsi'}
                </p>

                {/* Meal Type Pill Selector */}
                <div className="flex items-center gap-1.5 mt-3">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSelectedMealType(m)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
                        selectedMealType === m
                          ? 'bg-[#D6FF3F] text-[#17191B] shadow-neon-glow font-black'
                          : 'bg-[#17191B] text-[#A7ADB3] border border-[#383D41] hover:text-[#F4F5F6]'
                      }`}
                    >
                      {MEAL_TYPE_LABELS[m]}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Food Illustration / Thumbnail */}
              <div className="shrink-0 flex items-center justify-center w-24 h-24 rounded-2xl bg-[#17191B] shadow-card p-2 border border-[#383D41]">
                <FoodIllustration name={currentItem.name} size={76} />
              </div>
            </div>

            {/* 4 Key Macro Metrics Cards (Neon Glow) */}
            <div className="px-6 py-2">
              <div className="grid grid-cols-4 gap-2">
                {/* Calories */}
                <div className="bg-[#17191B] rounded-2xl p-2.5 text-center shadow-xs border border-[#D6FF3F]/30">
                  <div className="text-lg font-black text-[#D6FF3F] leading-none">
                    {activeCalories}
                  </div>
                  <div className="text-[9px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1">
                    CALORIES
                  </div>
                </div>

                {/* Protein */}
                <div className="bg-[#17191B] rounded-2xl p-2.5 text-center shadow-xs border border-[#77B7FF]/30">
                  <div className="text-lg font-black text-[#77B7FF] leading-none">
                    {activeProtein}g
                  </div>
                  <div className="text-[9px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1">
                    PROTEIN
                  </div>
                </div>

                {/* Carb */}
                <div className="bg-[#17191B] rounded-2xl p-2.5 text-center shadow-xs border border-[#67E8F9]/30">
                  <div className="text-lg font-black text-[#67E8F9] leading-none">
                    {activeCarbs}g
                  </div>
                  <div className="text-[9px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1">
                    CARB
                  </div>
                </div>

                {/* Fat */}
                <div className="bg-[#17191B] rounded-2xl p-2.5 text-center shadow-xs border border-[#C4B5FD]/30">
                  <div className="text-lg font-black text-[#C4B5FD] leading-none">
                    {activeFat}g
                  </div>
                  <div className="text-[9px] font-extrabold uppercase text-[#747C83] tracking-wider mt-1">
                    FAT
                  </div>
                </div>
              </div>
            </div>

            {/* Dark Rounded Bottom Card for Serving Size & Nutrition Quality */}
            <div className="mt-3 flex-1 bg-[#202326] border-t border-[#2D3134] p-6 flex flex-col justify-between space-y-5">
              <div>
                {/* Serving Size Header */}
                <h4 className="text-xs font-bold text-[#F4F5F6] uppercase tracking-wider mb-2.5">
                  Serving size
                </h4>

                {/* Serving Size Controls (Quantity input + Unit dropdown) */}
                <div className="flex items-center gap-3">
                  {/* Quantity Stepper */}
                  <div className="flex items-center bg-[#17191B] rounded-xl border border-[#383D41] px-2 py-1">
                    <button
                      type="button"
                      onClick={() => setPortionMultiplier((p) => Math.max(0.5, Number((p - 0.5).toFixed(1))))}
                      className="h-8 w-8 flex items-center justify-center text-[#A7ADB3] hover:text-[#D6FF3F] font-bold"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center font-extrabold text-sm text-[#F4F5F6]">
                      {portionMultiplier.toFixed(1)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPortionMultiplier((p) => Number((p + 0.5).toFixed(1)))}
                      className="h-8 w-8 flex items-center justify-center text-[#A7ADB3] hover:text-[#D6FF3F] font-bold"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Serving Unit Dropdown */}
                  <div className="flex-1 relative">
                    <select
                      value={servingUnit}
                      onChange={(e) => setServingUnit(e.target.value)}
                      className="w-full appearance-none bg-[#17191B] border border-[#383D41] rounded-xl px-3.5 py-2.5 text-xs font-bold text-[#F4F5F6] focus:outline-none focus:border-[#D6FF3F]"
                    >
                      <option value="burger (100g)">{currentItem.servingDescription || 'porsi (100g)'}</option>
                      <option value="setengah porsi (50g)">setengah porsi (50g)</option>
                      <option value="porsi besar (200g)">porsi besar (200g)</option>
                      <option value="mangkuk">1 mangkuk sedang</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-[#747C83] pointer-events-none" />
                  </div>
                </div>

                {/* Multiple detected food items if any */}
                {analysisResult && analysisResult.items.length > 1 && (
                  <div className="mt-3">
                    <div className="text-[11px] font-bold text-[#747C83] mb-1.5">
                      Makanan Lain yang Terdeteksi:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {analysisResult.items.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActiveItemIndex(idx);
                            setServingUnit(item.servingDescription || 'porsi (100g)');
                          }}
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

                {/* Nutrition Quality Section */}
                {nutritionScore && (
                  <div className="mt-5">
                    <h4 className="text-xs font-bold text-[#F4F5F6] uppercase tracking-wider mb-2.5">
                      Nutrition quality
                    </h4>
                    <div className="flex items-start gap-3.5 bg-[#17191B] p-3.5 rounded-2xl border border-[#2D3134]">
                      <div
                        className="w-11 h-11 shrink-0 rounded-full border-2 flex items-center justify-center font-black text-lg shadow-neon-glow"
                        style={{
                          borderColor: nutritionScore.color,
                          color: nutritionScore.color,
                          backgroundColor: `${nutritionScore.color}20`,
                        }}
                      >
                        {nutritionScore.grade}
                      </div>

                      <p className="text-xs text-[#A7ADB3] leading-relaxed">
                        {nutritionScore.description}
                      </p>
                    </div>
                  </div>
                )}

                {isDemoMode && (
                  <div className="mt-3 rounded-xl bg-[#D6FF3F]/10 border border-[#D6FF3F]/20 p-2 text-center text-[11px] text-[#D6FF3F] font-semibold">
                    Mode Demonstrasi (Gemini API key dapat ditambahkan di .env.local)
                  </div>
                )}
              </div>

              {/* Full Width Neon Confirm Button */}
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
