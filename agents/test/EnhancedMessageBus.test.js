/**
 * EnhancedMessageBus.test.js
 *
 * Node test runner suite for EnhancedMessageBus.
 * Note: EnhancedMessageBus starts a background queue processor by default.
 * Tests disable it via { startProcessor: false }.
 */

import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import { EnhancedMessageBus } from '../core/EnhancedMessageBus.js';

describe('EnhancedMessageBus', () => {
  let messageBus;

  afterEach(() => {
    if (messageBus) {
      messageBus.stopQueueProcessor();
      messageBus = null;
    }
  });

  it('should get routing targets for phase', () => {
    messageBus = new EnhancedMessageBus({ startProcessor: false });
    const targets = messageBus.getRoutingTargets(0);
    assert.ok(Array.isArray(targets));
    assert.ok(targets.length > 0);
  });

  it('should filter targets by capability', () => {
    messageBus = new EnhancedMessageBus({ startProcessor: false });
    const targets = messageBus.getRoutingTargets(2, { requiredCapability: 'assessment' });
    assert.ok(Array.isArray(targets));
  });

  it('should handle all 12 phases', () => {
    messageBus = new EnhancedMessageBus({ startProcessor: false });
    for (let phase = 0; phase < 12; phase++) {
      const targets = messageBus.getRoutingTargets(phase);
      assert.ok(Array.isArray(targets));
    }
  });

  it('should throw error for invalid phase in publishPhaseMessage', async () => {
    messageBus = new EnhancedMessageBus({ startProcessor: false });
    await assert.rejects(
      () => messageBus.publishPhaseMessage({ currentPhase: 99, messageType: 'execution' }),
      /Invalid phase/
    );
  });

  it('should calculate priority by phase and message type', async () => {
    messageBus = new EnhancedMessageBus({ startProcessor: false });

    const msg0 = await messageBus.publishPhaseMessage({ currentPhase: 0, messageType: 'execution' });
    assert.equal(msg0.priority, 'HIGH');

    const msg8 = await messageBus.publishPhaseMessage({ currentPhase: 8, messageType: 'execution' });
    assert.equal(msg8.priority, 'NORMAL');

    const escalation = await messageBus.publishPhaseMessage({ currentPhase: 8, messageType: 'escalation' });
    assert.equal(escalation.priority, 'CRITICAL');
  });

  it('should request approval for phase 0', async () => {
    messageBus = new EnhancedMessageBus({ startProcessor: false });

    const result = await messageBus.requestApproval(0, { requirements: 'test requirements' });
    assert.equal(typeof result.approvalId, 'string');
    assert.equal(result.status, 'awaiting_approval');
    assert.deepEqual(result.artifacts, { requirements: 'test requirements' });
  });

  it('should retrieve dead letter queue as array', () => {
    messageBus = new EnhancedMessageBus({ startProcessor: false });
    const dlq = messageBus.getDeadLetterQueue();
    assert.ok(Array.isArray(dlq));
  });
});
