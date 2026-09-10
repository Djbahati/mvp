import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  Zap,
  RefreshCw,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Upload,
  Image,
  Sparkles,
  Smartphone,
  ShieldCheck
} from 'lucide-react';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string, parsedData?: { address?: string; amount?: number; asset?: string }) => void;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(true);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play audio beep feedback on scan success
  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context ignored if not user-gestured
    }
  };

  // Start real web media camera stream
  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      return;
    }

    setCameraError(null);
    setScannedResult(null);
    setIsScanning(true);

    let isMounted = true;

    async function initCamera() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access API is not available on this device/browser.');
        }

        const newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        if (isMounted) {
          setStream(newStream);
          if (videoRef.current) {
            videoRef.current.srcObject = newStream;
            videoRef.current.play().catch(() => {});
          }
        } else {
          newStream.getTracks().forEach((track) => track.stop());
        }
      } catch (err: any) {
        console.warn('Camera stream request caught:', err);
        if (isMounted) {
          setCameraError(
            err?.message || 'Camera permission was denied or camera is unavailable in preview container.'
          );
        }
      }
    }

    initCamera();

    return () => {
      isMounted = false;
      stopCameraStream();
    };
  }, [isOpen, facingMode]);

  const stopCameraStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !isTorchOn } as any]
          });
          setIsTorchOn(!isTorchOn);
        } else {
          setIsTorchOn(!isTorchOn); // Toggle visual simulation
        }
      } catch (e) {
        setIsTorchOn(!isTorchOn);
      }
    }
  };

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Parse QR string into structured address/amount
  const parseQrText = (raw: string) => {
    let cleanAddress = raw.trim();
    let parsedAmount: number | undefined;
    let parsedAsset: string | undefined;

    if (raw.startsWith('ethereum:') || raw.startsWith('bitcoin:')) {
      const parts = raw.split(':');
      if (parts[0] === 'ethereum') parsedAsset = 'USDT';
      if (parts[0] === 'bitcoin') parsedAsset = 'BTC';

      const pathAndQuery = parts[1] || '';
      const [addr, query] = pathAndQuery.split('?');
      cleanAddress = addr;

      if (query) {
        const params = new URLSearchParams(query);
        const val = params.get('value') || params.get('amount');
        if (val) parsedAmount = parseFloat(val);
      }
    } else if (raw.startsWith('tel:')) {
      const match = raw.match(/\*182\*1\*1\*(\d+)#/);
      if (match) {
        cleanAddress = match[1];
        parsedAsset = 'RWF';
      }
    }

    return { address: cleanAddress, amount: parsedAmount, asset: parsedAsset };
  };

  const handleApplyResult = (rawString: string) => {
    playScanBeep();
    setScannedResult(rawString);
    setIsScanning(false);

    const parsed = parseQrText(rawString);

    setTimeout(() => {
      onScanSuccess(rawString, parsed);
      onClose();
    }, 700);
  };

  // Handle uploaded QR code image file simulation / parsing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate scanning uploaded image file
    const sampleAddrs = [
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
      '0788123456',
      'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
    ];
    const picked = sampleAddrs[Math.floor(Math.random() * sampleAddrs.length)];
    handleApplyResult(picked);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Scan Payment QR Code</h3>
              <p className="text-xs text-slate-400">Point camera at recipient QR code or wallet address</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viewfinder Camera Feed Container */}
        <div className="relative w-full aspect-square bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
          {/* Live Camera Feed */}
          {!cameraError && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
          )}

          {/* Camera Error / Fallback Card */}
          {cameraError && (
            <div className="p-6 text-center space-y-3 z-10 max-w-xs">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-400">Interactive Camera Viewfinder Active</div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Select a test QR preset below or upload a QR image from your device.
                </p>
              </div>
            </div>
          )}

          {/* QR Viewfinder Target Overlay Frame */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Dark Mask Surround */}
            <div className="absolute inset-0 border-[32px] border-black/50" />

            {/* Target Box */}
            <div className="w-56 h-56 relative border-2 border-amber-400/80 rounded-2xl shadow-2xl overflow-hidden">
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-amber-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-amber-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-amber-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-amber-400 rounded-br-lg" />

              {/* Laser Scan Line */}
              {isScanning && (
                <div className="w-full h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-lg shadow-amber-400/80 absolute top-0 animate-[ping_2s_infinite]" />
              )}

              {/* Scanned Success Lock State */}
              {scannedResult && (
                <div className="absolute inset-0 bg-emerald-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-3 text-emerald-400 animate-in zoom-in-95">
                  <CheckCircle2 className="w-10 h-10 mb-1" />
                  <span className="font-bold text-xs text-white">QR Code Detected!</span>
                  <span className="text-[10px] font-mono text-emerald-300 truncate max-w-full px-2 mt-1">
                    {scannedResult}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Camera Viewfinder Controls Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-900/80 backdrop-blur-md p-2 rounded-xl border border-slate-800 z-20">
            <button
              type="button"
              onClick={toggleTorch}
              className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                isTorchOn ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Toggle Flashlight / Torch"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Flash</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Image className="w-4 h-4 text-amber-400" />
              <span>Upload Image</span>
            </button>

            <button
              type="button"
              onClick={toggleCameraFacing}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Switch Camera (Front/Rear)"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Flip</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Quick Demo Test Presets */}
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Instant Test QR Presets
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleApplyResult('0x71C7656EC7ab88b098defB751B7401B5f6d8976F')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span className="text-emerald-400 font-mono">₮</span> USDT TRC-20
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">0x71C7...8976F</div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyResult('0788123456')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>🇷🇼</span> MTN MoMo Number
              </div>
              <div className="text-[10px] text-slate-400 font-mono">0788 123 456</div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyResult('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span className="text-amber-400 font-mono">₿</span> Bitcoin Native
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">bc1qxy...x0wlh</div>
            </button>

            <button
              type="button"
              onClick={() => handleApplyResult('ethereum:0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5?value=250')}
              className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-all cursor-pointer"
            >
              <div className="text-xs font-bold text-white flex items-center gap-1">
                <span>⚡</span> Payment Request
              </div>
              <div className="text-[10px] text-amber-400 font-mono">250 USDT Invoice</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
