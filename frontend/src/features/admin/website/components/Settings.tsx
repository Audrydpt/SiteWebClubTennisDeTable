/* eslint-disable @typescript-eslint/no-explicit-any,no-console,no-alert */
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  fetchUsers,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
} from '@/services/api';
import supabase from '@/lib/supabaseClient.ts';

type User = {
  id: string;
  supabase_uid: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  classement: string;
};

function SettingsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    telephone: '',
    classement: '',
  });

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsersFromApi = async () => {
    setIsLoading(true);
    const data = await fetchUsers();
    setUsers(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsersFromApi();
  }, []);

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

      // eslint-disable-next-line @typescript-eslint/naming-convention
      const supabase_uid = data.user.id;

      const profil = {
        id: uuidv4(),
        supabase_uid,
        nom: newUser.nom,
        prenom: newUser.prenom,
        email: newUser.email,
        telephone: newUser.telephone,
        classement: newUser.classement,
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h1>

      <Button onClick={() => setShowCreateDialog(true)}>
        Ajouter un utilisateur
      </Button>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map((user) => (
          <div key={user.id} className="border rounded-lg p-4 shadow">
            <p className="font-semibold">
              {user.nom} {user.prenom}
            </p>
            <p>Email : {user.email}</p>
            <p>Téléphone : {user.telephone}</p>
            <p>Classement : {user.classement}</p>
            <div className="mt-2 flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setEditingUser(user);
                  setEditForm(user);
                }}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setUserToDelete(user)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
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
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) =>
                  setNewUser({ ...newUser, password: e.target.value })
                }
                required
              />
            </div>
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

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Création...' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditUser} className="space-y-4">
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
            <div>
              <Label>Email</Label>
              <Input
                value={editForm.email || ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
              />
            </div>
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

            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM */}
      <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l&#39;utilisateur</DialogTitle>
          </DialogHeader>
          <p>
            Voulez-vous vraiment supprimer {userToDelete?.prenom}{' '}
            {userToDelete?.nom} ?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={isLoading}
            >
              {isLoading ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SettingsPage;
