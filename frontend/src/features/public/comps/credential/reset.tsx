/* eslint-disable */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import supabase from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const navigate = useNavigate();

  // Validation de la force du mot de passe
  const validatePassword = (password: string) => {
    const errors: string[] = [];
    let strength = 0;

    if (password.length < 8) errors.push('Au moins 8 caractères');
    else strength += 25;

    if (!/[A-Z]/.test(password)) errors.push('Au moins une majuscule');
    else strength += 25;

    if (!/[a-z]/.test(password)) errors.push('Au moins une minuscule');
    else strength += 25;

    if (!/[0-9]/.test(password)) errors.push('Au moins un chiffre');
    else strength += 25;

    setValidationErrors(errors);
    setPasswordStrength(strength);
  };

  useEffect(() => {
    validatePassword(newPassword);
  }, [newPassword]);

  useEffect(() => {
    const { hash, search } = window.location;

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

    if (validationErrors.length > 0) {
      setError('Veuillez respecter tous les critères du mot de passe.');
      return;
    }

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

  const getStrengthText = () => {
    if (passwordStrength < 25) return 'Très faible';
    if (passwordStrength < 50) return 'Faible';
    if (passwordStrength < 75) return 'Moyen';
    if (passwordStrength < 100) return 'Fort';
    return 'Très fort';
  };

  if (tokenError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Lien invalide</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{tokenError}</p>
            <Button variant="outline" className="w-full bg-transparent">
              Demander un nouveau lien
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-green-600">
              Mot de passe mis à jour !
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Votre mot de passe a été modifié avec succès.
              <br />
              Redirection en cours...
            </p>
            <div className="flex items-center justify-center space-x-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm text-gray-500">
                Redirection automatique
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Nouveau mot de passe</CardTitle>
          <p className="text-gray-600 text-sm">
            Choisissez un mot de passe sécurisé pour votre compte
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-sm font-medium">
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Entrez votre nouveau mot de passe"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {newPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Force du mot de passe
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength < 50
                          ? 'text-red-600'
                          : passwordStrength < 75
                            ? 'text-yellow-600'
                            : 'text-green-600'
                      }`}
                    >
                      {getStrengthText()}
                    </span>
                  </div>
                  <Progress value={passwordStrength} className="h-2" />
                </div>
              )}
              {newPassword && validationErrors.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">Critères requis :</p>
                  <ul className="space-y-1">
                    {validationErrors.map((error, index) => (
                      <li
                        key={index}
                        className="flex items-center space-x-2 text-xs"
                      >
                        <XCircle className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-sm font-medium">
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmez votre mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {confirmPassword && (
                <div className="flex items-center space-x-2">
                  {newPassword === confirmPassword ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-green-600">
                        Les mots de passe correspondent
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-xs text-red-600">
                        Les mots de passe ne correspondent pas
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
          <Separator />
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Lock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900">
                  Conseils de sécurité
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Utilisez un mot de passe unique pour ce compte</li>
                  <li>• Évitez les informations personnelles</li>
                  <li>• Conservez-le en lieu sûr</li>
                </ul>
              </div>
            </div>
          </div>
          <Button
            onClick={handleReset}
            disabled={
              isLoading ||
              !accessToken ||
              !newPassword ||
              !confirmPassword ||
              newPassword !== confirmPassword ||
              validationErrors.length > 0
            }
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Mise à jour en cours...
              </>
            ) : (
              <>
                Mettre à jour le mot de passe
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
