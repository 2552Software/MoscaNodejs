var mosca = require('mosca');

var pubsubSettings = {
    /* For AMQP use later if we go with AMPQ as a partner */
    type: 'amqp',
    json: false,
    amqp: require('amqp'),
    exchange: 'amq.topic'
};

var mongodbSettings = {
    id: 'mymosca', // used to publish in the $SYS/<id> topicspace
    stats: false, // publish stats in the $SYS/<id> topicspace
    logger: {
        level: 'debug'
    },
    backend: {
        type: 'mongodb',
        url: "mongodb://localhost:27017/mosca"
    },
    persistence: {
        factory: mosca.persistence.Mongo,
        url: "mongodb://localhost:27017/mosca"
    }
};

var SECURE_KEY = __dirname + '/../../test/secure/tls-key.pem';
var SECURE_CERT = __dirname + '/../../test/secure/tls-cert.pem';

var moscaSetting = {
    interfaces: [
        { type: "mqtt", port: 1883 },
        //{ type: "mqtts", port: 8883, credentials: { keyPath: SECURE_KEY, certPath: SECURE_CERT } },
        { type: "http", port: 3000, bundle: true },
        //{ type: "https", port: 3001, bundle: true, credentials: { keyPath: SECURE_KEY, certPath: SECURE_CERT } }
    ],
    stats: false,
    onQoS2publish: 'dropToQoS1', // can set to 'disconnect', or to 'dropToQoS1' if using a client which will eat puback for QOS 2; e.g. mqtt.js

    logger: { name: 'MoscaServer', level: 'debug' },

    backend: mongodbSettings,
};

var authenticate = function (client, username, password, callback) {
    if (username == "test" && password.toString() == "test")
        callback(null, true);
    else
        callback(null, false);
}

var authorizePublish = function (client, topic, payload, callback) {
    var auth = true;
    // set auth to :
    //  true to allow 
    //  false to deny and disconnect
    //  'ignore' to puback but not publish msg.
    callback(null, auth);
}

var authorizeSubscribe = function (client, topic, callback) {
    var auth = true;
    // set auth to :
    //  true to allow
    //  false to deny 
    callback(null, auth);
}

var server = new mosca.Server(moscaSetting);

server.on('ready', setup);

function setup() {
    server.authenticate = authenticate;
    server.authorizePublish = authorizePublish;
    server.authorizeSubscribe = authorizeSubscribe;

    console.log('Mosca server is up and running.');
}

server.on("error", function (err) {
    console.log(err);
});

server.on('clientConnected', function (client) {
    console.log('Client Connected \t:= ', client.id);
});

server.on('published', function (packet, client) {
    console.log("Published :=", packet);
});

server.on('subscribed', function (topic, client) {
    console.log("Subscribed :=", client.packet);
});

server.on('unsubscribed', function (topic, client) {
    console.log('unsubscribed := ', topic);
});

server.on('clientDisconnecting', function (client) {
    console.log('clientDisconnecting := ', client.id);
});

server.on('clientDisconnected', function (client) {
    console.log('Client Disconnected     := ', client.id);
});