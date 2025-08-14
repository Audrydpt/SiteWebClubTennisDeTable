/* eslint-disable */
'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fetchInformations, updateInformations } from '@/services/api.ts';

interface GeneralInfos {
  adresse?: string;
  email?: string;
  telephone?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  footer?: {
    aboutText?: string;
    year?: string;
  };
  membresActif?: string;      // Ajouté
  tablesDispo?: string;       // Ajouté
  anciennete?: string;        // Ajouté
}

export default function GeneralManager() {
  const [infos, setInfos] = useState<GeneralInfos>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [infoId, setInfoId] = useState<string | null>(null);

  // Charger les infos générales
  useEffect(() => {
    const loadInfo = async () => {
      try {
        const data = await fetchInformations();
        if (data && data.length > 0) {
          setInfos({
            adresse: data[0].adresse || '',
            email: data[0].email || '',
            telephone: data[0].telephone || '',
            facebook: data[0].facebook || '',
            instagram: data[0].instagram || '',
            twitter: data[0].twitter || '',
            youtube: data[0].youtube || '',
            footer: {
              aboutText: data[0].footer?.aboutText || '',
              year: data[0].footer?.year || '',
            },
            membresActif: data[0].membresActif || '',    // Ajouté
            tablesDispo: data[0].tablesDispo || '',      // Ajouté
            anciennete: data[0].anciennete || '',        // Ajouté
          });
          setInfoId(data[0].id); // on garde l'ID pour la mise à jour
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadInfo();
  }, []);

  const handleChange = (field: keyof GeneralInfos, value: string) => {
    setInfos({ ...infos, [field]: value });
  };

  const handleFooterChange = (field: keyof NonNullable<GeneralInfos['footer']>, value: string) => {
    setInfos({
      ...infos,
      footer: {
        ...infos.footer,
        [field]: value,
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentData = await fetchInformations();
      const mergedData = {
        ...currentData[0],
        ...infos,
        footer: {
          ...currentData[0].footer,
          ...infos.footer,
        },
        membresActif: infos.membresActif,    // Ajouté
        tablesDispo: infos.tablesDispo,      // Ajouté
        anciennete: infos.anciennete,        // Ajouté
      };
      await updateInformations(mergedData.id, mergedData);
      alert('Infos générales sauvegardées !');
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // Ajout d'une fonction pour valider l'année
  const getValidYear = (value: string) => {
    const year = parseInt(value, 10);
    if (isNaN(year) || year < 2025) return '2025';
    return year.toString();
  };

  // Gestion des boutons + et -
  const handleYearChange = (delta: number) => {
    const currentYear = parseInt(infos.footer?.year || '2025', 10);
    const newYear = Math.max(2025, currentYear + delta);
    handleFooterChange('year', newYear.toString());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold">Gestion des infos générales</h2>

      <div className="border p-4 rounded space-y-2">
        <h3 className="font-semibold">Contact</h3>
        <input
          type="email"
          placeholder="Email"
          value={infos.email || ''}
          onChange={(e) => handleChange('email', e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Téléphone"
          value={infos.telephone || ''}
          onChange={(e) => handleChange('telephone', e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Adresse"
          value={infos.adresse || ''}
          onChange={(e) => handleChange('adresse', e.target.value)}
          className="w-full border p-2 rounded"
        />
        {/* Champs supplémentaires */}
        <input
          type="text"
          placeholder="Membres actif"
          value={infos.membresActif || ''}
          onChange={(e) => handleChange('membresActif', e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Tables dispo"
          value={infos.tablesDispo || ''}
          onChange={(e) => handleChange('tablesDispo', e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Ancienneté"
          value={infos.anciennete || ''}
          onChange={(e) => handleChange('anciennete', e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="border p-4 rounded space-y-2">
        <h3 className="font-semibold">Réseaux sociaux</h3>
        <input
          type="text"
          placeholder="Facebook"
          value={infos.facebook || ''}
          onChange={(e) => handleChange('facebook', e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Instagram"
          value={infos.instagram || ''}
          onChange={(e) => handleChange('instagram', e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="Twitter"
          value={infos.twitter || ''}
          onChange={(e) => handleChange('twitter', e.target.value)}
          className="w-full border p-2 rounded"
        />
        <input
          type="text"
          placeholder="YouTube"
          value={infos.youtube || ''}
          onChange={(e) => handleChange('youtube', e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      <div className="border p-4 rounded space-y-2">
        <h3 className="font-semibold">Footer</h3>
        <textarea
          placeholder="Texte À propos de nous (footer)"
          value={infos.footer?.aboutText || ''}
          onChange={(e) => handleFooterChange('aboutText', e.target.value)}
          className="w-full border p-2 rounded"
          rows={3}
        />
        <div className="flex items-center space-x-2">
          <button
            type="button"
            className="px-2 py-1 bg-gray-200 rounded"
            onClick={() => handleYearChange(-1)}
            disabled={parseInt(infos.footer?.year || '2025', 10) <= 2025}
          >
            -
          </button>
          <input
            type="number"
            min={2025}
            step={1}
            placeholder="Année du footer (ex: 2025)"
            value={infos.footer?.year || ''}
            onChange={(e) =>
              handleFooterChange('year', getValidYear(e.target.value))
            }
            className="w-32 border p-2 rounded text-center"
          />
          <button
            type="button"
            className="px-2 py-1 bg-gray-200 rounded"
            onClick={() => handleYearChange(1)}
          >
            +
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Seules les années 2025 et suivantes sont autorisées.
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded font-semibold"
      >
        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>
    </div>
  );
}
