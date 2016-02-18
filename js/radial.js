var shown_depth=4;
var height = $("#radial-draw-svg").height();
var width = $("#radial-draw-svg").width();
var svg = d3.select("#radial-draw-svg")
	.append("svg")
	.attr("id","radial")
	.attr("width", width)
	.attr("height", height);
var sliderDivHeight = $("#slider-view").height();
var sliderDivWidth = $("#slider-view").width();
var sliderSvg = d3.select("#slider-view")
	.append("svg")
	.attr("id","slider-svg")
	.attr("width",sliderDivWidth)
	.attr("height",sliderDivHeight);

var radial = function(){
	var widthArray = [24, 18, 12, 6, 2];//每一层的结点的宽度
	var originArray = [];
	for(var i = 0; i < widthArray.length; i++){
		originArray[i] = widthArray[i];
	}
	var topHeight = height * 0.446;
	var bottomHeight = topHeight + sliderDivHeight;
	console.log("height:" + topHeight);
	console.log("bottomHeight:" + bottomHeight);
	console.log("sliderHeight:" + sliderDivHeight);
	var rectHeight = 60;
	var rectY = 10;
	var xCompute = 0;
	var Radial = {};
	ObserverManager.addListener(Radial);
	var handleColor = ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9"];
	var dataProcessor = dataCenter.datasets[0].processor;
	var dataset = dataCenter.datasets[0].processor.result;

	var target_root={//用树结构存储公共树
		//因为mark=0有特殊含义，所以输入的树的标号不能取0
		mark:0,//mark为0表示这个结点至少在两棵树中出现，mark不为0时，用于标记这个结点出现过的那棵树
		_depth:0,//结点所在的深度，在数据转换时d3的预处理函数已经用过depth了，所以这里要用_depth防止被覆盖
		name:"root",
		description:"root",
		//_children在下面自己会生成
		children:new Array(),//最底层结点没有children这个维度
		//size:...//只有最底层的结点有size：...
		//如果用sunburst的layout，上层的size会自己算出来，否则需要手动算才有
		_father: undefined
	}
	var linear_tree=[];//用数组存储公共树

	//注意：JS中函数参数传递不是按引用传的
	//函数内部如果直接给传入的对象赋值，效果是对内部的拷贝赋值；如果修改传入的对象的成员，那么修改能够影响到传入的对象

	merge_preprocess_rawdata(dataset.dataList,target_root,1);
	linearlize(target_root,linear_tree);

	draw_slide_bar();
	function draw_slide_bar(){
		function changePercentage(text){
			text = +text;
			var format_text = parseFloat(Math.round(text * 100) / 100).toFixed(2);
			d3.select("#now-value")
				.html(format_text);
		}
		function clearPercentage(){
			d3.select("#now-value")
				.html(null);
		}
		var min = 0;
		var max = 30;
		var sliderHeight = sliderDivHeight;
		var sliderWidth = sliderDivWidth * 2 / 10;
		sliderSvg.append("g")
			.attr("id","slider-g")
			.attr("transform","translate(" + sliderDivWidth * 4 / 10 + "," + 0 + ")");
		var sliderHandleHeight = sliderHeight/30;
		var dragDis = 0;
		var drag = d3.behavior.drag()
	        .on("drag", function(d,i) {
	        	var oy = originArray[i] / max * sliderHeight;
	            var dx = +d3.event.x;
	            var dy = +d3.event.y - oy;
	            if((d3.event.y > 0)&&(d3.event.y < sliderHeight - sliderHandleHeight)){
	            	d3.select(this).attr("transform", function(d,i){
		                return "translate(" + 0 + "," + dy + ")";
		            });
	            }
	            dragDis = dy;
	            var value = dragDis / sliderDivHeight * max;
	        	var finalValue = originArray[i] + value;
	        	finalValue = finalValue > max ? max : finalValue;
	        	finalValue = finalValue < min ? min : finalValue;
	        	changePercentage(finalValue);
	        })
	        .on("dragend",function(d,i){
	        	console.log("dragEnd",dragDis);
	        	var value = dragDis / sliderDivHeight * max;
	        	var finalValue = originArray[i] + value;
	        	finalValue = finalValue > max ? max : finalValue;
	        	finalValue = finalValue < min ? min : finalValue;
	        	widthArray[i] = finalValue;
	        	draw_barcoded_tree(linear_tree,1);
	        	changePercentage(finalValue);
	        });

	    sliderSvg.select("#back-slider").remove();
	    sliderSvg.select("#slider-g")
			.append("rect")
			.attr("id","back-slider")
			.attr("height",sliderHeight)
			.attr("width",sliderWidth)
			.attr("x",0)
			.attr("y",0)
			.attr("fill","gray");
		sliderSvg.selectAll(".slider").remove();
		sliderSvg.select("#slider-g")
			.selectAll(".slider")
			.data(widthArray)
			.enter()
			.append("rect")
			.attr("class","slider")
			.attr("id",function(d,i){
				return "slider-" + i;
			})
			.attr("x",-sliderWidth/4)
			.attr("y",function(d,i){
				var value = +d;
				return value / max * sliderHeight; 
			})
			.attr("width",sliderWidth + sliderWidth/2)
			.attr("height",sliderHandleHeight)
			.attr("fill",function(d,i){
				return handleColor[i];
			})
			.on("mouseover",function(d,i){
				d3.select(this).classed("slider-hover-" + i,true);
				console.log("i:" + i);
				var changeClass = "hover-depth-" + i;
				d3.selectAll(".num-" + i).classed(changeClass,true);
				changePercentage(widthArray[i]);
			})
			.on("mouseout",function(d,i){
				var changeClass = "hover-depth-" + i;
				d3.select(this).classed("slider-hover-" + i,false);
				d3.selectAll(".num-" + i).classed(changeClass,false);
				clearPercentage();
			})
			.call(drag);
	}
	
	draw_barcoded_tree(linear_tree,1);

	//只有当按下改变深度的按钮时，才会调用draw_barcoded_tree_depth
	function draw_barcoded_tree_depth(linear_tree,cur_tree_index,depth){
		console.log(depth);
		xCompute = 0;//用于累积当前方块的横坐标
		var changeWidthArray = [];
		for(var i = 0;i < widthArray.length;i++){
			changeWidthArray[i] = 0;
		}
		for(var i = 0; i < widthArray.length; i++){
			if(i <= depth){//对于深度超过depth的结点，宽度赋为0
				changeWidthArray[i] = widthArray[i];
			}
		}
		svg.selectAll('rect')
		.data(linear_tree)
		.transition()//过渡动画
			//.duration(500)
		.attr('x',function(d,i){
			var backXCompute = xCompute;
			if(changeWidthArray[d._depth]!=0){
				xCompute = xCompute + changeWidthArray[d._depth] + 1;//两个节点之间空1px
			}
			return backXCompute;
		})
		.attr('y',function(d,i){
			return rectY;
		})
		.attr('width',function(d,i){
			return changeWidthArray[d._depth];
		})
		.attr('height',function(d,i){
			return rectHeight;
		})
		//call 相当于定义一个函数，再把选择的元素给它
		.call(endall, function() { draw_link(); });
		//--------------------------------------------------------------
	}
	function endall(transition, callback) { 
	    if (transition.size() === 0) { callback() }
	    var n = 0; 
	    transition 
	        .each(function() { ++n; }) 
	        .each("end", function() { if (!--n) callback.apply(this, arguments); }); 
	} 
	function draw_link(){
		var depth = 4;
		svg.selectAll('path').remove();
		var beginRadians = Math.PI/2,
			endRadians = Math.PI * 3/2,
			points = 50;
		for(var i = 0;i < linear_tree.length;i++){
			var fatherWidth =  +svg.select('#bar-id' + i).attr('width');
			var fatherX = +svg.select('#bar-id' + i).attr('x') + fatherWidth/2;
			var thisNode = linear_tree[i];
			var fatherIndex = thisNode.linear_index;
			var children = thisNode.children;
			if(children != undefined){
				for(var j = 0;j < children.length;j++){
					var child = children[j];
					if(thisNode._depth <= depth){
						var childIndex = child.linear_index;
						var childWidth = +svg.select('#bar-id' + childIndex).attr('width');
						var childX = +svg.select('#bar-id' + childIndex).attr('x') + childWidth/2;
						var radius = (childX - fatherX)/2;
						var angle = d3.scale.linear()
					   		.domain([0, points-1])
					   		.range([beginRadians, endRadians]);
					   	var line = d3.svg.line.radial()
					   		.interpolate("basis")
					   		.tension(0)
					   		.radius(radius)
					   		.angle(function(d, i) { return angle(i); });
						svg.append("path").datum(d3.range(points))
			    			.attr("class", "line " + "f-" + fatherIndex + " c-" + childIndex)
			    			.attr('id','path-f' + fatherIndex +'-c-'+ childIndex)
			    			.attr("d", line)
			    			.attr("transform", "translate(" + (fatherX + radius) + ", " + (rectY + rectHeight) + ")");
					}
				}
			}
		}
	}
	var g;
	//给定合并后的并集树linear_tree，当前要画的树的编号cur_tree_index
	function draw_barcoded_tree(linear_tree,cur_tree_index)
	{
		xCompute = 0;//用于累积当前方块的横坐标
		var acc_depth_node_num=[];//记录各个深度的结点数
		for (var i=0;i<=4;++i){
			acc_depth_node_num[i]=0;
		}
		//先画条码
		for (var i=0;i<linear_tree.length;++i)//对于线性化的并集树中每个元素循环
		{
			acc_depth_node_num[linear_tree[i]._depth]=acc_depth_node_num[linear_tree[i]._depth]+1;
		}
		console.log(linear_tree);
		d3.select("#radial").selectAll("*").remove();
		var svg = d3.select('#radial'); 
	/*
		var tooltip = d3.select("body")
					    .append("div")
					    .attr("class", "tooltip")
					    .style("position", "absolute")
					    .style("z-index", "10")
					    .style("opacity", 0);
	*/
		svg.selectAll('.bar')
		.data(linear_tree)
		.enter()
		.append('rect')
		.attr('class',function(d,i){
			var fatherIndex = -1;
			if(d._father!=undefined){
				fatherIndex = d._father.linear_index;
			}
			return 'bar-class num-' + d._depth + ' father-' + fatherIndex;
		})
		.attr('id',function(d,i){
			return  'bar-id' + d.linear_index;
		})
		.attr('x',function(d,i){
			var backXCompute = xCompute;
			xCompute = xCompute + widthArray[d._depth] + 1;//两个节点之间空1px
			return backXCompute;
		})
		.attr('y',function(d,i){
			return rectY;
		})
		.attr('width',function(d,i){
			return widthArray[d._depth];
		})
		.attr('height',function(d,i){
			return rectHeight;
		})
		.attr('fill','black')
		.on('mouseover',function(d,i){
			var fatherIndex = -1;
			var thisIndex = d.linear_index;
			if(d._father!=undefined){
				fatherIndex = d._father.linear_index;
			}
			svg.selectAll('.num-' + d._depth + ' father-' + fatherIndex)
				.classed("sibiling-highlight",true);
			var fatherId = 0;
			if(d._father!=undefined){
				fatherId = d._father.linear_index;
			}else{
				fatherId = -1;
			}
			svg.selectAll('#bar-id' + fatherId)
				.classed("father-highlight",true);
			var children = [];
			if(d.children!=undefined){
				children = d.children;
			}
			for(var i = 0;i < children.length;i++){
				var childId = children[i].linear_index;
				svg.selectAll('#bar-id' + childId)
					.classed("children-highlight",true);
			}
			d3.select(this)
				.classed("this-highlight",true);
			svg.selectAll('.f-' + thisIndex)
		    	.classed('path-highlight',true);
		    svg.selectAll('.f-' + thisIndex)
		    	.classed('children-highlight',true);
		    svg.selectAll('.c-' + thisIndex)
		    	.classed('path-highlight',true);
		    svg.selectAll('.c-' + thisIndex)
		    	.classed('father-highlight',true);
		    //changed
		    ObserverManager.post("percentage",[acc_depth_node_num[d._depth]/linear_tree.length , d._depth]);
		})
		.on('mouseout',function(d,i){
			svg.selectAll('.bar-class')
			.classed("sibiling-highlight",false);

			svg.selectAll('.bar-class')
			.classed("father-highlight",false);

			svg.selectAll('.bar-class')
			.classed("children-highlight",false);

			svg.selectAll('.bar-class')
			.classed("this-highlight",false);

			svg.selectAll('path')
			.classed('path-highlight',false);

			svg.selectAll('path')
		    	.classed('path-highlight',false);

		    svg.selectAll('path')
		    	.classed('father-highlight',false);
		});
		//--------------------------------------------------------------
		var beginRadians = Math.PI/2,
			endRadians = Math.PI * 3/2,
			points = 50;
		for(var i = 0;i < linear_tree.length;i++){
			var fatherWidth =  +svg.select('#bar-id' + i).attr('width');
			var fatherX = +svg.select('#bar-id' + i).attr('x') + fatherWidth/2;
			var thisNode = linear_tree[i];
			var fatherIndex = thisNode.linear_index;
			var children = thisNode.children;
			if(children != undefined){
				for(var j = 0;j < children.length;j++){
					var child = children[j];
					var childIndex = child.linear_index;
					var childWidth = +svg.select('#bar-id' + childIndex).attr('width');
					var childX = +svg.select('#bar-id' + childIndex).attr('x') + childWidth/2;
					var radius = (childX - fatherX)/2;
					var angle = d3.scale.linear()
				   		.domain([0, points-1])
				   		.range([beginRadians, endRadians]);
				   	var line = d3.svg.line.radial()
				   		.interpolate("basis")
				   		.tension(0)
				   		.radius(radius)
				   		.angle(function(d, i) { return angle(i); });
					svg.append("path").datum(d3.range(points))
		    			.attr("class", "line " + "f-" + fatherIndex + " c-" + childIndex)
		    			.attr('id','path-f' + fatherIndex +'-c-'+ childIndex)
		    			.attr("d", line)
		    			.attr("transform", "translate(" + (fatherX + radius) + ", " + (rectY + rectHeight) + ")");
				}
			}
		}
	/*
		for (var i=0;i<=5;++i)
		{
			var text_x=100;
			var text_y=100+40*i;
			if (i!=5)
				var str = 	"L"+ i + " node number:"+acc_depth_node_num[i];
			else
				var str = 	"L0 to L4" + " node number:"+
							(acc_depth_node_num[0]+acc_depth_node_num[1]+
							 acc_depth_node_num[2]+acc_depth_node_num[3]+acc_depth_node_num[4]);
			//draw_text_description(str,text_x,text_y);
		}
		//给出text标注每个深度的结点分别有多少个
		
		function draw_text_description(str,text_x,text_y)
		{
			var text = svg.append("text")
							.attr("x",30)
							.attr("y",100)
							.attr("font-size",20)
							.attr("font-family","simsun")
							.attr("position","absolute")
					.attr("transform",function(d,i){  
					        return "translate(" + (text_x) + "," + (text_y) + ")";  
					    });	
			var strs = str.split("，");
			
			console.log(strs);
								
			text.selectAll("tspan")
					.data(strs)
					.enter()
					.append("tspan")
					.attr("x",text.attr("x"))
					.attr("dy","1em")
					.text(function(d){
						return d;
					});
		}
	*/
	}
	
	$("#default").attr("checked",true);
	$("#radial-depth-controller").on("click", ".level-btn", function(){
		var dep = $(this).attr("level");
		shown_depth=dep;
		$("#radial-depth-controller .level-btn").removeClass("active");		
		for (var i = 0; i <= dep; i++)
			$("#radial-depth-controller .level-btn[level=" + i + "]").addClass("active");

		draw_barcoded_tree_depth(linear_tree,1,dep);
	});

    Radial.OMListen = function(message, data) {
		var idPrefix = "#radial-node-";
		if (message == "highlight") {
			svg.selectAll(".highlight").classed("highlight", false)
			svg.selectAll(".half-highlight").classed("half-highlight", false)
			for (var i = 0; i < data.length; i++) {
				svg.select(idPrefix + data[i]).classed("highlight", true);
				svg.select(idPrefix + data[i]).each(function(d) {
					if (d == null) return;
					var node = d.parent;
					while (node != null) {
						svg.select(idPrefix + node.id).classed("half-highlight", true);
						node = node.parent;
					}
				})				
			}
		}
        if(message == "mouse-over"){
        	for (var i = 0; i < data.length; i++) {
				svg.select(idPrefix + data[i]).classed("focus-highlight", true);
				if (svg.select(idPrefix + data[i]).data().length > 0) {
					var nodeData = svg.select(idPrefix + data[i]).data()[0];
				}
			}
        }
        if(message == "mouse-out"){
        	for (var i = 0; i < data.length; i++) {
				svg.select(idPrefix + data[i]).classed("focus-highlight", false);
			}
        }
        if(message == "depth"){
        	draw_depth(data);
        }	
    }
    return Radial;
}