import { zodResolver } from '@hookform/resolvers/zod';
import { InfoIcon } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
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
    user: z.string().min(3, 'User name must be at least 3 characters long'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(
        /[^a-zA-Z0-9]/,
        'Password must contain at least one special character'
      ),
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
      message: 'Password must be at least 10 characters long for Administrator',
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new user</DialogTitle>
          <DialogDescription>
            Fill in the form below & choose a privilege to create a new user
            account.
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
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Username" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input placeholder="Password" type="password" {...field} />
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
                  <FormLabel>Privileges</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a privilege" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(AcicPrivileges).map((privilege) => (
                        <SelectItem key={privilege} value={privilege}>
                          {privilege}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Functionality</TableHead>
                    <TableHead>Basic</TableHead>
                    <TableHead>Advanced</TableHead>
                    <TableHead>Admin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {privilegesDetails.map((detail) => (
                    <TableRow key={detail.action}>
                      <TableCell className="font-medium">
                        {detail.action}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 ml-1 inline-block text-gray-400" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{detail.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{detail.basic}</TableCell>
                      <TableCell>{detail.advanced}</TableCell>
                      <TableCell>{detail.admin}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TooltipProvider>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
              <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
