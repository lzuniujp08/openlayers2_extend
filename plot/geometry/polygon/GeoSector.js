/**
 * @requires OpenLayers/Geometry/Collection.js
 * @requires OpenLayers/Geometry/LinearRing.js
 * @requires OpenLayers.Geometry.Point.js
 * @requires OpenLayers.Geometry.Polygon.js
 * @requires OpenLayers.Geometry.GeoSector
 */

/**
 *
 * Class: OpenLayers.Geometry.GeoSector
 * 扇形。
 * 使用圆心和圆上两点绘制出一个扇形
 *
 * Inherits from:
 *  - <OpenLayers.Geometry.GeoPlotting>
 */
OpenLayers.Geometry.GeoSector = OpenLayers.Class(
    OpenLayers.Geometry.GeoPlotting, {
        /**
         * APIProperty: direction
         * 扇形的绘制方向，顺时针绘制（值为1），或逆时针绘制（值为-1）。默认为-1，即逆时针绘制。
         */
        direction:-1,
        /**
         * Constructor: OpenLayers.Geometry.GeoSector
         * 构造函数
         *
         * Parameters:
         * points - {Array(<OpenLayers.Geometry.Point>)} 需要传入的控制点（理论上应该是两个），默认为null
         */
        initialize: function (points) {
            OpenLayers.Geometry.GeoPlotting.prototype.initialize.apply(this, arguments);
        },

        /**
         * APIMethod: toJSON
         * 将军标符号扇形对象转换为json数据（只解析控制点）
         *
         * Returns:
         * {String} 返回的字符串。
         */
        toJSON: function () {
            return OpenLayers.Geometry.GeoPlotting.prototype.toJSON.apply(this, arguments);
        },

        /**
         * APIMethod: clone
         * 重写clone方法，必须深赋值
         *
         * Returns:
         * {String} 返回几何对象。
         */
        clone: function () {
            var geoCircle = new OpenLayers.Geometry.GeoSector();
            var controlPoints = [];
            //这里只需要赋值控制点
            for (var i = 0, len = this._controlPoints.length; i < len; i++) {
                //这里必须深赋值，不然在编辑时由于引用的问题出现错误
                controlPoints.push(this._controlPoints[i].clone());
            }
            geoCircle._controlPoints = controlPoints;
            return geoCircle;
        },

        /**
         * Method: calculateParts
         * 重写了父类的方法
         * 绘制的第一个点为扇形的圆心，第二点与第三点为扇形圆弧上的点
         */
        calculateParts: function () {
            var controlPoints = this.cloneControlPoints(this._controlPoints);
            //清空原有的所有点
            this.components = [];

            //两个点时绘制直线
            if (controlPoints.length ==2) {
                var pointA=controlPoints[0];
                var pointB=controlPoints[1];
                this.components.push(new OpenLayers.Geometry.LinearRing([pointA,pointB]));
            }
            //至少需要三个控制点
            if (controlPoints.length > 2) {
                //取第一个点为圆心
                var centerPoint = controlPoints[0];
                //第二个点确定半径，为圆上一点
                var pointR = controlPoints[1];
                //最后一个点为圆上一点
                var pointC=controlPoints[controlPoints.length-1];
                //计算圆弧的半径
                var radius = this.calculateDistance(centerPoint, pointR);
                //分别计算圆上的两点所在的直径线与X轴的夹角
                var angleR=this.calculateAngle(pointR,centerPoint);
                var angleC=this.calculateAngle(pointC,centerPoint);
                //逆时针绘制
                if(this.direction==1&&angleC<angleR)   angleC=2*Math.PI+angleC;
                //顺时针绘制
                if(this.direction==-1&&angleC>angleR)   angleC=-(2*Math.PI-angleC);
                var points=this.calculateArc(centerPoint,radius,angleR,angleC,this.direction);
                points.unshift(centerPoint);
                this.components.push(new OpenLayers.Geometry.LinearRing(points));
            }
        },
        /**
         * Method: calculateAngle
         * 计算圆上一点所在半径的直线与X轴的夹角，结果以弧度形式表示，范围是+π到 +2π。
         */
        calculateAngle: function (pointA, centerPoint) {
            var angle=Math.atan2((pointA.y-centerPoint.y),(pointA.x-centerPoint.x));
            if(angle<0){angle+=2*Math.PI;}
            return angle;
        },
        
        calculateDistance:function (pointA, pointB) {
	        var distance =Math.sqrt(Math.pow(pointA.x - pointB.x, 2) + Math.pow(pointA.y - pointB.y, 2));
	        return distance;
	
	    },
	    calculateArc:function (center,radius, startAngle,endAngle,direction,sides){
            if(!direction ||(direction!=1 && direction!=-1)) direction=-1;
            if(!sides) sides=360;
            var step=Math.PI/sides/2;
            var stepDir= step*direction;
            var length=Math.abs(endAngle-startAngle);
            var points=[];
            for(var radians =startAngle,i = 0; i <length;i+=step)
            {
                var circlePoint = new OpenLayers.Geometry.Point(Math.cos(radians) * radius + center.x, Math.sin(radians) * radius + center.y);
                points.push(circlePoint);
                radians+=stepDir;
                radians=radians<0?(radians+2*Math.PI):radians;
                radians=radians> 2*Math.PI?(radians-2*Math.PI):radians;
            }
           return points;
        },

        CLASS_NAME: "OpenLayers.Geometry.GeoSector"
    }
);


/**
 * APIMethod: fromJSON
 * 根据json数据转换为 GeoSector 对象
 *
 * Parameters:
 * str - {String} json数据
 *
 * Returns:
 * {<OpenLayers.Geometry.GeoSector>} 返回的 GeoSector 对象。
 */
OpenLayers.Geometry.GeoSector.fromJSON = function (str) {
    var geoCircle = new OpenLayers.Geometry.GeoSector();
    //匹配控制点的数据
    //取第二个代表获取括号内匹配的
    var s = str.match(/"controlPoints":(\[.*?\])/)[1];
    var arr = OpenLayers.Geometry.GeoPlotting.getControlPointsFromJSON(s);
    geoCircle._controlPoints = arr;
    return geoCircle;
};