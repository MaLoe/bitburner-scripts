/** @param {NS} ns **/
export async function main(ns) {
    if (!ns.gang.inGang()) {
        ns.tprint("ERROR not in a gang, exit");
        ns.exit();
    }
    if (ns.gang.getGangInformation().isHacking) {
        ns.tprint("WARNING script is written for combat gangs for now");
    }

    ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");

    while (true) {
        const members = ns.gang.getMemberNames();
        const budget = getBudget(ns);
        let moneySpend = 0;

        // recruit members if possible   
        while (ns.gang.canRecruitMember()) {
            const newname = "BOB_" + (members.length + 1).toString();
            ns.gang.recruitMember(newname);
        }

        // ascend
        for (let m of members) {
            const minfo = ns.gang.getMemberInformation(m);
            if (minfo.task.match(/train combat/gi)) {
                // TODO: don't ascend someone who's about to stop training
                // ascend everyone who's training and gets a 1.2 multiplier or more
                const ar = ns.gang.getAscensionResult(m);
                if (ar) {
                    const combatMulti = 0.25 * (ar.str + ar.def + ar.dex + ar.agi);
                    if (combatMulti > 1.2) {
                        ns.print("INFO ascending: ", m);
                        ns.gang.ascendMember(m);
                    }
                }
            }
        }

        // buy augments
        const combatAugments = getCombatAugments(ns);
        for (let m of members) {
            const minfo = ns.gang.getMemberInformation(m);
            for (let em of combatAugments) {
                if (!minfo.augmentations.includes(em)) {
                    let cost = ns.gang.getEquipmentCost(em);
                    // if (cost <= (budget - moneySpend)) {
                    if (cost <= ns.getServerMoneyAvailable("home")) {
                        ns.gang.purchaseEquipment(m, em);
                        moneySpend += cost;
                    }
                }
            }
        }

        // buy equipment
        const combatGear = getCombatGear(ns);
        for (let m of members) {
            const minfo = ns.gang.getMemberInformation(m);
            for (let em of combatGear) {
                if (!minfo.upgrades.includes(em)) {
                    let cost = ns.gang.getEquipmentCost(em);
                    if (cost <= (budget - moneySpend)) {
                        ns.gang.purchaseEquipment(m, em);
                        moneySpend += cost;
                    }
                }
            }
        }

        // balance tasks TODO

        // teritorial wars TODO

        // TODO: only train members to a certain point and then train the others
        await ns.sleep(2000);
    }
}

/** @param {NS} ns **/
function getBudget(ns) {
    // TODO what's the game cycle? 20s?
    return Math.max(
        0.5 * ns.gang.getGangInformation().moneyGainRate * 100.0,
        0.01 * ns.getServerMoneyAvailable("home")
    );
}

/** budget to spend per loop: max( 10x $/s | 1% of player budget) **/
/** @param {NS} ns **/
function getCombatGear(ns) {
    // ns.tprint(equipmentName, " - ", ns.gang.getEquipmentStats(equipmentName), " ", ns.gang.getEquipmentCost(equipmentName), " ", ns.gang.getEquipmentType(equipmentName));
    const res = [];
    for (let equipmentName of ns.gang.getEquipmentNames()) {
        let stats = ns.gang.getEquipmentStats(equipmentName);
        if ((stats.agi || stats.dex || stats.str || stats.def)
                && ns.gang.getEquipmentType(equipmentName) != "Augmentation") {    
            res.push(equipmentName);
        }
    }
    return res;
}

/** @param {NS} ns **/
function getCombatAugments(ns) {
    const res = [];
    for (let equipmentName of ns.gang.getEquipmentNames()) {
        let stats = ns.gang.getEquipmentStats(equipmentName);
        if ((stats.agi || stats.dex || stats.str || stats.def)
                && ns.gang.getEquipmentType(equipmentName) == "Augmentation") {    
            res.push(equipmentName);
        }
    }
    return res;
}