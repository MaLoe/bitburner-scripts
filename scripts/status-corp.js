/** @param {NS} ns **/

// import * as hlib from "/lib/bitburner-hacking-lib.js";
import * as flib from "/lib/formatting-lib.js";

const divNames = [
	// TODO: rename them to just what the type contains, i.e. "Software"
	"div_soft_1",
	"div_agri_1", // best starter
	"dev_food",
	"dev_tobacco",
	"dev_chem",
	"Computer",
	"Robotics", // seems to be very good for when one can afford 1t$
	"Energy", // material only
	"Healthcare", // product only
	"RealEstate", // product only
	"Mining",
	"Fishing",
	"Pharmaceutical",
	"Utilities",
];

const divNamesProducts = [
	"div_soft_1",
	"dev_food",
	"dev_tobacco",
	"Computer",
	"Healthcare",
	"Robotics",
	"RealEstate",
	"Pharmaceutical",
]

const prodNames = ["prod1", "prod2", "prod3", "prod4", "prod5"];
prodNames.push("uiaeuiae"); // TODO: remove

/**
 * Shares:
 * - sare dividents to 0% -> maximize share price
 * - issiue new shares (alwas max ammount to reduce private shares ammount)
 * - set devidents to 100% -> share price crashing
 * - buy back shares
 * - repeat
 * (this reduces private shares ratio and brings in investment money)
 */

// TODO: go through all produced products/materials
	// - turn TA on if available
	// - set sell/price to MAX/MP

export async function main(ns) {
	const corp = ns.corporation.getCorporation();

	const out = [""];
	out.push("+" + "-".repeat(100));
	out.push(`| ${"=".repeat(40)} ${corp.name} ${"=".repeat(40)}`);
	out.push(`| \$\$\$ ${flib.formatMoney(corp.funds)} + ${flib.formatMoney(corp.revenue - corp.expenses)}/s`
		+ ` (${flib.formatMoney(corp.revenue)}/s-${flib.formatMoney(corp.expenses)}/s)`);
	
	if (corp.public) {
		// TODO: share price and issue share cooldown, total $ to buy back shares
		const sharesMine = flib.formatBigNumber(corp.numShares);
		const sharesMineP = Math.round(100.0 * corp.numShares / corp.totalShares);
		const sharesPrivate = flib.formatBigNumber(corp.totalShares - corp.issuedShares - corp.numShares);
		out.push(`| shares mine ${sharesMine}, private: ${sharesPrivate}, buyback: ${corp.issuedShares}, my shares: ${sharesMineP}%`);
	}
	let toFormat = [];
	out.push("|");
	for (const d of divNames) {
		let division = ns.corporation.getDivision(d);
		// workers stats
		let workers = 0;
		for (let city of division.cities) {
			let office = ns.corporation.getOffice(division.name, city);
			workers += office.employees.length;
		}
		let numProducts = 0;
		let numProductsDev = 0;
		if (divNamesProducts.includes(d)) {
			for (let pn of prodNames) {
				try {
					let p = ns.corporation.getProduct(d, pn);
					if (p.pCost > 0)
						numProducts++;
					else
						numProductsDev++;
				} catch (e) {}
			}
		}
		// warehouse stats
		let warehouseMax = 0;
		let warehouseCurrent = 0;
		for (let city of division.cities) {
			let warehouse = ns.corporation.getWarehouse(division.name, city);
			if (warehouse.sizeUsed >= warehouse.size * 0.9)
				ns.tprint(`WARN warehouse capacity: ${d} ${city}: ${Math.round(warehouse.sizeUsed)}/${Math.round(warehouse.size)}`);
			warehouseMax += warehouse.size;
			warehouseCurrent += warehouse.sizeUsed;
		}
		// push
		if (!divNamesProducts.includes(division.name)) {
			numProducts = null;
			numProductsDev = null;
		}
		toFormat.push({
			division: division.name,
			revenue: (division.lastCycleRevenue - division.lastCycleExpenses),
			"%": Math.round((100.0 * division.lastCycleRevenue - division.lastCycleExpenses) / corp.revenue),
			prod: (Math.round(100.0 * division.prodMult) * 0.01).toFixed(2),
			workrs: workers,
			research: Math.round(division.research),
			cities: division.cities.length,
			wareMax: Math.round(warehouseMax),
			wareNow: Math.round(warehouseCurrent),
			p: numProducts,
			pd: numProductsDev,
		});
	}
	toFormat.sort((a,b) => b.revenue - a.revenue); // sort by highest revenue first
	for (const row of flib.tableSpaces(toFormat, {header: "auto"})) {
		out.push("| " + [
			// TODO: column with # of products
			row.division,
			`${row["%"]}%`,
			`${row.revenue}/s`,
			row.prod,
			row.workrs,
			row.research,
			row.cities,
			`${row.wareNow}/${row.wareMax}`,
			`${row.p},${row.pd}`
		].join(" "));
	}
	out.push("+" + "-".repeat(100));
	ns.tprint(out.join("\n"));
}
