import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import logo from '@/assets/logo.svg';
import LoadingSpinner from '@/components/loading';
import { useAuth } from '@/providers/auth-context';

const loginSchema = z.object({
  username: z.string().nonempty('Username is required'),
  password: z.string().nonempty('Password is required'),
});

type LoginSchema = z.infer<typeof loginSchema>;

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Nouvel état pour gérer le loading

  if (isAuthenticated) {
    navigate('/dashboard');
  }

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const handleLogin = async (data: LoginSchema) => {
    setIsLoading(true); // Active le loading
    setError(''); // Réinitialise les erreurs
    try {
      await login(data.username, data.password);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false); // Désactive le loading après la réponse
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <img
            src={logo}
            alt="Logo"
            style={{ width: '100px', marginBottom: '16px' }}
            className="mx-auto mb-4"
          />
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your username and password below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...form.register('username')}
                  placeholder="Username"
                  onChange={(e) => {
                    form.setValue('username', e.target.value);
                    setError('');
                  }}
                />
                {form.formState.errors.username && (
                  <p className="text-destructive">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                  placeholder="Password"
                  onChange={(e) => {
                    form.setValue('password', e.target.value);
                    setError('');
                  }}
                />
                {form.formState.errors.password && (
                  <p className="text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              {error && <p className="text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <LoadingSpinner className="w-5 h-5 mx-auto" />
                ) : (
                  'Login'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;
