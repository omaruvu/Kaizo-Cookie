var decay = {};
var kaizoCookiesVer = 'v1.1.2'

//additional helper functions
function replaceDesc(name, toReplaceWith) {
	Game.Upgrades[name].baseDesc = toReplaceWith;
	Game.Upgrades[name].desc = toReplaceWith;
	Game.Upgrades[name].ddesc = toReplaceWith;
}
function addLoc(str) {
	locStrings[str] = str;
}
function getVer(str) {
	if (str[0] !== 'v') { return false; }
	str = str.slice(1, str.length);
	str = str.split('.');
	for (let i in str) { str[i] = parseFloat(str[i]); }
	return str;
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
	for (let i = 0; i < arr.length; i++) {
		sum += Math.log(arr[i]);
	} 
	sum /= arr.length;
	return Math.exp(sum) //wtf is an antilog
}

Game.registerHook('check', () => {//This makes it so it only actives the code if the minigame is loaded
	if (Game.Objects['Wizard tower'].minigameLoaded) {
		var gp = Game.Objects['Wizard tower'].minigame //acts as proxy for the replaced functions
	}
});

Game.registerMod("Kaizo Cookies", { 
	init: function() { 
//Special thanks to Cursed, Yeetdragon, Lookas for helping me with the code, Fififoop for quality control & suggestions, Rubik for suggestions
//and cookiemains for playtesting this mod, you can look at the cookiemains section to see what ideas he suggested

		
		
        // notification!
		Game.Notify(`Oh, so you think comp is too easy?`, `Good luck.`, [21,32],10,1);

		// creating custImg variable
		custImg=App?this.dir+"/img.png":"https://raw.githack.com/omaruvu/Kaizo-Cookie/main/modicons.png"

		//overriding notification so some really important notifs can last for any amount of time even with quick notes on
		eval('Game.Notify='+Game.Notify.toString().replace('quick,noLog', 'quick,noLog,forceStay').replace('if (Game.prefs.notifs)', 'if (Game.prefs.notifs && (!forceStay))'));

		/*=====================================================================================
        Decay & GPOC
        =======================================================================================*/
		//the decay object is declared outside of the mod object for conveience purposes
		//decay: a decreasing multiplier to buildings, and theres a different mult for each building. The mult decreases the same way for each building tho
		decay.mults = []; for (let i in Game.Objects) { decay.mults.push(1); } 
		decay.mults.push(1); //the "general multiplier", is just used for checks elsewhere (and "egg")
		decay.incMult = 0.04; //decay mult is decreased by this multiplicative every second
		decay.min = 0.15; //the minimum power that the update function uses; the lower it is, the slower the decay will pick up
		decay.halt = 1; //simulates decay stopping from clicking
		decay.haltOvertime = 0; //each halt, a fraction of the halt time is added to this; overtime will be expended when the main halt time runs out, but overtime is less effective at stopping decay
		decay.haltOTLimit = 4; //OT stands for overtime
		decay.decHalt = 0.33; // the amount that decay.halt decreases by every second
		decay.haltFactor = 0.5; //how quickly decay recovers from halt
		decay.haltKeep = 0.25; //the fraction of halt time that is kept when halted again
		decay.haltOTDec = 0.5; //"halt overtime decrease", decHalt also applies to overtime but multiplied by this
		decay.haltOTEfficiency = 0.75; //overtime is multiplied by this when calculating its effect on decay
		decay.wrinklerSpawnThreshold = 0.8; //above this decay mult, wrinklers can never spawn regardless of chance
		decay.wrinklerSpawnFactor = 0.8; //the more it is, the faster wrinklers spawn
		decay.wcPow = 0.25; //the more it is, the more likely golden cookies are gonna turn to wrath cokies with less decay
		decay.cpsList = [];
		decay.exemptBuffs = ['clot', 'building debuff', 'loan 1 interest', 'loan 2 interest', 'loan 3 interest', 'gifted out', 'haggler misery', 'pixie misery'];
		decay.gcBuffs = ['frenzy', 'click frenzy', 'dragonflight', 'dragon harvest', 'building buff', 'blood frenzy', 'cookie storm'];
		decay.justMult = 0; //debugging use
		decay.infReached = false;
		decay.unlocked = false;
		if (Game.cookiesEarned > 1000) { decay.unlocked = true; }
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
				multipleBuffs: 0
			},
			firstNotif: {
				initiate: 1,
				achievement: 1,
				purity: 1,
				wrinkler: 1,
				wrath: 1,
				gpoc: 1,
				decayII: 1,
				veil: 1,
				buff: 1,
				multipleBuffs: 1
			}
		}
		decay.notifCalls = {
			initiate: 0,
			purity: 0,
			gpoc: 0,
			decayII: 0,
			buff: 0,
			multipleBuffs: 0
		}
		decay.update = function(buildId, tickSpeed) { 
			if (Game.Has('Purity vaccines')) { return 1; }
			var c = decay.mults[buildId];
			var godz = Game.hasBuff('Devastation').arg2; if (!godz) { godz = 1; }
    		c *= Math.pow(1 - (1 - Math.pow((1 - decay.incMult / Game.fps), Math.max(1 - decay.mults[buildId], decay.min))) * (Math.max(1, Math.pow(decay.gen, 1.2)) - Math.min(Math.pow(decay.halt + decay.haltOvertime * decay.haltOTEfficiency, decay.haltFactor), 1)), (1 + Game.Has('Elder Covenant') * 0.5) * godz * tickSpeed);
			return c;
		} 
		decay.updateAll = function() {
			if (Game.cookiesEarned <= 1000) { decay.unlocked = false; return false; } else { decay.unlocked = true; }
			for (let i in decay.mults) {
				var c = decay.update(i, (Game.veilOn()?(1 - Game.getVeilBoost()):1));
				if (isFinite(1 / c)) { decay.mults[i] = c; } else { if (!isNaN(c)) { if (i == 20) { console.log('Infinity reached. decay mult: '+c); }decay.mults[i] = 1 / Number.MAX_VALUE; decay.infReached = true; } }
			}
			decay.regainAcc();
			if (Game.T % 2) {
				Game.recalculateGains = 1;	
			}
			decay.cpsList.push(Game.unbuffedCps);
			if (decay.cpsList.length > Game.fps * 1.5) {
				decay.cpsList.shift();
			}
			if (Game.pledgeT > 0) {
				var strength = Game.getPledgeStrength();
				decay.purifyAll(strength[0], strength[1], strength[2]);
			}
			if (Game.pledgeC > 0) {
				Game.pledgeC--;
				if (Game.pledgeC == 0) {
					Game.Lock('Elder Pledge');
					Game.Unlock('Elder Pledge');
				}
			}
			decay.gen = decay.mults[20];
			Game.updateVeil();
			if (decay.infReached) { decay.onInf(); infReached = false; }
		}
		decay.purify = function(buildId, mult, close, cap) {
			if (decay.mults[buildId] >= cap) { return true; }
			decay.mults[buildId] *= mult;
			if (decay.mults[buildId] >= cap) { decay.mults[buildId] = cap; return true; }
			decay.mults[buildId] *= Math.pow(10, (Math.log10(cap) - Math.log10(decay.mults[buildId])) * close);
			if (decay.mults[buildId] > cap) { decay.mults[buildId] = cap; }
		}
		decay.purifyAll = function(mult, close, cap) {
			for (let i in decay.mults) {
				decay.purify(i, mult, close, cap);
			}
		}
		decay.refresh = function(buildId, to) { 
   			decay.mults[buildId] = Math.max(to, decay.mults[buildId]);
		}
		decay.refreshAll = function(to) {
			for (let i in decay.mults) {
				decay.refresh(i, to);
			}
			Game.recalculateGains = 1;
		}
		//stands for "regain acceleration"
		decay.regainAcc = function() { 
    		decay.halt = Math.max(0, decay.halt - decay.decHalt / Game.fps);
			if (decay.halt == 0) {
				decay.haltOvertime = Math.max(0, decay.haltOvertime - decay.decHalt / Game.fps);
			} else {
				decay.haltOvertime = Math.max(0, decay.haltOvertime - (decay.decHalt * decay.haltOTDec) / Game.fps);
			}
		}
		decay.stop = function(val) {
			decay.halt = val;
			decay.haltOvertime = Math.min(decay.halt * decay.haltOTLimit, decay.haltOvertime + decay.halt * decay.haltKeep); 
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
				desc: 'Due to aging and corruption in your facilities, CpS continuously decreases over time. You can temporarily stop it from decreasing with certain actions, such as clicking the big cookie; or purify the decay\'s effects by, for example, clicking a Golden or Wrath cookie.',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.initiate',
				first: 'decay.prefs.firstNotif.initiate',
				nocall: 'decay.notifCalls.initiate'
			},
			achievement: {
				title: 'Achievements',
				desc: 'Obtaining an achievement also purifies your decay by a very large amount.',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.achievement',
				first: 'decay.prefs.firstNotif.achievement'
			},
			purity: {
				title: 'Purity',
				desc: 'If you can purify all of your decay, any extra purification power will be spent as an increase in CpS. The extra CpS (called "purity") acts as a sacrifical filler for the decay; the more purity you have, the quicker the decay will be in eating through them.',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.purity',
				first: 'decay.prefs.firstNotif.purity',
				nocall: 'decay.notifCalls.purity'
			},
			wrinkler: {
				title: 'Wrinklers',
				desc: 'Wrinklers now wither a very large amount of CpS each and loses cookies on pop, but if you manage to pop them before they reach the big cookie, your decay gets stopped for much longer than just clicking!<br>Also, the withering affects clicks, unlike in vanilla',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.wrinkler',
				first: 'decay.prefs.firstNotif.wrinkler'
			},
			wrath: {
				title: 'Wrath cookies',
				desc: 'Wrath cookies now replaces Golden cookies according to the amount of decay you have when it spawns; the more decay you have, the more often it replaces Golden cookies. Luckily, it still purifies decay the same way as Golden cookies do.',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.wrath',
				first: 'decay.prefs.firstNotif.wrath'
			},
			gpoc: {
				title: 'Grandmapocalypse', 
				desc: 'The Grandmapocalypse, in the vanilla sense, no longer exists. It has been replaced by the decay mechanic. As well, all other Grandmapocalypse-related items now help you combat the decay.',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.gpoc',
				first: 'decay.prefs.firstNotif.gpoc',
				nocall: 'decay.notifCalls.gpoc'
			}, 
			decayII: {
				title: 'decay: the return',
				desc: 'The decay gets stronger as you progress through the game, but you also obtain more items to help you fight it as the game goes on. ',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.decayII',
				first: 'decay.prefs.firstNotif.decayII',
				nocall: 'decay.notifCalls.decayII'
			},
			veil: {
				title: 'Shimmering Veil',
				desc: 'While there is no sources to directly examine your Shimmering Veil\'s welldoing, you can infer its health from the brightness of the veil around the big cookie, as well as the particles swirling around it.',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.veil',
				first: 'decay.prefs.firstNotif.veil'
			},
			buff: {
				title: 'Buffs under decay',
				desc: 'Positive buffs now run out faster the more decay you have accumulated. Stay vigilant!<br>(This uses the current amount of decay, which means that any decay accumulated before the buff was obtained will also contribute to the buff running out faster)',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.buff',
				first: 'decay.prefs.firstNotif.buff',
				nocall: 'decay.notifCalls.buff'
			},
			multipleBuffs: {
				title: 'Buff stacking',
				desc: 'Stacking more than one Golden cookie buff significantly increases your rate of decay.',
				icon: [0, 0],
				pref: 'decay.prefs.preventNotifs.multipleBuffs',
				first: 'decay.prefs.firstNotif.multipleBuffs',
				nocall: 'decay.notifCalls.multipleBuffs'
			}
		}
		decay.triggerNotif = function(key) {
			if (eval(decay.notifs[key].pref)) { console.log('Corresponding pref not found.'); return false; }
			if (!decay.unlocked) { return false; }
			if (typeof eval(decay.notifs[key].nocall) !== 'undefined') { 
				if (decay.notifCalls[key]) { return true; } else { decay.notifCalls[key] = 1; /*I kinda give up*/ } 
			}
			Game.Notify(decay.notifs[key].title, decay.notifs[key].desc+'<div class="line"></div><a style="float:right;" onclick="'+decay.notifs[key].pref+'=1;==CLOSETHIS()==">'+loc("Don't show this again")+'</a>', decay.notifs[key].icon, (eval(decay.notifs[key].first)?1e21:6), false, true);
			decay.prefs.firstNotif[key] = 0;
		}
		decay.refreshTrigger = function(key) {
			if (typeof eval(decay.notifs[key].nocall) !== 'undefined') {
				if (eval(decay.notifs[key].nocall)) { eval(decay.notifs[key].nocall+'=0'); }
			}
		}
		decay.checkRefreshes = function() {
			if (!decay.unlocked) { decay.notifCalls['initiate'] = 0; }
			if (decay.gen <= 1.2) { decay.notifCalls['purity'] = 0; }
			if (decay.gen > 0.5) { decay.notifCalls['gpoc'] = 0; }
			if (decay.incMult < 0.04) { decay.notifCalls['decayII'] = 0; }
			if (!Game.buffCount()) { decay.notifCalls['buff'] = 0; }
			if (!(Game.buffCount() - 1)) { decay.notifCalls['multipleBuffs'] = 0; }
		}
		Game.buffCount = function() {
			var count = 0;
			for (let i in Game.buffs) { count++; }
			return count;
		}
		Game.registerHook('check', decay.checkRefreshes);
		decay.checkTriggerNotifs = function() {
			if (Game.drawT % 10 != 0) { return false; }
			if (decay.unlocked) { decay.triggerNotif('initiate'); }
			if (decay.gen > 1.2) { decay.triggerNotif('purity'); }
			if (decay.gen <= 0.5) { decay.triggerNotif('gpoc'); }
			if (decay.incMult >= 0.04) { decay.triggerNotif('decayII'); }
			if (Game.buffCount() && decay.gen <= 0.5) { decay.triggerNotif('buff'); }
			if (Game.buffCount() > 1) { decay.triggerNotif('multipleBuffs'); }
		}
		Game.registerHook('logic', decay.checkTriggerNotifs);
		eval('Game.Win='+Game.Win.toString().replace('Game.recalculateGains=1;', 'decay.triggerNotif("achievement"); Game.recalculateGains=1;'));
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes["golden"].popFunc.toString().replace("if (me.wrath) Game.Win('Wrath cookie');", "if (me.wrath) { decay.triggerNotif('wrath'); Game.Win('Wrath cookie'); }"))
		
		//ui and display and stuff
		decay.term = function(mult) {
			if (mult > 1) { return 'purity'; }
			return 'decay';
		}
		
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
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('Game.recalculateGains=0;', 'Game.recalculateGains=0; decay.lastCpS = decay.curCpS; decay.curCpS = Game.unbuffedCps;'));
		if (false) { Game.registerHook('draw', function() { if (Game.drawT % 3) { Game.UpdateMenu(); } }); } //feels like stretching the bounds of my computer a bit here

		decay.diffStr = function() {
			var str = '<b>CpS multiplier from '+decay.term(decay.gen)+': </b>';
			if (decay.gen < 0.00001) {
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
			} else { 
				str += '<small>-</small>'; 
				str += Beautify(((1 - num) * 100), 3);
			}
			str += '%';
			return str;
		}

		eval('Game.UpdateMenu='+Game.UpdateMenu.toString().replace(`(giftStr!=''?'<div class="listing">'+giftStr+'</div>':'')+`, `(giftStr!=''?'<div class="listing">'+giftStr+'</div>':'')+'<div id="decayMultD" class="listing">'+decay.diffStr()+'</div>'+`).replace(`'<div class="listing"><b>'+loc("Cookies per second:")`,`'<div id="CpSD" class="listing"><b>'+loc("Cookies per second:")`).replace(`'<div class="listing"><b>'+loc("Raw cookies per second:")`,`'<div id="RawCpSD" class="listing"><b>'+loc("Raw cookies per second:")`).replace(`'<div class="listing"><b>'+loc("Cookies per click:")`,`'<div id="CpCD" class="listing"><b>'+loc("Cookies per click:")`));
		Game.UpdateMenu();
		decay.updateStats = function() {
			if (Game.onMenu=='stats') { 
				document.getElementById('decayMultD').innerHTML = decay.diffStr();
				document.getElementById('CpSD').innerHTML = '<b>'+loc("Cookies per second:")+'</b> '+Beautify(Game.cookiesPs,1)+' <small>'+'('+loc("multiplier:")+' '+Beautify(Math.round(Game.globalCpsMult*100),1)+'%)'+(Game.cpsSucked>0?' <span class="warning">('+loc("withered:")+' '+Beautify(Math.round(Game.cpsSucked*100),1)+'%</span>':'')+'</small>';
				document.getElementById('RawCpSD').innerHTML = '<b>'+loc("Raw cookies per second:")+'</b> '+Beautify(Game.cookiesPsRaw,1)+' <small>'+'('+loc("highest this ascension:")+' '+Beautify(Game.cookiesPsRawHighest,1)+')'+'</small>';
				document.getElementById('CpCD').innerHTML = '<b>'+loc("Cookies per click:")+'</b> '+Beautify(Game.computedMouseCps,1);
			}
		}
		Game.registerHook('draw', decay.updateStats);
		//"D" stands for display, mainly just dont want to conflict with any other id and lazy to check
		
		//decay scaling
		decay.setRates = function() {
			var d = 1;
			var c = Game.cookiesEarned;
			d *= Math.pow(0.999, Math.log10(c));
			d *= Math.pow(0.99825, Math.log2(Math.max(Game.goldenClicks - 77, 1)));
			d *= Math.pow(0.9975, Math.max(Math.sqrt(Game.AchievementsOwned) - 4, 0));
			d *= Math.pow(0.9975, Math.max(Math.sqrt(Game.UpgradesOwned) - 5, 0));
			d *= Math.pow(0.9975, Math.max(Math.pow(Game.BuildingsOwned, 0.33) - 10, 0));
			d *= Math.pow(0.997, Math.log2(Math.max(Game.lumpsTotal, 1)));
			d *= Math.pow(0.999, Math.pow(Game.dragonLevel, 0.6));
			d *= Math.pow(0.9999, Math.log2(Math.max(Date.now() - Game.startDate - 100000, 1))); //hopefully not too bruh
			if (Game.Has('Lucky day')) { d *= 0.99; }
			if (Game.Has('Serendipity')) { d *= 0.99; }
			if (Game.Has('Get lucky')) { d *= 0.99; }
			if (Game.Has('One mind')) { d *= 0.985; }
			if (Game.Has('Shimmering veil')) { d *= 0.985; }
			decay.incMult = 1 - d;

			var w = 1 - 0.8;
			w *= Math.pow(0.99, Math.log10(c));
			decay.wrinklerSpawnFactor = 1 - w;
			decay.wrinklerSpawnThreshold = 1 - w * 3.5;

			decay.min = Math.min(1, 0.15 + (1 - d) * 3.5);

			var dh = 0.33;
			dh *= Math.pow(1.012, Math.log10(c));
			dh *= 1 / d;
			decay.decHalt = dh;
		}
		decay.setRates();
		Game.registerHook('check', decay.setRates);

		
		//decay's effects
		Game.registerHook('logic', decay.updateAll);
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].cps='+Game.Objects[i].cps.toString().replace('CpsMult(me);', 'CpsMult(me); mult *= decay.get(me.id); '));
		}
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`{Game.cookiesPs+=9;Game.cookiesPsByType['"egg"']=9;}`,`{Game.cookiesPs+=9*decay.gen;Game.cookiesPsByType['"egg"']=9*decay.gen;}`));
		eval("Game.shimmerTypes['golden'].initFunc="+Game.shimmerTypes['golden'].initFunc.toString()
			 .replace(' || (Game.elderWrath==1 && Math.random()<1/3) || (Game.elderWrath==2 && Math.random()<2/3) || (Game.elderWrath==3)', ' || ((!Game.Has("Elder Covenant")) && Math.random() > Math.pow(decay.gen, decay.wcPow))'));
		addLoc('+%1/min');
		Game.registerHook('check', () => {
			if (Game.Objects['Wizard tower'].minigameLoaded) {
				var gp = Game.Objects['Wizard tower'].minigame
				var M = gp;
				eval('gp.logic='+gp.logic.toString().replace('M.magicPS=Math.max(0.002,Math.pow(M.magic/Math.max(M.magicM,100),0.5))*0.002;', 'M.magicPS = Math.pow(Math.min(2, decay.gen), 0.3) * Math.max(0.002,Math.pow(M.magic/Math.max(M.magicM,100),0.5))*0.006;'));
				eval('gp.logic='+replaceAll('M.','gp.',gp.logic.toString()));
				eval('gp.draw='+M.draw.toString().replace(`Math.min(Math.floor(M.magicM),Beautify(M.magic))+'/'+Beautify(Math.floor(M.magicM))+(M.magic<M.magicM?(' ('+loc("+%1/s",Beautify((M.magicPS||0)*Game.fps,2))+')'):'')`,
														 `Math.min(Math.floor(M.magicM),Beautify(M.magic))+'/'+Beautify(Math.floor(M.magicM))+(M.magic<M.magicM?(' ('+loc("+%1/min",Beautify((M.magicPS||0)*Game.fps*60,3))+')'):'')`)
					.replace(`loc("Spells cast: %1 (total: %2)",[Beautify(M.spellsCast),Beautify(M.spellsCastTotal)]);`,
						 `loc("Spells cast: %1 (total: %2)",[Beautify(M.spellsCast),Beautify(M.spellsCastTotal)]); M.infoL.innerHTML+="; Magic regen multiplier from "+decay.term(decay.gen)+": "+decay.effectStrs([function(n, i) { return Math.pow(Math.min(2, n), 0.3)}]); `));
				eval('gp.draw='+replaceAll('M.','gp.',gp.draw.toString()));		
				
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
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('var chance=0.00001*Game.elderWrath;','var chance=0.0001 / Math.pow(decay.gen, decay.wrinklerSpawnFactor); if (decay.gen >= decay.wrinklerSpawnThreshold) { chance = 0; }'))//Making it so wrinklers spawn outside of gpoc
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('if (me.close<1) me.close+=(1/Game.fps)/10;','if (me.close<1) me.close+=(1/Game.fps)/(12*(1+Game.auraMult("Dragon God")*4));'))//Changing Wrinkler movement speed
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('if (me.phase==0 && Game.elderWrath>0 && n<max && me.id<max)','if (me.phase==0 && n<max && me.id<max)'));
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('me.sucked+=(((Game.cookiesPs/Game.fps)*Game.cpsSucked));//suck the cookies','if (!Game.auraMult("Dragon Guts")) { me.sucked+=(Game.cpsSucked * 10 * Game.cookiesPs)/Game.fps; }'));
		/*wrinkler pop*/ eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('Game.Earn(me.sucked);', 'Game.cookies = Math.max(0, Game.cookies - me.sucked); if (me.sucked > 0.5) { decay.triggerNotif("wrinkler"); }'))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace('var suckRate=1/20;', 'var suckRate=1/2;').replace('Game.cpsSucked=Math.min(1,sucking*suckRate);', 'Game.cpsSucked=1 - Math.min(1,Math.pow(suckRate, sucking)); if (Math.ceil(Game.auraMult("Dragon Guts") - 0.1)) { Game.cpsSucked = 1; }'));
		Game.registerHook('cookiesPerClick', function(val) { return val * (1 - Game.cpsSucked); }); //withering affects clicking
        eval('Game.SpawnWrinkler='+Game.SpawnWrinkler.toString().replace('if (Math.random()<0.0001) me.type=1;//shiny wrinkler','if (Math.random()<1/8192) me.type=1;//shiny wrinkler'))
		eval('Game.getWrinklersMax='+Game.getWrinklersMax.toString().replace(`n+=Math.round(Game.auraMult('Dragon Guts')*2);`, ''));
		eval('Game.updateBuffs='+Game.updateBuffs.toString().replace('buff.time--;','if (!decay.exemptBuffs.includes(buff.type.name)) { buff.time -= 1 / (Math.min(1, decay.gen)) } else { buff.time--; }'));

		Game.registerHook('cps', function(m) { return m * 4; }); //quadruples cps to make up for the decay

		
		//ways to purify/refresh/stop decay
		eval('Game.shimmer.prototype.pop='+Game.shimmer.prototype.pop.toString().replace('popFunc(this);', 'popFunc(this); decay.purifyAll(3.5, 0.5 / 1.5, 1.5); decay.stop(4);'));
		decay.clickBCStop = function() {
			decay.stop(0.5);
		}
		Game.registerHook('click', decay.clickBCStop);
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace(`Game.wrinklersPopped++;`, `Game.wrinklersPopped++; if (!me.close) { decay.stop(2 * Math.max((1 - Game.auraMult('Dragon Guts')), 0)); } `));
		eval('Game.Win='+Game.Win.toString().replace('Game.recalculateGains=1;', 'decay.purifyAll(10, 0.8, 3);'));
		decay.reincarnateBoost = function() {
			decay.stop(20);
			decay.refreshAll(10);
		}
		Game.registerHook('reincarnate', decay.reincarnateBoost);
		
		//purification: elder pledge & elder covenant
		for (let i in Game.UpgradesByPool['tech']) {
			Game.UpgradesByPool['tech'][i].basePrice /= 1000000;
		}
		Game.registerHook('check', function() {
			if (Game.Objects['Grandma'].amount>=25) { Game.Unlock('Bingo center/Research facility'); }
		});
		replaceDesc('One mind', 'Each grandma gains <b>+0.0<span></span>2 base CpS per grandma</b>.<br>Also unlocks the <b>Elder Pledge</b>, which slowly purifies the decay for some cookies.<q>Repels the ancient evil with industrial magic.</q>');
		replaceDesc('Exotic nuts', 'Cookie production multiplier <b>+4%</b>, and <b>halves</b> the Elder Pledge cooldown.<q>You\'ll go crazy over these!</q>');
		replaceDesc('Communal brainsweep', 'Each grandma gains another <b>+0.0<span></span>2 base CpS per grandma</b>, and makes the Elder Pledge purify for <b>twice as much time</b>.<q>Burns the corruption with the worker\'s might.</q>');
		replaceDesc('Arcane sugar', 'Cookie production multiplier <b>+5%</b>, and <b>halves</b> the Elder Pledge cooldown, and halves the Elder Pledge cooldown.<q>You\'ll go crazy over these!</q>');
		replaceDesc('Elder Pact', 'Each grandma gains <b>+0.0<span></span>5 base CpS per portal</b>, and makes the Elder Pledge <b>twice as powerful</b>.<q>Questionably unethical.</q>');
		replaceDesc('Sacrificial rolling pins', 'The Elder Pledge is <b>10 times</b> cheaper.<q>As its name suggests, it suffers so that everyone can live tomorrow.</q>');
		Game.Upgrades['One mind'].clickFunction = function() { };
		Game.Upgrades['Elder Pact'].clickFunction = function() { };
		replaceDesc('Elder Pledge', 'Purifies the decay, at least for a short, short while.<br>Price also scales with highest raw CpS this ascend.<q>Although, yes - the cost is now uncapped; the scaling is now much, much weaker.</q>');
		Game.Upgrades['Elder Pledge'].buyFunction = function() {
			Game.pledges++;
			Game.pledgeT=Game.getPledgeDuration();
			Game.Unlock('Elder Covenant');
			decay.stop(10);
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
			var str = 0.2; 
			if (Game.Has('Elder Pact')) { str *= 2; }
			if (Game.Has('Unshackled Elder Pledge')) { str *= 2; }
			var cap = 5;
			if (Game.Has('Elder Pact')) { cap *= 2; }
			return [1 + (str / Game.fps), 0.5 / (Game.getPledgeDuration() * cap), cap];
		}
		Game.getPledgeCooldown = function() {
			var c = Game.fps * 10 * 60;
			if (Game.Has('Exotic nuts')) { c /= 2; }
			if (Game.Has('Arcane sugar')) { c /= 2; }
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
			 .replace('Game.elderWrath=1;', 'Game.Notify("Purification complete!", "You also gained some extra cps to act as buffer for the decay.")')
			 .replace(`Game.Lock('Elder Pledge');`,'Game.pledgeC = Game.getPledgeCooldown();')
			 .replace(`Game.Unlock('Elder Pledge');`, '')
			 .replace(`(Game.Has('Elder Pact') && Game.Upgrades['Elder Pledge'].unlocked==0)`, `(Game.Has('One mind') && Game.Upgrades['Elder Pledge'].unlocked==0)`)
		);

		
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
		replaceDesc('Glittering edge', 'The <b>Shimmering Veil</b> takes on <b>25%</b> more decay.<q>Just within reach, yet at what cost?</q>');
		Game.Upgrades['Shimmering veil'].basePrice /= 1000;
		Game.Upgrades['Reinforced membrane'].basePrice /= 1000;
		Game.Upgrades['Delicate touch'].basePrice /= 1000;
		Game.Upgrades['Steadfast murmur'].basePrice /= 1000;
		Game.Upgrades['Glittering edge'].basePrice /= 1000;
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
			Game.Lock('Shimmering veil [on]');
			Game.Lock('Shimmering veil [off]');
			Game.Upgrades['Shimmering veil [broken]'].earn();
			Game.veilRestoreC = Game.getVeilCooldown();
			Game.veilPreviouslyCollapsed = true;
			decay.purify(Math.pow(Game.veilHP / Game.veilMaxHP, Game.veilAbsorbFactor * Game.getVeilReturn()), 0, 1);
			Game.Notify('Veil collapse!', 'Your Shimmering Veil collapsed.', [30, 5]);
			PlaySound('snd/spellFail.mp3',1);
		}
		Game.loseShimmeringVeil = function(c) { } //prevent veil from being lost from traditional methods
		//veil graphics down below
		var veilDrawOrigin = selectStatement(Game.DrawBackground.toString(), Game.DrawBackground.toString().indexOf("if (Game.veilOn())"));
		var veilDraw = veilDrawOrigin;
		Game.veilOpacity = function() {
			return Math.pow(Game.veilHP / Game.veilMaxHP, 0.35)
		}
		Game.veilRevolveFactor = function(set) {
			return 0.04 * (1 + set * 0.6) * Math.pow(Game.veilHP / Game.veilMaxHP, 0.3);
		}
		Game.veilParticleSizeMax = function(set) {
			return 64 * Math.pow(0.85, set) * Math.pow((Game.veilHP / Game.veilMaxHP), 0.3);
		}
		Game.veilParticleSpeed = function(set) {
			return 32 * Math.pow(1.4, set) * Math.pow(Game.veilHP / Game.veilMaxHP, 0.3);
		}
		Game.veilParticleSpeedMax = function(set) {
			return 32 * (1 + set * 0.5);
		}
		Game.veilParticleQuantity = function(set) {
			return Math.round(9 * (set + 1));
		}
		Game.veilParticleSpawnBound = function(set) {
			return 40 + 70 * (1 - Math.pow(Game.veilHP / Game.veilMaxHP, 0.75));
		}
		veilDraw = veilDraw.replace('ctx.globalAlpha=1;', 'ctx.globalAlpha=Game.veilOpacity();');
		veilDraw = veilDraw.replace("ctx.globalCompositeOperation='source-over';", "ctx.globalAlpha = 1; ctx.globalCompositeOperation='source-over';");
		var veilParticlesOrigin = selectStatement(veilDraw, veilDraw.indexOf('for (i=0;i<6;i++)'));
		var veilParticles = veilParticlesOrigin;
		veilParticles = veilParticles.replace('for (i=0;i<6;i++)', 'for (i=0;i<Game.veilParticleQuantity(set);i++)');
		veilParticles = veilParticles.replace('var t=Game.T+i*15;', 'var t=Game.T+i*Math.round((90 / Game.veilParticleQuantity(set)));');
		veilParticles = veilParticles.replace('var a=(Math.floor(t/30)*30*6-i*30)*0.01;', 'var a=(Math.floor(t/30)*30*6-i*30)*Game.veilRevolveFactor(set);');
		veilParticles = veilParticles.replace('var size=32*(1-Math.pow(r*2-1,2));', 'var size=Game.veilParticleSizeMax(set)*(1-Math.pow(r*2-1,2));');
		veilParticles = veilParticles.
		replace('var xx=x+Math.sin(a)*(110+r*16);', 'var xx=x+Math.sin(a)*(Game.veilParticleSpawnBound(set)+Game.veilParticleSpeed(set) * Math.cos(r));').replace('var yy=y+Math.cos(a)*(110+r*16);', 'var yy=y+Math.cos(a)*(Game.veilParticleSpawnBound(set)+Game.veilParticleSpeed(set) * Math.sin(r));');
		veilDraw = veilDraw.replace(veilParticlesOrigin, 'var set = 0; '+veilParticles+'; set = 1; '+veilParticles+'; set = 2; '+veilParticles+'; set = 3; '+veilParticles);
		eval('Game.DrawBackground='+Game.DrawBackground.toString().replace(veilDrawOrigin, veilDraw));

		//other nerfs and buffs down below (unrelated but dont know where else to put them)
		
		//Shimmer pool
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("if (me.wrath>0) list.push('clot','multiply cookies','ruin cookies');","if (me.wrath>0) list.push('clot','ruin cookies');"));//Removing lucky from the wrath cookie pool
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("if (Game.BuildingsOwned>=10 && Math.random()<0.25) list.push('building special');","if (Game.BuildingsOwned>=10 && me.wrath==0 && Math.random()<0.25) list.push('building special');"));//Removing bulding specail from the wrath cookie pool

		/*=====================================================================================
        Minigames 
        =======================================================================================*/
        eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace("if (Game.hasBuff('Crafty pixies')) price*=0.98;","if (Game.hasBuff('Crafty pixies')) price*=0.90;"))//Buffing the crafty pixies effect from 2% to 10%

		Game.registerHook('check', () => {//This makes it so it only actives the code if the minigame is loaded
			if (Game.Objects['Wizard tower'].minigameLoaded) {
				eval("Game.Objects['Wizard tower'].minigame.spells['summon crafty pixies'].desc=" + '"' + Game.Objects['Wizard tower'].minigame.spells['summon crafty pixies'].desc.replace('2', '10') + '"');//chaning the desc of the spell
				eval("Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].win=" + Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].win.toString().replace("{if ((Game.Objects[i].amount<max || n==1) && Game.Objects[i].getPrice()<=Game.cookies*2 && Game.Objects[i].amount<400) buildings.push(Game.Objects[i]);}", "{if ((Game.Objects[i].amount<max || n==1) && Game.Objects[i].getPrice()<=Game.cookies*2 && Game.Objects[i].amount<1000) buildings.push(Game.Objects[i]);}"))//SE works up to 1k
				eval("Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].desc=" + '"' + Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].desc.replace('400', '1000') + '"');
			}
		});

        //Garden changes
		Game.registerHook('check', () => {
			if (Game.Objects['Farm'].minigameLoaded) {
		        M=Game.Objects['Farm'].minigame//Declaring M.soilsById so computeEffs works (this took hours to figure out)
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
				eval("Game.Objects['Farm'].minigame.getMuts="+Game.Objects['Farm'].minigame.getMuts.toString().replace("if (neighsM['bakerWheat']>=1 && neighsM['thumbcorn']>=1) muts.push(['cronerice',0.01]);","if (neighsM['bakerWheat']>=1 && neighsM['wrinklegill']>=1) muts.push(['cronerice',0.01]);"));
				eval("Game.Objects['Farm'].minigame.getMuts="+Game.Objects['Farm'].minigame.getMuts.toString().replace("if (neighsM['cronerice']>=1 && neighsM['thumbcorn']>=1) muts.push(['gildmillet',0.03]);","if (neighsM['bakerWheat']>=1 && neighsM['thumbcorn']>=1) muts.push(['gildmillet',0.03]);"));

				//Nerfing some plants effects
				eval("Game.Objects['Farm'].minigame.computeEffs="+Game.Objects['Farm'].minigame.computeEffs.toString().replace("effs.cursorCps+=0.01*mult","effs.cursorCps+=0.005*mult"));
				eval("Game.Objects['Farm'].minigame.computeEffs="+Game.Objects['Farm'].minigame.computeEffs.toString().replace("else if (name=='whiskerbloom') effs.milk+=0.002*mult;","else if (name=='whiskerbloom') effs.milk+=0.0005*mult;"));

				eval("Game.Objects['Farm'].minigame.convert="+Game.Objects['Farm'].minigame.convert.toString().replace("Game.gainLumps(10);","Game.gainLumps(15);"));//Changing how much saccing gives

			    //Desc   	 
				Game.Objects['Farm'].minigame.plants['bakerWheat'].children=['bakerWheat','thumbcorn','cronerice','gildmillet','bakeberry','clover','goldenClover','chocoroot','tidygrass'];
				Game.Objects['Farm'].minigame.plants['thumbcorn'].children=['bakerWheat','thumbcorn','gildmillet','glovemorel'];
				Game.Objects['Farm'].minigame.plants['wrinklegill'].children=['cronerice','elderwort','shriekbulb'];

		        //Effect desc
				Game.Objects['Farm'].minigame.plants['whiskerbloom'].effsStr='<div class="green">&bull;'+loc("milk effects")+'+0.05%</div>';
				Game.Objects['Farm'].minigame.plants['glovemorel'].effsStr='<div class="green">&bull;'+loc("cookies/click")+'+4%</div><div class="green">&bull; '+loc("%1 CpS",Game.Objects['Cursor'].single)+' +0.5%</div><div class="red">&bull; '+loc("CpS")+' -1%</div>';

                //Sac desc
				Game.Objects['Farm'].minigame.tools['convert'].desc=loc("A swarm of sugar hornets comes down on your garden, <span class=\"red\">destroying every plant as well as every seed you've unlocked</span> - leaving only a %1 seed.<br>In exchange, they will grant you <span class=\"green\">%2</span>.<br>This action is only available with a complete seed log.",[loc("Baker's wheat"),loc("%1 sugar lump",LBeautify(15))]);
				eval("Game.Objects['Farm'].minigame.askConvert="+Game.Objects['Farm'].minigame.askConvert.toString().replace("10","15"));
				eval("Game.Objects['Farm'].minigame.convert="+Game.Objects['Farm'].minigame.convert.toString().replace("10","15"));
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
				Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].desc=loc("+20% prestige level effect on CpS for 20 seconds.");
				Game.Objects['Wizard tower'].minigame.spells['conjure baked goods'].failDesc=loc("Trigger a %1-minute clot and lose half of your cookies owned.",15);
			}
		});
		
		
		/*=====================================================================================
        Upgrades
        =======================================================================================*/
		eval('Game.mouseCps='+Game.mouseCps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))//Changing how much unshackled cursors give
		eval("Game.Objects['Cursor'].cps="+Game.Objects['Cursor'].cps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))//changing how much unshackled cursors buffs cursors

		var getStrThousandFingersGain=function(x)//Variable for the desc of unshackled cursor 
		{return loc("Multiplies the gain from %1 by <b>%2</b>.",[getUpgradeName("Thousand fingers"),x]);}
		Game.Upgrades['Unshackled cursors'].ddesc=getStrThousandFingersGain(20)+'<q>These hands tell a story.</q>';//Changing the desc to reflect all the changes

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
            if (!(i=='Cursor')) {s.ddesc=s.ddesc.replace(s.ddesc.slice(0,s.ddesc.indexOf('<q>')),'Tiered upgrades for <b>'+i+'</b> provide an extra <b>'+(id==1?'45':(20-id)*9)+'%</b> production.<br>Only works with unshackled upgrade tiers.');}
        }

        Game.Upgrades['Pure heart biscuits'].basePrice=1000000000000000000000000000000000000000000000000000
        Game.Upgrades['Ardent heart biscuits'].basePrice=1000000000000000000000000000000000000000000000000000000
        Game.Upgrades['Sour heart biscuits'].basePrice=1000000000000000000000000000000000000000000000000000000000
        Game.Upgrades['Weeping heart biscuits'].basePrice=1000000000000000000000000000000000000000000000000000000000000
        Game.Upgrades['Golden heart biscuits'].basePrice=1000000000000000000000000000000000000000000000000000000000000000
		Game.Upgrades['Eternal heart biscuits'].basePrice=1000000000000000000000000000000000000000000000000000000000000000000
		Game.Upgrades['Prism heart biscuits'].basePrice=1000000000000000000000000000000000000000000000000000000000000000000000

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
		Game.Upgrades['Wrinkly cookies'].ddesc=loc("Cookie production multiplier <b>+%1% permanently</b>.",15)+'<q>The result of regular cookies left to age out for countless eons in a place where time and space are meaningless.</q>'

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

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`list.push('blood frenzy','chain cookie','cookie storm');`,`if (Math.random()<Game.auraMult('Unholy Dominion')){list.push('blood frenzy')}if (Game.auraMult('Unholy Dominion')>1) {if (Math.random()<Game.auraMult('Unholy Dominion')-1){list.push('blood frenzy')}}`));//Unholy Dominion pushes another EF to the pool making to so they are twice as common

		eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace("heavenlyMult*=1+Game.auraMult('Dragon God')*0.05;","heavenlyMult*=1+Game.auraMult('Dragon God')*0.20;"));

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight');`,`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight'); if (Math.random()<Game.auraMult('Ancestral Metamorphosis')) { for (let i = 0; i < 10; i++) { list.push('Ancestral Metamorphosis'); } }`));//Adding custom effect for Ancestral Metamorphosis 

        eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`else if (choice=='blood frenzy')`,`else if (choice=='Ancestral Metamorphosis')
        {
			var valn=Math.max(7,Math.min(Game.cookies*1.0,Game.cookiesPs*60*60*24));
			Game.Earn(valn);
			popup=loc("Dragon\'s hoard!")+'<br><small>'+loc("+%1!",loc("%1 cookie",LBeautify(valn)))+'</small>';
        }else if (choice=='blood frenzy')`));//When Ancestral Metamorphosis is seclected it pushes a effect called Dragon's hoard that gives 24 hours worth of CpS

        Game.dragonAuras[2].desc="Clicking is <b>5%</b> more powerful."+'<br>'+"Click frenzy and Dragonflight is <b>50%</b> more powerful.";
		Game.dragonAuras[6].desc="All upgrades are <b>10% cheaper</b>.";
		Game.dragonAuras[7].desc="All buildings are <b>5% cheaper</b>.";
        Game.dragonAuras[8].desc="<b>+20%</b> prestige level effect on CpS."+'<br>'+"Wrinklers approach the big cookie <b>5 times</b> slower.";
        Game.dragonAuras[11].desc="Golden cookies give <b>10%</b> more cookies."+'<br>'+"Golden cookies may trigger a <b>Dragon\'s hoard</b>.";
		Game.dragonAuras[12].desc="Wrath cookies give <b>10%</b> more cookies."+'<br>'+"Elder frenzy appear <b>twice as often</b>.";
        Game.dragonAuras[15].desc="All cookie production <b>multiplied by 1.5</b>.";
		Game.dragonAuras[21].desc="Each wrinkler always wither 100% of your CpS and popping wrinklers no longer slow down decay, but wrinklers no longer accumulate cookie loss when eating."

		/*=====================================================================================
        because Cookiemains wanted so
        =======================================================================================*/
		Game.registerHook('check', () => {
			if (Game.Objects['Wizard tower'].minigameLoaded) {
				grimoire=Game.Objects['Wizard tower'].minigame;
                grimoire.spells['hand of fate'].failFunc=function(){return 0.5};//Making FTHOF fail chance always 50%

				eval("Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win="+Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win.toString().replace("//if (Math.random()<0.2) choices.push('clot','cursed finger','ruin cookies');","if (Math.random()<0.2) choices.push('clot','cursed finger','ruin cookies');"))//Making this unused code used
		        eval("Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win="+Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win.toString().replace("if (Game.BuildingsOwned>=10 && Math.random()<0.25) choices.push('building special');","if (Game.BuildingsOwned>=10 && Math.random()<0.10) choices.push('building special');"))//Changing building special to 10%
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
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) milkMult*=1.05;","else if (godLvl==2) milkMult*=1.03;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) milkMult*=1.03;","else if (godLvl==3) milkMult*=1.01;"))

        //Buffing Mokalsium negative effect
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("if (godLvl==1) m*=1.15;","if (godLvl==1) m*=1.20;"));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("else if (godLvl==2) m*=1.1;","else if (godLvl==2) m*=1.15;"));
		eval('Game.shimmerTypes["golden"].getTimeMod='+Game.shimmerTypes['golden'].getTimeMod.toString().replace("else if (godLvl==3) m*=1.05;","else if (godLvl==3) m*=1.1;"));

        //Buffing Jeremy
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) buildMult*=1.1;","if (godLvl==1) buildMult*=1.15;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) buildMult*=1.06;","else if (godLvl==2) buildMult*=1.11;"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) buildMult*=1.03;","else if (godLvl==3) buildMult*=1.06;"))

        //Nerfing? Cyclius
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);","if (godLvl==1) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);","else if (godLvl==2) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);"))
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);","else if (godLvl==3) mult*=1+0.15*Math.sin((Date.now()/1000/(60*60*48))*Math.PI*2);"))

		//implementing godzamok change will be so annoying
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace(`if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01);`, `if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01,1+sold*0.01);`).replace(`else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005);`, `else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005,1+sold*0.004);`).replace(`else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025);`,`else if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025,1+sold*0.0015);`));
		}
		
		addLoc('Buff boosts clicks by +%1% for every building sold for %2 seconds, ');
		addLoc('but also temporarily increases decay propagation by %1% with every building sold.')
		Game.registerHook('check', () => {
			if (Game.Objects['Temple'].minigameLoaded) {
				//Changing the desc
				Game.Objects['Temple'].minigame.gods['ruin'].desc1='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [1, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay propagation by %1% with every building sold.",[1])+'</span>';
				Game.Objects['Temple'].minigame.gods['ruin'].desc2='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [0.5, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay propagation by %1% with every building sold.",[0.4])+'</span>';
				Game.Objects['Temple'].minigame.gods['ruin'].desc3='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds, ", [0.25, 10])+'</span> <span class="red">'+loc("but also temporarily increases decay propagation by %1% with every building sold.",[0.15])+'</span>';

				Game.Objects['Temple'].minigame.gods['mother'].desc1='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",8)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",20)+'</span>';
				Game.Objects['Temple'].minigame.gods['mother'].desc2='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",4)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",15)+'</span>';
				Game.Objects['Temple'].minigame.gods['mother'].desc3='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",2)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",10)+'</span>';

				Game.Objects['Temple'].minigame.gods['labor'].desc1='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",25)+'</span> <span class="red">'+loc("Buildings produce %1% less.",3)+'</span>';
				Game.Objects['Temple'].minigame.gods['labor'].desc2='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",20)+'</span> <span class="red">'+loc("Buildings produce %1% less.",2)+'</span>';
				Game.Objects['Temple'].minigame.gods['labor'].desc3='<span class="green">'+loc("Clicking is <b>%1%</b> more powerful.",15)+'</span> <span class="red">'+loc("Buildings produce %1% less.",1)+'</span>';

				Game.Objects['Temple'].minigame.gods['ages'].desc1=loc("Effect cycles over %1 hours.",12);
				Game.Objects['Temple'].minigame.gods['ages'].desc2=loc("Effect cycles over %1 hours.",24);
				Game.Objects['Temple'].minigame.gods['ages'].desc3=loc("Effect cycles over %1 hours.",48);

				Game.Objects['Temple'].minigame.gods['industry'].desc1='<span class="green">'+loc("Buildings produce %1% more.",15)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",10)+'</span>';
				Game.Objects['Temple'].minigame.gods['industry'].desc2='<span class="green">'+loc("Buildings produce %1% more.",11)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",6)+'</span>';
				Game.Objects['Temple'].minigame.gods['industry'].desc3='<span class="green">'+loc("Buildings produce %1% more.",6)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",3)+'</span>';

                //Making Cyclius display the nerf?
				eval("Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*3))*Math.PI*2);","if (godLvl==1) mult*=0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);"))
				eval("Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("else if (godLvl==2) mult*=0.15*Math.sin((Date.now()/1000/(60*60*12))*Math.PI*2);","else if (godLvl==2) mult*=0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);"))
                eval("Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc="+Game.Objects['Temple'].minigame.gods['ages'].activeDescFunc.toString().replace("else if (godLvl==3) mult*=0.15*Math.sin((Date.now()/1000/(60*60*24))*Math.PI*2);","else if (godLvl==3) mult*=0.15*Math.sin((Date.now()/1000/(60*60*48))*Math.PI*2);"))
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

		/*=====================================================================================
        Custom upgrade
        =======================================================================================*/

		this.createAchievements=function(){//Adding the custom upgrade
			this.achievements = []
			this.achievements.push(new Game.Upgrade('Golden sugar',(" Sugar lumps mature <b>8 hours sooner</b>.")+'<q>Made from the highest quality sugar!</q>',1000000000,[28,16]))
			this.achievements.push(new Game.Upgrade('Cursedor',("Unlocks <b>cursedor</b>, each time you click the big cookie you will get a random effect.<div class=\"warning\">But there is a 50% chance of you ascending.</div>")+'<q>Like Russian roulette, but for cookies.</q>',111111111111111111,[0,1,custImg])); Game.last.pool='prestige';
			Game.Upgrades['Cursedor'].parents=[Game.Upgrades['Luminous gloves']]
			Game.PrestigeUpgrades.push(Game.Upgrades['Cursedor'])
			Game.last.posY=-810,Game.last.posX=-144

			
		    this.achievements.push(new Game.Upgrade('Cursedor [inactive]',("Activating this will give you a <b>random Effect</b> if you click the big cookie.<div class=\"warning\">But there is a 50% chance of you ascending every time you click the big cookie.</div>"),0,[0,1,custImg]));
			Game.last.pool='toggle';Game.last.toggleInto='Cursedor [active]';

			this.achievements.push(new Game.Upgrade('Cursedor [active]',("The Cursor is currently active, if you click the big cookie it will give you a random effect; it will also has a chance of you ascending.<br>Turning it off will revert those effects.<br>"),0,[0,1,custImg]));
		    Game.last.pool='toggle';Game.last.toggleInto='Cursedor [inactive]';Game.last.timerDisplay=function(){if (!Game.Upgrades['Cursedor [inactive]'].bought) return -1; else return 1-Game.fps*60*60*60*60*60*60;};

			this.achievements.push(Game.NewUpgradeCookie({name:'The ultimate cookie',desc:'These were made with the purest and highest quality ingredients, legend says: "whom has the cookie they shall become the most powerful baker.". No, this isn\'t just a normal cookie.',icon:[10,0],power:			20,	price:	999999999999999999999999999999999999999999999999999999999999999999999999999}));
			this.achievements.push(new Game.Upgrade('Purity vaccines', '<b>Stops all decay.</b><q>Developed for the time of need.</q>', 7, [20, 6])); Game.last.pool='debug'; Game.UpgradesByPool['debug'].push(Game.last);

			this.achievements.push(new Game.Upgrade('Unshackled Elder Pledge',("Makes purification <b>twice</b> as stronger.")+'<q>Your pledge to the grandmas is stronger than ever before.</q>',51200000000000000,[1,1,custImg])); Game.last.pool='prestige';
			Game.Upgrades['Unshackled Elder Pledge'].parents=[Game.Upgrades['Unshackled flavor'],Game.Upgrades['Unshackled berrylium'],Game.Upgrades['Unshackled blueberrylium'],Game.Upgrades['Unshackled chalcedhoney'],Game.Upgrades['Unshackled buttergold'],Game.Upgrades['Unshackled sugarmuck'],Game.Upgrades['Unshackled jetmint'],Game.Upgrades['Unshackled cherrysilver'],Game.Upgrades['Unshackled hazelrald'],Game.Upgrades['Unshackled mooncandy'],Game.Upgrades['Unshackled astrofudge'],Game.Upgrades['Unshackled alabascream'],Game.Upgrades['Unshackled iridyum'],Game.Upgrades['Unshackled glucosmium'],Game.Upgrades['Unshackled glimmeringue']]
			Game.PrestigeUpgrades.push(Game.Upgrades['Unshackled Elder Pledge'])
			Game.last.posY=195,Game.last.posX=750
			
			Game.Upgrades['Golden sugar'].order=350045
			Game.Upgrades['Cursedor'].order=253.004200000
			Game.Upgrades['Cursedor [inactive]'].order=14000
			Game.Upgrades['Cursedor [active]'].order=14000
			Game.Upgrades['The ultimate cookie'].order=9999999999
			Game.Upgrades['Purity vaccines'].order=1;
			Game.Upgrades['Unshackled Elder Pledge'].order=770;
			LocalizeUpgradesAndAchievs();
	
		}
		this.checkAchievements=function(){//Adding the unlock condition
			if (Game.cookiesEarned>=1000000000) Game.Unlock('Golden sugar')

			if (Game.Has('Cursedor')) Game.Unlock('Cursedor [inactive]');

			if ((Game.AchievementsOwned==622)) Game.Unlock('The ultimate cookie')
		}
		if(Game.ready) this.createAchievements()
		else Game.registerHook("create", this.createAchievements)
		Game.registerHook("check", this.checkAchievements)

		eval('Game.computeLumpTimes='+Game.computeLumpTimes.toString().replace('ipeAge/=2000;}','ipeAge/=2000;} if (Game.Has("Golden sugar")) { Game.lumpMatureAge-=(hour*8); }'));//Adding the effect of the upgrade

		Game.registerHook('click',function() {
			if (Game.Has("Cursedor [inactive]")) {
				if (Math.random()<1/2) { 
					Game.Ascend(1)
				}    
				//select an effect
				var list = [];
				list.push('clot', 'frenzy');
				list.push('blood frenzy');
				list.push('everything must go');
				list.push('click frenzy');
				list.push('cursed finger');
				list.push('building special');
				list.push('dragon harvest');
				list.push('dragonflight');
				
				var choice = choose(list);
				
				this.last = choice;
				
				//create buff for effect
				//buff duration multiplier
				var effectDurMod = 1;
				if (Game.Has('Get lucky')) effectDurMod *= 2;
				if (Game.Has('Lasting fortune')) effectDurMod *= 1.1;
				if (Game.Has('Lucky digit')) effectDurMod *= 1.01;
				if (Game.Has('Lucky number')) effectDurMod *= 1.01;
				if (Game.Has('Green yeast digestives')) effectDurMod *= 1.01;
				if (Game.Has('Lucky payout')) effectDurMod *= 1.01;
				//if (Game.hasAura('Epoch Manipulator')) effectDurMod *= 1.05;
				effectDurMod *= 1 + Game.auraMult('Epoch Manipulator') * 0.05;
				
				if (Game.hasGod) {
					var godLvl = Game.hasGod('decadence');
					if (godLvl == 1) effectDurMod *= 1.07;
					else if (godLvl == 2) effectDurMod *= 1.05;
					else if (godLvl == 3) effectDurMod *= 1.02;
				}
				
				//effect multiplier (from lucky etc)
				var mult = 1;
				//if (me.wrath>0 && Game.hasAura('Unholy Dominion')) mult*=1.1;
				//else if (me.wrath==0 && Game.hasAura('Ancestral Metamorphosis')) mult*=1.1;
			
				if (Game.Has('Green yeast digestives')) mult *= 1.01;
				if (Game.Has('Dragon fang')) mult *= 1.03;
				
				
				var popup = '';
				var buff = 0;
				
				if (choice == 'building special') {
					var time = Math.ceil(30 * effectDurMod);
					var list = [];
					for (var i in Game.Objects) {
						if (Game.Objects[i].amount >= 10) list.push(Game.Objects[i].id);
					}
					if (list.length == 0) {
						choice = 'frenzy';
					} //default to frenzy if no proper building
					else {
						var obj = choose(list);
						var pow = Game.ObjectsById[obj].amount / 10 + 1;
						if (Math.random() < 0.3) {
							buff = Game.gainBuff('building debuff', time, pow, obj);
						} else {
							buff = Game.gainBuff('building buff', time, pow, obj);
						}
					}
				}
				
				if (choice == 'frenzy') {
					buff = Game.gainBuff('frenzy', Math.ceil(77 * effectDurMod), 7);
				} else if (choice == 'dragon harvest') {
					buff = Game.gainBuff('dragon harvest', Math.ceil(60 * effectDurMod), 15);
				} else if (choice == 'everything must go') {
					buff = Game.gainBuff('everything must go', Math.ceil(8 * effectDurMod), 5);
				} else if (choice == 'blood frenzy') {
					buff = Game.gainBuff('blood frenzy', Math.ceil(6 * effectDurMod), 666);
				} else if (choice == 'clot') {
					buff = Game.gainBuff('clot', Math.ceil(66 * effectDurMod), 0.5);
				} else if (choice == 'cursed finger') {
					buff = Game.gainBuff('cursed finger', Math.ceil(10 * effectDurMod), Game.cookiesPs * Math.ceil(10 * effectDurMod));
				} else if (choice == 'click frenzy') {
					buff = Game.gainBuff('click frenzy', Math.ceil(13 * effectDurMod), 777);
				} else if (choice == 'dragonflight') {
					buff = Game.gainBuff('dragonflight', Math.ceil(10 * effectDurMod), 1111);
					if (Math.random() < 0.8) Game.killBuff('Click frenzy');
				}
			}
		});

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
		str += '/' + decay.halt + ',' + decay.haltOvertime + '/';
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
		str += ',';
		for (let i in decay.prefs.firstNotif) {
			str += decay.prefs.firstNotif[i];
		}
        return str;
    },
    load: function(str){
		//resetting stuff
		console.log('Kaizo Cookies loaded. Save string: '+str);
		str = str.split('/'); //results (current ver): [version, upgrades, decay mults, decay halt + overtime, pledgeT + pledgeC, veilHP + veil status (on, off, or broken) + veilRestoreC + veilPreviouslyCollapsed, preventNotifs + firstNotif]
		if (str[0][0] == 'v') {
			var version = getVer(str[0]);
			for(let i=0;i<str[1].length;i += 2) { 
            	this.achievements[i / 2].unlocked=Number(str[1][i]); 
            	this.achievements[i / 2].bought=Number(str[1][i + 1]); 
			}
			//Game.Lock('Shimmering veil [broken]'); how tf is this making cookies NaN
			var strIn = str[2].split(',');
			for (let i in strIn) {
				decay.mults[i] = parseFloat(strIn[i]);
			}
			strIn = str[3].split(',');
			decay.halt = parseFloat(strIn[0]);
			decay.haltOvertime = parseFloat(strIn[1]);
			strIn = str[4].split(',');
			Game.pledgeT = parseFloat(strIn[0]);
			Game.pledgeC = parseFloat(strIn[1]);
			if (Game.pledgeT > 0 || Game.pledgeC > 0) { Game.Upgrades['Elder Pledge'].bought = 1; } else { Game.Upgrades['Elder Pledge'].bought = 0; }

			if (version[0] >= 1 && version[1] >= 1 && version[2] >= 1) {
				strIn = str[5].split(',');
				Game.veilHP = parseFloat(strIn[0]); 
				if (Game.Has('Shimmering veil')) { 
					if (strIn[1] == 'on') {
						Game.Upgrades['Shimmering veil [off]'].earn();
						Game.Lock('Shimmering veil [on]'); Game.Unlock('Shimmering veil [on]'); 
						Game.Lock('Shimmering veil [broken]');
					} else if (strIn[1] == 'off') {
						Game.Upgrades['Shimmering veil [on]'].earn();
						Game.Lock('Shimmering veil [off]'); Game.Unlock('Shimmering veil [off]'); 
						Game.Lock('Shimmering veil [broken]');
					} else {
						Game.Lock('Shimmering veil [on]'); Game.Lock('Shimmering veil [off]');
						Game.Upgrades['Shimmering veil [broken]'].earn();
					}
				}
				Game.veilRestoreC = parseFloat(strIn[2]);
				Game.veilPreviouslyCollapsed = Boolean(strIn[3]);
			}

			if (version[0] >= 1 && version[1] >= 1 && version[2] >= 2) {
				var counter = 0;
				strIn = str[6].split(',');
				for (let i in decay.prefs.preventNotifs) {
					decay.prefs.preventNotifs[i] = parseInt(strIn[0][counter]);
					counter++;
				}
				counter = 0;
				for (let i in decay.prefs.firstNotif) {
					decay.prefs.firstNotif[i] = parseInt(strIn[1][counter]);
					counter++;
				}
			}
		} else {
			str = str[0];
			for(let i=0;i<this.achievements.length;i++) { //not using in because doesnt let you use i if it is greater than the array length
            	this.achievements[i].unlocked=Number(str[2*i]); //multiplied by 2 because 2 values for each upgrade
            	this.achievements[i].bought=Number(str[(2*i)+1]); //+1 for the second value	
			}
		}
	    Game.storeToRefresh=1;
    }
});
