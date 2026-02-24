import {
  BaseCheckpointSaver,
  type ChannelVersions,
  type Checkpoint,
  type CheckpointListOptions,
  type CheckpointMetadata,
  type CheckpointTuple,
  type PendingWrite,
} from '@langchain/langgraph-checkpoint';
import { MemorySaver } from '@langchain/langgraph-checkpoint';
import type { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';

/** Use base class param types to avoid duplicate @langchain/core resolution. */
type Config = Parameters<BaseCheckpointSaver['getTuple']>[0];

/**
 * Bypass resolution-mode mismatch: @langchain/core resolves differently via
 * langgraph-checkpoint vs langgraph-checkpoint-postgres. At runtime these are identical.
 */
function asSaverConfig(c: Config): Parameters<MemorySaver['getTuple']>[0] {
  return c as unknown as Parameters<MemorySaver['getTuple']>[0];
}

/**
 * Hybrid checkpointer: MemorySaver for fast reads/writes, PostgresSaver for durability.
 * Writes go to memory first (blocking), then to Postgres in the background (non-blocking).
 * On server restart, reads fall through to Postgres.
 */
export class HybridCheckpointer extends BaseCheckpointSaver {
  private readonly memory: MemorySaver;
  private readonly postgres: PostgresSaver;

  constructor(postgres: PostgresSaver) {
    super(postgres.serde);
    this.memory = new MemorySaver(postgres.serde);
    this.postgres = postgres;
  }

  async getTuple(config: Config): Promise<CheckpointTuple | undefined> {
    const cfg = asSaverConfig(config);
    const fromMemory = await this.memory.getTuple(cfg);
    if (fromMemory != null) {
      return fromMemory;
    }
    // @ts-expect-error - resolution-mode mismatch between @langchain packages
    const fromPostgres = await this.postgres.getTuple(cfg);
    if (fromPostgres != null) {
      void this.backfillMemory(config, fromPostgres);
    }
    return fromPostgres;
  }

  async *list(
    config: Config,
    options?: CheckpointListOptions,
  ): AsyncGenerator<CheckpointTuple> {
    // @ts-expect-error - resolution-mode mismatch between @langchain packages
    yield* this.postgres.list(asSaverConfig(config), options);
  }

  async put(
    config: Config,
    checkpoint: Checkpoint,
    metadata: CheckpointMetadata,
    newVersions: ChannelVersions,
  ): Promise<Config> {
    const normalizedCheckpoint = this.normalizeCheckpoint(checkpoint);
    const cfg = asSaverConfig(config);
    const result = await this.memory.put(
      cfg,
      normalizedCheckpoint,
      metadata,
    );
    // @ts-expect-error - resolution-mode mismatch between @langchain packages
    void this.postgres.put(cfg, normalizedCheckpoint, metadata, newVersions)
      .catch((err) => {
        console.error('[HybridCheckpointer] background postgres put failed:', err);
      });
    return result as unknown as Config;
  }

  async putWrites(
    config: Config,
    writes: PendingWrite[],
    taskId: string,
  ): Promise<void> {
    const cfg = asSaverConfig(config);
    await this.memory.putWrites(cfg, writes, taskId);
    // @ts-expect-error - resolution-mode mismatch between @langchain packages
    void this.postgres.putWrites(cfg, writes, taskId).catch((err) => {
      console.error(
        '[HybridCheckpointer] background postgres putWrites failed:',
        err,
      );
    });
  }

  async setup(): Promise<void> {
    await this.postgres.setup();
  }

  async end(): Promise<void> {
    await this.postgres.end();
  }

  private normalizeCheckpoint(checkpoint: Checkpoint): Checkpoint {
    const pendingSends = Array.isArray(checkpoint.pending_sends)
      ? checkpoint.pending_sends
      : [];
    const result: Checkpoint = {
      ...checkpoint,
      pending_sends: pendingSends,
    };
    return result;
  }

  private async backfillMemory(
    config: Config,
    tuple: CheckpointTuple,
  ): Promise<void> {
    try {
      const parentId = tuple.parentConfig?.configurable?.checkpoint_id;
      const writeConfig: Config = {
        configurable: {
          thread_id: config.configurable?.thread_id ?? '',
          checkpoint_ns: config.configurable?.checkpoint_ns ?? '',
          checkpoint_id: parentId,
        },
      };
      const normalizedCheckpoint = this.normalizeCheckpoint(tuple.checkpoint);
      const metadata: CheckpointMetadata = tuple.metadata ?? {
        source: 'fork',
        step: 0,
        writes: null,
        parents: {},
      };
      await this.memory.put(
        asSaverConfig(writeConfig),
        normalizedCheckpoint,
        metadata,
      );
    } catch (err) {
      console.error('[HybridCheckpointer] backfill to memory failed:', err);
    }
  }
}
