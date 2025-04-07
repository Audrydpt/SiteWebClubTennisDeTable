import { useTranslation } from 'react-i18next';

import Header from '@/components/header';

import ForensicSettings from './components/forensic-settings';
import Retention from './components/retention';
import Users from './components/users';

function Settings() {
  const { t } = useTranslation();

  return (
    <div>
      <Header title={t('settings:headers.systemSettings')} />
      <section className="mb-6">
        <Header title={t('settings:headers.usersManagement')} level="h2" />
        <div className="grid grid-cols-1 gap-4">
          <Users />
        </div>
      </section>

      <section className="mb-6">
        <Header title={t('settings:headers.retentionSettings')} level="h2" />
        <div className="grid grid-cols-1 gap-4">
          <Retention />
        </div>
      </section>

      <section className="mb-6">
        <Header title={t('settings:headers.forensicSettings')} level="h2" />
        <div className="grid grid-cols-1 gap-4">
          <ForensicSettings />
        </div>
      </section>
    </div>
  );
}

export default Settings;
