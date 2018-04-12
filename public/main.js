var camera, scene, renderer, dirLight, dirLightHeper, hemiLight, hemiLightHelper;
var mixers = [];
var stats;
var clock = new THREE.Clock();

//start position values
var b = new THREE.Euler( 0, 0, Math.PI, 'XYZ' );
var centerX = 0;
var centerY = -10;
var centerZ = -10;

init();
animate();

var globalObj;
var axesHelper;

// var buttons = document.getElementsByTagName("button");
// for (let i = 0; i < buttons.length; i++) {
//   buttons[i].addEventListener("click", onButtonClick, false);
// };

//var buttons0 = document.getElementsByTagName("a");
var buttons0 = document.getElementsByTagName("button0");
var buttons1 = document.getElementsByTagName("button1");
var buttons2 = document.getElementsByTagName("button2");
//document.body.appendChild(renderer.domElement);

function onButtonClick(event) {
  alert(event.target.id);
}

document.body.appendChild(renderer.domElement);

function init() {

    var container = document.getElementById('container');
    camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 5000);
    //camera.position.set(0, 0, 100);
    camera.position.set(0, -100, 0);
    camera.rotation.x = 90 * Math.PI / 180;
    scene = new THREE.Scene();
    scene.background = new THREE.Color().setHSL(0.6, 0, 1);
    scene.fog = new THREE.Fog(scene.background, 1, 5000);
    // LIGHTS
    hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.6);
    hemiLight.color.setHSL(0.6, 1, 0.6);
    hemiLight.groundColor.setHSL(0.095, 1, 0.75);
    hemiLight.position.set(0, 0, -10);//0 30 0
    scene.add(hemiLight);
    //hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
    //scene.add( hemiLightHelper );

                    // LIGHTS
                // /hemiLight = new THREE.HemisphereLight( 0xff0000, 0x0000ff, 1 );
                //hemiLight.color.setHSL( 0.6, 1, 0.6 );
                //hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
                //hemiLight.position.set( 0, 0, 10);
                //hemiLight.rotation.x = 180 * Math.PI / 180;
                //scene.add( hemiLight );
                //hemiLightHelper = new THREE.HemisphereLightHelper( hemiLight, 10 );
                //scene.add( hemiLightHelper );

    dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.color.setHSL(0.1, 1, 0.95);
    dirLight.position.set(-1, -1.75, 1);
    dirLight.position.multiplyScalar(30);
    scene.add(dirLight);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    var d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.camera.far = 3500;
    dirLight.shadow.bias = -0.0001;
    //dirLightHeper = new THREE.DirectionalLightHelper( dirLight, 10 ) 
    //scene.add( dirLightHeper );
    // GROUND
    var groundGeo = new THREE.PlaneBufferGeometry(10000, 10000);
    var groundMat = new THREE.MeshPhongMaterial({color: 0xffffff, specular: 0x050505});
    groundMat.color.setHSL(0.095, 1, 0.75);
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = 0 * Math.PI / 180;
    ground.position.z = -33;
    
    scene.add(ground);
    ground.receiveShadow = true;
    // SKYDOME
    var vertexShader = document.getElementById('vertexShader').textContent;
    var fragmentShader = document.getElementById('fragmentShader').textContent;
    var uniforms = {
        topColor: {value: new THREE.Color(0x0077ff)},
        bottomColor: {value: new THREE.Color(0xffffff)},
        //topColor: {value: new THREE.Color(0xffffff)},
        //bottomColor: {value: new THREE.Color(0x0077ff)},
        
        offset: {value: 33},
        exponent: {value: 0.6}
    };
    uniforms.topColor.value.copy(hemiLight.color);
    scene.fog.color.copy(uniforms.bottomColor.value);
    var skyGeo = new THREE.SphereGeometry(4000, 32, 15);
    var skyMat = new THREE.ShaderMaterial({vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide});
    var sky = new THREE.Mesh(skyGeo, skyMat);
    //sky.rotation.x = 90 * Math.PI / 180;
    //sky.position.z = 1;
    scene.add(sky);
    axesHelper = new THREE.AxisHelper(30);
    scene.add(axesHelper);

    // RENDERER
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.renderReverseSided = false;

    var loader = new THREE.TextureLoader();
    var normal = loader.load('BiathlonRifle_3DS/Rifle_Normal.jpg');

    var dSloader = new THREE.TDSLoader();
    dSloader.setPath('BiathlonRifle_3DS/');
    dSloader.load('BiathlonRifle_3DS/BiathlonRifle.3ds', function (object) {
        object.traverse(function (child) {
            if (child instanceof THREE.Mesh) {
                child.material.normalMap = normal;
            }
        });

        scene.add(object);
        // object.children.forEach(function (child) {
        //     //center of model
        //     child.geometry.translate(centerX, centerY, centerZ);
        //     //child.object.rotation.x = Math.PI;
        //     //child.geometry.object.rotation.x(Math.PI*0.5);
        //     //child.geometry.rotateY(Math.PI);
        //     //start position
        //     //object.setRotationFromEuler(b);
        // });


        var isFirstStart = true;
        //globalObj = object;
        var socket = io("ws://localhost:3000");

        socket.on('gyrodata', function (data) {
            //console.log('1test7 = ',data.q_data);
            //object.rotateX(data.gyroX);
            //object.rotateY(data.gyroY);
            //object.rotateZ(data.gyroZ);


            if(isFirstStart){
                object.children.forEach(function (child) {
                    //console.log("testing",data.data_mod);
                    if(data.data_mod == 0){
                        //child.object.rotateZ(Math.PI/4);
                        //child.object.rotation.x = Math.PI;
                        //console.log("testing",data.data_mod);
                        object.setRotationFromEuler(b);
                    }
                    //console.log("testing1",data.data_mod);
                    //center of model
                    child.geometry.translate(centerX, centerY, centerZ);
                });
                isFirstStart = false;
            }

            if(data.data_mod == 0){
                object.rotateX(data.ang_x);
                object.rotateY(data.ang_y);
                object.rotateZ(data.ang_z);
            }else if(data.data_mod == 1){
                object.setRotationFromQuaternion(data.quaternion_);
                object.rotateX(Math.PI);
                object.rotateY(Math.PI);
            }


            //object.rotateZ(Math.PI*0.5);
        });

        
    });

    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    switch (event.keyCode) {
        case 72: // h
            hemiLight.visible = !hemiLight.visible;
            hemiLightHelper.visible = !hemiLightHelper.visible;
            break;
        case 68: // d
            dirLight.visible = !dirLight.visible;
            dirLightHeper.visible = !dirLightHeper.visible;
            break;
    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    var delta = clock.getDelta();
    for (var i = 0; i < mixers.length; i++) {
        mixers[i].update(delta);
    }
    renderer.render(scene, camera);
}
