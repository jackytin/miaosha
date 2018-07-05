'use strict';

const redis = require('redis');
const kafka = require('kafka-node');
const Producer = kafka.Producer;
const kafkaClient = new kafka.Client();
const producer = new Producer(kafkaClient);
const Controller = require('egg').Controller;

class MiaoshaController extends Controller {
  async go() {
	const result = this.dowork(); 
	this.ctx.body = "the result: " + result;
  }

  dowork(optionalClient) {
	let client;
	if (optionalClient == 'undefined' || optionalClient == null) {
	   client = redis.createClient("6379","172.17.118.107");
	}else{
	   client = optionalClient;
	}
	client.on('error', function (er) {
		console.trace('Here I am');
		console.error(er.stack);
		client.end(true);
	});
	client.watch("counter");
	client.get("counter", function (err, reply) {
		console.log("current item number: " + reply);
		if (parseInt(reply) > 0) {
			let multi = client.multi();
			multi.decr("counter");
			multi.exec(function (err, replies) {
				console.log(replies)
				if (replies == null) {
					console.log('should have conflict')
					dowork(client);
				} else {
					const payload = [
						{
							topic: 'CAR_NUMBER',
							messages: 'buy 1 car',
							partition: 0
						}
					];
					producer.send(payload, function (err, data) {
						if(err){
							console.log(err);
						}else{
							console.log(data);
							console.log("success get one car");
						}						                          
					});
					client.end(true);
				}
			});
		} else {
			client.end(true);
			console.log("sold out!");
			result = "sold out!"
		}
	  })	
	}
}

module.exports = MiaoshaController;