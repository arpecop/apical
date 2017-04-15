var request = require('request')
request('http://db.arpecop.com/images/_design/items/_view/dirlife?limit=20&reduce=false&include_docs=true', function(error, response, body) {
	if(!error && response.statusCode == 200) {
		var data = JSON.parse(body)
			.rows[0];
		var title = data.doc.title;
		console.log(data);
	}
});
