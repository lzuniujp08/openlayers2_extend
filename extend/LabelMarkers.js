OpenLayers.Layer.LabelMarkers = OpenLayers.Class(OpenLayers.Layer, {
    isBaseLayer: false,
    markers: null,
    drawn: false,
    initialize: function(name, options) {
        OpenLayers.Layer.prototype.initialize.apply(this, arguments);
        this.markers = [];
    },
    destroy: function() {
        this.clearMarkers();
        this.markers = null;
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },
    setOpacity: function(opacity) {
        if (opacity != this.opacity) {
            this.opacity = opacity;
            for (var i=0, len=this.markers.length; i<len; i++) {
                this.markers[i].setOpacity(this.opacity);
            }
        }
    },
    moveTo:function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        if (zoomChanged || !this.drawn) {
            for(var i=0, len=this.markers.length; i<len; i++) {
                this.drawMarker(this.markers[i]);
            }
            this.drawn = true;
        }
    },
    addMarker: function(marker) {
        this.markers.push(marker);
        if (this.opacity < 1) {
            marker.setOpacity(this.opacity);
        }

        if (this.map && this.map.getExtent()) {
            marker.map = this.map;
            this.drawMarker(marker);
        }
    },
    removeMarker: function(marker) {
        if (this.markers && this.markers.length) {
            OpenLayers.Util.removeItem(this.markers, marker);
            marker.erase();
        }
    },
    clearMarkers: function() {
        if (this.markers != null) {
            while(this.markers.length > 0) {
                this.removeMarker(this.markers[0]);
            }
        }
    },
    drawMarker: function(marker) {
        var px = this.map.getLayerPxFromLonLat(marker.lonlat);
        if (px == null) {
            marker.display(false);
        } else {
            if (!marker.isDrawn()) {
                var markerId = marker.attr.id+1;
                var markerLabel = $("<a />").addClass("marker-label").html(markerId);
                var markerImg = marker.draw(px);               
                $(this.div).append($(markerImg).append(markerLabel));
            } else if(marker.icon) {
                marker.icon.moveTo(px);
            }
        }
    },
    getDataExtent: function () {
        var maxExtent = null;        
        if ( this.markers && (this.markers.length > 0)) {
            var maxExtent = new OpenLayers.Bounds();
            for(var i=0, len=this.markers.length; i<len; i++) {
                var marker = this.markers[i];
                maxExtent.extend(marker.lonlat);
            }
        }

        return maxExtent;
    },
    highMarkerById:function(id){
        $(".highlight-label").remove();
        var scope = this;
        var markers = this.markers;
        for(var i=0,len = markers.length;i<len;i++){
            var marker = markers[i];
            var attr = marker.attr;
            var iconDiv = marker.icon.imageDiv;
            var iconImg = $(iconDiv).find("img")[0];
            if(marker.attr.id===id){
                $(iconImg).attr("src","extend/style/blue.png");
                var lonlat = new OpenLayers.LonLat(attr.x, attr.y);
                var scrPt = scope.map.getLayerPxFromLonLat(lonlat);
                var labelDiv = $("<div/>").addClass("highlight-label").css("top",(scrPt.y+20)+"px")
                    .css("left",(scrPt.x+20)+"px").html(attr.name);
                $(scope.div).append(labelDiv)
            }
            else{
                $(iconImg).attr("src","extend/style/red.png");
            }
        }
        this.redraw();
    },
    getMarkerById:function(id){
        var _marker;
        var markers = this.markers;
        for(var i=0,len = markers.length;i<len;i++){
            var marker = markers[i];
            if(marker.attr.id===id){
                _marker = marker;
                break;
            }
        }
        return _marker;
    },
    CLASS_NAME: "OpenLayers.Layer.LabelMarkers"
});
