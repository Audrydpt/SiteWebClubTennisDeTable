/* eslint-disable */
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn, UserCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils.ts';
import { useAuth } from '@/lib/authContext.tsx';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card.tsx';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover.tsx';

type HeaderProps = {
  title: string;
  className?: string;
} & React.ComponentProps<'header'>;

// Fonction de type guard pour vérifier si l'utilisateur est un Member
const isMember = (user: any): user is {
  prenom: string;
  nom: string;
  email?: string;
  classement?: string;
} => {
  return user !== null && 'prenom' in user && 'nom' in user;
};

export default function Header({ title, className, ...props }: HeaderProps) {
  const location = useLocation();
  const { isAuthenticated, user, loginMember, loginAdmin, logout, isAdmin } =
    useAuth();

  // États pour le formulaire de connexion
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // États pour la gestion des menus (supprimer evenementsOpen)
  const [historiqueOpen, setHistoriqueOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Un seul état pour gérer quelle section mobile est ouverte
  const [activeMobileSection, setActiveMobileSection] = useState<string | null>(null);

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [loginFormFocused, setLoginFormFocused] = useState(false);

  // État pour le mode de connexion admin (discret)
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [adminModeVisible, setAdminModeVisible] = useState(false);

  // Activer le mode admin discrètement avec un triple clic
  const activateAdminMode = (e: React.MouseEvent) => {
    if (e.detail === 3) {
      setIsAdminLogin(true);
      setAdminModeVisible(true);
      setTimeout(() => setAdminModeVisible(false), 2000);
    }
  };

  const handleLogoTouchStart = () => {
    const timer = setTimeout(() => {
      setIsAdminLogin(true);
      setAdminModeVisible(true);
      setTimeout(() => setAdminModeVisible(false), 2000);
    }, 1000); // 1 seconde d'appui long
    setLongPressTimer(timer);
  };

  const handleLogoTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log("Formulaire soumis:", isAdminLogin ? "Admin" : "Membre");

    try {
      if (isAdminLogin) {
        console.log("Tentative connexion admin:", username);
        const success = loginAdmin(username, password);
        console.log("Résultat connexion admin:", success);

        if (success) {
          console.log("Redirection vers /admin");
          resetForm();
          navigate('/admin');
        } else {
          setError('Identifiants administrateur incorrects');
        }
      } else {
        console.log("Tentative connexion membre:", email);
        const success = await loginMember(email, password);
        console.log("Résultat connexion membre:", success);

        if (success) {
          console.log("Redirection vers /espace-membre");
          resetForm();
          navigate('/espace-membre');

          // Vérifier l'état d'authentification après connexion réussie
          console.log("État après connexion:", {
            isAuthenticated: true,
            user: 'objet utilisateur présent'
          });
        } else {
          setError('Email ou mot de passe incorrect');
        }
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setError('Erreur lors de la connexion');
    }
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setError('');
    setMobileMenuOpen(false);
    setIsAdminLogin(false);
  };

  const handleLogout = () => {
    logout();
    resetForm();
    navigate('/');
  };

  // Ferme tous les sous-menus quand le menu principal est fermé
  const handleMobileMenuToggle = () => {
    const newState = !mobileMenuOpen;
    setMobileMenuOpen(newState);

    if (!newState) {
      setActiveMobileSection(null);
    }
  };

  // Nouvelle fonction pour gérer l'ouverture/fermeture des sections mobiles
  const toggleMobileSection = (sectionName: string) => {
    setActiveMobileSection(activeMobileSection === sectionName ? null : sectionName);
  };

  const historiqueItems = [
    { path: '/infos/about', label: 'À propos de nous' },
    { path: '/infos/palmares', label: 'Palmarès' },
  ];

  const evenementsItems = [
    { path: '/evenements/calendrier', label: 'Calendrier' },
    { path: '/evenements/galerie', label: 'Galerie' },
  ];

  const memberItems = [
    { path : '/espace-membre', label: 'Dashboard' },
    { path : '/espace-membre/selections', label: 'Sélections' },
    { path : '/espace-membre/statistiques', label: 'Concours club' },
    { path : '/espace-membre/commandes', label: 'Commande' },
    { path : '/espace-membre/credentials', label: 'Mon compte' },

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
            <div
              style={{
                backgroundImage: "url('https://res.cloudinary.com/dsrrxx5yx/image/upload/v1751736862/cwtcapgd9s25y02mlhhi.png')",
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                width: "4rem",
                height: "4rem",
                userSelect: "none",
                touchAction: "none"
              }}
              className="select-none"
              onClick={activateAdminMode}
              onTouchStart={handleLogoTouchStart}
              onTouchEnd={handleLogoTouchEnd}
              onContextMenu={e => e.preventDefault()}
            />
            <span className="text-lg font-semibold text-white">{title}</span>
          </Link>

          {/* Indicateur discret de mode admin */}
          {adminModeVisible && (
            <div className="absolute top-16 left-16 bg-black/70 text-yellow-400 text-xs px-2 py-1 rounded">
              Mode admin activé
            </div>
          )}

          {/* Navigation principale - Desktop */}
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

              {/* Lien direct vers les équipes */}
              <li>
                <Link
                  to="/competition/equipes"
                  className={cn(
                    'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                    location.pathname.includes('/competition')
                      ? 'text-[#F1C40F]'
                      : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                  )}
                >
                  Équipes championnat
                </Link>
              </li>

              {/* Lien direct vers le calendrier */}
              <li>
                <Link
                  to="/evenements/calendrier"
                  className={cn(
                    'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                    location.pathname === '/evenements/calendrier'
                      ? 'text-[#F1C40F]'
                      : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                  )}
                >
                  Calendrier
                </Link>
              </li>

              {/* Menu Historique */}
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
                        'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center cursor-pointer',
                        location.pathname.includes('/historique')
                          ? 'text-[#F1C40F]'
                          : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                      )}
                    >
                      Infos
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
                        className="ml-1"
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
                          className={cn(
                            'text-sm transition-colors px-3 py-2 rounded-md',
                            location.pathname === item.path
                              ? 'text-[#F1C40F]'
                              : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </li>

              {/* Page Sponsors */}
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

              {/* Page Contact */}
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

              {/* Lien direct vers la galerie */}
              <li>
                <Link
                  to="/evenements/galerie"
                  className={cn(
                    'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                    location.pathname === '/evenements/galerie'
                      ? 'text-[#F1C40F]'
                      : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                  )}
                >
                  Galerie
                </Link>
              </li>

              {/* Espace membre (menu déroulant pour membre connecté) */}
              {isAuthenticated && !isAdmin() && (
                <li>
                  <HoverCard
                    openDelay={0}
                    closeDelay={150}
                  >
                    <HoverCardTrigger asChild>
                      <span
                        className={cn(
                          'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center cursor-pointer',
                          location.pathname.includes('/espace-membre')
                            ? 'text-[#F1C40F]'
                            : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                        )}
                      >
                        Espace membre
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
                          className="ml-1"
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
                        {memberItems.map((item) => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                              'text-sm transition-colors px-3 py-2 rounded-md',
                              location.pathname === item.path
                                ? 'text-[#F1C40F]'
                                : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                            )}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </li>
              )}

              {/* Lien admin (uniquement visible si connecté comme admin) */}
              {isAuthenticated && isAdmin() && (
                <li>
                  <Link
                    to="/admin"
                    className={cn(
                      'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                      location.pathname.includes('/admin')
                        ? 'text-[#F1C40F]'
                        : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                    )}
                  >
                    Administration
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="hidden md:flex items-center justify-center text-white p-2 rounded-md text-sm font-medium transition-colors">
                    <UserCircle className="h-5 w-5 mr-1" />
                    <span>
            {isAdmin()
              ? 'Admin'
              : `${isMember(user) ? user.prenom : ''} ${isMember(user) ? user.nom : ''}`}
          </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-60"
                  style={{
                    backgroundColor: '#3A3A3A',
                    border: '1px solid #4A4A4A',
                  }}
                >
                  <div className="p-2">
                    <div className="mb-4">
                      <div className="font-medium text-white">
                        {isAdmin()
                          ? 'Administrateur'
                          : `${isMember(user) ? user.prenom : ''} ${isMember(user) ? user.nom : ''}`}
                      </div>
                      <p className="text-sm text-gray-300">
                        {isAdmin() ? 'Accès complet' : (isMember(user) ? user.email : '')}
                      </p>
                      {!isAdmin() && isMember(user) && user.classement && (
                        <p className="text-xs text-yellow-400 mt-1">
                          Classement: {user.classement}
                        </p>
                      )}
                    </div>

                    {!isAdmin() && (
                      <Link
                        to="/espace-membre/credentials"
                        className="block w-full text-left px-3 py-2 text-sm rounded-md text-white hover:bg-[#4A4A4A] hover:text-[#F1C40F]"
                      >
                        Mon compte
                      </Link>
                    )}

                    {isAdmin() && (
                      <Link
                        to="/admin"
                        className="flex items-center px-3 py-2 text-sm rounded-md text-white hover:bg-[#4A4A4A] hover:text-[#F1C40F]"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Administration
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3 py-2 text-sm rounded-md text-red-400 hover:bg-[#4A4A4A]"
                    >
                      Déconnexion
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="hidden md:flex items-center justify-center text-white hover:text-[#F1C40F] p-2 rounded-md hover:bg-[#4A4A4A] text-sm font-medium transition-colors">
                    <LogIn className="h-4 w-4 mr-2" />
                    <span>{isAdminLogin ? 'Admin' : 'Connexion'}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80"
                  style={{
                    backgroundColor: '#3A3A3A',
                    border: '1px solid #4A4A4A',
                  }}
                >
                  <form
                    onSubmit={handleLogin}
                    className="space-y-4"
                    autoComplete="on"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-medium text-white">
                        {isAdminLogin ? 'Administration' : 'Espace membre'}
                      </h3>

                      {isAdminLogin && (
                        <button
                          type="button"
                          className="text-xs text-gray-400 hover:text-white"
                          onClick={() => setIsAdminLogin(false)}
                        >
                          Retour connexion membre
                        </button>
                      )}
                    </div>

                    {isAdminLogin ? (
                      <div>
                        <label
                          htmlFor="admin-username"
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Identifiant
                        </label>
                        <input
                          id="admin-username"
                          type="text"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full px-3 py-2 bg-[#4A4A4A] border border-[#555] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#F1C40F] focus:border-transparent"
                          placeholder="Identifiant administrateur"
                          required
                          autoComplete="username"
                        />
                      </div>
                    ) : (
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-[#4A4A4A] border border-[#555] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#F1C40F] focus:border-transparent"
                          placeholder="votre@email.com"
                          required
                          autoComplete="email"
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-300 mb-1"
                      >
                        Mot de passe
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-[#4A4A4A] border border-[#555] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#F1C40F] focus:border-transparent"
                        placeholder="••••••••"
                        required
                        autoComplete={isAdminLogin ? "current-password" : "password"}
                      />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <button
                      type="submit"
                      className="w-full bg-[#F1C40F] hover:bg-[#E5B90F] text-black font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      {isAdminLogin
                        ? "Accéder à l'administration"
                        : 'Se connecter'}
                    </button>

                    {!isAdminLogin && (
                      <div className="text-xs text-gray-400 text-center">
                        <p>
                          Veuillez utiliser l'email et le mot de passe fournis
                          par le club
                        </p>
                      </div>
                    )}
                  </form>
                </PopoverContent>
              </Popover>
            )}
          </div>

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

      {/* Menu mobile */}
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

            {/* Lien direct vers les équipes sur mobile */}
            <Link
              to="/competition/equipes"
              className={cn(
                'block px-4 py-2 text-base font-medium',
                location.pathname.includes('/competition')
                  ? 'text-[#F1C40F]'
                  : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              Équipes championnat
            </Link>

            {/* Lien direct vers le calendrier sur mobile */}
            <Link
              to="/evenements/calendrier"
              className={cn(
                'block px-4 py-2 text-base font-medium',
                location.pathname === '/evenements/calendrier'
                  ? 'text-[#F1C40F]'
                  : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              Calendrier
            </Link>

            {/* Menu mobile Historique */}
            <div>
              <button
                onClick={() => toggleMobileSection('historique')}
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  location.pathname.includes('/historique') ||
                  activeMobileSection === 'historique'
                    ? 'text-[#F1C40F]'
                    : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                )}
              >
                <span>Infos</span>
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
                  className={`transition-transform ${activeMobileSection === 'historique' ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {activeMobileSection === 'historique' && (
                <div className="pl-6 py-2 space-y-1 bg-[#444444]">
                  {historiqueItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        'block px-4 py-2 text-sm font-medium',
                        location.pathname === item.path
                          ? 'text-[#F1C40F]'
                          : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Page Sponsors sur mobile */}
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

            {/* Contact sur mobile */}
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

            {/* Lien direct vers la galerie sur mobile */}
            <Link
              to="/evenements/galerie"
              className={cn(
                'block px-4 py-2 text-base font-medium',
                location.pathname === '/evenements/galerie'
                  ? 'text-[#F1C40F]'
                  : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              Galerie
            </Link>

            {/* Menu Espace membre pour membre connecté (après Galerie) */}
            {isAuthenticated && !isAdmin() && (
              <div>
                <button
                  onClick={() => toggleMobileSection('espace-membre')}
                  className={cn(
                    'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                    location.pathname.includes('/espace-membre') ||
                    activeMobileSection === 'espace-membre'
                      ? 'text-[#F1C40F]'
                      : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                  )}
                >
                  <span>Espace membre</span>
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
                    className={`transition-transform ${activeMobileSection === 'espace-membre' ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                {activeMobileSection === 'espace-membre' && (
                  <div className="pl-6 py-2 space-y-1 bg-[#444444]">
                    {memberItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'block px-4 py-2 text-sm font-medium',
                          location.pathname === item.path
                            ? 'text-[#F1C40F]'
                            : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section membre connecté */}
            {isAuthenticated && (
              <div className="border-t border-gray-600 pt-2">
                <div className="px-4 py-2 text-[#F1C40F] font-medium">
                  {isAdmin()
                    ? 'Administrateur'
                    : `${isMember(user) ? user.prenom : ''} ${isMember(user) ? user.nom : ''}`}
                </div>

                {/* Mon compte pour les membres */}
                {!isAdmin() && (
                  <Link
                    to="/espace-membre/credentials"
                    className="block px-4 py-2 text-base text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mon compte
                  </Link>
                )}

                {/* Administration pour les admins */}
                {isAdmin() && (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-base text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Administration
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-red-400 hover:text-red-300"
                >
                  Déconnexion
                </button>
              </div>
            )}

            {/* Section de connexion mobile (si non connecté) */}
            {!isAuthenticated && (
              <div className="border-t border-gray-600 pt-2">
                <button
                  onClick={() => toggleMobileSection('login')}
                  className="flex justify-between items-center w-full px-4 py-2 text-base font-medium text-white hover:text-[#F1C40F]"
                >
                  <span>
                    {isAdminLogin ? 'Espace administrateur' : 'Espace membre'}
                  </span>
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
                    className={`transition-transform ${activeMobileSection === 'login' ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {activeMobileSection === 'login' && (
                  <div className="pl-6 py-4 bg-[#444444]">
                    <form onSubmit={handleLogin} className="space-y-3">
                      {isAdminLogin && (
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-medium text-white">
                            Mode administrateur
                          </h3>
                          <button
                            type="button"
                            className="text-xs text-gray-400 hover:text-white"
                            onClick={() => setIsAdminLogin(false)}
                          >
                            Retour
                          </button>
                        </div>
                      )}

                      {isAdminLogin ? (
                        <div>
                          <label
                            htmlFor="mobile-username"
                            className="block text-sm font-medium text-gray-300 mb-1"
                          >
                            Identifiant
                          </label>
                          <input
                            id="mobile-username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-[#555] border border-[#666] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#F1C40F] focus:border-transparent"
                            placeholder="Identifiant admin"
                            required
                          />
                        </div>
                      ) : (
                        <div>
                          <label
                            htmlFor="mobile-email"
                            className="block text-sm font-medium text-gray-300 mb-1"
                          >
                            Email
                          </label>
                          <input
                            id="mobile-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-[#555] border border-[#666] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#F1C40F] focus:border-transparent"
                            placeholder="votre@email.com"
                            required
                          />
                        </div>
                      )}

                      <div>
                        <label
                          htmlFor="mobile-password"
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          Mot de passe
                        </label>
                        <input
                          id="mobile-password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3 py-2 bg-[#555] border border-[#666] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[#F1C40F] focus:border-transparent"
                          placeholder="••••••••"
                          required
                        />
                      </div>

                      {error && <p className="text-sm text-red-400">{error}</p>}

                      <button
                        type="submit"
                        className="w-full bg-[#F1C40F] hover:bg-[#E5B90F] text-black font-medium py-2 px-4 rounded-md transition-colors"
                      >
                        {isAdminLogin
                          ? "Accéder à l'administration"
                          : 'Se connecter'}
                      </button>

                      {!isAdminLogin && (
                        <div className="text-xs text-gray-400 text-center">
                          <p>
                            Utilisez l'email et mot de passe fournis par le club
                          </p>
                        </div>
                      )}
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
