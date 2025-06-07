import { getCredentialService } from '../CredentialService';

jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => {
    const store = new Map<string, string>();
    return {
      set: (key: string, value: string) => store.set(key, value),
      get: (key: string) => store.get(key),
      has: (key: string) => store.has(key),
      delete: (key: string) => store.delete(key),
    };
  });
});

const encryptStringMock = jest.fn((str: string) => Buffer.from(`enc:${str}`));
const decryptStringMock = jest.fn((buf: Buffer) => buf.toString().replace(/^enc:/, ''));
let encryptionAvailable = true;

jest.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => encryptionAvailable,
    encryptString: encryptStringMock,
    decryptString: decryptStringMock,
  },
}));

describe('CredentialService', () => {
  const broker = 'testBroker';
  const key = 'apiKey';
  const value = 'superSecret';
  let service: ReturnType<typeof getCredentialService>;

  beforeEach(() => {
    jest.clearAllMocks();
    encryptionAvailable = true;
    service = getCredentialService();
  });

  it('saves and retrieves a credential securely', async () => {
    await service.saveCredential(broker, key, value);
    const result = await service.getCredential(broker, key);
    expect(result).toBe(value);
    expect(encryptStringMock).toHaveBeenCalledWith(value);
    expect(decryptStringMock).toHaveBeenCalled();
  });

  it('returns null if credential does not exist', async () => {
    const result = await service.getCredential('noBroker', 'noKey');
    expect(result).toBeNull();
  });

  it('does not save or retrieve if encryption is unavailable', async () => {
    encryptionAvailable = false;
    await service.saveCredential(broker, key, value);
    const result = await service.getCredential(broker, key);
    expect(result).toBeNull();
    expect(encryptStringMock).not.toHaveBeenCalled();
    expect(decryptStringMock).not.toHaveBeenCalled();
  });

  it('deletes a credential', async () => {
    await service.saveCredential(broker, key, value);
    await service.deleteCredential(broker, key);
    const result = await service.getCredential(broker, key);
    expect(result).toBeNull();
  });

  it('isBrokerConfigured returns true if credential exists', async () => {
    await service.saveCredential(broker, key, value);
    const configured = await service.isBrokerConfigured(broker, key);
    expect(configured).toBe(true);
  });

  it('isBrokerConfigured returns false if credential does not exist', async () => {
    const configured = await service.isBrokerConfigured('noBroker', 'noKey');
    expect(configured).toBe(false);
  });

  it('does not save empty values', async () => {
    await service.saveCredential(broker, key, '');
    const result = await service.getCredential(broker, key);
    expect(result).toBeNull();
  });
}); 