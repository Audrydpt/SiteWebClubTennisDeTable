import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

import LoadingSpinner from '@/components/loading';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-context';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import logo from '@/assets/logo.svg';

const loginSchema = z.object({
  username: z.string().nonempty(),
  password: z.string().nonempty(),
});

type LoginSchema = z.infer<typeof loginSchema>;

export default function Login() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);
    setError('');
    try {
      await login(data.username, data.password);
      navigate('/dashboard');
    } catch {
      setError(t('login.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <img src={logo} alt="Logo" className="w-[100px] mb-4 mx-auto" />
          <CardTitle className="text-2xl">{t('login.title')}</CardTitle>
          <CardDescription>{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleLogin)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.username')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('login.username')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('login.password')}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t('login.password')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <LoadingSpinner className="size-5 mx-auto" />
                ) : (
                  t('login.submit')
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <div className="text-center mb-4 text-muted">
          <Button
            variant="link"
            className={`text-muted ${i18n.language === 'en' ? 'font-semibold' : ''}`}
            onClick={() => i18n.changeLanguage('en')}
          >
            English
          </Button>
          {' | '}
          <Button
            variant="link"
            className={`text-muted ${i18n.language === 'fr' ? 'font-semibold' : ''}`}
            onClick={() => i18n.changeLanguage('fr')}
          >
            Français
          </Button>
        </div>
      </Card>
    </div>
  );
}
