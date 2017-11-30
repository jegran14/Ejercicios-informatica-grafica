
var gl, myFbo, program, programFBO;
var myphi = 0, zeta = 30, radius = 15, fovy = Math.PI/10;
var myTorus;

var OFFSCREEN_WIDTH = 1024, OFFSCREEN_HEIGHT = 1024;

var Floor = {
  "modelViewMatrix"                : mat4.create(),
  "normalMatrix"                   : mat3.create(),
  "proyectionModelViewMatrixLight" : mat4.create()
};

var Box = {
  "modelViewMatrix"                : mat4.create(),
  "normalMatrix"                   : mat3.create(),
  "proyectionModelViewMatrixLight" : mat4.create()
};

var YellowSphere = {
  "modelViewMatrix"                : mat4.create(),
  "normalMatrix"                   : mat3.create(),
  "proyectionModelViewMatrixLight" : mat4.create()
};

var WhiteSphere = {
  "modelViewMatrix"                : mat4.create(),
  "normalMatrix"                   : mat3.create(),
  "proyectionModelViewMatrixLight" : mat4.create()
};

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
  
  // Shader para pintar en el FBO ---------------------------------------------------
  var vertexShaderFBO = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShaderFBO, document.getElementById("myVertexShaderFBO").text);
  gl.compileShader(vertexShaderFBO);
  if (!gl.getShaderParameter(vertexShaderFBO, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(vertexShaderFBO));
    return null;
  }
  
  var fragmentShaderFBO = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShaderFBO, document.getElementById("myFragmentShaderFBO").text);
  gl.compileShader(fragmentShaderFBO);
  if (!gl.getShaderParameter(fragmentShaderFBO, gl.COMPILE_STATUS)) {
    alert(gl.getShaderInfoLog(fragmentShaderFBO));
    return null;
  }

  programFBO = gl.createProgram();
  gl.attachShader(programFBO, vertexShaderFBO);
  gl.attachShader(programFBO, fragmentShaderFBO);
  
  gl.linkProgram(programFBO);
  
  programFBO.vertexPositionAttribute = gl.getAttribLocation( programFBO, "VertexPosition");
  programFBO.proyectionModelViewMatrixIndex  = gl.getUniformLocation( programFBO, "proyectionModelViewMatrix");
  gl.enableVertexAttribArray(programFBO.vertexPositionAttribute);

  // Shader para pintar la escena ---------------------------------------------------
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
  
  program.vertexPositionAttribute = gl.getAttribLocation( program, "VertexPosition");
  
  program.modelViewMatrixIndex          = gl.getUniformLocation( program, "modelViewMatrix");
  program.projectionMatrixIndex         = gl.getUniformLocation( program, "projectionMatrix");
  program.proyectionModelViewMatrixLightIndex  = gl.getUniformLocation( program, "proyectionModelViewMatrixLight");
  
  // normales
  program.vertexNormalAttribute = gl.getAttribLocation ( program, "VertexNormal");
  program.normalMatrixIndex     = gl.getUniformLocation( program, "normalMatrix");
  
  // coordenadas de textura
  program.vertexTexcoordsAttribute = gl.getAttribLocation ( program, "VertexTexcoords");

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
  program.textureIndex          = gl.getUniformLocation( program, "myTexture");
  program.tableroIndex          = gl.getUniformLocation( program, "tablero");

  gl.useProgram(program);
  gl.uniform1i(program.textureIndex, 0);
  
}

function initRendering() {
  
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
  
  mat4.perspective(projectionMatrix, fovy, 1.0, 0.1, 100.0);
  
  return projectionMatrix;
  
}

function getCameraMatrix() {
  
  var _phi  = myphi* Math.PI / 180.0;
  var _zeta = zeta * Math.PI / 180.0;
  
  var x = 0, y = 0, z = 0;
  z = radius * Math.cos(_zeta) * Math.cos(_phi);
  x = radius * Math.cos(_zeta) * Math.sin(_phi);
  y = radius * Math.sin(_zeta);
  
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
  gl.uniform3f(program.PositionIndex, 5.0,5.0,-15.0);
  
}

function drawSolid(model) {
  
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer (program.vertexPositionAttribute,  3, gl.FLOAT, false, 8*4,   0);
  gl.vertexAttribPointer (program.vertexNormalAttribute,    3, gl.FLOAT, false, 8*4, 3*4);
  gl.vertexAttribPointer (program.vertexTexcoordsAttribute, 2, gl.FLOAT, false, 8*4, 6*4);
  
  gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
  
}

function drawSolidWithMatrices(model,objName) {
  
  gl.uniformMatrix3fv(program.normalMatrixIndex, false, objName.normalMatrix);
  gl.uniformMatrix4fv(program.modelViewMatrixIndex, false, objName.modelViewMatrix);
  gl.uniformMatrix4fv(program.proyectionModelViewMatrixLightIndex, false, objName.proyectionModelViewMatrixLight);
  
  drawSolid(model);

}

function drawSolidFBO(model) {
  
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer (programFBO.vertexPositionAttribute,  3, gl.FLOAT, false, 8*4,   0);
  
  gl.bindBuffer   (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.drawElements (gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
  
}

function drawSolidWithMatricesFBO(model,objName) {
  
  gl.uniformMatrix4fv(programFBO.proyectionModelViewMatrixIndex, false, objName.proyectionModelViewMatrixLight);
  
  drawSolidFBO(model);
  
}

function setFloorObject (cameraFBO) {
  
  var modelMatrix          = mat4.create();
  var aux                  = mat4.create();
  var modelViewMatrixLight = mat4.create();
  
  mat4.fromTranslation (aux, [0.0, -0.5, 0.0]);
  mat4.fromScaling (modelMatrix, [5.0, 1.0, 5.0]);
  mat4.multiply    (modelMatrix, aux, modelMatrix);
  mat4.multiply    (Floor.modelViewMatrix, getCameraMatrix(), modelMatrix);
  Floor.normalMatrix = getNormalMatrix(Floor.modelViewMatrix);
  
  mat4.multiply  (modelViewMatrixLight, cameraFBO.lookAt, Floor.modelViewMatrix);
  mat4.multiply  (Floor.proyectionModelViewMatrixLight, cameraFBO.view, modelViewMatrixLight);

}

function setBoxObject (cameraFBO) {
  
  var modelMatrix          = mat4.create();
  var aux                  = mat4.create();
  var modelViewMatrixLight = mat4.create();
  
  mat4.identity  (modelMatrix);
  mat4.scale     (modelMatrix, modelMatrix, [1.0,1.0,2.0]);
  mat4.multiply  (Box.modelViewMatrix, getCameraMatrix(), modelMatrix);
  Box.normalMatrix = getNormalMatrix(Box.modelViewMatrix);
  
  mat4.multiply  (modelViewMatrixLight, cameraFBO.lookAt, Box.modelViewMatrix);
  mat4.multiply  (Box.proyectionModelViewMatrixLight, cameraFBO.view, modelViewMatrixLight);
  
}

function setYellowSphereObject (cameraFBO) {
  
  var modelMatrix          = mat4.create();
  var aux                  = mat4.create();
  var modelViewMatrixLight = mat4.create();
  
  mat4.fromTranslation (aux, [1.0, 0.8, 0.0]);
  mat4.fromScaling (modelMatrix, [0.5, 0.5, 0.5]);
  mat4.multiply    (modelMatrix, aux, modelMatrix);
  mat4.multiply  (YellowSphere.modelViewMatrix, getCameraMatrix(), modelMatrix);
  YellowSphere.normalMatrix = getNormalMatrix(YellowSphere.modelViewMatrix);
  
  mat4.multiply  (modelViewMatrixLight, cameraFBO.lookAt, YellowSphere.modelViewMatrix);
  mat4.multiply  (YellowSphere.proyectionModelViewMatrixLight, cameraFBO.view, modelViewMatrixLight);
  
}

function setWhiteSphereObject (cameraFBO) {
  
  var modelMatrix          = mat4.create();
  var aux                  = mat4.create();
  var modelViewMatrixLight = mat4.create();
  
  mat4.fromTranslation (aux, [-1.3, 0.0, 0.0]);
  mat4.fromScaling (modelMatrix, [0.5, 0.5, 0.5]);
  mat4.multiply    (modelMatrix, aux, modelMatrix);
  mat4.multiply  (WhiteSphere.modelViewMatrix, getCameraMatrix(), modelMatrix);
  WhiteSphere.normalMatrix = getNormalMatrix(WhiteSphere.modelViewMatrix);
  
  mat4.multiply  (modelViewMatrixLight, cameraFBO.lookAt, WhiteSphere.modelViewMatrix);
  mat4.multiply  (WhiteSphere.proyectionModelViewMatrixLight, cameraFBO.view, modelViewMatrixLight);
  
}

function drawObjectsFBO (cameraFBO) {

  // El suelo
  setFloorObject(cameraFBO);
  drawSolidWithMatricesFBO(examplePlane,Floor);
  
  // La caja
  setBoxObject(cameraFBO);
  drawSolidWithMatricesFBO(exampleCube,Box);

  // Esfera amarilla
  setYellowSphereObject(cameraFBO);
  drawSolidWithMatricesFBO(exampleSphere,YellowSphere);

  // Esfera blanca
  setWhiteSphereObject(cameraFBO);
  drawSolidWithMatricesFBO(exampleSphere,WhiteSphere);

}

function drawObjects() {

  setShaderMaterial(White_plastic);
  gl.uniform1i (program.tableroIndex, 1);
  drawSolidWithMatrices(examplePlane,Floor);
  gl.uniform1i (program.tableroIndex, 0);

  setShaderMaterial(Green_plastic);
  drawSolidWithMatrices(exampleCube,Box);
  
  setShaderMaterial(Yellow_plastic);
  drawSolidWithMatrices(exampleSphere,YellowSphere);
  
  setShaderMaterial(White_plastic);
  drawSolidWithMatrices(exampleSphere,WhiteSphere);

}

function drawScene() {

  // camara en la fuente de luz
  var cameraFBO = {
    "lookAt" : mat4.create(),
    "view"   : mat4.create()
  };
  mat4.lookAt      (cameraFBO.lookAt, [2,5,-15], [0,-0.5,-radius], [0,1,0]);
  mat4.perspective (cameraFBO.view,   Math.PI/3.0, OFFSCREEN_WIDTH/OFFSCREEN_HEIGHT, 1.0, 100.0);

  // Primero la escena desde la fuente de luz
  gl.bindFramebuffer (gl.FRAMEBUFFER, myFbo);                     // Change the drawing destination to FBO
  gl.viewport        (0, 0, OFFSCREEN_HEIGHT, OFFSCREEN_HEIGHT);  // Set viewport for FBO
  gl.clearColor      (1.0,1.0,1.0,1.0);                           // El blanco equivale a la maxima profundidad
  gl.clear           (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear FBO

  gl.useProgram     (programFBO);
  drawObjectsFBO    (cameraFBO);

  // Ahora la escena desde la cámara del usuario
  gl.bindFramebuffer (gl.FRAMEBUFFER, null);                      // Change the drawing destination to color buffer
  gl.viewport        (0, 0, 800, 800);
  gl.clearColor      (0.75,0.75,0.75,1.0);
  gl.clear           (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); // Clear color and depth buffer

  gl.useProgram(program);

  gl.enableVertexAttribArray(program.vertexPositionAttribute);
  gl.enableVertexAttribArray(program.vertexNormalAttribute);
  gl.enableVertexAttribArray(program.vertexTexcoordsAttribute);

  setShaderProjectionMatrix(getProjectionMatrix());
 
  drawObjects();

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
}

function initFramebufferObject() {
  
  // Create a texture object and set its size and parameters
  var texture = gl.createTexture();
  gl.bindTexture  (gl.TEXTURE_2D, texture);
  gl.texImage2D   (gl.TEXTURE_2D, 0, gl.RGBA, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT,
                   0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE);
  
  // Create a renderbuffer object and Set its size and parameters
  var depthBuffer = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, OFFSCREEN_WIDTH, OFFSCREEN_HEIGHT);
  
  // Create a framebuffer object (FBO)
  var framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer        (gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D   (gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
  framebuffer.texture = texture;
  
  return framebuffer;
  
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
  
  // Initialize framebuffer object (FBO)
  myFbo = initFramebufferObject();
  
  // Set a texture object to the texture unit
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture  (gl.TEXTURE_2D, myFbo.texture);

  requestAnimationFrame(drawScene);
  
}

initWebGL();
