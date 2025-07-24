/* eslint-disable */
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import supabase from '@/lib/supabaseClient.ts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ➜ Récupère les tokens depuis l’URL et initialise la session Supabase
  useEffect(() => {
    const access_token = searchParams.get('access_token');
    const refresh_token = searchParams.get('refresh_token');

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (error) {
          setMessage("Erreur lors de la validation du lien. Veuillez réessayer.");
        }
      });
    }
  }, [searchParams]);

  // ➜ Mise à jour du mot de passe
  const handleUpdatePassword = async () => {
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setMessage(`Erreur : ${error.message}`);
    } else {
      setMessage('Mot de passe modifié avec succès. Redirection...');
      setTimeout(() => {
        navigate('/espace-membre');
      }, 2000); // ⏱️ attend 2 secondes
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-4 p-4">
      <h2 className="text-xl font-bold">Réinitialiser mon mot de passe</h2>

      <Input
        type="password"
        placeholder="Nouveau mot de passe"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />

      <Button onClick={handleUpdatePassword} disabled={loading || !newPassword}>
        {loading ? 'Modification en cours…' : 'Valider le nouveau mot de passe'}
      </Button>

      {message && <p className="text-sm pt-2">{message}</p>}
    </div>
  );
}
