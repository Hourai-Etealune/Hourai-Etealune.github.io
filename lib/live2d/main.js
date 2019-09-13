const thisRef = this;
let queue = null;
const wait = 100;


function glResize() {
  // prev size
  const canvasWidth = this.canvas.width;
  const canvasHeight = this.canvas.height;
  // new size = outer div size
  const centerContent = document.getElementById('l2d_canvas');
  this.canvas.width = centerContent.clientWidth;
  this.canvas.height = canvasHeight * (this.canvas.width / canvasWidth);
  // reset viewport
  gl.viewport(0, 0, this.canvas.width, this.canvas.height);
}

// summon webgl
function getWebGLContext() {
  const NAMES = ['webgl', 'experimental-webgl', 'webkit-3d', 'moz-webgl'];

  for (let i = 0; i < NAMES.length; i += 0) {
    try {
      const ctx = this.canvas.getContext(NAMES[i], {premultipliedAlpha: true});
      if (ctx) return ctx;
    } catch (e) {
      return null;
    }
  }
  return null;
}

// error message
function l2dError(msg) {
  if (!LAppDefine.DEBUG_LOG) return;
  l2dLog(`<span style="color:red">${msg}</span>`);
}

window.onerror = (msg, url, line) => {
  const errmsg = `file:${url}<br>line:${line} ${msg}`;
  l2dError(errmsg);
};

window.addEventListener('resize', () => {
  clearTimeout(queue);
  queue = setTimeout(() => {
    glResize();
  }, wait);
  // scaleCaptcha();
}, false);

function draw() {
  MatrixStack.reset();
  MatrixStack.loadIdentity();

  this.dragMgr.update(); // ドラッグ用パラメータの更新
  this.live2DMgr.setDrag(this.dragMgr.getX(), this.dragMgr.getY());

  // Canvasをクリアする
  this.gl.clear(this.gl.COLOR_BUFFER_BIT);

  MatrixStack.multMatrix(this.projMatrix.getArray());
  MatrixStack.multMatrix(this.viewMatrix.getArray());
  MatrixStack.push();

  for (let i = 0; i < this.live2DMgr.numModels(); i += 1) {
    const model = this.live2DMgr.getModel(i);
    if (model == null) return;
    if (model.initialized && !model.updating) {
      model.update();
      model.draw(this.gl);

      if (!this.isModelShown && i === this.live2DMgr.numModels() - 1) {
        this.isModelShown = !this.isModelShown;
        const btnChange = document.getElementById('btnChange');
        btnChange.textContent = 'Change Model';
        btnChange.removeAttribute('disabled');
        btnChange.setAttribute('class', 'active');
      }
    }
  }

  MatrixStack.pop();
}

function startDraw() {
  if (!this.isDrawStart) {
    this.isDrawStart = true;
    (function tick() {
      draw();
      const requestAnimationFrame = window.requestAnimationFrame
        || window.mozRequestAnimationFrame
        || window.webkitRequestAnimationFrame
        || window.msRequestAnimationFrame;

      requestAnimationFrame(tick, this.canvas);
    }());
  }
}

function init() {
  // init
  const {width, height} = this.canvas;

  this.dragMgr = new L2DTargetPoint();

  // matrix creation
  const ratio = height / width;
  const left = LAppDefine.VIEW_LOGICAL_LEFT;
  const right = LAppDefine.VIEW_LOGICAL_RIGHT;
  const bottom = -ratio;
  const top = ratio;

  this.viewMatrix = new L2DViewMatrix();

  // screen size
  this.viewMatrix.setScreenRect(left, right, bottom, top);

  // max screen size
  this.viewMatrix.setMaxScreenRect(LAppDefine.VIEW_LOGICAL_MAX_LEFT,
    LAppDefine.VIEW_LOGICAL_MAX_RIGHT,
    LAppDefine.VIEW_LOGICAL_MAX_BOTTOM,
    LAppDefine.VIEW_LOGICAL_MAX_TOP);

  this.viewMatrix.setMaxScale(LAppDefine.VIEW_MAX_SCALE);
  this.viewMatrix.setMinScale(LAppDefine.VIEW_MIN_SCALE);

  this.projMatrix = new L2DMatrix44();
  this.projMatrix.multScale(1, (width / height));


  // mouse location
  this.deviceToScreen = new L2DMatrix44();
  this.deviceToScreen.multTranslate(-width / 2.0, -height / 2.0);
  this.deviceToScreen.multScale(2 / width, -2 / width);


  this.gl = getWebGLContext();
  if (!this.gl) {
    l2dError('Failed to create WebGL context.');
    return;
  }

  Live2D.setGL(this.gl);

  this.gl.clearColor(0.0, 0.0, 0.0, 0.0);

  // this.isModelShown = false;
  this.live2DMgr.reloadFlg = true;
  this.live2DMgr.changeModel(this.gl);
  startDraw();
}

/* ********** マウスイベント ********** */

/*
 * マウスホイールによる拡大縮小
 */
function modelScaling(scale) {
  const isMaxScale = thisRef.viewMatrix.isMaxScale();
  const isMinScale = thisRef.viewMatrix.isMinScale();

  thisRef.viewMatrix.adjustScale(0, 0, scale);

  // sceen maximized
  if (!isMaxScale) {
    if (thisRef.viewMatrix.isMaxScale()) {
      thisRef.live2DMgr.maxScaleEvent();
    }
  }
  // screen minimized
  if (!isMinScale) {
    if (thisRef.viewMatrix.isMinScale()) {
      thisRef.live2DMgr.minScaleEvent();
    }
  }
}

function transformScreenX(deviceX) {
  return this.deviceToScreen.transformX(deviceX);
}

function transformScreenY(deviceY) {
  return this.deviceToScreen.transformY(deviceY);
}

// matrix operation
function transformViewX(deviceX) {
  const screenX = this.deviceToScreen.transformX(deviceX);
  return viewMatrix.invertTransformX(screenX);
}

function transformViewY(deviceY) {
  const screenY = this.deviceToScreen.transformY(deviceY);
  return viewMatrix.invertTransformY(screenY);
}

// ngadep kepala
function modelTurnHead(event) {
  thisRef.drag = true;

  const rect = event.target.getBoundingClientRect();
  const sx = transformScreenX(event.clientX - rect.left);
  const sy = transformScreenY(event.clientY - rect.top);
  const vx = transformViewX(event.clientX - rect.left);
  const vy = transformViewY(event.clientY - rect.top);

  // if (LAppDefine.DEBUG_MOUSE_LOG) {
  //   console.log('onMouseDown device( x:' + event.clientX + ' y:' + event.clientY + ' )
  //   view( x:' + vx + ' y:' + vy + ')');
  // }

  thisRef.lastMouseX = sx;
  thisRef.lastMouseY = sy;
  thisRef.dragMgr.setPoint(vx, vy);
}

function followPointer(event) {
  const rect = event.target.getBoundingClientRect();
  const sx = transformScreenX(event.clientX - rect.left);
  const sy = transformScreenY(event.clientY - rect.top);
  const canvasRect = document.getElementById('content').getBoundingClientRect();
  const mouseX = event.pageX;
  const mouseY = event.pageY;

  const vx = ((mouseX - (canvasRect.left + 0.5 * canvasRect.width)) / canvasRect.width) * 2;
  const vy = -((mouseY - (canvasRect.top + 0.5 * canvasRect.height)) / canvasRect.height) * 2;

  // if (LAppDefine.DEBUG_MOUSE_LOG) {
  //   console.log('onMouseMove device( x:' + event.clientX + ' y:' + event.clientY + ' )
  // view( x:' + vx + ' y:' + vy + ')');
  // }

  thisRef.lastMouseX = sx;
  thisRef.lastMouseY = sy;
  thisRef.dragMgr.setPoint(vx, vy); // ngadep sekian
}


// face front, set position to 0.0
function lookFront() {
  if (thisRef.drag) {
    thisRef.drag = false;
  }
  thisRef.dragMgr.setPoint(0, 0);
}


function mouseEvent(e) {
  e.preventDefault();

  if (e.type === 'mousemove') {
    followPointer(e);
  } else if (e.type === 'mouseout') {
    /*
        queue = setTimeout(function(){
                lookFront();;
            },1000);
    */
  }
}

function touchEvent(e) {
  e.preventDefault();
  const touch = e.touches[0];

  if (e.type === 'touchstart') {
    if (e.touches.length === 1) modelTurnHead(touch);
    // onClick(touch);
  } else if (e.type === 'touchmove') {
    followPointer(touch);

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      let len = (touch1.pageX - touch2.pageX) * (touch1.pageX - touch2.pageX);
      len += ((touch1.pageY - touch2.pageY) * (touch1.pageY - touch2.pageY));

      if (thisRef.oldLen - len < 0) {
        modelScaling(1.025);
        // 上方向スクロール 拡大
      } else {
        modelScaling(0.975);
      } // 下方向スクロール 縮小

      thisRef.oldLen = len;
    }
  } else if (e.type === 'touchend') {
    lookFront();
  }
}

function initL2dCanvas(canvasId) {
  this.canvas = document.getElementById(canvasId);

  if (this.content.addEventListener) {
    const content = document.getElementById('content');
    content.addEventListener('mousemove', mouseEvent, false);
    content.addEventListener('mouseout', mouseEvent, false);
    // content.addEventListener('touchstart', touchEvent, false);
    // content.addEventListener('touchend', touchEvent, false);
    content.addEventListener('touchmove', touchEvent, false);
  }
}

function start() {
  // Copyright
  const d = new Date();
  const n = d.getFullYear();
  // document.getElementById('cyear').innerHTML = n.toString();
  document.getElementById('cyear').textContent = n.toString();

  // this.platform = window.navigator.platform.toLowerCase();
  this.live2DMgr = new LAppLive2DManager();
  // this.isDrawStart = false;

  this.gl = null;
  this.canvas = null;

  this.dragMgr = null;
  /* new L2DTargetPoint(); */ // for drag stuffs
  this.viewMatrix = null;
  /* new L2DViewMatrix(); */
  // this.projMatrix = null;
  /* new L2DMatrix44() */
  this.deviceToScreen = null;
  /* new L2DMatrix44(); */

  // this.drag = false; // drag
  // this.oldLen = 0;    // 2 finger whatever
  //
  // this.lastMouseX = 0;
  // this.lastMouseY = 0;
  //
  // this.isModelShown = false;

  // initialize event listener
  initL2dCanvas('glcanvas');

  // resize then draw
  const ele = document.getElementById('l2d_canvas');
  const eleStyle = window.getComputedStyle(ele);
  const eleWidth = eleStyle.width;
  const eleHeight = eleStyle.height;

  this.canvas.width = parseInt(eleWidth, 10);
  this.canvas.height = parseInt(eleHeight, 10);

  init();
}

function urlencodeFormData(fd) {
  let s = '';

  function encode(string) {
    return encodeURIComponent(string).replace(/%20/g, '+');
  }

  for (const pair of fd.entries()) {
    if (typeof pair[1] === 'string') {
      s += `${s ? '&' : ''}${encode(pair[0])}=${encode(pair[1])}`;
    }
  }
  return s;
}


document.addEventListener('DOMContentLoaded', () => {
  start();
});
