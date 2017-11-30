
var gl, program;
var myphi = 0, zeta = 30, radius = 5, fovy = Math.PI/10;
var selectedPrimitive = exampleCone;
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

  // propia del shader
  program.ScaleIndex            = gl.getUniformLocation( program, "Scale");
  program.ThresholdIndex        = gl.getUniformLocation( program, "Threshold");
  gl.uniform2f(program.ScaleIndex,     50.0, 50.0);
  gl.uniform2f(program.ThresholdIndex, 0.5, 0.5);
}

function initRendering() {
  
  gl.clearColor(0.65,0.65,0.65,1.0);
  gl.enable(gl.DEPTH_TEST);
  
  setShaderLight();
  setShaderMaterial(Yellow_plastic);
  
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
  
  var z = radius * Math.cos(_zeta) * Math.cos(_phi);
  var x = radius * Math.cos(_zeta) * Math.sin(_phi);
  var y = radius * Math.sin(_zeta);
  
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

function drawScene() {
  
  // se inicializan los buffers de color y de profundidad
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // se obtiene la matriz de transformacion de la proyeccion y se envia al shader
  setShaderProjectionMatrix(getProjectionMatrix());

  // se calcula la matriz de transformación del modelo
  var modelMatrix = mat4.create();
  mat4.fromScaling (modelMatrix, [0.5, 0.5, 0.5]);
  
  // se opera la matriz de transformacion de la camara con la del modelo y se envia al shader
  var modelViewMatrix = mat4.create();
  mat4.multiply     (modelViewMatrix, getCameraMatrix(), modelMatrix);
  setShaderModelViewMatrix(modelViewMatrix);
  
  // se obtiene la matriz de transformacion de la normal y se envia al shader
  setShaderNormalMatrix(getNormalMatrix(modelViewMatrix));
  
  // se dibuja la primitiva seleccionada
  drawSolid(selectedPrimitive);
  
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
  
  var data = document.getElementsByTagName("input");
  
  data[0].addEventListener("change",
                             function(){
                             setColor(program.KdIndex, data[0].value);
                             requestAnimationFrame(drawScene);
                             },
                             false);
  
  data[1].addEventListener("mousemove",
                           function(){
                           gl.uniform2f(program.ScaleIndex, data[1].value, data[2].value);
                           requestAnimationFrame(drawScene);
                           },
                           false);

  data[2].addEventListener("mousemove",
                           function(){
                           gl.uniform2f(program.ScaleIndex, data[1].value, data[2].value);
                           requestAnimationFrame(drawScene);
                           },
                           false);

  data[3].addEventListener("mousemove",
                           function(){
                           gl.uniform2f(program.ThresholdIndex, data[3].value/100.0, data[4].value/100.0);
                           requestAnimationFrame(drawScene);
                           },
                           false);

  data[4].addEventListener("mousemove",
                           function(){
                           gl.uniform2f(program.ThresholdIndex, data[3].value/100.0, data[4].value/100.0);
                           requestAnimationFrame(drawScene);
                           },
                           false);

}

function setColor (index, value) {
  
  var myColor = value.substr(1); // para eliminar el # del #FCA34D
  
  var r = myColor.charAt(0) + '' + myColor.charAt(1);
  var g = myColor.charAt(2) + '' + myColor.charAt(3);
  var b = myColor.charAt(4) + '' + myColor.charAt(5);
  
  r = parseInt(r, 16) / 255.0;
  g = parseInt(g, 16) / 255.0;
  b = parseInt(b ,16) / 255.0;
  
  gl.uniform3f(index, r, g, b);
  
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
