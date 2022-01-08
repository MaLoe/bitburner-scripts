/** @param {NS} ns **/
export async function main(ns) {
	const daemons = [
		"/d/hacknet-d.js", // automatically upgrades hacknet nodes
		"/d/wgh-d.js",     // manages weaken/grow/hack threads
	];

	for (let d of daemons) {
		let pid = ns.run(d);
		if (pid)
			ns.tprint(`started ${d}:${pid}`);
		else
			ns.tprint(`ERROR couldn't start ${d}`);
	}
}