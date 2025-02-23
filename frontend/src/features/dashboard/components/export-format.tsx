import { ExportStep } from '../lib/export';

export default function ExportStepFormat({ storedWidget }: ExportStep) {
  return <div>{JSON.stringify(storedWidget)}</div>;
}
