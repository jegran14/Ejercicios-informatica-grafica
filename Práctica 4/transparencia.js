
var gl, program;
var myphi = 0, zeta = 30, radius = 15, fovy = Math.PI/10;
var myTorus;

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
  
  program.vertexPositionAttribute = gl.getAttribLocation( program, "VertexPosition");
  gl.enableVertexAttribArray(program.vertexPositionAttribute);
  
  program.modelViewMatrixIndex  = gl.getUniformLocation( program, "modelViewMatrix");
  program.projectionMatrixIndex = gl.getUniformLocation( program, "projectionMatrix");
  
  // normales
  program.vertexNormalAttribute = gl.getAttribLocation ( program, "VertexNormal");
  program.normalMatrixIndex     = gl.getUniformLocation( program, "normalMatrix");
  gl.enableVertexAttribArray(program.vertexNormalAttribute);
  
  // coordenadas de textura
  program.vertexTexcoordsAttribute = gl.getAttribLocation ( program, "VertexTexcoords");
  gl.enableVertexAttribArray(program.vertexTexcoordsAttribute);

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

  // variables propias de esta demo
  program.tableroIndex          = gl.getUniformLocation( program, "tablero");
  program.transpaIndex          = gl.getUniformLocation( program, "alpha");
  gl.uniform1f(program.transpaIndex, 0.5);

}

function initRendering() {
  
  gl.clearColor(0.75,0.75,0.75,1.0);
  gl.enable(gl.DEPTH_TEST);
  
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  //gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  
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

function initPrimitives() {
  
  initBuffers(examplePlane);
  initBuffers(exampleCube);
  initBuffers(exampleCone);
  initBuffers(exampleCylinder);
  initBuffers(exampleSphere);
  
  myTorus = makeTorus(0.5, 1, 100, 100);
  initBuffers(myTorus);
  
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
  
  mat4.perspective(projectionMatrix, fovy, 2.0, 0.1, 100.0);
  
  return projectionMatrix;
  
}

function getCameraMatrix() {
  
  var _phi  = myphi* Math.PI / 180.0;
  var _zeta = zeta * Math.PI / 180.0;
  
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
  gl.uniform3f(program.PositionIndex, 1.0,1.0,0.0); // en coordenadas del ojo
  
}

function drawSolid(model) {
  
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer (program.vertexPositionAttribute,  3, gl.FLOAT, false, 8*4,   0);
  gl.vertexAttribPointer (program.vertexNormalAttribute,    3, gl.FLOAT, false, 8*4, 3*4);
  gl.vertexAttribPointer (program.vertexTexcoordsAttribute, 2, gl.FLOAT, false, 8*4, 6*4);
  
  gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
  
}

function drawTrasparentObjects(translation) {

  var modelMatrixCylinder = mat4.create();
  var modelMatrixCone     = mat4.create();
  var modelViewMatrix     = mat4.create();
  var aux                 = mat4.create();

  // el cilindro
  mat4.fromRotation    (aux, Math.PI/2.0, [1.0, 0.0, 0.0]);
  mat4.fromScaling     (modelMatrixCylinder, [0.5, 1.5, 0.5]);
  mat4.multiply        (modelMatrixCylinder, modelMatrixCylinder, aux);
  mat4.fromTranslation (aux, translation);
  mat4.multiply        (modelMatrixCylinder, aux, modelMatrixCylinder);
  mat4.multiply        (modelViewMatrix, getCameraMatrix(), modelMatrixCylinder);
  
  setShaderModelViewMatrix (modelViewMatrix);
  setShaderNormalMatrix    (getNormalMatrix(modelViewMatrix));
  setShaderMaterial        (Yellow_plastic);
  
  drawSolid (exampleCylinder);
  
  // el cono
  mat4.fromRotation    (aux, -Math.PI/2.0, [1.0, 0.0, 0.0]);
  mat4.fromScaling     (modelMatrixCone, [0.5, 0.5, 0.5]);
  mat4.multiply        (modelMatrixCone, modelMatrixCone, aux);
  mat4.fromTranslation (aux, translation);
  mat4.multiply        (modelMatrixCone, aux, modelMatrixCone);
  mat4.multiply        (modelViewMatrix, getCameraMatrix(), modelMatrixCone);
  
  setShaderModelViewMatrix (modelViewMatrix);
  setShaderNormalMatrix    (getNormalMatrix(modelViewMatrix));
  setShaderMaterial        (Green_plastic);
  
  drawSolid (exampleCone);

}

function drawTablero () {

  var modelMatrix     = mat4.create();
  var modelViewMatrix = mat4.create();
  var aux             = mat4.create();

  mat4.fromTranslation (aux, [0.0, -0.5, 0.0]);
  mat4.fromScaling (modelMatrix, [5.0, 1.0, 5.0]);
  mat4.multiply    (modelMatrix, aux, modelMatrix);
  mat4.multiply    (modelViewMatrix, getCameraMatrix(), modelMatrix);
  
  setShaderModelViewMatrix (modelViewMatrix);
  setShaderNormalMatrix    (getNormalMatrix(modelViewMatrix));
  setShaderMaterial        (Red_plastic);
  
  gl.uniform1f (program.tableroIndex, 1);
  drawSolid    (examplePlane);
  gl.uniform1f (program.tableroIndex, 0);

}

function drawScene() {
  
  // se inicializan los buffers de color y de profundidad
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  setShaderProjectionMatrix(getProjectionMatrix());
  
  // se dibujan los objetos opacos en primer lugar
  drawTablero();
  
  // Los objetos transparentes
  gl.depthMask (false);              // impido que se actualice el buffer de profundidad
  gl.enable    (gl.BLEND);           // habilito la trasparencia (en la GPU)
  
  // primer metodo, simplemente dibujo
  drawTrasparentObjects([-1.3, 1.0, 0.0]);

  // segundo metodo, dibujo pero primero solicito que se eliminen las caras traseras
  gl.enable             (gl.CULL_FACE);
  gl.cullFace           (gl.BACK);
  drawTrasparentObjects ([0.0, 1.0, 0.0]);
  gl.disable            (gl.CULL_FACE);
  

  // tercer metodo, dibujo dos veces, la primera ordeno eliminar las caras frontales
  // y la segunda ordeno eliminar las traseras
  gl.enable             (gl.CULL_FACE);
  gl.cullFace           (gl.FRONT);
  drawTrasparentObjects ([1.3, 1.0, 0.0]);
  gl.cullFace           (gl.BACK);
  drawTrasparentObjects ([1.3, 1.0, 0.0]);
  gl.disable            (gl.CULL_FACE);

  gl.depthMask(true);              // permito escribir en el buffer de profundidad
  gl.disable(gl.BLEND);            // impido la trasparencia (en la GPU)
  
}

function initHandlers() {
  
  var mouseDown = false;
  var lastMouseX;
  var lastMouseY;
  
  var canvas = document.getElementById("myCanvas");
  
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
                          if (event.altKey == 1) {              // fovy
                          fovy -= (newY - lastMouseY) / 100.0;
                          if (fovy < 0.001) {
                          fovy = 0.1;
                          }
                          } else {                              // radius
                          radius -= (newY - lastMouseY) / 10.0;
                          if (radius < 0.01) {
                          radius = 0.01;
                          }
                          }
                          } else {                               // position
                          myphi -= (newX - lastMouseX);
                          zeta  += (newY - lastMouseY);
                          if (zeta < -80) {
                          zeta = -80.0;
                          }
                          if (zeta > 80) {
                          zeta = 80;
                          }
                          }
                          lastMouseX = newX
                          lastMouseY = newY;
                          requestAnimationFrame(drawScene);
                          },
                          false);

  var range = document.getElementsByName("Transparency");
  
  range[0].addEventListener("mousemove",
                            function(){
                            gl.uniform1f(program.transpaIndex, parseFloat(range[0].value) /100.0);
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
