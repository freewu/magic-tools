export const unitTypeList = [
  { label: '公制', value: 'ms', placeholder: 'metric system'},
  { label: '英制', value: 'iu', placeholder: 'Imperial units'},
  { label: '美制', value: 'us', placeholder: ''},
  { label: '市制', value: 'cn', placeholder: ''},
];

/**
1 美制液量盎司 = 1.8046875	立方英寸 = 29.5735295625 毫升 ounce 
1 美制液量打兰 = 1/8 美制液量盎司 = 3.6966912 毫升 dram 
1 美制茶匙 = 1/6 美制液量盎司 = 4.92892159 毫升 teaspoon
1 美制汤匙 = 1/2 美制液量盎司 = 14.7867648 毫升 tablespoon
1 美制及耳 = 4 美制液量盎司 = 118.294118 毫升 gill
1 美制杯 = 8 美制液量盎司 = 236.588236 毫升 cup
1 美制品脱 = 16 美制液量盎司 = 473.176473 毫升 pint
1 美制夸脱 = 32 美制液量盎司 = 946.352946 毫升 quart
1 美制加仑 = 128 美制液量盎司 = 3785.41178 毫升 gallon

1 立方英寸 = 16.387064 毫升
1 立方英尺 = 28316.8466 毫升
1 立方码 = 764554.858 毫升

1 英制液量盎司 = 28.4130625 毫升 = 1.733871455 立方英寸 = 0.960759940 美制液量盎司
1 英制加仑 = 160 英制液量盎司 = 4 英制夸脱 = 4546.09 毫升
1 英制夸脱 = 40 英制液量盎司 = 2 英制品脱  = 1136.5225 毫升
1 英制品脱 = 20 英制液量盎司= 2 英制杯 = 568.26125 毫升
1 英制杯 = 10 英制液量盎司 = 2 英制及耳= 284.130625 毫升
1 英制及耳 = 5 英制液量盎司 = 10 英制汤匙 = 142.0653125 毫升
1 英制汤匙 = 1/2 英制液量盎司 = 3 英制茶匙 = 14.2065375 毫升
1 英制茶匙 = 1/6 英制液量盎司 = 4.7355125 毫升
1 英制液量打兰 = 1/8 英制液量盎司 = 3.5516328125 毫升
*/

export const typeList = [
  { label: '升', value: 'l', type:'ms', placeholder: '1 升 = 1000 毫升'},
  { label: '毫升',   value: 'ml',  type:'ms', placeholder: '1 升 = 1000 毫升' },
  //{ label: '立方千米', value: 'km3', type:'ms', placeholder: 'km³' },
  { label: '立方米', value: 'm3', type:'ms', placeholder: 'm³ 1 立方米   = 1000000 毫升 = 1000 升' },
  { label: '立方分米', value: 'dm3', type:'ms', placeholder: 'dm³ 1 立方分米 = 1000 毫升 = 1 升' },
  { label: '立方厘米', value: 'cm3', type:'ms', placeholder: 'cm³ 1 立方厘米 = 1 毫升' },
  { label: '立方毫米', value: 'mm3', type:'ms', placeholder: 'mm³ 1 立方毫米 = 0.001 毫升' },

  { label: '盎司 ', value: 'us-ounce', type:'us', placeholder: '1 美制液量盎司 = 1.8046875	立方英寸 = 29.5735295625 毫升 ounce '},
  { label: '加仑 ', value: 'us-gallon', type:'us', placeholder: '1 美制加仑 = 128 美制液量盎司 = 3785.41178 毫升 gallon'},
  { label: '打兰 ', value: 'us-dram', type:'us', placeholder: '1 美制液量打兰 = 1/8 美制液量盎司 = 3.6966912 毫升 dram '},
  { label: '茶匙 ', value: 'us-teaspoon', type:'us', placeholder: '1 美制茶匙 = 1/6 美制液量盎司 = 4.92892159 毫升 teaspoon'},
  { label: '汤匙 ', value: 'us-tablespoon', type:'us', placeholder: '1 美制汤匙 = 1/2 美制液量盎司 = 14.7867648 毫升 tablespoon'},
  { label: '及耳 ', value: 'us-gill', type:'us', placeholder: '1 美制及耳 = 4 美制液量盎司 = 118.294118 毫升 gill'},
  { label: '杯 ', value: 'us-cup', type:'us', placeholder: '1 美制杯 = 8 美制液量盎司 = 236.588236 毫升 cup'},
  { label: '品脱 ', value: 'us-pint', type:'us', placeholder: '1 美制品脱 = 16 美制液量盎司 = 473.176473 毫升 pint'},
  { label: '夸脱 ', value: 'us-quart', type:'us', placeholder: '1 美制夸脱 = 32 美制液量盎司 = 946.352946 毫升 quart'},

  { label: '盎司 ', value: 'iu-ounce', type:'iu', placeholder: '1 英制液量盎司 = 28.4130625 毫升 = 1.733871455 立方英寸 = 0.960759940 美制液量盎司'},
  { label: '加仑 ', value: 'iu-gallon', type:'iu', placeholder: '1 英制加仑 = 160 英制液量盎司 = 4 英制夸脱 = 4546.09 毫升'},
  { label: '打兰 ', value: 'iu-dram', type:'iu', placeholder: '1 英制液量打兰 = 1/8 英制液量盎司 = 3.5516328125 毫升'},
  { label: '茶匙 ', value: 'iu-teaspoon', type:'iu', placeholder: '1 英制茶匙 = 1/6 英制液量盎司 = 4.7355125 毫升'},
  { label: '汤匙 ', value: 'iu-tablespoon', type:'iu', placeholder: '1 英制汤匙 = 1/2 英制液量盎司 = 3 英制茶匙 = 14.2065375 毫升'},
  { label: '及耳 ', value: 'iu-gill', type:'iu', placeholder: '1 英制及耳 = 5 英制液量盎司 = 10 英制汤匙 = 142.0653125 毫升'},
  { label: '杯 ', value: 'iu-cup', type:'iu', placeholder: '1 英制杯 = 10 英制液量盎司 = 2 英制及耳= 284.130625 毫升'},
  { label: '品脱 ', value: 'iu-pint', type:'iu', placeholder: '1 英制品脱 = 20 英制液量盎司= 2 英制杯 = 568.26125 毫升'},
  { label: '夸脱 ', value: 'iu-quart', type:'iu', placeholder: '1 英制夸脱 = 40 英制液量盎司 = 2 英制品脱  = 1136.5225 毫升'},
 
  { label: '立方英寸 ', value: 'iu-inch3', type:'iu', placeholder: '1 立方英寸 = 16.387064 毫升'},
  { label: '立方英尺 ', value: 'iu-foot3', type:'iu', placeholder: '1 立方英尺 = 28316.8466 毫升'},
  { label: '立方码 ', value: 'iu-yard3', type:'iu', placeholder: '1 立方码 = 764554.858 毫升'},

  { label: '石', value: 'dan', type:'cn', placeholder: '1市石 =	10市斗 =	100市升 =	1000市合(gě) =	1,0000勺 =	10,0000撮 =	100升'},
  { label: '斗', value: 'dou', type:'cn', placeholder: '0.1市石 =	1市斗 =	10市升 =	100市合 =	1000勺 =	1,0000撮 = 10升'},
  { label: '升', value: 'sheng', type:'cn', placeholder: '市制容积的基本单位为升，一升合国际单位制一公升，由于两个单位大小一样，所以，国际单位制的公升也简称为升'},
  { label: '合', value: 'he', type:'cn', placeholder: '0.001市石 =	0.01市斗 =	0.1市 =	1市合 =	10勺 =	100撮 =	0.1升'},
  { label: '勺', value: 'shao', type:'cn', placeholder: '0.0001市石 =	0.001市斗 =	0.01市升 =	0.1市合 =	1勺 =	10撮 =	0.01升'},
  { label: '撮', value: 'cuo', type:'cn', placeholder: '0.00001市石 =	0.0001市斗 =	0.001市升 =	0.01市合 =	0.1勺 =	1撮 =	0.001升'},
];