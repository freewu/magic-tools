// 反转字符串
const reverseString = (str :string) :string => {
    return str.split('').reverse().join('');    // or reverse(str.split(''))
}

export {
    reverseString,
}