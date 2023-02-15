// Import libraries
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'
import rhino3dm from 'rhino3dm'
import { RhinoCompute } from 'rhinocompute'

const definitionName = 'shell_2.gh';

// Set up sliders
const height_slider = document.getElementById("height");
height_slider.addEventListener("mouseup", onSliderChange, false);
height_slider.addEventListener("touchend", onSliderChange, false);

const bend_slider = document.getElementById("bend");
bend_slider.addEventListener("mouseup", onSliderChange, false);
bend_slider.addEventListener("touchend", onSliderChange, false);

const part_slider = document.getElementById("part");
part_slider.addEventListener("mouseup", onSliderChange, false);
part_slider.addEventListener("touchend", onSliderChange, false);

const loader = new Rhino3dmLoader();
loader.setLibraryPath("https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/");

let rhino, definition, doc;
rhino3dm().then(async (m) => {
  console.log("Loaded rhino3dm.");
  rhino = m; // global

  // RhinoCompute.url = "http://localhost:8081/"; //if debugging locally.
  RhinoCompute.url = "http://35.157.191.153/"; //if debugging locally.
  RhinoCompute.apiKey = "macad2023"

  // load a grasshopper file!

  const url = definitionName;
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  const arr = new Uint8Array(buffer);
  definition = arr;

  init();
  compute();
});

async function compute() {
  const param1 = new RhinoCompute.Grasshopper.DataTree("Height");
  param1.append([0], [height_slider.valueAsNumber]);

  const param2 = new RhinoCompute.Grasshopper.DataTree("Bend");
  param2.append([0], [bend_slider.valueAsNumber]);

  const param3 = new RhinoCompute.Grasshopper.DataTree("Parts");
  param3.append([0], [part_slider.valueAsNumber]);

  // clear values
  const trees = [];
  trees.push(param1);
  trees.push(param2);
  trees.push(param3);

  const res = await RhinoCompute.Grasshopper.evaluateDefinition(
    definition,
    trees
  );


  console.log(res);

  doc = new rhino.File3dm();

  // hide spinner
  document.getElementById("loader").style.display = "none";

  //decode grasshopper objects and put them into a rhino document
  for (let i = 0; i < res.values.length; i++) {
    for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
      for (const d of value) {
        const data = JSON.parse(d.data);
        const rhinoObject = rhino.CommonObject.decode(data);
        doc.objects().add(rhinoObject, null);
      }
    }
  }



  // go through the objects in the Rhino document

  let objects = doc.objects();
  for ( let i = 0; i < objects.count; i++ ) {
  
    const rhinoObject = objects.get( i );


     // asign geometry userstrings to object attributes
    if ( rhinoObject.geometry().userStringCount > 0 ) {
      const g_userStrings = rhinoObject.geometry().getUserStrings()
      rhinoObject.attributes().setUserString(g_userStrings[0][0], g_userStrings[0][1])
      
    }
  }

  // clear objects from scene
  scene.traverse((child) => {
    if (!child.isLight) {
      scene.remove(child);
    }
  });

  const buffer = new Uint8Array(doc.toByteArray()).buffer;
  loader.parse(buffer, function (object) {
    
    // go through all objects, check for userstrings and assing colors
    object.traverse((child) => {
      console.log(child)
      if (child.isMesh) {

        if (child.userData.attributes.geometry.userStringCount > 0) {
          
          //get color from userStrings
          const AreaData = child.userData.attributes.userStrings[0]
          const Area = AreaData[1];

          //convert color from userstring to THREE color and assign it
          const threeColor = new THREE.Color("rgb(" + col + ")");
          const mat = new THREE.MeshBasicMaterial({ color: threeColor });
          child.material = mat;
        }
      }
    });

    ///////////////////////////////////////////////////////////////////////
    // add object graph from rhino model to three.js scene
    scene.add(object);

  });
}

function onSliderChange() {
  // show spinner
  document.getElementById("loader").style.display = "block";
  compute();
}


// THREE BOILERPLATE //
let scene, camera, renderer, controls;

THREE.Object3D.DefaultUp = new THREE.Vector3( 0, 0, 1 )

function init() {
  // create a scene and a camera
  scene = new THREE.Scene()
  const near = 50
  const far = 400
  const color = 'lightblue'
  scene.fog = new THREE.Fog(color,near,far)
  scene.background = new THREE.Color( 'Skyblue' )
  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 )
  camera.position.y = - 150
  camera.position.x =  150
  camera.position.z =  50

  // create the renderer and add it to the html
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // add some controls to orbit the camera
  controls = new OrbitControls(camera, renderer.domElement);

  // add a directional light
 
    const directionalLight = new THREE.DirectionalLight( 0xffffff )
    directionalLight.position.set( 0, 0, 2 )
    directionalLight.castShadow = true
    directionalLight.intensity = 2
    scene.add( directionalLight )

    const directionalLight2 = new THREE.DirectionalLight( 0xffffff )
    directionalLight2.position.set( 0, 0, -2 )
    directionalLight2.castShadow = true
    directionalLight2.intensity = 2
    scene.add( directionalLight2 )

  animate();
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  animate();
}

function meshToThreejs(mesh, material) {
  const loader = new THREE.BufferGeometryLoader();
  const geometry = loader.parse(mesh.toThreejsJSON());
  return new THREE.Mesh(geometry, material);
}
