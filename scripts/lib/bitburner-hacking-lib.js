/** @module hacklib */

/** @param {NS} ns **/
export function getServers(ns) {
    const maxServerLookup = 1000;
	const seen = new Set(["home"]);
    const serversQueue = new Set(ns.scan("home"));
    let lookups = 0; // infinite loop break
    // go through not seen yet servers, scan for more servers
    while (serversQueue.size > 0 && lookups < maxServerLookup) {
        const s = Array.from(serversQueue.values())[0];
        seen.add(s);
        lookups++;
        for (const next of ns.scan(s)) {
            if (!seen.has(next)) serversQueue.add(next);
        }
        serversQueue.delete(s);
	}
    if (lookups >= maxServerLookup) {
        ns.tprint("WARNING maxServerLookup reached");
    }
    return Array.from(seen.values()); // some things didn't work with sets
}

/**
 * @param {NS} ns *
 * @param {string} serverName
 */
export function tryToRoot(ns, serverName) {
	if (!ns.hasRootAccess(serverName)) {
		let ports = 0;
		const portsRequired = ns.getServerNumPortsRequired(serverName);
		if (ns.fileExists("BruteSSH.exe", "home"))  { ns.brutessh(serverName);  ports++; }
		if (ns.fileExists("FTPCrack.exe", "home"))  { ns.ftpcrack(serverName);  ports++; }
		if (ns.fileExists("relaySMTP.exe", "home")) { ns.relaysmtp(serverName); ports++; }
		if (ns.fileExists("HTTPWorm.exe", "home"))  { ns.httpworm(serverName);  ports++; }
		if (ns.fileExists("SQLInject.exe", "home")) { ns.sqlinject(serverName); ports++; }
		if (ports >= portsRequired && ns.fileExists("NUKE.exe", "home")) {
			ns.nuke(serverName);
            return true;
		}
        return false;
	}
    return true;
}