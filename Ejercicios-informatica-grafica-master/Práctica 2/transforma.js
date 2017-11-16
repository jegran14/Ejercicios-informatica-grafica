
var gl, program;

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

  program.modelMatrixIndex = gl.getUniformLocation(program, "modelMatrix");

}

function initBuffers(model) {
  
  model.idBufferVertices = gl.createBuffer ();
  gl.bindBuffer (gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(model.vertices), gl.STATIC_DRAW);
  
  model.idBufferIndices = gl.createBuffer ();
  gl.bindBuffer (gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  gl.bufferData (gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(model.indices), gl.STATIC_DRAW);
  
}

function initRendering() {
  
  gl.clearColor(0.0,0.15,0.15,1.0);
  gl.lineWidth(1.5);
  
}

function initPrimitives() {

  initBuffers(examplePlane);
  initBuffers(exampleCube);
  initBuffers(exampleCone);
  initBuffers(exampleCylinder);
  initBuffers(exampleSphere);

}
      
function draw(model) {
  
  gl.bindBuffer(gl.ARRAY_BUFFER, model.idBufferVertices);
  gl.vertexAttribPointer(program.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.idBufferIndices);
  for (var i = 0; i < model.indices.length; i += 3)
    gl.drawElements (gl.LINE_LOOP, 3, gl.UNSIGNED_SHORT, i*2);
  
}

function drawScene() {
  
  gl.clear(gl.COLOR_BUFFER_BIT);

  //Dibujar cuerpo del tanque
   // 1. calcula la matriz de transformación
  var modelMatrix = mat4.create();
  mat4.fromScaling(modelMatrix, [1, 0.2, 0.8]);

    // 2. envía la matriz calculada al vertex shader
  gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

   // 3. dibuja la primitiva
   draw(exampleCube);

   //Dibujar primera rueda del tanque
   // 1. calcula la matriz de transformación
  var modelMatrix = mat4.create();
  var matA = mat4.create(); //matrix de escalado
  var matB = mat4.create(); //matriz de translación
  var matC = mat4.create(); //matriz de rotación para el segundo cono

  mat4.fromScaling(matA, [0.1, 0.1, 0.8]);
  mat4.fromTranslation(matB, [0, -0.2, 0]);

  mat4.multiply(modelMatrix, matB, matA);

  // 2. envía la matriz calculada al vertex shader
  gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

  // 3. dibuja la primitiva
   draw(exampleCylinder);
   draw(exampleCone);

   //segundo cono
   var matD = mat4.create();
   
   mat4.fromTranslation(matD, [0, 0, 0.8]);
   mat4.fromRotation(matC, Math.PI, [0, 1, 0]);

   mat4.multiply(modelMatrix, matC, matA);
   mat4.multiply(modelMatrix, matD, modelMatrix);
   mat4.multiply(modelMatrix, matB, modelMatrix);

   // 2. envía la matriz calculada al vertex shader
  gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

  // 3. dibuja la primitiva
   draw(exampleCone);

   //Dibujar resto de ruedas del tanque
	for(var i = 0; i < 2; i++)
   {
		//Ruedas a la derecha
		// 1. calcula la matriz de transformación
		var modelMatrix = mat4.create();
		var matA = mat4.create(); //matrix de escalado
		var matB = mat4.create(); //matriz de translación
		var matC = mat4.create(); //matriz de rotación para el segundo cono

		mat4.fromScaling(matA, [0.1, 0.1, 0.8]);
		mat4.fromTranslation(matB, [0.2*(i+1), -0.2, 0]);

		mat4.multiply(modelMatrix, matB, matA);

		// 2. envía la matriz calculada al vertex shader
		gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

		// 3. dibuja la primitiva
		draw(exampleCylinder);
		draw(exampleCone);

		//segundo cono
		modelMatrix = mat4.create();
		var matD = mat4.create();
		
		mat4.fromTranslation(matD, [0, 0, 0.8]);
		mat4.fromRotation(matC, Math.PI, [0, 1, 0]);

		mat4.multiply(modelMatrix, matA, matC);
		mat4.multiply(modelMatrix, matD, modelMatrix);
		mat4.multiply(modelMatrix, matB, modelMatrix);

		// 2. envía la matriz calculada al vertex shader
		gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

		// 3. dibuja la primitiva
		draw(exampleCone);

		//Ruedas a la izquierda
		// 1. calcula la matriz de transformación
		var modelMatrix = mat4.create();
		var matA = mat4.create(); //matrix de escalado
		var matB = mat4.create(); //matriz de translación
		var matC = mat4.create(); //matriz de rotación para el segundo cono

		mat4.fromScaling(matA, [0.1, 0.1, 0.8]);
		mat4.fromTranslation(matB, [-0.2*(i+1), -0.2, 0]);

		mat4.multiply(modelMatrix, matB, matA);

		// 2. envía la matriz calculada al vertex shader
		gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

		// 3. dibuja la primitiva
		draw(exampleCylinder);
		draw(exampleCone);

		//segundo cono
		modelMatrix = mat4.create();
		var matD = mat4.create();
		
		mat4.fromRotation(matC, Math.PI, [0, 1, 0]);
		mat4.fromTranslation(matD, [0, 0, 0.8]);
		
		mat4.multiply(modelMatrix, matC, matA);
		mat4.multiply(modelMatrix, matD, modelMatrix);
		mat4.multiply(modelMatrix, matB, modelMatrix);

		// 2. envía la matriz calculada al vertex shader
		gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

		// 3. dibuja la primitiva
		draw(exampleCone);

   }


   //Diibujar torreta
   // 1. calcula la matriz de transformación
	var modelMatrix = mat4.create();
	var matA = mat4.create(); //matrix de escalado
	var matB = mat4.create(); //matriz de translación
	var matC = mat4.create(); //matriz de rotación para el segundo cono

	mat4.fromScaling(matA, [0.2, 0.2, 0.8]);
	mat4.fromTranslation(matB, [0.3, 0.1, 0]);

	mat4.multiply(modelMatrix, matB, matA);

	// 2. envía la matriz calculada al vertex shader
	gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

	// 3. dibuja la primitiva
	draw(exampleCylinder);
	draw(exampleCone);

	//segundo cono
	modelMatrix = mat4.create();
	var matD = mat4.create();

	mat4.fromRotation(matC, Math.PI, [0, 1, 0]);
	mat4.fromTranslation(matD, [0, 0, 0.8]);

	mat4.multiply(modelMatrix, matA, matC);
	mat4.multiply(modelMatrix, matD, modelMatrix);
	mat4.multiply(modelMatrix, matB, modelMatrix);

	// 2. envía la matriz calculada al vertex shader
	gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

	// 3. dibuja la primitiva
	draw(exampleCone);

	//Dibujar cañón del tanque
	 // 1. calcula la matriz de transformación
	var modelMatrix = mat4.create();
	var matA = mat4.create(); //matrix de escalado
	var matB = mat4.create(); //matriz de translación
	var matC = mat4.create(); //Matriz de rotación
	var matD = mat4.create(); //Inclinación total del cañon

	mat4.fromScaling(matA, [0.03, 0.03, 0.8]);
	mat4.fromTranslation(matB, [0.3, 0.1, 0]);
	mat4.fromRotation(matC, -Math.PI/2, [0, 1, 0]);
	mat4.fromRotation(matD, - (Math.PI * 20)/180, [0, 0, 1]);

	mat4.multiply(modelMatrix, matC, matA);
	mat4.multiply(modelMatrix, matD, modelMatrix);
	mat4.multiply(modelMatrix, matB, modelMatrix);

	// 2. envía la matriz calculada al vertex shader
	gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

	// 3. dibuja la primitiva
	draw(exampleCylinder);
	draw(exampleCone);

	//segundo cono
	modelMatrix = mat4.create();
	var matE = mat4.create(); //First translation second cone
	var matF = mat4.create(); //First rotation second cone

	mat4.fromRotation(matF, Math.PI, [0, 1, 0]);
	mat4.fromTranslation(matE, [0, 0, 0.8]);
	
	mat4.multiply(modelMatrix, matF, matA);
	mat4.multiply(modelMatrix, matE, modelMatrix);
	mat4.multiply(modelMatrix, matC, modelMatrix);
	mat4.multiply(modelMatrix, matD, modelMatrix);
	mat4.multiply(modelMatrix, matB, modelMatrix);

	// 2. envía la matriz calculada al vertex shader
	gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);

	// 3. dibuja la primitiva
	draw(exampleCone);




 /* // 1. calcula la matriz de transformación
  var modelMatrix = mat4.create();
  mat4.fromScaling(modelMatrix, [0.5, 0.5, 0.5]);
        
  // 2. envía la matriz calculada al vertex shader
  gl.uniformMatrix4fv(program.modelMatrixIndex, false, modelMatrix);
        
  // 3. dibuja la primitiva
  //draw(examplePlane);
  //draw(exampleCube);
  draw(exampleCone);
  //draw(exampleCylinder);
  //draw(exampleSphere);*/
  
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
  
  requestAnimationFrame(drawScene);
  
}

initWebGL();
