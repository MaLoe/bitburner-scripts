/** @param {NS} ns **/
export async function main(ns) {
    const target = ns.args[0].toString();
    while (true) await ns.hack(target);
}