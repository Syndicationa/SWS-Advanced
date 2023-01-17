export const stringify = (func) => {
    let str = "    0 1 2 3 4 5 6 7 8   \n"
    str += "-------------------------\n"
    for (let y = 0; y < 9; y++) {
        str += y + " | "
        for (let x = 0; x < 9; x++) {
            const V = func([x, y]);
            str += V + " ";// ? "x":" ";
        }
        str += `| ${y}\n`;
    }
    str +="-------------------------\n"
    str +="    0 1 2 3 4 5 6 7 8   "
    return str
}