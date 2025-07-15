import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Smartphone, Upload, FileDown, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Link } from 'wouter';

interface FloatingActionButtonsProps {
  onNewItem?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function FloatingActionButtons({ 
  onNewItem, 
  onImport, 
  onExport, 
  onRefresh,
  isLoading = false 
}: FloatingActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <TooltipProvider>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        {/* Effet de lueur d'arrière-plan */}
        <div className="absolute -inset-8 bg-gradient-to-t from-blue-500/10 via-purple-500/5 to-transparent rounded-full blur-2xl pointer-events-none"></div>
        {/* Secondary Actions - Only show when expanded */}
        <div className={`flex flex-col gap-4 transition-all duration-500 ${
          isExpanded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
        }`}>
          
          {/* Refresh Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={isLoading}
                className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-white to-slate-50 dark:from-gray-800 dark:to-gray-900 border-2 border-slate-200/50 dark:border-gray-700/50 hover:scale-125 hover:rotate-12 transition-all duration-300 hover:shadow-blue-500/25 hover:border-blue-300 dark:hover:border-blue-600 group"
              >
                <RefreshCw className={`h-6 w-6 text-slate-600 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 ${isLoading ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Actualiser</p>
            </TooltipContent>
          </Tooltip>

          {/* Export Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={onExport}
                className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200/50 dark:border-green-700/50 hover:bg-gradient-to-br hover:from-green-100 hover:to-emerald-100 hover:scale-125 hover:rotate-12 transition-all duration-300 hover:shadow-green-500/25 hover:border-green-400 dark:hover:border-green-500 group"
              >
                <FileDown className="h-6 w-6 text-green-600 dark:text-green-400 group-hover:text-green-700 dark:group-hover:text-green-300 transition-all duration-300 group-hover:scale-110" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Exporter Excel</p>
            </TooltipContent>
          </Tooltip>

          {/* Import Button */}
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={onImport}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer rounded-full"
              id="floating-import"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="h-12 w-12 rounded-full shadow-lg bg-blue-50 dark:bg-blue-900/20 border-blue-300 hover:bg-blue-100 hover:scale-110 transition-all duration-200"
                >
                  <label htmlFor="floating-import" className="cursor-pointer flex items-center justify-center">
                    <Upload className="h-5 w-5 text-blue-600" />
                  </label>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                <p>Importer Excel</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Mobile Scanner */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/mobile-scan">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-12 w-12 rounded-full shadow-lg bg-purple-50 dark:bg-purple-900/20 border-purple-300 hover:bg-purple-100 hover:scale-110 transition-all duration-200"
                >
                  <Smartphone className="h-5 w-5 text-purple-600" />
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p>Scanner Mobile</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Ultra-Modern Main FAB */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              onClick={() => {
                if (isExpanded && onNewItem) {
                  onNewItem();
                }
                setIsExpanded(!isExpanded);
              }}
              className={`group relative h-16 w-16 rounded-full shadow-2xl transition-all duration-500 transform overflow-hidden ${
                isExpanded 
                  ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 rotate-45 scale-110' 
                  : 'bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 hover:from-blue-600 hover:via-purple-700 hover:to-indigo-700'
              } hover:scale-110 border-0`}
            >
              {/* Animated Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              {/* Ripple Effect */}
              <div className="absolute inset-0 rounded-full bg-white/30 scale-0 group-active:scale-100 transition-transform duration-200"></div>
              
              {/* Icon */}
              <Plus className={`h-6 w-6 text-white relative z-10 transition-transform duration-500 ${
                isExpanded ? 'rotate-45' : 'rotate-0'
              } group-hover:scale-110`} />
              
              {/* Glow Effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-500 scale-150"></div>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{isExpanded ? 'Nouveau Article' : 'Actions'}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}