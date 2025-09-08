/* eslint-disable */
import React from 'react';
import { UtensilsCrossed, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MenuManager() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Gestion des menus - Nouvelle approche
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">📢 Nouveau système de gestion</h3>
            <p className="text-blue-700 mb-4">
              La gestion des menus a été améliorée et divisée en deux parties :
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <h4 className="font-semibold">1. Gestion des Plats</h4>
                  <p className="text-sm text-gray-600">Créer et gérer votre catalogue de plats</p>
                </div>
                <Button variant="outline" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-white rounded border">
                <div>
                  <h4 className="font-semibold">2. Zones de Commande</h4>
                  <p className="text-sm text-gray-600">Créer des menus en sélectionnant vos plats</p>
                </div>
                <Button variant="outline" size="sm">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              Utilisez les sections "Plats" et "Zones de commande" dans le menu principal pour gérer vos menus.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
