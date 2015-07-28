function md5Calculator(file) {
	//	var file = $("#uploadSelect")[0].files[0];
	//  file should be a File Object got by input element
	var worker = new Worker("./js/calculator.worker.md5.js");
	worker.addEventListener("message", function(event) {
		if (event.data.result) {
			console.log("md5:", event.data.result);
		}
	});
	var buffer_size = 64 * 16 * 1024;
	var block = {
		'file_size': file.size,
		'start': 0
	};
	block.end = buffer_size > file.size ? file.size : buffer_size;
	var count = 0
	var handle_hash_block = function(event) {
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
	worker.addEventListener('message', handle_hash_block);
	var handle_load_block = function(event) {
		count += 1;
		worker.postMessage({
			'message': event.target.result,
			'block': block
		});
	};
	var reader = new FileReader();
	reader.onload = handle_load_block;
	var blob = file.slice(block.start, block.end);
	reader.readAsArrayBuffer(blob);
}