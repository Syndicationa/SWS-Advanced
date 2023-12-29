export const getSolarDate = (date = new Date()) => {
    const start = new Date(2023, 4, 1);
    const today = date;
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  
    let year = ((monthStart.getFullYear() - start.getFullYear())*12)
    year += (monthStart.getMonth() - start.getMonth());
    year += 2123;
  
    const yearLen = monthEnd - monthStart - 1;
    const point = today - monthStart;
    const day = Math.floor((point/yearLen)*(leap(year) ? 366: 365));
    
    const md = convertDay(day)
  
    return [year, md.month, md.day];
}
  
const leap = year => (year % 4 === 0) && (year % 100 !== 0 || year % 400 === 0);
  
const convertDay = (day, leap) => {
    let months = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (leap) months[1] = 29;
    const MonthDay = months.reduce((a, v) => {
        if (!a.search) return a;
        if (a.day <= v) return {...a, search: false};
        return {...a, month: a.month + 1, day: a.day - v}
        }, {month: 1, day, search: true})
    return MonthDay;
}

export const prettyDate = (date = new Date()) => {
    const [y,m,d] = getSolarDate(date);
    return `${y}/${m}/${d}`
}