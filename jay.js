
Jay = {
  INFINITE: 10000000,
  EPSILON:  0.000001,
}

//
// Math helpers
//

Math.sqr    = function(x)    { return x*x }
Math.rad    = function(x, s) { return x * Math.PI / (s * 0.5) }
Math.isZero = function(x)    { return Math.abs(x) < Jay.EPSILON }

//
// The engine deals with colors using normalized RGB components in the [0,1] range
//

Jay.Color = function(r, g, b) {
  this.r = r || 0;
  this.g = g || this.r;
  this.b = b || this.r;
}

Jay.Color.fromHSV = function(h, s, v) {

  if (s == 0) {
    return new Jay.Color(v);
  }

  var h6 = h * 6;
  var i  = Math.floor(h6);
  var f  = h6 - i;
  var p  = v * (1 - s);
  var q  = v * (1 - s * f);
  var t  = v * (1 - s * (1 - f));

  var c  = new Jay.Color();

  switch(i % 6) {
    case 0: c.r = v; c.g = t; c.b = p; break;
    case 1: c.r = q; c.g = v; c.b = p; break;
    case 2: c.r = p; c.g = v; c.b = t; break;
    case 3: c.r = p; c.g = q; c.b = v; break;
    case 4: c.r = t; c.g = p; c.b = v; break;
    case 5: c.r = v; c.g = p; c.b = q; break;
  }

  return c;
}

Jay.Color.prototype.clone = function() {
  return new Jay.Color(this.r, this.g, this.b);
},

Jay.Color.prototype.add = function(otherColor) {
  this.r += otherColor.r;
  this.g += otherColor.g;
  this.b += otherColor.b;
  return this;
},

Jay.Color.prototype.mul = function(factor) {
  this.r *= factor;
  this.g *= factor;
  this.b *= factor;
  return this;
},

Jay.Color.prototype.mix = function(otherColor, amountOfOtherColor) {
  var amountOfThisColor = 1-amountOfOtherColor;
  this.r = (this.r*amountOfThisColor) + (otherColor.r*amountOfOtherColor);
  this.g = (this.g*amountOfThisColor) + (otherColor.g*amountOfOtherColor);
  this.b = (this.b*amountOfThisColor) + (otherColor.b*amountOfOtherColor);
  return this;
},

Jay.Color.prototype.calculateLinearInterpolationIncrement = function(targetColor, steps) {
  return new Jay.Color(
    ((targetColor.r-this.r) / steps),
    ((targetColor.g-this.g) / steps),
    ((targetColor.b-this.b) / steps)
  )
},

Jay.Color.prototype.toString = function() {
  return this.r+","+this.g+","+this.b;
}

Jay.Color.BLACK  = new Jay.Color(0, 0, 0);
Jay.Color.WHITE  = new Jay.Color(1, 1, 1);
Jay.Color.RED    = new Jay.Color(1, 0, 0);
Jay.Color.GREEN  = new Jay.Color(0, 1, 0);
Jay.Color.BLUE   = new Jay.Color(0, 0, 1);
Jay.Color.CYAN   = new Jay.Color(0, 1, 1);
Jay.Color.YELLOW = new Jay.Color(1, 1, 0);

//
//
//

Jay.Vector = function(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}

Jay.Vector.prototype.clone = function() {
  return new Jay.Vector(this.x, this.y, this.z);
}

Jay.Vector.prototype.add = function(otherVector) {
  this.x += otherVector.x;
  this.y += otherVector.y;
  this.z += otherVector.z;
  return this;
}

Jay.Vector.prototype.sub = function(otherVector) {
  this.x -= otherVector.x;
  this.y -= otherVector.y;
  this.z -= otherVector.z;
  return this;
}

Jay.Vector.prototype.mul = function(otherVector) {
  this.x *= otherVector.x;
  this.y *= otherVector.y;
  this.z *= otherVector.z;
  return this;
}

Jay.Vector.prototype.scale = function(factor) {
  this.x *= factor;
  this.y *= factor;
  this.z *= factor;
  return this;
}

Jay.Vector.prototype.magnitude2 = function() {
  return Math.sqr(this.x) + Math.sqr(this.y) + Math.sqr(this.z);
}

Jay.Vector.prototype.magnitude = function() {
  return Math.sqrt(this.magnitude2());
}

Jay.Vector.prototype.normalize = function() {
  return this.scale(1/this.magnitude());
}

Jay.Vector.prototype.normalizeAndReturnInitialMagnitude = function() {
  var mag = this.magnitude()
  this.scale(1/mag);
  return mag;
}

Jay.Vector.prototype.dot = function(otherVector) {
  return (this.x*otherVector.x) + (this.y*otherVector.y) + (this.z*otherVector.z);
}

Jay.Vector.prototype.cross = function(otherVector) {
  return new Jay.Vector(
    ((this.y*otherVector.z) - (this.z*otherVector.y)),
    ((this.z*otherVector.x) - (this.x*otherVector.z)),
    ((this.x*otherVector.y) - (this.y*otherVector.x))
  );
}

Jay.Vector.prototype.toString = function() {
  return this.x+", "+this.y+", "+this.z;
}

Jay.Vector.prototype.fromString = function(string) {
  var tokens = string.split(',');
  this.x = parseFloat(tokens[0]);
  this.y = parseFloat(tokens[1]);
  this.z = parseFloat(tokens[2]);
}

//
//
//

Jay.Material = function(materialDefinition) {
  this.color      = materialDefinition.color      || Jay.Color.BLUE;
  this.diffuse    = materialDefinition.diffuse    || 1;
  this.reflection = materialDefinition.reflection || 0;
  this.specular   = 1 - this.diffuse;
}

//
//
//

Jay.Ray = function(origin, direction) {
  this.origin                        = origin;
  this.direction                     = direction;
  this.distanceBetweenOriginAndPoint = null;
}

Jay.Ray.prototype.pointTowards = function(point) {
  this.direction                     = point.sub(this.origin);
  this.distanceBetweenOriginAndPoint = this.direction.normalizeAndReturnInitialMagnitude();
  return this;
}

Jay.Ray.prototype.calculateHitPoint = function(atDistance) {
  return new Jay.Vector(
    this.origin.x + (this.direction.x*atDistance),
    this.origin.y + (this.direction.y*atDistance),
    this.origin.z + (this.direction.z*atDistance)
  );
}

//
//
//

Jay.Sphere = function(sphereDefinition) {
  this.name     = "Sphere";
  this.location = sphereDefinition.location;
  this.radius   = sphereDefinition.radius;
  this.material = sphereDefinition.material;
}

Jay.Sphere.prototype.calculateIntersection = function(ray) {

  var v = ray.origin.clone().sub(this.location);

  var B = 2.0 * ray.direction.dot(v);

  var C = v.dot(v) - Math.sqr(this.radius);

  var D = Math.sqr(B)-4*C;

  if (D >= 0) {
    var sD = Math.sqrt(D);
    var t = (-B-sD)*0.5;
    if (t > 0) {
      return t;
    }
  }

  return Jay.INFINITE;
},

Jay.Sphere.prototype.calculateNormalAtPoint = function(point) {
  return this.location.clone().sub(point).scale(1.0/this.radius);
},

Jay.Sphere.prototype.colorAtPoint = function(hitPoint, normal) {
  // TODO implement texture mapping
  return this.material.color.clone();
}

//
//
//

Jay.Plane = function(planeDefinition) {
  this.name     = "Plane";
  this.normal   = planeDefinition.normal;
  this.distance = planeDefinition.distance;
  this.material = planeDefinition.material;
}

Jay.Plane.prototype.calculateIntersection = function(ray) {

  var v1 = this.normal.dot(ray.direction);

  if (Math.isZero(v1)) {
    return Jay.INFINITE;
  }

  var v = -this.distance - this.normal.x*ray.origin.x - this.normal.y*ray.origin.y - this.normal.z*ray.origin.z;

  var k = v / v1;

  return k > 0 ? k : Jay.INFINITE;
},

Jay.Plane.prototype.calculateNormalAtPoint = function(point) {
  return this.normal.clone();
},

Jay.Plane.prototype.colorAtPoint = function(hitPoint, normal) {
  // TODO implement texture mapping
  return this.material.color.clone();
}

//
//
//

Jay.Viewport = function(width, height, viewerDistance) {
  this.width          = width;
  this.height         = height;
  this.viewerDistance = viewerDistance;
}

//
//
//

Jay.Camera = function(referenceViewPoint, lookAtPoint, roll) {
  this.rvp  = referenceViewPoint;
  this.lap  = lookAtPoint;
  this.roll = roll;
  this.N    = null;
  this.U    = null;
  this.V    = null;
}

Jay.Camera.prototype.calculateViewUpVector = function() {
  var a  = Math.PI - this.roll
  var xt = Math.cos(a);
  var yt = Math.sin(a);
  return new Jay.Vector(
    xt+yt,
    xt-yt,
    0
  );
}

Jay.Camera.prototype.calculateViewMatrix = function() {
  var vup = this.calculateViewUpVector();
  this.N  = this.rvp.clone().sub(this.lap).normalize();
  this.U  = this.N.clone().cross(vup);
  this.V  = this.N.clone().cross(this.U);
  return this;
}

//
//
//

Jay.Scene = function(sceneDefinition) {
  this.camera          = sceneDefinition.camera;
  this.light           = sceneDefinition.light;
  this.models          = sceneDefinition.models;
  this.backgroundColor = sceneDefinition.backgroundColor || new Jay.Color();
}

//
// An thin abstraction around a big bag of 32-bit RGBA pixels
//

Jay.Image = function(imageData) {
  this.imageData = imageData;
  this.width     = this.imageData.width;
  this.height    = this.imageData.height;
}

Jay.Image.prototype.calculateOffset = function(x, y) {
  return (y*this.width + x) * 4;
}

Jay.Image.COLOR_COMPONENT_CONVERSION_MULTIPLIER = 1.0/256;

Jay.Image.prototype.getPixel = function(x, y) {
  var offset = this.calculateOffset(x, y);
  var r = this.imageData[offset]   * Jay.Image.COLOR_COMPONENT_CONVERSION_MULTIPLIER;
  var g = this.imageData[offset+1] * Jay.Image.COLOR_COMPONENT_CONVERSION_MULTIPLIER;
  var b = this.imageData[offset+2] * Jay.Image.COLOR_COMPONENT_CONVERSION_MULTIPLIER;
  return new Jay.Color(r, g, b);
}

Jay.Image.prototype.setPixel = function(x, y, color) {
  var offset = this.calculateOffset(x, y);
  this.imageData.data[offset]   = Math.max(0, Math.min(255, Math.round(color.r*256)));
  this.imageData.data[offset+1] = Math.max(0, Math.min(255, Math.round(color.g*256)));
  this.imageData.data[offset+2] = Math.max(0, Math.min(255, Math.round(color.b*256)));
  this.imageData.data[offset+3] = 255;
}

Jay.Image.prototype.interpolateBlock = function(colorsGrid, x, y, blockSize, width) {

  var offsetInGrid = y*width + x;

  var p1 = colorsGrid[offsetInGrid];
  var p2 = colorsGrid[offsetInGrid+1];
  var p3 = colorsGrid[offsetInGrid+width];
  var p4 = colorsGrid[offsetInGrid+width+1];

  var leftColor              = p1.clone();
  var leftVerticalIncrement  = p1.calculateLinearInterpolationIncrement(p3, blockSize);
  var rightColor             = p2.clone();
  var rightVerticalIncrement = p2.calculateLinearInterpolationIncrement(p4, blockSize);

  for(var v = 0; v < blockSize; v++) {

    var interpolatedColor   = leftColor.clone();
    var horizontalIncrement = leftColor.calculateLinearInterpolationIncrement(rightColor, blockSize);

    for(var u = 0; u < blockSize; u++) {
      this.setPixel(x*blockSize+u, y*blockSize+v, interpolatedColor);
      interpolatedColor.add(horizontalIncrement);
    }

    leftColor.add(leftVerticalIncrement);
    rightColor.add(rightVerticalIncrement);
  }
}

Jay.Image.prototype.interpolate = function(colorsGrid, gridWidth, gridHeight, blockSize) {
  for(var y = 0; y < (gridHeight-1); y++) {
    for(var x = 0; x < (gridWidth-1); x++) {
      this.interpolateBlock(colorsGrid, x, y, blockSize, gridWidth);
    }
  }
}

//
//
//

Jay.Renderer = function(image, viewport) {

  this.image     = image;
  this.viewport  = viewport || new Jay.Viewport(this.image.width, this.image.height, 400);

  // Rendering options
  this.options               = {}
  this.options.interpolation = 0
  this.options.reflections   = true;
  this.options.shadows       = true;

  this.shadowFactor          = 1 / 1.6;

}

// Shoots a single ray through the scene
Jay.Renderer.prototype.traceRay = function(scene, ray, recursionLevel) {

  var hitModel    = null;
  var hitDistance = Jay.INFINITE;

  for (var i = 0; i < scene.models.length; i++) {
    var model = scene.models[i];
    var d = model.calculateIntersection(ray);
    if ((d != Jay.INFINITE) && (d < hitDistance)) {
      hitDistance = d;
      hitModel = model;
    }
  }

  if (!hitModel) {
    return scene.backgroundColor;
  }

  var hitPoint         = ray.calculateHitPoint(hitDistance);

  var lightPos         = scene.light.clone();

  var lightRay         = (new Jay.Ray(lightPos)).pointTowards(hitPoint);

  var normalAtHitPoint = hitModel.calculateNormalAtPoint(hitPoint);
  var colorAtHitPoint  = hitModel.colorAtPoint(hitPoint, normalAtHitPoint);

  var diffuse          = hitModel.material.diffuse;
  var invDiff          = 1 - diffuse;

  var lightDot         = normalAtHitPoint.dot(lightRay.direction);
  lightDot            *= diffuse;

  var color = new Jay.Color(
    lightDot + colorAtHitPoint.r * invDiff,
    lightDot + colorAtHitPoint.g * invDiff,
    lightDot + colorAtHitPoint.b * invDiff
  );

  // Shadows
  if (this.options.shadows) {
    // Apply a slight correction to avoid self-intersection
    var lightDist = lightRay.distanceBetweenOriginAndPoint - 0.001;
    for (var i = 0; i < scene.models.length; i++) {
      var d = scene.models[i].calculateIntersection(lightRay)
      if (d < lightDist) {
        color.mul(this.shadowFactor);
        break;
      }
    }
  }

  // Reflections -- FIXME
  if (this.options.reflections) {
    if ((recursionLevel > 0) && (hitModel.material.reflection > 0)) {

      var rho = 2 * normalAtHitPoint.dot(ray.direction);

      var reflectedRay       = new Jay.Ray()
      reflectedRay.direction = ray.direction.clone().sub(normalAtHitPoint.clone().scale(rho));
      reflectedRay.origin    = hitPoint.clone().add(reflectedRay.direction);

      var reflectedColor = this.traceRay(scene, reflectedRay, recursionLevel-1);

      color.mix(reflectedColor, hitModel.material.reflection);

    }
  }

  return color;
},

Jay.Renderer.prototype.render = function(scene, options) {

  options = options || {};

  var numHorzRays = this.viewport.width;
  var numVertRays = this.viewport.height;
  var blockSize   = 1;

  if (this.options.interpolation > 0) {
    blockSize   = this.options.interpolation;
    numHorzRays = (numHorzRays / this.options.interpolation) + 1;
    numVertRays = (numVertRays / this.options.interpolation) + 1;
  }

  var mX = this.viewport.width  * 0.5;
  var mY = this.viewport.height * 0.5;

  var pixels = [];

  scene.camera.calculateViewMatrix();

  var ray    = new Jay.Ray();
  ray.origin = scene.camera.rvp.clone().add(scene.camera.N.clone().scale(this.viewport.viewerDistance));

  for(var y = 0; y < numVertRays; y++) {

    var ry = y * blockSize;
    var yt = ry - mY;
    var transposeY = scene.camera.V.clone().scale(yt).add(scene.camera.rvp);

    for(var x = 0; x < numHorzRays; x++) {

      var rx = x * blockSize;
      var xt = rx - mX;

      ray.pointTowards(scene.camera.U.clone().scale(xt).add(transposeY));

      var color = this.traceRay(scene, ray, 1);

      if (this.options.interpolation > 0) {
        pixels.push(color);
      } else {
        this.image.setPixel(x, y, color);
      }
    }

    if (options.afterEachLine) {
      options.afterEachLine(y);
    }
  }

  if (this.options.interpolation > 0) {
    this.image.interpolate(pixels, numHorzRays, numVertRays, blockSize);
  }

}
