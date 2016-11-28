cur_frm.add_fetch("raised_email", "mobile_number", "mobile_number")
cur_frm.add_fetch("question", "category", "department")
cur_frm.add_fetch("question", "sub_category", "sub_category")

frappe.ui.form.on("Issue", {
	refresh: function(frm) {
		fields = ["raised_email", "branch", "branch_phone_no", "mobile_number", "question", "priority",
		"problem_since_", "department", "sub_category", "description"]

		if(!inList(user_roles, "Branch User")) {
			$.each(fields, function(idx, field) {
				cur_frm.toggle_enable(field, false)
			})
		}
	}
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

cur_frm.fields_dict['question'].get_query = function(doc) {
	return {
		filters: {
			"category": doc.department,
			"sub_category": doc.sub_category
		}
	}
}