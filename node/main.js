// Copyright 2011-2014 Numerotron, Inc. / Patrick Crosby
//
// StatHat API node.js module
//
(function() {

        var http = require('http');
        var https = require('https');
        var async = require('async');

        var StatHat = {
                useHTTPS: false,
                postQueue: undefined, // Added below

                trackValue: function(user_key, stat_key, value, callback) {
                        this._queueOrPostRequest('/v', {key: stat_key, ukey: user_key, value: value}, callback);
                },

                trackValueWithTime: function(user_key, stat_key, value, timestamp, callback) {
                        this._queueOrPostRequest('/v', {key: stat_key, ukey: user_key, value: value, t: timestamp}, callback);
                },

                trackCount: function(user_key, stat_key, count, callback) {
                        this._queueOrPostRequest('/c', {key: stat_key, ukey: user_key, count: count}, callback);
                },

                trackCountWithTime: function(user_key, stat_key, count, timestamp, callback) {
                        this._queueOrPostRequest('/c', {key: stat_key, ukey: user_key, count: count, t: timestamp}, callback);
                },

                trackEZValue: function(ezkey, stat_name, value, callback) {
                        this._queueOrPostRequest('/ez', {ezkey: ezkey, stat: stat_name, value: value}, callback);
                },

                trackEZValueWithTime: function(ezkey, stat_name, value, timestamp, callback) {
                        this._queueOrPostRequest('/ez', {ezkey: ezkey, stat: stat_name, value: value, t: timestamp}, callback);
                },

                trackEZCount: function(ezkey, stat_name, count, callback) {
                        this._queueOrPostRequest('/ez', {ezkey: ezkey, stat: stat_name, count: count}, callback);
                },

                trackEZCountWithTime: function(ezkey, stat_name, count, timestamp, callback) {
                        this._queueOrPostRequest('/ez', {ezkey: ezkey, stat: stat_name, count: count, t: timestamp}, callback);
                },

                _queueOrPostRequest: function(path, params, callback) {
                        if (typeof(callback) === 'function') {
                                this._postRequest(path, params, callback);
                        } else {
                                this.postQueue.push({path: path, params: params});
                        }
                },

                _processTask: function(task, callback) {
                        this._postRequest(task.path, task.params, function(status, data) {
                          if (status !== 200) {
                            console.log('stathat post error', task, status, data);
                          }
                          callback();
                        });
                },

                _postRequest: function(path, params, callback) {
                        var qs = Object.keys(params)
                        .map( function(k) { return k + '=' + params[k] } )
                        .join('&');

                        var options = {
                                hostname: 'api.stathat.com',
                                path: path,
                                method: 'POST',
                                headers: {
                                        'Content-Type'   : 'application/x-www-form-urlencoded',
                                        'Content-Length' : qs.length
                                }
                        };

                        var hmod = this.useHTTPS ? https : http;
                        var request = hmod.request(options, function(res) {
                                res.on('data', function(chunk) {
                                        callback(res.statusCode, chunk);
                                });
                        });

                        request.on('error', function(e) {
                                if (!e) e = {};
                                callback(600,e.message);
                        });

                        request.write(qs);

                        request.end();
                },
        };

        StatHat.postQueue = async.queue(StatHat._processTask.bind(StatHat),
                                        parseInt(process.env.STATHAT_OUTBOUND_CONCURRENCY || '10')),

        module.exports = StatHat;

}())
