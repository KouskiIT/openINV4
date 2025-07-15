import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarcodeUtils, type BarcodeInfo } from '@/lib/barcode-utils';
import { BarChart3, TrendingUp } from 'lucide-react';

interface BarcodeTypeStatsProps {
  barcodeHistory: BarcodeInfo[];
  className?: string;
}

export function BarcodeTypeStats({ barcodeHistory, className }: BarcodeTypeStatsProps) {
  // Count barcode types
  const typeCounts = barcodeHistory.reduce((acc, info) => {
    acc[info.type] = (acc[info.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate validation rate
  const validCount = barcodeHistory.filter(info => info.isValid).length;
  const validationRate = barcodeHistory.length > 0 ? (validCount / barcodeHistory.length) * 100 : 0;

  // Most scanned type
  const mostScannedType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0]?.[0];

  if (barcodeHistory.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Aucune statistique de codes-barres disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BarChart3 className="h-5 w-5" />
          Statistiques des Types
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {barcodeHistory.length}
            </div>
            <div className="text-sm text-blue-800 dark:text-blue-300">Total scannés</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {validationRate.toFixed(0)}%
            </div>
            <div className="text-sm text-green-800 dark:text-green-300">Valides</div>
          </div>
        </div>

        {/* Type breakdown */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
            Types détectés :
          </h4>
          <div className="space-y-2">
            {Object.entries(typeCounts)
              .sort(([,a], [,b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <Badge className={`${BarcodeUtils.getTypeColor(type as any)} flex items-center gap-1`}>
                    <span>{BarcodeUtils.getTypeIcon(type as any)}</span>
                    <span>{type}</span>
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(count / barcodeHistory.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Most popular */}
        {mostScannedType && (
          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-yellow-600" />
              <div className="text-sm">
                <span className="font-medium text-yellow-900 dark:text-yellow-100">
                  Type le plus scanné :
                </span>
                <Badge className={`ml-2 ${BarcodeUtils.getTypeColor(mostScannedType as any)}`}>
                  {BarcodeUtils.getTypeIcon(mostScannedType as any)} {mostScannedType}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Recent activity */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
            Activité récente :
          </h4>
          <div className="space-y-1">
            {barcodeHistory.slice(-3).reverse().map((info, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <Badge size="sm" className={BarcodeUtils.getTypeColor(info.type)}>
                  {BarcodeUtils.getTypeIcon(info.type)} {info.format}
                </Badge>
                <span className="text-gray-500 font-mono">
                  {info.code.slice(0, 8)}...
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}