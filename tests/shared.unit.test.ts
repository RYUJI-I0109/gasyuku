import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { slugify, generateId } from '../src/shared/slug';
import { fmtTime } from '../src/shared/time';
import { PRIORITY_CYCLE, PRIORITY_COLORS, HIGHLIGHT_COLORS } from '../src/shared/constants';
import { authHeaders } from '../src/shared/api-client';
import { mapNormToOrig } from '../src/widget/highlight';

describe('slugify', () => {
  test('HTTP プレフィックスを除去する', () => {
    expect(slugify('https://example.com/page')).toBe('example_com_page');
  });

  test('日本語文字を保持する', () => {
    const result = slugify('https://example.com/テスト');
    expect(result).toContain('テスト');
  });

  test('100文字で切り詰める', () => {
    const long = 'https://example.com/' + 'a'.repeat(200);
    expect(slugify(long).length).toBe(100);
  });

  test('記号をアンダースコアに変換する', () => {
    expect(slugify('https://a.b/c?d=e&f=g')).toBe('a_b_c_d_e_f_g');
  });
});

describe('generateId', () => {
  test('文字列を返す', () => {
    expect(typeof generateId()).toBe('string');
  });

  test('一意性がある（100回生成してユニーク）', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('fmtTime', () => {
  let realNow: () => number;

  beforeEach(() => {
    realNow = Date.now;
    vi.spyOn(Date, 'now').mockReturnValue(1700000000000);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('1分未満は「たった今」', () => {
    expect(fmtTime(1700000000000 - 30000)).toBe('たった今');
  });

  test('1時間未満は「N分前」', () => {
    expect(fmtTime(1700000000000 - 300000)).toBe('5分前');
  });

  test('24時間未満は「N時間前」', () => {
    expect(fmtTime(1700000000000 - 7200000)).toBe('2時間前');
  });

  test('24時間以上は日時文字列', () => {
    const result = fmtTime(1700000000000 - 86400000 * 2);
    expect(result).toMatch(/\d+月/);
  });
});

describe('PRIORITY_CYCLE', () => {
  test('must → better → want → must の循環', () => {
    expect(PRIORITY_CYCLE.must).toBe('better');
    expect(PRIORITY_CYCLE.better).toBe('want');
    expect(PRIORITY_CYCLE.want).toBe('must');
  });

  test('3つの優先度が全て定義されている', () => {
    expect(Object.keys(PRIORITY_CYCLE)).toEqual(['must', 'better', 'want']);
  });
});

describe('PRIORITY_COLORS', () => {
  test('3つの優先度が全て定義されている', () => {
    expect(Object.keys(PRIORITY_COLORS)).toEqual(['must', 'better', 'want']);
  });

  test('各色に bg, text, light, border がある', () => {
    for (const p of ['must', 'better', 'want'] as const) {
      expect(PRIORITY_COLORS[p]).toHaveProperty('bg');
      expect(PRIORITY_COLORS[p]).toHaveProperty('text');
      expect(PRIORITY_COLORS[p]).toHaveProperty('light');
      expect(PRIORITY_COLORS[p]).toHaveProperty('border');
    }
  });
});

describe('HIGHLIGHT_COLORS', () => {
  test('3つの優先度が全て定義されている', () => {
    expect(Object.keys(HIGHLIGHT_COLORS)).toEqual(['must', 'better', 'want']);
  });
});

describe('authHeaders', () => {
  test('トークンありの場合 Authorization を含む', () => {
    const h = authHeaders('my-token');
    expect(h['Authorization']).toBe('Bearer my-token');
    expect(h['Content-Type']).toBe('application/json');
  });

  test('トークンなしの場合 Authorization を含まない', () => {
    const h = authHeaders('');
    expect(h['Authorization']).toBeUndefined();
    expect(h['Content-Type']).toBe('application/json');
  });
});

describe('mapNormToOrig', () => {
  test('空白なしの単純マッチ', () => {
    expect(mapNormToOrig('hello world', 0, 5)).toEqual([0, 5]);
  });

  test('余分な空白がある場合の正規化マッチ', () => {
    // 正規化後のインデックス 6-11 は orig で 6-12 に対応（余分な空白を含む）
    expect(mapNormToOrig('hello  world', 6, 11)).toEqual([6, 12]);
  });

  test('範囲外の normStart は null を返す', () => {
    expect(mapNormToOrig('short', 100, 105)).toBeNull();
  });
});
