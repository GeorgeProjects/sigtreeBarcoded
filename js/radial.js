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


//画每个barcode背后的rect
function draw_background_rect()
{
	svg//.select("#radial")
			.selectAll('.background_rect')
			.data([0,1,2,3,4])
			.enter()
			.append('rect')
		/*
			.attr('class',function(d,i){
				var fatherIndex = -1;
				if(d._father!=undefined){
					fatherIndex = d._father.linear_index;
				}
				return 'bar-class num-' + d._depth + 'father-' + fatherIndex + " num-" + d._depth + ' father-' + fatherIndex;
			})
			.attr('id',function(d,i){
				return  'bar-id' + d.linear_index;
			})
	*/
		.attr('x',function(d,i){
			/*
			var backXCompute = xCompute;
			xCompute = xCompute + widthArray[d._depth] + 1;//两个节点之间空1px
			return backXCompute;
			*/
			return 0;
		})
		.attr('y',function(d,i){
			return i*100;
		})
		.attr('width',function(d,i){
			return 1000;
		})
		.attr('height',function(d,i){
			return 50;
		})
		.attr('fill','black');
}


//barcode的tip
var tip_array=[];

var radial = function(){
	var widthArray = [24, 18, 12, 6, 2];
	var originArray = [];
	for(var i = 0; i < widthArray.length; i++){
		originArray[i] = widthArray[i];
	}
	var topHeight = height * 0.446;
	var bottomHeight = topHeight + sliderDivHeight;
	var rectHeight = 60;
	var rectY = 10;
	var xCompute = 0;
	var Radial = {};
	ObserverManager.addListener(Radial);


	
	var handleColor = ["#b3e2cd","#fdcdac","#cbd5e8","#f4cae4","#e6f5c9"];
	var dataProcessor = dataCenter.datasets[0].processor;
	var dataset = dataCenter.datasets[0].processor.result;
	var formerDepth = 4;
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
	var curtreeindex=1;
	merge_preprocess_rawdata(dataset.dataList,target_root,curtreeindex);

	reorder_tree(target_root);
	cal_repeat_time(target_root);
	cal_nth_different_subtree_traverse(target_root);

	linearlize(target_root,linear_tree);
	console.log("target_root");
	console.log(target_root);

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
	        	var value = dragDis / sliderDivHeight * max;
	        	var finalValue = originArray[i] + value;
	        	finalValue = finalValue > max ? max : finalValue;
	        	finalValue = finalValue < min ? min : finalValue;
	        	widthArray[i] = finalValue;
	        	if($("#state-change").hasClass("active")){
					draw_reduce_barcoded_tree(linear_tree,1);
					draw_reduce_barcoded_depth(linear_tree,shown_depth,shown_depth);
					formerDepth = shown_depth;
				}else{
					draw_barcoded_tree(linear_tree,1);
					draw_barcoded_tree_depth(linear_tree,shown_depth,shown_depth);
					formerDepth = shown_depth;
				}
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
	var changeWidthArray = [];
	for(var i = 0;i < widthArray.length;i++){
		changeWidthArray[i] = widthArray[i];
	}
	//---------------------------------------------------------------------
	//---------------------------------------------------------------------
	
	var maintain_tooltip_display=[];

	if($("#state-change").hasClass("active")){
		draw_reduce_barcoded_tree(linear_tree,1);
		draw_reduce_barcoded_depth(linear_tree,shown_depth,shown_depth);
		formerDepth = shown_depth;
	}else{
		draw_barcoded_tree(linear_tree,1);
		draw_barcoded_tree_depth(linear_tree,shown_depth,shown_depth);
		formerDepth = shown_depth;
	}
	function draw_barcoded_tree_depth(linear_tree,former_depth,depth){
		//按下换depth的button时，要把原来的tip全都删光
		for (var i=0;i<linear_tree.length;++i)
			tip_array[i].hide();//hide可以不传参数

		console.log(depth);
		xCompute = 0;
		var formerWidthArray = [];
		var currentDepth = former_depth;
		for(var i = 0;i < changeWidthArray.length;i++){
			formerWidthArray[i] = changeWidthArray[i];
		}
		for(var i = 0; i < widthArray.length; i++){
			if(i > currentDepth){
				changeWidthArray[i] = 0;
			}else{
				changeWidthArray[i] = widthArray[i];
			}
		}
		svg.selectAll('rect')
		.data(linear_tree)
		.transition()//过渡动画
			//.duration(500)
		.attr('x',function(d,i){
			var backXCompute = xCompute;
			if(formerWidthArray[d._depth]!=0){
				xCompute = xCompute + formerWidthArray[d._depth] + 1;
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
		.call(endall, function() { 
			draw_depth_move(currentDepth,depth);
		});
		function draw_depth_move(currentDepth,depth){
			console.log(currentDepth);
			console.log(changeWidthArray);
			xCompute = 0;
			svg.selectAll('rect')
			.data(linear_tree)
			.transition()
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
			.call(endall, function(){
				depth = +depth;
				currentDepth = +currentDepth;
				if(currentDepth == depth){
					draw_link(); 
				}else{
					currentDepth = currentDepth - 1;
					draw_barcoded_tree_depth(linear_tree,currentDepth,depth)
				}
			});
		} 
	}
	//-----------------------------------------------------------------------------------------
	//-----------------------------------------------------------------------------------------
	function draw_barcoded_tree_move(linear_tree,former_depth,depth){
		xCompute = 0;
		var formerWidthArray = [];
		console.log("former_depth:"+former_depth+"depth:"+depth);
		former_depth = +former_depth;
		var currentDepth = former_depth;
		for(var i = 0;i < changeWidthArray.length;i++){
			formerWidthArray[i] = changeWidthArray[i];
		}
		for(var i = 0; i < widthArray.length; i++){
			if(i > currentDepth){
				changeWidthArray[i] = 0;
			}else{
				changeWidthArray[i] = widthArray[i];
			}
		}
		svg.selectAll('rect')
		.data(linear_tree)
		.transition()
		.attr('x',function(d,i){
			var backXCompute = xCompute;
			if(changeWidthArray[d._depth]!=0){
				xCompute = xCompute + changeWidthArray[d._depth] + 1;
			}
			return backXCompute;
		})
		.attr('y',function(d,i){
			return rectY;
		})
		.attr('width',function(d,i){
			return formerWidthArray[d._depth];
		})
		.attr('height',function(d,i){
			return rectHeight;
		})
		.call(endall, function() {
		 	draw_depth_show(currentDepth,depth); 
		});
		//----------------------------------------------------------
		function draw_depth_show(currentDepth,depth){
			xCompute = 0;
			svg.selectAll('rect')
			.data(linear_tree)
			.transition()
			.attr('x',function(d,i){
				var backXCompute = xCompute;
				if(changeWidthArray[d._depth]!=0){
					xCompute = xCompute + changeWidthArray[d._depth] + 1;
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
			.call(endall, function() { 
				depth = +depth;
				currentDepth = +currentDepth;
				if(currentDepth == depth){
					draw_link();
				}else{
					currentDepth = currentDepth + 1;
					draw_barcoded_tree_move(linear_tree,currentDepth,depth)
				}
			});
		}
	}
	//-------------------------------------------------------------------------------
	//-------------------------------------------------------------------------------
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
	//标记每个元素的tooltip在mouseout时是隐去还是保持
	function draw_reduce_barcoded_depth(linear_tree,former_depth,depth){
		

		var rowNum = 7;
		var divideNum = rowNum * 3 - 1;
		var barHeight = rectHeight / divideNum * 2;
		var barGap = rectHeight/divideNum;
		var barWidth = 10;
		var curDrawDep = 10;
		var formerNodeRepeat = 0;
		var formerDepth = 0;
		console.log(linear_tree);
		xCompute = 0;//用于累积当前方块的横坐标
		//按下换depth的button时，要把原来的tip全都删光
		for (var i=0;i<linear_tree.length;++i)
			tip_array[i].hide();//hide可以不传参数

		console.log(depth);
		xCompute = 0;
		var formerWidthArray = [];
		var currentDepth = former_depth;
		for(var i = 0;i < changeWidthArray.length;i++){
			formerWidthArray[i] = changeWidthArray[i];
		}
		for(var i = 0; i < widthArray.length; i++){
			if(i > currentDepth){
				changeWidthArray[i] = 0;
			}else{
				changeWidthArray[i] = widthArray[i];
			}
		}
		svg.selectAll('rect')
		.data(linear_tree)
		.transition()//过渡动画
			//.duration(500)
		.attr('x',function(d,i){
						//将这一节点的重复次数变成数字类型，便于以后进行处理
			var repeatTime = +d.continuous_repeat_time;
			//只有节点的重复次数大于1才会将这个节点进行记录下来，而d._depth <= curDrawDep表示的是所记录下的节点不会被其不重要的字节点覆盖
			if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
				//将这个节点记录下来
				curDrawDep = +d._depth;
			}
			//如果上一个节点的在缩略但是这个节点没有达到每一列的最后一个缩略位置，需要在这个节点的位置对他进行换列处理
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1) && (curDrawDep != 10)){
				curDrawDep = 10;
				if((formerNodeRepeat - 1)%rowNum != 0){
					xCompute = xCompute + 2 * widthArray[d._depth] + 1;
				}
			}
			//手动来换行的第二种情况，上一个节点没有达到缩略的位置，下一个节点也是缩略的但是要比当前缩略的节点的level更高
			if(formerDepth > d._depth && d.continuous_repeat_time != 1) {
				xCompute = xCompute + widthArray[d._depth]/3 + 1;
			}
			//下面是对于绘制的节点的x位置进行计算
			var backXCompute = xCompute;
			if(d._depth < curDrawDep){
				//比当前记录的depth层次更高，那么两个节点之间空出1px
				xCompute = xCompute + widthArray[d._depth] + 1;//两个节点之间空1px
			}else if(d._depth == curDrawDep){
				//如果是当前缩略的节点，那么计算节点的x坐标值是就需要进行堆叠起来
				if((repeatTime - 1)%rowNum == 0){
					xCompute = xCompute + widthArray[d._depth] + 1;
				}
			}
			if(d.continuous_repeat_time != 1 && d._depth <= curDrawDep){
				formerNodeRepeat = d.continuous_repeat_time;
				formerDepth = d._depth;
			}
			return backXCompute;
		})
		.attr('y',function(d,i){
			var repeatTime = +d.continuous_repeat_time;
			//用于记录当前有效的depth
			if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
				curDrawDep = +d._depth;
			}
			//用于恢复depth，让以后的节点正常的进行绘制
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
				curDrawDep = 10;
			}
			//如果是当前绘制层次的节点，那么需要对应的控制所绘制节点y坐标值
			if(d._depth == curDrawDep){
				return rectY + (repeatTime - 2) % rowNum * (barGap + barHeight);
			}
			return rectY;
		})
		.attr('width',function(d,i){
			//用于记录当前有效的depth值
			if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
				curDrawDep = +d._depth;
			}
			//用于恢复depth值，让后面的节点可以进行正常的绘制
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
				curDrawDep = 10;
			}
			var hisWidth = 0;
			var d_depth = +d._depth;
			if(d._depth < curDrawDep){
				hisWidth = changeWidthArray[d._depth];
			}else if(d._depth == curDrawDep){
				hisWidth = changeWidthArray[d._depth];
				//hisWidth = barWidth;
			}else if(d._depth > curDrawDep){
				//如果是比当前记录的缩略层次更低，那么就需要将hiswidth设置为0
				hisWidth = 0;
			}
			return hisWidth;
		})
		.attr('height',function(d,i){
			//用于记录当前有效的depth值
			if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
				curDrawDep = +d._depth;
			}
			//用于恢复depth的值，从而使后面的节点可以正常的进行绘制
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
				curDrawDep = 10;
			}
			var hisWidth = 0;
			var d_depth = +d._depth;
			if(d._depth == curDrawDep){
				//如果绘制的层次是当前的缩略的层次，那么需要返回到鹅是缩略节点的barheight
				return barHeight;
			}
			return rectHeight;
		})
		.call(endall, function() { 
			draw_depth_move(currentDepth,depth);
		});
		function draw_depth_move(currentDepth,depth){
			console.log(currentDepth);
			console.log(changeWidthArray);
			xCompute = 0;
			curDrawDep = 10;
			formerNodeRepeat = 0;
			formerDepth = 0;
			svg.selectAll('rect')
			.data(linear_tree)
				.transition()
			.attr('x',function(d,i){
							//将这一节点的重复次数变成数字类型，便于以后进行处理
				var repeatTime = +d.continuous_repeat_time;
				//只有节点的重复次数大于1才会将这个节点进行记录下来，而d._depth <= curDrawDep表示的是所记录下的节点不会被其不重要的字节点覆盖
				if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
					//将这个节点记录下来
					curDrawDep = +d._depth;
				}
				//如果上一个节点的在缩略但是这个节点没有达到每一列的最后一个缩略位置，需要在这个节点的位置对他进行换列处理
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1) && (curDrawDep != 10)){
					curDrawDep = 10;
					if((formerNodeRepeat - 1)%rowNum != 0){
						xCompute = xCompute + 2 * changeWidthArray[d._depth] + 1;
					}
				}
				//手动来换行的第二种情况，上一个节点没有达到缩略的位置，下一个节点也是缩略的但是要比当前缩略的节点的level更高
				if(formerDepth > d._depth && d.continuous_repeat_time != 1) {
					xCompute = xCompute + changeWidthArray[d._depth]/3 + 1;
				}
				//下面是对于绘制的节点的x位置进行计算
				var backXCompute = xCompute;
				if(d._depth < curDrawDep){
					//比当前记录的depth层次更高，那么两个节点之间空出1px
					xCompute = xCompute + changeWidthArray[d._depth] + 1;//两个节点之间空1px
				}else if(d._depth == curDrawDep){
					//如果是当前缩略的节点，那么计算节点的x坐标值是就需要进行堆叠起来
					if((repeatTime - 1)%rowNum == 0){
						xCompute = xCompute + changeWidthArray[d._depth] + 1;
					}
				}
				if(d.continuous_repeat_time != 1 && d._depth <= curDrawDep){
					formerNodeRepeat = d.continuous_repeat_time;
					formerDepth = d._depth;
				}
				return backXCompute;
			})
			.attr('y',function(d,i){
				var repeatTime = +d.continuous_repeat_time;
				//用于记录当前有效的depth
				if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
					curDrawDep = +d._depth;
				}
				//用于恢复depth，让以后的节点正常的进行绘制
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
					curDrawDep = 10;
				}
				//如果是当前绘制层次的节点，那么需要对应的控制所绘制节点y坐标值
				if(d._depth == curDrawDep){
					return rectY + (repeatTime - 2) % rowNum * (barGap + barHeight);
				}
				return rectY;
			})
			.attr('width',function(d,i){
				//用于记录当前有效的depth值
				if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
					curDrawDep = +d._depth;
				}
				//用于恢复depth值，让后面的节点可以进行正常的绘制
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
					curDrawDep = 10;
				}
				var hisWidth = 0;
				var d_depth = +d._depth;
				if(d._depth < curDrawDep){
					hisWidth = changeWidthArray[d._depth];
				}else if(d._depth == curDrawDep){
					hisWidth = changeWidthArray[d._depth];
					//hisWidth = barWidth;
				}else if(d._depth > curDrawDep){
					//如果是比当前记录的缩略层次更低，那么就需要将hiswidth设置为0
					hisWidth = 0;
				}
				return hisWidth;
			})
			.attr('height',function(d,i){
				//用于记录当前有效的depth值
				if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
					curDrawDep = +d._depth;
				}
				//用于恢复depth的值，从而使后面的节点可以正常的进行绘制
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
					curDrawDep = 10;
				}
				var hisWidth = 0;
				var d_depth = +d._depth;
				if(d._depth == curDrawDep){
					//如果绘制的层次是当前的缩略的层次，那么需要返回到鹅是缩略节点的barheight
					return barHeight;
				}
				return rectHeight;
			})
			//call 相当于定义一个函数，再把选择的元素给它
			.call(endall, function(){
				depth = +depth;
				currentDepth = +currentDepth;
				if(currentDepth == depth){
					draw_link(); 
				}else{
					currentDepth = currentDepth - 1;
					draw_reduce_barcoded_depth(linear_tree,currentDepth,depth)
				}
			});
		} 
	}
	//---------------------------------------------------------------------------
	function draw_reduce_barcoded_move(linear_tree,former_depth,depth){
		

		var rowNum = 7;
		var divideNum = rowNum * 3 - 1;
		var barHeight = rectHeight / divideNum * 2;
		var barGap = rectHeight/divideNum;
		var barWidth = 10;
		var curDrawDep = 10;
		var formerNodeRepeat = 0;
		var formerDepth = 0;
		console.log(linear_tree);
		xCompute = 0;//用于累积当前方块的横坐标

		var formerWidthArray = [];
		console.log("former_depth:"+former_depth+"depth:"+depth);
		former_depth = +former_depth;
		var currentDepth = former_depth;
		console.log("currentDepth:" + currentDepth);
		for(var i = 0;i < changeWidthArray.length;i++){
			formerWidthArray[i] = changeWidthArray[i];
		}
		for(var i = 0; i < widthArray.length; i++){
			if(i > currentDepth){
				changeWidthArray[i] = 0;
			}else{
				changeWidthArray[i] = widthArray[i];
			}
		}
		svg.selectAll('rect')
		.data(linear_tree)
		.transition()
		.attr('x',function(d,i){
						//将这一节点的重复次数变成数字类型，便于以后进行处理
			var repeatTime = +d.continuous_repeat_time;
			//只有节点的重复次数大于1才会将这个节点进行记录下来，而d._depth <= curDrawDep表示的是所记录下的节点不会被其不重要的字节点覆盖
			if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
				//将这个节点记录下来
				curDrawDep = +d._depth;
			}
			//如果上一个节点的在缩略但是这个节点没有达到每一列的最后一个缩略位置，需要在这个节点的位置对他进行换列处理
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1) && (curDrawDep != 10)){
				curDrawDep = 10;
				if((formerNodeRepeat - 1)%rowNum != 0){
					xCompute = xCompute + 2 * changeWidthArray[d._depth] + 1;
				}
			}
			//手动来换行的第二种情况，上一个节点没有达到缩略的位置，下一个节点也是缩略的但是要比当前缩略的节点的level更高
			if(formerDepth > d._depth && d.continuous_repeat_time != 1) {
				xCompute = xCompute + changeWidthArray[d._depth]/3 + 1;
			}
			//下面是对于绘制的节点的x位置进行计算
			var backXCompute = xCompute;
			if(d._depth < curDrawDep){
				//比当前记录的depth层次更高，那么两个节点之间空出1px
				xCompute = xCompute + changeWidthArray[d._depth] + 1;//两个节点之间空1px
			}else if(d._depth == curDrawDep){
				//如果是当前缩略的节点，那么计算节点的x坐标值是就需要进行堆叠起来
				if((repeatTime - 1)%rowNum == 0){
					xCompute = xCompute + changeWidthArray[d._depth] + 1;
				}
			}
			if(d.continuous_repeat_time != 1 && d._depth <= curDrawDep){
				formerNodeRepeat = d.continuous_repeat_time;
				formerDepth = d._depth;
			}
			return backXCompute;
		})
		.attr('y',function(d,i){
				var repeatTime = +d.continuous_repeat_time;
				//用于记录当前有效的depth
				if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
					curDrawDep = +d._depth;
				}
				//用于恢复depth，让以后的节点正常的进行绘制
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
					curDrawDep = 10;
				}
				//如果是当前绘制层次的节点，那么需要对应的控制所绘制节点y坐标值
				if(d._depth == curDrawDep){
					return rectY + (repeatTime - 2) % rowNum * (barGap + barHeight);
				}
				return rectY;
		})
		.attr('width',function(d,i){
				//用于记录当前有效的depth值
				if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
					curDrawDep = +d._depth;
				}
				//用于恢复depth值，让后面的节点可以进行正常的绘制
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
					curDrawDep = 10;
				}
				var hisWidth = 0;
				var d_depth = +d._depth;
				if(d._depth < curDrawDep){
					hisWidth = formerWidthArray[d._depth];
				}else if(d._depth == curDrawDep){
					hisWidth = formerWidthArray[d._depth];
					//hisWidth = barWidth;
				}else if(d._depth > curDrawDep){
					//如果是比当前记录的缩略层次更低，那么就需要将hiswidth设置为0
					hisWidth = 0;
				}
				return hisWidth;
		})
		.attr('height',function(d,i){
			//用于记录当前有效的depth值
			if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
				curDrawDep = +d._depth;
			}
			//用于恢复depth的值，从而使后面的节点可以正常的进行绘制
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
				curDrawDep = 10;
			}
			var hisWidth = 0;
			var d_depth = +d._depth;
			if(d._depth == curDrawDep){
				//如果绘制的层次是当前的缩略的层次，那么需要返回到鹅是缩略节点的barheight
				return barHeight;
			}
			return rectHeight;
		})
		.call(endall, function() {
		 	draw_depth_show(currentDepth,depth); 
		});
		//----------------------------------------------------------
		function draw_depth_show(currentDepth,depth){
			xCompute = 0;
			curDrawDep = 10;
			formerNodeRepeat = 0;
			formerDepth = 0;
			svg.selectAll('rect')
			.data(linear_tree)
			.transition()
			.attr('x',function(d,i){
				//将这一节点的重复次数变成数字类型，便于以后进行处理
				var repeatTime = +d.continuous_repeat_time;
				//只有节点的重复次数大于1才会将这个节点进行记录下来，而d._depth <= curDrawDep表示的是所记录下的节点不会被其不重要的字节点覆盖
				if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
					//将这个节点记录下来
					curDrawDep = +d._depth;
				}
				//如果上一个节点的在缩略但是这个节点没有达到每一列的最后一个缩略位置，需要在这个节点的位置对他进行换列处理
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1) && (curDrawDep != 10)){
					curDrawDep = 10;
					if((formerNodeRepeat - 1)%rowNum != 0){
						xCompute = xCompute + 2 * changeWidthArray[d._depth] + 1;
					}
				}
				//手动来换行的第二种情况，上一个节点没有达到缩略的位置，下一个节点也是缩略的但是要比当前缩略的节点的level更高
				if(formerDepth > d._depth && d.continuous_repeat_time != 1) {
					xCompute = xCompute + changeWidthArray[d._depth]/3 + 1;
				}
				//下面是对于绘制的节点的x位置进行计算
				var backXCompute = xCompute;
				if(d._depth < curDrawDep){
					//比当前记录的depth层次更高，那么两个节点之间空出1px
					xCompute = xCompute + changeWidthArray[d._depth] + 1;//两个节点之间空1px
				}else if(d._depth == curDrawDep){
					//如果是当前缩略的节点，那么计算节点的x坐标值是就需要进行堆叠起来
					if((repeatTime - 1)%rowNum == 0){
						xCompute = xCompute + changeWidthArray[d._depth] + 1;
					}
				}
				if(d.continuous_repeat_time != 1 && d._depth <= curDrawDep){
					formerNodeRepeat = d.continuous_repeat_time;
					formerDepth = d._depth;
				}
				return backXCompute;
			})
			.attr('y',function(d,i){
				var repeatTime = +d.continuous_repeat_time;
				//用于记录当前有效的depth
				if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
					curDrawDep = +d._depth;
				}
				//用于恢复depth，让以后的节点正常的进行绘制
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
					curDrawDep = 10;
				}
				//如果是当前绘制层次的节点，那么需要对应的控制所绘制节点y坐标值
				if(d._depth == curDrawDep){
					return rectY + (repeatTime - 2) % rowNum * (barGap + barHeight);
				}
				return rectY;
			})
			.attr('width',function(d,i){
				//用于记录当前有效的depth值
				if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
					curDrawDep = +d._depth;
				}
				//用于恢复depth值，让后面的节点可以进行正常的绘制
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
					curDrawDep = 10;
				}
				var hisWidth = 0;
				var d_depth = +d._depth;
				if(d._depth < curDrawDep){
					hisWidth = changeWidthArray[d._depth];
				}else if(d._depth == curDrawDep){
					hisWidth = changeWidthArray[d._depth];
					//hisWidth = barWidth;
				}else if(d._depth > curDrawDep){
					//如果是比当前记录的缩略层次更低，那么就需要将hiswidth设置为0
					hisWidth = 0;
				}
				return hisWidth;
			})
			.attr('height',function(d,i){
				//用于记录当前有效的depth值
				if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
					curDrawDep = +d._depth;
				}
				//用于恢复depth的值，从而使后面的节点可以正常的进行绘制
				if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
					curDrawDep = 10;
				}
				var hisWidth = 0;
				var d_depth = +d._depth;
				if(d._depth == curDrawDep){
					//如果绘制的层次是当前的缩略的层次，那么需要返回到鹅是缩略节点的barheight
					return barHeight;
				}
				return rectHeight;
			})
			.call(endall, function() { 
				depth = +depth;
				currentDepth = +currentDepth;
				if(currentDepth == depth){
					draw_link();
				}else{
					currentDepth = currentDepth + 1;
					draw_reduce_barcoded_move(linear_tree,currentDepth,depth)
				}
			});
		}
	}
	//---------------------------------------------------------------------------

	//给定合并后的并集树linear_tree，当前要画的树的编号cur_tree_index
	function draw_barcoded_tree(linear_tree,cur_tree_index)
	{
		var svg = d3.select('#radial'); 
		for (var i=0;i<tip_array.length;++i){
			tip_array[i].hide();
		}

		for (var i=0;i<linear_tree.length;++i)
		{
			maintain_tooltip_display[i]=false;
		}
		for (var i=0;i<linear_tree.length;++i)
		{
			tip_array[i]=d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(function(d) {
					return 	"name: <span style='color:red'>" + d.name  + "</span>"+ " " +
					    	"flow size: <span style='color:red'>" + d.trees_values[cur_tree_index] + "</span>"+ " " +
					    	"depth: <span style='color:red'>" + d._depth + "</span>";
					 });

			svg.call(tip_array[i]);
		}
		
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
		d3.select("#radial").selectAll(".bar-class").remove();
		svg.selectAll('.bar-class')
		.data(linear_tree)
		.enter()
		.append('rect')
		.attr('class',function(d,i){
			var fatherIndex = -1;
			if(d._father!=undefined){
				fatherIndex = d._father.linear_index;
			}
			return 'bar-class num-' + d._depth + 'father-' + fatherIndex + " num-" + d._depth + ' father-' + fatherIndex 
				+ " father-" + fatherIndex + "subtree-" + d.nth_different_subtree;
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
			tip_array[d.linear_index].show(d);
			var fatherIndex = -1;
			var thisIndex = d.linear_index;
			if(d._father!=undefined){
				fatherIndex = d._father.linear_index;
			}
			svg.selectAll('.num-' + d._depth + 'father-' + fatherIndex)
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
		    svg.selectAll(".father-" + d._father.linear_index + "subtree-" + d.nth_different_subtree)
		    	.classed("same-sibling",true);
		    //changed
		    ObserverManager.post("percentage",[acc_depth_node_num[d._depth]/linear_tree.length , d._depth]);
		})
		.on('mouseout',function(d,i){
			if (!maintain_tooltip_display[d.linear_index])
				tip_array[d.linear_index].hide();//hide可以不传参数

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

		    svg.selectAll(".father-" + d._father.linear_index + "subtree-" + d.nth_different_subtree)
		    	.classed("same-sibling",false);

		    ObserverManager.post("percentage", [0 ,-1]);
		})
		.on('click',function(d,i){
					//click一下转换hide或保持的状态
			maintain_tooltip_display[d.linear_index]=!maintain_tooltip_display[d.linear_index];
			var this_x=this.x.animVal.valueInSpecifiedUnits;
			var this_y=this.y.animVal.valueInSpecifiedUnits;
			var this_width=this.width.animVal.valueInSpecifiedUnits;
			var this_height=this.height.animVal.valueInSpecifiedUnits;
			draw_adjust_button();

			function draw_adjust_button()
			{
				var rect_attribute_button={	
					height:50,
					biasx:this_x+this_width/2,
					biasy:this_y+this_height,
					cur_id:"ratio_adjust",
					button_shape: (	"M" + 0 + "," + 0 + 
									"L" + -4 + ","+ 12 + 
									"L" + 4 + ","+ 12 +
									"L" + 0 + "," + 0),
					background_color: "black",
					cur_svg:svg,
					//mouseclick_function:function(d){
					//	console.log("!!!")	
					//},
				};			
				creat_button(rect_attribute_button);
				function creat_button(rect_attribute_button){
					var width = rect_attribute_button.width;  
					var height = rect_attribute_button.height; 
					var biasx=rect_attribute_button.biasx;
					var biasy=rect_attribute_button.biasy;
					var background_color=rect_attribute_button.background_color;
					var mouseover_function=rect_attribute_button.mouseover_function;
					var mouseout_function=rect_attribute_button.mouseout_function;
					var mouseclick_function=rect_attribute_button.mouseclick_function;
					var shown_string=rect_attribute_button.button_string;
					var font_color=rect_attribute_button.font_color;
					var font_size=rect_attribute_button.font_size;
					var cur_id=rect_attribute_button.cur_id;
					var cur_class=rect_attribute_button.cur_class;
					var cur_data=rect_attribute_button.cur_data;
					var cur_button_shape=rect_attribute_button.button_shape;
					var cur_svg=rect_attribute_button.cur_svg;
						
					var tooltip=d3.selectAll("#tooltip");
					if (typeof(cur_button_shape)=="undefined")
					{
						var button = cur_svg.append("rect");
					}
					else//自定义按钮形状
					{
						var button = cur_svg.append("path")
									 		.attr("d",cur_button_shape)
									 		.attr("stroke","black")
									 		.attr("stroke-width",1);
					}
					button.datum(cur_data)//绑定数据以后，后面的function才能接到d，否则只能接到this
							.on("mouseover",mouseover_function)
							.on("click",mouseclick_function)

							.on("mouseout",function(){
								if (typeof(mouseout_function)!="undefined")
									mouseout_function(this);
								tooltip.style("opacity",0.0);
							})
							.on("mousemove",function(){
								// 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 
								tooltip.style("left", (d3.event.pageX) + "px")
										.style("top", (d3.event.pageY + 20) + "px");
							})
							.attr("class","rect_button")
							.attr("id",cur_id)						
							.attr("style",	"width:"+width+"px;"+
											"height:"+height+"px;"+
											"color:"+font_color+";"+
											"font-size:"+font_size)
							.attr("transform",function(d,i){  
								return "translate(" + (biasx) + "," + (biasy) + ")";  
							}) 
							.attr("fill",function(d,i){  
								return background_color;  
							});
				}
			}

		});
		draw_link();
	}
	//---------------------------------------------------------------------------
	//---------------------------------------------------------------------------
	//给定合并后的并集树linear_tree，当前要画的树的编号cur_tree_index
	function draw_reduce_barcoded_tree(linear_tree,cur_tree_index)
	{
		var svg = d3.select('#radial'); 
		for (var i=0;i<tip_array.length;++i){
			tip_array[i].hide();
		}

		for (var i=0;i<linear_tree.length;++i)
		{
			maintain_tooltip_display[i]=false;
		}
		for (var i=0;i<linear_tree.length;++i)
		{
			tip_array[i]=d3.tip()
				.attr('class', 'd3-tip')
				.offset([-10, 0])
				.html(function(d) {
					return 	"<strong>name:</strong> <span style='color:red'>" + d.name  + "</span>"+ " " +
					    	"<strong>flow size:</strong> <span style='color:red'>" + d.trees_values[cur_tree_index] + "</span>"+ " " +
					    	"<strong>depth:</strong> <span style='color:red'>" + d._depth + "</span>";
					 });
			svg.call(tip_array[i]);
		}
		var rowNum = 7;
		var divideNum = rowNum * 3 - 1;
		var barHeight = rectHeight / divideNum * 2;
		var barGap = rectHeight/divideNum;
		var barWidth = 10;
		var curDrawDep = 10;
		var formerNodeRepeat = 0;
		var formerDepth = 0;
		console.log(linear_tree);
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
		d3.select("#radial").selectAll(".bar-class").remove();
		svg.selectAll('.bar-class')
		.data(linear_tree)
		.enter()
		.append('rect')
		.attr('class',function(d,i){
			var fatherIndex = -1;
			if(d._father!=undefined){
				fatherIndex = d._father.linear_index;
			}
			return 'bar-class num-' + d._depth + 'father-' + fatherIndex + " num-" + d._depth + ' father-' + 
				fatherIndex+ " father-" + fatherIndex + "subtree-" + d.nth_different_subtree;
		})
		.attr('id',function(d,i){
			return  'bar-id' + d.linear_index;
		})
		.attr('x',function(d,i){
			//将这一节点的重复次数变成数字类型，便于以后进行处理
			var repeatTime = +d.continuous_repeat_time;
			//只有节点的重复次数大于1才会将这个节点进行记录下来，而d._depth <= curDrawDep表示的是所记录下的节点不会被其不重要的字节点覆盖
			if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
				//将这个节点记录下来
				curDrawDep = +d._depth;
			}
			//如果上一个节点的在缩略但是这个节点没有达到每一列的最后一个缩略位置，需要在这个节点的位置对他进行换列处理
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1) && (curDrawDep != 10)){
				curDrawDep = 10;
				if((formerNodeRepeat - 1)%rowNum != 0){
					xCompute = xCompute + 2 * widthArray[d._depth] + 1;
				}
			}
			//手动来换行的第二种情况，上一个节点没有达到缩略的位置，下一个节点也是缩略的但是要比当前缩略的节点的level更高
			if(formerDepth > d._depth && d.continuous_repeat_time != 1) {
				xCompute = xCompute + widthArray[d._depth]/3 + 1;
			}
			//下面是对于绘制的节点的x位置进行计算
			var backXCompute = xCompute;
			if(d._depth < curDrawDep){
				//比当前记录的depth层次更高，那么两个节点之间空出1px
				xCompute = xCompute + widthArray[d._depth] + 1;//两个节点之间空1px
			}else if(d._depth == curDrawDep){
				//如果是当前缩略的节点，那么计算节点的x坐标值是就需要进行堆叠起来
				if((repeatTime - 1)%rowNum == 0){
					xCompute = xCompute + widthArray[d._depth] + 1;
				}
			}
			if(d.continuous_repeat_time != 1 && d._depth <= curDrawDep){
				formerNodeRepeat = d.continuous_repeat_time;
				formerDepth = d._depth;
			}
			return backXCompute;
		})
		.attr('y',function(d,i){
			var repeatTime = +d.continuous_repeat_time;
			//用于记录当前有效的depth
			if(d.continuous_repeat_time > 1 && d._depth <= curDrawDep){
				curDrawDep = +d._depth;
			}
			//用于恢复depth，让以后的节点正常的进行绘制
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
				curDrawDep = 10;
			}
			//如果是当前绘制层次的节点，那么需要对应的控制所绘制节点y坐标值
			if(d._depth == curDrawDep){
				return rectY + (repeatTime - 2) % rowNum * (barGap + barHeight);
			}
			return rectY;
		})
		.attr('width',function(d,i){
			//用于记录当前有效的depth值
			if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
				curDrawDep = +d._depth;
			}
			//用于恢复depth值，让后面的节点可以进行正常的绘制
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
				curDrawDep = 10;
			}
			var hisWidth = 0;
			var d_depth = +d._depth;
			if(d._depth < curDrawDep){
				hisWidth = widthArray[d._depth];
			}else if(d._depth == curDrawDep){
				hisWidth = widthArray[d._depth];
				//hisWidth = barWidth;
			}else if(d._depth > curDrawDep){
				//如果是比当前记录的缩略层次更低，那么就需要将hiswidth设置为0
				hisWidth = 0;
			}
			return hisWidth;
		})
		.attr('height',function(d,i){
			//用于记录当前有效的depth值
			if(d.continuous_repeat_time > 1  && d._depth <= curDrawDep){
				curDrawDep = +d._depth;
			}
			//用于恢复depth的值，从而使后面的节点可以正常的进行绘制
			if((d._depth <= curDrawDep) && (d.continuous_repeat_time == 1)){
				curDrawDep = 10;
			}
			var hisWidth = 0;
			var d_depth = +d._depth;
			if(d._depth == curDrawDep){
				//如果绘制的层次是当前的缩略的层次，那么需要返回到鹅是缩略节点的barheight
				return barHeight;
			}
			return rectHeight;
		})
		.attr('fill','black')
		.on('mouseover',function(d,i){
			tip_array[d.linear_index].show(d);

			var fatherIndex = -1;
			var thisIndex = d.linear_index;
			if(d._father!=undefined){
				fatherIndex = d._father.linear_index;
			}
			svg.selectAll('.num-' + d._depth + 'father-' + fatherIndex)
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
		    svg.selectAll(".father-" + d._father.linear_index + "subtree-" + d.nth_different_subtree)
		    	.classed("same-sibling",true);
		    //changed
		    ObserverManager.post("percentage",[acc_depth_node_num[d._depth]/linear_tree.length , d._depth]);
		})
		.on('mouseout',function(d,i){
			if (!maintain_tooltip_display[d.linear_index])
				tip_array[d.linear_index].hide();//hide可以不传参数

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

		    svg.selectAll(".father-" + d._father.linear_index + "subtree-" + d.nth_different_subtree)
		    	.classed("same-sibling",false);
		    ObserverManager.post("percentage", [0 ,-1]);
		})
		.on('click',function(d,i){
			//click一下转换hide或保持的状态
			maintain_tooltip_display[d.linear_index]=!maintain_tooltip_display[d.linear_index];
			var this_x=this.x.animVal.valueInSpecifiedUnits;
			var this_y=this.y.animVal.valueInSpecifiedUnits;
			var this_width=this.width.animVal.valueInSpecifiedUnits;
			var this_height=this.height.animVal.valueInSpecifiedUnits;
			draw_adjust_button();

			function draw_adjust_button()
			{
				var rect_attribute_button={	
					height:50,
					biasx:this_x+this_width/2,
					biasy:this_y+this_height,
					cur_id:"ratio_adjust",
					button_shape: (	"M" + 0 + "," + 0 + 
									"L" + -6 + ","+ 15 + 
									"L" + 6 + ","+ 15 +
									"L" + 0 + "," + 0),
					background_color: "red",
					cur_svg:svg,
					//mouseclick_function:function(d){
					//	console.log("!!!")	
					//},
				};			
				creat_button(rect_attribute_button);
				function creat_button(rect_attribute_button){
					var width = rect_attribute_button.width;  
					var height = rect_attribute_button.height; 
					var biasx=rect_attribute_button.biasx;
					var biasy=rect_attribute_button.biasy;
					var background_color=rect_attribute_button.background_color;
					var mouseover_function=rect_attribute_button.mouseover_function;
					var mouseout_function=rect_attribute_button.mouseout_function;
					var mouseclick_function=rect_attribute_button.mouseclick_function;
					var shown_string=rect_attribute_button.button_string;
					var font_color=rect_attribute_button.font_color;
					var font_size=rect_attribute_button.font_size;
					var cur_id=rect_attribute_button.cur_id;
					var cur_class=rect_attribute_button.cur_class;
					var cur_data=rect_attribute_button.cur_data;
					var cur_button_shape=rect_attribute_button.button_shape;
					var cur_svg=rect_attribute_button.cur_svg;
						
					var tooltip=d3.selectAll("#tooltip");
					if (typeof(cur_button_shape)=="undefined")
					{
						var button = cur_svg.append("rect");
					}
					else//自定义按钮形状
					{
						var button = cur_svg.append("path")
									 		.attr("d",cur_button_shape)
									 		.attr("stroke","red")
									 		.attr("stroke-width",1);
					}
					button.datum(cur_data)//绑定数据以后，后面的function才能接到d，否则只能接到this
							.on("mouseover",mouseover_function)
							.on("click",mouseclick_function)

							.on("mouseout",function(){
								if (typeof(mouseout_function)!="undefined")
									mouseout_function(this);
								tooltip.style("opacity",0.0);
							})
							.on("mousemove",function(){
								// 鼠标移动时，更改样式 left 和 top 来改变提示框的位置 
								tooltip.style("left", (d3.event.pageX) + "px")
										.style("top", (d3.event.pageY + 20) + "px");
							})
							.attr("class","rect_button")
							.attr("id",cur_id)						
							.attr("style",	"width:"+width+"px;"+
											"height:"+height+"px;"+
											"color:"+font_color+";"+
											"font-size:"+font_size)
							.attr("transform",function(d,i){  
								return "translate(" + (biasx) + "," + (biasy) + ")";  
							}) 
							.attr("fill",function(d,i){  
								return background_color;  
							});
				}
			}


		});
		//-------------------------------------------------------------------------------------
		//-------------------------------------------------------------------------------------
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
	}

	

	$("#default").attr("checked",true);
	$("#radial-depth-controller").unbind().on("click", ".level-btn", function(){
		var dep = $(this).attr("level");
		shown_depth = dep;
		$("#radial-depth-controller .level-btn").removeClass("active");		
		for (var i = 0; i <= dep; i++)
			$("#radial-depth-controller .level-btn[level=" + i + "]").addClass("active");
		if(formerDepth < dep){
			if($("#state-change").hasClass("active")){
				draw_reduce_barcoded_move(linear_tree,formerDepth,dep);
			}else{
				draw_barcoded_tree_move(linear_tree,formerDepth,dep);
			}
		}else if(formerDepth > dep){
			if($("#state-change").hasClass("active")){
				draw_reduce_barcoded_depth(linear_tree,formerDepth,dep);
			}else{
				draw_barcoded_tree_depth(linear_tree,formerDepth,dep);
			}
		}
		formerDepth = dep;

		for (var i=0;i<tip_array.length;++i){
			tip_array[i].hide();
		}
		for (var i=0;i<maintain_tooltip_display.length;++i)
		{
			maintain_tooltip_display[i]=false;
		}

	});
	$("#state-change").unbind().click(function(){
		if($("#state-change").hasClass("active")){
			shown_depth == 0?formerDepth=4:formerDepth=0;
			draw_barcoded_tree(linear_tree,1);
			if(formerDepth < shown_depth){
				draw_barcoded_tree_move(linear_tree,formerDepth,shown_depth);
			}else if(formerDepth > shown_depth){
				draw_barcoded_tree_depth(linear_tree,formerDepth,shown_depth);
			}
			$("#state-change").removeClass("active");
		}else{
			shown_depth == 0?formerDepth=4:formerDepth=0;
			draw_reduce_barcoded_tree(linear_tree,1);
			if(formerDepth < shown_depth){
				draw_reduce_barcoded_move(linear_tree,formerDepth,shown_depth);
			}else if(formerDepth > shown_depth){
				draw_reduce_barcoded_depth(linear_tree,formerDepth,shown_depth);
			}
			$("#state-change").addClass("active");
		}
	});
    Radial.OMListen = function(message, data) {
    	if (message == "treeselectsend_radialreceive_highlight"){
    		var cur_highlight_depth=data;
    		var changeClass = "hover-depth-" + cur_highlight_depth;
    		d3.selectAll(".num-" + cur_highlight_depth).classed(changeClass,true);
    	}
    	if (message == "treeselectsend_radialreceive_disable_highlight"){
    		var cur_highlight_depth=data;
    		var changeClass = "hover-depth-" + cur_highlight_depth;
    		d3.selectAll(".num-" + cur_highlight_depth).classed(changeClass,false);
    	}
    }
    return Radial;
}