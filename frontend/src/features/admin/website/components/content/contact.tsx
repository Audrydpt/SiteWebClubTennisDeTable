/* eslint-disable @typescript-eslint/no-explicit-any,react/no-array-index-key,no-console,no-alert */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { fetchContact, updateContact } from '@/services/api';

export default function ContactManager() {
  const [contact, setContact] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // --- Chargement des données ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetchContact();
        if (!res || res.length === 0) {
          setContact([
            { id: '1', texte: '', faq: [], horaires: [], competitions: '' },
          ]);
        } else {
          const cleaned = res.map((c: any) => ({
            ...c,
            faq: Array.isArray(c.faq) ? c.faq : [],
            horaires: Array.isArray(c.horaires) ? c.horaires : [],
            texte: typeof c.texte === 'string' ? c.texte : '',
            competitions:
              typeof c.competitions === 'string' ? c.competitions : '',
          }));
          setContact(cleaned);
        }
      } catch (error) {
        console.error('Erreur fetchContact:', error);
        setContact([]);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (!contact || contact.length === 0) return <p>Aucun contact trouvé</p>;

  const contactInfo = contact[0];

  // --- Handlers ---
  const handleContactChange = (field: string, value: any) => {
    const newContact = [...contact];
    newContact[0][field] = value;
    setContact(newContact);
  };

  const handleHoraireChange = (index: number, field: string, value: string) => {
    const newContact = [...contact];
    newContact[0].horaires[index][field] = value;
    setContact(newContact);
  };

  const addHoraire = () => {
    const newContact = [...contact];
    newContact[0].horaires.push({ jour: '', horaire: '' });
    setContact(newContact);
  };

  const removeHoraire = (index: number) => {
    const newContact = [...contact];
    newContact[0].horaires = newContact[0].horaires.filter(
      (_: any, i: number) => i !== index
    );
    setContact(newContact);
  };

  const handleFaqChange = (index: number, field: string, value: string) => {
    const newContact = [...contact];
    newContact[0].faq[index][field] = value;
    setContact(newContact);
  };

  const addFaq = () => {
    const newContact = [...contact];
    newContact[0].faq.push({
      id: `faq${Date.now()}`,
      question: '',
      reponse: '',
    });
    setContact(newContact);
  };

  const removeFaq = (index: number) => {
    const newContact = [...contact];
    newContact[0].faq = newContact[0].faq.filter(
      (_: any, i: number) => i !== index
    );
    setContact(newContact);
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      await updateContact(contact); // envoie le tableau contact complet
      alert('Contact mis à jour ✅');
    } catch (error) {
      console.error('Erreur updateContact:', error);
      alert('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestion de la section contact</h2>

      {/* Texte d'introduction */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Texte d&#39;introduction</h3>
          <Input
            value={contactInfo.texte}
            onChange={(e) => handleContactChange('texte', e.target.value)}
            placeholder="Texte d'introduction"
          />
        </CardContent>
      </Card>

      {/* Horaires */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">Horaires</h3>
          {contactInfo.horaires.map((h: any, i: number) => (
            <div key={i} className="flex gap-2">
              <Input
                value={h.jour}
                onChange={(e) => handleHoraireChange(i, 'jour', e.target.value)}
                placeholder="Jour"
              />
              <Input
                value={h.horaire}
                onChange={(e) =>
                  handleHoraireChange(i, 'horaire', e.target.value)
                }
                placeholder="Horaire"
              />
              <Button
                variant="destructive"
                type="button"
                onClick={() => removeHoraire(i)}
              >
                Supprimer
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addHoraire}>
            Ajouter un horaire
          </Button>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold">FAQ</h3>
          {contactInfo.faq.map((f: any, i: number) => (
            <div key={i} className="space-y-2">
              <Input
                value={f.question}
                onChange={(e) => handleFaqChange(i, 'question', e.target.value)}
                placeholder="Question"
              />
              <Input
                value={f.reponse}
                onChange={(e) => handleFaqChange(i, 'reponse', e.target.value)}
                placeholder="Réponse"
              />
              <Button
                variant="destructive"
                type="button"
                onClick={() => removeFaq(i)}
              >
                Supprimer
              </Button>
            </div>
          ))}
          <Button type="button" onClick={addFaq}>
            Ajouter une question
          </Button>
        </CardContent>
      </Card>

      {/* Sauvegarde */}
      <Button onClick={saveChanges} disabled={saving}>
        {saving ? 'Enregistrement...' : 'Enregistrer'}
      </Button>
    </div>
  );
}
