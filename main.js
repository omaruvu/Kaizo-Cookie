var decay = {};
Game.registerMod("Kaizo Cookies", { 
	init: function() { 
//Special thanks to Cursed, Yeetdragon, Lookas for helping me with the code, Fififoop for quality control & suggestions, Rubik for suggestions
//and cookiemains for playtesting this mod, you can look at the cookiemains section to see what ideas he suggested

        // notification!
		Game.Notify(`Oh, so you think comp is too easy?`, `Good luck.`, [21,32],10,1);

		/*=====================================================================================
        Decay & Wrinklers
        =======================================================================================*/
		//the decay object is declared outside of the mod object for conveience purposes
		//decay: a decreasing multiplier to buildings, and theres a different mult for each building. The mult decreases the same way for each building tho
		decay.mults = []; for (let i in Game.Objects) { decay.mults.push(1); } 
		decay.mults.push(1); //the "general multiplier", is just used for checks elsewhere
		decay.incMult = 0.04; //decay mult is decreased by this multiplicative every second
		decay.min = 0.15; //the minimum power that the update function uses; the lower it is, the slower the decay will pick up
		decay.halt = 1; //simulates decay stopping from clicking
		decay.haltOvertime = 0;
		decay.haltOTLimit = 2; //OT stands for overtime
		decay.haltOTApplyFactor = 0.05;
		decay.decHalt = 0.33; // the amount that decay.halt decreases by every second
		decay.haltFactor = 0.5;
		decay.haltKeep = 0.2; //the fraction of halt time that is kept when halted again
		decay.wrinklerSpawnThreshold = 0.8;
		decay.wrinklerSpawnFactor = 0.8; //the more it is, the faster wrinklers spawn
		decay.update = function(buildId) { 
    		decay.mults[buildId] *= 1 - (
				1 - Math.pow((1 - decay.incMult / Game.fps), Math.max(1 - decay.mults[buildId], decay.min))) * (Math.max(1, Math.pow(decay.gen(), 0.6)) - Math.min(Math.pow(decay.halt + decay.haltOvertime * 0.75, decay.haltFactor), 1)
			);
		}
		decay.updateAll = function() {
			if (Game.cookiesEarned - Game.cookiesReset <= 1000) { return false; } 
			for (let i in decay.mults) {
				decay.update(i);
			}
			decay.regainAcc();
			if (Game.drawT % 3) {
				Game.recalculateGains = 1;	
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
		decay.regainAcc = function() { 
    		decay.halt = Math.max(0, decay.halt - decay.decHalt / Game.fps);
			if (decay.halt == 0) {
				decay.haltOvertime = Math.max(0, decay.haltOvertime - decay.decHalt / Game.fps);
			} else {
				decay.haltOvertime = Math.max(0, decay.haltOvertime - (decay.decHalt / 2) / Game.fps);
			}
		}
		decay.stop = function(val) {
			decay.halt = val;
			decay.haltOvertime = Math.min(decay.halt * decay.haltOTLimit, decay.haltOvertime + decay.halt * decay.haltOTApplyFactor); 
		}
 		decay.get = function(buildId) {
			return decay.mults[buildId];
		}
		decay.gen = function() {
			return decay.mults[20];
		}

		//decay scaling
		decay.setRates = function() {
			var d = 1;
			var c = Game.cookiesEarned - Game.cookiesReset;
			d *= Math.pow(0.999, Math.log10(c));
			d *= Math.pow(0.9875, Math.log2(Math.max(Game.goldenClicks - 77, 1)));
			d *= Math.pow(0.985, Math.max(Math.sqrt(Game.AchievementsOwned) - 4, 0))
			if (Game.Has('Lucky day')) { d *= 0.95; }
			if (Game.Has('Serendipity')) { d *= 0.95; }
			if (Game.Has('Get Lucky')) { d *= 0.95; }
			decay.incMult = 1 - d;

			var w = 1 - 0.8;
			w *= Math.pow(0.99, Math.log10(c));
			decay.wrinklerSpawnFactor = 1 - w;
			decay.wrinklerSpawnThreshold = 1 - w * 3.5;
		}
		decay.setRates();
		Game.registerHook('check', decay.setRates);
		
		Game.registerHook('logic', decay.updateAll);
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].cps='+Game.Objects[i].cps.toString().replace('CpsMult(me);', 'CpsMult(me); mult *= decay.get(me.id); '));
		}

		Game.registerHook('cps', function(m) { return m * 4; }); //quadruples cps to make up for the decay

		//ways to refresh/stop decay
		eval('Game.shimmer.prototype.pop='+Game.shimmer.prototype.pop.toString().replace('popFunc(this);', 'popFunc(this); decay.refreshAll(2);'));
		decay.clickBCStop = function() {
			decay.stop(1);
		}
		Game.registerHook('click', decay.clickBCStop);
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace(`ious corruption')) toSuck*=1.05;`, `ious corruption')) toSuck*=1.05; decay.stop(2);`));
		eval('Game.Win='+Game.Win.toString().replace('Game.recalculateGains=1;', 'decay.refreshAll(3);'));
		decay.reincarnateBoost = function() {
			decay.stop(20);
			decay.refreshAll(10);
		}
		Game.registerHook('reincarnate', decay.reincarnateBoost);


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

        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('var chance=0.00001*Game.elderWrath;','var chance=0.0001 / Math.pow(decay.gen(), decay.wrinklerSpawnFactor); if (decay.gen() >= decay.wrinklerSpawnThreshold) { chance = 0; }'))//Making it so wrinklers spawn outside of gpoc
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('if (me.close<1) me.close+=(1/Game.fps)/10;','if (me.close<1) me.close+=(1/Game.fps)/(12*(1+Game.auraMult("Dragon God")*4));'))//Changing Wrinkler movement speed
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('if (me.phase==0 && Game.elderWrath>0 && n<max && me.id<max)','if (me.phase==0 && n<max && me.id<max)'))
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('me.sucked+=(((Game.cookiesPs/Game.fps)*Game.cpsSucked));//suck the cookies','if (!Game.auraMult("Dragon Guts")) { me.sucked-=((Game.cookies/Game.fps/2)*Game.cpsSucked); } //suck the cookies'))
        eval('Game.SpawnWrinkler='+Game.SpawnWrinkler.toString().replace('if (Math.random()<0.0001) me.type=1;//shiny wrinkler','if (Math.random()<1/8192) me.type=1;//shiny wrinkler'))
		eval('Game.getWrinklersMax='+Game.getWrinklersMax.toString().replace(`n+=Math.round(Game.auraMult('Dragon Guts')*2);`, ''));
		
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
		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111);`,`buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111*(1+(Game.auraMult('Dragon Cursor')*0.5)));`));//Dragon Cursor making CF stronger by 50%

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`list.push('blood frenzy','chain cookie','cookie storm');`,`if (Math.random()<Game.auraMult('Unholy Dominion')){list.push('blood frenzy')}if (Game.auraMult('Unholy Dominion')>1) {if (Math.random()<Game.auraMult('Unholy Dominion')-1){list.push('blood frenzy')}}`));//Unholy Dominion pushes another EF to the pool making to so they are twice as common

		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace(`suckRate*=1+Game.auraMult('Dragon Guts')*0.2;`, 'if (Game.auraMult("Dragon Guts")) { suckRate = 1; }'));

		eval('Game.GetHeavenlyMultiplier='+Game.GetHeavenlyMultiplier.toString().replace("heavenlyMult*=1+Game.auraMult('Dragon God')*0.05;","heavenlyMult*=1+Game.auraMult('Dragon God')*0.20;"));

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight');`,`if (Math.random()<Game.auraMult('Dragonflight')) list.push('dragonflight'); if (Math.random()<Game.auraMult('Ancestral Metamorphosis')) list.push('Ancestral Metamorphosis');`));//Adding custom effect for Ancestral Metamorphosis 

        eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`else if (choice=='blood frenzy')`,`else if (choice=='Ancestral Metamorphosis')
        {
			var valn=Math.max(7,Math.min(Game.cookies*1.0,Game.cookiesPs*60*60*24));
			Game.Earn(valn);
			popup=("Dragon\'s hoard!")+'<br><small>'+("+%1!",("%1 cookie",LBeautify(valn)))+'</small>';
        }else if (choice=='blood frenzy')`));//When Ancestral Metamorphosis is seclected it pushes a effect called Dragon's hoard that gives 24 hours worth of CpS

        Game.dragonAuras[2].desc="Clicking is <b>5%</b> more powerful."+'<br>'+"Click frenzy is <b>30%</b> more powerful.";
		Game.dragonAuras[6].desc="All upgrades are <b>10% cheaper</b>.";
		Game.dragonAuras[7].desc="All buildings are <b>5% cheaper</b>.";
        Game.dragonAuras[8].desc="<b>+20%</b> prestige level effect on CpS. Wrinklers approach the big cookie <b>5 times</b> slower.";
        Game.dragonAuras[11].desc="Golden cookies give <b>10%</b> more cookies."+'<br>'+"Golden cookies may trigger a <b>Dragon\'s hoard</b>.";
		Game.dragonAuras[12].desc="Wrath cookies give <b>10%</b> more cookies."+'<br>'+"Elder frenzy appear <b>twice as often</b>.";
        Game.dragonAuras[15].desc="All cookie production <b>multiplied by 1.5</b>.";
		Game.dragonAuras[21].desc="Each wrinkler always wither 100% of your CpS, but wrinklers no longer lose cookies on pop."

		/*=====================================================================================
        because Cookiemains wanted so
        =======================================================================================*/
		for (let i in Game.Objects) {    //Nerfing Godzamok from 1% to 0.5%
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace("if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01);", "if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.005);"));
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace("else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005);", "else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.0025);"));
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace("if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025);", "if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.00125);"));
		}

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

		Game.registerHook('check', () => {
			if (Game.Objects['Temple'].minigameLoaded) {
				//Changing the desc
				Game.Objects['Temple'].minigame.gods['ruin'].desc1='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds.",[0.5,10])+'</span>';
				Game.Objects['Temple'].minigame.gods['ruin'].desc2='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds.",[0.25,10])+'</span>';
				Game.Objects['Temple'].minigame.gods['ruin'].desc3='<span class="green">'+ loc("Buff boosts clicks by +%1% for every building sold for %2 seconds.",['0.12.5',10])+'</span>';

				Game.Objects['Temple'].minigame.gods['mother'].desc1='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",8)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",20)+'</span>';
				Game.Objects['Temple'].minigame.gods['mother'].desc2='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",3)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",15)+'</span>';
				Game.Objects['Temple'].minigame.gods['mother'].desc3='<span class="green">'+loc("Milk is <b>%1% more powerful</b>.",1)+'</span> <span class="red">'+loc("Golden and wrath cookies appear %1% less.",10)+'</span>';

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

		//Cursedor upgrade function (thank you for helping me btw cursed)
		//I didnt add all the effects yet btw, i removed lucky and all similar effects
		/*
		Game.registerHook('click',function(){
			if (Math.random()<1/10) { Game.HardReset(2);Game.WriteSave();}
			//select an effect
			var list=[];
			list.push('clot','frenzy');
			list.push('blood frenzy');
			list.push('everything must go');
			list.push('click frenzy');
			list.push('cursed finger');
			list.push('building special');
			list.push('dragon harvest');
			list.push('dragonflight');
			
			var choice=choose(list);
			
			
			this.last=choice;
			
			//create buff for effect
			//buff duration multiplier
			var effectDurMod=1;
			if (Game.Has('Get lucky')) effectDurMod*=2;
			if (Game.Has('Lasting fortune')) effectDurMod*=1.1;
			if (Game.Has('Lucky digit')) effectDurMod*=1.01;
			if (Game.Has('Lucky number')) effectDurMod*=1.01;
			if (Game.Has('Green yeast digestives')) effectDurMod*=1.01;
			if (Game.Has('Lucky payout')) effectDurMod*=1.01;
			//if (Game.hasAura('Epoch Manipulator')) effectDurMod*=1.05;
			effectDurMod*=1+Game.auraMult('Epoch Manipulator')*0.05;
			
			if (Game.hasGod)
			{
				var godLvl=Game.hasGod('decadence');
				if (godLvl==1) effectDurMod*=1.07;
				else if (godLvl==2) effectDurMod*=1.05;
				else if (godLvl==3) effectDurMod*=1.02;
			}
			
			//effect multiplier (from lucky etc)
			var mult=1;
			//if (me.wrath>0 && Game.hasAura('Unholy Dominion')) mult*=1.1;
			//else if (me.wrath==0 && Game.hasAura('Ancestral Metamorphosis')) mult*=1.1;
		
			if (Game.Has('Green yeast digestives')) mult*=1.01;
			if (Game.Has('Dragon fang')) mult*=1.03;
			
			
			var popup='';
			var buff=0;
			
			if (choice=='building special')
			{
				var time=Math.ceil(30*effectDurMod);
				var list=[];
				for (var i in Game.Objects)
				{
					if (Game.Objects[i].amount>=10) list.push(Game.Objects[i].id);
				}
				if (list.length==0) {choice='frenzy';}//default to frenzy if no proper building
				else
				{
					var obj=choose(list);
					var pow=Game.ObjectsById[obj].amount/10+1;
					if (Math.random()<0.3)
					{
						buff=Game.gainBuff('building debuff',time,pow,obj);
					}
					else
					{
						buff=Game.gainBuff('building buff',time,pow,obj);
					}
				}
			}
			
			if (choice=='frenzy')
			{
				buff=Game.gainBuff('frenzy',Math.ceil(77*effectDurMod),7);
			}
			else if (choice=='dragon harvest')
			{
				buff=Game.gainBuff('dragon harvest',Math.ceil(60*effectDurMod),15);
			}
			else if (choice=='everything must go')
			{
				buff=Game.gainBuff('everything must go',Math.ceil(8*effectDurMod),5);
			}
			else if (choice=='blood frenzy')
			{
				buff=Game.gainBuff('blood frenzy',Math.ceil(6*effectDurMod),666);
			}
			else if (choice=='clot')
			{
				buff=Game.gainBuff('clot',Math.ceil(66*effectDurMod),0.5);
			}
			else if (choice=='cursed finger')
			{
				buff=Game.gainBuff('cursed finger',Math.ceil(10*effectDurMod),Game.cookiesPs*Math.ceil(10*effectDurMod));
			}
			else if (choice=='click frenzy')
			{
				buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777);
			}
			else if (choice=='dragonflight')
			{
				buff=Game.gainBuff('dragonflight',Math.ceil(10*effectDurMod),1111);
				if (Math.random()<0.8) Game.killBuff('Click frenzy');
			}
		});
  		*/

		this.createAchievements=function(){//Adding the custom upgrade
			this.achievements = []
			this.achievements.push(new Game.Upgrade('Golden sugar',(" Sugar lumps mature <b>8 hours sooner</b>.")+'<q>Made from the highest quality sugar!</q>',1000000000,[28,16]))
			this.achievements.push(new Game.Upgrade('Cursedor',("Unlocks <b>cursedor</b>, each time you click the big cookie you will get a random effect but there is a 14% chance of deleting the savefile.")+'<q>Like Russian roulette, but for cookies.</q>',111111111111111111,[0,20]),Game.last.pool='prestige');
			Game.Upgrades['Cursedor'].parents=[Game.Upgrades['Luminous gloves']]
			Game.PrestigeUpgrades.push(Game.Upgrades['Cursedor'])
			Game.last.posY=-810,Game.last.posX=-144

			
		    this.achievements.push(new Game.Upgrade('Cursedor [off]',("Turning this on will give you a random <b>Effect</b> if you click the big cookie, but there is a 14% chance of your savefile being deleted every time you click."),0,[0,20]));
			Game.last.pool='toggle';Game.last.toggleInto='Cursedor [on]';

			this.achievements.push(new Game.Upgrade('Cursedor [on]',("The Cursor is currently active, if you click the big cookie it will give you a random effect; it will also has a chance of deleting the savefile.<br>Turning it off will revert those effects.<br>"),0,[0,20]));
		    Game.last.pool='toggle';Game.last.toggleInto='Cursedor [off]';
			for(let i of this.achievements){i.order=350045;}
			LocalizeUpgradesAndAchievs()
		}
		this.checkAchievements=function(){//Adding the unlock condition
			if (Game.cookiesEarned>=1000000000) Game.Unlock('Golden sugar')
		}
		if(Game.ready) this.createAchievements()
		else Game.registerHook("create", this.createAchievements)
		Game.registerHook("check", this.checkAchievements)

		eval('Game.computeLumpTimes='+Game.computeLumpTimes.toString().replace('ipeAge/=2000;}','ipeAge/=2000;} if (Game.Has("Golden sugar")) { Game.lumpMatureAge-=(hour*8); }'));//Adding the effect of the upgrade

	},
	save: function(){
        let str = "";
        for(let i of this.achievements) {
          str+=i.unlocked; //using comma works like that in python but not js
          str+=i.bought; //seperating them otherwise it adds 1+1 and not "1"+"1"
        }
        return str;
    },
    load: function(str){
        for(let i=0;i<this.achievements.length;i++) { //not using in because doesnt let you use i if it is greater than the array length
          this.achievements[i].unlocked=Number(str[2*i]); //multiplied by 2 because 2 values for each upgrade
          this.achievements[i].bought=Number(str[(2*i)+1]); //+1 for the second value
        }
    }
});