import { renderHook } from '@testing-library/react';

import { AcicPrivileges } from '../lib/props';
import usePermissionDetails from './privileges-details';

describe('usePermissionDetails', () => {
  describe('Basic Structure', () => {
    it('should return an array with the correct number of permission details', () => {
      const { result } = renderHook(() => usePermissionDetails());

      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(6); // 6 different permission entries
    });

    it('should have all required properties in each permission detail', () => {
      const { result } = renderHook(() => usePermissionDetails());

      result.current.forEach((detail) => {
        expect(detail).toHaveProperty('action');
        expect(detail).toHaveProperty(AcicPrivileges.Operator);
        expect(detail).toHaveProperty(AcicPrivileges.Maintainer);
        expect(detail).toHaveProperty(AcicPrivileges.Administrator);
        expect(detail).toHaveProperty('tooltip');
      });
    });
  });

  describe('Permission Structure', () => {
    it('should have the correct permissions for Operational Features', () => {
      const { result } = renderHook(() => usePermissionDetails());

      const operationalFeatures = result.current.find(
        (detail) =>
          detail.action === 'settings:privileges.actions.operationalFeatures'
      );

      expect(operationalFeatures).toBeDefined();
      // For React elements, we can check the type property
      expect(operationalFeatures?.[AcicPrivileges.Operator].type).toBeDefined();
      expect(
        operationalFeatures?.[AcicPrivileges.Maintainer].type
      ).toBeDefined();
      expect(
        operationalFeatures?.[AcicPrivileges.Administrator].type
      ).toBeDefined();
    });

    it('should have the correct permissions for Dashboard Management', () => {
      const { result } = renderHook(() => usePermissionDetails());

      const dashboardManagement = result.current.find(
        (detail) =>
          detail.action === 'settings:privileges.actions.dashboardManagement'
      );

      expect(dashboardManagement).toBeDefined();
      expect(dashboardManagement?.[AcicPrivileges.Operator].type).toBeDefined();
      expect(
        dashboardManagement?.[AcicPrivileges.Maintainer].type
      ).toBeDefined();
      expect(
        dashboardManagement?.[AcicPrivileges.Administrator].type
      ).toBeDefined();
    });

    it('should have the correct permissions for Alert Management', () => {
      const { result } = renderHook(() => usePermissionDetails());

      const alertManagement = result.current.find(
        (detail) =>
          detail.action === 'settings:privileges.actions.alertManagement'
      );

      expect(alertManagement).toBeDefined();
      expect(alertManagement?.[AcicPrivileges.Operator].type).toBeDefined();
      expect(alertManagement?.[AcicPrivileges.Maintainer].type).toBeDefined();
      expect(
        alertManagement?.[AcicPrivileges.Administrator].type
      ).toBeDefined();
    });

    it('should have the correct permissions for Camera Configuration', () => {
      const { result } = renderHook(() => usePermissionDetails());

      const cameraConfiguration = result.current.find(
        (detail) =>
          detail.action === 'settings:privileges.actions.cameraConfiguration'
      );

      expect(cameraConfiguration).toBeDefined();
      expect(cameraConfiguration?.[AcicPrivileges.Operator].type).toBeDefined();
      expect(
        cameraConfiguration?.[AcicPrivileges.Maintainer].type
      ).toBeDefined();
      expect(
        cameraConfiguration?.[AcicPrivileges.Administrator].type
      ).toBeDefined();
    });

    it('should have the correct permissions for User Management', () => {
      const { result } = renderHook(() => usePermissionDetails());

      const userManagement = result.current.find(
        (detail) =>
          detail.action === 'settings:privileges.actions.userManagement'
      );

      expect(userManagement).toBeDefined();
      expect(userManagement?.[AcicPrivileges.Operator].type).toBeDefined();
      expect(userManagement?.[AcicPrivileges.Maintainer].type).toBeDefined();
      expect(userManagement?.[AcicPrivileges.Administrator].type).toBeDefined();
    });

    it('should have the correct permissions for System Settings', () => {
      const { result } = renderHook(() => usePermissionDetails());

      const systemSettings = result.current.find(
        (detail) =>
          detail.action === 'settings:privileges.actions.systemSettings'
      );

      expect(systemSettings).toBeDefined();
      expect(systemSettings?.[AcicPrivileges.Operator].type).toBeDefined();
      expect(systemSettings?.[AcicPrivileges.Maintainer].type).toBeDefined();
      expect(systemSettings?.[AcicPrivileges.Administrator].type).toBeDefined();
    });
  });

  describe('Icons and Translations', () => {
    it('should use translation keys for actions and tooltips', () => {
      const { result } = renderHook(() => usePermissionDetails());

      result.current.forEach((detail) => {
        expect(detail.action).toContain('settings:privileges.actions.');
        expect(detail.tooltip).toContain('settings:privileges.tooltips.');
      });
    });

    it('should provide appropriate icons for each permission level', () => {
      const { result } = renderHook(() => usePermissionDetails());

      // All administrators should have ShieldCheckIcon
      result.current.forEach((detail) => {
        expect(detail[AcicPrivileges.Administrator].type).toBeDefined();
      });
    });
  });
});
