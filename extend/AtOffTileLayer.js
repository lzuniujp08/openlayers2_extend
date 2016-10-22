OpenLayers.Layer.AtOffTileLayer = OpenLayers.Class(OpenLayers.Layer.XYZ, {
    url: null,
    tileSize: new OpenLayers.Size(256, 256),
    type: 'png',
    useScales: false,
    overrideDPI: false,
    layerName:"",
	type:"file",//file,文件形式；dbfile，打包形式
	tileOrigin:{
		lon:-180,
		lat:-90
	},
    initialize: function(name, url, options) { 
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this, arguments);
    },
    getURL: function (bounds) {
        var res = this.getResolution();
        var originTileX = (this.tileOrigin.lon + (res * this.tileSize.w/2));
        var originTileY = (this.tileOrigin.lat - (res * this.tileSize.h/2));
        var center = bounds.getCenterLonLat();
        var x = (Math.round(Math.abs((center.lon - originTileX) / (res * this.tileSize.w))));
        var y = (Math.round(Math.abs((originTileY - center.lat) / (res * this.tileSize.h))));
        var z = this.map.getZoom();
        var url = this.url;
		if(this.type==="file"){
			url = url + '/${layer}/${z}/${x}/${y}.png';
		}
		else{
			url = url + '?request=gettile&layername=${layer}&z=${z}&x=${x}&y=${y}';
		}		
        url = OpenLayers.String.format(url, {'layer':this.layerName,'x': x, 'y': y-1, 'z': z});
        return OpenLayers.Util.urlAppend(
            url, OpenLayers.Util.getParameterString(this.params)
        );
    },
    CLASS_NAME: 'OpenLayers.Layer.AtOffTileLayer'
});