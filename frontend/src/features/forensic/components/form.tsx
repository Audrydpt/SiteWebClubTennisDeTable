import { Form } from '@/components/ui/form';
import {
  ForensicFormValues,
  useForensicForm,
} from '@/features/forensic/lib/provider/forensic-form-context';
import Params from './ui/params';
import Submit from './ui/submit';

interface ForensicFormProps {
  onSubmit: (data: ForensicFormValues) => Promise<void>;
  isSearching: boolean;
  isInitializing: boolean;
  canStartSearch: boolean;
  closeWebSocket: () => Promise<void>;
  isCollapsed: boolean;
}

export default function ForensicForm({
  onSubmit,
  isSearching,
  isInitializing,
  closeWebSocket,
  isCollapsed,
  canStartSearch,
}: ForensicFormProps) {
  const { formMethods } = useForensicForm();

  return (
    <Form {...formMethods}>
      <form
        onSubmit={formMethods.handleSubmit(onSubmit)}
        className="flex flex-col h-full relative"
      >
        <Params isCollapsed={isCollapsed} />
        <Submit
          isSearching={isSearching}
          isInitializing={isInitializing}
          canStartSearch={canStartSearch}
          onCancel={closeWebSocket}
        />
      </form>
    </Form>
  );
}
