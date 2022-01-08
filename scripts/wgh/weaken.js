/** @param {NS} ns **/
export async function main(ns) {
    var target = ns.args[0].toString();
    while (true) await ns.weaken(target);
}