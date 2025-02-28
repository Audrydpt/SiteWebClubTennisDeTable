import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import DeleteConfirmation from '@/components/confirm-delete.tsx';
import Header from '@/components/header.tsx';
import LoadingSpinner from '@/components/loading.tsx';
import { Button } from '@/components/ui/button.tsx';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';

import { UserPrivileges } from '@/lib/authenticate.tsx';
import { useAuth } from '@/providers/auth-context.tsx';

import FormCreateUser from './components/form-create-user.tsx';
import FormUpdateUser from './components/form-update-user.tsx';
import useUsersAPI from './hooks/use-users.tsx';
import { User } from './lib/props.tsx';

function UserContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.privileges === UserPrivileges.Administrator;

  const { query, getAll, insert, edit, remove } = useUsersAPI();
  const { isLoading, isError } = query;
  const data = getAll();

  if (isError) return <div>Something went wrong</div>;
  if (isLoading || !data) return <LoadingSpinner />;

  const handleAdd = async (formData: User) => {
    await insert(formData);
  };

  const handleEdit = async (formData: User) => {
    await edit(formData);
  };

  const handleDelete = (formData: User) => {
    remove(formData);
  };

  return (
    <div className="w-full">
      <Header title="User Management" className="w-full">
        {isAdmin && (
          <FormCreateUser onSubmit={handleAdd}>
            <Button variant="default">
              <Plus /> {t('settings:addUser')}
            </Button>
          </FormCreateUser>
        )}
      </Header>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>User List</CardTitle>
          <CardDescription>View and manage user accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Privileges</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data).map(([username, userData]) => (
                <TableRow key={username}>
                  <TableCell>{userData.user}</TableCell>
                  <TableCell>{userData.privileges}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {isAdmin && (
                      <>
                        <FormUpdateUser
                          user={userData}
                          onSubmit={handleEdit}
                          defaultValues={{
                            user: userData.user,
                            password: userData.password,
                            privileges: userData.privileges,
                            superuser: userData.superuser,
                          }}
                        >
                          <Button
                            variant="secondary"
                            size="sm"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </FormUpdateUser>

                        <DeleteConfirmation
                          onDelete={() => handleDelete(userData)}
                          description={`This action is irreversible. ${userData.user} will be definitivly deleted.`}
                        >
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </DeleteConfirmation>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Users() {
  return <UserContent />;
}
