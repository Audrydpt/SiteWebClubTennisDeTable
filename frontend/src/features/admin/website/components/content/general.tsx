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

  const handleSave = async () => {
    setSaving(true);
    try {
      const currentData = await fetchInformations();
      const mergedData = { ...currentData[0], ...infos };
      await updateInformations(mergedData.id, mergedData);
      alert('Infos générales sauvegardées !');
    } catch (error) {
      console.error(error);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
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
