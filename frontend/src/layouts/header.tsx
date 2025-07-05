/* eslint-disable */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
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
  const [mobileLoginFormOpen, setMobileLoginFormOpen] = useState(false);

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
      setMobileLoginFormOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUsername('');
    setPassword('');
    setError('');
    navigate('/');
    setMobileMenuOpen(false);
    setMobileLoginFormOpen(false);
  };

  // Fonction pour gérer les clics sur les liens quand l'utilisateur est authentifié
  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    if (isAuthenticated) {
      e.preventDefault(); // Empêcher la navigation si authentifié
      return;
    }
    navigate(path);
    setMobileMenuOpen(false);
  };

  // Ferme tous les sous-menus quand le menu principal est fermé
  const handleMobileMenuToggle = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);

    if (!newState) {
      // Réinitialiser tous les sous-menus si on ferme le menu principal
      setMobileCompetitionOpen(false);
      setMobileHistoriqueOpen(false);
      setMobileEvenementsOpen(false);
      setMobileLoginFormOpen(false);
    }
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
    { path: '/evenements/calendrier', label: 'Calendrier' },
    { path: '/evenements/galerie', label: 'Galerie' },
  ];

  // Style des liens selon l'état d'authentification
  const getLinkStyles = (isActive: boolean) => {
    if (isAuthenticated) {
      return 'text-[#3A3A3A] cursor-not-allowed'; // Style grisé et non cliquable
    }
    return isActive
      ? 'text-[#F1C40F]'
      : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]';
  };

  return (
    <header
      className={cn('sticky top-0 z-50 border-b shadow-sm', className)}
      style={{ backgroundColor: '#3A3A3A' }}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo et titre */}
          <Link
            to="/"
            className="flex items-center space-x-2"
            onClick={(e) => isAuthenticated && e.preventDefault()}
          >
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
                    getLinkStyles(location.pathname === '/')
                  )}
                  onClick={(e) => handleLinkClick(e, '/')}
                >
                  Accueil
                </Link>
              </li>

              <li>
                <HoverCard
                  openDelay={0}
                  closeDelay={150}
                  open={!isAuthenticated && competitionOpen}
                  onOpenChange={setCompetitionOpen}
                >
                  <HoverCardTrigger asChild>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center gap-1',
                        isAuthenticated
                          ? 'text-[#3A3A3A] cursor-not-allowed'
                          : location.pathname.includes('/competition')
                            ? 'text-[#F1C40F] cursor-pointer'
                            : 'text-white cursor-pointer hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                      )}
                    >
                      Compétition
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
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </HoverCardTrigger>
                  {!isAuthenticated && (
                    <HoverCardContent
                      className="w-[200px] p-0"
                      style={{ backgroundColor: '#3A3A3A' }}
                    >
                      <div className="grid gap-2 p-2">
                        {competitionItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="text-sm text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A] p-2 rounded-md"
                            onClick={(e) => handleLinkClick(e, item.path)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
              </li>

              <li>
                <Link
                  to="/sponsors"
                  className={cn(
                    'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                    getLinkStyles(location.pathname === '/sponsors')
                  )}
                  onClick={(e) => handleLinkClick(e, '/sponsors')}
                >
                  Sponsors
                </Link>
              </li>

              <li>
                <HoverCard
                  openDelay={0}
                  closeDelay={150}
                  open={!isAuthenticated && historiqueOpen}
                  onOpenChange={setHistoriqueOpen}
                >
                  <HoverCardTrigger asChild>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center gap-1',
                        isAuthenticated
                          ? 'text-[#3A3A3A] cursor-not-allowed'
                          : location.pathname.includes('/historique')
                            ? 'text-[#F1C40F] cursor-pointer'
                            : 'text-white cursor-pointer hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                      )}
                    >
                      Historique
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
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </HoverCardTrigger>
                  {!isAuthenticated && (
                    <HoverCardContent
                      className="w-[200px] p-0"
                      style={{ backgroundColor: '#3A3A3A' }}
                    >
                      <div className="grid gap-2 p-2">
                        {historiqueItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="text-sm text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A] p-2 rounded-md"
                            onClick={(e) => handleLinkClick(e, item.path)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
              </li>

              <li>
                <HoverCard
                  openDelay={0}
                  closeDelay={150}
                  open={!isAuthenticated && evenementsOpen}
                  onOpenChange={setEvenementsOpen}
                >
                  <HoverCardTrigger asChild>
                    <span
                      className={cn(
                        'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center gap-1',
                        isAuthenticated
                          ? 'text-[#3A3A3A] cursor-not-allowed'
                          : location.pathname.includes('/evenements')
                            ? 'text-[#F1C40F] cursor-pointer'
                            : 'text-white cursor-pointer hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                      )}
                    >
                      Evénements
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
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </HoverCardTrigger>
                  {!isAuthenticated && (
                    <HoverCardContent
                      className="w-[200px] p-0"
                      style={{ backgroundColor: '#3A3A3A' }}
                    >
                      <div className="grid gap-2 p-2">
                        {evenementsItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className="text-sm text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A] p-2 rounded-md"
                            onClick={(e) => handleLinkClick(e, item.path)}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
              </li>

              <li>
                <Link
                  to="/contact"
                  className={cn(
                    'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                    getLinkStyles(location.pathname === '/contact')
                  )}
                  onClick={(e) => handleLinkClick(e, '/contact')}
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
                      e.currentTarget.style.backgroundColor = '#4A4A4A';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <LogIn size={24} strokeWidth={2} />
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
                        className="w-full px-3 py-2 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
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
                        className="w-full px-3 py-2 border border-gray-600 rounded-md text-sm bg-gray-700 text-white"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      {error && <p className="text-sm text-red-400">{error}</p>}
                    </div>

                    <button
                      type="submit"
                      className="w-full text-black py-2 rounded-md text-sm font-medium"
                      style={{ backgroundColor: '#F1C40F' }}
                    >
                      Se connecter
                    </button>
                  </form>
                </HoverCardContent>
              </HoverCard>
            )}

            {/* Menu mobile - Bouton hamburger */}
            <button
              onClick={handleMobileMenuToggle}
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
                getLinkStyles(location.pathname === '/')
              )}
              onClick={(e) => handleLinkClick(e, '/')}
            >
              Accueil
            </Link>

            {/* Menu Compétition mobile */}
            <div>
              <button
                onClick={() =>
                  !isAuthenticated &&
                  setMobileCompetitionOpen(!mobileCompetitionOpen)
                }
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  isAuthenticated
                    ? 'text-[#3A3A3A] cursor-not-allowed'
                    : location.pathname.includes('/competition')
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

              {mobileCompetitionOpen && !isAuthenticated && (
                <div className="pl-6 bg-[#444444]">
                  {competitionItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2 text-base text-white hover:text-[#F1C40F]"
                      onClick={(e) => handleLinkClick(e, item.path)}
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
                getLinkStyles(location.pathname === '/sponsors')
              )}
              onClick={(e) => handleLinkClick(e, '/sponsors')}
            >
              Sponsors
            </Link>

            {/* Menu Historique mobile */}
            <div>
              <button
                onClick={() =>
                  !isAuthenticated &&
                  setMobileHistoriqueOpen(!mobileHistoriqueOpen)
                }
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  isAuthenticated
                    ? 'text-[#3A3A3A] cursor-not-allowed'
                    : location.pathname.includes('/historique')
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

              {mobileHistoriqueOpen && !isAuthenticated && (
                <div className="pl-6 bg-[#444444]">
                  {historiqueItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2 text-base text-white hover:text-[#F1C40F]"
                      onClick={(e) => handleLinkClick(e, item.path)}
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
                onClick={() =>
                  !isAuthenticated &&
                  setMobileEvenementsOpen(!mobileEvenementsOpen)
                }
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  isAuthenticated
                    ? 'text-[#3A3A3A] cursor-not-allowed'
                    : location.pathname.includes('/evenements')
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

              {mobileEvenementsOpen && !isAuthenticated && (
                <div className="pl-6 bg-[#444444]">
                  {evenementsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block px-4 py-2 text-base text-white hover:text-[#F1C40F]"
                      onClick={(e) => handleLinkClick(e, item.path)}
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
                getLinkStyles(location.pathname === '/contact')
              )}
              onClick={(e) => handleLinkClick(e, '/contact')}
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
              <div>
                {/* Bouton Espace Admin qui affiche le formulaire */}
                <button
                  onClick={() => setMobileLoginFormOpen(!mobileLoginFormOpen)}
                  className={cn(
                    'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                    'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                  )}
                >
                  <span>Espace admin</span>
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
                    className={`transition-transform ${mobileLoginFormOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {/* Formulaire de connexion mobile affiché conditionnellement */}
                {mobileLoginFormOpen && (
                  <div className="pl-6 py-4 bg-[#444444]">
                    <form onSubmit={handleLogin} className="space-y-3">
                      <div>
                        <label
                          htmlFor="mobile-username"
                          className="text-sm font-medium text-white"
                        >
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
                        <label
                          htmlFor="mobile-password"
                          className="text-sm font-medium text-white"
                        >
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
            )}
          </div>
        </div>
      )}
    </header>
  );
}
