import Overview from './components/overview';
import System from './components/system';
import Firmware from './components/firmware';
import HealthCheck from './components/health-check';
import CreateRestoreBackup from './components/create-restore';
import Diagnostic from './components/diagnostic';
import Webmin from './components/webmin';

function Maintenance() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">System Maintenance</h1>
      <br />

      <section className="mb-6">
        <h1 className="text-xl font-semibold">System Overview</h1>
        <br />
        <div className="grid grid-cols-1 gap-4">
          <Overview />
        </div>
      </section>

      <section className="mb-6">
        <h1 className="text-xl font-semibold">System Management</h1>
        <br />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <System />
          <Webmin />
          <Diagnostic />
        </div>
      </section>

      <section className="mb-6">
        <h1 className="text-xl font-semibold">Maintenance Tasks</h1>
        <br />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Firmware />
          <CreateRestoreBackup />
        </div>
      </section>

      <section className="mt-6">
        <HealthCheck />
      </section>
    </div>
  );
}

export default Maintenance;
