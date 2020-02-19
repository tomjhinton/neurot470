//pic size 687*687
import React from 'react'
import axios from 'axios'
const CANNON = require('cannon')
const THREE = require('three')
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {noise} from 'perlin'
import { EffectComposer, RenderPass ,Effect, EffectPass} from 'postprocessing'
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
const fragment = `

uniform sampler2D uTexture;
#define PI 3.14159265359

void mainUv(inout vec2 uv) {
        vec4 tex = texture2D(uTexture, uv);
        float angle = -((tex.r) * (PI * 2.) - PI) ;
        float vx = -(tex.r *2. - 1.);
        float vy = -(tex.g *2. - 1.);
        float intensity = tex.b;
        uv.x += vx * 0.2 * intensity ;
        uv.y += vy * 0.2  *intensity;
        // uv.xy *= 1. - 0.5 * smoothstep( 0., 1., intensity) ;
        // uv.x +=  0.2 * intensity;
        // uv.y +=  0.2  *intensity;
    }


`;
const easeOutSine = (t, b, c, d) => {
  return c * Math.sin((t / d) * (Math.PI / 2)) + b;
};

const easeOutQuad = (t, b, c, d) => {
  t /= d;
  return -c * t * (t - 2) + b;
};
export class WaterTexture{
  constructor(options) {
    this.last = null;
    this.size = 64;
      this.radius = this.size * 0.1;
      this.points = [];
        this.maxAge = 64;
     this.width = this.height = this.size;
    if (options.debug) {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.radius = this.width * 0.05;
    }

    this.initTexture();
      if(options.debug) document.body.append(this.canvas);
  }
    // Initialize our canvas
  initTexture() {
    this.canvas = document.createElement("canvas");
    this.canvas.id = "WaterTexture";
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    this.ctx = this.canvas.getContext("2d");
    this.clear();
    this.texture = new THREE.Texture(this.canvas);

  }
  clear() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  update(){
    this.clear();
     let agePart = 1. / this.maxAge;
        this.points.forEach(point => {
          let slowAsOlder = (1.- point.age / this.maxAge)
         let force = point.force * agePart * slowAsOlder;
           point.x += point.vx * force;
           point.y += point.vy * force;
         point.age += 1;
            if(point.age > this.maxAge){
                this.points.splice(this.points.indexOf(point), 1);
            }
        })
        this.points.forEach(point => {
            this.drawPoint(point);
        })
        this.texture.needsUpdate = true;

  }
  addPoint(point){
    let force = 0;
         let vx = 0;
         let vy = 0;
         const last = this.last;
         if(last){
             const relativeX = point.x - last.x;
             const relativeY = point.y - last.y;
             // Distance formula
             const distanceSquared = relativeX * relativeX + relativeY * relativeY;
             const distance = Math.sqrt(distanceSquared);
             // Calculate Unit Vector
             vx = relativeX / distance;
             vy = relativeY / distance;

             force = Math.min(distanceSquared * 10000,1.);
         }

         this.last = {
             x: point.x,
             y: point.y
         }
         this.points.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
   }
   drawPoint(point) {
        // Convert normalized position into canvas coordinates
        let pos = {
            x: point.x * this.width,
            y: point.y * this.height
        }
        const radius = this.radius;


        const ctx = this.ctx;
          // Lower the opacity as it gets older
          let intensity = 1.;
          if (point.age < this.maxAge * 0.3) {
          intensity = easeOutSine(point.age / (this.maxAge * 0.3), 0, 1, 1);
        } else {
          intensity = easeOutQuad(
            1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7),
            0,
            1,
            1
          );
        }
        intensity *= point.force;

        let red = ((point.vx + 1) / 2) * 255;
      let green = ((point.vy + 1) / 2) * 255;
      // B = Unit vector
      let blue = intensity * 255;
      let color = `${red}, ${green}, ${blue}`;


      let offset = this.size * 50;
      ctx.shadowOffsetX = offset;
      ctx.shadowOffsetY = offset;
      ctx.shadowBlur = radius * 1;
      ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;

      this.ctx.beginPath();
      this.ctx.fillStyle = "rgba(0,0,0,1)";
      this.ctx.arc(pos.x - offset, pos.y - offset, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
}
let waterTexture = new WaterTexture({ debug: false })

class Main extends React.Component{
  constructor(){
    super()
    this.state = {
      data: {},
      error: ''

    }
    this.componentDidMount = this.componentDidMount.bind(this)





  }


  componentDidMount(){
    axios.get('/api/works')
      .then(res => {
        this.setState({works: res.data})
        let container = document.createElement( 'div' )
                  document.body.appendChild( container )
      let scene = new THREE.Scene()
        scene.add( new THREE.AmbientLight( 0x666666 ) )
      let camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 0.5, 10000 )
      camera.position.x=0
                  camera.position.y=-2
                  camera.position.z=2545
      scene.add( camera )
      let light = new THREE.DirectionalLight( 0xffffff, 0.5 )
      scene.add(light)
      let ballGeo = new THREE.SphereGeometry( 20, 80, 80 );
      let texture = new THREE.TextureLoader().load( 'assets/test.png' )
      let texture2 = new THREE.TextureLoader().load( 'assets/test.png' )
      let texture3 = new THREE.TextureLoader().load( 'assets/test.png' )
      if(this.state.works){
               texture = new THREE.TextureLoader().load( `data:image/png;base64,  ${this.state.works[0].dat.slice(2).slice(0, -1)}` )
                texture2 = new THREE.TextureLoader().load( `data:image/png;base64,  ${this.state.works[1].dat.slice(2).slice(0, -1)}` )
                  texture3 = new THREE.TextureLoader().load( `data:image/png;base64,  ${this.state.works[2].dat.slice(2).slice(0, -1)}` )
            };
      let ballMaterial = new THREE.MeshPhongMaterial( { color: 0xFFFFFF, map: texture, side: THREE.DoubleSide, transparent: true } )
    let  ballMesh = new THREE.Mesh( ballGeo, ballMaterial )
    scene.add(ballMesh)
    let renderer = new THREE.WebGLRenderer( {alpha: true } );                renderer.setSize( window.innerWidth, window.innerHeight );
// scene.background = texture3
    container.appendChild( renderer.domElement )
       // let controls = new OrbitControls( camera, renderer.domElement );
      var geometry = new THREE.PlaneGeometry( 1600, 800, 240, 120 );
              var material = new THREE.MeshBasicMaterial( {color: 0xFFFFFF, side: THREE.DoubleSide, map: texture2 , transparent: true} );
            let  plane2 = new THREE.Mesh( geometry, material );
              plane2.matrixWorldNeedsUpdate = true
              plane2.elementsNeedUpdate = true
              plane2.verticesNeedUpdate = true
              plane2.position.x= 150
              //scene.add( plane2 );
camera.position.x= 82.27225032312627
camera.position.y= 1127.8530747241314
camera.position.z= 3665.714473448199

camera.rotation.x = -0.29848421075673864

camera.rotation.y = 0.021448039245458034
camera.rotation.z = 0.006598449365700477
  var waterGeometry = new THREE.PlaneBufferGeometry( 10000, 10000 );

  let water = new Water(
					waterGeometry,
					{
						textureWidth: 512,
						textureHeight: 512,
						waterNormals: new THREE.TextureLoader().load( '../assets/water.jpg', function ( texture ) {

							texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

						} ),
						alpha: 1.0,
						sunDirection: light.position.clone().normalize(),
						sunColor: 0x0000ff,
						waterColor: 0x001e0f,
						distortionScale: 9.7,
						fog: scene.fog !== undefined
					}
				);

				water.rotation.x = - Math.PI / 2;

				scene.add( water );
        // // var sky = new Sky();
        //
        // 				var uniforms = sky.material.uniforms;
        //
        // 				uniforms[ 'turbidity' ].value = 10;
        // 				uniforms[ 'rayleigh' ].value = 2;
        // 				uniforms[ 'luminance' ].value = 1;
        // 				uniforms[ 'mieCoefficient' ].value = 0.005;
        // 				uniforms[ 'mieDirectionalG' ].value = 0.8;
        //
        // 				var parameters = {
        // 					distance: 400,
        // 					inclination: 0.49,
        // 					azimuth: 0.205
        // 				};

        				// var cubeCamera = new THREE.CubeCamera( 0.1, 1, 512 );
        				// cubeCamera.renderTarget.texture.generateMipmaps = true;
        				// cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;

                scene.background = new THREE.Color( 0xFFFFFF );
                let waterEffect = new Effect("WaterEffect", fragment, {
                      uniforms: new Map([["uTexture", new THREE.Uniform(waterTexture.texture)]])
                    }  );
                  const waterPass = new EffectPass(camera, waterEffect);
                  let composer = new EffectComposer(renderer);
         let  clock = new THREE.Clock();
                  console.log(waterEffect)
const renderPass = new RenderPass(scene, camera);
                  renderPass.renderToScreen = false;
                  waterPass.renderToScreen = true;
                composer.addPass(renderPass);
                composer.addPass(waterPass);
                  composer.addPass(renderPass);
  console.log(composer)
let delta = performance.now() * 0.00008
    function animate() {
      // console.log(camera)
      requestAnimationFrame( animate );
                  // controls.update();
                  water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
                  // sky.material.uniforms[ 'sunPosition' ].value = light.position.copy( light.position );
                  ballMesh.rotation.x+=0.001
                  ballMesh.rotation.y+=0.001
                  //plane2.rotation.y+=0.01
                   plane2.rotation.z+=0.01
                  render();

  var time = performance.now() * 0.0008
  plane2.scale.x = Math.abs( Math.sin( time /2) );
  plane2.scale.y = Math.abs( Math.sin( time /2) );
  var k = 1
  for (var i = 0; i < ballMesh.geometry.vertices.length; i++) {
    var p = ballMesh.geometry.vertices[i]
    p.normalize().multiplyScalar(400 + 600.8 * noise.perlin3(p.x * k + time, p.y * k, p.z * k))
  }

  ballMesh.geometry.computeVertexNormals()
  ballMesh.geometry.normalsNeedUpdate = true
  ballMesh.geometry.verticesNeedUpdate = true



              }

              function render() {


                //console.log(camera)




    //               if(cannonDebugRenderer){
    //   cannonDebugRenderer.update()
    // }
        composer.render(clock.getDelta())
          renderer.render(scene,camera)
          waterTexture.update()
          console.log(camera)
        }
    animate();

      })
  window.addEventListener('mousemove', this.onMouseMove.bind(this));

  }

  componentDidUpdate(){



  }

  onMouseMove(ev){
    console.log(waterTexture)

              const point = {
      			x: ev.clientX/ window.innerWidth,
      			y: ev.clientY/ window.innerHeight,
              }
              waterTexture.addPoint(point);
      	}



  render() {

    //console.log(this.state)

    return (
      <div>

      <div className='text '>
      The intersection of art and technology


      </div>

</div>


    )
  }
}
export default Main
