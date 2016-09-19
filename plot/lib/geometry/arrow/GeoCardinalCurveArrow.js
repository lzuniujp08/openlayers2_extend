/**
 * @requires OpenLayers.Geometry.Point
 * @requires OpenLayers.Geometry.GeoMultiLinePlotting
 */

/**
 *
 * Class: OpenLayers.Geometry.GeoCardinalCurveArrow
 * Cardinal曲线箭头。
 * 使用三个或三个以上控制点直接创建Cardinal曲线箭头。
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.GeoMultiLinePlotting>
 */
OpenLayers.Geometry.GeoCardinalCurveArrow = OpenLayers.Class(
    OpenLayers.Geometry.GeoMultiLinePlotting, {

        /**
         * Constructor: OpenLayers.Geometry.GeoCardinalCurveArrow
         * 构造函数
         *
         * Parameters:
         * points - {Array(<OpenLayers.Geometry.Point>)} 需要传入的控制点（三个或三个以上），默认为null
         */
        initialize: function (points) {
            OpenLayers.Geometry.GeoMultiLinePlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号Cardinal曲线箭头对象转换为json数据（只解析了控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function () {
            return OpenLayers.Geometry.GeoMultiLinePlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function () {
            var geometry = new OpenLayers.Geometry.GeoCardinalCurveArrow();
            var controlPoints = [];
            //这里只需要赋值控制点
            for (var i = 0, len = this._controlPoints.length; i < len; i++) {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geometry._controlPoints = controlPoints;
            return geometry;
        },
        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过控制点计算Cardinal曲线箭头的所有点
         */
        calculateParts: function () {
            var controlPoints = this.cloneControlPoints(this._controlPoints);
            //清空原有的所有线
            this.components = [];
            var  multiLines=[];
            //两个控制点时，绘制直线
            if (controlPoints.length==2) {
                var startP=controlPoints[0];
                var endP=controlPoints[1];
                //直线
                var curveLine=new OpenLayers.Geometry.LineString([startP,endP]);
                //箭头
                var arrowLines=this.calculateArrowLines(startP,endP,10);
                multiLines.push(curveLine,arrowLines[0],arrowLines[1]);
                this.components=multiLines;
            }

            else if (controlPoints.length >2) {
                //曲线
                var cardinalPoints = OpenLayers.Geometry.LineString.calculateCardinalPoints(controlPoints);
                var cardinalCurveN = OpenLayers.Geometry.LineString.createBezierN(cardinalPoints);

                var startP=cardinalPoints[cardinalPoints.length-2];
                var endP=cardinalPoints[cardinalPoints.length-1];
                //箭头
                var arrowLines=this.calculateArrowLines(startP,endP,2);
                multiLines.push(cardinalCurveN,arrowLines[0],arrowLines[1]);
                this.components=multiLines;
            }

        },


        CLASS_NAME: "OpenLayers.Geometry.GeoCardinalCurveArrow"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoCardinalCurveArrow 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<OpenLayers.Geometry.GeoCardinalCurveArrow>} 返回的 GeoCardinalCurveArrow 对象。
 */
OpenLayers.Geometry.GeoCardinalCurveArrow.fromJSON = function (str) {
    var geoPolyline = new OpenLayers.Geometry.GeoCardinalCurveArrow();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = OpenLayers.Geometry.GeoLinePlotting.getControlPointsFromJSON(s);
    geoPolyline._controlPoints = arr;
    return geoPolyline;
};