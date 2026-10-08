import { arrayToOptions, moveItem } from './array';

describe('arrayToOptions', () => {
  test('转成 { label, value } 列表', () => {
    expect(arrayToOptions([ 'a', 'b' ])).toEqual([
      { label: 'a', value: 'a' },
      { label: 'b', value: 'b' },
    ]);
  });
});

describe('moveItem', () => {
  test('把元素移到后面 (原列表不被修改)', () => {
    const src = [ 'a', 'b', 'c' ];
    expect(moveItem(src, 0, 2)).toEqual([ 'b', 'c', 'a' ]);
    expect(src).toEqual([ 'a', 'b', 'c' ]);
  });

  test('把元素移到前面', () => {
    expect(moveItem([ 'a', 'b', 'c' ], 2, 0)).toEqual([ 'c', 'a', 'b' ]);
  });

  test('位置相同 / 越界时原样返回', () => {
    const src = [ 'a', 'b' ];
    expect(moveItem(src, 1, 1)).toEqual([ 'a', 'b' ]);
    expect(moveItem(src, -1, 0)).toEqual([ 'a', 'b' ]);
    expect(moveItem(src, 0, 9)).toEqual([ 'a', 'b' ]);
    expect(moveItem([], 0, 0)).toEqual([]);
  });
});
