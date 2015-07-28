function sha1Calculator(file) {
	var worker, reader, i, buffer_size, block, blob, handle_hash_block, handle_load_block;
	var max_crypto_file_size = 500 * 1024 * 1024;
	if (file.size < max_crypto_file_size) {
		var reader = new FileReader();
		reader.onload = function(event) {
			var data = event.target.result;
			window.crypto.subtle.digest({
					name: "SHA-1"
				}, data)
				.then(function(hash) {
					var hexString = '',
						hashResult = new Uint8Array(hash);
					for (var i = 0; i < hashResult.length; i++) {
						hexString += ("00" + hashResult[i].toString(16)).slice(-2);
					}
					console.log("SHA1:",hexString);
				})
				.catch(function(error) {
					console.error(error);
				});
		};
		reader.readAsArrayBuffer(file);
	} else {
		worker = new Worker('/js/calculator.worker.sha1.js');
		worker.addEventListener('message', function(event) {
			if (event.data.result) {
				console.log("SHA1:", event.data.result);
			}
		});
		handle_load_block = function(event) {
			worker.postMessage({
				'message': event.target.result,
				'block': block
			});
		};
		handle_hash_block = function(event) {
			if (block.end !== file.size) {
				block.start += buffer_size;
				block.end += buffer_size;
				if (block.end > file.size) {
					block.end = file.size;
				}
				reader = new FileReader();
				reader.onload = handle_load_block;
				blob = file.slice(block.start, block.end);
				reader.readAsArrayBuffer(blob);
			}
		};
		buffer_size = 64 * 16 * 1024;
		block = {
			'file_size': file.size,
			'start': 0
		};
		block.end = buffer_size > file.size ? file.size : buffer_size;
		worker.addEventListener('message', handle_hash_block);
		reader = new FileReader();
		reader.onload = handle_load_block;
		blob = file.slice(block.start, block.end);
		reader.readAsArrayBuffer(blob);
	}
}