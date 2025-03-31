import { zodResolver } from '@hookform/resolvers/zod';
import { InfoIcon } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.tsx';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip.tsx';

import { AcicPrivileges, User } from '../lib/props.tsx';
import privilegesDetails from './privileges-details.tsx';

const formSchema = z
  .object({
    user: z.string().min(3),
    password: z
      .string()
      .min(8)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^a-zA-Z0-9]/),
    privileges: z.enum(Object.values(AcicPrivileges) as [string, ...string[]]),
  })
  .refine(
    (data) => {
      if (data.privileges === 'Administrator') {
        return data.password.length >= 10;
      }
      return true;
    },
    {
      path: ['password'],
    }
  );

type UserSchema = z.infer<typeof formSchema>;

type FormUserProps = {
  user?: User;
  onSubmit: (data: User) => void;
  children: ReactNode;
  defaultValues?: User;
};

export default function FormCreateUser({
  onSubmit,
  children,
  defaultValues,
}: FormUserProps) {
  const [open, setOpen] = useState(false);
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as UserSchema,
  });

  const { t } = useTranslation();

  useEffect(() => {
    form.reset(defaultValues);
  }, [form, defaultValues]);

  const handleSubmit = (data: UserSchema) => {
    onSubmit({
      ...data,
      privileges: data.privileges as AcicPrivileges,
      superuser: data.privileges === AcicPrivileges.Administrator,
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('settings:createUser.title')}</DialogTitle>
          <DialogDescription>
            {t('settings:createUser.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="user"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('login.username')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('login.username')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('login.password')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('login.password')}
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="privileges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('login.privilege')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={t('settings:createUser.selectPrivilege')}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AcicPrivileges).map((privilege) => (
                        <SelectItem key={privilege} value={privilege}>
                          {t(`privileges.${privilege}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TooltipProvider>
              <Table className="hidden xl:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      {t('settings:privileges.functionality')}
                    </TableHead>
                    <TableHead>{t('privileges.Operator')}</TableHead>
                    <TableHead>{t('privileges.Maintainer')}</TableHead>
                    <TableHead>{t('privileges.Administrator')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {privilegesDetails().map((detail) => (
                    <TableRow key={detail.action}>
                      <TableCell className="font-medium">
                        {detail.action}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 ml-1 inline-block text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{detail.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {detail.Operator}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {detail.Maintainer}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          {detail.Administrator}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">{t('close')}</Button>
              </DialogClose>
              <Button type="submit">{t('settings:createUser.submit')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
