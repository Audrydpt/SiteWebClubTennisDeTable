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
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Card, CardContent } from '@/components/ui/card';
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
import {
  fetchUsers,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from '@/services/api';
import supabase from '@/lib/supabaseClient';

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
};

export default function AdminSettings() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [sortBy, setSortBy] = useState<'nom' | 'classement'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User & { role?: string; dateInscription?: string }>>({});

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

  useEffect(() => {
    fetchUsersFromApi();
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
      };

      await createUserProfile(profil);
      const allUsers = await fetchUsers();
      setUsers(allUsers);
      setNewUser({
        nom: '',
        prenom: '',
        email: '',
        password: '',
        telephone: '',
        classement: '',
        role: 'joueur',
        dateInscription: new Date().toISOString(),
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

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Settings className="h-6 w-6 md:h-8 md:w-8" />
            Gestion des utilisateurs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Créez, modifiez et gérez les utilisateurs.
          </p>
          <div className="flex items-center gap-2 mt-3 p-3 bg-muted/50 rounded-lg w-fit">
            <Users className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">
                Total Utilisateurs
              </p>
              <p className="text-lg md:text-xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>

        <Button
          onClick={() => setShowCreateDialog(true)}
          size="default"
          className="w-full sm:w-auto"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Ajouter un utilisateur</span>
          <span className="sm:hidden">Ajouter</span>
        </Button>
      </div>

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
                          {user.classement && (
                            <Badge
                              className={`${getClassementColor(user.classement)} text-xs flex-shrink-0`}
                            >
                              {user.classement}
                            </Badge>
                          )}
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
                  <span>Date d'inscription : {formatDateFR(newUser.dateInscription)}</span>
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
    </div>
  );
}
