export enum AcicPrivileges {
  Operator = 'Operator',
  Maintainer = 'Maintainer',
  Administrator = 'Administrator',
}

export interface User {
  user: string;
  password?: string;
  privileges: AcicPrivileges;
  superuser: boolean;
}
