/**
 *  Virtual Librarian Skill code
 *  written by Darian Johnson
 *  @darianbjohnson (twitter)
 * Built on template provide by Amazon 
   
    Copyright 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
    Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
        http://aws.amazon.com/apache2.0/
    or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
*/


/**
 * App ID for the skill
 */
var APP_ID = undefined; //replace with 'amzn1.echo-sdk-ams.app.[your-unique-value-here]';

var https = require('https');
var request = require('request');
var stringify = require('json-stringify-safe');
var querystring = require("querystring");
var parseString = require('xml2js').parseString;
var striptags = require('striptags');

var AWS = require('aws-sdk'); 
var sns = new AWS.SNS();
var ddb = new AWS.DynamoDB();

var util = require('util'),
OperationHelper = require('apac').OperationHelper;

var opHelper = new OperationHelper({
    awsId:     '<AWSID>',
    awsSecret: '<AWS SERCTET>',
    assocId:   '<ASSOC ID>', 
});

/**
 * The AlexaSkill Module that has the AlexaSkill prototype and helper functions
 */
var AlexaSkill = require('./AlexaSkill');


/**
 * Librarian is a child of AlexaSkill.
 * To read more about inheritance in JavaScript, see the link below.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Introduction_to_Object-Oriented_JavaScript#Inheritance
 */
var Librarian = function() {
    AlexaSkill.call(this, APP_ID);
};

// Extend AlexaSkill
Librarian.prototype = Object.create(AlexaSkill.prototype);
Librarian.prototype.constructor = Librarian;

//var accessToken = ""

var sessionAttributes = {}; 
var monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
    ];

var monthNums = ["01", "02", "03", "04", "05", "06",
                      "07", "08", "09", "10", "11", "12"];


Librarian.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {
    console.log("Librarian onSessionStarted requestId: " + sessionStartedRequest.requestId
        + ", sessionId: " + session.sessionId);
};

Librarian.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
    console.log("Librarian onLaunch requestId: " + launchRequest.requestId + ", sessionId: " + session.sessionId);
    getWelcomeResponse(response);
};

Librarian.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {
    console.log("onSessionEnded requestId: " + sessionEndedRequest.requestId
        + ", sessionId: " + session.sessionId);

};

/**********************************************************************************
 *  INTERPRET INTENTS AND ROUTE APPROPRIATELY
 *  This section routes the user to the correct intent
 * 
 * SelectList:
 *		provide lists available
 *		routes user to correct function once the genre/list combination is provided
 *
 * Repeatgenre
 *	Provides a list of genres
 *
 * GetAuthorList
 *	Gets list based on author name (either provided via a slot, or based on the author of a selected book)
 * 
 * GetBookDetails
 *	Provides detailed information on a book
 * 
 * GetSimilarBooksList
 *	Provides a list of similar books (from Amazon)
 * 
 * GetSavedBooks
 *	Get the list of books saved by the user
 *
 * AddtoShelf
 *	Add a book to the user's saved books list
 *
 * RemovefromShelf
 *	Remove a book from the user's saved books list
 * 
 */

Librarian.prototype.intentHandlers = {


	"SelectList": function (intent, session, response) {

		selectList(intent, session, response);
		
    },

	"RepeatGenre": function (intent, session, response) {
        var speechText = "Here are the available genres and categories: Fiction, Non Fiction, Action, Mystery, Biography, Young Adult, " +
							"Children's, Middle Grade, and Picture Books. To get started, tell me a genre."
        var repromptText = "Are you still there? To get started, tell me a genre.";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

		var cardTitle = "Help";

		var cardContent = "Available Genres and Categories: Fiction, Non Fiction, Action, Mystery, Biography, Young Adult, " +
							"Children's, Middle Grade, and Picture Books.\n" +
						 "---\n" +
						 "Available Lists: New York Times Best Sellers List, I Dream Books List of Critically Acclaimed Books, Edgar Award Nominees\n \n " +
						 "---\n" +
						 "Typical questions include:\n"+
						 "- Recommend fiction books\n" +
						 "- Recommend young adult books\n" +
						 "- Tell me what is on the New York Times Bestselllers List\n" +
						 "- Recommend critically acclaimed mystery books \n" +
						 "- Recommend books by Walter Mosley\n";

		var smImage = "https://s3.amazonaws.com/virtual-librarian/virtual_library_card_small.png";
		var lgImage = "https://s3.amazonaws.com/virtual-librarian/virtual_library_card_large.png";
							
        response.askWithImageCard(speechOutput, repromptOutput, cardTitle, cardContent,smImage, lgImage);	
    },
		
	"GetAuthorList": function (intent, session, response) {

		if (typeof session.attributes.list_of_books !== 'undefined'){
			delete session.attributes.list_of_books;
		}
		if (typeof sessionAttributes.list_of_books !== 'undefined'){
			delete sessionAttributes.list_of_books;
		}	
		
		getAuthorList(intent, session, response);
		
    },

	"GetSimilarBooksList": function (intent, session, response) {

		if (typeof session.attributes.list_of_books !== 'undefined'){
			delete session.attributes.list_of_books;
		}
		if (typeof sessionAttributes.list_of_books !== 'undefined'){
			delete sessionAttributes.list_of_books;
		}	

		getSimilarBooksList(intent, session, response);
		
    },

	"GetSavedBooks": function (intent, session, response) {	

		getSavedBooks(intent, session, response);
		
    },

	"AddToShelf": function (intent, session, response) {

		addToShelf(intent, session, response);

    },

	"RemoveFromShelf": function (intent, session, response) {

		removeFromShelf(intent, session, response);

    },

	"AMAZON.NextIntent": function (intent, session, response) {
		
		getNext(intent, session, response);
		
    },

	"AMAZON.PreviousIntent": function (intent, session, response) {
		
		getPrevious(intent, session, response);
		
    },

	"AMAZON.RepeatIntent": function (intent, session, response) {
		
		repeatList(intent, session, response);
		
    },

	"GetBookDetails": function (intent, session, response) {

		//just added

		if (typeof session.attributes.listName !== "undefined"){
			if ( session.attributes.listName === "remove_books"){
				removeFromShelf(intent, session, response);
			}
		}
		
		getBookDetails(intent, session, response);
		
    },

    "AMAZON.HelpIntent": function (intent, session, response) {
        var speechText = "Ok. Here's how I can help. I can provide recommendations based on reviews from leading publications, best seller lists, " +
	       "and user reviews and purchases. You can ask me a number of things, such as, '" +
		   "Recommend fiction books, " +
		   "What is on the New York Times Bestsellers List, " +
		   "What are the most recent Edgar Award Nominees, " +
		   "and, Tell me books by Walter Mosley. " +
		   "Check the Alexa App for a more comprehensive list of available queries, genres and lists to review. " +
		   "To get started, ask me to recommend books."
        var repromptText = "Ask me to recommend fiction or non fiction books.";
        var speechOutput = {
            speech: speechText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        var repromptOutput = {
            speech: repromptText,
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };

		var cardTitle = "Help";

		var cardContent = "Available Genres and Categories: Fiction, Non Fiction, Action, Mystery, Biography, Young Adult, " +
						 "Children's, Middle Grade, and Picture Books.\n" +
						 "----------\n" +
						 "Available Lists: New York Times Best Sellers List, List of Critically Acclaimed Books, Edgar Award Nominees\n " +
						 "----------\n" +
						 "Typical questions include:\n"+
						 "- Recommend fiction books\n" +
						 "- Recommend young adult books\n" +
						 "- Tell me what is on the New York Times Bestselllers List\n" +
						 "- Recommend critically acclaimed mystery books \n" +
						 "- Recommend books by Walter Mosley\n" + 
						 "- Tell me my saved books."

		//var smImage = "https://s3.amazonaws.com/darianbjohnson/Librarian/virtual_library_card_small.png";
		//var lgImage = "https://s3.amazonaws.com/darianbjohnson/Librarian/virtual_library_card_large.png";
							
        response.askWithCard(speechOutput, repromptOutput, cardTitle, cardContent);
    },

	"AMAZON.StartOverIntent": function (intent, session, response) {

		sessionAttributes = {}; 
		session.attributes = sessionAttributes;

		var speechOutput = {
				speech: "What list would you like to select? You can choose the New York Times Best Sellers List, the " +
				"I Dream Books critically acclaimed list, or the most recent Edgar Award nominees.",
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.ask(speechOutput);
    },

    "AMAZON.StopIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    },

    "AMAZON.CancelIntent": function (intent, session, response) {
        var speechOutput = {
                speech: "Goodbye",
                type: AlexaSkill.speechOutputType.PLAIN_TEXT
        };
        response.tell(speechOutput);
    }
};

/**********************************************************************************
 *  FORMAT AND HANDLE RESPONSES
 *  This section houses the functions responsible for returning a response to the user
 */

//provides a response on lauch w/o an intent supplied
function getWelcomeResponse(response) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    var cardTitle = "The Virtual Librarian";
    var speechText = "Weclome to the Virtial Librarian. To get started, ask me to recommend a book.";
    var repromptText = "If you need more information, ask me for help.";

    var speechOutput = {
        speech: "<speak>" + speechText + "</speak>",
        type: AlexaSkill.speechOutputType.SSML
    };
    var repromptOutput = {
        speech: repromptText,
        type: AlexaSkill.speechOutputType.PLAIN_TEXT
    };
    response.ask(speechOutput, repromptOutput);
}

//routes user to correct function API based on list and category
function selectList(intent, session, response){

	//We have been here before; the user has already selected a list; the user is now specifying a category
	if (typeof(session.attributes.listName) != 'undefined'){
		switch(session.attributes.listName) {
			case "nytimes_bestsellers":
				getNYTList(intent, session, response);
				break;
			case "idreambooks_acclaimed":
				getCriticalList(intent, session, response);
				break;
			case "edgar_awards":
				getEdgarList(intent, session, response);
				break;
			default:
				var speechText = "I'm sorry, but I didn't understand the list. Can you tell me again? You can select Bestsellers, Critically Acclaimed books, or Edgar Awars Nominees.";
				var speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};						
				response.ask(speechOutput);	
		}
		return;
	}

	//We have not been here before; the user has not selected a list or a category
	if (typeof intent.slots.lists.value === 'undefined' &&  typeof intent.slots.category.value === 'undefined'){

		var speechOutput = {
			speech: "What list would you like to select? You can choose the New York Times Best Sellers List, the " +
			"I Dream Books critically acclaimed list, or the most recent Edgar Award nominees.",
			type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.ask(speechOutput);
		return;
	}

	//the user has seleted a list from the prompt; we are determining which list s/he selected
	if (typeof intent.slots.lists.value != 'undefined'){

		var choosenlist = intent.slots.lists.value;
		choosenlist = choosenlist.toLowerCase();

		var newyorktimesarray = ['new york', 'best ', 'bestsellers', 'bestseller', 'best seller'];

		newyorktimesarray.forEach(function(value){
			if (choosenlist.indexOf(value) >=0){
				sessionAttributes.listName = 'nytimes_bestsellers';
				//getNYTList(intent, session, response);
				return;
			}
		});

		var idreamsbooksarray = ['i dreams', 'idreams', 'i dream', 'idream' ,'critically', 'acclaimed']

		idreamsbooksarray.forEach(function(value){
			if (choosenlist.indexOf(value) >=0){
				sessionAttributes.listName = 'idreambooks_acclaimed';
				//getCriticalList(intent, session, response);
				return;
			}
		});

		var edgararray = ['edgar', 'Edgar'];

		edgararray.forEach(function(value){
			if (choosenlist.indexOf(value) >=0){
				sessionAttributes.listName = 'edgar_awards';
				//getEdgarList(intent, session, response);
				return;
			}
		});

		if (typeof sessionAttributes.listName === 'undefined'){
			var speechOutput = {
				speech: "I'm sorry, but I didn't understand the list you selected? You can choose the New York Times Best Sellers List, the " +
				"I Dream Books critically acclaimed list, or the most recent Edgar Award nominees.",
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};
			response.ask(speechOutput);
			return;

		}else{
			switch(sessionAttributes.listName) {
			case "nytimes_bestsellers":
				getNYTList(intent, session, response);
				break;
			case "idreambooks_acclaimed":
				getCriticalList(intent, session, response);
				break;
			case "edgar_awards":
				getEdgarList(intent, session, response);
				break;
			default:
				var speechText = "I'm sorry, but I didn't understand the list. Can you tell me again? You can select Bestsellers, Critically Acclaimed books, or Edgar Awars Nominees.";
				var speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};						
				response.ask(speechOutput);	
		}
		return;
		}

		
	}

	//the user has seleted a category, but as not selected a list. We need to recommend a list
	if (typeof intent.slots.category.value != 'undefined'){

		var categoryName = intent.slots.category.value.toLowerCase();

		switch(categoryName) {
			case "fiction":
				speechText = "What list would you like to select? You can choose the New York Times Best Sellers List, or the " +
					"I Dream Books critically acclaimed list.";
				speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};			
				response.ask(speechOutput);	
				break;
			case "nonfiction":
				speechText = "What list would you like to select? You can choose the New York Times Best Sellers List, or the " +
					"I Dream Books critically acclaimed list.";
				speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};			
				response.ask(speechOutput);	
				break;
			case "young adult":
				speechText = "What list would you like to select? You can choose the New York Times Best Sellers List, or the " +
					"I Dream Books critically acclaimed list.";
				speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};			
				response.ask(speechOutput);	
				break;
			case "childrens":
				speechText = "What list would you like to select? You can choose middle grade books on the New York Times Best Sellers List, " +
					"picture books on the New York Times Best Sellers List, or the " +
					"childrens books on the I Dream Books critically acclaimed list.";
				speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};			
				response.ask(speechOutput);	
				break;
			case "middle grade":
				getNYTList(intent, session, response);
				break;
			case "picture books":				
				getNYTList(intent, session, response);
				break;
			case "action":
				getCriticalList(intent, session, response);
				break;
			case "mystery":
				speechText = "What list would you like to select? You can choose the most recent list of Edgar Award nominees, or the " +
						"I Dream Books critically acclaimed list."
				speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};			
				response.ask(speechOutput);	
				break;
			case "biography":
				getCriticalList(intent, session, response);
				break;
			default:
				speechText = "I'm sorry, but I didn't understand the category. Can you tell me the category again? You can select fiction, non fiction, young adult, childrens, middle grade, picture books, action, mystery, or biography.";
				speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};			
				response.ask(speechOutput);	
		}	
		return;

	}

}

//gets list of books by a particluar author
function getAuthorList(intent, session, response){

	var author;

	sessionAttributes.listName = "author_books";

	if (typeof session.attributes.author === 'undefined' && typeof intent.slots.author.value === 'undefined'){//user did not provide an author name

		var speechText = "O.K. Tell me the name of the author you want to search for.";

		var speechOutput = {
			speech: "<speak>" + speechText + "</speak>",
			type: AlexaSkill.speechOutputType.SSML
		};
				
		response.ask(speechOutput);	
	}else{//author name either provided by the user or is from the book detail response

		var speech_preamble = "";
		if(typeof session.attributes.author !== 'undefined'){
			author = session.attributes.author; 
		}else{
			author = intent.slots.author.value; 
			speech_preamble = "I sometimes have a hard time understanding names. I think you said " + intent.slots.author.value + ". "
		}

		//call function to interact with API
		getAuthorListJSON(author, function (list_of_books) {

			if (list_of_books.length === 0){
				var speechOutput = {
					speech: speech_preamble + "I did not find any books by " + author + ". Goodbye.",
					type: AlexaSkill.speechOutputType.PLAIN_TEXT
				};
				response.tell(speechOutput);
			}

			var speech_addendum = ". ";
			var title_addeendum = "";
			if (list_of_books.length > 5){
				speech_addendum = ". Here are the first five. "
			}
			if (list_of_books.length > 1){
				title_addeendum = "s";
			}

			var speechText = speech_preamble + "I've found " + list_of_books.length + " title" + title_addeendum + " by " + author + speech_addendum; 
			var cardContent = ""
			var start_list = 0;
			var end_list = 5;

			for (var i = start_list,length = list_of_books.length; i < length; i++ ) {

				title = list_of_books[i].title;
				author = list_of_books[i].author;
				contributor = list_of_books[i].contributor;

				if (typeof list_of_books[i].contributor_alt !== 'undefined' ){
					contributor = list_of_books[i].contributor_alt;
				}

				rank = list_of_books[i].rank;

				sessionAttributes.list_of_books = list_of_books;
				sessionAttributes.start_list= start_list;
				sessionAttributes.end_list= end_list;
				session.attributes = sessionAttributes;

				if ( i<end_list ){
					speechText = speechText + "Number " + rank + ", " + title + ", " + contributor + ". ";
				}
				
			}
			
			//response formatting based on the number of items in the list
			if (list_of_books.length > 5){
				var repromptText = "To continue, say 'next'. To hear more about a book, tell me the number. To go back, say 'previous'.";
			}else{
				var repromptText = "To hear more about a book, tell me the number.";
			}
			
			//formats the responses based on the number of times the user has interacted with the skill
			handleUserSessionCount(session,function (count){

				if (count < 5) {
					speechText = speechText + '<p>' + repromptText + '</p>';
				}

				var speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};
				var repromptOutput = {
					speech: repromptText,
					type: AlexaSkill.speechOutputType.PLAIN_TEXT
				};

				response.ask(speechOutput, repromptOutput);	

			});
		});				

	}

}

//get similar books based on Amazon user purchases
function getSimilarBooksList(intent, session, response){

	//console.log(intent);
	var author;
	var related_items;

	sessionAttributes.listName = "similar_books";

	if (typeof session.attributes.related_items === 'undefined'){

		var speechText = "You didn't choose a book for me to use to find similar books. To find a book, say 'recommend a book'.";

		var speechOutput = {
			speech: "<speak>" + speechText + "</speak>",
			type: AlexaSkill.speechOutputType.SSML
		};
				
		response.ask(speechOutput);

	}else{

		related_items = session.attributes.related_items;

		console.log("Related Items:" + related_items);
		console.log("Related Items Length:" + related_items.length);
		
		if(related_items.length === 0 ){
			var speechText = "I was not able to find any similar books. Goodbye.";

			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};
				
			response.tell(speechOutput);

		}


		getSimilarBooksJSON(related_items, function (list_of_books) {

			//console.log(list_of_books);

			if (list_of_books.length === 0){
				var speechOutput = {
					speech: "I did not find any simlar books. Goodbye.",
					type: AlexaSkill.speechOutputType.PLAIN_TEXT
				};
				response.tell(speechOutput);
			}

			var speech_addendum = ". ";
			var title_addeendum = "";
			if (list_of_books.length > 5){
				speech_addendum = ". Here are the first five. "
			}
			if (list_of_books.length > 1){
				title_addeendum = "s";
			}

			var speechText = "Based on Amazon dot com user history, I've found " + list_of_books.length + " similar book" + title_addeendum + ". "
			var cardContent = ""
			var start_list = 0;
			var end_list = 5;

			for (var i = start_list,length = list_of_books.length; i < length; i++ ) {

				title = list_of_books[i].title;
				author = list_of_books[i].author;
				contributor = list_of_books[i].contributor;

				if (typeof list_of_books[i].contributor_alt !== 'undefined' ){
					contributor = list_of_books[i].contributor_alt;
				}

				rank = list_of_books[i].rank;


				sessionAttributes.list_of_books = list_of_books;
				sessionAttributes.start_list= start_list;
				sessionAttributes.end_list= end_list;
				session.attributes = sessionAttributes;

				if ( i<end_list ){
					speechText = speechText + "Number " + rank + ", " + title + ", " + contributor + ". ";
				}
				
			}
			

			if (list_of_books.length > 5){
				var repromptText = "To continue, say 'next'. To hear more about a book, tell me the number. To go back, say 'previous'.";
			}else{
				var repromptText = "To hear more about a book, tell me the number.";
			}

			handleUserSessionCount(session,function (count){

				if (count < 5) {
					speechText = speechText + '<p>' + repromptText + '</p>';
				}

				var speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
				};
				var repromptOutput = {
					speech: repromptText,
					type: AlexaSkill.speechOutputType.PLAIN_TEXT
				};

				response.ask(speechOutput, repromptOutput);	

			});	
		});				

	}

}

//get list of books from I Dream Books
function getCriticalList(intent, session, response) {

	var categoryName
	var categorySlot = intent.slots.category;
	var category = ""

	sessionAttributes.listName = "idreambooks_acclaimed";
	//session.attributes = sessionAttributes;


	if (typeof session.attributes.categoryName === 'undefined' && typeof intent.slots.category.value === 'undefined'){
		var speechText = "What category would you like: Fiction, Non Fiction, Young Adult, Children’s, Action, Mystery, or Biography.";
		var repromptText ="Are you still there? You can choose the following categories: Fiction, Non Fiction, Young Adult, Children’s, Action, Mystery, or Biography.";
		var speechOutput = {
			speech: "<speak>" + speechText + "</speak>",
			type: AlexaSkill.speechOutputType.SSML
		};

		session.attributes = sessionAttributes;

		var repromptOutput = {
			speech: repromptText,
			type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
			
		response.ask(speechOutput, repromptOutput);	
	}else{
		if (typeof session.attributes.categoryName !== 'undefined' ){
			categoryName = session.attributes.categoryName;
		}

		if (typeof intent.slots.category.value !== 'undefined' ){
			categoryName = intent.slots.category.value;
			//console.log('found the category value');
		} 
	}

	if (typeof categoryName === 'undefined' ){
		var speechText = "What category? You can select Fiction, Non Fiction, Young Adult, Children’s, Action, Mystery, or Biography.";

			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};

			session.attributes = sessionAttributes;	
			response.ask(speechOutput);	

	}

	categoryName = categoryName.toLowerCase();

	switch(categoryName) {
		case "fiction":
			category = "literature-fiction";
			break;
		case "nonfiction":
			category = "non-fiction";
			break;
		case "young adult":
			category = "young-adult";
			break;
		case "childrens":
			category = "children-s-books";
			break;
		case "action":
			category = "action-adventure";
			break;
		case "mystery":
			category = "mystery-thriller-suspense";
			break;
		case "biography":
			category = "biographies-memoirs";
			break;
		default:
			var speechText = "I'm sorry, but I didn't understand the category. Can you tell me the category again? You can select Fiction, Non Fiction, Young Adult, Children’s, Action, Mystery, or Biography.";
			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};
			session.attributes = sessionAttributes;				
			response.ask(speechOutput);	
	}

	getCriticalListJSON(category, function (list_of_books) {

		if (typeof session.attributes.category !== 'undefined'){
			delete session.attributes.category;
		}
		if (typeof sessionAttributes.category !== 'undefined'){
			delete sessionAttributes.category;
		}		

		if (list_of_books.length === 0){
			var speechOutput = {
				speech: "At this time, I cannot retrieve a list of critically acclaimed books. Goodbye.",
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};
			response.tell(speechOutput);
		}

		var speechText = "I Dream Books has compiled " + list_of_books.length + " items on their list of critically acclaimed " + categoryName + " titles. Here are the first five. "
		var cardContent = ""
		var start_list = 0;
		var end_list = 5;

		for (var i = start_list,length = list_of_books.length; i < length; i++ ) {

			title = list_of_books[i].title;
			author = list_of_books[i].author;
			contributor = list_of_books[i].contributor;

			if (typeof list_of_books[i].contributor_alt !== 'undefined' ){
				contributor = list_of_books[i].contributor_alt;
			}

			rank = list_of_books[i].rank;

			sessionAttributes.list_of_books = list_of_books;
			sessionAttributes.start_list= start_list;
			sessionAttributes.end_list= end_list;
			session.attributes = sessionAttributes;

			if ( i<end_list ){
				speechText = speechText + "Number " + rank + ", " + title + ", " + contributor + ". ";
			}
			
		}
		
		var repromptText = "To continue, say 'next'. To hear more about a book, tell me the number. To go back, say 'previous'.";

		handleUserSessionCount(session,function (count){

			if (count < 5) {
				speechText = speechText + '<p>' + repromptText + '</p>';
			}

			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};
			var repromptOutput = {
				speech: repromptText,
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};

			response.ask(speechOutput, repromptOutput);	

		});
	});				
}

//get list of books saved by the user
function getSavedBooks(intent, session, response){

	sessionAttributes.listName = "saved_books";

	getSavedBooksJSON(session.user.userId, function (list_of_books) {

		//console.log(list_of_books);

		if (list_of_books.length === 0){
			var speechOutput = {
				speech: "You don't have any saved books. Goodbye.",
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};
			response.tell(speechOutput);
		}

		var speech_addendum = ". ";
		var title_addeendum = "";
		if (list_of_books.length > 5){
			speech_addendum = ". Here are the first five. "
		}
		if (list_of_books.length > 1){
			title_addeendum = "s";
		}

		var speechText = "You have " + list_of_books.length + " saved book" + title_addeendum + speech_addendum; 
		var cardContent = ""
		var start_list = 0;
		var end_list = 5;

		for (var i = start_list,length = list_of_books.length; i < length; i++ ) {

			title = list_of_books[i].title;
			author = list_of_books[i].author;
			contributor = list_of_books[i].contributor;

			if (typeof list_of_books[i].contributor_alt !== 'undefined' ){
				contributor = list_of_books[i].contributor_alt;
			}

			rank = list_of_books[i].rank;

			sessionAttributes.list_of_books = list_of_books;
			sessionAttributes.start_list= start_list;
			sessionAttributes.end_list= end_list;
			session.attributes = sessionAttributes;

			if ( i<end_list ){
				speechText = speechText + "Number " + rank + ", " + title + ", " + contributor + ". ";
			}
			
		}

		if (list_of_books.length > 5){
			var repromptText = "To continue, say 'next'. To hear more about a book, tell me the number. To go back, say 'previous'. To remove a book, say 'remove' and the number.";
		}else{
			var repromptText = "To hear more about a book, tell me the number. To remove a book, say 'remove' and the number.";
		}
	
		handleUserSessionCount(session,function (count){

			if (count < 5) {
				speechText = speechText + '<p>' + repromptText + '</p>';
			}

			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};
			var repromptOutput = {
				speech: repromptText,
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};

			response.ask(speechOutput, repromptOutput);	

		});
	});				


}

//get list of books from the New York Times Bestsellers List
function getNYTList(intent, session, response) {
	//console.log('acct linked: ' + sessionAttributes.accountLinked);

	var categoryName
	var categorySlot = intent.slots.category;
	var category = ""

	if (typeof sessionAttributes.listName != 'undefined'){
		if (sessionAttributes.listName !== 'nytimes_bestsellers'){

			var speechText = "I'm sorry; I didn't understand your request. Please try again, or say 'start over' to begin a new search.";
			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};

			response.ask(speechOutput);	
		}
	}

	sessionAttributes.listName = "nytimes_bestsellers";

	if (typeof session.attributes.categoryName === 'undefined' && typeof intent.slots.category.value === 'undefined'){
		var speechText = "What category would you like: Fiction, Non Fiction, Young Adult, Middle Grade, or Picture Books.";
		var repromptText ="Are you still there? You can choose the following categories: Fiction, Non Fiction, Young Adult, Middle Grade, or Picture Books."
		var speechOutput = {
			speech: "<speak>" + speechText + "</speak>",
			type: AlexaSkill.speechOutputType.SSML
		};

		session.attributes = sessionAttributes;

		var repromptOutput = {
			speech: repromptText,
			type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
			
		response.ask(speechOutput, repromptOutput);	
	}else{
		if (typeof session.attributes.categoryName !== 'undefined' ){
			categoryName = session.attributes.categoryName;
		}

		if (typeof intent.slots.category.value !== 'undefined' ){
			categoryName = intent.slots.category.value;
		} 
	}

	if (typeof categoryName === 'undefined' ){
		var speechText = "What category? You can select Fiction, Non Fiction, Young Adult, Middle Grade, or Picture Books.";

			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};

			session.attributes = sessionAttributes;	
			response.ask(speechOutput);	

	}

	categoryName = categoryName.toLowerCase();

	switch(categoryName) {
		case "fiction":
			category = "combined-print-and-e-book-fiction";
			break;
		case "nonfiction":
			category = "combined-print-and-e-book-nonfiction";
			break;
		case "young adult":
			category = "young-adult-hardcover";
			break;
		case "middle grade":
			category = "childrens-middle-grade-hardcover";
			break;
		case "picture books":
			category = "picture-books";
			break;
		default:
			var speechText = "I'm sorry, but I didn't understand the category. Can you tell me the category again? You can select Fiction, Non Fiction, Young Adult, Middle Grade, or Picture Books";

			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};

			session.attributes = sessionAttributes;				
			response.ask(speechOutput);	
	}

	getNYTListJSON(category, function (list_of_books) {

		if (typeof session.attributes.category !== 'undefined'){
			delete session.attributes.category;
		}
		if (typeof sessionAttributes.category !== 'undefined'){
			delete sessionAttributes.category;
		}	

		if (list_of_books.length === 0){
			var speechOutput = {
				speech: "At this time, I cannot access the New York Times Bestsellers List. Goodbye.",
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};
			response.tell(speechOutput);
		}

		var speechText = "There are " + list_of_books.length + " books on the New York Times Best Sellers List for " + categoryName + ". Here are the first five. "
		var cardContent = ""
		var start_list = 0;
		var end_list = 5;

		for (var i = start_list,length = list_of_books.length; i < length; i++ ) {
			//console.log(body.results[i].amazon_product_url);
			title = list_of_books[i].title;
			author = list_of_books[i].author;
			contributor = list_of_books[i].contributor;
			//description = body.results[i].book_details[0].description;
			rank = list_of_books[i].rank;

			if (typeof list_of_books[i].contributor_alt !== 'undefined' ){
				contributor = list_of_books[i].contributor_alt;
			}

			sessionAttributes.list_of_books = list_of_books;
			sessionAttributes.start_list= start_list;
			sessionAttributes.end_list= end_list;
			session.attributes = sessionAttributes;

			if ( i<end_list ){
				speechText = speechText + "Number " + rank + ", " + title + ", " + contributor + ". ";
			}

		}

		var repromptText = "To continue, say 'next'. To hear more about a book, tell me the number. To go back, say 'previous'.";

		handleUserSessionCount(session,function (count){

			if (count < 5) {
				speechText = speechText + '<p>' + repromptText + '</p>';
			}

			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};
			var repromptOutput = {
				speech: repromptText,
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};

			response.ask(speechOutput, repromptOutput);	

		});
	});				
}

//get list of Edgar Awards nominees from Goodreads API
function getEdgarList(intent, session, response) {

	var categoryName
	var categorySlot = intent.slots.category;
	var category = ""

	sessionAttributes.listName = "edgar_awards";
	//session.attributes = sessionAttributes;


	if (typeof session.attributes.categoryName === 'undefined' && typeof intent.slots.category.value === 'undefined'){
		var speechText = "What award category would you like: Best Overall Novel, Best First Novel, or Best Paperback Original.";
		var repromptText ="Are you still there? You can choose the following categories: Best Overall Novel, Best First Novel, or Best Paperback Original.";
		var speechOutput = {
			speech: "<speak>" + speechText + "</speak>",
			type: AlexaSkill.speechOutputType.SSML
		};

		session.attributes = sessionAttributes;

		var repromptOutput = {
			speech: repromptText,
			type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
			
		response.ask(speechOutput, repromptOutput);	
	}else{
		if (typeof session.attributes.categoryName !== 'undefined' ){
			categoryName = session.attributes.categoryName;
		}

		if (typeof intent.slots.category.value !== 'undefined' ){
			categoryName = intent.slots.category.value;
		} 
	}

	if (typeof categoryName === 'undefined' ){
		var speechText = "What category? You can select Best Overall Novel, Best First Novel, or Best Paperback Original.";

			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};

			session.attributes = sessionAttributes;	
			response.ask(speechOutput);	

	}

    categoryName = categoryName.toLowerCase();

	switch(categoryName) {
		case "best overall novel":
			categoryName = "best novel";
			shelf = "edgar-2016-best-novel";
			break;
		case "best first novel":
			shelf = "edgar-2016-bfn";
			break;
		case "best 1st novel":
			shelf = "edgar-2016-bfn";
			break;
		case "best paperback original":
			shelf = "edgar-2016-bpo";
			break;
		case "mystery":
			var speechText = "Which sub category? You can select Best Overall Novel, Best First Novel, or Best Paperback Original.";
			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};
			session.attributes = sessionAttributes;				
			response.ask(speechOutput);	
			break;
		default:
			var speechText = "I'm sorry, but I didn't understand the category. Can you tell me the category again? You can select Best Overall Novel, Best First Novel, or Best Paperback Original.";
			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};
			session.attributes = sessionAttributes;				
			response.ask(speechOutput);	
	}

	var year = '2016';
	getEdgarListJSON(shelf,year,categoryName, function (list_of_books){

		if (typeof session.attributes.category !== 'undefined'){
			delete session.attributes.category;
		}
		if (typeof sessionAttributes.category !== 'undefined'){
			delete sessionAttributes.category;
		}	

		if (list_of_books.length === 0){
			var speechOutput = {
				speech: "At this time, I cannot retrieve a list of Edgar nominated books. Goodbye.",
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};
			response.tell(speechOutput);
		}

		var speech_addendum = ". ";
		var title_addeendum = "";
		if (list_of_books.length > 5){
			speech_addendum = ". Here are the first five. "
		}
		var speechText = list_of_books.length + " books were nominated for the " + year + " Edgar Award for " + categoryName + speech_addendum;
		var cardContent = ""
		var start_list = 0;
		var end_list = 5;

		for (var i = start_list,length = list_of_books.length; i < length; i++ ) {

			title = list_of_books[i].title;
			author = list_of_books[i].author;
			contributor = list_of_books[i].contributor;

			rank = list_of_books[i].rank;

			sessionAttributes.list_of_books = list_of_books;
			sessionAttributes.start_list= start_list;
			sessionAttributes.end_list= end_list;
			session.attributes = sessionAttributes;

			if (typeof list_of_books[i].contributor_alt !== 'undefined' ){
				contributor = list_of_books[i].contributor_alt;
			}

			if ( i<end_list ){
				speechText = speechText + "Number " + rank + ", " + title + ", " + contributor + ". ";
			}

		}
		
		if (list_of_books.length > 5){
			var repromptText = "To continue, say 'next'. To hear more about a book, tell me the number. To go back, say 'previous'.";
		}else{
			var repromptText = "To hear more about a book, tell me the number.";
		}

		handleUserSessionCount(session,function (count){

			if (count < 5) {
				speechText = speechText + '<p>' + repromptText + '</p>';
			}

			var speechOutput = {
				speech: "<speak>" + speechText + "</speak>",
				type: AlexaSkill.speechOutputType.SSML
			};
			var repromptOutput = {
				speech: repromptText,
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};

			response.ask(speechOutput, repromptOutput);	

		});
	});				
}

//naviagte list of books - get next
function getNext(intent, session, response) {
	if(typeof session.attributes.list_of_books === 'undefined'){
		var speechOutput = {
        	speech: "You did not ask me for a list. Goodbye.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.tell(speechOutput);
	}

	var speechText = ""
	var cardContent = ""
	var start_list = parseInt(session.attributes.start_list) + 5;
	var end_list = parseInt(session.attributes.end_list) + 5;
	var list_of_books = session.attributes.list_of_books;

	console.log("start list:" + session.attributes.start_list);
	console.log("end list:" + session.attributes.end_list);

	if (start_list === list_of_books.length){
		var speechOutput = {
        	speech: "There are no more books in this list. To hear more about a book, tell me the number. To go back, say 'go back'. To repeat, say 'repeat'.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.ask(speechOutput);

	}

	if (end_list > list_of_books.length){
		end_list = list_of_books.length;
	}

	sessionAttributes = {};
	sessionAttributes.list_of_books = list_of_books;
	sessionAttributes.start_list= start_list;
	sessionAttributes.end_list= end_list;
	session.attributes = sessionAttributes;

	for (var i = start_list,length = end_list; i < length; i++ ) {
		title = list_of_books[i].title;
		author = list_of_books[i].author;
		contributor = list_of_books[i].contributor;
		rank = list_of_books[i].rank;

		if (typeof list_of_books[i].contributor_alt !== 'undefined' ){
			contributor = list_of_books[i].contributor_alt;
		}

		speechText = speechText + "Number " + rank + ", " + title + ", " + contributor + ". ";

	}

	var repromptText = "To hear more about a book, tell me the number. To go back, say 'go back'.";

	if (sessionAttributes.listName === "saved_books"){
		repromptText = repromptText + " To remove a book, say 'remove' and the number."
	}

	handleUserSessionCount(session,function (count){

		if (count < 5) {
			speechText = speechText + '<p>' + repromptText + '</p>';
		}

		var speechOutput = {
			speech: "<speak>" + speechText + "</speak>",
			type: AlexaSkill.speechOutputType.SSML
		};
		var repromptOutput = {
			speech: repromptText,
			type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};

		response.ask(speechOutput, repromptOutput);	

	});	

}

//naviagte list of books - get previous
function getPrevious(intent, session, response) {
	if(typeof session.attributes.list_of_books === 'undefined'){
		var speechOutput = {
        	speech: "You did not ask me for a list. Goodbye.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.tell(speechOutput);
	}

	var speechText = ""
	var cardContent = ""
	var start_list = parseInt(session.attributes.start_list) - 5;
	//var end_list = parseInt(session.attributes.end_list) - 5;
	var end_list = start_list + 5;
	var list_of_books = session.attributes.list_of_books;

	console.log("start list:" + session.attributes.start_list);
	console.log("end list:" + session.attributes.end_list);

	if (start_list < 0){
		var speechOutput = {
        	speech: "You are already at the start of the list. To hear more about a book, tell me the number. To go forward, say 'next'.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.ask(speechOutput);
	}


	sessionAttributes = {};
	sessionAttributes.list_of_books = list_of_books;
	sessionAttributes.start_list= start_list;
	sessionAttributes.end_list= end_list;
	session.attributes = sessionAttributes;

	for (var i = start_list,length = end_list; i < length; i++ ) {
		title = list_of_books[i].title;
		author = list_of_books[i].author;
		contributor = list_of_books[i].contributor;
		rank = list_of_books[i].rank;

		if (typeof list_of_books[i].contributor_alt !== 'undefined' ){
			contributor = list_of_books[i].contributor_alt;
		}

		speechText = speechText + "Number " + rank + ", " + title + ", " + contributor + ". ";

	}

	var repromptText = "To hear more about a book, tell me the number.";

	handleUserSessionCount(session,function (count){

		if (count < 5) {
			speechText = speechText + '<p>' + repromptText + '</p>';
		}

		var speechOutput = {
			speech: "<speak>" + speechText + "</speak>",
			type: AlexaSkill.speechOutputType.SSML
		};
		var repromptOutput = {
			speech: repromptText,
			type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};

		response.ask(speechOutput, repromptOutput);	

	});		

}

//naviagte list of books - return to list
function repeatList(intent, session, response) {
	if(typeof session.attributes.list_of_books === 'undefined'){
		var speechOutput = {
        	speech: "You did not ask me for a list. Goodbye.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.tell(speechOutput);
	}

	var speechText = ""
	var cardContent = ""
	var start_list = parseInt(session.attributes.start_list);
	var end_list = parseInt(session.attributes.end_list);
	var list_of_books = session.attributes.list_of_books;

	console.log("start list:" + session.attributes.start_list);
	console.log("end list:" + session.attributes.end_list);

	if (start_list === list_of_books.length){
		var speechOutput = {
        	speech: "There are no more books in this list. To hear more about a book, tell me the number. To go back, say 'go back'.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.ask(speechOutput);

	}

	if (end_list > list_of_books.length){
		end_list = list_of_books.length;
	}

	sessionAttributes = {};
	sessionAttributes.list_of_books = list_of_books;
	sessionAttributes.start_list= start_list;
	sessionAttributes.end_list= end_list;
	session.attributes = sessionAttributes;

	//console.log(session.attributes.NYTimesJSON);
	for (var i = start_list,length = end_list; i < length; i++ ) {
		title = list_of_books[i].title;
		author = list_of_books[i].author;
		contributor = list_of_books[i].contributor;
		rank = list_of_books[i].rank;

		if (typeof list_of_books[i].contributor_alt !== 'undefined' ){
					contributor = list_of_books[i].contributor_alt;
		}

		speechText = speechText + "Number " + rank + ", " + title + ", " + contributor + ". ";

	}

	var repromptText = "To hear more about a book, tell me the number.";

	var speechOutput = {
		speech: "<speak>" + speechText + "</speak>",
		type: AlexaSkill.speechOutputType.SSML
	};
	var repromptOutput = {
		speech: repromptText,
		type: AlexaSkill.speechOutputType.PLAIN_TEXT
	};

	response.ask(speechOutput,repromptText);	

}

//get details for a specific book
function getBookDetails(intent, session, response){

	sessionAttributes.listName = "book_details";

	if (typeof session.attributes.list_of_books === 'undefined'){
		var speechOutput = {
        	speech: "I'm sorry. I don't understand your request. Goodbye.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.tell(speechOutput);
	}

	var booknumberSlot = intent.slots.booknumber;

	if (booknumberSlot && booknumberSlot.value){

		var booknumber = parseInt(booknumberSlot.value);

		if (isNumeric(booknumber) === false){

			var speechOutput = {
				speech: "You didn't select a valid number. Please try again.",
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};
		response.ask(speechOutput);

		}

		var booknumberindex = booknumber-1;
		var start_list = parseInt(session.attributes.start_list) + 1;
		var end_list = parseInt(session.attributes.end_list);
		if (booknumber < start_list  || booknumber > end_list) {
			var speechOutput = {
				speech: "You didn't select a number in a valid range. Tell me a number between " + start_list + " and " + end_list,
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};
			response.ask(speechOutput);
		}

		var primary_isbn13 = session.attributes.list_of_books[booknumberindex].primary_isbn13;
		var isbns_string = session.attributes.list_of_books[booknumberindex].isbns_string;
		var title = session.attributes.list_of_books[booknumberindex].title;
		var titleupper = session.attributes.list_of_books[booknumberindex].titleupper;
		var author = session.attributes.list_of_books[booknumberindex].author;
		var contributor = session.attributes.list_of_books[booknumberindex].contributor		


		getAmazonDetailsbyKeywords(title, author, function(amazon_details){

			var related_items = amazon_details.related_items;
			var ASIN = amazon_details.ASIN;

			if (typeof amazon_details.ISBN !== 'undefined'){
				isbns_string = isbns_string + ',' + amazon_details.ISBN;
			}

			getBookDetailsJSON(primary_isbn13, isbns_string, function(book_details){

				var list_of_books = session.attributes.list_of_books

				 if (Object.keys(book_details).length === 0) {
					 var speechOutput = {
						speech: "I am unable to provide more detail at this time. To return to the list, say 'repeat', 'next', or 'go back'.",
						type: AlexaSkill.speechOutputType.PLAIN_TEXT
					};
					response.ask(speechOutput);
					
				 }

				var cardTitle = titleupper + " " + contributor;
				var repromptText = "What would you like to do next? You can tell me to save this book, get similar books, or get more books by this author. To return to the list, say 'repeat', 'next', or 'go back'.";
				var cardContent = book_details.rating_string + "\n" + book_details.longDescription;
				
				if (sessionAttributes.listName === "saved_books"){
					repromptText = repromptText + " To remove this book, say 'remove'."
				}
				
				var smImage = amazon_details.smImage;
				var lgImage = amazon_details.lgImage;


				var speechOutput = {
					speech: "<speak>" + list_of_books[booknumberindex].description + "<p>" + book_details.rating_string_long + "</p></speak>",
					type: AlexaSkill.speechOutputType.SSML
				};
				var repromptOutput = {
					speech: repromptText,
					type: AlexaSkill.speechOutputType.PLAIN_TEXT
				};

				sessionAttributes = session.attributes;
				sessionAttributes.author = author;
				sessionAttributes.primary_isbn13 = primary_isbn13
				sessionAttributes.isbns_string = isbns_string;
				sessionAttributes.titleupper = titleupper;
				sessionAttributes.contributor = contributor;
				sessionAttributes.title = title;
				sessionAttributes.related_items= related_items;
				sessionAttributes.ASIN= ASIN;
				sessionAttributes.goodreadsID= book_details.goodreadsID;
				sessionAttributes.googleBooksID = book_details.googleBooksID;
				session.attributes = sessionAttributes;

				response.askWithImageCard(speechOutput, repromptOutput, cardTitle, cardContent,smImage, lgImage);	
				
			});

		});


	}else{

		var speechOutput = {
        	speech: "I didn't understand your request. Can you try again?",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.ask(speechOutput);

	}

}

//add a book to a user's shelf
function addToShelf(intent, session, response){

	if (typeof session.attributes.title === 'undefined'){

		var speechText = "You didn't choose a book for me to save. To save a book, first ask me to recommend a book.";

		var speechOutput = {
			speech: "<speak>" + speechText + "</speak>",
			type: AlexaSkill.speechOutputType.SSML
		};
				
		var repromptText = "Are you still there? Ask me to recommend a book.";

		var repromptOutput = {
			speech: repromptText,
			type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
				
		response.ask(speechOutput, repromptOutput);	

	}else{

		var userId = session.user.userId;
	   	var date = new Date();
	   	var DateString = date.getFullYear() + "/" + monthNums[date.getMonth()] + "/" + date.getDate();
	   	var standardizeDate = new Date (date.getFullYear(), date.getMonth(), date.getDate());
	   	var getTime = standardizeDate.getTime();
		var author = session.attributes.author;
		var title = session.attributes.title;
		var contributor = session.attributes.contributor;
		var primary_isbn13 = session.attributes.primary_isbn13;
		var isbns_string = session.attributes.isbns_string;

		addToShelfDB(userId, DateString, title, author, contributor, primary_isbn13, isbns_string, getTime, function(eventCallback){

			session.attributes = {};

			var speechText = "I've saved " + title + " in your saved books list. To continue searching, say 'start over'. To get your saved books, say 'tell me my saved books'. To quit, say 'goodbye'.";
			var speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
			};
					
			response.ask(speechOutput);

		});

		
	}
		
	
}

//remove a book from a user's shelf
function removeFromShelf(intent, session, response){
	if (typeof session.attributes.list_of_books === 'undefined'){
		var speechOutput = {
        	speech: "I'm sorry. I don't understand your request. Goodbye.",
            type: AlexaSkill.speechOutputType.PLAIN_TEXT
		};
		response.tell(speechOutput);
	}

	if (session.attributes.listName !== 'saved_books'){
		if (session.attributes.listName !== 'remove_books'){
			var speechOutput = {
				speech: "I'm sorry, you can only use this feature when reviewing your saved books. Goodbye.",
				type: AlexaSkill.speechOutputType.PLAIN_TEXT
			};
			response.tell(speechOutput);
		}
	}

	var userId = session.user.userId;
	var ISBN;
	var title; 
	if (typeof session.attributes.primary_isbn13 === 'undefined'){

		var booknumberSlot = intent.slots.booknumber;

		if (booknumberSlot && booknumberSlot.value){

			var booknumber = parseInt(booknumberSlot.value);

			if (isNumeric(booknumber) === false){

				var speechOutput = {
					speech: "You didn't select a valid number. Please try again.",
					type: AlexaSkill.speechOutputType.PLAIN_TEXT
				};
				response.ask(speechOutput);

			}

			var booknumberindex = booknumber-1;
			var start_list = parseInt(session.attributes.start_list) + 1;
			var end_list = parseInt(session.attributes.end_list);

			if (booknumber < start_list  || booknumber > end_list) {
				session.attributes.listName = "remove_books";
				var speechOutput = {
					speech: "You didn't select a number in a valid range. Tell me a number between " + start_list + " and " + end_list,
					type: AlexaSkill.speechOutputType.PLAIN_TEXT
				};
				response.ask(speechOutput);
			}

			ISBN = session.attributes.list_of_books[booknumberindex].primary_isbn13 ;
			title = session.attributes.list_of_books[booknumberindex].title ;

		}else{

			var speechOutput = {
					speech: "I did not understand your request. Goodbye.",
					type: AlexaSkill.speechOutputType.PLAIN_TEXT
				};
			response.tell(speechOutput);

		}
	}else{
		ISBN = session.attributes.primary_isbn13 ;
		title = session.attributes.title;
	}

	removeFromShelfDB(userId, ISBN, function(eventCallback){

			sessionAttributes = {};
			session.attributes = {};

			var speechText = "I've removed " + title + " from your virtual bookshelf. To go back to saved books, say 'tell me my saved books'. To continue searching, say 'start over'. To quit, say 'goodbye'.";
			var speechOutput = {
					speech: "<speak>" + speechText + "</speak>",
					type: AlexaSkill.speechOutputType.SSML
			};


			response.ask(speechOutput);

	});


}

/**********************************************************************************
 *  INTERFACE WITH API/DBs/ETC
 *  This section interfaces with apis, DBs, etc, formats the APi call response 
 *  and returns the needed information to the main functions
 */

//call the NYTimes API
function getNYTListJSON(category, eventCallback) {

	console.log(category);

	request.get({
		url: "https://api.nytimes.com/svc/books/v3/lists.json",
		qs: {
			'api-key': "APIKEY",
			'list':  category
		},
		}, function(err, response, body) {

			var list_of_books = [];

			if (body){
				try{
					body = JSON.parse(body);
				}catch(e){
					var list_of_books = [];
					eventCallback(list_of_books);
					return;
				}
			}	

			for (var i = 0,length = body.results.length; i < length; i++ ) {

				var book_details={};

				book_details.title = body.results[i].book_details[0].title;
				book_details.titleupper = body.results[i].book_details[0].title;
				book_details.author = body.results[i].book_details[0].author;
				book_details.contributor = body.results[i].book_details[0].contributor;
				book_details.rank = body.results[i].rank;
				book_details.primary_isbn10 = body.results[i].book_details[0].primary_isbn10;
				book_details.primary_isbn13 = body.results[i].book_details[0].primary_isbn13;

				var isbns_string = body.results[i].book_details[0].primary_isbn13 + ",";

				for (var j = 0, jlength = body.results[i].isbns.length; j < jlength; j++){
					isbns_string = isbns_string + body.results[i].isbns[j].isbn10 + "," + body.results[i].isbns[j].isbn13 + "," ;
				}
				isbns_string = isbns_string.slice(0, -1);

				book_details.isbns_string = isbns_string;

				description = body.results[i].book_details[0].description;
				weeks_on_list = body.results[i].weeks_on_list;
				published_date = body.results[i].published_date;
				var weeks_on_list_str = ""

				switch(parseInt(weeks_on_list)){

					case 0:
						weeks_on_list_str = "is new to the New York Times Best Sellers List. ";
						break;
					case 1:
						weeks_on_list_str = "has been on the New York Times Best Sellers List for one week. ";
						break;
					default:
						weeks_on_list_str = "has been on the New York Times Best Sellers List for " + weeks_on_list + " weeks. ";
						
				}
				
				book_details.description = book_details.title + ", " + book_details.contributor + ", " + weeks_on_list_str + " Here's a brief description of the book, " + description;

				list_of_books[i] = book_details;
			}

			stringify(list_of_books);
			console.log(list_of_books);

			eventCallback(list_of_books);
		}).on('err', function (e) {
        console.log("Got error: ", e);
    });

}

//call the I Dream Books API
function getCriticalListJSON(category, eventCallback) {

	request.get({
		url: "https://idreambooks.com/api/publications/recent_recos.json?key=APIKEY&slug=" + category
		}, function(err, response, body) {
			
			var list_of_books = [];

			if (body){
				try{
					body = JSON.parse(body);
				}catch(e){
					var list_of_books = [];
					eventCallback(list_of_books);
					return;
				}
			}	

			//console.log(body);

			for (var i = 0,length = body.length; i < length; i++ ) {
				var book_details={};

				var title = body[i].title;

				book_details.title = title;
				book_details.titleupper = title.toUpperCase();
				book_details.author = body[i].author;
				book_details.contributor = "by " + body[i].author;
				book_details.rank = i+1;
				book_details.primary_isbn10 = 'None';
				//book_details.primary_isbn13 = body.results[i].book_details[0].primary_isbn13;

				var isbns_string = body[i].isbns;
				var n = isbns_string.indexOf(",");

				if (n<0){
					book_details.primary_isbn13 = isbns_string ;
				}else{
					book_details.primary_isbn13 = isbns_string.substring(0, n);
				}

				book_details.isbns_string = isbns_string;

				var description = body[i].review_snippet;
				var review_pub = ""

				var master_publications_list = ["NPR", "Dear Author","Kirkus", "Publishers Weekly", "Forbes", "All About Romance", "Time Magazine", "The Economist"  ]

				if (master_publications_list.indexOf(body[i].review_publication_name) > -1) {
						review_pub = body[i].review_publication_name;
				} else {
						review_pub = "the " + body[i].review_publication_name;
				}

				book_details.description = book_details.title + ", " + book_details.contributor + ". Here's a snippet of a review from " + review_pub + ", " + description;

				list_of_books[i] = book_details;

			}

			stringify(list_of_books);

			eventCallback(list_of_books);
		}).on('err', function (e) {
        console.log("Got error: ", e);
    });

}

//call the Goodreads, Google Books, and Amazon APIs to get book details
function getBookDetailsJSON(isbn, isbns_string, eventCallback) {

	var book_details={};

	request.get({
		url: "https://www.googleapis.com/books/v1/volumes?q=" + isbn + "&key=APIKEY"
		}, function(err, response, body) {

			if (body){
				try{
					body = JSON.parse(body);
				}catch(e){
					eventCallback(book_details);
					return;
				}
			}	

			book_details.longDescription = body.items[0].volumeInfo.description ;
			book_details.googleAvgRating = body.items[0].volumeInfo.averageRating;
			book_details.googleAvgRatingCount = body.items[0].volumeInfo.ratingsCount;
			book_details.googleBooksID = body.items[0].id;

			request.get({
				url: "https://www.goodreads.com/book/review_counts.json?isbns=" + isbns_string +"&key=APIKEY"
				}, function(err, response, body) {

					if (body !== 'No books match those ISBNs.'){
						console.log(body)
						body = JSON.parse(body);

						book_details.goodreadsAvgRating =body.books[0].average_rating;
						book_details.goodreadsAvgRatingCount = body.books[0].ratings_count;
						book_details.goodreadsID= body.books[0].id;
					}


					var rating_string = "";
					var rating_string_long = "";

					if (typeof book_details.goodreadsAvgRating !== 'undefined') {

							rating_string_long = " Goodreads users rated this book " + book_details.goodreadsAvgRating + " stars out of 5.";
							rating_string = rating_string + "Goodreads User Rating: " + book_details.goodreadsAvgRating + "/5\n\n";
					}

					if (typeof book_details.googleAvgRating !== 'undefined') {
						rating_string_long  = rating_string_long + " Google Book users gave it a " + book_details.googleAvgRating + " rating.";
						rating_string = rating_string + "Google Books User Rating: " + book_details.googleAvgRating  + "/5\n\n";
					}

					book_details.rating_string = rating_string;
					book_details.rating_string_long = rating_string_long;
					eventCallback(book_details);

				}).on('err', function (e) {
				console.log("Got error: ", e);
			});

			//eventCallback(body);
		}).on('err', function (e) {
        console.log("Got error: ", e);
    });

}

//call the Google Books APIs to get book list by author
function getAuthorListJSON(author, eventCallback) {

	var book_details={};
	var rank_count = 1;
	authorencode = author.replace(' ','+');

	request.get({
		url: "https://www.googleapis.com/books/v1/volumes?q=" + authorencode +"&orderBy=relevance&key=APIKEY"
		}, function(err, response, body) {

			var list_of_books = [];
			var list_of_titles = [];

			if (body){
				try{
					body = JSON.parse(body);
				}catch(e){
					var list_of_books = [];
					eventCallback(list_of_books);
					return;
				}
			}	

			if (body.totalItems === 0){
				stringify(list_of_books);
				eventCallback(list_of_books);
			}


			for (var i = 0,length = body.items.length; i < length; i++ ) {

				var book_details={};

				var title = body.items[i].volumeInfo.title;
				book_details.title = title;
				book_details.titleupper = title.toUpperCase();
				console.log(book_details.title);
				
				if (list_of_titles.indexOf(body.items[i].volumeInfo.title)> 0) { 				
					continue; 
				}

				if (typeof body.items[i].volumeInfo.authors=== 'undefined') { 				
					continue; 
				}

				list_of_titles[i] = body.items[i].volumeInfo.title;

				var author_string = ""; 
				var author_array = body.items[i].volumeInfo.authors;
				var author_array_upper = [];

				for (var a = 0, alength = author_array.length; a < alength; a++){
					author_array_upper[a] = author_array[a].toUpperCase();
				}

				if (author_array_upper.indexOf(author.toUpperCase())< 0) { 
					//console.log("Excluded: " + book_details.title);					
					continue; 
				}

				for (var k = 0, klength = author_array.length; k < klength; k++){
					author_string = author_string + author_array[k] + " and " ;
				}

				author_string = author_string.slice(0, -5);
				book_details.author = author_string;				
				book_details.contributor = "by " + author_string;


				book_details.author = author_string;				
				book_details.contributor = "by " + author_string;
				
				book_details.rank = rank_count;
				rank_count++;

				var isbns_string = "";
				var isbns_array = body.items[i].volumeInfo.industryIdentifiers;

				for (var j = 0, jlength = isbns_array.length; j < jlength; j++){
					if (isbns_array[j].type === 'ISBN_10'){
						book_details.primary_isbn10 = isbns_array[j].identifier;
						isbns_string = isbns_string + isbns_array[j].identifier + ',';
					}else{
						book_details.primary_isbn13 = isbns_array[j].identifier;
						isbns_string = isbns_string + isbns_array[j].identifier + ',';
					}
										
				}
				isbns_string = isbns_string.slice(0, -1);

				book_details.isbns_string = isbns_string;

				book_details.contributor_alt = "";

				if (typeof body.items[i].volumeInfo.publishedDate !== 'undefined') { 
					//published_date = body.items[i].volumeInfo.publishedDate;
					var published_date = new Date(body.items[i].volumeInfo.publishedDate);
					var date_string = monthNames[published_date.getMonth()] + " " + published_date.getFullYear();
					book_details.contributor_alt = "published in " + date_string;
				}
			

				var description = ". No description available.";
				
				if (typeof(body.items[i].searchInfo) !=='undefined'){
					if (typeof(body.items[i].searchInfo.textSnippet) !=='undefined'){
						description = ". Here's a brief description of the book, " + body.items[i].searchInfo.textSnippet;
					}
				}

				book_details.description = book_details.title + description;
				

				list_of_books[i] = book_details;
			}

			list_of_books = list_of_books.filter(function(n){ return n != undefined }); 
			stringify(list_of_books);
			//console.log(list_of_books);

			eventCallback(list_of_books);
		}).on('err', function (e) {
        console.log("Got error: ", e);
    });

}

//call the Google Books api to get high level details onfor similar books from Amazon 
function getSimilarBooksJSON(related_items,eventCallback) {

	var list_of_books = [];
	var list_of_titles = [];
	var rank_count = 1;
	var completed_requests = 0;
	var getlength =  related_items.length

	if (related_items.length > 5){
		getlength = 5;
	}

	for (var i = 0,length = getlength; i < length; i++ ) {
	
		request.get({
			url: "https://www.googleapis.com/books/v1/volumes?q=" + related_items[i].ASIN +"&orderBy=relevance&key=APIKEY"
			}, function(err, response, body) {
				

			if (body){
				try{
					body = JSON.parse(body);
				}catch(e){
					var empty_array = [];
					eventCallback(empty_array);
					return;
				}
			}	

				//console.log(body)
				completed_requests++;
				var book_details={};
				var title;

				title = body.items[0].volumeInfo.title ;
				if (list_of_titles.indexOf(title)> 0) { 				
					return; 
				}

				if (typeof body.items[0].volumeInfo.authors=== 'undefined') { 				
					return; 
				}

				list_of_titles[i] = title;
				book_details.title = title;	
				book_details.titleupper = title.toUpperCase();

				var author_string = ""; 
				var author_array = body.items[0].volumeInfo.authors;
				
				for (var k = 0, klength = author_array.length; k < klength; k++){
					author_string = author_string + author_array[k] + " and " ;
				}

				author_string = author_string.slice(0, -5);
				book_details.author = author_string;				
				book_details.contributor = "by " + author_string;

				var isbns_string = "";
				var isbns_array = body.items[0].volumeInfo.industryIdentifiers;

				for (var j = 0, jlength = isbns_array.length; j < jlength; j++){
					if (isbns_array[j].type === 'ISBN_10'){
						book_details.primary_isbn10 = isbns_array[j].identifier;
						isbns_string = isbns_string + isbns_array[j].identifier + ',';
					}else{
						book_details.primary_isbn13 = isbns_array[j].identifier;
						isbns_string = isbns_string + isbns_array[j].identifier + ',';
					}							
				}
				isbns_string = isbns_string.slice(0, -1);
				book_details.isbns_string = isbns_string;

				var description = ". No description available.";
						
				if (typeof(body.items[0].searchInfo) !=='undefined'){
					if (typeof(body.items[0].searchInfo.textSnippet) !=='undefined'){
						description = ". Here's a brief description of the book, " + body.items[0].searchInfo.textSnippet;
					}
				}

				book_details.description = book_details.title + description;

				book_details.description = book_details.title + ", " + book_details.contributor + description;
					

				book_details.rank = rank_count;
				list_of_books[rank_count-1] = book_details;
				rank_count++;

				console.log("book details title:" + book_details.title);
				console.log("list of books count:" + list_of_books.length);

				console.log(completed_requests);
				console.log(getlength);
					if (completed_requests === getlength) {
						// All download done, process responses array
						stringify(list_of_books);

						eventCallback(list_of_books);
					}
			
			}).on('err', function (e) {
        	console.log("Got error: ", e);}
		
		
		);
	}

}

//call Goodreads API to get Edgar Award books
function getEdgarListJSON(shelf_name, year, category, eventCallback) {

	shelf_name = shelf_name.replace(' ','+');

	request.get({
		url: "https://www.goodreads.com/review/list/60491294.xml?key=APIKEY&v=2&order=a&shelf=" + shelf_name
		}, function(err, response, body) {	

			parseString(body, {explicitArray : false, ignoreAttrs : true }, function (err, result) {

				var list_of_books = [];

				 if (err) {
					eventCallback(list_of_books);
					return;
				}

				var list_of_books = [];
				var book_results = result.GoodreadsResponse.reviews.review;
				var rank_count = 1;
				var Edgar_Winners = ['9780062292438','9780802123459','9780525955078'];

				for (var i = 0,length = book_results.length; i < length; i++ ) {
					console.log(book_results[i].book.title);

					var book_details={};

					var title = book_results[i].book.title;
					book_details.title = title;
					book_details.titleupper = title.toUpperCase();

					if (typeof book_results[i].book.authors.author !== 'undefined'){
						book_details.author = book_results[i].book.authors.author.name;
					}else{
						book_details.author = book_results[i].book.authors.author[0].name;
					}

					book_details.contributor = "by " + book_details.author;
					
					book_details.rank = rank_count;
					rank_count++;

					book_details.primary_isbn10 = 'None';
					book_details.primary_isbn13 = 'None';

					if (typeof book_results[i].book.isbn !== 'undefined'){
						book_details.primary_isbn10 = book_results[i].book.isbn;
						if (book_details.primary_isbn10 === ''){book_details.primary_isbn10 = 'None;'}
					}
					if (typeof book_results[i].book.isbn13 !== 'undefined'){
						book_details.primary_isbn13 = book_results[i].book.isbn13;
						if (book_details.primary_isbn13 === ''){book_details.primary_isbn13 = 'None;'}
					}

					book_details.isbns_string = book_details.primary_isbn10 + "," +  book_details.primary_isbn13;

					if (Edgar_Winners.indexOf(book_details.primary_isbn13) >=0) { 
						book_details.contributor_alt = book_details.contributor + ". Note, this won the " + year + " award for " + category + ". ";
					}
				
					var description = "";

				
					if (typeof(book_results[i].book.description) !=='undefined'){
						description = striptags(book_results[i].book.description);		
						description = description.replace(/.<br><br>/gi,'. ');
						description = description.replace(/<br><br>/gi,'. ');
						description = description.replace(/<br>/gi,'. ');

					}else{
						description = " No Desciption available. ";
					}

					console.log(description);

					var wordcount = description.split(' ').length;

					console.log("word count:" + wordcount);

					if (wordcount > 100)  {
					 description = trimByWord(description);
					}

					book_details.description = book_details.title + ", " + book_details.contributor + ". Here's a brief description of the book, " + description;
					
					console.log(book_details.description );

					list_of_books[i] = book_details;

				}

				stringify(list_of_books);
				//console.log(list_of_books);

				eventCallback(list_of_books);
			

			});


		}).on('err', function (e) {
        console.log("Got error: ", e);
    });

}


//get Amazon details based on title and author
function getAmazonDetailsbyKeywords(title, author, eventCallback){
	console.log("in get Amazon by Keyword");
	opHelper.execute('ItemSearch', {
		'Title': title,
		'Author': author,
		//'Condition': 'All',
		'ResponseGroup': 'Large',
		//'IdType' : 'ISBN',
		'SearchIndex':'Books'
		}, function(error, results) {
			if (error) { console.log('Error: ' + error + "\n"); }

			//console.log("Results:\n" + util.inspect(results) + "\n\n");
						
			var amazon_details = {};
			var imageset;
			var ASIN;	
			var ISBN;
			var related_items = [];

			amazon_details.lgImage = 'https://s3.amazonaws.com/virtual-librarian/2000px-No_image_available.svg.png';
			amazon_details.smImage = 'https://s3.amazonaws.com/virtual-librarian/300px-No_image_available.svg.png';
			amazon_details.ASIN = 'None';	
			amazon_details.ISBN = 'None';
						
			//console.log("Results:\n" + util.inspect(results) + "\n");
			console.log(results.ItemSearchResponse.Items);
			//console.log(results.ItemSearchResponse.Items.Request);

			if (typeof(results.ItemSearchResponse.Items.Item) === 'undefined'){
				console.log('here')
				eventCallback(amazon_details);
				return;
			} 

			var key, count = 0;
				for(key in results.ItemSearchResponse.Items.Item) {
				if(results.ItemSearchResponse.Items.Item.hasOwnProperty(key)) {
					count++;
				//	console.log("key:" + key);
				//	console.log(isNumeric(key));
				}
			}
			
			if (isNumeric(key)){
				ASIN = results.ItemSearchResponse.Items.Item[0].ASIN;
				ISBN = results.ItemSearchResponse.Items.Item[0].ItemAttributes.ISBN;
				imageset = results.ItemSearchResponse.Items.Item[0].ImageSets.ImageSet;
				related_items = results.ItemSearchResponse.Items.Item[0].SimilarProducts.SimilarProduct;
				console.log("in num key");
				//console.log(results.ItemSearchResponse.Items.Item[0]);
				//console.log(results.ItemSearchResponse.Items.Item[0].SimilarProducts.SimilarProduct);
				//console.log(results.ItemSearchResponse.Items.Item[0].SimilarProducts.SimilarProduct);
				//console.log(related_items.length);
				
			}else{
				ASIN = results.ItemSearchResponse.Items.Item.ASIN;
				ISBN = results.ItemSearchResponse.Items.Item.ItemAttributes.ISBN;
				imageset = results.ItemSearchResponse.Items.Item.ImageSets.ImageSet;
				related_items = results.ItemSearchResponse.Items.Item.SimilarProducts.SimilarProduct;
				console.log("in not num key");
				//console.log(results.ItemSearchResponse.Items.Item);
				
			}

			var key, index=0, count = 0;
			for(key in imageset) {
				if(imageset.hasOwnProperty(key)) {
					//console.log(key);
					if (isNumeric(key)){
						if (imageset[key].$.Category === 'primary'){
							index = key;
							imageset = imageset[index];
						}
					}

					count++;

				}
			}

			if(typeof imageset.LargeImage !== 'undefined'){
				amazon_details.lgImage = imageset.LargeImage.URL;
				amazon_details.smImage = imageset.LargeImage.URL;
				//console.log("in large");
			}

			if(typeof imageset.HiResImage !== 'undefined'){
				amazon_details.lgImage = imageset.HiResImage.URL;
				//console.log("in hi-res");
			}

			var correct_image = 'https://images-na.ssl-images-amazon.com';
			var incorrect_image = 'http://ecx.images-amazon.com';
			amazon_details.lgImage = amazon_details.lgImage.replace(incorrect_image,correct_image);
			amazon_details.smImage = amazon_details.smImage.replace(incorrect_image,correct_image);
			amazon_details.ASIN = ASIN;
			amazon_details.ISBN = ISBN;
			amazon_details.related_items = related_items;

			console.log(amazon_details);
						
			eventCallback(amazon_details);

	});
}

//get Amazon details based on title and author
function addToShelfDB(userID, savedate, title, author, contributor, isbn, isbns_string, getTime, eventCallback) {
	
	var docClient = new AWS.DynamoDB.DocumentClient();

	var table = "Virtial_Librarian_Shelves";

	var params = {
		TableName:table,
		Item:{
			"UserId": userID,
			"RecordDate": savedate,
			"Title": title,
			"Author": author,
			"Contributor": contributor,
			"ISBN": isbn,
			"ISBN_Str":isbns_string,
			"DateOrder" : getTime
		}
	};

	docClient.put(params, function(err, data) {

		if (err) {
			console.log(err);
			console.log(err.stack);
			return;
		} else{
			console.log(data);
			eventCallback(data);
			
		}
		
		
	});

	
}

//remove a book from the user's shelf
function removeFromShelfDB(userID,isbn,eventCallback) {
	
	var docClient = new AWS.DynamoDB.DocumentClient();

	var table = "Virtial_Librarian_Shelves";

	var params = {
		TableName:table,
		Key:{
			"UserId": userID,
			"ISBN": isbn
		}
	};

	docClient.delete(params, function(err, data) {

		if (err) {
			console.log(err);
			console.log(err.stack);
			return;
		} else{
			console.log(data);
			eventCallback(data);
			
		}
		
		
	});

	
}

//add a book to the users shelf
function getSavedBooksJSON(userID, eventCallback){
	
	var docClient = new AWS.DynamoDB.DocumentClient();

	var list_of_books = [];
	
	var params = {
		TableName: "Virtial_Librarian_Shelves",
		KeyConditionExpression: "UserId = :userID",
		ExpressionAttributeValues: {
			":userID": userID
		},
		ScanIndexForward: false
	};

	docClient.query(params, function(err, data) {
		if (err)
			console.log(JSON.stringify(err, null, 2));
		else
			var recordcount = data.Items.length;
			var i = 0;

			if (recordcount>0){
				data.Items.forEach(function(item) {
					var book_details={};

					var title = item.Title;
					book_details.title = title;
					book_details.titleupper = title.toUpperCase();
					book_details.author = item.Author;
					book_details.contributor = item.Contributor
					book_details.rank = i+1;
					book_details.primary_isbn10 = 'None';
					book_details.primary_isbn13 = item.ISBN;
					book_details.isbns_string = item.ISBN_Str;

					var description = "was added to your virtual bookshelf on " + item.RecordDate;
	

					book_details.description = book_details.title + ", " + book_details.contributor + ", " + description;

					list_of_books[i] = book_details;
					i++;

				});

				
			}
			console.log(list_of_books);
			stringify(list_of_books);
			eventCallback(list_of_books);
	});
	
	
}


/**********************************************************************************
 *  ADMINISTRATIVE & HELPER FUNCTIONS
 */

//counts number of times a user has used the skill
function handleUserSessionCount(session, eventCallback){

	console.log('now I am here');

	var userID = session.user.userId;
	var date = new Date();
	var DateString = date.getFullYear() + "/" + monthNums[date.getMonth()] + "/" + date.getDate();
	var standardizeDate = new Date (date.getFullYear(), date.getMonth(), date.getDate());
	var getTime = standardizeDate.getTime();
	
	var docClient = new AWS.DynamoDB.DocumentClient();

	console.log("userid: " + userID);

	var params = {
		TableName: "Virtial_Librarian_Users",
		KeyConditionExpression: "UserId = :userID",
		ExpressionAttributeValues: {
			":userID": userID
		},
		ScanIndexForward: false
	};

	docClient.query(params, function(err, data) {
		if (err){
			console.log(JSON.stringify(err, null, 2));
		}else
			console.log('now I am here 2');
			var recordcount = data.Items.length;
			var i = 0;

			console.log('recondcount: ' + recordcount);

			if (recordcount<1){

				params = {
					TableName:"Virtial_Librarian_Users",
					Item:{
						"UserId": userID,
						"RecordDate": getTime,
						"SessionCount": 0,
					}
				};

				docClient.put(params, function(err, data) {

					if (err) {
						console.log(err);
						console.log(err.stack);
						return;
					} else{
						console.log(data);
						eventCallback(0);
					}
				});

			}else{
				var count;
				data.Items.forEach(function(item) {
					count = item.SessionCount
				});

				params = {
					TableName: "Virtial_Librarian_Users",
					Key:{
						"UserId": userID
					},
					UpdateExpression: 'SET SessionCount = SessionCount + :incr',			
					ExpressionAttributeValues: { 
						":incr": 1
					},
					ReturnValues: "UPDATED_NEW"
					};

				docClient = new AWS.DynamoDB.DocumentClient();

				docClient.update(params, function(err, data) {
					if (err) console.log(err);
					else eventCallback(count);
				});



			}

	});
	
}

//determines if a value is a number
function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

//trims a long piece of text to a shorter number of words
function trimByWord(sentence) {
	var numberOfWords = 100;
    var result = sentence;
    var resultArray = result.split(" ");
    if(resultArray.length > numberOfWords){
		resultArray = resultArray.slice(0, numberOfWords);
		result = resultArray.join(" ");
		var n = result.lastIndexOf(".")
		result = "truncated for brevity. " + result.substring(0, n)+ ".";
    }
    return result;
}

// Create the handler that responds to the Alexa Request.
exports.handler = function (event, context) {
    // Create an instance of the HistoryBuff Skill.
    var skill = new Librarian();
    skill.execute(event, context);
};





