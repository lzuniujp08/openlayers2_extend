/**
 * @requires OpenLayers/Geometry/Collection.js
 * @requires OpenLayers/Geometry/LinearRing.js
 * @requires OpenLayers.Geometry.Point.js
 * @requires OpenLayers.Geometry.Polygon.js
 * @requires OpenLayers.Geometry.GeoPlotting
 */

/**
 *
 * Class: OpenLayers.Geometry.GeoCircle
 * 圆。
 * 使用圆心和圆上一点绘制出一个圆
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.GeoPlotting>
 */
OpenLayers.Geometry.GeoCircle = OpenLayers.Class(
    OpenLayers.Geometry.GeoPlotting, {
        /**
         * Constructor: OpenLayers.Geometry.GeoCircle
         * 构造函数
         *
         * Parameters:
         * points - {Array(<OpenLayers.Geometry.Point>)} 需要传入的控制点（理论上应该是两个），默认为null
         */
        initialize: function(points) {
            OpenLayers.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号圆对象转换为json数据（只解析控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function(){
            return OpenLayers.Geometry.GeoPlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function(){
            var geoCircle =new OpenLayers.Geometry.GeoCircle();
            var controlPoints = [];
            //这里只需要赋值控制点
            for(var i = 0, len = this._controlPoints.length; i<len; i++)
            {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoCircle._controlPoints = controlPoints;
            return geoCircle;
        },

        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 用于通过中点和边缘点计算圆的边缘360个点，组成一个圆
         */
        calculateParts: function(){
            //清空原有的所有点
            this.components = [];
            //至少需要两个控制点
            if(this._controlPoints.length>1)
            {
                //取第一个作为中心点
                var centerPoint = this._controlPoints[0];
                //取最后一个作为半径控制点
                var radiusPoint = this._controlPoints[this._controlPoints.length-1];
                var points = [];
                //计算圆的半径
                var radius = Math.sqrt((radiusPoint.x - centerPoint.x) * (radiusPoint.x - centerPoint.x) +
                (radiusPoint.y - centerPoint.y) * (radiusPoint.y - centerPoint.y));
                //计算圆的边缘所有点
                for(var i = 0; i < 360; i++)
                {
                    var radians = (i + 1) * Math.PI / 180;
                    var circlePoint = new OpenLayers.Geometry.Point(Math.cos(radians) * radius + centerPoint.x, Math.sin(radians) * radius + centerPoint.y);
                    points[i] = circlePoint;
                }
                //设置点集
                this.components.push(new OpenLayers.Geometry.LinearRing(points));
            }
        },

        CLASS_NAME: "OpenLayers.Geometry.GeoCircle"
    }
);

/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoCircle 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<OpenLayers.Geometry.GeoCircle>} 返回的 GeoCircle 对象。
 */
OpenLayers.Geometry.GeoCircle.fromJSON = function(str){
    var geoCircle = new OpenLayers.Geometry.GeoCircle();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = OpenLayers.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    geoCircle._controlPoints = arr;
    return geoCircle;
};