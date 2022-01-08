import * as hlib from "/lib/bitburner-hacking-lib.js";
import * as flib from "/lib/formatting-lib.js";

/** @param {NS} ns **/
export async function main(ns) {
	const servers = await hlib.getServers(ns);
	const data = {};
	const scripts = {};
	let rootedServers = 0;
	let rootedRam = 0;
	let allRam = 0;
	let usedRam = 0;
	// analyse each server that has ram and is rooted
    for (const s of servers) {
		hlib.tryToRoot(ns, s);
		data[s] = {
			root: ns.hasRootAccess(s),
			ram: ns.getServerMaxRam(s),
			ramUsed: ns.getServerUsedRam(s),
		}
		// ram analysis
		allRam += data[s].ram;
		usedRam += data[s].ramUsed;
		if (data[s].root) {
			rootedServers++;
			rootedRam += data[s].ram;
			// script analysis (name -> args -> threads/ram)
			for (let script of ns.ps(s)) {
				if (script.filename.match(/status-scripts.js/)) continue;
				if (!(script.filename in scripts))
					scripts[script.filename] = {};
				// daemon-wgh scripts usually use a second argument to be able to start multiple scripts
				let argString = (script.filename.match(/(early_)|(daemon-wgh-).*\.js/g)) // TODO: new names
					? script.args[0]
					: script.args.toString();
				if (!(argString in scripts[script.filename]))
					scripts[script.filename][argString] = {
						threads: 0,
						instances: 0,
						ram: ns.getScriptRam(script.filename, "home"),
					};
				// count total threads for this script
				scripts[script.filename][argString].threads += script.threads;
				scripts[script.filename][argString].instances++;
			}
		}
	}
	// output data to terminal
	const out = [""];
	out.push("-".repeat(100));
	for (const row of flib.tableSpaces([
			{ title: "rooted servers:", a: rootedServers,               b: servers.length },
			{ title: "rooted ram:",     a: flib.formatRamBB(rootedRam), b: flib.formatRamBB(allRam) },
			{
				title: "used ram:",
				a: flib.formatRamBB(usedRam),
				b: flib.formatRamBB(rootedRam),
				extra: `, free: ${flib.formatRamBB(rootedRam-usedRam)} (${(100.0-100.0*usedRam/rootedRam).toFixed(1)}%)`
			},
	], {align: {a: "right"}})) {
		out.push(`| ${row.title} ${row.a} / ${row.b}${row.extra}`);
	}
	out.push("| running scripts:");
	let toFormat = [];
	for (let scName in scripts) {
		for (let args in scripts[scName]) {
			let sc = scripts[scName][args];
			let scriptRamTotalPercent = (Math.round(1000.0 * sc.ram / usedRam * sc.threads) * 0.1).toFixed(1);
			toFormat.push({
				name: scName,
				args: `[${args}]`,
				threadCount: sc.threads,
				ramPercent: scriptRamTotalPercent,
				instances: sc.instances
			});
		}
	}
	for (const row of flib.tableSpaces(toFormat)) {
		out.push(`|\t${row.name} ${row.args}  -t ${row.threadCount}  ${row.ramPercent}% of used RAM`
			+ (row.instances > 1 ? `, ${row.instances} instances` : ""));
	}
	out.push("| underused servers:");
	toFormat = [];
	for (const s of servers) {
		if (data[s].root && (data[s].ram - data[s].ramUsed) >= 1.7)
			toFormat.push({
				name: s,
				ramAvailable: flib.formatRamBB(data[s].ram - data[s].ramUsed),
				percent: `(${(100.0 - 100.0 * data[s].ramUsed / data[s].ram).toFixed(1)}%)`,
			})
	}
	for (const row of flib.tableSpaces(toFormat, {align: {percent: "right", ramAvailable: "ram"}})) {
		out.push(`|\t${row.name} : ${row.ramAvailable} free RAM ${row.percent}`);
	}
	out.push("-".repeat(100));
	ns.tprint(out.join("\n"));
}
