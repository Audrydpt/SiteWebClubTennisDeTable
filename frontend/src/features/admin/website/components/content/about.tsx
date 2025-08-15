/* eslint-disable */
import React, { useEffect, useState } from 'react';
import { fetchAbout, updateAbout, fetchInformations, updateInformations } from '@/services/api';
import { Loader2, Save, Plus, Trash } from 'lucide-react';

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

      // Charger les statistiques
      const informations = await fetchInformations();
      setStatsData(informations[0]);
    } catch (error) {
      console.error('Erreur chargement about:', error);
    }
    setLoading(false);
  };

  const handleStatsChange = (field: string, value: string) => {
    setStatsData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (sectionId: string, path: (string | number)[], newValue: any) => {
    setAboutData(prev =>
      prev.map(section => {
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

  const addArrayItem = (sectionId: string, path: (string | number)[], type: 'string' | 'object') => {
    setAboutData(prev =>
      prev.map(section => {
        if (section.id !== sectionId) return section;
        const updated = { ...section };
        let ref: any = updated;
        for (let i = 0; i < path.length; i++) {
          if (!ref[path[i]]) ref[path[i]] = []; // sécurisation si tableau inexistant
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

  const removeArrayItem = (sectionId: string, path: (string | number)[], index: number) => {
    setAboutData(prev =>
      prev.map(section => {
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
    setAboutData(prev => [...prev, { id: `section_${Date.now()}`, title: '', subtitle: '' }]);
  };

  const removeSection = (sectionId: string) => {
    setAboutData(prev => prev.filter(section => section.id !== sectionId));
  };

  const renderField = (sectionId: string, path: (string | number)[], value: any) => {
    if (typeof value === 'string') {
      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleNestedChange(sectionId, path, e.target.value)}
          className="border p-2 rounded w-full"
        />
      );
    }

    if (Array.isArray(value)) {
      return (
        <div className="space-y-2 pl-4 border-l">
          {value.map((item, index) => (
            <div key={index} className="flex items-start gap-2">
              <div className="flex-1">
                {typeof item === 'string'
                  ? renderField(sectionId, [...path, index], item)
                  : renderObject(sectionId, [...path, index], item)}
              </div>
              <button
                onClick={() => removeArrayItem(sectionId, path, index)}
                className="p-1 text-red-500 hover:text-red-700"
                title="Supprimer"
              >
                <Trash size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => addArrayItem(sectionId, path, typeof value[0] === 'string' ? 'string' : 'object')}
            className="text-sm text-blue-500 flex items-center gap-1"
          >
            <Plus size={14} /> Ajouter
          </button>
        </div>
      );
    }

    if (typeof value === 'object' && value !== null) {
      return renderObject(sectionId, path, value);
    }

    return null;
  };

  const renderObject = (sectionId: string, path: (string | number)[], obj: Record<string, any>) => (
    <div className="space-y-2 pl-4 border-l">
      {Object.entries(obj).map(([key, val]) => {
        if (key === 'id') return null; // empêche modification de l'id
        return (
          <div key={key}>
            <label className="text-sm font-semibold">{key}</label>
            {renderField(sectionId, [...path, key], val)}
          </div>
        );
      })}
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      // Sauvegarder les données about
      await updateAbout(aboutData);

      // Sauvegarder les statistiques
      if (statsData) {
        await updateInformations(statsData.id, statsData);
      }

      alert('Données sauvegardées ✅');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde ❌');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="animate-spin w-6 h-6 text-gray-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion de la section "À propos"</h2>

      {/* Section Statistiques */}
      <div className="p-4 border rounded-md bg-blue-50 shadow-sm space-y-3">
        <h3 className="text-lg font-semibold">📊 Statistiques du Club</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-semibold">Membres Actifs</label>
            <input
              type="text"
              value={statsData?.membresActif || ''}
              onChange={(e) => handleStatsChange('membresActif', e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="50+"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Tables Disponibles</label>
            <input
              type="text"
              value={statsData?.tablesDispo || ''}
              onChange={(e) => handleStatsChange('tablesDispo', e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="8"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Nombre d'Équipes</label>
            <input
              type="text"
              value={statsData?.nbrEquipes || ''}
              onChange={(e) => handleStatsChange('nbrEquipes', e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="13"
            />
          </div>
          <div>
            <label className="text-sm font-semibold">Ancienneté (années)</label>
            <input
              type="text"
              value={statsData?.anciennete || ''}
              onChange={(e) => handleStatsChange('anciennete', e.target.value)}
              className="border p-2 rounded w-full"
              placeholder="10"
            />
          </div>
        </div>
      </div>

      {aboutData.map((section) => (
        <div key={section.id} className="p-4 border rounded-md bg-white shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">{section.id}</h3>
            <button
              onClick={() => removeSection(section.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash size={18} />
            </button>
          </div>
          {renderObject(section.id, [], section)}
        </div>
      ))}

      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Enregistrement...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
