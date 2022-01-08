/**
 * @module hacknet-daemon
 */

const TICK_TIME = 5.0; // purchase loop every 5 seconds

/**
 * @param {number} availableMoney
 * @param {number} currentProduction
 */
function getThreshhold(availableMoney, currentProduction) {
	// spend at least 100k per loop
	// spend at least current money/s per second
	// spend at least 1% of current overall money
	return Math.max(1e5, TICK_TIME * currentProduction, 0.001 * availableMoney);
}

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");

	while (true) {
		// get current production and calculate spending threshhold
		let overallProduction = 0;
		for (let i = 0; i < ns.hacknet.numNodes(); i++) {
			let stats = ns.hacknet.getNodeStats(i);
			overallProduction += stats.production;
		}
		let threshhold = getThreshhold(ns.getServerMoneyAvailable("home"), overallProduction);
		let overallCost = 0;
		let pre = null;
		// buy stuff as long as we can buy something and as long as it's under purchase threshhold
		while (pre != overallCost) {
			pre = overallCost;
			// buy new node if possible
			if ( ns.hacknet.numNodes() < ns.hacknet.maxNumNodes()
					&& overallCost + ns.hacknet.getPurchaseNodeCost() < threshhold) {
				overallCost += ns.hacknet.getPurchaseNodeCost();
				ns.hacknet.purchaseNode();
			}
			// upgrade nodes if possible
			for (let i = 0; i < ns.hacknet.numNodes(); i++) {
				if ((overallCost + ns.hacknet.getCoreUpgradeCost(i, 1)) < threshhold) {
					overallCost += ns.hacknet.getCoreUpgradeCost(i, 1);
					ns.hacknet.upgradeCore(i, 1);
				}
				if ((overallCost + ns.hacknet.getRamUpgradeCost(i, 1)) < threshhold) {
					overallCost += ns.hacknet.getRamUpgradeCost(i, 1);
					ns.hacknet.upgradeRam(i, 1);
				}
				if ((overallCost + ns.hacknet.getLevelUpgradeCost(i, 1)) < threshhold) {
					overallCost += ns.hacknet.getLevelUpgradeCost(i, 1);
					ns.hacknet.upgradeLevel(i, 1);
				}
			}
		}
		if (overallCost == 0) {
			await ns.sleep(30000); // sleep for some more time if nothing was bought
		} else {
			await ns.sleep(1000 * TICK_TIME);
			ns.print(`spend: ${Math.round(overallCost)}/${Math.round(threshhold)} at ${Math.round(overallProduction)} $/s`);
		}
	}
}