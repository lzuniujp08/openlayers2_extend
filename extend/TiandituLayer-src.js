OpenLayers.Layer.TiandituLayer = OpenLayers.Class(OpenLayers.Layer.Grid,{
	mapType : null,
	mirrorUrls : null,
	topLevel : null,
	bottomLevel : null,
	
	//用于标识是本地天地图切片库还是访问在线天地图
	isOnline:true,

	topLevelIndex : 0,
	bottomLevelIndex : 20,
	topTileFromX : -180,
	topTileFromY : 90,
	topTileToX : 180,
	topTileToY : -270,

	isBaseLayer : true,

	initialize : function(name, url, options) {
		options.topLevel = options.topLevel ? options.topLevel
				: this.topLevelIndex;
		options.bottomLevel = options.bottomLevel ? options.bottomLevel
				: this.bottomLevelIndex;
		options.maxResolution = this
				.getResolutionForLevel(options.topLevel);
		options.minResolution = this
				.getResolutionForLevel(options.bottomLevel);
		var newArguments = [ name, url, {}, options ];
		OpenLayers.Layer.Grid.prototype.initialize.apply(this,
				newArguments);
	},

	clone : function(obj) {

		if (obj == null) {
			obj = new OpenLayers.Layer.TiandituLayer(this.name,
					this.url, this.options);
		}

		obj = OpenLayers.Layer.Grid.prototype.clone
				.apply(this, [ obj ]);

		return obj;
	},

	getURL : function(bounds) {
		var level = this.getLevelForResolution(this.map.getResolution());
		var coef = 360 / Math.pow(2, level);
		var x_num = this.topTileFromX < this.topTileToX ? Math
				.round((bounds.left - this.topTileFromX) / coef) : Math
				.round((this.topTileFromX - bounds.right) / coef);
		var y_num = this.topTileFromY < this.topTileToY ? Math
				.round((bounds.bottom - this.topTileFromY) / coef)
				: Math.round((this.topTileFromY - bounds.top) / coef);

		var type = this.mapType;
		var url = this.url;
		if (this.mirrorUrls != null) {
			url = this.selectUrl(x_num, this.mirrorUrls);
		}
		return this.getFullRequestString({
			T : type,
			X : x_num,
			Y : y_num,
			L : level
		}, url);
	},
	getFullRequestString: function(params, url){
		url = url+'?T='+params.T+'&L='+params.L+'&X='+params.X+'&Y='+params.Y;
		return url;
	},
	selectUrl : function(a, b) {
		return b[a % b.length]
	},
	getLevelForResolution : function(res) {
		var ratio = this.getMaxResolution() / res;
		if (ratio < 1)
			return 0;
		for ( var level = 0; ratio / 2 >= 1;) {
			level++;
			ratio /= 2;
		}
		return level;
	},
	getResolutionForLevel : function(level) {
		return 360 / 256 / Math.pow(2, level);
	},
	getMaxResolution : function() {
		return this.getResolutionForLevel(this.topLevelIndex)
	},
	getMinResolution : function() {
		return this.getResolutionForLevel(this.bottomLevelIndex)
	},
	CLASS_NAME : "OpenLayers.Layer.TiandituLayer"
}); 
