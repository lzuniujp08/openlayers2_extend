OpenLayers.InfoWindow = OpenLayers.Class(OpenLayers.Popup, {
	
	width:200,
	
	height:100,
	
	title:"详细信息",
	
	content:"",
	
	flag:true,
	
	yoffset:0,

	xoffset:25,
	
    initialize: function(lonlat, options){
    	this.flag = true;
    	this.width = options.width;
    	this.height = options.height;
    	this.title = options.title;
    	this.content = options.content;
    	if(options.type&&options.type==="layer"){
    		this.yoffset = 5;
    	}
    	var size = new OpenLayers.Size(this.width, this.height);
    	var closeBox = this.closeBoxCallback ? true : false;
        OpenLayers.Popup.prototype.initialize.apply(this, [null, lonlat, size, this.content, closeBox, this.closeBoxCallback]);
        this.contentDiv.style.overflow = "hidden";
        this.contentDiv.style.padding = "0px";
    },    
    draw: function(px) {        
        var scope = this;
        var olmap = map;        
        if(!px)px = olmap.getPixelFromLonLat(this.lonlat);
        var originXy = olmap.layerContainerOriginPx;
        var left = px.x-originXy.x-scope.width/2+scope.xoffset,
        	top = px.y-originXy.y-scope.height-scope.yoffset;
        var _dom = $(scope.div).addClass("infowindow")
        	.css("top",top+"px").css("left",left+"px")
        	.css("width",scope.width+"px").css("height",scope.height+"px").css("z-index","650");
        
        var _top = $("<div />").addClass("boxtop");
        var _close = $("<div />").attr("title","关闭").addClass("");
        _top.append($("<p />").append(scope.title).append(_close));
        
        _close.on("click",function(){
        	scope.closeBalloon();
        });
        
        var _content = $("<div/>").addClass("boxcenter").css("height",(scope.height-100)+"px")
        	.append(scope.content.css("max-height",(scope.height-100)+"px").css("overflow-y","auto"));
        
        var _bottom = $("<div />").addClass("boxbottom");
        
        var _condiv = _dom[0].children[0];        
        _condiv = _condiv.children[0];
        
        $(_condiv).html("").append(_top).append(_content).append(_bottom);
        
    	olmap.events.register("zoomend", scope, function(){
    		if(scope.flag){	    	
	    		var _px = olmap.getPixelFromLonLat(scope.lonlat);
	    		var originXy = olmap.layerContainerOriginPx;
	            var _left = _px.x-originXy.x-scope.width/2+scope.xoffset,
	            	_top = _px.y-originXy.y-scope.height-scope.yoffset;
	    		$(scope.div).css("top",_top+"px").css("left",_left+"px");
	    		scope.show();
    		} 	
    	});
        return this.div;
    },
    /**
     * 关闭气泡
     */
    closeBalloon: function(){
    	this.flag = false;
    	this.hide();
		if(this.closeBoxCallback != null && this.closeBoxCallback != undefined){
			this.closeBoxCallback();
		}
    },
    
    
    CLASS_NAME: "OpenLayers.InfoWindow"
});