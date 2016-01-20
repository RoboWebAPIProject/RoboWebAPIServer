/**
RoboWebAPI project

Copyright (c) 2016 Takuji Kawata

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/

var mqtt                = require('mqtt');
var bodyParser          = require('body-parser');
var config              = require('config');

var mqtt_host           = config.mqtt_host;
var mqtt_port           = config.mqtt_port;
var mqtt_username       = config.mqtt_username;
var mqtt_password       = config.mqtt_password;
var mqtt_c_username     = config.mqtt_username_for_client;
var mqtt_c_password     = config.mqtt_password_for_client;
var request_timeout_ms  = config.request_timeout_ms;

var return_cnt = 100;
var delayedResponses = [];

function checkTimeoutForDelayResponse(){
    var now = Date.now();
    for (i = 0; i < delayedResponses.length; i++)
    {
        if (delayedResponses[i]._time + request_timeout_ms < now) 
        {
            delayedResponses[i].callback({"result":null, "timeout":true });
            delayedResponses.splice(i,1);
            break;
        }
    }
}

setInterval(checkTimeoutForDelayResponse,1000);

var PepperDelayResponse = function() {
    this._token = return_cnt++;
    this._time = Date.now();
}

PepperDelayResponse.prototype.token = function() {
    return this._token;
}

PepperDelayResponse.prototype.done = function(callback) {
    this.eventCallback = callback;
};

PepperDelayResponse.prototype.callback = function(result) {
    this.eventCallback(result);
}


var PepperPlugin = function(token) {
    this.client_token = token;
    this.command_token = token + "C";
    this.event_token = token + "E";
    this.return_token = token + "R";

    url = "mqtt://" + mqtt_host + ":" + mqtt_port;
    this.client  = mqtt.connect(url, {username: mqtt_username, password:mqtt_password});

    this.client.on('message', function (token, message) {
        if (token == this.return_token)
        {
            try
            {
                var jobj = JSON.parse(message.toString());
                for (i = 0; i < delayedResponses.length; i++)
                {
                    if (delayedResponses[i].token() == jobj.method_token) 
                    {
                        if (!("exception" in jobj))
                        {
                            delayedResponses[i].callback({"result":jobj.result, "timeout": false});
                        }
                        else
                        {
                            delayedResponses[i].callback({"result":jobj.result, "timeout": false, "exception":jobj.exception});                        
                        }
                        delayedResponses.splice(i,1);
                        break;
                    }
                }
            } catch(e) {
                delayedResponses[i].callback({"result":null, "timeout": false, "exception":String(e)});                        
            }
        }
        else if (token == this.event_token)
        {
            //
        }
    }.bind(this));

    this.client.on('connect', function () {
        this.client.subscribe(this.event_token);
        this.client.subscribe(this.return_token);

        console.log("New client ready. client_token:" + this.client_token)
    }.bind(this));

    this.client.on('error', function () {
        console.log("MQTT error");
    });
};


PepperPlugin.prototype.call = function(module, method, module_token, async, args) {
    console.log("client:" + this.client_token + " call command called.");

    delayedResponse = new PepperDelayResponse();
    delayedResponses.push(delayedResponse);

    var command = 
    {
        'command' : 'call',
        'module': module,
        'method' : method,
        'args' : args,
        'async' : async,
        'module_token' : module_token,
        'method_token' : delayedResponse.token()
    };

    this.client.publish(this.command_token, JSON.stringify(command));

    return delayedResponse;
};

PepperPlugin.prototype.addWebhook = function(key, url) {
    console.log("client:" + this.client_token + " addWebhook command called.");

    delayedResponse = new PepperDelayResponse();
    delayedResponses.push(delayedResponse);

    var command = 
    {
        'command' : 'addWebhook',
        'key': key,
        'url' : url,
        'method_token' : delayedResponse.token()
    };

    this.client.publish(this.command_token, JSON.stringify(command));

    return delayedResponse;
};

PepperPlugin.prototype.dropWebhook = function(key, url) {
    console.log("client:" + this.client_token + " dropWebhook command called.");

    delayedResponse = new PepperDelayResponse();
    delayedResponses.push(delayedResponse);

    var command = 
    {
        'command' : 'dropWebhook',
        'key': key,
        'url' : url,
        'method_token' : delayedResponse.token()
    };

    this.client.publish(this.command_token, JSON.stringify(command));

    return delayedResponse;
};

PepperPlugin.prototype.exit = function(key, url) {
    console.log("client:" + this.client_token + " exit command called.");

    delayedResponse = new PepperDelayResponse();
    delayedResponses.push(delayedResponse);

    var command = 
    {
        'command' : 'exit',
        'method_token' : delayedResponse.token()
    };

    this.client.publish(this.command_token, JSON.stringify(command));

    return delayedResponse;
};


PepperPlugin.prototype.getLinkInfo = function() {
    return {"client_token": this.client_token, 
            "command_token": this.command_token, 
            "return_token" : this.return_token,
            "event_token": this.event_token, 
            "mqtt_host": mqtt_host, 
            "mqtt_port":mqtt_port,
            "mqtt_username" : mqtt_c_username,
            "mqtt_password" : mqtt_c_password
        };
};

module.exports = PepperPlugin;
