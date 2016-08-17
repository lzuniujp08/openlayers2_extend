OpenLayers.Layer.EchartHeatmap = OpenLayers.Class(OpenLayers.Layer,
    {
        isBaseLayer : false,
        heatmap : null,
        mapLayer : null,
        heatdata : [],
        initialize : function (name, map, options)
        {
            var scope = this, heatdiv = document.createElement("div"), handler;
            
            OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);
            
            heatdiv.style.cssText = "position:absolute;width:" + map.size.w + "px;height:" 
                + map.size.h + "px;";
            this.div.appendChild(heatdiv);
            this.map = map;
            this.heatdiv = heatdiv;
            this.heatdata = options.heatdata;
            this.opacity = options.opacity;
            handler = function (e)
            {
                if (scope.heatdata.length > 0)
                {
                    scope.updateLayer(e);
                }
            };
            handler();
            map.events.register("zoomend", this, handler);
            map.events.register("moveend", this, handler);
        },
        updateLayer : function (e)
        {
            var scope = this;
            require(
                [
                    'echarts',
                    'echarts/chart/heatmap'
                ],
                function (ec)
            {
                var myChart = ec.init(scope.heatdiv);
                var heatD = [];
                var data = scope.heatdata;
                var orgXy, w, h;
                if(e){
                    orgXy = e.object.layerContainerOriginPx;

                }
                else{
                    orgXy={x:0,y:0};
                }
                console.log(orgXy);
                w = scope.map.size.w;
                h = scope.map.size.h;
                scope.heatdiv.style.cssText = "position:absolute;top:"+(-orgXy.y)+"px;left:"+(-orgXy.x)+
                    "px;width:" + w + "px;height:" + h + "px;";
                for (var i = 0; i < data.length; ++i)
                {
                    var d = data[i];
                    var scrPt = scope.map.getPixelFromLonLat(new OpenLayers.LonLat(d.lon, d.lat));
                    var x = scrPt.x,
                        y = scrPt.y;
                    heatD.push([
                        x,
                        y,
                        d.count
                    ]);
                }
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
                                    color : 'green'
                                },
                                {
                                    offset : 0.5,
                                    color : 'yellow'
                                },
                                {
                                    offset : 0.8,
                                    color : 'orange'
                                },
                                {
                                    offset : 1,
                                    color : 'red'
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
        CLASS_NAME : "OpenLayers.Layer.EchartHeatmap"
    }
);