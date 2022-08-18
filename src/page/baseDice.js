import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";

import * as CANNON from "cannon";
import { DiceManager, DiceD6 } from "threejs-dice/lib/dice";

let renderer, camera, controls;

// standard global variables
let container,
    world,
    dice = [];

/**
 * Base
 */


// Scene
const scene = new THREE.Scene()

const clock = new THREE.Clock()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

/**
 * Test cube
 */
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial()
)
scene.add(cube)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

export default function Main() {
    const canvasRef = useRef();
    useEffect(() => {
        baseInit();
        sceneInit();
        tick();

        // 나갈때 gui 해제 , 삭제 ?
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function baseInit() {
        const canvas = canvasRef.current;

        /**
         * Camera
         */
        // Base camera
        camera = new THREE.PerspectiveCamera(
            75,
            sizes.width / sizes.height,
            0.1,
            100
        );
        camera.position.z = 3
        scene.add(camera);

        // Controls
        controls = new OrbitControls(camera, canvas);
        controls.enableDamping = true;

        // Renderer

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        renderer.setSize(sizes.width, sizes.height);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        window.addEventListener("resize", () => {
            // console.log("window has been resized")
            sizes.width = window.innerWidth;
            sizes.height = window.innerHeight;

            //Update camera
            camera.aspect = sizes.width / sizes.height;
            camera.updateProjectionMatrix();

            //Update Renderer
            renderer.setSize(sizes.width, sizes.height);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        });


        // Debug
        const gui = new GUI()

        let ambient = new THREE.AmbientLight("#ffffff", 0.3);
        scene.add(ambient);

        let directionalLight = new THREE.DirectionalLight("#ffffff", 0.5);
        directionalLight.position.x = -1000;
        directionalLight.position.y = 1000;
        directionalLight.position.z = 1000;
        scene.add(directionalLight);

        let light = new THREE.SpotLight(0xefdfd5, 1.3);
        light.position.y = 100;
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.camera.near = 50;
        light.shadow.camera.far = 110;
        light.shadow.mapSize.width = 1024;
        light.shadow.mapSize.height = 1024;
        scene.add(light);

        // FLOOR
        var floorMaterial = new THREE.MeshPhongMaterial({
            color: "#00aa00",
            side: THREE.DoubleSide
        });
        var floorGeometry = new THREE.PlaneGeometry(30, 30, 10, 10);
        var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.receiveShadow = true;
        floor.rotation.x = Math.PI / 2;
        scene.add(floor);
        // // SKYBOX/FOG
        // var skyBoxGeometry = new THREE.BoxGeometry(10000, 10000, 10000);
        // var skyBoxMaterial = new THREE.MeshPhongMaterial({
        //     color: 0x9999ff,
        //     side: THREE.BackSide
        // });
        // var skyBox = new THREE.Mesh(skyBoxGeometry, skyBoxMaterial);
        // scene.add(skyBox);
        // scene.fog = new THREE.FogExp2(0x9999ff, 0.00025);



        // ////////////
        // // CUSTOM //
        // ////////////
        world = new CANNON.World();

        world.gravity.set(0, -9.82 * 20, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        world.solver.iterations = 16;

        DiceManager.setWorld(world);

        //Floor
        let floorBody = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Plane(),
            material: DiceManager.floorBodyMaterial
        });
        floorBody.quaternion.setFromAxisAngle(
            new CANNON.Vec3(1, 0, 0),
            -Math.PI / 2
        );
        world.add(floorBody);

        // //Walls

        var colors = ["#ff0000", "#ffff00", "#00ff00", "#0000ff", "#ff00ff"];
        for (var i = 0; i < 5; i++) {
            var die = new DiceD6({ size: 1.5, backColor: colors[i] });
            console.log(die)
            let tmp = die.getObject()
            console.log(die.getObject())
            // scene.add(die.getObject());
            // scene.add(tmp);

            dice.push(die);
        }

        console.log(scene)
    }

    function sceneInit() { }


    // function randomDiceThrow() {
    //     var diceValues = [];

    //     for (var i = 0; i < dice.length; i++) {
    //         let yRand = Math.random() * 20;
    //         dice[i].getObject().position.x = -15 - (i % 3) * 1.5;
    //         dice[i].getObject().position.y = 2 + Math.floor(i / 3) * 1.5;
    //         dice[i].getObject().position.z = -15 + (i % 3) * 1.5;
    //         dice[i].getObject().quaternion.x =
    //             ((Math.random() * 90 - 45) * Math.PI) / 180;
    //         dice[i].getObject().quaternion.z =
    //             ((Math.random() * 90 - 45) * Math.PI) / 180;
    //         dice[i].updateBodyFromMesh();
    //         let rand = Math.random() * 5;
    //         dice[i]
    //             .getObject()
    //             .body.velocity.set(25 + rand, 40 + yRand, 15 + rand);
    //         dice[i]
    //             .getObject()
    //             .body.angularVelocity.set(
    //                 20 * Math.random() - 10,
    //                 20 * Math.random() - 10,
    //                 20 * Math.random() - 10
    //             );

    //         diceValues.push({ dice: dice[i], value: i + 1 });
    //     }

    //     DiceManager.prepareValues(diceValues);
    // }

    function tick() {
        const elapsedTime = clock.getElapsedTime();

        // world.step(1.0 / 60.0);

        // for (var i in dice) {
        //     dice[i].updateMeshFromBody();
        // }

        // Update controls
        controls.update();

        // Render
        renderer.render(scene, camera);

        // Call tick again on the next frame
        requestAnimationFrame(tick);
    }

    return <canvas ref={canvasRef} className="webgl"></canvas>;
}
