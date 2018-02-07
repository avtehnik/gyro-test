
    var camera, scene, renderer;
    var mesh;

    init();
    animate();

    function init() {

        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 100 );
        camera.position.z = 2;

        scene = new THREE.Scene();


        controls = new THREE.TrackballControls( camera );
        scene = new THREE.Scene();
        scene.add( new THREE.HemisphereLight() );
        var directionalLight = new THREE.DirectionalLight( 0xffeedd );
        directionalLight.position.set( 0, 0, 2 );
        scene.add( directionalLight );


        //var texture = new THREE.TextureLoader().load( 'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/crate.gif' );
        //
        //var geometry = new THREE.BoxBufferGeometry( 200, 200, 200 );
        //var material = new THREE.MeshBasicMaterial( { map: texture } );

        //mesh = new THREE.Mesh( geometry, material );
        //scene.add( mesh );

        var loader = new THREE.TextureLoader();
        var normal = loader.load( 'BiathlonRifle_3DS/Rifle_Normal.jpg' );
        var loader = new THREE.TDSLoader( );
        loader.setPath( 'BiathlonRifle_3DS/' );
        loader.load( 'BiathlonRifle_3DS/BiathlonRifle.3ds', function ( object ) {
            object.traverse( function ( child ) {
                if ( child instanceof THREE.Mesh ) {
                    child.material.normalMap = normal;
                }
            } );
            scene.add( object );
        });



        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        document.body.appendChild( renderer.domElement );

        //

        window.addEventListener( 'resize', onWindowResize, false );

    }

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }

    var socket = io("ws://localhost:3000");
    var rx=0,ry=0,rz=0, px=0,py=0,pz=0 ;

    socket.on('gyrodata', function (data) {

        mesh.rotation.x = rx;
        mesh.rotation.y = ry;
        mesh.rotation.z = rz;

        // mesh.position.x = px;
        // mesh.position.y = py;
        // mesh.position.z = pz;


        rx = (rx - (data.gyroX/3000));
        ry = (ry - (data.gyroY/3000));
        rz = (rz - (data.gyroZ/3000));

        px = (px - (data.accX/100));
        py = (py - (data.accY/100));
        pz = (pz - (data.accZ/100));

        px = data.accX;
        py = data.accY;
        pz = data.accZ;
//        console.log(px,py,pz);

    });


    function animate() {

        requestAnimationFrame( animate );

//        mesh.rotation.x += 0.005;
//        mesh.rotation.y += 0.01;

        renderer.render( scene, camera );

    }