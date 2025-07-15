import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

import { 
  CheckCircle, 
  AlertCircle, 
  Edit, 
  Save,
  X,
  Smartphone,
  Wifi,
  WifiOff,
  Search
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

import { validateBarcode } from '@/lib/validation';
import type { InventoryItem, UpdateInventoryItem } from '@shared/schema';

interface MobileQuickScanProps {
  onItemFound?: (item: InventoryItem) => void;
  onItemNotFound?: (barcode: string) => void;
}

interface QuickUpdateField {
  field: keyof UpdateInventoryItem;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

const QUICK_UPDATE_FIELDS: QuickUpdateField[] = [
  { field: 'condition', label: 'État', type: 'select', options: ['Excellent', 'Bon', 'Moyen', 'Mauvais', 'Hors service'] },
  { field: 'beneficiaire', label: 'Bénéficiaire', type: 'text' },
  { field: 'num_bureau', label: 'Bureau', type: 'text' },
  { field: 'quantite', label: 'Quantité', type: 'number' },
  { field: 'prix', label: 'Prix', type: 'number' },
];

export function MobileQuickScan({ onItemFound, onItemNotFound }: MobileQuickScanProps) {
  const [manualBarcode, setManualBarcode] = useState('');
  const [scannedItem, setScannedItem] = useState<InventoryItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [quickUpdates, setQuickUpdates] = useState<Partial<UpdateInventoryItem>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [scanHistory, setScanHistory] = useState<Array<{ barcode: string; found: boolean; timestamp: Date }>>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Search item by barcode
  const searchItemMutation = useMutation({
    mutationFn: async (barcode: string): Promise<InventoryItem> => {
      const response = await fetch(`/api/inventory/barcode/${barcode}`);
      if (!response.ok) {
        throw new Error('Item not found');
      }
      return response.json();
    },
    onSuccess: (item: InventoryItem, barcode) => {
      setScannedItem(item);
      setIsEditing(false);
      setQuickUpdates({});
      addToScanHistory(barcode, true);
      onItemFound?.(item);
      
      toast({
        title: "Article trouvé",
        description: `${item.designation} - ${item.num_inventaire}`,
        duration: 3000,
      });
    },
    onError: (_error: any, barcode) => {
      setScannedItem(null);
      addToScanHistory(barcode, false);
      onItemNotFound?.(barcode);
      
      toast({
        title: "Article non trouvé",
        description: `Code-barres: ${barcode}`,
        variant: "destructive",
        duration: 3000,
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<UpdateInventoryItem> }): Promise<InventoryItem> => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Update failed');
      return response.json();
    },
    onSuccess: (updatedItem: InventoryItem) => {
      setScannedItem(updatedItem);
      setIsEditing(false);
      setQuickUpdates({});
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      
      toast({
        title: "Mise à jour réussie",
        description: "L'article a été mis à jour avec succès",
      });
    },
    onError: (_error) => {
      toast({
        title: "Erreur de mise à jour",
        description: "Impossible de mettre à jour l'article",
        variant: "destructive",
      });
    }
  });



  function handleManualScan() {
    if (!manualBarcode.trim()) return;
    
    const validation = validateBarcode(manualBarcode.trim());
    if (!validation.isValid) {
      toast({
        title: "Code-barres invalide",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    searchItemMutation.mutate(manualBarcode);
    setManualBarcode('');
  }



  function handleQuickUpdate() {
    if (!scannedItem || Object.keys(quickUpdates).length === 0) return;

    updateItemMutation.mutate({
      id: scannedItem.id,
      updates: quickUpdates
    });
  }

  function addToScanHistory(barcode: string, found: boolean) {
    setScanHistory(prev => [{
      barcode,
      found,
      timestamp: new Date()
    }, ...prev.slice(0, 9)]);
  }

  function clearScanHistory() {
    setScanHistory([]);
  }

  const handleFieldChange = (field: keyof UpdateInventoryItem, value: string | number) => {
    setQuickUpdates(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Network Status */}
      <Alert className={isOnline ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
        <div className="flex items-center gap-2">
          {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
          <AlertDescription className={isOnline ? "text-green-700" : "text-red-700"}>
            {isOnline ? "En ligne" : "Hors ligne - Les mises à jour seront synchronisées à la reconnexion"}
          </AlertDescription>
        </div>
      </Alert>

      {/* Scanner Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            Scanner Rapide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">


          {/* Manual Input */}
          <div className="space-y-2">
            <Label htmlFor="manual-barcode">Saisie manuelle</Label>
            <div className="flex gap-2">
              <Input
                id="manual-barcode"
                placeholder="Entrez le code-barres"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()}
                className="flex-1"
                disabled={!isOnline}
              />
              <Button 
                onClick={handleManualScan}
                disabled={!manualBarcode.trim() || !isOnline}
                size="icon"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={clearScanHistory}
              disabled={scanHistory.length === 0}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Effacer l'historique
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setScannedItem(null);
                setManualBarcode('');
                setIsEditing(false);
                setQuickUpdates({});
              }}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Nouveau scan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Scanned Item Details */}
      {scannedItem && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <span className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Article Trouvé
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Item Basic Info */}
            <div className="space-y-2">
              <div>
                <Label className="text-xs text-muted-foreground">Désignation</Label>
                <p className="font-medium">{scannedItem.designation}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">N° Inventaire</Label>
                  <p className="text-sm">{scannedItem.num_inventaire}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Code-barres</Label>
                  <p className="text-sm font-mono">{scannedItem.code_barre}</p>
                </div>
              </div>
            </div>

            {/* Quick Update Fields */}
            {isEditing && (
              <div className="space-y-4 pt-3 border-t">
                <h4 className="font-medium text-sm">Mise à jour rapide</h4>
                {QUICK_UPDATE_FIELDS.map((fieldConfig) => (
                  <div key={fieldConfig.field} className="space-y-1">
                    <Label className="text-xs">{fieldConfig.label}</Label>
                    {fieldConfig.type === 'select' ? (
                      <select
                        className="w-full p-2 border rounded-md text-sm"
                        value={quickUpdates[fieldConfig.field] as string || ''}
                        onChange={(e) => handleFieldChange(fieldConfig.field, e.target.value)}
                      >
                        <option value="">-- Sélectionner --</option>
                        {fieldConfig.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        type={fieldConfig.type}
                        placeholder={`Nouveau ${fieldConfig.label.toLowerCase()}`}
                        value={quickUpdates[fieldConfig.field] as string || ''}
                        onChange={(e) => handleFieldChange(
                          fieldConfig.field, 
                          fieldConfig.type === 'number' ? Number(e.target.value) : e.target.value
                        )}
                        className="text-sm"
                      />
                    )}
                  </div>
                ))}
                
                <Button
                  onClick={handleQuickUpdate}
                  disabled={Object.keys(quickUpdates).length === 0 || updateItemMutation.isPending}
                  className="w-full"
                >
                  {updateItemMutation.isPending ? (
                    "Mise à jour..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Current Item Status */}
            <div className="grid grid-cols-2 gap-4 pt-3 border-t">
              <div>
                <Label className="text-xs text-muted-foreground">État</Label>
                <Badge variant="outline" className="text-xs">
                  {scannedItem.condition}
                </Badge>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bureau</Label>
                <p className="text-sm">{scannedItem.num_bureau}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Bénéficiaire</Label>
                <p className="text-sm">{scannedItem.beneficiaire}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Prix</Label>
                <p className="text-sm">{typeof scannedItem.prix === 'number' ? scannedItem.prix.toFixed(2) : scannedItem.prix} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Search className="h-5 w-5" />
              Historique des recherches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {scan.found ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-mono text-sm">{scan.barcode}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {scan.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}