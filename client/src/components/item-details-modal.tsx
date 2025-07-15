import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit, FileText, X } from "lucide-react";
import { generateItemPDF } from "@/lib/pdf-utils";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@shared/schema";

interface ItemDetailsModalProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onEdit: (item: InventoryItem) => void;
}

export function ItemDetailsModal({ item, open, onClose, onUpdate, onEdit }: ItemDetailsModalProps) {
  const { toast } = useToast();

  if (!item) return null;

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('fr-DZ', {
      minimumFractionDigits: 2,
    }).format(parseFloat(value)) + ' DA';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const handleGeneratePDF = async () => {
    try {
      await generateItemPDF(item);
      toast({
        title: "PDF généré",
        description: "La fiche PDF a été téléchargée avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF.",
        variant: "destructive",
      });
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'bon':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'moyen':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'défaillant':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#ffffff]" aria-describedby="item-details-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Détails de l'article
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <p id="item-details-description" className="text-sm text-muted-foreground mt-2">
            Consultez toutes les informations détaillées de cet article d'inventaire.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Item Image Placeholder */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300 rounded-2xl h-64 flex items-center justify-center shadow-inner">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg">
                  <span className="text-blue-600 text-lg font-semibold">IMG</span>
                </div>
                <p className="text-slate-600 font-medium">Image de l'article</p>
                <p className="text-slate-400 text-xs mt-1">Photo principale</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-xl h-16 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-slate-500 text-xs font-medium">IMG</span>
                </div>
              ))}
            </div>
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
              <h3 className="font-bold text-xl mb-3 text-slate-800">{item.designation}</h3>
              <Badge 
                variant={item.quantite > 0 ? "default" : "destructive"}
                className={`text-sm px-4 py-2 font-medium ${item.quantite > 0 ? 'bg-[#d4e4fd]' : 'bg-[#f7d5d5]'}`}
              >
                {item.quantite > 0 ? "✓ Disponible" : "✗ Non disponible"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Code-barres</label>
                <p className="font-mono mt-2 text-lg font-medium text-slate-800 bg-white px-3 py-2 rounded-lg border">{item.code_barre}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="text-sm font-semibold text-blue-600 uppercase tracking-wide">N° Inventaire</label>
                <p className="font-bold mt-2 text-lg text-slate-800 bg-white px-3 py-2 rounded-lg border">{item.num_inventaire}</p>
              </div>
            </div>

            {item.old_num_inventaire && (
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <label className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Ancien N° Inventaire</label>
                <p className="mt-2 text-lg font-medium text-slate-800 bg-white px-3 py-2 rounded-lg border">{item.old_num_inventaire}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <label className="text-sm font-semibold text-green-600 uppercase tracking-wide">Département</label>
                <p className="mt-2 text-lg font-medium text-slate-800 bg-white px-3 py-2 rounded-lg border">{item.departement}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <label className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Bureau</label>
                <p className="mt-2 text-lg font-medium text-slate-800 bg-white px-3 py-2 rounded-lg border text-center">{item.num_bureau}</p>
              </div>
            </div>

            <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <label className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Bénéficiaire</label>
              <p className="mt-2 text-lg font-medium text-slate-800 bg-white px-3 py-2 rounded-lg border">{item.beneficiaire}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                <label className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Quantité</label>
                <p className="mt-2 text-2xl font-bold text-slate-800 bg-white px-3 py-2 rounded-lg border text-center">{item.quantite}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <label className="text-sm font-semibold text-emerald-600 uppercase tracking-wide">Prix</label>
                <p className="font-bold text-2xl mt-2 text-slate-800 bg-white px-3 py-2 rounded-lg border text-center text-emerald-700">{formatCurrency(item.prix)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
                <label className="text-sm font-semibold text-cyan-600 uppercase tracking-wide">Catégorie</label>
                <p className="mt-2 text-lg font-medium text-slate-800 bg-white px-3 py-2 rounded-lg border">{item.categorie}</p>
              </div>
              <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                <label className="text-sm font-semibold text-rose-600 uppercase tracking-wide">Condition</label>
                <div className="mt-2">
                  <Badge className={`text-sm px-4 py-2 font-medium ${getConditionColor(item.condition)} border-0`}>
                    {item.condition}
                  </Badge>
                </div>
              </div>
            </div>

            {item.num_serie && (
              <div className="bg-teal-50 rounded-xl p-4 border border-teal-200">
                <label className="text-sm font-semibold text-teal-600 uppercase tracking-wide">N° Série</label>
                <p className="font-mono mt-2 text-lg font-medium text-slate-800 bg-white px-3 py-2 rounded-lg border">{item.num_serie}</p>
              </div>
            )}

            {item.description && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Description</label>
                <p className="text-base mt-2 text-slate-700 bg-white px-3 py-3 rounded-lg border leading-relaxed">{item.description}</p>
              </div>
            )}

            <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-300">
              <h4 className="font-semibold text-slate-700 mb-4 text-center">Informations de suivi</h4>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Date d'ajout</label>
                  <p className="mt-2 text-lg font-medium text-slate-800 bg-white px-3 py-2 rounded-lg border">{formatDate(item.date_ajouter)}</p>
                </div>
                <div className="text-center">
                  <label className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Dernière modification</label>
                  <p className="mt-2 text-lg font-medium text-slate-800 bg-white px-3 py-2 rounded-lg border">{formatDate(item.date_modification)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} className="bg-[#eefdf4] hover:bg-green-100 border-green-300">
            Fermer
          </Button>
          <Button variant="outline" onClick={() => onEdit(item)} className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700">
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button onClick={handleGeneratePDF} className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg">
            <FileText className="mr-2 h-4 w-4" />
            Fiche PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
