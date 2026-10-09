import { GROUP_BY_TYPE_EVENT, getDefaultGroupByType, setDefaultGroupByType } from './lib';

beforeEach(() => localStorage.clear());

describe('我的收藏 默认配置', () => {
  test('默认关闭, set / get 往返', () => {
    expect(getDefaultGroupByType()).toBe(false);
    setDefaultGroupByType(true);
    expect(getDefaultGroupByType()).toBe(true);
    setDefaultGroupByType(false);
    expect(getDefaultGroupByType()).toBe(false);
  });

  test('写入时广播变更事件 (供收藏页实时同步)', () => {
    const spy = jest.fn();
    window.addEventListener(GROUP_BY_TYPE_EVENT, spy);
    setDefaultGroupByType(true);
    window.removeEventListener(GROUP_BY_TYPE_EVENT, spy);
    expect(spy).toHaveBeenCalledTimes(1);
    expect((spy.mock.calls[0][0] as CustomEvent<boolean>).detail).toBe(true);
  });
});
