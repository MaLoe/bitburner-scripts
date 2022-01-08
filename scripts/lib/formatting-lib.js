/** @module formatlib */

/**
 * @param {number} n
 * @returns {string}
 */
export function formatMoney(n) {
    // format to k/m/b/t with 3 decimal points
    // TODO: fix negative numbers
    if (n < 1e3)  return n.toString();
    if (n < 1e6)  return (n / 1e3) .toFixed(3) + "k";
    if (n < 1e9)  return (n / 1e6) .toFixed(3) + "m";
    if (n < 1e12) return (n / 1e9) .toFixed(3) + "b";
    if (n < 1e15) return (n / 1e12).toFixed(3) + "t";
    return Math.round(n).toString(); // fallback
}

/**
 * @param {number} n
 * @returns {string}
 */
export function formatBigNumber(n) {
    // format to k/m/b/t with 3 decimal points
    if (n < 1e3)  return n.toString();
    if (n < 1e6)  return Math.round(n / 1e3)  + "k";
    if (n < 1e9)  return Math.round(n / 1e6)  + "m";
    if (n < 1e12) return Math.round(n / 1e9)  + "b";
    if (n < 1e15) return Math.round(n / 1e12) + "t";
    return Math.round(n).toString(); // fallback
}

/**
 * @param {number} t
 * @returns {string}
 */
export function formatTime(t) {
    // format to s/m/h/d with 1 decimal point
    if (t < 1000*60)       return (Math.round(t*0.01)*0.1)         .toFixed(1) + "s";
    if (t < 1000*60*60)    return (Math.round(t*0.01/60)*0.1)      .toFixed(1) + "m";
    if (t < 1000*60*60*24) return (Math.round(t*0.01/60/60)*0.1)   .toFixed(1) + "h";
    return                        (Math.round(t*0.01/60/60/24)*0.1).toFixed(1) + "d";
}

/**
 * @param {number} n
 * @returns {string}
 */
export function formatRamBB(n) {
    // according to bitburner/src/ui/numeralFormat.ts, but I like 1 decimal place more
    // no Math.round here, it's ceil
    const removeDecimalZero = (/** @type {string} */ num) => {
        const s = num.toString();
        return s.match(/.*\.0$/) ? s.substring(0, s.length - 2) : s;
    }
    if (n < 1e3)  return removeDecimalZero((n)       .toFixed(1)) + "GB";
    if (n < 1e6)  return removeDecimalZero((n / 1e3) .toFixed(1)) + "TB";
    if (n < 1e9)  return removeDecimalZero((n / 1e6) .toFixed(1)) + "PB";
    if (n < 1e12) return removeDecimalZero((n / 1e9) .toFixed(1)) + "EB";
    return               removeDecimalZero((n * 10.0).toFixed(1)) + "GB";
}

/**
 * TODO: this lib should have 2 main features:
 *   - simple public function(array of objects) -> adds whitespaces
 *   - Class that gets intantiated, fed with data in a loop and than gets called once to get the result
 */

/**
 * @data: array of objects, keys of objects are used as column names
 */
export function tableSpaces(data, {types={}, align={}, header=null}={}) {
    const res = [];
    for (const d of data) res.push({...d});
    // first pass: get max length and format numbers to strings
    let columns = {};
    for (const d of res) {
        for (const [key, value] of Object.entries(d)) {
            if (!(key in columns)) {
                columns[key] = { maxlen: 0 };
            }
            if (value === null || value === undefined) {
                d[key] = "";
            } else {
                if (key.match(/time/gi) && !isNaN(value)) {
                    d[key] = this.formatTime(value); // column has time in name, format it as such
                } else if (!isNaN(value)) {
                    d[key] = this.formatMoney(value); // value is of type number, format it to k/m/b etc
                } else {
                    // default align right (numbers etc), but here we got a column with at least one string -> align left instead
                    if (!align[key]) columns[key].align = "left";
                }
            }
            columns[key].maxlen = Math.max(columns[key].maxlen, d[key].length); // remember max length for space padding
        }
    }
    if (header) {
        const headerRow = {};
        if (header === "auto") {
            for (const k in columns) {
                headerRow[k] = k;
                columns[k].maxlen = Math.max(columns[k].maxlen, k.length);
            }
        } else {
            throw "header type unsupported: " + header;
        }
        res.unshift(headerRow);
    }
    // second pass: add padding to ralign numbers and lalign everything else
    // TODO: don't align header
    for (const d of res) {
        for (const key of Object.keys(columns)) {
            if (d[key]) {
                if (align[key] === "left" || (columns[key].align === "left" && !align[key])) {
                    d[key] = d[key] + " ".repeat(columns[key].maxlen - d[key].length); // lalign space padding
                } else {
                    d[key] = " ".repeat(columns[key].maxlen - d[key].length) + d[key]; // ralign space padding
                }
            } else {
                d[key] = " ".repeat(columns[key].maxlen); // empty/null value
            }
        }
    }
    return res;
}