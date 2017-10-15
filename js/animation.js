function nameInterval() {
	var inserter = document.getElementById("name-animation");
	var messagePart1 = "Hi, I'm Gabriel.";

	var count = 0;

	var print = setInterval(function(){
			//conditional statement must come before += operator,
				if(count === messagePart1.length-1) {
					clearInterval(print);   
			}
			inserter.innerHTML += messagePart1[count];
			count++;

	}, 200);
}

function makeInvisible() {
	$("#greeting").addClass("invisible");
}

function main() {
	setTimeout(nameInterval, 1500);
	makeInvisible();
	
	setTimeout(function(){
	 $("#greeting").removeClass("invisible").addClass("easeIn");
	}, 6500);
	
	setTimeout(function(){
			$('.main-rule').addClass('grow');
	}, 5100);
}


$(document).ready(main);