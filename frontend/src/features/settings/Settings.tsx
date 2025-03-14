import Header from '@/components/header';
import Retention from './Retention';
import RetentionV2 from './RetentionV2';
import Users from './Users';

function Settings() {
  return (
    <div>
      <Header title="System Settings" />
      <section className="mb-6">
        <Header title="Users management" level="h2" />
        <div className="grid grid-cols-1 gap-4">
          <Users />
        </div>
      </section>

      <section className="mb-6">
        <Header title="Retention Settings" level="h2" />
        <div className="grid grid-cols-1 gap-4">
          <Retention />
        </div>
      </section>

      <section className="mb-6">
        <Header title="Retention Settings V2" level="h2" />
        <div className="grid grid-cols-1 gap-4">
          <RetentionV2 />
        </div>
      </section>

      <section className="mb-6">
        <Header title="Retention Settings V2" level="h2" />
        <div className="grid grid-cols-1 gap-4">
          <RetentionV2 />
        </div>
      </section>
    </div>
  );
}

export default Settings;
