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
  progress: number | null;
  closeWebSocket: () => Promise<void>;
  isCollapsed: boolean;
}

export default function ForensicForm({
  onSubmit,
  isSearching,
  progress,
  closeWebSocket,
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
        <Submit
          isSearching={isSearching}
          progress={progress}
          onCancel={closeWebSocket}
        />
      </form>
    </Form>
  );
}
