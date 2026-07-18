'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, Upload, Search, Barcode, 
  Loader2, AlertCircle, CheckCircle2, X, SwitchCamera, FlipHorizontal
} from 'lucide-react';
import { productsAPI } from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

type ScanMode = 'camera' | 'upload' | 'barcode' | 'text';

export default function ScanPage() {
  const [mode, setMode] = useState<ScanMode>('text');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcode, setBarcode] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [videoReady, setVideoReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setVideoReady(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    setVideoReady(false);
    setCapturedImage(null);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);

      await new Promise<void>((resolve) => {
        const checkVideo = () => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => {
                setVideoReady(true);
                resolve();
              }).catch(() => {
                setCameraError('Could not play video stream');
                resolve();
              });
            };
          } else {
            setTimeout(checkVideo, 50);
          }
        };
        checkVideo();
      });
    } catch (err: any) {
      setCameraActive(false);
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (err.name === 'NotReadableError') {
        setCameraError('Camera is in use by another application.');
      } else {
        setCameraError(`Camera error: ${err.message}`);
      }
    }
  }, [cameraFacing]);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode, startCamera, stopCamera]);

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (cameraFacing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(imageDataUrl);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85);
    });

    if (!blob) {
      setError('Failed to capture image');
      return;
    }

    stopCamera();
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', blob, 'camera-capture.jpg');

    try {
      const response = await productsAPI.scan(formData);
      setResult(response.data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setResult(null);
    startCamera();
  };

  const switchCamera = () => {
    setCameraFacing(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await productsAPI.scan(formData);
      setResult(response.data);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeSearch = async () => {
    if (!barcode.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await productsAPI.getByBarcode(barcode);
      setResult({ product: response.data });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await productsAPI.search(searchQuery);
      setResult({ products: response.data.products });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeIngredients = async () => {
    if (!ingredientsText.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/ingredients/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients_text: ingredientsText }),
      });
      const data = await response.json();
      setResult({ analysis: data });
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const modes = [
    { id: 'text', label: 'Text Search', icon: Search },
    { id: 'barcode', label: 'Barcode', icon: Barcode },
    { id: 'upload', label: 'Upload Image', icon: Upload },
    { id: 'camera', label: 'Camera', icon: Camera },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Product Scanner</h1>
        <p className="text-gray-500">
          Scan, search, or upload to analyze any cosmetic product
        </p>
      </motion.div>

      <div className="flex flex-wrap justify-center gap-4">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id as ScanMode)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
              mode === m.id
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                : 'glass text-gray-600 hover:text-gray-900'
            }`}
          >
            <m.icon className="w-5 h-5" />
            {m.label}
          </button>
        ))}
      </div>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-8"
      >
        {mode === 'text' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Search Products</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter product name..."
                className="input-glass flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
              />
              <button
                onClick={handleTextSearch}
                disabled={isLoading}
                className="glass-button"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search'}
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-3">Or analyze ingredients directly:</h4>
              <textarea
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder="Paste ingredient list here (e.g., Water, Glycerin, Hyaluronic Acid, Niacinamide...)"
                className="input-glass h-32 resize-none"
              />
              <button
                onClick={analyzeIngredients}
                disabled={isLoading || !ingredientsText.trim()}
                className="glass-button mt-4"
              >
                Analyze Ingredients
              </button>
            </div>
          </div>
        )}

        {mode === 'barcode' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Scan Barcode</h3>
            <div className="flex gap-4">
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Enter barcode number..."
                className="input-glass flex-1"
                onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSearch()}
              />
              <button
                onClick={handleBarcodeSearch}
                disabled={isLoading}
                className="glass-button"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Look Up'}
              </button>
            </div>
            <p className="text-gray-500 text-sm">
              Enter a barcode number or scan using your device camera
            </p>
          </div>
        )}

        {mode === 'upload' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Upload Product Image</h3>
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-pink-500/50 transition-colors">
              <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                Drag and drop an image, or click to browse
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="glass-button cursor-pointer inline-block"
              >
                Choose Image
              </label>
            </div>
          </div>
        )}

        {mode === 'camera' && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Camera Scanner</h3>
            
            <canvas ref={canvasRef} className="hidden" />

            {!capturedImage ? (
              <div className="relative rounded-xl overflow-hidden bg-gray-900">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-xl"
                  style={{ transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none' }}
                />
                {cameraActive && videoReady && (
                  <div className="absolute inset-0 flex items-end justify-center pb-6 gap-4">
                    <button
                      onClick={switchCamera}
                      className="p-3 bg-gray-100 backdrop-blur-md rounded-full text-gray-900 hover:bg-gray-200 transition-all"
                      title="Switch Camera"
                    >
                      <SwitchCamera className="w-5 h-5" />
                    </button>
                    <button
                      onClick={capturePhoto}
                      disabled={isLoading}
                      className="w-16 h-16 rounded-full bg-white border-4 border-pink-500 hover:bg-pink-100 transition-all flex items-center justify-center shadow-lg shadow-pink-500/30 disabled:opacity-50"
                      title="Capture Photo"
                    >
                      {isLoading ? (
                        <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-pink-500" />
                      )}
                    </button>
                    <button
                      onClick={stopCamera}
                      className="p-3 bg-gray-100 backdrop-blur-md rounded-full text-gray-900 hover:bg-gray-200 transition-all"
                      title="Close Camera"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
                {cameraActive && (
                  <div className="absolute top-4 left-4 right-4 flex justify-center">
                    <span className="px-3 py-1 bg-gray-900 backdrop-blur-sm rounded-full text-gray-100 text-xs flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Live
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/4 h-2/3 border-2 border-gray-200 rounded-lg">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-pink-500 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-pink-500 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-pink-500 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-pink-500 rounded-br-lg" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-xl overflow-hidden">
                <img src={capturedImage} alt="Captured" className="w-full rounded-xl" />
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
                  <button onClick={retakePhoto} className="px-6 py-3 bg-gray-100 backdrop-blur-md rounded-xl text-gray-900 hover:bg-gray-200 transition-all flex items-center gap-2">
                    <Camera className="w-4 h-4" /> Retake
                  </button>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-300 text-sm mb-3">{cameraError}</p>
                <div className="flex justify-center gap-3">
                  <button onClick={startCamera} className="glass-button text-sm">
                    Try Again
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="glass-button text-sm"
                  >
                    <Upload className="w-4 h-4 mr-2 inline" /> Upload Instead
                  </button>
                </div>
              </div>
            )}

            {!cameraError && !cameraActive && !capturedImage && !isLoading && (
              <div className="text-center py-8">
                <Camera className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Point your camera at the product label</p>
                <button onClick={startCamera} className="glass-button">
                  Enable Camera
                </button>
              </div>
            )}

            {cameraActive && !videoReady && !cameraError && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 text-pink-400 mx-auto mb-4 animate-spin" />
                <p className="text-gray-500">Initializing camera...</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass p-4 border-red-500/50 flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{error}</span>
        </motion.div>
      )}

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8"
        >
          {result.product && (
            <div>
              <div className="flex items-start gap-6">
                {result.product.image_url && (
                  <img
                    src={result.product.image_url}
                    alt={result.product.name}
                    className="w-32 h-32 object-cover rounded-xl"
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {result.product.name}
                  </h3>
                  <p className="text-gray-500">{result.product.brand}</p>
                  {result.product.price && (
                    <p className="text-pink-400 text-xl mt-2">
                      ${result.product.price}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {result.analysis && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Ingredient Analysis</h3>
              
              <div className="glass p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-500">Overall Safety Score</span>
                  <span className="text-gray-900 font-bold">
                    {(result.analysis.safety_score * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="safety-meter">
                  <div
                    className={`safety-meter-fill ${
                      result.analysis.safety_score >= 0.7
                        ? 'safety-excellent'
                        : result.analysis.safety_score >= 0.5
                        ? 'safety-good'
                        : result.analysis.safety_score >= 0.3
                        ? 'safety-moderate'
                        : 'safety-dangerous'
                    }`}
                    style={{ width: `${result.analysis.safety_score * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {result.analysis.safe_count}
                  </div>
                  <div className="text-gray-500 text-sm">Safe</div>
                </div>
                <div className="glass p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {result.analysis.moderate_count}
                  </div>
                  <div className="text-gray-500 text-sm">Moderate</div>
                </div>
                <div className="glass p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">
                    {result.analysis.hazardous_count}
                  </div>
                  <div className="text-gray-500 text-sm">Hazardous</div>
                </div>
                <div className="glass p-4 text-center">
                  <div className="text-3xl font-bold text-gray-500">
                    {result.analysis.unknown_count}
                  </div>
                  <div className="text-gray-500 text-sm">Unknown</div>
                </div>
              </div>

              {result.analysis.warnings?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-gray-900">Warnings</h4>
                  {result.analysis.warnings.map((warning: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-yellow-300 text-sm"
                    >
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.analysis.ingredients?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-gray-900">Ingredients</h4>
                  <div className="flex flex-wrap gap-2">
                    {result.analysis.ingredients.map((ing: any, idx: number) => (
                      <span
                        key={idx}
                        className={`ingredient-badge ${
                          ing.category === 'safe'
                            ? 'badge-safe'
                            : ing.category === 'moderate'
                            ? 'badge-moderate'
                            : ing.category === 'hazardous'
                            ? 'badge-hazardous'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {typeof ing === 'string' ? ing : ing.name || String(ing)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {result.extracted_text && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Extracted Text</h4>
              <pre className="bg-gray-100 rounded-xl p-4 text-gray-600 text-sm overflow-x-auto">
                {result.extracted_text}
              </pre>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
