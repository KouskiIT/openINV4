import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import { InventoryTable } from "@/components/inventory-table";
import { AdvancedFilters } from "@/components/advanced-filters";
import { ItemDetailsModal } from "@/components/item-details-modal";
import { FloatingActionButtons } from "@/components/floating-action-buttons";
import { AddItemModal } from "@/components/add-item-modal";

import { ScanHistoryTable, type ScanHistoryItem } from "@/components/scan-history-table";
import { SearchModeTable } from "@/components/search-mode-table";
import { MobileBarcodeScanner } from "@/components/mobile-barcode-scanner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileSpreadsheet, Package, CheckCircle, XCircle, DollarSign, Search, History, Upload, Trash2, Archive, Clock, SearchX, Database, ChevronRight, Smartphone } from "lucide-react";
import { SimpleThemeToggle } from "@/components/simple-theme-toggle";
import { Link } from "wouter";
import { importFromExcel } from "@/lib/excel-utils";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { DeletedItemsTable } from "@/components/deleted-items-table";
import type { InventoryItem, SearchFilters, DeletedItem, InsertInventoryItem } from "@shared/schema";

export default function InventoryPage() {
  const { toast } = useToast();

  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [initialFormValues, setInitialFormValues] = useState<Partial<InsertInventoryItem>>({});

  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState("date_ajouter");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState("inventory");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [showScanner, setShowScanner] = useState(false);



  // Fetch inventory data
  const { data: inventoryData, isLoading, refetch } = useQuery({
    queryKey: ["/api/inventory", { filters: searchFilters, page: currentPage, limit: pageSize, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });
      
      if (Object.keys(searchFilters).length > 0) {
        params.append('filters', JSON.stringify(searchFilters));
      }
      
      const response = await fetch(`/api/inventory?${params}`);
      if (!response.ok) throw new Error('Failed to fetch inventory');
      return response.json();
    },
  });

  // Fetch inventory stats with improved caching
  const { data: stats } = useQuery({
    queryKey: ["/api/inventory-stats"],
    staleTime: 2 * 60 * 1000, // 2 minutes - stats change when items are added/removed
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
  });

  // Fetch filter options with long-term caching (rarely changes)
  const { data: filterOptions } = useQuery({
    queryKey: ["/api/filter-options"],
    staleTime: 30 * 60 * 1000, // 30 minutes - departments/categories change infrequently
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
  }) as { data: { departments: string[]; categories: string[]; conditions: string[]; } | undefined };

  // Fetch search results data  
  const { data: searchResultsData } = useQuery({
    queryKey: ['/api/search-results'],
  });

  // Fetch deleted items data
  const { data: deletedItemsData, isLoading: deletedItemsLoading } = useQuery({
    queryKey: ['/api/deleted-items'],
  });

  const handleExportExcel = async () => {
    try {
      const response = await fetch("/api/inventory/export/excel");
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventaire_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export réussi",
        description: "Le fichier Excel a été téléchargé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le fichier Excel.",
        variant: "destructive",
      });
    }
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      toast({
        title: "Import en cours...",
        description: "Traitement du fichier Excel en cours.",
      });

      const data = await importFromExcel(file);
      
      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
          // Mapping plus flexible pour supporter différents formats de colonnes
          const itemData = {
            code_barre: String(row['Code-barres'] || row['code_barre'] || row['Code barres'] || row['CODEBARRE'] || '').trim(),
            num_inventaire: String(row['N° Inventaire'] || row['Numéro d\'inventaire'] || row['num_inventaire'] || row['Num Inventaire'] || '').trim(),
            old_num_inventaire: String(row['Ancien N° Inventaire'] || row['old_num_inventaire'] || row['Ancien Num'] || '').trim() || null,
            designation: String(row['Désignation'] || row['designation'] || row['DESIGNATION'] || '').trim(),
            departement: String(row['Département'] || row['departement'] || row['Bureau'] || row['DEPARTEMENT'] || '').trim(),
            num_bureau: String(row['N° Bureau'] || row['num_bureau'] || row['Bureau'] || row['Numero Bureau'] || '').trim(),
            beneficiaire: String(row['Bénéficiaire'] || row['beneficiaire'] || row['BENEFICIAIRE'] || '').trim(),
            quantite: Math.max(1, parseInt(String(row['Quantité'] || row['quantite'] || row['QTE'] || '1')) || 1),
            prix: String(row['Prix (DA)'] || row['Prix'] || row['prix'] || row['PRIX'] || '0').replace(/[^\d.,]/g, '').replace(',', '.') || '0',
            categorie: String(row['Catégorie'] || row['categorie'] || row['CATEGORIE'] || '').trim(),
            num_serie: String(row['N° Série'] || row['Numéro de série'] || row['num_serie'] || row['Serie'] || '').trim() || null,
            description: String(row['Description'] || row['description'] || row['DESC'] || '').trim() || null,
            condition: String(row['Condition'] || row['État'] || row['condition'] || row['CONDITION'] || 'Bon').trim()
          };

          // Validation des champs requis
          if (!itemData.code_barre || !itemData.designation || !itemData.num_inventaire || !itemData.departement || !itemData.num_bureau || !itemData.beneficiaire) {
            console.log('Ligne ignorée - champs requis manquants:', {
              code_barre: itemData.code_barre,
              designation: itemData.designation,
              num_inventaire: itemData.num_inventaire,
              departement: itemData.departement,
              num_bureau: itemData.num_bureau,
              beneficiaire: itemData.beneficiaire
            });
            errorCount++;
            continue;
          }

          // Validation du prix
          const prixValue = parseFloat(itemData.prix);
          if (isNaN(prixValue) || prixValue < 0) {
            itemData.prix = '0';
          }

          const response = await fetch('/api/inventory', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            console.error('Erreur création article:', errorData);
            errorCount++;
          }
        } catch (error) {
          console.error('Erreur traitement ligne:', error);
          errorCount++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-stats'] });

      if (successCount > 0) {
        toast({
          title: "Import réussi",
          description: `${successCount} article(s) importé(s) avec succès${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}.`,
          variant: errorCount > successCount ? "destructive" : "default"
        });
      } else {
        toast({
          title: "Échec de l'import",
          description: `Aucun article importé. ${errorCount} erreur(s). Vérifiez le format de votre fichier Excel.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('Erreur import Excel:', error);
      toast({
        title: "Erreur d'import",
        description: "Impossible de traiter le fichier Excel. Vérifiez que le fichier n'est pas corrompu et contient les bonnes colonnes.",
        variant: "destructive",
      });
    }

    event.target.value = '';
  };

  const handleBarcodeScanned = async (barcode: string, barcodeInfo?: any, deps?: string, numbs?: string) => {
    try {
      // Rechercher l'article par code-barres
      const response = await fetch(`/api/inventory/barcode/${barcode}`);
      const data = await response.json();
      
      const now = new Date();
      
      if (response.ok) {
        // Article trouvé - mettre à jour l'historique
        const existingHistoryItem = scanHistory.find(item => item.codeBarre === barcode);
        
        if (existingHistoryItem) {
          // Incrémenter le nombre de scans
          setScanHistory(prev => prev.map(item => 
            item.codeBarre === barcode 
              ? { ...item, nombreScanne: item.nombreScanne + 1, derniereDate: now }
              : item
          ));
        } else {
          // Ajouter un nouvel élément à l'historique
          const newHistoryItem: ScanHistoryItem = {
            id: `${barcode}-${Date.now()}`,
            codeBarre: barcode,
            designation: data.designation,
            disponible: data.quantite > 0,
            nombreScanne: 1,
            dateScanne: now,
            derniereDate: now,
            departement: data.departement,
            bureau: data.num_bureau,
            beneficiaire: data.beneficiaire,
            prix: parseFloat(data.prix),
            deps: deps || '-',
            numbs: numbs || '-'
          };
          setScanHistory(prev => [...prev, newHistoryItem]);
        }
        
        // Save found result to database
        try {
          await fetch('/api/search-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code_barre: barcode, 
              found: true,
              designation: data.designation 
            })
          });
          
          // Refresh search results data
          queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
        } catch (error) {
          console.error("Error saving search result:", error);
        }

        // Switch to appropriate tab
        if (!isSearchMode) {
          setActiveTab("history");
        }
        
        toast({
          title: barcodeInfo ? `${barcodeInfo.type} scanné` : "Code scanné",
          description: `${data.designation} - ${data.quantite > 0 ? 'Disponible' : 'Non disponible'}${barcodeInfo && barcodeInfo.isValid ? ' ✓' : barcodeInfo ? ' ⚠️' : ''}`,
        });
      } else {
        // Article non trouvé - ajouter à l'historique comme non disponible
        const existingHistoryItem = scanHistory.find(item => item.codeBarre === barcode);
        
        if (existingHistoryItem) {
          setScanHistory(prev => prev.map(item => 
            item.codeBarre === barcode 
              ? { ...item, nombreScanne: item.nombreScanne + 1, derniereDate: now }
              : item
          ));
        } else {
          const newHistoryItem: ScanHistoryItem = {
            id: `${barcode}-${Date.now()}`,
            codeBarre: barcode,
            designation: 'Article non trouvé',
            disponible: false,
            nombreScanne: 1,
            dateScanne: now,
            derniereDate: now,
            departement: 'Inconnu',
            bureau: 'Inconnu',
            beneficiaire: 'Inconnu',
            prix: 0,
            deps: deps || '-',
            numbs: numbs || '-'
          };
          setScanHistory(prev => [...prev, newHistoryItem]);
        }

        // Save not found result to database
        try {
          await fetch('/api/search-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code_barre: barcode, found: false })
          });
          
          // Refresh search results data
          queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
          
          if (!isSearchMode) {
            setActiveTab("search");
          }
        } catch (error) {
          console.error("Error saving search result:", error);
        }
        
        toast({
          title: barcodeInfo ? `${barcodeInfo.type} non trouvé` : "Code non trouvé",
          description: `Code-barres ${barcode} sauvegardé dans les résultats de recherche.${barcodeInfo && !barcodeInfo.isValid ? ' (format invalide)' : ''}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de recherche",
        description: "Impossible de rechercher l'article.",
        variant: "destructive",
      });
    }
    
    if (!isSearchMode) {
      setShowScanner(false);
    }
  };



  const handleRemoveNotFoundResult = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/search-results/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete search result');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
      toast({
        title: "Résultat supprimé",
        description: "Le résultat de recherche a été supprimé.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le résultat.",
        variant: "destructive",
      });
    },
  });

  const handleClearNotFoundResults = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/search-results', {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear search results');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
      toast({
        title: "Résultats effacés",
        description: "Tous les résultats de recherche ont été supprimés.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effacer les résultats.",
        variant: "destructive",
      });
    },
  });

  const handleClearFoundResults = useMutation({
    mutationFn: async () => {
      const foundResults = (searchResultsData || []).filter((result: any) => result.found);
      const deletePromises = foundResults.map((result: any) => 
        fetch(`/api/search-results/${result.id}`, {
          method: 'DELETE',
        })
      );
      const responses = await Promise.all(deletePromises);
      
      for (const response of responses) {
        if (!response.ok) {
          throw new Error('Failed to delete found results');
        }
      }
      
      return { deletedCount: foundResults.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/search-results'] });
      toast({
        title: "Articles trouvés effacés",
        description: `${data.deletedCount} article(s) trouvé(s) supprimé(s).`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'effacer les articles trouvés.",
        variant: "destructive",
      });
    },
  });

  // Handle restore deleted item
  const handleRestoreItem = useMutation({
    mutationFn: async (item: DeletedItem) => {
      const response = await fetch(`/api/deleted-items/${item.id}/restore`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restore item');
      return response.json();
    },
    onSuccess: (restoredItem) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Article restauré",
        description: `${restoredItem.designation} a été restauré avec succès.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer l'article.",
        variant: "destructive",
      });
    },
  });

  // Handle permanent delete
  const handlePermanentDelete = useMutation({
    mutationFn: async (item: DeletedItem) => {
      const response = await fetch(`/api/deleted-items/${item.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to permanently delete item');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Article supprimé définitivement",
        description: "L'article a été supprimé définitivement.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer définitivement l'article.",
        variant: "destructive",
      });
    },
  });

  // Handle bulk delete
  const handleBulkDelete = useMutation({
    mutationFn: async (itemIds: number[]) => {
      const response = await fetch('/api/inventory/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds }),
      });
      if (!response.ok) throw new Error('Failed to bulk delete items');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Articles supprimés",
        description: `${data.deletedCount} article(s) supprimé(s) avec succès.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer les articles sélectionnés.",
        variant: "destructive",
      });
    },
  });

  // Handle bulk restore deleted items
  const handleBulkRestore = useMutation({
    mutationFn: async (items: DeletedItem[]) => {
      const response = await fetch('/api/deleted-items/bulk-restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds: items.map(item => item.id) }),
      });
      if (!response.ok) throw new Error('Failed to bulk restore items');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/inventory'] });
      queryClient.invalidateQueries({ queryKey: ['/api/inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Articles restaurés",
        description: `${data.restoredCount} article(s) restauré(s) avec succès.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de restaurer les articles sélectionnés.",
        variant: "destructive",
      });
    },
  });

  // Handle bulk permanent delete
  const handleBulkPermanentDelete = useMutation({
    mutationFn: async (items: DeletedItem[]) => {
      const response = await fetch('/api/deleted-items/bulk-permanent-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds: items.map(item => item.id) }),
      });
      if (!response.ok) throw new Error('Failed to bulk permanent delete items');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/deleted-items'] });
      toast({
        title: "Articles supprimés définitivement",
        description: `${data.deletedCount} article(s) supprimé(s) définitivement.`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer définitivement les articles sélectionnés.",
        variant: "destructive",
      });
    },
  });

  const handleClearScanHistory = () => {
    setScanHistory([]);
    toast({
      title: "Historique vidé",
      description: "Tout l'historique des scans a été supprimé.",
    });
  };

  const handleRemoveScanHistoryItem = (id: string) => {
    setScanHistory(prev => prev.filter(item => item.id !== id));
    toast({
      title: "Élément supprimé",
      description: "L'élément a été retiré de l'historique.",
    });
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Use global search across all fields
      setSearchFilters({
        fullTextSearch: query.trim()
      });
      setCurrentPage(1); // Reset to first page
      setActiveTab("inventory");
    } else {
      // Clear filters when search is empty
      setSearchFilters({});
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-DZ', {
      style: 'currency',
      currency: 'DZD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900 text-foreground relative overflow-hidden">
      {/* Arrière-plan décoratif global */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-200/30 to-purple-200/30 dark:from-blue-800/20 dark:to-purple-800/20 rounded-full blur-3xl animate-morphing"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-yellow-200/30 dark:from-pink-800/20 dark:to-yellow-800/20 rounded-full blur-3xl animate-morphing delay-1000"></div>
      </div>
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
        {/* Ultra-Modern Header */}
        <header className="relative bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 border-b border-border/30 backdrop-blur-xl">
          <div className="absolute inset-0 opacity-5 dark:opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(68,68,68,0.1)_25%,rgba(68,68,68,0.1)_50%,transparent_50%,transparent_75%,rgba(68,68,68,0.1)_75%)] bg-[length:20px_20px]"></div>
          </div>
          
          <div className="relative z-10 px-4 py-6">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 animate-pulse"></div>
                    <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-600 shadow-xl">
                      <Database className="h-7 w-7 text-white" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Gestion d'Inventaire
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="absolute top-0 left-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                        </div>
                        <span>En ligne</span>
                      </div>
                      <div className="w-px h-4 bg-border"></div>
                      <span>{stats?.totalItems.toLocaleString()} articles</span>
                      <div className="w-px h-4 bg-border"></div>
                      <span>Scanner avancé</span>
                    </div>
                  </div>
                </div>
              
                <div className="flex flex-wrap items-center gap-3">
                  <Button 
                  onClick={() => setShowAddModal(true)} 
                  size="sm" 
                  className="group relative overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                  <Plus className="mr-2 h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
                  <span className="hidden sm:inline relative z-10">Nouveau Article</span>
                  <span className="sm:hidden relative z-10">Nouveau</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleExportExcel} 
                  size="sm" 
                  className="group relative overflow-hidden border-2 border-green-200 dark:border-green-800 hover:border-green-400 dark:hover:border-green-600 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900 dark:hover:to-emerald-900 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600 dark:text-green-400 transition-transform duration-300 group-hover:scale-110" />
                  <span className="hidden sm:inline relative z-10 text-green-700 dark:text-green-300">Exporter Excel</span>
                  <span className="sm:hidden relative z-10 text-green-700 dark:text-green-300">Export</span>
                </Button>
                
                <div className="relative flex-shrink-0">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleImportExcel}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    id="excel-import-header"
                  />
                  <Button 
                    variant="outline" 
                    asChild 
                    size="sm"
                    className="group relative overflow-hidden border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900 dark:hover:to-cyan-900 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                  >
                    <label htmlFor="excel-import-header" className="cursor-pointer flex items-center">
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                      <Upload className="mr-2 h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110 group-hover:-translate-y-0.5" />
                      <span className="hidden sm:inline relative z-10 text-blue-700 dark:text-blue-300">Importer Excel</span>
                      <span className="sm:hidden relative z-10 text-blue-700 dark:text-blue-300">Import</span>
                    </label>
                  </Button>
                </div>

                <Link href="/mobile-scan">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="group relative overflow-hidden lg:hidden flex-shrink-0 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900 dark:hover:to-pink-900 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    title="Scanner Mobile"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <Smartphone className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" />
                    <span className="hidden sm:inline relative z-10 text-purple-700 dark:text-purple-300">Scanner Mobile</span>
                    <span className="sm:hidden relative z-10 text-purple-700 dark:text-purple-300">Scanner</span>
                  </Button>
                </Link>



                <Link href="/themes">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="group relative overflow-hidden flex items-center flex-shrink-0 border-2 border-orange-200 dark:border-orange-800 hover:border-orange-400 dark:hover:border-orange-600 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900 dark:hover:to-amber-900 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                    title="Personnaliser les thèmes"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
                    <span className="text-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">🎨</span>
                    <span className="hidden sm:inline ml-2 relative z-10 text-orange-700 dark:text-orange-300">Thèmes</span>
                  </Button>
                </Link>

                <div className="relative">
                  <SimpleThemeToggle />
                </div>
                
                {/* Modern Status Card */}
                <div className="hidden lg:block">
                  <div className="relative p-3 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border border-border/50 shadow-sm">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400/5 to-blue-400/5 rounded-xl"></div>
                    <div className="relative z-10 text-right">
                      <div className="flex items-center gap-2 justify-end mb-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="text-xs text-muted-foreground">Synchronisé</p>
                      </div>
                      <p className="text-xs font-medium">Il y a 2 minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        </header>

        {/* Main Content avec arrière-plan moderne */}
        <main className="relative flex-1 overflow-y-auto p-3 lg:p-6">
          {/* Arrière-plan décoratif animé */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-blue-100/30 to-purple-100/30 dark:from-blue-900/20 dark:to-purple-900/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-80 h-80 bg-gradient-to-br from-pink-100/30 to-yellow-100/30 dark:from-pink-900/20 dark:to-yellow-900/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-green-100/20 to-blue-100/20 dark:from-green-900/10 dark:to-blue-900/10 rounded-full blur-3xl animate-pulse delay-500"></div>
          </div>
          <div className="relative z-10 flex gap-3 lg:gap-6">
            {/* Main Content Area avec verre effet */}
            <div className="flex-1 min-w-0 bg-white/40 dark:bg-black/20 backdrop-blur-sm rounded-3xl p-6 border border-white/30 dark:border-white/10 shadow-2xl mt-[0px] mb-[0px] ml-[-4px] mr-[-4px] pt-[5px] pb-[5px] text-left">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="h-10 items-center justify-center text-muted-foreground grid w-full grid-cols-4 bg-gradient-to-r from-slate-50/80 via-white/90 to-slate-50/80 dark:from-slate-900/80 dark:via-slate-800/90 dark:to-slate-900/80 backdrop-blur-xl p-2 rounded-3xl shadow-2xl border-2 border-white/20 dark:border-white/10 relative overflow-hidden mt-[6px] mb-[6px] ml-[0px] mr-[0px] pl-[9px] pr-[9px] pt-[0px] pb-[0px]">
              {/* Arrière-plan animé */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 animate-pulse"></div>
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(120,119,198,0.1),transparent)]"></div>
              <TabsTrigger value="inventory" className="relative flex items-center justify-start text-sm px-6 py-5 transition-all duration-700 hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-indigo-50 dark:data-[state=active]:from-blue-950/50 dark:data-[state=active]:to-indigo-950/50 data-[state=active]:shadow-2xl rounded-2xl group border-2 border-transparent data-[state=active]:border-blue-200/50 dark:data-[state=active]:border-blue-700/50 overflow-hidden transform hover:rotate-1 data-[state=active]:rotate-0">
                {/* Effet de lueur active renforcé */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 opacity-0 group-data-[state=active]:opacity-100 transition-all duration-700"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 opacity-0 group-data-[state=active]:opacity-20 blur-xl transition-all duration-700 mt-[34px] mb-[34px] pl-[151px] pr-[151px] pt-[-24px] pb-[-24px] ml-[3px] mr-[3px]"></div>
                
                {/* Icône avec effet d'ondulation avancé */}
                <div className="relative mr-4 p-3 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/50 dark:to-indigo-950/50 group-data-[state=active]:from-blue-100 group-data-[state=active]:to-indigo-100 dark:group-data-[state=active]:from-blue-900/80 dark:group-data-[state=active]:to-indigo-900/80 transition-all duration-500 group-hover:scale-125 group-hover:rotate-12 shadow-lg group-data-[state=active]:shadow-xl">
                  <Database className="h-6 w-6 text-blue-600 dark:text-blue-400 group-data-[state=active]:text-blue-700 dark:group-data-[state=active]:text-blue-300 transition-all duration-500 group-hover:drop-shadow-lg" />
                  
                  {/* Effet d'ondulation au clic renforcé */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/30 to-indigo-400/30 scale-0 group-data-[state=active]:animate-pulse opacity-75"></div>
                  <div className="absolute inset-0 rounded-2xl bg-blue-500/20 scale-0 group-data-[state=active]:animate-ping opacity-50 ml-[16px] mr-[16px] mt-[19px] mb-[19px] pl-[-7px] pr-[-7px] pt-[-8px] pb-[-8px]"></div>
                </div>
                
                {/* Texte et badge */}
                <div className="flex items-center gap-2 relative z-10 flex-1">
                  <span className="font-bold text-foreground group-data-[state=active]:text-blue-700 dark:group-data-[state=active]:text-blue-300 transition-all duration-500 group-hover:scale-105 ml-[1px] mr-[1px] text-[14px]">
                    Inventaire
                  </span>
                  
                  {stats && (
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 group-data-[state=active]:animate-pulse"></div>
                      <span className="text-sm font-black text-blue-700 dark:text-blue-300 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/70 dark:to-indigo-900/70 px-3 py-1.5 rounded-xl shadow-lg border border-blue-200/50 dark:border-blue-700/50">
                        {stats.totalItems.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Indicateur de sélection moderne */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-12 bg-gradient-to-b from-blue-400 to-indigo-600 scale-y-0 group-data-[state=active]:scale-y-100 transition-all duration-500 rounded-r-2xl shadow-lg"></div>
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400 scale-x-0 group-data-[state=active]:scale-x-100 transition-transform duration-500 rounded-full"></div>
              </TabsTrigger>
              <TabsTrigger value="search" className="relative flex items-center justify-start text-sm px-6 py-5 transition-all duration-700 hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-50 data-[state=active]:to-green-50 dark:data-[state=active]:from-emerald-950/50 dark:data-[state=active]:to-green-950/50 data-[state=active]:shadow-2xl rounded-2xl group border-2 border-transparent data-[state=active]:border-emerald-200/50 dark:data-[state=active]:border-emerald-700/50 overflow-hidden transform hover:rotate-1 data-[state=active]:rotate-0">
                {/* Effet de lueur active */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-data-[state=active]:opacity-100 transition-all duration-500 mt-[19px] mb-[19px]"></div>
                
                {/* Icône avec effet d'ondulation */}
                <div className="relative mr-3 p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 group-data-[state=active]:bg-emerald-100/80 dark:group-data-[state=active]:bg-emerald-900/50 transition-all duration-300 group-hover:scale-110">
                  <SearchX className="h-5 w-5 text-emerald-600 dark:text-emerald-400 group-data-[state=active]:text-emerald-700 dark:group-data-[state=active]:text-emerald-300 transition-colors duration-300" />
                  
                  {/* Effet d'ondulation au clic */}
                  <div className="absolute inset-0 rounded-lg bg-emerald-500/20 scale-0 group-data-[state=active]:animate-ping opacity-75"></div>
                </div>
                
                {/* Texte et badge */}
                <div className="flex items-center gap-2 relative z-10 flex-1">
                  <span className="font-medium text-foreground group-data-[state=active]:text-emerald-700 dark:group-data-[state=active]:text-emerald-300 transition-all duration-300">
                    Recherche
                  </span>
                  
                  {searchResultsData && (searchResultsData as any[]).length > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 group-data-[state=active]:animate-pulse"></div>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/50 px-2 py-1 rounded-full">
                        {(searchResultsData as any[]).length}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Indicateur de sélection */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-emerald-500 scale-y-0 group-data-[state=active]:scale-y-100 transition-transform duration-300 rounded-r-full"></div>
              </TabsTrigger>
              <TabsTrigger value="history" className="relative flex items-center justify-start text-sm px-6 py-5 transition-all duration-700 hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-50 data-[state=active]:to-yellow-50 dark:data-[state=active]:from-amber-950/50 dark:data-[state=active]:to-yellow-950/50 data-[state=active]:shadow-2xl rounded-2xl group border-2 border-transparent data-[state=active]:border-amber-200/50 dark:data-[state=active]:border-amber-700/50 overflow-hidden transform hover:rotate-1 data-[state=active]:rotate-0">
                {/* Effet de lueur active */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-data-[state=active]:opacity-100 transition-all duration-500"></div>
                
                {/* Icône avec effet d'ondulation */}
                <div className="relative mr-3 p-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 group-data-[state=active]:bg-amber-100/80 dark:group-data-[state=active]:bg-amber-900/50 transition-all duration-300 group-hover:scale-110">
                  <History className="h-5 w-5 text-amber-600 dark:text-amber-400 group-data-[state=active]:text-amber-700 dark:group-data-[state=active]:text-amber-300 transition-colors duration-300" />
                  
                  {/* Effet d'ondulation au clic */}
                  <div className="absolute inset-0 rounded-lg bg-amber-500/20 scale-0 group-data-[state=active]:animate-ping opacity-75"></div>
                </div>
                
                {/* Texte et badge */}
                <div className="flex items-center gap-2 relative z-10 flex-1">
                  <span className="font-medium text-foreground group-data-[state=active]:text-amber-700 dark:group-data-[state=active]:text-amber-300 transition-all duration-300">
                    Historique
                  </span>
                  
                  {scanHistory.length > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 group-data-[state=active]:animate-pulse"></div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/50 px-2 py-1 rounded-full">
                        {scanHistory.length}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Indicateur de sélection */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-amber-500 scale-y-0 group-data-[state=active]:scale-y-100 transition-transform duration-300 rounded-r-full"></div>
              </TabsTrigger>
              <TabsTrigger value="deleted" className="relative flex items-center justify-start text-sm px-6 py-5 transition-all duration-700 hover:scale-105 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-50 data-[state=active]:to-pink-50 dark:data-[state=active]:from-red-950/50 dark:data-[state=active]:to-pink-950/50 data-[state=active]:shadow-2xl rounded-2xl group border-2 border-transparent data-[state=active]:border-red-200/50 dark:data-[state=active]:border-red-700/50 overflow-hidden transform hover:rotate-1 data-[state=active]:rotate-0">
                {/* Effet de lueur active */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent opacity-0 group-data-[state=active]:opacity-100 transition-all duration-500"></div>
                
                {/* Icône avec effet d'ondulation */}
                <div className="relative mr-3 p-2 rounded-lg bg-red-50/50 dark:bg-red-950/30 group-data-[state=active]:bg-red-100/80 dark:group-data-[state=active]:bg-red-900/50 transition-all duration-300 group-hover:scale-110">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400 group-data-[state=active]:text-red-700 dark:group-data-[state=active]:text-red-300 transition-colors duration-300" />
                  
                  {/* Effet d'ondulation au clic */}
                  <div className="absolute inset-0 rounded-lg bg-red-500/20 scale-0 group-data-[state=active]:animate-ping opacity-75"></div>
                </div>
                
                {/* Texte et badge */}
                <div className="flex items-center gap-2 relative z-10 flex-1">
                  <span className="font-medium text-foreground group-data-[state=active]:text-red-700 dark:group-data-[state=active]:text-red-300 transition-all duration-300">
                    Supprimés
                  </span>
                  
                  {deletedItemsData && (deletedItemsData as any[]).length > 0 && (
                    <div className="flex items-center gap-1 ml-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 group-data-[state=active]:animate-pulse"></div>
                      <span className="text-xs font-bold text-red-700 dark:text-red-300 bg-red-50/80 dark:bg-red-950/50 px-2 py-1 rounded-full">
                        {(deletedItemsData as any[]).length}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Indicateur de sélection */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-red-500 scale-y-0 group-data-[state=active]:scale-y-100 transition-transform duration-300 rounded-r-full"></div>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="space-y-4 lg:space-y-6">
              {/* Search Bar and Advanced Filters */}
              <div className="space-y-3 lg:space-y-4 mt-[7px] mb-[7px] pl-[0px] pr-[0px] pt-[-3px] pb-[-3px]">
                {/* Search Bar */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 lg:gap-4">
                  <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pl-[0px] pr-[0px] pt-[0px] pb-[0px] mt-[22px] mb-[22px]">
                    <div className="relative flex-1 max-w-full lg:max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Recherche avancée..."
                        className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowScanner(true)}
                        className="flex items-center flex-shrink-0"
                      >
                        <Package className="mr-1 lg:mr-2 h-3 w-3 lg:h-4 lg:w-4" />
                        <span className="hidden sm:inline">Scanner</span>
                        <span className="sm:hidden">Scan</span>
                      </Button>
                      
                      <Link href="/mobile-scan">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex items-center md:hidden flex-shrink-0"
                        >
                          <Smartphone className="mr-1 h-3 w-3" />
                          Mobile
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Advanced Filters */}
                <div>
                  <AdvancedFilters
                    filters={searchFilters}
                    onFiltersChange={setSearchFilters}
                    filterOptions={filterOptions as any}
                  />
                </div>
              </div>

              {/* Inventory Table */}
              <InventoryTable
                data={inventoryData}
                isLoading={isLoading}
                onItemSelect={setSelectedItem}
                onItemEdit={(item) => {
                  setEditingItem(item);
                  setShowAddModal(true);
                }}
                onItemDelete={async (item) => {
                  try {
                    const response = await fetch(`/api/inventory/${item.id}`, {
                      method: "DELETE",
                    });
                    
                    if (!response.ok) {
                      throw new Error('Failed to delete item');
                    }
                    
                    // Invalidate and refetch inventory data
                    queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/inventory-stats"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/deleted-items"] });
                    
                    // Switch to deleted tab to show the item was moved there
                    setActiveTab("deleted");
                    
                    toast({
                      title: "Article supprimé",
                      description: `${item.designation} a été déplacé vers la corbeille. Cliquez sur "Corbeille" pour le restaurer.`,
                      action: (
                        <button
                          onClick={() => setActiveTab("deleted")}
                          className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                        >
                          Voir la corbeille
                        </button>
                      ),
                    });
                  } catch (error) {
                    console.error("Error deleting item:", error);
                    toast({
                      title: "Erreur",
                      description: "Impossible de supprimer l'article. Veuillez réessayer.",
                      variant: "destructive",
                    });
                  }
                }}
                currentPage={currentPage}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSort={(field, order) => {
                  setSortBy(field);
                  setSortOrder(order);
                }}
                onExportExcel={handleExportExcel}
                onImportExcel={handleImportExcel}
                onBulkDelete={(itemIds) => handleBulkDelete.mutate(itemIds)}
              />
            </TabsContent>

            <TabsContent value="search" className="space-y-6">
              <SearchModeTable
                searchResults={(searchResultsData as any[]) || []}
                onRemoveItem={(id) => handleRemoveNotFoundResult.mutate(id)}
                onClearAll={() => handleClearNotFoundResults.mutate()}
                onClearFound={() => handleClearFoundResults.mutate()}
                isSearchMode={isSearchMode}
                onToggleSearchMode={() => {
                  setIsSearchMode(!isSearchMode);
                  // Close scanner when toggling search mode
                  setShowScanner(false);
                }}
                onManualBarcodeSearch={(barcode, deps, numbs) => handleBarcodeScanned(barcode, deps, numbs)}
                onOpenScanner={() => setShowScanner(true)}
                onImportResults={(results) => {
                  // Process each imported barcode
                  results.forEach(result => {
                    handleBarcodeScanned(result.code_barre);
                  });
                }}
                onEditItem={async (searchResult) => {
                  // For found items, we can get the full inventory item by barcode
                  if (searchResult.found) {
                    try {
                      const response = await fetch(`/api/inventory/barcode/${searchResult.code_barre}`);
                      if (response.ok) {
                        const inventoryItem = await response.json();
                        setEditingItem(inventoryItem);
                        setShowAddModal(true);
                      }
                    } catch (error) {
                      toast({
                        title: "Erreur",
                        description: "Impossible de charger les détails de l'article",
                        variant: "destructive",
                      });
                    }
                  } else {
                    // For not found items, create a new item with the barcode pre-filled
                    setEditingItem(null);
                    setInitialFormValues({ code_barre: searchResult.code_barre });
                    setShowAddModal(true);
                  }
                }}
                filterOptions={filterOptions || { departments: [], categories: [], conditions: [] }}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <ScanHistoryTable
                scanHistory={scanHistory}
                onClearHistory={handleClearScanHistory}
                onRemoveItem={handleRemoveScanHistoryItem}
              />
            </TabsContent>

            <TabsContent value="deleted" className="space-y-6">
              <DeletedItemsTable
                deletedItems={(deletedItemsData as any[]) || []}
                onRestore={(item) => handleRestoreItem.mutate(item)}
                onPermanentDelete={(item) => handlePermanentDelete.mutate(item)}
                onBulkRestore={(items) => handleBulkRestore.mutate(items)}
                onBulkPermanentDelete={(items) => handleBulkPermanentDelete.mutate(items)}
                isLoading={deletedItemsLoading}
              />
            </TabsContent>
          </Tabs>



          {/* Stats Cards - Always visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mt-4 lg:mt-6">
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="p-2 lg:p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Package className="text-blue-600 dark:text-blue-400 text-lg lg:text-xl" />
                  </div>
                  <div className="ml-3 lg:ml-4">
                    <p className="text-xs lg:text-sm text-muted-foreground">Total Articles</p>
                    <p className="text-xl lg:text-2xl font-bold text-foreground">
                      {stats ? formatNumber((stats as any).totalItems) : '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="p-2 lg:p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="text-green-600 dark:text-green-400 text-lg lg:text-xl" />
                  </div>
                  <div className="ml-3 lg:ml-4">
                    <p className="text-xs lg:text-sm text-muted-foreground">Disponibles</p>
                    <p className="text-xl lg:text-2xl font-bold text-foreground">
                      {stats ? formatNumber((stats as any).availableItems) : '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="p-2 lg:p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                    <XCircle className="text-red-600 dark:text-red-400 text-lg lg:text-xl" />
                  </div>
                  <div className="ml-3 lg:ml-4">
                    <p className="text-xs lg:text-sm text-muted-foreground">Non Disponibles</p>
                    <p className="text-xl lg:text-2xl font-bold text-foreground">
                      {stats ? formatNumber((stats as any).unavailableItems) : '0'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 lg:p-6">
                <div className="flex items-center">
                  <div className="p-2 lg:p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <DollarSign className="text-yellow-600 dark:text-yellow-400 text-lg lg:text-xl" />
                  </div>
                  <div className="ml-3 lg:ml-4">
                    <p className="text-xs lg:text-sm text-muted-foreground">Valeur Totale</p>
                    <p className="text-xl lg:text-2xl font-bold text-foreground">
                      {stats ? formatCurrency((stats as any).totalValue) : '0 DA'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        

      </div>
        </main>
        
        {/* Footer avec copyright */}
        <footer className="bg-card/50 backdrop-blur-sm border-t border-border/50 mt-8">
          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>© 2025 Système de Gestion d'Inventaire</span>
                <span className="hidden md:inline">•</span>
                <span className="text-xs md:text-sm">Développé par Abdelmalek Halfaoui</span>
              </div>
              
              <div className="flex items-center gap-4">
                <a 
                  href="mailto:halfaoui.abdelmalek@gmail.com" 
                  className="hover:text-foreground transition-colors duration-200 flex items-center gap-1"
                  title="Contacter par email"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  <span className="hidden sm:inline">halfaoui.abdelmalek@gmail.com</span>
                </a>
                
                <a 
                  href="https://www.linkedin.com/in/abdelmalek-halfaoui-a134a5175/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors duration-200 flex items-center gap-1"
                  title="Profil LinkedIn"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="hidden sm:inline">LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
      {/* Modals */}
      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          open={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={() => {
            refetch();
            setSelectedItem(null);
          }}
          onEdit={(item) => {
            setEditingItem(item);
            setSelectedItem(null);
            setShowAddModal(true);
          }}
        />
      )}
      {showAddModal && (
        <AddItemModal
          open={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
            setInitialFormValues({});
          }}
          onSuccess={() => {
            refetch();
            setShowAddModal(false);
            setEditingItem(null);
            toast({
              title: editingItem ? "Article modifié" : "Article ajouté",
              description: editingItem 
                ? "L'article a été modifié avec succès." 
                : "L'article a été ajouté avec succès à l'inventaire.",
            });
          }}
          filterOptions={filterOptions || { departments: [], categories: [], conditions: [] }}
          editingItem={editingItem}
          initialValues={initialFormValues}
        />
      )}
      {showScanner && (
        <MobileBarcodeScanner
          open={showScanner}
          onClose={() => setShowScanner(false)}
          onBarcodeScanned={handleBarcodeScanned}
        />
      )}
      {/* Floating Action Buttons */}
      <FloatingActionButtons
        onNewItem={() => setShowAddModal(true)}
        onImport={handleImportExcel}
        onExport={handleExportExcel}
        onRefresh={() => {
          refetch();
          queryClient.invalidateQueries({ queryKey: ["/api/inventory-stats"] });
          queryClient.invalidateQueries({ queryKey: ["/api/filter-options"] });
          queryClient.invalidateQueries({ queryKey: ["/api/search-results"] });
          queryClient.invalidateQueries({ queryKey: ["/api/deleted-items"] });
        }}
        isLoading={isLoading}
      />
    </div>
  );
}
