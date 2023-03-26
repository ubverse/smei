import { SecretsManager } from '@aws-sdk/client-secrets-manager'
import { Optional, IHash } from './types'

export class SecretsManagerEnvInjector {
  private readonly client: SecretsManager
  private readonly secrets: IHash<string>

  /**
   * Creates an instance of SecretsManagerEnvInjector.
   *
   * @param {string} [awsRegion] - AWS region to use for the client
   */
  public constructor (awsRegion?: string) {
    this.client = new SecretsManager({ region: awsRegion ?? 'us-east-1' })
    this.secrets = {}
  }

  /**
   * Loads a secret from AWS Secrets Manager and adds it to the `secrets` object.
   *
   * @param {string} name - The name or ARN of the secret to load
   * @param {string} [withPrefix] - A prefix to add to each key in the secret object
   * @returns {Promise<this>} - The current instance of `SecretsManagerEnvInjector`
   * @throws {Error} - If the secret is not defined or is not a valid JSON object
   */
  public async loadObjectSecret (name: string, withPrefix?: string): Promise<this> {
    const secret = await this.fetchSecret(name)
    if (secret === undefined) {
      throw new Error(`Secret "${name}" is not defined`)
    }

    let parsedSecret: IHash<string> = {}

    try {
      parsedSecret = JSON.parse(secret)
    } catch {
      throw new Error('Secret is not a valid JSON')
    }

    if (withPrefix !== undefined) {
      parsedSecret = Object.fromEntries(Object.entries(parsedSecret).map(([key, value]) => [`${withPrefix}_${key}`, value]))
    }

    for (const [key, value] of Object.entries(parsedSecret)) {
      if (key in this.secrets) {
        throw new Error(`Secret "${key}" is duplicated`)
      }

      this.secrets[key] = value
    }

    return this
  }

  /**
   * Injects all secrets in the `secrets` object into environment variables.
   */
  public injectEnvs (): void {
    for (const [key, value] of Object.entries(this.secrets)) {
      process.env[key.toUpperCase()] = value
    }
  }

  private async fetchSecret (name: string): Promise<Optional<string>> {
    const response = await this.client.getSecretValue({ SecretId: name })
    const { SecretString: secret } = response ?? {}

    return secret
  }
}
