import * as hlib from "/lib/bitburner-hacking-lib.js";
import * as flib from "/lib/formatting-lib.js";

/** @param {NS} ns **/
export async function main(ns) {
    let servers = await hlib.getServers(ns);
    // ns.tprint(servers.length, " Servers:\n", servers);
	let data = [];
    for (let s of servers) {
		hlib.tryToRoot(ns, s);
		// let moneyAvail = ns.getServerMoneyAvailable(s);
		let moneyMax = ns.getServerMaxMoney(s);
		// let secCurrent = ns.getServerSecurityLevel(s);
		let secMin = ns.getServerMinSecurityLevel(s);
		let hackLvlReq = ns.getServerRequiredHackingLevel(s);
		
		if (moneyMax > 0) {
			const secPerHackThread = ns.hackAnalyzeSecurity(1);
			let d = {
				n: s,
				// moneyAvail,
				moneyMax,
				// secCurrent,
				secMin,
				hackLvlReq
			};

			d.nHackThreads = 100; // TODO: should be based on how much money the server has, as it's gonna need more time to grow everything back from 0

			if (ns.fileExists("Formulas.exe", "home")) {
				const nsfh = ns.formulas.hacking;
				const p = ns.getPlayer();
				const sObj = ns.getServer(s);
				sObj.hackDifficulty = sObj.minDifficulty; // do calculations with server at min security
				// sObj.hackDifficulty = 100; // max difficulty
				d.nWeakenTime = nsfh.weakenTime(sObj, p); // in ms
				d.nGrowTime = nsfh.growTime(sObj, p); // in ms
				d.nHackTime = nsfh.hackTime(sObj, p); // in ms
				const hackExp = nsfh.hackExp(sObj, p);
				d.nExpPerSecond = (Math.round(hackExp / (d.nHackTime) * 1e5) * 0.01).toFixed(2);
				let hackPercent = nsfh.hackPercent(sObj, p);
				let hackChance = nsfh.hackChance(sObj, p);
				let moneyPerHack = moneyMax * hackPercent * hackChance * d.nHackThreads;
				d.nMoneyPerSecond = Math.round(moneyPerHack / (d.nHackTime * 0.001));
			} else {
				// based on current security etc.
				d.nWeakenTime = ns.getWeakenTime(s); // in ms
				d.nGrowTime = ns.getGrowTime(s); // in ms
				d.nHackTime = ns.getHackTime(s); // in ms
				let hackPercent = ns.hackAnalyze(s);
				let hackChance = ns.hackAnalyzeChance(s);
				let moneyPerHack = moneyMax * hackPercent * hackChance * d.nHackThreads;
				d.nMoneyPerSecond = Math.round(moneyPerHack / (d.nHackTime * 0.001));
			}

			if (!ns.hasRootAccess(s)) {
				d.nMoneyPerSecond = null;
			} else if (d.nMoneyPerSecond > 0) {
				const moneyToGrowPerCall = d.nGrowTime * 0.001 * d.nMoneyPerSecond;
				d.nGrowThreads = Math.ceil(ns.growthAnalyze(s, 1.0 + moneyToGrowPerCall/moneyMax, 1));
				let hackSecurityIncreasePerSecond = ns.hackAnalyzeSecurity(d.nHackThreads) / (d.nHackTime * 0.001);
				let growSecurityIncreasePerSecond = ns.growthAnalyzeSecurity(d.nGrowThreads) / (d.nGrowTime * 0.001);
				let weakenEffect = ns.weakenAnalyze(1); // default 0.05 per single thread & call
				let weakenCallsPerSecond = Math.ceil((hackSecurityIncreasePerSecond + growSecurityIncreasePerSecond) / weakenEffect);
				d.nWeakenThreads = Math.ceil(weakenCallsPerSecond * (d.nWeakenTime * 0.001));
			}

			data.push(d);
		}
		// TODO: what about cores?
	}
	// sort & output table
	data.sort((a,b) => a.nMoneyPerSecond - b.nMoneyPerSecond); // TODO: should be "money/s per GB"
	// output data to terminal
	const out = [""];
	out.push("-".repeat(100));
	for (const row of flib.tableSpaces(data)) {
		out.push("| " + [
			row.n, row.moneyMax, row.secMin, row.hackLvlReq,
			row.nWeakenTime, row.nGrowTime, row.nHackTime, row.nMoneyPerSecond,
			row.nHackThreads, row.nGrowThreads, row.nWeakenThreads,
			row.nExpPerSecond
		].join(" | "));
	}
	out.push("-".repeat(100));
	ns.tprint(out.join("\n"));
}
