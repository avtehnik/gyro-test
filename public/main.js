var camera, scene, renderer, dirLight, dirLightHeper, hemiLight, hemiLightHelper;
var mixers = [];
var stats;
var clock = new THREE.Clock();

var startX = 1.5;
var startY = 3.1;
var startZ = 0;

init();
animate();

function init() {
    var container = document.getElementById( 'container' );
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 5000 );
    camera.position.set( 0, 0, 100 );
    scene = new THREE.Scene();
    scene.background = new THREE.Color().setHSL( 0.6, 0, 1 );
    scene.fog = new THREE.Fog( scene.background, 1, 5000 );
    // LIGHTS
    hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
    hemiLight.color.setHSL( 0.6, 1, 0.6 );
    hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
    hemiLight.position.set( 0, 50, 0 );
    scene.add( hemiLight );

    dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.color.setHSL( 0.1, 1, 0.95 );
    dirLight.position.set( -1, 1.75, 1 );
    dirLight.position.multiplyScalar( 30 );
    scene.add( dirLight );
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
    // GROUND
    var groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 );
    var groundMat = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x050505 } );
    groundMat.color.setHSL( 0.095, 1, 0.75 );
    var ground = new THREE.Mesh( groundGeo, groundMat );
    ground.rotation.x = -Math.PI/2;
    ground.position.y = -33;
    scene.add( ground );
    ground.receiveShadow = true;
    // SKYDOME
    var vertexShader = document.getElementById( 'vertexShader' ).textContent;
    var fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
    var uniforms = {
        topColor:    { value: new THREE.Color( 0x0077ff ) },
        bottomColor: { value: new THREE.Color( 0xffffff ) },
        offset:      { value: 33 },
        exponent:    { value: 0.6 }
    };
    uniforms.topColor.value.copy( hemiLight.color );
    scene.fog.color.copy( uniforms.bottomColor.value );
    var skyGeo = new THREE.SphereGeometry( 4000, 32, 15 );
    var skyMat = new THREE.ShaderMaterial( { vertexShader: vertexShader, fragmentShader: fragmentShader, uniforms: uniforms, side: THREE.BackSide } );
    var sky = new THREE.Mesh( skyGeo, skyMat );
    scene.add( sky );

    // RENDERER
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    container.appendChild( renderer.domElement );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.renderReverseSided = false;

    var loader = new THREE.TextureLoader();
    var normal = loader.load( 'BiathlonRifle_3DS/Rifle_Normal.jpg' );

    var dSloader = new THREE.TDSLoader( );
    dSloader.setPath( 'BiathlonRifle_3DS/' );
    dSloader.load( 'BiathlonRifle_3DS/BiathlonRifle.3ds', function ( object ) {
        object.traverse( function ( child ) {
            if ( child instanceof THREE.Mesh ) {
                child.material.normalMap = normal;
            }
        } );
        console.log(object);

        var socket = io("ws://localhost:3000");
        var rx=0,ry=0,rz=0, px=0,py=0,pz=0 ;

        socket.on('gyrodata', function (data) {
            rx = (rx - (data.gyroX/3000));
            ry = (ry - (data.gyroY/3000));
            rz = (rz - (data.gyroZ/3000));

            object.rotation.x = rx + startX;
            object.rotation.y = ry + startY;
            object.rotation.z = rz + startZ;

//            px = (px - (data.accX/100));
//            py = (py - (data.accY/100));
//            pz = (pz - (data.accZ/100));
//
//            px = data.accX;
//            py = data.accY;
//            pz = data.accZ;
        });

        scene.add( object );
    });

    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'keydown', onKeyDown, false );
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onKeyDown ( event ) {
    switch ( event.keyCode ) {
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
    requestAnimationFrame( animate );
    render();
}

function render() {
    var delta = clock.getDelta();
    for ( var i = 0; i < mixers.length; i ++ ) {
        mixers[ i ].update( delta );
    }
    renderer.render( scene, camera );
}