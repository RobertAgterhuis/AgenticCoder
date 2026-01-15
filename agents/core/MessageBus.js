import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

let sharedMessageValidator = null;
let sharedMessageValidatorPromise = null;
let sharedSchemaLoadWarned = false;

async function getSharedMessageValidator() {
  if (sharedMessageValidator) {
    return sharedMessageValidator;
  }

  if (!sharedMessageValidatorPromise) {
    sharedMessageValidatorPromise = (async () => {
      const { readFile } = await import('fs/promises');
      const { resolve } = await import('path');
      const schemaPath = resolve(process.cwd(), '../schemas/message.schema.json');
      const schemaContent = await readFile(schemaPath, 'utf-8');
      const schema = JSON.parse(schemaContent);

      if (schema?.$id) {
        const existing = ajv.getSchema(schema.$id);
        if (existing) {
          return existing;
        }
      }

      return ajv.compile(schema);
    })();
  }

  try {
    sharedMessageValidator = await sharedMessageValidatorPromise;
    return sharedMessageValidator;
  } catch (error) {
    sharedMessageValidatorPromise = null;
    throw error;
  }
}

/**
 * MessageBus - Pub/Sub system for inter-agent communication
 * Enables event-driven agent coordination and loose coupling
 */
export class MessageBus extends EventEmitter {
  constructor(options = {}) {
    super();
    this.messages = new Map(); // messageId -> message
    this.subscriptions = new Map(); // topic -> Set of subscriber IDs
    this.subscribers = new Map(); // subscriberId -> { topics, handler }
    this.messageHistory = [];
    this.options = {
      maxHistorySize: options.maxHistorySize || 1000,
      messageTimeout: options.messageTimeout || 30000,
      enablePersistence: options.enablePersistence || false,
      ...options
    };

    // Load message schema
    this.messageValidator = sharedMessageValidator;
    this._loadMessageSchema();
  }

  async _loadMessageSchema() {
    try {
      this.messageValidator = await getSharedMessageValidator();
    } catch (error) {
      if (!sharedSchemaLoadWarned) {
        sharedSchemaLoadWarned = true;
        console.warn('Could not load message schema, validation disabled:', error.message);
      }
    }
  }

  /**
   * Subscribe to topics
   */
  subscribe(subscriberId, topics, handler) {
    if (!Array.isArray(topics)) {
      topics = [topics];
    }

    // Register subscriber
    this.subscribers.set(subscriberId, {
      topics: new Set(topics),
      handler
    });

    // Add to topic subscriptions
    for (const topic of topics) {
      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, new Set());
      }
      this.subscriptions.get(topic).add(subscriberId);
    }

    this.emit('subscription:added', { subscriberId, topics });
    return () => this.unsubscribe(subscriberId, topics);
  }

  /**
   * Unsubscribe from topics
   */
  unsubscribe(subscriberId, topics = null) {
    const subscriber = this.subscribers.get(subscriberId);
    if (!subscriber) return;

    if (topics === null) {
      // Unsubscribe from all topics
      topics = Array.from(subscriber.topics);
    } else if (!Array.isArray(topics)) {
      topics = [topics];
    }

    // Remove from topic subscriptions
    for (const topic of topics) {
      if (this.subscriptions.has(topic)) {
        this.subscriptions.get(topic).delete(subscriberId);
        if (this.subscriptions.get(topic).size === 0) {
          this.subscriptions.delete(topic);
        }
      }
      subscriber.topics.delete(topic);
    }

    // Remove subscriber if no more topics
    if (subscriber.topics.size === 0) {
      this.subscribers.delete(subscriberId);
    }

    this.emit('subscription:removed', { subscriberId, topics });
  }

  /**
   * Publish a message to a topic
   */
  async publish(topic, message, options = {}) {
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    const fullMessage = {
      id: messageId,
      topic,
      timestamp,
      ...message,
      metadata: {
        ...message.metadata,
        publishedAt: timestamp
      }
    };

    // Validate message if schema is loaded
    if (this.messageValidator && !this.messageValidator(fullMessage)) {
      throw new Error(`Invalid message: ${JSON.stringify(this.messageValidator.errors)}`);
    }

    // Store message
    this.messages.set(messageId, fullMessage);
    this._addToHistory(fullMessage);

    // Get subscribers for topic
    const subscribers = this.subscriptions.get(topic) || new Set();
    const deliveryResults = [];

    // Deliver to all subscribers
    for (const subscriberId of subscribers) {
      const subscriber = this.subscribers.get(subscriberId);
      if (!subscriber) continue;

      try {
        const result = await this._deliverMessage(subscriber, fullMessage, options);
        deliveryResults.push({
          subscriberId,
          success: true,
          result
        });
      } catch (error) {
        deliveryResults.push({
          subscriberId,
          success: false,
          error: error.message
        });
        this.emit('delivery:error', {
          messageId,
          subscriberId,
          error: error.message
        });
      }
    }

    this.emit('message:published', {
      messageId,
      topic,
      subscriberCount: subscribers.size,
      deliveryResults
    });

    return {
      messageId,
      delivered: deliveryResults.filter(r => r.success).length,
      failed: deliveryResults.filter(r => !r.success).length
    };
  }

  /**
   * Send a direct message to a specific subscriber
   */
  async send(fromId, toId, message, options = {}) {
    const messageId = uuidv4();
    const timestamp = new Date().toISOString();

    const fullMessage = {
      id: messageId,
      from: fromId,
      to: toId,
      timestamp,
      type: message.type || 'request',
      ...message
    };

    // Validate message
    if (this.messageValidator && !this.messageValidator(fullMessage)) {
      throw new Error(`Invalid message: ${JSON.stringify(this.messageValidator.errors)}`);
    }

    // Store message
    this.messages.set(messageId, fullMessage);
    this._addToHistory(fullMessage);

    // Get target subscriber
    const subscriber = this.subscribers.get(toId);
    if (!subscriber) {
      throw new Error(`Subscriber ${toId} not found`);
    }

    // Deliver message
    try {
      const result = await this._deliverMessage(subscriber, fullMessage, options);
      this.emit('message:sent', { messageId, fromId, toId });
      return { messageId, result };
    } catch (error) {
      this.emit('message:error', { messageId, fromId, toId, error: error.message });
      throw error;
    }
  }

  /**
   * Request-response pattern
   */
  async request(fromId, toId, payload, options = {}) {
    const requestId = uuidv4();
    const timeout = options.timeout || this.options.messageTimeout;

    // Send request
    const message = {
      type: 'request',
      correlationId: requestId,
      payload
    };

    // Set up response handler
    const responsePromise = new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.unsubscribe(responseHandlerId);
        reject(new Error('Request timeout'));
      }, timeout);

      const responseHandlerId = `${fromId}-response-${requestId}`;
      this.subscribe(responseHandlerId, `response.${requestId}`, (response) => {
        clearTimeout(timeoutHandle);
        this.unsubscribe(responseHandlerId);
        
        if (response.type === 'error') {
          reject(new Error(response.error?.message || 'Request failed'));
        } else {
          resolve(response.payload);
        }
      });
    });

    // Send request
    await this.send(fromId, toId, message);

    return responsePromise;
  }

  /**
   * Reply to a request
   */
  async reply(originalMessage, payload, options = {}) {
    if (!originalMessage.correlationId) {
      throw new Error('Original message has no correlationId');
    }

    const message = {
      type: 'response',
      correlationId: originalMessage.correlationId,
      payload
    };

    await this.publish(`response.${originalMessage.correlationId}`, message, options);
  }

  /**
   * Broadcast to all subscribers
   */
  async broadcast(message, options = {}) {
    return this.publish('broadcast', message, options);
  }

  /**
   * Get message by ID
   */
  getMessage(messageId) {
    return this.messages.get(messageId);
  }

  /**
   * Get message history
   */
  getHistory(options = {}) {
    const { limit = 100, topic = null, subscriberId = null, since = null } = options;

    let history = [...this.messageHistory];

    // Filter by topic
    if (topic) {
      history = history.filter(m => m.topic === topic);
    }

    // Filter by subscriber
    if (subscriberId) {
      history = history.filter(m => m.from === subscriberId || m.to === subscriberId);
    }

    // Filter by timestamp
    if (since) {
      const sinceTime = new Date(since).getTime();
      history = history.filter(m => new Date(m.timestamp).getTime() >= sinceTime);
    }

    // Limit results
    return history.slice(-limit);
  }

  /**
   * Get statistics
   */
  getStats() {
    const topicStats = {};
    for (const [topic, subscribers] of this.subscriptions) {
      topicStats[topic] = subscribers.size;
    }

    return {
      totalMessages: this.messages.size,
      historySize: this.messageHistory.length,
      totalTopics: this.subscriptions.size,
      totalSubscribers: this.subscribers.size,
      topicStats
    };
  }

  /**
   * Clear old messages
   */
  cleanup(olderThan = null) {
    if (olderThan) {
      const cutoff = new Date(olderThan).getTime();
      
      // Remove old messages
      for (const [id, message] of this.messages) {
        if (new Date(message.timestamp).getTime() < cutoff) {
          this.messages.delete(id);
        }
      }

      // Clean history
      this.messageHistory = this.messageHistory.filter(
        m => new Date(m.timestamp).getTime() >= cutoff
      );
    } else {
      // Clear all
      this.messages.clear();
      this.messageHistory = [];
    }

    this.emit('cleanup:complete', {
      messagesRemaining: this.messages.size,
      historySize: this.messageHistory.length
    });
  }

  // Private methods

  async _deliverMessage(subscriber, message, options = {}) {
    const { timeout = this.options.messageTimeout } = options;

    return Promise.race([
      subscriber.handler(message),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Delivery timeout')), timeout)
      )
    ]);
  }

  _addToHistory(message) {
    this.messageHistory.push(message);

    // Trim history if needed
    if (this.messageHistory.length > this.options.maxHistorySize) {
      this.messageHistory.shift();
    }
  }
}

/**
 * Global message bus singleton
 */
export const messageBus = new MessageBus();
