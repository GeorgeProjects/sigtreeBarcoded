var shown_depth=4;
var height = $("#leftTopWrapper").height();
var width = $("#leftTopWrapper").width();
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
	var widthArray = [24, 18, 12, 6, 2];
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

	var dataProcessor = dataCenter.datasets[0].processor;
	var dataset = dataCenter.datasets[0].processor.result;

	var min = 0;
	var max = 30;
	var sliderHeight = sliderDivHeight;
	var sliderWidth = sliderDivWidth * 2 / 10;
	var linear_tree=[];

	sliderSvg.append("g")
		.attr("id","slider-g")
		.attr("transform","translate(" + sliderDivWidth * 4 / 10 + "," + 0 + ")");

	sliderSvg.select("#slider-g")
		.append("rect")
		.attr("id","back-slider")
		.attr("height",sliderHeight)
		.attr("width",sliderWidth)
		.attr("x",0)
		.attr("y",0)
		.attr("fill","gray");

	var dragDis = 0;
	var drag = d3.behavior.drag()
        .on("drag", function(d,i) {
        	var oy = originArray[i] / max * sliderHeight;
            var dx = +d3.event.x;
            var dy = +d3.event.y - oy;
            if((d3.event.y > 0)&&(d3.event.y < sliderHeight - sliderHeight/50)){
            	d3.select(this).attr("transform", function(d,i){
	                return "translate(" + 0 + "," + dy + ")";
	            });
            }
            dragDis = dy;
        })
        .on("dragend",function(d,i){
        	console.log("dragEnd",dragDis);
        	var value = dragDis / sliderDivHeight * max;
        	var finalValue = originArray[i] + value;
        	finalValue = finalValue > max ? max : finalValue;
        	finalValue = finalValue < min ? min : finalValue;
        	widthArray[i] = finalValue;
        	draw_barcoded_tree(linear_tree,1,100);
        	changePercentage(finalValue);
        });

	sliderSvg.select("#slider-g")
		.selectAll(".slider")
		.data(widthArray)
		.enter()
		.append("rect")
		.attr("class","slider")
		.attr("id",function(d,i){
			return "slider-" + i;
		})
		//.attr("transform", function(d,i){
		//	var value = +d;
		//	return "translate(" + -sliderWidth/4 + "," + value / max * sliderHeight + ")";
		//})
		.attr("x",-sliderWidth/4)
		.attr("y",function(d,i){
			var value = +d;
			return value / max * sliderHeight; 
		})
		.attr("width",sliderWidth + sliderWidth/2)
		.attr("height",sliderHeight/50)
		.on("mouseover",function(d,i){
			d3.select(this).classed("slider-hover",true);
			console.log("drag");
			changePercentage(widthArray[i]);
		})
		.on("mouseout",function(d,i){
			d3.select(this).classed("slider-hover",false);
			clearPercentage();
		})
		.call(drag);
	/*sliderSvg.append("text")
		.attr("id","text-0")
		.attr("x",0)
		.attr("y",0)
		.attr("width",3)
		.attr("height",3)
		.text("0")
		.attr("font-family","sans-serif")
		.attr("font-size","20px")
		.attr("fill","red");*/
	//注意：JS中函数参数传递不是按引用传的
	//函数内部如果直接给传入的对象赋值，效果是对内部的拷贝赋值；如果修改传入的对象的成员，那么修改能够影响到传入的对象

	//用树结构存储公共树
	var target_root={
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
	//用数组存储公共树
	merge_preprocess_rawdata(dataset.dataList,target_root,1);

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
	//把traverse和需要使用的局部静态变量包起来
	function linearlize(root,target_linear_tree)
	{
		//traverse递归中要保持的static变量
		var cur_index = 0;
		//传入树根和用于存储线性化的树的数组
		//traverse中按深度优先进行线性化以及标记每个结点的linear_index
		function traverse(root,target_linear_tree)
		{
			if (typeof(root)=="undefined")
				return;

			root.linear_index=cur_index;//记录每个结点在数组中的index
			target_linear_tree[cur_index]=root;

			if (typeof(root.children)=="undefined")
				return;

			var cur_root_children_num=root.children.length;
			for (var i=0;i<cur_root_children_num;++i)
			{
				cur_index=cur_index+1;
				traverse(root.children[i],target_linear_tree);
			}
		}
		traverse(target_root,linear_tree);
	}
	linearlize(target_root,linear_tree);
	cal_trees_colors(linear_tree,1);
	console.log(target_root);
	draw_barcoded_tree(linear_tree,1,100);

	//将data合并到init_root中
	//如果init_root不是空树，merge的过程就是在做两棵树的合并
	//curtreeindex表示当前合并的树的编号
	function merge_preprocess_rawdata(data,init_root,curtreeindex){
		//第一步检查SPE
		for (var i=0;i<data.length;++i)//循环一遍所有数据，建完所有SPE层节点再看下面的节点
		{
			//不是有效数据的暂时丢掉
			if (data[i]["ATM数据"]=="有效数据")
			{
				//传的是地址而不是内容
				//所以修改cur_SPE_group时init_root.children也会变
				var cur_SPE_group=init_root.children;//当前考虑的那组SPE
				var flag_new_SPE=1;

				var cur_SPE=data[i].atm;
				//var cur_SPE=data[i]["SPE号"];

				for (var j=0;j<cur_SPE_group.length;++j)//检查一遍当前已经创建出来的SPE层节点
				{
					if (cur_SPE_group[j].name==data[i].atm)//如果已经创建过了，那么就不是新的了
					//if (cur_SPE_group[j].name==data[i]["SPE号"])//如果已经创建过了，那么就不是新的了
					{
						//如果是对其他树调用merge时创建过的SPE，那么这个SPE至少在两棵树里面出现过的	
						if (cur_SPE_group[j].mark !=curtreeindex)
						{
							cur_SPE_group[j].mark=0;
						}
						
						flag_new_SPE=0;
						break;
					}
				}				
				//原来没有创建过的SPE号
				if (flag_new_SPE==1)
				{
					var new_SPE_group_length=cur_SPE_group.length+1;

					cur_SPE_group[new_SPE_group_length-1]={
						mark:curtreeindex,
						_depth:1,
						name:cur_SPE,
						description:cur_SPE,
						children:new Array(),//最底层结点没有children这个维度
						//只有最底层的结点有size
						_father:init_root
					}
				}
			}
		}			
		//第二步检查AAL
		for (var i=0;i<data.length;++i)//对于每个数据
		{
			//不是有效数据的暂时丢掉
			if (data[i]["ATM数据"]=="有效数据")
			{
				var cur_SPE=data[i].atm;
				//var cur_SPE=data[i]["SPE号"];
				var cur_AAL=data[i].aal;//可能为AAL1/AAL2/AAL5
				//var cur_AAL=data[i]["适配层/百分比例"].substr(0,4);//可能为AAL1/AAL2/AAL5
				
				//循环寻找当前的SPE在树中位置
				for (var j=0;j<init_root.children.length;++j)
				{
					if (init_root.children[j].name==cur_SPE)
					{
						//当前的SPE在树中的位置
						var cur_SPE_position=init_root.children[j];
					}
				}

				var cur_AAL_group=cur_SPE_position.children;
				//当前的SPE的children数
				var cur_AAL_group_length=cur_AAL_group.length;
					
				var flag_new_AAL=1;
				var cur_AAL_index=0;//这个AAL在当前的SPE中的下标位置
				var cur_AAL_position;//当前的AAL在树中的位置

				//循环寻找当前的AAL在树中位置
				for (var j=0;j<cur_AAL_group_length;++j)
				{
					if (cur_AAL_group[j].name==cur_AAL)
					{
						cur_AAL_index=j;
						cur_AAL_position=cur_AAL_group[j];
						flag_new_AAL=0;

						if (cur_AAL_position.mark !=curtreeindex)
						{
							cur_AAL_position.mark=0;
						}
						break;
					}
				}

				//原来没有创建过的AAL
				if (flag_new_AAL==1)
				{
					var new_length_AAL=cur_AAL_group_length+1;
						
					cur_AAL_group[new_length_AAL-1]={
						mark:curtreeindex,
						_depth:2,
						name:cur_AAL,
						description:cur_AAL,
						children:new Array(),//最底层结点没有children这个维度
						//只有最底层的结点有size
						_father:cur_SPE_position
					}
					cur_AAL_index=new_length_AAL-1;
					cur_AAL_position=cur_AAL_group[new_length_AAL-1];
				}
					
					
				//第三步检查VPI_VCI，创建VPI
				var cur_VPI=data[i].vpi;
				//var cur_VPI=data[i]["VPI/VCI"].substr(0,10);
				var cur_VPI_group=cur_AAL_position.children;
				//当前AAL的children数
				var cur_VPI_group_length=cur_VPI_group.length;
					
				var flag_new_VPI=1;
				var cur_VPI_index=0;//这个VPI在当前的AAL中的下标位置
				var cur_VPI_position;//当前的VPI在树中的位置

				for (var j=0;j<cur_VPI_group_length;++j)
				{
					if (cur_VPI_group[j].name==cur_VPI)
					{
						cur_VPI_index=j;
						cur_VPI_position=cur_VPI_group[j];
						flag_new_VPI=0;

						if (cur_VPI_group[j].mark !=curtreeindex)
						{
							cur_VPI_group[j].mark=0;
						}
						break;
					}
				}

					
				//原来没有创建过的VPI
				if (flag_new_VPI==1)
				{
					var new_length_VPI=cur_VPI_group_length+1;

					cur_VPI_group[new_length_VPI-1]={
						mark:curtreeindex,
						//depth:3,
						_depth:3,
						name:cur_VPI,
						description:cur_VPI,
						children:new Array(),//最底层结点没有children这个维度
						//只有最底层的结点有size：...

						_father:cur_AAL_position
					}
					cur_VPI_index=new_length_VPI-1;
					cur_VPI_position=cur_VPI_group[new_length_VPI-1];
				}
					
					
				//第四步检查VPI_VCI，创建cid
				var cur_CID=data[i].cid;
				//var cur_CID=data[i]["VPI/VCI"].substr(19,2);

				//需要检查是否是undefined，因为data数组中有的元素不存在cid分量
				if (cur_CID=="" || typeof(cur_CID)=="undefined")//检查是否有cid
				{
					cur_CID="none";
				}

				var cur_CID_group=cur_VPI_position.children;
				//当前VPI的children分量的length
				var cur_CID_group_length=cur_CID_group.length;
					
				var flag_new_CID=1;
				var cur_CID_index=0;//这个CID在当前的VPI中的下标位置
				var cur_CID_position;//当前的CID在树中的位置

				for (var j=0;j<cur_CID_group_length;++j)
				{
					if (cur_CID_group[j].name==cur_CID)
					{
						cur_CID_index=j;
						cur_CID_position=cur_CID_group[j];
							
						flag_new_CID=0;

						//原来在别的树的这个结点创建过的CID						
						if (cur_CID_group[j].mark !=curtreeindex)
						{
							var new_length_CID=cur_CID_group_length;
							
							cur_CID_group[j].mark=0;

							var cur_CID_numvalue=+data[i].flowSize;
							//var cur_CID_numvalue=data[i]["比例"];
							//cur_CID_numvalue=cur_CID_numvalue.substring(cur_CID_numvalue.indexOf('：')+1, cur_CID_numvalue.indexOf('字'));
							//cur_CID_numvalue=+cur_CID_numvalue;

							cur_CID_group[j].trees_values[curtreeindex]=cur_CID_numvalue;

							//size统计该节点在所有树上的值的总和
							cur_CID_group[j].size=0;
							for (var k=0;k<cur_CID_group[j].trees_values.length;++k)
							{
								if (typeof(cur_CID_group[j].trees_values[k])!="undefined")
								{
									cur_CID_group[j].size=(+cur_CID_group[j].size)+(+cur_CID_group[j].trees_values[k]);
								}
							}
						}					
						break;
					}
				}

				//原来没有创建过的CID
				if (flag_new_CID==1)
				{
					var new_length_CID=cur_CID_group_length+1;

					var cur_CID_numvalue=+data[i].flowSize;
					//var cur_CID_numvalue=data[i]["比例"];
					//cur_CID_numvalue=cur_CID_numvalue.substring(cur_CID_numvalue.indexOf('：')+1, cur_CID_numvalue.indexOf('字'));
					//cur_CID_numvalue=+cur_CID_numvalue;
						
					cur_CID_group[new_length_CID-1]={
						mark:curtreeindex,
						_depth:4,
						name:cur_CID,
						description:cur_CID,
						//children:new Array(),//最底层的CID层结点没有children这个维度
						//size统计该节点在所有树上的值的总和
						size:cur_CID_numvalue,//只有最底层的CID层结点有size：...

						_father:cur_VPI_position
					}
					cur_CID_group[new_length_CID-1].trees_values=[];
					cur_CID_group[new_length_CID-1].trees_values[curtreeindex]=cur_CID_numvalue;
					
					cur_CID_index=new_length_CID-1;
					cur_CID_position=cur_VPI_group[new_length_CID-1];
				}			
			}
		}
			
		aggregate_separate_tree_value(init_root);

		
	}

	//在并集树只有cid层的结点记录了每个结点在每个tree上的val的情况下，向上导出所有节点的在每个tree上的val的情况
	//并且给每个结点记录上其route
	function aggregate_separate_tree_value(init_root)
	{
		//cur_node_layer0是人为添加的结点
		var cur_node_layer0=init_root;

		//记录所有的tree在该结点处的值
		var layer0_trees_values=[];

		for (var i=0;i<cur_node_layer0.children.length;++i)
		{
			//cur_node_layer1是一个SPE层节点
			var cur_node_layer1=cur_node_layer0.children[i];
			cur_node_layer1.route="route"+String(i);

			//记录所有的tree在该结点处的值
			var layer1_trees_values=[];

			for (var j=0;j<cur_node_layer1.children.length;++j)
			{
				//cur_node_layer2是一个AAL层节点
				var cur_node_layer2=cur_node_layer1.children[j];
				cur_node_layer2.route="route"+String(i)+"_"+String(j);

				//记录所有的tree在该结点处的值
				var layer2_trees_values=[];
				
				for (var k=0;k<cur_node_layer2.children.length;++k)
				{
					//cur_node_layer3是一个VPI层节点
					var cur_node_layer3=cur_node_layer2.children[k];
					cur_node_layer3.route="route"+String(i)+"_"+String(j)+"_"+String(k);

					//记录所有的tree在该结点处的值
					var layer3_trees_values=[];

					for (var l=0;l<cur_node_layer3.children.length;++l)
					{
						//cur_node_layer4是一个CID层节点
						//CID层是叶子层
						var cur_node_layer4=cur_node_layer3.children[l];
						cur_node_layer4.route="route"+String(i)+"_"+String(j)+"_"+String(k)+"_"+String(l);

						//对每个被合并的树提供的值进行循环
						//cur_node_layer4.trees_values.length是被合并的树的数量上限
						for (var m=0;m<cur_node_layer4.trees_values.length;++m)//往上层聚集
						{
							//如果原来累计过
							if (isInt(layer3_trees_values[m]))
								layer3_trees_values[m]=layer3_trees_values[m]+cur_node_layer4.trees_values[m];
							else//没有累计过
								layer3_trees_values[m]=cur_node_layer4.trees_values[m];
						}
					}


					cur_node_layer3.trees_values=[];//先开数组之后才能对数组元素赋值
					//cur_node_layer4.trees_values.length是被合并的树的数量上限
					for (var m=0;m<cur_node_layer4.trees_values.length;++m)
					{
						cur_node_layer3.trees_values[m]=layer3_trees_values[m];
						if (! isInt(cur_node_layer3.trees_values[m]))
						{
							cur_node_layer3.trees_values[m]=0;
						}
					}
					for (var m=0;m<cur_node_layer3.trees_values.length;++m)
					{
						if (isInt(layer2_trees_values[m]))
							layer2_trees_values[m]=layer2_trees_values[m]+cur_node_layer3.trees_values[m];
						else
							layer2_trees_values[m]=cur_node_layer3.trees_values[m];
					}
					
				}


				cur_node_layer2.trees_values=[];//先开数组之后才能对数组元素赋值
				//cur_node_layer3.trees_values.length也是被合并的树的数量上限
				for (var m=0;m<cur_node_layer3.trees_values.length;++m)
				{
					cur_node_layer2.trees_values[m]=layer2_trees_values[m];
					if (! isInt(cur_node_layer2.trees_values[m]))
					{
						cur_node_layer2.trees_values[m]=0;
					}
				}
				for (var m=0;m<cur_node_layer2.trees_values.length;++m)
				{
					if (isInt(layer1_trees_values[m]))
						layer1_trees_values[m]=layer1_trees_values[m]+cur_node_layer2.trees_values[m];
					else
						layer1_trees_values[m]=cur_node_layer2.trees_values[m];
				}
			}


			cur_node_layer1.trees_values=[];//先开数组之后才能对数组元素赋值
			//cur_node_layer2.trees_values.length也是被合并的树的数量上限
			for (var m=0;m<cur_node_layer2.trees_values.length;++m)
			{
				cur_node_layer1.trees_values[m]=layer1_trees_values[m];
				if (! isInt(cur_node_layer1.trees_values[m]))
				{
					cur_node_layer1.trees_values[m]=0;
				}
			}
			for (var m=0;m<cur_node_layer1.trees_values.length;++m)
			{
				if (isInt(layer0_trees_values[m]))
					layer0_trees_values[m]=layer0_trees_values[m]+cur_node_layer1.trees_values[m];
				else
					layer0_trees_values[m]=cur_node_layer1.trees_values[m];
			}
		}


		cur_node_layer0.trees_values=[];//先开数组之后才能对数组元素赋值
		//cur_node_layer1.trees_values.length也是被合并的树的数量上限
		for (var m=0;m<cur_node_layer1.trees_values.length;++m)
		{
			cur_node_layer0.trees_values[m]=layer0_trees_values[m];
			if (! isInt(cur_node_layer0.trees_values[m]))
			{
				cur_node_layer0.trees_values[m]=0;
			}
		}
		
	}

	//输入线性化以后的树，以及需要计算所有节点对应颜色的那棵树的编号后，计算所有节点的颜色
	function cal_trees_colors(linear_tree,cur_tree_index)
	{
		//结点的亮度映射
		//用于给不存在的结点赋的，能使得这个结点看不见的，最最高的亮度
		var luminance_max=0;
		var luminance = d3.scale.sqrt()//linear()//.sqrt()//配色的亮度
						    .domain([0, 1])//定义域
						    .clamp(true)
						    .range([luminance_max, 0]);//值域


		for (var i=0;i<linear_tree.length;++i)//对于线性化的并集树中每个元素循环
		{
			var cur_element=linear_tree[i];

			//如果原来这棵树没有这个结点，那么补出一个none
			if (typeof(cur_element.trees_values[cur_tree_index])=="undefined")
			{
				cur_element.trees_values[cur_tree_index]="none";
			}
			
			var cur_element_value=cur_element.trees_values[cur_tree_index];
			if (cur_element_value=="none")//none对应数值0
				cur_element_value=0;
			

			//计算在cur_tree_index对应的树中，当前结点应有的亮度
			if (cur_element._depth==0)//对于根节点，直接赋予luminance(1)
			{
				var cur_color_lum=luminance(1);
			}
			else//非根节点
			{
				//如果原来这棵树没有这个结点的父节点（即这个结点和其父都不在这棵树出现），那么补出一个none
				if (typeof(cur_element._father.trees_values[cur_tree_index])=="undefined")
				{
					cur_element._father.trees_values[cur_tree_index]="none";
				}

				var cur_element_father_value=cur_element._father.trees_values[cur_tree_index];
				if (cur_element_father_value=="none")//none对应数值0
					cur_element_father_value=0;

				//用一个结点的数值除以其父的数值来决定其亮度，由此能够比较一个结点与其兄弟之间的数值
				//相对数值越大的结点，传入luminance的值越大，映射出的值越小，画出来的颜色越深
				//当相对数值趋向0时，结点变为无色
				if (cur_element_father_value!=0)
					var cur_color_lum=luminance(cur_element_value/cur_element_father_value);
				else
					var cur_color_lum=luminance_max;//如果father_value等于0，意味着这个点的父不在这棵树中出现，这个点本身也不在这棵树出现，那么这样的点应该为无色，所以赋最高的luminance

				//console.log(cur_element_value,cur_element_father_value,cur_color_lum)
			}


			//基础颜色是steelblue
			var cur_index_default_color="black";
			var cur_element_cur_index_default_color=d3.lab(cur_index_default_color)

			//console.log(cur_color_lum)
			cur_element_cur_index_default_color.l=cur_color_lum;

			if (typeof(cur_element.trees_default_colors)=="undefined")//原来没有开过数组的话要撑开来
			{
				cur_element.trees_default_colors=[];
			}
			//记录当前元素的默认color
			cur_element.trees_default_colors[cur_tree_index]=cur_element_cur_index_default_color;
		}
	}


	//判断一个数字或者字符串里面有没有数字以外的值
	function isInt(str){
		var reg = /^(-|\+)?\d+$/ ;
		return reg.test(str);
	}

	function draw_barcoded_tree_depth(linear_tree,cur_tree_index,depth){
		console.log(depth);
		xCompute = 0;
		var changeWidthArray = [];
		for(var i = 0;i < widthArray.length;i++){
			changeWidthArray[i] = 0;
		}
		for(var i = 0; i < widthArray.length; i++){
			if(i <= depth){
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
			return changeWidthArray[d._depth];
		})
		.attr('height',function(d,i){
			return rectHeight;
		})
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
	//给定合并后的并集树linear_tree，当前要画的树的编号cur_tree_index，要画的高度位置cur_biasy
	function draw_barcoded_tree(linear_tree,cur_tree_index,cur_biasy)
	{
		xCompute = 0;
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
		cur_biasy = 150;
		d3.select("#radial").selectAll("*").remove();
		var svg = d3.select('#radial'); 
		var tooltip = d3.select("body")
					    .append("div")
					    .attr("class", "tooltip")
					    .style("position", "absolute")
					    .style("z-index", "10")
					    .style("opacity", 0);
		svg.selectAll('.bar')
		.data(linear_tree)
		.enter()
		.append('rect')
		.attr('class',function(d,i){
			var fatherIndex = -1;
			if(d._father!=undefined){
				fatherIndex = d._father.linear_index;
			}
			return 'bar-class num-' + widthArray[d._depth] + 'father-' + fatherIndex;
		})
		.attr('id',function(d,i){
			return  'bar-id' + d.linear_index;
		})
		.attr('x',function(d,i){
			var backXCompute = xCompute;
			xCompute = xCompute + widthArray[d._depth] + 1;
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
		.on('mousemove',function(d,i){
			var fatherIndex = -1;
			var thisIndex = d.linear_index;
			if(d._father!=undefined){
				fatherIndex = d._father.linear_index;
			}
			svg.selectAll('.num-' + widthArray[d._depth] + 'father-' + fatherIndex)
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
					    }) 
						;
							
			var strs = str.split("，") ;
			
			console.log(strs);
								
			text.selectAll("tspan")
					.data(strs)
					.enter()
					.append("tspan")
					.attr("x",text.attr("x"))
					.attr("dy","1em")
					.text(function(d){
						return d;
					})
					;
		}
	}

	
		

	function creat_button(rect_attribute_button){
		var width = rect_attribute_button.width;  //画布的宽度
		var height = rect_attribute_button.height;   //画布的高度
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
 
 		var tooltip=d3.selectAll("#tooltip");

		

		g.append("rect")

					.datum(cur_data)//绑定数据以后，后面的function才能接到d，否则只能接到this
					
					.on("mouseover",mouseover_function)
					.on("click",mouseclick_function)

					.on("mouseout",function(){
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
					
					.attr("style",
								"width:"+width+"px;"+
								"height:"+height+"px;"+
								"color:"+font_color+";"+
								"font-size:"+font_size
								)
					.attr("transform",function(d,i){  
				        return "translate(" + (biasx) + "," + (biasy) + ")";  
				    }) 
				    .attr("fill",function(d,i){  
				        return background_color;  
				    }) 
					;


	}
	$("#default").attr("checked",true);
	$("#radial-depth-controller").on("click", ".level-btn", function(){

		// $("#radial-depth-controller .level-btn").removeClass("active");
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