cur_frm.fields_dict['sub_category'].get_query = function(doc) {
	return {
		filters: {
			"category": doc.category
		}
	}
}