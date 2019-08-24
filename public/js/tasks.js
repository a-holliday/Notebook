

$("ul").on("click", "li", function(){
	
	$(this).toggleClass("completed");
	//change state of item
});

$("ul").on("click", "span", function(event){
	$(this).parent().fadeOut(500,function(){
		//remove from database
		$(this).remove(); // this refers to parent

	});
	event.stopPropagation(); //stops the event listener from bubbling up to the li, ul, etc
});

$("input[type='text']").keypress(function(event){
	if(event.which === 13){
		console.log("You hit enter!")
		todoText = $(this).val(); //takes input and puts in text value after enter is pressed
		$(this).val("");
		$("ul").append("<li> " + todoText + " <span><i class = 'far fa-times-circle'></i></span></li>")
	}
});

