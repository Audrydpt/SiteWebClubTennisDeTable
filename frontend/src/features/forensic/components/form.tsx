import { Form } from '@/components/ui/form';

import { useForensicForm } from '../lib/provider/forensic-form-context';
import { ForensicFormValues } from '../lib/types';
import Params from './ui/params';
import Submit from './ui/submit';

interface ForensicFormProps {
  onSubmit: (data: ForensicFormValues) => Promise<void>;
  isSearching: boolean;
  stopSearch: () => Promise<void>;
  isCollapsed: boolean;
}

export default function ForensicForm({
  onSubmit,
  isSearching,
  stopSearch,
  isCollapsed,
}: ForensicFormProps) {
  const { formMethods } = useForensicForm();

  return (
    <Form {...formMethods}>
      <form
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="flex flex-col h-full relative"
      >
        <Params isCollapsed={isCollapsed} />
        <Submit isSearching={isSearching} onCancel={stopSearch} />
      </form>
    </Form>
  );
}
