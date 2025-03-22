declare module 'rage-edit' {
  /**
   * Supported output formats.
   */
  export type RegistryFormat = 'naive' | 'simple' | 'complex';

  /**
   * Options used by the Registry class.
   */
  export interface RegistryOptions {
    lowercase?: boolean;
    format?: RegistryFormat;
  }

  /**
   * Registry key structure when using the simple format.
   * Keys are represented as properties and values are held in the special `$values` property.
   */
  export interface RegistryKeySimple {
    $values: { [name: string]: any };
    [subkey: string]: any;
  }

  /**
   * A single registry value entry.
   */
  export interface RegistryValue {
    name: string;
    type: string;
    data: any;
  }

  /**
   * Registry key structure when using the complex format.
   * Subkeys are stored under the `keys` property and values as an array in `values`.
   */
  export interface RegistryKeyComplex {
    keys: { [key: string]: RegistryKeyComplex };
    values: RegistryValue[];
  }

  /**
   * Main class for interacting with the Windows registry.
   * Create a new instance by providing a registry path and optional options.
   */
  export class Registry {
    constructor(path: string, options?: RegistryOptions);

    // Instance methods mirror the static ones.
    get(...args: any[]): Promise<any>;
    has(...args: any[]): Promise<boolean>;
    set(...args: any[]): Promise<void>;
    delete(...args: any[]): Promise<void>;
    clear(...args: any[]): Promise<void>;

    // Static properties – these are used to control the default options and value names.
    static VALUES: string;
    static DEFAULT: string;
    static DEFAULT_VERBOSE: string;
    static lowercase: boolean;
    static format: RegistryFormat;
    static FORMAT_NAIVE: string;
    static FORMAT_SIMPLE: string;
    static FORMAT_COMPLEX: string;
    static options: RegistryOptions;

    // Static methods

    /**
     * Retrieves either a key structure or a single value from the registry.
     * Overload:
     * - If only a path is given, or a boolean is provided as the second parameter,
     *   it returns the registry key (possibly recursively).
     * - If a string is provided as the second parameter, it returns the value.
     */
    static get(
      path: string,
    ): Promise<RegistryKeySimple | RegistryKeyComplex | undefined>;
    static get(
      path: string,
      recursive: boolean,
      options?: RegistryOptions,
    ): Promise<RegistryKeySimple | RegistryKeyComplex | undefined>;
    static get(
      path: string,
      name: string,
      options?: RegistryOptions,
    ): Promise<any>;

    /**
     * Checks whether a key or a value exists at the given path.
     * If the second parameter (name) is provided, checks for a value; otherwise, checks for a key.
     */
    static has(path: string): Promise<boolean>;
    static has(path: string, name: string): Promise<boolean>;

    /**
     * Retrieves a registry key structure.
     */
    static getKey(
      path: string,
      recursive?: boolean,
      options?: RegistryOptions,
    ): Promise<RegistryKeySimple | RegistryKeyComplex | undefined>;

    /**
     * Retrieves a single value entry from the registry.
     */
    static getValue(
      path: string,
      name?: string,
      options?: RegistryOptions,
    ): Promise<any>;

    /**
     * Returns an array of subkey names (or full paths, depending on options) for the given path.
     */
    static getKeys(
      path: string,
      options?: RegistryOptions,
    ): Promise<string[] | undefined>;

    /**
     * Retrieves all values from a key.
     * Returns either an object (for simple format) or an array of RegistryValue entries (for complex format).
     */
    static getValues(
      path: string,
      options?: RegistryOptions,
    ): Promise<{ [name: string]: any } | RegistryValue[] | undefined>;

    /**
     * Sets a registry key or value.
     * Overload:
     * - Calling with only a path creates a key.
     * - Calling with additional arguments creates or updates a value.
     */
    static set(path: string): Promise<void>;
    static set(
      path: string,
      name: string,
      data: any,
      type?: string,
    ): Promise<void>;
    static set(path: string, data: any, type?: string): Promise<void>;

    /**
     * Creates a registry key.
     */
    static setKey(path: string): Promise<void>;

    /**
     * Sets a registry value.
     */
    static setValue(
      path: string,
      name: string,
      data: any,
      type?: string,
    ): Promise<void>;

    /**
     * Deletes a registry key (if only path is provided) or a value (if a name is provided).
     */
    static delete(path: string): Promise<void>;
    static delete(path: string, name: string): Promise<void>;

    /**
     * Clears (deletes all subkeys and/or values) at a given registry key.
     */
    static clear(path: string): Promise<void>;

    /**
     * Deletes an entire registry key and its subkeys/values.
     */
    static deleteKey(path: string): Promise<void>;

    /**
     * Deletes a single registry value.
     */
    static deleteValue(path: string, name?: string): Promise<void>;

    /**
     * Deletes all values within a registry key, preserving the key and its subkeys.
     */
    static clearValues(path: string): Promise<void>;

    /**
     * Deletes all subkeys within a registry key, preserving the key's values.
     */
    static clearKeys(path: string): Promise<void>;
  }

  // Also export Registry as the default.
  export default Registry;
}
