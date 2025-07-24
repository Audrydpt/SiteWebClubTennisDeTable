import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import supabase from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { hash } = window.location;
    const { search } = window.location;

    // Gestion des erreurs dans l'URL (ex: token expiré)
    if (search.includes('error')) {
      const params = new URLSearchParams(search);
      const errorCode = params.get('error');
      if (errorCode === 'access_denied') {
        setTokenError(
          'Le lien est invalide ou a expiré. Veuillez redemander une réinitialisation.'
        );
      }
      return;
    }

    // Récupération du token depuis le hash
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (token && refreshToken !== null) {
        supabase.auth.setSession({
          access_token: token,
          refresh_token: refreshToken,
        });
        setAccessToken(token);
      } else {
        setTokenError('Lien de réinitialisation incomplet.');
      }
    }
  }, []);

  const handleReset = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => {
        navigate('/espace-membre');
      }, 2000);
    }

    setIsLoading(false);
  };

  if (tokenError) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md space-y-4 text-center text-red-600">
        <h2 className="text-xl font-bold">Erreur de lien</h2>
        <p>{tokenError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 border rounded-lg shadow-md space-y-4">
      <h2 className="text-xl font-bold">Réinitialiser mon mot de passe</h2>

      {error && <p className="text-red-600">{error}</p>}
      {success ? (
        <p className="text-green-600">
          Mot de passe mis à jour avec succès. Redirection...
        </p>
      ) : (
        <>
          <Input
            type="password"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <Button onClick={handleReset} disabled={isLoading || !accessToken}>
            {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </Button>
        </>
      )}
    </div>
  );
}
