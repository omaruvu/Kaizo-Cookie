Game.registerMod("Kaizo Cookies", { 
	init: function() { 

        // notification!
		Game.Notify(`Good luck.`, ``, [21,32],10,1);

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

        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('var chance=0.00001*Game.elderWrath;','var chance=0.0002;'))

        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('if (me.phase==0 && Game.elderWrath>0 && n<max && me.id<max)','if (me.phase==0 && n<max && me.id<max)'))

        eval('Game.UpdateWrinklers='+Game.UpdateWrinklers.toString().replace('me.sucked+=(((Game.cookiesPs/Game.fps)*Game.cpsSucked));//suck the cookies','me.sucked-=(((Game.cookiesPs/Game.fps)*Game.cpsSucked));//suck the cookies'))

        eval('Game.SpawnWrinkler='+Game.SpawnWrinkler.toString().replace('if (Math.random()<0.0001) me.type=1;//shiny wrinkler','if (Math.random()<1/8192) me.type=1;//shiny wrinkler'))

		//shimmer pool
		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("if (me.wrath>0) list.push('clot','multiply cookies','ruin cookies');","if (me.wrath>0) list.push('clot','ruin cookies');"));

		eval('Game.shimmerTypes["golden"].popFunc='+Game.shimmerTypes['golden'].popFunc.toString().replace("if (Game.BuildingsOwned>=10 && Math.random()<0.25) list.push('building special');","if (Game.BuildingsOwned>=10 && me.wrath==0 && Math.random()<0.25) list.push('building special');")); 


		//minigame
		eval('Game.modifyBuildingPrice='+Game.modifyBuildingPrice.toString().replace("if (Game.hasBuff('Crafty pixies')) price*=0.98;","if (Game.hasBuff('Crafty pixies')) price*=0.90;"))

		eval("Game.Objects['Wizard tower'].minigame.spells['summon crafty pixies'].desc="+'"'+Game.Objects['Wizard tower'].minigame.spells['summon crafty pixies'].desc.replace('2','10')+'"');

		eval("Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].win="+Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].win.toString().replace("{if ((Game.Objects[i].amount<max || n==1) && Game.Objects[i].getPrice()<=Game.cookies*2 && Game.Objects[i].amount<400) buildings.push(Game.Objects[i]);}","{if ((Game.Objects[i].amount<max || n==1) && Game.Objects[i].getPrice()<=Game.cookies*2 && Game.Objects[i].amount<1000) buildings.push(Game.Objects[i]);}"))

        eval("Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].desc="+'"'+Game.Objects['Wizard tower'].minigame.spells['spontaneous edifice'].desc.replace('400','1000')+'"');

		//because cookiemains wanted so
		for (let i in Game.Objects) {
			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace("if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.01);", "if (godLvl==1) Game.gainBuff('devastation',10,1+sold*0.005);"));

			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace("else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.005);", "else if (godLvl==2) Game.gainBuff('devastation',10,1+sold*0.0025);"));

			eval('Game.Objects["'+i+'"].sell='+Game.Objects[i].sell.toString().replace("if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.0025);", "if (godLvl==3) Game.gainBuff('devastation',10,1+sold*0.00125);"));
		}

	    grimoire=Game.Objects['Wizard tower'].minigame;
        grimoire.spells['hand of fate'].failFunc=function(){return 0.5};


		

		//custom upgrade
		this.createAchievements=function(){
			this.achievements = []
			this.achievements.push(new Game.Upgrade('Golden sugar',(" Sugar lumps mature <b>8 hours sooner</b>.")+'<q>Made from the highest quality sugar!</q>',1000000000,[28,16]))
			for(let i of this.achievements){i.order=350045;}
			LocalizeUpgradesAndAchievs()
		}
		this.checkAchievements=function(){
			if (Game.cookiesEarned>=1000000000) Game.Unlock('Golden sugar')
		}
		if(Game.ready) this.createAchievements()
		else Game.registerHook("create", this.createAchievements)
		Game.registerHook("check", this.checkAchievements)

		eval('Game.computeLumpTimes='+Game.computeLumpTimes.toString().replace('ipeAge/=2000;}','ipeAge/=2000;} if (Game.Has("Golden sugar")) { Game.lumpMatureAge-=(hour*8); }'));

		
    }
});
