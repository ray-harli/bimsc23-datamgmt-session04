// Import libraries
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Rhino3dmLoader } from 'three/addons/loaders/3DMLoader.js'
import rhino3dm from 'rhino3dm'
import { RhinoCompute } from 'rhinocompute'

const definitionName = 'pixel_cube.gh'

// Set up sliders
const XYZTRANS_slider = document.getElementById('General Transform')
XYZTRANS_slider.addEventListener('mouseup', onSliderChange, false)
XYZTRANS_slider.addEventListener('touchend', onSliderChange, false)

const XTRANS_slider = document.getElementById('X Transform')
XTRANS_slider.addEventListener('mouseup', onSliderChange, false)
XTRANS_slider.addEventListener('touchend', onSliderChange, false)

const YTRANS_slider = document.getElementById('Y Transform')
YTRANS_slider.addEventListener('mouseup', onSliderChange, false)
YTRANS_slider.addEventListener('touchend', onSliderChange, false)

const ZTRANS_slider = document.getElementById('Z Transform')
ZTRANS_slider.addEventListener('mouseup', onSliderChange, false)
ZTRANS_slider.addEventListener('touchend', onSliderChange, false)

const Pop_slider = document.getElementById('Populate Count')
Pop_slider.addEventListener('mouseup', onSliderChange, false)
Pop_slider.addEventListener('touchend', onSliderChange, false)

const Seed_slider = document.getElementById('Seed')
Seed_slider.addEventListener('mouseup', onSliderChange, false)
Seed_slider.addEventListener('touchend', onSliderChange, false)

const Decon_slider = document.getElementById('Deconstruct')
Decon_slider.addEventListener('mouseup', onSliderChange, false)
Decon_slider.addEventListener('touchend', onSliderChange, false)



const loader = new Rhino3dmLoader()
loader.setLibraryPath('https://cdn.jsdelivr.net/npm/rhino3dm@0.15.0-beta/')

let rhino, definition, doc
rhino3dm().then(async m => {
    console.log('Loaded rhino3dm.')
    rhino = m // global


    //RhinoCompute.url = getAuth( 'RHINO_COMPUTE_URL' ) // RhinoCompute server url. Use http://localhost:8081 if debugging locally.
    //RhinoCompute.apiKey = getAuth( 'RHINO_COMPUTE_KEY' )  // RhinoCompute server api key. Leave blank if debugging locally.

 // RhinoCompute.url = "http://localhost:8081/"; //if debugging locally.
 RhinoCompute.url = "http://35.157.191.153/"; //if debugging locally.
 RhinoCompute.apiKey = "macad2023"

    // load a grasshopper file!
    const url = definitionName
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    const arr = new Uint8Array(buffer)
    definition = arr

    init()
    compute()
})

async function compute() {


    const param1 = new RhinoCompute.Grasshopper.DataTree('General Transform')
    param1.append([0], [XYZTRANS_slider.valueAsNumber])

    const param2 = new RhinoCompute.Grasshopper.DataTree('X Transform')
    param2.append([0], [XTRANS_slider.valueAsNumber])

    const param3 = new RhinoCompute.Grasshopper.DataTree('Y Transform')
    param3.append([0], [YTRANS_slider.valueAsNumber])

    const param4 = new RhinoCompute.Grasshopper.DataTree('Z Transform')
    param4.append([0], [ZTRANS_slider.valueAsNumber])

    const param5 = new RhinoCompute.Grasshopper.DataTree('Populate Count')
    param5.append([0], [Pop_slider.valueAsNumber])

    const param6 = new RhinoCompute.Grasshopper.DataTree('Seed')
    param6.append([0], [Seed_slider.valueAsNumber])

    const param7 = new RhinoCompute.Grasshopper.DataTree('Deconstruct')
    param7.append([0], [Decon_slider.valueAsNumber])

    // clear values
    const trees = []
    trees.push(param1)
    trees.push(param2)
    trees.push(param3)
    trees.push(param4)
    trees.push(param5)
    trees.push(param6)
    trees.push(param7)

    const res = await RhinoCompute.Grasshopper.evaluateDefinition(definition, trees)
    console.log(res)
        


    doc = new rhino.File3dm()

    // hide spinner
    document.getElementById('loader').style.display = 'none'

    for (let i = 0; i < res.values.length; i++) {

        for (const [key, value] of Object.entries(res.values[i].InnerTree)) {
            for (const d of value) {

                const data = JSON.parse(d.data)
                const rhinoObject = rhino.CommonObject.decode(data)
                doc.objects().add(rhinoObject, null)

            }
        }
    }



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
    scene.traverse(child => {
        if (!child.isLight) {
            scene.remove(child)
        }
    })


    const buffer = new Uint8Array(doc.toByteArray()).buffer
    loader.parse(buffer, function (object) {

        scene.add(object)
        // hide spinner
        document.getElementById('loader').style.display = 'none'

    })
}


function onSliderChange() {
    // show spinner
    document.getElementById('loader').style.display = 'block'
    compute()
}


// BOILERPLATE //
let scene, camera, renderer, controls

function init() {

    // create a scene and a camera
    scene = new THREE.Scene()
    scene.background = new THREE.Color(1,1,1)
    camera = new THREE.PerspectiveCamera( 15, window.innerWidth / window.innerHeight, 0.2, 5000 )
    camera.position.set( -1200, 1000, 2000 );
    camera.lookAt( 0, 0, 0 );

    // create the renderer and add it to the html
    renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    document.body.appendChild(renderer.domElement)

    // add some controls to orbit the camera
    controls = new OrbitControls(camera, renderer.domElement)

    // add a directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff)
    directionalLight.intensity = 2
    scene.add(directionalLight)

    const ambientLight = new THREE.AmbientLight()
    scene.add(ambientLight)

    animate()
}

function animate() {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    animate()
}

function meshToThreejs(mesh, material) {
    const loader = new THREE.BufferGeometryLoader()
    const geometry = loader.parse(mesh.toThreejsJSON())
    return new THREE.Mesh(geometry, material)
}

