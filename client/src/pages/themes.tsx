import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeSelector } from '@/components/theme-selector';
import { SimpleThemeToggle } from '@/components/simple-theme-toggle';
import {
  Palette,
  ArrowLeft,
  TrendingUp,
  Users,
  Star,
  Download,
  Heart,
  Zap,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  Eye,
  Settings
} from 'lucide-react';
import { Link } from 'wouter';

export default function ThemesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Palette className="h-8 w-8 text-purple-600" />
                  Thèmes et Personnalisation
                </h1>
                <p className="text-muted-foreground mt-1">
                  Personnalisez l'apparence de votre application d'inventaire
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SimpleThemeToggle />
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Paramètres
            </Button>
          </div>
        </div>

        {/* Theme Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ThemeSelector />
          </div>

          {/* Sidebar with Stats */}
          <div className="space-y-4">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Thèmes disponibles</span>
                  <Badge variant="secondary">6</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Personnalisations</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Préférences sauvées</span>
                  <Badge variant="secondary">3</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Popular Themes */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Thèmes Populaires
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Sombre</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-muted rounded-full h-2">
                      <div className="w-8 bg-primary rounded-full h-2"></div>
                    </div>
                    <span className="text-xs text-muted-foreground">65%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span>Classique</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-muted rounded-full h-2">
                      <div className="w-6 bg-primary rounded-full h-2"></div>
                    </div>
                    <span className="text-xs text-muted-foreground">45%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span>Cyberpunk</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 bg-muted rounded-full h-2">
                      <div className="w-5 bg-primary rounded-full h-2"></div>
                    </div>
                    <span className="text-xs text-muted-foreground">35%</span>
                    <Badge variant="secondary" className="text-xs">Nouveau</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}