import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Undo2, Trash2, AlertTriangle, XCircle, Search } from "lucide-react";
import { DeletedItem } from "@shared/schema";

interface DeletedItemsTableProps {
  deletedItems: DeletedItem[];
  onRestore: (item: DeletedItem) => void;
  onPermanentDelete: (item: DeletedItem) => void;
  onBulkRestore?: (items: DeletedItem[]) => void;
  onBulkPermanentDelete?: (items: DeletedItem[]) => void;
  isLoading?: boolean;
}

export function DeletedItemsTable({ 
  deletedItems, 
  onRestore, 
  onPermanentDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  isLoading = false 
}: DeletedItemsTableProps) {
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [showBulkRestoreDialog, setShowBulkRestoreDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRestore = async (item: DeletedItem) => {
    setRestoringId(item.id);
    try {
      await onRestore(item);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (item: DeletedItem) => {
    setDeletingId(item.id);
    try {
      await onPermanentDelete(item);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectItem = (itemId: number, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkRestore = () => {
    if (onBulkRestore) {
      const itemsToRestore = deletedItems.filter(item => selectedItems.includes(item.id));
      onBulkRestore(itemsToRestore);
      setSelectedItems([]);
    }
    setShowBulkRestoreDialog(false);
  };

  const handleBulkPermanentDelete = () => {
    if (onBulkPermanentDelete) {
      const itemsToDelete = deletedItems.filter(item => selectedItems.includes(item.id));
      onBulkPermanentDelete(itemsToDelete);
      setSelectedItems([]);
    }
    setShowBulkDeleteDialog(false);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateTimeRemaining = (deletedDate: Date) => {
    const now = new Date();
    const deletedTime = new Date(deletedDate);
    const expirationTime = new Date(deletedTime.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const remainingTime = expirationTime.getTime() - now.getTime();
    
    if (remainingTime <= 0) {
      return { text: "Expiré", color: "text-red-600", bgColor: "bg-red-50" };
    }
    
    const days = Math.floor(remainingTime / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remainingTime % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 7) {
      return { text: `${days} jours`, color: "text-green-600", bgColor: "bg-green-50" };
    } else if (days > 2) {
      return { text: `${days} jours`, color: "text-yellow-600", bgColor: "bg-yellow-50" };
    } else if (days > 0) {
      return { text: `${days}j ${hours}h`, color: "text-orange-600", bgColor: "bg-orange-50" };
    } else {
      return { text: `${hours}h`, color: "text-red-600", bgColor: "bg-red-50" };
    }
  };

  // Filter items based on search query
  const filteredItems = deletedItems.filter(item => 
    item.code_barre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.departement.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.num_bureau.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.beneficiaire.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate statistics
  const expiredItems = deletedItems.filter(item => {
    const timeInfo = calculateTimeRemaining(item.date_suppression);
    return timeInfo.text === "Expiré";
  });

  const criticalItems = deletedItems.filter(item => {
    const timeInfo = calculateTimeRemaining(item.date_suppression);
    return timeInfo.color === "text-red-600" || timeInfo.color === "text-orange-600";
  });

  if (deletedItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trash2 className="mr-2 h-5 w-5" />
            Articles Supprimés
          </CardTitle>
          <CardDescription>
            Gérez les articles supprimés - restaurez ou supprimez définitivement
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trash2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Aucun article supprimé</p>
            <p className="text-sm">Les articles supprimés apparaîtront ici</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Trash2 className="mr-2 h-5 w-5" />
            Articles Supprimés ({deletedItems.length})
          </div>
          <Badge variant="secondary">
            {deletedItems.length} article{deletedItems.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          Gérez les articles supprimés - restaurez ou supprimez définitivement. 
          Les articles sont automatiquement supprimés après 30 jours.
        </CardDescription>
        {selectedItems.length > 0 && (
          <div className="flex gap-2 mt-4">
            <AlertDialog open={showBulkRestoreDialog} onOpenChange={setShowBulkRestoreDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <Undo2 className="mr-2 h-4 w-4" />
                  Restaurer ({selectedItems.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Restaurer les articles sélectionnés</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir restaurer {selectedItems.length} article{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''} ? 
                    {selectedItems.length > 1 ? 'Ils' : 'Il'} {selectedItems.length > 1 ? 'seront' : 'sera'} remis dans l'inventaire principal.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkRestore}>
                    Restaurer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="sm"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer ({selectedItems.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Supprimer définitivement
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    ⚠️ Cette action est irréversible ! Êtes-vous sûr de vouloir supprimer définitivement {selectedItems.length} article{selectedItems.length > 1 ? 's' : ''} sélectionné{selectedItems.length > 1 ? 's' : ''} ? 
                    Ces données seront perdues à jamais.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleBulkPermanentDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Supprimer définitivement
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {/* Search and Statistics */}
        <div className="mb-6 space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
              type="text"
              placeholder="Rechercher dans la corbeille..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Total</p>
                    <p className="text-2xl font-bold text-green-900">{deletedItems.length}</p>
                  </div>
                  <Trash2 className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Critique</p>
                    <p className="text-2xl font-bold text-orange-900">{criticalItems.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-800">Expirés</p>
                    <p className="text-2xl font-bold text-red-900">{expiredItems.length}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Search Results Counter */}
          {searchQuery && (
            <div className="text-sm text-muted-foreground">
              Affichage de {filteredItems.length} sur {deletedItems.length} articles
            </div>
          )}
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Attention</p>
              <p className="text-yellow-700">
                Les articles supprimés peuvent être restaurés ou supprimés définitivement. 
                La suppression définitive est irréversible.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Sélectionner tous les articles"
                  />
                </TableHead>
                <TableHead>Code-barres</TableHead>
                <TableHead>Désignation</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Bureau</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead>Date Suppression</TableHead>
                <TableHead>Expire dans</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                      aria-label={`Sélectionner ${item.designation}`}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {item.code_barre}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.designation}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.departement}</Badge>
                  </TableCell>
                  <TableCell>{item.num_bureau}</TableCell>
                  <TableCell>{item.beneficiaire}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(item.date_suppression)}</div>
                      <div className="text-muted-foreground">{formatTime(item.date_suppression)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const timeInfo = calculateTimeRemaining(item.date_suppression);
                      return (
                        <Badge variant="outline" className={`${timeInfo.color} ${timeInfo.bgColor} border-current`}>
                          {timeInfo.text}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRestore(item)}
                        disabled={restoringId === item.id || isLoading}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Undo2 className="h-4 w-4 mr-1" />
                        {restoringId === item.id ? "Restauration..." : "Restaurer"}
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deletingId === item.id || isLoading}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {deletingId === item.id ? "Suppression..." : "Supprimer"}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Suppression définitive</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer définitivement "{item.designation}" ?
                              Cette action est irréversible et l'article ne pourra plus être restauré.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handlePermanentDelete(item)}
                              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            >
                              Supprimer définitivement
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && searchQuery && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    <Search className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>Aucun article trouvé pour "{searchQuery}"</p>
                    <p className="text-sm">Essayez avec des termes différents</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}