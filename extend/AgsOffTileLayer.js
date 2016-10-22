OpenLayers.Layer.AgsTileLayer = OpenLayers.Class(OpenLayers.Layer.XYZ, {
    url: null,
    tileOrigin: null,
    tileSize: new OpenLayers.Size(256, 256),
    type: 'png',
    useScales: false,
    overrideDPI: false,
    useArcgisServer:false,
    cachetype:"file",//file为紧凑型，image为松散型
    initialize: function(name, url, options) { 
        OpenLayers.Layer.XYZ.prototype.initialize.apply(this, arguments);
    },
    getURL: function (bounds) {
        var res = this.getResolution();
        var originTileX = (this.tileOrigin.lon + (res * this.tileSize.w/2));
        var originTileY = (this.tileOrigin.lat - (res * this.tileSize.h/2));
        var center = bounds.getCenterLonLat();
        var y = (Math.round(Math.abs((center.lon - originTileX) / (res * this.tileSize.w))));
        var x = (Math.round(Math.abs((originTileY - center.lat) / (res * this.tileSize.h))));
        var z = this.map.getZoom();
        var url = this.url;
        var s = '' + x + y + z;
        if (OpenLayers.Util.isArray(url)) {
            url = this.selectUrl(s, url);
        }
        url = url + '?layer=${layer}&type=${type}&x=${x}&y=${y}&z=${z}';
        url = OpenLayers.String.format(url, {'layer': this.name,'type': this.cachetype,'x': x, 'y': y, 'z': z});
        return OpenLayers.Util.urlAppend(
            url, OpenLayers.Util.getParameterString(this.params)
        );
    },

    CLASS_NAME: 'OpenLayers.Layer.AgsTileLayer'
}); 
