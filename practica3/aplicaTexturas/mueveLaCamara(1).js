
var gl, program;
var myTorus;
var myphi = 0, zeta = 30, radius = 15, fovy = Math.PI/10;
var selectedPrimitive = exampleCone;
var outerAngle = 0;
var middleAngle = 0;
var innerAngle = 0;
var lightPosition = [20, 2, -50];

function getWebGLContext() {

  var canvas = document.getElementById("myCanvas");

  var names = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];

  for (var i = 0; i < names.length; ++i) {
    try {
      return canvas.getContext(names[i]);
    }
    catch(e) {
    }
  }

  return null;

}

function initShaders() {

  var vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, document.getElementById("myVertexShader").text);
  gl.compileShader(vertexShader);
  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(vertexShader));
    return null;
  }

  var fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, document.getElementById("myFragmentShader").text);
  gl.compileShader(fragmentShader);
  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(fragmentShader));
    return null;
  }

  program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  gl.useProgram(program);

  program.vertexPositionAttribute = gl.getAttribLocation(program, "VertexPosition");
  gl.enableVertexAttribArray(program.vertexPositionAttribute);

  program.modelViewMatrixIndex  = gl.getUniformLocation(program,"modelViewMatrix");
  program.projectionMatrixIndex = gl.getUniformLocation(program,"projectionMatrix");

  // normales
  program.vertexNormalAttribute = gl.getAttribLocation ( program, "VertexNormal");
  program.normalMatrixIndex     = gl.getUniformLocation( program, "normalMatrix");
  gl.enableVertexAttribArray(program.vertexNormalAttribute);

  // material
  program.KaIndex               = gl.getUniformLocation( program, "Material.Ka");
  program.KdIndex               = gl.getUniformLocation( program, "Material.Kd");
  program.KsIndex               = gl.getUniformLocation( program, "Material.Ks");
  program.alphaIndex            = gl.getUniformLocation( program, "Material.alpha");

  // fuente de luz
  program.LaIndex               = gl.getUniformLocation( program, "Light.La");
  program.LdIndex               = gl.getUniformLocation( program, "Light.Ld");
  program.LsIndex               = gl.getUniformLocation( program, "Light.Ls");
  program.PositionIndex         = gl.getUniformLocation( program, "Light.Position");
}

function initRendering() {

  gl.clearColor(0.15,0.15,0.15,1.0);
  gl.enable(gl.DEPTH_TEST);

  setShaderLight();

}

function initBuffers(model) {

  model.idBufferVertices = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);

  model.idBufferIndices = gl.createBuffer ();
  gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);

}

function drawWire(model) {

 gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
 gl.vertexAttribPointer (program.vertexPositionAttribute, 3, gl.FLOAT, false, 2*3*4,   0);
 gl.vertexAttribPointer (program.vertexNormalAttribute,   3, gl.FLOAT, false, 2*3*4, 3*4);

 gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
 gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);

}

function initPrimitives() {

  initBuffers(examplePlane);
  initBuffers(exampleCube);
  initBuffers(exampleCone);
  initBuffers(exampleCylinder);
  initBuffers(exampleSphere);

  myTorusInt = makeTorus(0.1, 3.1, 30, 40);
  initBuffers(myTorusInt);

  myTorusMed = makeTorus(0.1, 4.5, 30, 40);
  initBuffers(myTorusMed);

  myTorusExt = makeTorus(0.1, 5.9, 30, 40);
  initBuffers(myTorusExt);

}

function setShaderProjectionMatrix(projectionMatrix) {
	gl.uniformMatrix4fv(program.projectionMatrixIndex, false, projectionMatrix);
}

function setShaderModelViewMatrix(modelViewMatrix) {

  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);

}

function setShaderNormalMatrix(normalMatrix) {

  gl.uniformMatrix3fv(program.normalMatrixIndex, false, normalMatrix);

}

function getNormalMatrix(modelViewMatrix) {

  var normalMatrix = mat3.create();

  mat3.normalFromMat4(normalMatrix, modelViewMatrix);

  return normalMatrix;

}

function getProjectionMatrix() {

  var projectionMatrix  = mat4.create();

  mat4.perspective(projectionMatrix, fovy, 1.0, 0.1, 100.0);

  return projectionMatrix;

}

function setProjection() {

  var projectionMatrix  = mat4.create();
  mat4.perspective(projectionMatrix, fovy, 1.0, 0.1, 100.0);

  gl.uniformMatrix4fv(program.projectionMatrixIndex,false,projectionMatrix);

}

function getCameraMatrix() {

  var _phi  = myphi * Math.PI / 180.0;
  var _zeta = zeta  * Math.PI / 180.0;

  // conversion de coordenadas polares (_zeta,_phi) a rectangulares (x, y, z)
  // ver: https://en.wikipedia.org/wiki/Spherical_coordinate_system
  var x = radius * Math.cos(_zeta) * Math.sin(_phi);
  var y = radius * Math.sin(_zeta);
  var z = radius * Math.cos(_zeta) * Math.cos(_phi);

  var cameraMatrix = mat4.create();
  mat4.lookAt(cameraMatrix, [x, y, z], [0, 0, 0], [0, 1, 0]);

  return cameraMatrix;

}

function setShaderMaterial(material) {

  gl.uniform3fv(program.KaIndex,    material.mat_ambient);
  gl.uniform3fv(program.KdIndex,    material.mat_diffuse);
  gl.uniform3fv(program.KsIndex,    material.mat_specular);
  gl.uniform1f (program.alphaIndex, material.alpha);

}

function setShaderLight() {

  gl.uniform3f(program.LaIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.LdIndex,       1.0,1.0,1.0);
  gl.uniform3f(program.LsIndex,       1.0,1.0,1.0);
  gl.uniform3fv(program.PositionIndex, lightPos); // en coordenadas del ojo

}

function drawScene() {

  // se inicializan los buffers de color y de profundidad
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  setShaderProjectionMatrix(getProjectionMatrix());

  setProjection();

  vec3.transformMat4(lightPos, [20, 2, -50], getCameraMatrix());
  setShaderLight();
/*
  // 1. calcula la matriz de transformación del modelo-vista
  var modelMatrix     = mat4.create();
  var modelViewMatrix = mat4.create();
  mat4.fromScaling(modelMatrix, [0.5, 0.5, 0.5]);
  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);

  // 2. envía la matriz calculada al shader de vértices
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);

  // 3. dibuja la primitiva actualmente seleccionada
  drawWire(selectedPrimitive);*/

  //Crear Esfera y torus
  var modelMatrix     = mat4.create();
  var modelViewMatrix = mat4.create();
  var matA = mat4.create();
  var matB = mat4.create();
  var matC = mat4.create();
  var matD = mat4.create();

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);

  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  setShaderMaterial(Jade);
  drawWire(exampleSphere);

  //Piezas exteiores
  //Torus Exterior
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  var rotReferenceExt = mat4.create();

  mat4.fromRotation(rotReferenceExt, outerAngle, [1, 0, 0]);

  mat4.multiply(modelMatrix, rotReferenceExt, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(myTorusExt);

  //cilindros exteiores
  //primer cilindro
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matB);
  mat4.identity(matC);
  mat4.identity(matA);

  mat4.fromScaling(matA, [0.1, 0.1, 1.3]);
  mat4.fromRotation( matB, Math.PI/2, [1, 0, 0]);
  mat4.fromTranslation(matC, [0, -4.6, 0]);
  mat4.fromRotation(matD, Math.PI/4, [0, 0, 1]);

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);
  mat4.multiply(modelMatrix, matD, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceExt, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCylinder);

  //segundo cilindro
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matB);
  mat4.identity(matC);

  mat4.fromRotation( matB, -Math.PI/2, [1, 0, 0]);
  mat4.fromTranslation(matC, [0, 4.6, 0])

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);
  mat4.multiply(modelMatrix, matD, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceExt, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCylinder);

  //Dibujar piezas medias
  //Torus medio
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  var rotReferenceMed = mat4.create();

  mat4.fromRotation(rotReferenceMed, middleAngle, [0, 1, 0]);

  mat4.multiply(rotReferenceMed, matD, rotReferenceMed);
  mat4.multiply(modelMatrix, rotReferenceExt, rotReferenceMed);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(myTorusMed);

  //Dibujar cilindros medios
  //primer cilindro
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matA);
  mat4.identity(matB);
  mat4.identity(matC);
  mat4.identity(matD);

  mat4.fromScaling(matA, [0.1, 0.1, 1.3]);
  mat4.fromRotation( matB, Math.PI/2, [1, 0, 0]);
  mat4.fromTranslation(matC, [0, -3.2, 0]);
  mat4.fromRotation(matD, -Math.PI/4, [0, 0, 1]);

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);
  mat4.multiply(modelMatrix, matD, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceMed, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceExt, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCylinder);

  //segundo cilindro
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matB);
  mat4.identity(matC);

  mat4.fromRotation( matB, -Math.PI/2, [1, 0, 0]);
  mat4.fromTranslation(matC, [0, 3.2, 0])

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);
  mat4.multiply(modelMatrix, matD, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceMed, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceExt, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCylinder);

  //Piezas Interiores
  //Torus int
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  var rotReferenceInt = mat4.create();

  mat4.fromRotation(rotReferenceInt, innerAngle, [0, 1, 0]);

  mat4.multiply(rotReferenceInt, matD, rotReferenceInt);
  mat4.multiply(modelMatrix, rotReferenceMed, rotReferenceInt);
  mat4.multiply(modelMatrix, rotReferenceExt, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(myTorusInt);

  //Crear cilindros int
  //primer cilindro
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matD);

  mat4.fromScaling(matA, [0.1, 0.1, 2]);
  mat4.fromRotation( matB, Math.PI/2, [1, 0, 0]);
  mat4.fromTranslation(matC, [0, -1, 0]);
  mat4.fromRotation(matD, -Math.PI/4, [0, 0, 1]);

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);
  mat4.multiply(modelMatrix, matD, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceInt, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceMed, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceExt, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCylinder);

  //segundo cilindro
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matB);
  mat4.identity(matC);

  mat4.fromRotation( matB, -Math.PI/2, [1, 0, 0]);
  mat4.fromTranslation(matC, [0, 1, 0])

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);
  mat4.multiply(modelMatrix, matD, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceInt, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceMed, modelMatrix);
  mat4.multiply(modelMatrix, rotReferenceExt, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCylinder);


  //Cilindros soportes
   //primer cilindro
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matA);
  mat4.identity(matB);
  mat4.identity(matC);

  mat4.fromScaling(matA, [0.1, 0.1, 1.3]);
  mat4.fromRotation( matB, Math.PI/2, [0, 1, 0]);
  mat4.fromTranslation(matC, [6, 0, 0]);

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCylinder);

  //segundo cilindro
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matB);
  mat4.identity(matC);

  mat4.fromRotation( matB, -Math.PI/2, [0, 1, 0]);
  mat4.fromTranslation(matC, [-6, 0, 0])

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCylinder);

  //Dibujar conos de soporte
  //Primer Cono
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matA);
  mat4.identity(matB);
  mat4.identity(matC);

  mat4.fromScaling(matA, [0.2, 0.2, 7]);
  mat4.fromRotation( matB, -Math.PI/2, [1, 0, 0]);
  mat4.fromTranslation(matC, [-6.65, -7.05, 0]);

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCone);

  //Segundo cono
  mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matC);

  mat4.fromTranslation(matC, [6.65, -7.05, 0]);

  mat4.multiply(modelMatrix, matB, matA);
  mat4.multiply(modelMatrix, matC, modelMatrix);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);
  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  drawWire(exampleCone);

  //Dibujar Plano
   mat4.identity(modelMatrix);
  mat4.identity(modelViewMatrix);
  mat4.identity(matA);
  mat4.identity(matB);

  mat4.fromScaling(matA, [15, 1, 15]);
  mat4.fromTranslation(matB, [0, -7.05, 0]);

  mat4.multiply(modelMatrix, matB, matA);

  mat4.multiply(modelViewMatrix, getCameraMatrix(), modelMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, modelViewMatrix);

  setShaderModelViewMatrix(modelViewMatrix);

  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));

  setShaderMaterial(Ruby);

  drawWire(examplePlane);

}

function initHandlers() {

  var mouseDown = false;
  var lastMouseX;
  var lastMouseY;

  var canvas     = document.getElementById("myCanvas");
  var htmlPhi    = document.getElementById("Phi");
  var htmlZeta   = document.getElementById("Zeta");
  var htmlRadius = document.getElementById("Radius");
  var htmlFovy   = document.getElementById("Fovy");

  htmlPhi.innerHTML    = myphi.toFixed(0);
  htmlZeta.innerHTML   = zeta;
  htmlRadius.innerHTML = radius.toFixed(1);
  htmlFovy.innerHTML   = fovy.toFixed(2);

  canvas.addEventListener("mousedown",
    function(event) {
      mouseDown  = true;
      lastMouseX = event.clientX;
      lastMouseY = event.clientY;
    },
    false);

  canvas.addEventListener("mouseup",
    function() {
      mouseDown = false;
    },
    false);

  canvas.addEventListener("mousemove",
    function (event) {
      if (!mouseDown) {
        return;
      }
      var newX = event.clientX;
      var newY = event.clientY;
      if (event.shiftKey == 1) {
        if (event.altKey == 1) {
          // fovy
          fovy -= (newY - lastMouseY) / 100.0;
          if (fovy < 0.001) {
            fovy = 0.1;
          }
          //console.log("fovy = " + fovy);
          htmlFovy.innerHTML = fovy.toFixed(2);
        } else {
          // radius
          radius -= (newY - lastMouseY) / 10.0;
          if (radius < 0.01) {
            radius = 0.01;
          }
          //console.log("radius = " + radius);
          htmlRadius.innerHTML = radius.toFixed(1);
        }
      } else {                                 // position
        myphi  -= (newX - lastMouseX);
        zeta += (newY - lastMouseY);
        if (zeta < -80) {
          zeta = -80.0;
        }
        if (zeta > 80) {
          zeta = 80;
        }
        //console.log("phi = " + myphi + ", zeta = " + zeta);
        //console.log("phi = " + myphi + ", zeta = " + zeta);
        htmlPhi.innerHTML = myphi.toFixed(0);
        htmlZeta.innerHTML = zeta;
      }
      lastMouseX = newX
      lastMouseY = newY;
      requestAnimationFrame(drawScene);
    },
    false);

  var botones = document.getElementsByTagName("button");

  for (var i = 0; i < botones.length; i++) {
    botones[i].addEventListener("click",
    function(){
      switch (this.innerHTML) {
        case "Plano":    selectedPrimitive = examplePlane;    break;
        case "Cubo":     selectedPrimitive = exampleCube;     break;
        case "Cono":     selectedPrimitive = exampleCone;     break;
        case "Cilindro": selectedPrimitive = exampleCylinder; break;
        case "Esfera":   selectedPrimitive = exampleSphere;   break;
        case "Toro":     selectedPrimitive = myTorus;         break;
      }
      requestAnimationFrame(drawScene);
    },
    false);
  }

  document.addEventListener("keydown",
	function (event) {
		switch(event.keyCode){
				case 65: outerAngle += 0.03; break; //a
				case 66: middleAngle += 0.02; break; //b
				case 67: innerAngle += 0.01; break; //c
				case 68: outerAngle += 0.03; middleAngle += 0.02; innerAngle += 0.01; break; //d
		}

		requestAnimationFrame(drawScene);
	},
	false);
}

function initWebGL() {

  gl = getWebGLContext();

  if (!gl) {
    alert("WebGL no está disponible");
    return;
  }

  initShaders();
  initPrimitives();
  initRendering();
  initHandlers();

  requestAnimationFrame(drawScene);

}

initWebGL();
