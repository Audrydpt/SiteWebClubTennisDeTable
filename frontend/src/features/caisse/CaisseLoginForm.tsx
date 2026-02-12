/* eslint-disable */

import { useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

export default function CaisseLoginForm() {
  const { loginAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = loginAdmin(username, password);
    if (!success) {
      setError('Identifiants incorrects');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#2C2C2C] flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-[#3A3A3A] rounded-2xl p-8 w-full max-w-md shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#F1C40F] rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-[#2C2C2C]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Caisse</h1>
          <p className="text-gray-400 mt-1">Connexion administrateur</p>
        </div>

        {error && (
          <div className="bg-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-center text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Identifiant"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-14 text-lg bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl"
            autoComplete="username"
          />
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 text-lg bg-[#4A4A4A] border-none text-white placeholder:text-gray-500 rounded-xl"
            autoComplete="current-password"
          />
          <Button
            type="submit"
            disabled={loading || !username || !password}
            className="w-full h-14 text-lg font-semibold bg-[#F1C40F] text-[#2C2C2C] hover:bg-[#F1C40F]/90 rounded-xl"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </div>
      </form>
    </div>
  );
}
