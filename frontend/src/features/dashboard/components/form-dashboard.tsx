import { zodResolver } from '@hookform/resolvers/zod';
import { ReactNode, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  title: z.string(),
});

export type DashboardSchema = z.infer<typeof formSchema>;
export type StoredDashboard = DashboardSchema & {
  id?: string;
  order?: number;
};

type FormWidgetProps = {
  onSubmit: (data: DashboardSchema) => void;
  children: ReactNode;
  edition?: boolean;
  defaultValues?: DashboardSchema;
};

export function FormDashboard({
  onSubmit,
  children,
  edition = false,
  defaultValues,
}: FormWidgetProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<DashboardSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...defaultValues,
    },
  });

  const handleSubmit = (d: DashboardSchema) => {
    onSubmit(d);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {edition ? 'Edit a dashboard' : 'Add a dashboard'}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-row gap-6">
          <div className="flex-1">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-2"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <Input {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter className="p-2">
                  <DialogClose asChild>
                    <Button variant="outline">Close</Button>
                  </DialogClose>
                  <Button type="submit">Submit</Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
