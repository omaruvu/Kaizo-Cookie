Game.registerMod("Kaizo Cookies", { 
	init: function() { 
//Special thanks to Cursed, Yeetdragon, Lookas for helping me with the code, Fififoop for quality control & suggestions, Rubik for suggestions
//and cookiemains for playtesting this mod, you can look at the cookiemains section to see what ideas he suggested

        // notification!
		Game.Notify(`Oh, so you think comp is too easy?`, `Good luck.`, [21,32],10,1);

		/*=====================================================================================
        Wrinklers
        =======================================================================================*/

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

        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('var chance=0.00001*Game.elderWrath;','var chance=0.0002;'))//Making it so wrinklers spawn outside of gpoc
		eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('if (me.close<1) me.close+=(1/Game.fps)/10;','if (me.close<1) me.close+=(1/Game.fps)/12;'))//Changing Wrinkler movement speed
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('if (me.phase==0 && Game.elderWrath>0 && n<max && me.id<max)','if (me.phase==0 && n<max && me.id<max)'))
        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('me.sucked+=(((Game.cookiesPs/Game.fps)*Game.cpsSucked));//suck the cookies','me.sucked-=(((Game.cookiesEarned/Game.fps)*Game.cpsSucked));//suck the cookies'))/
        eval('Game.SpawnWrinkler='+Game.SpawnWrinkler.toString().replace('if (Math.random()<0.0001) me.type=1;//shiny wrinkler','if (Math.random()<1/8192) me.type=1;//shiny wrinkler'))

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
		M=Game.Objects['Farm'].minigame//declaring M.soilsById so computeEffs work (this took hours to figure out)
		M.soilsById.soilsById = [];
		var n = 0;
		for (var i in M.soils) {
		M.soils[i].id = n;
		M.soils[i].key = i;
		M.soilsById[n] = M.soils[i];
		n++;
		} 

		Game.registerHook('check', () => {
			if (Game.Objects['Farm'].minigameLoaded) {
				// Changing some plants mutations
				eval("Game.Objects['Farm'].minigame.getMuts="+Game.Objects['Farm'].minigame.getMuts.toString().replace("if (neighsM['bakerWheat']>=1 && neighsM['thumbcorn']>=1) muts.push(['cronerice',0.01]);","if (neighsM['bakerWheat']>=1 && neighsM['wrinklegill']>=1) muts.push(['cronerice',0.01]);"));
				eval("Game.Objects['Farm'].minigame.getMuts="+Game.Objects['Farm'].minigame.getMuts.toString().replace("if (neighsM['cronerice']>=1 && neighsM['thumbcorn']>=1) muts.push(['gildmillet',0.03]);","if (neighsM['bakerWheat']>=1 && neighsM['thumbcorn']>=1) muts.push(['gildmillet',0.03]);"));
				
				eval("Game.Objects['Farm'].minigame.getMuts="+Game.Objects['Farm'].minigame.getMuts.toString().replace("effs.cursorCps+=0.01*mult","effs.cursorCps+=0.005*mult"));
				eval("Game.Objects['Farm'].minigame.getMuts="+Game.Objects['Farm'].minigame.getMuts.toString().replace("else if (name=='whiskerbloom') effs.milk+=0.002*mult;","else if (name=='whiskerbloom') effs.milk+=0.0005*mult;"));
			          	 
				Game.Objects['Farm'].minigame.plants['bakerWheat'].children=['bakerWheat','thumbcorn','cronerice','gildmillet','bakeberry','clover','goldenClover','chocoroot','tidygrass'];
				Game.Objects['Farm'].minigame.plants['thumbcorn'].children=['bakerWheat','thumbcorn','gildmillet','glovemorel'];
				Game.Objects['Farm'].minigame.plants['wrinklegill'].children=['cronerice','elderwort','shriekbulb'];
		
				Game.Objects['Farm'].minigame.plants['whiskerbloom'].effsStr='<div class="green">&bull; '+loc("milk effects")+' +0.005%</div>';
				Game.Objects['Farm'].minigame.plants['glovemorel'].effsStr='<div class="green">&bull; '+loc("cookies/click")+' +4%</div><div class="green">&bull; '+loc("%1 CpS",Game.Objects['Cursor'].single)+' +0.5%</div><div class="red">&bull; '+loc("CpS")+' -1%</div>';
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
		eval('Game.mouseCps='+Game.mouseCps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))
		eval("Game.Objects['Cursor'].cps="+Game.Objects['Cursor'].cps.toString().replace("if (Game.Has('Unshackled cursors')) add*=	25;","if (Game.Has('Unshackled cursors')) add*=	20;"))

		var getStrThousandFingersGain=function(x)
		{return loc("Multiplies the gain from %1 by <b>%2</b>.",[getUpgradeName("Thousand fingers"),x]);}
		Game.Upgrades['Unshackled cursors'].ddesc=getStrThousandFingersGain(20);

		eval('Game.GetTieredCpsMult='+Game.GetTieredCpsMult.toString().replace("tierMult+=me.id==1?0.5:(20-me.id)*0.1;","tierMult+=me.id==1?0.5:(20-me.id)*0.09;"))

		Game.Upgrades['Wrinkly cookies'].power=15;
		Game.Upgrades['Wrinkly cookies'].ddesc=loc("Cookie production multiplier <b>+%1% permanently</b>.",15)+'<q>The result of regular cookies left to age out for countless eons in a place where time and space are meaningless.</q>'

		/*=====================================================================================
        Dragon auras
        =======================================================================================*/
		eval('Game.CalculateGains='+Game.CalculateGains.toString().replace("mult*=1+Game.auraMult('Radiant Appetite');","mult*=0.5+Game.auraMult('Radiant Appetite');"));//Changing RA from 2.0 to 1.5

		eval('Game.Upgrade.prototype.getPrice='+Game.Upgrade.prototype.getPrice.toString().replace("price*=1-Game.auraMult('Master of the Armory')*0.02;","price*=1-Game.auraMult('Master of the Armory')*0.10;"));

		eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace("price*=1-Game.auraMult('Fierce Hoarder')*0.02;","price*=1-Game.auraMult('Fierce Hoarder')*0.05;"));

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777);`,`buff=Game.gainBuff('click frenzy',Math.ceil(13*effectDurMod),777*(1+(Game.auraMult('Dragon Cursor')*0.3)));`));//Dragon Cursor making CF stronger by 30%

		eval(`Game.shimmerTypes['golden'].popFunc=`+Game.shimmerTypes['golden'].popFunc.toString().replace(`list.push('blood frenzy','chain cookie','cookie storm');`,`if (Math.random()<Game.auraMult('Unholy Dominion')){list.push('blood frenzy')}if (Game.auraMult('Unholy Dominion')>1) {if (Math.random()<Game.auraMult('Unholy Dominion')-1){list.push('blood frenzy')}}`));//Unholy Dominion pushes another EF to the pool making to so they are twice as common

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
        Game.dragonAuras[8].desc="<b>+20%</b> prestige level effect on CpS.";
        Game.dragonAuras[11].desc="Golden cookies give <b>10%</b> more cookies."+'<br>'+"Golden cookies may trigger a <b>Dragon\'s hoard</b>.";
		Game.dragonAuras[12].desc="Wrath cookies give <b>10%</b> more cookies."+'<br>'+"Elder frenzy appear <b>twice as often</b>.";
        Game.dragonAuras[15].desc="All cookie production <b>multiplied by 1.5</b>.";

		/*=====================================================================================
        because Cookiemains wanted so
        =======================================================================================*/
		for (let i in Game.Objects) {    //Nerfing Godzamok from 1% to 0.5%
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace("if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01);", "if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.005);"));
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace("else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005);", "else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.0025);"));
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace("if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025);", "if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.00125);"));
		}

	    grimoire=Game.Objects['Wizard tower'].minigame;
        grimoire.spells['hand of fate'].failFunc=function(){return 0.5};//Making FTHOF fail chance always 50%

		Game.registerHook('check', () => {
			if (Game.Objects['Wizard tower'].minigameLoaded) {
				eval("Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win="+Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win.toString().replace("//if (Math.random()<0.2) choices.push('clot','cursed finger','ruin cookies');","if (Math.random()<0.2) choices.push('clot','cursed finger','ruin cookies');"))//Making this unused code used
		        eval("Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win="+Game.Objects['Wizard tower'].minigame.spells['hand of fate'].win.toString().replace("if (Game.BuildingsOwned>=10 && Math.random()<0.25) choices.push('building special');","if (Game.BuildingsOwned>=10 && Math.random()<0.10) choices.push('building special');"))//Changing building special to 10%
			}
		});

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
		this.createAchievements=function(){//Adding the custom upgrade
			this.achievements = []
			this.achievements.push(new Game.Upgrade('Golden sugar',(" Sugar lumps mature <b>8 hours sooner</b>.")+'<q>Made from the highest quality sugar!</q>',1000000000,[28,16]))
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
