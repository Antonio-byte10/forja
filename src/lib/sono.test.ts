import { afterEach, expect, it, vi } from 'vitest';
import { aggregateRecord, getGrantedPermissions, getSdkStatus, initialize, requestPermission } from 'react-native-health-connect';
import { lerSono } from './sono.android';

vi.mock('react-native-health-connect', () => ({
  getSdkStatus: vi.fn(), initialize: vi.fn(), getGrantedPermissions: vi.fn(), requestPermission: vi.fn(), aggregateRecord: vi.fn(),
  SdkAvailabilityStatus: { SDK_AVAILABLE: 3 },
}));
afterEach(() => vi.resetAllMocks());

it('pede somente leitura de sono e converte segundos em minutos', async () => {
  vi.mocked(getSdkStatus).mockResolvedValue(3);
  vi.mocked(initialize).mockResolvedValue(true);
  vi.mocked(getGrantedPermissions).mockResolvedValue([]);
  vi.mocked(requestPermission).mockResolvedValue([{ recordType: 'SleepSession', accessType: 'read' }]);
  vi.mocked(aggregateRecord<'SleepSession'>).mockResolvedValue({ SLEEP_DURATION_TOTAL: 27000, dataOrigins: [] });
  expect(await lerSono('2025-11-20', true)).toBe(450);
  expect(requestPermission).toHaveBeenCalledWith([{ recordType: 'SleepSession', accessType: 'read' }]);
  expect(aggregateRecord).toHaveBeenCalledWith({ recordType: 'SleepSession', timeRangeFilter: {
    operator: 'between', startTime: new Date(2025, 10, 19, 12).toISOString(), endTime: new Date(2025, 10, 20, 12).toISOString(),
  } });
});
it('distingue ausência de registros e permissão revogada', async () => {
  vi.mocked(getSdkStatus).mockResolvedValue(3);
  vi.mocked(initialize).mockResolvedValue(true);
  vi.mocked(getGrantedPermissions).mockResolvedValueOnce([{ recordType: 'SleepSession', accessType: 'read' }]).mockResolvedValueOnce([]);
  vi.mocked(aggregateRecord<'SleepSession'>).mockResolvedValue({ SLEEP_DURATION_TOTAL: 0, dataOrigins: [] });
  expect(await lerSono('2025-11-20', false)).toBeUndefined();
  await expect(lerSono('2025-11-20', false)).rejects.toThrow('Autorize');
  expect(requestPermission).not.toHaveBeenCalled();
});
