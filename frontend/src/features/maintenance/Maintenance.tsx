import Header from '@/components/header';

import CreateRestoreBackup from './components/create-restore';
import Diagnostic from './components/diagnostic';
import Firmware from './components/firmware';
import HealthCheck from './components/health-check';
import Overview from './components/overview';
import System from './components/system';
import Webmin from './components/webmin';

function Maintenance() {
  return (
    <div>
      <Header title="System Maintenance" />

      <section className="mb-6">
        <Header title="System Overview" level="h2" />
        <div className="grid grid-cols-1 gap-4">
          <Overview />
        </div>
      </section>

      <section className="mb-6">
        <Header title="System Management" level="h2" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <System />
          <Webmin />
          <Diagnostic />
        </div>
      </section>

      <section className="mb-6">
        <Header title="Maintenance Tasks" level="h2" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Firmware />
          <CreateRestoreBackup />
        </div>
      </section>

      <section className="mb-6">
        <HealthCheck />
      </section>
    </div>
  );
}

export default Maintenance;
