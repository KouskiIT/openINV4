import React, { useRef, useEffect, useState } from 'react';
import { BrowserMultiFormatReader, NotFoundException, BarcodeFormat, DecodeHintType, Result } from '@zxing/library';
import { SoundEffects } from '@/lib/sound-effects';
import { ConfettiEffects } from '@/lib/confetti-effects';
import { BarcodeUtils, type BarcodeInfo } from '@/lib/barcode-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CameraOff, 
  Scan, 
  ScanLine, 
  Zap, 
  ZapOff,
  RotateCcw,
  Settings,
  Info,
  CheckCircle,
  AlertTriangle,
  Target,
  Maximize
} from 'lucide-react';

interface BarcodeScannerProps {
  onBarcodeScanned: (barcode: string, barcodeInfo?: BarcodeInfo) => void;
  onError?: (error: string) => void;
  isActive?: boolean;
  className?: string;
}

export function BarcodeScanner({ 
  onBarcodeScanned, 
  onError, 
  isActive = true,
  className = "" 
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [scanningStatus, setScanningStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [showHelp, setShowHelp] = useState(true);
  const [scanCount, setScanCount] = useState(0);
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [lastBarcodeInfo, setLastBarcodeInfo] = useState<BarcodeInfo | null>(null);

  // Initialize scanner
  useEffect(() => {
    // Configure scanner for Code128 and other 1D barcodes
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.CODE_93,
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODABAR
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    
    readerRef.current = new BrowserMultiFormatReader(hints);
    
    // Check for camera availability
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then(() => {
        setHasCamera(true);
        loadCameraDevices();
      })
      .catch((error) => {
        setHasCamera(false);
        const errorMsg = 'Caméra non disponible. Vérifiez les permissions.';
        setCameraError(errorMsg);
        onError?.(errorMsg);
      });

    return () => {
      stopScanning();
    };
  }, []);

  // Auto-start scanning when active
  useEffect(() => {
    if (isActive && hasCamera && !isScanning && selectedDeviceId) {
      startScanning();
    } else if (!isActive && isScanning) {
      stopScanning();
    }
  }, [isActive, hasCamera, selectedDeviceId]);

  const loadCameraDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      
      // Prefer back camera for mobile devices
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      setSelectedDeviceId(backCamera?.deviceId || videoDevices[0]?.deviceId || '');
    } catch (error) {
      console.error('Error loading camera devices:', error);
    }
  };

  const startScanning = async () => {
    if (!readerRef.current || !videoRef.current || !selectedDeviceId || isScanning) {
      return;
    }

    try {
      setIsScanning(true);
      setScanningStatus('scanning');
      setCameraError('');

      // Start video stream
      await readerRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcodeText = result.getText();
            const format = result.getBarcodeFormat();
            
            // Prevent duplicate scans
            if (barcodeText === lastScannedCode) return;
            
            // Analyze barcode type and validation
            const barcodeInfo = BarcodeUtils.analyzeBarcodeType(barcodeText, format);
            
            // Only process valid barcodes to prevent false positives
            if (!barcodeInfo.isValid) {
              console.log('Invalid barcode detected, skipping:', barcodeText);
              setScanningStatus('error');
              setTimeout(() => setScanningStatus('scanning'), 1000);
              return;
            }
            
            setLastScannedCode(barcodeText);
            setLastBarcodeInfo(barcodeInfo);
            setScanningStatus('success');
            setScanCount(prev => {
              const newCount = prev + 1;
              
              // Trigger celebrations
              SoundEffects.playSuccessBeep();
              
              if (newCount === 1) {
                ConfettiEffects.celebrateScan();
              } else if (newCount % 5 === 0) {
                ConfettiEffects.celebrateMultipleScans(newCount);
              } else {
                ConfettiEffects.celebrateContinuousScanning();
              }
              
              return newCount;
            });
            setShowHelp(false); // Hide help after first successful scan
            onBarcodeScanned(barcodeText, barcodeInfo);
            
            // Brief success indication, then continue scanning
            setTimeout(() => {
              setScanningStatus('scanning');
              setLastScannedCode('');
              setLastBarcodeInfo(null);
            }, 3000);
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.warn('Scan error:', error);
          }
        }
      );
    } catch (error) {
      const errorMsg = 'Erreur lors du démarrage de la caméra.';
      setCameraError(errorMsg);
      setScanningStatus('error');
      setIsScanning(false);
      onError?.(errorMsg);
    }
  };

  const stopScanning = () => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    setIsScanning(false);
    setScanningStatus('idle');
    setTorchEnabled(false);
    setLastScannedCode('');
    setLastBarcodeInfo(null);
  };

  const toggleTorch = async () => {
    if (!videoRef.current?.srcObject) return;

    try {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      
      if (track && 'torch' in track.getCapabilities()) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
      }
    } catch (error) {
      console.warn('Torch not supported or error:', error);
    }
  };

  const switchCamera = async () => {
    if (devices.length <= 1) return;

    const currentIndex = devices.findIndex(d => d.deviceId === selectedDeviceId);
    const nextIndex = (currentIndex + 1) % devices.length;
    const nextDeviceId = devices[nextIndex].deviceId;

    stopScanning();
    setSelectedDeviceId(nextDeviceId);
  };

  if (!hasCamera) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <CameraOff className="h-4 w-4" />
            <AlertDescription>
              {cameraError || 'Caméra non disponible'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scanner Code-barres (Code128 optimisé)
            <Badge variant={isScanning ? "default" : "secondary"}>
              {isScanning ? 'Actif' : 'Arrêté'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            {/* Torch toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTorch}
              disabled={!isScanning}
              title="Flash/Torche"
            >
              {torchEnabled ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
            </Button>
            
            {/* Camera switch */}
            {devices.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchCamera}
                title="Changer de caméra"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
            
            {/* Scan toggle */}
            <Button
              variant={isScanning ? "destructive" : "default"}
              size="sm"
              onClick={isScanning ? stopScanning : startScanning}
            >
              {isScanning ? (
                <>
                  <CameraOff className="h-4 w-4 mr-2" />
                  Arrêter
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Scanner
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Video Preview */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
          
          {/* Scanning overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Dynamic scanning area */}
            <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-white/80 rounded-lg">
              {/* Animated scan line */}
              <div className={`absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-lg shadow-red-500/50 ${isScanning ? 'animate-pulse' : ''}`} 
                   style={{ 
                     top: '50%', 
                     animation: isScanning ? 'scanLine 2s ease-in-out infinite' : 'none' 
                   }} />
              
              {/* Target corners */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-l-3 border-t-3 border-green-400" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-r-3 border-t-3 border-green-400" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-3 border-b-3 border-green-400" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-3 border-b-3 border-green-400" />
              
              {/* Center target */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Target className="h-8 w-8 text-white/60" />
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
              <Badge 
                variant={
                  scanningStatus === 'success' ? 'default' : 
                  scanningStatus === 'error' ? 'destructive' : 
                  'secondary'
                }
                className={`flex items-center gap-1 px-3 py-1 transition-all duration-300 ${
                  scanningStatus === 'success' ? 'animate-bounce scale-110' : ''
                }`}
              >
                {scanningStatus === 'success' && <CheckCircle className="h-3 w-3 text-green-600" />}
                {scanningStatus === 'error' && <AlertTriangle className="h-3 w-3" />}
                {scanningStatus === 'scanning' && <ScanLine className="h-3 w-3 animate-pulse" />}
                {scanningStatus === 'idle' && <Camera className="h-3 w-3" />}
                
                {scanningStatus === 'scanning' && 'Recherche en cours...'}
                {scanningStatus === 'success' && lastBarcodeInfo && (
                  <span className="flex items-center gap-1">
                    {BarcodeUtils.getTypeIcon(lastBarcodeInfo.type)} {lastBarcodeInfo.type} détecté !
                  </span>
                )}
                {scanningStatus === 'success' && !lastBarcodeInfo && '🎉 Code détecté !'}
                {scanningStatus === 'error' && 'Code invalide ignoré'}
                {scanningStatus === 'idle' && 'Prêt à scanner'}
              </Badge>
            </div>
            
            {/* Barcode type indicator */}
            {lastBarcodeInfo && scanningStatus === 'success' && (
              <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-10">
                <div className={`px-3 py-1 rounded-full text-xs font-medium border ${BarcodeUtils.getTypeColor(lastBarcodeInfo.type)}`}>
                  <div className="flex items-center gap-1">
                    <span>{BarcodeUtils.getTypeIcon(lastBarcodeInfo.type)}</span>
                    <span>{lastBarcodeInfo.format}</span>
                    {lastBarcodeInfo.isValid ? (
                      <CheckCircle className="h-3 w-3 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-3 w-3 text-yellow-600" />
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Scan counter */}
            {scanCount > 0 && (
              <div className="absolute top-4 right-4">
                <Badge 
                  variant="outline" 
                  className={`bg-black/50 text-white border-white/30 transition-all duration-500 ${
                    scanningStatus === 'success' ? 'animate-pulse scale-110' : ''
                  }`}
                >
                  {scanCount > 1 && '🔥 '}
                  {scanCount} scanné{scanCount > 1 ? 's' : ''}
                  {scanCount >= 5 && ' 🚀'}
                </Badge>
              </div>
            )}
            
            {/* Help overlay */}
            {showHelp && !isScanning && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 mx-4 max-w-sm">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Scanner Code128 optimisé</h4>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Pointez la caméra vers le code-barres</li>
                        <li>• Maintenez-le dans la zone de scan</li>
                        <li>• Optimisé pour Code128, EAN, UPC</li>
                        <li>• Scanner plusieurs codes en continu</li>
                        <li>• ⚠️ Évitez le texte et les étiquettes</li>
                        <li>• ✅ Seuls les vrais codes-barres sont acceptés</li>
                      </ul>
                      <Button 
                        size="sm" 
                        onClick={() => setShowHelp(false)}
                        className="w-full mt-2"
                      >
                        Compris !
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Error display */}
        {cameraError && (
          <Alert variant="destructive">
            <AlertDescription>{cameraError}</AlertDescription>
          </Alert>
        )}
        
        {/* Instructions and Tips */}
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground text-center space-y-1">
            <p className="font-medium">Instructions rapides :</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Centrez le code
              </div>
              <div className="flex items-center gap-1">
                <Maximize className="h-3 w-3" />
                Rapprochez-vous
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Utilisez le flash
              </div>
              <div className="flex items-center gap-1">
                <RotateCcw className="h-3 w-3" />
                Changez d'angle
              </div>
            </div>
          </div>
          
          {/* Quick help toggle */}
          <div className="text-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHelp(true)}
              className="text-xs text-muted-foreground"
            >
              <Info className="h-3 w-3 mr-1" />
              Afficher l'aide
            </Button>
          </div>
        </div>
      </CardContent>
      
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />
    </Card>
  );
}