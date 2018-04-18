// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var noble = require('noble');

var bufferpack = require('bufferpack');
var runInterval = require('runinterval');

var uu_id = 'e7512198ae69'; //TODO: change it if need!!!
var service_id_r      = '6b943144075dd89ae6116cad4ac9b4a8';
var characterist_ic_r = '6b943146075dd89ae6116cad4ac9b4a8';

var service_id_m      = '6c943154075dd89ae6116cad4ac9b4a8';
var characterist_ic_m = '6c943156075dd89ae6116cad4ac9b4a8';
var data_mod = 0;

var X_ang = 0;
var Y_ang = 0;
var Z_ang = 0;

var X_temp = 0;
var Y_temp = 0;
var Z_temp = 0;

var time_old = 0;

var offset_gx = 0.0126947886;
var offset_gy = 0.0035971527;
var offset_gz = 0.0069405;

var isbuttonclick = 0;
var buttonname = 0;

var Quaternion = require('quaternion');


function deg_to_rad(v){
    return (v/180)*Math.PI;
}

function rad_to_deg(v){
    return (v*180)/Math.PI;
}

function delta_Time(time_val) {
    var time_new = (time_val-time_old) * 0.000039;
    time_old = time_val;
    return time_new;
}

function angle_move(angle__,time_stamp){
	angle__ = angle__ * time_stamp;
	return angle__;
}

function convertRawGyro(gRaw) {
    return ((gRaw * (2000 / 32767.0))/180)*Math.PI;
}

function convertRawACC(gRaw) {
    return (gRaw * (2 / 32767.0));
}


const conif = require('node-console-input');

var name = conif.getConsoleInput("TYPE MOD: \n 'r' - raw from sensor \n 'm' - quaternions from madgwick filter \n", false);

while(!['r', 'm'].includes(name)){
    console.log("***!!!WRONG MOD!!!***\n");
    var name = conif.getConsoleInput("TYPE MOD: \n 'r' - raw from sensor \n 'm' - quaternions from madgwick filter \n", false);
}

console.log("Good choice, " + name + "\n");

if(name == 'r'){
    data_mod = 0;
    var service_id =  service_id_r;
    var characterist_ic = characterist_ic_r;
} else if(name == 'm'){
    var service_id =  service_id_m;
    var characterist_ic = characterist_ic_m;
    data_mod = 1;
}


noble.on('stateChange', function (state) {
    console.log(state);

    if (state === 'poweredOn') {
        console.log('scanning...');
        noble.startScanning([], false);
    }
    else {
        noble.stopScanning();
        console.log('stop_scanning...');
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

            peripheral.discoverServices([], function (err, services) {

                services.forEach(function (service) {

                    console.log('found service:', service.uuid);
                    service.discoverCharacteristics([], function (err, characteristics) {
                        characteristics.forEach(function (characteristic) {
                            console.log('found characteristic:', characteristic.uuid);

                            if(characteristic.uuid == '000015251212efde1523785feabcd123'){
                            console.log("writeaaa");
                                this.runInterval = setInterval(() => {

                                        if(isbuttonclick == 1){
                                            isbuttonclick = 0;
                                            var value_ = 0;
                                            if(buttonname == 'red'){
                                                value_ = 0x01;
                                            }else if(buttonname == 'blue'){
                                                value_ = 0x02;
                                            }else if(buttonname == 'green'){
                                                value_ = 0x03;
                                            }else if(buttonname == 'foc'){
                                                value_ = 0x04;
                                            }
                                            characteristic.write(new Buffer([value_]), true, function(error) {
                                                console.log('writed');
                                            });
                                        }
                                }, 100);
                            }

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

                                if(service_id == service_id_r){

                                        let gyrodata = bufferpack.unpack('<h(accelx)h(accely)h(accelz)L(accelSt)h(gyrox)h(gyroy)h(gyroz))', data, 0);

                                        X_temp = convertRawGyro(gyrodata.gyrox);// - 0.0126947886;
                                        Y_temp = convertRawGyro(gyrodata.gyroy);// - 0.0035971527;
                                        Z_temp = convertRawGyro(gyrodata.gyroz);// - 0.0069405;//0.0076008937;
                                        //console.log('test');
                                        var rrr = delta_Time(gyrodata.accelSt);

                                        X_ang = angle_move(X_temp, rrr);
                                        Y_ang = angle_move(Y_temp, rrr);
                                        Z_ang = angle_move(Z_temp, rrr);
                                        //console.log(X_ang,Y_ang,Z_ang);

                                }else if(service_id == service_id_m){

                                        let gyrodata0 = bufferpack.unpack('<f(float0)f(float1)f(float2)f(float3)', data, 0);

                                        console.log('1test5 = ',gyrodata0);

                                        var q_data = Quaternion();
                                        q_data.w = gyrodata0.float0;
                                        q_data.x = gyrodata0.float1;
                                        q_data.y = gyrodata0.float2;
                                        q_data.z = gyrodata0.float3;
                                        console.log('1test6 = ',q_data);

                                        //.setRotationFromQuaternion
                                            var qx2;
                                            var qy2;
                                            var qz2;
                                            var q = q_data;// 'кватернион должен быть нормализован
                                            qx2 = q.x * q.x;
                                            qy2 = q.y * q.y;
                                            qz2 = q.z * q.z;
                                            var heading = Math.atan2(2 * (q.x * q.w + q.y * q.z), 1 - 2 * (qx2 + qy2));
                                            var attitude = Math.asin(2 * (q.y * q.w - q.z * q.x));
                                            var bank = Math.atan2(2 * (q.z * q.w + q.x * q.y), 1 - 2 * (qy2 + qz2));


                                        //var test0 = new THREE.Euler( -Math.PI/2, 0, Math.PI, 'XYZ' );

                                            console.log(rad_to_deg(heading),rad_to_deg(attitude),rad_to_deg(bank));
                                            var quat0 = new Quaternion([heading, attitude, bank]);
                                            console.log(quat0);
                                }

                                io.to('gyrodata').emit('gyrodata', {

                                    quaternion_:q_data,
                                    ang_x:-X_ang,
                                    ang_y:-Y_ang,
                                    ang_z:Z_ang,
                                    data_mod:data_mod

                                });
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
    socket.on('join', function(myfunc){
        isbuttonclick = 1;
        buttonname = myfunc.temp_id;
        //console.log("r_button_socket");
        console.log(myfunc.temp_id);
    });
});
