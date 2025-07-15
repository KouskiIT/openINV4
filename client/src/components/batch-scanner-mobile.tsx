import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { Layers, Play, Square, RotateCcw, Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InventoryItem, InsertSearchResult } from '@shared/schema';

interface BatchScannerMobileProps {
  onBatchComplete?: (results: Array<{ barcode: string; item?: InventoryItem; found: boolean }>) => void;
}

interface ScanResult {
  barcode: string;
  item?: InventoryItem;
  found: boolean;
  timestamp: Date;
}

export function BatchScannerMobile({ onBatchComplete }: BatchScannerMobileProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [currentScanCount, setCurrentScanCount] = useState(0);
  const queryClient = useQueryClient();

  // Add search result mutation
  const addSearchResultMutation = useMutation({
    mutationFn: async (searchResult: InsertSearchResult) => {
      return apiRequest('/api/search-results', 'POST', searchResult);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
    },
  });

  const handleBarcodeScanned = async (barcode: string) => {
    if (!isScanning) return;

    try {
      // Try to find the item
      const response = await fetch(`/api/inventory/barcode/${barcode}`);
      const item = response.ok ? await response.json() : null;
      
      const scanResult: ScanResult = {
        barcode,
        item,
        found: !!item,
        timestamp: new Date()
      };

      // Add to scan results
      setScanResults(prev => [...prev, scanResult]);
      setCurrentScanCount(prev => prev + 1);

      // Add to search results
      addSearchResultMutation.mutate({
        code_barre: barcode,
        designation: item?.designation || null,
        found: !!item,
        scan_count: 1
      });

    } catch (error) {
      console.error('Error processing barcode scan:', error);
      
      const scanResult: ScanResult = {
        barcode,
        found: false,
        timestamp: new Date()
      };

      setScanResults(prev => [...prev, scanResult]);
      setCurrentScanCount(prev => prev + 1);

      // Add to search results as not found
      addSearchResultMutation.mutate({
        code_barre: barcode,
        designation: null,
        found: false,
        scan_count: 1
      });
    }
  };

  const startScanning = () => {
    setIsScanning(true);
  };

  const stopScanning = () => {
    setIsScanning(false);
    if (onBatchComplete && scanResults.length > 0) {
      onBatchComplete(scanResults.map(result => ({
        barcode: result.barcode,
        item: result.item,
        found: result.found
      })));
    }
  };

  const resetBatch = () => {
    setScanResults([]);
    setCurrentScanCount(0);
    setIsScanning(false);
  };

  const foundCount = scanResults.filter(r => r.found).length;
  const notFoundCount = scanResults.length - foundCount;

  return (
    <div className="space-y-4">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Scanner par Lot
            </div>
            <Badge variant={isScanning ? "default" : "secondary"}>
              {isScanning ? "Actif" : "Arrêté"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                Démarrer
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1">
                <Square className="h-4 w-4 mr-2" />
                Arrêter
              </Button>
            )}
            
            <Button onClick={resetBatch} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-muted rounded">
              <div className="text-sm font-medium">{scanResults.length}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded">
              <div className="text-sm font-medium text-green-700 dark:text-green-400">{foundCount}</div>
              <div className="text-xs text-green-600 dark:text-green-500">Trouvés</div>
            </div>
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded">
              <div className="text-sm font-medium text-red-700 dark:text-red-400">{notFoundCount}</div>
              <div className="text-xs text-red-600 dark:text-red-500">Non trouvés</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanner */}
      {isScanning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Scanner Actif</CardTitle>
          </CardHeader>
          <CardContent>
            <BarcodeScanner
              onBarcodeScanned={handleBarcodeScanned}
              isActive={isScanning}
              className="w-full"
            />
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Alert>
        <AlertDescription>
          {isScanning ? (
            "Scanner actif. Dirigez la caméra vers les codes-barres pour les scanner automatiquement."
          ) : (
            "Appuyez sur 'Démarrer' pour commencer le scanner par lot. Chaque code-barre sera automatiquement enregistré."
          )}
        </AlertDescription>
      </Alert>

      {/* Recent Results */}
      {scanResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Derniers Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scanResults.slice(-5).reverse().map((result, index) => (
                <div
                  key={`${result.barcode}-${result.timestamp.getTime()}`}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                >
                  <div className="flex items-center gap-2">
                    {result.found ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-mono">{result.barcode}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}