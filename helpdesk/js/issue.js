frappe.ui.form.on("Issue", {
	onload: function(frm) {
		if(inList(user_roles, "Administrator")){
			cur_frm.toggle_reqd("department", true)
		}
		else{
			cur_frm.toggle_enable("department", false)
		}
	},
});

cur_frm.fields_dict['sub_category'].get_query = function(doc) {
	return {
		filters: {
			"category": doc.department
		}
	}
}

