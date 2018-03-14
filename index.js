// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var noble = require('noble');

var bufferpack = require('bufferpack');

var uu_id = 'e7512198ae69'; //TODO: change it if need!!!
var service_id = '6b943144075dd89ae6116cad4ac9b4a8';
var characterist_ic = '6b943146075dd89ae6116cad4ac9b4a8';

function convertRawGyro(gRaw) {
    return (gRaw * 250.0) / 32768.0 / 3000;
}

noble.on('stateChange', function (state) {
    console.log(state);

    if (state === 'poweredOn') {
        console.log('scanning...');
        noble.startScanning([], false);
    }
    else {
        noble.stopScanning();
    }
});

let started, resetTimeoutHandle, clicks = 0, count = 0, sensortimeBefore = 0;
started = new Date();

function clicksPerSecond(started, clicks) {
    return clicks / ((new Date()) - started) * 1000;
}

noble.on('discover', function (peripheral) {
    console.log('Find: ', peripheral.advertisement.localName, peripheral.uuid);
    if (peripheral.uuid == uu_id) {
        noble.stopScanning();
        peripheral.on('disconnect', function () {
            noble.startScanning();
        });

        peripheral.connect(function (err) {
            console.log('connected: ', peripheral.advertisement.localName, peripheral.uuid);
            peripheral.discoverServices([service_id], function (err, services) {
                services.forEach(function (service) {
                    console.log('found service:', service.uuid);
                    service.discoverCharacteristics([characterist_ic], function (err, characteristics) {
                        characteristics.forEach(function (characteristic) {
                            console.log('found characteristic:', characteristic.uuid);
                            if (characteristic.uuid == characterist_ic) {
                                characteristic.subscribe(function (err) {
                                    started = new Date();
                                    clicks = 0;
                                    console.log('found characteristic subscribe ', err);
                                })
                            }

                            characteristic.on('data', function (data, isNotification) {
                                clearTimeout(resetTimeoutHandle);
                                clicks++;
                                let gyrodata = bufferpack.unpack('<h(accelx)h(accely)h(accelz)L(accelSt)h(gyrox)h(gyroy)h(gyroz)L(gyroSt))', data, 0);
                                // console.log(gyrodata);
                                // console.log(clicksPerSecond(started, clicks).toPrecision(3), count, gyrodata.gyroz, ((gyrodata.accelSt - sensortimeBefore) * 39) / 1000000, 'interval seconds');
                                console.log(gyrodata.gyrox, gyrodata.gyroy, gyrodata.gyroz);

                                io.to('gyrodata').emit('gyrodata', {
                                    gyroX: convertRawGyro(gyrodata.gyrox),
                                    gyroY: convertRawGyro(gyrodata.gyroy),
                                    gyroZ: convertRawGyro(gyrodata.gyroz)
                                });
                                sensortimeBefore = gyrodata.accelSt;
                                count++;
                            });
                        })
                    })
                })
            })
        })
    }

});

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function (socket) {
    socket.join('gyrodata');
});
