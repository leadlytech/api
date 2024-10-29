export enum EPaginationMode {
  OFFSET = 'OFFSET',
  CURSOR = 'CURSOR',
}

export enum EFieldType {
  DATE = 'date',
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
}

export enum ESearchOptions {
  EQUAL = 'eql',
  DIFFERENT = 'not',
  CONTAINS = 'ctn',

  ENDS_WITH = 'edw',
  STARTS_WITH = 'stw',

  GREATER_THAN = 'gt0',
  GREATER_OR_EQUAL_THAN = 'gte',

  LOWER_THAN = 'lt0',
  LOWER_OR_EQUAL_THAN = 'lte',
}

export enum EEventType {
  RESTRICT = 'restrict',
  PRIVATE = 'private',
  PUBLIC = 'public',
  ALL = 'all',
}

export interface IEventOptions {
  /**
   * Nome do evento disparado
   */
  eventName: string;

  /**
   * ID do tenant em que o evento ocorreu
   */
  tenantId?: string;

  /**
   * Horário em que o evento aconteceu.
   * @default new Date()
   */
  time?: Date;

  /**
   * Determina o tipo de evento:
   *
   * restrict - O evento é restrito às instância em execução do mesmo serviço
   * private - O evento é privado e só será notificado dentro da própria instância do serviço
   * public - O evento é público e qualquer serviço na rede de eventos poderá acessá-lo
   * all - O evento é de extrema importância e será enviado à TODOS os serviços na rede de eventos
   * @default public
   */
  type?: EEventType;
}

export interface IEvent<T = any> {
  /**
   * Dados do evento
   */
  payload: T;

  /**
   * Opções adicionais do evento
   */
  options?: IEventOptions;
}
