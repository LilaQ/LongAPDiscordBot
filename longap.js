const Discord = require("discord.js");
const request = require('request');
const bot = new Discord.Client();
const path = require('path');
const fs = require('fs');
var sh = require('shelljs');

bot.on("message", (msg) => {

	//	DON'T REACT TO BOTS
	if(msg.author.bot) return;

	var TRIGGER = (msg.content.match(/(?<=^\-)(.*?)(?=\s|$)/gm) != null) ? msg.content.match(/(?<=^\-)(.*?)(?=\s|$)/gm)[0].toUpperCase() : "";
	var ARGS = (msg.content.match(/(?<= ).*$/gm) != null) ? msg.content.match(/(?<= ).*$/gm)[0].replace(/[\""]/g, '\\"') : "";
	var ARGS_WU = ARGS.replace(/^\S*\s/gm, "");

	switch(TRIGGER) {

		case "PRICE":
			request("https://api.helium.io/v1/oracle/prices/current" + ARGS, { json: true }, (error, response, body)=> {
				var embed = new Discord.MessageEmbed();
				console.log(body);
                                embed.setTitle("$ " + (body.data.price / 100000000.0).toFixed(2));
                                embed.setFooter((new Date()).toLocaleDateString('de-DE'));
                                msg.channel.send(embed);
                        })
			break;

		case "ACTIVITY":
		case "ACTIVITIES":
		case "ACT":
			var act = [];
			request("https://status.longap.com/hotspot/status/" + ARGS, { json: true }, (error, response, body)=> {
				request(`https://api.helium.io/v1/hotspots/${body[0].publicKey}/activity/`, { json: true }, (error1, response1, body1)=> {
					act = act.concat(body1.data);
					request(`https://api.helium.io/v1/hotspots/${body[0].publicKey}/activity/?cursor=${body1.cursor}`, { json: true }, (error2, response2, body2)=> {
						act = act.concat(body2.data);
						var embed = new Discord.MessageEmbed();
                	        	        embed.setTitle(body[0].name);
						for (var i = 0; i < 5; i++) {
							var date = new Date(act[i].time * 1000).toLocaleString("en-GB");
							var type = "";
							var data = "";
							switch (act[i].type) {
								case 'rewards_v2':
									type = "Mining Rewards";
									const reducer = (accumulator, currentValue) => accumulator + currentValue;
									data = (act[i].rewards.map(x => x.amount).reduce(reducer) / 100000000.0).toFixed(2) + " HNT";
									break;
								case 'assert_location_v2':
									type = "Assert Location";
									break;
								case 'poc_request_v1':
									type = "PoC Challenger";
									break;
								case 'state_channel_close_v1':
									type = "Packets Transferred";
									data = act[i].state_channel.summaries[0].num_dcs;
									break;
								case 'poc_receipts_v1':
									if (act[i].path[0].challengee == body[0].publicKey) {
										type = "Beacon";
										data = act[i].path[0].witnesses.length + " Witnesses";
									} else if (act[i].challenger == body[0].publicKey) {
										type = "Challenger"; 
										data = act[i].path[0].geocode.short_city + ", " + act[i].path[0].geocode.short_country;
									} else {
										type = "Witness";
									}
									break;
							}
							embed.addField(data != "" ? `${type} - ${data}` : `${type}`,`${date}`);
						}
        	        	                embed.setFooter(Date().toString());
						embed.setColor("10ACC9");
						msg.channel.send(embed);
					});
				});
			});
			break;

		case "STATUS":
			ARGS = ARGS.replace(/ /g, "-");
			console.log(ARGS);
			request("https://status.longap.com/hotspot/status/" + ARGS, { json: true }, (error, response, body)=> {
				body = body[0];
				var embed = new Discord.MessageEmbed();
				embed.setTitle(body.name);
				embed.setFooter(body.serial)
				embed.setURL("https://status.longap.com/hotspot/status/" + ARGS);
				embed.setThumbnail("https://status.longap.com/favicon.ico");
				embed.addField("Model", body.model);
				embed.addField("Status", body.status);
				embed.setColor(body.status == "syncing" ?  "#cccccc" : body.status == "online" ? "#00ff00" : "ff0000");
				embed.addField("Connected", body.miner.connected);
				embed.addField("Blocks left", parseInt(body.helium.blockchain.height) - parseInt(body.miner.blockHeight));
				msg.channel.send(embed);
			});
			break;

		case "HELP":
			var embed = new Discord.RichEmbed();
			embed.setTitle("Help");
			embed.setColor("36393F");
			embed.addField("-price", "Display current dollar price of HNT", true);
			embed.addField("-status <hotspot>", "Display status of LongAP Hotspot", true);
			embed.addField("-act <hotspot>", "Display last 5 activities", true);
			embed.setFooter("LongAP-Bot - 2021 by LilaQ (all hotspots can be queried by name, publickey or serial)");
			msg.channel.sendMessage({embed});
			break;

	}
});
bot.login("bot_token_be_here");
