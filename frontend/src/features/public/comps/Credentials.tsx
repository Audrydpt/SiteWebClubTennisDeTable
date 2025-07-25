/* eslint-disable */
import React, { useEffect, useState } from 'react';
import {
  User,
  Phone,
  Mail,
  Shield,
  Save,
  AlertCircle,
  CheckCircle2,
  Info,
  Trophy,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import supabase from '@/lib/supabaseClient';
import { updateUserProfile } from '@/services/api';
import { Member } from '@/services/type';

export default function Credentials() {
  const [member, setMember] = useState<Member | null>(null);
  const [telephone, setTelephone] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatRole = (role?: string) =>
    role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Inconnu';

  // Chargement du membre
  useEffect(() => {
    const fetchMember = async () => {
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
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/membres?supabase_uid=${user.id}`
        );
        const data: Member[] = await res.json();
        const userData = data[0];
        setMember(userData);
        setTelephone(userData?.telephone || '');
      } catch (err: any) {
        setError(`Erreur lors du chargement des données : ${err.message}`);
      }

      setLoading(false);
    };

    fetchMember();
  }, []);

  const handlePasswordReset = async () => {
    setError('');
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user?.email) {
      setError("Impossible de récupérer l'adresse email.");
      setLoading(false);
      return;
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      user.email
    );
    if (resetError) {
      setError(resetError.message);
    } else {
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    }

    setLoading(false);
  };

  const handleSavePhone = async () => {
    if (!member) return;
    setLoading(true);
    setError('');

    try {
      await updateUserProfile(member.id, { ...member, telephone });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(`Erreur lors de la sauvegarde : ${err.message}`);
    }

    setLoading(false);
  };

  const isPhoneChanged = member && telephone !== member.telephone;

  if (loading && !member) {
    return (
      <div className="flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-gray-600">Gérez vos informations personnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Infos personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Prénom
                  </Label>
                  <Input
                    disabled
                    value={member?.prenom || ''}
                    className="bg-gray-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    Nom
                  </Label>
                  <Input
                    disabled
                    value={member?.nom || ''}
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Adresse e-mail
                </Label>
                <Input
                  disabled
                  value={member?.email || ''}
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">
                  Pour modifier votre email, contactez le comité du club
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="Votre numéro de téléphone"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSavePhone}
                    disabled={!isPhoneChanged || loading}
                    size="sm"
                    className="px-3"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {saved && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      Numéro de téléphone mis à jour avec succès
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div className="space-y-1">
                  <p className="font-medium">Mot de passe</p>
                  <p className="text-sm text-gray-600">
                    Lien de changement de mot de passe valide pour 1 clique
                    seulement.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handlePasswordReset}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
                  ) : (
                    'Changer'
                  )}
                </Button>
              </div>

              {emailSent && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700">
                    Un email de réinitialisation a été envoyé à votre adresse.
                    <br />
                    <span className="font-medium">
                      Vérifiez vos spams si vous ne le recevez pas.
                    </span>
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Statut membre
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-2">
                <Badge variant="secondary">
                  {formatRole(member?.role)}
                </Badge>
                <p className="text-sm text-gray-600">
                  Membre depuis le{' '}
                  {member?.dateInscription
                    ? new Date(member.dateInscription).toLocaleDateString(
                        'fr-FR'
                      )
                    : '-'}
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Classement</span>
                  <span className="font-medium">{member?.classement}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Saison</span>
                  <span className="font-medium">2024-2025</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Pour toute modification de vos informations personnelles ou
                questions concernant votre compte :
              </p>
              <div className="space-y-2 text-sm">
                <p>Contacter Alessio ou Audry via messenger</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
