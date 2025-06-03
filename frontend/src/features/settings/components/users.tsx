import { Pencil, Plus, Trash2, Users2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import DeleteConfirmation from '@/components/confirm-delete.tsx';
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

import useUsersAPI from '../hooks/use-users.tsx';
import { User } from '../lib/props.tsx';
import FormCreateUser from './form-create-user.tsx';
import FormUpdateUser from './form-update-user.tsx';

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
      <Card className="w-full">
        <CardHeader className="w-full flex flex-row items-start justify-between">
          <div className="flex flex-col">
            <CardTitle className="flex items-center">
              <Users2 className="mr-2" size={20} />
              {t('settings:userList')}
            </CardTitle>
            <CardDescription>
              {t('settings:userListDescription')}
            </CardDescription>
          </div>
          {isAdmin && (
            <FormCreateUser onSubmit={handleAdd}>
              <Button variant="default">
                <Plus className="mr-2" /> {t('settings:addUser')}
              </Button>
            </FormCreateUser>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('settings:username')}</TableHead>
                <TableHead>{t('login.privilege')}</TableHead>
                <TableHead className="w-[100px]">
                  {t('settings:actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(data).map(([username, userData]) => (
                <TableRow key={username}>
                  <TableCell>{userData.user}</TableCell>
                  <TableCell>
                    {t(`privileges.${userData.privileges}`)}
                  </TableCell>
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
                            <Pencil className="size-4" />
                          </Button>
                        </FormUpdateUser>

                        <DeleteConfirmation
                          onDelete={() => handleDelete(userData)}
                          description={t('settings:deleteUserDescription', {
                            username: userData.user,
                          })}
                        >
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label="Delete"
                          >
                            <Trash2 className="size-4" />
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
