/*
Jive Pebble Inbox App
Written by Rashed Talukder
Copyright 2016 Jive Software, Inc.
v0.9

Description:
This app shows Jive action items and allows you to respond to action activities from a Pebble Watch that supports Pebble.Js
*/

var UI = require('ui');
var ajax = require('ajax');

// Self hosted config pages provided by the Clay API
var Clay = require('clay');
var clayConfig = require('config');
var clay = new Clay(clayConfig);

// Jive Credentials need to be base64 encoded and there's no pre-built base64 library in Pebble.js
var base64 = require('base64');



// JSON of the types of Action Captions and associated images
// These are being defined, but can also include general cases if you wanted to
var captionImages = require('captionImages');



// Key mapping for the config to pass from the phone to the watch and vice-versa
var keys = {
  JIVEURL : 0,
  USERNAME : 1,
  PASSWORD : 2
};



// Initiate the main view UI card
// Display after the watch sents the ready event to the phone
var card = new UI.Card({
  icon: 'images/jive_logo.png',
  title: ' Actions'
});



// Handle the config view closing on the phone and data being persisted
Pebble.addEventListener('webviewclosed', function(e) {
  var dict = clay.getSettings(e.response);
  if(e.response && dict.USERNAME && dict.PASSWORD && dict.JIVEURL){
    localStorage.setItem(keys.JIVEURL, dict.JIVEURL);
    localStorage.setItem(keys.USERNAME, dict.USERNAME);
    localStorage.setItem(keys.PASSWORD, dict.PASSWORD);
  }
});

// Working backwards just like we're in C!



// Sends the action response to Jive that corresponds to the selected action
// item after respective button is pressed.
// All requests must be a POST request to the /actions/{actionID}/actions/{caption
// endpoint. Jive handles the "target" request.
// On success, the action view card is removed from memory and replaced
// On error, a new card is created and the user is then taken back to the action
// view card.
function sendAction(URL, actionCaption, actCard, actionMenu){
  var username = localStorage.getItem(keys.USERNAME);
  var password = localStorage.getItem(keys.PASSWORD);
  
  console.log(URL + "/actions/" + actionCaption);
  ajax(
    {
      url: URL + "/actions/" + actionCaption,
      method: "POST",
      type: 'json',
      headers: {
      "Authorization" : "Basic " + base64.encode(username + ":" + password)
      } 
    },
    function(data, status, request) {
      console.log(status);
      console.log(JSON.stringify(data));
      actCard.hide();
      actCard = new UI.Card({
        icon : "images/j.png",
        title : " Message Sent!"
      });
      actCard.show();
      setTimeout(function(){
        actCard.hide();
        actionMenu.hide();
      },2500);
      init();
    },
    function(error, status, request) {
        var errorCard = new UI.Card ({
          icon : "images/j.png",
          title : " Error: " + status,
          body : JSON.stringify(error)
        });
        errorCard.show();
        setTimeout(function(){
          errorCard.hide();
        },2500);
      return;
    }
  );
}



// TO DO: Clean this function up and make it nicer
// Function parses through the sorted list of actions to be displayed.
// Creates a Pebble Menu from the list and associated "select" button press.
// Selecting a action item from the menu opens up a card that the user can view more
// details. 
// The corresponding icons for the actions are retrieved from the captionImages JSON.
// A button press triggers an action according to the available actionLinks from th
// Jive action activity.
function displayActions(sortedList){
  var menuList = sortedList.map(function(obj){
    return {title: obj.displayName, subtitle: obj.content}; 
  });
  card.hide();
  var menu = new UI.Menu({
      backgroundColor: 'white',
      textColor: 'black',
      highlightBackgroundColor: 'black',
      highlightTextColor: 'white',
      sections: [{
        title: 'Jive Actions'
      }]
  });
  menu.items(0, menuList);
  menu.show();
  var actionCard = new UI.Card({});
  
  menu.on('select',function(e){
    var actionItem = sortedList[e.itemIndex];
    var cardTitle = (actionItem.content.length > 19) ? (actionItem.content.substring(0,16) + "...") : actionItem.content;
    var actions = {};
    var buttonCaption = [];
    var i = 0;
    
    while(i < actionItem.actionLinks.length){
      for(var j = 0; j < captionImages.length; j++){
        if(actionItem.actionLinks[i].caption === captionImages[j].caption){
          var button = captionImages[j].button;
          var image = captionImages[j].image;
          actions[button] = image;
          buttonCaption[buttonCaption.length]= {
            button : button,
            caption : actionItem.actionLinks[i].caption
          };
        }
      }
      i++;
    }
    actionCard.title(cardTitle);
    actionCard.body(sortedList[e.itemIndex].actionTitle);
    actionCard.action(actions);
    actionCard.show();
    
  buttonCaption.forEach(function(element){
    // Handle actionCard window button click events
    actionCard.on('click', element.button, function(event) {
      var caption = element.caption;
      var url = sortedList[e.itemIndex].actionURL;
      sendAction(url, caption, actionCard, menu);
    });
  });
    
  });
}



// After actions are retrieved from Jive, we can sort out the types of Jive
// verbs we want to display on the watch.
// In this scenario, we are only subscribing to 3 different types:
// userRelationshipNotification, joinSocialGroupApproval, and action activties
// created from posting the object to the /activities/ endpoint.
// NOTE: Due to the count param not returning only 10 items currently, we are
// manually limiting the items to 10.
function sortActions(payload){
  var itemsList = [];
  
  for(var i = 0; i < 10; i++){
    if(payload[i].verb === "http://activitystrea.ms/schema/1.0/post"){
      itemsList[itemsList.length] = {
        displayName : payload[i].actor.displayName,
        content : payload[i].content,
        actionTitle : payload[i].title,
        actionLinks : payload[i].openSocial.actionLinks,
        actionURL : payload[i].id
      };
    } else if (payload[i].verb === "jive:notification:userRelationshipNotification"){
      itemsList[itemsList.length] = {
        actionTitle : payload[i].title,
        content : payload[i].content
      };
    } else if (payload[i].verb === "jive:action:joinSocialGroupApproval"){
      console.log(JSON.stringify(payload[i]));
      itemsList[itemsList.length] = {
        displayName : "Jive Group Invite",
        actionTitle : "Join Jive Group?",
        actionLinks : payload[i].openSocial.actionLinks,
        content : payload[i].object.displayName,
        actionURL : payload[i].id
      };
    } else if (payload[i].verb === "jive:notification:playboxFeatureNotification"){
      // Do nothing for playbox notifications
    } // Can keep going for all the different verbs for notifications
  }
  displayActions(itemsList);
}



// Takes the stored Jive Instance URL, username, password and performs
// a basic auth GET request to the /actions/ endpoint.
// A success is 200 and the payload is sent to sortActions to be filtered
// NOTE: Currently the "count" parameter is not functional as of 02/26/16
function fetchActionItems(url, user, pass){
  ajax({ 
    url: 'https://' + url + '/api/core/v3/actions?count=10', 
    type: 'json', 
    headers: {
      "Authorization" : "Basic " + base64.encode(user + ":" + pass)
    } 
  },function(data, status) {
    if(status === 200){
      sortActions(data.list);
    }else {
      card.body("Status: " + status + "\nData: " + JSON.stringify(data));
      card.scrollable(true);
    }
  }, function(error, status){
    if(status === 401){
      card.body("Please check your login credentials");
      return;
    }
    console.log(status);
    card.body("Status: " + status + "\nError: " + JSON.stringify(error));
    card.scrollable(true);
  });
}


// Displays a notificaiton to login
function promptLogin(){
  card.body("Please login to Jive in the Pebble app config settings and then restart the app on Pebble watch");
  card.show();
}


// When a user is logged in, it shows the corresponding card to the user
// and fetches the actions from Jive using the provided credentials
function loggedIn(url, user, pass){
  // Opening screen
  card.body("Fetching actions");
  card.show();
  
  fetchActionItems(url, user, pass);
}


// Retrieve stored values from Pebble's memory.
// If they don't exist, prompt the user to login on the config screen.
function init(){
  var url = localStorage.getItem(keys.JIVEURL);
  var username = localStorage.getItem(keys.USERNAME);
  var password = localStorage.getItem(keys.PASSWORD);
  (username && password && url) ? loggedIn(url, username, password) : promptLogin();
}

init();