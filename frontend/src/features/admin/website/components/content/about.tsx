/* eslint-disable @typescript-eslint/no-explicit-any,no-plusplus,@typescript-eslint/no-use-before-define,react/no-array-index-key,react/no-unescaped-entities,no-console,no-alert */
import { useEffect, useState } from 'react';
import {
  Loader2,
  Save,
  Plus,
  Trash,
  Users,
  Table,
  Trophy,
  Calendar,
} from 'lucide-react';
import {
  fetchAbout,
  fetchInformations,
  updateInformations,
} from '@/services/api';
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
import { Separator } from '@/components/ui/separator';

export default function AboutManager() {
  const [aboutData, setAboutData] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchAbout();
      setAboutData(data);

      // Charger les statistiques depuis l'objet racine
      const informations = await fetchInformations();
      const current = informations[0];
      setStatsData({
        membresActif: current.membresActif,
        tablesDispo: current.tablesDispo,
        nbrEquipes: current.nbrEquipes,
        anciennete: current.anciennete,
      });
    } catch (error) {
      console.error('Erreur chargement about:', error);
    }
    setLoading(false);
  };

  const handleStatsChange = (field: string, value: string) => {
    setStatsData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedChange = (
    sectionId: string,
    path: (string | number)[],
    newValue: any
  ) => {
    setAboutData((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const updated = { ...section };
        let ref: any = updated;
        for (let i = 0; i < path.length - 1; i++) {
          ref = ref[path[i]];
        }
        ref[path[path.length - 1]] = newValue;
        return updated;
      })
    );
  };

  const addArrayItem = (
    sectionId: string,
    path: (string | number)[],
    type: 'string' | 'object'
  ) => {
    setAboutData((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const updated = { ...section };
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
      })
    );
  };

  const removeArrayItem = (
    sectionId: string,
    path: (string | number)[],
    index: number
  ) => {
    setAboutData((prev) =>
      prev.map((section) => {
        if (section.id !== sectionId) return section;
        const updated = { ...section };
        let ref: any = updated;
        for (let i = 0; i < path.length; i++) {
          ref = ref[path[i]];
        }
        if (Array.isArray(ref)) {
          ref.splice(index, 1);
        }
        return updated;
      })
    );
  };

  const addSection = () => {
    setAboutData((prev) => [
      ...prev,
      { id: `section_${Date.now()}`, title: '', subtitle: '' },
    ]);
  };

  const removeSection = (sectionId: string) => {
    setAboutData((prev) => prev.filter((section) => section.id !== sectionId));
  };

  const renderField = (
    sectionId: string,
    path: (string | number)[],
    value: any
  ) => {
    if (typeof value === 'string') {
      return (
        <Input
          value={value}
          onChange={(e) => handleNestedChange(sectionId, path, e.target.value)}
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
                  ? renderField(sectionId, [...path, index], item)
                  : renderObject(sectionId, [...path, index], item)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeArrayItem(sectionId, path, index)}
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
                sectionId,
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
      return renderObject(sectionId, path, value);
    }

    return null;
  };

  const renderObject = (
    sectionId: string,
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
            {renderField(sectionId, [...path, key], val)}
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
        about: aboutData,
        membresActif: statsData?.membresActif || current.membresActif,
        tablesDispo: statsData?.tablesDispo || current.tablesDispo,
        nbrEquipes: statsData?.nbrEquipes || current.nbrEquipes,
        anciennete: statsData?.anciennete || current.anciennete,
      };

      await updateInformations(current.id, updatedData);

      // Alerte de succès pour l'admin
      alert(
        "✅ Les modifications de la section 'À propos' ont été sauvegardées avec succès !"
      );
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      // Alerte d'erreur pour l'admin
      alert('❌ Erreur lors de la sauvegarde. Veuillez réessayer.');
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

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Gestion de la section "À propos"
          </h1>
          <p className="text-muted-foreground">
            Modifiez les informations et statistiques du club
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="min-w-[120px]"
        >
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </Button>
      </div>

      {/* Section Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Statistiques du Club
          </CardTitle>
          <CardDescription>
            Mettez à jour les chiffres clés de votre club
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Membres Actifs
              </Label>
              <Input
                value={statsData?.membresActif || ''}
                onChange={(e) =>
                  handleStatsChange('membresActif', e.target.value)
                }
                placeholder="50+"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Table className="w-4 h-4" />
                Tables Disponibles
              </Label>
              <Input
                value={statsData?.tablesDispo || ''}
                onChange={(e) =>
                  handleStatsChange('tablesDispo', e.target.value)
                }
                placeholder="8"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Nombre d'Équipes
              </Label>
              <Input
                value={statsData?.nbrEquipes || ''}
                onChange={(e) =>
                  handleStatsChange('nbrEquipes', e.target.value)
                }
                placeholder="13"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Ancienneté (années)
              </Label>
              <Input
                value={statsData?.anciennete || ''}
                onChange={(e) =>
                  handleStatsChange('anciennete', e.target.value)
                }
                placeholder="10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Sections About */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sections de contenu</h2>
          <Button onClick={addSection} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une section
          </Button>
        </div>

        {aboutData.map((section) => (
          <Card key={section.id}>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">{section.id}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSection(section.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash size={18} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>{renderObject(section.id, [], section)}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
