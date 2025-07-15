import React, { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Smartphone, Camera, Edit, Layers } from 'lucide-react';
import { MobileThemeToggle } from '@/components/mobile-theme-toggle';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MobileQuickScan } from '@/components/mobile-quick-scan';
import { BarcodeScanner } from '@/components/barcode-scanner';
import { ErrorBoundary } from '@/components/error-boundary';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { InventoryItem, InsertSearchResult } from '@shared/schema';

export default function MobileScanPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("camera");

  // Add search result for items not found
  const addSearchResultMutation = useMutation({
    mutationFn: async (searchResult: InsertSearchResult) => {
      const response = await fetch('/api/search-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchResult),
      });
      if (!response.ok) throw new Error('Failed to add search result');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
    }
  });

  const handleItemFound = (item: InventoryItem) => {
    // Add to search results with found status
    addSearchResultMutation.mutate({
      code_barre: item.code_barre,
      designation: item.designation,
      found: true,
      scan_count: 1
    });
  };

  const handleItemNotFound = (barcode: string) => {
    // Add to search results with not found status
    addSearchResultMutation.mutate({
      code_barre: barcode,
      designation: null,
      found: false,
      scan_count: 1
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              <h1 className="font-semibold">Scanner Mobile</h1>
            </div>
          </div>
          
          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <MobileThemeToggle />
            <Link href="/themes">
              <Button variant="outline" size="sm" className="text-xs">
                🎨
              </Button>
            </Link>
            <Link href="/mobile-scan-advanced">
              <Button variant="outline" size="sm" className="text-xs">
                Avancé
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-md mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Caméra
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Manuel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Scanner avec Caméra
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ErrorBoundary>
                  <BarcodeScanner
                    onBarcodeScanned={(barcode) => {
                      // Try to find the item first
                      fetch(`/api/inventory/barcode/${barcode}`)
                        .then(response => response.ok ? response.json() : null)
                        .then(item => {
                          if (item) {
                            handleItemFound(item);
                          } else {
                            handleItemNotFound(barcode);
                          }
                        })
                        .catch(() => handleItemNotFound(barcode));
                    }}
                    isActive={activeTab === "camera"}
                  />
                </ErrorBoundary>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <ErrorBoundary>
              <MobileQuickScan 
                onItemFound={handleItemFound}
                onItemNotFound={handleItemNotFound}
              />
            </ErrorBoundary>
          </TabsContent>
        </Tabs>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="flex items-center justify-around px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs">Retour</span>
            </Button>
          </Link>
          
          <Link href="/mobile-scan-advanced">
            <Button variant="ghost" size="sm" className="flex flex-col items-center gap-1 h-auto py-2">
              <Layers className="h-4 w-4" />
              <span className="text-xs">Scanner Lot</span>
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex flex-col items-center gap-1 h-auto py-2"
            onClick={() => window.location.reload()}
          >
            <Smartphone className="h-4 w-4" />
            <span className="text-xs">Actualiser</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile Navigation Spacer */}
      <div className="h-20" />
      
      {/* Footer avec copyright */}
      <footer className="bg-card/50 backdrop-blur-sm border-t border-border/50 mt-8">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <div className="text-center">
              <span>© 2025 • Développé par Abdelmalek Halfaoui</span>
            </div>
            <div className="flex items-center gap-3">
              <a 
                href="mailto:halfaoui.abdelmalek@gmail.com" 
                className="hover:text-foreground transition-colors duration-200"
                title="Email"
              >
                ✉️ Email
              </a>
              <a 
                href="https://www.linkedin.com/in/abdelmalek-halfaoui-a134a5175/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors duration-200"
                title="LinkedIn"
              >
                💼 LinkedIn
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}