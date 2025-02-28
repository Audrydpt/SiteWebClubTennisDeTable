import { EyeIcon, PencilIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { ReactNode } from 'react';

import { AcicPrivileges } from '../lib/props';

interface PermissionDetail {
  action: string;
  [AcicPrivileges.Operator]: string | ReactNode;
  [AcicPrivileges.Maintainer]: string | ReactNode;
  [AcicPrivileges.Administrator]: string | ReactNode;
  tooltip: string;
}

const permissionDetails: PermissionDetail[] = [
  {
    action: 'Operational Features',
    [AcicPrivileges.Operator]: <PencilIcon className="h-4 w-4 text-primary" />,
    [AcicPrivileges.Maintainer]: (
      <PencilIcon className="h-4 w-4 text-primary" />
    ),
    [AcicPrivileges.Administrator]: (
      <ShieldCheckIcon className="h-4 w-4 text-primary" />
    ),
    tooltip: 'Access to dashboards, alerts, and forensic searches',
  },
  {
    action: 'Dashboard Management',
    [AcicPrivileges.Operator]: <EyeIcon className="h-4 w-4 text-primary" />,
    [AcicPrivileges.Maintainer]: (
      <PencilIcon className="h-4 w-4 text-primary" />
    ),
    [AcicPrivileges.Administrator]: (
      <ShieldCheckIcon className="h-4 w-4 text-primary" />
    ),
    tooltip: 'Create, modify, and delete dashboard layouts and widgets',
  },
  {
    action: 'Alert Management',
    [AcicPrivileges.Operator]: <EyeIcon className="h-4 w-4 text-primary" />,
    [AcicPrivileges.Maintainer]: (
      <PencilIcon className="h-4 w-4 text-primary" />
    ),
    [AcicPrivileges.Administrator]: (
      <ShieldCheckIcon className="h-4 w-4 text-primary" />
    ),
    tooltip: 'Configure alert rules, thresholds, and notification settings',
  },
  {
    action: 'Camera Configuration',
    [AcicPrivileges.Operator]: <XIcon className="h-4 w-4 text-destructive" />,
    [AcicPrivileges.Maintainer]: (
      <PencilIcon className="h-4 w-4 text-primary" />
    ),
    [AcicPrivileges.Administrator]: (
      <ShieldCheckIcon className="h-4 w-4 text-primary" />
    ),
    tooltip:
      'Manage camera settings, streaming configurations, and recording parameters',
  },
  {
    action: 'User Management',
    [AcicPrivileges.Operator]: <XIcon className="h-4 w-4 text-destructive" />,
    [AcicPrivileges.Maintainer]: <XIcon className="h-4 w-4 text-destructive" />,
    [AcicPrivileges.Administrator]: (
      <ShieldCheckIcon className="h-4 w-4 text-primary" />
    ),
    tooltip: 'Create, modify, and delete user accounts and role assignments',
  },
  {
    action: 'System Settings',
    [AcicPrivileges.Operator]: <XIcon className="h-4 w-4 text-destructive" />,
    [AcicPrivileges.Maintainer]: <XIcon className="h-4 w-4 text-destructive" />,
    [AcicPrivileges.Administrator]: (
      <ShieldCheckIcon className="h-4 w-4 text-primary" />
    ),
    tooltip:
      'Configure system-wide settings, backup/restore, and system maintenance',
  },
];

export default permissionDetails;
