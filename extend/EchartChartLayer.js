OpenLayers.Layer.EchartChartLayer = OpenLayers.Class(
    {
        isBaseLayer : false,
		chartdata:[],
		charttype:"",
		map:null,
		flag:true,
        initialize : function (name, map, options)
        {
            var scope = this;            
            scope.map = map;
            scope.chartdata = options.data;
            scope.charttype = options.type;
            handler = function ()
            {
            	if(scope.flag){
            		scope.addChart2Layer();
            	}
            };            
            scope.map.events.register("zoomend", scope.map, handler);
        },
		init:function(){
			this.addChart2Layer();
		},
        addChart2Layer : function ()
        {
            var scope = this;
            $(".olPopup").remove();
			for(var i=0,len=scope.chartdata.length;i<len;i++){
				var d = scope.chartdata[i];
				scope.addChart(d);
			}  	 
        },
		addChart: function(data){
			$("#chart"+data.id).remove();
			var scope = this;
			require(
            [
                'echarts',
                'echarts/chart/pie',
				'echarts/chart/bar'
            ],
            function (ec)
            {                
                var xsize = 0,ysize = 0;
                if(scope.charttype==="pie"){
                	var size=45+data.count/scope.map.getResolution()/18;
                	xsize = size;
                	ysize = size;
                }
                else{
                	var size=10+data.count/scope.map.getResolution()/55;
                	xsize = size*0.8;
                	ysize = size;
                }
				var domid = "chart"+data.id;
				var content = "<div class='mapchart-echart' id='"+domid+"'></div>";
                var popup = new OpenLayers.Popup(domid,
                        new OpenLayers.LonLat(data.lon,data.lat),
                        new OpenLayers.Size(xsize,ysize),
                        content,
                        false);
                popup.setBackgroundColor("transparent");
                popup.setBorder("0px #0066ff solid");
                popup.keepInMap = false;
                scope.map.addPopup(popup,false);
				var pop = $(popup.div);
				var top = pop.position().top,
                       left = pop.position().left;
                pop.css("top",(top-xsize/2)+"px").css("left",(left-ysize/2)+"px");
				// 基于准备好的dom，初始化echarts图表
                var myChart = ec.init(document.getElementById(domid));
                var option = null;
                if(scope.charttype==="pie"){
                	option = {
                            renderAsImage:false,
                            animation:true,
                            tooltip : {
                                trigger: 'item',
                                formatter: "{c}"
                            },
                            series : [
                                {
                                    type:scope.charttype,
                                    radius : '60%',
                                    selectedMode:"single",
                                    selectedOffset:"3",
                                    center: ['50%', '50%'],
                                    itemStyle:{
                                        normal: {
                                        	label:{show: false},
                                            labelLine:{show: false}
                                        },                        
                                    },
                                    data:data.data,
                                    line:false
                                }
                            ]
                        }; 
                }
                else{
                	option = {
                			tooltip : {
                                trigger: 'item',
                                formatter: "{a}:{c}"
                            },
                            grid:{
                            	borderWidth:0,
                                x:0,
                                y:0,
                                x2:0,
                                y2:0
                            },
                            xAxis : [
                                 {
                                     type : 'category',
                                     data : [data.name],
                                     show:false
                                 }
                             ],
                             yAxis : [
                                 {
                                     type : 'value',
                                     show:false,                                     
//                                     max:8,
                                     min:0
                                 }
                             ],
                		    series : data.series
                		}; 
                }  
                // 为echarts对象加载数据
                myChart.setOption(option);
            });
		},
		clear:function(){
			this.flag = false;
			$(".olPopup").remove();
		},
        destroy : function ()
        {
			this.clear();
        },
        CLASS_NAME : "OpenLayers.Layer.EchartChartLayer"
    }
);