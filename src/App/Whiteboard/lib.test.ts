import { SCENE_STORAGE_KEY } from './data';
import { autosaveDelay, clearScene, excalidrawLangOf, readScene, storeScene } from './lib';

beforeEach(() => {
  localStorage.clear();
});

describe('本地场景存储 (localStorage)', () => {
  test('storeScene 写入后可 readScene 读回 (原样)', () => {
    const scene = '{"elements":[],"appState":{"viewBackgroundColor":"#fff"}}';
    expect(storeScene(scene)).toBe(true);
    expect(readScene()).toBe(scene);
    const raw = localStorage.getItem(SCENE_STORAGE_KEY) as string;
    expect(JSON.parse(raw)).toMatchObject({ v: 1, scene });
  });

  test('空字符串 / 非字符串不写入', () => {
    expect(storeScene('')).toBe(false);
    expect(storeScene('   ')).toBe(false);
    expect(storeScene(undefined as unknown as string)).toBe(false);
    expect(localStorage.getItem(SCENE_STORAGE_KEY)).toBeNull();
    expect(readScene()).toBeNull();
  });

  test('无存储 / 损坏 JSON / 版本不符 / 场景为空串时返回 null', () => {
    expect(readScene()).toBeNull();
    localStorage.setItem(SCENE_STORAGE_KEY, '{ not json');
    expect(readScene()).toBeNull();
    localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify({ v: 99, scene: '{}' }));
    expect(readScene()).toBeNull();
    localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify({ v: 1, scene: '  ' }));
    expect(readScene()).toBeNull();
  });

  test('clearScene 清掉已存场景', () => {
    storeScene('{"elements":[]}');
    expect(readScene()).not.toBeNull();
    clearScene();
    expect(readScene()).toBeNull();
    expect(localStorage.getItem(SCENE_STORAGE_KEY)).toBeNull();
  });

  test('localStorage 不可用 (隐私模式) 时读写都不抛异常', () => {
    const getSpy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    const setSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('denied'); });
    const delSpy = jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('denied'); });
    expect(storeScene('{}')).toBe(false);
    expect(readScene()).toBeNull();
    expect(() => clearScene()).not.toThrow();
    getSpy.mockRestore();
    setSpy.mockRestore();
    delSpy.mockRestore();
  });
});

describe('语言映射 / 保存间隔', () => {
  test('界面语言 → Excalidraw 语言代码', () => {
    expect(excalidrawLangOf('zh-CN')).toBe('zh-CN');
    expect(excalidrawLangOf('zh-TW')).toBe('zh-TW');
    expect(excalidrawLangOf('en')).toBe('en');
    // 未知语言回退简体 (与项目界面文案的回退惯例一致; Excalidraw 内部对无效 code 另有 en 兜底)
    expect(excalidrawLangOf('fr')).toBe('zh-CN');
    expect(excalidrawLangOf('')).toBe('zh-CN');
  });

  test('自动保存间隔来自 data.ts 常量', () => {
    expect(autosaveDelay()).toBe(600);
  });
});