import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Palette, Check, Monitor, Sun, Moon, Sparkles, Brush, Eye } from 'lucide-react';

interface Theme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    card: string;
    text: string;
  };
  cssVars: Record<string, string>;
}

const themes: Theme[] = [
  {
    id: 'default',
    name: 'Classique',
    description: 'Thème par défaut avec couleurs neutres',
    preview: {
      primary: '#0ea5e9',
      secondary: '#64748b',
      accent: '#8b5cf6',
      background: '#ffffff',
      card: '#f8fafc',
      text: '#0f172a'
    },
    cssVars: {
      '--primary': '200 98% 39%',
      '--secondary': '215 20% 56%',
      '--accent': '262 73% 64%',
      '--background': '0 0% 100%',
      '--card': '210 40% 98%',
      '--foreground': '222 84% 5%'
    }
  },
  {
    id: 'dark',
    name: 'Sombre Élégant',
    description: 'Thème sombre moderne avec accents violets',
    preview: {
      primary: '#8b5cf6',
      secondary: '#475569',
      accent: '#06b6d4',
      background: '#0f172a',
      card: '#1e293b',
      text: '#f1f5f9'
    },
    cssVars: {
      '--primary': '262 73% 64%',
      '--secondary': '215 28% 17%',
      '--accent': '188 96% 53%',
      '--background': '222 84% 5%',
      '--card': '215 28% 17%',
      '--foreground': '210 40% 98%'
    }
  },
  {
    id: 'ocean',
    name: 'Océan Profond',
    description: 'Bleus profonds inspirés de l\'océan',
    preview: {
      primary: '#0ea5e9',
      secondary: '#1e40af',
      accent: '#06b6d4',
      background: '#f0f9ff',
      card: '#e0f2fe',
      text: '#0c4a6e'
    },
    cssVars: {
      '--primary': '200 98% 39%',
      '--secondary': '224 76% 48%',
      '--accent': '188 96% 53%',
      '--background': '204 100% 97%',
      '--card': '185 96% 94%',
      '--foreground': '205 100% 21%'
    }
  },
  {
    id: 'forest',
    name: 'Forêt Naturelle',
    description: 'Verts naturels et tons terreux',
    preview: {
      primary: '#059669',
      secondary: '#065f46',
      accent: '#84cc16',
      background: '#f0fdf4',
      card: '#dcfce7',
      text: '#064e3b'
    },
    cssVars: {
      '--primary': '160 84% 39%',
      '--secondary': '158 64% 52%',
      '--accent': '84 81% 44%',
      '--background': '142 76% 97%',
      '--card': '141 84% 93%',
      '--foreground': '156 100% 17%'
    }
  },
  {
    id: 'sunset',
    name: 'Coucher de Soleil',
    description: 'Oranges chauds et roses dynamiques',
    preview: {
      primary: '#ea580c',
      secondary: '#dc2626',
      accent: '#f59e0b',
      background: '#fffbeb',
      card: '#fef3c7',
      text: '#92400e'
    },
    cssVars: {
      '--primary': '20 91% 48%',
      '--secondary': '0 84% 60%',
      '--accent': '45 93% 47%',
      '--background': '48 100% 96%',
      '--card': '48 100% 88%',
      '--foreground': '33 88% 28%'
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Néons électriques et contrastes vifs',
    preview: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#06ffa5',
      background: '#0a0a0a',
      card: '#1a1a2e',
      text: '#eee6ff'
    },
    cssVars: {
      '--primary': '322 81% 61%',
      '--secondary': '262 73% 64%',
      '--accent': '158 100% 52%',
      '--background': '0 0% 4%',
      '--card': '240 33% 13%',
      '--foreground': '270 50% 95%'
    }
  }
];

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const [currentTheme, setCurrentTheme] = useState('default');
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // Load saved theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'default';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = themes.find(t => t.id === themeId);
    if (!theme) return;

    const root = document.documentElement;
    const body = document.body;
    
    // Apply CSS variables
    Object.entries(theme.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Handle dark mode class on both html and body
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    if (themeId === 'dark' || themeId === 'cyberpunk') {
      root.classList.add('dark');
      body.classList.add('dark');
      body.style.backgroundColor = theme.preview.background;
      body.style.color = theme.preview.text;
    } else {
      root.classList.add('light');
      body.classList.add('light');
      body.style.backgroundColor = theme.preview.background;
      body.style.color = theme.preview.text;
    }
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem('app-theme', themeId);
  };

  const handlePreview = (themeId: string) => {
    setPreviewTheme(themeId);
    applyTheme(themeId);
  };

  const handlePreviewEnd = () => {
    setPreviewTheme(null);
    applyTheme(currentTheme);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Thèmes de l'Interface
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personnalisez l'apparence de votre application d'inventaire
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Quick actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleThemeChange('default')}
            className="flex items-center gap-1"
          >
            <Sun className="h-3 w-3" />
            Clair
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleThemeChange('dark')}
            className="flex items-center gap-1"
          >
            <Moon className="h-3 w-3" />
            Sombre
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'default';
              handleThemeChange(systemPreference);
            }}
            className="flex items-center gap-1"
          >
            <Monitor className="h-3 w-3" />
            Système
          </Button>
        </div>

        {/* Theme grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.id}
              className={`relative rounded-lg border-2 transition-all duration-200 hover:shadow-lg cursor-pointer ${
                currentTheme === theme.id
                  ? 'border-primary shadow-md'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => handleThemeChange(theme.id)}
              onMouseEnter={() => handlePreview(theme.id)}
              onMouseLeave={handlePreviewEnd}
            >
              {/* Theme preview */}
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {theme.name}
                      {currentTheme === theme.id && <Check className="h-4 w-4 text-primary" />}
                      {previewTheme === theme.id && previewTheme !== currentTheme && (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground">{theme.description}</p>
                  </div>
                  {theme.id === 'cyberpunk' && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Nouveau
                    </Badge>
                  )}
                </div>

                {/* Color palette preview */}
                <div className="grid grid-cols-6 gap-1 h-8 rounded overflow-hidden">
                  <div 
                    className="transition-all duration-200"
                    style={{ backgroundColor: theme.preview.primary }}
                    title="Couleur principale"
                  />
                  <div 
                    className="transition-all duration-200"
                    style={{ backgroundColor: theme.preview.secondary }}
                    title="Couleur secondaire"
                  />
                  <div 
                    className="transition-all duration-200"
                    style={{ backgroundColor: theme.preview.accent }}
                    title="Couleur d'accent"
                  />
                  <div 
                    className="transition-all duration-200"
                    style={{ backgroundColor: theme.preview.background }}
                    title="Arrière-plan"
                  />
                  <div 
                    className="transition-all duration-200"
                    style={{ backgroundColor: theme.preview.card }}
                    title="Cartes"
                  />
                  <div 
                    className="transition-all duration-200"
                    style={{ backgroundColor: theme.preview.text }}
                    title="Texte"
                  />
                </div>

                {/* Mini interface preview */}
                <div 
                  className="h-16 rounded border p-2 space-y-1 transition-all duration-200"
                  style={{ 
                    backgroundColor: theme.preview.background,
                    borderColor: theme.preview.secondary + '40'
                  }}
                >
                  <div 
                    className="h-2 rounded"
                    style={{ backgroundColor: theme.preview.primary, width: '60%' }}
                  />
                  <div 
                    className="h-2 rounded"
                    style={{ backgroundColor: theme.preview.secondary, width: '80%' }}
                  />
                  <div className="flex gap-1">
                    <div 
                      className="h-2 w-8 rounded"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                    <div 
                      className="h-2 w-6 rounded"
                      style={{ backgroundColor: theme.preview.card }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Current theme info */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brush className="h-4 w-4" />
            <span className="font-medium">Thème actuel : {themes.find(t => t.id === currentTheme)?.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {themes.find(t => t.id === currentTheme)?.description}
          </p>
          {previewTheme && previewTheme !== currentTheme && (
            <div className="mt-2 text-xs text-primary">
              Aperçu de : {themes.find(t => t.id === previewTheme)?.name}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}