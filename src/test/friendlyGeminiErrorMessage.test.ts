import { describe, it, expect } from 'vitest';
import { friendlyGeminiErrorMessage } from '../../server/geminiErrors';

describe('friendlyGeminiErrorMessage', () => {
  it('explica claramente cuando falta la API key', () => {
    const msg = friendlyGeminiErrorMessage(new Error('AUTH_NO_KEY'));
    expect(msg).toContain('GEMINI_API_KEY');
    expect(msg.toLowerCase()).toContain('no hay');
  });

  it('explica claramente cuando la API key es inválida', () => {
    const msg = friendlyGeminiErrorMessage(new Error('AUTH_INVALID_KEY'));
    expect(msg.toLowerCase()).toContain('no es válida');
  });

  it('explica la cuota agotada', () => {
    const msg = friendlyGeminiErrorMessage(new Error('429 RESOURCE_EXHAUSTED'));
    expect(msg.toLowerCase()).toContain('cuota');
  });

  it('explica cuando Gemini está saturado', () => {
    const msg = friendlyGeminiErrorMessage(new Error('503 UNAVAILABLE: model is overloaded'));
    expect(msg.toLowerCase()).toContain('saturado');
  });

  it('incluye el mensaje original para cualquier otro error, sin inventar nada', () => {
    const msg = friendlyGeminiErrorMessage(new Error('Algo raro pasó'));
    expect(msg).toContain('Algo raro pasó');
  });

  it('nunca lanza ni devuelve vacío, incluso con un error sin mensaje', () => {
    const msg = friendlyGeminiErrorMessage({});
    expect(typeof msg).toBe('string');
    expect(msg.length).toBeGreaterThan(0);
  });
});
