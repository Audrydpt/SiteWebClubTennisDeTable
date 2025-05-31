import { EyeIcon, PencilIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AcicPrivileges } from '../lib/props';

interface PermissionDetail {
  action: string;
  [AcicPrivileges.Operator]: string | ReactNode;
  [AcicPrivileges.Maintainer]: string | ReactNode;
  [AcicPrivileges.Administrator]: string | ReactNode;
  tooltip: string;
}

const usePermissionDetails = (): PermissionDetail[] => {
  const { t } = useTranslation();

  return [
    {
      action: t('settings:privileges.actions.operationalFeatures'),
      [AcicPrivileges.Operator]: (
        <PencilIcon className="size-4 text-primary" />
      ),
      [AcicPrivileges.Maintainer]: (
        <PencilIcon className="size-4 text-primary" />
      ),
      [AcicPrivileges.Administrator]: (
        <ShieldCheckIcon className="size-4 text-primary" />
      ),
      tooltip: t('settings:privileges.tooltips.operationalFeatures'),
    },
    {
      action: t('settings:privileges.actions.dashboardManagement'),
      [AcicPrivileges.Operator]: <EyeIcon className="size-4 text-primary" />,
      [AcicPrivileges.Maintainer]: (
        <PencilIcon className="size-4 text-primary" />
      ),
      [AcicPrivileges.Administrator]: (
        <ShieldCheckIcon className="size-4 text-primary" />
      ),
      tooltip: t('settings:privileges.tooltips.dashboardManagement'),
    },
    {
      action: t('settings:privileges.actions.alertManagement'),
      [AcicPrivileges.Operator]: <EyeIcon className="size-4 text-primary" />,
      [AcicPrivileges.Maintainer]: (
        <PencilIcon className="size-4 text-primary" />
      ),
      [AcicPrivileges.Administrator]: (
        <ShieldCheckIcon className="size-4 text-primary" />
      ),
      tooltip: t('settings:privileges.tooltips.alertManagement'),
    },
    {
      action: t('settings:privileges.actions.cameraConfiguration'),
      [AcicPrivileges.Operator]: <XIcon className="size-4 text-destructive" />,
      [AcicPrivileges.Maintainer]: (
        <PencilIcon className="size-4 text-primary" />
      ),
      [AcicPrivileges.Administrator]: (
        <ShieldCheckIcon className="size-4 text-primary" />
      ),
      tooltip: t('settings:privileges.tooltips.cameraConfiguration'),
    },
    {
      action: t('settings:privileges.actions.userManagement'),
      [AcicPrivileges.Operator]: <XIcon className="size-4 text-destructive" />,
      [AcicPrivileges.Maintainer]: (
        <XIcon className="size-4 text-destructive" />
      ),
      [AcicPrivileges.Administrator]: (
        <ShieldCheckIcon className="size-4 text-primary" />
      ),
      tooltip: t('settings:privileges.tooltips.userManagement'),
    },
    {
      action: t('settings:privileges.actions.systemSettings'),
      [AcicPrivileges.Operator]: <XIcon className="size-4 text-destructive" />,
      [AcicPrivileges.Maintainer]: (
        <XIcon className="size-4 text-destructive" />
      ),
      [AcicPrivileges.Administrator]: (
        <ShieldCheckIcon className="size-4 text-primary" />
      ),
      tooltip: t('settings:privileges.tooltips.systemSettings'),
    },
  ];
};

export default usePermissionDetails;
