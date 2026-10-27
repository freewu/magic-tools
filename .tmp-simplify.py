import io, json

P = 'src/App/Help/data.tsx'


def js_list(items):
    return '      [\n' + ',\n'.join('        "%s"' % t for t in items) + ',\n      ],'


def replace_entry(s, version, zh, tw, en):
    # 逐行找该版本的 title 行 (title: tri("YYYY-MM-DD Vx.y.z Release", ...))
    needle = ' %s Release"' % version
    offset = 0
    title_pos = None
    for line in s.split('\n'):
        if line.lstrip().startswith('title: tri("') and needle in line:
            title_pos = offset
            break
        offset += len(line) + 1
    assert title_pos is not None, 'title not found: ' + version

    start = s.index('items: trio(', title_pos)
    open_paren = s.index('(', start)
    depth = 0
    j = open_paren
    while True:
        c = s[j]
        if c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0:
                break
        j += 1
    new = 'items: trio(\n' + js_list(zh) + '\n' + js_list(tw) + '\n' + js_list(en) + '\n    )'
    return s[:start] + new + s[j + 1:]


def main():
    data = json.load(io.open('.tmp-simplify.json', encoding='utf-8'))
    s = io.open(P, encoding='utf-8').read()
    for version, v in data.items():
        s = replace_entry(s, version, v['zh'], v['tw'], v['en'])
        print('ok', version)
    io.open(P, 'w', encoding='utf-8', newline='\n').write(s)


main()
