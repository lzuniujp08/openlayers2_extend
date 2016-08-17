OpenLayers.Layer.EchartHeatmapLayer = OpenLayers.Class(OpenLayers.Layer,
    {
        isBaseLayer : false,
        heatmap : null,
        mapLayer : null,
        heatdata : [],
        colors:['green','yellow','orange','red'],
        visible:true,
        evt:null,
        initialize : function (name, map, options)
        {
        	OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);
            var scope = this, heatdiv = $("<div />"), handler;
            $(scope.div).append(heatdiv);
            scope.map = map;
            var w = scope.map.size.w,
            	h = scope.map.size.h;
            scope.heatdiv = heatdiv.css("position","absolute").css("width",w+"px")
        		.css("height",h+"px");
            scope.heatdata = options.heatdata;
            if(options.colors)scope.colors = options.colors;
            scope.opacity = options.opacity?options.opacity:0.6;
            handler = function (e){
            	var zoom = scope.map.getZoom();
                if (scope.heatdata.length > 0&&zoom>11&&scope.visible)
                {
                	$(scope.div).show();
                    scope.updateLayer(e);
                }
                else{
                	$(scope.div).hide();
                }
            };
            handler();
            map.events.register("zoomend", this, handler);
            map.events.register("moveend", this, handler);
        },
        setVisible:function(flag){
        	var scope = this;
        	scope.visible = flag;
        	if(flag&&scope.map.getZoom()>11){
        		$(scope.div).show();
        		scope.updateLayer();
        	}
        	else{
        		$(scope.div).hide();
        	}
        },
        updateLayer : function (e)
        {        	
            var scope = this;
            if(e)scope.evt = e;
            require(
                [
                    'echarts',
                    'echarts/chart/heatmap'
                ],
                function (ec)
            {
               
                var heatD = [];
                var data = scope.heatdata;
                var orgXy, w, h;
                if(scope.evt){
                    orgXy = scope.evt.object.layerContainerOriginPx;

                }
                else{
                    orgXy={x:0,y:0};
                }
                w = scope.map.size.w;
                h = scope.map.size.h;
                scope.heatdiv.css("position","absolute").css("width",w+"px")
                	.css("height",h+"px").css("top",(-orgXy.y)+"px").css("left",(-orgXy.x)+"px");
                for (var i = 0; i < data.length; ++i)
                {
                    var d = data[i];
                    var scrPt = scope.map.getPixelFromLonLat(new OpenLayers.LonLat(d.LON, d.LAT));
                    var x = scrPt.x,
                        y = scrPt.y;
                    heatD.push([
                        x,
                        y,
                        d.COUNT
                    ]);
                }
                var myChart = ec.init(scope.heatdiv[0]);
                var option =
                {
                    series : [
                        {
                            type : 'heatmap',
                            data : heatD,
                            opacity:scope.opacity,
                            gradientColors : [
                                {
                                    offset : 0.4,
                                    color : scope.colors[0]
                                },
                                {
                                    offset : 0.5,
                                    color : scope.colors[1]
                                },
                                {
                                    offset : 0.8,
                                    color : scope.colors[2]
                                },
                                {
                                    offset : 1,
                                    color : scope.colors[3]
                                }
                            ],
                            minAlpha : 0.2,
                            valueScale : 2
                        }
                    ]
                };
                myChart.setOption(option);
            });
        },
        destroy : function ()
        {
            OpenLayers.Layer.Grid.prototype.destroy.apply(this, arguments);
        },
        CLASS_NAME : "OpenLayers.Layer.EchartHeatmapLayer"
    }
);