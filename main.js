var decay = {};
var kaizoCookiesVer = 'v1.1.2'

//additional helper functions
function replaceDesc(name, toReplaceWith) {
	Game.Upgrades[name].baseDesc = toReplaceWith;
	Game.Upgrades[name].desc = toReplaceWith;
	Game.Upgrades[name].ddesc = toReplaceWith;
}
function replaceAchievDesc(name, toReplaceWith) {
	Game.Achievements[name].baseDesc = toReplaceWith;
	Game.Achievements[name].desc = toReplaceWith;
	Game.Achievements[name].ddesc = toReplaceWith;
}
function addLoc(str) {
	locStrings[str] = str;
}
function auraDesc(id, str) {
	addLoc(str);
	Game.dragonAuras[id].desc=loc(str);
}
function cookieChange(name, newPow) {
	if (!Game.Upgrades[name]) { return false; }
	if (!(typeof Game.Upgrades[name].power == 'function')) { Game.Upgrades[name].power = newPow; } else {
		eval('Game.Upgrades["'+name+'"].power='+Game.Upgrades[name].power.toString().replace('var pow=2;', 'var pow='+newPow+';').replace(') pow=3;', ') pow=1.5*'+newPow+';'));
	}
	var flavorText = Game.Upgrades[name].desc.slice(Game.Upgrades[name].desc.indexOf('<q>'), Game.Upgrades[name].desc.length);
	Game.Upgrades[name].desc = loc("Cookie production multiplier <b>+%1%</b>.", newPow)+flavorText;
	Game.Upgrades[name].ddesc = loc("Cookie production multiplier <b>+%1%</b>.", newPow)+flavorText;
	Game.Upgrades[name].baseDesc = loc("Cookie production multiplier <b>+%1%</b>.", newPow)+flavorText;
}
function getVer(str) {
	if (str[0] !== 'v') { return false; }
	str = str.slice(1, str.length);
	str = str.split('.');
	for (let i in str) { str[i] = parseFloat(str[i]); }
	return str;
}
function isv(str) { //"isValid"
	if (typeof str === 'string') { 
		if (str.includes('NaN') || str.includes('undefined')) {
			return false;
		}
	}
	if (isNaN(str)) { return false; }
	if (typeof str === 'undefined') { return false; }
	return true;
}
function selectStatement(str, index, beginningCount) {
	if (index == -1) { return false; }
	var count = 0;
	if (beginningCount) { count = beginningCount; }
	var inited = false;
	var start = index;
	var inStrSingle = false;
	var inStrDouble = false;
	var inStrTemplate = false;
	var inStr = function() { return (inStrSingle || inStrDouble || inStrTemplate); }
	while (true) {
		if (str[index] == '{' && !inStr()) { inited = true; count++; }
		if (str[index] == '}' && !inStr()) { count--; }
		var states = [!inStrSingle && !inStrDouble && !inStrTemplate, inStrSingle && !inStrDouble && !inStrTemplate, !inStrSingle && inStrDouble && !inStrTemplate, !inStrSingle && !inStrDouble && inStrTemplate];
		if (str[index] == "'" && states[0]) { inStrSingle = true; }
		if (str[index] == "'" && states[1]) { inStrSingle = false; }
		if (str[index] == '"' && states[0]) { inStrDouble = true; }
		if (str[index] == '"' && states[2]) { inStrDouble = false; }
		if (str[index] == '`' && states[0]) { inStrTemplate = true; }
		if (str[index] == '`' && states[3]) { inStrTemplate = false; }
		if (count <= 0 && inited) { break; } 
		if (index >= str.length) { break; }
		index++;
	}
	return str.slice(start, index) + '}';
}
function geometricMean(arr) {
	var sum = 0; 
	var amountValid = 0;
	for (let i = 0; i < arr.length; i++) {
		if (arr[i] != 0) { sum += Math.log(arr[i]); amountValid++; }
	} 
	sum /= Math.max(1, amountValid);
	return Math.exp(sum) //wtf is an antilog
}
function avgColors(arr, returnOpacity) {
	//rgba format, a is in terms of 0-1
	var length = 0;
	for (let i in arr) {
		if (typeof arr[i][3] !== 'undefined') { length += arr[i][3]; } else { length += 1; }
	}
	if (length == 0) {
		return (returnOpacity?[0, 0, 0, 0]:[0, 0, 0, 1]);
	}
	var toReturn = [0, 0, 0, 0];
	for (let i in arr) {
		if (typeof arr[i][3] !== 'undefined') {
			toReturn[0] += arr[i][0] * arr[i][3];
			toReturn[1] += arr[i][1] * arr[i][3];
			toReturn[2] += arr[i][2] * arr[i][3];
			toReturn[3] += arr[i][3];
		} else {
			toReturn[0] += arr[i][0];
			toReturn[1] += arr[i][1];
			toReturn[2] += arr[i][2];
			toReturn[3] += 1;
		}
	}
	return [toReturn[0] / length, toReturn[1] / length, toReturn[2] / length, (returnOpacity?Math.min(toReturn[3], 1):1)];
}
function colorCycleFrame(prev, post, fraction) {
	//"prev" and "post" must be arrays with 3 numbers for rgb
	if (typeof prev[3] === 'undefined') { prev[3] = 1; }
	if (typeof post[3] === 'undefined') { post[3] = 1; }
	return [prev[0] * (1 - fraction) + post[0] * fraction, prev[1] * (1 - fraction) + post[1] * fraction, prev[2] * (1 - fraction) + post[2] * fraction, prev[3] * (1 - fraction) + post[3] * fraction];
}

function allValues(checkpoint) {
	if (!decay.DEBUG) { return false; }
	var str = '[DEBUGGING: '+checkpoint+']';
	str += '\nCookies in bank: '+Game.cookies;
	str += '\nCBTA: '+Game.cookiesEarned;
	str += '\nCPS: '+Game.cookiesPs;
	str += '\nDecay general: '+decay.gen;
	str += '\nDecay momentum: '+decay.momentum;
	str += '\n[DEBUGGER OF '+checkpoint+' END]';
	console.log(str);
}

Game.styleSheets = null; 
for (let i in document.styleSheets) { 
	try { if (document.styleSheets[i].cssRules.length > 500) { Game.styleSheets = document.styleSheets[i]; break; } } 
	catch(error) { } 
} 
if (Game.styleSheets === null) { Game.Notify('Unable to inject CSS!', 'Something went wrong. Please contact the mod developers. '); }
function injectCSS(str, index) {
	if (Game.styleSheets === null) { return false; }
	if (typeof index === 'undefined') { index = Game.styleSheets.cssRules.length; }
	Game.styleSheets.insertRule(str, index);
}

let gp = Game.Objects['Wizard tower'].minigame //grimoire proxy
let pp = Game.Objects['Temple'].minigame //pantheon proxy
let gap = Game.Objects['Farm'].minigame //garden proxy
var grimoireUpdated = false;
var gardenUpdated = false;
var pantheonUpdated = false;

Game.registerMod("Kaizo Cookies", { 
	init: function() { 
//Special thanks to Cursed, Yeetdragon, Lookas for helping me with the code, Fififoop for quality control & suggestions, Rubik for suggestions
//and cookiemains for playtesting this mod, you can look at the cookiemains section to see what ideas he suggested

		
		
        // notification!
		Game.Notify(`Oh, so you think comp is too easy?`, `Good luck.<br>Also, look in options for this mod's settings!`, [21,32],10,1);

		// creating custImg variable
		custImg=App?this.dir+"/img.png":"https://raw.githack.com/omaruvu/Kaizo-Cookie/main/modicons.png"

		//overriding notification so some really important notifs can last for any amount of time even with quick notes on
		eval('Game.Notify='+Game.Notify.toString().replace('quick,noLog', 'quick,noLog,forceStay').replace('if (Game.prefs.notifs)', 'if (Game.prefs.notifs && (!forceStay))'));

		/*=====================================================================================
        Decay
        =======================================================================================*/
		//the decay object is declared outside of the mod object for conveience purposes
		//decay: a decreasing multiplier to buildings, and theres a different mult for each building. The mult decreases the same way for each building tho
		decay.mults = []; for (let i in Game.Objects) { decay.mults.push(1); } 
		decay.mults.push(1); //the "general multiplier", is just used for checks elsewhere (and "egg")
		decay.gen = decay.mults[20];
		decay.incMult = 0.04; //decay mult is decreased by this multiplicative every second
		decay.min = 0.15; //the minimum power that the update function uses; the lower it is, the slower the decay will pick up
		decay.momentum = 1; //increases with each game tick, but decreased on certain actions (hardcoded to be at least 1)
		decay.smoothMomentumFactor = 0.2; //some momentum is negated so it isnt very obvious with the log scaling; the less it is, the smoother it will be (not necessarily a good thing as it also delays momentum)
		decay.momentumFactor = 2; //the more this is, the less powerful momentum is (very strongly affects momentum)
		decay.momentumIncFactor = 2.5; //the closer this is to 1, the more that momentum will increase as momentum increases (slightly)
		decay.halt = 1; //simulates decay stopping from clicking
		decay.haltOvertime = 0; //each stop, a fraction of the halt time is added to this; overtime will be expended when the main halt time runs out, but overtime is less effective at stopping decay
		decay.haltOTLimit = 10; //OT stands for overtime
		decay.decHalt = 1; // the amount that decay.halt decreases by every second
		decay.haltFactor = 0.35; //how quickly decay recovers from halt; the more this is, the faster decay recovers from halt
		decay.haltKeep = 0.3; //the fraction of halt time that is kept when halted again
		decay.haltOTDec = 0.25; //"halt overtime decrease", decHalt also applies to overtime (when decHalt is not in effect) but multiplied by this
		decay.haltOTEfficiency = 0.75; //overtime is multiplied by this when calculating its effect on decay
		decay.haltTickingPow = 0.75; //the more it is, the more that the current decay tickspeed will affect decHalt
		decay.haltToMomentumMult = 0.5; //momentum gets multiplied by this amount for each point of halt
		decay.momentumOnHaltBuffer = 2; //for its effect on halting, this amount is negated from it when calcualting
		decay.momentumOnHaltLogFactor = 2; //the more it is, the less momentum will affect halting power
		decay.momentumOnHaltPowFactor = 2; //the less it is, the less momentum will affect halting power
		decay.wrinklerSpawnThreshold = 0.5; //above this decay mult, wrinklers can never spawn regardless of chance
		decay.wrinklerSpawnFactor = 2.5; //the more it is, the slower wrinklers spawn with increased decay
		decay.wrinklerApproachFactor = 2.5; //the more it is, the slower wrinklers approach the big cookie with increased decay
		decay.wcPow = 0.25; //the more it is, the more likely golden cookies are gonna turn to wrath cokies with less decay
		decay.pastCapPow = 0.1; //the power applied to the number to divide the mult if going past purity cap with unshackled purity
		decay.bankedPurification = 0; //multiplier to mult and close 
		decay.times = {
			sinceLastPurify: 100, //unlike decay.momentum, this is very literal and cant really be manipulated like it
			sincePledgeEnd: 100,
			sinceLastAmplify: 200,
			sinceLastHalt: 100
		};
		decay.buffDurPow = 0.5; //the more this is, the more that decay will affect buff duration
		decay.purifyMomentumMult = 2; //multiplied to the amount decrease; deprecated
		decay.haltReverseMomentumFactor = 0.985; //each point of halt called when decay.stop multiplies the momentum with this amount
		decay.haltSubtractMomentum = 1000000; //halting from momentum is divided by this
		decay.cpsList = [];
		decay.exemptBuffs = ['clot', 'building debuff', 'loan 1 interest', 'loan 2 interest', 'loan 3 interest', 'gifted out', 'haggler misery', 'pixie misery', 'stagnant body'];
		decay.gcBuffs = ['frenzy', 'click frenzy', 'dragonflight', 'dragon harvest', 'building buff', 'blood frenzy', 'cookie storm'];
		decay.justMult = 0; //debugging use
		decay.infReached = false;
		decay.unlocked = false;
		if (Game.cookiesEarned > 1000) { decay.unlocked = true; }
		decay.DEBUG = false; //disable or enable the debugger statements
		decay.prefs = {
			ascendOnInf: 1,
			wipeOnInf: 0,
			preventNotifs: {
				initiate: 0,
				achievement: 0,
				purity: 0,
				wrinkler: 0,
				wrath: 0,
				gpoc: 0,
				decayII: 0,
				veil: 0,
				buff: 0,
				multipleBuffs: 0,
				fthof: 0,
				purityCap: 0,
				buildVariance: 0,
				momentum: 0,
				boost: 0,
				autoclicker: 0,
				garden: 0
			},
			widget: 1
		}

		//decay core
		decay.update = function(buildId, tickSpeed) { 
			if (Game.Has('Purity vaccines')) { return decay.mults[buildId]; }
			var c = decay.mults[buildId];
			//split into parts for debugging purposes
    		c *= Math.pow(Math.pow(1 - (1 - Math.pow((1 - decay.incMult / Game.fps), Math.max(1 - c, decay.min))), (Math.max(1, Math.pow(c, (Game.Has('Unshackled Purity'))?0.9:1.2))) - Math.min(Math.pow(decay.halt + decay.haltOvertime * decay.haltOTEfficiency, decay.haltFactor), 1) / (Math.pow(1 + Math.log(Math.max(1, decay.momentum - decay.momentumOnHaltBuffer)) / Math.log(decay.momentumOnHaltLogFactor), decay.momentumOnHaltPowFactor))), tickSpeed);
			return c;
		} 
		decay.updateAll = function() {
			if (Game.cookiesEarned <= 5555) { decay.unlocked = false; return false; } else { decay.unlocked = true; }
			if (decay.momentum < 1) { decay.momentum = 1; }
			var t = decay.getTickspeed();
			var c = decay.update(20, t);
			if (!isFinite(1 / c)) { if (!isNaN(c)) { console.log('Infinity reached. decay mult: '+c); for (let i in decay.mults) { decay.mults[i] = 1 / Number.MAX_VALUE; } decay.infReached = true; } }
			for (let i in decay.mults) {
				decay.mults[i] = c;
			}
			decay.regainAcc();
			decay.momentum = decay.updateMomentum(decay.momentum);
			Game.recalculateGains = 1;	//uh oh
			decay.cpsList.push(Game.unbuffedCps);
			if (decay.cpsList.length > Game.fps * 1.5) {
				decay.cpsList.shift();
			}
			if (Game.pledgeT > 0) {
				var strength = Game.getPledgeStrength();
				decay.purifyAll(strength[0], strength[1], strength[2], 'pledge');
			}
			if (Game.pledgeC > 0) {
				Game.pledgeC--;
				if (Game.pledgeC == 0) {
					Game.Lock('Elder Pledge');
					Game.Unlock('Elder Pledge');
				}
			}
			for (let i in decay.times) {
				decay.times[i]++;
			}
			if (decay.times.sinceLastPurify > 30) { decay.bankedPurification += Game.auraMult('Fierce Hoarder') / (4 * Game.fps * Math.pow(1 + decay.bankedPurification, 0.5)); }
			decay.gen = decay.mults[20];
			Game.updateVeil();
			if (decay.infReached) { decay.onInf(); decay.infReached = false; }
		}
		decay.draw = function() {
			decay.setWidget();
			decay.updateStats();
		}
		decay.updateMomentum = function(m) {
			if (Game.Has('Purity vaccines')) { return m; }
			var mult = decay.getMomentumMult() * Math.pow(1 + decay.incMult, 5) * Math.pow(Math.max(decay.gen, 1), Game.Has('Unshackled Purity')?0.3:0.4) / (20 * Game.fps);
			if (Game.pledgeT > 0) { mult *= 2; }
			m += (Math.log2((m + 1)) * Math.pow(decay.haltToMomentumMult, Math.pow(decay.halt + decay.haltOvertime * decay.haltOTEfficiency, decay.haltFactor)) / Math.log2(decay.momentumIncFactor)) * mult;
			
			return Math.max(1, m);
		}
		decay.getTickspeed = function() {
			var tickSpeed = 1;
			tickSpeed *= decay.getTickspeedMultFromMomentum();
			tickSpeed *= Game.eff('decayRate');
			if (Game.veilOn()) { tickSpeed *= 1 - Game.getVeilBoost(); }
			if (Game.hasGod) {
				var godLvl = Game.hasGod('asceticism');
				if (godLvl == 1) { tickSpeed *= 0.7; }
				else if (godLvl == 2) { tickSpeed *= 0.8; }
				else if (godLvl == 3) { tickSpeed *= 0.9; }
			}
			if (Game.Has('Elder Covenant')) { tickSpeed *= 1.5; }
			tickSpeed *= Math.pow(1.5, Math.max(0, Game.gcBuffCount() - 1));
			if (Game.hasBuff('Storm of creation').arg1) { tickSpeed *= 1 - Game.hasBuff('Storm of creation').arg1; }
			if (Game.hasBuff('Unending flow').arg1) { tickSpeed *= 1 - Game.hasBuff('Unending flow').arg1; }
			if (Game.hasBuff('Stagnant body').arg1) { tickSpeed *= 1 + Game.hasBuff('Stagnant body').arg1; }

			return tickSpeed;
		}
		decay.getTickspeedMultFromMomentum = function() {
			return 1 + (Math.max(Math.log2(decay.momentum * 2), 1) / Math.log2(decay.momentumFactor)) * (1 - 1 / Math.pow(decay.momentum, decay.smoothMomentumFactor));
		}
		decay.getMomentumMult = function() {
			//getTickspeed but for momentum
			var tickSpeed = 1;
			tickSpeed *= (1 - Math.pow(0.9, Math.log10(Math.max(Game.cookiesEarned - 1000000, 1))));
			tickSpeed *= Game.eff('decayMomentum');
			if (Game.veilOn()) { tickSpeed *= 1 - Game.getVeilBoost(); }
			if (Game.hasGod) {
				var godLvl = Game.hasGod('asceticism');
				if (godLvl == 1) { tickSpeed *= 0.7; }
				else if (godLvl == 2) { tickSpeed *= 0.8; }
				else if (godLvl == 3) { tickSpeed *= 0.9; }
			}
			if (Game.hasBuff('Devastation').arg2) { tickSpeed *= Game.hasBuff('Devastation').arg2; }
			if (Game.Has('Elder Covenant')) { tickSpeed *= 1.5; }
			tickSpeed *= Math.pow(2.5, Math.max(0, Game.gcBuffCount() - 1));
			if (Game.hasBuff('Storm of creation').arg1) { tickSpeed *= 1 - Game.hasBuff('Storm of creation').arg1; }
			if (Game.hasBuff('Unending flow').arg1) { tickSpeed *= 1 - Game.hasBuff('Unending flow').arg1; }
			if (Game.hasBuff('Stagnant body').arg1) { tickSpeed *= 1 + Game.hasBuff('Stagnant body').arg1; }
			return tickSpeed;
		}
		decay.purify = function(buildId, mult, close, cap, uncapped) {
			if (decay.mults[buildId] >= cap) { 
				if (!uncapped) { return false; } else {
					mult = 1 + (mult - 1) / Math.pow(decay.mults[buildId] / cap, decay.pastCapPow);
				}
			}
			if (uncapped && decay.mults[buildId] * mult >= cap && !(decay.mults[buildId] >= cap)) {
				mult /= cap / decay.mults[buildId];
				decay.mults[buildId] = cap;
				mult = 1 + (mult - 1) / Math.pow(decay.mults[buildId] / cap, decay.pastCapPow);
			}
			decay.mults[buildId] *= mult;
			if (decay.mults[buildId] >= cap && !uncapped) { 
				decay.mults[buildId] = cap; return true; 	
			}
			if (decay.mults[buildId] < 1) { 
				decay.mults[buildId] *= Math.pow(10, -Math.log10(decay.mults[buildId]) * close);
			}
			if (decay.mults[buildId] > cap && !uncapped) { decay.mults[buildId] = cap; }
		}
		decay.purifyAll = function(mult, close, cap, id) {
			if (typeof id === 'undefined') { id = ''; }
			var u = false;
			if (Game.Has('Unshackled Purity')) { u = true; }
			for (let i in decay.mults) {
				if (decay.purify(i, mult + decay.bankedPurification, 1 - Math.pow(1 / (1 + decay.bankedPurification), 0.5) * (1 - close), cap * (1 + decay.bankedPurification), u)) { decay.triggerNotif('purityCap'); }
			}
			decay.bankedPurification *= 0.5;
			if (id !== 'pledge') { decay.times.sinceLastPurify = 0; }
			if (Game.hasGod) {
				var godLvl = Game.hasGod('creation');
				if (godLvl == 1) {
					Game.gainBuff('creation storm', 4, 0.48);
				} else if (godLvl == 2) {
					Game.gainBuff('creation storm', 16, 0.24);
				} else if (godLvl == 3) {
					Game.gainBuff('creation storm', 64, 0.12);
				}
			}
		}
		decay.refresh = function(buildId, to) { 
   			decay.mults[buildId] = Math.max(to, decay.mults[buildId]);
		}
		decay.refreshAll = function(to) {
			for (let i in decay.mults) {
				decay.refresh(i, to);
			}
			decay.momentum = 1;
			decay.times.sinceLastPurify = 0;
			Game.recalculateGains = 1;
		}
		//stands for "regain acceleration"
		decay.regainAcc = function() { 
			var decHaltMult = Math.pow(Math.max(decay.getTickspeed(), 1), decay.haltTickingPow);
    		decay.halt = Math.max(0, decay.halt - decay.decHalt * decHaltMult / Game.fps);
			if (decay.halt == 0) {
				decay.haltOvertime = Math.max(0, decay.haltOvertime - decay.decHalt * decHaltMult / Game.fps);
			} else {
				decay.haltOvertime = Math.max(0, decay.haltOvertime - (decay.decHalt * decHaltMult * decay.haltOTDec) / Game.fps);
			}
		}
		decay.stop = function(val) {
			decay.halt = val * Game.eff('haltPower');
			decay.momentum = 1 + (decay.momentum - 1) * Math.pow(decay.haltReverseMomentumFactor, Math.log2(Math.max(val * 2, 2) * Game.eff('haltPower')));
			decay.momentum -= Math.log2(Math.max(val * 2, 2) * Game.eff('haltPower')) / decay.haltSubtractMomentum;
			if (decay.momentum < 1) { decay.momentum = 1; }
			decay.haltOvertime = Math.min(decay.halt * decay.haltOTLimit, decay.haltOvertime + decay.halt * decay.haltKeep); 
			decay.times.sinceLastHalt = 0;
		}
		decay.amplify = function(buildId, mult, anticlose) {
			decay.mults[buildId] *= Math.pow(10, -Math.abs(Math.log10(decay.mults[buildId]) * anticlose));
			decay.mults[buildId] *= 1 / mult;
		}
		decay.amplifyAll = function(mult, anticlose) {
			for (let i in decay.mults) {
				decay.amplify(i, mult, anticlose);
			}
			decay.times.sinceLastAmplify = 0;
		}
 		decay.get = function(buildId) {
			return decay.mults[buildId];
		}
		decay.onInf = function() {
			if (decay.prefs.wipeOnInf) { Game.HardReset(2); decay.setRates(); }
			if (decay.prefs.ascendOnInf) { Game.cookiesEarned = 0; Game.Ascend(1); Game.Notify('Infinite decay', 'Excess decay caused a forced ascension without gaining any prestige or heavenly chips.', [21, 25], Game.fps * 3600 * 24 * 365, false, 1); }
		}

		//this is so the player can actually know what is going on
		decay.notifs = {
			initiate: {
				title: 'decay',
				desc: 'Due to aging and corruption in your facilities, CpS continuously decreases over time. You can temporarily stop it from decreasing with certain actions, such as clicking the big cookie; or purify the decay\'s effects by, for example, clicking a Golden or Wrath cookie.<br>To compensate, you get a +700% CpS multiplier that very slowly, decreases over time.',
				icon: [3, 1, custImg],
				pref: 'decay.prefs.preventNotifs.initiate'
			},
			achievement: {
				title: 'Achievements',
				desc: 'Obtaining an achievement also purifies your decay by a very large amount.',
				icon: [5, 6],
				pref: 'decay.prefs.preventNotifs.achievement'
			},
			purity: {
				title: 'Purity',
				desc: 'If you can purify all of your decay, any extra purification power will be spent as an increase in CpS. The extra CpS (called "purity") acts as a sacrifical buffer for the decay; the more purity you have, the quicker the decay will be in eating through them.',
				icon: [2, 1, custImg],
				pref: 'decay.prefs.preventNotifs.purity'
			},
			wrinkler: {
				title: 'Wrinklers',
				desc: 'Wrinklers now spawn if you have a lot of decay, and approaches the cookie faster the more decay you have. They wither a very large amount of CpS each and loses cookies on pop, but if you manage to pop them before they reach the big cookie, your decay gets stopped for much longer than just clicking!<br>Also, the withering affects clicks, unlike in vanilla',
				icon: [19, 8],
				pref: 'decay.prefs.preventNotifs.wrinkler'
			},
			wrath: {
				title: 'Wrath cookies',
				desc: 'Wrath cookies now replaces Golden cookies according to the amount of decay you have when it spawns; the more decay you have, the more often it replaces Golden cookies. Luckily, it still purifies decay the same way as Golden cookies do.',
				icon: [15, 5],
				pref: 'decay.prefs.preventNotifs.wrath'
			},
			gpoc: {
				title: 'Grandmapocalypse', 
				desc: 'The Grandmapocalypse, in the vanilla sense, no longer exists. It has been replaced by the decay mechanic. As well, all other Grandmapocalypse-related items now help you combat the decay.',
				icon: [27, 11],
				pref: 'decay.prefs.preventNotifs.gpoc'
			}, 
			decayII: {
				title: 'decay: the return',
				desc: 'The decay gets stronger as you progress through the game, but you also obtain more items to help you fight it as the game goes on. ',
				icon: [3, 1, custImg],
				pref: 'decay.prefs.preventNotifs.decayII'
			},
			veil: {
				title: 'Shimmering Veil',
				desc: 'While there is no sources to directly examine your Shimmering Veil\'s welldoing, you can infer its health from the brightness of the veil around the big cookie, as well as the particles swirling around it.',
				icon: [9, 10],
				pref: 'decay.prefs.preventNotifs.veil'
			},
			buff: {
				title: 'Buffs under decay',
				desc: 'Positive buffs now run out faster the more decay you have accumulated. Stay vigilant!<br>(This uses the current amount of decay, which means that any decay accumulated before the buff was obtained will also contribute to the buff running out faster)',
				icon: [22, 6],
				pref: 'decay.prefs.preventNotifs.buff'
			},
			multipleBuffs: {
				title: 'Buff stacking',
				desc: 'Stacking more than one Golden cookie buff slightly increases your rate of decay, but especially increases the decay\'s momentum.',
				icon: [23, 6],
				pref: 'decay.prefs.preventNotifs.multipleBuffs'
			},
			fthof: {
				title: 'Force the Hand of Fate',
				desc: 'Notice: Force the Hand of Fate has had two effects removed from its pool (namely, building special and elder frenzy). Successful casts also have a chance to yield clot, ruin, and cursed finger. Planners may not be accurate.<br>(Also, Golden cookies spawned by it does not purify decay.)',
				icon: [22, 11],
				pref: 'decay.prefs.preventNotifs.fthof'
			},
			purityCap: {
				title: 'Purity limit',
				desc: 'All methods of purification have a hard limit on how much purity they can apply. This limit varies per the method.<br>(Telling you this because you just reached a purity limit)',
				icon: [2, 1, custImg],
				pref: 'decay.prefs.preventNotifs.purityCap'
			},
			buildVariance: {
				title: 'Building size',
				desc: 'You might know that your amount of buildings affect decay, but did you know that the buildings\' size affects it too? The more space that a building would take up lore-wise, the more decay it contributes.',
				icon: [2, 6],
				pref: 'decay.prefs.preventNotifs.buildVariance'
			},
			momentum: {
				title: 'Decay momentum',
				desc: 'If you don\'t do anything about the decay for a while, the rate of growth will start to slowly increase and your clicks will get less effective at stopping decay; this is momentum. Unlike decay itself, purifying decay CANNOT reverse momentum; however, halting decay such as via clicking the big cookie, can halt its growth and even (very slowly) reverse its momentum!',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.momentum'
			},
			boost: {
				title: 'Purity boosts',
				desc: 'Some upgrades decrease your decay, but not all decreases decrease the same thing! There are three main ways:<br>"Decay rate" - The amount of decay that gets generated per second<br>"Decay momentum" - The decay momentum, which increases the decay rate if the decay is left uninterrupted<br>"Decay propagation" - Decay rates AND decay momentum',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.boost'
			},
			autoclicker: {
				title: 'Autoclickers',
				desc: 'Please note: this mod is not balanced around autoclickers, and those will severely impact the intended experience. <br>If you are using an autoclicker and want to get the full experience, you should stop using them ASAP.',
				icon: [12, 0],
				pref: 'decay.prefs.preventNotifs.autoclicker'
			},
			garden: {
				title: 'The garden',
				desc: 'The garden has been sped up and most mutations are significantly more common; the rarer it is in vanilla, the more boost it got. In addition, many of the slower-to-grow plants have been sped up dramatically. Lastly, all soils now tick faster and the refill works differently.',
				icon: [2, 18],
				pref: 'decay.prefs.preventNotifs.garden'
			}
		}
		decay.triggerNotif = function(key, bypass) {
			if (typeof eval(decay.notifs[key].pref) === 'undefined') { console.log('Corresponding pref not found. Input: '+key); return false; }
			if (eval(decay.notifs[key].pref)) { if (typeof bypass === 'undefined' || !bypass) { return false; } }
			if (!decay.unlocked) { return false; }
			Game.Notify(decay.notifs[key].title, decay.notifs[key].desc, decay.notifs[key].icon, 1e21, false, true);
			eval(decay.notifs[key].pref+'=1;');
		}
		Game.buffCount = function() {
			var count = 0;
			for (let i in Game.buffs) { if (!decay.exemptBuffs.includes(Game.buffs[i].type.name)) { count++; } }
			return count;
		}
		Game.gcBuffCount = function() {
			var count = 0;
			for (let i in Game.buffs) { if (decay.gcBuffs.includes(Game.buffs[i].type.name)) { count++; } }
			return count;
		}
		decay.checkTriggerNotifs = function() {
			if (Game.drawT % 10 != 0) { return false; }
			if (decay.unlocked) { decay.triggerNotif('initiate'); }
			if (decay.gen > 1.2) { decay.triggerNotif('purity'); }
			if (decay.gen <= 0.5) { decay.triggerNotif('gpoc'); }
			if (decay.incMult >= 0.04) { decay.triggerNotif('decayII'); }
			if (Game.buffCount() && decay.gen <= 0.5) { decay.triggerNotif('buff'); }
			if (Game.gcBuffCount() > 1) { decay.triggerNotif('multipleBuffs'); }
			if (Game.Objects['Idleverse'].amount > 0 && Game.Objects['Cortex baker'].amount > 0) { decay.triggerNotif('buildVariance'); }
			if (decay.momentum > 5) { decay.triggerNotif('momentum'); }
		}
		Game.registerHook('logic', decay.checkTriggerNotifs);
		Game.registerHook('draw', decay.draw);
		eval('Game.Win='+Game.Win.toString().replace('Game.recalculateGains=1;', 'decay.triggerNotif("achievement"); Game.recalculateGains=1;'));
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes["golden"].popFunc.toString().replace("if (me.wrath) Game.Win('Wrath cookie');", "if (me.wrath) { decay.triggerNotif('wrath'); Game.Win('Wrath cookie'); }"));

		allValues('decay init');
		
		//ui and display and stuff
		decay.term = function(mult) {
			if (mult > 1) { return 'purity'; }
			return 'decay';
		}
		decay.toggle = function(prefName,button,on,off,invert)
		{
			if (decay.prefs[prefName])
			{
				l(button).innerHTML=off;
				decay.prefs[prefName]=0;
			}
			else
			{
				l(button).innerHTML=on;
				decay.prefs[prefName]=1;
			}
			l(button).className='smallFancyButton prefButton option'+((decay.prefs[prefName]^invert)?'':' off');
		}
		decay.writePrefButton = function(prefName,button,on,off,callback,invert) {
			//I love stealing code from orteil
			var invert=invert?1:0;
			if (!callback) callback='';
			callback+='PlaySound(\'snd/tick.mp3\');';
			return '<a class="smallFancyButton prefButton option'+((decay.prefs[prefName]^invert)?'':' off')+'" id="'+button+'" '+Game.clickStr+'="decay.toggle(\''+prefName+'\',\''+button+'\',\''+on+'\',\''+off+'\',\''+invert+'\');'+callback+'">'+(decay.prefs[prefName]?on:off)+'</a>';
		}
		decay.writeInfoSnippetButton = function(prefName, button) {
			if (!eval(decay.notifs[prefName].pref)) { return ''; }
			return '<a class="smallFancyButton" id="'+button+'"'+Game.clickStr+'="decay.triggerNotif(\''+prefName+'\', true);">'+decay.notifs[prefName].title+'</a><br>';
		}
		addLoc('Ascend on infinite decay');
		addLoc('Wipe save on infinite decay');
		addLoc('Upon reaching infinite decay, ascend without gaining any prestige or heavenly chips');
		addLoc('Informational widget');
		addLoc('Widget below the big cookie that displays information without having to look into the stats menu.');
		addLoc('<b>none.</b><br>(You can see and replay information snippets you\'ve collected throughout the game here. The first one occurs at 5,555 cookies baked this ascension.)')
		decay.getPrefButtons = function() {
			var str = '';
			str += decay.writePrefButton('ascendOnInf', 'AscOnInfDecayButton', loc('Ascend on infinite decay')+' ON', loc('Ascend on infinite decay')+' OFF')+'<label>('+loc("Upon reaching infinite decay, ascend without gaining any prestige or heavenly chips")+')</label><br>';
			str += decay.writePrefButton('wipeOnInf', 'WipeOnInfDecayButton', loc('Wipe save on infinite decay')+' ON', loc('Wipe save on infinite decay')+' OFF')+'<label>('+loc("Upon reaching infinite decay, wipe save")+')</label><br>';
			str += decay.writePrefButton('widget', 'widgetButton', loc('Informational widget')+' ON', loc('Informational widget')+' OFF')+'<label>('+loc('Widget below the big cookie that displays information without having to look into the stats menu.')+')</label><br>';
			str += 'Replay information snippets:<br>'
			var str2 = '';
			for (let i in decay.notifs) {
				str2 += decay.writeInfoSnippetButton(i, i+' Button')+'';
			}
			if (str2 == '') {
				str2 = loc('<b>none.</b><br>(You can see and replay information snippets you\'ve collected throughout the game here. The first one occurs at 5,555 cookies baked this ascension.)');
			}
			return str + str2;
		}
		eval('Game.UpdateMenu='+Game.UpdateMenu.toString()
			 .replace(`rs; game will reload")+')</label><br>'+`, `rs; game will reload")+')</label><br>'+decay.getPrefButtons()+`)
		);
		
		decay.getDec = function() {
			if (decay.cpsList.length < Game.fps * 1.5) { return ''; }
			/*
			var num = 0;
			for (let i = Game.fps / 2 + 1; i < Game.fps * 1.5; i++) {
				num += decay.cpsList[i];
			}
			num /= 30;
			var num = (1 - num / decay.cpsList[0]) * 100;
			var str = num.toFixed(2);
			*/
			var str = ((1 - geometricMean(decay.cpsList.slice(Game.fps * 0.5, decay.cpsList.length)) / decay.cpsList[0]) * 100).toFixed(2);
			if (str.includes('-')) {
				str = str.replace('-', '+');
			} else {
				str = '-' + str;
			}
			return ' (' + str + '%/s)';
		}
		eval('Game.Draw='+Game.Draw.toString().replace(`ify(Game.cookiesPs*(1-Game.cpsSucked),1)+'</div>';`, `ify(Game.cookiesPs*(1-Game.cpsSucked),1)+decay.getDec()+'</div>';`));
		if (false) { Game.registerHook('draw', function() { if (Game.drawT % 3) { Game.UpdateMenu(); } }); } //feels like stretching the bounds of my computer a bit here

		decay.diffStr = function() {
			if (!decay.unlocked) { return ''; }
			var str = '<b>CpS multiplier from '+decay.term(decay.gen)+': </b>';
			if (decay.gen < 0.0001) {
				str += '1 / ';
				str += Beautify(1 / decay.gen);
			} else { 
				if (decay.gen > 1) { 
					str += '<small>+</small>'; 
					str += Beautify(((decay.gen - 1) * 100), 3);
				} else { 
					str += '<small>-</small>'; 
					str += Beautify(((1 - decay.gen) * 100), 3);
				}
				str += '%';
			}
			return str;
		}

		addLoc('Decay rate multiplier from your momentum:');
		decay.momentumStr = function() {
			if (!decay.unlocked) { return ''; }
			var str = '<b>'+loc('Decay rate multiplier from your momentum:')+'</b> x';
			str += Beautify(decay.getTickspeedMultFromMomentum(), 3);
			return str;
		}

		decay.effectStrs = function(funcs) {
			var num = decay.gen;
			if (Array.isArray(funcs)) { 
				for (let i in funcs) {
					num = funcs[i](num, i);
				}
			}
			var str = '';
			if (num > 1) { 
				str += '<small>+</small>'; 
				str += Beautify(((num - 1) * 100), 3);
				str += '%';
			} else if (num >= 0.0001) { 
				str += '<small>-</small>'; 
				str += Beautify(((1 - num) * 100), 3);
				str += '%';
			} else {
				str += '1 / ';
				str += Beautify(1 / num);
			}
			return str;
		}

		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(`(giftStr!=''?'<div class="listing">'+giftStr+'</div>':'')+`, `(giftStr!=''?'<div class="listing">'+giftStr+'</div>':'')+'<div id="decayMultD" class="listing">'+decay.diffStr()+'</div><div id="decayMomentumMultD" class="listing">'+decay.momentumStr()+'</div>'+`).replace(`'<div class="listing"><b>'+loc("Cookies per second:")`,`'<div id="CpSD" class="listing"><b>'+loc("Cookies per second:")`).replace(`'<div class="listing"><b>'+loc("Raw cookies per second:")`,`'<div id="RawCpSD" class="listing"><b>'+loc("Raw cookies per second:")`).replace(`'<div class="listing"><b>'+loc("Cookies per click:")`,`'<div id="CpCD" class="listing"><b>'+loc("Cookies per click:")`));
		Game.UpdateMenu();
		decay.updateStats = function() {
			if (Game.onMenu=='stats') { 
				document.getElementById('decayMultD').innerHTML = decay.diffStr();
				document.getElementById('CpSD').innerHTML = '<b>'+loc("Cookies per second:")+'</b> '+Beautify(Game.cookiesPs,1)+' <small>'+'('+loc("multiplier:")+' '+Beautify(Math.round(Game.globalCpsMult*100),1)+'%)'+(Game.cpsSucked>0?' <span class="warning">('+loc("withered:")+' '+Beautify(Math.round(Game.cpsSucked*100),1)+'%</span>':'')+'</small>';
				document.getElementById('RawCpSD').innerHTML = '<b>'+loc("Raw cookies per second:")+'</b> '+Beautify(Game.cookiesPsRaw,1)+' <small>'+'('+loc("highest this ascension:")+' '+Beautify(Game.cookiesPsRawHighest,1)+')'+'</small>';
				document.getElementById('CpCD').innerHTML = '<b>'+loc("Cookies per click:")+'</b> '+Beautify(Game.computedMouseCps,1);
				document.getElementById('decayMomentumMultD').innerHTML = decay.momentumStr();
			}
		}
		//"D" stands for display, mainly just dont want to conflict with any other id and lazy to check

		var newDiv = document.createElement('div'); 
		newDiv.id = 'decayWidget'; 
		injectCSS('.leftSectionWidget { font-size: 26px; text-shadow: rgb(0, 0, 0) 0px 1px 4px; position: relative; text-align: center; padding: 3px; display: inline-block; z-index: 6; left: 50%; transform: scale(0.75) translate(-66.7%, -133.3%); background: rgba(0, 0, 0, 0.4); line-height: 1.25; border-radius: 10px; }'); //wtf is this black magic
		injectCSS('.widgetDisplay { position: relative; display:inline-flex; justify-content: center; align-items: center; width: 100%; margin: 4px 0px 4px 0px; }');
		injectCSS('.widgetText { display: inline; margin: 4px 58px 4px 58px; }');
		injectCSS('.widgetIcon { position: absolute; }');
		injectCSS('.widgetIcon.toLeft { left: 0; }');
		injectCSS('.widgetIcon.toRight { right: 0; }');
		newDiv.classList.add('leftSectionWidget');
		newDiv.style = 'top: 500px;'; 
		l('sectionLeft').appendChild(newDiv);
		decay.setWidget = function() {
			if (!decay.prefs.widget) { l('decayWidget').style = 'display:none;'; return false; }
			var str = '';
			str = decay.effectStrs();
			l('decayCpsData').innerHTML = str;
			str = 'x'+Beautify(decay.getTickspeedMultFromMomentum(), 3);
			l('decayMomentumData').innerHTML = str;
			var verticalPlacement = 0.95; 
			if (Game.specialTab == 'dragon') { verticalPlacement = 0.8; } else if (Game.specialTab == 'santa') { verticalPlacement = 0.88; }
			verticalPlacement = Math.max(verticalPlacement * l('sectionLeft').offsetHeight, 250);
			l('decayWidget').style = 'top:'+verticalPlacement+'px';
		}
		addLoc('CpS multiplier from your decay');
		addLoc('Decay rate multiplier from your momentum');
		l('decayWidget').innerHTML = `<div id="decayCpsMult" `+Game.getTooltip('<div style="width: 250px; text-align: center;">'+loc('CpS multiplier from your decay')+'</div>', 'middle', false)+` class="widgetDisplay"><div class="icon widgetIcon toLeft" style="`+writeIcon([3, 1, custImg])+`"></div>`+`<div id="decayCpsData" class="widgetText">initializing...</div>`+`<div class="icon widgetIcon toRight" style="`+writeIcon([3, 1, custImg])+`"></div></div><br><div id="decayMomentum" `+Game.getTooltip('<div style="width: 250px; text-align: center;">'+loc('Decay rate multiplier from your momentum')+'</div>', 'middle', false)+` class="widgetDisplay"><div class="icon widgetIcon toLeft" style="`+writeIcon([5, 3, custImg])+`"></div>`+`<div id="decayMomentumData" class="widgetText">initializing...</div>`+`<div class="icon widgetIcon toRight" style="`+writeIcon([5, 3, custImg])+`"></div></div>`;
		
		//decay scaling
		decay.setRates = function() {
			var d = 1;
			var c = Game.cookiesEarned + 1;
			d *= Math.pow(0.99875, Math.log10(c));
			d *= Math.pow(0.999, Math.log2(Math.max(Game.goldenClicks - 77, 1)));
			d *= Math.pow(0.9985, Math.max(Math.sqrt(Game.AchievementsOwned) - 4, 0));
			d *= Math.pow(0.9985, Math.max(Math.sqrt(Game.UpgradesOwned) - 5, 0));
			d *= Math.pow(0.99825, Math.max(Math.pow(decay.getBuildingContribution(), 0.33) - 10, 0));
			d *= Math.pow(0.9975, Math.log2(Math.max(Game.lumpsTotal, 1)));
			d *= Math.pow(0.99825, Math.log10(Game.cookieClicks));
			d *= Math.pow(0.999, Math.pow(Game.dragonLevel, 0.6));
			d *= Math.pow(0.9999, Math.log2(Math.max(Date.now() - Game.startDate - 100000, 1))); //hopefully not too bruh
			if (Game.Has('Lucky day')) { d *= 0.995; }
			if (Game.Has('Serendipity')) { d *= 0.995; }
			if (Game.Has('Get lucky')) { d *= 0.995; }
			if (Game.Has('One mind')) { d *= 0.99; }
			if (Game.Has('Shimmering veil')) { d *= 0.99; }
			if (Game.Has('Unshackled Purity')) { d *= 0.985; }
			decay.incMult = 1 - d;

			var w = 1 - 0.8;
			w *= Math.pow(0.99, Math.log10(c));
			decay.wrinklerSpawnFactor = 1 + (2 * w);
			if (Game.hasGod) { 
				var godLvl = Game.hasGod('scorn');
				if (godLvl == 1) { decay.wrinklerSpawnThreshold = 1 - Math.pow(w * 3, 0.25); decay.wcPow = 0.25 * 2; }
				else if (godLvl == 2) { decay.wrinklerSpawnThreshold = 1 - Math.pow(w * 3, 0.33); decay.wcPow = 0.25 * 1.5; }
				else if (godLvl == 3) { decay.wrinklerSpawnThreshold = 1 - Math.pow(w * 3, 0.5); decay.wcPow = 0.25 * 1.2; }
				else { decay.wrinklerSpawnThreshold = 1 - w * 3; decay.wcPow = 0.25; }
			} else {
				decay.wrinklerSpawnThreshold = Math.pow(w, 0.25); decay.wcPow = 0.25;
			}

			decay.min = Math.min(1, 0.15 + (1 - d) * 3.5);

			var dh = 1;
			dh *= 1 / Math.pow(d, 2);
			decay.decHalt = dh;

			decay.buffDurPow = 0.5 - 0.15 * Game.auraMult('Epoch Manipulator');
		}
		decay.getBuildingContribution = function() {
			//the bigger the building, the more "space" they take up, thus increasing decay by more
			var c = 0;
			var add = 0;
			if (Game.Has('Thousand fingers')) add +=    Game.BuildingsOwned; 
			if (Game.Has('Million fingers')) add*=		5;
			if (Game.Has('Billion fingers')) add*=		10;
			if (Game.Has('Trillion fingers')) add*=		20;
			if (Game.Has('Quadrillion fingers')) add*=	20;
			if (Game.Has('Quintillion fingers')) add*=	20;
			if (Game.Has('Sextillion fingers')) add*=	20;
			if (Game.Has('Septillion fingers')) add*=	20;
			if (Game.Has('Octillion fingers')) add*=	20;
			if (Game.Has('Nonillion fingers')) add*=	20;
			if (Game.Has('Decillion fingers')) add*=	20;
			if (Game.Has('Undecillion fingers')) add*=	20;
			if (Game.Has('Unshackled cursors')) add*=	25;
			c += Math.log10(Math.max(add, 10)) * Game.Objects['Cursor'].amount * 0.1;
			var grandmaPer = 1;
			if (Game.Has('One mind')) { grandmaPer += Game.Objects['Grandma'].amount / 100; }
			if (Game.Has('Communal brainsweep')) { grandmaPer += Game.Objects['Grandma'].amount / 100; }
			if (Game.Has('Elder Pact')) { grandmaPer += Game.Objects['Portal'].amount / 40; }
			c += grandmaPer + Game.Objects['Grandma'].amount;
			c += Game.Objects['Farm'].amount * 3 + Game.Objects['Mine'].amount * 3 + Game.Objects['Factory'].amount * 1.5 + Game.Objects['Bank'].amount * 1.25;
			c += Game.Objects['Temple'].amount * 1.25 + Game.Objects['Wizard tower'].amount + Game.Objects['Shipment'].amount + Game.Objects['Alchemy lab'].amount;
			c += Game.Objects['Portal'].amount * (1 + Game.Has('Deity-sized portals') * 1.5) + Game.Objects['Time machine'].amount;
			c += Game.Objects['Antimatter condenser'].amount * 2.5 + Game.Objects['Prism'].amount + Game.Objects['Chancemaker'].amount * 1.5;
			c += Game.Objects['Fractal engine'].amount * 2.71828 + Math.pow(Game.Objects['Javascript console'].amount, 1.25);
			c += Game.Objects['Idleverse'].amount * 20 + Game.Objects['Cortex baker'].amount * 12 + Game.Objects['You'].amount;
			return c;
		}
		decay.setRates();
		Game.registerHook('check', decay.setRates);
		//make certain actions force a setRate
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].buy='+Game.Objects[i].buy.toString().replace('if (this.buyFunction) this.buyFunction();', 'if (this.buyFunction) { this.buyFunction(); } decay.setRates();'));
		}
		//the other actions are in their respective minigame sections

		allValues('decay ui and scaling');

		//decay visuals
		decay.cookiesPsAnim = function() {
			var colors = [];
			var sec = Game.fps;
			if (decay.times.sinceLastPurify < 3 * sec) {
				var frac = Math.pow(decay.times.sinceLastPurify / (3 * sec), 0.7);
				colors.push(colorCycleFrame([51, 255, 68], [51, 255, 68, 0], frac));
			}
			if (Game.pledgeT > 0) {
				var frame = Math.floor(Game.pledgeT / (2 * sec)) + Math.pow((Game.pledgeT / (2 * sec)) - Math.floor(Game.pledgeT / (2 * sec)), 0.5);
				if (Math.floor(frame) % 2) { 
					colors.push(colorCycleFrame([51, 255, 68], [42, 255, 225], (frame - Math.floor(frame)))); 
				} else {
					colors.push(colorCycleFrame([42, 255, 225], [51, 255, 68], (frame - Math.floor(frame)))); 
				}
			}
			if (decay.times.sincePledgeEnd < 3 * sec) {
				var frac = Math.pow(decay.times.sincePledgeEnd / (3 * sec), 1.5);
				colors.push(colorCycleFrame([51, 255, 68], [51, 255, 68, 0], frac));
			}
			if (decay.times.sinceLastAmplify < 5 * sec) {
				var frac = Math.pow(decay.times.sinceLastAmplify / (3 * sec), 1.5);
				colors.push(colorCycleFrame([119, 30, 143], [119, 30, 143, 0], frac));
			}
			if (Game.veilOn() && Game.cpsSucked == 0) {
				var frame = Math.floor(Game.T / (10 * sec)) + Math.pow((Game.T / (10 * sec)) - Math.floor(Game.T / (10 * sec)), 0.33);
				if (Math.floor(frame) % 2) { 
					colors.push(colorCycleFrame([255, 236, 69, 0], [255, 236, 69, 0.66], (frame - Math.floor(frame)))); 
				} else {
					colors.push(colorCycleFrame([255, 236, 69, 0.66], [255, 236, 69, 0], (frame - Math.floor(frame)))); 
				}
			}
			var result = avgColors(colors, true);
			if (result[3] < 1) {
				if (Game.cpsSucked == 0) {
					result = avgColors([result, [255, 255, 255, 1 - result[3]]], false);
				} else {
					result = avgColors([result, [255, 0, 0, 1 - result[3]]], false);
				}
			}
			if (colors.length > 0) {
				return 'color: rgb('+result[0]+','+result[1]+','+result[2]+');';
			} else {
				return '';
			}
		}
		eval('Game.Draw='+Game.Draw.toString().replace(`class="wrinkled"':'')+'>'`, `class="wrinkled"':'')+' style="'+decay.cookiesPsAnim()+'">'`));
		
		//decay's effects
		Game.registerHook('logic', decay.updateAll);
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].cps='+Game.Objects[i].cps.toString().replace('CpsMult(me);', 'CpsMult(me); mult *= decay.get(me.id); '));
		}
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`{Game.cookiesPs+=9;Game.cookiesPsByType['"egg"']=9;}`,`{Game.cookiesPs+=9*decay.gen;Game.cookiesPsByType['"egg"']=9*decay.gen;}`));
		eval("Game.shimmerTypes['golden'].initFunc="+Game.shimmerTypes['golden'].initFunc.toString().replace(' || (Game.elderWrath==1 && Math.random()<1/3) || (Game.elderWrath==2 && Math.random()<2/3) || (Game.elderWrath==3)', ' || ((!Game.Has("Elder Covenant")) && Math.random() > Math.pow(decay.gen, decay.wcPow * Game.eff("wrathReplace")))'));
		addLoc('+%1/min');
		Game.registerHook('check', () => {
			if (Game.Objects['Wizard tower'].minigameLoaded && !grimoireUpdated) {
				gp = Game.Objects['Wizard tower'].minigame;
				if (typeof gp === 'undefined') { console.log('grimoire1 failed. gp: '+gp); return false; }
				if (l('grimoireInfo') === null) { console.log('grimoire2 failed. grimoireInfo:'+l('grimoireInfo')); return false; } 
				if (typeof gp.spells === 'undefined') { console.log('grimoire3 failed. gp.spells: '+gp.spells); return false; }
				var M = gp;
				try {
					decay.addSpells();
					Game.rebuildGrimoire();
				} catch(err) {
					Game.Notify('adding spells failed!', 'uh oh', 0, 1e21, false, true);
				}
				eval('gp.logic='+gp.logic.toString().replace('M.magicPS=Math.max(0.002,Math.pow(M.magic/Math.max(M.magicM,100),0.5))*0.002;', 'M.magicPS = Math.pow(Math.min(2, decay.gen), 0.3) * Math.max(0.002,Math.pow(M.magic/Math.max(M.magicM,100),0.5))*0.006;'));
				eval('gp.logic='+replaceAll('M.','gp.',gp.logic.toString()));
				eval("gp.spells['summon crafty pixies'].desc=" + '"' + Game.Objects['Wizard tower'].minigame.spells['summon crafty pixies'].desc.replace('2', '10') + '"');//chaning the desc of the spell
				eval("gp.spells['spontaneous edifice'].win=" + Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].win.toString().replace("{if ((Game.Objects[i].amount<max || n==1) && Game.Objects[i].getPrice()<=Game.cookies*2 && Game.Objects[i].amount<400) buildings.push(Game.Objects[i]);}", "{if ((Game.Objects[i].amount<max || n==1) && Game.Objects[i].getPrice()<=Game.cookies*2 && Game.Objects[i].amount<1000) buildings.push(Game.Objects[i]);}"))//SE works up to 1k
				eval("gp.spells['spontaneous edifice'].desc=" + '"' + Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].desc.replace('400', '1000') + '"');
				eval('gp.draw='+gp.draw.toString().replace(`Math.min(Math.floor(M.magicM),Beautify(M.magic))+'/'+Beautify(Math.floor(M.magicM))+(M.magic<M.magicM?(' ('+loc("+%1/s",Beautify((M.magicPS||0)*Game.fps,2))+')'):'')`,
														 `Math.min(Math.floor(M.magicM),Beautify(M.magic))+'/'+Beautify(Math.floor(M.magicM))+(M.magic<M.magicM?(' ('+loc("+%1/min",Beautify((M.magicPS||0)*Game.fps*60,3))+')'):'')`)
					.replace(`loc("Spells cast: %1 (total: %2)",[Beautify(M.spellsCast),Beautify(M.spellsCastTotal)]);`,
						 `loc("Spells cast: %1 (total: %2)",[Beautify(M.spellsCast),Beautify(M.spellsCastTotal)]); M.infoL.innerHTML+="; Magic regen multiplier from "+decay.term(decay.gen)+": "+decay.effectStrs([function(n, i) { return Math.pow(Math.min(2, n), 0.3)}]); `));
				eval('gp.draw='+replaceAll('M.','gp.',gp.draw.toString()));		
				eval('gp.spells["hand of fate"].win='+gp.spells["hand of fate"].win.toString().replace(`if (Game.BuildingsOwned>=10 && Math.random()<0.25) choices.push('building special');`, 'decay.triggerNotif("fthof");'));
				eval('gp.spells["hand of fate"].fail='+gp.spells["hand of fate"].fail.toString().replace(`if (Math.random()<0.1) choices.push('cursed finger','blood frenzy');`, `if (Math.random()<0.1) choices.push('cursed finger'); decay.triggerNotif("fthof");`));
				/*makes it so that the tooltips can support custom icons*/eval('gp.spellTooltip='+replaceAll('M.', 'gp.', gp.spellTooltip.toString()));
				eval('gp.spellTooltip='+gp.spellTooltip.toString().replace(`background-position:'+(-me.icon[0]*48)+'px '+(-me.icon[1]*48)+'px;`, `'+writeIcon(me.icon)+'`));
				grimoireUpdated = true; //no more unnecessary replacing 
				allValues('spells activated');
			}
		});
		function inRect(x,y,rect)
		{
			//find out if the point x,y is in the rotated rectangle rect{w,h,r,o} (width,height,rotation in radians,y-origin) (needs to be normalized)
			//I found this somewhere online I guess
			var dx = x+Math.sin(-rect.r)*(-(rect.h/2-rect.o)),dy=y+Math.cos(-rect.r)*(-(rect.h/2-rect.o));
			var h1 = Math.sqrt(dx*dx + dy*dy);
			var currA = Math.atan2(dy,dx);
			var newA = currA - rect.r;
			var x2 = Math.cos(newA) * h1;
			var y2 = Math.sin(newA) * h1;
			if (x2 > -0.5 * rect.w && x2 < 0.5 * rect.w && y2 > -0.5 * rect.h && y2 < 0.5 * rect.h) return true;
			return false;
		}
		decay.wrinklerApproach = function() {
			var base = 15 / Game.eff('wrinklerApproach');
			base *= 1 + Game.auraMult("Dragon God") * 2;
			return Math.max(0, base / ((Math.log(1 / Math.min(1, decay.gen)) / Math.log(decay.wrinklerApproachFactor))));
		}
		replaceDesc('Wrinkler doormat', 'Wrinklers no longer spawn.<q>Quite possibly the cleanest doormat one will ever see.</q>');
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('var chance=0.00001*Game.elderWrath;','var chance=0.0001 * Math.log(1 / Math.min(1, decay.gen)) / Math.log(decay.wrinklerSpawnFactor); if (decay.gen >= decay.wrinklerSpawnThreshold || !decay.unlocked || Game.Has("Wrinkler doormat")) { chance = 0; }').replace(`if (Game.Has('Wrinkler doormat')) chance=0.1;`, ''))
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('if (me.close<1) me.close+=(1/Game.fps)/10;','if (me.close<1) me.close+=(1/Game.fps)/(decay.wrinklerApproach());'))//Changing Wrinkler movement speed
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('if (me.phase==0 && Game.elderWrath>0 && n<max && me.id<max)','if (me.phase==0 && n<max && me.id<max)'));
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('me.sucked+=(((Game.cookiesPs/Game.fps)*Game.cpsSucked));//suck the cookies','if (!Game.auraMult("Dragon Guts")) { me.sucked+=(Game.cpsSucked * 10 * Math.max(Game.cookiesPsRawHighest, Game.cookiesPs))/Game.fps; }'));
		addLoc('-%1!');
		addLoc('You lost <b>%1</b>!');
		eval('Game.UpdateWrinklers='+replaceAll("var godLvl=Game.hasGod('scorn');", 'var godLvl=0;', Game.UpdateWrinklers.toString()));
		/*wrinkler pop*/ eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('Game.Earn(me.sucked);', 'Game.cookies = Math.max(0, Game.cookies - me.sucked); if (me.sucked > 0.5) { decay.triggerNotif("wrinkler"); }').replace(`Game.Notify(me.type==1?loc("Exploded a shiny wrinkler"):loc("Exploded a wrinkler"),loc("Found <b>%1</b>!",loc("%1 cookie",LBeautify(me.sucked))),[19,8],6);`, `Game.Notify(me.type==1?loc("Exploded a shiny wrinkler"):loc("Exploded a wrinkler"),loc("You lost <b>%1</b>!",loc("%1 cookie",LBeautify(me.sucked))),[19,8],6);`).replace(`Game.Popup('<div style="font-size:80%;">'+loc("+%1!",loc("%1 cookie",LBeautify(me.sucked)))+'</div>',Game.mouseX,Game.mouseY);`,`Game.Popup('<div style="font-size:80%;">'+loc("-%1!",loc("%1 cookie",LBeautify(me.sucked)))+'</div>',Game.mouseX,Game.mouseY);`));
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('var suckRate=1/20;', 'var suckRate=1/2;').replace('Game.cpsSucked=Math.min(1,sucking*suckRate);', 'Game.cpsSucked=1 - Math.min(1,Math.pow(suckRate, sucking)); if (Math.ceil(Game.auraMult("Dragon Guts") - 0.1)) { Game.cpsSucked = 0; }'));
		Game.registerHook('cookiesPerClick', function(val) { return val * (1 - Game.cpsSucked); }); //withering affects clicking
        eval('Game.SpawnWrinkler='+Game.SpawnWrinkler.toString().replace('if (Math.random()<0.0001) me.type=1;//shiny wrinkler','if (Math.random()<1/8192) me.type=1;//shiny wrinkler'))
		eval('Game.getWrinklersMax='+Game.getWrinklersMax.toString().replace(`n+=Math.round(Game.auraMult('Dragon Guts')*2);`, ''));
		Game.getWrinklersMax = function() {
			var n = 12;
			if (Game.Has('Elder spice')) { n -= 2; }
			return n;
			//maybe make decay increase wrinkler cap?
		}
		replaceDesc('Elder spice', 'You attracts <b>2</b> less wrinklers.');
		decay.getBuffLoss = function() {
			if (Game.auraMult('Epoch Manipulator')) {
				if (decay.gen > 1) {
					return 1 - Game.auraMult('Epoch Manipulator') * 0.5 * (2 - 1 / decay.gen);
				} else {
					return 1 / Math.pow(decay.gen, decay.buffDurPow);
				}
			} else {
				return 1 / Math.pow(Math.min(1, decay.gen), decay.buffDurPow);
			}
		}
		eval('Game.updateBuffs='+Game.updateBuffs.toString().replace('buff.time--;','if (!decay.exemptBuffs.includes(buff.type.name)) { buff.time -= decay.getBuffLoss(); } else { buff.time--; }'));

		Game.registerHook('cps', function(m) { var mult = (2 + 14 * Math.pow(1 - decay.incMult, 12)); Game.globalCpsMult *= mult; return m; }); //octuples cps to make up for the decay
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('Game.globalCpsMult=mult;', 'Game.globalCpsMult*=mult;').replace(`if (Game.Has('Occult obstruction')) mult*=0;`, `if (Game.Has('Occult obstruction')) { mult*=0; } Game.globalCpsMult = 1;`))

		allValues('decay effects');
		
		//ways to purify/refresh/stop decay
		eval('Game.shimmer.prototype.pop='+Game.shimmer.prototype.pop.toString().replace('popFunc(this);', 'popFunc(this); if (this.force == "" && (!this.noCount)) { decay.purifyAll(2.5, 0.5, 5); decay.stop(1); }'));
		decay.clickBCStop = function() {
			decay.stop(0.5);
		}
		Game.registerHook('click', decay.clickBCStop);
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace(`Game.wrinklersPopped++;`, `Game.wrinklersPopped++; if (me.phase == 1) { decay.stop(2 * Math.max((1 - Game.auraMult('Dragon Guts')), 0)); } `));
		eval('Game.Win='+Game.Win.toString().replace('Game.recalculateGains=1;', 'decay.purifyAll(1, 0.8, 3);'));
		decay.reincarnateBoost = function() {
			decay.unlocked = false;
			decay.stop(20);
			decay.refreshAll(1);
		}
		Game.registerHook('reincarnate', decay.reincarnateBoost);
		addLoc('Decay propagation rate -%1% for %2!');
		new Game.buffType('creation storm', function(time, pow) {
			return {
				name: 'Storm of creation',
				desc: loc('Decay propagation rate -%1% for %2!', [pow * 100, Game.sayTime(time*Game.fps,-1)]),
				icon: [30, 5],
				time: time*Game.fps,
				add: false,
				max: true,
				aura: 1
			}
		});
		
		//purification: elder pledge & elder covenant
		Game.UpgradesById[64].basePrice /= 1000000;
		Game.UpgradesById[65].basePrice /= 1000000;
		Game.UpgradesById[66].basePrice /= (1000000 / 4);
		Game.UpgradesById[67].basePrice /= (1000000 / 16);
		Game.UpgradesById[68].basePrice /= (1000000 / 64);
		Game.UpgradesById[69].basePrice /= (1000000 / 256);
		Game.UpgradesById[70].basePrice /= (1000000 / 1024);
		Game.UpgradesById[71].basePrice /= (1000000 / 4096);
		Game.UpgradesById[72].basePrice /= (1000000 / 16384);
		Game.UpgradesById[73].basePrice /= (1000000 / 65536);
		Game.UpgradesById[87].basePrice *= 1000000;
		Game.registerHook('check', function() {
			if (Game.Objects['Grandma'].amount>=25) { Game.Unlock('Bingo center/Research facility'); }
		});
		Game.elderWrath = 0;
		replaceDesc('One mind', 'Each grandma gains <b>+0.0<span></span>2 base CpS per grandma</b>.<br>Also unlocks the <b>Elder Pledge</b>, which slowly purifies the decay for some cookies.<q>Repels the ancient evil with industrial magic.</q>');
		Game.Upgrades['One mind'].buyFunction = function() { Game.SetResearch('Exotic nuts'); Game.storeToRefresh=1; }
		replaceDesc('Exotic nuts', 'Cookie production multiplier <b>+4%</b>, and <b>halves</b> the Elder Pledge cooldown.<q>You\'ll go crazy over these!</q>');
		replaceDesc('Communal brainsweep', 'Each grandma gains another <b>+0.0<span></span>2 base CpS per grandma</b>, and makes the Elder Pledge purify for <b>twice as much time</b>.<q>Burns the corruption with the worker\'s might.</q>');
		Game.Upgrades['Communal brainsweep'].buyFunction = function() { Game.SetResearch('Arcane sugar');Game.storeToRefresh=1; }
		replaceDesc('Arcane sugar', 'Cookie production multiplier <b>+5%</b>, and <b>halves</b> the Elder Pledge cooldown.<q>You\'ll go crazy over these!</q>');
		replaceDesc('Elder Pact', 'Each grandma gains <b>+0.0<span></span>5 base CpS per portal</b>, and makes the Elder Pledge <b>twice as powerful</b>.<q>Questionably unethical.</q>');
		Game.Upgrades['Elder Pact'].buyFunction = function() { Game.storeToRefresh=1; }
		replaceDesc('Sacrificial rolling pins', 'The Elder Pledge is <b>10 times</b> cheaper.<q>As its name suggests, it suffers so that everyone can live tomorrow.</q>');
		Game.Upgrades['One mind'].clickFunction = function() { return true; };
		Game.Upgrades['Elder Pact'].clickFunction = function() { return true; };
		replaceDesc('Elder Pledge', 'Purifies the decay, at least for a short while. Does not affect decay momentum at all.<br>Price also scales with highest raw CpS this ascend.<q>Although, yes - the cost is now uncapped; the scaling is now much, much weaker.</q>');
		Game.Upgrades['Elder Pledge'].buyFunction = function() {
			Game.pledges++;
			Game.pledgeT=Game.getPledgeDuration();
			Game.Unlock('Elder Covenant');
			decay.stop(10 + 20 * Game.Has('Uranium rolling pins'));
			Game.storeToRefresh=1;
		}
		Game.Upgrades['Elder Pledge'].priceFunc = function() {
			return Game.cookiesPsRawHighest * 10 * Math.pow(Game.pledges, 4) * (Game.Has('Sacrificial rolling pins')?0.1:1);
		}
		Game.Upgrades['Elder Pledge'].displayFuncWhenOwned = function() {
			if (Game.pledgeT > 0) {
				return '<div style="text-align:center;">'+loc("Time remaining until pledge runs out:")+'<br><b>'+Game.sayTime(Game.pledgeT,-1)+'</b></div>';
			} else {
				return '<div style="text-align:center;">'+loc("Elder Pledge will be usable again in:")+'<br><b>'+Game.sayTime(Game.pledgeC,-1)+'</b></div>';
			}
		}
		Game.Upgrades['Elder Pledge'].timerDisplay = function() {
			if (!Game.Upgrades['Elder Pledge'].bought) {
				return -1; 
			} else if (Game.pledgeT > 0) { 
				return 1-Game.pledgeT/Game.getPledgeDuration(); 
			} else {
				return 1-Game.pledgeC/Game.getPledgeCooldown(); 
			}
		}
		Game.getPledgeDuration = function() {
			var dur = Game.fps*15;
			if (Game.Has('Communal brainsweep')) {
				dur *= 2;
			}
			return dur;
		}
		Game.getPledgeStrength = function() {
			var str = 0.15; 
			if (Game.Has('Elder Pact')) { str *= 2; }
			if (Game.Has('Unshackled Elder Pledge')) { str *= 2; }
			var cap = 5;
			if (Game.Has('Elder Pact')) { cap *= 2; }
			return [1 + (str / Game.fps), 0.5 / (Game.getPledgeDuration() * cap), cap];
		}
		Game.getPledgeCooldown = function() {
			var c = Game.fps * 12 * 60;
			if (Game.Has('Exotic nuts')) { c /= 2; }
			if (Game.Has('Arcane sugar')) { c /= 2; }
			if (Game.Has('Unshackled Elder Pledge')) { c *= 0.75; }
			return c;
		}
		Game.pledgeC = 0;
		replaceDesc('Elder Covenant', 'Stops Wrath Cookies from spawning with decay, at the cost of the decay propagating <b>50%</b> faster.<q>Blocks an outlet for decay, which naturally, causes it to spread faster due to increased concentration.</q>');
		replaceDesc('Revoke Elder Covenant', 'Decay propagation speed will return to normal, but Wrath Cookies will resume spawning with decay.');
		Game.Upgrades['Elder Covenant'].basePrice = 666.66e+33;
		Game.Upgrades['Elder Covenant'].priceFunc = function() {
			return Math.max(Game.Upgrades['Elder Covenant'].basePrice, Game.cookiesPsRawHighest * 3600 * 24);
		}
		Game.Upgrades['Elder Covenant'].buyFunction = function() {
			Game.Win('Elder calm');
			Game.Lock('Revoke Elder Covenant');
			Game.Unlock('Revoke Elder Covenant');
			Game.storeToRefresh=1;
		}
		eval('Game.UpdateGrandmapocalypse='+Game.UpdateGrandmapocalypse.toString()
			 .replace('Game.elderWrath=1;', 'if (decay.gen > 1) { Game.Notify("Purification complete!", "You also gained some extra cps to act as buffer for the decay."); } else { Game.Notify("Purification complete!", ""); }')
			 .replace(`Game.Lock('Elder Pledge');`,'Game.pledgeC = Game.getPledgeCooldown();')
			 .replace(`Game.Unlock('Elder Pledge');`, 'decay.times.sincePledgeEnd = 0;')
			 .replace(`(Game.Has('Elder Pact') && Game.Upgrades['Elder Pledge'].unlocked==0)`, `(Game.Has('One mind') && Game.Upgrades['Elder Pledge'].unlocked==0)`)
		);

		allValues('decay purification & halt');
		
		//decay halt: shimmering veil
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`Game.Has('Shimmering veil [off]')`, 'false'));
		Game.veilHP = 1000;
		Game.veilCollapseAt = 0.1;
		Game.veilMaxHP = 0;
		Game.setVeilMaxHP = function() {
			var h = 1500;
			if (Game.Has('Reinforced membrane')) { h *= 1.25; }
			Game.veilMaxHP = h;
		}
		Game.setVeilMaxHP();
		Game.registerHook('reincarnate', function() { Game.setVeilMaxHP(); Game.veilHP = Game.veilMaxHP; });
		replaceDesc('Shimmering veil', 'Unlocks the <b>Shimmering veil</b>, which is a toggleable veil that <b>absorbs</b> your decay when on; however, if it absorbs too much, it may collapse and temporarily massively increase your rate of decay. The veil heals over time while off.<q>Stars contains purity, whose heat repels and destroys the decay. With this veil brings a galaxy of stars at your disposal; though they are merely an image of the real thing, their shine still significantly halts the ever-growing decay.</q>');
		Game.getVeilBoost = function() {
			//this time it is for the fraction of decay that the veil takes on
			var n = 0.6;
			if (Game.Has('Glittering edge')) { n += 0.25; }
			return n;
		}
		Game.getVeilCost = function(fromCollapse) {
			var n = 60;
			if (Game.Has('Reinforced membrane')) { n /= 2; }
			if (fromCollapse) {
				n *= 7777;
				if (Game.Has('Delicate touch')) { n /= 2; }
				if (Game.Has('Steadfast murmur')) { n /= 2; }
			}
			return n * Game.cookiesPsRawHighest;
		}
		Game.getVeilCooldown = function() {
			var c = Game.fps * 60 * 12;
			if (Game.Has('Reinforced membrane')) { c /= 2; }
			return c;
		}
		Game.getVeilReturn = function() {
			//the amount of decay that the veil returns on collapse
			var r = 2.89;
			if (Game.Has('Reinforced membrane')) { r *= 0.75; }
			if (Game.Has('Delicate touch')) { r *= 0.85; }
			if (Game.Has('Steadfast murmur')) { r *= 0.85; }
			return r;
		}
		Game.getVeilHeal = function(veilHPInput, veilMaxInput) {
			if (veilHPInput == veilMaxInput) { return veilMaxInput; }
			var hmult = 0.05 / Game.fps;
			var hadd = 0.5 / Game.fps;
			var hpow = 1;
			if (Game.Has('Reinforced membrane')) { hadd *= 2; hmult *= 1.25; }
			if (Game.Has('Delicate touch')) { hpow *= 0.75; }
			if (Game.Has('Steadfast murmur')) { hpow *= 0.75; }
			veilHPInput += hadd * Math.pow(veilHPInput / veilMaxInput, hpow);
			veilHPInput = Math.min((1 + hmult) * veilHPInput, veilHPInput + hmult * (veilMaxInput - veilHPInput))
			return Math.min(veilHPInput, veilMaxInput);
		}
		addLoc('This Shimmering Veil is currently taking on <b>%1%</b> of your decay. <br><br>If it collapses, turning it back on will require <b>%2x</b> more cookies than usual, and you must wait for at least <b>%3</b> before doing so. <br>In addition, it will return <b>%4%</b> of the decay it absorbed back onto you when it collapses.');
		Game.Upgrades['Shimmering veil [on]'].descFunc = function(){
			return (this.name=='Shimmering veil [on]'?'<div style="text-align:center;">'+loc("Active.")+'</div><div class="line"></div>':'')+loc('This Shimmering Veil is currently taking on <b>%1%</b> of your decay. <br><br>If it collapses, turning it back on will require <b>%2x</b> more cookies than usual, and you must wait for at least <b>%3</b> before doing so. <br>In addition, it will return <b>%4%</b> of the decay it absorbed back onto you when it collapses.',[Beautify(Game.getVeilBoost()*100), Beautify(Game.getVeilCost(true)/Game.getVeilCost(false), 2), Game.sayTime(Game.getVeilCooldown(),2), Beautify(Game.getVeilReturn() * 100, 2)]);
		}
		addLoc('This Shimmering Veil is slowly healing itself. If activated, this veil will take on <b>%1%</b> of your decay. <br><br>If it collapses, turning it back on will require <b>%2x</b> more cookies than usual, and you must wait for at least <b>%3</b> before doing so. <br>In addition, it will return <b>%4%</b> of the decay it absorbed back onto you when it collapses.');
		addLoc('Your veil has previously collapsed, so this activation will require <b>%1x</b> more cookies than usual.');
		Game.Upgrades['Shimmering veil [off]'].descFunc = function(){
			return (this.name=='Shimmering veil [on]'?'<div style="text-align:center;">'+loc("Active.")+'</div><div class="line"></div>':'')+loc('This Shimmering Veil is slowly healing itself. If activated, this veil will take on <b>%1%</b> of your decay. <br><br>If it collapses, turning it back on will require <b>%2x</b> more cookies than usual, and you must wait for at least <b>%3</b> before doing so. <br>In addition, it will return <b>%4%</b> of the decay it absorbed back onto you when it collapses.', [Beautify(Game.getVeilBoost()*100), Beautify(Game.getVeilCost(true)/Game.getVeilCost(false), 2), Game.sayTime(Game.getVeilCooldown(),2), Beautify(Game.getVeilReturn() * 100, 2)])+' '+(Game.veilPreviouslyCollapsed?('<div class="line"></div>'+loc('Your veil has previously collapsed, so this activation will require <b>%1x</b> more cookies than usual.', [Beautify(Game.getVeilCost(true)/Game.getVeilCost(false), 2)])):'');
		} 
		Game.Upgrades['Shimmering veil [off]'].priceFunc = function() {
			return Game.getVeilCost(Game.veilPreviouslyCollapsed);
		}
		Game.Upgrades['Shimmering veil [off]'].buyFunction = function() {
			Game.veilPreviouslyCollapsed = false;
			decay.triggerNotif('veil');
		}
		replaceDesc('Reinforced membrane', 'Makes the <b>Shimmering Veil</b> cost <b>half</b> as much, <b>reduces</b> the amount of decay applied on collapse and <b>halves</b> the amount of cooldown, makes it <b>heal faster</b> when turned off, and increases its maximum health by <b>25%</b>.<q>A consistency between jellyfish and cling wrap.</q>');
		replaceDesc('Delicate touch', 'Makes the <b>Shimmering Veil</b> return <b>slightly less decay</b> on collapse, and <b>halves</b> the multiplier to reactivation cost if it had collapsed.<br>Also makes the <b>Shimmering Veil</b> heal <b>slightly faster</b> when turned off.<q>It breaks so easily.</q>');
		replaceDesc('Steadfast murmur', 'Makes the <b>Shimmering Veil</b> return <b>slightly less decay</b> on collapse, and <b>halves</b> the multiplier to reactivation cost if it had collapsed.<br>Also makes the <b>Shimmering Veil</b> heal <b>slightly faster</b> when turned off.<q>Lend an ear and listen.</q>');
		replaceDesc('Glittering edge', 'The <b>Shimmering Veil</b> takes on <b>25%</b> more decay.<q>Stare into it, and the cosmos will stare back.</q>');
		Game.Upgrades['Shimmering veil'].basePrice /= 1000;
		Game.Upgrades['Reinforced membrane'].basePrice /= 1000;
		Game.Upgrades['Delicate touch'].basePrice /= 100;
		Game.Upgrades['Steadfast murmur'].basePrice /= 100;
		Game.Upgrades['Glittering edge'].basePrice /= 100;
		var brokenVeil = new Game.Upgrade('Shimmering veil [broken]', '', 0, [9, 10]); brokenVeil.pool = ['toggle']; Game.UpgradesByPool['toggle'].push(brokenVeil); brokenVeil.order = 40005;
		addLoc('This Shimmering Veil has collapsed due to excess decay. Because of this, reactivating it again will take <b>%1x</b> more cookies than usual.');
		brokenVeil.descFunc = function() {
			return loc('This Shimmering Veil has collapsed due to excess decay. Because of this, reactivating it again will take <b>%1x</b> more cookies than usual.', [Beautify(Game.getVeilCost(true)/Game.getVeilCost(false))]);
		}
		addLoc('This Shimmering Veil will be restored in: ');
		brokenVeil.displayFuncWhenOwned = function() {
			return '<div style="text-align:center;">'+loc('This Shimmering Veil will be restored in: ')+'<br><b>'+Game.sayTime(Game.veilRestoreC,-1)+'</b></div>';
		}
		brokenVeil.timerDisplay = function() {
			if (!Game.Upgrades['Shimmering veil [broken]'].bought) { return -1; } else { return 1-Game.veilRestoreC/Game.getVeilCooldown(); }
		}
		Game.veilOn = function() {
			return (Game.Has('Shimmering veil [off]') && (!Game.Has('Shimmering veil [broken]')));
		}
		Game.veilOff = function() {
			return (Game.Has('Shimmering veil [on]') && (!Game.Has('Shimmering veil [broken]')));
		}
		Game.veilBroken = function() {
			return ((!Game.Has('Shimmering veil [off]')) && (!Game.Has('Shimmering veil [on]')));
		}
		eval('Game.Logic='+Game.Logic.toString().replace(`if (Game.Has('Shimmering veil') && !Game.Has('Shimmering veil [off]') && !Game.Has('Shimmering veil [on]'))`, `if (Game.Has('Shimmering veil') && !Game.veilOn() && !Game.veilOff() && !Game.veilBroken())`));
		eval('Game.DrawBackground='+Game.DrawBackground.toString().replace(`if (Game.Has('Shimmering veil [off]'))`, `if (Game.veilOn())`));
		Game.veilAbsorbFactor = 2; //the more it is, the longer lasting the veil will be against decay
		Game.updateVeil = function() {
			if (!Game.Has('Shimmering veil')) { return false; }
			/*
			if (Game.T % 5 == 0) {
				console.log('Current veil HP: '+Game.veilHP);
			}
			*/
			if (Game.veilOn()) { 
				var share = Math.pow(Game.getVeilBoost(), Game.veilAbsorbFactor);
				Game.veilHP *= Math.pow(decay.update(20, share) / decay.gen, 1 / Game.fps); //honestly idk what the difference is exactly between using pow and using division
				Game.veilHP -= (Game.veilMaxHP * Math.min(Math.sqrt(Game.veilMaxHP / Game.veilHP), 10)) / (500 * Game.fps);
				if (Game.veilHP < Game.veilCollapseAt) {
					Game.veilHP = Game.veilCollapseAt;
					Game.collapseVeil(); 
				}
				return true;
			} 
			if (Game.veilOff()) {
				Game.veilHP = Game.getVeilHeal(Game.veilHP, Game.veilMaxHP);
				return true;
			}
			if (Game.veilBroken()) {
				Game.veilRestoreC--;
				if (Game.veilRestoreC <= 0) {
					Game.veilRestoreC = 0;
					Game.veilHP = Game.veilMaxHP;
					Game.Lock('Shimmering veil [broken]');
					Game.Unlock('Shimmering veil [off]');
					Game.Unlock('Shimmering veil [on]');
					Game.Upgrades['Shimmering veil [on]'].earn();
					Game.Notify('Veil restored!', 'Your Shimmering Veil has recovered from the collapse, but your next activation will require more cookies.')
				}
				return true;
			}
		}
		Game.veilRestoreC = 0;
		Game.veilPreviouslyCollapsed = false;
		Game.collapseVeil = function() {
			if (Game.Has('Sparkling wonder') && Math.random() < 0.1) {
				Game.veilHP = Game.veilMaxHP;
				Game.Notify('Veil revived', 'Your Sparkling wonder saved your veil from collapse and healed it back to full health!', [23, 34]);
				Game.Win('Thick-skinned');
			} else {
				Game.Lock('Shimmering veil [on]');
				Game.Lock('Shimmering veil [off]');
				Game.Upgrades['Shimmering veil [broken]'].earn();
				Game.veilRestoreC = Game.getVeilCooldown();
				Game.veilPreviouslyCollapsed = true;
				//need to fix this at some point to make it actually reflect the amount of decay it absorbed
				decay.amplifyAll(Math.pow(Game.veilMaxHP / Game.veilHP, Game.veilAbsorbFactor * Game.getVeilReturn()), 0, 1);
				Game.Notify('Veil collapse!', 'Your Shimmering Veil collapsed.', [30, 5]);
				PlaySound('snd/spellFail.mp3',1);
			}
		}
		replaceAchievDesc('Thick-skinned', 'Have your <b>Sparkling wonder</b> save your <b>Shimmering veil</b> from collapsing.');
		Game.loseShimmeringVeil = function(c) { } //prevent veil from being lost from traditional methods
		//veil graphics down below
		var veilDrawOrigin = selectStatement(Game.DrawBackground.toString(), Game.DrawBackground.toString().indexOf("if (Game.veilOn())"));
		var veilDraw = veilDrawOrigin;
		Game.veilOpacity = function() {
			return Math.pow(Game.veilHP / Game.veilMaxHP, 0.35)
		}
		Game.veilRevolveFactor = function(set) {
			return 0.01 * (1 + set * 0.6) * Math.pow(Game.veilHP / Game.veilMaxHP, 0.05);
		}
		Game.veilParticleSizeMax = function(set) {
			return 64 * Math.pow(0.85, set) * Math.pow((Game.veilHP / Game.veilMaxHP), 0.05);
		}
		Game.veilParticleSpeed = function(set) {
			return 32 * Math.pow(1.4, set) * Math.pow(Game.veilHP / Game.veilMaxHP, 0.05);
		}
		Game.veilParticleSpeedMax = function(set) {
			return 32 * (1 + set * 0.5);
		}
		Game.veilParticleQuantity = function(set) {
			return Math.round(9 * (set + 1));
		}
		Game.veilParticleSpawnBound = function(set) {
			return 155 - 30 * (1 - Math.pow(Game.veilHP / Game.veilMaxHP, 0.75));
		}
		/*btw, did you know that all the code related is made by "c u r s e d s  l i v e r"? Plus more!*/
		veilDraw = veilDraw.replace('ctx.globalAlpha=1;', 'ctx.globalAlpha=Game.veilOpacity();');
		veilDraw = veilDraw.replace("ctx.globalCompositeOperation='source-over';", "ctx.globalAlpha = 1; ctx.globalCompositeOperation='source-over';");
		var veilParticlesOrigin = selectStatement(veilDraw, veilDraw.indexOf('for (i=0;i<6;i++)'));
		var veilParticles = veilParticlesOrigin;
		veilParticles = veilParticles.replace('for (i=0;i<6;i++)', 'for (i=0;i<Game.veilParticleQuantity(set);i++)');
		veilParticles = veilParticles.replace('var t=Game.T+i*15;', 'var t=Game.T+i*Math.round((90 / Game.veilParticleQuantity(set)));');
		veilParticles = veilParticles.replace('var a=(Math.floor(t/30)*30*6-i*30)*0.01;', 'var a=(Math.floor(t/30)*30*6-i*30)*Game.veilRevolveFactor(set);');
		veilParticles = veilParticles.replace('var size=32*(1-Math.pow(r*2-1,2));', 'var size=Game.veilParticleSizeMax(set)*(1-Math.pow(r*2-1,2));');
		veilParticles = veilParticles.replace('var xx=x+Math.sin(a)*(110+r*16);', 'var xx=x+Math.sin(a)*(Game.veilParticleSpawnBound(set) - Game.veilParticleSpeed(set) * Math.cos(r));').replace('var yy=y+Math.cos(a)*(110+r*16);', 'var yy=y+Math.cos(a)*(Game.veilParticleSpawnBound(set) - Game.veilParticleSpeed(set) * Math.sin(r));');
		veilDraw = veilDraw.replace(veilParticlesOrigin, 'var set = 0; '+veilParticles+'; set = 1; '+veilParticles+'; set = 2; '+veilParticles+'; set = 3; '+veilParticles);
		eval('Game.DrawBackground='+Game.DrawBackground.toString().replace(veilDrawOrigin, veilDraw));

		allValues('veil');
		
		//SPELLS
		decay.addSpells = function() {
			addLoc('Liquify politician');
			addLoc('Purifies a lot of decay with a very high purity limit.');
			addLoc('Amplifies your decay.');
			addLoc('Corruption cleared!');
			addLoc('Backfire! Corruption intensified!');
			addLoc('Manifest spring');
			addLoc('Decay propagation is %1% slower for the next %2 minutes.<br>(this stacks with itself multiplicatively)');
			addLoc('Decay propagation is %1% faster for the next %2 minutes.');
			addLoc('The water shall flow!');
			addLoc('Oops! Pipes broken!');
			addLoc('Unending flow');
			addLoc('Stagnant body');
			addLoc('Decay propagation rate +%1% for %2!');
			gp.spells['liquify politician'] = {
				name: loc('Liquify politician'),
				desc: loc('Purifies a lot of decay with a very high purity limit.'),
				failDesc: loc('Amplifies your decay.'),
				icon: [5, 0, custImg],
				costMin: 6,
				costPercent: 0.45,
				id: 9,
				win: function() {
					decay.purifyAll(50, 0.25, 100);
					Game.Popup('<div style="font-size:80%;">'+loc("Corruption cleared!")+'</div>',Game.mouseX,Game.mouseY);
				},
				fail: function() {
					decay.amplifyAll(10, 0.5);
					Game.Popup('<div style="font-size:80%;">'+loc("Backfire! Corruption intensified!")+'</div>',Game.mouseX,Game.mouseY);
				}
			}
			gp.spellsById.push(gp.spells['liquify politician']);
			gp.spells['manifest spring'] = {
				name: loc('Manifest spring'),
				desc: loc('Decay propagation is %1% slower for the next %2 minutes.<br>(this stacks with itself multiplicatively)', [25, 2]),
				failDesc: loc('Decay propagation is %1% faster for the next %2 minutes.', [50, 2]),
				icon: [6, 0, custImg],
				costMin: 10,
				costPercent: 0.15,
				id: 10,
				win: function() {
					if (!Game.hasBuff('Unending flow')) {
						Game.gainBuff('unending flow', 120, 0.25);
					} else {
						Game.hasBuff('Unending flow').arg1 = Game.hasBuff('Unending flow').arg1 + (0.25 * (1 - Game.hasBuff('Unending flow').arg1));
					}
					Game.Popup('<div style="font-size:80%;">'+loc("The water shall flow!")+'</div>',Game.mouseX,Game.mouseY);
				},
				fail: function() {
					Game.gainBuff('stagnant body', 120, 0.5);
					Game.Popup('<div style="font-size:80%;">'+loc("Oops! Pipes broken!")+'</div>',Game.mouseX,Game.mouseY);
				}
			}
			gp.spellsById.push(gp.spells['manifest spring']);
			
			new Game.buffType('unending flow', function(time, pow) {
			return {
					name: loc('Unending flow'),
					desc: loc('Decay propagation rate -%1% for %2!', [pow * 100, Game.sayTime(time*Game.fps,-1)]),
					icon: [6, 0, custImg],
					time: time*Game.fps,
					add: false,
					max: false,
					aura: 0
				}
			});
			
			new Game.buffType('stagnant body', function(time, pow) {
			return {
					name: loc('Stagnant body'),
					desc: loc('Decay propagation rate +%1% for %2!', [pow * 100, Game.sayTime(time*Game.fps,-1)]),
					icon: [30, 3],
					time: time*Game.fps,
					add: false,
					max: false,
					aura: 0
				}
			});
		}

		Game.rebuildGrimoire = function() {
			if (typeof gp === 'undefined') { return false; }
			let M = gp;
			var str='';
			str+='<style>'+
			'#grimoireBG{background:url('+Game.resPath+'img/shadedBorders.png),url('+Game.resPath+'img/BGgrimoire.jpg);background-size:100% 100%,auto;position:absolute;left:0px;right:0px;top:0px;bottom:16px;}'+
			'#grimoireContent{position:relative;box-sizing:border-box;padding:4px 24px;}'+
			'#grimoireBar{max-width:95%;margin:4px auto;height:16px;}'+
			'#grimoireBarFull{transform:scale(1,2);transform-origin:50% 0;height:50%;}'+
			'#grimoireBarText{transform:scale(1,0.8);width:100%;position:absolute;left:0px;top:0px;text-align:center;color:#fff;text-shadow:-1px 1px #000,0px 0px 4px #000,0px 0px 6px #000;margin-top:2px;}'+
			'#grimoireSpells{text-align:center;width:100%;padding:8px;box-sizing:border-box;}'+
			'.grimoireIcon{pointer-events:none;margin:2px 6px 0px 6px;width:48px;height:48px;opacity:0.8;position:relative;}'+
			'.grimoirePrice{pointer-events:none;}'+
			'.grimoireSpell{box-shadow:4px 4px 4px #000;cursor:pointer;position:relative;color:#f33;opacity:0.8;text-shadow:0px 0px 4px #000,0px 0px 6px #000;font-weight:bold;font-size:12px;display:inline-block;width:60px;height:74px;background:url('+Game.resPath+'img/spellBG.png);}'+
			'.grimoireSpell.ready{color:rgba(255,255,255,0.8);opacity:1;}'+
			'.grimoireSpell.ready:hover{color:#fff;}'+
			'.grimoireSpell:hover{box-shadow:6px 6px 6px 2px #000;z-index:1000000001;top:-1px;}'+
			'.grimoireSpell:active{top:1px;}'+
			'.grimoireSpell.ready .grimoireIcon{opacity:1;}'+
			'.grimoireSpell:hover{background-position:0px -74px;} .grimoireSpell:active{background-position:0px 74px;}'+
			'.grimoireSpell:nth-child(4n+1){background-position:-60px 0px;} .grimoireSpell:nth-child(4n+1):hover{background-position:-60px -74px;} .grimoireSpell:nth-child(4n+1):active{background-position:-60px 74px;}'+
			'.grimoireSpell:nth-child(4n+2){background-position:-120px 0px;} .grimoireSpell:nth-child(4n+2):hover{background-position:-120px -74px;} .grimoireSpell:nth-child(4n+2):active{background-position:-120px 74px;}'+
			'.grimoireSpell:nth-child(4n+3){background-position:-180px 0px;} .grimoireSpell:nth-child(4n+3):hover{background-position:-180px -74px;} .grimoireSpell:nth-child(4n+3):active{background-position:-180px 74px;}'+
			
			'.grimoireSpell:hover .grimoireIcon{top:-1px;}'+
			'.grimoireSpell.ready:hover .grimoireIcon{animation-name:bounce;animation-iteration-count:infinite;animation-duration:0.8s;}'+
			'.noFancy .grimoireSpell.ready:hover .grimoireIcon{animation:none;}'+
			
			'#grimoireInfo{text-align:center;font-size:11px;margin-top:12px;color:rgba(255,255,255,0.75);text-shadow:-1px 1px 0px #000;}'+
			'</style>';
			str+='<div id="grimoireBG"></div>';
			str+='<div id="grimoireContent">';
				str+='<div id="grimoireSpells">';//did you know adding class="shadowFilter" to this cancels the "z-index:1000000001" that displays the selected spell above the tooltip? stacking orders are silly https://philipwalton.com/articles/what-no-one-told-you-about-z-index/
				for (var i in M.spells)
				{
					var me=M.spells[i];
					var icon=me.icon||[28,12];
					str+='<div class="grimoireSpell titleFont" id="grimoireSpell'+me.id+'" '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.spellTooltip('+me.id+')','this')+'><div class="usesIcon shadowFilter grimoireIcon" style="'+writeIcon(icon)+'"></div><div class="grimoirePrice" id="grimoirePrice'+me.id+'">-</div></div>';
				}
				str+='</div>';
				var icon=[29,14];
				str+='<div id="grimoireBar" class="smallFramed meterContainer" style="width:1px;"><div '+Game.getDynamicTooltip('Game.ObjectsById['+M.parent.id+'].minigame.refillTooltip','this')+' id="grimoireLumpRefill" class="usesIcon shadowFilter lumpRefill" style="left:-40px;top:-17px;background-position:'+(-icon[0]*48)+'px '+(-icon[1]*48)+'px;"></div><div id="grimoireBarFull" class="meter filling" style="width:1px;"></div><div id="grimoireBarText" class="titleFont"></div><div '+Game.getTooltip('<div style="padding:8px;width:300px;font-size:11px;text-align:center;">'+loc("This is your magic meter. Each spell costs magic to use.<div class=\"line\"></div>Your maximum amount of magic varies depending on your amount of <b>Wizard towers</b>, and their level.<div class=\"line\"></div>Magic refills over time. The lower your magic meter, the slower it refills.")+'</div>')+' style="position:absolute;left:0px;top:0px;right:0px;bottom:0px;"></div></div>';
				str+='<div id="grimoireInfo"></div>';
			str+='</div>';
			l('rowSpecial7').innerHTML=str;
			M.magicBarL=l('grimoireBar');
			M.magicBarFullL=l('grimoireBarFull');
			M.magicBarTextL=l('grimoireBarText');
			M.lumpRefill=l('grimoireLumpRefill');
			M.infoL=l('grimoireInfo');
			for (var i in M.spells)
			{
				var me=M.spells[i];
				AddEvent(l('grimoireSpell'+me.id),'click',function(spell){return function(){PlaySound('snd/tick.mp3');M.castSpell(spell);}}(me));
			}
			AddEvent(M.lumpRefill,'click',function(){
				if (M.magic<M.magicM)
				{Game.refillLump(1,function(){
					M.magic+=100;
					M.magic=Math.min(M.magic,M.magicM);
					PlaySound('snd/pop'+Math.floor(Math.random()*3+1)+'.mp3',0.75);
				});}
			});
		}

		//other nerfs and buffs down below (unrelated but dont know where else to put them)
		
		//Shimmer pool
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("if (me.wrath>0) list.push('clot','multiply cookies','ruin cookies');","if (me.wrath>0) list.push('clot','ruin cookies');"));//Removing lucky from the wrath cookie pool
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("if (Game.BuildingsOwned>=10 && Math.random()<0.25) list.push('building special');","if (Game.BuildingsOwned>=10 && me.wrath==0 && Math.random()<0.25) list.push('building special');"));//Removing bulding specail from the wrath cookie pool

		//making buildlings start with level 1
		for (let i in Game.Objects) {
			Game.Objects[i].level = Math.max(1, Game.Objects[i].level);
		}
		Game.LoadMinigames();

		eval('Game.ClickCookie='+Game.ClickCookie.toString().replace(`Game.Win('Uncanny clicker');`, `{ Game.Win('Uncanny clicker'); decay.triggerNotif('autoclicker'); }`));

		Game.baseResearchTime = 10 * 60 * Game.fps;

		allValues('spells; decay complete');

		/*=====================================================================================
        Minigames 
        =======================================================================================*/
        eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace("if (Game.hasBuff('Crafty pixies')) price*=0.98;","if (Game.hasBuff('Crafty pixies')) price*=0.90;"))//Buffing the crafty pixies effect from 2% to 10%

        //Garden changes
		Game.registerHook('check', () => {
			if (Game.Objects['Farm'].minigameLoaded && !gardenUpdated) {
		        M=Game.Objects['Farm'].minigame//Declaring M.soilsById so computeEffs works (this took hours to figure out)
				gap = M;
				if (l('gardenStats') === null) { return false; }
		        M.soilsById.soilsById = [];
		        var n = 0;
		        for (var i in M.soils) {
		        M.soils[i].id = n;
		        M.soils[i].key = i;
		        M.soilsById[n] = M.soils[i];
		        n++;
		        } 

		        M.harvestAll=function(type,mature,mortal)//Declaring harvestAll so M.convert works
		        {
			        var harvested=0;
			        for (var i=0;i<2;i++)//we do it twice to take care of whatever spawns on kill
			        {
				        for (var y=0;y<6;y++)
				        {
					        for (var x=0;x<6;x++)
					        {
						        if (M.plot[y][x][0]>=1)
						        {
							        var doIt=true;
							        var tile=M.plot[y][x];
							        var me=M.plantsById[tile[0]-1];
							        if (type && me!=type) doIt=false;
							        if (mortal && me.immortal) doIt=false;
							        if (mature && tile[1]<me.mature) doIt=false;
							
							        if (doIt) harvested+=M.harvest(x,y)?1:0;
						        }
					        }
				        }
			        }
			        if (harvested>0) setTimeout(function(){PlaySound('snd/harvest1.mp3',1,0.2);},50);
			        if (harvested>2) setTimeout(function(){PlaySound('snd/harvest2.mp3',1,0.2);},150);
			        if (harvested>6) setTimeout(function(){PlaySound('snd/harvest3.mp3',1,0.2);},250);
		        }

				//Changing some plants mutations
				eval("M.getMuts="+M.getMuts.toString().replace("if (neighsM['bakerWheat']>=1 && neighsM['thumbcorn']>=1) muts.push(['cronerice',0.01]);","if (neighsM['bakerWheat']>=1 && neighsM['wrinklegill']>=1) muts.push(['cronerice',0.01]);"));
				eval("M.getMuts="+M.getMuts.toString().replace("if (neighsM['cronerice']>=1 && neighsM['thumbcorn']>=1) muts.push(['gildmillet',0.03]);","if (neighsM['bakerWheat']>=1 && neighsM['thumbcorn']>=1) muts.push(['gildmillet',0.03]);"));

				var chanceChanges=[[0.07, 0.12], [0.06, 0.11], [0.05, 0.1], [0.04, 0.08], [0.03, 0.06], [0.02, 0.04], [0.01, 0.03], [0.005, 0.2], [0.002, 0.01], [0.001, 0.008], [0.0007, 0.007], [0.0001, 0.002]];
				var changeStr = M.getMuts.toString();
				for (let i in chanceChanges) {
					changeStr = replaceAll(chanceChanges[i][0].toString(), chanceChanges[i][1].toString(), changeStr);
				}
				eval('M.getMuts='+changeStr);

				var ageChange = function(name, newTick, newTickR) {
					gap.plants[name].ageTick = newTick;
					gap.plants[name].ageTickR = newTickR;
				}

				ageChange('elderwort', 1.5, 1.5); ageChange('drowsyfern', 0.5, 1); ageChange('queenbeet', 2, 0.8); ageChange('bakeberry', 1.5, 1); ageChange('queenbeetLump', 0.2, 0.2);
				ageChange('duketater', 0.05, 2); ageChange('doughshroom', 2, 2); ageChange('tidygrass', 0.5, 1); ageChange('everdaisy', 0.75); ageChange('nursetulip', 1, 2.5); ageChange('cronerice', 0.6, 2); ageChange('clover', 2, 2.5); ageChange('whiskerbloom', 3, 3); ageChange('wrinklegill', 2, 4);
				
				//Nerfing some plants effects
				eval("M.computeEffs="+M.computeEffs.toString().replace("effs.cursorCps+=0.01*mult","effs.cursorCps+=0.005*mult"));
				eval("M.computeEffs="+M.computeEffs.toString().replace("else if (name=='whiskerbloom') effs.milk+=0.002*mult;","else if (name=='whiskerbloom') effs.milk+=0.001*mult;"));
				eval("M.computeEffs="+M.computeEffs.toString().replace("goldenClover') effs.goldenCookieFreq+=0.03*mult;","goldenClover') { effs.goldenCookieFreq+=0.03*mult; effs.goldenCookieEffDur*=1-0.015; effs.goldenCookieGain+=1.5; }"));
				
				eval("M.convert="+M.convert.toString().replace("Game.gainLumps(10);","Game.gainLumps(15);"));//Changing how much saccing gives

			    //Desc   	 
				M.plants['bakerWheat'].children=['bakerWheat','thumbcorn','cronerice','gildmillet','bakeberry','clover','goldenClover','chocoroot','tidygrass'];
				M.plants['thumbcorn'].children=['bakerWheat','thumbcorn','gildmillet','glovemorel'];
				M.plants['wrinklegill'].children=['cronerice','elderwort','shriekbulb'];

		        //Effect desc
				M.plants['whiskerbloom'].effsStr='<div class="green">&bull;'+loc("milk effects")+' +0.05%</div>';
				M.plants['glovemorel'].effsStr='<div class="green">&bull;'+loc("cookies/click")+' +4%</div><div class="green">&bull; '+loc("%1 CpS",Game.Objects['Cursor'].single)+' +0.5%</div><div class="red">&bull; '+loc("CpS")+' -1%</div>';
				M.plants['goldenClover'].effsStr='<div class="green">&bull; '+loc("golden cookie frequency")+' +3%</div><div class="green">&bull; '+loc("golden cookie gains")+' +150%</div><div class="red">&bull; '+loc('golden cookie effect duration')+' -1.5%</div>';

				M.soils.dirt.tick = 2; M.soils.fertilizer.tick = 1; M.soils.clay.tick = 5; M.soils.pebbles.tick = 2; M.soils.woodchips.tick = 2;
				M.soils.dirt.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(2*60*Game.fps)+'</b>')+'</div>';
				M.soils.fertilizer.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(1*60*Game.fps)+'</b>')+'</div><div class="red">&bull; '+loc("passive plant effects")+' <b>-25%</b></div><div class="red">&bull; '+loc("weed growth")+' <b>+20%</b></div>';
				M.soils.clay.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(5*60*Game.fps)+'</b>')+'</div><div class="green">&bull; '+loc("passive plant effects")+' <b>+25%</b></div>';
				M.soils.pebbles.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(2*60*Game.fps)+'</b>')+'</div><div class="red">&bull; '+loc("passive plant effects")+' <b>-75%</b></div><div class="green">&bull; '+loc("<b>%1% chance</b> of collecting seeds automatically when plants expire",35)+'</div><div class="green">&bull; '+loc("weed growth")+' <b>-90%</b></div>';
				M.soils.woodchips.effsStr = '<div class="gray">&bull; '+loc("tick every %1",'<b>'+Game.sayTime(5*60*Game.fps)+'</b>')+'</div><div class="red">&bull; '+loc("passive plant effects")+' <b>-75%</b></div><div class="green">&bull; '+loc("plants spread and mutate <b>%1 times more</b>",3)+'</div><div class="green">&bull; '+loc("weed growth")+' <b>-90%</b></div>';

				M.forceMuts = false;
				//I absolutely hate modifying event listeners that orteil made
				eval('Game.refillLump='+Game.refillLump.toString().replace('func();', 'func(); if (gap.loopsMult == 3) { gap.forceMuts = true; }'));

				var gardenMutsStr = selectStatement(M.logic.toString(), M.logic.toString().indexOf('for (var loop=0;loop<loops;loop++)'), 0); 
				var gardenMutsStrNew = gardenMutsStr.replace('var muts=M.getMuts(neighs,neighsM);', 'var muts=M.getMuts(neighs,neighsM); if (M.forceMuts && muts.length > 0) { loop--; } else if (M.forceMuts) { break; }').replace('if (list.length>0) M.plot[y][x]=[M.plants[choose(list)].id+1,0];', 'if (list.length>0) { M.plot[y][x]=[M.plants[choose(list)].id+1,0]; break; }');
				gardenMutsStrNew = gardenMutsStrNew.replace('var chance=0.002*weedMult*M.plotBoost[y][x][2];', 'var chance=0.002*weedMult*M.plotBoost[y][x][2]; if (M.forceMuts) { chance = 1; }'); 
				eval('M.logic='+M.logic.toString().replace(gardenMutsStr, gardenMutsStrNew).replace('M.toCompute=true;', 'M.toCompute=true; M.forceMuts = false;'));
				addLoc('Click to refill your soil timer and trigger <b>1</b> plant growth tick with a <b>guaranteed mutation</b> on <b>every</b> tile that can have a mutation, for the price of %1.');
				eval('M.refillTooltip='+M.refillTooltip.toString().replace(`with <b>x%1</b> spread and mutation rate for %2.",[3,'<span class="price lump">'+loc("%1 sugar lump",LBeautify(1))+'</span>']`, `with a <b>guaranteed mutation</b> on <b>every</b> tile that can have a mutation, for the price of %1.",['<span class="price lump">'+loc("%1 sugar lump",LBeautify(1))+'</span>']`));

				eval('M.buildPanel='+M.buildPanel.toString().replace('1000*60*10', '1000*60*3'));
				M.buildPanel();

                //Sac desc
				M.tools['convert'].desc=loc("A swarm of sugar hornets comes down on your garden, <span class=\"red\">destroying every plant as well as every seed you've unlocked</span> - leaving only a %1 seed.<br>In exchange, they will grant you <span class=\"green\">%2</span>.<br>This action is only available with a complete seed log.",[loc("Baker's wheat"),loc("%1 sugar lump",LBeautify(15))]);
				eval("M.askConvert="+M.askConvert.toString().replace("10","30"));
				eval("M.convert="+M.convert.toString().replace("10","30"));

				eval('M.unlockSeed='+M.unlockSeed.toString().replace('me.unlocked=1;', 'me.unlocked=1; decay.triggerNotif("garden"); '));

				eval('M.computeEffs='+M.computeEffs.toString().replace('buildingCost:1,', 'buildingCost:1, wrinklerApproach:1, wrathReplace:1, haltPower:1, decayRate:1, decayMomentum:1').replace(`else if (name=='wardlichen') {effs.wrinklerSpawn*=1-0.15*mult;effs.wrathCookieFreq*=1-0.02*mult;}`, `else if (name=='wardlichen') {effs.haltPower+=0.02*mult; effs.wrathReplace*=1-0.02*mult;}`).replace(`else if (name=='wrinklegill') {effs.wrinklerSpawn+=0.02*mult;effs.wrinklerEat+=0.01*mult;}`,`else if (name=='wrinklegill') {effs.wrinklerApproach*=1-0.05*mult;}`).replace(`effs.wrathCookieGain+=0.01*mult;effs.wrathCookieFreq+=0.01*mult;`,`eff.wrinklerApproach*=1-0.02*mult; eff.haltPower+=0.01*mult;`).replace(`effs.goldenCookieGain+=0.01*mult;effs.goldenCookieFreq+=0.01*mult;effs.itemDrops+=0.01*mult;`, `effs.decayRate *= 1 - 0.02; effs.decayMomentum *= 1 - 0.02;`).replace(`effs.goldenCookieGain+=0.01*mult;effs.goldenCookieEffDur+=0.001*mult;`, `effs.goldenCookieGain+=3.89*mult;effs.goldenCookieEffDur+=0.001*mult;`).replace(`'shriekbulb') {effs.cps*=1-0.02*mult;}`, `'shriekbulb') {effs.cps*=1-0.02*mult;} else if (name=='tidygrass') { effs.decayMomentum *= 1 - 0.05; } else if (name=='everdaisy') { effs.decayRate *= 1 - 0.03; }`));
				addLoc('all decay-halting sources\' effect');
				addLoc('wrath cookies replacement');
				addLoc('wrinklers approach speed');
				addLoc('decay-halting power');
				addLoc('decay rates');
				addLoc('decay momentum');
				addLoc('decay propagation');
				M.plants['wardlichen'].effsStr='<div class="green">&bull; '+loc("all decay-halting sources' effect")+' +2%</div><div class="gray">&bull; '+loc("wrath cookies replacement")+' -2%</div>';
				M.plants['wrinklegill'].effsStr='<div class="green">&bull; '+loc("wrinklers approach speed")+' -5%</div>';
				M.plants['elderwort'].effsStr='<div class="green">&bull; '+loc("wrinklers approach speed")+' -2%</div><div class="green">&bull; '+loc("all decay-halting source' effect")+' +1%</div><div class="green">&bull; '+loc("%1 CpS",Game.Objects['Grandma'].single)+' +1%</div><div class="green">&bull; '+loc("immortal")+'</div><div class="gray">&bull; '+loc("surrounding plants (%1x%1) age %2% faster",[3,3])+'</div>';
				M.plants['shimmerlily'].effsStr='<div class="green">&bull; '+loc('decay propagation')+' -2%</div>';
				M.plants['gildmillet'].effsStr='<div class="green">&bull; '+loc("golden cookie gains")+' +389%</div><div class="green">&bull; '+loc("golden cookie effect duration")+' +0.1%</div>';
				M.plants['tidygrass'].effsStr='<div class="green">&bull; '+loc("surrounding tiles (%1x%1) develop no weeds or fungus",5)+'</div><div class="green">&bull; '+loc('decay momentum')+' -5%</div>';
				M.plants['everdaisy'].effsStr='<div class="green">&bull; '+loc("surrounding tiles (%1x%1) develop no weeds or fungus",3)+'</div><div class="green">&bull; '+loc("decay rates")+' -3%</div><div class="green">&bull; '+loc('immortal')+'</div>';
				eval("M.tools['info'].descFunc="+M.tools['info'].descFunc.toString().replace(`buildingCost:{n:'building costs',rev:true},`, `buildingCost:{n:'building costs',rev:true}, wrinklerApproach:{n:'wrinklers approach speed'}, wrathReplace:{n:'wrath cookies replacement'}, haltPower:{n:'decay-halting power'}`));
				gardenUpdated = true; 
			}
		});
	
		//CBG buff
		new Game.buffType('haggler dream', function(time, pow) {
			return {
				name:'Hagglers dream',
				desc:loc("+20% prestige level effect on CpS for 20 seconds!", [pow, Game.sayTime(time * Game.fps, -1)]),
				icon:[19, 7],
				time:time * Game.fps,
				multCpS:pow,
				aura:1
			};
		});

        //Adding the custom buff to the code
		eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace("if (Game.Has('Lucky payout')) heavenlyMult*=1.01;", "if (Game.Has('Lucky payout')) heavenlyMult*=1.01; if (Game.hasBuff('haggler dream')) heavenlyMult*=1.20;"));

		Game.registerHook('check', () => {
			if (Game.Objects['Wizard tower'].minigameLoaded) {
				//CBG win effect
				eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win.toString().replace('Game.Earn(val);', "var buff = Game.gainBuff('haggler dream', 60, 2);"));
		        eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win.toString().replace(`Game.Popup('<div style="font-size:80%;">'+loc("+%1!",loc("%1 cookie",LBeautify(val)))+'</div>',Game.mouseX,Game.mouseY);`, `Game.Popup('<div style="font-size:80%;">'+loc("Heavenly chips are stronger!")+'</div>',Game.mouseX,Game.mouseY);`));
		        eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].win.toString().replace(`Game.Notify(loc("Conjure Baked Goods")+(EN?'!':''),loc("You magic <b>%1</b> out of thin air.",loc("%1 cookie",LBeautify(val))),[21,11],6);`, `Game.Notify(loc("Conjure Baked Goods")+(EN?'!':''),loc("Your heavenly chips are stronger.",loc("")),[21,11],6);`));

				//CBG fail effect
				eval("Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].fail="+Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].fail.toString().replace(`var val=Math.min(Game.cookies*0.15,Game.cookiesPs*60*15)+13;`,`var val=Math.min(Game.cookies*0.5)+13;`));

				//desc
				addLoc('+%1% prestige level effect on CpS for 20 seconds.');
				addLoc('Trigger a %1-minute clot and lose %2% of your cookies owned.');
				Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].desc=loc("+%1% prestige level effect on CpS for 20 seconds.", 20);
				Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].failDesc=loc("Trigger a %1-minute clot and lose %2% of your cookies owned.", [15, 50]);
			}
		});

		allValues('other minigame (no pantheon)');
		
		/*=====================================================================================
        Upgrades
        =======================================================================================*/
		eval('Game.mouseCps='+Game.mouseCps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))//Changing how much unshackled cursors give
		eval("Game.Objects['Cursor'].cps="+Game.Objects['Cursor'].cps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))//changing how much unshackled cursors buffs cursors

		var getStrThousandFingersGain=function(x)//Variable for the desc of unshackled cursor 
		{return loc("Multiplies the gain from %1 by <b>%2</b>.",[getUpgradeName("Thousand fingers"),x]);}
		Game.Upgrades['Unshackled cursors'].baseDesc=getStrThousandFingersGain(20)+'<q>These hands tell a story.</q>';//Changing the desc to reflect all the changes

		eval('Game.GetTieredCpsMult='+Game.GetTieredCpsMult.toString().replace("tierMult+=me.id==1?0.5:(20-me.id)*0.1;","tierMult+=me.id==1?0.45:(20-me.id)*0.09;"))//All unshackled upgrades produce 10% less

		for (var i in Game.Objects) {//This is used so we can change the message that appears on all tired upgrades when a unshackled buiding is bought
            for (var ii in Game.Objects[i].tieredUpgrades) {
                var me=Game.Objects[i].tieredUpgrades[ii];
                if (!(ii=='fortune')&&me.descFunc){eval('me.descFunc='+me.descFunc.toString().replace('this.buildingTie.id==1?0.5:(20-this.buildingTie.id)*0.1)*100','this.buildingTie.id==1?0.45:(20-this.buildingTie.id)*0.09)*100'));}
            }
        }  

        for (var i in Game.Objects) {//This is used so we can change the desc of all unshackled upgrades
            var s=Game.Upgrades['Unshackled '+Game.Objects[i].plural];
            var id=Game.Objects[i].id;
            if (!(i=='Cursor')) {s.baseDesc=s.baseDesc.replace(s.baseDesc.slice(0,s.baseDesc.indexOf('<q>')),'Tiered upgrades for <b>'+i+'</b> provide an extra <b>'+(id==1?'45':(20-id)*9)+'%</b> production.<br>Only works with unshackled upgrade tiers.');}
        }

		Game.registerHook('check', function() {
			if (Game.goldenClicks>=1) { Game.Unlock('Lucky day'); }
			if (Game.goldenClicks>=3) { Game.Unlock('Serendipity'); }
			if (Game.goldenClicks>=7) { Game.Unlock('Get lucky'); }
		});

        Game.Upgrades['Pure heart biscuits'].basePrice *=    1;
		cookieChange('Pure heart biscuits', 4);
        Game.Upgrades['Ardent heart biscuits'].basePrice *=  100000000;
		cookieChange('Ardent heart biscuits', 5);
        Game.Upgrades['Sour heart biscuits'].basePrice *=    10000000000000000;
		cookieChange('Sour heart biscuits', 6);
        Game.Upgrades['Weeping heart biscuits'].basePrice *= 1000000000000000000000000;
		cookieChange('Weeping heart biscuits', 7);
        Game.Upgrades['Golden heart biscuits'].basePrice *=  100000000000000000000000000000000;
		cookieChange('Golden heart biscuits', 8);
		Game.Upgrades['Eternal heart biscuits'].basePrice *= 10000000000000000000000000000000000000000;
		cookieChange('Eternal heart biscuits', 9);
		Game.Upgrades['Prism heart biscuits'].basePrice *=   1000000000000000000000000000000000000000000000000;
		cookieChange('Prism heart biscuits', 10);

		Game.Upgrades['Kitten helpers'].basePrice=9000000000
		Game.Upgrades['Kitten workers'].basePrice=9000000000000
		Game.Upgrades['Kitten engineers'].basePrice=900000000000000000
		Game.Upgrades['Kitten overseers'].basePrice=90000000000000000000
		Game.Upgrades['Kitten managers'].basePrice=900000000000000000000000
		Game.Upgrades['Kitten accountants'].basePrice=9000000000000000000000000000
		Game.Upgrades['Kitten specialists'].basePrice=900000000000000000000000000000
		Game.Upgrades['Kitten experts'].basePrice=900000000000000000000000000000000
		Game.Upgrades['Kitten consultants'].basePrice=9000000000000000000000000000000000000
		Game.Upgrades['Kitten assistants to the regional manager'].basePrice=900000000000000000000000000000000000000
		Game.Upgrades['Kitten marketeers'].basePrice=900000000000000000000000000000000000000000
		Game.Upgrades['Kitten analysts'].basePrice=9000000000000000000000000000000000000000000000
		Game.Upgrades['Kitten executives'].basePrice=900000000000000000000000000000000000000000000000
		Game.Upgrades['Kitten admins'].basePrice=900000000000000000000000000000000000000000000000000
		Game.Upgrades['Kitten strategists'].basePrice=9000000000000000000000000000000000000000000000000000000

		Game.Upgrades['Wrinkly cookies'].power=15;
		Game.Upgrades['Wrinkly cookies'].baseDesc=loc("Cookie production multiplier <b>+%1% permanently</b>.",15)+'<q>The result of regular cookies left to age out for countless eons in a place where time and space are meaningless.</q>';

		/*=====================================================================================
        Dragon auras
        =======================================================================================*/
        eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("milkMult*=1+Game.auraMult('Breath of Milk')*0.05;","milkMult*=1+Game.auraMult('Breath of Milk')*0.025;"));//Changing BOM from 5% to 2.5%

		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("mult*=1+Game.auraMult('Radiant Appetite');","mult*=0.5+Game.auraMult('Radiant Appetite');"));//Changing RA from 2.0 to 1.5

		eval('Game.Upgrade.prototype.getPrice='+Game.Upgrade.prototype.getPrice.toString().replace("price*=1-Game.auraMult('Master of the Armory')*0.02;","price*=1-Game.auraMult('Master of the Armory')*0.10;"));

		eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace("price*=1-Game.auraMult('Fierce Hoarder')*0.02;","price*=1-Game.auraMult('Fierce Hoarder')*0.05;"));

        //Dragon Cursor making all clicking buffs 50% stronger
		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777);`,`buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777*(1+(Game.auraMult('Dragon Cursor')*0.5)));`));//Dragon Cursor making CF stronger by 50%
		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111);`,`buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111*(1+(Game.auraMult('Dragon Cursor')*0.5)));`));//Dragon Cursor making DF stronger by 50%

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`list.push('blood frenzy','chain cookie','cookie storm');`,`{ list.push('blood frenzy','chain cookie','cookie storm'); for (let i = 0; i < randomFloor(Game.auraMult('Unholy Dominion') * 4); i++) { list.push('blood frenzy'); } }`));//Unholy Dominion pushes another EF to the pool making to so they are twice as common

		eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace("heavenlyMult*=1+Game.auraMult('Dragon God')*0.05;","heavenlyMult*=1+Game.auraMult('Dragon God')*0.20;"));

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight');`,`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight'); if (Math.random()<Game.auraMult('Ancestral Metamorphosis')) { for (let i = 0; i < 10; i++) { list.push('Ancestral Metamorphosis'); } }`));//Adding custom effect for Ancestral Metamorphosis 

        eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`else if (choice=='blood frenzy')`,`else if (choice=='Ancestral Metamorphosis')
        {
			var valn=Math.max(7,Math.min(Game.cookies*1.0,Game.cookiesPs*60*60*24))*Game.eff('goldenCookieGain');
			Game.Earn(valn);
			popup=loc("Dragon\'s hoard!")+'<br><small>'+loc("+%1!",loc("%1 cookie",LBeautify(valn)))+'</small>';
        }else if (choice=='blood frenzy')`));//When Ancestral Metamorphosis is seclected it pushes a effect called Dragon's hoard that gives 24 hours worth of CpS

		
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace(`m*=1-Game.auraMult('Arcane Aura')*0.05;`, `m*=((1 + Game.auraMult('Arcane Aura') * 1.25) - Game.auraMult('Arcane Aura') * 1.25 * Math.pow(0.975, Math.log2(1 / Math.min(1, decay.gen))));`));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace(`if (Game.hasBuff('Sugar blessing')) m*=0.9;`, `if (Game.hasBuff('Sugar blessing')) { m*=0.9; } m*=((1 + Game.auraMult('Master of the Armory') * 0.6) - Game.auraMult('Master of the Armory') * 0.6 * Math.pow(0.99, Math.log(Math.max(1, decay.gen)) / Math.log(1.02)));`));
		eval('Game.SelectDragonAura='+Game.SelectDragonAura.toString().replace(`Game.ToggleSpecialMenu(1);`, `Game.ToggleSpecialMenu(1); decay.setRates();`))
		
        auraDesc(2, "Clicking is <b>5%</b> more powerful."+'<br>'+"Click frenzy and Dragonflight is <b>50%</b> more powerful.");
		auraDesc(5, "Buildings sell back for <b>50%</b> instead of 25% of their cost. <br>Selling buildings <b>halts decay</b> temporarily based on the cube root of the amount of buildings sold.");
		auraDesc(6, "Get <b>1%</b> (multiplicative) closer to <b>+60%</b> golden cookie frequency for each <b>x1.02</b> CpS multiplier from your purity.<br>(Note: this effect reduces the initial amount of time on Golden cookie click)");
		auraDesc(7, "While not purifying decay, you accumulate <b>purification power</b> that will be spent in the next purification; the banked purification power is kept even when this aura is off.");
        auraDesc(8, "<b>+20%</b> prestige level effect on CpS."+'<br>'+"Wrinklers approach the big cookie <b>3 times</b> slower.");
		auraDesc(9, "Get <b>2.5%</b> (multiplicative) closer to <b>+125%</b> Golden cookie frequency for each <b>x0.5</b> CpS multiplier from your decay.<br>(Note: this effect reduces the initial amount of time on Golden cookie click)");
        auraDesc(11, "Golden cookies give <b>10%</b> more cookies."+'<br>'+"Golden cookies may trigger a <b>Dragon\'s hoard</b>.");
		auraDesc(12, "Wrath cookies give <b>10%</b> more cookies."+'<br>'+"Elder frenzy from Wrath cookies appear <b>4x as often</b>.");
		auraDesc(13, "Having purity now makes positive buffs run out slower, for up to <b>-50%</b> buff duration decrease rate. Decay is less effective against buff duration.");
        auraDesc(15, "All cookie production <b>multiplied by 1.5</b>.");
		auraDesc(21, "Wrinklers no longer withers any CpS, but popping wrinklers no longer slow down decay.");
		
		allValues('auras');

		/*=====================================================================================
        because Cookiemains wanted so
        =======================================================================================*/
		var secondGrimoireDone = false;
		Game.registerHook('check', () => {
			if (Game.Objects['Wizard tower'].minigameLoaded && !secondGrimoireDone) {
				var grimoire=Game.Objects['Wizard tower'].minigame;
				if (l('grimoireInfo') === null) { return false; }
                grimoire.spells['hand of fate'].failFunc=function(fail){return fail+0.3*Game.shimmerTypes['golden'].n; };
				Game.Objects['Wizard tower'].minigame.spells['hand of fate'].desc=loc("Summon a random golden cookie. Each existing golden cookie makes this spell +%1% more likely to backfire.",30);

				eval("Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win="+Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win.toString().replace("//if (Math.random()<0.2) choices.push('clot','cursed finger','ruin cookies');","if (Math.random()<0.2) choices.push('clot','cursed finger','ruin cookies');"))//Making this unused code used
		        eval("Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win="+Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win.toString().replace("if (Game.BuildingsOwned>=10 && Math.random()<0.25) choices.push('building special');","if (Game.BuildingsOwned>=10 && Math.random()<0.10) choices.push('building special');"))//Changing building special to 10%
				secondGrimoireDone = true;
			}
		});

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`if (Math.random()<0.8) Game.killBuff('Click frenzy');`,`Game.killBuff('Click frenzy');`));

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`Game.ObjectsById[obj].amount/10+1;`,`Game.ObjectsById[obj].amount/1;`));


        //Buffing Muridal
		eval('Game.mouseCps='+Game.mouseCps.toString().replace("if (godLvl==1) mult*=1.15;","if (godLvl==1) mult*=1.25;"))
		eval('Game.mouseCps='+Game.mouseCps.toString().replace("else if (godLvl==2) mult*=1.20;","else if (godLvl==2) mult*=1.20;"))
		eval('Game.mouseCps='+Game.mouseCps.toString().replace("else if (godLvl==3) mult*=1.1;","else if (godLvl==3) mult*=1.15;"))

        //Nerfing Mokalsium
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) milkMult*=1.1;","if (godLvl==1) milkMult*=1.08;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) milkMult*=1.05;","else if (godLvl==2) milkMult*=1.04;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) milkMult*=1.03;","else if (godLvl==3) milkMult*=1.02;"))

        //Buffing Mokalsium negative effect
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("if (godLvl==1) m*=1.15;","if (godLvl==1) m*=1.20;"));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("else if (godLvl==2) m*=1.1;","else if (godLvl==2) m*=1.15;"));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("else if (godLvl==3) m*=1.05;","else if (godLvl==3) m*=1.1;"));

        //Buffing Jeremy
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) buildMult*=1.1;","if (godLvl==1) buildMult*=1.2;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) buildMult*=1.06;","else if (godLvl==2) buildMult*=1.14;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) buildMult*=1.03;","else if (godLvl==3) buildMult*=1.08;"))
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes["golden"].getTimeMod.toString().replace('if (godLvl==1) m*=1.1;', 'if (godLvl==1) m*=1.06;').replace('else if (godLvl==2) m*=1.06;', 'else if (godLvl==2) m*=1.04;').replace('else if (godLvl==3) m*=1.03;', 'else if (godLvl==3) m*=1.02;'))

        //Nerfing? Cyclius
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);","if (godLvl==1) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);"));
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);","else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);"));
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);","else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*48))*Math.PI*2);"));

		//removes skruuia other functions
		eval('Game.shimmerTypes["golden"].initFunc='+Game.shimmerTypes["golden"].initFunc.toString().replace("(Game.hasGod && Game.hasGod('scorn'))", 'false'));

		//dotjeiess original functions removal
		eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace('Game.hasGod', 'false'));
		eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace('Game.hasGod','false'));

		//godzamok + earth shatterer
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace(`if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01);`, `if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01,1+sold*0.01);`).replace(`else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005);`, `else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005,1+sold*0.004);`).replace(`else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025);`,`else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025,1+sold*0.0015);`).replace('if (success && Game.hasGod)', 'if (success && Game.auraMult("Earth Shatterer")) { decay.stop(Math.pow(sold, 1 / 3) * Game.auraMult("Earth Shatterer") * 1); } if (success && Game.hasGod)'));
		}
		
		addLoc('Buff boosts clicks by +%1% for every building sold for %2 seconds, ');
		addLoc('but also temporarily increases decay momentum by %1% with every building sold.');
		Game.registerHook('check', () => {
			if (Game.Objects['Temple'].minigameLoaded && !pantheonUpdated) {
				//Changing the desc
				var temp = Game.Objects['Temple'].minigame;
				if (l('templeInfo') === null) { return false; }
				if (!decay.prefs.preventNotifs['momentum']) { decay.triggerNotif('momentum'); }
				decay.triggerNotif('boost');
				pp = temp;

				eval('pp.logic='+replaceAll('M.', 'pp.', pp.logic.toString()));
				eval('pp.logic='+pp.logic.toString().replace('t=1000*60*60', 't=1000*5*60').replace('t=1000*60*60*16', 't=1000*60*60').replace('t=1000*60*60*4', 't=1000*60*20'));
				eval('pp.draw='+replaceAll('M.', 'pp.', pp.draw.toString()));
				eval('pp.draw='+pp.draw.toString().replace('t=1000*60*60', 't=1000*5*60').replace('t=1000*60*60*16', 't=1000*60*60').replace('t=1000*60*60*4', 't=1000*60*20'));

				l('templeInfo').innerHTML = '<div '+Game.getDynamicTooltip('Game.ObjectsById['+pp.parent.id+'].minigame.refillTooltip','this')+' id="templeLumpRefill" class="usesIcon shadowFilter lumpRefill" style="left:-6px;top:-10px;background-position:'+(-29*48)+'px '+(-14*48)+'px;"></div><div id="templeSwaps" '+Game.getTooltip('<div style="padding:8px;width:350px;font-size:11px;text-align:center;">'+loc("Each time you slot a spirit, you use up one worship swap.<div class=\"line\"></div>If you have 2 swaps left, the next one will refill after %1.<br>If you have 1 swap left, the next one will refill after %2.<br>If you have 0 swaps left, you will get one after %3.<div class=\"line\"></div>Unslotting a spirit costs no swaps.",[Game.sayTime(60*5*Game.fps),Game.sayTime(60*20*Game.fps),Game.sayTime(60*80*Game.fps)])+'</div>')+'>-</div>'; pp.swapsL = l('templeSwaps');
				
				temp.gods['ruin'].desc1='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [1, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay momentum by %1% with every building sold.",[1])+'</span>';
				temp.gods['ruin'].desc2='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [0.5, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay momentum by %1% with every building sold.",[0.4])+'</span>';
				temp.gods['ruin'].desc3='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [0.25, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay momentum by %1% with every building sold.",[0.15])+'</span>';

				temp.gods['mother'].desc1='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",8)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",20)+'</span>';
				temp.gods['mother'].desc2='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",4)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",15)+'</span>';
				temp.gods['mother'].desc3='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",2)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",10)+'</span>';

				temp.gods['labor'].desc1='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",25)+'</span> <span class="red">'+loc("Buildings produce %1% less.",3)+'</span>';
				temp.gods['labor'].desc2='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",20)+'</span> <span class="red">'+loc("Buildings produce %1% less.",2)+'</span>';
				temp.gods['labor'].desc3='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",15)+'</span> <span class="red">'+loc("Buildings produce %1% less.",1)+'</span>';

				temp.gods['ages'].desc1=loc("Effect cycles over %1 hours.",12);
				temp.gods['ages'].desc2=loc("Effect cycles over %1 hours.",24);
				temp.gods['ages'].desc3=loc("Effect cycles over %1 hours.",48);

				temp.gods['industry'].desc1='<span class="green">'+loc("Buildings produce %1% more.",20)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",6)+'</span>';
				temp.gods['industry'].desc2='<span class="green">'+loc("Buildings produce %1% more.",14)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",4)+'</span>';
				temp.gods['industry'].desc3='<span class="green">'+loc("Buildings produce %1% more.",8)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",2)+'</span>';

				addLoc('Wrinkler spawning requires %1x more decay.');
				addLoc('Wrath cookies replaces Golden cookies with %1% less decay.');
				temp.gods['scorn'].desc1='<span class="green">'+loc('Wrinkler spawning requires %1x more decay.', 4)+'</span> <span class="red">'+loc('Wrath cookies replaces Golden cookies with %1% less decay.', 50);
				temp.gods['scorn'].desc2='<span class="green">'+loc('Wrinkler spawning requires %1x more decay.', 3)+'</span> <span class="red">'+loc('Wrath cookies replaces Golden cookies with %1% less decay.', 33);
				temp.gods['scorn'].desc3='<span class="green">'+loc('Wrinkler spawning requires %1x more decay.', 2)+'</span> <span class="red">'+loc('Wrath cookies replaces Golden cookies with %1% less decay.', 20);
				delete temp.gods['scorn'].descBefore;

				addLoc('Purifying decay grants a buff.');
				addLoc('-%1% decay for %2 seconds.');
				addLoc('Purifying decay grants a buff that weakens decay propagation.');
				temp.gods['creation'].descBefore='<span class="green">'+loc('Purifying decay grants a buff that weakens decay propagation.')+'</span>';
				temp.gods['creation'].desc1='<span class="green">'+loc('-%1% decay for %2 seconds.', [48, 4])+'</span>';
				temp.gods['creation'].desc2='<span class="green">'+loc('-%1% decay for %2 seconds.', [24, 16])+'</span>';
				temp.gods['creation'].desc3='<span class="green">'+loc('-%1% decay for %2 seconds.', [12, 64])+'</span>';

				addLoc('Decay propagation rate -%1%.');
				temp.gods['asceticism'].desc1='<span class="green">'+loc("+%1% base CpS.",15)+' '+loc('Decay propagation rate -%1%.', 30)+'</span>';
				temp.gods['asceticism'].desc2='<span class="green">'+loc("+%1% base CpS.",10)+' '+loc('Decay propagation rate -%1%.', 20)+'</span>';
				temp.gods['asceticism'].desc3='<span class="green">'+loc("+%1% base CpS.",5)+' '+loc('Decay propagation rate -%1%.', 10)+'</span>';

                //Making Cyclius display the nerf?
				eval("temp.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);","if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);"));
				eval("temp.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("else if (godLvl==2) mult*=0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);","else if (godLvl==2) mult*=0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);"));
                eval("temp.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("else if (godLvl==3) mult*=0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);","else if (godLvl==3) mult*=0.15*Math.sin((Date.now()/1000/(60*60*48))*Math.PI*2);"));

				eval("temp.slotGod="+replaceAll('M', 'pp', temp.slotGod.toString()));
				eval("temp.slotGod="+temp.slotGod.toString().replace('Game.recalculateGains=true;', 'Game.recalculateGains=true; decay.setRates();'))
				pantheonUpdated = true;
			}
		});

        //Buffing biscuit prices
		var butterBiscuitMult=100000000;

        Game.Upgrades['Milk chocolate butter biscuit'].basePrice=999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Dark chocolate butter biscuit'].basePrice=999999999999999999999999999999*butterBiscuitMult
        Game.Upgrades['White chocolate butter biscuit'].basePrice=999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Ruby chocolate butter biscuit'].basePrice=999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Lavender chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Synthetic chocolate green honey butter biscuit'].basePrice=999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Royal raspberry chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Ultra-concentrated high-energy chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Pure pitch-black chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Cosmic chocolate butter biscuit'].basePrice=999999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Butter biscuit (with butter)'].basePrice=999999999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Everybutter biscuit'].basePrice=999999999999999999999999999999999999999999999999999999999999*butterBiscuitMult
		Game.Upgrades['Personal biscuit'].basePrice=999999999999999999999999999999999999999999999999999999999999999*butterBiscuitMult

		allValues('pantheon');

		/*=====================================================================================
        News ticker
        =======================================================================================*/
		decay.getNews = function() {
			var newList = [];
			var name = Game.bakeryName;
			//add your new messages here
			
			if (Game.elderWrath==1) { newList.push(choose([
				'News : the elders are rioting, they are destroying a nearby factory!'
			])); }

			if (decay.incMult > 0.05) {
                newList = newList.concat([
                    'News: Decay rates spreading linked to global warming, says expert.'
                ]);
            }


			if (Game.Objects['Cursor'].amount>25) { newList = newList.concat([
				'News: Why are the cursors getting so big? What is the meaning of this?'
			]); }
			if (Game.Objects['Cursor'].amount>50) { newList = newList.concat([
				'News: what if, instead of having more fingers, we just made them click harder?',
				'News: cookies and cursors-storing warehouses found to be made of 99.8% fingers and 0.2% cookies, causing massive riots.'
			]); }
			if (Game.Objects['Cursor'].amount>100) { newList = newList.concat([
				'News: new "Million fingered" variety Cursors found to be the cause of death for several infants!',
				'News: finger-cutting jobs open for hire! Starting rate at fingers per hour!'
			]); }

			var grand = Game.Objects['Grandma'].amount;
			if (Game.Objects['Grandma'].amount>25) { newList = newList.concat([
				'News: analysis shows a possible type of grandmas opposite to that of normal grandmas, just like antimatter. Experts have coined it "grandpas".',
				'News: analysis shows that every year, on average, each grandma is getting '+Beautify(1 + Math.pow(grand, 2) * Game.Has('One mind') + Math.pow(grand, 4) * Game.Has('Communal brainsweep') + Math.pow(grand, 7) * Game.Has('Elder Pact'))+'% bigger.'
			]); }
			if (Game.Objects['Grandma'].amount>50) { newList = newList.concat([
				'AMBER ALERT: GRANDMA GONE MISSING. REPORT ANY POSSIBLE SIGHTINGS OF GRANDMA "'+choose(Game.grandmaNames).toUpperCase()+'" TO THE LOCAL AUTHORITY.',
				'SCIENTIFIC BREAKTHROUGH! Our top scientists just discovered that each grandma ages 1 year per year!'
			]); }
			if (Game.Objects['Grandma'].amount>100) { newList = newList.concat([
				'<i>"No."</i><sig>grandma</sig>',
				'<i>"It is not our fault."</i><sig>grandma</sig>',
			]); }

			if (Game.Objects['Farm'].amount>0) newList = newList.concat([
				'News : local cookie manufacturer grows "Mother of beets"; Farmers outraged by root entanglement strategy.',
				'News: Maniac spurts about "Pizza": locals confused, it sounds like a giant red cookie.'
			]);
			if (Game.Objects['Farm'].amount>25) { newList = newList.concat([
				'News: a new law has been introduced that limited the stem length of all cookie plants to a maximum of 1 µm.',
				'News: local cookie manufacturer have started using the sun to grow cookie plants.'
			]); }
			if (Game.Objects['Farm'].amount>50) { newList = newList.concat([
				'News: storage out of control! Cookie plants are dying after a recent invasion of cookies that broke through the greenhouse roof; officials blame the warehouse construction company.'
			]); }
			if (Game.Objects['Farm'].amount>100) { newList = newList.concat([
				'News: experts suggest that cookies from cookie plants are unsafe to eat if not heated to at least 6,000,000 celsius.',
				'News: farmers report difficulty distinguishing between the cookies on the cookie plants and all the cookies around them.',
				'News: another farmer dies from suffocation.'
			]); }

			if (Game.Objects['Mine'].amount>25) { newList = newList.concat([
				'News: interdimensional portals within cookie mineshafts have been discovered that leads to "Earth". The mineshaft is now permanently closed.'
			]); }
			if (Game.Objects['Mine'].amount>50) { newList = newList.concat([
				'News: cookie mineshafts are closing up in order to become storage for the ever-growing pile of cookies.'
			]); }
			if (Game.Objects['Mine'].amount>100) { newList = newList.concat([
				'News: I\'m not sure what\'s in those underground tunnels, it\'s not like those tunnels are mine.'
			]); }

			if (Game.Objects['Factory'].amount>25) { newList = newList.concat([
				'News: your Factories are now producing as much as cookies as before.'
			]); }
			if (Game.Objects['Factory'].amount>50) { newList = newList.concat([
				'News: Factories going awry after the mechanical failure of the cookie output, factory now filled with cookies & possibly will become a cookie volcano in the next hour!'
			]); }
			if (Game.Objects['Factory'].amount>100) { newList = newList.concat([
				'News: new legislation suggests that all cookie-producing Factories be repurposed to '+(Game.Objects['Factory'].amount>250?'planet':'warehouse')+'-producing factories.'
			]); }

			if (Game.Objects['Bank'].amount>25) { newList = newList.concat([
				'News: economists worldwide predict imminent economic collapse, saying that "if cookie prices ever drop below 1e-'+Math.floor(Math.max(Math.log10(Game.cookiesEarned) - 2, 0))+'..."'
			]); }
			if (Game.Objects['Bank'].amount>50) { newList = newList.concat([
				'News: it currently costs 10 cookies to store 3 cookies. Because of this, your banks are closing up.'
			]); }
			if (Game.Objects['Bank'].amount>100) { newList = newList.concat([
				'News: IN THIS ECONOMY??',
				'News: stock prices reach record highs after the destruction of the Great Space Cookie Patch! Traders hail in delight!'
			]); }

			if (Game.Objects['Antimatter condenser'].amount>25) { newList = newList.concat([
				'News: As it turns out, there is 1e200,405,192,204 times more antimatter than matter. Expert found cause to be "dimensions", whatever that means.',
				'News: Experts advise against turning antimatter to cookies, reason being "there is already way too much cookies, and antimatter can help clear out some cookies"'
			]); }
			if (Game.Objects['Antimatter condenser'].amount>50) { newList = newList.concat([
				'News: if there is so much cookies, why is there so little anticookies?'
			]); }
			if (Game.Objects['Antimatter condenser'].amount>100) { newList = newList.concat([
				'[news destroyed by antimatter]',
				'?secnetnesitna eht era erehw ,secnetnes hcum os si ereht fi :sewN'
			]); }

			if (Game.Objects['Prism'].amount>25) { newList = newList.concat([
				'News: Prisms are starting to exclusively use gamma rays to produce the smallest cookies possible.'
			]); }
			if (Game.Objects['Prism'].amount>50) { newList = newList.concat([
				'News: Prisms encounter issues outputting light, found cause to be cookies blocking the window! Officials will drop the next nuke tomorrow at 5:30, hopefully that\'ll clear it up a bit more.'
			]); }
			if (Game.Objects['Prism'].amount>100) { newList = newList.concat([
				'News: can we turn cookies back into light? Please?'
			]); }

			if (Game.Objects['Chancemaker'].amount>25) { newList = newList.concat([
				'News: it is considered lucky if the Chancemakers don\'t produce any cookies.'
			]); }
			if (Game.Objects['Chancemaker'].amount>50) { newList = newList.concat([
				'News: experts are considering the "quantom dislocation" optimization, wonders if the Chancemakers are powerful enough to dislocate a mass of cookies of 1,123,901,284 light years cubed.'
			]); }
			if (Game.Objects['Chancemaker'].amount>100) { newList = newList.concat([
				'News: you will see this news because RNG said yes.',
				'News: is the eyeballs really necessary? Experts consider removing one eyeball from each Chancemaker to save space to store more cookies.'
			]); }

			if (Game.Objects['Fractal engine'].amount>25) { newList = newList.concat([
				'News: Fractal engines are now forbidden to replicate into an exact copy of itself. '
			]); }
			if (Game.Objects['Fractal engine'].amount>50) { newList = newList.concat([
				'News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. ',
				'News: Fractal engines are encountering difficulty replicating. Experts are working hard to figure out where they are amongst the mass of cookies.'
			]); }
			if (Game.Objects['Fractal engine'].amount>100) { newList = newList.concat([
				'News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. News: Fractal engines are now forbidden to replicate into an exact copy of itself. Wait, we also can\'t?',
				'News: No, Fractal engines can\'t replicate into a larger copy of itself, either.'
			]); }

			var characters = ['q','w','e','r','t','y','u','i','o','p','a','s','d','f','g','h','j','k','l','z','x','c','v','b','n','m','1','2','3','4','5','6','7','8','9','0','Q','W','E','R','T','Y','U','I','O','P','A','S','D','F','G','H','J','K','L','Z','X','C','V','B','N','M'];
			var r = function(num) {
				var str = '';
				for (let i = 0; i < num; i++) {
					str += choose(characters);
				}
				return str;
			}

			if (Game.Objects['Javascript console'].amount>25) { newList = newList.concat([
				'News: if (me.when == "change code") { console.log(NaN); }',
				'News: programmers complain that they "can\'t see a thing" after using the new "all-natural sunlight" displays.'
			]); }
			if (Game.Objects['Javascript console'].amount>50) { newList = newList.concat([
				'News: this code is too unsightreadable.',
				'undefined',
				'News: '+r(Math.floor(Math.random() * 70) + 1)
			]); }
			if (Game.Objects['Javascript console'].amount>100 && Game.Objects['Time machine'].amount > 0) { newList = newList.concat([
				'News: price of LED skyrockets with the introduction of 1e18 x 1.8e18 wide screens.',
				'News: is it really necessary to write code with indent size 8?',
				'News: the source of the Great Cookie Space Patch has been attributed to the overuse of Javascript Consoles that take up too much space.'
			]); }

			if (Game.Objects['Idleverse'].amount>25) { newList = newList.concat([
				'News: experts question the appropriateness of the name "Idleverse", suggesting that they should be renamed to "Activeverse".'
			]); }
			if (Game.Objects['Idleverse'].amount>50) { newList = newList.concat([
				'News: Idleverses are being employed as bowling bulbs in recreational facilities. "Where else would you put them?" rhetorically-questions officials.'
			]); }
			if (Game.Objects['Idleverse'].amount>100 && Game.Objects['Time machine'].amount > 0) { newList = newList.concat([
				'News: experts suggest removing at least '+Math.floor(Game.Objects['Idleverse'].amount / 2)+' Idleverses after a catastrophic Idleverse Chained XK-Collapse scenario. '+name+', being the great baker, simply reverses time. "This will only happen again" warns experts.',
				'News: is Idleverses even worth keeping? Or should we remove some, so we can have more space to store cookies?',
				'News: scientists within Idleverses predict a Big Crunch to their universes. '
			]); }

		    if (Game.Objects['Cortex baker'].amount>0) { newList = newList.concat([
				'News: Cortex baker implodes, unknown plant puzzles blamed.',
				'News: it was discovered that thoughts can have thoughts "that is a tought thing to think"'
			]); }
			if (Game.Objects['Cortex baker'].amount>25) { newList = newList.concat([
				'News: You have a big brain.'
			]); }
			if (Game.Objects['Cortex baker'].amount>50) { newList = newList.concat([
				'News: "Cortex baker galaxy" can be seen during astronomical twilight.',
				'News: ordinary people found to have seizures after being in the presence of Cortex bakers for more than 1.5 microseconds. Due to space being clogged with wrinkly cookies, officials have no choice but to let them remain near people.'
			]); }

			if (Game.Objects['Cortex baker'].amount>100) { newList = newList.concat([
				'News: "The mass" Cortex baker cluster 3d9cjk reaches a record high of 1,204,589 congealed Cortex bakers! Experts suggest separating each Cortex Baker by at least 1 more kilometer; officials won\'t budge.',
				'News: Cortex bakers question the morality of thinking cookies into other Cortex bakers; advised to "keep working" even if there is nowhere else to put the cookies.'
			]); }

			if (Game.Objects['You'].amount>25) { newList = newList.concat([
				'News: local baker "'+name+'" and clones found to be the cause of at least 52,603 human rights violations; 99% of which are due to poor ventilation and overcrowding.',
				'News: '+name+'\'s clones are found to be harmful to philosophy.'
			]); }
			if (Game.Objects['You'].amount>50) { newList = newList.concat([
				'News: Who am I? Where did I come from? Where will I go?'
			]); }
			if (Game.Objects['You'].amount>100) { newList = newList.concat([
				'News: '+name+'\'s clones are beginning to shrink. Experts expect nuclear fusion to occur in the next 4 hours.'
			]); }

			if (Game.Objects['Wizard tower'].level>10) newList.push(choose([
				'News : local baker levels wizard towers past level 10, disowned by family.'
			]));

			if (Game.Objects['Factory'].amount>0) newList.push(choose([
				'News : competitor involved in destroying equipment scandal.'
			]));

			var buildNewList = [];

			for (let i in newList) {
				if (Math.random() < 0.2) { buildNewList.push(newList[i]); }
			}
			newList = buildNewList;

			if (Math.random()<0.001)
            {
                newList.push('<q>'+"JS is the best coding language."+'</q><sig>'+"no one"+'</sig>');
				newList.push('News : aleph reference REAL!');
				newList.push('News : "Say NO to ecm!" said protester.');
				newList.push('News : person called "rice" fails to execute a "combo", whatever that is.');
				newList.push('News : ticker broken, please insert another click.');
            }
            if (Math.random()<0.01)
            {  
                newList.push('News : ascend at 365.');
				newList.push('News : Gone too far, or not enough? Protests rising against "intense competition for seemingly boring stuff."');
				newList.push('News : it was discovered that the '+name+' is actually a-');
				newList.push('News : Cookie Hermits think of new recipes, locals are shocked: "Taste like grass."');
				newList.push('News : crazed citizen quits job and leaves family to "grind ascends"');
				if (Game.Has('Cookie egg')) newList.push('<q>'+"Give me food master."+'</q><sig>'+"krumblor"+'</sig>');
				newList.push('News : ancient hieroglyphs deciphered to resemble 365 cookies of a heavenly origin. "We\'re not sure what that means," ponder scientists.');
				newList.push('News : local news stations overrun by suggestions: "Didnt know modding was this annoying."');
                newList.push('News : you should grail.');
				newList.push('News : encyclopaedia\'s head editor denies allegations that he is a “daddy”, says to the public “stop calling me that”.');
				newList.push('News : hybrid human still keeps to the tradition of calling the head editor "daddy", refuses to take bribes.');
				newList.push('News : time manipulation growing old for the fiercely competitive baker industry, researchers pursue ways of the future by predicting ahead. "Everything is pre-determined, if you think about it."');
				if ((Game.AchievementsOwned==622)) newList.push('News : you did it, you can go outside now.');
				newList.push('News : "check the pins" crowned the phrase of the year!');
				newList.push('nEWS: aLL CAPITAL LETTERS REVERSED IN FREAK MAGIC ACCIDENT!');
				newList.push('News: Modders make "custom news tickers", public baffled at thought of corruption in the news.');
				newList.push('News: News: Words Words doubled doubled after after player player purchases purchases a a tiered tiered upgrade upgrade');
				newList.push('News: 8 disappearances reported in the past minute, officials blame mysterious "white vans" besides "empty fields with weird plants".')
            }
			return newList;
		}
		Game.registerHook('ticker', decay.getNews);

		Game.changeNews = function(message, newMessage) {
			eval('Game.getNewTicker='+Game.getNewTicker.toString().replace(message, newMessage));
		}
		Game.removeNews = function(message, noComma) {
			var comma = ','; if (noComma) { comma = ''; }
			eval('Game.getNewTicker='+Game.getNewTicker.toString().replace("'"+message+"'"+comma, newMessage));
		}

		/*=====================================================================================
        Custom upgrade
        =======================================================================================*/

		this.createAchievements=function(){//Adding the custom upgrade
			this.achievements = []
			this.achievements.push(new Game.Upgrade('Golden sugar',("Sugar lumps ripen <b>8 hours</b> sooner.")+'<q>Made from the highest quality sugar!</q>',1000000000,[28,16]))
			this.achievements.push(new Game.Upgrade('Cursedor',("Unlocks <b>cursedor</b>, which concentrates and converts your cookies clicked amount this ascension into a golden cookie; the more you clicked, the better effects the golden cookie will yield.")+'<q>Like Russian roulette, but for cookies.</q>',111111111111111111,[0,1,custImg])); Game.last.pool='prestige';
			Game.Upgrades['Cursedor'].parents=[Game.Upgrades['Luminous gloves']]
			Game.PrestigeUpgrades.push(Game.Upgrades['Cursedor'])
			Game.last.posY=-810,Game.last.posX=-144

			
		    this.achievements.push(new Game.Upgrade('Cursedor [inactive]',("Activating this will spawn a golden cookie based on the amount of times you clicked the big cookie this ascension when you click the big cookie. Upon use, your cookies clicked stat will be reset and the golden cookie spawned yields effects based on the amount it consumed."),0,[0,1,custImg]));
			Game.last.pool='toggle';Game.last.toggleInto='Cursedor [active]';

			this.achievements.push(new Game.Upgrade('Cursedor [active]',("The Cursor is currently active, and clicking the big cookie will reset your big cookies clicked amount and spawn a golden cookie. <br>Turning it off will revert those effects.</b>"),0,[0,1,custImg]));
		    Game.last.pool='toggle';Game.last.toggleInto='Cursedor [inactive]';Game.last.timerDisplay=function(){if (!Game.Upgrades['Cursedor [inactive]'].bought) return -1; else return 1-Game.fps*60*60*60*60*60*60;};

			this.achievements.push(Game.NewUpgradeCookie({name:'The ultimate cookie',desc:'These were made with the purest and highest quality ingredients, legend says: "whom has the cookie they shall become the most powerful baker.". No, this isn\'t just a normal cookie.',icon:[10,0],power:			20,	price:	999999999999999999999999999999999999999999999999999999999999999999999999999}));
			this.achievements.push(new Game.Upgrade('Purity vaccines', '<b>Stops all decay.</b><q>Developed for the time of need.</q>', 7, [20, 6])); Game.last.pool='debug'; Game.UpgradesByPool['debug'].push(Game.last);

			this.achievements.push(new Game.Upgrade('Unshackled Purity',("Purification is <b>no longer limited by caps</b>; however, increasing purity past the cap will require an increased amount of purification power. <br>The decay rate increase from purity increase <b>-25%</b>.")+'<q>One of the strongest antidotes that has been found; it can cure all known diseases.</q>',11111100000000000,[4,1,custImg])); Game.last.pool='prestige';
			Game.Upgrades['Unshackled Purity'].parents=[Game.Upgrades['Unshackled flavor'],Game.Upgrades['Unshackled berrylium'],Game.Upgrades['Unshackled blueberrylium'],Game.Upgrades['Unshackled chalcedhoney'],Game.Upgrades['Unshackled buttergold'],Game.Upgrades['Unshackled sugarmuck'],Game.Upgrades['Unshackled jetmint'],Game.Upgrades['Unshackled cherrysilver'],Game.Upgrades['Unshackled hazelrald'],Game.Upgrades['Unshackled mooncandy'],Game.Upgrades['Unshackled astrofudge'],Game.Upgrades['Unshackled alabascream'],Game.Upgrades['Unshackled iridyum'],Game.Upgrades['Unshackled glucosmium'],Game.Upgrades['Unshackled glimmeringue']]
			Game.PrestigeUpgrades.push(Game.Upgrades['Unshackled Purity'])
			Game.last.posY=195,Game.last.posX=750

			this.achievements.push(new Game.Upgrade('Unshackled Elder Pledge',("Makes Elder Pledge's purification <b>twice</b> as strong, and reduces the cooldown by <b>25%</b>.")+'<q>Your pledge to the grandmas is stronger than ever before.</q>',25600000000000000,[1,1,custImg])); Game.last.pool='prestige';
			Game.Upgrades['Unshackled Elder Pledge'].parents=[Game.Upgrades['Unshackled Purity']]
			Game.PrestigeUpgrades.push(Game.Upgrades['Unshackled Elder Pledge'])
			Game.last.posY=195,Game.last.posX=610
			
			this.achievements.push(new Game.Upgrade('Uranium rolling pins', ('The Elder Pledge halts decay for <b>3</b> times longer on use.')+('<q>Radiation, my superpower!</q>'), 900000000000000, [5, 1, custImg])); Game.last.pool='prestige'; 
			Game.Upgrades['Uranium rolling pins'].parents=[Game.Upgrades['Cat ladies']];
			Game.PrestigeUpgrades.push(Game.Upgrades['Uranium rolling pins']);
			Game.last.posY=-740; Game.last.posX=800;

			this.achievements.push(new Game.Upgrade('Sparkling wonder', ('The <b>Shimmering Veil</b> has a <b>10%</b> chance to be revived to full health on collapse.')+('<q>Just within reach, yet at what cost?</q>'), 1500000000000000, [23, 34])); Game.last.pool='prestige'; 
			Game.Upgrades['Sparkling wonder'].parents=[Game.Upgrades['Glittering edge']];
			Game.PrestigeUpgrades.push(Game.Upgrades['Sparkling wonder']);
			Game.last.posY=662; Game.last.posX=-622;
			
			this.achievements.push(new Game.Upgrade('Withering prices', 'Your upgrades are <b>0.1%</b> cheaper for every <b>x0.5</b> CpS multiplier from your decay.', 666, [3, 3, custImg])); Game.last.pool = 'prestige';
   			Game.Upgrades['Withering prices'].parents = [Game.Upgrades['Starter kit']];
	  		Game.PrestigeUpgrades.push(Game.Upgrades['Withering prices']);
	 		Game.last.posY = -300; Game.last.posX = -390;

			this.achievements.push(new Game.Upgrade('Caramelized luxury', 'Sugar lumps ripen <b>4 hours</b> sooner.<q>The caramelization process causes the sugar molecules to change states, giving it a strong, deep aroma.</q>', 1000000000000000, [28, 27]));
			this.achievements.push(new Game.Upgrade('Meaty disgust', 'Sugar lumps ripen <b>2 hours</b> sooner.<q>The presence of decay causes the sugar molecules growing within to fold in on itself, creating an entangled conglomeration that breeds agony.</q>', 1000000000000000000000000000, [28, 17]));
			this.achievements.push(new Game.Upgrade('High-fructose sugar lumps', 'Sugar lumps ripen <b>1 hour</b> sooner.<q>Despite how obviously unhealthy, it is undoubtly, very delicious.</q>', 1000000000000000000000000000000000000000000000, [28, 14]));
			this.achievements.push(new Game.Upgrade('Rainy day lumps', 'Mature sugar lumps are <b>5 times</b> less likely to botch.<q>Just in case of hunger.</q>', 1000000000000000000000000000000000000000000000000000000000000000, [29, 15]));
			
			eval('Game.clickLump='+Game.clickLump.toString().replace('var amount=choose([0,1]);', 'var amount=randomFloor(0.5 + Game.Has("Rainy day lumps") * 0.4);'));
			addLoc("This sugar lump is mature and will be ripe in <b>%1</b>.<br>You may <b>click it to harvest it now</b>, but there is a <b>%2% chance you won't get anything</b>.");
			eval('Game.lumpTooltip='+Game.lumpTooltip.toString().replace(`loc("This sugar lump is mature and will be ripe in <b>%1</b>.<br>You may <b>click it to harvest it now</b>, but there is a <b>50% chance you won't get anything</b>.",Game.sayTime(((Game.lumpRipeAge-age)/1000+1)*Game.fps,-1));`, `loc("This sugar lump is mature and will be ripe in <b>%1</b>.<br>You may <b>click it to harvest it now</b>, but there is a <b>%2% chance you won't get anything</b>.",[Game.sayTime(((Game.lumpRipeAge-age)/1000+1)*Game.fps,-1), 50 - Game.Has('Rainy day lumps') * 40]);`));
   			

			eval('Game.Upgrade.prototype.getPrice='+Game.Upgrade.prototype.getPrice.toString().replace('price*=0.95', '{ price*=0.95; } if (Game.Has("Withering prices")) { price *= Math.pow(0.999, Math.log2(Math.max(1 / decay.gen, 1))); }'));
			
			Game.Upgrades['Golden sugar'].order=350045
			Game.Upgrades['Cursedor'].order=253.004200000
			Game.Upgrades['Cursedor [inactive]'].order=14000
			Game.Upgrades['Cursedor [active]'].order=14000
			Game.Upgrades['The ultimate cookie'].order=9999999999
			Game.Upgrades['Purity vaccines'].order=1;
			Game.Upgrades['Unshackled Purity'].order=770;
			Game.Upgrades['Unshackled Elder Pledge'].order=771;
			Game.Upgrades['Uranium rolling pins'].order=275;
			Game.Upgrades['Sparkling wonder'].order = 283;
			Game.Upgrades['Withering prices'].order = 287;
			Game.Upgrades['Caramelized luxury'].order=350045;
			Game.Upgrades['Meaty disgust'].order=350045;
			Game.Upgrades['High-fructose sugar lumps'].order=350045;
			Game.Upgrades['Rainy day lumps'].order=350045;
			LocalizeUpgradesAndAchievs();
	
		}
		this.checkAchievements=function(){//Adding the unlock condition
			if (Game.cookiesEarned>=1000000000) { Game.Unlock('Golden sugar'); }
			if (Game.cookiesEarned>=1000000000000000) { Game.Unlock('Caramelized luxury'); }
			if (Game.AchievementsOwned>=400) { Game.Unlock('Meaty disgust'); }
			if (Game.AchievementsOwned>=500) { Game.Unlock('High-fructose sugar lumps'); }
			if (Game.HasAchiev('Sugar sugar')) { Game.Unlock('Rainy day lumps'); }

			if (Game.Has('Cursedor')) { Game.Unlock('Cursedor [inactive]'); }

			if (Game.AchievementsOwned>=622) { Game.Unlock('The ultimate cookie'); }
		}
		if(Game.ready) this.createAchievements()
		else Game.registerHook("create", this.createAchievements)
		Game.registerHook("check", this.checkAchievements)

		Game.parseNewLumpUpgrades = function() {
			var hour = 1000*60*60;
			if (Game.Has('Golden sugar')) { Game.lumpMatureAge-=(hour*8); Game.lumpRipeAge-=(hour*8);}
			if (Game.Has('Caramelized luxury')) { Game.lumpMatureAge-=(hour*4); Game.lumpRipeAge-=(hour*4); }
			if (Game.Has('Meaty disgust')) { Game.lumpMatureAge-=(hour*2); Game.lumpRipeAge-=(hour*2); }
			if (Game.Has('High-fructose sugar lumps')) { Game.lumpMatureAge-=(hour*1); Game.lumpRipeAge-=(hour*1); }
		}

		eval('Game.computeLumpTimes='+Game.computeLumpTimes.toString().replace('ipeAge/=2000;}','ipeAge/=2000;} Game.parseNewLumpUpgrades();'));//Adding the effect of the upgrade

		decay.CursedorUses = 0;

		//first number: absolute minimum clicks for that effect to spawn; seoncd number: the mult to click amount needed to gain another entry in the pool
		decay.cursedorThresholdMap = {
			'click frenzy': [60000, 2.5],
			'cursed finger': [5000, 3],
			'blood frenzy': [66666, 6],
			'sugar frenzy': [10000, 10],
			'sugar blessing': [10000, 3],
			'building special': [100000, 5],
			'cookie storm drop': [150, 15],
			'blab': [2500000, 1.25],
			'cookie storm': [10000, 8],
			'clot': [6666, 6],
			'ruin': [6666, 6],
			'everything must go': [200, 25],
			'Nasty goblins': [1000, 1000],
			'Haggler\'s misery': [1000, 1000],
			'Crafty pixies': [2500, 250],
			'Haggler\'s luck': [2500, 250],
			'free sugar lump': [2500000, 1.5],
			'dragon harvest': [300000, 2.5],
			'dragonflight': [111111, 11],
			'frenzy': [7500, 7.5],
			'multiply cookies': [7500, 7.5],
			'failure': [100, 100]
		}
		decay.getCursedorEffAdd = function(eff, clicks) {
			if (clicks < decay.cursedorThresholdMap[eff][0]) { return 0; }
			return randomFloor(Math.log(clicks / decay.cursedorThresholdMap[eff][0]) / Math.log(decay.cursedorThresholdMap[eff][1]));
		}
		Game.registerHook('click',function() {
			if (Game.Has("Cursedor [inactive]")) {
                decay.CursedorUses++;
				Math.seedrandom(Game.seed+'/'+decay.CursedorUses);
				var pool=[];

				for (let i in decay.cursedorThresholdMap) {
					for (let ii = 0; ii < decay.getCursedorEffAdd(i, Game.cookieClicks * 3 /*must preserve 66666*/); ii++) {
						pool.push(i);
					}
				}
				if (pool.length > 0) { 
					var toforce = choose(pool);
				} else {
					var toforce = 'failure';
				}
				if (toforce == 'building special' && Game.BuildingsOwned<10) { toforce = 'failure'; }
				if (toforce == 'click frenzy' && Game.hasBuff('Dragonflight')) { toforce = 'failure'; }
				if (toforce != 'failure') { var newShimmer = new Game.shimmer('golden'); newShimmer.force = toforce; Game.Popup('<div style="font-size:80%;">'+loc("Successful click! Click count reset.")+'</div>',Game.mouseX,Game.mouseY); } else {
					Game.Popup('<div style="font-size:80%;">'+loc("Failed due to not enough clicks! Click count reset.")+'</div>',Game.mouseX,Game.mouseY);
				}
				Game.cookieClicks=0;
				Math.seedrandom();
			}
		});
		allValues('init completion');
	},
	save: function(){
        let str = kaizoCookiesVer + '/';
        for(let i of this.achievements) {
          str+=i.unlocked; //using comma works like that in python but not js
          str+=i.bought; //seperating them otherwise it adds 1+1 and not "1"+"1"
        }
		str+='/';
		for (let i = 0; i < 20; i++) {
			str += decay.mults[i]; 
			str += ',';
		}
		str += decay.gen;
		str += '/' + decay.halt + ',' + decay.haltOvertime + ',' + decay.bankedPurification + '/';
		str += Game.pledgeT + ',' + Game.pledgeC;
		str += '/' + Game.veilHP + ',';
		if (Game.Has('Shimmering veil')) {
			if (Game.veilOn()) {
				str += 'on';
			} else if (Game.veilOff()) {
				str += 'off';
			} else if (Game.veilBroken()) {
				str += 'broken';
			}
		}
		str += ',';
		str += Game.veilRestoreC + ',' + Game.veilPreviouslyCollapsed + '/';
		for (let i in decay.prefs.preventNotifs) {
			str += decay.prefs.preventNotifs[i];
		}
		str += '/';
		str += 'h,' + decay.momentum;
        str += '/' + decay.CursedorUses + '/';
		for (let i in decay.times) {
			str += decay.times[i];
			str += ',';
		}
		str = str.slice(0, str.length - 1) + '/';
		for (let i in decay.prefs) {
			if (i != 'preventNotifs') { str += decay.prefs[i]; str += ','; }
		}
		str = str.slice(0, str.length - 1);
        return str;
    },
    load: function(str){
		//resetting stuff
		console.log('Kaizo Cookies loaded. Save string: '+str);
		str = str.split('/'); //results (current ver): [version, upgrades, decay mults, decay halt + overtime + banked purification, pledgeT + pledgeC, veilHP + veil status (on, off, or broken) + veilRestoreC + veilPreviouslyCollapsed, preventNotifs, momentum (this got added too late), cursedorUses, times, prefs (without preventNotifs)]
		if (str[0][0] == 'v') {
			var version = getVer(str[0]);
			for(let i=0;i<str[1].length;i += 2) { 
            	if (isv(str[1][i])) { this.achievements[i / 2].unlocked=Number(str[1][i]); }
            	if (isv(str[1][i + 1])) { this.achievements[i / 2].bought=Number(str[1][i + 1]); }
			}
			var strIn = str[2].split(',');
			for (let i in strIn) {
				if (isv(strIn[i])) { decay.mults[i] = parseFloat(strIn[i]); }
			}
			allValues('load; upgrades and decay basic');
			if (isv(strIn[20])) { decay.gen = parseFloat(strIn[20]); }
			
			strIn = str[3].split(',');
			if (isv(strIn[0])) { decay.halt = parseFloat(strIn[0]); }
			if (isv(strIn[1])) { decay.haltOvertime = parseFloat(strIn[1]); }
			if (isv(strIn[2])) { decay.bankedPurification = parseFloat(strIn[2]); }
			
			strIn = str[4].split(',');
			if (isv(strIn[0])) { Game.pledgeT = parseFloat(strIn[0]); } else { Game.pledgeT = 0; }
			if (isv(strIn[1])) { Game.pledgeC = parseFloat(strIn[1]); }
			if (Game.pledgeT > 0 || Game.pledgeC > 0) { Game.Upgrades['Elder Pledge'].bought = 1; } else { Game.Upgrades['Elder Pledge'].bought = 0; }
			
			strIn = str[5].split(',');
			allValues('load; pledge and halt');
			if (isv(strIn[0])) { Game.veilHP = parseFloat(strIn[0]); }
			
			if (Game.Has('Shimmering veil')) { 
				Game.Logic();
				if (strIn[1] == 'on') {
					Game.Upgrades['Shimmering veil [off]'].earn();
					Game.Lock('Shimmering veil [on]'); Game.Unlock('Shimmering veil [on]'); 
					Game.Lock('Shimmering veil [broken]');
				} else if (strIn[1] == 'off') {
					Game.Upgrades['Shimmering veil [on]'].earn();
					Game.Lock('Shimmering veil [off]'); Game.Unlock('Shimmering veil [off]'); 
					Game.Upgrades['Shimmering veil [broken]'].unlocked = 0;
				} else if (strIn[1] == 'broken'){
					Game.Lock('Shimmering veil [on]'); Game.Lock('Shimmering veil [off]');
					Game.Upgrades['Shimmering veil [broken]'].earn();
				} else {
					Game.Upgrades['Shimmering veil [on]'].earn();
					Game.Lock('Shimmering veil [off]'); Game.Unlock('Shimmering veil [off]'); 
					Game.Upgrades['Shimmering veil [broken]'].unlocked = 0;
					console.log('veil: something went wrong');
				}
			}
			if (isv(strIn[2])) { Game.veilRestoreC = parseFloat(strIn[2]); }
			if (isv(strIn[3])) { Game.veilPreviouslyCollapsed = Boolean(strIn[3]); }
   			
			allValues('load; veil');
			var counter = 0;
			strIn = str[6];
			for (let i in decay.prefs.preventNotifs) {
				if (isv(strIn[counter])) { decay.prefs.preventNotifs[i] = parseInt(strIn[counter]); }
				counter++;
			}
			strIn = str[7].split(',');
			if (isv(strIn[1])) { decay.momentum = parseFloat(strIn[1]); }

            if (isv(str[8])) { decay.CursedorUses = parseInt(str[8]); }

			strIn = str[9].split(',');
			counter = 0;
			for (let i in decay.times) {
				if (isv(strIn[counter])) { decay.times[i] = parseInt(strIn[counter]); }
				counter++;
			}

			strIn = str[10].split(',');
			counter = 0;
			for (let i in decay.prefs) {
				if (isv(strIn[counter]) && i != 'preventNotifs') { decay.prefs[i] = parseInt(strIn[counter]); }
				if (i != 'preventNotifs') { counter++; }
			}
		} else {
			str = str[0];
			for(let i=0;i<this.achievements.length;i++) { //not using in because doesnt let you use i if it is greater than the array length
            	this.achievements[i].unlocked=Number(str[2*i]); //multiplied by 2 because 2 values for each upgrade
            	this.achievements[i].bought=Number(str[(2*i)+1]); //+1 for the second value	
			}
		}
	    Game.storeToRefresh=1;
		allValues('load completion');
    }
});
