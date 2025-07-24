/* eslint-disable */
import { useState } from 'react';
import supabase from '@/lib/supabaseClient.ts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleUpdatePassword = async () => {
    setError('');
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 space-y-4">
      <h1 className="text-xl font-semibold text-center">
        Réinitialisation du mot de passe
      </h1>

      <Input
        type="password"
        placeholder="Nouveau mot de passe"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
      />
      <Button className="w-full" onClick={handleUpdatePassword}>
        Mettre à jour le mot de passe
      </Button>

      {success && (
        <p className="text-green-600 text-sm text-center">
          Mot de passe mis à jour avec succès.
        </p>
      )}
      {error && (
        <p className="text-red-600 text-sm text-center">Erreur : {error}</p>
      )}
    </div>
  );
}
