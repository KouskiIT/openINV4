import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SoundEffects } from '@/lib/sound-effects';
import { ConfettiEffects } from '@/lib/confetti-effects';
import { BarcodeUtils, type BarcodeInfo } from '@/lib/barcode-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Camera, Zap, Info } from 'lucide-react';
import { BarcodeScanner } from './barcode-scanner';

interface MobileBarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onBarcodeScanned: (barcode: string, barcodeInfo?: BarcodeInfo) => void;
}

export function MobileBarcodeScanner({ 
  open, 
  onClose, 
  onBarcodeScanned 
}: MobileBarcodeScannerProps) {
  const [lastScannedCode, setLastScannedCode] = useState<string>('');
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [totalScans, setTotalScans] = useState(0);
  const [recentBarcodeTypes, setRecentBarcodeTypes] = useState<BarcodeInfo[]>([]);

  const handleBarcodeScanned = (barcode: string, barcodeInfo?: BarcodeInfo) => {
    // Prevent duplicate scans
    if (barcode === lastScannedCode) return;
    
    setLastScannedCode(barcode);
    setIsFirstTime(false);
    setTotalScans(prev => prev + 1);
    
    // Track recent barcode types
    if (barcodeInfo) {
      setRecentBarcodeTypes(prev => [barcodeInfo, ...prev.slice(0, 4)]);
    }
    
    // Trigger mobile-specific celebrations
    SoundEffects.playSuccessBeep();
    
    // Different celebration based on scan count
    if (totalScans === 0) {
      ConfettiEffects.celebrateScan();
    } else {
      ConfettiEffects.celebrateContinuousScanning();
    }
    
    onBarcodeScanned(barcode, barcodeInfo);
    
    // Reset the last scanned code after a delay to allow new scans
    setTimeout(() => {
      setLastScannedCode('');
    }, 2000);
  };

  const handleClose = () => {
    setLastScannedCode('');
    setIsFirstTime(true);
    setTotalScans(0);
    setRecentBarcodeTypes([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-full h-[90vh] p-0 gap-0">
        <DialogHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              <DialogTitle>Scanner Code-barres (Code128)</DialogTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose} className="text-red-500 hover:text-red-600">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-left">
            Scanner optimisé pour Code128. Le scanner reste actif pour plusieurs codes.
          </DialogDescription>
          
          {/* Quick tips */}
          {isFirstTime && (
            <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 mt-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium text-blue-900 dark:text-blue-100">Scanner Code128 optimisé :</p>
                  <ul className="text-blue-800 dark:text-blue-200 space-y-0.5 text-xs">
                    <li>• Maintenez le téléphone stable</li>
                    <li>• Assurez-vous que le code est bien éclairé</li>
                    <li>• Évitez les reflets sur l'étiquette</li>
                    <li>• Détection optimisée pour Code128, EAN, UPC</li>
                    <li>• ⚠️ Évitez le texte et les étiquettes sans codes</li>
                    <li>• ✅ Seuls les vrais codes-barres sont scannés</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>
        
        <div className="flex-1 p-4 space-y-3">
          {/* Status indicator */}
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Scanner actif - Prêt pour plusieurs codes
                </span>
              </div>
              {totalScans > 0 && (
                <div className="text-sm font-bold text-green-700 dark:text-green-300">
                  {totalScans > 1 && '🔥 '}
                  {totalScans} scanné{totalScans > 1 ? 's' : ''}
                  {totalScans >= 5 && ' 🚀'}
                </div>
              )}
            </div>
          </div>
          
          {/* Recent barcode types with enhanced information */}
          {recentBarcodeTypes.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Types récents scannés ({recentBarcodeTypes.length}/5) :
              </h4>
              <div className="space-y-2">
                {recentBarcodeTypes.map((info, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-white dark:bg-gray-800 rounded p-2"
                  >
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${BarcodeUtils.getTypeColor(info.type)}`}>
                      <span className="flex items-center gap-1">
                        {BarcodeUtils.getTypeIcon(info.type)} {info.format}
                        {info.isValid ? '✓' : '⚠️'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 font-mono">
                      {info.code.slice(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Validation summary */}
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                  <span>Valides: {recentBarcodeTypes.filter(info => info.isValid).length}</span>
                  <span>Invalides: {recentBarcodeTypes.filter(info => !info.isValid).length}</span>
                </div>
              </div>
            </div>
          )}
          
          <BarcodeScanner
            onBarcodeScanned={handleBarcodeScanned}
            isActive={open}
            className="h-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}