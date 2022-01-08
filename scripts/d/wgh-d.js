import * as hlib from "/lib/bitburner-hacking-lib.js";

/** @param {NS} ns **/
export async function main(ns) {
    // TODO: spawn hackexp threads (more hackexp when player level low)
	// TODO: spawn weaken threads (or daemon) -> weakens all servers continously
	// TODO: spawn wgh threads

	// TODO: maybe maka a balance based on server money and the currently hackable servers (based on money/s, as time still needs to be a factor)
	// example server a: 150b, b: 10b, c: 1b -> 150/10/1 ratio, like 15 simplewgh on a, 1 simplewgh on both b and c
	
	const privateServerTag = "privates_hackexp_";
	const privateMaxRam = ns.getPurchasedServerMaxRam();
    const privateServers = ns.getPurchasedServers();
	// TODO: purchase/upgrade private servers

	const targetExp = "foodnstuff";
	const script = "/wgh/hack.js";
	const scriptRam = ns.getScriptRam(script, "home");

	let servers = await hlib.getServers(ns);
	for (const serverName of servers) {
		if (serverName === "home") continue;
		hlib.tryToRoot(ns, serverName);
		await cleanup(ns, serverName); // TODO: this is only temporary
		const ramAvailable = ns.getServerMaxRam(serverName) - ns.getServerUsedRam(serverName);
		if (ns.hasRootAccess(serverName) && ramAvailable >= scriptRam) {
			// get max threads for script possible here
			let numThreads = Math.floor(ramAvailable / scriptRam);

			await startScript(ns, serverName, script, {threads: numThreads, args: [targetExp]});
		}
	}
}

/**
 * @param {NS} ns *
 * @param {string} serverName
 */
async function cleanup(ns, serverName) {
	//if (ns.scriptRunning(script, serverName)) {
	ns.killall(serverName); // TODO: check if ram full -> don't kill
	while (ns.ps(serverName).length) {
		ns.tprint("waiting for killall() on " + serverName);
		await ns.sleep(100);
	}
	//}
}

/**
 * @param {NS} ns *
 * @param {string} serverName
 * @param {string} script
 */
async function startScript(ns, serverName, script, {threads=1, args=[]}={}) {
	if (!ns.fileExists(script, serverName)) {
		await ns.scp(script, "home", serverName);
	}
	ns.tprint(`starting ${script} on ${serverName} with -t ${threads} ${args}`);
	ns.exec(script, serverName, threads, ...args);
}