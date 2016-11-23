cur_frm.add_fetch("raised_email", "mobile_number", "mobile_number")

frappe.ui.form.on("Issue", {
	// onload: function(frm) {
	// 	if(inList(user_roles, "Administrator")){
	// 		cur_frm.toggle_reqd("department", true)
	// 	}
	// 	else{
	// 		cur_frm.toggle_enable("department", false)
	// 	}
	// },
});

cur_frm.fields_dict['sub_category'].get_query = function(doc) {
	return {
		filters: {
			"category": doc.department
		}
	}
}

cur_frm.fields_dict['raised_email'].get_query = function(doc) {
	return {
		filters: {
			"name": user
		}
	}
}
