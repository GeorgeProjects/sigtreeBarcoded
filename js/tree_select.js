var treeSelect = function(){
	var SelectTree = {};
	ObserverManager.addListener(SelectTree);	
	console.log("Listeners",ObserverManager.getListeners().length);
	var svgWidth = $("#innerTopLeft").width();
	var svgHeight = $("#innerTopLeft").height() * 19/20;
	var compareArray = [0, 1];
	var statData = dataCenter.stats;

	var propotionArray_flowsize = [];
	var timeSortArray_flowsize = [];
	var propotionArray_nodenum = [];
	var timeSortArray_nodenum = [];

	var dataList = timeSortArray_flowsize;

	var sortMode = "time";
	var datadimMode = "flowsize";

	var svg = d3.select("#innerTopLeft")
		.append("svg")
		.attr("id", "mainTimeline")
		.attr("width", svgWidth)
		.attr("height", svgHeight);
	var tip = d3.tip()
		.attr('class', 'd3-tip')
		.offset([-10, 0])
		.html(function(d, i) {
			var time = d.time;
			var aTime = time.replace("XX.csv","");
			var aValue = d.value;

			var aL0Node=d.L0Node;
			var aL1Node=d.L1Node;
			var aL2Node=d.L2Node;
			var aL3Node=d.L3Node;
			var aL4Node=d.L4Node;

			if (typeof(aL0Node)!="undefined")
			{
				return "<span style='font-size:12px;'>	date:" + aTime +
													"	sumNode:" + aValue +
													"	L0Node:" + aL0Node +
													"	L1Node:" + aL1Node +
													"	L2Node:" + aL2Node +
													"	L3Node:" + aL3Node +
													"	L4Node:" + aL4Node +
													"</span>";
			}
			else
			{
				return "<span style='font-size:12px;'>	date:" + aTime +
													"	values:" + aValue +
													"</span>";
			}
		
		});
	var hisWidth = 0;
	var changeA = true;
	svg.call(tip);
	processStatData();

	drawHistogram(timeSortArray_flowsize,datadimMode);

	var chart;

	var scrollWidth = $("#srocllDiv").width();
	var topWrapperWidth = $("#topWrapper").width();
	var widthPercentage = Math.round(scrollWidth * 2 / topWrapperWidth * 100);
	// $("#innerTopRight").css("width", widthPercentage+"%");  
	// $("#innerTopLeft").css("width", (100 - widthPercentage)+"%");  
	//document.getElementById('srocllDiv').style.height = svgHeight * 2/3 + "px";


	//给定sortMode和datadimMode以后，决定显示哪一个数据数组
	function choose_displayArray(sortMode,datadimMode)
	{
		if (sortMode=="time" && datadimMode=="flowsize")
			return timeSortArray_flowsize;
		if (sortMode=="size" && datadimMode=="flowsize")
			return propotionArray_flowsize;
		if (sortMode=="time" && datadimMode=="nodenum")
			return timeSortArray_nodenum;
		if (sortMode=="size" && datadimMode=="nodenum")
			return propotionArray_nodenum;
	}


	// click on sort buttons
	$("#innerTopLeft .sort-btn").click(function() {
		$("#innerTopLeft .sort-btn").removeClass("active");
		$(this).addClass("active");
		sortMode = $(this).attr("sort-type");
		if (sortMode == "time") {
			drawHistogram(choose_displayArray(sortMode,datadimMode),datadimMode);
		} else if (sortMode == "size") {
			drawHistogram(choose_displayArray(sortMode,datadimMode),datadimMode);
		}
	});

	// click on data buttons
	$("#innerTopLeft .data-btn").click(function() {
		var command = $(this).attr("data-type");
		if (command == "switch") {
			if(changeA){
				changeA = false;
			}else{
				changeA = true;
			}
		}
		if (sortMode == "time") {
			drawHistogram(choose_displayArray(sortMode,datadimMode),datadimMode);
		} else if (sortMode == "size") {
			drawHistogram(choose_displayArray(sortMode,datadimMode),datadimMode);
		}
	});

	// click on 按树的数值决定高度与树的结点数决定高度之间切换 的 按钮
	$("#innerTopLeft .datadim-btn").click(function() {
		$("#innerTopLeft .datadim-btn").removeClass("active");
		$(this).addClass("active");
		datadimMode = $(this).attr("datadim-type");

		if (datadimMode == "flowsize") {
			drawHistogram(choose_displayArray(sortMode,datadimMode),datadimMode);
		} else if (datadimMode == "nodenum") {
			drawHistogram(choose_displayArray(sortMode,datadimMode),datadimMode);
		}
	});


	var viewWidth = +(d3.select("#srocllDiv").style("width").replace("px",""));
	var fontSize = Math.round(viewWidth / 18);
	$("#innerTopRight").css("font-size", 12 + "px");  

	//处理好四个数组
	function processStatData() {
		process_timeSortArray_flowsize();
		function process_timeSortArray_flowsize()
		{
			for (var i = 0; i < statData.length; i++) {
			 	timeSortArray_flowsize[i] = new Object();
			 	timeSortArray_flowsize[i].value = + statData[i].sumProportion;
			 	timeSortArray_flowsize[i].time = statData[i].file.replace("XX.csv","");
			 	timeSortArray_flowsize[i].index = i;
			 	timeSortArray_flowsize[i].position = i;
			}
		}

		process_propotionArray_flowsize();
		function process_propotionArray_flowsize()
		{
			for (var i = 0; i < statData.length; i++) {
			 	propotionArray_flowsize[i] = new Object();
			 	propotionArray_flowsize[i].value =+ statData[i].sumProportion;
			 	propotionArray_flowsize[i].time = statData[i].file.replace("XX.csv","");
			 	propotionArray_flowsize[i].index = i;	
			}
		 	propotionArray_flowsize.sort(function(a, b) {
		 		return a.value - b.value;
		 	})
		 	for (var i = 0; i < propotionArray_flowsize.length; i++) {
		 		propotionArray_flowsize[i].position = i;
		 	}
		}

		process_timeSortArray_nodenum();
		function process_timeSortArray_nodenum()
		{
			for (var i = 0; i < statData.length; i++) {
			 	timeSortArray_nodenum[i] = new Object();
			 	timeSortArray_nodenum[i].value = + statData[i].sumNode;
			 	timeSortArray_nodenum[i].time = statData[i].file.replace("XX.csv","");
			 	timeSortArray_nodenum[i].index = i;
			 	timeSortArray_nodenum[i].position = i;

			 	timeSortArray_nodenum[i].L0Node = + statData[i].L0Node;
			 	timeSortArray_nodenum[i].L1Node = + statData[i].L1Node;
			 	timeSortArray_nodenum[i].L2Node = + statData[i].L2Node;
			 	timeSortArray_nodenum[i].L3Node = + statData[i].L3Node;
			 	timeSortArray_nodenum[i].L4Node = + statData[i].L4Node;
			}
		}

		process_propotionArray_nodenum();
		function process_propotionArray_nodenum()
		{
			for (var i = 0; i < statData.length; i++) {
			 	propotionArray_nodenum[i] = new Object();
			 	propotionArray_nodenum[i].value = + statData[i].sumNode;
			 	propotionArray_nodenum[i].time = statData[i].file.replace("XX.csv","");
			 	propotionArray_nodenum[i].index = i;	

			 	propotionArray_nodenum[i].L0Node = + statData[i].L0Node;
			 	propotionArray_nodenum[i].L1Node = + statData[i].L1Node;
			 	propotionArray_nodenum[i].L2Node = + statData[i].L2Node;
			 	propotionArray_nodenum[i].L3Node = + statData[i].L3Node;
			 	propotionArray_nodenum[i].L4Node = + statData[i].L4Node;
			}
		 	propotionArray_nodenum.sort(function(a, b) {
		 		return a.value - b.value;
		 	})
		 	for (var i = 0; i < propotionArray_nodenum.length; i++) {
		 		propotionArray_nodenum[i].position = i;
		 	}
		}
	}

	function drawHistogram(dataArray,datadimMode){
		svg.selectAll("*").remove();
	 	var margin = {top: 10, right: 40, bottom: 30, left: 40},
    		width = svgWidth - margin.left - margin.right,
    		height = svgHeight - margin.top - margin.bottom;
		chart = svg.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.attr("id","append-rect");
		var maxNum = _.max(dataArray, function(d) {return d.value}).value;
		// var minNum = _.min(dataArray, function(d) {return d.value}).value;
		var minNum = 0;
		// draw x-axis
		var xAxisScale = d3.scale.identity()
			.range([0, width]);

		var xAxis = d3.svg.axis()
			.scale(xAxisScale)
			.orient("bottom")
			.ticks(0)
			
		var xAxisGroup = chart.append("g")
		   .attr("class","x axis")
		   .attr("transform","translate(" + 0 + "," + height + ")")
		   .call(xAxis)

		xAxisGroup.append("text")
		   .attr("class","label")
		   .attr("x",width)
		   .attr("y",15)
		   .style("text-anchor","end")
		   .text("Date");
		// draw y-axis
		var yAxisMin = 0;


		//根据datadimMode决定y轴的值标多少
		if (datadimMode=="flowsize")
			var yAxisMax = Math.round(Math.log(1899375543148));//最大总流量
		else if (datadimMode=="nodenum")
			var yAxisMax = Math.round(Math.log(886));//最大结点数


		var yAxisScale = d3.scale.linear()
			.domain([yAxisMax, yAxisMin])
			.range([0, height]);
		var yAxisTicks = [];
		yAxisTicks[0] = 0;


		if (datadimMode=="flowsize")
		{
			for(var i = 1; ; i = i + 1){
				yAxisTicks[i] = yAxisTicks[i-1] + 2;//每隔2标一下
				if(yAxisTicks[i] > yAxisMax - 2){
					break;
				}
			}
		}
		else if (datadimMode=="nodenum")
		{
			for(var i = 1; ; i = i + 1){
				yAxisTicks[i] = yAxisTicks[i-1] + 2/*100*/;//每隔2标一下
				if(yAxisTicks[i] > yAxisMax - 2/*100*/){
					break;
				}
			}
		}

		
		var yAxis = d3.svg.axis()
			.scale(yAxisScale)
			.orient("left")
			.tickValues(yAxisTicks);
		chart.append("g")
			.attr("class","y axis")
			.call(yAxis)
			.append("text")
			.attr("transform","rotate(-90)")
			//.attr("transform","translate(" + -5 + "," + 0 + ")")
			.attr("class","label")
			.attr("x",10)
			.attr("y",-25)
			.style("text-anchor","end")
			.text(function(){
					if (datadimMode=="flowsize")
						return "log(Number\n(bytes))";
					else if (datadimMode=="nodenum")
						return "log(Number\n(nodes))";
				});

		//draw chart bars
		var xScale = d3.scale.linear()
					.domain([0, dataArray.length])
					.range([0, width]);

		if (datadimMode=="flowsize")
			var yScale = d3.scale.linear()
								.domain([0, Math.log(maxNum)])
								.range([height, 0]);
		else if (datadimMode=="nodenum")
			var yScale = d3.scale.linear()
								.domain([0, Math.log(maxNum)])
								.range([height, 0]);
					

		hisWidth = xScale(1) - 1;


		
		if (datadimMode=="nodenum")
		{
			for (var i=1;i<=9;++i)
			{
				pile_bars(i);
			}
		}
		else if (datadimMode=="flowsize")
		{
			pile_bars(1);
		}
		
		function pile_bars(level)
		{

			var bias=2;//为了避免L0结点显示不出来而加的bias

			chart.selectAll(/*".bar"*/".bar"+" level-"+level)
	 		.data(dataArray)
	 		.enter()
	 		.append("rect")
	 		
	 		.attr("id",function(d, i){
				return "his-" + d.index;
			})
			.attr("index", function(d, i) {
				return d.index;
			})
			.attr("class", function(d, i) {
				var className = "bar";
				var selectIndex = compareArray.indexOf(d.index);
				if(changeA){
					if (selectIndex == 1){
						className += " previous";
					}
					else if (selectIndex == 0){
						className += " current";
					}
				}else{
					if (selectIndex == 0){
						className += " change-previous";
					}
					else if (selectIndex == 1){
						className += " change-current";
					}
				}
				return className;
			})
			.attr("width", function() {
				return xScale(1) - 1;
			})
			.attr("height",function(d,i){//height是柱子本身的高度
				if (datadimMode=="flowsize")
				{
					return height - yScale(Math.log(d.value)) - 1;
				}
				else if (datadimMode=="nodenum")
				{
					
					//奇数层是灰色的
					var result;
					//最高层放L4Node的数量
					if (level==1)
						result = height - yScale(Math.log(d.value)) +bias;
					//次最高层放L3Node的数量
					else if (level==2)
						result = height - yScale(Math.log(d.L0Node+d.L1Node+d.L2Node+d.L3Node)) +1+bias;
					else if (level==3)
						result = height - yScale(Math.log(d.L0Node+d.L1Node+d.L2Node+d.L3Node)) +bias;
					//次次高层放L2Node的数量
					else if (level==4)
						result = height - yScale(Math.log(d.L0Node+d.L1Node+d.L2Node)) +1+bias;
					else if (level==5)
						result = height - yScale(Math.log(d.L0Node+d.L1Node+d.L2Node)) +bias;
					//次次次高层放L1Node的数量
					else if (level==6)
						result = height - yScale(Math.log(d.L0Node+d.L1Node)) +1+bias;
					else if (level==7)
						result = height - yScale(Math.log(d.L0Node+d.L1Node)) +bias;
					//次次次次高层放L0Node的数量
					else if (level==8)
						result = height - yScale(Math.log(d.L0Node)) + 1+bias;
					else if (level==9)
						result = height - yScale(Math.log(d.L0Node)) + bias;

					
					if (result <= 0 )
						console.log (result,level,height,yScale(Math.log(d.L0Node)));

					return result;
				}
			})
			.attr("x",function(d){ 
				return xScale(d.position) + 1;
			})
			.attr("y",function(d){//y是柱子的位置
				if (datadimMode=="flowsize")
				{
					return yScale(Math.log(d.value));
				}
				else if (datadimMode=="nodenum")
				{
					var result;
					//最高层放L4Node的数量
					if (level==1)
						result = yScale(Math.log(d.value)) -bias;
					//次最高层放L3Node的数量
					else if (level==2)
						result = yScale(Math.log(d.L0Node+d.L1Node+d.L2Node+d.L3Node))-1 -bias;
					else if (level==3)
						result = yScale(Math.log(d.L0Node+d.L1Node+d.L2Node+d.L3Node)) -bias;
					//次次高层放L2Node的数量
					else if (level==4)
						result = yScale(Math.log(d.L0Node+d.L1Node+d.L2Node))-1 -bias;
					else if (level==5)
						result = yScale(Math.log(d.L0Node+d.L1Node+d.L2Node)) -bias;
					//次次次高层放L1Node的数量
					else if (level==6)
						result = yScale(Math.log(d.L0Node+d.L1Node))-1 -bias;
					else if (level==7)
						result = yScale(Math.log(d.L0Node+d.L1Node)) -bias;
					//次次次次高层放L0Node的数量
					else if (level==8)
						result = yScale(Math.log(d.L0Node))-1 -bias;
					else if (level==9)
						result = yScale(Math.log(d.L0Node)) -bias;

					return result;
				}
			})

			.classed(("level-"+level),true)

			.on("mouseover",tip.show)
			.on("mouseout",tip.hide)
			.on('click',function(d,i){
				var selectedID = +d.index;
				if (compareArray.indexOf(selectedID) < 0){
					//compareArray[0] = compareArray[1];
					if(changeA){
						compareArray[1] = selectedID; 
					}else{
						compareArray[0] = selectedID; 
					}
				} 
				else {
					var index = compareArray.indexOf(selectId);
					compareArray.splice(index,1);
				}
				changeComparedData();
				d3.select("#append-rect").select("#percen-rect").remove();
			});
		

		}
		


		// draw x-axis ticks
		if (sortMode == "time") {
			var xBegin = 0;
			for (var i = 0; i < dataArray.length; i++) {
				if (dataArray[i].time.substring(0, 4) != xBegin) {
					xBegin = dataArray[i].time.substring(0, 4);
					xAxisGroup.append("text")
						.attr("class", "tick-label")
						.attr("y", 15)
						.attr("x", chart.select("#his-" + i).attr("x"))
						.text(xBegin);
					
				}
			}			
		}
	

		changeComparedData();
		function changeComparedData() {

			if(changeA){
				d3.selectAll(".selected_seperate_bar")
					.classed("selected_seperate_bar", false)//去红色
					.classed("current", true);//加蓝色
			}else{
				d3.selectAll(".selected_seperate_bar")
					.classed("selected_seperate_bar", false)//去红色
					.classed("change-current", true);//加蓝色
			}
			
			

			chart.selectAll(".previous").classed("previous", false);
			chart.selectAll(".current").classed("current", false);
			chart.selectAll(".change-previous").classed("change-previous", false);
			chart.selectAll(".change-current").classed("change-current", false);
			if(changeA){
				chart.selectAll("#his-" + compareArray[0]).classed("previous", true);
				chart.selectAll("#his-" + compareArray[1]).classed("current", true);
			}else{
				chart.selectAll("#his-" + compareArray[0]).classed("change-previous", true);
				chart.selectAll("#his-" + compareArray[1]).classed("change-current", true);
			}
			
			chart.selectAll(".labelAB").remove();

			for(var l = 0; l < compareArray.length; l++){
				var id = compareArray[l];
				var x = chart.selectAll("#his-" + id).attr("x");
				var y = chart.selectAll("#his-" + id).attr("y") - 3;
				chart
					.append("text")
					.attr("class","labelAB")
					.attr("x", x)
					.attr("y", y)
					.text(function() {
						return l == 0 ? "B" : "A";
					});
			}

			$("#innerTopRight #label-A .date_description").html(function() {
				if (compareArray.length > 0) 
					var timeArray = dataList[compareArray[1]].time.split("-");
					return timeArray[0];
				return "";
			});
			$("#innerTopRight #label-B .date_description").html(function() {
				if (compareArray.length > 1) 
					var timeArray = dataList[compareArray[0]].time.split("-");
					return timeArray[0];
				return "";
			});

			$("#innerTopRight #label-A .value_description").text(function() {
				if (compareArray.length > 0)  
					return  d3.format(".3s")(dataList[compareArray[1]].value) + "bytes" ;
				return "";
			});
			$("#innerTopRight #label-B .value_description").text(function() {
				if (compareArray.length > 1) 
					return d3.format(".3s")(dataList[compareArray[0]].value) + "bytes";
				return "";
			});
			ObserverManager.post("changeData", compareArray);
		}


	}

	function changePercentage(percentage){
		var rectX = + chart.select("#his-" + compareArray[1]).attr("x");
		var rectY = + chart.select("#his-" + compareArray[1]).attr("y");
		var rectWidth = + chart.select("#his-" + compareArray[1]).attr("width");
		var rectHeight = + chart.select("#his-" + compareArray[1]).attr("height");
		var newY = rectY + rectHeight * (1 - percentage);
		d3.select("#append-rect").select("#percen-rect").remove();
		d3.select("#append-rect")
		.append("rect")
		.attr("id","percen-rect")
		.attr("x",rectX)
		.attr("y",(newY))
		.attr("height",rectHeight * percentage)
		.attr("width",hisWidth)
		// .attr("fill","#b2df8a");
		.classed("highlight", true);
	}
	changeLabelC("-", 0, 0, 0, 0);
	function changeLabelC(dataset, nodeID, levelText, flowLevel, treeNodeNum, sumNodeNum){
		$("#innerTopRight #label-C #node-type").text(dataset)
		$("#innerTopRight #label-C #node-type").removeClass("background-A");
		$("#innerTopRight #label-C #node-type").removeClass("background-B");
		$("#innerTopRight #label-C #node-type").addClass("background-" + dataset);

		$("#innerTopRight #label-C #node-description").html(nodeID);
		$("#innerTopRight #label-C #level-description").html(levelText);
		$("#innerTopRight #label-C #flow-description").text(flowLevel);
		$("#innerTopRight #label-C #tree-num-description").text(treeNodeNum);
		$("#innerTopRight #label-C #sum-num-description").text(sumNodeNum);
	}
	SelectTree.OMListen = function(message, data) {
	    if (message == "percentage") {
	    	if (datadimMode=="flowsize")
	    	{
	    		//发送一个百分比data以后，在当前显示的数据A上画出柱子
				changePercentage(data[0]);
			}
			else if (datadimMode=="nodenum")
			{
				var cur_depth=data[1];
				var cur_level=9-2*cur_depth;
				//console.log(d3.selectAll(".current").selectAll(".level-"+cur_level));

				//console.log(changeA)
				if(changeA)
				{
					d3.selectAll(".selected_seperate_bar")
						.classed("selected_seperate_bar", false)//去红色
						.classed("current", true);//加蓝色

					d3.selectAll(".current" + ".level-"+cur_level)
						.classed("selected_seperate_bar", true);//加红色

					d3.selectAll(".current" + ".level-"+cur_level)
						.classed("current", false);//去掉原来的蓝色标记	
				}
				else
				{
					d3.selectAll(".selected_seperate_bar")
						.classed("selected_seperate_bar", false)//去红色
						.classed("change-current", true);//加蓝色

					d3.selectAll(".change-current" + ".level-"+cur_level)
						.classed("selected_seperate_bar", true);//加红色

					d3.selectAll(".change-current" + ".level-"+cur_level)
						.classed("change-current", false);//去掉原来的蓝色标记	
				}
			
				


				
				

				
				
				
			}
	    }
	    if (message == "show-detail-info") {
	    	var dataset = data.dataset;
	    	var node = data.node;
	    	var nodeID = node.key;
	    	var levelText = node.id.split("-").length-1;
	    	var flowLevel = node.flow;
	    	var treeNodeNum = Array.isArray(node.values) ? node.values.length : 0;
	    	var sumNodeNum = node.allChilldrenCount;
	    	changeLabelC(dataset, nodeID, levelText, flowLevel, treeNodeNum, sumNodeNum)

	    }
    }
	return SelectTree;
}
