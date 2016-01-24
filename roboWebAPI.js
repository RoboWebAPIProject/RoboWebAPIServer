/**
RoboWebAPI project

Copyright (c) 2016 Takuji Kawata

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/

var client_const_fname  = "./clients.txt";

var express             = require('express');
var bodyParser          = require('body-parser');
var request             = require('request');
var randtoken           = require('rand-token');
var config              = require('config');
var fs                  = require('fs');

var pepperPlugin    = require('./robots/js/pepper-plugin');

var nodes = {};
var nodes_save = JSON.parse(fs.readFileSync(client_const_fname, 'utf8'));

//construct saved objects
for (aSavedNode in nodes_save)
{
    var client_type = nodes_save[aSavedNode].client_type;
    var webhookurls = nodes_save[aSavedNode].webhookurls;

    constructNode(client_type, aSavedNode);
}


var client_token_length = config.client_token_length

var app = express();
app.use(bodyParser())

app.get('/call/:client_token', function (req, res) {
    var module = req.query.module;
    var method = req.query.method;
    var param = "param" in req.query ? [req.query.param] : [];
    var async = "async" in req.query ? req.query.async == "true" : false;
    var result = {};
    if (req.params.client_token in nodes)
    {
        nodes[req.params.client_token].call(module, method, null, async, param).done(function(result) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(result));
        });         
    }
    else
    { 
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({"result":null, "timeout": false, "exception":"Invalid client_token"}));                 
    }
})

app.post('/call/:client_token', function (req, res) {
    var module = req.body.module;
    var method = req.body.method;
    var params = req.body.params;
    var module_token = "module_id" in req.body ? req.body.module_id : null;
    var async = "async" in req.body ? req.body.async  : false;

    if (req.params.client_token in nodes)
    {
        nodes[req.params.client_token].call(module, method, module_token, async, params).done(function(result) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(result));            
        });
    }
    else
    { 
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({"result":null, "timeout": false, "exception":"Invalid client_token"}));                 
    }
})

app.get('/addWebhook/:client_token', function (req, res) {
    var key = req.query.key;
    var url = req.query.url;
    var client_token = req.params.client_token;

    if (client_token in nodes)
    {
        nodes[req.params.client_token].addWebhook(key, url).done(function(result) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(result));            
        });

        if ((client_token in nodes_save) && !(key in nodes_save[client_token].webhookurls))
        {
            nodes_save[client_token].webhookurls[key] = [];
        }
        nodes_save[client_token].webhookurls[key].push(url);

        var nodes_save_str = JSON.stringify(nodes_save);
        fs.writeFile(client_const_fname, nodes_save_str);
    }
    else
    { 
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({"result":null, "timeout": false, "exception":"Invalid client_token"}));                 
    }
})

app.get('/dropWebhook/:client_token', function (req, res) {
    var key = req.query.key;
    var url = req.query.url;
    var client_token = req.params.client_token;

    if (client_token in nodes)
    {
        nodes[req.params.client_token].dropWebhook(key, url).done(function(result) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(result));            
        });

        if (client_token in nodes_save && key in nodes_save[client_token].webhookurls)
        {
            while(nodes_save[client_token].webhookurls[key].indexOf(url) >= 0)
            {
                nodes_save[client_token].webhookurls[key].splice(nodes_save[client_token].webhookurls[key].indexOf(url),1);    
            }
            var nodes_save_str = JSON.stringify(nodes_save);
            fs.writeFile(client_const_fname, nodes_save_str);
        }
    }
    else
    { 
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({"result":null, "timeout": false, "exception":"Invalid client_token"}));                 
    }
})

app.get('/getWebhookList/:client_token', function (req, res) {
    var client_token = req.params.client_token;
    if (client_token in nodes_save)
    {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify(nodes_save[client_token].webhookurls)); 
    }
})

app.get('/registerNode', function (req, res) {
    var client_token = randtoken.generate(client_token_length);
    var client_type = req.query.type;
    var node = null;

    node = constructNode(client_type, client_token);

    nodes_save[client_token] = {};
    nodes_save[client_token].client_type = client_type;
    nodes_save[client_token].webhookurls = {};

    var nodes_save_str = JSON.stringify(nodes_save);
    fs.writeFile(client_const_fname, nodes_save_str);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(node.getLinkInfo()));
})

app.get('/exit/:client_token', function (req, res) {
    if (req.params.client_token in nodes)
    {
        nodes[req.params.client_token].exit().done(function(result) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(result));            
        });
    }
    else
    { 
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({"result":null, "timeout": false, "exception":"Invalid client_token"}));                 
    }
})

function constructNode(client_type, client_token)
{
    if (client_type == 'pepper')
        node = new pepperPlugin(client_token);
    else 
    {
        console.log("Only pepper for type is supported now!")
    }
    
    if (node == null)
    {
        res.end("Only pepper for type is supported now!");
        return;
    }

    nodes[client_token] = node;

    return node;
}

var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("RoboWebAPI app listening at http://%s:%s", host, port)

})

