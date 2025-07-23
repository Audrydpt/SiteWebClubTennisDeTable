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

  // États pour la gestion des menus
  const [competitionOpen, setCompetitionOpen] = useState(false);
  const [historiqueOpen, setHistoriqueOpen] = useState(false);
  const [evenementsOpen, setEvenementsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCompetitionOpen, setMobileCompetitionOpen] = useState(false);
  const [mobileHistoriqueOpen, setMobileHistoriqueOpen] = useState(false);
  const [mobileEvenementsOpen, setMobileEvenementsOpen] = useState(false);
  const [mobileLoginFormOpen, setMobileLoginFormOpen] = useState(false);

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
    setMobileLoginFormOpen(false);
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
      setMobileCompetitionOpen(false);
      setMobileHistoriqueOpen(false);
      setMobileEvenementsOpen(false);
      setMobileLoginFormOpen(false);
    }
  };

  const competitionItems = [
    { path: '/competition/equipes', label: 'Équipes' },
    { path: '/competition/calendrier', label: 'Calendrier' },
  ];

  const historiqueItems = [
    { path: '/infos/about', label: 'À propos de nous' },
    { path: '/infos/palmares', label: 'Palmarès' },
  ];

  const evenementsItems = [
    { path: '/evenements/calendrier', label: 'Calendrier' },
    { path: '/evenements/galerie', label: 'Galerie' },
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
              src="https://res.cloudinary.com/dsrrxx5yx/image/upload/v1751736862/cwtcapgd9s25y02mlhhi.png"
              alt="CTT Frameries Logo"
              className="h-16 w-16 object-contain"
              onClick={activateAdminMode}
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

              {/* Menu Compétition */}
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
                        'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center cursor-pointer',
                        location.pathname.includes('/competition')
                          ? 'text-[#F1C40F]'
                          : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
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
                      {competitionItems.map((item) => (
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

              {/* Menu Événements */}
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
                        'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center cursor-pointer',
                        location.pathname.includes('/evenements')
                          ? 'text-[#F1C40F]'
                          : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                      )}
                    >
                      Événements
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
                      {evenementsItems.map((item) => (
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

              {/* Espace membre (uniquement visible si connecté comme membre) */}
              {isAuthenticated && !isAdmin() && (
                <li>
                  <Link
                    to="/espace-membre"
                    className={cn(
                      'text-sm font-medium transition-colors px-3 py-2 rounded-md flex items-center',
                      location.pathname.includes('/espace-membre')
                        ? 'text-[#F1C40F]'
                        : 'text-white hover:text-[#F1C40F] hover:bg-[#4A4A4A]'
                    )}
                  >
                    Sélections
                  </Link>
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
              <HoverCard openDelay={0} closeDelay={500}>
                <HoverCardTrigger asChild>
                  <button className="hidden md:flex items-center justify-center text-white p-2 rounded-md text-sm font-medium transition-colors">
                    <UserCircle className="h-5 w-5 mr-1" />
                    <span>
                      {isAdmin()
                        ? 'Admin'
                        : `${isMember(user) ? user.prenom : ''} ${isMember(user) ? user.nom : ''}`}
                    </span>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent
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
                        to="/espace-membre"
                        className="block w-full text-left px-3 py-2 text-sm rounded-md text-white hover:bg-[#4A4A4A] hover:text-[#F1C40F]"
                      >
                        Sélections
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
                </HoverCardContent>
              </HoverCard>
            ) : (
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button className="hidden md:flex items-center justify-center text-white hover:text-[#F1C40F] p-2 rounded-md hover:bg-[#4A4A4A] text-sm font-medium transition-colors">
                    <LogIn className="h-4 w-4 mr-2" />
                    <span>{isAdminLogin ? 'Admin' : 'Connexion'}</span>
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

            {/* Menu mobile Compétition */}
            <div>
              <button
                onClick={() => setMobileCompetitionOpen(!mobileCompetitionOpen)}
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  location.pathname.includes('/competition') ||
                  mobileCompetitionOpen
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
                <div className="pl-6 py-2 space-y-1 bg-[#444444]">
                  {competitionItems.map((item) => (
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

            {/* Menu mobile Historique */}
            <div>
              <button
                onClick={() => setMobileHistoriqueOpen(!mobileHistoriqueOpen)}
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  location.pathname.includes('/historique') ||
                  mobileHistoriqueOpen
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
                  className={`transition-transform ${mobileHistoriqueOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {mobileHistoriqueOpen && (
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

            {/* Menu mobile Événements */}
            <div>
              <button
                onClick={() => setMobileEvenementsOpen(!mobileEvenementsOpen)}
                className={cn(
                  'flex justify-between items-center w-full px-4 py-2 text-base font-medium',
                  location.pathname.includes('/evenements') ||
                  mobileEvenementsOpen
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
                <div className="pl-6 py-2 space-y-1 bg-[#444444]">
                  {evenementsItems.map((item) => (
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

            {/* Section Espace membre/admin sur mobile (si connecté) */}
            {isAuthenticated && (
              <div className="border-t border-gray-600 pt-2">
                <div className="px-4 py-2 text-[#F1C40F] font-medium">
                  {isAdmin()
                    ? 'Administrateur'
                    : `${isMember(user) ? user.prenom : ''} ${isMember(user) ? user.nom : ''}`}
                </div>

                {isAdmin() ? (
                  <Link
                    to="/admin"
                    className="block px-4 py-2 text-base text-white hover:text-[#F1C40F]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Administration
                  </Link>
                ) : (
                  <Link
                    to="/espace-membre"
                    className="block px-4 py-2 text-base text-white hover:text-[#F1C40F]"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Mon espace membre
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
                  onClick={() => setMobileLoginFormOpen(!mobileLoginFormOpen)}
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
                    className={`transition-transform ${mobileLoginFormOpen ? 'rotate-180' : ''}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {mobileLoginFormOpen && (
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