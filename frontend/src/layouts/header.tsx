/* eslint-disable */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils.ts';
import { useAuth } from '@/lib/authContext.tsx';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu.tsx';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card.tsx';
import { useNavigate } from 'react-router-dom';


type HeaderProps = {
  title: string;
  className?: string;
} & React.ComponentProps<'header'>;

export default function Header({ title, className, ...props }: HeaderProps) {
  const location = useLocation();
  const { isAuthenticated, login, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();


// Modifiez handleLogin :
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Identifiants incorrects');
    } else {
      setUsername('');
      setPassword('');
      setError('');
      // Redirection après connexion réussie
      navigate('/admin');
    }
  };

// Modifiez handleLogout :
  const handleLogout = () => {
    logout();
    setUsername('');
    setPassword('');
    setError('');
    // Redirection après déconnexion
    navigate('/');
  };

  const sportsItems = [
    { path: '/sports/football', label: 'Football' },
    { path: '/sports/basketball', label: 'Basketball' },
    { path: '/sports/tennis', label: 'Tennis' },
    { path: '/sports/natation', label: 'Natation' },
  ];

  const equipesItems = [
    { path: '/equipes/seniors', label: 'Seniors' },
    { path: '/equipes/juniors', label: 'Juniors' },
    { path: '/equipes/minimes', label: 'Minimes' },
    { path: '/equipes/benjamins', label: 'Benjamins' },
  ];

  return (
    <header
      className={cn(
        'sticky top-0 z-50 bg-background border-b shadow-sm',
        className
      )}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                CS
              </span>
            </div>
            <span className="text-xl font-bold text-foreground">{title}</span>
          </Link>

          {/* Navigation principale */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/"
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary px-3 py-2',
                      location.pathname === '/'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    Accueil
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Sports</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[200px] gap-2 p-4">
                    {sportsItems.map((item) => (
                      <NavigationMenuLink key={item.path} asChild>
                        <Link
                          to={item.path}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            {item.label}
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Équipes</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="grid w-[200px] gap-2 p-4">
                    {equipesItems.map((item) => (
                      <NavigationMenuLink key={item.path} asChild>
                        <Link
                          to={item.path}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-sm font-medium leading-none">
                            {item.label}
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/actualites"
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary px-3 py-2',
                      location.pathname === '/actualites'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    Actualités
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/about"
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary px-3 py-2',
                      location.pathname === '/about'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    À propos
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link
                    to="/contact"
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary px-3 py-2',
                      location.pathname === '/contact'
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    Contact
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="hidden md:block bg-destructive text-destructive-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-destructive/90 transition-colors"
              >
                Déconnexion
              </button>
            ) : (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="hidden md:block bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors">
                    Login
                  </button>
                </HoverCardTrigger>
                <HoverCardContent className="w-80">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">
                        Accès administrateur
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Veuillez vous connecter pour accéder à cette section.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="username" className="text-sm font-medium">
                        Nom d'utilisateur
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        Mot de passe
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        required
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      Se connecter
                    </button>
                  </form>
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Menu mobile */}
            <button className="md:hidden p-2 rounded-md hover:bg-accent">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}