import { useTranslation } from 'react-i18next';

import Header from '@/components/header';

import Retention from './Retention';
import Users from './Users';

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
    </div>
  );
}

export default Settings;
