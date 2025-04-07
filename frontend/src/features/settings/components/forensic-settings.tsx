import IASettings from './ai-settings';
import VMSSettings from './vms-settings';

function ForensicSettings() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <VMSSettings />
      <IASettings />
    </div>
  );
}

export default ForensicSettings;
