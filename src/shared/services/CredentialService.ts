import { safeStorage } from 'electron';
import Store from 'electron-store';

// Using a flat schema where keys are strings like "broker.key"
// Record<string, string> explicitly tells electron-store to expect any string keys
interface FlatCredentialsSchema extends Record<string, string> {}

class CredentialService {
  private store: Store<FlatCredentialsSchema>;

  constructor() {
    // Initialize electron-store.
    this.store = new Store<FlatCredentialsSchema>({ name: 'credentials' });

    if (!safeStorage.isEncryptionAvailable()) {
      console.warn('Warning: Encryption is not available on this system. Credentials will be stored in plaintext by electron-store if not otherwise protected. This is NOT secure for production.');
      // Potentially throw an error or prevent app from storing sensitive data
      // For Linux, check safeStorage.getSelectedStorageBackend() to see if it's 'basic_text'
    }
  }

  private getStoreKey(broker: string, key: string): string {
    return `${broker}.${key}`;
  }

  async saveCredential(broker: string, key: string, value: string): Promise<void> {
    if (!value) {
      console.warn(`CredentialService: Attempted to save empty value for ${broker}.${key}`);
      return;
    }
    if (!safeStorage.isEncryptionAvailable()) {
      // Handle insecure storage case - perhaps by refusing to store or logging a severe warning
      console.error('CredentialService: Encryption not available. Refusing to store sensitive credential in plaintext.');
      // Or, if you decide to store it (NOT RECOMMENDED FOR SENSITIVE DATA):
      // this.store.set(this.getStoreKey(broker, key), value); // Plaintext storage
      // console.warn(`CredentialService: Stored ${broker}.${key} in plaintext due to unavailable encryption.`);
      return; // Or throw new Error('Encryption not available');
    }
    try {
      const encryptedValue = safeStorage.encryptString(value);
      // electron-store needs a string, but encryptString returns a Buffer.
      // Convert Buffer to a string representation (e.g., base64) for storage.
      (this.store as any).set(this.getStoreKey(broker, key), encryptedValue.toString('base64'));
      console.log(`CredentialService: Securely saved credential for ${broker}.${key}`);
    } catch (error) {
      console.error(`CredentialService: Failed to save credential for ${broker}.${key}`, error);
      throw error; // Re-throw or handle appropriately
    }
  }

  async getCredential(broker: string, key: string): Promise<string | null> {
    const storeKey = this.getStoreKey(broker, key);
    const storedValue = (this.store as any).get(storeKey);

    if (!storedValue) {
      console.log(`CredentialService: No credential found for ${broker}.${key}`);
      return null;
    }

    if (!safeStorage.isEncryptionAvailable()) {
      // Handle insecure retrieval case
      console.error('CredentialService: Encryption not available. Assuming stored value is plaintext if retrieved.');
      // return storedValue; // Assuming it was stored as plaintext
      return null; // Or better, don't return potentially sensitive plaintext
    }

    try {
      // Convert the base64 string back to a Buffer before decrypting
      const encryptedBuffer = Buffer.from(storedValue, 'base64');
      const decryptedValue = safeStorage.decryptString(encryptedBuffer);
      console.log(`CredentialService: Securely retrieved credential for ${broker}.${key}`);
      return decryptedValue;
    } catch (error) {
      console.error(`CredentialService: Failed to retrieve or decrypt credential for ${broker}.${key}`, error);
      // This could happen if the encryption key changed (e.g., OS reinstall, user change)
      // or if the data is corrupted or was not actually encrypted.
      // Consider deleting the corrupted/unreadable credential:
      // this.deleteCredential(broker, key);
      return null;
    }
  }

  async deleteCredential(broker: string, key: string): Promise<void> {
    const storeKey = this.getStoreKey(broker, key);
    if ((this.store as any).has(storeKey)) {
      (this.store as any).delete(storeKey);
      console.log(`CredentialService: Deleted credential for ${broker}.${key}`);
    } else {
      console.log(`CredentialService: No credential found to delete for ${broker}.${key}`);
    }
  }

  // Example of how to check if a broker is configured (e.g., has an API key stored)
  async isBrokerConfigured(broker: string, primaryKey: string = 'apiKey'): Promise<boolean> {
    const credential = await this.getCredential(broker, primaryKey);
    return !!credential;
  }
}

// Export a singleton instance if this service is meant to be a global provider
// Or export the class if it needs to be instantiated, possibly with configuration.
// For a main process service often used globally, a singleton is common.
let instance: CredentialService | null = null;

export const getCredentialService = (): CredentialService => {
  if (!instance) {
    instance = new CredentialService();
  }
  return instance;
};

// Alternatively, just export the class:
// export default CredentialService; 
 
 
 
 
 