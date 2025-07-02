/* eslint-disable */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { useAuth } from '@/lib/authContext.tsx';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card.tsx';

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

  // États pour suivre les menus ouverts
  const [competitionOpen, setCompetitionOpen] = useState(false);
  const [historiqueOpen, setHistoriqueOpen] = useState(false);
  const [evenementsOpen, setEvenementsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCompetitionOpen, setMobileCompetitionOpen] = useState(false);
  const [mobileHistoriqueOpen, setMobileHistoriqueOpen] = useState(false);
  const [mobileEvenementsOpen, setMobileEvenementsOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (!success) {
      setError('Identifiants incorrects');
    } else {
      setUsername('');
      setPassword('');
      setError('');
      navigate('/admin');
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUsername('');
    setPassword('');
    setError('');
    navigate('/');
    setMobileMenuOpen(false);
  };

  const competitionItems = [
    { path: '/competition/calendrier', label: 'Calendrier' },
    { path: '/competition/equipes', label: 'Équipes' },
  ];

  const historiqueItems = [
    { path: '/historique/a-propos', label: 'À propos de nous' },
    { path: '/historique/croissance', label: 'Croissance' },
  ];

  const evenementsItems = [
    { path: '/evenements/galerie', label: 'Galerie' },
    { path: '/evenements/agenda', label: 'Agenda' },
  ];

  return (
    <header
      className={cn('sticky top-0 z-50 border-b shadow-sm', className)}
      style={{ backgroundColor: '#3A3A3A' }}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="./logo-removebg.jpg"
              alt="CTT Frameries Logo"
              className="h-16 w-16 object-contain"
            />
            <span className="text-lg font-semibold text-white">{title}</span>
          </Link>

          {/* Navigation principale - Version sans NavigationMenu */}
          <div className="hidden md:block">
            <ul className="flex items-center space-x-1">
              <li>
                <Link
                  to="/"
                  className={cn(
                    'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                    location.pathname === '/'
                      ? 'text-[#F1C40F]'
                      : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                  )}
                >
                  Accueil
                </Link>
              </li>

              <li>
                <HoverCard
                  openDelay={0}
                  closeDelay={150}
                  open={competitionOpen}
                  onOpenChange={setCompetitionOpen}
                >
                  <HoverCardTrigger asChild>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors px-3 py-2 cursor-pointer flex items-center rounded-md',
                        location.pathname.includes('/competition')
                          ? 'text-[#F1C40F]'
                          : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                      )}
                    >
                      Compétition
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`ml-1 transition-transform ${competitionOpen ? 'rotate-180' : ''}`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-[200px] p-0"
                    style={{ backgroundColor: '#3A3A3A' }}
                  >
                    <div className="grid gap-2 p-2">
                      {competitionItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]"
                        >
                          <div className="text-sm font-medium leading-none">
                            {item.label}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </li>

              <li>
                <Link
                  to="/sponsors"
                  className={cn(
                    'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                    location.pathname === '/sponsors'
                      ? 'text-[#F1C40F]'
                      : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                  )}
                >
                  Sponsors
                </Link>
              </li>

              <li>
                <HoverCard
                  openDelay={0}
                  closeDelay={150}
                  open={historiqueOpen}
                  onOpenChange={setHistoriqueOpen}
                >
                  <HoverCardTrigger asChild>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors px-3 py-2 cursor-pointer flex items-center rounded-md',
                        location.pathname.includes('/historique')
                          ? 'text-[#F1C40F]'
                          : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                      )}
                    >
                      Historique
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`ml-1 transition-transform ${historiqueOpen ? 'rotate-180' : ''}`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-[200px] p-0"
                    style={{ backgroundColor: '#3A3A3A' }}
                  >
                    <div className="grid gap-2 p-2">
                      {historiqueItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]"
                        >
                          <div className="text-sm font-medium leading-none">
                            {item.label}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </li>

              <li>
                <HoverCard
                  openDelay={0}
                  closeDelay={150}
                  open={evenementsOpen}
                  onOpenChange={setEvenementsOpen}
                >
                  <HoverCardTrigger asChild>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors px-3 py-2 cursor-pointer flex items-center rounded-md',
                        location.pathname.includes('/evenements')
                          ? 'text-[#F1C40F]'
                          : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                      )}
                    >
                      Événements
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`ml-1 transition-transform ${evenementsOpen ? 'rotate-180' : ''}`}
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent
                    className="w-[200px] p-0"
                    style={{ backgroundColor: '#3A3A3A' }}
                  >
                    <div className="grid gap-2 p-2">
                      {evenementsItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]"
                        >
                          <div className="text-sm font-medium leading-none">
                            {item.label}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </li>

              <li>
                <Link
                  to="/contact"
                  className={cn(
                    'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                    location.pathname === '/contact'
                      ? 'text-[#F1C40F]'
                      : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                  )}
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="hidden md:block bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Déconnexion
              </button>
            ) : (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    className="hidden md:flex items-center justify-center text-white p-2 rounded-md text-sm font-medium transition-colors"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F1C40F';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#3A3A3A';
                    }}
                  >
                    <UserCircle size={24} strokeWidth={2} />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
                  className="w-80"
                  style={{
                    backgroundColor: '#3A3A3A',
                    border: '1px solid #4A4A4A',
                  }}
                >
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-white">
                        Accès administrateur
                      </h4>
                      <p className="text-sm text-gray-300">
                        Veuillez vous connecter pour accéder à cette section.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="username"
                        className="text-sm font-medium text-white"
                      >
                        Nom d'utilisateur
                      </label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 bg-gray-700 text-white"
                        style={
                          {
                            focusRingColor: '#F1C40F',
                            '--tw-ring-color': '#F1C40F',
                          } as React.CSSProperties
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="text-sm font-medium text-white"
                      >
                        Mot de passe
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 bg-gray-700 text-white"
                        style={
                          {
                            focusRingColor: '#F1C40F',
                            '--tw-ring-color': '#F1C40F',
                          } as React.CSSProperties
                        }
                        required
                      />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <button
                      type="submit"
                      className="w-full text-black px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      style={{ backgroundColor: '#F1C40F' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#E6B800';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#F1C40F';
                      }}
                    >
                      Se connecter
                    </button>
                  </form>
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Menu mobile - Bouton hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-600 text-white"
            >
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

      {/* Menu mobile - Contenu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#3A3A3A] border-t border-gray-700 shadow-lg">
          <div className="py-2 space-y-1">
            <Link
              to="/"
              className={cn(
                'block px-4 py-2 text-base font-medium',
                location.pathname === '/'
                  ? 'text-[#F1C40F]'
                  : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              Accueil
            </Link>

            {/* Menu Compétition mobile */}
            <div>
              <button
                onClick={() => setMobileCompetitionOpen(!mobileCompetitionOpen)}
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  location.pathname.includes('/competition')
                    ? 'text-[#F1C40F]'
                    : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                )}
              >
                <span>Compétition</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${mobileCompetitionOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {mobileCompetitionOpen && (
                <div className="pl-6 bg-[#444444]">
                  {competitionItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2 text-base text-white hover:text-[#F1C40F]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Sponsors */}
            <Link
              to="/sponsors"
              className={cn(
                'block px-4 py-2 text-base font-medium',
                location.pathname === '/sponsors'
                  ? 'text-[#F1C40F]'
                  : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              Sponsors
            </Link>

            {/* Menu Historique mobile */}
            <div>
              <button
                onClick={() => setMobileHistoriqueOpen(!mobileHistoriqueOpen)}
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  location.pathname.includes('/historique')
                    ? 'text-[#F1C40F]'
                    : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                )}
              >
                <span>Historique</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${mobileHistoriqueOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {mobileHistoriqueOpen && (
                <div className="pl-6 bg-[#444444]">
                  {historiqueItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2 text-base text-white hover:text-[#F1C40F]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Événements mobile */}
            <div>
              <button
                onClick={() => setMobileEvenementsOpen(!mobileEvenementsOpen)}
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  location.pathname.includes('/evenements')
                    ? 'text-[#F1C40F]'
                    : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                )}
              >
                <span>Événements</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${mobileEvenementsOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {mobileEvenementsOpen && (
                <div className="pl-6 bg-[#444444]">
                  {evenementsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2 text-base text-white hover:text-[#F1C40F]"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Contact */}
            <Link
              to="/contact"
              className={cn(
                'block px-4 py-2 text-base font-medium',
                location.pathname === '/contact'
                  ? 'text-[#F1C40F]'
                  : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>

            {/* Connexion/Déconnexion mobile */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Déconnexion
              </button>
            ) : (
              <div className="px-4 py-4 border-t border-gray-700">
                <form onSubmit={handleLogin} className="space-y-3">
                  <div>
                    <label htmlFor="mobile-username" className="text-sm font-medium text-white">
                      Nom d'utilisateur
                    </label>
                    <input
                      id="mobile-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3 py-2 mt-1 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="mobile-password" className="text-sm font-medium text-white">
                      Mot de passe
                    </label>
                    <input
                      id="mobile-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3 py-2 mt-1 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
                      required
                    />
                  </div>
                  {error && <p className="text-sm text-red-400">{error}</p>}
                  <button
                    type="submit"
                    className="w-full text-black py-2 rounded-md text-base font-medium"
                    style={{ backgroundColor: '#F1C40F' }}
                  >
                    Se connecter
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}