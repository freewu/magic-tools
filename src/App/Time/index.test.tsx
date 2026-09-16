import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Time from './index';
import { bdtTimeOf, gpsTimeOf, gstTimeOf } from './lib';

// 固定"现在", 让 data.ts 的 timeList 与结果稳定
beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date('2026-09-16T10:20:30'));
});
afterAll(() => jest.useRealTimers());

const cardOf = (title: string): HTMLElement => {
  const heading = screen.getByText(title);
  const card = heading.closest('.ant-card') as HTMLElement | null;
  if (!card) throw new Error(`未找到分组框: ${title}`);
  return card;
};

describe('时间戳转换: GPS / 北斗 / 伽利略 分组', () => {
  it('三个分组框各自渲染, 标题分别为 GPS 时间 / 北斗时间 / 伽利略时间', () => {
    const { container } = render(<Time />);
    expect(container.querySelectorAll('.ant-card').length).toBe(3);
    expect(cardOf('GPS 时间')).toBeInTheDocument();
    expect(cardOf('北斗时间')).toBeInTheDocument();
    expect(cardOf('伽利略时间')).toBeInTheDocument();
  });

  it('每个分组框内有 3 个字段: 周 + 秒 / 周, 秒 / 总秒数', () => {
    render(<Time />);
    for (const title of [ 'GPS 时间', '北斗时间', '伽利略时间' ]) {
      const card = cardOf(title);
      const items = card.querySelectorAll('.ant-form-item');
      expect(items.length).toBe(3);
      expect(within(card).getByText('周 + 秒')).toBeInTheDocument();
      expect(within(card).getByText('周, 秒')).toBeInTheDocument();
      expect(within(card).getByText('总秒数')).toBeInTheDocument();
    }
  });

  it('分组框外不再出现重复的系统名标签, 格洛纳斯 / 儒略日 仍是普通项', () => {
    render(<Time />);
    expect(screen.getAllByText('GPS 时间').length).toBe(1); // 只有分组框标题
    expect(screen.queryByText('GPS 时间 (周,秒)')).toBeNull();
    expect(screen.queryByText('伽利略时间 (总秒)')).toBeNull();
    expect(screen.getByText(/格洛纳斯时间/)).toBeInTheDocument();
    expect(screen.getByText(/儒略日 \(JD\)/)).toBeInTheDocument();
  });

  it('输入时间戳后分组框内给出各系统的周/秒 (与 lib 计算一致)', () => {
    const { container } = render(<Time />);
    const textarea = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '1700000000' } });
    const ms = 1700000000 * 1000;

    const valuesOf = (title: string) => {
      const inputs = Array.from(cardOf(title).querySelectorAll('input')) as HTMLInputElement[];
      return inputs.map((i) => i.value);
    };

    // 每个分组框: [周 + 秒, 周,秒, 总秒数]
    for (const [ title, raw ] of [
      [ 'GPS 时间', gpsTimeOf(ms) ],
      [ '北斗时间', bdtTimeOf(ms) ],
      [ '伽利略时间', gstTimeOf(ms) ],
    ] as const) {
      expect(valuesOf(title)).toEqual([
        `${raw.week} 周 + ${raw.tow} 秒`,
        `${raw.week}, ${raw.tow}`,
        `${raw.total}`,
      ]);
    }
  });
});
