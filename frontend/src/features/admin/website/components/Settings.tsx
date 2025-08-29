/* eslint-disable */
import type React from 'react';

import {
  Settings,
  UserPlus,
  Edit,
  Trash2,
  Search,
  Users,
  Phone,
  Mail,
  Eye,
  EyeOff,
  MoreVertical,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  ShoppingCart,
  Package,
  Euro,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Download,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  fetchUsers,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  fetchCommandes,
  updateCommande,
  deleteCommandeItem,
  updateCommandeItem,
  deleteCommande,
  createNewCommande,
  updateCommandeInfo,
} from '@/services/api';
import { exportCommandeToExcel } from '@/utils/excelExport';
import supabase from '@/lib/supabaseClient';
import { Commande, CommandeItem } from '@/services/type.ts';

type User = {
  id: string;
  supabase_uid: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  classement: string;
  role: 'joueur' | 'admin';
  dateInscription: string;
  indexListeForce: number;
};

export default function AdminSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [filteredCommandes, setFilteredCommandes] = useState<Commande[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [commandeSearchTerm, setCommandeSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<'nom' | 'classement'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [activeTab, setActiveTab] = useState('users');

  // États pour la gestion des commandes
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);
  const [showCommandeDialog, setShowCommandeDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<CommandeItem | null>(null);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [commandeToDelete, setCommandeToDelete] = useState<Commande | null>(null);
  const [showCreateCommandeDialog, setShowCreateCommandeDialog] = useState(false);
  const [showEditCommandeDialog, setShowEditCommandeDialog] = useState(false);
  const [editingCommande, setEditingCommande] = useState<Commande | null>(null);

  // États pour le formulaire de création/modification de commande
  const [commandeForm, setCommandeForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    dateFin: '',
  });

  const formatDateFR = (dateString?: string) => {
    if (!dateString) return 'Date à venir';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
  };

  // Form states
  const [newUser, setNewUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: 'cttframeries',
    telephone: '',
    classement: '',
    role: 'joueur',
    dateInscription: new Date().toISOString(),
    indexListeForce: 0,
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User & { role?: string; dateInscription?: string; indexListeForce?: number }>>({});

  // Fetch users from API
  const fetchUsersFromApi = async () => {
    setIsLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      alert('Erreur lors du chargement des utilisateurs.');
    }
    setIsLoading(false);
  };

  // Fetch commandes from API
  const fetchCommandesFromApi = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCommandes();
      setCommandes(data);
    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      alert('Erreur lors du chargement des commandes.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsersFromApi();
    fetchCommandesFromApi();
  }, []);

  // Fonction utilitaire pour comparer les classements
  function compareClassement(a: string, b: string) {
    // Ordre des lettres
    const letterOrder = ['A', 'B', 'C', 'D', 'E'];
    const getParts = (val: string) => {
      const match = val.match(/^([A-E])(\d)$/i);
      if (!match) return [100, 100]; // Place à la fin si format inconnu
      const letterIdx = letterOrder.indexOf(match[1].toUpperCase());
      const num = parseInt(match[2], 10);
      return [letterIdx, num];
    };
    const [aLetter, aNum] = getParts(a);
    const [bLetter, bNum] = getParts(b);

    if (aLetter !== bLetter) return aLetter - bLetter;
    return aNum - bNum;
  }

  // Filter and sort users
  useEffect(() => {
    // Utilise une copie pour éviter la mutation du tableau original
    let filtered = [...users];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.nom.toLowerCase().includes(term) ||
          user.prenom.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term)
      );
    }

    // Tri sur la copie filtrée
    filtered.sort((a, b) => {
      if (sortBy === 'classement') {
        const comparison = compareClassement(
          a.classement ?? '',
          b.classement ?? ''
        );
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      const aValue = a[sortBy] ?? '';
      const bValue = b[sortBy] ?? '';
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'fr', {
          sensitivity: 'base',
        });
        return sortOrder === 'asc' ? comparison : -comparison;
      }
      return 0;
    });

    setFilteredUsers(filtered);
  }, [users, searchTerm, sortBy, sortOrder]);

  // Filter commandes
  useEffect(() => {
    let filtered = [...commandes];

    if (commandeSearchTerm.trim()) {
      const term = commandeSearchTerm.toLowerCase();
      filtered = filtered.filter((commande) =>
        commande.name.toLowerCase().includes(term) ||
        commande.members.some(member =>
          users.find(user => user.id === member.memberId)?.nom.toLowerCase().includes(term) ||
          users.find(user => user.id === member.memberId)?.prenom.toLowerCase().includes(term)
        )
      );
    }

    setFilteredCommandes(filtered);
  }, [commandes, commandeSearchTerm, users]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true,
      });

      if (error || !data?.user?.id) {
        throw new Error(
          error?.message || 'Erreur lors de la création du compte'
        );
      }

      const supabase_uid = data.user.id;
      const profil = {
        id: uuidv4(),
        supabase_uid,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        telephone: newUser.telephone,
        classement: newUser.classement,
        role: newUser.role || 'joueur',
        dateInscription: new Date().toISOString(),
        indexListeForce: newUser.classement ? (newUser.indexListeForce || 0) : 0,
      };

      await createUserProfile(profil);
      const allUsers = await fetchUsers();
      setUsers(allUsers);
      setNewUser({
        nom: '',
        prenom: '',
        email: '',
        password: 'cttframeries',
        telephone: '',
        classement: '',
        role: 'joueur',
        dateInscription: new Date().toISOString(),
        indexListeForce: 0,
      });
      setShowCreateDialog(false);
    } catch (err: any) {
      alert(`Erreur : ${err.message}`);
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsLoading(true);
    try {
      const updated = {
        ...editingUser,
        ...editForm,
        indexListeForce: editForm.classement ? (editForm.indexListeForce || 0) : 0,
      };
      await updateUserProfile(editingUser.id, updated);
      const updatedUsers = await fetchUsers();
      setUsers(updatedUsers);
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification de l'utilisateur");
    }
    setIsLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsLoading(true);
    try {
      // 1. Supprimer dans Supabase (auth)
      const { error: supabaseError } = await supabase.auth.admin.deleteUser(
        userToDelete.supabase_uid
      );
      if (supabaseError) {
        throw new Error(`Erreur Supabase : ${supabaseError.message}`);
      }
      // 2. Supprimer dans JSON Server
      await deleteUserProfile(userToDelete.id);

      // 3. Rechargement de la liste
      const updated = await fetchUsers();
      setUsers(updated);
    } catch (err) {
      console.error(err);
      alert(`Erreur lors de la suppression : ${(err as Error).message}`);
    }
    setUserToDelete(null);
    setIsLoading(false);
  };

  const getClassementColor = (classement: string) => {
    if (classement.startsWith('A')) return 'bg-green-100 text-green-800';
    if (classement.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (classement.startsWith('C')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Gestion des commandes
  const getUserById = (userId: string) => {
    return users.find(user => user.id === userId);
  };

  const handleToggleCommandeStatus = async (commande: Commande) => {
    try {
      const newStatus = commande.statut === 'open' ? 'closed' : 'open';
      await updateCommande(commande.id, { ...commande, statut: newStatus });
      await fetchCommandesFromApi();
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      alert('Erreur lors de la modification du statut de la commande');
    }
  };

  const handleDeleteItem = async (commande: Commande, itemId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) {
      return;
    }

    try {
      await deleteCommandeItem(itemId);
      await fetchCommandesFromApi();
      // Mettre à jour la commande sélectionnée
      const updatedCommandes = await fetchCommandes();
      const updatedCommande = updatedCommandes.find(c => c.id === commande.id);
      setSelectedCommande(updatedCommande || null);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de l\'article');
    }
  };

  const handleEditItem = async (updatedItem: CommandeItem) => {
    try {
      await updateCommandeItem(updatedItem.id, {
        name: updatedItem.name,
        price: updatedItem.price,
        quantity: updatedItem.quantity,
        epaisseur: updatedItem.epaisseur,
        fournisseur: updatedItem.fournisseur,
        type: updatedItem.type,
        description: updatedItem.description,
      });
      await fetchCommandesFromApi();
      // Mettre à jour la commande sélectionnée
      const updatedCommandes = await fetchCommandes();
      const updatedCommande = updatedCommandes.find(c => c.id === selectedCommande?.id);
      setSelectedCommande(updatedCommande || null);
      setShowEditItemDialog(false);
      setEditingItem(null);
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification de l\'article');
    }
  };

  const handleDeleteCommande = async () => {
    if (!commandeToDelete) return;

    try {
      await deleteCommande(commandeToDelete.id);
      await fetchCommandesFromApi();
      setCommandeToDelete(null);
      alert('Commande supprimée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression de la commande');
    }
  };

  const handleExportToExcel = () => {
    if (selectedCommande) {
      exportCommandeToExcel(selectedCommande, users);
    }
  };

  const handleCreateCommande = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await createNewCommande(commandeForm);
      await fetchCommandesFromApi();
      setCommandeForm({
        name: '',
        date: new Date().toISOString().split('T')[0],
        dateFin: '',
      });
      setShowCreateCommandeDialog(false);
      alert('Commande créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de la commande');
    }
    setIsLoading(false);
  };

  const handleEditCommandeInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCommande) return;

    setIsLoading(true);
    try {
      await updateCommandeInfo(editingCommande.id, commandeForm);
      await fetchCommandesFromApi();
      setShowEditCommandeDialog(false);
      setEditingCommande(null);
      alert('Commande modifiée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      alert('Erreur lors de la modification de la commande');
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 md:h-8 md:w-8" />
            Gestion des utilisateurs et commandes
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Gérez les utilisateurs et leurs commandes.
          </p>
        </div>

        {activeTab === 'users' && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="default"
            className="w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Ajouter un utilisateur</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        )}

        {activeTab === 'commandes' && (
          <Button
            onClick={() => setShowCreateCommandeDialog(true)}
            size="default"
            className="w-full sm:w-auto"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Créer une commande</span>
            <span className="sm:hidden">Créer</span>
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Utilisateurs ({users.length})
          </TabsTrigger>
          <TabsTrigger value="commandes" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Commandes ({commandes.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher par nom, prénom ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                    <Select
                      value={sortBy}
                      onValueChange={(value) =>
                        setSortBy(value as 'nom' | 'classement')
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[140px]">
                        <SelectValue placeholder="Trier par" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nom">Nom</SelectItem>
                        <SelectItem value="classement">Classement</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 flex-1">
                    {sortOrder === 'asc' ? (
                      <SortAsc className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <SortDesc className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Select
                      value={sortOrder}
                      onValueChange={(value) =>
                        setSortOrder(value as 'asc' | 'desc')
                      }
                    >
                      <SelectTrigger className="w-full sm:w-[130px]">
                        <SelectValue placeholder="Ordre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Croissant</SelectItem>
                        <SelectItem value="desc">Décroissant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {filteredUsers.map((user, index) => (
                    <div
                      key={user.id}
                      className={`p-4 hover:bg-muted/50 transition-colors ${index === 0 ? 'rounded-t-lg' : ''} ${index === filteredUsers.length - 1 ? 'rounded-b-lg' : ''}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* User Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                            <AvatarFallback className="text-sm md:text-base">
                              {(user.prenom?.[0] ?? '') + (user.nom?.[0] ?? '')}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                              <h3 className="font-semibold text-sm md:text-base truncate">
                                {user.prenom} {user.nom}
                              </h3>
                              <div className="flex gap-2 flex-wrap">
                                {user.classement && (
                                  <Badge
                                    className={`${getClassementColor(user.classement)} text-xs flex-shrink-0`}
                                  >
                                    {user.classement}
                                  </Badge>
                                )}
                                {user.classement && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs flex-shrink-0 bg-blue-50 text-blue-700 border-blue-200"
                                  >
                                    Index: {user.indexListeForce > 0 ? user.indexListeForce : 'N/A'}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1 mt-1">
                              <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                <Mail className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{user.email}</span>
                              </div>
                              {user.telephone && (
                                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3 flex-shrink-0" />
                                  <span>{user.telephone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {/* Desktop Actions */}
                          <div className="hidden sm:flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingUser(user);
                                setEditForm(user);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setUserToDelete(user)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Supprimer
                            </Button>
                          </div>

                          {/* Mobile Actions */}
                          <div className="sm:hidden">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingUser(user);
                                    setEditForm(user);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setUserToDelete(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      Aucun utilisateur trouvé.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* CREATE DIALOG */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="sm:max-w-[425px] mx-4">
              <DialogHeader>
                <DialogTitle>Créer un utilisateur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={newUser.nom}
                      onChange={(e) =>
                        setNewUser({ ...newUser, nom: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={newUser.prenom}
                      onChange={(e) =>
                        setNewUser({ ...newUser, prenom: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser({ ...newUser, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Mot de passe</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={newUser.password}
                      onChange={(e) =>
                        setNewUser({ ...newUser, password: e.target.value })
                      }
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={newUser.telephone}
                      onChange={(e) =>
                        setNewUser({ ...newUser, telephone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Classement</Label>
                    <Input
                      value={newUser.classement}
                      onChange={(e) =>
                        setNewUser({ ...newUser, classement: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Index Liste Force</Label>
                    <Input
                      type="number"
                      min="0"
                      value={newUser.indexListeForce}
                      onChange={(e) =>
                        setNewUser({ ...newUser, indexListeForce: parseInt(e.target.value) || 0 })
                      }
                      disabled={!newUser.classement}
                      placeholder={!newUser.classement ? "Sélectionnez d'abord un classement" : "0"}
                    />
                    {!newUser.classement && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Un classement est requis pour définir un index
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Rôle</Label>
                    <Select
                      value={newUser.role}
                      onValueChange={(value) =>
                        setNewUser({ ...newUser, role: value as 'joueur' | 'admin' })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="joueur">Joueur</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date d'inscription</Label>
                    <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                      <span>Date d'inscription : {formatDateFR(newUser.dateInscription)}</span>
                    </div>
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateDialog(false)}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? 'Création...' : 'Créer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* EDIT DIALOG */}
          <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
            <DialogContent className="sm:max-w-[425px] mx-4">
              <DialogHeader>
                <DialogTitle>Modifier l'utilisateur</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleEditUser} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nom</Label>
                    <Input
                      value={editForm.nom || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, nom: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Prénom</Label>
                    <Input
                      value={editForm.prenom || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, prenom: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editForm.email || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, email: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Téléphone</Label>
                    <Input
                      value={editForm.telephone || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, telephone: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Classement</Label>
                    <Input
                      value={editForm.classement || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, classement: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Index Liste Force</Label>
                    <Input
                      type="number"
                      min="0"
                      value={editForm.indexListeForce || 0}
                      onChange={(e) =>
                        setEditForm({ ...editForm, indexListeForce: parseInt(e.target.value) || 0 })
                      }
                      disabled={!editForm.classement}
                      placeholder={!editForm.classement ? "Sélectionnez d'abord un classement" : "0"}
                    />
                    {!editForm.classement && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Un classement est requis pour définir un index
                      </p>
                    )}
                  </div>
                  <div>
                    <Label>Rôle</Label>
                    <Select
                      value={editForm.role || 'joueur'}
                      onValueChange={(value) =>
                        setEditForm({ ...editForm, role: value as 'joueur' | 'admin' })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="joueur">Joueur</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Date d'inscription</Label>
                    <Input
                      type="date"
                      value={editForm.dateInscription ? editForm.dateInscription.slice(0, 10) : ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, dateInscription: new Date(e.target.value).toISOString() })
                      }
                    />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingUser(null)}
                    className="w-full sm:w-auto"
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto"
                  >
                    {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* DELETE CONFIRM */}
          <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
            <DialogContent className="mx-4">
              <DialogHeader>
                <DialogTitle>Supprimer l'utilisateur</DialogTitle>
              </DialogHeader>
              <p>
                Voulez-vous vraiment supprimer {userToDelete?.prenom}{' '}
                {userToDelete?.nom} ?
              </p>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setUserToDelete(null)}
                  className="w-full sm:w-auto"
                >
                  Annuler
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteUser}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? 'Suppression...' : 'Supprimer'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Commandes Tab */}
        <TabsContent value="commandes" className="space-y-6">
          {/* Search */}
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom de commande ou utilisateur..."
                  value={commandeSearchTerm}
                  onChange={(e) => setCommandeSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Commandes List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredCommandes.map((commande) => (
                <Card key={commande.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <ShoppingCart className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{commande.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {commande.date}
                            {commande.dateFin && ` - ${formatDateFR(commande.dateFin)}`}
                            • {commande.members.length} participant(s)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={commande.statut === 'open' ? 'default' : 'secondary'}>
                          {commande.statut === 'open' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ouverte
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Fermée
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline" className="font-mono">
                          {parseFloat(commande.total).toFixed(2)}€
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Statistiques rapides */}
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium">{commande.members.length}</p>
                        <p className="text-xs text-muted-foreground">Participants</p>
                      </div>
                      <div className="text-center">
                        <Package className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {commande.members.reduce((total, member) => total + member.items.length, 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Articles</p>
                      </div>
                      <div className="text-center">
                        <Euro className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                        <p className="text-sm font-medium">{parseFloat(commande.total).toFixed(2)}€</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCommande(commande);
                          setShowCommandeDialog(true);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCommande(commande);
                          setCommandeForm({
                            name: commande.name,
                            date: commande.date,
                            dateFin: commande.dateFin || '',
                          });
                          setShowEditCommandeDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        variant={commande.statut === 'open' ? 'destructive' : 'default'}
                        size="sm"
                        onClick={() => handleToggleCommandeStatus(commande)}
                      >
                        {commande.statut === 'open' ? (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Fermer
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Rouvrir
                          </>
                        )}
                      </Button>
                      {commande.statut === 'closed' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setCommandeToDelete(commande)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredCommandes.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucune commande trouvée.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Commande Details Dialog */}
      <Dialog open={showCommandeDialog} onOpenChange={setShowCommandeDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Détails de la commande - {selectedCommande?.name}
            </DialogTitle>
          </DialogHeader>

          {selectedCommande && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{selectedCommande.date}</p>
                </div>
                <div className="text-center">
                  <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Participants</p>
                  <p className="font-medium">{selectedCommande.members.length}</p>
                </div>
                <div className="text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Articles</p>
                  <p className="font-medium">
                    {selectedCommande.members.reduce((total, member) => total + member.items.length, 0)}
                  </p>
                </div>
                <div className="text-center">
                  <Euro className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-medium">{parseFloat(selectedCommande.total).toFixed(2)}€</p>
                </div>
              </div>

              {/* Articles par membre */}
              <div className="space-y-4">
                {selectedCommande.members.map((member) => {
                  const user = getUserById(member.memberId);
                  return (
                    <Card key={member.memberId}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-sm">
                                {user ? (user.prenom?.[0] ?? '') + (user.nom?.[0] ?? '') : '??'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium">
                                {user ? `${user.prenom} ${user.nom}` : 'Utilisateur inconnu'}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {member.items.length} article(s)
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="font-mono">
                            {parseFloat(member.subtotal).toFixed(2)}€
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {member.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                              <div className="flex-1">
                                <p className="font-medium">{item.name}</p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{item.fournisseur}</span>
                                  <span>•</span>
                                  <span>{item.category}</span>
                                  <span>•</span>
                                  <span>Qté: {item.quantity}</span>
                                  {item.epaisseur && (
                                    <>
                                      <span>•</span>
                                      <span>{item.epaisseur}</span>
                                    </>
                                  )}
                                  {item.type && (
                                    <>
                                      <span>•</span>
                                      <span>{item.type}</span>
                                    </>
                                  )}
                                  {item.description && (
                                    <>
                                      <span>•</span>
                                      <span>{item.description}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2)}€
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(item);
                                    setShowEditItemDialog(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteItem(selectedCommande, item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={handleExportToExcel}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exporter Excel
            </Button>
            <Button variant="outline" onClick={() => setShowCommandeDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Commande Confirm Dialog */}
      <Dialog open={!!commandeToDelete} onOpenChange={() => setCommandeToDelete(null)}>
        <DialogContent className="mx-4">
          <DialogHeader>
            <DialogTitle>Supprimer la commande</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Voulez-vous vraiment supprimer la commande "{commandeToDelete?.name}" ?
            </p>
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                ⚠️ Cette action est irréversible. Tous les articles et données associés seront définitivement supprimés.
              </p>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setCommandeToDelete(null)}
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteCommande}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Suppression...' : 'Supprimer définitivement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItemDialog} onOpenChange={setShowEditItemDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'article</DialogTitle>
          </DialogHeader>

          {editingItem && (
            <form onSubmit={(e) => {
              e.preventDefault();
              handleEditItem(editingItem);
            }} className="space-y-4">
              <div>
                <Label>Nom</Label>
                <Input
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prix (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingItem.price}
                    onChange={(e) => setEditingItem({...editingItem, price: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label>Quantité</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingItem.quantity}
                    onChange={(e) => setEditingItem({...editingItem, quantity: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Fournisseur</Label>
                <Input
                  value={editingItem.fournisseur || ''}
                  onChange={(e) => setEditingItem({...editingItem, fournisseur: e.target.value})}
                />
              </div>

              {editingItem.category === 'mousse' && (
                <div>
                  <Label>Épaisseur</Label>
                  <Input
                    value={editingItem.epaisseur || ''}
                    onChange={(e) => setEditingItem({...editingItem, epaisseur: e.target.value})}
                  />
                </div>
              )}

              {editingItem.category === 'bois' && (
                <div>
                  <Label>Type de manche</Label>
                  <Input
                    value={editingItem.type || ''}
                    onChange={(e) => setEditingItem({...editingItem, type: e.target.value})}
                  />
                </div>
              )}

              {editingItem.category === 'autre' && (
                <div>
                  <Label>Description</Label>
                  <Input
                    value={editingItem.description || ''}
                    onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
                  />
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowEditItemDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit">
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Commande Dialog */}
      <Dialog open={showCreateCommandeDialog} onOpenChange={setShowCreateCommandeDialog}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle commande</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateCommande} className="space-y-4">
            <div>
              <Label>Nom de la commande</Label>
              <Input
                value={commandeForm.name}
                onChange={(e) => setCommandeForm({ ...commandeForm, name: e.target.value })}
                placeholder="Ex: Commande Groupée 2024"
                required
              />
            </div>
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={commandeForm.date}
                onChange={(e) => setCommandeForm({ ...commandeForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Date de fin (optionnelle)</Label>
              <Input
                type="date"
                value={commandeForm.dateFin}
                onChange={(e) => setCommandeForm({ ...commandeForm, dateFin: e.target.value })}
                placeholder="Date limite pour commander"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateCommandeDialog(false)}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Création...' : 'Créer la commande'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Commande Dialog */}
      <Dialog open={showEditCommandeDialog} onOpenChange={setShowEditCommandeDialog}>
        <DialogContent className="sm:max-w-[425px] mx-4">
          <DialogHeader>
            <DialogTitle>Modifier la commande</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditCommandeInfo} className="space-y-4">
            <div>
              <Label>Nom de la commande</Label>
              <Input
                value={commandeForm.name}
                onChange={(e) => setCommandeForm({ ...commandeForm, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Date de début</Label>
              <Input
                type="date"
                value={commandeForm.date}
                onChange={(e) => setCommandeForm({ ...commandeForm, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Date de fin</Label>
              <Input
                type="date"
                value={commandeForm.dateFin}
                onChange={(e) => setCommandeForm({ ...commandeForm, dateFin: e.target.value })}
                placeholder="Date limite pour commander"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditCommandeDialog(false)}
                className="w-full sm:w-auto"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Modification...' : 'Modifier la commande'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
