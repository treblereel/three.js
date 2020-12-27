import { PerspectiveCamera } from './cameras/PerspectiveCamera.js';
import { TextureLoader } from './loaders/TextureLoader.js';
import { Scene } from './scenes/Scene.js';
import { BoxBufferGeometry } from './geometries/BoxBufferGeometry.js';
import { MeshBasicMaterial } from './materials/MeshBasicMaterial.js';
import { Mesh } from './objects/Mesh.js';
import { WebGLRenderer } from './renderers/WebGLRenderer.js';

let camera, scene, renderer;
let mesh;

init();

animate();

function init() {

	camera = new PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
	camera.position.z = 400;

	scene = new Scene();

	const texture = new TextureLoader().load( 'https://threejs.org/examples/textures/crate.gif' );

	const geometry = new BoxBufferGeometry( 200, 200, 200 );
	const material = new MeshBasicMaterial( { map: texture } );

	mesh = new Mesh( geometry, material );
	scene.add( mesh );

	renderer = new WebGLRenderer( { antialias: true } );
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

function animate() {

	requestAnimationFrame( animate );

	mesh.rotation.x += 0.005;
	mesh.rotation.y += 0.01;

	renderer.render( scene, camera );

}
