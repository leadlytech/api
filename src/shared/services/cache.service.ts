import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(
    private configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}
  private readonly logger = new Logger(CacheService.name);

  async get<T = any>(
    origin: string,
    key: string,
    config?: {
      ttl?: number;
    },
  ): Promise<T | null | undefined> {
    try {
      const ttl =
        config?.ttl ??
        this.configService.get<number>('CACHE_DEFAULT_TTL', {
          infer: true,
        });

      const payload = ttl
        ? await this.redis.getex(this.formatKey(origin, key), 'EX', ttl) // Prorroga o prazo de expiração da chave
        : await this.redis.get(this.formatKey(origin, key));
      return payload ? JSON.parse(payload) : undefined;
    } catch (err) {
      this.logger.error('Error getting data from cache', err);
      return undefined;
    }
  }

  async getByPattern(
    origin: string,
    pattern: string,
  ): Promise<any[] | undefined> {
    try {
      let cursor = '0';
      let keys: string[] = [];

      // Use um loop para garantir que todas as chaves sejam escaneadas
      do {
        const result = await this.redis.scan(
          cursor,
          'MATCH',
          this.formatKey(origin, pattern),
        );
        cursor = result[0]; // Atualiza o cursor
        keys = keys.concat(result[1]); // Concatena as chaves encontradas
      } while (cursor !== '0'); // Continua até que o cursor volte a ser '0'

      // Se não encontrar chaves, retorna array vazio
      if (keys.length === 0) {
        return [];
      }

      // Use MGET para obter todos os valores das chaves encontradas
      const values = await this.redis.mget(...keys);
      return values.map((value) => JSON.parse(value));
    } catch (err) {
      this.logger.error('Error getting data from cache', err);
      return undefined;
    }
  }

  async set(
    origin: string,
    key: string,
    payload: any,
    config?: {
      ttl?: number | false;
      lock?: boolean;
    },
  ): Promise<boolean> {
    try {
      const ttl =
        config?.ttl ??
        this.configService.get<number>('CACHE_DEFAULT_TTL', {
          infer: true,
        });
      const formattedKey = this.formatKey(origin, key);
      const payloadString = JSON.stringify(payload);

      // Determina os argumentos com base na configuração
      let res: string | null;

      if (config?.lock) {
        res = ttl
          ? await this.redis.set(formattedKey, payloadString, 'EX', ttl, 'NX')
          : await this.redis.set(formattedKey, payloadString, 'NX');
      } else {
        res = ttl
          ? await this.redis.set(formattedKey, payloadString, 'EX', ttl)
          : await this.redis.set(formattedKey, payloadString);
      }

      return res === 'OK' || (config?.lock && res === null);
    } catch (err) {
      this.logger.error('Error setting data on cache', err);
      return false;
    }
  }

  async setMultiple(
    origin: string,
    keyValuePairs: { key: string; payload: any }[],
    config?: {
      ttl?: number | false;
      lock?: boolean;
    },
  ): Promise<boolean> {
    try {
      for (const { key, payload } of keyValuePairs) {
        const success = await this.set(origin, key, payload, config);

        if (!success) {
          this.logger.error(`Failed to set key ${key} in setMultiple`);
          return false; // Retorna falso se qualquer inserção falhar
        }
      }

      return true; // Retorna verdadeiro se todas as inserções forem bem-sucedidas
    } catch (err) {
      this.logger.error('Error setting multiple data on cache', err);
      return false;
    }
  }

  async del(origin: string, key: string) {
    try {
      await this.redis.del(this.formatKey(origin, key));
      return true;
    } catch (err) {
      this.logger.error('Error removing data from cache', err);
      return false;
    }
  }

  async reset() {
    try {
      return this.delByPattern(`${process.env.SERVER_NAME}:cache:*`);
    } catch (err) {
      this.logger.error('Error resetting cache', err);
      return false;
    }
  }

  async delByPattern(pattern: string) {
    try {
      const stream = this.redis.scanStream({ match: pattern });
      stream.on('data', async (keys: string[]) => {
        if (keys.length) {
          const pipeline = this.redis.pipeline();
          keys.forEach((key) => pipeline.del(key));
          await pipeline.exec();
        }
      });

      stream.on('end', () => {
        this.logger.log(
          `Chaves que correspondem ao padrão ${pattern} foram deletadas.`,
        );
      });

      return true;
    } catch (err) {
      this.logger.error('Error removing keys by pattern from cache', err);
      return false;
    }
  }

  private formatKey(origin: string, key: string) {
    return `${process.env.SERVER_NAME}:cache:${origin}:${key}`;
  }
}
