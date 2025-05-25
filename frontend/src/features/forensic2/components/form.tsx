import { Form } from '@/components/ui/form';

import { useForensicForm } from '@/features/forensic/lib/provider/forensic-form-context';
import { ForensicFormValues } from '@/features/forensic/lib/types';

import Params from './ui/params';
import Submit from './ui/submit';

interface ForensicFormProps {
  onSubmit: (data: ForensicFormValues) => void;
}

export default function ForensicForm({ onSubmit }: ForensicFormProps) {
  const { formMethods } = useForensicForm();

  return (
    <Form {...formMethods}>
      <form
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="flex flex-col h-full relative"
      >
        <Params />
        <Submit />
      </form>
    </Form>
  );
}
