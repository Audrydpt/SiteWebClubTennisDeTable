import { CheckIcon, XIcon } from 'lucide-react';

const permissionDetails = [
  {
    action: 'Reports management',
    basic: 'Read only',
    advanced: 'Read & write',
    admin: 'Total control',
    tooltip: 'Includes the ability to Create, Modify & Delete reports',
  },
  {
    action: 'Users management',
    basic: <XIcon className="h-4 w-4 text-red-500" />,
    advanced: <XIcon className="h-4 w-4 text-red-500" />,
    admin: <CheckIcon className="h-4 w-4 text-green-500" />,
    tooltip: 'Create, Modify & Delete users accounts',
  },
  {
    action: 'System configuration',
    basic: <XIcon className="h-4 w-4 text-red-500" />,
    advanced: 'Read only',
    admin: 'Total control',
    tooltip: 'Configuration & Maintenance of the system',
  },
];

export default permissionDetails;
