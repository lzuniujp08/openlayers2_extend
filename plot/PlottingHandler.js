///<jscompress sourcefile="Plotting.js" />
/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Geometry/Point.js
 */

/**
 * Class: OpenLayers.Handler.Plotting
 * 绘制态势符号的事件处理器（抽象类）
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.Plotting = OpenLayers.Class(OpenLayers.Handler, {
    /**
     * APIProperty: controlPoints
     * 存储标绘扩展符号的控制点。
     */
    controlPoints: [],

    /**
     * APIProperty: plotting
     * 标绘扩展符号，在子类的 createFeature() 中确定其实际类型。
     */
    plotting: null,

    /**
     * APIProperty: controlPoints
     * 标绘扩展符号是否处于绘制过程中，控制符号的动态显示。
     */
    isDrawing: false,

    /**
     * APIProperty: layerOptions
     * {Object} 临时绘制图层的可选属性，可用来设置图层的样式。
     */
    layerOptions: null,

    /**
     * APIProperty: pixelTolerance
     * {Number} 绘制点像素容差。绘制点操作所允许的鼠标 down 和 up（包括普通的mousedown、mouseup和touchstart、touchend）
     * 事件之间的最大像素间隔。
     * 如果设置为有效的integer值，则当鼠标down和up之间间隔超过该值时将被忽略，不会添加点要素。默认值是 5。
     */
    pixelTolerance: 5,

    /**
     * Property: point
     * {<OpenLayers.Feature.Vector>} The currently drawn point （当前鼠标位置点，即绘制点）
     */
    point: null,

    /**
     * Property: layer
     * {<OpenLayers.Layer.Vector>} The temporary drawing layer
     */
    layer: null,

    /**
     * Property: multi
     * {Boolean} 在传递事件到图层leyer之前，为多个节点的几何对象创建feature要素实例。默认值是false。
     */
    multi: false,

    /**
     * Property: mouseDown
     * {Boolean} The mouse is down
     */
    mouseDown: false,

    /**
     * Property: stoppedDown
     * {Boolean} Indicate whether the last mousedown stopped the event
     * propagation.
     */
    stoppedDown: null,

    /**
     * Property: lastDown
     * {<OpenLayers.Pixel>} Location of the last mouse down
     */
    lastDown: null,

    /**
     * Property: lastUp
     * {<OpenLayers.Pixel>}
     */
    lastUp: null,

    /**
     * Property: persist
     * {Boolean} 保留呈现的feature要素直到destroyFeature方法被调用。默认为false。
     * 如果设置为true，那么feature会保持呈现，直到handler被设置为无效或者开启另一次绘制的时候调用destroyFeature方法来清除。
     */
    persist: false,

    /**
     * Property: stopDown
     * {Boolean} 停止鼠标mousedown事件的传播。在允许"绘制过程中平移"的时候必须设置为false。默认值为false。
     */
    stopDown: false,

    /**
     * Propery: stopUp
     * {Boolean} 停止鼠标事件的传播。在允许"拖拽过程中平移"的时候必须设置为false。默认值为false。
     */
    stopUp: false,

    /**
     * Property: touch
     * {Boolean} Indcates the support of touch events.
     */
    touch: false,

    /**
     * Property: lastTouchPx
     * {<OpenLayers.Pixel>} The last pixel used to know the distance between
     * two touches (for double touch).
     */
    lastTouchPx: null,

    /**
     * Constructor: OpenLayers.Handler.Plotting
     * 构造函数，创建一个新的绘制态势符号要素的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        if(!(options && options.layerOptions && options.layerOptions.styleMap)) {
            if(!this.style)
            this.style = OpenLayers.Util.extend(OpenLayers.Feature.Vector.style['default'], {});
        }

        OpenLayers.Handler.prototype.initialize.apply(this, arguments);
    },

    /**
     * APIMethod: activate
     * 激活事件处理器对象上的监听处理，如果这个事件处理器对象已经激活，则返回false.
     *
     * Returns:
     * {Boolean} 事件处理器对象监听激活成功.
     */
    activate: function() {
        if(!OpenLayers.Handler.prototype.activate.apply(this, arguments)) {
            return false;
        }

        this.controlPoints = [];
        this.plotting = null;
        this.isDrawing = false;

        // create temporary vector layer for rendering Geometry sketch
        // TBD: this could be moved to initialize/destroy - setting visibility here
        var options = OpenLayers.Util.extend({
            displayInLayerSwitcher: false,
            // indicate that the temp vector layer will never be out of range
            // without this, resolution properties must be specified at the
            // map-level for this temporary layer to init its resolutions
            // correctly
            calculateInRange: OpenLayers.Function.True
        }, this.layerOptions);
        this.layer = new OpenLayers.Layer.Vector(this.CLASS_NAME, options);
        this.map.addLayer(this.layer);
        OpenLayers.Element.addClass(
            this.map.viewPortDiv, "smDefault");
        return true;
    },

    /**
     * APIMethod: deactivate
     * 关闭事件处理器对象上的监听处理，如果这个事件处理器已经是关闭状态，则返回false
     *
     * Returns:
     * {Boolean} 事件处理器对象监听已经成功关闭。
     */
    deactivate: function() {
        if(!OpenLayers.Handler.prototype.deactivate.apply(this, arguments)) {
            return false;
        }

        this.controlPoints = [];
        this.plotting = null;
        this.isDrawing = false;

        this.cancel();
        // If a layer's map property is set to null, it means that that layer
        // isn't added to the map. Since we ourself added the layer to the map
        // in activate(), we can assume that if this.layer.map is null it means
        // that the layer has been destroyed (as a result of map.destroy() for
        // example.
        if (this.layer.map != null) {
            //deactivate后，移除绘制时的鼠标样式
            OpenLayers.Element.removeClass(
                this.map.viewPortDiv, "smDefault");
            this.destroyFeature(true);
            this.layer.destroy(false);
        }
        this.layer = null;
        this.touch = false;
        return true;
    },

    /**
     * APIMethod: createFeature
     * 创建标绘扩展符号。
     * 子类必须实现该方法，确定符号（plotting）的实例。eg:
     *
     *  this.plotting = new OpenLayers.Feature.Vector(
     *
     *       //标绘扩展符号的 Geometry 类型为 GeoCircle
     *
     *      new OpenLayers.Geometry.GeoCircle()
     *
     *  );
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} 当前鼠标在地图上的像素位置.
     */
    createFeature: function(pixel) { },

    /**
     * APIMethod: modifyFeature
     * 绘制过程中修改标绘扩展符号形状。
     * 根据已添加（up函数中添加）的部分的控制点和由当前鼠标位置作为的一个临时控制点产生和符号。
     *
     * 子类视实际情况重写此方法（示例如 DoubleArrow 中的 modifyFeature ）。
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} 鼠标在地图上的当前像素位置
     */
    modifyFeature: function(pixel) {
        //忽略Chrome mouseup触发瞬间 mousemove 产生的相同点
        if (this.lastUp && this.lastUp.equals(pixel)) {
            return true;
        }

        //新建标绘扩展符号
        if(!this.point || !this.plotting) {
            this.createFeature(pixel);
        }

        //修改临时点的位置（鼠标位置）
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;

        if(this.isDrawing == true){
            var geometry = new OpenLayers.Geometry.Point(
                lonlat.lon, lonlat.lat
            );

            var cp = this.controlPoints.concat([geometry]);
            //重新设置标绘扩展符号的控制点
            this.plotting.geometry._controlPoints = this.cloneControlPoints(cp);
            //重新计算标绘扩展符号的geometry
            this.plotting.geometry.calculateParts();
        }

        this.callback("modify", [this.point.geometry, this.getSketch(), false]);
        this.point.geometry.clearBounds();
        this.drawFeature();
    },

    /**
     * Method: up
     *  操作 mouseup 和 touchend，
     * 发送最后一个 mouseup 点。
     *
     * 子类必须实现此方法。此方法添加符号的控制点 ，根基实际的符号。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) { },

    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function(evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        if(!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * APIMethod: move
     * Handle mousemove and touchmove.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    move: function (evt) {
        if(!this.touch // no point displayed until up on touch devices
            && (!this.mouseDown || this.stoppedDown)) {
            this.modifyFeature(evt.xy);
        }
        return true;
    },

    /**
     * Method: click
     * Handle clicks.  Clicks are stopped from propagating to other listeners
     *     on map.events or other dom elements.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    click: function(evt) {
        OpenLayers.Event.stop(evt);
        return false;
    },

    /**
     * Method: dblclick
     * Handle double-clicks.  Double-clicks are stopped from propagating to other
     *     listeners on map.events or other dom elements.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        OpenLayers.Event.stop(evt);
        return false;
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 1) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: addControlPoint
     * 向 controlPoints 添加控制点
     */
    addControlPoint: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.controlPoints.push(geometry);
    },

    /**
     * Method: drawFeature
     * Render features on the temporary layer.
     */
    drawFeature: function() {
        this.layer.renderer.clear();
        this.layer.drawFeature(this.plotting, this.style);
        this.layer.drawFeature(this.point, this.style);
    },

    /**
     * Method: getSketch
     * Return the sketch feature.
     *
     * Returns:
     * {<OpenLayers.Feature.Vector>}
     */
    getSketch: function() {
        return this.plotting;
    },

    /**
     * Method: destroyFeature
     * Destroy the temporary geometries
     *
     * Parameters:
     * force - {Boolean} Destroy even if persist is true.
     */
    destroyFeature: function(force) {
        if(this.layer && (force || !this.persist)) {
            this.layer.destroyFeatures();
        }
        this.point = null;
        this.plotting = null;
    },

    /**
     * Method: finalize
     * Finish the Geometry and call the "done" callback.
     *
     * Parameters:
     * cancel - {Boolean} Call cancel instead of done callback.  Default
     *          is false.
     */
    finalize: function(cancel) {
        var key = cancel ? "cancel" : "done";
        this.mouseDown = false;
        this.lastDown = null;
        this.lastUp = null;
        this.lastTouchPx = null;
        this.callback(key, [this.geometryClone()]);
        this.destroyFeature(cancel);
    },

    /**
     * APIMethod: cancel
     * 结束绘制操作并且调用cancel回调
     */
    cancel: function() {
        this.finalize(true);
    },

    /**
     * Method: getGeometry
     * Return the sketch Geometry.
     *
     * Returns:
     * {<OpenLayers.Geometry.Point>}
     */
    getGeometry: function() {
        if(this.plotting && this.plotting.geometry){
            return this.plotting.geometry;
        }
    },

    /**
     * Method: geometryClone
     * Return a clone of the Geometry.
     *
     * Returns:
     * {<OpenLayers.Geometry>}
     */
    geometryClone: function() {
        var geom = this.getGeometry();
        if(geom && geom._controlPoints){
            var geo =  geom.clone();
            geo.calculateParts();
            return geo;
        }
    },

    /**
     * Method: mousedown
     * Handle mousedown.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mousedown: function(evt) {
        return this.down(evt);
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },

    /**
     * Method: mousemove
     * Handle mousemove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mousemove: function(evt) {
        return this.move(evt);
    },

    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
        this.lastTouchPx = evt.xy;
        return this.move(evt);
    },

    /**
     * Method: mouseup
     * Handle mouseup.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    mouseup: function(evt) {
        return this.up(evt);
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        evt.xy = this.lastTouchPx;
        return this.up(evt);
    },

    /**
     * Method: mouseout
     * Handle mouse out.  For better user experience reset mouseDown
     * and stoppedDown when the mouse leaves the map viewport.
     *
     * Parameters:
     * evt - {Event} The browser event
     */
    mouseout: function(evt) {
        if(OpenLayers.Util.mouseLeft(evt, this.map.eventsDiv)) {
            this.stoppedDown = this.stopDown;
            this.mouseDown = false;
        }
    },

    /**
     * Method: passesTolerance
     * Determine whether the event is within the optional pixel tolerance.
     *
     * Returns:
     * {Boolean} The event is within the pixel tolerance (if specified).
     */
    passesTolerance: function(pixel1, pixel2, tolerance) {
        var passes = true;

        if (tolerance != null && pixel1 && pixel2) {
            var dist = pixel1.distanceTo(pixel2);
            if (dist > tolerance) {
                passes = false;
            }
        }
        return passes;
    },

    /**
     * Method: cloneControlPoints
     * 克隆控制点数组
     *
     * Parameters:
     * cp - {<OpenLayers.Geometry.Point>} 要进行克隆的控制点数组
     */
    cloneControlPoints: function(cp){
        var controlPoints = [];

        for(var i = 0; i < cp.length; i++){
            controlPoints.push(cp[i].clone());
        }

        return controlPoints;
    },

    /**
     * Method: drawComplete
     * 绘制完成操作
     * 当一个标绘扩展符号完成时调用此函数
     *
     */
    drawComplete: function(){
        this.finalize();
        this.isDrawing = false;
        this.controlPoints = [];

        if(this.active == true){
            this.layer.removeAllFeatures();
        }
    },

    CLASS_NAME: "OpenLayers.Handler.Plotting"
});
///<jscompress sourcefile="BizerCurveArrow.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoBezierCurveArrow.js
 */

/**
 * Class: OpenLayers.Handler.BezierCurveArrow
 * 在地图上绘制贝塞尔曲线箭头的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击鼠标完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.BezierCurveArrow> 构造函数可以创建一个新的绘制贝塞尔曲线箭头的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.BezierCurveArrow = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.BezierCurveArrow
     * 构造函数，创建一个新的绘制贝塞尔曲线箭头的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoBezierCurveArrow
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoBezierCurveArrow()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len > 0){
                this.isDrawing = true;
            }
            return true;
        } else {
            return true;
        }
    },
    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },

    CLASS_NAME: "OpenLayers.Handler.BezierCurveArrow"
});



///<jscompress sourcefile="CardinalCurveArrow.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoCardinalCurveArrow
 */

/**
 * Class: OpenLayers.Handler.CardinalCurveArrow
 * 在地图上绘制Cardinal曲线箭头的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击鼠标完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.CardinalCurveArrow> 构造函数可以创建一个新的绘制Cardinal曲线箭头的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.CardinalCurveArrow = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.CardinalCurveArrow
     * 构造函数，创建一个新的绘制Cardinal曲线箭头的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoCardinalCurveArrow
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoCardinalCurveArrow()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len > 0){
                this.isDrawing = true;
            }
            return true;
        } else {
            return true;
        }
    },
    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.CardinalCurveArrow"
});



///<jscompress sourcefile="CurveFlag.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoCurveFlag.js
 */

/**
 * Class: OpenLayers.Handler.CurveFlag
 * 在地图上绘制曲线旗标的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.CurveFlag> 构造函数可以创建一个新的绘制曲线旗标的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.CurveFlag = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.CurveFlag
     * 构造函数，创建一个新的绘制曲线旗标的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoCurveFlag
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoCurveFlag()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },


    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }
            else if(len == 2){
                this.drawComplete();
            }
            else{
                this.isDrawing = false;
                this.controlPoints = [];
                this.plotting = null
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.map.isIESingleTouch=false;
        this.modifyFeature(evt.xy);
        if(this.persist) {
            this.destroyPersistedFeature();
        }
        this.addControlPoint(evt.xy);
        var len = this.controlPoints.length;
        if(len >= 1) {
            this.isDrawing = true;
        }
        return true;
    },
    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        this.drawComplete();
        this.map.isIESingleTouch=true;
        return false;
    },
    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
        this.lastTouchPx = evt.xy;
        this.modifyFeature(evt.xy);
        return true;
    },
    CLASS_NAME: "OpenLayers.Handler.CurveFlag"
});



///<jscompress sourcefile="DiagonalArrow.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoDiagonalArrow.js
 */

/**
 * Class: OpenLayers.Handler.DiagonalArrow
 * 在地图上绘制斜箭头的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第四次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.DiagonalArrow> 构造函数可以创建一个新的绘制斜箭头的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.DiagonalArrow = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.DiagonalArrow
     * 构造函数，创建一个新的绘制斜箭头的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoDiagonalArrow
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoDiagonalArrow()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: down
     * Handle mousedown and touchstart.  Add a new point to the Geometry and
     * render it. Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function(evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        if(this.touch) { // no point displayed until up on touch devices
            this.modifyFeature(evt.xy);
            OpenLayers.Event.stop(evt);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.DiagonalArrow"
});



///<jscompress sourcefile="DoubleArrow.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoDoubleArrow.js
 */

/**
 * Class: OpenLayers.Handler.DoubleArrow
 * 在地图上绘制双箭头的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击鼠标完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.DoubleArrow> 构造函数可以创建一个新的绘制双箭头的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.DoubleArrow = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.DoubleArrow
     * 构造函数，创建一个新的绘制双箭头的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoDoubleArrow
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoDoubleArrow()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * APIMethod: modifyFeature
     * 针对双箭头重新父类此方法。
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} 鼠标在地图上的当前像素位置
     */
    modifyFeature: function(pixel) {
        //忽略Chrome mouseup触发瞬间 mousemove 产生的相同点
        if (this.lastUp && this.lastUp.equals(pixel)) {
            return true;
        }

        //新建标绘扩展符号
        if(!this.point || !this.plotting) {
            this.createFeature(pixel);
        }

        //修改临时点的位置
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;

        if(this.isDrawing == true){
            var geometry = new OpenLayers.Geometry.Point(
                lonlat.lon, lonlat.lat
            );

            var len = this.controlPoints.length;
            if(len == 2){
                var offX = this.controlPoints[1].x - this.controlPoints[0].x;
                var offY = this.controlPoints[1].y - this.controlPoints[0].y;

                //第四个控制点
                var geometry2 = new OpenLayers.Geometry.Point(
                    (lonlat.lon - offX), (lonlat.lat - offY)
                );
                var cp = this.controlPoints.concat([geometry, geometry2]);
            }
            else if(len == 3){
                var cp = this.controlPoints.concat([geometry]);
            }
            //重新设置标绘扩展符号的控制点
            this.plotting.geometry._controlPoints = this.cloneControlPoints(cp);
            //重新计算标绘扩展符号的geometry
            this.plotting.geometry.calculateParts();
        }

        this.callback("modify", [this.point.geometry, this.getSketch(), false]);
        this.point.geometry.clearBounds();
        this.drawFeature();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){ }
            else if(len == 2 || len == 3){
                this.isDrawing = true;
            }
            else if(len == 4){
                this.drawComplete();
            }
            else{
                this.isDrawing = false;
                this.controlPoints = [];
                this.plotting = null
            }

            return true;
        } else {
            return true;
        }
    },

    CLASS_NAME: "OpenLayers.Handler.DoubleArrow"
});



///<jscompress sourcefile="DoveTailDiagonalArrow.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoDoveTailDiagonalArrow.js
 */

/**
 * Class: OpenLayers.Handler.DoveTailDiagonalArrow
 * 在地图上绘制燕尾尾巴斜箭头的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第四次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.DoveTailDiagonalArrow> 构造函数可以创建一个新的绘制燕尾斜箭头的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.DoveTailDiagonalArrow = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.DoveTailDiagonalArrow
     * 构造函数，创建一个新的绘制燕尾斜箭头的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoDoveTailDiagonalArrow
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoDoveTailDiagonalArrow()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 2) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: down
     * Handle mousedown and touchstart.  Add a new point to the Geometry and
     * render it. Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function(evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        if(this.touch) { // no point displayed until up on touch devices
            this.modifyFeature(evt.xy);
            OpenLayers.Event.stop(evt);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.DoveTailDiagonalArrow"
});



///<jscompress sourcefile="DoveTailStraightArrow.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoDoveTailStraightArrow.js
 */

/**
 * Class: OpenLayers.Handler.DoveTailStraightArrow
 * 在地图上绘制燕尾直箭头的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击鼠标完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.DoveTailStraightArrow> 构造函数可以创建一个新的绘制燕尾直箭头的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.DoveTailStraightArrow = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.DoveTailStraightArrow
     * 构造函数，创建一个新的绘制燕尾直箭头的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoDoveTailStraightArrow
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoDoveTailStraightArrow()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 2) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: down
     * Handle mousedown and touchstart.  Add a new point to the Geometry and
     * render it. Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function(evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        if(this.touch) { // no point displayed until up on touch devices
            this.modifyFeature(evt.xy);
            OpenLayers.Event.stop(evt);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.DoveTailStraightArrow"
});



///<jscompress sourcefile="ParallelSearch.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoParallelSearch.js
 */

/**
 * Class: OpenLayers.Handler.ParallelSearch
 * 在地图上绘制聚集地符号的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.ParallelSearch> 构造函数可以创建一个新的绘制聚集地符号的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.ParallelSearch = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.ParallelSearch
     * 构造函数，创建一个新的绘制聚集地符号的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoParallelSearch
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoParallelSearch()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len>0){
                this.isDrawing = true;
            }
            return true;
        } else {
            return true;
        }

    },
    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.ParallelSearch"
});



///<jscompress sourcefile="PolylineArrow.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoPolylineArrow.js
 */

/**
 * Class: OpenLayers.Handler.PolylineArrow
 * 在地图上绘制折线箭头的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击鼠标完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.PolylineArrow> 构造函数可以创建一个新的绘制折线箭头的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.PolylineArrow = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.PolylineArrow
     * 构造函数，创建一个新的绘制折线箭头的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoPolylineArrow
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoPolylineArrow()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len>0){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.PolylineArrow"
});



///<jscompress sourcefile="RectFlag.js" />
/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Geometry/GeoRectFlag.js
 */

/**
 * Class: OpenLayers.Handler.RectFlag
 * 在地图上绘制矩形旗标的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.RectFlag> 构造函数可以创建一个新的绘制直箭头的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.RectFlag = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.RectFlag
     * 构造函数，创建一个新的绘制直角旗标的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoRectFlag
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoRectFlag()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 2) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }
            else if(len == 2){
                this.drawComplete();
            }
            else{
                this.isDrawing = false;
                this.controlPoints = [];
                this.plotting = null
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.map.isIESingleTouch=false;
        this.modifyFeature(evt.xy);
        if(this.persist) {
            this.destroyPersistedFeature();
        }
        this.addControlPoint(evt.xy);
        var len = this.controlPoints.length;
        if(len >= 1) {
            this.isDrawing = true;
        }
        return true;
    },
    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        this.drawComplete();
        this.map.isIESingleTouch=true;
        return false;
    },
    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
        this.lastTouchPx = evt.xy;
        this.modifyFeature(evt.xy);
        return true;
    },
    CLASS_NAME: "OpenLayers.Handler.RectFlag"
});



///<jscompress sourcefile="SectorSearch.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoParallelSearch
 */

/**
 * Class: OpenLayers.Handler.SectorSearch
 * 在地图上绘制聚集地符号的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.SectorSearch> 构造函数可以创建一个新的绘制聚集地符号的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.SectorSearch = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.SectorSearch
     * 构造函数，创建一个新的绘制聚集地符号的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoSectorSearch
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoSectorSearch()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 2) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len==1){
                this.isDrawing = true;
            }
            else if(len==2){
                this.drawComplete();
            }
            return true;
        } else {
            return true;
        }

    },

    CLASS_NAME: "OpenLayers.Handler.SectorSearch"
});



///<jscompress sourcefile="StraightArrow.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoStraightArrow.js
 */

/**
 * Class: OpenLayers.Handler.StraightArrow
 * 在地图上绘制直箭头的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击鼠标完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.StraightArrow> 构造函数可以创建一个新的绘制直箭头的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler>
 */
OpenLayers.Handler.StraightArrow = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.StraightArrow
     * 构造函数，创建一个新的绘制直箭头的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 geometry 类型为 GeoStraightArrow
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoStraightArrow()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 2) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: down
     * Handle mousedown and touchstart.  Add a new point to the geometry and
     * render it. Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function(evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        if(this.touch) { // no point displayed until up on touch devices
            this.modifyFeature(evt.xy);
            OpenLayers.Event.stop(evt);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    CLASS_NAME: "OpenLayers.Handler.StraightArrow"
});



///<jscompress sourcefile="TriangleFlag.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoTriangleFlag.js
 */

/**
 * Class: OpenLayers.Handler.TriangleFlag
 * 在地图上绘制三角旗标的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.TriangleFlag> 构造函数可以创建一个新的绘制三角旗标的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.TriangleFlag = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.TriangleFlag
     * 构造函数，创建一个新的绘制三角旗标的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoTriangleFlag
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoTriangleFlag()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 2) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }
            else if(len == 2){
                this.drawComplete();
            }
            else{
                this.isDrawing = false;
                this.controlPoints = [];
                this.plotting = null
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.map.isIESingleTouch=false;
        this.modifyFeature(evt.xy);
        if(this.persist) {
            this.destroyPersistedFeature();
        }
        this.addControlPoint(evt.xy);
        var len = this.controlPoints.length;
        if(len >= 1) {
            this.isDrawing = true;
        }
        return true;
    },
    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        this.drawComplete();
        this.map.isIESingleTouch=true;
        return false;
    },
    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
        this.lastTouchPx = evt.xy;
        this.modifyFeature(evt.xy);
        return true;
    },
    CLASS_NAME: "OpenLayers.Handler.TriangleFlag"
});



///<jscompress sourcefile="ArcEx.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoArc
 */

/**
 * Class: OpenLayers.Handler.ArcEx
 * 在地图上绘制圆弧符号的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.ArcEx> 构造函数可以创建一个新的绘制圆弧符号的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.ArcEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.ArcEx
     * 构造函数，创建一个新的绘制圆弧符号的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoArcEx
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoArc()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },


    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1 || len == 2){
                this.isDrawing = true;
            }
            else if(len==3)
            {
                this.isDrawing = false;
                this.drawComplete();
            }
            return true;
        } else {
            return true;
        }

    },


    CLASS_NAME: "OpenLayers.Handler.ArcEx"
});



///<jscompress sourcefile="BezierCurve2Ex.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoBezierCurve2
 */

/**
 * Class: OpenLayers.Handler.BezierCurve2Ex
 * 在地图上绘制二次贝塞尔曲线的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，绘制第三个点后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.BezierCurve2Ex> 构造函数可以创建一个新的绘制二次贝塞尔曲线的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.BezierCurve2Ex = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.BezierCurve2Ex
     * 构造函数，创建一个新的绘制二次贝塞尔曲线的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoCloseCurve
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoBezierCurve2()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >0 && len <3){
                this.isDrawing = true;
            }
           else if(len == 3){
                this.drawComplete();
            }
            return true;
        } else {
            return true;
        }

    },


    CLASS_NAME: "OpenLayers.Handler.BezierCurve2Ex"
});



///<jscompress sourcefile="BezierCurve3Ex.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoBezierCurve3
 */

/**
 * Class: OpenLayers.Handler.BezierCurve3Ex
 * 在地图上绘制三次贝塞尔曲线的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，绘制第四个点后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.BezierCurve3Ex> 构造函数可以创建一个新的绘制三次贝塞尔曲线的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.BezierCurve3Ex = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.BezierCurve3Ex
     * 构造函数，创建一个新的绘制三次贝塞尔曲线的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoCloseCurve
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoBezierCurve3()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },


    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >0 && len <4){
                this.isDrawing = true;
            }
            else if(len == 4){
                this.drawComplete();
            }
            return true;
        } else {
            return true;
        }

    },

    CLASS_NAME: "OpenLayers.Handler.BezierCurve3Ex"
});



///<jscompress sourcefile="BezierCurveNEx.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoBezierCurveN
 */

/**
 * Class: OpenLayers.Handler.BezierCurveNEx
 * 在地图上绘制N次贝塞尔曲线的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘，双击后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.BezierCurveNEx> 构造函数可以创建一个新的绘制N次贝塞尔曲线的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.BezierCurveNEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.BezierCurveNEx
     * 构造函数，创建一个新的绘制N次贝塞尔曲线的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoCloseCurve
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoBezierCurveN()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >0 ){
                this.isDrawing = true;
            }
            return true;
        } else {
            return true;
        }

    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },

    CLASS_NAME: "OpenLayers.Handler.BezierCurveNEx"
});



///<jscompress sourcefile="CardinalCurveEx.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoCardinalCurve
 */

/**
 * Class: OpenLayers.Handler.CardinalCurveEx
 * 在地图上绘制Cardinal曲线的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.CardinalCurveEx> 构造函数可以创建一个新的绘制Cardinal曲线的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.CardinalCurveEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.CardinalCurveEx
     * 构造函数，创建一个新的绘制Cardinal曲线的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoCardinalCurve
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoCardinalCurve()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >= 1){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }

    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.CardinalCurveEx"
});



///<jscompress sourcefile="FreelineEx.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoFreeline
 */

/**
 * Class: OpenLayers.Handler.FreelineEx
 * 在地图上绘制自由线的事件处理器。
 * 绘制点在激活后显示，在鼠标第一次松开后开始绘制，且随着鼠标移动而绘制，双击后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.FreelineEx> 构造函数可以创建一个新的绘制自由线的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.FreelineEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.FreelineEx
     * 构造函数，创建一个新的绘制自由线的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoFreeline
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoFreeline()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >= 1){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }

    },
    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.map.isIESingleTouch=false;
           this.modifyFeature(evt.xy);
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >= 1) {
                this.isDrawing = true;
            }
        return true;
    },
    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
            this.lastTouchPx = evt.xy;
            this.modifyFeature(evt.xy);
        return true;
    },
    /**
     * APIMethod: modifyFeature
     * 绘制过程中修改标绘扩展符号形状。
     * 根据已添加的控制点和由当前鼠标位置作为的一个控制点绘制符号。
     * 重写父类的方法
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} 鼠标在地图上的当前像素位置
     */
    modifyFeature: function(pixel) {
        //忽略Chrome mouseup触发瞬间 mousemove 产生的相同点
        if (this.lastUp && this.lastUp.equals(pixel)) {
            return true;
        }

        //新建标绘扩展符号
        if(!this.point || !this.plotting) {
            this.createFeature(pixel);
        }

        //修改临时点的位置（鼠标位置）
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;

        if(this.isDrawing == true){
            this.addControlPoint(pixel);

            var cp= this.controlPoints;
            //重新设置标绘扩展符号的控制点
            this.plotting.geometry._controlPoints = this.cloneControlPoints(cp);
            //重新计算标绘扩展符号的geometry
            this.plotting.geometry.calculateParts();
        }

        this.callback("modify", [this.point.geometry, this.getSketch(), false]);
        this.point.geometry.clearBounds();
        this.drawFeature();
    },


    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {

        this.drawComplete();
        return false;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
            this.drawComplete();
            this.map.isIESingleTouch=true;
        return false;
    },

    CLASS_NAME: "OpenLayers.Handler.FreelineEx"
});



///<jscompress sourcefile="PolyLineEx.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoPolyline
 */

/**
 * Class: OpenLayers.Handler.PolyLineEx
 * 在地图上绘制折线的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.PolyLineEx> 构造函数可以创建一个新的绘制折线的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.PolyLineEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.PolyLineEx
     * 构造函数，创建一个新的绘制折线的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoCloseCurve
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoPolyline()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >= 1){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }

    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },
    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.PolyLineEx"
});



///<jscompress sourcefile="MultiPointEx.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoMultiPoint
 */

/**
 * Class: OpenLayers.Handler.MultiPointEx
 * 在地图上绘制多点的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.MultiPointEx> 构造函数可以创建一个新的绘制多点的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.MultiPointEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.MultiPointEx
     * 构造函数，创建一个新的绘制多点的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function (control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function (pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoMultiPointEx
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoMultiPoint()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }
        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if (this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            return true;
        } else {
            return true;
        }

    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function (evt) {
        this.drawComplete();
        this.isDrawing = false;
        return false;
    },
    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },

    CLASS_NAME: "OpenLayers.Handler.MultiPointEx"
});



///<jscompress sourcefile="PointEx.js" />
/**
 * @requires OpenLayers/Handler/Plotting
 * @requires OpenLayers/Geometry/GeoPoint
 */

/**
 * Class: OpenLayers.Handler.PointEx
 * 在地图上绘制点的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.PointEx> 构造函数可以创建一个新的绘制点的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.PointEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.PointEx
     * 构造函数，创建一个新的绘制点的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);
        //标绘扩展符号的 Geometry 类型为 GeoPoint
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoPoint()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function(evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if(!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },
    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }
        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;
            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.drawComplete();
            }
            return true;
        } else {
            return true;
        }
    },
    CLASS_NAME: "OpenLayers.Handler.PointEx"
});



///<jscompress sourcefile="CircleEx.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GeoCircle.js
 */

/**
 * Class: OpenLayers.Handler.GeoCircle
 * 在地图上绘制圆的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.GeoCircle> 构造函数可以创建一个新的绘制圆的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler>
 */
OpenLayers.Handler.CircleEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.CircleEx
     * 构造函数，创建一个新的绘制圆的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 geometry 类型为 GeoCircle
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoCircle()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 2) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }
            else if(len == 2){
                this.drawComplete();
            }

            return true;
        } else {
            return true;
        }
    },

    CLASS_NAME: "OpenLayers.Handler.CircleEx"
});



///<jscompress sourcefile="CloseCurve.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/Polygon/GeoCloseCurve.js
 */

/**
 * Class: OpenLayers.Handler.CloseCurve
 * 在地图上绘制闭合曲线的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，所绘制的控制点不小于3个，双击后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.CloseCurve> 构造函数可以创建一个新的绘制闭合曲线的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.CloseCurve = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.CloseCurve
     * 构造函数，创建一个新的绘制闭合曲线的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoCloseCurve
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoCloseCurve()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: destroyPersistedFeature
     * Destroy the persisted feature.
     */
    destroyPersistedFeature: function() {
        var layer = this.layer;
        if(layer && layer.features.length > 1) {
            this.layer.features[0].destroy();
        }
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >= 1){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }

    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.CloseCurve"
});



///<jscompress sourcefile="EllipseEx.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/Polygon/GeoEllipse.js
 */

/**
 * Class: OpenLayers.Handler.GeoEllipse
 * 在地图上绘制椭圆的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.GeoEllipse> 构造函数可以创建一个新的绘制圆的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.EllipseEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.EllipseEx
     * 构造函数，创建一个新的绘制椭圆的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoEllipse
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoEllipse()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },


    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }
            else if(len == 2){
                this.drawComplete();
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.map.isIESingleTouch=false;
        this.modifyFeature(evt.xy);
        if(this.persist) {
            this.destroyPersistedFeature();
        }
        this.addControlPoint(evt.xy);
        var len = this.controlPoints.length;
        if(len >= 1) {
            this.isDrawing = true;
        }
        return true;
    },
    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        this.drawComplete();
        this.map.isIESingleTouch=true;
        return false;
    },
    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
        this.lastTouchPx = evt.xy;
        this.modifyFeature(evt.xy);
        return true;
    },
    CLASS_NAME: "OpenLayers.Handler.EllipseEx"
});



///<jscompress sourcefile="FreePolygon.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/Polygon/GeoFreeline.js
 */

/**
 * Class: OpenLayers.Handler.FreePolygon
 * 在地图上绘制手绘面的事件处理器。
 * 绘制点在激活后显示，在鼠标第一次松开后开始绘制，且随着鼠标移动而绘制，双击后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.FreePolygon> 构造函数可以创建一个新的绘制手绘面的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.FreePolygon = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.FreePolygon
     * 构造函数，创建一个新的绘制手绘面的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoFreePolygon
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoFreePolygon()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },


    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >0){
                this.isDrawing = true;
            }

            return true;
        } else {
            return true;
        }

    },
    /**
     * APIMethod: modifyFeature
     * 绘制过程中修改标绘扩展符号形状。
     * 根据已添加的控制点和由当前鼠标位置作为的一个控制点绘制符号。
     *
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} 鼠标在地图上的当前像素位置
     */
    modifyFeature: function(pixel) {
        //忽略Chrome mouseup触发瞬间 mousemove 产生的相同点
        if (this.lastUp && this.lastUp.equals(pixel)) {
            return true;
        }

        //新建标绘扩展符号
        if(!this.point || !this.plotting) {
            this.createFeature(pixel);
        }

        //修改临时点的位置（鼠标位置）
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        this.point.geometry.x = lonlat.lon;
        this.point.geometry.y = lonlat.lat;

        if(this.isDrawing == true){
            this.addControlPoint(pixel);

            var cp= this.controlPoints;
            //重新设置标绘扩展符号的控制点
            this.plotting.geometry._controlPoints = this.cloneControlPoints(cp);
            //重新计算标绘扩展符号的geometry
            this.plotting.geometry.calculateParts();
        }

        this.callback("modify", [this.point.geometry, this.getSketch(), false]);
        this.point.geometry.clearBounds();
        this.drawFeature();
    },


    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },
    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.map.isIESingleTouch=false;
        this.modifyFeature(evt.xy);
        if(this.persist) {
            this.destroyPersistedFeature();
        }
        this.addControlPoint(evt.xy);
        var len = this.controlPoints.length;
        if(len >= 1) {
            this.isDrawing = true;
        }
        return true;
    },
    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        this.drawComplete();
        this.map.isIESingleTouch=true;
        return false;
    },
    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
        this.lastTouchPx = evt.xy;
        this.modifyFeature(evt.xy);
        return true;
    },
    CLASS_NAME: "OpenLayers.Handler.FreePolygon"
});



///<jscompress sourcefile="GatheringPlace.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/GatheringPlace.js
 */

/**
 * Class: OpenLayers.Handler.GatheringPlace
 * 在地图上绘制聚集地符号的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.GatheringPlace> 构造函数可以创建一个新的绘制聚集地符号的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.GatheringPlace = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.GatheringPlace
     * 构造函数，创建一个新的绘制聚集地符号的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoGatheringPlace
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoGatheringPlace()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },


    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }
            else if(len == 2){
                this.drawComplete();
            }
            return true;
        } else {
            return true;
        }
    },

    CLASS_NAME: "OpenLayers.Handler.GatheringPlace"
});



///<jscompress sourcefile="Lune.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/Polygon/Lune.js
 */

/**
 * Class: OpenLayers.Handler.Lune
 * 在地图上绘制弓形符号的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第三次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.Lune> 构造函数可以创建一个新的绘制弓形符号的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.Lune = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.Lune
     * 构造函数，创建一个新的绘制弓形符号的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoLune
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoLune()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },


    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1 || len == 2){
                this.isDrawing = true;
            }
            else if(len==3)
            {
                this.isDrawing = false;
                this.drawComplete();
            }
            return true;
        } else {
            return true;
        }

    },


    CLASS_NAME: "OpenLayers.Handler.Lune"
});



///<jscompress sourcefile="PolygonEx.js" />
/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Geometry/Polygon/GeoRectangle.js
 */

/**
 * Class: OpenLayers.Handler.PolygonEx
 * 在地图上绘制多边形的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，双击后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.PolygonEx> 构造函数可以创建一个新的绘制多边形的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.PolygonEx = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.PolygonEx
     * 构造函数，创建一个新的绘制多边形的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoPolygonEx
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoPolygonEx()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },


    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len >0){
                this.isDrawing = true;
            }
            else{
                this.isDrawing = false;
                this.controlPoints = [];
                this.plotting = null
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: dblclick
     * Handle double-clicks.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    dblclick: function(evt) {
        this.drawComplete();
        return false;
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if(this.lastTouchPx&&this.passesTolerance(this.lastTouchPx, evt.xy, this.pixelTolerance))
        {
            evt.preventDefault();
            this.drawComplete();
            this.isDrawing = false;
            return false;
        }
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.lastTouchPx = evt.xy;
        return this.down(evt);
    },
    /**
     * APIMethod: down
     * Handle mousedown and touchstart.  Adjust the Geometry and redraw.
     * Return determines whether to propagate the event on the map.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    down: function (evt) {
        this.mouseDown = true;
        this.lastDown = evt.xy;
        this.isDrawing = true;
        if (!this.touch) {
            this.modifyFeature(evt.xy);
        }
        this.stoppedDown = this.stopDown;
        return !this.stopDown;
    },

    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        if(this.isDrawing)
        {
            evt.xy = this.lastTouchPx;
            return this.up(evt);
        }

    },
    CLASS_NAME: "OpenLayers.Handler.PolygonEx"
});



///<jscompress sourcefile="Rectangle.js" />
/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Geometry/Polygon/GeoRectangle.js
 */

/**
 * Class: OpenLayers.Handler.Rectangle
 * 在地图上绘制矩形的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.Rectangle> 构造函数可以创建一个新的绘制矩形的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.Rectangle = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.Rectangle
     * 构造函数，创建一个新的绘制矩形的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoRectangle
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoRectangle()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },


    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }
            else if(len == 2){
                this.drawComplete();
            }
            else{
                this.isDrawing = false;
                this.controlPoints = [];
                this.plotting = null
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.map.isIESingleTouch=false;
        this.modifyFeature(evt.xy);
        if(this.persist) {
            this.destroyPersistedFeature();
        }
        this.addControlPoint(evt.xy);
        var len = this.controlPoints.length;
        if(len >= 1) {
            this.isDrawing = true;
        }
        return true;
    },
    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        this.drawComplete();
        this.map.isIESingleTouch=true;
        return false;
    },
    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
        this.lastTouchPx = evt.xy;
        this.modifyFeature(evt.xy);
        return true;
    },
    CLASS_NAME: "OpenLayers.Handler.Rectangle"
});



///<jscompress sourcefile="RoundedRect.js" />
/**
 * @requires OpenLayers/Handler.js
 * @requires OpenLayers/Geometry/Polygon/GeoRoundedRect.js
 */

/**
 * Class: OpenLayers.Handler.RoundedRect
 * 在地图上绘制圆角矩形的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.RoundedRect> 构造函数可以创建一个新的绘制圆角矩形的事件处理器实例。
 *
* Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 */
OpenLayers.Handler.RoundedRect = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.RoundedRect
     * 构造函数，创建一个新的绘制圆角矩形的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoRoundedRect
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoRoundedRect()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        // ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1){
                this.isDrawing = true;
            }
            else if(len == 2){
                this.drawComplete();
            }
            else{
                this.isDrawing = false;
                this.controlPoints = [];
                this.plotting = null
            }

            return true;
        } else {
            return true;
        }
    },

    /**
     * Method: touchstart
     * Handle touchstart.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchstart: function(evt) {
        if (!this.touch) {
            this.touch = true;
            // unregister mouse listeners
            this.map.events.un({
                mousedown: this.mousedown,
                mouseup: this.mouseup,
                mousemove: this.mousemove,
                click: this.click,
                dblclick: this.dblclick,
                scope: this
            });
        }
        this.map.isIESingleTouch=false;
        this.modifyFeature(evt.xy);
        if(this.persist) {
            this.destroyPersistedFeature();
        }
        this.addControlPoint(evt.xy);
        var len = this.controlPoints.length;
        if(len >= 1) {
            this.isDrawing = true;
        }
        return true;
    },
    /**
     * Method: touchend
     * Handle touchend.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchend: function(evt) {
        this.drawComplete();
        this.map.isIESingleTouch=true;
        return false;
    },
    /**
     * Method: touchmove
     * Handle touchmove.
     *
     * Parameters:
     * evt - {Event} The browser event
     *
     * Returns:
     * {Boolean} Allow event propagation
     */
    touchmove: function(evt) {
        this.lastTouchPx = evt.xy;
        this.modifyFeature(evt.xy);
        return true;
    },
    CLASS_NAME: "OpenLayers.Handler.RoundedRect"
});



///<jscompress sourcefile="Sector.js" />
/**
 * @requires OpenLayers/Handler/Plotting.js
 * @requires OpenLayers/Geometry/Polygon/Geoector.js
 */

/**
 * Class: OpenLayers.Handler.Sector
 * 在地图上绘制扇形符号的事件处理器。
 * 绘制点在激活后显示，随着鼠标移动而移动，在鼠标第一次松开后开始绘制，在鼠标第二次松开后完成绘制。
 * 该处理器会触发标记为"done"、"cancel"和“modify"的事件回调。其中modify回调会在每一次变化时被调用并传入最近一次绘制的点。
 * 使用 <OpenLayers.Handler.Sector> 构造函数可以创建一个新的绘制扇形符号的事件处理器实例。
 *
 * Inherits from:
 *  - <OpenLayers.Handler.Plotting>
 
 */
OpenLayers.Handler.Sector = OpenLayers.Class(OpenLayers.Handler.Plotting, {
    /**
     * Constructor: OpenLayers.Handler.Sector
     * 构造函数，创建一个新的绘制扇形符号的事件处理器。
     *
     * Parameters:
     * control - {<OpenLayers.Control>} 构建当前事件处理器的控件对象。
     * callbacks - {Object} 回调函数对象。关于回调的具体描述参见下文。
     * options - {Object} 一个可选对象，其属性将会赋值到事件处理器对象上。
     *
     * Named callbacks:
     * create - 当要素草图第一次创建的时候调用，回调函数需接收两个参数：当前点几何对象、当前要素。
     * modify - 顶点的每一次变化时调用，回调函数接受参数：几何点对象、当前要素。
     * done - 当绘制点操作完成时调用，回调函数接收一个参数，当前点的几何对象。
     * cancel - 绘制过程中关闭当前事件处理器的监听时调用，回调函数接收当前要素的几何对象作为参数。
     */
    initialize: function(control, callbacks, options) {
        OpenLayers.Handler.Plotting.prototype.initialize.apply(this, arguments);
    },

    /**
     * Method: createFeature
     * create temporary features
     *
     * Parameters:
     * pixel - {<OpenLayers.Pixel>} A pixel location on the map.
     */
    createFeature: function(pixel) {
        var lonlat = this.layer.getLonLatFromViewPortPx(pixel);
        var geometry = new OpenLayers.Geometry.Point(
            lonlat.lon, lonlat.lat
        );
        this.point = new OpenLayers.Feature.Vector(geometry);

        //标绘扩展符号的 Geometry 类型为 GeoSector
        this.plotting = new OpenLayers.Feature.Vector(
            new OpenLayers.Geometry.GeoSector()
        );

        this.callback("create", [this.point.geometry, this.getSketch()]);
        this.point.geometry.clearBounds();
    },

    /**
     * Method: up
     * 操作 mouseup 和 touchend.
     * 发送最后一个 mouseup 点。
     *
     * Parameters:
     * evt - {Event} 浏览器事件，evt.xy 为最后一个 mouseup 的像素位置。
     *
     * Returns:
     * {Boolean} 是否允许事件继续在 map 上传送
     */
    up: function (evt) {
        this.mouseDown = false;
        this.stoppedDown = this.stopDown;

        //ignore double-clicks
        if (this.lastUp && this.lastUp.equals(evt.xy)) {
            return true;
        }

        if (this.lastDown && this.passesTolerance(this.lastDown, evt.xy, this.pixelTolerance)) {
            if (this.touch) {
                this.modifyFeature(evt.xy);
            }
            if(this.persist) {
                this.destroyPersistedFeature();
            }
            this.lastUp = evt.xy;

            this.addControlPoint(evt.xy);
            var len = this.controlPoints.length;
            if(len == 1 || len == 2){
                this.isDrawing = true;
            }
            else if(len==3)
            {
                this.isDrawing = false;
                this.drawComplete();
            }
            return true;
        } else {
            return true;
        }

    },
    
    CLASS_NAME: "OpenLayers.Handler.Sector"
});



