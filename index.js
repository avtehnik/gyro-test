// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var noble = require('noble');

var bufferpack = require('bufferpack');

var  uu_id = 'c23d48a715f1433d9cd011199ab5f77a';
var service_id = '6b943144075dd89ae6116cad4ac9b4a8'
var characterist_ic = '6b943146075dd89ae6116cad4ac9b4a8'


function convertRawGyro(gRaw) {
  var g = (gRaw * 250.0) / 32768.0;
  return g;
}

noble.on('stateChange', function(state) {
console.log(state);

  if (state === 'poweredOn') {
    console.log('scanning...');
    noble.startScanning([], false);
  }
  else {
    noble.stopScanning();
  }
})

var started, resetTimeoutHandle, resetTimeout = 1000,
      clicks = 0;
      started = new Date();
      clicks = 0;

    function clicksPerSecond(started, clicks) {
    return clicks / ((new Date()) - started) * 1000;
}

var count = 0;

var sensortimeBefore = 0;
noble.on('discover', function(peripheral) {
	console.log(peripheral);
    if (peripheral.uuid == uu_id) {
        noble.stopScanning();


      peripheral.on('disconnect', function() {
         noble.startScanning();
      });

        peripheral.connect(function(err) {
                    console.log('connected: ',peripheral.advertisement.localName,  peripheral.uuid );
            peripheral.discoverServices([service_id], function(err, services) {
                services.forEach(function(service) {
                    console.log('found service:', service.uuid);
                    service.discoverCharacteristics([characterist_ic], function(err, characteristics) {
                        characteristics.forEach(function(characteristic) {
                            console.log('found characteristic:', characteristic.uuid);
                            if(characteristic.uuid==characterist_ic){
                                 characteristic.subscribe(function(err) {
                                   started = new Date();
                                  clicks = 0;
                                    console.log('found characteristic subscribe ', err);

                                 })
                            }

                            characteristic.on('data', function(data, isNotification){
                              clearTimeout(resetTimeoutHandle);
                                clicks++;
                                  var gyrodata =  bufferpack.unpack('<h(accelx)h(accely)h(accelz)L(accelSt)h(gyrox)h(gyroy)h(gyroz)L(gyroSt))', data, 0)
                                console.log(gyrodata);
                                console.log(clicksPerSecond(started, clicks).toPrecision(3),count, (gyrodata.accelSt-sensortimeBefore));

                                  io.to('gyrodata').emit('gyrodata',{
                                    gyroX : convertRawGyro(gyrodata.gyrox),
                                    gyroY : convertRawGyro(gyrodata.gyroy),
                                    gyroZ : convertRawGyro(gyrodata.gyroz),
                                    gyroSt: gyrodata.gyroSt,
                                    accX : convertRawGyro(gyrodata.accelx),
                                    accY : convertRawGyro(gyrodata.accely),
                                    accZ : convertRawGyro(gyrodata.accelz),
                                    accelSt: gyrodata.accelSt
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
