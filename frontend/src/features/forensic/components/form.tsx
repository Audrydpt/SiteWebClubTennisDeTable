import { Form } from '@/components/ui/form';

import { ForensicFormValues } from '../lib/types';
import { useForensicForm } from '../providers/forensic-form-context.tsx';
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
