frappe.provide("helpdesk");

frappe.pages['dashboard'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'Helpdesk Dashboard',
		single_column: true
	});

	setTimeout(function(){
		new helpdesk.DashboardGridView(wrapper, page);
	}, 5)
	frappe.breadcrumbs.add("HelpDesk")
}

helpdesk.DashboardGridView = Class.extend({
	init: function(wrapper, page) {
		this.make_filters(wrapper)
		this.bind_filters()
		
		var me = this;

		this.report = $('<div class="grid-report"></div>').appendTo(this.page.main);
		this.page.main.find(".page").css({"padding-top": "0px"});
		this.plot_area = $('<div class="plot"></div>').appendTo(this.report);
		
		this.summary = $('<div id="summary"></div>').appendTo(this.page.main);
		
		this.report.css({
			"border-style":"solid",
			"border-width": "2px",
			"border-radius": "10px"
		})
		this.summary.css({
			"border-style":"none solid solid",
			"border-width": "2px",
			"border-radius": "10px"
		})

		this.make_waiting();
		this.refresh();
	},
	refresh: function(){
		if(!this.check_mandatory_fields())
			return

		var me = this;
		this.waiting.toggle(true);
		return frappe.call({
			method: "helpdesk.helpdesk.page.dashboard.dashboard.get_support_ticket_data",
			type: "GET",
			args: {
				args:{
						start: this.page.fields_dict.start.get_parsed_value(),
						end: this.page.fields_dict.end.get_parsed_value(),
						status: this.page.fields_dict.status.get_parsed_value(),
						dept: this.page.fields_dict.branch.get_parsed_value(),
						user: frappe.user.name
				}
			},
			callback: function(r){
				if(r.message.plot_data){
					me.data = r.message.plot_data;
					me.waiting.toggle(false);
					me.render_plot();
				}
				else{
					me.plot_area.toggle(false);
					me.waiting.html("Support Ticket records not found for selected filters");
					me.waiting.toggle(true);
				}

				delete r.message["plot_data"]
				// render summary information
				$("#summary").html(frappe.render_template("summary_template", r.message));
			}
		});
	},
	make_filters: function(wrapper){
		var me = this;
		this.page = wrapper.page;

		this.page.set_primary_action(__("Refresh"),
			function() { me.refresh(); }, "icon-refresh")

		this.start = this.page.add_field({fieldtype:"Date", label:"From Date", fieldname:"start", reqd:1,
			default:dateutil.add_days(dateutil.get_today(), -30)});
		this.end = this.page.add_field({fieldtype:"Date", label:"To Date", fieldname:"end", reqd:1,
			default:dateutil.get_today()});
		this.status = this.page.add_field({fieldtype:"Select", fieldname: "status", 
			label: __("Ticket Status"), options:["All", "Open", "Pending", "Closed"], default:"All"});
		this.department = this.page.add_field({fieldtype:"Link", label:"Branch",
			fieldname:"branch", options:"Branch"});
	},
	bind_filters:function(){
		var me = this
		this.start.$input.change(function(){
			me.validate_fields_and_refresh();
		});
		this.end.$input.change(function(){
			me.validate_fields_and_refresh();
		});
		this.status.$input.change(function(){
			me.validate_fields_and_refresh();
		});
		this.department.$input.change(function(){
			me.validate_fields_and_refresh();
		});
	},
	make_waiting: function() {
		this.waiting = frappe.messages.waiting(this.report, __("Loading Report")+"...");
	},
	render_plot: function() {
		var plot_data = this.data
		if(!plot_data) {
			this.plot_area.toggle(false);
			return;
		}
		frappe.require('assets/frappe/js/lib/flot/jquery.flot.js');
		frappe.require('assets/frappe/js/lib/flot/jquery.flot.downsample.js');

		this.plot = $.plot(this.plot_area.toggle(true), plot_data, this.get_plot_options());

		this.setup_plot_hover();
	},
	setup_plot_check: function() {
		var me = this;
		me.wrapper.bind('make', function() {
			me.wrapper.on("click", ".plot-check", function() {
				var checked = $(this).prop("checked");
				var id = $(this).attr("data-id");
				if(me.item_by_name) {
					if(me.item_by_name[id]) {
						me.item_by_name[id].checked = checked ? true : false;
					}
				} else {
					$.each(me.data, function(i, d) {
						if(d.id==id) d.checked = checked;
					});
				}
				me.render_plot();
			});
		});
	},
	setup_plot_hover: function() {
		var me = this;
		this.tooltip_id = frappe.dom.set_unique_id();
		function showTooltip(x, y, contents) {
			$('<div id="' + me.tooltip_id + '">' + contents + '</div>').css( {
				position: 'absolute',
				display: 'none',
				top: y + 5,
				left: x + 5,
				border: '1px solid #fdd',
				padding: '2px',
				'background-color': '#ffffd2',
				opacity: 0.80
			}).appendTo("body").fadeIn(200);
		}

		this.previousPoint = null;
		this.report.find('.plot').bind("plothover", function (event, pos, item) {
			if (item) {
				if (me.previousPoint != item.dataIndex) {
					me.previousPoint = item.dataIndex;

					$("#" + me.tooltip_id).remove();
					idx = item.dataIndex
					names = item.series.data[idx][2]
					showTooltip(item.pageX, item.pageY,
						me.get_tooltip_text(item.series.label, item.datapoint[0], item.datapoint[1], names));
				}
			}
			else {
				$("#" + me.tooltip_id).remove();
				me.previousPoint = null;
			}
	    });

	},
	get_tooltip_text: function(label, x, y, names) {
	 	html =  '<table border=1 style="border-collapse: collapse;">\
				  <tr>\
				    <td colspan="2" align="center"><b>%(label)s Tickets</b></td>\
				  </tr>\
				  <tr>\
				    <td><b>Date</b></td>\
				    <td style="padding: 5px;">%(date)s</td>\
				  </tr>\
				  <tr>\
				    <td><b>No. Of Tickets</b></td>\
				    <td style="padding: 5px;" align="right">%(value)s</td>\
				  </tr>\
				  <tr>\
				    <td><b>Ticket ID"s</b></td>\
				    <td style="padding: 5px;">%(name)s</td>\
				  </tr>\
				</table>'

	 	return repl(html, {
	 		label:label,
	 		date: dateutil.obj_to_user(new Date(x)),
	 		value: format_number(y, null, 0),
	 		name: names
	 	})
	},
	get_plot_options: function() {
		return {
			colors: this.get_legend_colors(),
			grid: { hoverable: true, clickable: true },
			xaxis: { mode: "time",
				min: dateutil.str_to_obj(this.page.fields_dict.start.get_parsed_value()).getTime(),
				max: dateutil.str_to_obj(this.page.fields_dict.end.get_parsed_value()).getTime() 
			},
			yaxis: { autoscaleMargin: 1 },
			series: { downsample: { threshold: 1000 } }
		}
	},
	get_legend_colors: function(){
		status = this.status.get_parsed_value();
		open_tkt = "rgb(237,194,64)";
		closed_tkt = "rgb(203,75,75)";
		pending_tkt = "rgb(175,216,248)";
		colors = [open_tkt, closed_tkt, pending_tkt];
		
		if(status == "Pending")
			colors = [pending_tkt];
		else if(status == "Closed")
			colors = [closed_tkt];
		else if(status == "Open")
			colors = [open_tkt];
		return colors
	},
	check_mandatory_fields: function(){
		start = this.page.fields_dict.start.get_parsed_value()
		end = this.page.fields_dict.end.get_parsed_value()

		if(!(start || end)){
			frappe.msgprint("From Date and To Date are mandatory", "Validate Error");
			return false
		}
		else if(!start){
			frappe.msgprint("From Date is mandatory", "Validate Error");
			return false
		}
		else if(!end){
			frappe.msgprint("To Date is mandatory", "Validate Error");
			return false
		}
		else
			return true
	},
	validate_fields_and_refresh: function(me){
		if(this.check_mandatory_fields()){
			start = new Date(this.page.fields_dict.start.get_parsed_value());
			end = new Date(this.page.fields_dict.end.get_parsed_value());
			dept = this.page.fields_dict.branch.get_parsed_value();
			status = this.page.fields_dict.status.get_parsed_value();
	
			if(end < start){
				frappe.msgprint("To Date must be greater than From Date", "Validate Error");
			}
			else{
				this.refresh();
			}
		}
	},
});