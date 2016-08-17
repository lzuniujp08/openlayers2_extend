//==============================================================================
// 21AT-WebGIS平台客户端程序，版权所有，二十一世纪空间技术应用股份有限公司，2000-2009。
// 作者：21AT-WebGIS平台开发组 
// 修改：	 
// 文件名：LabelLayer.js  
// 功能：文本标签图层
// 最后修改时间：	2009-05-06
//==============================================================================

/**
 * @requires OpenLayers/Layer.js
 */

/**
 * Class: OpenLayers.Layer.Labels
 * 标签图层，用于显示文本标签
 *  
 * 继承自:
 *  - <OpenLayers.Layer> 
 */
OpenLayers.Layer.Labels = OpenLayers.Class(OpenLayers.Layer, {
    
    /** 
     * APIProperty: isBaseLayer 
     * {Boolean} 是否为基础图层.
     */
    isBaseLayer: false,
    
    /** 
     * Property: Labels 
     * {Array(<OpenLayers.Label>)} 标签对象集合 
     */
    labels: null,

    maxZoom:null,
    minZoom:null,
    /** 
     * Property: drawn 
     * {Boolean} 图层是否已完成绘制.
     */
    drawn: false,
    
    /** 
     * Property: drawn 
     * {String} 标签图层风格.
     */
    className : null,
    
    /**
     * Constructor: OpenLayers.Layer.Labels 
     * 创建标签图层.
     *
     * Parameters:
     * name - {String} 
     * className - {String} 
     * options - {Object} 
     */
    initialize: function(name, className, options) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
        this.className = className; 
        this.labels = [];

    },
    /**
     * Method: refreshLayerByZoom 
     * 根据zoom的状态变化刷新显示
     */
    refreshLayerByZoom: function() {
    	if(this.map){
    	var curZoom = this.map.getZoom();
    	for(var i in this.labels){
    		if(this.minzom!=null&&this.maxZoom!=null)
				if(curZoom>=this.minZoom&&curZoom<=this.maxZoom)
				{
					 this.labels[i].display(true);
				}
				else
				{
					 this.labels[i].display(false);
					
				}
			}
    	}
    },
    /**
     * Method: destroy 
     */
    destroy: function() {
        this.clear();
        this.labels = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },

    /** 
     * Method: moveTo
     * 移动标签图层
     *
     * Parameters:
     * bounds - {<OpenLayers.Bounds>} 
     * zoomChanged - {Boolean} 
     * dragging - {Boolean} 
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        if (zoomChanged || !this.drawn) {
            for(var i=0, len=this.labels.length; i<len; i++) {
                this.draw(this.labels[i]);
            }
            this.drawn = true;
        }
    },

    /**
     * Method: add
     * 添加标签到图层
     *
     * Parameters:
     * label - {<OpenLayers.Label>} 
     */
    add: function(label) {
        this.labels.push(label);
        
        if (this.map && this.map.getExtent()) {
            label.map = this.map;
            this.draw(label);
        }
    },

    /**
     * Method: remove
     * 从图层中移除标签
     *
     * Parameters:
     * label - {<OpenLayers.Label>} 
     */
    remove: function(label) {
        if (this.labels && this.labels.length) {
            OpenLayers.Util.removeItem(this.labels, label);
            if ((label.labelDiv != null) &&
                (label.labelDiv.parentNode == this.div) ) {
                label.labelDiv.className = this.className;
                this.div.removeChild(label.labelDiv);    
                label.drawn = false;
            }
        }
    },

    /**
     * Method: clear
     * 清除所有标签
     */
    clear: function() {
        if (this.labels != null) {
            while(this.labels.length > 0) {
                this.remove(this.labels[0]);
            }
        }
    },

    /** 
     * Method: draw
     * 绘制标签对象
     *
     * Parameters:
     * label - {<OpenLayers.Label>} 
     */
    draw: function(label) {
         //监听zoomend事件
         this.map.events.register("zoomend", this, this.refreshLayerByZoom);
        var px = this.map.getLayerPxFromLonLat(label.lonlat);
        //alert(px.x);
        if (px == null) {
            label.display(false);
        } else {
            var labelDiv = label.draw(px);
            if (!label.drawn) {
                this.div.appendChild(labelDiv);
                label.drawn = true;
            }
        }
    },
    
    /** 
     * Method: getDataExtent
     * 计算所有标签的最大外包矩形.
     * 
     * Returns:
     * {<OpenLayers.Bounds>}
     */
    getDataExtent: function () {
        var maxExtent = null;
        
        if ( this.labels && (this.labels.length > 0)) {
            var maxExtent = new OpenLayers.Bounds();
            for(var i=0, len=this.labels.length; i<len; i++) {
                var label = this.labels[i];
                maxExtent.extend(label.lonlat);
            }
        }

        return maxExtent;
    },

    CLASS_NAME: "OpenLayers.Layer.Labels"
});



/**
 * Class: OpenLayers.Labels
 * 标签对象，含位置信息的文本标签
 *  
 */
OpenLayers.Label = OpenLayers.Class({
    /** 
    * Property: offset
    * {pixel} 
    */
    offset: null,
    /** 
     * Property: lable 
     * {HTML} 标签内容
     */
    lable: null,

    /** 
     * Property: lonlat 
     * {<OpenLayers.LonLat>} 标签位置
     */
    lonlat: null,
    
    /** 
     * Property: labelDiv 
     * {DOMElement} 标签容器
     */
    labelDiv: null,
        
    /** 
     * Property: map 
     * {<OpenLayers.Map>} 标签所属的地图对象
     */
    map: null,
    /** 
     * Property: map 
     * {<OpenLayers.Map>} 标签所属的地图对象
     */
    alwaysleft: false,
    /** 
     * Constructor: OpenLayers.Label
     * Parameters:
     * lonlat - {<OpenLayers.LonLat>} 标签位置
     * lable - {HTML}  标签内容
     * className - {String}  风格名称
     */
    initialize: function(lonlat, lable, className) {
        this.lonlat = lonlat ? lonlat : new OpenLayers.LonLat(0,0);        
        this.lable = (lable) ? lable : " ";
        
        var id = OpenLayers.Util.createUniqueID("OL_Label_");
        this.labelDiv = OpenLayers.Util.createAlphaImageDiv(id);
        this.labelDiv.innerHTML = this.lable;
        this.labelDiv.className = className;
    },
    
    /**
     * Method: destroy
     * 销毁标签对象
     */
    destroy: function() {
        this.map = null;

        if (this.labelDiv != null) {            
		        this.labelDiv.innerHTML = "";
		        this.labelDiv = null;
        }
    },
    
		/** 
		 * Method: draw
		 * 
		 * Parameters:
		 * px - {<OpenLayers.Pixel>}
		 * 
		 * Returns:
		 * {DOMElement} 标签容器
		 */
    draw: function(px) {
        this.moveTo(px);
        return this.labelDiv;
    }, 

   /**
    * Method: moveTo
    * 重定位标签.
    *
    * Parameters:
    * px - {<OpenLayers.Pixel>} 标签的新位置
    */
    moveTo: function (px) {
    	var offsetPx=px; 
    	if(this.offset){
    	  	offsetPx = offsetPx.offset(this.offset);
    	}
  		var extent = this.map.getExtent();
  		var maxlonlat = new OpenLayers.LonLat(extent.right, extent.top);
  		var x = this.map.getViewPortPxFromLonLat(maxlonlat).x;
  		
  		var lablex = this.map.getViewPortPxFromLonLat(this.lonlat).x;
  		
  		var self = this;
  		var length = function(){
  			return self.lable.length * 9;
  		}
  		
        if ((offsetPx != null) && (this.labelDiv != null)) {
           //OpenLayers.Util.modifyAlphaImageDiv(this.labelDiv, null, px);
           //OpenLayers.Util.modifyDOMElement(element, id, px, sz, position,border, overflow, opacity)
           //OpenLayers.Util.modifyDOMElement(this.labelDiv, null, offsetPx, null, null,null, null, null);
        	this.labelDiv.style.top = offsetPx.y + "px";
	  		if(x - lablex < length() && !this.alwaysleft){
	  			if(this.offset){
	  				offsetPx = offsetPx.add(-2*this.offset.x,0);
	  			}
	  			this.labelDiv.style.right = -offsetPx.x+length() + "px";
	  			this.labelDiv.style.left = "";
	  		}else{
	  			this.labelDiv.style.left = offsetPx.x + "px";
	  			this.labelDiv.style.right = "";
	  		}
        }
    },
    
    /** 
		 * Method: draw
		 * 刷新标签		 
		 * 
		 * Parameters:
		 * lonlat - {<OpenLayers.LonLat>} 标签位置
		 * lable - {HTML} 标签内容
		 * 
		 * Returns:
		 * {DOMElement} 标签容器
		 */
    redraw: function (lonlat,lable) {
    	var px = this.map.getLayerPxFromLonLat(lonlat);
    	
    	this.moveTo(px);
    	//alert()
    	this.setLabel(lable);
    	
    },
    
    /** 
     * Method: setLabel
     * 重设标签内容
     * 
     * Parameters:
     * label - {HTML} 标签内容
     */
    setLabel: function(label){
    	//alert(label)
    	if (this.labelDiv != null) {
    		this.labelDiv.innerHTML = label;
    		this.label = label;
    	}
    },    
    
    /** 
     * Method: display
     * 显示或隐藏标签
     * 
     * Parameters:
     * display - {Boolean} 
     */
    display: function(display) {
       this.labelDiv.style.display = (display) ? "" : "none"; 
    },

    CLASS_NAME: "OpenLayers.Label"
});