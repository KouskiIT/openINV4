import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarcodeUtils, type BarcodeInfo } from '@/lib/barcode-utils';
import { CheckCircle, AlertTriangle, Info, QrCode } from 'lucide-react';

interface BarcodeInfoDisplayProps {
  barcodeInfo: BarcodeInfo;
  className?: string;
}

export function BarcodeInfoDisplay({ barcodeInfo, className }: BarcodeInfoDisplayProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <QrCode className="h-5 w-5" />
          Informations Code-barres
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Code and format */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Code :</span>
            <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {barcodeInfo.code}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Format :</span>
            <Badge className={`${BarcodeUtils.getTypeColor(barcodeInfo.type)} flex items-center gap-1`}>
              <span>{BarcodeUtils.getTypeIcon(barcodeInfo.type)}</span>
              <span>{barcodeInfo.format}</span>
            </Badge>
          </div>
        </div>

        {/* Validation status */}
        <Alert variant={barcodeInfo.isValid ? "default" : "destructive"}>
          <div className="flex items-center gap-2">
            {barcodeInfo.isValid ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className="flex-1">
              <span className="font-medium">
                {barcodeInfo.isValid ? 'Format valide' : 'Format invalide'}
              </span>
              {barcodeInfo.checkDigit && (
                <span className="ml-2 text-xs text-gray-600 dark:text-gray-400">
                  (Chiffre de contrôle: {barcodeInfo.checkDigit})
                </span>
              )}
            </AlertDescription>
          </div>
        </Alert>

        {/* Description */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">À propos de ce format :</p>
              <p className="text-blue-800 dark:text-blue-200">{barcodeInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Format-specific information */}
        {barcodeInfo.type === 'EAN-13' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Standard européen pour produits de consommation</p>
            <p>• Compatible avec les systèmes de point de vente</p>
            <p>• 13 chiffres avec validation automatique</p>
          </div>
        )}

        {barcodeInfo.type === 'Code128' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Format haute densité et flexibilité</p>
            <p>• Supporte lettres, chiffres et caractères spéciaux</p>
            <p>• Largement utilisé dans la logistique</p>
          </div>
        )}

        {barcodeInfo.type === 'UPC-A' && (
          <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p>• Standard américain (12 chiffres)</p>
            <p>• Principalement pour produits de consommation</p>
            <p>• Compatible avec systèmes de point de vente US</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}