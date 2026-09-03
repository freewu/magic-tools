const intro = `
<h2>XXencode 编码</h2>
<blockquote><p>XXencode 是 UUencode 的改进版：数据分组方式与 UUencode 相同（每 3 字节 -> 4 个 6-bit 值），但改用<strong>不包含空格/控制字符</strong>的 64 字符表，传输更安全、与行宽无关。</p>
</blockquote>
<h2>编码表 (64 字符)</h2>
<figure><table>
<thead><tr><th>码值</th><th>0</th><th>1</th><th>2</th><th>3</th><th>4</th><th>5</th><th>6</th><th>7</th><th>8</th><th>9</th><th>10</th><th>11</th><th>12</th><th>13</th><th>14</th><th>15</th></tr></thead>
<tbody><tr><th>字符</th><td>+</td><td>-</td><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td><td>A</td><td>B</td><td>C</td><td>D</td></tr>
<tr><th>码值</th><td>16</td><td>17</td><td>18</td><td>19</td><td>20</td><td>21</td><td>22</td><td>23</td><td>24</td><td>25</td><td>26</td><td>27</td><td>28</td><td>29</td><td>30</td><td>31</td></tr>
<tr><th>字符</th><td>E</td><td>F</td><td>G</td><td>H</td><td>I</td><td>J</td><td>K</td><td>L</td><td>M</td><td>N</td><td>O</td><td>P</td><td>Q</td><td>R</td><td>S</td><td>T</td></tr>
<tr><th>码值</th><td>32</td><td>33</td><td>34</td><td>35</td><td>36</td><td>37</td><td>38</td><td>39</td><td>40</td><td>41</td><td>42</td><td>43</td><td>44</td><td>45</td><td>46</td><td>47</td></tr>
<tr><th>字符</th><td>U</td><td>V</td><td>W</td><td>X</td><td>Y</td><td>Z</td><td>a</td><td>b</td><td>c</td><td>d</td><td>e</td><td>f</td><td>g</td><td>h</td><td>i</td><td>j</td></tr>
<tr><th>码值</th><td>48</td><td>49</td><td>50</td><td>51</td><td>52</td><td>53</td><td>54</td><td>55</td><td>56</td><td>57</td><td>58</td><td>59</td><td>60</td><td>61</td><td>62</td><td>63</td></tr>
<tr><th>字符</th><td>k</td><td>l</td><td>m</td><td>n</td><td>o</td><td>p</td><td>q</td><td>r</td><td>s</td><td>t</td><td>u</td><td>v</td><td>w</td><td>x</td><td>y</td><td>z</td></tr></tbody>
</table></figure>
<h2>格式说明</h2>
<ul>
<li><p>每行最多编码 45 字节，行首字符 = 编码表[本行字节数]（满行 45 字节时前缀为 <code>h</code>）</p></li>
<li><p>不足 3 字节时末尾补 0 值（编码为 <code>+</code>），解码时按行首计数丢弃补位</p></li>
<li><p>示例：<code>cat</code> → <code>1Mq3o</code>（前缀 '1' = 编码表[3]）</p></li>
</ul>
<h2>说明</h2>
<ul>
<li><p>解码自动跳过经典文件头 <code>begin</code> 与结尾 <code>end</code> 行</p></li>
<li><p>编码结果为文本 (UTF-8)；解码二进制内容时不可打印字节将以替换符显示</p></li>
</ul>
`;

const Intro = () => {
  return <div dangerouslySetInnerHTML={ { __html: intro } } />;
}
export default Intro;
