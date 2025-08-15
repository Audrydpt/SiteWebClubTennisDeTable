/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-use-before-define,no-plusplus,react/no-array-index-key,no-console,no-alert */
import { useEffect, useState } from 'react';
import { Loader2, Save, Plus, Trash, Trophy } from 'lucide-react';
import { fetchInformations, updateInformations } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function PalmaresManager() {
  const [palmaresData, setPalmaresData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const infos = await fetchInformations();
      const current = infos[0];
      setPalmaresData(current.palmares || {});
    } catch (error) {
      console.error('Erreur chargement palmarès:', error);
    }
    setLoading(false);
  };

  const handleNestedChange = (path: (string | number)[], newValue: any) => {
    setPalmaresData((prev: any) => {
      const updated = { ...prev };
      let ref: any = updated;
      for (let i = 0; i < path.length - 1; i++) {
        ref = ref[path[i]];
      }
      ref[path[path.length - 1]] = newValue;
      return updated;
    });
  };

  const addArrayItem = (
    path: (string | number)[],
    type: 'string' | 'object'
  ) => {
    setPalmaresData((prev: any) => {
      const updated = { ...prev };
      let ref: any = updated;
      for (let i = 0; i < path.length; i++) {
        if (!ref[path[i]]) ref[path[i]] = [];
        ref = ref[path[i]];
      }
      if (type === 'string') {
        ref.push('');
      } else {
        ref.push({});
      }
      return updated;
    });
  };

  const removeArrayItem = (path: (string | number)[], index: number) => {
    setPalmaresData((prev: any) => {
      const updated = { ...prev };
      let ref: any = updated;
      for (let i = 0; i < path.length; i++) {
        ref = ref[path[i]];
      }
      if (Array.isArray(ref)) {
        ref.splice(index, 1);
      }
      return updated;
    });
  };

  const addNewCategory = () => {
    const categoryName = `nouvelle_categorie_${Date.now()}`;
    setPalmaresData((prev: any) => ({
      ...prev,
      [categoryName]: [],
    }));
  };

  const removeCategory = (categoryKey: string) => {
    setPalmaresData((prev: any) => {
      const updated = { ...prev };
      delete updated[categoryKey];
      return updated;
    });
  };

  const renderField = (path: (string | number)[], value: any) => {
    if (typeof value === 'string') {
      return (
        <Input
          value={value}
          onChange={(e) => handleNestedChange(path, e.target.value)}
          className="w-full"
        />
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-3 pl-4 border-l-2 border-muted">
          {value.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                {typeof item === 'string'
                  ? renderField([...path, index], item)
                  : renderObject([...path, index], item)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeArrayItem(path, index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash size={16} />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              addArrayItem(
                path,
                typeof value[0] === 'string' ? 'string' : 'object'
              )
            }
            className="text-sm"
          >
            <Plus size={14} className="mr-1" /> Ajouter
          </Button>
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return renderObject(path, value);
    }

    return null;
  };

  const renderObject = (
    path: (string | number)[],
    obj: Record<string, any>
  ) => (
    <div className="space-y-3 pl-4 border-l-2 border-muted">
      {Object.entries(obj).map(([key, val]) => {
        if (key === 'id') return null;
        return (
          <div key={key} className="space-y-1">
            <Label className="text-sm font-medium capitalize">
              {key.replace(/([A-Z])/g, ' $1')}
            </Label>
            {renderField([...path, key], val)}
          </div>
        );
      })}
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const allInfos = await fetchInformations();
      const current = allInfos[0];
      const updatedData = {
        ...current,
        palmares: palmaresData,
      };
      await updateInformations(current.id, updatedData);

      // Alerte de succès pour l'admin
      alert('🏆 Le palmarès a été sauvegardé avec succès !');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      // Alerte d'erreur pour l'admin
      alert('❌ Erreur lors de la sauvegarde du palmarès. Veuillez réessayer.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
      </div>
    );
  }

  if (!palmaresData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Aucune donnée de palmarès trouvée
              </h3>
              <p className="text-muted-foreground mb-4">
                Commencez par ajouter une première catégorie
              </p>
              <Button onClick={addNewCategory}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une catégorie
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Trophy className="w-8 h-8" />
            Gestion du Palmarès
          </h1>
          <p className="text-muted-foreground">
            Gérez les récompenses et distinctions du club
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addNewCategory} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle catégorie
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="min-w-[120px]"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Sauvegarder'}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(palmaresData).map(([key, value]) => (
          <Card key={key}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg capitalize">
                    {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1')}
                  </CardTitle>
                  <CardDescription>
                    Gérez les éléments de cette catégorie
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCategory(key)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>{renderField([key], value)}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
