/* eslint-disable */
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import supabase from '@/lib/supabaseClient.ts';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Member } from '@/services/type.ts';



export default function Credentials() {
  const [member, setMember] = useState<Member | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔄 Récupération des infos JSON Server du membre connecté
  useEffect(() => {
    const fetchMemberData = async () => {
      setLoading(true);
      setError('');

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setError('Utilisateur non authentifié.');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/membres?supabase_uid=${user.id}`);
        const users: Member[] = await res.json();
        setMember(users[0] || null);
      } catch (err: any) {
        setError('Erreur de chargement : ' + err.message);
      }

      setLoading(false);
    };

    fetchMemberData();
  }, []);

  // 🔁 Demande de mail de reset
  const handlePasswordReset = async () => {
    setError('');
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setError('Impossible de récupérer l\'email utilisateur.');
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(user.email);

    if (resetError) {
      setError(resetError.message);
    } else {
      setEmailSent(true);
    }
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <h2 className="text-xl font-bold">Mon profil</h2>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Chargement...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : member ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm text-gray-600">Nom</label>
                <Input disabled value={member.nom} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Prénom</label>
                <Input disabled value={member.prenom} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Téléphone</label>
                <Input disabled value={member.telephone} />
              </div>
              <div>
                <label className="text-sm text-gray-600">Classement</label>
                <Input disabled value={member.classement} />
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <Button onClick={handlePasswordReset}>Changer mon mot de passe</Button>
              {emailSent && (
                <p className="text-green-600">
                  Un e-mail de réinitialisation a été envoyé à votre adresse.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-gray-500">Aucune donnée membre trouvée.</p>
        )}
      </CardContent>
    </Card>
  );
}
