import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import LatLngConvert from './index';
import { LocaleProvider } from '../../hook/locale-context';

const renderPage = () => render(
  <LocaleProvider>
    <LatLngConvert />
  </LocaleProvider>
);

describe('经纬度格式转换 页面', () => {
  beforeEach(() => localStorage.clear());

  it('输入十进制后展示四种格式结果', () => {
    const { container } = renderPage();
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '39.20567, 116.12345' } });

    expect(screen.getByDisplayValue('39.20567')).toBeInTheDocument();
    expect(screen.getByDisplayValue('116.12345')).toBeInTheDocument();
    expect(screen.getByDisplayValue('39°12′20.41″N')).toBeInTheDocument();
    expect(screen.getByDisplayValue('39°12.3402′N')).toBeInTheDocument();
    expect(screen.getByDisplayValue('3912.3402N')).toBeInTheDocument();
  });

  it('非法输入给出提示', () => {
    const { container } = renderPage();
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '100, 116' } });
    expect(screen.getByText(/纬度超出范围/)).toBeInTheDocument();
  });

  it('清除按钮清空结果', () => {
    const { container } = renderPage();
    const ta = container.querySelector('textarea') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: '39.20567, 116.12345' } });
    fireEvent.click(screen.getByRole('button', { name: /清\s*除/ }));
    expect(container.querySelector('textarea')?.value).toBe('');
    expect(screen.queryByDisplayValue('39.20567')).not.toBeInTheDocument();
  });
});
