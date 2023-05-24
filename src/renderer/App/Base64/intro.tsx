const Base64Intro = () => {
  return (
    <div style={ { "overflowY": "scroll","height": "300px" }}>
<h2>编码方式</h2>
<blockquote><p>base64编码是一种常见的编码方式，主要用于对8bit的字节进行编码</p>
</blockquote>
<ul>
<li><p>把三个字节作为一组，转化为二进制的形式，一共3*8=24个二进制位。例如： abc 三个字符用ASCII编码，转换为二进制： </p>
<pre><code>a b c   =&gt;  01100001 01100010 01100011
</code></pre>
</li>
<li><p>把24个二进制数字每6个一组，分为4组 </p>
<pre><code>011000 010110 001001 100011
</code></pre>
</li>
<li><p>按照表格(下方)，把每组二进制串转为对应字符 </p>
<pre><code>011000 010110 001001 100011 =&gt; Y W J j
</code></pre>
</li>

</ul>
<h2>编码表</h2>
<figure><table>
<thead>
<tr><th>码值</th><th>BIN</th><th>字符</th><th>码值</th><th>BIN</th><th>字符</th><th>码值</th><th>BIN</th><th>字符</th><th>码值</th><th>Bin</th><th>字符</th></tr></thead>
<tbody><tr><td>0</td><td>0000 0000</td><td>A</td><td>16</td><td>0001 0000</td><td>Q</td><td>32</td><td>0010 0000</td><td>g</td><td>48</td><td>0011 0000</td><td>w</td></tr><tr><td>1</td><td>0000 0001</td><td>B</td><td>17</td><td>0001 0001</td><td>R</td><td>33</td><td>0010 0001</td><td>h</td><td>49</td><td>0011 0001</td><td>x</td></tr><tr><td>2</td><td>0000 0010</td><td>C</td><td>18</td><td>0001 0010</td><td>S</td><td>34</td><td>0010 0010</td><td>i</td><td>50</td><td>0011 0010</td><td>y</td></tr><tr><td>3</td><td>0000 0011</td><td>D</td><td>19</td><td>0001 0011</td><td>T</td><td>35</td><td>0010 0011</td><td>j</td><td>51</td><td>0011 0011</td><td>z</td></tr><tr><td>4</td><td>0000 0100</td><td>E</td><td>20</td><td>0001 0100</td><td>U</td><td>36</td><td>0010 0100</td><td>k</td><td>52</td><td>0011 0100</td><td>0</td></tr><tr><td>5</td><td>0000 0101</td><td>F</td><td>21</td><td>0001 0101</td><td>V</td><td>37</td><td>0010 0101</td><td>l</td><td>53</td><td>0011 0101</td><td>1</td></tr><tr><td>6</td><td>0000 0110</td><td>G</td><td>22</td><td>0001 0110</td><td>W</td><td>38</td><td>0010 0110</td><td>m</td><td>54</td><td>0011 0110</td><td>2</td></tr><tr><td>7</td><td>0000 0111</td><td>H</td><td>23</td><td>0001 0111</td><td>X</td><td>39</td><td>0010 0111</td><td>n</td><td>55</td><td>0011 0111</td><td>3</td></tr><tr><td>8</td><td>0000 1000</td><td>I</td><td>24</td><td>0001 1000</td><td>Y</td><td>40</td><td>0010 1000</td><td>o</td><td>56</td><td>0011 1000</td><td>4</td></tr><tr><td>9</td><td>0000 1001</td><td>J</td><td>25</td><td>0001 1001</td><td>Z</td><td>41</td><td>0010 1001</td><td>p</td><td>57</td><td>0011 1001</td><td>5</td></tr><tr><td>10</td><td>0000 1010</td><td>K</td><td>26</td><td>0001 1010</td><td>a</td><td>42</td><td>0010 1010</td><td>q</td><td>58</td><td>0011 1010</td><td>6</td></tr><tr><td>11</td><td>0000 1011</td><td>L</td><td>27</td><td>0001 1011</td><td>b</td><td>43</td><td>0010 1011</td><td>r</td><td>59</td><td>0011 1011</td><td>7</td></tr><tr><td>12</td><td>0000 1100</td><td>M</td><td>28</td><td>0001 1100</td><td>c</td><td>44</td><td>0010 1100</td><td>s</td><td>60</td><td>0011 1100</td><td>8</td></tr><tr><td>13</td><td>000 1101</td><td>N</td><td>29</td><td>0001 1101</td><td>d</td><td>45</td><td>0010 1101</td><td>t</td><td>61</td><td>0011 1101</td><td>9</td></tr><tr><td>14</td><td>0000 1110</td><td>O</td><td>30</td><td>0001 1110</td><td>e</td><td>46</td><td>0010 1110</td><td>u</td><td>62</td><td>0011 1110</td><td>+</td></tr><tr><td>15</td><td>0000 1111</td><td>P</td><td>31</td><td>0001 1111</td><td>f</td><td>47</td><td>0010 1111</td><td>v</td><td>63</td><td>0011 1111</td><td>/</td></tr></tbody>
</table></figure>
<h2>特殊处理(字节数不能被三整除时的)</h2>
<blockquote><p>如果需要编码的字节不能被3整除怎么办？比如最后剩下一个单字节(如:a)，或者双字节(如:ab)。这时候我们需要特殊处理</p>
</blockquote>
<ol>
<li>不足6个二进制位的补0</li>
<li>不足4组的，最后补字符串(=)</li>

</ol>
<h3>单字节处理 </h3>
<ul>
<li><p>1 拆解二进制</p>
<pre><code>a  =&gt; 01100001 =&gt; 011000 01
</code></pre>
</li>
<li><p>2 补0</p>
<pre><code>011000 01  =&gt; 011000 010000 =&gt; 24 16
</code></pre>
</li>
<li><p>3 不足4组,补=符号</p>
<pre><code>24 16 =&gt; YQ  =&gt; YQ==
</code></pre>
</li>

</ul>
<h3>双字节处理 </h3>
<ul>
<li><p>1 拆解二进制</p>
<pre><code>ab =&gt; 01100001 01100010 =&gt; 011000 010110 0010
</code></pre>
</li>
<li><p>2 补0</p>
<pre><code>011000 010110 0010  =&gt; 011000 010110 001000 =&gt; 24 22 8
</code></pre>
</li>
<li><p>3 不足4组,补=符号</p>
<pre><code>24 22 8 =&gt; YWI  =&gt; YWI=
</code></pre>
</li>

</ul>
    </div>
  );
}

export default Base64Intro;